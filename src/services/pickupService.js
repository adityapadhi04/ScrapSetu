/**
 * ScrapSetu — Pickup Service (Module 14: Pickup Scheduling + Collection Coordination)
 *
 * Coordinates physical material movement between Informal Collectors and Buyers
 * (Repair Shops & Authorized Recyclers) without GPS or live tracking.
 *
 * Persisted in localStorage: `scrapsetu_pickups`
 * Sequential IDs: PKP-0001, PKP-0002, etc.
 *
 * METHODS:
 * - 'buyer_pickup' (Buyer sends transport to collector location)
 * - 'collector_dropoff' (Collector delivers material to buyer facility)
 *
 * STATUSES:
 * - 'requested' (Initial request placed)
 * - 'scheduled' (Date, time & location confirmed by parties)
 * - 'completed' (Material handed over successfully)
 * - 'cancelled' (Cancelled by either party with reason)
 *
 * INVARIANTS:
 * - Deterministic status transitions:
 *     requested -> scheduled | cancelled
 *     scheduled -> completed | cancelled
 *     completed -> (terminal)
 *     cancelled -> (terminal)
 * - Enqueues non-seed operations into Module 10 sync queue.
 * - Enforces role isolation (Collector, Repair Shop, Recycler, Admin).
 * - No GPS, live tracking, maps, or external payment dependencies.
 */

import { SEED_PICKUPS } from '../data/pickupSeedData.js';
import { enqueue } from './syncQueueService.js';

export const STORAGE_KEY_PICKUPS = 'scrapsetu_pickups';

export const VALID_PICKUP_METHODS = ['buyer_pickup', 'collector_dropoff'];
export const VALID_PICKUP_STATUSES = ['requested', 'scheduled', 'completed', 'cancelled'];

/**
 * Valid allowed status transitions map
 */
export const ALLOWED_STATUS_TRANSITIONS = {
  requested: ['scheduled', 'cancelled'],
  scheduled: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ─── Storage Initialization ───────────────────────────────────────────────────

export const initializePickups = () => {
  try {
    if (typeof localStorage === 'undefined') return [...SEED_PICKUPS];
    const existing = localStorage.getItem(STORAGE_KEY_PICKUPS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(SEED_PICKUPS));
      return [...SEED_PICKUPS];
    }
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed)) {
      let changed = false;
      for (const seed of SEED_PICKUPS) {
        if (!parsed.some((p) => p.pickupId === seed.pickupId)) {
          parsed.push(seed);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(parsed));
      }
      return parsed;
    }
    return [...SEED_PICKUPS];
  } catch (err) {
    console.error('[pickupService] Error initializing pickups storage:', err);
    return [...SEED_PICKUPS];
  }
};

export const getPickups = () => initializePickups();

const _savePickups = (pickups) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(pickups));
    }
  } catch (err) {
    console.error('[pickupService] Error persisting pickups:', err);
  }
};

/**
 * Generate sequential PKP-0001 ID
 */
