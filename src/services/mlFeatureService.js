/**
 * ScrapSetu — ML Feature Engineering Service (Module 13)
 *
 * Provides transparent, deterministic feature engineering for ScrapSetu datasets:
 * - Material encoding & hazard level
 * - Condition flags (good / fair / damaged)
 * - Weight (raw kg, log weight, scale tier)
 * - Location extraction (city, district tier)
 * - Historical benchmark rate
 * - Unit price per kg
 * - Buyer role & pathway one-hot encodings
 */

import { getPriceRecords } from './priceDatasetService.js';

// Material category ordinal hazard ranking (derived from safetyCatalog)
export const MATERIAL_HAZARD_INDEX = {
  'battery': 3,
  'batteries': 3,
  'lithium': 3,
  'lead acid': 3,
  'pcb': 2,
  'printed circuit board': 2,
  'electronic components': 2,
  'crt': 3,
  'display': 2,
  'screen': 2,
  'cables & wires': 1,
  'copper cable': 1,
  'cable': 1,
  'wire': 1,
  'metal': 0,
  'plastic': 0,
  'mixed': 1,
  'general': 1,
  'unknown': 1,
};

/**
 * Get benchmark price per kg for a given material category from local price dataset.
 * @param {string} category
 * @returns {number|null}
 */
export const getHistoricalBenchmarkRate = (category) => {
  if (!category) return null;
  const prices = getPriceRecords();
  const catLower = category.toLowerCase().trim();

  const matches = prices.filter((p) =>
    (p.materialCategory || '').toLowerCase().includes(catLower) ||
    catLower.includes((p.materialCategory || '').toLowerCase())
  );

  if (matches.length === 0) return null;

  const validRates = matches
    .map((m) => parseFloat(m.pricePerKg) || parseFloat(m.buyingPrice) || parseFloat(m.quotedPrice))
    .filter((n) => !isNaN(n) && n > 0);

  if (validRates.length === 0) return null;
  const sum = validRates.reduce((a, b) => a + b, 0);
  return Math.round((sum / validRates.length) * 100) / 100;
};

/**
 * Extract feature vector from a scrap lot, ML record, or raw parameter input.
 * @param {object} item
 * @returns {object} Deterministic feature dictionary
 */
export const extractFeatures = (item) => {
  if (!item || typeof item !== 'object') {
    return {
      isValid: false,
      error: 'Invalid record supplied for feature extraction',
      features: {},
    };
  }

  const weightKg = parseFloat(item.weight) || 0;
  const condition = (item.condition || 'fair').toLowerCase().trim();
  const category = (item.materialCategory || item.materialType || 'Unknown').trim();
  const categoryLower = category.toLowerCase();
  const buyerRole = (item.buyerRole || '').toLowerCase().trim();
  const pathway = (item.pathway || '').toLowerCase().trim();

  // 1. Condition Features
  const isGood = condition === 'good' ? 1 : 0;
  const isFair = condition === 'fair' ? 1 : 0;
  const isDamaged = condition === 'damaged' ? 1 : 0;
  const conditionWeightFactor = isGood ? 1.15 : (isDamaged ? 0.70 : 1.00);

  // 2. Weight Features
  const logWeight = weightKg > 0 ? Math.round(Math.log(weightKg + 1) * 1000) / 1000 : 0;
  const isMicroLot = weightKg < 2.0 ? 1 : 0;
  const isBulkLot = weightKg >= 10.0 ? 1 : 0;

  // 3. Hazard & Material Features
  let hazardScore = 1;
  for (const [key, score] of Object.entries(MATERIAL_HAZARD_INDEX)) {
    if (categoryLower.includes(key)) {
      hazardScore = score;
      break;
    }
  }

  // 4. Location Features
  let city = 'Unknown';
  if (typeof item.location === 'object' && item.location) {
    city = item.location.city || item.location.area || 'Unknown';
  } else if (typeof item.location === 'string') {
    city = item.location;
  }
  const isRayagada = city.toLowerCase().includes('rayagada') ? 1 : 0;
  const isBhubaneswar = city.toLowerCase().includes('bhubaneswar') ? 1 : 0;

  // 5. Price & Benchmark Features
  const benchmarkRate = getHistoricalBenchmarkRate(category);
  const actualOfferPrice = parseFloat(item.actualOfferPrice) || parseFloat(item.agreedPrice) || null;
  const unitPricePerKg = weightKg > 0 && actualOfferPrice != null
    ? Math.round((actualOfferPrice / weightKg) * 100) / 100
    : (benchmarkRate ? Math.round(benchmarkRate * conditionWeightFactor * 100) / 100 : null);

  // 6. Pathway & Role Features
  const isRepairRole = (buyerRole === 'repair' || buyerRole === 'repair-shop') ? 1 : 0;
  const isRecyclerRole = (buyerRole === 'recycler') ? 1 : 0;
  const isReusePathway = pathway === 'reuse' || isRepairRole === 1 ? 1 : 0;
  const isRecyclePathway = pathway === 'recycle' || isRecyclerRole === 1 ? 1 : 0;

  const featureVector = {
    // Numeric continuous
    weight_kg: weightKg,
    log_weight: logWeight,
    condition_multiplier: conditionWeightFactor,
    hazard_score: hazardScore,
    benchmark_price_per_kg: benchmarkRate,
    unit_price_per_kg: unitPricePerKg,

    // Categorical binary flags
    is_good: isGood,
    is_fair: isFair,
    is_damaged: isDamaged,
    is_micro_lot: isMicroLot,
    is_bulk_lot: isBulkLot,
    is_location_rayagada: isRayagada,
    is_location_bhubaneswar: isBhubaneswar,
    is_repair_buyer: isRepairRole,
    is_recycler_buyer: isRecyclerRole,
    pathway_reuse: isReusePathway,
    pathway_recycle: isRecyclePathway,
  };

  return {
    isValid: true,
    lotId: item.lotId || item.id || null,
    materialCategory: category,
    condition,
    features: featureVector,
    featureCount: Object.keys(featureVector).length,
  };
};

