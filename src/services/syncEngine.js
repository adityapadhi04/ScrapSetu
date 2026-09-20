/**
 * ScrapSetu — Sync Engine (Module 10)
 *
 * Orchestrates the synchronization process:
 *   - Reads pending items from syncQueueService
 *   - Dispatches them through syncAdapter
 *   - Updates status on success or failure
 *   - Enforces retry limits
 *   - Prevents duplicate concurrent sync runs via isSyncing lock
 *
 * The engine is wired to offlineService events:
 *   OFFLINE → ONLINE  →  automatically attempts processQueue()
 *
 * Architecture:
 *   syncEngine
 *     → syncQueueService (reads/writes queue)
 *     → syncAdapter.activeAdapter (dispatches to backend or simulation)
 *     → offlineService (subscribes to connectivity events)
 */

import {
  getPendingItems,
  getFailedItems,
  getRetryableItems,
  updateItemStatus,
  incrementRetry,
  resetItemForRetry,
  getQueueStats,
  SYNC_STATUSES,
  SYNC_OPERATIONS,
  MAX_RETRY_COUNT,
} from './syncQueueService.js';
import { activeAdapter } from './syncAdapter.js';
import { isOnline, subscribeToConnectivity } from './offlineService.js';

// ─── Sync Lock ────────────────────────────────────────────────────────────────

/**
 * Simple lock to prevent duplicate concurrent sync runs.
 * isSyncing = true while processQueue() is running.
 */
let isSyncing = false;

/** Returns whether a sync run is currently in progress. */
export const getSyncingStatus = () => isSyncing;

// ─── Event listeners registered ──────────────────────────────────────────────

let _engineInitialized = false;

// ─── Core Engine ─────────────────────────────────────────────────────────────

/**
 * Dispatch a single queue item through the adapter.
 * Updates status to syncing → synced | failed.
 *
 * @param {object} item - queue item from syncQueueService
 * @returns {Promise<boolean>} true = success, false = failure
 */
const _dispatchItem = async (item) => {
  // Mark as syncing
  updateItemStatus(item.queueId, SYNC_STATUSES.SYNCING);

  let result;
  try {
    switch (item.operation) {
      case SYNC_OPERATIONS.CREATE:
        result = await activeAdapter.syncCreate(item);
        break;
      case SYNC_OPERATIONS.UPDATE:
        result = await activeAdapter.syncUpdate(item);
        break;
      case SYNC_OPERATIONS.DELETE:
        result = await activeAdapter.syncDelete(item);
        break;
      default:
        result = { success: false, error: `Unknown operation: ${item.operation}` };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  if (result.success) {
    updateItemStatus(item.queueId, SYNC_STATUSES.SYNCED);
    return true;
  } else {
    incrementRetry(item.queueId);
    const updatedRetryCount = (item.retryCount || 0) + 1;
    const errMsg = result.error || 'Sync failed';

    if (updatedRetryCount >= MAX_RETRY_COUNT) {
      // Max retries reached — mark as permanently failed
      updateItemStatus(
        item.queueId,
        SYNC_STATUSES.FAILED,
        `Max retries (${MAX_RETRY_COUNT}) reached. Last error: ${errMsg}`
      );
    } else {
      // Still retryable — mark as failed (will be retried on next run)
      updateItemStatus(item.queueId, SYNC_STATUSES.FAILED, errMsg);
    }
    return false;
  }
};

/**
 * Process all pending queue items sequentially.
 * Acquires isSyncing lock to prevent duplicate runs.
 *
 * @returns {Promise<{ processed: number, succeeded: number, failed: number }>}
 */
export const processQueue = async () => {
  if (isSyncing) {
    console.info('[syncEngine] Sync already in progress — skipping duplicate run.');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  if (!isOnline()) {
    console.info('[syncEngine] Device is offline — skipping sync.');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const pending = getPendingItems();
  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  isSyncing = true;
  let succeeded = 0;
  let failed = 0;

  try {
    for (const item of pending) {
      const ok = await _dispatchItem(item);
      if (ok) succeeded++;
      else failed++;
    }
  } finally {
    isSyncing = false;
  }

  console.info(
    `[syncEngine] processQueue complete: ${succeeded} synced, ${failed} failed ` +
      `(of ${pending.length} processed)`
  );

  return { processed: pending.length, succeeded, failed };
};

/**
 * Retry failed operations.
 * If includeAll = true (e.g. manual user action), resets all failed items (even max retries).
 * If includeAll = false, resets only retryable items where retryCount < MAX_RETRY_COUNT.
 *
 * @param {boolean} [includeAll=false]
 * @returns {number} count of items reset to pending
 */
export const retryFailedOperations = (includeAll = false) => {
  if (includeAll) {
    const failed = getFailedItems();
    failed.forEach((item) => {
      resetItemForRetry(item.queueId);
    });
    return failed.length;
  }
  const retryable = getRetryableItems();
  retryable.forEach((item) => {
    updateItemStatus(item.queueId, SYNC_STATUSES.PENDING, null);
  });
  return retryable.length;
};

/**
 * Convenience wrapper: retry failed + process queue in one call.
 * Prevents duplicate runs via isSyncing lock.
 *
 * @returns {Promise<{ processed: number, succeeded: number, failed: number }>}
 */
export const syncPendingChanges = async () => {
  if (isSyncing) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }
  retryFailedOperations();
  return processQueue();
};

/**
 * Returns a summary of the current sync queue state.
 * Delegates to syncQueueService.getQueueStats().
 */
export const getSyncSummary = () => getQueueStats();

// ─── Auto-sync on Reconnect ───────────────────────────────────────────────────

/**
 * Initialize the sync engine.
 * Wires the offlineService connectivity event so that when the device
 * comes back online, the queue is automatically processed.
 *
 * Safe to call multiple times — only registers listeners once.
 */
export const initSyncEngine = () => {
  if (_engineInitialized) return;
  _engineInitialized = true;

  subscribeToConnectivity((online) => {
    if (online) {
      console.info('[syncEngine] Device came online — triggering auto-sync.');
      // Small delay to ensure browser connectivity is stable
      setTimeout(() => {
        syncPendingChanges().catch((err) => {
          console.error('[syncEngine] Auto-sync failed:', err);
        });
      }, 1500);
    } else {
      console.info('[syncEngine] Device went offline — sync paused.');
    }
  });
};

/**
 * Reset sync engine internal state (used in tests).
 */
export const resetSyncEngine = () => {
  isSyncing = false;
  _engineInitialized = false;
};

const syncEngine = {
  processQueue,
  syncPendingChanges,
  retryFailedOperations,
  getSyncSummary,
  getSyncingStatus,
  initSyncEngine,
  resetSyncEngine,
};

export default syncEngine;
