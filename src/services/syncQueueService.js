/**
 * ScrapSetu — Sync Queue Service (Module 10)
 *
 * Manages the local synchronization queue stored in localStorage.
 * localStorage key: scrapsetu_sync_queue
 *
 * Queue item schema:
 * {
 *   queueId: 'SYNC-0001',
 *   operation: 'create' | 'update' | 'delete',
 *   entityType: 'scrap_lot' | 'material' | 'offer' | 'transaction' | 'handover' | 'payment',
 *   entityId: 'LOT-0003',
 *   payload: {},
 *   status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict',
 *   retryCount: 0,
 *   createdAt: ISO8601,
 *   updatedAt: ISO8601,
 *   lastAttemptAt: null | ISO8601,
 *   errorMessage: null | string,
 *   version: '1.0',
 *   userId: string,
 *   dataSource: 'platform_generated'
 * }
 *
 * RULE: Only 'platform_generated' records enter this queue.
 *       Demo seed data ('demo_seed') must NEVER be queued.
 *
 * Conflict policy: latest local update wins.
 *                  Conflicted items preserve local data with status='conflict'.
 */

export const STORAGE_KEY_SYNC_QUEUE = 'scrapsetu_sync_queue';

export const SYNC_STATUSES = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  CONFLICT: 'conflict',
};

export const SYNC_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

export const SUPPORTED_ENTITY_TYPES = [
  'scrap_lot',
  'material',
  'offer',
  'transaction',
  'handover',
  'payment',
  'pickup',
];

/** Maximum retry attempts before an operation remains 'failed' permanently */
export const MAX_RETRY_COUNT = 3;

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Load the queue from localStorage.
 * Returns an empty array if nothing is stored or on parse error.
 * @returns {Array<object>}
 */
const _load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[syncQueueService] Failed to read sync queue:', e);
    return [];
  }
};

/**
 * Persist the queue to localStorage.
 * @param {Array<object>} queue
 */
const _save = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('[syncQueueService] Failed to save sync queue:', e);
  }
};

// ─── ID Generation ───────────────────────────────────────────────────────────

/**
 * Generate the next sequential SYNC-XXXX ID based on existing queue items.
 * @param {Array<object>} existingQueue
 * @returns {string} e.g. 'SYNC-0001'
 */
export const generateQueueId = (existingQueue = []) => {
  let highest = 0;
  for (const item of existingQueue) {
    if (item.queueId && typeof item.queueId === 'string') {
      const match = item.queueId.match(/^SYNC-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highest) highest = num;
      }
    }
  }
  return `SYNC-${String(highest + 1).padStart(4, '0')}`;
};

// ─── Core Queue Operations ───────────────────────────────────────────────────

/**
 * Add a new item to the sync queue.
 *
 * @param {object} params
 * @param {'create'|'update'|'delete'} params.operation
 * @param {string} params.entityType - must be one of SUPPORTED_ENTITY_TYPES
 * @param {string} params.entityId
 * @param {object} [params.payload={}]
 * @param {string} params.userId
 * @returns {object} the new queue item
 */
export const enqueue = ({
  operation,
  entityType,
  entityId,
  payload = {},
  userId,
}) => {
  // Validate required fields
  if (!operation || !SYNC_OPERATIONS[operation.toUpperCase()]) {
    throw new Error(
      `[syncQueueService] Invalid operation: "${operation}". ` +
        `Allowed: ${Object.values(SYNC_OPERATIONS).join(', ')}`
    );
  }
  if (!entityType || !SUPPORTED_ENTITY_TYPES.includes(entityType)) {
    throw new Error(
      `[syncQueueService] Invalid entityType: "${entityType}". ` +
        `Allowed: ${SUPPORTED_ENTITY_TYPES.join(', ')}`
    );
  }
  if (!entityId || typeof entityId !== 'string' || !entityId.trim()) {
    throw new Error('[syncQueueService] entityId is required and must be a non-empty string');
  }
  if (!userId) {
    throw new Error('[syncQueueService] userId is required to maintain role isolation');
  }

  const queue = _load();
  const now = new Date().toISOString();

  const item = {
    queueId: generateQueueId(queue),
    operation,
    entityType,
    entityId: entityId.trim(),
    payload,
    status: SYNC_STATUSES.PENDING,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    errorMessage: null,
    version: '1.0',
    userId,
    dataSource: 'platform_generated',
  };

  queue.push(item);
  _save(queue);
  return item;
};

/**
 * Retrieve the entire sync queue.
 * @returns {Array<object>}
 */
export const getQueue = () => _load();

/**
 * Retrieve pending items (status = 'pending').
 * @returns {Array<object>}
 */
export const getPendingItems = () =>
  _load().filter((item) => item.status === SYNC_STATUSES.PENDING);

/**
 * Retrieve items currently being synced.
 * @returns {Array<object>}
 */
export const getSyncingItems = () =>
  _load().filter((item) => item.status === SYNC_STATUSES.SYNCING);

/**
 * Retrieve successfully synced items.
 * @returns {Array<object>}
 */
export const getSyncedItems = () =>
  _load().filter((item) => item.status === SYNC_STATUSES.SYNCED);

/**
 * Retrieve failed items.
 * @returns {Array<object>}
 */
export const getFailedItems = () =>
  _load().filter((item) => item.status === SYNC_STATUSES.FAILED);

