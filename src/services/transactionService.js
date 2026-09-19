/**
 * ScrapSetu — Transaction Service (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Manages the complete transaction lifecycle after a Collector accepts an Offer:
 *   Offer Accepted → Transaction Created → Handover Pending → Handover Confirmed
 *   → Payment Recorded → Completed
 *
 * Persisted in localStorage under STORAGE_KEY_TRANSACTIONS ("scrapsetu_transactions").
 * Sequential IDs: TXN-0001, TXN-0002, etc.
 *
 * PROTOTYPE DISCLAIMER:
 * This service records transaction information for traceability and governance.
 * NO real payment, bank settlement, UPI verification, or financial transfer occurs.
 * "completed" status means all demo records are confirmed — not that money has cleared.
 */

import { SEED_TRANSACTIONS } from '../data/transactionSeedData.js';
import { updateScrapLotTransactionStatus } from './scrapLotService.js';

export const STORAGE_KEY_TRANSACTIONS = 'scrapsetu_transactions';

export const VALID_TRANSACTION_STATUSES = [
  'created',
  'handover_pending',
  'handover_confirmed',
  'payment_pending',
  'payment_recorded',
  'completed',
  'cancelled'
];

export const VALID_PAYMENT_STATUSES = ['pending', 'recorded', 'failed'];
export const VALID_HANDOVER_STATUSES = ['pending', 'collector_confirmed', 'confirmed', 'disputed'];
export const VALID_PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

// ─────────────────────────────────────────────
// Storage Initialization
// ─────────────────────────────────────────────

export const initializeTransactions = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
      return [...SEED_TRANSACTIONS];
    }
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? parsed : [...SEED_TRANSACTIONS];
  } catch (err) {
    console.error('Error initializing scrapsetu_transactions:', err);
    return [...SEED_TRANSACTIONS];
  }
};

export const getTransactions = () => initializeTransactions();

const saveTransactions = (transactions) => {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving scrapsetu_transactions:', err);
  }
};

// ─────────────────────────────────────────────
// ID Generation
// ─────────────────────────────────────────────

