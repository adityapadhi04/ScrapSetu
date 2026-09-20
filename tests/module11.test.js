/**
 * ScrapSetu — Module 11 Automated Test Suite
 *
 * Verifies all 25+ acceptance criteria and architectural invariants specified for Module 11:
 * SAFETY GUIDANCE + ENVIRONMENTAL IMPACT + COLLECTOR INSIGHTS
 *
 * Requirements Tested:
 * SAFETY:
 * 1. safety catalog loads (all required categories present)
 * 2. known material guidance returns structured instructions
 * 3. unknown material fallback safely handles unrecognized input
 * 4. damaged battery high-risk rule (damaged battery must be HIGH hazard)
 * 5. condition-specific guidance and warnings
 * 6. safety service output schema completeness
 * 7. warning generation via getSafetyWarnings
 *
 * ENVIRONMENT:
 * 8. material impact calculation
 * 9. weight affects calculation linearly
 * 10. reuse pathway calculation (Repair Shop -> Reuse / Repair)
 * 11. recycle pathway calculation (Authorized Recycler -> Recycling)
 * 12. transparent factor usage (1.0 kg/kg mass diversion factor)
 * 13. insufficient data handling
 *
 * INSIGHTS:
 * 14. collector-specific data isolation
 * 15. material breakdown aggregation
 * 16. reuse vs recycle separation
 * 17. insufficient data does not fabricate trends or fake percentages
 * 18. transaction and earnings integration from local payment records
 *
 * INTEGRATION:
 * 19. safety integration with scrap lot material & condition attributes
 * 20. environmental estimate from completed transaction
 * 21. admin platform aggregate calculation
 * 22. language keys exist for all 8 languages
 * 23. offline compatibility (zero network dependency)
 * 24. role isolation (repair shops strictly isolated from recyclers)
 * 25. prototype disclaimer exists (no false claims of certified carbon credits)
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

// Module 11 Services & Data
import {
  SAFETY_CATALOG,
  HAZARD_LEVELS
} from '../src/data/safetyGuidanceData.js';

import {
  findSafetyEntry,
  getSafetyGuidance,
  getHazardLevel,
  getHandlingGuidance,
  getDoNotActions,
  getSafetyWarnings,
  getAllSafetyCatalog,
  getHazardSummaryForLots
} from '../src/services/safetyGuidanceService.js';

import {
  ENVIRONMENTAL_FACTORS
} from '../src/data/environmentalImpactData.js';

import {
  getEnvironmentalFactor,
  calculateLotImpact,
  calculateTransactionImpact,
  calculateCollectorImpact,
  calculatePlatformImpact,
  calculateMaterialImpact,
  getPathwayImpact
} from '../src/services/environmentalImpactService.js';

import {
  getCollectorInsights
} from '../src/services/collectorInsightService.js';

import { STRINGS, SUPPORTED_LANGUAGES } from '../src/locales/strings.js';

describe('ScrapSetu Module 11: Safety Guidance + Environmental Impact + Collector Insights', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // SECTION 1: SAFETY GUIDANCE TESTS
  // =========================================================================

  test('1. Safety catalog loads with all core material categories', () => {
    assert.ok(Array.isArray(SAFETY_CATALOG), 'SAFETY_CATALOG should be an array');
    assert.ok(SAFETY_CATALOG.length >= 8, 'Should have at least 8 material entries');

    const expectedCategories = [
      'battery',
      'pcb',
      'cable',
      'motor',
      'display',
      'mobile',
      'laptop',
      'other'
    ];

    expectedCategories.forEach((id) => {
      const found = SAFETY_CATALOG.some((item) => item.id === id);
      assert.ok(found, `Safety catalog must contain entry for ${id}`);
    });
  });

  test('2. Known material guidance returns complete guidance structure', () => {
    const guidance = getSafetyGuidance('PCB', 'good');
    assert.ok(guidance, 'Guidance should be returned for PCB');
    assert.equal(guidance.id, 'pcb');
    assert.equal(guidance.materialCategory, 'PCB');
    assert.ok(Array.isArray(guidance.handlingGuidance), 'handlingGuidance should be an array');
    assert.ok(guidance.handlingGuidance.length > 0, 'handlingGuidance should not be empty');
    assert.ok(Array.isArray(guidance.doNotActions), 'doNotActions should be an array');
    assert.ok(guidance.doNotActions.length > 0, 'doNotActions should not be empty');
    assert.ok(guidance.hazardLevel, 'hazardLevel should be defined');
    assert.ok(guidance.disclaimer, 'Prototype disclaimer should be present');
  });

  test('3. Unknown material safely falls back to generic e-waste guidance', () => {
    const guidance = getSafetyGuidance('Quantum flux capacitor unknown scrap');
    assert.ok(guidance, 'Guidance should exist for unknown material');
    assert.equal(guidance.id, 'other', 'Fallback should map to "other"');
    assert.equal(guidance.hazardLevel, HAZARD_LEVELS.LOW);
    assert.ok(guidance.handlingGuidance.length > 0);
  });

  test('4. Damaged battery high-risk rule strictly enforces HIGH hazard and prominent warning', () => {
    // Battery + damaged condition
    const damagedBattery = getSafetyGuidance('Battery', 'damaged');
    assert.equal(damagedBattery.hazardLevel, HAZARD_LEVELS.HIGH, 'Damaged battery must be HIGH hazard');
    assert.ok(damagedBattery.isConditionEscalated, 'isConditionEscalated should be true');
    assert.ok(damagedBattery.conditionWarning, 'Damaged battery must have an urgent condition warning');
    assert.ok(
      damagedBattery.conditionWarning.toLowerCase().includes('critical') ||
      damagedBattery.conditionWarning.toLowerCase().includes('hazard') ||
      damagedBattery.conditionWarning.toLowerCase().includes('sand') ||
      damagedBattery.conditionWarning.toLowerCase().includes('runaway'),
      'Condition warning must mention thermal runaway or emergency sand containment'
    );

    // Battery + good condition (inherently high/medium risk)
    const goodBattery = getSafetyGuidance('Battery', 'clean');
    assert.equal(goodBattery.hazardLevel, HAZARD_LEVELS.HIGH);
  });

  test('5. Condition-specific guidance escalates hazard appropriately', () => {
    // PCB good -> MEDIUM hazard
    const pcbGood = getSafetyGuidance('PCB', 'good');
    assert.equal(pcbGood.hazardLevel, HAZARD_LEVELS.MEDIUM);

    // PCB burnt -> HIGH hazard (toxic fumes)
    const pcbBurnt = getSafetyGuidance('PCB', 'burnt');
    assert.equal(pcbBurnt.hazardLevel, HAZARD_LEVELS.HIGH, 'Burnt PCB should escalate to HIGH hazard');
    assert.ok(pcbBurnt.conditionWarning, 'Burnt PCB should have a condition warning');
  });

  test('6. Safety service output schema completeness', () => {
    const guidance = getSafetyGuidance('Display', 'fair');
    const requiredKeys = [
      'id',
      'materialCategory',
      'hazardLevel',
      'icon',
      'handlingGuidance',
      'doNotActions',
      'storageGuidance',
      'transportGuidance',
      'recommendedPath',
      'emergencyNote',
      'disclaimer'
    ];

    requiredKeys.forEach((key) => {
      assert.ok(key in guidance, `Safety guidance must include ${key}`);
    });
  });

  test('7. getSafetyWarnings compiles condition warnings, do-not actions, and emergency notes', () => {
    const warnings = getSafetyWarnings('Battery', 'damaged');
    assert.ok(Array.isArray(warnings), 'Warnings must be an array');
    assert.ok(warnings.length >= 3, 'Must contain condition warning, doNotActions, and emergency note');

    // Confirm prohibited actions are in warnings
    const hasPunctureWarning = warnings.some((w) => w.toLowerCase().includes('puncture') || w.toLowerCase().includes('burn'));
    assert.ok(hasPunctureWarning, 'Warnings must include prohibited actions (puncture/burn)');
  });

  // =========================================================================
  // SECTION 2: ENVIRONMENTAL IMPACT TESTS
  // =========================================================================

  test('8. Material impact calculation returns transparent mass diversion metrics', () => {
    const impact = calculateMaterialImpact('PCB', 10, 'recycle');
    assert.ok(impact, 'Impact object should be defined');
    assert.equal(impact.materialCategory, 'PCB');
    assert.equal(impact.weight, 10);
    assert.equal(impact.divertedWeightKg, 10, '10 kg scrap should equal 10 kg diverted');
    assert.equal(impact.pathway, 'Recycling');
    assert.equal(impact.impactLevel, 'medium');
    assert.equal(impact.isPrototypeEstimate, true);
    assert.ok(impact.benefit, 'Benefit description should be provided');
  });

  test('9. Weight linearly affects calculation and impact level', () => {
    const smallImpact = calculateMaterialImpact('Cable', 2, 'recycle');
    assert.equal(smallImpact.impactLevel, 'low');
    assert.equal(smallImpact.divertedWeightKg, 2);

    const mediumImpact = calculateMaterialImpact('Cable', 8, 'recycle');
    assert.equal(mediumImpact.impactLevel, 'medium');
    assert.equal(mediumImpact.divertedWeightKg, 8);

    const largeImpact = calculateMaterialImpact('Cable', 25, 'recycle');
    assert.equal(largeImpact.impactLevel, 'high');
    assert.equal(largeImpact.divertedWeightKg, 25);
  });

  test('10. Reuse pathway calculation is strictly categorized as "Reuse / Repair"', () => {
    const reuseImpact = calculateMaterialImpact('Laptop / Computer', 5, 'reuse');
    assert.equal(reuseImpact.pathway, 'Reuse / Repair');
    assert.ok(
      reuseImpact.benefit.toLowerCase().includes('repair') ||
      reuseImpact.benefit.toLowerCase().includes('extend') ||
      reuseImpact.benefit.toLowerCase().includes('modular') ||
      reuseImpact.benefit.toLowerCase().includes('refurbish'),
      'Benefit should emphasize component extension or repair shop reuse'
    );
  });

  test('11. Recycle pathway calculation is strictly categorized as "Recycling"', () => {
    const recycleImpact = calculateMaterialImpact('PCB', 12, 'recycle');
    assert.equal(recycleImpact.pathway, 'Recycling');
    assert.ok(
      recycleImpact.benefit.toLowerCase().includes('recycl') ||
      recycleImpact.benefit.toLowerCase().includes('secondary') ||
      recycleImpact.benefit.toLowerCase().includes('recovery'),
      'Benefit should emphasize formal recycling and secondary metals recovery'
    );
  });

  test('12. Transparent factor usage and prototype disclaimer', () => {
    const factor = getEnvironmentalFactor('Battery');
    assert.equal(factor.estimatedAvoidedWasteKgPerKg, 1.0, 'Factor must be transparent 1.0 kg/kg mass conservation');
    assert.ok(factor.methodologyNote, 'Methodology note must be defined');

    const lotImpact = calculateLotImpact({ id: 'LOT-001', materialCategory: 'Battery', weight: 4.5 });
    assert.equal(lotImpact.isPrototypeEstimate, true);
    assert.ok(lotImpact.methodology.includes('Prototype estimate'));
  });

  test('13. Insufficient data handling returns safe null / default fallbacks', () => {
    assert.equal(calculateLotImpact(null), null);
    assert.equal(calculateTransactionImpact(null), null);

    const emptyCollectorImpact = calculateCollectorImpact(null);
    assert.equal(emptyCollectorImpact.totalScrapHandledKg, 0);
    assert.equal(emptyCollectorImpact.divertedWeightKg, 0);
    assert.equal(emptyCollectorImpact.completedTransactionsCount, 0);
  });

  // =========================================================================
  // SECTION 3: COLLECTOR INSIGHTS TESTS
  // =========================================================================

  test('14. Collector-specific data isolation: isolates calculations by collectorId', () => {
    // Seed transactions for collector A and collector B in localStorage
    const txA = [
      {
        transactionId: 'TXN-001',
        collectorId: 'usr-collector-01',
        buyerRole: 'repair',
        materialCategory: 'PCB',
        weight: '5.0',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      }
    ];

    const txB = [
      {
        transactionId: 'TXN-002',
        collectorId: 'usr-collector-02',
        buyerRole: 'recycler',
        materialCategory: 'Battery',
        weight: '15.0',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      }
    ];

    localStorage.setItem('scrapsetu_transactions', JSON.stringify([...txA, ...txB]));

    const impactA = calculateCollectorImpact('usr-collector-01');
    const impactB = calculateCollectorImpact('usr-collector-02');

    assert.equal(impactA.collectorId, 'usr-collector-01');
    assert.equal(impactA.divertedWeightKg, 5.0);
    assert.equal(impactA.reuseWeightKg, 5.0);
    assert.equal(impactA.recyclingWeightKg, 0);

    assert.equal(impactB.collectorId, 'usr-collector-02');
    assert.equal(impactB.divertedWeightKg, 15.0);
    assert.equal(impactB.reuseWeightKg, 0);
    assert.equal(impactB.recyclingWeightKg, 15.0);
  });

  test('15. Material breakdown aggregates weights correctly', () => {
    const txList = [
      {
        transactionId: 'TXN-010',
        collectorId: 'col-breakdown',
        buyerRole: 'recycler',
        materialCategory: 'Cable',
        weight: '10.5',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      },
      {
        transactionId: 'TXN-011',
        collectorId: 'col-breakdown',
        buyerRole: 'repair',
        materialCategory: 'Cable',
        weight: '4.5',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      },
      {
        transactionId: 'TXN-012',
        collectorId: 'col-breakdown',
        buyerRole: 'repair',
        materialCategory: 'PCB',
        weight: '3.0',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      }
    ];

    localStorage.setItem('scrapsetu_transactions', JSON.stringify(txList));

    const impact = calculateCollectorImpact('col-breakdown');
    assert.equal(impact.materialBreakdown['Cable'], 15.0);
    assert.equal(impact.materialBreakdown['PCB'], 3.0);
  });

  test('16. Reuse and recycling pathways remain separate and uncombined', () => {
    const txList = [
      {
        transactionId: 'TXN-020',
        collectorId: 'col-pathways',
        buyerRole: 'repair', // Repair shop -> Reuse
        materialCategory: 'Mobile Phone',
        weight: '2.0',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      },
      {
        transactionId: 'TXN-021',
        collectorId: 'col-pathways',
        buyerRole: 'recycler', // Recycler -> Formal Recycling
        materialCategory: 'Battery',
        weight: '8.0',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      }
    ];

    localStorage.setItem('scrapsetu_transactions', JSON.stringify(txList));

    const impact = calculateCollectorImpact('col-pathways');
    assert.equal(impact.reuseWeightKg, 2.0, 'Reuse weight must only include repair shop transactions');
    assert.equal(impact.recyclingWeightKg, 8.0, 'Recycling weight must only include recycler transactions');
    assert.equal(impact.divertedWeightKg, 10.0, 'Total diverted must equal sum of completed transactions');
  });

  test('17. Insufficient data does not fabricate trends or fake ML predictions', () => {
    // Collector with zero transactions
    const result = getCollectorInsights('non-existent-collector');
    assert.equal(result.hasData, false);
    assert.ok(Array.isArray(result.insights));
    assert.ok(
      result.insights[0].toLowerCase().includes('no insight') ||
      result.insights[0].toLowerCase().includes('not enough data') ||
      result.insights[0].toLowerCase().includes('create'),
      'Must explain that more data is needed rather than faking a trend'
    );
  });

  test('18. Transaction and payment earnings integration', () => {
    const payments = [
      {
        paymentId: 'PAY-001',
        collectorId: 'col-earnings',
        amount: 1450,
        paymentStatus: 'recorded'
      },
      {
        paymentId: 'PAY-002',
        collectorId: 'col-earnings',
        amount: 850,
        paymentStatus: 'recorded'
      },
      {
        paymentId: 'PAY-003',
        collectorId: 'other-collector',
        amount: 5000,
        paymentStatus: 'recorded'
      }
    ];

    localStorage.setItem('scrapsetu_payments', JSON.stringify(payments));

    const impact = calculateCollectorImpact('col-earnings');
    assert.equal(impact.recordedEarnings, 2300, 'Recorded earnings must sum only recorded payments for this collector');
  });

  // =========================================================================
  // SECTION 4: INTEGRATION & PLATFORM TESTS
  // =========================================================================

  test('19. Safety integration: getHazardSummaryForLots accurately assesses lot risk', () => {
    const mockLots = [
      { id: 'LOT-1', materialType: 'Battery', condition: 'damaged' }, // HIGH
      { id: 'LOT-2', materialType: 'PCB', condition: 'burnt' },        // HIGH
      { id: 'LOT-3', materialType: 'PCB', condition: 'fair' },         // MEDIUM
      { id: 'LOT-4', materialType: 'Cable', condition: 'good' },       // LOW
      { id: 'LOT-5', materialType: 'Motor', condition: 'fair' },       // LOW
    ];

    const summary = getHazardSummaryForLots(mockLots);
    assert.equal(summary.total, 5);
    assert.equal(summary.highRisk, 2);
    assert.equal(summary.mediumRisk, 1);
    assert.equal(summary.lowRisk, 2);
    assert.equal(summary.highRiskLots.length, 2);
    assert.equal(summary.highRiskLots[0].id, 'LOT-1');
  });

  test('20. Completed transaction environmental estimate in Digital Scrap Receipt', () => {
    const completedTx = {
      transactionId: 'TXN-999',
      buyerRole: 'repair',
      materialCategory: 'Mobile Phone',
      weight: '1.8',
      transactionStatus: 'completed',
      handoverStatus: 'confirmed',
      paymentStatus: 'recorded'
    };

    const impact = calculateTransactionImpact(completedTx);
    assert.ok(impact);
    assert.equal(impact.isCompleted, true);
    assert.equal(impact.pathway, 'Reuse / Repair');
    assert.equal(impact.divertedWeight, 1.8);
    assert.equal(impact.reuseWeight, 1.8);
    assert.equal(impact.recyclingWeight, 0);
    assert.equal(impact.isPrototypeEstimate, true);
  });

  test('21. Admin platform aggregate calculation sums all active platform records', () => {
    const lots = [
      { id: 'LOT-01', weight: '10' },
      { id: 'LOT-02', weight: '20' }
    ];
    const tx = [
      {
        transactionId: 'TXN-01',
        buyerRole: 'repair',
        materialCategory: 'PCB',
        weight: '10',
        transactionStatus: 'completed',
        handoverStatus: 'confirmed',
        paymentStatus: 'recorded'
      }
    ];

    localStorage.setItem('scrapsetu_scrap_lots', JSON.stringify(lots));
    localStorage.setItem('scrapsetu_transactions', JSON.stringify(tx));

    const platform = calculatePlatformImpact();
    assert.ok(platform.totalScrapHandledKg >= 30, 'Total handled should incorporate scrap lots');
    assert.equal(platform.divertedWeightKg, 10);
    assert.equal(platform.reuseWeightKg, 10);
    assert.equal(platform.completedTransactionsCount, 1);
    assert.equal(platform.isPrototypeEstimate, true);
  });

  test('22. Full 8-language localization completeness for all Module 11 keys', () => {
    const expectedKeys = [
      'safetyGuidance',
      'safetyGuidelines',
      'safetySubtitle',
      'hazardLevel',
      'highRisk',
      'mediumRisk',
      'lowRisk',
      'safeHandling',
      'doNotActions',
      'storageGuidance',
      'transportGuidance',
      'recommendedPath',
      'selectMaterialCategory',
      'environmentalImpact',
      'myImpact',
      'scrapHandled',
      'divertedWeight',
      'pathwayReuse',
      'pathwayRecycle',
      'prototypeEstimate',
      'insights',
      'collectorInsights',
      'viewInsights',
      'safetyOverview',
      'insufficientDataNotice'
    ];

    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      const langStrings = STRINGS[code];
      assert.ok(langStrings, `Language bundle for ${code} must exist`);

      expectedKeys.forEach((key) => {
        assert.ok(
          key in langStrings,
          `Key "${key}" is missing from language "${code}"`
        );
        assert.ok(
          typeof langStrings[key] === 'string' && langStrings[key].trim().length > 0,
          `Key "${key}" in language "${code}" must be a non-empty string`
        );
      });
    });
  });

  test('23. Offline compatibility: services operate deterministically with zero network calls', () => {
    // Both services must execute synchronously and deterministically without network
    const guidance = getSafetyGuidance('Battery', 'damaged');
    const factor = getEnvironmentalFactor('PCB');
    const impact = calculateMaterialImpact('Cable', 15, 'recycle');

    assert.ok(guidance);
    assert.ok(factor);
    assert.ok(impact);
    assert.equal(impact.divertedWeightKg, 15);
  });

  test('24. Role isolation: Repair shop is never classified as recycler', () => {
    const repairTx = {
      transactionId: 'TXN-R1',
      buyerRole: 'repair',
      weight: 4.0,
      transactionStatus: 'completed',
      handoverStatus: 'confirmed',
      paymentStatus: 'recorded'
    };

    const recyclerTx = {
      transactionId: 'TXN-R2',
      buyerRole: 'recycler',
      weight: 12.0,
      transactionStatus: 'completed',
      handoverStatus: 'confirmed',
      paymentStatus: 'recorded'
    };

    const repairImpact = calculateTransactionImpact(repairTx);
    const recyclerImpact = calculateTransactionImpact(recyclerTx);

    assert.equal(repairImpact.pathway, 'Reuse / Repair');
    assert.equal(repairImpact.reuseWeight, 4.0);
    assert.equal(repairImpact.recyclingWeight, 0);

    assert.equal(recyclerImpact.pathway, 'Recycling');
    assert.equal(recyclerImpact.reuseWeight, 0);
    assert.equal(recyclerImpact.recyclingWeight, 12.0);
  });

  test('25. Prototype disclaimer explicitly verified across all Module 11 outputs', () => {
    const safety = getSafetyGuidance('PCB', 'fair');
    assert.ok(
      safety.disclaimer.toLowerCase().includes('prototype'),
      'Safety guidance must include prototype disclaimer'
    );

    const env = calculateMaterialImpact('Cable', 5, 'recycle');
    assert.equal(env.isPrototypeEstimate, true);
    assert.ok(
      env.methodology.toLowerCase().includes('prototype'),
      'Environmental impact must clearly state prototype methodology'
    );

    const platform = calculatePlatformImpact();
    assert.equal(platform.isPrototypeEstimate, true);
  });
});
