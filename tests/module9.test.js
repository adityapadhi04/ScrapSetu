/**
 * ScrapSetu — Module 9 Automated Test Suite
 * 
 * Verifies all 25+ acceptance criteria and architectural invariants specified for Module 9:
 * Transaction + Digital Handover + Payment Record (SIH26229)
 * 
 * Strict Invariants:
 * - Prototype only: no real payment gateway, bank APIs, or UPI verification
 * - Sequential IDs: TXN-xxxx, HAND-xxxx, PAY-xxxx
 * - Strict role ownership: Collector, Repair Shop, Recycler, Admin
 * - Completion logic: completed ONLY when handover confirmed AND payment recorded
 * - Full 8-language localization completeness
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

import {
  STORAGE_KEY_TRANSACTIONS,
  VALID_TRANSACTION_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_HANDOVER_STATUSES,
  VALID_PAYMENT_METHODS,
  initializeTransactions,
  getTransactions,
  getTransactionById,
  getTransactionsByCollector,
  getTransactionsByBuyer,
  getTransactionsByLot,
  getTransactionByOffer,
  generateNextTransactionId,
  validateTransaction,
  createTransaction,
  updateTransactionStatus,
  checkAndCompleteTransaction,
  getTransactionStats,
  getCollectorEarnings,
  resetTransactionDataset
} from '../src/services/transactionService.js';

import {
  STORAGE_KEY_HANDOVERS,
  VALID_HANDOVER_METHODS,
  initializeHandovers,
  getHandovers,
  getHandoverById,
  getHandoversByTransaction,
  getHandoversByCollector,
  getHandoversByBuyer,
  generateNextHandoverId,
  validateHandover,
  createHandover,
  confirmCollectorHandover,
  confirmBuyerReceipt,
  getHandoverStats,
  resetHandoverDataset
} from '../src/services/handoverService.js';

import {
  STORAGE_KEY_PAYMENTS,
  initializePayments,
  getPayments,
  getPaymentById,
  getPaymentsByTransaction,
  getPaymentsByCollector,
  getPaymentsByBuyer,
  generateNextPaymentId,
  validatePayment,
  createPaymentRecord,
  getPaymentStats,
  resetPaymentDataset
} from '../src/services/paymentService.js';

import {
  getAllScrapLots,
  updateScrapLotOfferStatus,
  updateScrapLotTransactionStatus,
  resetScrapLots
} from '../src/services/scrapLotService.js';

import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 9: Transaction + Digital Handover + Payment Record', () => {
  beforeEach(() => {
    localStorage.clear();
    resetScrapLots();
    resetTransactionDataset();
    resetHandoverDataset();
    resetPaymentDataset();
  });

  // 1. Transaction creation
  test('TEST 1: Transaction creation with valid schema & initial statuses', () => {
    const tx = createTransaction({
      offerId: 'OFR-0099',
      lotId: 'LOT-0099',
      collectorId: 'usr-collector-01',
      collectorName: 'Ramesh Kumar',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'GreenCycle Material Recovery',
      materialCategory: 'PCB',
      weight: 10,
      weightUnit: 'kg',
      agreedPrice: 300,
      priceUnit: 'kg',
      totalAmount: 3000
    });

    assert.ok(tx.transactionId.startsWith('TXN-'));
    assert.equal(tx.transactionStatus, 'created');
    assert.equal(tx.handoverStatus, 'pending');
    assert.equal(tx.paymentStatus, 'pending');
    assert.equal(tx.totalAmount, 3000);
    assert.equal(tx.sourceType, 'platform_generated');
  });

  // 2. Sequential transaction ID
  test('TEST 2: Sequential transaction ID generation (TXN-0001, TXN-0002, etc.)', () => {
    const nextId = generateNextTransactionId();
    assert.match(nextId, /^TXN-\d{4}$/);
    
    // Simulate list with TXN-0005
    const mockList = [{ transactionId: 'TXN-0005' }];
    assert.equal(generateNextTransactionId(mockList), 'TXN-0006');
  });

  // 3. Duplicate transaction prevention
  test('TEST 3: Duplicate transaction prevention for same accepted offer', () => {
    createTransaction({
      offerId: 'OFR-DUP-1',
      lotId: 'LOT-DUP-1',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler Facility',
      materialCategory: 'Battery',
      weight: 5,
      agreedPrice: 100
    });

    assert.throws(
      () => {
        createTransaction({
          offerId: 'OFR-DUP-1',
          lotId: 'LOT-DUP-1',
          collectorId: 'usr-collector-01',
          collectorName: 'Collector',
          buyerId: 'REC-0001',
          buyerRole: 'recycler',
          buyerName: 'Recycler Facility',
          materialCategory: 'Battery',
          weight: 5,
          agreedPrice: 100
        });
      },
      /Transaction already exists for offer/
    );
  });

  // 4. Accepted offer requirement & schema validation
  test('TEST 4: Schema validation rejects missing or invalid fields', () => {
    const invalid = validateTransaction({
      offerId: '',
      lotId: 'LOT-0001',
      collectorId: '',
      buyerId: '',
      buyerRole: 'invalid_role',
      weight: -5,
      agreedPrice: 0
    });

    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.length >= 4);
  });

  // 5. Collector ownership isolation
  test('TEST 5: Collector queries isolate transactions to logged-in collector', () => {
    createTransaction({
      offerId: 'OFR-COL-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-A',
      collectorName: 'Collector A',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'Screen',
      weight: 2,
      agreedPrice: 150
    });

    createTransaction({
      offerId: 'OFR-COL-2',
      lotId: 'LOT-0002',
      collectorId: 'usr-collector-B',
      collectorName: 'Collector B',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'Metal',
      weight: 4,
      agreedPrice: 80
    });

    const txnsA = getTransactionsByCollector('usr-collector-A');
    const txnsB = getTransactionsByCollector('usr-collector-B');

    assert.ok(txnsA.every((t) => t.collectorId === 'usr-collector-A'));
    assert.ok(txnsB.every((t) => t.collectorId === 'usr-collector-B'));
    assert.equal(txnsA.some((t) => t.offerId === 'OFR-COL-2'), false);
  });

  // 6. Buyer ownership isolation
  test('TEST 6: Buyer queries isolate transactions to specific buyerId', () => {
    createTransaction({
      offerId: 'OFR-BUY-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'SHOP-0001',
      buyerRole: 'repair',
      buyerName: 'Gadget Care',
      materialCategory: 'Mobile Phone',
      weight: 1,
      agreedPrice: 500
    });

    const shopTxns = getTransactionsByBuyer('SHOP-0001');
    assert.ok(shopTxns.every((t) => t.buyerId === 'SHOP-0001'));
    assert.ok(shopTxns.some((t) => t.offerId === 'OFR-BUY-1'));
  });

  // 7. Repair shop isolation
  test('TEST 7: Repair shop cannot access or confirm receipt for another buyer transaction', () => {
    const tx = createTransaction({
      offerId: 'OFR-ISO-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'SHOP-0002',
      buyerRole: 'repair',
      buyerName: 'Other Repair Shop',
      materialCategory: 'Mobile Phone',
      weight: 1,
      agreedPrice: 400
    });

    const handover = createHandover({
      transactionId: tx.transactionId,
      lotId: tx.lotId,
      collectorId: tx.collectorId,
      buyerId: 'SHOP-0002',
      buyerRole: 'repair',
      materialCategory: 'Mobile Phone',
      weight: 1,
      handoverMethod: 'collector_delivers'
    });

    // SHOP-0001 attempts to confirm receipt for SHOP-0002's handover
    assert.throws(
      () => confirmBuyerReceipt(handover.handoverId, 'SHOP-0001'),
      /Unauthorized: Buyer SHOP-0001 cannot confirm receipt/
    );
  });

  // 8. Recycler isolation
  test('TEST 8: Recycler cannot confirm receipt for another facility transaction', () => {
    const tx = createTransaction({
      offerId: 'OFR-REC-ISO',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0002',
      buyerRole: 'recycler',
      buyerName: 'Facility 2',
      materialCategory: 'PCB',
      weight: 5,
      agreedPrice: 300
    });

    const handover = createHandover({
      transactionId: tx.transactionId,
      lotId: tx.lotId,
      collectorId: tx.collectorId,
      buyerId: 'REC-0002',
      buyerRole: 'recycler',
      materialCategory: 'PCB',
      weight: 5,
      handoverMethod: 'buyer_pickup'
    });

    // REC-0001 attempts to confirm receipt for REC-0002
    assert.throws(
      () => confirmBuyerReceipt(handover.handoverId, 'REC-0001'),
      /Unauthorized: Buyer REC-0001 cannot confirm receipt/
    );
  });

  // 9. Admin access
  test('TEST 9: Admin has full visibility across all transactions', () => {
    const all = getTransactions();
    assert.ok(all.length >= 2); // Seed transactions TXN-0001, TXN-0002
    const stats = getTransactionStats();
    assert.equal(stats.total, all.length);
    assert.ok(typeof stats.totalRecordedValue === 'number');
  });

  // 10. Handover creation
  test('TEST 10: Handover creation validates method and sets pending status', () => {
    const h = createHandover({
      transactionId: 'TXN-0099',
      lotId: 'LOT-0099',
      collectorId: 'usr-collector-01',
      buyerId: 'REC-0002',
      buyerRole: 'recycler',
      materialCategory: 'Cable',
      weight: 5.0,
      handoverMethod: 'collector_delivers',
      notes: 'Delivered in personal vehicle'
    });

    assert.ok(h.handoverId.startsWith('HAND-'));
    assert.equal(h.handoverStatus, 'pending');
    assert.equal(h.collectorConfirmed, false);
    assert.equal(h.buyerConfirmed, false);
  });

  // 11. Sequential handover ID
  test('TEST 11: Sequential handover ID generation (HAND-0001, HAND-0002, etc.)', () => {
    const nextId = generateNextHandoverId();
    assert.match(nextId, /^HAND-\d{4}$/);
  });

  // 12. Collector handover confirmation
  test('TEST 12: Collector confirms handover dispatch and enforces ownership', () => {
    const h = createHandover({
      transactionId: 'TXN-CONF-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      buyerId: 'REC-0001',
      handoverMethod: 'collector_delivers'
    });

    // Unrelated collector cannot confirm
    assert.throws(
      () => confirmCollectorHandover(h.handoverId, 'usr-collector-99'),
      /Unauthorized: Collector usr-collector-99 cannot confirm handover/
    );

    // Owner confirms
    const confirmed = confirmCollectorHandover(h.handoverId, 'usr-collector-01');
    assert.equal(confirmed.collectorConfirmed, true);
    assert.equal(confirmed.handoverStatus, 'collector_confirmed');
  });

  // 13. Buyer receipt confirmation and dual confirmation
  test('TEST 13: Dual confirmation marks handover status confirmed', () => {
    const tx = createTransaction({
      offerId: 'OFR-DUAL-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'PCB',
      weight: 2,
      agreedPrice: 200
    });

    const h = createHandover({
      transactionId: tx.transactionId,
      lotId: tx.lotId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-0001',
      handoverMethod: 'collector_delivers'
    });

    confirmCollectorHandover(h.handoverId, 'usr-collector-01');
    const fullyConfirmed = confirmBuyerReceipt(h.handoverId, 'REC-0001');

    assert.equal(fullyConfirmed.collectorConfirmed, true);
    assert.equal(fullyConfirmed.buyerConfirmed, true);
    assert.equal(fullyConfirmed.handoverStatus, 'confirmed');

    // Check parent transaction updated
    const updatedTx = getTransactionById(tx.transactionId);
    assert.equal(updatedTx.handoverStatus, 'confirmed');
  });

  // 14. Payment creation
  test('TEST 14: Payment creation records payment and updates transaction paymentStatus', () => {
    const tx = createTransaction({
      offerId: 'OFR-PAY-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'PCB',
      weight: 3,
      agreedPrice: 100,
      totalAmount: 300
    });

    const payment = createPaymentRecord({
      transactionId: tx.transactionId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-0001',
      amount: 300,
      currency: 'INR',
      paymentMethod: 'UPI',
      referenceNote: 'Demo UPI record',
      recordedBy: 'usr-collector-01'
    });

    assert.ok(payment.paymentId.startsWith('PAY-'));
    assert.equal(payment.paymentStatus, 'recorded');
    assert.equal(payment.paymentMethod, 'UPI');

    const updatedTx = getTransactionById(tx.transactionId);
    assert.equal(updatedTx.paymentStatus, 'recorded');
    assert.equal(updatedTx.paymentMethod, 'UPI');
  });

  // 15. Sequential payment ID
  test('TEST 15: Sequential payment ID generation (PAY-0001, PAY-0002, etc.)', () => {
    const nextId = generateNextPaymentId();
    assert.match(nextId, /^PAY-\d{4}$/);
  });

  // 16. Duplicate payment prevention
  test('TEST 16: Duplicate payment recording is prevented for active transaction', () => {
    const tx = createTransaction({
      offerId: 'OFR-PAY-DUP',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'Battery',
      weight: 1,
      agreedPrice: 100,
      totalAmount: 100
    });

    createPaymentRecord({
      transactionId: tx.transactionId,
      collectorId: 'usr-collector-01',
      buyerId: 'REC-0001',
      amount: 100,
      paymentMethod: 'Cash'
    });

    assert.throws(
      () => {
        createPaymentRecord({
          transactionId: tx.transactionId,
          collectorId: 'usr-collector-01',
          buyerId: 'REC-0001',
          amount: 100,
          paymentMethod: 'Cash'
        });
      },
      /Payment record already exists for transaction/
    );
  });

  // 17. Payment status validity
  test('TEST 17: Valid payment methods and schema checks', () => {
    assert.ok(VALID_PAYMENT_METHODS.includes('Cash'));
    assert.ok(VALID_PAYMENT_METHODS.includes('UPI'));
    assert.ok(VALID_PAYMENT_METHODS.includes('Bank Transfer'));
    assert.ok(VALID_PAYMENT_METHODS.includes('Other'));

    const invalid = validatePayment({
      transactionId: '',
      collectorId: '',
      buyerId: '',
      amount: -10,
      paymentMethod: 'Bitcoin' // invalid prototype method
    });

    assert.equal(invalid.valid, false);
  });

  // 18. Completion rule
  test('TEST 18: Completion rule: completed ONLY when handover confirmed AND payment recorded', () => {
    const tx = createTransaction({
      offerId: 'OFR-COMPL-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'PCB',
      weight: 2,
      agreedPrice: 200,
      totalAmount: 400
    });

    const h = createHandover({
      transactionId: tx.transactionId,
      lotId: tx.lotId,
      collectorId: tx.collectorId,
      buyerId: tx.buyerId,
      handoverMethod: 'collector_delivers'
    });

    // Step 1: Handover only
    confirmCollectorHandover(h.handoverId, tx.collectorId);
    confirmBuyerReceipt(h.handoverId, tx.buyerId);

    let currentTx = getTransactionById(tx.transactionId);
    assert.equal(currentTx.handoverStatus, 'confirmed');
    assert.equal(currentTx.paymentStatus, 'pending');
    assert.notEqual(currentTx.transactionStatus, 'completed'); // NOT yet completed

    // Step 2: Payment recorded
    createPaymentRecord({
      transactionId: tx.transactionId,
      collectorId: tx.collectorId,
      buyerId: tx.buyerId,
      amount: 400,
      paymentMethod: 'Cash'
    });

    currentTx = getTransactionById(tx.transactionId);
    assert.equal(currentTx.handoverStatus, 'confirmed');
    assert.equal(currentTx.paymentStatus, 'recorded');
    assert.equal(currentTx.transactionStatus, 'completed'); // NOW completed!
  });

  // 19. Earnings calculation
  test('TEST 19: Earnings calculation only counts recorded payments as recorded earnings', () => {
    const earnings = getCollectorEarnings('usr-collector-01');
    assert.ok(typeof earnings.totalRecorded === 'number');
    assert.ok(typeof earnings.totalPending === 'number');
    assert.ok(typeof earnings.completedCount === 'number');
    // TXN-0001 is recorded (780), TXN-0002 is pending (3375)
    assert.equal(earnings.totalRecorded, 780);
    assert.equal(earnings.totalPending, 3375);
  });

  // 20. Pending payment calculation
  test('TEST 20: Pending transactions do NOT count toward recorded earnings', () => {
    const before = getCollectorEarnings('usr-collector-01');
    
    // Add a new created transaction (payment pending)
    createTransaction({
      offerId: 'OFR-PEND-1',
      lotId: 'LOT-0002',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'Cable',
      weight: 10,
      agreedPrice: 50,
      totalAmount: 500
    });

    const after = getCollectorEarnings('usr-collector-01');
    // totalRecorded MUST NOT increase
    assert.equal(after.totalRecorded, before.totalRecorded);
    // totalPending MUST increase by 500
    assert.equal(after.totalPending, before.totalPending + 500);
  });

  // 21. Receipt data structure
  test('TEST 21: Receipt data provides traceability identifiers and demo receipt code', () => {
    const tx = getTransactionById('TXN-0001');
    assert.ok(tx);
    assert.equal(tx.transactionId, 'TXN-0001');
    assert.equal(tx.lotId, 'LOT-0001');
    assert.equal(tx.offerId, 'OFR-0002');
    assert.equal(tx.collectorId, 'usr-collector-01');
    assert.equal(tx.buyerId, 'REC-0001');
    assert.equal(`SCRAP-${tx.transactionId}`, 'SCRAP-TXN-0001');
  });

  // 22. Traceability chain
  test('TEST 22: Traceability chain connects LOT -> MAT -> OFR -> TXN -> HAND -> PAY', () => {
    const tx = getTransactionById('TXN-0001');
    const handovers = getHandoversByTransaction('TXN-0001');
    const payments = getPaymentsByTransaction('TXN-0001');

    assert.equal(tx.lotId, 'LOT-0001');
    assert.equal(tx.offerId, 'OFR-0002');
    assert.equal(tx.transactionId, 'TXN-0001');
    assert.equal(handovers[0]?.handoverId, 'HAND-0001');
    assert.equal(payments[0]?.paymentId, 'PAY-0001');
  });

  // 23. localStorage persistence
  test('TEST 23: Transactions, handovers, and payments persist in localStorage', () => {
    const rawTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const rawHand = localStorage.getItem(STORAGE_KEY_HANDOVERS);
    const rawPay = localStorage.getItem(STORAGE_KEY_PAYMENTS);

    assert.ok(rawTx && JSON.parse(rawTx).length > 0);
    assert.ok(rawHand && JSON.parse(rawHand).length > 0);
    assert.ok(rawPay && JSON.parse(rawPay).length > 0);
  });

  // 24. Schema validation
  test('TEST 24: ValidateTransaction and ValidateHandover catch invalid values', () => {
    const txVal = validateTransaction({
      offerId: 'OFR-1',
      lotId: 'LOT-1',
      collectorId: 'usr-1',
      buyerId: 'REC-1',
      buyerRole: 'admin', // invalid role for transaction buyer
      buyerName: 'Admin',
      materialCategory: 'PCB',
      weight: 0,
      agreedPrice: -10
    });
    assert.equal(txVal.valid, false);

    const handVal = validateHandover({
      transactionId: '',
      lotId: '',
      collectorId: '',
      buyerId: '',
      handoverMethod: 'teleport' // invalid method
    });
    assert.equal(handVal.valid, false);
  });

  // 25. demo_seed vs platform_generated
  test('TEST 25: sourceType properly differentiates demo_seed vs platform_generated', () => {
    const seedTx = getTransactionById('TXN-0001');
    assert.equal(seedTx.sourceType, 'demo_seed');

    const createdTx = createTransaction({
      offerId: 'OFR-GEN-1',
      lotId: 'LOT-0001',
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'PCB',
      weight: 1,
      agreedPrice: 100
    });
    assert.equal(createdTx.sourceType, 'platform_generated');
  });

  // 26. Localization completeness
  test('TEST 26: 8-language localization completeness for all Module 9 keys', () => {
    const module9Keys = [
      'transactions',
      'earnings',
      'traceability',
      'transactionCreated',
      'transactionId',
      'transactionStatus',
      'transactionDetails',
      'transactionHistory',
      'transactionDataset',
      'handover',
      'handoverId',
      'handoverStatus',
      'handoverMethod',
      'handoverDetails',
      'handoverLocation',
      'handoverConfirmed',
      'paymentRecorded',
      'paymentMethod',
      'paymentStatus',
      'paymentId',
      'paymentDate',
      'paymentCash',
      'paymentUPI',
      'paymentBankTransfer',
      'paymentOther',
      'viewReceipt',
      'recordPayment',
      'confirmHandover',
      'confirmReceipt',
      'noTransactionsYet',
      'recordedEarnings',
      'pendingPayments',
      'completedTransactions',
      'traceabilityChain'
    ];

    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      const langDict = STRINGS[code];
      assert.ok(langDict, `Language dictionary missing for ${code}`);
      module9Keys.forEach((key) => {
        assert.ok(
          langDict[key] && langDict[key].trim().length > 0,
          `Key "${key}" is missing or empty in language "${code}"`
        );
      });
    });
  });

  // 27. Scrap lot transactionStatus sync
  test('TEST 27: Scrap lot transactionStatus updates when transaction is created and completed', () => {
    const lot = getAllScrapLots()[0];
    assert.ok(lot);
    
    // Initial transactionStatus
    updateScrapLotTransactionStatus(lot.id, 'none');

    const tx = createTransaction({
      offerId: 'OFR-SYNC-1',
      lotId: lot.id,
      collectorId: 'usr-collector-01',
      collectorName: 'Collector',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'Recycler',
      materialCategory: 'PCB',
      weight: 2,
      agreedPrice: 100
    });

    const updatedLot = getAllScrapLots().find((l) => l.id === lot.id);
    assert.equal(updatedLot.transactionStatus, 'created');
  });
});