export const generatePickupId = (existingPickups = []) => {
  let maxId = 0;
  for (const p of existingPickups) {
    if (p.pickupId && p.pickupId.startsWith('PKP-')) {
      const num = parseInt(p.pickupId.replace('PKP-', ''), 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }
  return `PKP-${String(maxId + 1).padStart(4, '0')}`;
};

// ─── Queries & Role-Isolated Filters ──────────────────────────────────────────

/**
 * Get single pickup by pickupId
 */
export const getPickupById = (pickupId) => {
  if (!pickupId) return null;
  const pickups = getPickups();
  return pickups.find((p) => p.pickupId === pickupId) || null;
};

/**
 * Get pickup linked to a transaction
 */
export const getPickupByTransactionId = (transactionId) => {
  if (!transactionId) return null;
  const pickups = getPickups();
  return pickups.find((p) => p.transactionId === transactionId) || null;
};

/**
 * Get pickups accessible to a collector (Role isolation: Collector sees only their own)
 */
export const getPickupsByCollector = (collectorId) => {
  if (!collectorId) return [];
  const pickups = getPickups();
  return pickups.filter((p) => p.collectorId === collectorId);
};

/**
 * Get pickups accessible to a buyer (Role isolation: Buyer sees only their own)
 */
export const getPickupsByBuyer = (buyerId, buyerRole = null) => {
  if (!buyerId && !buyerRole) return [];
  const pickups = getPickups();
  return pickups.filter((p) => {
    if (buyerId && p.buyerId === buyerId) return true;
    if (buyerRole && p.buyerRole === buyerRole) return true;
    return false;
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new pickup coordination request.
 * @param {object} params
 * @param {object} actingUser
 * @returns {object} created pickup
 */
export const createPickupRequest = (params, actingUser = null) => {
  const {
    transactionId,
    lotId = null,
    collectorId,
    buyerId,
    buyerRole = 'recycler',
    method = 'buyer_pickup',
    scheduledDate = null,
    scheduledTime = null,
    location = '',
    notes = '',
  } = params || {};

  if (!transactionId || typeof transactionId !== 'string') {
    throw new Error('[pickupService] transactionId is required');
  }
  if (!collectorId || typeof collectorId !== 'string') {
    throw new Error('[pickupService] collectorId is required');
  }
  if (!buyerId || typeof buyerId !== 'string') {
    throw new Error('[pickupService] buyerId is required');
  }
  if (!VALID_PICKUP_METHODS.includes(method)) {
    throw new Error(`[pickupService] Invalid method: ${method}. Allowed: ${VALID_PICKUP_METHODS.join(', ')}`);
  }

  const pickups = getPickups();
  const existing = pickups.find((p) => p.transactionId === transactionId && p.status !== 'cancelled');
  if (existing) {
    return existing; // Return existing active pickup for this transaction
  }

  const now = new Date().toISOString();
  const pickupId = generatePickupId(pickups);

  const newPickup = {
    pickupId,
    transactionId: transactionId.trim(),
    lotId: lotId ? String(lotId).trim() : null,
    collectorId: collectorId.trim(),
    buyerId: buyerId.trim(),
    buyerRole: buyerRole.trim(),
    method,
    scheduledDate: scheduledDate || null,
    scheduledTime: scheduledTime || null,
    location: (location || '').trim(),
    notes: (notes || '').trim(),
    status: (scheduledDate && scheduledTime) ? 'scheduled' : 'requested',
    sourceType: 'platform_generated',
    createdAt: now,
    updatedAt: now,
  };

  pickups.push(newPickup);
  _savePickups(pickups);

  // Enqueue to offline sync queue if actingUser or user ID is available
  const userId = actingUser?.id || collectorId;
  try {
    enqueue({
      operation: 'create',
      entityType: 'pickup',
      entityId: pickupId,
      payload: newPickup,
      userId,
    });
  } catch (err) {
    // Non-critical enqueue fallback in offline/demo mode
  }

  _syncLinkedTransactionAndHandover(newPickup, 'create', actingUser);

  return newPickup;
};

/**
 * Synchronize pickup updates with existing transaction and handover entities.
 */
const _syncLinkedTransactionAndHandover = (pickup, action, actingUser = null) => {
  if (!pickup || !pickup.transactionId) return;
  const now = new Date().toISOString();
  try {
    if (typeof localStorage !== 'undefined') {
      const txStr = localStorage.getItem('scrapsetu_transactions');
      if (txStr) {
        const txs = JSON.parse(txStr);
        const tIdx = txs.findIndex((t) => t.transactionId === pickup.transactionId);
        if (tIdx !== -1) {
          txs[tIdx].pickupId = pickup.pickupId;
          txs[tIdx].pickupStatus = pickup.status;
          txs[tIdx].pickupMethod = pickup.method;
          if ((action === 'schedule' || pickup.status === 'scheduled') && txs[tIdx].transactionStatus === 'created') {
            txs[tIdx].transactionStatus = 'handover_pending';
          }
          txs[tIdx].updatedAt = now;
          localStorage.setItem('scrapsetu_transactions', JSON.stringify(txs));
        }
      }

      // If completing pickup, also update corresponding handover record if present
      if (action === 'complete') {
        const hStr = localStorage.getItem('scrapsetu_handovers');
        if (hStr) {
          const handovers = JSON.parse(hStr);
          const hIdx = handovers.findIndex((h) => h.transactionId === pickup.transactionId);
          if (hIdx !== -1) {
            const h = handovers[hIdx];
            const userId = actingUser?.id || actingUser?.userId;
            const isCollector = userId ? (userId === pickup.collectorId) : true;
            const isBuyer = userId ? (userId === pickup.buyerId) : true;

            if (isCollector) h.collectorConfirmed = true;
            if (isBuyer) h.buyerConfirmed = true;

            if (h.collectorConfirmed && h.buyerConfirmed) {
              h.handoverStatus = 'confirmed';
              h.handoverDate = now;
            } else if (h.collectorConfirmed) {
              h.handoverStatus = 'collector_confirmed';
            } else if (h.buyerConfirmed) {
              h.handoverStatus = 'buyer_confirmed';
            }
            h.updatedAt = now;
            handovers[hIdx] = h;
            localStorage.setItem('scrapsetu_handovers', JSON.stringify(handovers));
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal cross-entity linkage
  }
};

/**
 * Schedule or update scheduled date/time and location for a pickup.
 * Can transition from 'requested' -> 'scheduled' or update existing 'scheduled'.
 */
export const schedulePickup = (pickupId, updates = {}, actingUser = null) => {
  if (!pickupId) throw new Error('[pickupService] pickupId is required');

  const pickups = getPickups();
  const idx = pickups.findIndex((p) => p.pickupId === pickupId);
  if (idx === -1) {
    throw new Error(`[pickupService] Pickup with ID "${pickupId}" not found`);
  }

  const current = pickups[idx];

  // Validate status transition
  if (current.status !== 'requested' && current.status !== 'scheduled') {
    throw new Error(
      `[pickupService] Cannot schedule pickup in "${current.status}" state. Only requested or scheduled pickups can be scheduled.`
    );
  }

  const now = new Date().toISOString();
  const updated = {
    ...current,
    scheduledDate: updates.scheduledDate !== undefined ? updates.scheduledDate : current.scheduledDate,
    scheduledTime: updates.scheduledTime !== undefined ? updates.scheduledTime : current.scheduledTime,
    location: updates.location !== undefined ? (updates.location || '').trim() : current.location,
    notes: updates.notes !== undefined ? (updates.notes || '').trim() : current.notes,
    method: updates.method !== undefined && VALID_PICKUP_METHODS.includes(updates.method) ? updates.method : current.method,
    status: 'scheduled',
    updatedAt: now,
  };

  pickups[idx] = updated;
  _savePickups(pickups);

  const userId = actingUser?.id || updated.buyerId;
  try {
    enqueue({
      operation: 'update',
      entityType: 'pickup',
      entityId: pickupId,
      payload: updated,
      userId,
    });
  } catch (err) {}

  _syncLinkedTransactionAndHandover(updated, 'schedule', actingUser);

  return updated;
};

/**
 * Mark a pickup as completed.
 * Valid transition: 'scheduled' -> 'completed'.
 */
export const completePickup = (pickupId, details = {}, actingUser = null) => {
  if (!pickupId) throw new Error('[pickupService] pickupId is required');

  const pickups = getPickups();
  const idx = pickups.findIndex((p) => p.pickupId === pickupId);
  if (idx === -1) {
    throw new Error(`[pickupService] Pickup with ID "${pickupId}" not found`);
  }

  const current = pickups[idx];
  if (current.status !== 'scheduled') {
    throw new Error(
      `[pickupService] Cannot complete pickup from "${current.status}" state. Only "scheduled" pickups can be marked completed.`
    );
  }

  const now = new Date().toISOString();
  const updated = {
    ...current,
    status: 'completed',
    completionNotes: details.notes || current.notes || '',
    completedAt: now,
    updatedAt: now,
  };

  pickups[idx] = updated;
  _savePickups(pickups);

  const userId = actingUser?.id || updated.buyerId;
  try {
    enqueue({
      operation: 'update',
      entityType: 'pickup',
      entityId: pickupId,
      payload: updated,
      userId,
    });
  } catch (err) {}

  _syncLinkedTransactionAndHandover(updated, 'complete', actingUser);

  return updated;
};

/**
 * Cancel a pickup request or schedule.
 * Valid transition: 'requested' or 'scheduled' -> 'cancelled'.
 */
export const cancelPickup = (pickupId, reason = '', actingUser = null) => {
  if (!pickupId) throw new Error('[pickupService] pickupId is required');

  const pickups = getPickups();
  const idx = pickups.findIndex((p) => p.pickupId === pickupId);
  if (idx === -1) {
    throw new Error(`[pickupService] Pickup with ID "${pickupId}" not found`);
  }

  const current = pickups[idx];
  if (current.status === 'completed') {
    throw new Error('[pickupService] Completed pickups cannot be cancelled');
  }
  if (current.status === 'cancelled') {
    return current; // Already cancelled
  }

  const now = new Date().toISOString();
  const updated = {
    ...current,
    status: 'cancelled',
    cancellationReason: (reason || '').trim(),
    cancelledAt: now,
    updatedAt: now,
  };

  pickups[idx] = updated;
  _savePickups(pickups);

  const userId = actingUser?.id || updated.collectorId;
  try {
    enqueue({
      operation: 'update',
      entityType: 'pickup',
      entityId: pickupId,
      payload: updated,
      userId,
    });
  } catch (err) {}

  _syncLinkedTransactionAndHandover(updated, 'cancel', actingUser);

  return updated;
};

// ─── Admin & Dashboard Statistics ─────────────────────────────────────────────

/**
 * Aggregate pickup statistics for Admin governance.
 * @returns {object}
 */
export const getPickupStats = () => {
  const pickups = getPickups();
  const total = pickups.length;
  const requested = pickups.filter((p) => p.status === 'requested').length;
  const scheduled = pickups.filter((p) => p.status === 'scheduled').length;
  const completed = pickups.filter((p) => p.status === 'completed').length;
  const cancelled = pickups.filter((p) => p.status === 'cancelled').length;

  const byMethod = {
    buyer_pickup: pickups.filter((p) => p.method === 'buyer_pickup').length,
    collector_dropoff: pickups.filter((p) => p.method === 'collector_dropoff').length,
  };

  const byBuyerRole = {
    repair: pickups.filter((p) => p.buyerRole === 'repair' || p.buyerRole === 'repair-shop').length,
    recycler: pickups.filter((p) => p.buyerRole === 'recycler').length,
  };

  return {
    total,
    requested,
    scheduled,
    completed,
    cancelled,
    pending: requested + scheduled,
    byMethod,
    byBuyerRole,
  };
};

/**
 * Reset pickups back to seed data.
 */
export const resetPickups = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(SEED_PICKUPS));
    }
  } catch (err) {}
  return [...SEED_PICKUPS];
};

export default {
  STORAGE_KEY_PICKUPS,
  VALID_PICKUP_METHODS,
  VALID_PICKUP_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  initializePickups,
  getPickups,
  generatePickupId,
  getPickupById,
  getPickupByTransactionId,
  getPickupsByCollector,
  getPickupsByBuyer,
  createPickupRequest,
  schedulePickup,
  completePickup,
  cancelPickup,
  getPickupStats,
  resetPickups,
};
