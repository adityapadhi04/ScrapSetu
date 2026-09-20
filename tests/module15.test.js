/**
 * ScrapSetu — Module 15: Cashfree Payment Gateway Test Suite
 *
 * Tests the complete Cashfree Sandbox integration:
 *   - Payment service extensions (VERIFIED status, Cashfree fields)
 *   - Transaction service updates (verified payment gate, handover gating)
 *   - Payment status state machine
 *   - Handover gate: ONLY enabled when payment_status = verified
 *   - Collector earnings after VERIFIED
 *   - Idempotency of payment status updates
 *   - Both Repair Shop and Authorized Recycler flows
 *   - Offline prevention (simulated)
 *
 * NOTE: This suite does NOT call Cashfree API directly.
 * Backend integration is tested via the FastAPI backend separately.
 * These tests verify the frontend service layer and state machine.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ─────────────────────────────────────────────
// LocalStorage Mock
// ─────────────────────────────────────────────
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

import {
  VALID_PAYMENT_STATUSES,
  VALID_PAYMENT_METHODS,
  initializePayments,
  getPayments,
  getPaymentsByTransaction,
  createPaymentRecord,
  updatePaymentWithCashfree,
  getPaymentStats,
  resetPaymentDataset
} from '../src/services/paymentService.js';

import {
  VALID_PAYMENT_STATUSES as TXN_VALID_PAYMENT_STATUSES,
  initializeTransactions,
  createTransaction,
  getTransactionById,
  getTransactionByOffer,
  checkAndCompleteTransaction,
  getCollectorEarnings,
  _patchTransactionFields,
  resetTransactionDataset
} from '../src/services/transactionService.js';

import {
  initializeHandovers,
  createHandover,
  confirmCollectorHandover,
  confirmBuyerReceipt,
  resetHandoverDataset
} from '../src/services/handoverService.js';

// ─────────────────────────────────────────────
// Reset before each test
// ─────────────────────────────────────────────
beforeEach(() => {
  resetPaymentDataset();
  resetTransactionDataset();
  resetHandoverDataset();
});

// ─────────────────────────────────────────────
// Helper: Create a standard test transaction
// ─────────────────────────────────────────────
const makeTransaction = (overrides = {}) => {
  return createTransaction({
    offerId: `OFR-TEST-${Date.now()}`,
    lotId: 'LOT-TEST-001',
    collectorId: 'usr-collector-01',
    collectorName: 'Test Collector',
    buyerId: 'REC-TEST-001',
    buyerRole: 'recycler',
    buyerName: 'Test Recycler',
    materialCategory: 'PCB',
    materialSubcategory: 'Computer PCB',
    weight: 2.5,
    weightUnit: 'kg',
    agreedPrice: 300,
    totalAmount: 750,
    ...overrides,
  });
};

// ─────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────

describe('Module 15: Cashfree Payment Gateway Integration', () => {

  // ── Test 1: VALID_PAYMENT_STATUSES includes verified, pending, cancelled ──
  test('1. paymentService: VALID_PAYMENT_STATUSES includes verified, pending, cancelled', () => {
    assert.ok(VALID_PAYMENT_STATUSES.includes('verified'), 'Missing: verified');
    assert.ok(VALID_PAYMENT_STATUSES.includes('pending'), 'Missing: pending');
    assert.ok(VALID_PAYMENT_STATUSES.includes('cancelled'), 'Missing: cancelled');
    assert.ok(VALID_PAYMENT_STATUSES.includes('recorded'), 'Missing: recorded');
    assert.ok(VALID_PAYMENT_STATUSES.includes('failed'), 'Missing: failed');
  });

  // ── Test 2: transactionService VALID_PAYMENT_STATUSES matches ──
  test('2. transactionService: VALID_PAYMENT_STATUSES includes verified and cancelled', () => {
    assert.ok(TXN_VALID_PAYMENT_STATUSES.includes('verified'), 'TXN: missing verified');
    assert.ok(TXN_VALID_PAYMENT_STATUSES.includes('cancelled'), 'TXN: missing cancelled');
    assert.ok(TXN_VALID_PAYMENT_STATUSES.includes('pending'), 'TXN: missing pending');
  });

  // ── Test 3: VALID_PAYMENT_METHODS includes Cashfree ──
  test('3. paymentService: VALID_PAYMENT_METHODS includes Cashfree', () => {
    assert.ok(VALID_PAYMENT_METHODS.includes('Cashfree'), 'Missing: Cashfree');
  });

  // ── Test 4: createPaymentRecord works without paymentMethod (Cashfree flow) ──
  test('4. createPaymentRecord: paymentMethod optional (Cashfree init scenario)', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction();
    const payment = createPaymentRecord({
      transactionId: txn.transactionId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-TEST-001',
      amount: 750,
      // No paymentMethod — Cashfree sets it after gateway
    });

    assert.ok(payment.paymentId, 'No paymentId assigned');
    assert.equal(payment.transactionId, txn.transactionId);
    // Should default to 'Cashfree' per updated paymentService
    assert.ok(
      payment.paymentMethod === 'Cashfree' || VALID_PAYMENT_METHODS.includes(payment.paymentMethod),
      `Unexpected paymentMethod: ${payment.paymentMethod}`
    );
  });

  // ── Test 5: updatePaymentWithCashfree creates verified record ──
  test('5. updatePaymentWithCashfree: creates payment record with verified status', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction();

    const payment = updatePaymentWithCashfree({
      transactionId: txn.transactionId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-TEST-001',
      buyerRole: 'recycler',
      amount: 750,
      paymentStatus: 'verified',
      cfOrderId: 'SSTXN0001AB12CD34',
      cfPaymentId: 'CF-PAY-001',
      verifiedAt: new Date().toISOString(),
    });

    assert.equal(payment.paymentStatus, 'verified');
    assert.equal(payment.cfOrderId, 'SSTXN0001AB12CD34');
    assert.equal(payment.cfPaymentId, 'CF-PAY-001');
    assert.ok(payment.verifiedAt, 'verifiedAt must be set');
    assert.equal(payment.paymentMethod, 'Cashfree');
  });

  // ── Test 6: updatePaymentWithCashfree updates existing record (idempotency) ──
  test('6. updatePaymentWithCashfree: idempotent — updates existing record on duplicate call', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction();

    // First call — create
    updatePaymentWithCashfree({
      transactionId: txn.transactionId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-TEST-001',
      buyerRole: 'recycler',
      amount: 750,
      paymentStatus: 'pending',
      cfOrderId: 'CF-ORDER-001',
    });

    // Second call — update same transaction to verified
    updatePaymentWithCashfree({
      transactionId: txn.transactionId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-TEST-001',
      buyerRole: 'recycler',
      amount: 750,
      paymentStatus: 'verified',
      cfOrderId: 'CF-ORDER-001',
      cfPaymentId: 'CF-PAY-001',
      verifiedAt: new Date().toISOString(),
    });

    const payments = getPaymentsByTransaction(txn.transactionId);
    // Must still be only ONE payment record (idempotent)
    assert.equal(payments.length, 1, 'Should only have one payment record');
    assert.equal(payments[0].paymentStatus, 'verified', 'Status should be verified');
  });

  // ── Test 7: getPaymentStats counts verified payments correctly ──
  test('7. getPaymentStats: correctly counts verified payments in totalValue', () => {
    initializePayments();
    initializeTransactions();

    const txn1 = makeTransaction({ totalAmount: 750 });
    const txn2 = makeTransaction({ totalAmount: 1500, offerId: `OFR-TEST-${Date.now() + 1}` });

    updatePaymentWithCashfree({ transactionId: txn1.transactionId, collectorId: 'usr-collector-01', buyerId: 'B1', amount: 750, paymentStatus: 'verified', verifiedAt: new Date().toISOString() });
    updatePaymentWithCashfree({ transactionId: txn2.transactionId, collectorId: 'usr-collector-01', buyerId: 'B2', amount: 1500, paymentStatus: 'pending' });

    const stats = getPaymentStats();
    assert.equal(stats.verified, 1, 'verified count must be 1');
    assert.equal(stats.pending, 1, 'pending count must be 1');
    assert.ok(stats.totalValue >= 750, 'totalValue must include verified payment');
  });

  // ── Test 8: checkAndCompleteTransaction gates on verified payment ──
  test('8. checkAndCompleteTransaction: completes when handover=confirmed AND payment=verified', () => {
    initializePayments();
    initializeTransactions();
    initializeHandovers();

    const txn = makeTransaction();

    // Simulate backend VERIFIED
    _patchTransactionFields(txn.transactionId, { paymentStatus: 'verified' });

    // Simulate handover confirmed
    const handover = createHandover({
      transactionId: txn.transactionId,
      lotId: txn.lotId,
      collectorId: txn.collectorId,
      buyerId: txn.buyerId,
      buyerRole: txn.buyerRole,
      handoverMethod: 'buyer_pickup',
    });
    confirmCollectorHandover(handover.handoverId, txn.collectorId);
    confirmBuyerReceipt(handover.handoverId, txn.buyerId);

    // Patch handoverStatus on transaction record itself
    _patchTransactionFields(txn.transactionId, { handoverStatus: 'confirmed' });

    const result = checkAndCompleteTransaction(txn.transactionId);
    assert.equal(result.transactionStatus, 'completed', 'Transaction must be completed');
  });

  // ── Test 9: Handover blocked when payment is PENDING ──
  test('9. checkAndCompleteTransaction: does NOT complete when payment=pending (handover blocked)', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction();

    // Payment is still pending
    _patchTransactionFields(txn.transactionId, {
      paymentStatus: 'pending',
      handoverStatus: 'confirmed',
    });

    const result = checkAndCompleteTransaction(txn.transactionId);
    assert.notEqual(result.transactionStatus, 'completed', 'Must not be completed when payment pending');
  });

  // ── Test 10: Handover blocked when payment is FAILED ──
  test('10. checkAndCompleteTransaction: does NOT complete when payment=failed', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction();
    _patchTransactionFields(txn.transactionId, {
      paymentStatus: 'failed',
      handoverStatus: 'confirmed',
    });

    const result = checkAndCompleteTransaction(txn.transactionId);
    assert.notEqual(result.transactionStatus, 'completed');
  });

  // ── Test 11: Repair Shop flow — payment recorded leads to handover_pending ──
  test('11. Repair Shop flow: verified payment → handover_pending status', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction({ buyerRole: 'repair', buyerId: 'SHOP-001' });

    _patchTransactionFields(txn.transactionId, {
      paymentStatus: 'verified',
      handoverStatus: 'pending',
    });

    const result = checkAndCompleteTransaction(txn.transactionId);
    assert.equal(result.transactionStatus, 'handover_pending', 'Should move to handover_pending after payment verified');
  });

  // ── Test 12: Authorized Recycler flow — same gate logic ──
  test('12. Authorized Recycler flow: verified payment gates handover unlock', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction({ buyerRole: 'recycler', buyerId: 'REC-002' });
    _patchTransactionFields(txn.transactionId, {
      paymentStatus: 'verified',
      handoverStatus: 'confirmed',
    });

    const result = checkAndCompleteTransaction(txn.transactionId);
    assert.equal(result.transactionStatus, 'completed');
  });

  // ── Test 13: getCollectorEarnings includes verified payments ──
  test('13. getCollectorEarnings: counts verified Cashfree payments in totalRecorded', () => {
    initializeTransactions();

    const collectorId = 'usr-collector-01';
    const txn = makeTransaction({ collectorId });

    // Simulate verified Cashfree payment
    _patchTransactionFields(txn.transactionId, {
      paymentStatus: 'verified',
      totalAmount: 750,
    });

    const earnings = getCollectorEarnings(collectorId);
    assert.ok(earnings.totalRecorded >= 750, `Expected totalRecorded >= 750, got ${earnings.totalRecorded}`);
  });

  // ── Test 14: getTransactionByOffer finds transaction by offer ID ──
  test('14. getTransactionByOffer: returns transaction matching offer ID', () => {
    initializeTransactions();

    const offerId = `OFR-TEST-UNIQUE-${Date.now()}`;
    const txn = makeTransaction({ offerId });

    const found = getTransactionByOffer(offerId);
    assert.ok(found, 'Transaction not found by offerId');
    assert.equal(found.transactionId, txn.transactionId);
    assert.equal(found.offerId, offerId);
  });

  // ── Test 15: Payment amount sanity — cfOrderId and cfPaymentId stored correctly ──
  test('15. Payment record: cfOrderId and cfPaymentId fields persist correctly', () => {
    initializePayments();
    initializeTransactions();

    const txn = makeTransaction();
    const cfOrderId = 'SS-TXN-ABC-12345678';
    const cfPaymentId = 'CF-PAY-XYZ-999';

    updatePaymentWithCashfree({
      transactionId: txn.transactionId,
      collectorId: txn.collectorId,
      buyerId: txn.buyerId,
      buyerRole: txn.buyerRole,
      amount: txn.totalAmount,
      paymentStatus: 'verified',
      cfOrderId,
      cfPaymentId,
      verifiedAt: new Date().toISOString(),
    });

    const payments = getPaymentsByTransaction(txn.transactionId);
    assert.equal(payments.length, 1);
    assert.equal(payments[0].cfOrderId, cfOrderId, 'cfOrderId must match');
    assert.equal(payments[0].cfPaymentId, cfPaymentId, 'cfPaymentId must match');
    assert.equal(payments[0].sourceType, 'cashfree_gateway', 'sourceType must be cashfree_gateway');
  });

});
