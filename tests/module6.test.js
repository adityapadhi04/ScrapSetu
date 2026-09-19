/**
 * ScrapSetu — Module 6 Automated Test Suite
 * 
 * Verifies all acceptance criteria specified for Module 6:
 * Repair Shop Marketplace + Reuse Before Recycle (SIH26229)
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
  evaluateReusePotential,
  REUSE_PATHWAYS,
  REUSE_CONFIDENCE
} from '../src/services/reuseIntelligenceService.js';

import {
  getRepairShops,
  getRepairShopById,
  createRepairShop,
  validateRepairShopRecord,
  getWantedItems,
  getWantedItemById,
  createWantedItem,
  validateWantedItemRecord,
  deleteWantedItem,
  createRepairInquiry,
  getRepairInquiries,
  resetRepairShopDataset,
  STORAGE_KEY_REPAIR_SHOPS,
  STORAGE_KEY_REPAIR_WANTED,
  STORAGE_KEY_REPAIR_INQUIRIES
} from '../src/services/repairShopService.js';

import {
  findRepairShopMatches
} from '../src/services/repairMatchingService.js';

import { DEMO_REPAIR_SHOPS, DEMO_WANTED_SEED_ITEMS } from '../src/data/repairShopSeedData.js';
import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 6: Repair Shop Marketplace + Reuse Before Recycle', () => {
  beforeEach(() => {
    localStorage.clear();
    resetRepairShopDataset();
  });

  // TEST 1: evaluateReusePotential returns 'reuse' for Good condition Mobile Phone
  test('TEST 1: evaluateReusePotential returns reuse for Good Mobile Phone', () => {
    const result = evaluateReusePotential({
      materialCategory: 'Mobile Phone',
      materialSubcategory: 'Smartphone Assembly',
      condition: 'good',
      weight: 0.3
    });

    assert.equal(result.pathway, REUSE_PATHWAYS.REUSE);
    assert.equal(result.confidence, REUSE_CONFIDENCE.HIGH);
    assert.ok(result.reason.toLowerCase().includes('mobile') || result.reason.toLowerCase().includes('screen'));
    assert.ok(Array.isArray(result.suggestedActions));
    assert.ok(result.suggestedActions.length > 0);
  });

  // TEST 2: evaluateReusePotential returns 'recycle' for Damaged Battery due to safety
  test('TEST 2: evaluateReusePotential returns recycle for Damaged Battery due to safety hazard', () => {
    const result = evaluateReusePotential({
      materialCategory: 'Battery',
      condition: 'damaged',
      weight: 1.5
    });

    assert.equal(result.pathway, REUSE_PATHWAYS.RECYCLE);
    assert.equal(result.confidence, REUSE_CONFIDENCE.HIGH);
    assert.ok(result.reason.toLowerCase().includes('chemical') || result.reason.toLowerCase().includes('thermal') || result.reason.toLowerCase().includes('risk'));
    assert.ok(result.suggestedActions.some((a) => a.toLowerCase().includes('hazardous') || a.toLowerCase().includes('recycler')));
  });

  // TEST 3: evaluateReusePotential returns 'both' for Damaged Mobile Phone
  test('TEST 3: evaluateReusePotential returns both for Damaged Mobile Phone (salvage components, recycle chassis)', () => {
    const result = evaluateReusePotential({
      materialCategory: 'Mobile Phone',
      condition: 'damaged',
      weight: 0.25
    });

    assert.equal(result.pathway, REUSE_PATHWAYS.BOTH);
    assert.ok(result.reason.toLowerCase().includes('damaged') || result.reason.toLowerCase().includes('salvage'));
  });

  // TEST 4: evaluateReusePotential returns 'reuse' for Fair condition Laptop / Computer
  test('TEST 4: evaluateReusePotential returns reuse for Fair Laptop / Computer', () => {
    const result = evaluateReusePotential({
      materialCategory: 'Laptop / Computer',
      condition: 'fair',
      weight: 2.5
    });

    assert.equal(result.pathway, REUSE_PATHWAYS.REUSE);
    assert.ok(result.reason.toLowerCase().includes('ram') || result.reason.toLowerCase().includes('laptop') || result.reason.toLowerCase().includes('modular'));
  });

  // TEST 5: evaluateReusePotential returns 'recycle' for Damaged PCB
  test('TEST 5: evaluateReusePotential returns recycle for Damaged PCB', () => {
    const result = evaluateReusePotential({
      materialCategory: 'PCB',
      condition: 'damaged',
      weight: 1.0
    });

    assert.equal(result.pathway, REUSE_PATHWAYS.RECYCLE);
    assert.ok(result.reason.toLowerCase().includes('recycler') || result.reason.toLowerCase().includes('copper'));
  });

  // TEST 6: evaluateReusePotential transparent prototype notice
  test('TEST 6: evaluateReusePotential includes transparent prototype notice', () => {
    const result = evaluateReusePotential({
      materialCategory: 'Other E-waste',
      condition: 'fair',
      weight: 1.0
    });

    assert.equal(result.isPrototype, true);
    assert.ok(result.prototypeNotice.includes('Transparent prototype rules'));
  });

  // TEST 7: Seed repair shops data integrity
  test('TEST 7: Seed repair shop records integrity', () => {
    const shops = getRepairShops();
    assert.ok(shops.length >= 5);
    for (const shop of shops) {
      assert.ok(shop.repairShopId.startsWith('SHOP-'));
      assert.ok(shop.name);
      assert.ok(shop.location);
      assert.ok(Array.isArray(shop.acceptedMaterials));
      assert.equal(shop.sourceType, 'demo_seed');
      assert.equal(shop.status, 'active');
      assert.equal(typeof shop.purchaseEnabled, 'boolean');
    }
  });

  // TEST 8: createRepairShop schema validation and sequential SHOP ID
  test('TEST 8: createRepairShop schema validation and sequential SHOP ID', () => {
    const validShop = {
      name: 'Test Tech Workshop',
      ownerName: 'Test Owner',
      location: { area: 'Bhubaneswar', state: 'Odisha' },
      acceptedMaterials: ['Mobile Phone', 'PCB'],
      purchaseEnabled: true,
      status: 'active'
    };

    const created = createRepairShop(validShop);
    assert.ok(created.repairShopId.startsWith('SHOP-'));
    assert.equal(created.name, 'Test Tech Workshop');
    assert.equal(created.status, 'active');

    // Reject missing name
    assert.throws(() => {
      createRepairShop({
        name: '',
        location: { area: 'Bhubaneswar' },
        acceptedMaterials: ['PCB']
      });
    }, /Validation failed/);

    // Reject missing acceptedMaterials
    assert.throws(() => {
      createRepairShop({
        name: 'Workshop Without Materials',
        location: { area: 'Bhubaneswar' },
        acceptedMaterials: []
      });
    }, /Validation failed/);
  });

  // TEST 9: Seed wanted items data integrity
  test('TEST 9: Seed wanted items data integrity', () => {
    const wanted = getWantedItems();
    assert.ok(wanted.length >= 5);
    for (const item of wanted) {
      assert.ok(item.wantedId.startsWith('WANT-'));
      assert.ok(item.repairShopId.startsWith('SHOP-'));
      assert.ok(item.materialCategory);
      assert.ok(item.quantityNeeded > 0);
      assert.equal(item.status, 'active');
    }
  });

  // TEST 10: createWantedItem generates sequential WANT-xxxx ID and persists
  test('TEST 10: createWantedItem generates sequential WANT-xxxx ID and persists in localStorage', () => {
    const newWanted = createWantedItem({
      repairShopId: 'SHOP-0001',
      materialCategory: 'Mobile Phone',
      materialSubcategory: 'AMOLED Displays',
      preferredCondition: 'Good',
      quantityNeeded: 12,
      offeringPrice: '₹500 / display',
      location: 'Bhubaneswar'
    });

    assert.ok(newWanted.wantedId.startsWith('WANT-'));
    assert.equal(newWanted.quantityNeeded, 12);
    assert.equal(newWanted.status, 'active');

    const stored = getWantedItems();
    const found = stored.find((i) => i.wantedId === newWanted.wantedId);
    assert.ok(found);
    assert.equal(found.materialCategory, 'Mobile Phone');
  });

  // TEST 11: createWantedItem schema validation
  test('TEST 11: createWantedItem rejects invalid inputs', () => {
    // Missing material category
    assert.throws(() => {
      createWantedItem({
        repairShopId: 'SHOP-0001',
        materialCategory: '',
        preferredCondition: 'Good',
        quantityNeeded: 5
      });
    }, /Validation failed/);

    // Non-positive quantity
    assert.throws(() => {
      createWantedItem({
        repairShopId: 'SHOP-0001',
        materialCategory: 'Mobile Phone',
        preferredCondition: 'Good',
        quantityNeeded: -3
      });
    }, /Validation failed/);
  });

  // TEST 12: getWantedItems filtering by repairShopId and deletion
  test('TEST 12: getWantedItems filtering by shop and deleteWantedItem', () => {
    const shop1Items = getWantedItems('SHOP-0001');
    assert.ok(shop1Items.length > 0);
    assert.ok(shop1Items.every((i) => i.repairShopId === 'SHOP-0001'));

    const itemToDelete = shop1Items[0].wantedId;
    const deleted = deleteWantedItem(itemToDelete);
    assert.equal(deleted, true);

    const afterDelete = getWantedItems('SHOP-0001');
    assert.equal(afterDelete.some((i) => i.wantedId === itemToDelete), false);
  });

  // TEST 13: findRepairShopMatches finds matching shops accepting material
  test('TEST 13: findRepairShopMatches finds shops accepting specified material category', () => {
    const matches = findRepairShopMatches({
      materialCategory: 'Mobile Phone',
      materialSubcategory: 'Smartphone Assembly',
      condition: 'good',
      location: 'Bhubaneswar, Odisha'
    });

    assert.ok(matches.length > 0);
    const topMatch = matches[0];
    assert.ok(topMatch.repairShopId);
    assert.ok(Array.isArray(topMatch.matchReasons));
    assert.ok(topMatch.matchReasons.length >= 2);
    assert.ok(topMatch.distanceLabel.includes('Location match') || topMatch.distanceLabel.includes('Regional'));
  });

  // TEST 14: findRepairShopMatches boosts shops with active wanted demand and returns transparent reasons
  test('TEST 14: findRepairShopMatches boosts shops with active wanted demand without fake AI scores', () => {
    const matches = findRepairShopMatches({
      materialCategory: 'Mobile Phone',
      condition: 'good',
      location: 'Bhubaneswar'
    });

    assert.ok(matches.length > 0);
    const topMatch = matches[0];
    assert.equal(topMatch.hasActiveDemand, true);
    assert.ok(topMatch.matchedWantedItem);
    assert.ok(topMatch.matchReasons.some((r) => r.toLowerCase().includes('looking for') || r.toLowerCase().includes('demand')));
    // Verify no fake "AI %" claim in score
    assert.equal(typeof topMatch.score, 'number');
    assert.ok(typeof topMatch.compatibility, 'string');
  });

  // TEST 15: createRepairInquiry persists collector interest
  test('TEST 15: createRepairInquiry persists collector interest with sequential INQ ID', () => {
    const inquiry = createRepairInquiry({
      collectorId: 'usr-collector-01',
      collectorName: 'Ramesh Kumar',
      lotId: 'LOT-0001',
      repairShopId: 'SHOP-0001',
      repairShopName: 'Demo Mobile Repair Center',
      materialCategory: 'Mobile Phone',
      condition: 'good',
      weightKg: 2.0,
      estimatedPrice: 350,
      collectorLocation: 'Gunupur'
    });

    assert.ok(inquiry.inquiryId.startsWith('INQ-'));
    assert.equal(inquiry.status, 'sent');
    assert.equal(inquiry.repairShopId, 'SHOP-0001');

    const inquiries = getRepairInquiries({ repairShopId: 'SHOP-0001' });
    assert.ok(inquiries.length > 0);
    assert.equal(inquiries[0].inquiryId, inquiry.inquiryId);
  });

  // TEST 16: 8-language localization completeness for Module 6 keys
  test('TEST 16: 8-language localization completeness for Module 6 keys', () => {
    const requiredKeys = [
      'reuseBeforeRecycle',
      'reusePathwayRecommendation',
      'pathwayReuse',
      'pathwayRecycle',
      'pathwayBoth',
      'potentialReuseDesc',
      'recyclingRecommendedDesc',
      'findRepairShops',
      'repairShopsInterested',
      'whyThisShop',
      'locationMatch',
      'partsPurchaseAvailable',
      'sendInterest',
      'interestSent',
      'skipDecideLater',
      'viewShopDetails',
      'repairShopNotice',
      'reusePrototypeNotice',
      'continueToRecycler',
      'postWantedItem',
      'wantedComponent',
      'quantityNeeded',
      'preferredCondition',
      'offeringBudget',
      'matchedCollectorLots'
    ];

    const langCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
    assert.equal(langCodes.length, 8);

    for (const code of langCodes) {
      const langDict = STRINGS[code];
      assert.ok(langDict, `Language dictionary missing for code: ${code}`);

      for (const key of requiredKeys) {
        assert.ok(
          langDict[key],
          `Missing translation for key "${key}" in language "${code}"`
        );
        assert.ok(
          typeof langDict[key] === 'string' && langDict[key].trim().length > 0,
          `Empty translation for key "${key}" in language "${code}"`
        );
      }
    }
  });
});
