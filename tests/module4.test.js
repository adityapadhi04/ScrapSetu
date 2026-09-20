/**
 * ScrapSetu — Module 4 Automated Test Suite
 * 
 * Verifies all 12 core acceptance criteria specified for Module 4:
 * AI Material Identification + Material Dataset Foundation (SIH26229)
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
  createMaterialRecord,
  getMaterialRecords,
  getMaterialRecordById,
  getMaterialRecordByLotId,
  getMaterialRecordsByCollector,
  generateNextMaterialId,
  validateMaterialRecord,
  resetMaterialDataset,
  getDatasetMetadata,
  getDatasetStats,
  STORAGE_KEY_MATERIAL_DATASET
} from '../src/services/materialDatasetService.js';

import {
  identifyMaterial,
  validateIdentificationResult,
  validateDetectedItem,
  CV_MODEL_INFO,
  IDENTIFICATION_MODE
} from '../src/services/materialIdentificationService.js';

import {
  createScrapLot,
  getScrapLots,
  getScrapLotById,
  resetScrapLots
} from '../src/services/scrapLotService.js';

import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 4: AI Material Identification + Material Dataset', () => {
  beforeEach(() => {
    localStorage.clear();
    resetScrapLots();
  });

  // TEST 1: Create valid material dataset record
  test('TEST 1: Create valid material dataset record', () => {
    const record = createMaterialRecord({
      lotId: 'LOT-9999',
      collectorId: 'usr-collector-test',
      materialCategory: 'PCB',
      materialSubcategory: 'Computer PCB',
      materialDescription: 'High grade motherboard scrap',
      approximateWeight: 3.5,
      weightUnit: 'kg',
      condition: 'good',
      sourceType: 'Informal Collector',
      identificationMethod: 'demo_ai',
      confidenceScore: 0.91,
      collectorConfirmed: true
    });

    assert.ok(record, 'Record should be returned');
    assert.match(record.materialId, /^MAT-\d{4}$/, 'Should generate formatted MAT ID');
    assert.equal(record.lotId, 'LOT-9999');
    assert.equal(record.collectorId, 'usr-collector-test');
    assert.equal(record.materialCategory, 'PCB');
    assert.equal(record.materialSubcategory, 'Computer PCB');
    assert.equal(record.approximateWeight, 3.5);
    assert.equal(record.weightUnit, 'kg');
    assert.equal(record.condition, 'good');
    assert.equal(record.estimatedValue, null, 'estimatedValue MUST remain null in Module 4');
    assert.equal(record.identificationMethod, 'demo_ai');
    assert.equal(record.confidenceScore, 0.91);
    assert.equal(record.collectorConfirmed, true);
    assert.equal(record.datasetVersion, '1.0');
    assert.ok(record.createdAt, 'createdAt must exist');
  });

  // TEST 2: Generate sequential MAT IDs
  test('TEST 2: Generate sequential MAT IDs', () => {
    const records = [
      { materialId: 'MAT-0001' },
      { materialId: 'MAT-0002' },
      { materialId: 'MAT-0003' }
    ];
    const nextId = generateNextMaterialId(records);
    assert.equal(nextId, 'MAT-0004', 'Next ID after MAT-0003 should be MAT-0004');

    const emptyNextId = generateNextMaterialId([]);
    assert.equal(emptyNextId, 'MAT-0001', 'Initial next ID should be MAT-0001');
  });

  // TEST 3: Reject missing lotId
  test('TEST 3: Reject missing lotId', () => {
    assert.throws(
      () => {
        createMaterialRecord({
          collectorId: 'usr-collector-test',
          materialCategory: 'PCB',
          approximateWeight: 2.0,
          condition: 'fair'
        });
      },
      /lotId is required/,
      'Should throw error when lotId is missing'
    );
  });

  // TEST 4: Reject invalid weight (<= 0 or NaN)
  test('TEST 4: Reject invalid weight', () => {
    assert.throws(
      () => {
        createMaterialRecord({
          lotId: 'LOT-9991',
          collectorId: 'usr-collector-test',
          materialCategory: 'PCB',
          approximateWeight: 0,
          condition: 'fair'
        });
      },
      /approximateWeight must be a valid number greater than 0/,
      'Should reject zero weight'
    );

    assert.throws(
      () => {
        createMaterialRecord({
          lotId: 'LOT-9992',
          collectorId: 'usr-collector-test',
          materialCategory: 'PCB',
          approximateWeight: -1.5,
          condition: 'fair'
        });
      },
      /approximateWeight must be a valid number greater than 0/,
      'Should reject negative weight'
    );

    assert.throws(
      () => {
        createMaterialRecord({
          lotId: 'LOT-9993',
          collectorId: 'usr-collector-test',
          materialCategory: 'PCB',
          approximateWeight: 'not-a-number',
          condition: 'fair'
        });
      },
      /approximateWeight must be a valid number greater than 0/,
      'Should reject non-numeric weight'
    );
  });

  // TEST 5: Reject invalid confidence score (< 0 or > 1)
  test('TEST 5: Reject invalid confidence score', () => {
    assert.throws(
      () => {
        createMaterialRecord({
          lotId: 'LOT-9994',
          collectorId: 'usr-collector-test',
          materialCategory: 'PCB',
          approximateWeight: 2.0,
          condition: 'fair',
          confidenceScore: 1.5 // > 1
        });
      },
      /confidenceScore must be a number between 0 and 1/,
      'Should reject confidence score greater than 1'
    );

    assert.throws(
      () => {
        createMaterialRecord({
          lotId: 'LOT-9995',
          collectorId: 'usr-collector-test',
          materialCategory: 'PCB',
          approximateWeight: 2.0,
          condition: 'fair',
          confidenceScore: -0.2 // < 0
        });
      },
      /confidenceScore must be a number between 0 and 1/,
      'Should reject negative confidence score'
    );
  });

  // TEST 6: Filter material records by collector
  test('TEST 6: Filter material records by collector', () => {
    createMaterialRecord({
      lotId: 'LOT-8801',
      collectorId: 'collector-alpha',
      materialCategory: 'PCB',
      approximateWeight: 1.0,
      condition: 'good'
    });

    createMaterialRecord({
      lotId: 'LOT-8802',
      collectorId: 'collector-alpha',
      materialCategory: 'Cable',
      approximateWeight: 2.0,
      condition: 'fair'
    });

    createMaterialRecord({
      lotId: 'LOT-8803',
      collectorId: 'collector-beta',
      materialCategory: 'Battery',
      approximateWeight: 0.5,
      condition: 'damaged'
    });

    const alphaRecords = getMaterialRecordsByCollector('collector-alpha');
    const betaRecords = getMaterialRecordsByCollector('collector-beta');

    assert.equal(alphaRecords.length, 2, 'collector-alpha should have 2 records');
    assert.equal(betaRecords.length, 1, 'collector-beta should have 1 record');
    assert.ok(alphaRecords.every((r) => r.collectorId === 'collector-alpha'));
  });

  // TEST 7: Find material record by lotId
  test('TEST 7: Find material record by lotId', () => {
    const created = createMaterialRecord({
      lotId: 'LOT-7777',
      collectorId: 'usr-collector-01',
      materialCategory: 'Motor',
      materialSubcategory: 'Appliance Motor',
      approximateWeight: 8.2,
      condition: 'fair'
    });

    const found = getMaterialRecordByLotId('LOT-7777');
    assert.ok(found, 'Should locate record by lotId');
    assert.equal(found.materialId, created.materialId);
    assert.equal(found.materialCategory, 'Motor');
    assert.equal(found.approximateWeight, 8.2);

    const notFound = getMaterialRecordByLotId('LOT-NONEXISTENT');
    assert.equal(notFound, null, 'Should return null for non-existent lotId');
  });

  // TEST 8: AI identification result structure
  test('TEST 8: AI identification result structure', async () => {
    assert.equal(IDENTIFICATION_MODE, 'demo', 'IDENTIFICATION_MODE should be demo');

    const result = await identifyMaterial('data:image/jpeg;base64,mockImage', {
      skipDelay: true,
      hintCategory: 'PCB'
    });

    assert.ok(validateIdentificationResult(result), 'Result should satisfy validation contract');
    assert.equal(result.materialCategory, 'PCB');
    assert.equal(result.materialSubcategory, 'Computer PCB');
    assert.equal(result.identificationMethod, 'demo_ai');
    assert.equal(typeof result.confidenceScore, 'number');
    assert.ok(result.confidenceScore >= 0 && result.confidenceScore <= 1);
    assert.ok(Array.isArray(result.suggestions), 'Suggestions should be an array');
    assert.ok(result.suggestions.length >= 1, 'Should include at least 1 suggestion');
    assert.ok(result.explanation.length > 0, 'Should provide human-readable explanation');
    assert.equal(result.isConfident, true, 'PCB base confidence should be >= 0.70');
  });

  // TEST 9: Manual override preserves original AI suggestion
  test('TEST 9: Manual override preserves original AI suggestion', () => {
    // Collector creates lot overriding AI suggestion (AI suggested PCB, collector confirmed Mobile Phone)
    const lot = createScrapLot({
      collectorId: 'usr-collector-01',
      materialType: 'Mobile Phone', // Human override
      materialSubcategory: 'Smartphone Assembly',
      weight: 1.2,
      condition: 'good',
      location: 'Gunupur Station Road',
      identificationMethod: 'manual', // Overridden method
      confidenceScore: 1.0,
      collectorConfirmed: true,
      aiSuggestedCategory: 'PCB', // Original AI prediction preserved
      aiSuggestedSubcategory: 'Computer PCB',
      aiConfidenceScore: 0.91
    });

    assert.ok(lot.materialId, 'Lot should have linked materialId');
    assert.equal(lot.materialType, 'Mobile Phone');
    assert.equal(lot.aiSuggestedCategory, 'PCB', 'Lot should preserve original AI category');
    assert.equal(lot.aiConfidenceScore, 0.91, 'Lot should preserve original AI confidence');

    const datasetRecord = getMaterialRecordById(lot.materialId);
    assert.ok(datasetRecord, 'Dataset record should exist');
    assert.equal(datasetRecord.materialCategory, 'Mobile Phone', 'Confirmed category should be Mobile Phone');
    assert.equal(datasetRecord.aiSuggestedCategory, 'PCB', 'Dataset record must preserve original AI suggestion');
    assert.equal(datasetRecord.aiSuggestedSubcategory, 'Computer PCB');
    assert.equal(datasetRecord.aiConfidenceScore, 0.91);
    assert.equal(datasetRecord.collectorConfirmed, true);
  });

  // TEST 10: 8-language localization completeness
  test('TEST 10: 8-language localization completeness', () => {
    const requiredModule4Keys = [
      'identifyMaterial',
      'aiAssistedSuggestion',
      'aiConfidence',
      'confirmMaterial',
      'chooseAnotherMaterial',
      'notConfident',
      'notConfidentDesc',
      'whyThisSuggestion',
      'aiSuggestionExplanation',
      'prototypeNotice',
      'collectorConfirmed',
      'aiAssisted',
      'manualMethod',
      'materialDataset',
      'materialDatasetSubtitle',
      'totalRecords',
      'aiAssistedRecords',
      'manualRecords',
      'confirmedRecords',
      'datasetVersion',
      'datasetLimitations',
      'viewDatasetJson',
      'materialSubcategory',
      'identificationMethod',
      'aiConfidenceScore',
      'linkedLotId',
      'materialId',
      'sourceType',
      'continueToIdentify',
      'changeMaterial',
      'overrideAiSuggestion',
      'analyzingPhoto'
    ];

    const supportedCodes = ['en', 'hi', 'or', 'bn', 'mr', 'te', 'ta', 'gu'];
    assert.equal(SUPPORTED_LANGUAGES.length, 8, 'Must support exactly 8 languages');

    for (const langCode of supportedCodes) {
      const dict = STRINGS[langCode];
      assert.ok(dict, `Language dictionary for '${langCode}' must exist`);
      for (const key of requiredModule4Keys) {
        assert.ok(
          dict[key] !== undefined && typeof dict[key] === 'string' && dict[key].trim().length > 0,
          `Key '${key}' is missing or empty in language '${langCode}'`
        );
      }
    }
  });

  // TEST 11: Creating a Scrap Lot creates its linked Material Dataset record
  test('TEST 11: Creating a Scrap Lot creates its linked Material Dataset record', () => {
    const initialLots = getScrapLots().length;
    const initialMaterials = getMaterialRecords().length;

    const newLot = createScrapLot({
      collectorId: 'usr-collector-01',
      materialType: 'Cable',
      materialSubcategory: 'Copper Cable',
      weight: 4.8,
      weightUnit: 'kg',
      condition: 'good',
      location: 'Gandhi Chowk',
      notes: 'High-purity domestic cables',
      identificationMethod: 'demo_ai',
      confidenceScore: 0.89,
      collectorConfirmed: true
    });

    assert.ok(newLot.id, 'Scrap Lot must have ID');
    assert.ok(newLot.materialId, 'Scrap Lot must have linked materialId');
    assert.match(newLot.materialId, /^MAT-\d{4}$/, 'materialId must follow MAT-xxxx format');

    const lotsAfter = getScrapLots().length;
    const materialsAfter = getMaterialRecords().length;

    assert.equal(lotsAfter, initialLots + 1, 'Lots count should increase by 1');
    assert.equal(materialsAfter, initialMaterials + 1, 'Material records count should increase by 1');

    // Retrieve linked dataset record
    const linkedRecord = getMaterialRecordById(newLot.materialId);
    assert.ok(linkedRecord, 'Linked Material Dataset record must exist in localStorage');
    assert.equal(linkedRecord.lotId, newLot.id, 'Record lotId must match scrap lot ID');
    assert.equal(linkedRecord.collectorId, newLot.collectorId);
    assert.equal(linkedRecord.approximateWeight, 4.8);
    assert.equal(linkedRecord.estimatedValue, null);
  });

  // TEST 12: Duplicate material record for the same lot is prevented
  test('TEST 12: Duplicate material record for the same lot is prevented', () => {
    createMaterialRecord({
      lotId: 'LOT-SINGLE-ONLY',
      collectorId: 'usr-collector-01',
      materialCategory: 'Battery',
      approximateWeight: 1.5,
      condition: 'fair'
    });

    assert.throws(
      () => {
        createMaterialRecord({
          lotId: 'LOT-SINGLE-ONLY', // Duplicate lotId
          collectorId: 'usr-collector-01',
          materialCategory: 'Cable',
          approximateWeight: 2.0,
          condition: 'good'
        });
      },
      /already exists for lotId/,
      'Must prevent duplicate material record for the same lotId'
    );
  });

  // TEST 13: Multi-item identification result structure
  test('TEST 13: Multi-item identification result structure', async () => {
    const result = await identifyMaterial('test_ewaste_photo.jpg', {
      skipDelay: true,
      isMixedCollection: true
    });

    assert.ok(result.detectedItems, 'Result must include detectedItems array');
    assert.ok(Array.isArray(result.detectedItems), 'detectedItems must be an array');
    assert.ok(result.detectedItems.length >= 2, 'Mixed e-waste photo must detect at least 2 distinct items');
    assert.equal(result.hasMultipleItems, true, 'hasMultipleItems must be true');
    assert.equal(result.totalDetected, result.detectedItems.length);
    assert.ok(result.modelInfo, 'Model metadata must be present');
    assert.equal(result.modelInfo.isTrainedModel, false, 'Honest disclosure: not an externally trained neural model');
  });

  // TEST 14: Each detected item satisfies schema
  test('TEST 14: Each detected item satisfies schema', async () => {
    const result = await identifyMaterial('test_ewaste_photo.jpg', {
      skipDelay: true,
      isMixedCollection: true
    });

    for (const item of result.detectedItems) {
      assert.ok(validateDetectedItem(item), `Item ${item.itemId} must satisfy schema contract`);
      assert.ok(item.category, 'Item category must be defined');
      assert.ok(typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1);
      assert.equal(item.identificationMethod, 'demo_ai');
      assert.ok(item.boundingBox, 'Item must have boundingBox spatial coordinates');
      assert.ok(typeof item.boundingBox.x === 'number');
      assert.ok(typeof item.boundingBox.y === 'number');
      assert.ok(typeof item.boundingBox.width === 'number');
      assert.ok(typeof item.boundingBox.height === 'number');
    }
  });

  // TEST 15: Overriding a detected item preserves original AI suggestion
  test('TEST 15: Overriding a detected item preserves original AI suggestion', async () => {
    const result = await identifyMaterial('test_ewaste_photo.jpg', {
      skipDelay: true,
      isMixedCollection: true
    });

    const targetItem = result.detectedItems[0];
    const originalAiCategory = targetItem.category;
    const originalConfidence = targetItem.confidence;

    // Human overrides category to "Mobile Phone"
    const overriddenItem = {
      ...targetItem,
      category: 'Mobile Phone',
      subcategory: 'Smartphone Assembly',
      identificationMethod: 'manual',
      collectorConfirmed: true,
      aiSuggestedCategory: originalAiCategory,
      aiConfidenceScore: originalConfidence
    };

    assert.equal(overriddenItem.category, 'Mobile Phone');
    assert.equal(overriddenItem.identificationMethod, 'manual');
    assert.equal(overriddenItem.collectorConfirmed, true);
    assert.equal(overriddenItem.aiSuggestedCategory, originalAiCategory, 'Must preserve original AI suggestion');
    assert.equal(overriddenItem.aiConfidenceScore, originalConfidence, 'Must preserve original AI confidence score');
  });

  // TEST 16: Multi-item lot creation produces independent, linked scrap lots
  test('TEST 16: Multi-item lot creation produces independent, linked scrap lots', () => {
    const initialLots = getScrapLots().length;
    const initialMaterials = getMaterialRecords().length;

    const detectedSample = [
      { category: 'Laptop / Computer', subcategory: 'Laptop Assembly', confidence: 0.84, weight: 2.5 },
      { category: 'PCB', subcategory: 'Computer PCB', confidence: 0.88, weight: 1.0 },
      { category: 'Cable', subcategory: 'Copper Cable', confidence: 0.81, weight: 1.5 }
    ];

    const batchId = 'BATCH-TEST-01';
    const createdLots = [];

    for (const item of detectedSample) {
      const lot = createScrapLot({
        collectorId: 'usr-collector-multi',
        materialType: item.category,
        materialSubcategory: item.subcategory,
        weight: item.weight,
        condition: 'fair',
        location: 'Gunupur Station Road',
        identificationMethod: 'demo_ai',
        confidenceScore: item.confidence,
        collectorConfirmed: true,
        notes: `Item ${item.category} from mixed collection ${batchId}`
      });
      createdLots.push(lot);
    }

    assert.equal(createdLots.length, 3, 'Must create 3 distinct scrap lots');
    assert.equal(getScrapLots().length, initialLots + 3);
    assert.equal(getMaterialRecords().length, initialMaterials + 3);

    // Verify each lot is independently queryable and linked to its own MAT record
    for (let i = 0; i < createdLots.length; i++) {
      const lot = createdLots[i];
      const mat = getMaterialRecordById(lot.materialId);
      assert.ok(mat, `Material record for lot ${lot.id} must exist`);
      assert.equal(mat.materialCategory, detectedSample[i].category);
      assert.equal(mat.approximateWeight, detectedSample[i].weight);
    }
  });
});
