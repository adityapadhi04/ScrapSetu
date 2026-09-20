/**
 * ScrapSetu — Module 13 Automated Test Suite
 * AI/ML Dataset + Intelligence Foundation
 *
 * Requirements Tested:
 * 1. Dataset creation from existing lots and prices
 * 2. Record validation & missing data handling
 * 3. Deterministic feature engineering
 * 4. Insufficient-data handling
 * 5. Anomaly detection with non-punitive explanations
 * 6. Prediction explanation transparency
 * 7. Admin dataset aggregation & CSV formatting
 * 8. Localization completeness across all 8 languages
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

// Module 13 Services
import {
  validateMlRecord,
  syncMlDataset,
  getMlDataset,
  getMlDatasetStats,
  exportMlDatasetToCsvText,
  ML_DATASET_VERSION,
  STORAGE_KEY_ML_DATASET
} from '../src/services/mlDatasetService.js';

import {
  extractFeatures,
  batchExtractFeatures,
  getFeatureSchema,
  getHistoricalBenchmarkRate,
  MATERIAL_HAZARD_INDEX
} from '../src/services/mlFeatureService.js';

import {
  predictScrapPrice,
  detectAnomalies,
  scanDatasetForAnomalies,
  explainPrediction,
  TYPICAL_WEIGHT_BOUNDS
} from '../src/services/mlIntelligenceService.js';

import { STRINGS as strings } from '../src/locales/strings.js';

describe('Module 13: AI/ML Dataset + Intelligence Foundation', () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed sample lots for testing
    const sampleLots = [
      {
        id: 'LOT-TEST-001',
        materialCategory: 'Electronic Components',
        materialSubcategory: 'Computer PCB',
        weight: 3.5,
        condition: 'good',
        location: { city: 'Rayagada', state: 'Odisha' },
        estimatedPrice: 1050,
        sourceType: 'scrap_lot'
      },
      {
        id: 'LOT-TEST-002',
        materialCategory: 'Batteries',
        materialSubcategory: 'Lithium-Ion Battery',
        weight: 1.2,
        condition: 'damaged',
        location: { city: 'Bhubaneswar', state: 'Odisha' },
        estimatedPrice: 200,
        sourceType: 'scrap_lot'
      }
    ];
    localStorage.setItem('scrapsetu_scrap_lots', JSON.stringify(sampleLots));

    const samplePrices = [
      {
        priceId: 'PRICE-TEST-001',
        materialCategory: 'Electronic Components',
        weight: 1.0,
        pricePerKg: 300,
        buyerType: 'repair_shop',
        sourceType: 'price_dataset'
      },
      {
        priceId: 'PRICE-TEST-002',
        materialCategory: 'Batteries',
        weight: 1.0,
        pricePerKg: 150,
        buyerType: 'recycler',
        sourceType: 'price_dataset'
      }
    ];
    localStorage.setItem('scrapsetu_price_dataset', JSON.stringify(samplePrices));
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── 1. ML Dataset Creation & Persistence ───────────────────────────────────

  describe('1. ML Dataset Creation', () => {
    test('syncMlDataset synthesizes records and saves to localStorage', () => {
      const records = syncMlDataset();
      assert.ok(Array.isArray(records));
      assert.ok(records.length >= 4, 'Should contain at least 4 synthesized records from lots + prices');

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_ML_DATASET));
      assert.ok(Array.isArray(saved));
      assert.strictEqual(saved.length, records.length);
    });

    test('Each record contains all mandatory ML schema fields', () => {
      const records = syncMlDataset();
      for (const r of records) {
        assert.ok(r.id, 'Record must have an ID');
        assert.ok(r.materialCategory, 'Record must have materialCategory');
        assert.ok(typeof r.weight === 'number', 'Weight must be a number');
        assert.ok(r.condition, 'Condition must be present');
        assert.strictEqual(r.datasetVersion, ML_DATASET_VERSION);
        assert.ok(typeof r.isValid === 'boolean');
      }
    });

    test('getMlDataset returns cached records without duplicate duplication', () => {
      syncMlDataset();
      const firstRead = getMlDataset();
      const secondRead = getMlDataset();
      assert.strictEqual(firstRead.length, secondRead.length);
    });
  });

  // ─── 2. Record Validation ───────────────────────────────────────────────────

  describe('2. Record Validation', () => {
    test('Valid record passes validation with no errors', () => {
      const valid = {
        materialCategory: 'PCB',
        weight: 2.5,
        condition: 'good',
        estimatedPrice: 750
      };
      const result = validateMlRecord(valid);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('Missing or empty materialCategory fails validation', () => {
      const invalid = { materialCategory: '', weight: 2.5 };
      const result = validateMlRecord(invalid);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('materialCategory')));
    });

    test('Zero or negative weight fails validation', () => {
      const invalidZero = { materialCategory: 'Cables', weight: 0 };
      const resZero = validateMlRecord(invalidZero);
      assert.strictEqual(resZero.isValid, false);

      const invalidNeg = { materialCategory: 'Cables', weight: -5.0 };
      const resNeg = validateMlRecord(invalidNeg);
      assert.strictEqual(resNeg.isValid, false);
    });

    test('Invalid condition flag produces warning/error in validation', () => {
      const invalidCond = { materialCategory: 'Cables', weight: 1.0, condition: 'broken_beyond_repair' };
      const res = validateMlRecord(invalidCond);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('Condition')));
    });
  });

  // ─── 3. Deterministic Feature Engineering ────────────────────────────────────

  describe('3. Feature Engineering', () => {
    test('extractFeatures generates consistent deterministic numerical features', () => {
      const item = {
        materialCategory: 'Electronic Components',
        weight: 4.0,
        condition: 'good',
        buyerRole: 'repair',
        location: { city: 'Rayagada' }
      };

      const f1 = extractFeatures(item);
      const f2 = extractFeatures(item);

      assert.strictEqual(f1.isValid, true);
      assert.deepStrictEqual(f1.features, f2.features, 'Feature extraction must be strictly deterministic');
      assert.strictEqual(f1.features.is_good, 1);
      assert.strictEqual(f1.features.is_damaged, 0);
      assert.strictEqual(f1.features.condition_multiplier, 1.15);
      assert.strictEqual(f1.features.is_repair_buyer, 1);
      assert.strictEqual(f1.features.pathway_reuse, 1);
    });

    test('Hazard score assigns higher ratings to acute e-waste categories', () => {
      const batteryItem = { materialCategory: 'Lithium Battery Pack', weight: 2.0 };
      const cableItem = { materialCategory: 'Copper Cable', weight: 2.0 };

      const fBattery = extractFeatures(batteryItem);
      const fCable = extractFeatures(cableItem);

      assert.ok(fBattery.features.hazard_score >= 3, 'Batteries should have high hazard score (3)');
      assert.ok(fCable.features.hazard_score <= 1, 'Cables should have lower hazard score (1)');
    });

    test('batchExtractFeatures transforms multiple records', () => {
      const items = [
        { materialCategory: 'PCB', weight: 1.5, condition: 'fair' },
        { materialCategory: 'Battery', weight: 0.8, condition: 'damaged' }
      ];
      const batch = batchExtractFeatures(items);
      assert.strictEqual(batch.count, 2);
      assert.strictEqual(batch.vectors.length, 2);
      assert.ok(batch.featureNames.includes('weight_kg'));
      assert.ok(batch.featureNames.includes('condition_multiplier'));
    });

    test('getFeatureSchema returns full descriptor list', () => {
      const schema = getFeatureSchema();
      assert.ok(Array.isArray(schema));
      assert.ok(schema.length >= 10);
      assert.ok(schema.some((s) => s.name === 'weight_kg'));
      assert.ok(schema.some((s) => s.name === 'hazard_score'));
    });
  });

  // ─── 4. ML Intelligence & Price Prediction ───────────────────────────────────

  describe('4. ML Intelligence & Price Prediction', () => {
    test('predictScrapPrice returns prototype estimate when historical records exist', () => {
      const input = {
        materialCategory: 'Electronic Components',
        weight: 2.0,
        condition: 'good'
      };

      const result = predictScrapPrice(input);
      assert.strictEqual(result.status, 'prototype');
      assert.ok(result.predictedTotal > 0);
      assert.ok(result.predictedPricePerKg > 0);
      assert.ok(result.explanation.includes('Electronic Components'));
      assert.ok(result.disclaimer.includes('Prototype decision support'));
    });

    test('predictScrapPrice returns insufficient_data when category has no records', () => {
      const input = {
        materialCategory: 'Unobtainium Space Scrap',
        weight: 5.0,
        condition: 'good'
      };

      const result = predictScrapPrice(input);
      assert.strictEqual(result.status, 'insufficient_data');
      assert.strictEqual(result.predictedTotal, null);
      assert.strictEqual(result.predictedPricePerKg, null);
      assert.ok(result.explanation.includes('No historical price records found'));
    });

    test('predictScrapPrice handles invalid or negative weight gracefully', () => {
      const result = predictScrapPrice({ materialCategory: 'PCB', weight: -2 });
      assert.strictEqual(result.status, 'insufficient_data');
      assert.strictEqual(result.predictedTotal, null);
    });

    test('explainPrediction produces clear human-readable rationale', () => {
      const input = { materialCategory: 'Electronic Components', weight: 1.0, condition: 'good' };
      const pred = predictScrapPrice(input);
      const explanation = explainPrediction(pred);
      assert.ok(typeof explanation === 'string');
      assert.ok(explanation.length > 20);
    });
  });

  // ─── 5. Anomaly Detection (Root-Cause Explanations, No Fraud Accusations) ────

  describe('5. Anomaly Detection & Non-Punitive Auditing', () => {
    test('detectAnomalies flags high weight outliers with operational explanation', () => {
      const highWeightLot = {
        materialCategory: 'Mobile Phone Scrap',
        weight: 150.0 // Extremely high for individual mobile lot
      };

      const result = detectAnomalies(highWeightLot);
      assert.strictEqual(result.isAnomaly, true);
      assert.ok(result.anomalies.some((a) => a.field === 'weight'));
      const exp = result.anomalies[0].explanation;
      assert.ok(exp.includes('weighing scale') || exp.includes('bulk bundled'), 'Must explain operational root causes');
      assert.ok(!exp.toLowerCase().includes('fraud'), 'Must NOT call user a fraudster');
      assert.ok(!exp.toLowerCase().includes('scam'), 'Must NOT call user a scammer');
    });

    test('detectAnomalies flags severe unit price deviations with data entry explanation', () => {
      const extremePriceLot = {
        materialCategory: 'Electronic Components',
        weight: 2.0,
        actualOfferPrice: 15000 // ₹7500/kg vs ₹300 benchmark (> 2.5x)
      };

      const result = detectAnomalies(extremePriceLot);
      assert.strictEqual(result.isAnomaly, true);
      assert.ok(result.anomalies.some((a) => a.field === 'price'));
      const exp = result.anomalies[0].explanation;
      assert.ok(exp.includes('deviates significantly') || exp.includes('lump sum'));
    });

    test('Normal record passes with zero anomalies', () => {
      const normalLot = {
        materialCategory: 'Electronic Components',
        weight: 2.0,
        actualOfferPrice: 600, // ₹300/kg aligns with benchmark
        condition: 'fair'
      };

      const result = detectAnomalies(normalLot);
      assert.strictEqual(result.isAnomaly, false);
      assert.strictEqual(result.anomalyCount, 0);
    });

    test('scanDatasetForAnomalies aggregates results across dataset', () => {
      syncMlDataset();
      const report = scanDatasetForAnomalies();
      assert.ok(typeof report.totalScanned === 'number');
      assert.ok(typeof report.anomalyCount === 'number');
      assert.ok(Array.isArray(report.anomalies));
    });
  });

  // ─── 6. Admin Aggregation & CSV Export ────────────────────────────────────────

  describe('6. Admin Aggregation & CSV Export', () => {
    test('getMlDatasetStats computes transparent dataset overview', () => {
      syncMlDataset();
      const stats = getMlDatasetStats();
      assert.ok(stats.totalRecords > 0);
      assert.strictEqual(stats.validRecords + stats.invalidRecords, stats.totalRecords);
      assert.strictEqual(stats.datasetVersion, ML_DATASET_VERSION);
      assert.strictEqual(stats.modelStatus, 'heuristic_prototype');
      assert.ok(stats.disclaimer.includes('heuristic'));
    });

    test('exportMlDatasetToCsvText formats model-ready CSV', () => {
      const records = [
        {
          id: 'ML-0001',
          lotId: 'LOT-01',
          materialCategory: 'PCB',
          materialSubcategory: 'Computer',
          weight: 2.5,
          condition: 'good',
          estimatedPrice: 750,
          actualOfferPrice: 800,
          pricePerKg: 320,
          buyerRole: 'repair',
          pathway: 'reuse',
          timestamp: '2026-09-20T00:00:00.000Z',
          sourceType: 'scrap_lot',
          datasetVersion: 'v1.0-prototype',
          isValid: true
        }
      ];

      const csv = exportMlDatasetToCsvText(records);
      assert.ok(csv.includes('id,lotId,materialCategory'));
      assert.ok(csv.includes('ML-0001'));
      assert.ok(csv.includes('PCB'));
      assert.ok(csv.includes('320'));
    });
  });

  // ─── 7. Localization Completeness Across All 8 Languages ─────────────────────

  describe('7. Localization Completeness Across All 8 Languages', () => {
    const requiredKeys = [
      'mlDataset',
      'totalRecords',
      'validRecords',
      'invalidRecords',
      'datasetVersion',
      'modelStatus',
      'anomalyCount',
      'detectedAnomalies',
      'refreshMlDataset',
      'heuristicPrototype',
      'predictedPrice'
    ];

    const supportedLanguages = ['en', 'hi', 'or', 'bn', 'mr', 'te', 'ta', 'gu'];

    for (const lang of supportedLanguages) {
      test(`Language "${lang}" contains all Module 13 localization keys`, () => {
        const langDict = strings[lang];
        assert.ok(langDict, `Dictionary for "${lang}" must exist`);
        for (const key of requiredKeys) {
          assert.ok(langDict[key], `Key "${key}" must be defined in language "${lang}"`);
          assert.strictEqual(typeof langDict[key], 'string');
          assert.ok(langDict[key].trim().length > 0);
        }
      });
    }
  });
});
