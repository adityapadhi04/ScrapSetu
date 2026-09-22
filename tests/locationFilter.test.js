import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simple in-memory localStorage mock for node test environment
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

import { isLocationMatch, isRepairShopEligible, getEligibleLotsForRepairShop } from '../src/services/offerMatchingService.js';
import { createScrapLot } from '../src/services/scrapLotService.js';

describe('Repair Shop Location Filter Tests', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  test('correctly matches Repair Shop and Lot in the SAME location (e.g. Gunupur Sector 2)', () => {
    const shopLoc = 'Gunupur Sector 2';
    const lotLoc1 = 'Gunupur Sector 2';
    const lotLoc2 = 'Gunupur';
    const lotLocDiff = 'Lamington Road, Mumbai';

    assert.strictEqual(isLocationMatch(shopLoc, lotLoc1), true);
    assert.strictEqual(isLocationMatch(shopLoc, lotLoc2), true);
    assert.strictEqual(isLocationMatch(shopLoc, lotLocDiff), false);
  });

  test('rejects lots created in DIFFERENT locations for a Repair Shop', () => {
    const shopGunupur = {
      repairShopId: 'SHOP-0003',
      name: 'Gunupur Digital Clinic',
      acceptedMaterials: ['PCB', 'Mobile Phone', 'Laptop / Computer'],
      location: { area: 'Gunupur Sector 2', state: 'Odisha' }
    };

    const lotGunupur = {
      id: 'LOT-TEST-001',
      materialType: 'PCB',
      materialCategory: 'High Value Electronic Scrap',
      condition: 'fair',
      location: 'Gunupur Sector 2'
    };

    const lotMumbai = {
      id: 'LOT-TEST-002',
      materialType: 'PCB',
      materialCategory: 'High Value Electronic Scrap',
      condition: 'fair',
      location: 'Lamington Road, Mumbai'
    };

    const evalGunupur = isRepairShopEligible(shopGunupur, lotGunupur);
    assert.strictEqual(evalGunupur.eligible, true);
    assert.ok(evalGunupur.reasons.some((r) => r.includes('Location match')));

    const evalMumbai = isRepairShopEligible(shopGunupur, lotMumbai);
    assert.strictEqual(evalMumbai.eligible, false);
  });

  test('returns only same-location lots from getEligibleLotsForRepairShop', () => {
    // Create a lot in Gunupur Sector 2
    const lotGunupur = createScrapLot({
      collectorId: 'usr-collector-01',
      materialType: 'PCB',
      weight: 3,
      condition: 'fair',
      location: 'Gunupur Sector 2'
    });

    // Create a lot in Mumbai
    const lotMumbai = createScrapLot({
      collectorId: 'usr-collector-01',
      materialType: 'PCB',
      weight: 5,
      condition: 'fair',
      location: 'Lamington Road, Mumbai'
    });

    const eligibleLots = getEligibleLotsForRepairShop('SHOP-0002');
    const eligibleIds = eligibleLots.map((l) => l.id);

    // SHOP-0002 is in Gunupur, so lotGunupur should be eligible, lotMumbai should NOT
    assert.ok(eligibleIds.includes(lotGunupur.id));
    assert.ok(!eligibleIds.includes(lotMumbai.id));
  });
});
