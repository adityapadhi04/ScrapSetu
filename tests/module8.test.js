/**
 * ScrapSetu — Module 8 Automated Test Suite
 * 
 * Verifies all 23 acceptance criteria and architectural invariants specified for Module 8:
 * Offer & Matching Engine (SIH26229)
 * 
 * Strict Invariants:
 * - Deterministic checklists (reasons array) without opaque AI scores
 * - Non-binding collector selection (no payments, transactions, QR, or physical handovers)
 * - Lot state tracks offerStatus ('none' | 'offers_available' | 'offer_selected')
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
  STORAGE_KEY_OFFERS,
  VALID_BUYER_ROLES,
  VALID_OFFER_STATUSES,
  initializeOffers,
  getOffers,
  generateNextOfferId,
  validateOffer,
  createOffer,
  getOfferById,
  getOffersForLot,
  getOffersForBuyer,
  getOffersForCollector,
  updateOfferStatus,
  acceptOffer,
  getOfferStats,
  resetOfferDataset
} from '../src/services/offerService.js';

import {
  isRepairShopEligible,
  getEligibleLotsForRepairShop,
  isRecyclerEligible,
  getEligibleLotsForRecycler
} from '../src/services/offerMatchingService.js';

import {
  getAllScrapLots,
  getScrapLotById,
  updateScrapLotOfferStatus,
  createScrapLot
} from '../src/services/scrapLotService.js';

import { SEED_OFFERS } from '../src/data/offerSeedData.js';
import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 8: Offer & Matching Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    resetOfferDataset();
  });

  // -------------------------------------------------------------
  // 1. Schema Validation
  // -------------------------------------------------------------
  test('1. Offer schema validation requires all mandatory fields and valid types', () => {
    const invalidOffer = {};
    const validation = validateOffer(invalidOffer);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.length >= 6);

    const validOfferData = {
      lotId: 'LOT-0001',
      buyerId: 'SHOP-0001',
      buyerRole: 'repair',
      buyerName: 'Maa Tarini Care',
      materialCategory: 'PCB',
      weight: 2.5,
      offeredPrice: 350,
      status: 'submitted'
    };
    const validResult = validateOffer(validOfferData);
    assert.strictEqual(validResult.valid, true);
    assert.strictEqual(validResult.errors.length, 0);
  });

  // -------------------------------------------------------------
  // 2. Sequential ID Generation
  // -------------------------------------------------------------
  test('2. Sequential Offer ID generation generates standard format OFR-xxxx', () => {
    const nextId = generateNextOfferId();
    // SEED_OFFERS has OFR-0001 through OFR-0004, so next must be OFR-0005
    assert.strictEqual(nextId, 'OFR-0005');

    const customList = [
      { offerId: 'OFR-0010' },
      { offerId: 'OFR-0042' },
      { offerId: 'OFR-0009' }
    ];
    assert.strictEqual(generateNextOfferId(customList), 'OFR-0043');
  });

  // -------------------------------------------------------------
  // 3. Offer Creation & Automatic Total Value Calculation
  // -------------------------------------------------------------
  test('3. Offer creation calculates total value automatically (weight * offeredPrice)', () => {
    const newOffer = createOffer({
      lotId: 'LOT-0003',
      buyerId: 'SHOP-0002',
      buyerRole: 'repair',
      buyerName: 'Kailash Mobile Spares',
      materialCategory: 'Display',
      weight: 3.5,
      offeredPrice: 200,
      message: 'Testing offer calculation'
    });

    assert.ok(newOffer.offerId.startsWith('OFR-'));
    assert.strictEqual(newOffer.weight, 3.5);
    assert.strictEqual(newOffer.offeredPrice, 200);
    assert.strictEqual(newOffer.totalOfferValue, 700);
    assert.strictEqual(newOffer.status, 'submitted');
    assert.strictEqual(newOffer.sourceType, 'platform_user');
  });

  // -------------------------------------------------------------
  // 4. Persistence in localStorage
  // -------------------------------------------------------------
  test('4. Offer persistence stores records in scrapsetu_offers', () => {
    const rawBefore = localStorage.getItem(STORAGE_KEY_OFFERS);
    assert.ok(rawBefore);

    createOffer({
      lotId: 'LOT-0001',
      buyerId: 'REC-0001',
      buyerRole: 'recycler',
      buyerName: 'GreenCycle Ltd.',
      materialCategory: 'PCB',
      weight: 10,
      offeredPrice: 310
    });

    const storedOffers = JSON.parse(localStorage.getItem(STORAGE_KEY_OFFERS));
    assert.strictEqual(storedOffers.length, SEED_OFFERS.length + 1);
    const created = storedOffers[storedOffers.length - 1];
    assert.strictEqual(created.offeredPrice, 310);
  });

  // -------------------------------------------------------------
  // 5. Query Offers by Lot
  // -------------------------------------------------------------
  test('5. getOffersForLot returns all offers submitted for a specific lot', () => {
    const lot1Offers = getOffersForLot('LOT-0001');
    assert.ok(Array.isArray(lot1Offers));
    assert.ok(lot1Offers.length >= 2);
    for (const o of lot1Offers) {
      assert.strictEqual(o.lotId, 'LOT-0001');
    }

    const nonExistent = getOffersForLot('LOT-NON-EXISTENT');
    assert.strictEqual(nonExistent.length, 0);
  });

  // -------------------------------------------------------------
  // 6. Query Offers by Buyer
  // -------------------------------------------------------------
  test('6. getOffersForBuyer returns all offers submitted by a specific buyer', () => {
    const shopOffers = getOffersForBuyer('SHOP-0001');
    assert.ok(shopOffers.length >= 1);
    for (const o of shopOffers) {
      assert.strictEqual(o.buyerId, 'SHOP-0001');
    }

    const recOffers = getOffersForBuyer('REC-0001');
    assert.ok(recOffers.length >= 2);
    for (const o of recOffers) {
      assert.strictEqual(o.buyerId, 'REC-0001');
    }
  });

  // -------------------------------------------------------------
  // 7. Query Offers by Collector
  // -------------------------------------------------------------
  test('7. getOffersForCollector returns offers for all lots owned by collector', () => {
    // Demo collector usr-collector-01 owns LOT-0001, LOT-0002
    const collectorOffers = getOffersForCollector('usr-collector-01');
    assert.ok(Array.isArray(collectorOffers));
    assert.ok(collectorOffers.length >= 2);
    for (const o of collectorOffers) {
      assert.ok(['LOT-0001', 'LOT-0002'].includes(o.lotId));
    }
  });

  // -------------------------------------------------------------
  // 8. Repair Shop Eligibility Checklist
  // -------------------------------------------------------------
  test('8. isRepairShopEligible returns transparent reasons array without opaque scores', () => {
    const shop = {
      id: 'SHOP-0001',
      name: 'Maa Tarini Care',
      acceptedMaterials: ['PCB', 'Mobile', 'Display'],
      location: 'Gunupur, Rayagada'
    };

    const compatibleLot = {
      id: 'LOT-0001',
      materialType: 'PCB',
      condition: 'Good',
      weight: 2.5,
      location: 'Gunupur'
    };

    const result = isRepairShopEligible(shop, compatibleLot);
    assert.strictEqual(result.eligible, true);
    assert.ok(Array.isArray(result.reasons));
    assert.ok(result.reasons.length >= 2);
    assert.ok(result.reasons.some(r => r.includes('Accepts PCB')));
    // Ensure NO numerical score or arbitrary ranking was returned
    assert.strictEqual(result.score, undefined);
    assert.strictEqual(result.rank, undefined);
  });

  // -------------------------------------------------------------
  // 9. Recycler Eligibility Checklist
  // -------------------------------------------------------------
  test('9. isRecyclerEligible returns checklist verification and respects facility constraints', () => {
    const recycler = {
      id: 'REC-0001',
      name: 'GreenCycle Ltd.',
      acceptedMaterials: ['PCB', 'Cable', 'Battery'],
      minimumWeightKg: 2.0,
      operatingAreas: ['Rayagada', 'Gunupur', 'Koraput'],
      pickupAvailable: true
    };

    const eligibleLot = {
      id: 'LOT-0001',
      materialType: 'PCB',
      weight: 5.0,
      location: 'Gunupur'
    };

    const result = isRecyclerEligible(recycler, eligibleLot);
    assert.strictEqual(result.eligible, true);
    assert.ok(Array.isArray(result.reasons));
    assert.ok(result.reasons.some(r => r.includes('Authorized processor')));
    assert.ok(result.reasons.some(r => r.includes('meets facility minimum')));
  });

  // -------------------------------------------------------------
  // 10. Material Compatibility Filtering
  // -------------------------------------------------------------
  test('10. Incompatible materials are deterministically rejected for both shop and recycler', () => {
    const shop = {
      id: 'SHOP-0001',
      acceptedMaterials: ['Mobile', 'Display'],
      location: 'Gunupur'
    };
    const recycler = {
      id: 'REC-0001',
      acceptedMaterials: ['Metal', 'Plastic'],
      minimumWeightKg: 1,
      operatingAreas: ['Gunupur']
    };

    const pcbLot = {
      id: 'LOT-0099',
      materialType: 'PCB',
      weight: 10,
      location: 'Gunupur'
    };

    assert.strictEqual(isRepairShopEligible(shop, pcbLot).eligible, false);
    assert.strictEqual(isRecyclerEligible(recycler, pcbLot).eligible, false);
  });

  // -------------------------------------------------------------
  // 11. Location Compatibility Matching
  // -------------------------------------------------------------
  test('11. Location compatibility validates operating region coverage', () => {
    const recycler = {
      id: 'REC-0001',
      acceptedMaterials: ['PCB'],
      minimumWeightKg: 1.0,
      operatingAreas: ['Rayagada', 'Gunupur'],
      address: { city: 'Rayagada', state: 'Odisha' }
    };

    const distantLot = {
      id: 'LOT-DISTANT',
      materialType: 'PCB',
      weight: 10,
      location: 'Jaipur, Rajasthan'
    };

    const result = isRecyclerEligible(recycler, distantLot);
    assert.strictEqual(result.eligible, false);
  });

  // -------------------------------------------------------------
  // 12. Minimum Lot Weight for Recyclers
  // -------------------------------------------------------------
  test('12. Recycler minimum weight constraint rejects lots below industrial batch threshold', () => {
    const recycler = {
      id: 'REC-0001',
      acceptedMaterials: ['PCB'],
      minimumWeightKg: 100.0,
      operatingAreas: ['Gunupur']
    };

    const smallLot = {
      id: 'LOT-SMALL',
      materialType: 'PCB',
      weight: 4.5,
      location: 'Gunupur'
    };

    const result = isRecyclerEligible(recycler, smallLot);
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reasons.length, 0);
  });

  // -------------------------------------------------------------
  // 13. Offer Price Validation
  // -------------------------------------------------------------
  test('13. Offer price validation rejects non-positive or invalid numeric values', () => {
    assert.throws(() => {
      createOffer({
        lotId: 'LOT-0001',
        buyerId: 'SHOP-0001',
        buyerRole: 'repair',
        buyerName: 'Shop',
        materialCategory: 'PCB',
        weight: 5,
        offeredPrice: 0 // <= 0 must fail
      });
    }, /offeredPrice must be a positive number/);

    assert.throws(() => {
      createOffer({
        lotId: 'LOT-0001',
        buyerId: 'SHOP-0001',
        buyerRole: 'repair',
        buyerName: 'Shop',
        materialCategory: 'PCB',
        weight: 5,
        offeredPrice: -50 // Negative must fail
      });
    }, /offeredPrice must be a positive number/);

    assert.throws(() => {
      createOffer({
        lotId: 'LOT-0001',
        buyerId: 'SHOP-0001',
        buyerRole: 'repair',
        buyerName: 'Shop',
        materialCategory: 'PCB',
        weight: -2, // Negative weight must fail
        offeredPrice: 100
      });
    }, /weight must be a positive number/);
  });

  // -------------------------------------------------------------
  // 14. Total Value Math Verification
  // -------------------------------------------------------------
  test('14. Total value math precisely equals Math.round(weight * offeredPrice)', () => {
    const offer = createOffer({
      lotId: 'LOT-0001',
      buyerId: 'REC-0002',
      buyerRole: 'recycler',
      buyerName: 'EcoRecover',
      materialCategory: 'Cable',
      weight: 12.35,
      offeredPrice: 650.5
    });

    const expected = Math.round(12.35 * 650.5);
    assert.strictEqual(offer.totalOfferValue, expected);
  });

  // -------------------------------------------------------------
  // 15. Collector Lot Ownership Verification
  // -------------------------------------------------------------
  test('15. Collector offer queries isolate offers to lots owned by that collector', () => {
    const colOffers = getOffersForCollector('usr-collector-01');
    const allOffers = getOffers();
    // All returned offers must belong to usr-collector-01 lots
    for (const off of colOffers) {
      const lot = getScrapLotById(off.lotId);
      if (lot) {
        assert.strictEqual(lot.collectorId, 'usr-collector-01');
      }
    }
  });

  // -------------------------------------------------------------
  // 16. Buyer Isolation & Withdrawal Guard
  // -------------------------------------------------------------
  test('16. Buyer cannot withdraw another buyer\'s offer', () => {
    // OFR-0001 belongs to SHOP-0001
    assert.throws(() => {
      updateOfferStatus('OFR-0001', 'withdrawn', 'SHOP-OTHER');
    }, /Unauthorized: Buyer SHOP-OTHER cannot withdraw/);

    // Belonging buyer can withdraw
    const updated = updateOfferStatus('OFR-0001', 'withdrawn', 'SHOP-0001');
    assert.strictEqual(updated.status, 'withdrawn');
  });

  // -------------------------------------------------------------
  // 17. Atomic Offer Acceptance
  // -------------------------------------------------------------
  test('17. Collector acceptance marks selected offer as accepted', () => {
    const accepted = acceptOffer('OFR-0001', 'LOT-0001');
    assert.strictEqual(accepted.status, 'accepted');

    const retrieved = getOfferById('OFR-0001');
    assert.strictEqual(retrieved.status, 'accepted');
  });

  // -------------------------------------------------------------
  // 18. Competing Offers Automatically Rejected
  // -------------------------------------------------------------
  test('18. Accepting an offer automatically marks all competing offers for that lot as rejected', () => {
    // LOT-0001 has OFR-0001 (repair) and OFR-0002 (recycler)
    acceptOffer('OFR-0001', 'LOT-0001');

    const competingOffer = getOfferById('OFR-0002');
    assert.strictEqual(competingOffer.status, 'rejected');

    // Offers for other lots (LOT-0002) should remain submitted
    const otherLotOffer = getOfferById('OFR-0003');
    assert.strictEqual(otherLotOffer.status, 'submitted');
  });

  // -------------------------------------------------------------
  // 19. Invalid Buyer Role Rejection
  // -------------------------------------------------------------
  test('19. Invalid buyer role is rejected by schema validator', () => {
    assert.throws(() => {
      createOffer({
        lotId: 'LOT-0001',
        buyerId: 'UNKNOWN-01',
        buyerRole: 'collector', // Must be repair or recycler
        buyerName: 'Invalid Buyer',
        materialCategory: 'PCB',
        weight: 5,
        offeredPrice: 100
      });
    }, /buyerRole must be one of: repair, recycler/);
  });

  // -------------------------------------------------------------
  // 20. Non-Commercial Scope: No Payments or Transactions Created
  // -------------------------------------------------------------
  test('20. Selecting an offer does NOT create payment records, transactions, or receipts', () => {
    acceptOffer('OFR-0001', 'LOT-0001');

    // Verify localStorage has no payment or transaction tables
    assert.strictEqual(localStorage.getItem('scrapsetu_transactions'), null);
    assert.strictEqual(localStorage.getItem('scrapsetu_payments'), null);
    assert.strictEqual(localStorage.getItem('scrapsetu_receipts'), null);
  });

  // -------------------------------------------------------------
  // 21. Non-Commercial Scope: Lot is NOT Marked Sold/Paid
  // -------------------------------------------------------------
  test('21. Scrap lot offerStatus is set to offer_selected, NOT sold or paid', () => {
    acceptOffer('OFR-0001', 'LOT-0001');

    const lot = getScrapLotById('LOT-0001');
    if (lot) {
      assert.strictEqual(lot.offerStatus, 'offer_selected');
      assert.notStrictEqual(lot.status, 'sold');
      assert.notStrictEqual(lot.status, 'paid');
    }
  });

  // -------------------------------------------------------------
  // 22. Demo vs Platform User SourceType Separation
  // -------------------------------------------------------------
  test('22. Demo seed offers are flagged demo_seed; newly created offers are platform_user', () => {
    const seed = getOfferById('OFR-0001');
    assert.strictEqual(seed.sourceType, 'demo_seed');

    const userOffer = createOffer({
      lotId: 'LOT-0002',
      buyerId: 'SHOP-0001',
      buyerRole: 'repair',
      buyerName: 'Maa Tarini Care',
      materialCategory: 'Cable',
      weight: 5.0,
      offeredPrice: 700
    });
    assert.strictEqual(userOffer.sourceType, 'platform_user');
  });

  // -------------------------------------------------------------
  // 23. 8-Language Localization Completeness
  // -------------------------------------------------------------
  test('23. Module 8 localization keys are completely defined across all 8 supported languages', () => {
    const requiredM8Keys = [
      'availableScrapLots',
      'makeOffer',
      'platformEstimate',
      'offeredPricePerKg',
      'totalOfferValue',
      'optionalMessage',
      'submitOffer',
      'offerSubmittedSuccess',
      'whyEligible',
      'offersForLot',
      'compareOffers',
      'selectOffer',
      'selectThisOffer',
      'selectOfferConfirmTitle',
      'selectOfferDisclaimer',
      'offerAccepted',
      'offerRejected',
      'reuseOffers',
      'recyclingOffers',
      'buyerType',
      'offersDataset',
      'offerSelectedStatus',
      'noOffersYet',
      'viewOffer',
      'allOffersCount',
      'acceptedOffersCount',
      'pendingOffersCount',
      'offeredPriceMustBePositive',
      'invalidLotWeight',
      'invalidBuyerIdentity'
    ];

    assert.strictEqual(SUPPORTED_LANGUAGES.length, 8);

    for (const lang of SUPPORTED_LANGUAGES) {
      const strings = STRINGS[lang.code];
      assert.ok(strings, `Language table for ${lang.code} (${lang.name}) must exist`);

      for (const key of requiredM8Keys) {
        assert.ok(
          strings[key] && typeof strings[key] === 'string' && strings[key].trim().length > 0,
          `Key "${key}" is missing or empty in language "${lang.code}"`
        );
      }
    }
  });

  // -------------------------------------------------------------
  // 24. Offer Dataset Statistics
  // -------------------------------------------------------------
  test('24. getOfferStats accurately aggregates counts and total offered value', () => {
    const stats = getOfferStats();
    assert.strictEqual(stats.totalOffers, 4);
    assert.strictEqual(stats.submittedOffers, 4);
    assert.strictEqual(stats.acceptedOffers, 0);
    assert.strictEqual(stats.rejectedOffers, 0);
    assert.strictEqual(stats.repairOffers, 1);
    assert.strictEqual(stats.recyclerOffers, 3);
    assert.strictEqual(stats.totalValue, 816 + 780 + 3375 + 3300);
  });

  // -------------------------------------------------------------
  // 25. Reset Dataset
  // -------------------------------------------------------------
  test('25. resetOfferDataset restores baseline seed state', () => {
    createOffer({
      lotId: 'LOT-0001',
      buyerId: 'SHOP-0001',
      buyerRole: 'repair',
      buyerName: 'Shop',
      materialCategory: 'PCB',
      weight: 1,
      offeredPrice: 100
    });
    assert.strictEqual(getOffers().length, 5);

    const resetResult = resetOfferDataset();
    assert.strictEqual(resetResult.length, 4);
    assert.strictEqual(getOffers().length, 4);
  });
});
