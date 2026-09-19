/**
 * ScrapSetu — Module 5 Automated Test Suite
 * 
 * Verifies all 16 core acceptance criteria specified for Module 5:
 * Price Intelligence + Price Dataset Foundation (SIH26229)
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
  createPriceRecord,
  getPriceRecords,
  getPriceRecordById,
  getPriceRecordByLotId,
  getPriceRecordsByMaterial,
  generateNextPriceId,
  validatePriceRecord,
  resetPriceDataset,
  getPriceDatasetMetadata,
  getPriceDatasetStats,
  STORAGE_KEY_PRICE_DATASET,
  VALID_SOURCE_TYPES
} from '../src/services/priceDatasetService.js';

import {
  estimateFairPrice,
  CONDITION_MULTIPLIERS
} from '../src/services/priceIntelligenceService.js';

import {
  createScrapLot,
  getScrapLots,
  getScrapLotById,
  resetScrapLots
} from '../src/services/scrapLotService.js';

import { DEMO_PRICE_SEED_RECORDS } from '../src/data/priceSeedData.js';
import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 5: Price Intelligence + Price Dataset Foundation', () => {
  beforeEach(() => {
    localStorage.clear();
    resetScrapLots(); // Also resets Material Dataset and Price Dataset
  });

  // TEST 1: Create valid price dataset record
  test('TEST 1: Create valid price dataset record', () => {
    const record = createPriceRecord({
      lotId: 'LOT-9999',
      materialId: 'MAT-9999',
      materialCategory: 'Electronic Components',
      materialSubcategory: 'Computer PCB',
      location: { area: 'Gunupur', city: 'Rayagada', state: 'Odisha' },
      estimatedPrice: 310,
      buyingPrice: null,
      quotedPrice: null,
      sellingPrice: null,
      sourceType: 'platform_estimate',
      recordedAt: new Date().toISOString()
    });

    assert.ok(record, 'Record should be returned');
    assert.match(record.priceId, /^PRICE-\d{4}$/, 'Should generate formatted PRICE ID');
    assert.equal(record.lotId, 'LOT-9999');
    assert.equal(record.materialId, 'MAT-9999');
    assert.equal(record.materialCategory, 'Electronic Components');
    assert.equal(record.materialSubcategory, 'Computer PCB');
    assert.equal(record.estimatedPrice, 310);
    assert.equal(record.buyingPrice, null);
    assert.equal(record.quotedPrice, null);
    assert.equal(record.sellingPrice, null);
    assert.equal(record.sourceType, 'platform_estimate');
    assert.equal(record.datasetVersion, '1.0');
    assert.ok(record.recordedAt, 'recordedAt timestamp must exist');
  });

  // TEST 2: Generate sequential PRICE IDs
  test('TEST 2: Generate sequential PRICE IDs', () => {
    const existing = [
      { priceId: 'PRICE-0001' },
      { priceId: 'PRICE-0002' },
      { priceId: 'PRICE-0003' }
    ];
    const nextId = generateNextPriceId(existing);
    assert.equal(nextId, 'PRICE-0004', 'Next ID after PRICE-0003 should be PRICE-0004');

    const gapList = [
      { priceId: 'PRICE-0001' },
      { priceId: 'PRICE-0021' }
    ];
    assert.equal(generateNextPriceId(gapList), 'PRICE-0022');
  });

  // TEST 3: Reject missing materialCategory
  test('TEST 3: Reject missing materialCategory', () => {
    assert.throws(
      () => {
        createPriceRecord({
          materialCategory: '',
          estimatedPrice: 200,
          sourceType: 'platform_estimate'
        });
      },
      /materialCategory is required/i,
      'Should throw error when materialCategory is missing'
    );
  });

  // TEST 4: Reject non-positive estimatedPrice
  test('TEST 4: Reject non-positive estimatedPrice', () => {
    assert.throws(
      () => {
        createPriceRecord({
          materialCategory: 'Electronic Components',
          estimatedPrice: 0,
          sourceType: 'platform_estimate'
        });
      },
      /estimatedPrice must be a positive number/i,
      'Should reject zero estimatedPrice'
    );

    assert.throws(
      () => {
        createPriceRecord({
          materialCategory: 'Electronic Components',
          estimatedPrice: -50,
          sourceType: 'platform_estimate'
        });
      },
      /estimatedPrice must be a positive number/i,
      'Should reject negative estimatedPrice'
    );
  });

  // TEST 5: Reject invalid sourceType
  test('TEST 5: Reject invalid sourceType', () => {
    assert.throws(
      () => {
        createPriceRecord({
          materialCategory: 'Electronic Components',
          estimatedPrice: 200,
          sourceType: 'unverified_web_scraping'
        });
      },
      /Invalid sourceType/i,
      'Should reject unknown or unauthorized sourceType'
    );
  });

  // TEST 6: Distinguish price types
  test('TEST 6: Distinguish price types (estimated, buying, quoted, selling)', () => {
    const record = createPriceRecord({
      materialCategory: 'Electronic Components',
      materialSubcategory: 'Computer PCB',
      estimatedPrice: 300,
      buyingPrice: 290,
      quotedPrice: 295,
      sellingPrice: 320,
      sourceType: 'platform_estimate'
    });

    assert.equal(record.estimatedPrice, 300);
    assert.equal(record.buyingPrice, 290);
    assert.equal(record.quotedPrice, 295);
    assert.equal(record.sellingPrice, 320);
    assert.notEqual(record.estimatedPrice, record.buyingPrice);
    assert.notEqual(record.buyingPrice, record.sellingPrice);
  });

  // TEST 7: Filter price records by materialCategory
  test('TEST 7: Filter price records by materialCategory', () => {
    const pcbRecords = getPriceRecordsByMaterial('Electronic Components');
    assert.ok(Array.isArray(pcbRecords), 'Should return array');
    assert.ok(pcbRecords.length >= 3, 'Seed records should have at least 3 Electronic Components records');
    assert.ok(pcbRecords.every((r) => r.materialCategory === 'Electronic Components'));

    const cableRecords = getPriceRecordsByMaterial('Cables & Wires');
    assert.ok(cableRecords.length >= 3, 'Seed records should have at least 3 Cables & Wires records');
    assert.ok(cableRecords.every((r) => r.materialCategory === 'Cables & Wires'));
  });

  // TEST 8: Find price record by lotId
  test('TEST 8: Find price record by lotId', () => {
    const found = getPriceRecordByLotId('LOT-0001');
    assert.ok(found, 'Should find seed price record for LOT-0001');
    assert.equal(found.priceId, 'PRICE-0001');
    assert.equal(found.materialCategory, 'Electronic Components');

    const notFound = getPriceRecordByLotId('LOT-NONEXISTENT');
    assert.equal(notFound, null, 'Should return null for non-existent lotId');
  });

  // TEST 9: Estimate fair price calculation with known material
  test('TEST 9: Estimate fair price calculation with known material', () => {
    const estimate = estimateFairPrice({
      materialCategory: 'Electronic Components',
      materialSubcategory: 'Computer PCB',
      weight: 2.0,
      condition: 'fair',
      location: 'Gunupur'
    });

    assert.ok(estimate, 'Should produce an estimate object');
    assert.equal(estimate.isReliable, true, 'PCB should have sufficient seed records to be reliable');
    assert.ok(estimate.minPrice > 0, 'minPrice should be positive');
    assert.ok(estimate.maxPrice >= estimate.minPrice, 'maxPrice >= minPrice');
    assert.ok(estimate.midPrice >= estimate.minPrice && estimate.midPrice <= estimate.maxPrice);
    assert.ok(estimate.estimatedLotValueMin > 0);
    assert.ok(estimate.estimatedLotValueMax >= estimate.estimatedLotValueMin);
    assert.ok(estimate.historicalRecordsUsed >= 2, 'Should analyze at least 2 records');
    assert.ok(estimate.factors, 'Factors object should exist');
    assert.equal(estimate.factors.conditionMultiplier, 1.00, 'Fair condition multiplier is 1.00');
  });

  // TEST 10: Condition multiplier adjustment
  test('TEST 10: Condition multiplier adjustment', () => {
    assert.equal(CONDITION_MULTIPLIERS.good, 1.05);
    assert.equal(CONDITION_MULTIPLIERS.fair, 1.00);
    assert.equal(CONDITION_MULTIPLIERS.damaged, 0.85);
    assert.equal(CONDITION_MULTIPLIERS.mixed, 0.90);

    const goodEstimate = estimateFairPrice({
      materialCategory: 'Cables & Wires',
      materialSubcategory: 'Copper Cable',
      weight: 1.0,
      condition: 'good',
      location: 'Gunupur'
    });

    const fairEstimate = estimateFairPrice({
      materialCategory: 'Cables & Wires',
      materialSubcategory: 'Copper Cable',
      weight: 1.0,
      condition: 'fair',
      location: 'Gunupur'
    });

    const damagedEstimate = estimateFairPrice({
      materialCategory: 'Cables & Wires',
      materialSubcategory: 'Copper Cable',
      weight: 1.0,
      condition: 'damaged',
      location: 'Gunupur'
    });

    assert.ok(goodEstimate.midPrice > fairEstimate.midPrice, 'Good condition should be higher than fair');
    assert.ok(fairEstimate.midPrice > damagedEstimate.midPrice, 'Fair condition should be higher than damaged');
  });

  // TEST 11: Insufficient historical data handling (< 2 records)
  test('TEST 11: Insufficient historical data handling', () => {
    const insufficientEstimate = estimateFairPrice({
      materialCategory: 'Unknown Exotic Material',
      materialSubcategory: 'Rare Alloy',
      weight: 5.0,
      condition: 'good',
      location: 'Gunupur'
    });

    assert.equal(insufficientEstimate.isReliable, false, 'Should be unreliable when < 2 records');
    assert.equal(insufficientEstimate.estimatedPrice, null, 'Must NOT fabricate prices');
    assert.equal(insufficientEstimate.minPrice, null);
    assert.equal(insufficientEstimate.maxPrice, null);
    assert.equal(insufficientEstimate.midPrice, null);
    assert.equal(insufficientEstimate.estimatedLotValueMin, null);
    assert.equal(insufficientEstimate.estimatedLotValueMax, null);
    assert.match(insufficientEstimate.plainExplanation, /not enough/i, 'Explanation must state insufficient data');
  });

  // TEST 12: Plain-language "Why this price?" explanation
  test('TEST 12: Plain-language "Why this price?" explanation', () => {
    const estimate = estimateFairPrice({
      materialCategory: 'Batteries',
      materialSubcategory: 'Lithium-ion Battery',
      weight: 3.5,
      condition: 'good',
      location: 'Gunupur'
    });

    assert.equal(typeof estimate.plainExplanation, 'string');
    assert.ok(estimate.plainExplanation.length > 20, 'Should provide thorough explanation');
    assert.match(estimate.plainExplanation, /historical|records|rate|condition/i);
  });

  // TEST 13: Seed data integrity
  test('TEST 13: Seed data integrity', () => {
    assert.equal(DEMO_PRICE_SEED_RECORDS.length, 21, 'Seed records should contain exactly 21 historical items');
    assert.equal(DEMO_PRICE_SEED_RECORDS[0].priceId, 'PRICE-0001');
    assert.equal(DEMO_PRICE_SEED_RECORDS[20].priceId, 'PRICE-0021');

    for (const record of DEMO_PRICE_SEED_RECORDS) {
      assert.ok(validatePriceRecord(record), `Record ${record.priceId} should pass validation`);
      assert.equal(record.sourceType, 'demo_seed', `Record ${record.priceId} must be demo_seed`);
      assert.ok(record.estimatedPrice > 0, `Record ${record.priceId} must have positive estimatedPrice`);
    }
  });

  // TEST 14: 8-language localization completeness for Module 5
  test('TEST 14: 8-language localization completeness for Module 5', () => {
    const requiredModule5Keys = [
      'estimatedFairPrice',
      'estimatedLotValue',
      'whyThisPrice',
      'whyThisPriceTitle',
      'basedOnHistoricalPrices',
      'historicalRecordsUsed',
      'historicalReference',
      'prototypeEstimateNotice',
      'demoDataNotice',
      'informationalEstimateDisclaimer',
      'priceHistory',
      'priceDataset',
      'priceDatasetSubtitle',
      'priceDatasetLimitations',
      'sourceTypeDemoSeed',
      'sourceTypePlatformEstimate',
      'notEnoughHistoricalData',
      'notEnoughDataExplanation',
      'ratePerKg',
      'totalEstimatedRange',
      'factorMaterial',
      'factorLocation',
      'factorCondition',
      'factorWeight',
      'factorRecordsCount',
      'priceId',
      'buyingPrice',
      'quotedPrice',
      'sellingPrice',
      'estimatedPrice',
      'materialsCovered',
      'locationsCovered',
      'viewPriceJson'
    ];

    const supportedCodes = ['en', 'hi', 'or', 'bn', 'mr', 'te', 'ta', 'gu'];
    assert.equal(SUPPORTED_LANGUAGES.length, 8, 'Must support exactly 8 languages');

    for (const langCode of supportedCodes) {
      const dict = STRINGS[langCode];
      assert.ok(dict, `Language dictionary for '${langCode}' must exist`);
      for (const key of requiredModule5Keys) {
        assert.ok(
          dict[key] !== undefined && typeof dict[key] === 'string' && dict[key].trim().length > 0,
          `Key '${key}' is missing or empty in language '${langCode}'`
        );
      }
    }
  });

  // TEST 15: Creating a Scrap Lot creates linked Price Dataset record
  test('TEST 15: Creating a Scrap Lot creates linked Price Dataset record', () => {
    const initialPriceCount = getPriceRecords().length;

    const newLot = createScrapLot({
      collectorId: 'usr-collector-01',
      materialType: 'PCB',
      materialCategory: 'Electronic Components',
      materialSubcategory: 'Computer PCB',
      weight: 3.0,
      condition: 'good',
      location: 'Gunupur Market',
      estimatedPrice: 325,
      estimatedLotValueMin: 920,
      estimatedLotValueMax: 1030
    });

    assert.ok(newLot.id, 'New lot must have ID');
    assert.ok(newLot.materialId, 'New lot must have materialId');
    assert.ok(newLot.priceId, 'New lot must have linked priceId');
    assert.match(newLot.priceId, /^PRICE-\d{4}$/, 'Linked priceId must be formatted PRICE-xxxx');
    assert.equal(newLot.estimatedPrice, 325);

    const priceRecords = getPriceRecords();
    assert.equal(priceRecords.length, initialPriceCount + 1, 'Price dataset count should increment by 1');

    const createdPrice = getPriceRecordById(newLot.priceId);
    assert.ok(createdPrice, 'Price record must be retrievable by priceId');
    assert.equal(createdPrice.lotId, newLot.id);
    assert.equal(createdPrice.materialId, newLot.materialId);
    assert.equal(createdPrice.estimatedPrice, 325);
    assert.equal(createdPrice.sourceType, 'platform_estimate');
  });

  // TEST 16: Admin price dataset statistics and metadata
  test('TEST 16: Admin price dataset statistics and metadata', () => {
    const stats = getPriceDatasetStats();
    assert.ok(stats.totalRecords >= 21, 'Total records should include at least the 21 seed items');
    assert.equal(stats.seedCount, 21, 'Seed count should be 21');
    assert.ok(stats.materialsCoveredCount >= 7, 'Should cover at least 7 material categories');
    assert.ok(stats.locationsCoveredCount >= 4, 'Should cover at least 4 Odisha locations');

    const metadata = getPriceDatasetMetadata();
    assert.equal(metadata.datasetName, 'ScrapSetu SIH Price Dataset');
    assert.equal(metadata.datasetVersion, '1.0');
    assert.ok(metadata.limitationsNotice.length > 0);
  });
});