export const generateNextTransactionId = (existingTransactions = null) => {
  const list = existingTransactions || getTransactions();
  let highestNum = 0;
  for (const tx of list) {
    if (tx.transactionId && typeof tx.transactionId === 'string') {
      const match = tx.transactionId.match(/^TXN-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  }
  return `TXN-${String(highestNum + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Schema Validation
// ─────────────────────────────────────────────

export const validateTransaction = (data) => {
  const errors = [];

  if (!data.offerId || typeof data.offerId !== 'string') {
    errors.push('offerId is required and must be a string');
  }
  if (!data.lotId || typeof data.lotId !== 'string') {
    errors.push('lotId is required and must be a string');
  }
  if (!data.collectorId || typeof data.collectorId !== 'string') {
    errors.push('collectorId is required and must be a string');
  }
  if (!data.buyerId || typeof data.buyerId !== 'string') {
    errors.push('buyerId is required and must be a string');
  }
  if (!data.buyerRole || !['repair', 'recycler'].includes(data.buyerRole)) {
    errors.push('buyerRole must be repair or recycler');
  }
  if (!data.buyerName || !data.buyerName.trim()) {
    errors.push('buyerName is required');
  }
  if (!data.materialCategory || typeof data.materialCategory !== 'string') {
    errors.push('materialCategory is required');
  }
  const weight = parseFloat(data.weight);
  if (isNaN(weight) || weight <= 0) {
    errors.push('weight must be a positive number');
  }
  const price = parseFloat(data.agreedPrice);
  if (isNaN(price) || price <= 0) {
    errors.push('agreedPrice must be a positive number');
  }

  return { valid: errors.length === 0, errors };
};

// ─────────────────────────────────────────────
// Create Transaction
// ─────────────────────────────────────────────

/**
 * Create a new transaction from an accepted offer.
 * Prevents duplicate creation — one accepted offer may have at most ONE active transaction.
 */
export const createTransaction = (data) => {
  const validation = validateTransaction(data);
  if (!validation.valid) {
    throw new Error(`Transaction validation failed: ${validation.errors.join('; ')}`);
  }

  const transactions = getTransactions();

  // Prevent duplicate transaction for the same accepted offer
  const duplicate = transactions.find(
    (tx) => tx.offerId === data.offerId && tx.transactionStatus !== 'cancelled'
  );
  if (duplicate) {
    throw new Error(
      `Transaction already exists for offer ${data.offerId}: ${duplicate.transactionId}`
    );
  }

  const transactionId = data.transactionId || generateNextTransactionId(transactions);
  const now = new Date().toISOString();

  const weight = parseFloat(data.weight);
  const agreedPrice = parseFloat(data.agreedPrice);
  const totalAmount = data.totalAmount || Math.round(weight * agreedPrice);

  const newTransaction = {
    transactionId,
    offerId: data.offerId,
    lotId: data.lotId,

    collectorId: data.collectorId,
    collectorName: (data.collectorName || '').trim() || 'Collector',

    buyerId: data.buyerId,
    buyerRole: data.buyerRole,
    buyerName: (data.buyerName || '').trim(),

    materialCategory: data.materialCategory,
    materialSubcategory: data.materialSubcategory || '',

    weight,
    weightUnit: data.weightUnit || 'kg',

    agreedPrice,
    priceUnit: data.priceUnit || 'kg',
    totalAmount,

    currency: data.currency || 'INR',

    transactionStatus: 'created',

    paymentStatus: 'pending',
    paymentMethod: null,

    handoverStatus: 'pending',

    handoverDate: null,
    paymentDate: null,

    notes: (data.notes || '').trim(),

    sourceType: data.sourceType || 'platform_generated',

    createdAt: data.createdAt || now,
    updatedAt: now,
    datasetVersion: '1.0'
  };

  transactions.push(newTransaction);
  saveTransactions(transactions);

  try {
    if (data.lotId) {
      updateScrapLotTransactionStatus(data.lotId, 'created');
    }
  } catch (e) {
    // Non-fatal if lot service is in isolation
  }

  return newTransaction;
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export const getTransactionById = (transactionId) => {
  const transactions = getTransactions();
  return transactions.find((tx) => tx.transactionId === transactionId) || null;
};

export const getTransactionsByCollector = (collectorId) => {
  if (!collectorId) return [];
  const transactions = getTransactions();
  return transactions.filter((tx) => tx.collectorId === collectorId);
};

export const getTransactionsByBuyer = (buyerId) => {
  if (!buyerId) return [];
  const transactions = getTransactions();
  return transactions.filter((tx) => tx.buyerId === buyerId);
};

export const getTransactionsByLot = (lotId) => {
  if (!lotId) return [];
  const transactions = getTransactions();
  return transactions.filter((tx) => tx.lotId === lotId);
};

export const getTransactionByOffer = (offerId) => {
  if (!offerId) return null;
  const transactions = getTransactions();
  return transactions.find((tx) => tx.offerId === offerId && tx.transactionStatus !== 'cancelled') || null;
};

// ─────────────────────────────────────────────
// Status Updates
// ─────────────────────────────────────────────

export const updateTransactionStatus = (transactionId, newStatus) => {
  if (!VALID_TRANSACTION_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid transaction status: ${newStatus}`);
  }
  const transactions = getTransactions();
  const index = transactions.findIndex((tx) => tx.transactionId === transactionId);
  if (index === -1) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }
  transactions[index] = {
    ...transactions[index],
    transactionStatus: newStatus,
    updatedAt: new Date().toISOString()
  };
  saveTransactions(transactions);

  try {
    if (transactions[index].lotId) {
      updateScrapLotTransactionStatus(transactions[index].lotId, newStatus);
    }
  } catch (e) {
    // Non-fatal
  }

  return transactions[index];
};

