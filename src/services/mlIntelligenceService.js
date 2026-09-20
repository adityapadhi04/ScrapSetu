/**
 * ScrapSetu — ML Intelligence Service (Module 13)
 *
 * Prototype decision-support intelligence for e-waste scrap lots:
 * - Deterministic price prediction & heuristic modeling
 * - Transparent prediction explanations
 * - Anomaly detection with clear root-cause explanations (no fraud accusations)
 * - Explicit insufficient_data / prototype status handling
 *
 * INVARIANTS:
 * - Never claims a production-trained or certified neural model.
 * - Explains WHY values deviate instead of using punitive language.
 * - Graceful fallback when historical records are insufficient.
 */

import { extractFeatures, getHistoricalBenchmarkRate } from './mlFeatureService.js';
import { getPriceRecords } from './priceDatasetService.js';
import { getMlDataset } from './mlDatasetService.js';

// Typical reasonable weight boundaries (in kg) for sanity/outlier detection
export const TYPICAL_WEIGHT_BOUNDS = {
  'mobile': { min: 0.1, max: 2.5 },
  'phone': { min: 0.1, max: 2.5 },
  'battery': { min: 0.05, max: 15.0 },
  'pcb': { min: 0.1, max: 10.0 },
  'cables': { min: 0.2, max: 50.0 },
  'cable': { min: 0.2, max: 50.0 },
  'screen': { min: 0.5, max: 15.0 },
  'appliance': { min: 2.0, max: 80.0 },
  'default': { min: 0.1, max: 50.0 },
};

/**
 * Predict valuation for a scrap lot or parameter set.
 * @param {object} input
 * @returns {object}
 */
export const predictScrapPrice = (input) => {
  if (!input || typeof input !== 'object') {
    return {
      status: 'insufficient_data',
      predictedTotal: null,
      predictedPricePerKg: null,
      confidence: null,
      explanation: 'Missing input parameters. Requires materialCategory and weight.',
      modelType: 'heuristic_weighted_prototype',
      disclaimer: 'Prototype decision support model. Not a production-trained ML model.',
    };
  }

  const category = (input.materialCategory || input.materialType || '').trim();
  const weight = parseFloat(input.weight);

  if (!category || isNaN(weight) || weight <= 0) {
    return {
      status: 'insufficient_data',
      predictedTotal: null,
      predictedPricePerKg: null,
      confidence: null,
      explanation: 'Valid material category and positive weight (> 0 kg) are required.',
      modelType: 'heuristic_weighted_prototype',
      disclaimer: 'Prototype decision support model. Not a production-trained ML model.',
    };
  }

  const featureResult = extractFeatures(input);
  const benchmarkRate = getHistoricalBenchmarkRate(category);

  // Check sample count in price dataset
  const prices = getPriceRecords();
  const matchingRecords = prices.filter((p) =>
    (p.materialCategory || '').toLowerCase().includes(category.toLowerCase())
  );
  const sampleCount = matchingRecords.length;

  if (!benchmarkRate || sampleCount === 0) {
    return {
      status: 'insufficient_data',
      predictedTotal: null,
      predictedPricePerKg: null,
      confidence: null,
      sampleCount: 0,
      materialCategory: category,
      weight,
      explanation: `No historical price records found for material "${category}". Unable to estimate price without baseline records.`,
      modelType: 'heuristic_weighted_prototype',
      disclaimer: 'Prototype decision support model. Not a production-trained ML model.',
    };
  }

  const conditionMultiplier = featureResult.features.condition_multiplier || 1.0;
  const pricePerKg = Math.round(benchmarkRate * conditionMultiplier * 100) / 100;
  const predictedTotal = Math.round(pricePerKg * weight);

  const confidence = sampleCount >= 5 ? 'moderate' : 'low_sample_count';
  const conditionLabel = featureResult.condition || 'fair';
  const recommendedPathway = featureResult.features.is_damaged ? 'recycle' : 'reuse';

  const explanation = [
    `Baseline benchmark rate for "${category}": ₹${benchmarkRate}/kg (derived from ${sampleCount} historical records).`,
    `Applied condition factor for "${conditionLabel}": ${conditionMultiplier}x.`,
    `Resulting unit rate: ₹${pricePerKg}/kg across ${weight} kg lot.`,
    `Recommended circular pathway: ${recommendedPathway === 'reuse' ? 'Repair / Component Reuse' : 'Authorized Recycling'}.`
  ].join(' ');

  return {
    status: 'prototype',
    predictedTotal,
    predictedPricePerKg: pricePerKg,
    baseBenchmarkPerKg: benchmarkRate,
    conditionMultiplier,
    weightKg: weight,
    materialCategory: category,
    sampleCount,
    confidence,
    recommendedPathway,
    explanation,
    modelType: 'heuristic_weighted_prototype',
    disclaimer: 'Prototype decision support model. Not a production-trained ML model or certified financial quote.',
  };
};

