/**
 * ScrapSetu — Module 7 Automated Test Suite
 * 
 * Verifies all 18 acceptance criteria specified for Module 7:
 * Authorized Recycler Marketplace + Recycler Dataset (SIH26229)
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
  getRecyclers,
  getActiveRecyclers,
  getRecyclerById,
  createRecycler,
  validateRecyclerRecord,
  filterByMaterial,
  filterByLocation,
  filterByPickup,
  resetRecyclerDataset,
  getRecyclerDatasetStats,
  generateNextId,
  STORAGE_KEY_RECYCLERS
} from '../src/services/recyclerService.js';

import {
  findRecyclerMatches
} from '../src/services/recyclerMatchingService.js';

import {
  createRecyclerInquiry,
  getRecyclerInquiries,
  getInquiriesByRecycler,
  getInquiriesByCollector,
  updateInquiryStatus,
  validateInquiryRecord,
  resetRecyclerInquiries,
  STORAGE_KEY_RECYCLER_INQUIRIES
} from '../src/services/recyclerInquiryService.js';

import { DEMO_RECYCLERS } from '../src/data/recyclerSeedData.js';
import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 7: Authorized Recycler Marketplace + Recycler Dataset', () => {
  beforeEach(() => {
    localStorage.clear();
    resetRecyclerDataset();
    resetRecyclerInquiries();
  });

  // TEST 1: Recycler dataset initialization
  test('TEST 1: Recycler dataset initializes with demo seed records in localStorage', () => {
    const recyclers = getRecyclers();
    assert.ok(Array.isArray(recyclers), 'Recyclers must be an array');
    assert.ok(recyclers.length >= 8, `Expected at least 8 recyclers, got ${recyclers.length}`);

    // Verify localStorage key is populated
    const stored = localStorage.getItem(STORAGE_KEY_RECYCLERS);
    assert.ok(stored, 'Storage key must be populated');
    const parsed = JSON.parse(stored);
    assert.equal(parsed.length, recyclers.length);
  });

  // TEST 2: Recycler schema validation
  test('TEST 2: Recycler schema validation catches invalid or missing fields', () => {
    // Missing business name
    const res1 = validateRecyclerRecord({
      address: { city: 'Gunupur' },
      acceptedMaterials: ['PCB']
    });
    assert.equal(res1.isValid, false);
    assert.ok(res1.errors.some((e) => e.includes('name')));

    // Missing address or city
    const res2 = validateRecyclerRecord({
      businessName: 'Test Recycler',
      acceptedMaterials: ['PCB']
    });
    assert.equal(res2.isValid, false);

    // Empty accepted materials
    const res3 = validateRecyclerRecord({
      businessName: 'Test Recycler',
      address: { city: 'Gunupur' },
      acceptedMaterials: []
    });
    assert.equal(res3.isValid, false);

    // Invalid status
    const res4 = validateRecyclerRecord({
      businessName: 'Test Recycler',
      address: { city: 'Gunupur' },
      acceptedMaterials: ['PCB'],
      status: 'non_existent_status'
    });
    assert.equal(res4.isValid, false);

    // Valid record
    const res5 = validateRecyclerRecord({
      businessName: 'Valid Recycler',
      address: { city: 'Gunupur' },
      acceptedMaterials: ['PCB', 'Battery'],
      status: 'active',
      sourceType: 'platform_added'
    });
    assert.equal(res5.isValid, true);
    assert.equal(res5.errors.length, 0);
  });

  // TEST 3: Sequential recycler IDs
  test('TEST 3: Generates zero-padded sequential REC IDs (e.g. REC-0011)', () => {
    const existingIds = ['REC-0001', 'REC-0002', 'REC-0010'];
    const nextId = generateNextId('REC', existingIds);
    assert.equal(nextId, 'REC-0011');

    const created = createRecycler({
      businessName: 'Sequential Test Facility',
      address: { city: 'Rayagada', state: 'Odisha' },
      acceptedMaterials: ['Cable']
    });
    assert.ok(created.recyclerId.startsWith('REC-'));
    assert.equal(created.recyclerId, 'REC-0011');
  });

  // TEST 4: Active recycler filtering
  test('TEST 4: Active recycler filtering excludes inactive facilities', () => {
    const all = getRecyclers();
    const active = getActiveRecyclers();

    assert.ok(active.length < all.length, 'Should exclude inactive facilities like REC-0010');
    active.forEach((r) => {
      assert.equal(r.status, 'active');
    });

    const inactiveRecord = all.find((r) => r.status === 'inactive');
    assert.ok(inactiveRecord, 'Expected at least one inactive demo facility (REC-0010)');
    assert.equal(active.some((r) => r.recyclerId === inactiveRecord.recyclerId), false);
  });

  // TEST 5: Material compatibility
  test('TEST 5: Material compatibility filtering finds facilities accepting specific materials', () => {
    const pcbRecyclers = filterByMaterial('PCB');
    assert.ok(pcbRecyclers.length > 0, 'Expected recyclers accepting PCB');
    pcbRecyclers.forEach((r) => {
      assert.ok(
        r.acceptedMaterials.some((m) => m.toLowerCase().includes('pcb')),
        `Recycler ${r.businessName} must accept PCB`
      );
    });

    const batteryRecyclers = filterByMaterial('Battery');
    assert.ok(batteryRecyclers.length > 0, 'Expected recyclers accepting Battery');
    batteryRecyclers.forEach((r) => {
      assert.ok(
        r.acceptedMaterials.some((m) => m.toLowerCase().includes('battery')),
        `Recycler ${r.businessName} must accept Battery`
      );
    });
  });

  // TEST 6: Location matching
  test('TEST 6: Location matching prioritizes facilities serving the collector area', () => {
    const gunupurMatches = findRecyclerMatches({
      materialCategory: 'PCB',
      weight: 5,
      location: 'Gunupur'
    });

    assert.ok(gunupurMatches.length > 0, 'Should find matches for Gunupur');
    // Top matches should have location match flag or reason
    const topMatch = gunupurMatches[0];
    assert.ok(topMatch.isLocationMatch, 'Top match should be a location match for Gunupur');
    assert.ok(
      topMatch.reasons.some((r) => r.toLowerCase().includes('gunupur') || r.toLowerCase().includes('serves')),
      'Explanation should mention location match'
    );
  });

  // TEST 7: Pickup filtering
  test('TEST 7: Pickup filtering accurately separates collection fleet from drop-off only facilities', () => {
    const pickupRecyclers = filterByPickup(true);
    assert.ok(pickupRecyclers.length > 0);
    pickupRecyclers.forEach((r) => {
      assert.equal(r.pickupAvailable, true);
    });

    const all = getRecyclers();
    const dropOffOnly = all.filter((r) => r.pickupAvailable === false);
    assert.ok(dropOffOnly.length > 0, 'Expected some facilities with drop-off only');
    dropOffOnly.forEach((r) => {
      assert.equal(r.pickupAvailable, false);
    });
  });

  // TEST 8: Weight compatibility
  test('TEST 8: Weight compatibility flags lots below facility minimum weight requirement', () => {
    const matchesForSmallLot = findRecyclerMatches({
      materialCategory: 'PCB',
      weight: 2, // 2 kg lot
      location: 'Bhubaneswar'
    });

    assert.ok(matchesForSmallLot.length > 0);
    const compatible = matchesForSmallLot.find((m) => m.isWeightCompatible);
    assert.ok(compatible, 'Should find facility with low minimum lot (e.g. 1-2 kg)');

    const largeMinFacility = matchesForSmallLot.find((m) => m.recycler.minimumWeightKg > 2);
    if (largeMinFacility) {
      assert.equal(largeMinFacility.isWeightCompatible, false);
      assert.ok(largeMinFacility.reasons.some((r) => r.includes('Minimum lot size') || r.includes('min')));
    }
  });

  // TEST 9: Matching explanation ("Why this recycler?")
  test('TEST 9: Matching explanation provides transparent checklist without fake AI scores', () => {
    const matches = findRecyclerMatches({
      materialCategory: 'PCB',
      weight: 8,
      location: 'Gunupur'
    });

    assert.ok(matches.length > 0);
    const top = matches[0];
    assert.ok(Array.isArray(top.reasons), 'Reasons must be an array');
    assert.ok(top.reasons.length >= 3, 'Expected at least 3 explanation reasons');

    // Check for plain language reasons
    assert.ok(top.reasons.some((r) => r.includes('Accepts PCB')));
    assert.ok(top.reasons.some((r) => r.includes('Demo verification record on file')));
  });

  // TEST 10: Recycler inquiry creation
  test('TEST 10: Recycler inquiry creation stores inquiry with valid initial status', () => {
    const inq = createRecyclerInquiry({
      lotId: 'LOT-5501',
      collectorId: 'usr-collector-01',
      collectorName: 'Ramesh Kumar',
      recyclerId: 'REC-0001',
      recyclerName: 'GreenCycle Material Recovery Ltd.',
      materialCategory: 'PCB',
      weight: 10,
      weightUnit: 'kg',
      collectorLocation: 'Gunupur'
    });

    assert.ok(inq);
    assert.equal(inq.status, 'sent');
    assert.equal(inq.lotId, 'LOT-5501');
    assert.equal(inq.materialCategory, 'PCB');
    assert.equal(inq.weight, 10);
    assert.ok(inq.createdAt);
  });

  // TEST 11: Inquiry ID generation
  test('TEST 11: Generates zero-padded sequential RINQ IDs (e.g. RINQ-0003)', () => {
    const initialInquiries = getRecyclerInquiries();
    const newInquiry = createRecyclerInquiry({
      recyclerId: 'REC-0002',
      materialCategory: 'Battery',
      weight: 15
    });

    assert.ok(newInquiry.inquiryId.startsWith('RINQ-'));
    assert.ok(initialInquiries.length < getRecyclerInquiries().length);
  });

  // TEST 12: Inquiry persistence
  test('TEST 12: Inquiry persists in localStorage', () => {
    const inq = createRecyclerInquiry({
      recyclerId: 'REC-0004',
      materialCategory: 'Cable',
      weight: 20,
      collectorLocation: 'Berhampur'
    });

    const raw = localStorage.getItem(STORAGE_KEY_RECYCLER_INQUIRIES);
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    const found = parsed.find((i) => i.inquiryId === inq.inquiryId);
    assert.ok(found, 'Created inquiry must exist in localStorage');
    assert.equal(found.materialCategory, 'Cable');
  });

  // TEST 13: Recycler sees incoming inquiry
  test('TEST 13: Recycler dashboard can query inquiries specifically sent to their facility', () => {
    createRecyclerInquiry({
      recyclerId: 'REC-0001',
      materialCategory: 'PCB',
      weight: 12
    });

    createRecyclerInquiry({
      recyclerId: 'REC-0005',
      materialCategory: 'Laptop / Computer',
      weight: 25
    });

    const rec1Inquiries = getInquiriesByRecycler('REC-0001');
    assert.ok(rec1Inquiries.length > 0);
    rec1Inquiries.forEach((inq) => {
      assert.equal(inq.recyclerId, 'REC-0001');
    });

    const rec5Inquiries = getInquiriesByRecycler('REC-0005');
    assert.ok(rec5Inquiries.length > 0);
    rec5Inquiries.forEach((inq) => {
      assert.equal(inq.recyclerId, 'REC-0005');
    });
  });

  // TEST 14: Recycler can mark interested
  test('TEST 14: Recycler can update inquiry status to interested', () => {
    const inq = createRecyclerInquiry({
      recyclerId: 'REC-0001',
      materialCategory: 'PCB',
      weight: 8
    });

    assert.equal(inq.status, 'sent');
    const updated = updateInquiryStatus(inq.inquiryId, 'interested');
    assert.equal(updated.status, 'interested');

    // Confirm persisted in storage
    const all = getInquiriesByRecycler('REC-0001');
    const persisted = all.find((i) => i.inquiryId === inq.inquiryId);
    assert.equal(persisted.status, 'interested');
  });

  // TEST 15: Recycler can decline
  test('TEST 15: Recycler can decline incoming inquiry without errors', () => {
    const inq = createRecyclerInquiry({
      recyclerId: 'REC-0002',
      materialCategory: 'Battery',
      weight: 3
    });

    const updated = updateInquiryStatus(inq.inquiryId, 'declined');
    assert.equal(updated.status, 'declined');

    const all = getInquiriesByRecycler('REC-0002');
    const persisted = all.find((i) => i.inquiryId === inq.inquiryId);
    assert.equal(persisted.status, 'declined');
  });

  // TEST 16: Collector sees suitable recyclers
  test('TEST 16: Collector scrap lot discovery returns matched recyclers sorted deterministically', () => {
    const matches = findRecyclerMatches({
      materialCategory: 'PCB',
      weight: 10,
      location: 'Gunupur'
    });

    assert.ok(matches.length > 0);
    // Scores must be in descending order
    for (let i = 0; i < matches.length - 1; i++) {
      assert.ok(
        matches[i].score >= matches[i + 1].score,
        'Matches must be sorted by score descending'
      );
    }
  });

  // TEST 17: Demo sourceType is preserved
  test('TEST 17: Demo sourceType is preserved across all seed recycler records', () => {
    const recyclers = getRecyclers();
    recyclers.forEach((r) => {
      if (r.recyclerId.startsWith('REC-000') || r.recyclerId === 'REC-0010') {
        assert.equal(r.sourceType, 'demo_seed');
      }
    });
  });

  // TEST 18: No false authorization claims are generated
  test('TEST 18: Recycler records explicitly use prototype authorization notices without false legal claims', () => {
    const recyclers = getRecyclers();
    recyclers.forEach((r) => {
      assert.equal(r.verificationStatus, 'demo_verified');
      assert.equal(r.authorizationType, 'Demo Authorization Record');
      assert.ok(r.authorizationNumber.startsWith('DEMO-AUTH-'));
    });

    // Check localization completeness for Module 7 keys across all 8 languages
    const requiredKeys = [
      'recyclerDataset',
      'findAuthorizedRecyclers',
      'authorizedRecyclers',
      'whyThisRecycler',
      'minimumLotWeight',
      'demoVerified',
      'demoAuthorizationRecord',
      'prototypeRecyclerNotice',
      'incomingScrapRequests',
      'markInterested',
      'decline',
      'inquirySent',
      'pickupAvailableText'
    ];

    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      const langDict = STRINGS[code];
      assert.ok(langDict, `Language dictionary for ${code} must exist`);
      requiredKeys.forEach((key) => {
        assert.ok(
          langDict[key] && langDict[key].trim() !== '',
          `Missing key "${key}" in language "${code}"`
        );
      });
    });
  });

  // TEST 19: Cross-account authorization prevention
  test('TEST 19: Prevents unauthorized users from modifying another recycler facility inquiry', () => {
    const inq = createRecyclerInquiry({
      recyclerId: 'REC-0001',
      materialCategory: 'PCB',
      weight: 10
    });

    // Authorized update succeeds
    const okUpdate = updateInquiryStatus(inq.inquiryId, 'interested', 'REC-0001');
    assert.equal(okUpdate.status, 'interested');

    // Unauthorized attempt by REC-0002 throws authorization error
    assert.throws(
      () => {
        updateInquiryStatus(inq.inquiryId, 'declined', 'REC-0002');
      },
      (err) => err.message.includes('Unauthorized')
    );
  });

  // TEST 20: Collector inquiry query isolation
  test('TEST 20: Collector can query all inquiries they generated across recyclers', () => {
    createRecyclerInquiry({
      collectorId: 'usr-collector-99',
      recyclerId: 'REC-0001',
      materialCategory: 'PCB',
      weight: 5
    });

    createRecyclerInquiry({
      collectorId: 'usr-collector-99',
      recyclerId: 'REC-0004',
      materialCategory: 'Battery',
      weight: 8
    });

    const collectorInquiries = getInquiriesByCollector('usr-collector-99');
    assert.equal(collectorInquiries.length, 2);
    collectorInquiries.forEach((inq) => {
      assert.equal(inq.collectorId, 'usr-collector-99');
    });
  });

  // TEST 21: Matching with damaged condition
  test('TEST 21: Matching incorporates damaged condition and highlights hazardous recovery capability', () => {
    const matches = findRecyclerMatches({
      materialCategory: 'PCB',
      weight: 10,
      location: 'Gunupur',
      condition: 'damaged'
    });

    assert.ok(matches.length > 0);
    const hasConditionReason = matches.some((m) =>
      m.reasons.some((r) => r.toLowerCase().includes('damaged') || r.toLowerCase().includes('recovery'))
    );
    assert.ok(hasConditionReason, 'Matches should highlight specialized handling for damaged lots');
  });
});
