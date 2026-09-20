/**
 * ScrapSetu — Sync Adapter (Module 10)
 *
 * Defines the adapter interface between the sync engine and the
 * underlying sync mechanism (local simulation or future real backend).
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  Module 10: LocalSyncAdapter (prototype simulation)  │
 * │  Future:    ApiSyncAdapter → FastAPI / REST backend  │
 * └─────────────────────────────────────────────────────┘
 *
 * To replace this with a real backend:
 *   1. Create ApiSyncAdapter implementing the same interface.
 *   2. Export it as the default adapter.
 *   3. No UI components need to change.
 *
 * IMPORTANT: This is a LOCAL PROTOTYPE SYNC SIMULATION.
 * No data is sent to any server. No API calls are made.
 * Clearly labeled as "Prototype sync" in all user-facing text.
 */

/**
 * Simulated network delay for prototype realism.
 * @param {number} ms
 */
const _delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * LocalSyncAdapter — simulates sync operations locally.
 * Each method resolves to { success: boolean, error?: string }.
 *
 * In a real implementation, these would make fetch() calls to FastAPI:
 *   POST   /api/scrap_lots
 *   PATCH  /api/scrap_lots/:id
 *   DELETE /api/scrap_lots/:id
 *   etc.
 */
let _simulateFailure = false;
let _simulateFailureError = 'Simulated network error';

export const LocalSyncAdapter = {
  /**
   * Configure simulated failures for testing/demo purposes.
   * @param {boolean} shouldFail
   * @param {string} [error]
   */
  setSimulateFailure(shouldFail, error = 'Simulated network error') {
    _simulateFailure = !!shouldFail;
    if (error) _simulateFailureError = error;
  },

  /** Reset failure simulation */
  resetSimulateFailure() {
    _simulateFailure = false;
    _simulateFailureError = 'Simulated network error';
  },

  /**
   * Simulate syncing a CREATE operation.
   * @param {object} queueItem - the sync queue item
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async syncCreate(queueItem) {
    if (_simulateFailure || queueItem?.payload?._simulateFailure) {
      return { success: false, error: _simulateFailureError };
    }
    try {
      // Simulate variable network latency (200–600ms)
      await _delay(200 + Math.random() * 400);

      // In prototype, the data already exists locally.
      // A real adapter would POST to the backend here.
      console.info(
        `[LocalSyncAdapter] Prototype sync: CREATE ${queueItem.entityType} ` +
          `${queueItem.entityId} (${queueItem.queueId})`
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Simulate syncing an UPDATE operation.
   * @param {object} queueItem
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async syncUpdate(queueItem) {
    if (_simulateFailure || queueItem?.payload?._simulateFailure) {
      return { success: false, error: _simulateFailureError };
    }
    try {
      await _delay(150 + Math.random() * 350);

      console.info(
        `[LocalSyncAdapter] Prototype sync: UPDATE ${queueItem.entityType} ` +
          `${queueItem.entityId} (${queueItem.queueId})`
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Simulate syncing a DELETE operation.
   * @param {object} queueItem
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async syncDelete(queueItem) {
    if (_simulateFailure || queueItem?.payload?._simulateFailure) {
      return { success: false, error: _simulateFailureError };
    }
    try {
      await _delay(100 + Math.random() * 300);

      console.info(
        `[LocalSyncAdapter] Prototype sync: DELETE ${queueItem.entityType} ` +
          `${queueItem.entityId} (${queueItem.queueId})`
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

let _currentAdapter = LocalSyncAdapter;

/**
 * Proxy adapter allowing runtime swapping for tests or API backend.
 */
export const activeAdapter = {
  syncCreate: (item) => _currentAdapter.syncCreate(item),
  syncUpdate: (item) => _currentAdapter.syncUpdate(item),
  syncDelete: (item) => _currentAdapter.syncDelete(item),
};

export const setActiveAdapter = (adapter) => {
  _currentAdapter = adapter || LocalSyncAdapter;
};

export const resetActiveAdapter = () => {
  _currentAdapter = LocalSyncAdapter;
  LocalSyncAdapter.resetSimulateFailure();
};

export default LocalSyncAdapter;