/**
 * Detect unusual properties or potential data recording discrepancies.
 * Never accuses users of fraud; offers plausible operational explanations.
 * @param {object} item
 * @returns {object}
 */
export const detectAnomalies = (item) => {
  if (!item || typeof item !== 'object') {
    return {
      isAnomaly: false,
      anomalyCount: 0,
      anomalies: [],
      riskLevel: 'low',
    };
  }

  const anomalies = [];
  const category = (item.materialCategory || item.materialType || '').toLowerCase();
  const weight = parseFloat(item.weight);
  const condition = (item.condition || '').toLowerCase();

  // 1. Weight Bounds Anomaly
  if (!isNaN(weight) && weight > 0) {
    let bounds = TYPICAL_WEIGHT_BOUNDS.default;
    for (const [key, b] of Object.entries(TYPICAL_WEIGHT_BOUNDS)) {
      if (category.includes(key)) {
        bounds = b;
        break;
      }
    }

    if (weight > bounds.max * 2.5) {
      anomalies.push({
        field: 'weight',
        type: 'high_weight_outlier',
        severity: 'medium',
        explanation: `Lot weight (${weight} kg) exceeds standard individual threshold (${bounds.max} kg) for ${item.materialCategory}. May indicate bulk bundled scrap or weighing scale calibration difference.`,
      });
    } else if (weight < bounds.min / 2 && weight < 0.05) {
      anomalies.push({
        field: 'weight',
        type: 'low_weight_outlier',
        severity: 'low',
        explanation: `Lot weight (${weight} kg) is unusually small. Verify if decimal point was entered in grams instead of kilograms.`,
      });
    }
  }

  // 2. Price Benchmark Deviation Anomaly
  const actualPrice = parseFloat(item.actualOfferPrice) || parseFloat(item.estimatedPrice);
  if (!isNaN(actualPrice) && actualPrice > 0 && !isNaN(weight) && weight > 0) {
    const benchmark = getHistoricalBenchmarkRate(item.materialCategory);
    if (benchmark && benchmark > 0) {
      const unitRate = actualPrice / weight;
      const ratio = unitRate / benchmark;

      if (ratio > 2.5) {
        anomalies.push({
          field: 'price',
          type: 'elevated_unit_price',
          severity: 'medium',
          explanation: `Quoted rate (₹${Math.round(unitRate)}/kg) is over 2.5x higher than regional benchmark (₹${benchmark}/kg). Total lump sum value may have been entered into the per-kg field.`,
        });
      } else if (ratio < 0.3) {
        anomalies.push({
          field: 'price',
          type: 'depressed_unit_price',
          severity: 'low',
          explanation: `Quoted rate (₹${Math.round(unitRate)}/kg) is under 30% of benchmark (₹${benchmark}/kg). Check if material consists of mixed low-grade casing rather than pure extracted metals.`,
        });
      }
    }
  }

  // 3. Condition vs Pricing Contradiction Anomaly
  if (condition === 'damaged' && !isNaN(actualPrice) && actualPrice > 0 && !isNaN(weight) && weight > 0) {
    const benchmark = getHistoricalBenchmarkRate(item.materialCategory);
    if (benchmark) {
      const unitRate = actualPrice / weight;
      if (unitRate > benchmark * 1.15) {
        anomalies.push({
          field: 'condition',
          type: 'condition_valuation_mismatch',
          severity: 'low',
          explanation: `Material is marked as "Damaged", but price rate matches or exceeds "Good" condition rates. Component may possess rare salvageable sub-parts.`,
        });
      }
    }
  }

  return {
    isAnomaly: anomalies.length > 0,
    anomalyCount: anomalies.length,
    anomalies,
    riskLevel: anomalies.length >= 2 ? 'medium' : (anomalies.length === 1 ? 'low' : 'none'),
  };
};

/**
 * Scan all current ML dataset records for anomalies.
 * @returns {object}
 */
export const scanDatasetForAnomalies = () => {
  const records = getMlDataset();
  const results = [];

  for (const record of records) {
    const anomalyResult = detectAnomalies(record);
    if (anomalyResult.isAnomaly) {
      results.push({
        recordId: record.id,
        lotId: record.lotId,
        materialCategory: record.materialCategory,
        weight: record.weight,
        ...anomalyResult,
      });
    }
  }

  return {
    totalScanned: records.length,
    anomalyCount: results.length,
    anomalyPercentage: records.length > 0 ? Math.round((results.length / records.length) * 1000) / 10 : 0,
    anomalies: results,
  };
};

/**
 * Generate human-readable explanation of an ML prediction.
 * @param {object} prediction
 * @returns {string}
 */
export const explainPrediction = (prediction) => {
  if (!prediction || prediction.status !== 'prototype') {
    return 'Insufficient data to generate an explanation.';
  }
  return prediction.explanation;
};

export default {
  TYPICAL_WEIGHT_BOUNDS,
  predictScrapPrice,
  detectAnomalies,
  scanDatasetForAnomalies,
  explainPrediction,
};
