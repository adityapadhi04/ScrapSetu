/**
 * ScrapSetu — ML Dataset Service (Module 13)
 *
 * Generates, validates, and stores model-ready ML datasets derived from
 * existing application data: scrap lots, material catalog, price dataset,
 * offers, and transactions.
 *
 * PRINCIPLES:
 * - Reads ONLY from existing data services; no duplicate data silos.
 * - Stores model-ready records in localStorage under `scrapsetu_ml_dataset`.
 * - Validates missing/invalid data, flags errors deterministically.
 * - Deduplicates records based on deterministic composite keys.
 * - Explicit prototype status: no fabricated accuracy or false production claims.
 */

import { getAllScrapLots } from './scrapLotService.js';
import { getPriceRecords } from './priceDatasetService.js';
import { getOffers } from './offerService.js';
import { getTransactions } from './transactionService.js';

export const STORAGE_KEY_ML_DATASET = 'scrapsetu_ml_dataset';
export const ML_DATASET_VERSION = 'v1.0-prototype';

/**
 * Validate a candidate ML record.
 * @param {object} record
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateMlRecord = (record) => {
  const errors = [];

  if (!record.materialCategory || typeof record.materialCategory !== 'string' || !record.materialCategory.trim()) {
    errors.push('Missing or invalid materialCategory');
  }

  const weight = parseFloat(record.weight);
  if (isNaN(weight) || weight <= 0) {
    errors.push('Weight must be a positive number');
  }

  if (record.estimatedPrice != null) {
    const est = parseFloat(record.estimatedPrice);
    if (isNaN(est) || est < 0) {
      errors.push('Estimated price must be non-negative if provided');
    }
  }

  if (record.actualOfferPrice != null) {
    const act = parseFloat(record.actualOfferPrice);
    if (isNaN(act) || act < 0) {
      errors.push('Actual offer price must be non-negative if provided');
    }
  }

  const validConditions = ['good', 'fair', 'damaged'];
  if (record.condition && !validConditions.includes(String(record.condition).toLowerCase())) {
    errors.push(`Condition should be one of: ${validConditions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Build a deterministic deduplication signature.
 */
const _recordSignature = (r) => {
  const lot = r.lotId || '';
  const mat = (r.materialCategory || '').trim().toLowerCase();
  const sub = (r.materialSubcategory || '').trim().toLowerCase();
  const wt = parseFloat(r.weight) || 0;
  const cond = (r.condition || 'fair').trim().toLowerCase();
  const src = r.sourceType || '';
  return `${lot}|${mat}|${sub}|${wt.toFixed(2)}|${cond}|${src}`;
};

/**
 * Generate and store model-ready records by synthesizing existing platform data.
 * @returns {Array<object>} Saved ML dataset records
 */
export const syncMlDataset = () => {
  const lots = getAllScrapLots();
  const prices = getPriceRecords();
  const offers = getOffers();
  const txns = getTransactions();

  const records = [];
  const seenSignatures = new Set();
  let counter = 1;

  // 1. Ingest scrap lots (with attached offers/transactions if any)
  for (const lot of lots) {
    const relatedOffers = offers.filter((o) => o.lotId === lot.id || o.lotId === lot.lotId);
    const relatedTx = txns.find((t) => t.lotId === lot.id || t.lotId === lot.lotId);

    const acceptedOffer = relatedOffers.find((o) => o.status === 'accepted') || relatedOffers[0];
    const buyerRole = relatedTx?.buyerRole || acceptedOffer?.buyerRole || null;

    let pathway = 'undetermined';
    if (buyerRole === 'repair' || buyerRole === 'repair-shop') {
      pathway = 'reuse';
    } else if (buyerRole === 'recycler') {
      pathway = 'recycle';
    }

    const weight = parseFloat(lot.weight) || 0;
    const actualOfferPrice = relatedTx?.totalAmount ?? acceptedOffer?.totalOfferValue ?? acceptedOffer?.offerAmount ?? null;
    const estPrice = lot.estimatedPrice ? parseFloat(lot.estimatedPrice) : (actualOfferPrice || null);

    const rawRecord = {
      id: `ML-${String(counter).padStart(4, '0')}`,
      lotId: lot.id || lot.lotId || null,
      materialCategory: lot.materialCategory || lot.materialType || 'Unknown',
      materialSubcategory: lot.materialSubcategory || lot.materialName || 'General',
      weight,
      condition: (lot.condition || 'fair').toLowerCase(),
      location: lot.location || { city: 'Rayagada', state: 'Odisha' },
      estimatedPrice: estPrice,
      actualOfferPrice: actualOfferPrice ? parseFloat(actualOfferPrice) : null,
      pricePerKg: weight > 0 && actualOfferPrice ? Math.round((actualOfferPrice / weight) * 100) / 100 : null,
      buyerRole,
      pathway,
      timestamp: lot.createdAt || lot.timestamp || new Date().toISOString(),
      sourceType: lot.sourceType || 'scrap_lot',
      datasetVersion: ML_DATASET_VERSION,
    };

    const sig = _recordSignature(rawRecord);
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      const validation = validateMlRecord(rawRecord);
      records.push({
        ...rawRecord,
        isValid: validation.isValid,
        validationErrors: validation.errors,
      });
      counter++;
    }
  }

  // 2. Ingest benchmark price records as additional reference data
  for (const p of prices) {
    const weight = parseFloat(p.weight) || 1.0;
    const pricePerKg = parseFloat(p.pricePerKg) || parseFloat(p.buyingPrice) || parseFloat(p.quotedPrice) || 0;
    const totalVal = weight * pricePerKg;

    const rawRecord = {
      id: `ML-${String(counter).padStart(4, '0')}`,
      lotId: p.lotId || null,
      materialCategory: p.materialCategory || 'Unknown',
      materialSubcategory: p.materialSubcategory || 'Standard',
      weight,
      condition: (p.condition || 'fair').toLowerCase(),
      location: p.location || { city: 'Rayagada', state: 'Odisha' },
      estimatedPrice: totalVal > 0 ? Math.round(totalVal * 100) / 100 : null,
      actualOfferPrice: totalVal > 0 ? Math.round(totalVal * 100) / 100 : null,
      pricePerKg: pricePerKg > 0 ? pricePerKg : null,
      buyerRole: p.buyerType || null,
      pathway: p.buyerType === 'repair_shop' ? 'reuse' : (p.buyerType === 'recycler' ? 'recycle' : 'undetermined'),
      timestamp: p.recordedAt || p.timestamp || new Date().toISOString(),
      sourceType: p.sourceType || 'price_dataset',
      datasetVersion: ML_DATASET_VERSION,
    };

    const sig = _recordSignature(rawRecord);
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      const validation = validateMlRecord(rawRecord);
      records.push({
        ...rawRecord,
        isValid: validation.isValid,
        validationErrors: validation.errors,
      });
      counter++;
    }
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ML_DATASET, JSON.stringify(records));
    }
  } catch (err) {
    console.warn('[mlDatasetService] Failed to persist ML dataset:', err);
  }

  return records;
};

