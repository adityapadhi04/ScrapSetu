/**
 * ScrapSetu — Price Intelligence Service (Module 5)
 * 
 * ARCHITECTURE NOTICE:
 * - Provides an explainable, statistical / rule-based prototype estimator for fair scrap prices.
 * - Based on historical demo seed records in `scrapsetu_price_dataset`.
 * - IMPORTANT: This is NOT live market data and NOT machine-learning price prediction.
 * - Handles insufficient data gracefully without fabricating numbers.
 */

import { getHistoricalPrices } from './priceDatasetService.js';

/**
 * Condition adjustment multipliers
 */
export const CONDITION_MULTIPLIERS = {
  good: 1.05,     // +5% premium for intact/high-grade scrap
  fair: 1.00,     // Baseline reference
  damaged: 0.85,  // -15% discount for cracked/severely dismantled parts
  mixed: 0.90     // -10% discount for unsorted/mixed lots
};

/**
 * Helper to calculate median from an array of numbers
 */
const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

/**
 * Estimate Fair Price for a scrap lot.
 * 
 * @param {object} params
 * @param {string} params.materialCategory - e.g. 'PCB', 'Cable', 'Battery'
 * @param {string} params.materialSubcategory - optional subcategory
 * @param {number|string} params.weight - weight value
 * @param {string} params.weightUnit - 'kg' or 'g'
 * @param {string} params.condition - 'good', 'fair', 'damaged', 'mixed'
 * @param {string|object} params.location - area/city/state
 * @returns {object} Explainable fair price estimation result
 */
export const estimateFairPrice = ({
  materialCategory,
  materialSubcategory = '',
  weight = 1.0,
  weightUnit = 'kg',
  condition = 'fair',
  location = 'Gunupur'
}) => {
  // Normalize parameters
  const normCategory = (materialCategory || '').trim();
  const normCondition = (condition || 'fair').trim().toLowerCase();
  const numWeight = parseFloat(weight) || 1.0;
  const weightInKg = weightUnit === 'g' ? numWeight / 1000 : numWeight;

  const locString = typeof location === 'string'
    ? location.trim()
    : (location?.city || location?.area || 'Gunupur');

  // Step 1: Query historical records matching material category
  const allMatchingRecords = getHistoricalPrices({ materialCategory: normCategory });

  // Step 2: Check for insufficient historical data (< 2 records)
  // Categories like "Not sure" or unrecognized categories will trigger this
  if (!normCategory || normCategory.toLowerCase().includes('not sure') || allMatchingRecords.length < 2) {
    return {
      isReliable: false,
      hasSufficientData: false,
      confidence: 'insufficient_data',
      estimatedPrice: null,
      minPrice: null,
      maxPrice: null,
      midPrice: null,
      estimatedMin: null,
      estimatedMax: null,
      estimatedPerUnit: null,
      totalEstimatedMin: null,
      totalEstimatedMax: null,
      totalEstimatedMid: null,
      estimatedLotValueMin: null,
      estimatedLotValueMax: null,
      priceUnit: 'INR/kg',
      currency: 'INR',
      historicalMidPrice: null,
      historicalRecordsUsed: allMatchingRecords.length,
      historicalRange: null,
      factors: {
        conditionMultiplier: 1.00,
        historicalMidPrice: null,
        recordsUsed: allMatchingRecords.length
      },
      plainExplanation: 'Not enough historical data for a reliable estimate. Price estimate requires at least 2 historical records for this material in the dataset.',
      explanation: 'Not enough historical data for a reliable estimate. Price estimate requires at least 2 historical records for this material in the dataset.',
      prototypeNotice: 'Prototype estimator — requires minimum 2 historical records to generate estimate.',
      isPrototypeEstimate: true,
      sourceType: 'demo_seed'
    };
  }

  // Step 3: Prioritize location-matched records if available
  const locLower = locString.toLowerCase();
  const locationMatches = allMatchingRecords.filter((r) => {
    if (!r.location) return false;
    const rLoc = typeof r.location === 'string'
      ? r.location.toLowerCase()
      : `${r.location.area || ''} ${r.location.city || ''} ${r.location.state || ''}`.toLowerCase();
    return rLoc.includes(locLower);
  });

  const activeRecords = locationMatches.length >= 2 ? locationMatches : allMatchingRecords;

  // Step 4: Extract prices and compute historical range & median
  const priceValues = activeRecords.map(
    (r) => r.buyingPrice || r.quotedPrice || r.estimatedPrice || 0
  ).filter((p) => p > 0);

  const rawMedian = calculateMedian(priceValues);
  const histMin = Math.min(...priceValues);
  const histMax = Math.max(...priceValues);

  // Step 5: Apply condition adjustment multiplier
  const multiplier = CONDITION_MULTIPLIERS[normCondition] || 1.00;
  const baselineUnitPrice = Math.round(rawMedian * multiplier);

  // Reasonable prototype band (±5% around adjusted baseline)
  const estimatedMin = Math.round(baselineUnitPrice * 0.95);
  const estimatedMax = Math.round(baselineUnitPrice * 1.05);

  // Step 6: Compute total lot valuation (estimatedPrice × weightInKg)
  const totalEstimatedMin = Math.round(estimatedMin * weightInKg);
  const totalEstimatedMax = Math.round(estimatedMax * weightInKg);
  const totalEstimatedMid = Math.round(baselineUnitPrice * weightInKg);

  // Assess confidence level based on records sample
  let confidence = 'medium';
  if (activeRecords.length >= 4 && locationMatches.length >= 2) {
    confidence = 'high';
  } else if (activeRecords.length < 3) {
    confidence = 'low';
  }

  const plainExplanation = `Based on ${activeRecords.length} historical price records for ${normCategory} in ${locString}, the baseline market rate is ₹${rawMedian}/kg. Adjusted for ${normCondition} condition (multiplier: ${multiplier}x), the estimated fair rate is ₹${estimatedMin} – ₹${estimatedMax} per kg, giving an estimated lot value of ₹${totalEstimatedMin} – ₹${totalEstimatedMax} for ${numWeight} ${weightUnit}.`;

  return {
    isReliable: true,
    hasSufficientData: true,
    confidence,
    estimatedPrice: baselineUnitPrice,
    minPrice: estimatedMin,
    maxPrice: estimatedMax,
    midPrice: baselineUnitPrice,
    estimatedMin,
    estimatedMax,
    estimatedPerUnit: baselineUnitPrice,
    totalEstimatedMin,
    totalEstimatedMax,
    totalEstimatedMid,
    estimatedLotValueMin: totalEstimatedMin,
    estimatedLotValueMax: totalEstimatedMax,
    priceUnit: 'INR/kg',
    currency: 'INR',
    weight: numWeight,
    weightUnit,
    weightInKg,
    historicalMidPrice: rawMedian,
    historicalRecordsUsed: activeRecords.length,
    historicalRange: { min: histMin, max: histMax },
    factors: {
      conditionMultiplier: multiplier,
      historicalMidPrice: rawMedian,
      recordsUsed: activeRecords.length,
      weightInKg,
      location: locString
    },
    plainExplanation,
    explanation: plainExplanation,
    prototypeNotice: 'Prototype estimate based on historical demo data. This estimate is informational and may differ from an actual buyer offer.',
    isPrototypeEstimate: true,
    sourceType: 'demo_seed'
  };
};
