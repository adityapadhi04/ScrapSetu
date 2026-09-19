/**
 * ScrapSetu — Handover Service (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Manages the physical/logical handover of scrap lots from Collectors to Buyers.
 * Supports dual confirmation: Collector sends → Buyer confirms receipt.
 *
 * Persisted in localStorage under STORAGE_KEY_HANDOVERS ("scrapsetu_handovers").
 * Sequential IDs: HAND-0001, HAND-0002, etc.
 *
 * PROTOTYPE DISCLAIMER:
 * No real GPS, real carrier tracking, or physical verification is implemented.
 * Handover location is simple descriptive text only.
 * Handover confirmations are demo records for traceability purposes.
 */

import { SEED_HANDOVERS } from '../data/handoverSeedData.js';
import { _patchTransactionFields, checkAndCompleteTransaction } from './transactionService.js';

export const STORAGE_KEY_HANDOVERS = 'scrapsetu_handovers';

export const VALID_HANDOVER_METHODS = ['collector_delivers', 'buyer_pickup', 'drop_off'];
export const VALID_HANDOVER_STATUSES = ['pending', 'collector_confirmed', 'buyer_confirmed', 'confirmed', 'disputed'];

// ─────────────────────────────────────────────
// Storage Initialization
// ─────────────────────────────────────────────

export const initializeHandovers = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_HANDOVERS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_HANDOVERS, JSON.stringify(SEED_HANDOVERS));
      return [...SEED_HANDOVERS];
    }
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? parsed : [...SEED_HANDOVERS];
  } catch (err) {
    console.error('Error initializing scrapsetu_handovers:', err);
    return [...SEED_HANDOVERS];
  }
};

export const getHandovers = () => initializeHandovers();

const saveHandovers = (handovers) => {
  try {
    localStorage.setItem(STORAGE_KEY_HANDOVERS, JSON.stringify(handovers));
  } catch (err) {
    console.error('Error saving scrapsetu_handovers:', err);
  }
};

// ─────────────────────────────────────────────
// ID Generation
// ─────────────────────────────────────────────