/**
 * Retrieve current ML dataset records from localStorage, or initialize from existing data.
 * @returns {Array<object>}
 */
export const getMlDataset = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_ML_DATASET);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (err) {
    console.warn('[mlDatasetService] Error parsing ML dataset from storage:', err);
  }
  return syncMlDataset();
};

/**
 * Compute aggregate statistics for the ML dataset.
 * @returns {object}
 */
export const getMlDatasetStats = () => {
  const records = getMlDataset();
  const totalRecords = records.length;
  const validRecords = records.filter((r) => r.isValid).length;
  const invalidRecords = totalRecords - validRecords;

  const sourceTypes = {};
  const materialCategories = {};
  const pathways = { reuse: 0, recycle: 0, undetermined: 0 };
  let totalWeight = 0;

  for (const r of records) {
    const src = r.sourceType || 'unknown';
    sourceTypes[src] = (sourceTypes[src] || 0) + 1;

    const cat = r.materialCategory || 'Unknown';
    materialCategories[cat] = (materialCategories[cat] || 0) + 1;

    const pw = r.pathway || 'undetermined';
    if (pathways[pw] !== undefined) {
      pathways[pw]++;
    } else {
      pathways.undetermined++;
    }

    totalWeight += (parseFloat(r.weight) || 0);
  }

  return {
    totalRecords,
    validRecords,
    invalidRecords,
    datasetVersion: ML_DATASET_VERSION,
    modelStatus: 'heuristic_prototype',
    disclaimer: 'Transparent heuristic intelligence dataset. Not a production-trained neural network.',
    sourceTypes,
    materialCategories,
    pathways,
    totalWeightKg: Math.round(totalWeight * 10) / 10,
    averageWeightKg: totalRecords > 0 ? Math.round((totalWeight / totalRecords) * 10) / 10 : 0,
  };
};

/**
 * Export ML dataset records as CSV string or download.
 * @param {Array<object>} [customRecords]
 * @returns {string} CSV text
 */
export const exportMlDatasetToCsvText = (customRecords = null) => {
  const records = customRecords || getMlDataset();
  if (!records || records.length === 0) return '';

  const columns = [
    'id', 'lotId', 'materialCategory', 'materialSubcategory',
    'weight', 'condition', 'estimatedPrice', 'actualOfferPrice',
    'pricePerKg', 'buyerRole', 'pathway', 'timestamp', 'sourceType',
    'datasetVersion', 'isValid'
  ];

  const header = columns.join(',');
  const rows = records.map((r) =>
    columns.map((c) => {
      const val = r[c] ?? '';
      const str = String(val);
      return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );

  return [header, ...rows].join('\n');
};

export default {
  STORAGE_KEY_ML_DATASET,
  ML_DATASET_VERSION,
  validateMlRecord,
  syncMlDataset,
  getMlDataset,
  getMlDatasetStats,
  exportMlDatasetToCsvText,
};
