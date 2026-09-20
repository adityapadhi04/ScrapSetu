/**
 * ScrapSetu — Module 14 Automated Test Suite
 * Pickup Scheduling + Collection Coordination
 *
 * Requirements Tested:
 * 1. Storage initialization & sequential ID generation
 * 2. Pickup request creation & method validation (buyer_pickup & collector_dropoff)
 * 3. Status lifecycle & deterministic transitions (requested -> scheduled -> completed / cancelled)
 * 4. Error rejection on invalid status transitions
 * 5. Collector and Buyer role/ownership isolation
 * 6. Admin pickup metrics aggregation (total, requested, scheduled, completed, cancelled, byMethod, byBuyerRole)
 * 7. Transaction and Handover flow connection without duplicate state
 * 8. Sync queue dispatch with entityType 'pickup'
 * 9. Localization completeness across all 8 languages
 */

import { test, describe, beforeEach } from 'node:test';
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

// Module 14 Services
import {
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
  resetPickups
} from '../src/services/pickupService.js';

import { getQueue } from '../src/services/syncQueueService.js';
import { STRINGS as strings } from '../src/locales/strings.js';

describe('Module 14: Pickup Scheduling + Collection Coordination', () => {

  beforeEach(() => {
    localStorage.clear();
    resetPickups();
  });

  test('1. Storage initialization loads seed pickups with valid PKP-xxxx identifiers', () => {
    const list = getPickups();
    assert.ok(Array.isArray(list), 'Pickups should be an array');
    assert.ok(list.length >= 2, 'Should load initial seed pickups');

    const p1 = list[0];
    assert.ok(p1.pickupId.startsWith('PKP-'), 'ID must start with PKP-');
    assert.ok(VALID_PICKUP_METHODS.includes(p1.method), 'Method must be valid');
    assert.ok(VALID_PICKUP_STATUSES.includes(p1.status), 'Status must be valid');
  });

  test('2. Sequential ID generation produces ordered PKP-xxxx keys', () => {
    const nextId = generatePickupId([
      { pickupId: 'PKP-0001' },
      { pickupId: 'PKP-0004' }
    ]);
    assert.strictEqual(nextId, 'PKP-0005');
  });

  test('3. Method validation accepts only buyer_pickup and collector_dropoff', () => {
    assert.deepStrictEqual(VALID_PICKUP_METHODS, ['buyer_pickup', 'collector_dropoff']);

    assert.throws(() => {
      createPickupRequest({
        transactionId: 'TXN-9999',
        collectorId: 'COL-0001',
        buyerId: 'REC-0001',
        method: 'invalid_method'
      });
    }, /Invalid method/);
  });

  test('4. Creates requested pickup when date/time not yet scheduled', () => {
    const newPkp = createPickupRequest({
      transactionId: 'TXN-0099',
      lotId: 'LOT-0099',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      method: 'buyer_pickup',
      location: 'Near Old Bus Stand, Rayagada'
    });

    assert.strictEqual(newPkp.status, 'requested');
    assert.strictEqual(newPkp.method, 'buyer_pickup');
    assert.strictEqual(newPkp.transactionId, 'TXN-0099');
    assert.strictEqual(newPkp.location, 'Near Old Bus Stand, Rayagada');

    const fetched = getPickupById(newPkp.pickupId);
    assert.ok(fetched);
    assert.strictEqual(fetched.status, 'requested');
  });

  test('5. Prevents duplicate active pickups for the same transaction', () => {
    const first = createPickupRequest({
      transactionId: 'TXN-0077',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'buyer_pickup'
    });

    const second = createPickupRequest({
      transactionId: 'TXN-0077',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'collector_dropoff'
    });

    assert.strictEqual(first.pickupId, second.pickupId, 'Must return existing pickup for the same transaction');
  });

  test('6. Schedule pickup transitions from requested -> scheduled with date and time', () => {
    const pkp = createPickupRequest({
      transactionId: 'TXN-0088',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'collector_dropoff'
    });

    assert.strictEqual(pkp.status, 'requested');

    const scheduled = schedulePickup(pkp.pickupId, {
      scheduledDate: '2026-09-25',
      scheduledTime: '10:30 AM',
      location: 'Facility Gate 2, Rayagada Industrial Estate'
    });

    assert.strictEqual(scheduled.status, 'scheduled');
    assert.strictEqual(scheduled.scheduledDate, '2026-09-25');
    assert.strictEqual(scheduled.scheduledTime, '10:30 AM');
    assert.strictEqual(scheduled.location, 'Facility Gate 2, Rayagada Industrial Estate');
  });

  test('7. Complete pickup transitions from scheduled -> completed', () => {
    const pkp = createPickupRequest({
      transactionId: 'TXN-0066',
      collectorId: 'COL-0001',
      buyerId: 'REP-0001',
      buyerRole: 'repair',
      method: 'collector_dropoff',
      scheduledDate: '2026-09-22',
      scheduledTime: '02:00 PM'
    });

    assert.strictEqual(pkp.status, 'scheduled');

    const completed = completePickup(pkp.pickupId, { notes: 'Material verified and accepted' });
    assert.strictEqual(completed.status, 'completed');
    assert.ok(completed.completedAt, 'Should have completedAt timestamp');
    assert.strictEqual(completed.completionNotes, 'Material verified and accepted');
  });

  test('8. Cancel pickup transitions from requested or scheduled -> cancelled', () => {
    const reqPkp = createPickupRequest({
      transactionId: 'TXN-0055',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'buyer_pickup'
    });

    const cancelled = cancelPickup(reqPkp.pickupId, 'Vehicle unavailable');
    assert.strictEqual(cancelled.status, 'cancelled');
    assert.strictEqual(cancelled.cancellationReason, 'Vehicle unavailable');
    assert.ok(cancelled.cancelledAt);
  });

  test('9. Rejects invalid status transitions strictly', () => {
    // Cannot complete a requested pickup without scheduling first
    const reqPkp = createPickupRequest({
      transactionId: 'TXN-0044',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'buyer_pickup'
    });

    assert.throws(() => {
      completePickup(reqPkp.pickupId);
    }, /Cannot complete pickup from "requested" state/);

    // Schedule and complete it
    schedulePickup(reqPkp.pickupId, { scheduledDate: '2026-09-22', scheduledTime: '11:00 AM' });
    completePickup(reqPkp.pickupId);

    // Cannot cancel a completed pickup
    assert.throws(() => {
      cancelPickup(reqPkp.pickupId, 'Too late');
    }, /Completed pickups cannot be cancelled/);

    // Cannot re-schedule a completed pickup
    assert.throws(() => {
      schedulePickup(reqPkp.pickupId, { scheduledDate: '2026-09-23' });
    }, /Cannot schedule pickup in "completed" state/);
  });

  test('10. Enforces Collector and Buyer role/ownership isolation', () => {
    const c1Pickups = getPickupsByCollector('usr-collector-01');
    assert.ok(c1Pickups.length > 0);
    assert.ok(c1Pickups.every((p) => p.collectorId === 'usr-collector-01'));

    const cUnknownPickups = getPickupsByCollector('COL-9999');
    assert.strictEqual(cUnknownPickups.length, 0);

    const r1Pickups = getPickupsByBuyer('REC-0001');
    assert.ok(r1Pickups.length > 0);
    assert.ok(r1Pickups.every((p) => p.buyerId === 'REC-0001'));

    const repairPickups = getPickupsByBuyer(null, 'repair');
    assert.ok(repairPickups.every((p) => p.buyerRole === 'repair'));
  });

  test('11. Admin pickup statistics accurately reflect current counts and breakdowns', () => {
    const stats = getPickupStats();
    assert.ok(typeof stats.total === 'number');
    assert.ok(typeof stats.requested === 'number');
    assert.ok(typeof stats.scheduled === 'number');
    assert.ok(typeof stats.completed === 'number');
    assert.ok(typeof stats.cancelled === 'number');
    assert.strictEqual(stats.pending, stats.requested + stats.scheduled);
    assert.strictEqual(
      stats.total,
      stats.requested + stats.scheduled + stats.completed + stats.cancelled
    );
    assert.ok(stats.byMethod.buyer_pickup >= 0);
    assert.ok(stats.byMethod.collector_dropoff >= 0);
  });

  test('12. Connects pickup updates to existing transaction and handover entities', () => {
    // Setup dummy transaction and handover in localStorage
    const testTx = {
      transactionId: 'TXN-9001',
      transactionStatus: 'created',
      lotId: 'LOT-9001',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      buyerRole: 'recycler'
    };
    localStorage.setItem('scrapsetu_transactions', JSON.stringify([testTx]));

    const testHandover = {
      handoverId: 'HAND-9001',
      transactionId: 'TXN-9001',
      handoverStatus: 'pending',
      collectorConfirmed: false,
      buyerConfirmed: false
    };
    localStorage.setItem('scrapsetu_handovers', JSON.stringify([testHandover]));

    // Schedule pickup
    const pkp = createPickupRequest({
      transactionId: 'TXN-9001',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'buyer_pickup',
      scheduledDate: '2026-09-24',
      scheduledTime: '03:00 PM'
    });

    const txAfterSchedule = JSON.parse(localStorage.getItem('scrapsetu_transactions'))[0];
    assert.strictEqual(txAfterSchedule.pickupStatus, 'scheduled');
    assert.strictEqual(txAfterSchedule.transactionStatus, 'handover_pending');

    // Complete pickup
    completePickup(pkp.pickupId, { notes: 'Delivered safely' }, { userId: 'REC-0001' });

    const txAfterComplete = JSON.parse(localStorage.getItem('scrapsetu_transactions'))[0];
    assert.strictEqual(txAfterComplete.pickupStatus, 'completed');

    const handoverAfterComplete = JSON.parse(localStorage.getItem('scrapsetu_handovers'))[0];
    assert.strictEqual(handoverAfterComplete.buyerConfirmed, true);
    assert.strictEqual(handoverAfterComplete.handoverStatus, 'buyer_confirmed');
  });

  test('13. Enqueues non-seed operations to Module 10 sync queue with entityType pickup', () => {
    const queueBefore = getQueue().length;
    createPickupRequest({
      transactionId: 'TXN-8888',
      collectorId: 'COL-0001',
      buyerId: 'REC-0001',
      method: 'buyer_pickup'
    }, { id: 'COL-0001' });

    const queueAfter = getQueue();
    assert.ok(queueAfter.length > queueBefore, 'Sync queue should have new entry');
    const lastItem = queueAfter[queueAfter.length - 1];
    assert.strictEqual(lastItem.entityType, 'pickup');
  });

  test('14. Module 14 visible strings exist across all 8 supported languages', () => {
    const expectedKeys = [
      'pickupCoordination',
      'pickupCoordinationSubtitle',
      'schedulePickup',
      'pickupMethod',
      'buyerPickup',
      'collectorDropoff',
      'scheduledDate',
      'scheduledTime',
      'pickupLocation',
      'pickupNotes',
      'pickupStatus',
      'markPickupCompleted',
      'confirmPickupSchedule',
      'cancelPickup',
      'pickupCompleted',
      'pickupScheduled',
      'pickupRequested',
      'pickupCancelled',
      'noPickupsFound'
    ];

    const supportedLangs = ['en', 'hi', 'or', 'bn', 'mr', 'te', 'ta', 'gu'];
    for (const lang of supportedLangs) {
      assert.ok(strings[lang], `Language pack "${lang}" must exist`);
      for (const key of expectedKeys) {
        assert.ok(
          strings[lang][key] && strings[lang][key].trim().length > 0,
          `String key "${key}" missing or empty in language "${lang}"`
        );
      }
    }
  });
});