export const generateNextHandoverId = (existingHandovers = null) => {
  const list = existingHandovers || getHandovers();
  let highestNum = 0;
  for (const h of list) {
    if (h.handoverId && typeof h.handoverId === 'string') {
      const match = h.handoverId.match(/^HAND-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  }
  return `HAND-${String(highestNum + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Schema Validation
// ─────────────────────────────────────────────

export const validateHandover = (data) => {
  const errors = [];
  if (!data.transactionId || typeof data.transactionId !== 'string') {
    errors.push('transactionId is required');
  }
  if (!data.lotId || typeof data.lotId !== 'string') {
    errors.push('lotId is required');
  }
  if (!data.collectorId || typeof data.collectorId !== 'string') {
    errors.push('collectorId is required');
  }
  if (!data.buyerId || typeof data.buyerId !== 'string') {
    errors.push('buyerId is required');
  }
  if (!data.handoverMethod || !VALID_HANDOVER_METHODS.includes(data.handoverMethod)) {
    errors.push(`handoverMethod must be one of: ${VALID_HANDOVER_METHODS.join(', ')}`);
  }
  return { valid: errors.length === 0, errors };
};

// ─────────────────────────────────────────────
// Create Handover
// ─────────────────────────────────────────────

export const createHandover = (data) => {
  const validation = validateHandover(data);
  if (!validation.valid) {
    throw new Error(`Handover validation failed: ${validation.errors.join('; ')}`);
  }

  const handovers = getHandovers();

  // Prevent duplicate handover for same transaction
  const duplicate = handovers.find(
    (h) => h.transactionId === data.transactionId && h.handoverStatus !== 'disputed'
  );
  if (duplicate) {
    throw new Error(
      `Handover already exists for transaction ${data.transactionId}: ${duplicate.handoverId}`
    );
  }

  const handoverId = data.handoverId || generateNextHandoverId(handovers);
  const now = new Date().toISOString();

  const newHandover = {
    handoverId,
    transactionId: data.transactionId,
    lotId: data.lotId,

    collectorId: data.collectorId,
    buyerId: data.buyerId,
    buyerRole: data.buyerRole || 'recycler',

    materialCategory: data.materialCategory || '',
    weight: parseFloat(data.weight) || 0,
    weightUnit: data.weightUnit || 'kg',

    handoverMethod: data.handoverMethod,

    pickupLocation: data.pickupLocation || { area: '', city: '', state: '' },
    handoverLocation: data.handoverLocation || { area: '', city: '', state: '' },

    collectorConfirmed: false,
    buyerConfirmed: false,

    handoverStatus: 'pending',

    handoverDate: null,

    notes: (data.notes || '').trim(),

    createdAt: data.createdAt || now,
    updatedAt: now,

    version: '1.0',
    sourceType: data.sourceType || 'platform_generated'
  };

  handovers.push(newHandover);
  saveHandovers(handovers);

  // Update the parent transaction status to 'handover_pending'
  try {
    _patchTransactionFields(data.transactionId, { transactionStatus: 'handover_pending' });
  } catch (err) {
    // Non-fatal — transaction may not exist in test env
  }

  return newHandover;
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export const getHandoverById = (handoverId) => {
  const handovers = getHandovers();
  return handovers.find((h) => h.handoverId === handoverId) || null;
};

export const getHandoversByTransaction = (transactionId) => {
  const handovers = getHandovers();
  return handovers.filter((h) => h.transactionId === transactionId);
};

export const getHandoversByCollector = (collectorId) => {
  const handovers = getHandovers();
  return handovers.filter((h) => h.collectorId === collectorId);
};

export const getHandoversByBuyer = (buyerId) => {
  const handovers = getHandovers();
  return handovers.filter((h) => h.buyerId === buyerId);
};

// ─────────────────────────────────────────────
// Confirmations — Ownership Enforced
// ─────────────────────────────────────────────

/**
 * Collector confirms they have dispatched / handed over the scrap lot.
 * Only the owner collector may call this.
 */
export const confirmCollectorHandover = (handoverId, requestingCollectorId) => {
  const handovers = getHandovers();
  const index = handovers.findIndex((h) => h.handoverId === handoverId);
  if (index === -1) {
    throw new Error(`Handover not found: ${handoverId}`);
  }
  const handover = handovers[index];

  if (handover.collectorId !== requestingCollectorId) {
    throw new Error(
      `Unauthorized: Collector ${requestingCollectorId} cannot confirm handover ${handoverId} belonging to ${handover.collectorId}`
    );
  }

  const now = new Date().toISOString();
  handovers[index] = {
    ...handover,
    collectorConfirmed: true,
    handoverStatus: handover.buyerConfirmed ? 'confirmed' : 'collector_confirmed',
    handoverDate: handover.buyerConfirmed ? now : handover.handoverDate,
    updatedAt: now
  };
  saveHandovers(handovers);

  // If both parties confirmed, update the parent transaction
  if (handovers[index].handoverStatus === 'confirmed') {
    try {
      _patchTransactionFields(handover.transactionId, {
        handoverStatus: 'confirmed',
        handoverDate: now
      });
      checkAndCompleteTransaction(handover.transactionId);
    } catch (err) {
      // Non-fatal
    }
  }

  return handovers[index];
};

/**
 * Buyer confirms they have received the scrap lot.
 * Only the matching buyer may call this.
 */
export const confirmBuyerReceipt = (handoverId, requestingBuyerId) => {
  const handovers = getHandovers();
  const index = handovers.findIndex((h) => h.handoverId === handoverId);
  if (index === -1) {
    throw new Error(`Handover not found: ${handoverId}`);
  }
  const handover = handovers[index];

  if (handover.buyerId !== requestingBuyerId) {
    throw new Error(
      `Unauthorized: Buyer ${requestingBuyerId} cannot confirm receipt for handover ${handoverId} belonging to ${handover.buyerId}`
    );
  }

  const now = new Date().toISOString();
  const fullyConfirmed = handover.collectorConfirmed;
  handovers[index] = {
    ...handover,
    buyerConfirmed: true,
    handoverStatus: fullyConfirmed ? 'confirmed' : 'buyer_confirmed',
    handoverDate: fullyConfirmed ? now : handover.handoverDate,
    updatedAt: now
  };
  saveHandovers(handovers);

  // If both parties confirmed, update parent transaction
  if (handovers[index].handoverStatus === 'confirmed') {
    try {
      _patchTransactionFields(handover.transactionId, {
        handoverStatus: 'confirmed',
        handoverDate: now
      });
      checkAndCompleteTransaction(handover.transactionId);
    } catch (err) {
      // Non-fatal
    }
  }

  return handovers[index];
};

// ─────────────────────────────────────────────
// Stats for Admin
// ─────────────────────────────────────────────

export const getHandoverStats = () => {
  const handovers = getHandovers();
  return {
    total: handovers.length,
    pending: handovers.filter((h) => h.handoverStatus === 'pending').length,
    collectorConfirmed: handovers.filter((h) => h.handoverStatus === 'collector_confirmed').length,
    confirmed: handovers.filter((h) => h.handoverStatus === 'confirmed').length,
    disputed: handovers.filter((h) => h.handoverStatus === 'disputed').length
  };
};

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

export const resetHandoverDataset = () => {
  try {
    localStorage.setItem(STORAGE_KEY_HANDOVERS, JSON.stringify(SEED_HANDOVERS));
    return [...SEED_HANDOVERS];
  } catch (err) {
    console.error('Error resetting handover dataset:', err);
    return [...SEED_HANDOVERS];
  }
};