/**
 * Internal update used by handoverService and paymentService to push partial status fields.
 * Not exported as public API — call checkAndCompleteTransaction after updating.
 */
export const _patchTransactionFields = (transactionId, patch) => {
  const transactions = getTransactions();
  const index = transactions.findIndex((tx) => tx.transactionId === transactionId);
  if (index === -1) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }
  transactions[index] = {
    ...transactions[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  saveTransactions(transactions);
  return transactions[index];
};

/**
 * Check if both handover and payment are complete for a transaction.
 * If so, automatically advance transactionStatus to 'completed'.
 */
export const checkAndCompleteTransaction = (transactionId) => {
  const tx = getTransactionById(transactionId);
  if (!tx) return null;

  if (tx.handoverStatus === 'confirmed' && tx.paymentStatus === 'recorded') {
    const updated = _patchTransactionFields(transactionId, { transactionStatus: 'completed' });
    try {
      if (tx.lotId) updateScrapLotTransactionStatus(tx.lotId, 'completed');
    } catch (e) {}
    return updated;
  }

  // Keep partial intermediate statuses informative
  if (tx.handoverStatus === 'confirmed' && tx.paymentStatus !== 'recorded') {
    if (tx.transactionStatus === 'handover_pending' || tx.transactionStatus === 'created') {
      const updated = _patchTransactionFields(transactionId, { transactionStatus: 'payment_pending' });
      try {
        if (tx.lotId) updateScrapLotTransactionStatus(tx.lotId, 'payment_pending');
      } catch (e) {}
      return updated;
    }
  }

  if (tx.paymentStatus === 'recorded' && tx.handoverStatus !== 'confirmed') {
    if (tx.transactionStatus !== 'handover_pending') {
      const updated = _patchTransactionFields(transactionId, { transactionStatus: 'handover_pending' });
      try {
        if (tx.lotId) updateScrapLotTransactionStatus(tx.lotId, 'handover_pending');
      } catch (e) {}
      return updated;
    }
  }

  return tx;
};

// ─────────────────────────────────────────────
// Stats for Admin
// ─────────────────────────────────────────────

export const getTransactionStats = () => {
  const transactions = getTransactions();
  const total = transactions.length;
  const completed = transactions.filter((tx) => tx.transactionStatus === 'completed').length;
  const handoverPending = transactions.filter((tx) => tx.handoverStatus === 'pending').length;
  const paymentPending = transactions.filter((tx) => tx.paymentStatus === 'pending').length;
  const totalRecordedValue = transactions
    .filter((tx) => tx.paymentStatus === 'recorded')
    .reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const cancelled = transactions.filter((tx) => tx.transactionStatus === 'cancelled').length;

  return {
    total,
    completed,
    handoverPending,
    paymentPending,
    totalRecordedValue,
    cancelled
  };
};

// ─────────────────────────────────────────────
// Earnings helpers for Collector
// ─────────────────────────────────────────────

export const getCollectorEarnings = (collectorId) => {
  const myTransactions = getTransactionsByCollector(collectorId);
  const recorded = myTransactions.filter((tx) => tx.paymentStatus === 'recorded');
  const pending = myTransactions.filter(
    (tx) => tx.paymentStatus === 'pending' && tx.transactionStatus !== 'cancelled'
  );
  const totalRecorded = recorded.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const totalPending = pending.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const completedCount = myTransactions.filter((tx) => tx.transactionStatus === 'completed').length;

  return {
    totalRecorded,
    totalPending,
    completedCount,
    activeTransactions: myTransactions.length,
    recentTransactions: myTransactions.slice(0, 10)
  };
};

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

export const resetTransactionDataset = () => {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
    return [...SEED_TRANSACTIONS];
  } catch (err) {
    console.error('Error resetting transaction dataset:', err);
    return [...SEED_TRANSACTIONS];
  }
};
