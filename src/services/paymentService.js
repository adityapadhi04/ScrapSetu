/**
 * ScrapSetu — Payment Service (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Records payment information for completed scrap transactions.
 * Supports Cash, UPI, Bank Transfer, Other methods, and Cashfree Gateway.
 *
 * Persisted in localStorage under STORAGE_KEY_PAYMENTS ("scrapsetu_payments").
 * Sequential IDs: PAY-0001, PAY-0002, etc.
 *
 * ════════════════════════════════════════════════
 * Cashfree Sandbox Integration (Module 15)
 * ════════════════════════════════════════════════
 * Payments via Cashfree Sandbox are verified by the backend.
 * Frontend NEVER self-declares a payment as VERIFIED.
 * CASHFREE_CLIENT_SECRET is only in the backend .env.
 *
 * Payment statuses:
 *   recorded   — legacy demo / manual record
 *   pending    — Cashfree order created, awaiting payment
 *   verified   — Backend confirmed with Cashfree (ONLY backend sets this)
 *   failed     — Payment failed at Cashfree
 *   cancelled  — User cancelled checkout
 * ════════════════════════════════════════════════
 */

import { SEED_PAYMENTS } from '../data/paymentSeedData.js';
import { _patchTransactionFields, checkAndCompleteTransaction } from './transactionService.js';
import { enqueue } from './syncQueueService.js';

export const STORAGE_KEY_PAYMENTS = 'scrapsetu_payments';

export const VALID_PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other', 'Cashfree'];
export const VALID_PAYMENT_STATUSES = ['recorded', 'pending', 'verified', 'failed', 'cancelled'];

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
  // paymentMethod is optional for Cashfree-initiated payments (set later)
  if (data.paymentMethod && !VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
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

    paymentMethod: data.paymentMethod || 'Cashfree',

    paymentStatus: data.paymentStatus || 'recorded',

    // Cashfree-specific fields (populated after gateway verification)
    cfOrderId: data.cfOrderId || null,
    cfPaymentId: data.cfPaymentId || null,
    verifiedAt: data.verifiedAt || null,
    failureReason: data.failureReason || null,

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
      paymentStatus: newPayment.paymentStatus,
      paymentMethod: newPayment.paymentMethod,
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
// Cashfree Payment Update (post-verification)
// ─────────────────────────────────────────────

/**
 * Update or create a payment record with Cashfree verification data.
 * Called by cashfreePaymentService after backend confirms payment.
 *
 * SECURITY: Only the backend sets payment_status=verified.
 * This function persists that backend truth into localStorage.
 *
 * @param {object} data - {paymentId, transactionId, collectorId, buyerId,
 *                         buyerRole, amount, paymentStatus, cfOrderId,
 *                         cfPaymentId, verifiedAt}
 */
export const updatePaymentWithCashfree = (data) => {
  const payments = getPayments();
  const now = new Date().toISOString();

  // Find existing record for this transaction
  const existingIndex = payments.findIndex(
    (p) => p.transactionId === data.transactionId && p.paymentStatus !== 'failed'
  );

  if (existingIndex !== -1) {
    // Update existing record
    payments[existingIndex] = {
      ...payments[existingIndex],
      paymentStatus: data.paymentStatus,
      cfOrderId: data.cfOrderId || payments[existingIndex].cfOrderId,
      cfPaymentId: data.cfPaymentId || payments[existingIndex].cfPaymentId,
      verifiedAt: data.verifiedAt || payments[existingIndex].verifiedAt,
      failureReason: data.failureReason || null,
      updatedAt: now,
    };
    savePayments(payments);
    return payments[existingIndex];
  }

  // No existing record — create new one
  const paymentId = data.paymentId || generateNextPaymentId(payments);
  const newPayment = {
    paymentId,
    transactionId: data.transactionId,
    collectorId: data.collectorId || '',
    buyerId: data.buyerId || '',
    buyerRole: data.buyerRole || '',
    amount: parseFloat(data.amount) || 0,
    currency: 'INR',
    paymentMethod: 'Cashfree',
    paymentStatus: data.paymentStatus,
    cfOrderId: data.cfOrderId || null,
    cfPaymentId: data.cfPaymentId || null,
    verifiedAt: data.verifiedAt || null,
    failureReason: data.failureReason || null,
    referenceNote: 'Cashfree Sandbox payment',
    paidAt: data.verifiedAt || now,
    recordedBy: data.collectorId || 'system',
    sourceType: 'cashfree_gateway',
    createdAt: now,
    updatedAt: now,
    version: '1.0',
  };
  payments.push(newPayment);
  savePayments(payments);
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
  const completedPayments = payments.filter(
    (p) => p.paymentStatus === 'recorded' || p.paymentStatus === 'verified'
  );
  const totalValue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  return {
    total: payments.length,
    recorded: payments.filter((p) => p.paymentStatus === 'recorded').length,
    verified: payments.filter((p) => p.paymentStatus === 'verified').length,
    pending: payments.filter((p) => p.paymentStatus === 'pending').length,
    failed: payments.filter((p) => p.paymentStatus === 'failed').length,
    cancelled: payments.filter((p) => p.paymentStatus === 'cancelled').length,
    totalValue,
    byCashCount: payments.filter((p) => p.paymentMethod === 'Cash').length,
    byUPICount: payments.filter((p) => p.paymentMethod === 'UPI').length,
    byBankTransferCount: payments.filter((p) => p.paymentMethod === 'Bank Transfer').length,
    byCashfreeCount: payments.filter((p) => p.paymentMethod === 'Cashfree').length,
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