/**
 * Retrieve items eligible for retry:
 * failed items where retryCount < MAX_RETRY_COUNT.
 * @returns {Array<object>}
 */
export const getRetryableItems = () =>
  _load().filter(
    (item) =>
      item.status === SYNC_STATUSES.FAILED && item.retryCount < MAX_RETRY_COUNT
  );

/**
 * Update the status of a specific queue item.
 * @param {string} queueId
 * @param {string} status - one of SYNC_STATUSES
 * @param {string|null} [errorMessage]
 * @returns {object|null} updated item or null if not found
 */
export const updateItemStatus = (queueId, status, errorMessage = null) => {
  if (!Object.values(SYNC_STATUSES).includes(status)) {
    throw new Error(`[syncQueueService] Invalid status: "${status}"`);
  }
  const queue = _load();
  const idx = queue.findIndex((item) => item.queueId === queueId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  queue[idx] = {
    ...queue[idx],
    status,
    updatedAt: now,
    lastAttemptAt:
      status === SYNC_STATUSES.SYNCING || status === SYNC_STATUSES.SYNCED || status === SYNC_STATUSES.FAILED
        ? now
        : queue[idx].lastAttemptAt,
    errorMessage: errorMessage !== null ? errorMessage : queue[idx].errorMessage,
  };

  _save(queue);
  return queue[idx];
};

/**
 * Increment the retry count for a specific queue item.
 * Does NOT increment beyond MAX_RETRY_COUNT.
 * @param {string} queueId
 * @returns {object|null} updated item or null if not found
 */
export const incrementRetry = (queueId) => {
  const queue = _load();
  const idx = queue.findIndex((item) => item.queueId === queueId);
  if (idx === -1) return null;

  const current = queue[idx].retryCount || 0;
  queue[idx] = {
    ...queue[idx],
    retryCount: Math.min(current + 1, MAX_RETRY_COUNT),
    updatedAt: new Date().toISOString(),
  };

  _save(queue);
  return queue[idx];
};

/**
 * Returns aggregate statistics about the current sync queue.
 * Optionally filtered by userId and role for role isolation.
 * @param {string|null} [userId]
 * @param {string|null} [role]
 * @returns {{ total: number, pending: number, syncing: number, synced: number, failed: number, conflict: number }}
 */
export const getQueueStats = (userId = null, role = null) => {
  let queue = _load();
  if (userId && role !== 'admin') {
    queue = queue.filter((i) => i.userId === userId);
  }
  return {
    total: queue.length,
    pending: queue.filter((i) => i.status === SYNC_STATUSES.PENDING).length,
    syncing: queue.filter((i) => i.status === SYNC_STATUSES.SYNCING).length,
    synced: queue.filter((i) => i.status === SYNC_STATUSES.SYNCED).length,
    failed: queue.filter((i) => i.status === SYNC_STATUSES.FAILED).length,
    conflict: queue.filter((i) => i.status === SYNC_STATUSES.CONFLICT).length,
  };
};

/**
 * Retrieve queue items filtered by role isolation.
 * Admins see all items. Non-admins only see items where item.userId matches.
 * @param {string} userId
 * @param {string} [role]
 * @returns {Array<object>}
 */
export const getQueueForUser = (userId, role = null) => {
  const queue = _load();
  if (role === 'admin') return queue;
  return queue.filter((item) => item.userId === userId);
};

/**
 * Reset a failed queue item so it can be retried.
 * Resets status to 'pending', clears errorMessage, and resets retryCount to 0.
 * @param {string} queueId
 * @returns {object|null}
 */
export const resetItemForRetry = (queueId) => {
  const queue = _load();
  const idx = queue.findIndex((item) => item.queueId === queueId);
  if (idx === -1) return null;

  queue[idx] = {
    ...queue[idx],
    status: SYNC_STATUSES.PENDING,
    retryCount: 0,
    errorMessage: null,
    updatedAt: new Date().toISOString(),
  };

  _save(queue);
  return queue[idx];
};

/**
 * Remove all items with status='synced' from the queue (housekeeping).
 * Does NOT remove pending, failed, or conflict items.
 * @returns {number} count of items removed
 */
export const clearSynced = () => {
  const queue = _load();
  const before = queue.length;
  const filtered = queue.filter((item) => item.status !== SYNC_STATUSES.SYNCED);
  _save(filtered);
  return before - filtered.length;
};

/**
 * Reset the entire sync queue (used in tests/dev only).
 */
export const resetQueue = () => {
  localStorage.removeItem(STORAGE_KEY_SYNC_QUEUE);
};

/**
 * Get a specific queue item by queueId.
 * @param {string} queueId
 * @returns {object|null}
 */
export const getQueueItemById = (queueId) => {
  return _load().find((item) => item.queueId === queueId) || null;
};

const syncQueueService = {
  enqueue,
  getQueue,
  getQueueForUser,
  getPendingItems,
  getSyncingItems,
  getSyncedItems,
  getFailedItems,
  getRetryableItems,
  updateItemStatus,
  incrementRetry,
  resetItemForRetry,
  getQueueStats,
  clearSynced,
  resetQueue,
  getQueueItemById,
  generateQueueId,
  SYNC_STATUSES,
  SYNC_OPERATIONS,
  SUPPORTED_ENTITY_TYPES,
  MAX_RETRY_COUNT,
  STORAGE_KEY_SYNC_QUEUE,
};

export default syncQueueService;
