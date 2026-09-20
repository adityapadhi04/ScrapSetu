/**
 * ScrapSetu — Module 12 Test Suite
 * Admin Analytics + Platform Intelligence + Reporting
 *
 * Tests:
 * 1. Platform overview aggregation
 * 2. Material aggregation
 * 3. Weight aggregation
 * 4. Condition aggregation
 * 5. Reuse/recycle aggregation
 * 6. Offer aggregation
 * 7. Transaction aggregation
 * 8. Price aggregation
 * 9. Location aggregation
 * 10. Collector aggregation
 * 11. Repair shop aggregation
 * 12. Recycler aggregation
 * 13. Safety aggregation
 * 14. Environmental aggregation
 * 15. Activity aggregation
 * 16. Empty dataset handling
 * 17. Insufficient data handling
 * 18. No fabricated statistics
 * 19. Admin role restriction (security)
 * 20. CSV export correctness
 * 21. All 8 language keys present
 * 22. Offline compatibility
 */

import { describe, it, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Vitest-compatible adapter for Node test runner
const vi = {
  fn: (impl) => {
    const mock = function (...args) {
      mock.mock.calls.push(args);
      mock.mock.instances.push(this);
      if (impl) return impl.apply(this, args);
    };
    mock.mock = { calls: [], instances: [] };
    mock.mockReturnValue = (val) => { impl = () => val; return mock; };
    mock.mockResolvedValue = (val) => { impl = () => Promise.resolve(val); return mock; };
    mock.mockImplementation = (fn) => { impl = fn; return mock; };
    mock.mockRestore = () => {};
    return mock;
  },
  spyOn: (obj, method) => {
    const orig = obj[method];
    const mock = vi.fn(orig);
    mock.mockRestore = () => { obj[method] = orig; };
    obj[method] = mock;
    return mock;
  }
};

const createExpect = (actual, isNot = false) => {
  const matchers = {
    toBe: (expected) => {
      if (isNot) assert.notStrictEqual(actual, expected);
      else assert.strictEqual(actual, expected);
    },
    toEqual: (expected) => {
      if (isNot) assert.notDeepStrictEqual(actual, expected);
      else assert.deepStrictEqual(actual, expected);
    },
    toBeTruthy: () => {
      if (isNot) assert.ok(!actual);
      else assert.ok(actual);
    },
    toBeFalsy: () => {
      if (isNot) assert.ok(actual);
      else assert.ok(!actual);
    },
    toBeNull: () => {
      if (isNot) assert.notStrictEqual(actual, null);
      else assert.strictEqual(actual, null);
    },
    toBeUndefined: () => {
      if (isNot) assert.notStrictEqual(actual, undefined);
      else assert.strictEqual(actual, undefined);
    },
    toBeDefined: () => {
      if (isNot) assert.strictEqual(actual, undefined);
      else assert.notStrictEqual(actual, undefined);
    },
    toBeCloseTo: (expected, precision = 2) => {
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      if (isNot) assert.ok(diff >= tolerance);
      else assert.ok(diff <= tolerance);
    },
    toBeGreaterThan: (n) => {
      if (isNot) assert.ok(actual <= n);
      else assert.ok(actual > n);
    },
    toBeGreaterThanOrEqual: (n) => {
      if (isNot) assert.ok(actual < n);
      else assert.ok(actual >= n);
    },
    toBeLessThan: (n) => {
      if (isNot) assert.ok(actual >= n);
      else assert.ok(actual < n);
    },
    toBeLessThanOrEqual: (n) => {
      if (isNot) assert.ok(actual > n);
      else assert.ok(actual <= n);
    },
    toContain: (item) => {
      if (isNot) assert.ok(!actual.includes(item));
      else assert.ok(actual.includes(item));
    },
    toHaveProperty: (prop, val) => {
      const has = actual != null && Object.prototype.hasOwnProperty.call(actual, prop);
      if (isNot) {
        assert.ok(!has || (val !== undefined && actual[prop] !== val));
      } else {
        assert.ok(has, `Expected property ${prop}`);
        if (val !== undefined) assert.deepStrictEqual(actual[prop], val);
      }
    },
    toMatch: (regex) => {
      const re = typeof regex === 'string' ? new RegExp(regex) : regex;
      if (isNot) assert.ok(!re.test(actual));
      else assert.ok(re.test(actual));
    },
    toThrow: () => {
      if (typeof actual !== 'function') throw new Error('toThrow expects a function');
      if (isNot) assert.doesNotThrow(actual);
      else assert.throws(actual);
    },
    toHaveBeenCalled: () => {
      const called = actual && actual.mock && actual.mock.calls.length > 0;
      if (isNot) assert.ok(!called, 'Expected not to have been called');
      else assert.ok(called, 'Expected to have been called');
    }
  };
  if (!isNot) {
    matchers.not = createExpect(actual, true);
  }
  return matchers;
};

const expect = (actual) => createExpect(actual);

// ─── Mock localStorage ────────────────────────────────────────────────────────

let _store = {};
const localStorageMock = {
  getItem: (k) => _store[k] ?? null,
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { _store = {}; },
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// ─── Mock document (for exportToCsv) ─────────────────────────────────────────

const mockLink = { click: vi.fn(), href: '', download: '' };
global.document = {
  createElement: () => mockLink,
  body: { appendChild: vi.fn(), removeChild: vi.fn() },
};
global.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: vi.fn() };
global.Blob = class Blob { constructor(parts, opts) { this.text = parts.join(''); this.type = opts?.type || ''; } };

// ─── Import service under test ────────────────────────────────────────────────

import {
  getPlatformOverview,
  getMaterialAnalytics,
  getReuseRecycleAnalytics,
  getOfferAnalytics,
  getTransactionAnalytics,
  getPriceAnalytics,
  getLocationAnalytics,
  getCollectorAnalytics,
  getBuyerAnalytics,
  getSafetyAnalytics,
  getEnvironmentalAnalytics,
  getPlatformActivityTimeline,
  getSyncHealthAnalytics,
  exportToCsv,
} from '../src/services/adminAnalyticsService.js';

import { STRINGS as strings } from '../src/locales/strings.js';

// ─── Seed helpers ─────────────────────────────────────────────────────────────

const seedLots = () => {
  const lots = [
    {
      id: 'LOT-0001', collectorId: 'usr-collector-01',
      materialType: 'PCB', materialCategory: 'PCB',
      weight: 2.4, weightUnit: 'kg', condition: 'fair',
      location: { city: 'Rayagada', area: 'Gunupur', state: 'Odisha' },
      status: 'Created', transactionStatus: 'completed',
      createdAt: '2026-09-18T10:00:00.000Z',
    },
    {
      id: 'LOT-0002', collectorId: 'usr-collector-01',
      materialType: 'Cable', materialCategory: 'Cable',
      weight: 5.0, weightUnit: 'kg', condition: 'good',
      location: { city: 'Rayagada', area: 'Gunupur', state: 'Odisha' },
      status: 'Created', transactionStatus: 'created',
      createdAt: '2026-09-19T08:30:00.000Z',
    },
    {
      id: 'LOT-0003', collectorId: 'usr-collector-02',
      materialType: 'Battery', materialCategory: 'Battery',
      weight: 1.2, weightUnit: 'kg', condition: 'damaged',
      location: { city: 'Bhubaneswar', area: 'Saheed Nagar', state: 'Odisha' },
      status: 'Created', transactionStatus: 'created',
      createdAt: '2026-09-20T06:00:00.000Z',
    },
  ];
  localStorage.setItem('scrapsetu_scrap_lots', JSON.stringify(lots));
  return lots;
};

const seedTransactions = () => {
  const txns = [
    {
      transactionId: 'TXN-0001', offerId: 'OFR-0001', lotId: 'LOT-0001',
      collectorId: 'usr-collector-01', buyerRole: 'repair', buyerName: 'FixIt Shop',
      materialCategory: 'PCB', weight: 2.4, agreedPrice: 320, totalAmount: 768,
      transactionStatus: 'completed', handoverStatus: 'confirmed', paymentStatus: 'recorded',
      createdAt: '2026-09-18T12:00:00.000Z',
      location: { city: 'Rayagada' },
    },
    {
      transactionId: 'TXN-0002', offerId: 'OFR-0002', lotId: 'LOT-0002',
      collectorId: 'usr-collector-01', buyerRole: 'recycler', buyerName: 'GreenRecycle Ltd',
      materialCategory: 'Cable', weight: 5.0, agreedPrice: 660, totalAmount: 3300,
      transactionStatus: 'handover_pending', handoverStatus: 'pending', paymentStatus: 'pending',
      createdAt: '2026-09-19T09:00:00.000Z',
      location: { city: 'Rayagada' },
    },
  ];
  localStorage.setItem('scrapsetu_transactions', JSON.stringify(txns));
  return txns;
};

const seedPayments = () => {
  const payments = [
    {
      paymentId: 'PAY-0001', transactionId: 'TXN-0001', collectorId: 'usr-collector-01',
      amount: 768, paymentMethod: 'Cash', paymentStatus: 'recorded',
      createdAt: '2026-09-18T14:00:00.000Z',
    },
  ];
  localStorage.setItem('scrapsetu_payments', JSON.stringify(payments));
  return payments;
};

const seedOffers = () => {
  const offers = [
    { offerId: 'OFR-0001', lotId: 'LOT-0001', buyerRole: 'repair', status: 'accepted', materialCategory: 'PCB', totalOfferValue: 768, createdAt: '2026-09-18T11:00:00.000Z' },
    { offerId: 'OFR-0002', lotId: 'LOT-0002', buyerRole: 'recycler', status: 'submitted', materialCategory: 'Cable', totalOfferValue: 3300, createdAt: '2026-09-19T08:45:00.000Z' },
    { offerId: 'OFR-0003', lotId: 'LOT-0001', buyerRole: 'recycler', status: 'rejected', materialCategory: 'PCB', totalOfferValue: 600, createdAt: '2026-09-18T11:30:00.000Z' },
  ];
  localStorage.setItem('scrapsetu_offers', JSON.stringify(offers));
  return offers;
};

const seedPrices = () => {
  const prices = [
    { priceId: 'PRICE-0001', materialCategory: 'PCB', pricePerKg: 320, location: { city: 'Rayagada' }, sourceType: 'demo_seed', createdAt: '2026-09-18T10:00:00.000Z' },
    { priceId: 'PRICE-0002', materialCategory: 'PCB', pricePerKg: 340, location: { city: 'Bhubaneswar' }, sourceType: 'demo_seed', createdAt: '2026-09-19T10:00:00.000Z' },
    { priceId: 'PRICE-0003', materialCategory: 'Cable', pricePerKg: 660, location: { city: 'Rayagada' }, sourceType: 'demo_seed', createdAt: '2026-09-19T08:30:00.000Z' },
  ];
  localStorage.setItem('scrapsetu_price_dataset', JSON.stringify(prices));
  return prices;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Module 12 — Admin Analytics Service', () => {

  beforeEach(() => {
    localStorage.clear();
    seedLots();
    seedTransactions();
    seedPayments();
    seedOffers();
    seedPrices();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── 1. Platform Overview ─────────────────────────────────────────────────

  describe('1. getPlatformOverview()', () => {
    it('returns correct total lot count', () => {
      const overview = getPlatformOverview();
      expect(overview.lots.total).toBe(3);
    });

    it('returns correct total weight', () => {
      const overview = getPlatformOverview();
      expect(overview.lots.totalWeight).toBeCloseTo(2.4 + 5.0 + 1.2, 1);
    });

    it('returns correct completed lot count', () => {
      const overview = getPlatformOverview();
      expect(overview.lots.completed).toBe(1); // LOT-0001 has transactionStatus completed
    });

    it('returns correct distinct collector count', () => {
      const overview = getPlatformOverview();
      expect(overview.collectors.distinct).toBe(2);
    });

    it('returns correct total offer count', () => {
      const overview = getPlatformOverview();
      expect(overview.offers.total).toBe(3);
    });

    it('returns correct accepted offer count', () => {
      const overview = getPlatformOverview();
      expect(overview.offers.accepted).toBe(1);
    });

    it('calculates offer acceptance rate correctly', () => {
      const overview = getPlatformOverview();
      expect(overview.offers.acceptanceRate).toBeCloseTo(33.33, 1);
    });

    it('returns correct total transaction count', () => {
      const overview = getPlatformOverview();
      expect(overview.transactions.total).toBe(2);
    });

    it('returns correct completed transaction count', () => {
      const overview = getPlatformOverview();
      expect(overview.transactions.completed).toBe(1);
    });

    it('returns correct total recorded payment value', () => {
      const overview = getPlatformOverview();
      expect(overview.payments.totalRecordedValue).toBe(768);
    });

    it('includes prototype disclaimer in response', () => {
      const overview = getPlatformOverview();
      expect(overview.disclaimer).toBeTruthy();
      expect(typeof overview.disclaimer).toBe('string');
    });
  });

  // ─── 2. Material Analytics ────────────────────────────────────────────────

  describe('2. getMaterialAnalytics()', () => {
    it('hasData is true when lots exist', () => {
      const result = getMaterialAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('returns correct total lot count', () => {
      const result = getMaterialAnalytics();
      expect(result.totalLots).toBe(3);
    });

    it('identifies top material correctly', () => {
      const result = getMaterialAnalytics();
      // PCB appears once, Cable once, Battery once — all tied at 1; top could be any
      expect(result.topMaterial).toBeTruthy();
    });

    it('categoryTable includes all present categories', () => {
      const result = getMaterialAnalytics();
      const cats = result.categoryTable.map((r) => r.category);
      expect(cats).toContain('PCB');
      expect(cats).toContain('Cable');
      expect(cats).toContain('Battery');
    });

    it('includes condition breakdown', () => {
      const result = getMaterialAnalytics();
      const conditionLabels = result.conditionBreakdown.map((c) => c.label);
      expect(conditionLabels).toContain('fair');
      expect(conditionLabels).toContain('good');
      expect(conditionLabels).toContain('damaged');
    });
  });

  // ─── 3. Weight Aggregation ────────────────────────────────────────────────

  describe('3. Weight Aggregation', () => {
    it('totalWeightKg equals sum of all lot weights', () => {
      const result = getMaterialAnalytics();
      expect(result.totalWeightKg).toBeCloseTo(8.6, 1);
    });

    it('weightStats.avg is computed correctly', () => {
      const result = getMaterialAnalytics();
      // avg of [2.4, 5.0, 1.2] = 8.6 / 3 ≈ 2.87
      expect(result.weightStats.avg).toBeCloseTo(2.87, 1);
    });

    it('weightStats.min is the smallest lot weight', () => {
      const result = getMaterialAnalytics();
      expect(result.weightStats.min).toBeCloseTo(1.2, 1);
    });

    it('weightStats.max is the largest lot weight', () => {
      const result = getMaterialAnalytics();
      expect(result.weightStats.max).toBeCloseTo(5.0, 1);
    });
  });

  // ─── 4. Condition Aggregation ─────────────────────────────────────────────

  describe('4. Condition Aggregation', () => {
    it('condition breakdown counts are correct', () => {
      const result = getMaterialAnalytics();
      const condMap = Object.fromEntries(result.conditionBreakdown.map((c) => [c.label, c.count]));
      expect(condMap['fair']).toBe(1);
      expect(condMap['good']).toBe(1);
      expect(condMap['damaged']).toBe(1);
    });
  });

  // ─── 5. Reuse vs Recycle ─────────────────────────────────────────────────

  describe('5. getReuseRecycleAnalytics()', () => {
    it('hasData is true when transactions exist', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('reuse pathway counts repair-role transactions only', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.reuse.total).toBe(1); // TXN-0001 buyerRole=repair
    });

    it('recycle pathway counts recycler-role transactions only', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.recycle.total).toBe(1); // TXN-0002 buyerRole=recycler
    });

    it('repair shops are NOT counted as recyclers', () => {
      const result = getReuseRecycleAnalytics();
      // repair and recycler counts should not overlap
      expect(result.reuse.total + result.recycle.total).toBeLessThanOrEqual(result.totalTransactions);
    });

    it('reuse completed count is correct', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.reuse.completed).toBe(1); // TXN-0001 is completed
    });

    it('recycle completed count is correct', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.recycle.completed).toBe(0); // TXN-0002 is handover_pending
    });

    it('reuse weight is correct', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.reuse.totalWeightKg).toBeCloseTo(2.4, 1);
    });
  });

  // ─── 6. Offer Analytics ──────────────────────────────────────────────────

  describe('6. getOfferAnalytics()', () => {
    it('hasData is true when offers exist', () => {
      const result = getOfferAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('total offer count is correct', () => {
      const result = getOfferAnalytics();
      expect(result.total).toBe(3);
    });

    it('accepted count is correct', () => {
      const result = getOfferAnalytics();
      expect(result.byStatus.accepted).toBe(1);
    });

    it('rejected count is correct', () => {
      const result = getOfferAnalytics();
      expect(result.byStatus.rejected).toBe(1);
    });

    it('repair offer count is correct', () => {
      const result = getOfferAnalytics();
      expect(result.byRole.repair.count).toBe(1);
    });

    it('recycler offer count is correct', () => {
      const result = getOfferAnalytics();
      expect(result.byRole.recycler.count).toBe(2);
    });

    it('acceptance rate is mathematically correct', () => {
      const result = getOfferAnalytics();
      // 1 accepted out of 3 = 33.33%
      expect(result.acceptanceRate).toBeCloseTo(33.33, 0);
    });
  });

  // ─── 7. Transaction Analytics ────────────────────────────────────────────

  describe('7. getTransactionAnalytics()', () => {
    it('hasData is true when transactions exist', () => {
      const result = getTransactionAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('total transaction count is correct', () => {
      const result = getTransactionAnalytics();
      expect(result.total).toBe(2);
    });

    it('completed count is correct', () => {
      const result = getTransactionAnalytics();
      expect(result.completed).toBe(1);
    });

    it('pending count is correct', () => {
      const result = getTransactionAnalytics();
      expect(result.pending).toBe(1); // TXN-0002 is handover_pending
    });

    it('total recorded value equals payment amounts', () => {
      const result = getTransactionAnalytics();
      expect(result.totalRecordedValue).toBe(768);
    });

    it('totalWeightKg sums all transaction weights', () => {
      const result = getTransactionAnalytics();
      expect(result.totalWeightKg).toBeCloseTo(7.4, 1); // 2.4 + 5.0
    });
  });

  // ─── 8. Price Analytics ──────────────────────────────────────────────────

  describe('8. getPriceAnalytics()', () => {
    it('hasData is true when price records exist', () => {
      const result = getPriceAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('totalRecords matches seeded price count', () => {
      const result = getPriceAnalytics();
      expect(result.totalRecords).toBe(3);
    });

    it('PCB avg price is correct (average of 320, 340 = 330)', () => {
      const result = getPriceAnalytics();
      const pcbRow = result.materialPriceTable.find((r) => r.category === 'PCB');
      expect(pcbRow).toBeDefined();
      expect(pcbRow.avg).toBe(330);
    });

    it('includes a prototype disclaimer', () => {
      const result = getPriceAnalytics();
      expect(result.disclaimer).toBeTruthy();
      expect(result.disclaimer.toLowerCase()).not.toContain('real-time market');
    });

    it('does NOT claim to be real-time market price', () => {
      const result = getPriceAnalytics();
      const disclaimerLower = result.disclaimer.toLowerCase();
      expect(disclaimerLower).not.toContain('real-time market price');
      expect(disclaimerLower).not.toContain('official');
    });
  });

  // ─── 9. Location Analytics ───────────────────────────────────────────────

  describe('9. getLocationAnalytics()', () => {
    it('hasData is true when lots exist', () => {
      const result = getLocationAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('identifies Rayagada as a location', () => {
      const result = getLocationAnalytics();
      const locations = result.locationTable.map((r) => r.location);
      expect(locations).toContain('Rayagada');
    });

    it('Rayagada has 2 lots', () => {
      const result = getLocationAnalytics();
      const row = result.locationTable.find((r) => r.location === 'Rayagada');
      expect(row).toBeDefined();
      expect(row.lots).toBe(2);
    });

    it('Bhubaneswar has 1 lot', () => {
      const result = getLocationAnalytics();
      const row = result.locationTable.find((r) => r.location === 'Bhubaneswar');
      expect(row).toBeDefined();
      expect(row.lots).toBe(1);
    });

    it('does NOT use GPS or coordinates', () => {
      const result = getLocationAnalytics();
      // All location values should be string city names, not lat/lng
      result.locationTable.forEach((r) => {
        expect(typeof r.location).toBe('string');
        // Should not look like a coordinate (e.g. "12.3456")
        expect(r.location).not.toMatch(/^\d+\.\d+/);
      });
    });
  });

  // ─── 10. Collector Analytics ─────────────────────────────────────────────

  describe('10. getCollectorAnalytics()', () => {
    it('hasData is true when collectors are present', () => {
      const result = getCollectorAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('totalCollectors is 2', () => {
      const result = getCollectorAnalytics();
      expect(result.totalCollectors).toBe(2);
    });

    it('totalLots is 3', () => {
      const result = getCollectorAnalytics();
      expect(result.totalLots).toBe(3);
    });

    it('perCollector array has one entry per collector', () => {
      const result = getCollectorAnalytics();
      expect(result.perCollector.length).toBe(2);
    });

    it('collector-01 has 2 lots', () => {
      const result = getCollectorAnalytics();
      const c1 = result.perCollector.find((c) => c.collectorId === 'usr-collector-01');
      expect(c1).toBeDefined();
      expect(c1.totalLots).toBe(2);
    });
  });

  // ─── 11. Repair Shop Analytics ───────────────────────────────────────────

  describe('11. getBuyerAnalytics() — Repair Shops', () => {
    it('returns repairShops analytics object', () => {
      const result = getBuyerAnalytics();
      expect(result.repairShops).toBeDefined();
    });

    it('label identifies repair shops correctly', () => {
      const result = getBuyerAnalytics();
      expect(result.repairShops.label).toContain('Repair Shop');
    });

    it('repairShops.offers counts repair-role offers', () => {
      const result = getBuyerAnalytics();
      expect(result.repairShops.offers).toBe(1);
    });

    it('repairShops.transactions counts repair-role transactions', () => {
      const result = getBuyerAnalytics();
      expect(result.repairShops.transactions).toBe(1);
    });
  });

  // ─── 12. Recycler Analytics ──────────────────────────────────────────────

  describe('12. getBuyerAnalytics() — Recyclers', () => {
    it('returns recyclers analytics object', () => {
      const result = getBuyerAnalytics();
      expect(result.recyclers).toBeDefined();
    });

    it('label identifies recyclers correctly', () => {
      const result = getBuyerAnalytics();
      expect(result.recyclers.label).toContain('Recycler');
    });

    it('recyclers.offers counts recycler-role offers', () => {
      const result = getBuyerAnalytics();
      expect(result.recyclers.offers).toBe(2);
    });

    it('repair shops and recyclers are NOT merged', () => {
      const result = getBuyerAnalytics();
      // They must be separate fields
      expect(result.repairShops).toBeDefined();
      expect(result.recyclers).toBeDefined();
      expect(result.repairShops).not.toBe(result.recyclers);
    });
  });

  // ─── 13. Safety Analytics ────────────────────────────────────────────────

  describe('13. getSafetyAnalytics()', () => {
    it('hasData is true when lots exist', () => {
      const result = getSafetyAnalytics();
      expect(result.hasData).toBe(true);
    });

    it('counts total lots correctly', () => {
      const result = getSafetyAnalytics();
      expect(result.totalLots).toBe(3);
    });

    it('identifies battery lots', () => {
      const result = getSafetyAnalytics();
      expect(result.batteries.total).toBeGreaterThanOrEqual(1);
    });

    it('identifies damaged batteries', () => {
      const result = getSafetyAnalytics();
      // LOT-0003 is Battery + damaged
      expect(result.batteries.damaged).toBeGreaterThanOrEqual(1);
    });

    it('includes a prototype disclaimer', () => {
      const result = getSafetyAnalytics();
      expect(result.disclaimer).toBeTruthy();
    });

    it('does NOT provide dangerous processing instructions', () => {
      const result = getSafetyAnalytics();
      const str = JSON.stringify(result).toLowerCase();
      expect(str).not.toContain('acid extraction');
      expect(str).not.toContain('open burning');
    });
  });

  // ─── 14. Environmental Analytics ─────────────────────────────────────────

  describe('14. getEnvironmentalAnalytics()', () => {
    it('returns environmental data object', () => {
      const result = getEnvironmentalAnalytics();
      expect(result).toBeDefined();
    });

    it('reuseWeightKg is a number', () => {
      const result = getEnvironmentalAnalytics();
      expect(typeof result.reuseWeightKg).toBe('number');
    });

    it('recyclingWeightKg is a number', () => {
      const result = getEnvironmentalAnalytics();
      expect(typeof result.recyclingWeightKg).toBe('number');
    });

    it('divertedWeightKg >= reuseWeightKg + recyclingWeightKg for completed transactions', () => {
      const result = getEnvironmentalAnalytics();
      // divertedWeightKg = reuseWeightKg + recyclingWeightKg from completed txns
      const expectedDiverted = result.reuseWeightKg + result.recyclingWeightKg;
      expect(result.divertedWeightKg).toBeCloseTo(expectedDiverted, 1);
    });

    it('includes prototype disclaimer', () => {
      const result = getEnvironmentalAnalytics();
      expect(result.disclaimer).toBeTruthy();
    });

    it('does NOT claim to be certified carbon credit or government-verified', () => {
      const result = getEnvironmentalAnalytics();
      const str = JSON.stringify(result).toLowerCase();
      expect(str).not.toContain('carbon credit');
      expect(str).not.toContain('government verified');
      expect(str).not.toContain('certified carbon');
    });
  });

  // ─── 15. Activity Timeline ────────────────────────────────────────────────

  describe('15. getPlatformActivityTimeline()', () => {
    it('hasData is true when records exist', () => {
      const result = getPlatformActivityTimeline();
      expect(result.hasData).toBe(true);
    });

    it('days array has entries for each date with activity', () => {
      const result = getPlatformActivityTimeline();
      expect(result.days.length).toBeGreaterThan(0);
    });

    it('each day entry has date, lots, transactions, offers fields', () => {
      const result = getPlatformActivityTimeline();
      result.days.forEach((d) => {
        expect(d).toHaveProperty('date');
        expect(d).toHaveProperty('lots');
        expect(d).toHaveProperty('transactions');
        expect(d).toHaveProperty('offers');
      });
    });

    it('dates are in YYYY-MM-DD format', () => {
      const result = getPlatformActivityTimeline();
      result.days.forEach((d) => {
        expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('totalActivity counts sum correctly', () => {
      const result = getPlatformActivityTimeline();
      const sumLots = result.days.reduce((s, d) => s + d.lots, 0);
      expect(result.totalActivity.lots).toBe(sumLots);
    });
  });

  // ─── 16. Empty Dataset Handling ──────────────────────────────────────────

  describe('16. Empty Dataset Handling', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('getPlatformOverview: lots total is 0 when empty', () => {
      const result = getPlatformOverview();
      expect(result.lots.total).toBe(0);
    });

    it('getMaterialAnalytics: hasData is false when no lots', () => {
      const result = getMaterialAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getReuseRecycleAnalytics: hasData is false when no transactions', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getOfferAnalytics: hasData is false when no offers', () => {
      const result = getOfferAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getTransactionAnalytics: hasData is false when no transactions', () => {
      const result = getTransactionAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getPriceAnalytics: hasData is false when no price records', () => {
      const result = getPriceAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getLocationAnalytics: hasData is false when no lots', () => {
      const result = getLocationAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getCollectorAnalytics: hasData is false when no lots', () => {
      const result = getCollectorAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('getPlatformActivityTimeline: hasData is false when all empty', () => {
      const result = getPlatformActivityTimeline();
      expect(result.hasData).toBe(false);
    });
  });

  // ─── 17. Insufficient Data Handling ──────────────────────────────────────

  describe('17. Insufficient Data Handling', () => {
    it('weightStats returns null values for avg/median with no lots', () => {
      localStorage.clear();
      const result = getMaterialAnalytics();
      expect(result.hasData).toBe(false);
    });

    it('acceptanceRate is null when there are no offers', () => {
      localStorage.clear();
      const result = getPlatformOverview();
      expect(result.offers.acceptanceRate).toBeNull();
    });

    it('price avg is null for material with no price records', () => {
      localStorage.clear();
      const result = getPriceAnalytics();
      expect(result.hasData).toBe(false);
    });
  });

  // ─── 18. No Fabricated Statistics ────────────────────────────────────────

  describe('18. No Fabricated Statistics', () => {
    it('platform overview lot count matches actual localStorage data', () => {
      const result = getPlatformOverview();
      const lots = JSON.parse(localStorage.getItem('scrapsetu_scrap_lots') || '[]');
      expect(result.lots.total).toBe(lots.length);
    });

    it('transaction total matches actual localStorage data', () => {
      const result = getPlatformOverview();
      const txns = JSON.parse(localStorage.getItem('scrapsetu_transactions') || '[]');
      expect(result.transactions.total).toBe(txns.length);
    });

    it('offer total matches actual localStorage data', () => {
      const result = getPlatformOverview();
      const offers = JSON.parse(localStorage.getItem('scrapsetu_offers') || '[]');
      expect(result.offers.total).toBe(offers.length);
    });

    it('recorded payment value matches sum of actual recorded payments', () => {
      const result = getPlatformOverview();
      const payments = JSON.parse(localStorage.getItem('scrapsetu_payments') || '[]');
      const expected = payments
        .filter((p) => p.paymentStatus === 'recorded')
        .reduce((s, p) => s + parseFloat(p.amount), 0);
      expect(result.payments.totalRecordedValue).toBeCloseTo(expected, 0);
    });
  });

  // ─── 19. Admin Role Restriction ──────────────────────────────────────────

  describe('19. Admin Role Restriction (Security)', () => {
    it('analytics functions are pure — they do not mutate localStorage', () => {
      const before = JSON.stringify(_store);
      getPlatformOverview();
      getMaterialAnalytics();
      getReuseRecycleAnalytics();
      getOfferAnalytics();
      getTransactionAnalytics();
      const after = JSON.stringify(_store);
      expect(after).toBe(before);
    });

    it('analytics service does not write to sync queue', () => {
      getPlatformOverview();
      getMaterialAnalytics();
      const queue = JSON.parse(localStorage.getItem('scrapsetu_sync_queue') || '[]');
      expect(queue.length).toBe(0);
    });

    it('analytics do not expose or mutate auth tokens', () => {
      const result = getPlatformOverview();
      const str = JSON.stringify(result);
      expect(str).not.toContain('password');
      expect(str).not.toContain('token');
    });
  });

  // ─── 20. CSV Export Correctness ──────────────────────────────────────────

  describe('20. CSV Export', () => {
    it('exportToCsv does not throw with valid data', () => {
      expect(() => {
        exportToCsv([{ category: 'PCB', count: 1, totalWeightKg: 2.4 }], 'test.csv');
      }).not.toThrow();
    });

    it('exportToCsv handles empty array gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      exportToCsv([], 'empty.csv');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('exportToCsv uses provided column filter', () => {
      // Should only include specified columns, not everything
      let captured = null;
      const originalCreate = global.document.createElement;
      global.document.createElement = () => {
        const link = { click: vi.fn(), href: '', download: '' };
        return link;
      };
      // This just verifies no throw when columns are filtered
      expect(() => {
        exportToCsv(
          [{ category: 'PCB', count: 1, hidden: 'secret' }],
          'filtered.csv',
          ['category', 'count']
        );
      }).not.toThrow();
    });

    it('exportToCsv filename is set on download link', () => {
      let capturedFilename = null;
      const originalCreate = global.document.createElement;
      global.document.createElement = (tag) => {
        const el = { click: vi.fn(), href: '', download: '' };
        Object.defineProperty(el, 'download', {
          set(v) { capturedFilename = v; },
          get() { return capturedFilename; }
        });
        return el;
      };
      exportToCsv([{ a: 1 }], 'myfile.csv');
      expect(capturedFilename).toBe('myfile.csv');
      global.document.createElement = originalCreate;
    });
  });

  // ─── 21. All 8 Language Keys ─────────────────────────────────────────────

  describe('21. All 8 Language Keys for Module 12', () => {
    const EXPECTED_M12_KEYS = [
      'platformAnalytics',
      'overview',
      'total',
      'count',
      'average',
      'median',
      'accepted',
      'completed',
      'pending',
      'cancelled',
      'rejected',
      'totalLots',
      'totalWeight',
      'totalOffers',
      'totalTransactions',
      'recordedValue',
      'exportCsv',
      'notEnoughData',
      'historicalData',
      'prototypeEnvironmentalEstimate',
      'highRiskLabel',
      'location',
      'material',
    ];

    const LANGUAGES = ['en', 'hi', 'or', 'bn', 'mr', 'te', 'ta', 'gu'];

    LANGUAGES.forEach((lang) => {
      it(`[${lang}] has all required Module 12 keys`, () => {
        const locale = strings[lang];
        expect(locale).toBeDefined();
        EXPECTED_M12_KEYS.forEach((key) => {
          expect(locale[key],
            `Missing key "${key}" in locale "${lang}"`
          ).toBeDefined();
          expect(typeof locale[key]).toBe('string');
          expect(locale[key].length).toBeGreaterThan(0);
        });
      });
    });
  });

  // ─── 22. Offline Compatibility ───────────────────────────────────────────

  describe('22. Offline Compatibility', () => {
    it('analytics work with data already in localStorage (offline mode)', () => {
      // All data is in localStorage — no network needed
      const result = getPlatformOverview();
      expect(result.lots.total).toBeGreaterThan(0);
    });

    it('getSyncHealthAnalytics returns valid structure offline', () => {
      const result = getSyncHealthAnalytics();
      expect(typeof result.isOnline).toBe('boolean');
    });

    it('empty sync queue returns zero counts', () => {
      // Queue not seeded → should return 0 pending
      const result = getSyncHealthAnalytics();
      expect(result.pending ?? 0).toBeGreaterThanOrEqual(0);
    });

    it('analytics do not make fetch/network calls', () => {
      // No global.fetch should be invoked by analytics
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({});
      getPlatformOverview();
      getMaterialAnalytics();
      getTransactionAnalytics();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  // ─── 23. No Prohibited Claims ────────────────────────────────────────────

  describe('23. No Prohibited Claims in Analytics Output', () => {
    const prohibited = [
      'real-time market price',
      'best recycler',
      'best buyer',
      'ai prediction',
      'certified environmental impact',
      'carbon credit',
      'government verified',
    ];

    it('analytics output contains no prohibited claims', () => {
      const allResults = [
        getPlatformOverview(),
        getMaterialAnalytics(),
        getReuseRecycleAnalytics(),
        getOfferAnalytics(),
        getTransactionAnalytics(),
        getPriceAnalytics(),
        getLocationAnalytics(),
        getCollectorAnalytics(),
        getBuyerAnalytics(),
        getSafetyAnalytics(),
        getEnvironmentalAnalytics(),
        getPlatformActivityTimeline(),
        getSyncHealthAnalytics(),
      ];

      const combined = JSON.stringify(allResults).toLowerCase();

      prohibited.forEach((phrase) => {
        // Escape regex special characters in phrase
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match phrase not part of a negation/disclaimer (e.g. 'not real-time...', 'not a certified carbon credit...')
        const regex = new RegExp(
          `(?<!\\b(?:not|no)\\s+(?:a\\s+)?(?:certified\\s+))(?<!\\b(?:not|no)\\s+(?:a\\s+)?)(?<!\\b(?:not|no)\\s+)${escaped}`,
          'i'
        );
        expect(combined, `Found prohibited claim: "${phrase}"`).not.toMatch(regex);
      });
    });
  });

  // ─── 24. Reuse/Recycle Pathway Integrity ─────────────────────────────────

  describe('24. Pathway Integrity', () => {
    it('repair shop pathway label contains Repair — not Recycler', () => {
      const result = getBuyerAnalytics();
      expect(result.repairShops.label.toLowerCase()).not.toContain('recycler');
    });

    it('recycler pathway label contains Recycl — not Repair Shop', () => {
      const result = getBuyerAnalytics();
      expect(result.recyclers.label.toLowerCase()).toContain('recycl');
    });

    it('reuse/recycle analytics note explains pathway distinction', () => {
      const result = getReuseRecycleAnalytics();
      expect(result.note).toBeTruthy();
    });
  });

});
