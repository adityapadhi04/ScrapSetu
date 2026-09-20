/**
 * ScrapSetu — Module 10 Automated Test Suite
 *
 * Verifies all 25+ acceptance criteria and architectural invariants specified for Module 10:
 * OFFLINE-FIRST DATA + SYNC ENGINE
 *
 * Strict Invariants:
 * - Prototype only: local simulation only, no real API/server uploads
 * - Sequential SYNC IDs: SYNC-0001, SYNC-0002, etc.
 * - Demo seed records ('demo_seed') must NEVER enter the sync queue
 * - Platform generated records ('platform_generated'/'platform_user') enter the sync queue
 * - Role isolation: non-admin users only access their own queue items
 * - Max 3 retries before permanent failed state
 * - Full 8-language localization completeness
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Ensure localStorage mock is present in headless node test environment
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
    get length() { return store.size; }
  };
}

// Ensure window & navigator stubs for node testing environment
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = {
    onLine: true,
  };
}

import {
  isOnline,
  isOffline,
  getOnlineStatus,
  subscribeToConnectivity,
  setSimulatedOnline,
  resetSimulatedOnline,
  getSubscriberCount,
} from '../src/services/offlineService.js';

import {
  STORAGE_KEY_SYNC_QUEUE,
  SYNC_STATUSES,
  SYNC_OPERATIONS,
  SUPPORTED_ENTITY_TYPES,
  MAX_RETRY_COUNT,
  generateQueueId,
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
} from '../src/services/syncQueueService.js';

import {
  LocalSyncAdapter,
  activeAdapter,
  setActiveAdapter,
  resetActiveAdapter,
} from '../src/services/syncAdapter.js';

import {
  processQueue,
  syncPendingChanges,
  retryFailedOperations,
  getSyncSummary,
  getSyncingStatus,
  initSyncEngine,
  resetSyncEngine,
} from '../src/services/syncEngine.js';

import {
  createScrapLot,
  resetScrapLots,
} from '../src/services/scrapLotService.js';

import {
  createOffer,
  acceptOffer,
  resetOfferDataset,
} from '../src/services/offerService.js';

import {
  createTransaction,
  resetTransactionDataset,
} from '../src/services/transactionService.js';

import {
  createHandover,
  confirmCollectorHandover,
  confirmBuyerReceipt,
  resetHandoverDataset,
} from '../src/services/handoverService.js';

import {
  createPaymentRecord,
  resetPaymentDataset,
} from '../src/services/paymentService.js';

import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 10: Offline-First Architecture & Sync Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    resetQueue();
    resetSyncEngine();
    resetActiveAdapter();
    resetSimulatedOnline();
  });

  afterEach(() => {
    resetQueue();
    resetSyncEngine();
    resetActiveAdapter();
    resetSimulatedOnline();
  });

  test('1. Online detection: isOnline returns true when online', () => {
    setSimulatedOnline(true);
    assert.strictEqual(isOnline(), true);
    assert.strictEqual(isOffline(), false);
    assert.strictEqual(getOnlineStatus(), true);
  });

  test('2. Offline detection: isOffline returns true when offline', () => {
    setSimulatedOnline(false);
    assert.strictEqual(isOnline(), false);
    assert.strictEqual(isOffline(), true);
    assert.strictEqual(getOnlineStatus(), false);
  });

  test('3. Queue creation: enqueue creates valid item with required fields', () => {
    const item = enqueue({
      operation: 'create',
      entityType: 'scrap_lot',
      entityId: 'LOT-9999',
      payload: { materialType: 'copper_wire', weight: 50 },
      userId: 'collector-001',
    });

    assert.ok(item.queueId);
    assert.strictEqual(item.operation, 'create');
    assert.strictEqual(item.entityType, 'scrap_lot');
    assert.strictEqual(item.entityId, 'LOT-9999');
    assert.strictEqual(item.status, SYNC_STATUSES.PENDING);
    assert.strictEqual(item.retryCount, 0);
    assert.strictEqual(item.userId, 'collector-001');
    assert.strictEqual(item.dataSource, 'platform_generated');
    assert.ok(item.createdAt);
  });

  test('4. Sequential SYNC IDs: SYNC-0001, SYNC-0002 increment monotonically', () => {
    const item1 = enqueue({
      operation: 'create',
      entityType: 'scrap_lot',
      entityId: 'LOT-0001',
      userId: 'collector-001',
    });
    const item2 = enqueue({
      operation: 'create',
      entityType: 'offer',
      entityId: 'OFR-0001',
      userId: 'repair-001',
    });
    const item3 = enqueue({
      operation: 'create',
      entityType: 'transaction',
      entityId: 'TXN-0001',
      userId: 'collector-001',
    });

    assert.strictEqual(item1.queueId, 'SYNC-0001');
    assert.strictEqual(item2.queueId, 'SYNC-0002');
    assert.strictEqual(item3.queueId, 'SYNC-0003');
  });

  test('5. Create operation: properly validated and stored in queue', () => {
    enqueue({
      operation: SYNC_OPERATIONS.CREATE,
      entityType: 'scrap_lot',
      entityId: 'LOT-0100',
      userId: 'collector-001',
      payload: { weight: 12.5 },
    });

    const pending = getPendingItems();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].operation, 'create');
    assert.strictEqual(pending[0].payload.weight, 12.5);
  });

  test('6. Update operation: properly validated and stored in queue', () => {
    enqueue({
      operation: SYNC_OPERATIONS.UPDATE,
      entityType: 'handover',
      entityId: 'HAND-0010',
      userId: 'collector-001',
      payload: { handoverStatus: 'collector_confirmed' },
    });

    const pending = getPendingItems();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].operation, 'update');
    assert.strictEqual(pending[0].payload.handoverStatus, 'collector_confirmed');
  });

  test('7. Delete operation: properly validated and stored in queue', () => {
    enqueue({
      operation: SYNC_OPERATIONS.DELETE,
      entityType: 'scrap_lot',
      entityId: 'LOT-0100',
      userId: 'collector-001',
    });

    const pending = getPendingItems();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].operation, 'delete');
  });

  test('8. Queue persistence: queue items persist directly in localStorage', () => {
    enqueue({
      operation: 'create',
      entityType: 'payment',
      entityId: 'PAY-0001',
      userId: 'collector-001',
    });

    const raw = localStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].entityId, 'PAY-0001');
  });

  test('9. Pending count: getQueueStats accurately aggregates queue metrics', () => {
    enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'u1' });
    enqueue({ operation: 'create', entityType: 'offer', entityId: 'OFR-1', userId: 'u1' });
    const item3 = enqueue({ operation: 'create', entityType: 'transaction', entityId: 'TXN-1', userId: 'u1' });
    updateItemStatus(item3.queueId, SYNC_STATUSES.SYNCED);

    const stats = getQueueStats();
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.pending, 2);
    assert.strictEqual(stats.synced, 1);
    assert.strictEqual(stats.failed, 0);
  });

  test('10. Sync processing: processQueue dispatches pending items sequentially', async () => {
    setSimulatedOnline(true);
    // Use fast mock adapter for deterministic instant tests
    setActiveAdapter({
      syncCreate: async () => ({ success: true }),
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'u1' });
    enqueue({ operation: 'create', entityType: 'offer', entityId: 'OFR-1', userId: 'u1' });

    const result = await processQueue();
    assert.strictEqual(result.processed, 2);
    assert.strictEqual(result.succeeded, 2);
    assert.strictEqual(result.failed, 0);

    assert.strictEqual(getPendingItems().length, 0);
    assert.strictEqual(getSyncedItems().length, 2);
  });

  test('11. Pending → Syncing transition: status marked syncing during execution', async () => {
    setSimulatedOnline(true);
    let capturedStatus = null;

    setActiveAdapter({
      syncCreate: async (item) => {
        // Read status during dispatch
        const current = getQueueItemById(item.queueId);
        capturedStatus = current.status;
        return { success: true };
      },
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'u1' });
    await processQueue();

    assert.strictEqual(capturedStatus, SYNC_STATUSES.SYNCING);
  });

  test('12. Syncing → Synced transition: status updated to synced on success', async () => {
    setSimulatedOnline(true);
    setActiveAdapter({
      syncCreate: async () => ({ success: true }),
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'u1' });
    await processQueue();

    const stored = getQueueItemById(item.queueId);
    assert.strictEqual(stored.status, SYNC_STATUSES.SYNCED);
  });

  test('13. Failure handling: item marked failed with error message on sync failure', async () => {
    setSimulatedOnline(true);
    setActiveAdapter({
      syncCreate: async () => ({ success: false, error: 'Network timeout' }),
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-FAIL', userId: 'u1' });
    const result = await processQueue();

    assert.strictEqual(result.failed, 1);
    const stored = getQueueItemById(item.queueId);
    assert.strictEqual(stored.status, SYNC_STATUSES.FAILED);
    assert.strictEqual(stored.errorMessage, 'Network timeout');
  });

  test('14. Retry count: increments on each failed sync attempt', async () => {
    setSimulatedOnline(true);
    setActiveAdapter({
      syncCreate: async () => ({ success: false, error: 'Temporary glitch' }),
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-RETRY', userId: 'u1' });
    await processQueue();

    let stored = getQueueItemById(item.queueId);
    assert.strictEqual(stored.retryCount, 1);

    // Reset status to pending and process again
    updateItemStatus(item.queueId, SYNC_STATUSES.PENDING);
    await processQueue();

    stored = getQueueItemById(item.queueId);
    assert.strictEqual(stored.retryCount, 2);
  });

  test('15. Retry limit: permanently marked failed after 3 failed attempts', async () => {
    setSimulatedOnline(true);
    setActiveAdapter({
      syncCreate: async () => ({ success: false, error: 'Permanent endpoint error' }),
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-MAX', userId: 'u1' });

    // Attempt 1
    await processQueue();
    assert.strictEqual(getQueueItemById(item.queueId).retryCount, 1);

    // Attempt 2
    updateItemStatus(item.queueId, SYNC_STATUSES.PENDING);
    await processQueue();
    assert.strictEqual(getQueueItemById(item.queueId).retryCount, 2);

    // Attempt 3 (hits MAX_RETRY_COUNT = 3)
    updateItemStatus(item.queueId, SYNC_STATUSES.PENDING);
    await processQueue();

    const stored = getQueueItemById(item.queueId);
    assert.strictEqual(stored.retryCount, 3);
    assert.strictEqual(stored.status, SYNC_STATUSES.FAILED);
    assert.ok(stored.errorMessage.includes('Max retries'));

    // Verify it is no longer returned by getRetryableItems()
    const retryable = getRetryableItems();
    assert.strictEqual(retryable.length, 0);
  });

  test('16. Failed record retention: failed records remain stored in queue without loss', async () => {
    setSimulatedOnline(true);
    setActiveAdapter({
      syncCreate: async () => ({ success: false, error: 'Simulated failure' }),
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-KEEP', userId: 'u1' });
    await processQueue();

    const failed = getFailedItems();
    assert.strictEqual(failed.length, 1);
    assert.strictEqual(failed[0].queueId, item.queueId);
    assert.strictEqual(failed[0].entityId, 'LOT-KEEP');
  });

  test('17. Duplicate sync prevention: prevents simultaneous sync execution', async () => {
    setSimulatedOnline(true);
    let releaseDelay;
    const delayPromise = new Promise((resolve) => { releaseDelay = resolve; });

    setActiveAdapter({
      syncCreate: async () => {
        await delayPromise;
        return { success: true };
      },
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-CONCUR', userId: 'u1' });

    // Start first sync (held by delayPromise)
    const sync1 = processQueue();
    assert.strictEqual(getSyncingStatus(), true);

    // Second simultaneous sync should be rejected by isSyncing lock
    const sync2Result = await processQueue();
    assert.strictEqual(sync2Result.processed, 0);

    // Release first sync
    releaseDelay();
    const sync1Result = await sync1;
    assert.strictEqual(sync1Result.processed, 1);
    assert.strictEqual(getSyncingStatus(), false);
  });

  test('18. Online event: triggers subscription callback on reconnect', () => {
    let notifiedState = null;
    const unsubscribe = subscribeToConnectivity((online) => {
      notifiedState = online;
    });

    setSimulatedOnline(false);
    assert.strictEqual(notifiedState, false);

    setSimulatedOnline(true);
    assert.strictEqual(notifiedState, true);

    unsubscribe();
  });

  test('19. Manual Sync Now: syncPendingChanges retries failed and processes queue', async () => {
    setSimulatedOnline(true);
    let callCount = 0;
    setActiveAdapter({
      syncCreate: async () => {
        callCount++;
        return { success: true };
      },
      syncUpdate: async () => ({ success: true }),
      syncDelete: async () => ({ success: true }),
    });

    const item = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-MANUAL', userId: 'u1' });
    // Simulate previous non-max failure
    updateItemStatus(item.queueId, SYNC_STATUSES.FAILED, 'Network drop');

    const result = await syncPendingChanges();
    assert.strictEqual(result.succeeded, 1);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(getQueueItemById(item.queueId).status, SYNC_STATUSES.SYNCED);
  });

  test('20. Demo seed not queued: demo_seed items are never queued by any service', () => {
    // Reset seed datasets
    resetScrapLots();
    resetOfferDataset();
    resetTransactionDataset();
    resetHandoverDataset();
    resetPaymentDataset();

    // The sync queue should remain completely empty
    const queue = getQueue();
    assert.strictEqual(queue.length, 0);
  });

  test('21. Platform generated queued: platform-generated records enter sync queue', () => {
    const lot = createScrapLot({
      materialType: 'Copper Wire',
      weight: 15,
      condition: 'clean',
      location: 'Bhubaneswar Unit 4',
      collectorId: 'collector-001',
      collectorName: 'Ramesh Patel',
    });

    const queue = getQueue();
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].entityType, 'scrap_lot');
    assert.strictEqual(queue[0].entityId, lot.id);
    assert.strictEqual(queue[0].userId, 'collector-001');
    assert.strictEqual(queue[0].status, SYNC_STATUSES.PENDING);
  });

  test('22. Offline scrap lot flow: creates lot, persists locally, enqueues sync', () => {
    setSimulatedOnline(false); // Simulate offline

    const lot = createScrapLot({
      materialType: 'Copper Wire',
      weight: 8.5,
      condition: 'sorted',
      location: 'Saheed Nagar, BBSR',
      collectorId: 'collector@scrapsetu.demo',
      collectorName: 'Ramesh Patel',
    });

    assert.ok(lot.id);
    assert.strictEqual(lot.weight, 8.5);

    // Verified in queue as pending sync
    const stats = getQueueStats();
    assert.strictEqual(stats.pending, 1);
    const item = getQueue()[0];
    assert.strictEqual(item.entityId, lot.id);
    assert.strictEqual(item.status, 'pending');
  });

  test('23. Offline transaction flow: creates transaction, enqueues transaction create', () => {
    setSimulatedOnline(false);

    const txn = createTransaction({
      lotId: 'LOT-9999',
      offerId: 'OFR-9999',
      collectorId: 'collector@scrapsetu.demo',
      collectorName: 'Ramesh Patel',
      buyerId: 'REC-0001',
      buyerName: 'Green Tech Recyclers',
      buyerRole: 'recycler',
      materialCategory: 'PCB',
      weight: 20,
      agreedPrice: 420,
    });

    assert.ok(txn.transactionId);
    const queue = getQueue();
    const txnQueueItem = queue.find((i) => i.entityType === 'transaction' && i.entityId === txn.transactionId);
    assert.ok(txnQueueItem);
    assert.strictEqual(txnQueueItem.operation, 'create');
    assert.strictEqual(txnQueueItem.userId, 'collector@scrapsetu.demo');
  });

  test('24. Role isolation: non-admin users only see their own queue items', () => {
    enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'collector-A' });
    enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-2', userId: 'collector-B' });
    enqueue({ operation: 'create', entityType: 'offer', entityId: 'OFR-1', userId: 'repair-C' });

    // Collector A only sees their own
    const colAQueue = getQueueForUser('collector-A', 'collector');
    assert.strictEqual(colAQueue.length, 1);
    assert.strictEqual(colAQueue[0].userId, 'collector-A');

    // Admin sees everything
    const adminQueue = getQueueForUser('admin-1', 'admin');
    assert.strictEqual(adminQueue.length, 3);

    // Stats isolation
    const colAStats = getQueueStats('collector-A', 'collector');
    assert.strictEqual(colAStats.total, 1);

    const adminStats = getQueueStats('admin-1', 'admin');
    assert.strictEqual(adminStats.total, 3);
  });

  test('25. Queue persistence across browser refresh: survives localStorage read', () => {
    enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'u1' });
    enqueue({ operation: 'create', entityType: 'offer', entityId: 'OFR-1', userId: 'u1' });
    enqueue({ operation: 'create', entityType: 'transaction', entityId: 'TXN-1', userId: 'u1' });

    // Verify loading fresh from storage
    const freshRead = getQueue();
    assert.strictEqual(freshRead.length, 3);
    assert.strictEqual(freshRead[0].queueId, 'SYNC-0001');
    assert.strictEqual(freshRead[1].queueId, 'SYNC-0002');
    assert.strictEqual(freshRead[2].queueId, 'SYNC-0003');
  });

  test('26. Handover service integration: creates and updates handover with sync queue operations', () => {
    const handover = createHandover({
      transactionId: 'TXN-HAND-0001',
      lotId: 'LOT-0001',
      collectorId: 'collector-001',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      handoverMethod: 'collector_delivers',
    });

    assert.ok(handover.handoverId);
    let queue = getQueue();
    const createItem = queue.find((i) => i.entityType === 'handover' && i.operation === 'create');
    assert.ok(createItem);
    assert.strictEqual(createItem.entityId, handover.handoverId);

    // Confirm by collector triggers update operation
    confirmCollectorHandover(handover.handoverId, 'collector-001');
    queue = getQueue();
    const updateItem = queue.find((i) => i.entityType === 'handover' && i.operation === 'update');
    assert.ok(updateItem);
    assert.strictEqual(updateItem.entityId, handover.handoverId);
  });

  test('27. Payment service integration: records payment and enqueues payment sync operation', () => {
    const payment = createPaymentRecord({
      transactionId: 'TXN-PAY-0001',
      collectorId: 'collector-001',
      buyerId: 'REC-0001',
      amount: 4200,
      paymentMethod: 'Cash',
      referenceNote: 'Cash handed at counter',
    });

    assert.ok(payment.paymentId);
    const queue = getQueue();
    const payItem = queue.find((i) => i.entityType === 'payment' && i.operation === 'create');
    assert.ok(payItem);
    assert.strictEqual(payItem.entityId, payment.paymentId);
    assert.strictEqual(payItem.userId, 'collector-001');
  });

  test('28. Offer service integration: createOffer and acceptOffer enqueue sync operations', () => {
    const offer = createOffer({
      lotId: 'LOT-0001',
      buyerId: 'SHOP-0001',
      buyerName: 'Tech Repairs',
      buyerRole: 'repair',
      materialCategory: 'PCB',
      weight: 10,
      offeredPrice: 350,
    });

    assert.ok(offer.offerId);
    let queue = getQueue();
    const offerCreateItem = queue.find((i) => i.entityType === 'offer' && i.operation === 'create');
    assert.ok(offerCreateItem);
    assert.strictEqual(offerCreateItem.entityId, offer.offerId);

    // Accept offer enqueues update operation
    acceptOffer(offer.offerId, 'LOT-0001');
    queue = getQueue();
    const offerUpdateItem = queue.find((i) => i.entityType === 'offer' && i.operation === 'update');
    assert.ok(offerUpdateItem);
    assert.strictEqual(offerUpdateItem.entityId, offer.offerId);
  });

  test('29. Localization completeness: all Module 10 keys exist in all 8 supported languages', () => {
    const requiredKeys = [
      'syncNow',
      'syncPendingLocal',
      'savedOnDevice',
      'backOnline',
      'syncing',
      'synced',
      'syncFailed',
      'syncMonitor',
    ];

    SUPPORTED_LANGUAGES.forEach((lang) => {
      const dict = STRINGS[lang.code];
      assert.ok(dict, `Language dictionary missing for ${lang.code}`);
      requiredKeys.forEach((key) => {
        assert.ok(
          dict[key] && dict[key].trim().length > 0,
          `Key "${key}" missing or empty in ${lang.code} (${lang.nativeName})`
        );
      });
    });
  });

  test('30. Maintenance operations: clearSynced removes synced items while preserving pending & failed', () => {
    const item1 = enqueue({ operation: 'create', entityType: 'scrap_lot', entityId: 'LOT-1', userId: 'u1' });
    const item2 = enqueue({ operation: 'create', entityType: 'offer', entityId: 'OFR-1', userId: 'u1' });
    const item3 = enqueue({ operation: 'create', entityType: 'transaction', entityId: 'TXN-1', userId: 'u1' });

    updateItemStatus(item1.queueId, SYNC_STATUSES.SYNCED);
    updateItemStatus(item2.queueId, SYNC_STATUSES.FAILED, 'Error');

    const removed = clearSynced();
    assert.strictEqual(removed, 1);

    const remaining = getQueue();
    assert.strictEqual(remaining.length, 2);
    assert.strictEqual(remaining[0].queueId, item2.queueId);
    assert.strictEqual(remaining[1].queueId, item3.queueId);
  });
});