/**
 * Batch feature extraction across an array of records.
 * @param {Array<object>} records
 * @returns {{ count: number, vectors: Array<object>, featureNames: string[] }}
 */
export const batchExtractFeatures = (records = []) => {
  if (!Array.isArray(records)) return { count: 0, vectors: [], featureNames: [] };
  const extracted = records.map(extractFeatures).filter((r) => r.isValid);
  const featureNames = extracted.length > 0 ? Object.keys(extracted[0].features) : [];
  return {
    count: extracted.length,
    vectors: extracted,
    featureNames,
  };
};

/**
 * Feature Schema definitions for documentation and administrative inspection.
 */
export const getFeatureSchema = () => [
  { name: 'weight_kg', type: 'numeric', description: 'Total lot weight measured in kilograms' },
  { name: 'log_weight', type: 'numeric', description: 'Log-transformed weight log(1 + weight_kg) for scale dampening' },
  { name: 'condition_multiplier', type: 'numeric', description: 'Condition heuristic factor (good: 1.15, fair: 1.00, damaged: 0.70)' },
  { name: 'hazard_score', type: 'integer', description: 'Material safety hazard severity rating (0: benign, 3: acute e-waste hazard)' },
  { name: 'benchmark_price_per_kg', type: 'numeric', description: 'Historical average price per kg for category from local transactions' },
  { name: 'unit_price_per_kg', type: 'numeric', description: 'Actual or benchmark-conditioned price per kg' },
  { name: 'is_good', type: 'binary', description: '1 if item is in Good condition, else 0' },
  { name: 'is_fair', type: 'binary', description: '1 if item is in Fair condition, else 0' },
  { name: 'is_damaged', type: 'binary', description: '1 if item is Damaged, else 0' },
  { name: 'is_micro_lot', type: 'binary', description: '1 if lot weight < 2kg (typical handheld device salvage)' },
  { name: 'is_bulk_lot', type: 'binary', description: '1 if lot weight >= 10kg (commercial or aggregated scrap)' },
  { name: 'is_location_rayagada', type: 'binary', description: '1 if location matches Rayagada district' },
  { name: 'is_location_bhubaneswar', type: 'binary', description: '1 if location matches Bhubaneswar' },
  { name: 'is_repair_buyer', type: 'binary', description: '1 if buyer role is Repair Shop' },
  { name: 'is_recycler_buyer', type: 'binary', description: '1 if buyer role is Authorized Recycler' },
  { name: 'pathway_reuse', type: 'binary', description: '1 if destined for reuse/repair pathway' },
  { name: 'pathway_recycle', type: 'binary', description: '1 if destined for formal recycling pathway' },
];

export default {
  MATERIAL_HAZARD_INDEX,
  getHistoricalBenchmarkRate,
  extractFeatures,
  batchExtractFeatures,
  getFeatureSchema,
};
