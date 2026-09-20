/**
 * ScrapSetu — Payment Service (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Records payment information for completed scrap transactions.
 * Supports Cash, UPI, Bank Transfer, and Other methods.
 *
 * Persisted in localStorage under STORAGE_KEY_PAYMENTS ("scrapsetu_payments").
 * Sequential IDs: PAY-0001, PAY-0002, etc.
 *
 * ════════════════════════════════════════════════
 * ⚠️  CRITICAL PROTOTYPE DISCLAIMER  ⚠️
 * ════════════════════════════════════════════════
 * This service records payment information ONLY for prototype
 * traceability and governance purposes.
 *
 * NO real payment gateway is connected.
 * NO Razorpay, Stripe, PayPal, UPI API, or bank API is integrated.
 * NO actual money movement or settlement occurs.
 * "UPI" records only the payment method label — no real UPI verification.
 *
 * "Demo payment record — not real payment processing."
 * ════════════════════════════════════════════════
 */

import { SEED_PAYMENTS } from '../data/paymentSeedData.js';
import { _patchTransactionFields, checkAndCompleteTransaction } from './transactionService.js';
import { enqueue } from './syncQueueService.js';

export const STORAGE_KEY_PAYMENTS = 'scrapsetu_payments';

export const VALID_PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];
export const VALID_PAYMENT_STATUSES = ['recorded', 'failed'];

// ─────────────────────────────────────────────
// Storage Initialization
// ─────────────────────────────────────────────

export const initializePayments = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_PAYMENTS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(SEED_PAYMENTS));
      return [...SEED_PAYMENTS];
    }
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? parsed : [...SEED_PAYMENTS];
  } catch (err) {
    console.error('Error initializing scrapsetu_payments:', err);
    return [...SEED_PAYMENTS];
  }
};

export const getPayments = () => initializePayments();

const savePayments = (payments) => {
  try {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  } catch (err) {
    console.error('Error saving scrapsetu_payments:', err);
  }
};

// ─────────────────────────────────────────────
// ID Generation
// ─────────────────────────────────────────────

export const generateNextPaymentId = (existingPayments = null) => {
  const list = existingPayments || getPayments();
  let highestNum = 0;
  for (const p of list) {
    if (p.paymentId && typeof p.paymentId === 'string') {
      const match = p.paymentId.match(/^PAY-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  }
  return `PAY-${String(highestNum + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Schema Validation
// ─────────────────────────────────────────────

export const validatePayment = (data) => {
  const errors = [];

  if (!data.transactionId || typeof data.transactionId !== 'string') {
    errors.push('transactionId is required');
  }
  if (!data.collectorId || typeof data.collectorId !== 'string') {
    errors.push('collectorId is required');
  }
  if (!data.buyerId || typeof data.buyerId !== 'string') {
    errors.push('buyerId is required');
  }
  if (!data.paymentMethod || !VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`);
  }
  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('amount must be a positive number');
  }

  return { valid: errors.length === 0, errors };
};

// ─────────────────────────────────────────────
// Create Payment Record
// ─────────────────────────────────────────────

/**
 * Record a payment for a transaction.
 * Only ONE payment record is allowed per active transaction.
 *
 * ⚠️ This does NOT process any real money.
 * This is a DEMO RECORD for prototype traceability only.
 */
export const createPaymentRecord = (data) => {
  const validation = validatePayment(data);
  if (!validation.valid) {
    throw new Error(`Payment validation failed: ${validation.errors.join('; ')}`);
  }

  const payments = getPayments();

  // Prevent duplicate payment for the same transaction
  const duplicate = payments.find(
    (p) => p.transactionId === data.transactionId && p.paymentStatus !== 'failed'
  );
  if (duplicate) {
    throw new Error(
      `Payment record already exists for transaction ${data.transactionId}: ${duplicate.paymentId}`
    );
  }

  const paymentId = data.paymentId || generateNextPaymentId(payments);
  const now = new Date().toISOString();

  const newPayment = {
    paymentId,
    transactionId: data.transactionId,

    collectorId: data.collectorId,
    buyerId: data.buyerId,
    buyerRole: data.buyerRole || '',

    amount: parseFloat(data.amount),
    currency: data.currency || 'INR',

    paymentMethod: data.paymentMethod,

    paymentStatus: 'recorded',

    referenceNote: (data.referenceNote || '').trim(),

    paidAt: data.paidAt || now,

    recordedBy: data.recordedBy || data.collectorId,

    sourceType: data.sourceType || 'platform_generated',

    createdAt: data.createdAt || now,
    updatedAt: now,

    version: '1.0'
  };

  payments.push(newPayment);
  savePayments(payments);

  // Update the parent transaction paymentStatus and paymentDate
  try {
    _patchTransactionFields(data.transactionId, {
      paymentStatus: 'recorded',
      paymentMethod: data.paymentMethod,
      paymentDate: now
    });
    checkAndCompleteTransaction(data.transactionId);
  } catch (err) {
    // Non-fatal
  }

  // Queue for sync — only platform_generated payment records
  // IMPORTANT: Do NOT claim this is a real payment verification.
  if (newPayment.sourceType !== 'demo_seed') {
    try {
      enqueue({
        operation: 'create',
        entityType: 'payment',
        entityId: newPayment.paymentId,
        payload: { paymentId: newPayment.paymentId, transactionId: newPayment.transactionId, status: newPayment.paymentStatus },
        userId: newPayment.collectorId,
      });
    } catch (qErr) {
      console.warn('[paymentService] Could not enqueue sync operation:', qErr.message);
    }
  }

  return newPayment;
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export const getPaymentById = (paymentId) => {
  const payments = getPayments();
  return payments.find((p) => p.paymentId === paymentId) || null;
};

export const getPaymentsByTransaction = (transactionId) => {
  const payments = getPayments();
  return payments.filter((p) => p.transactionId === transactionId);
};

export const getPaymentsByCollector = (collectorId) => {
  const payments = getPayments();
  return payments.filter((p) => p.collectorId === collectorId);
};

export const getPaymentsByBuyer = (buyerId) => {
  const payments = getPayments();
  return payments.filter((p) => p.buyerId === buyerId);
};

// ─────────────────────────────────────────────
// Stats for Admin
// ─────────────────────────────────────────────

export const getPaymentStats = () => {
  const payments = getPayments();
  const totalValue = payments
    .filter((p) => p.paymentStatus === 'recorded')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  return {
    total: payments.length,
    recorded: payments.filter((p) => p.paymentStatus === 'recorded').length,
    failed: payments.filter((p) => p.paymentStatus === 'failed').length,
    totalValue,
    byCashCount: payments.filter((p) => p.paymentMethod === 'Cash').length,
    byUPICount: payments.filter((p) => p.paymentMethod === 'UPI').length,
    byBankTransferCount: payments.filter((p) => p.paymentMethod === 'Bank Transfer').length
  };
};

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

export const resetPaymentDataset = () => {
  try {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(SEED_PAYMENTS));
    return [...SEED_PAYMENTS];
  } catch (err) {
    console.error('Error resetting payment dataset:', err);
    return [...SEED_PAYMENTS];
  }
};
