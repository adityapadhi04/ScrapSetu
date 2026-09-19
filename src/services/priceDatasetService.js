/**
 * ScrapSetu — SIH Price Dataset Service (Module 5)
 * 
 * Manages the structured Price Dataset layer required by SIH26229.
 * Handles sequential PRICE IDs, persistence in localStorage, historical queries,
 * validation, and statistics.
 */

import { DEMO_PRICE_SEED_RECORDS } from '../data/priceSeedData.js';

export const STORAGE_KEY_PRICE_DATASET = 'scrapsetu_price_dataset';

export const VALID_SOURCE_TYPES = ['demo_seed', 'platform_estimate', 'verified_transaction'];

/**
 * SIH Dataset Metadata & Limitations Specification
 */
export const PRICE_DATASET_METADATA = {
  datasetName: 'ScrapSetu SIH Price Dataset',
  datasetVersion: '1.0',
  source: 'SIH26229 Platform Intelligence',
  sources: [
    'Prototype demo seed data',
    'Platform-generated price estimates'
  ],
  limitations: [
    'Initial dataset is limited',
    'Demo records are illustrative',
    'No live market feed',
    'No verified buyer offers yet',
    'ML price prediction is not implemented'
  ],
  limitationsNotice: 'Prototype dataset based on demo seed records and rule-based condition adjustments. Not live market prices.'
};

/**
 * Retrieve metadata describing the price dataset provenance, quality, and limitations
 */
export const getPriceDatasetMetadata = () => {
  return { ...PRICE_DATASET_METADATA };
};

/**
 * Generate next sequential Price ID (PRICE-0001, PRICE-0002, ...)
 */
export const generateNextPriceId = (existingRecords = []) => {
  let highestNum = 0;
  for (const record of existingRecords) {
    if (record?.priceId && typeof record.priceId === 'string') {
      const match = record.priceId.match(/^PRICE-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    }
  }
  const nextNum = highestNum + 1;
  return `PRICE-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Validate price dataset record fields against SIH quality and integrity rules
 */
export const validatePriceRecord = (record, existingRecords = []) => {
  if (!record || typeof record !== 'object') {
    throw new Error('Record object is required');
  }

  // Required field checks
  if (!record.materialCategory || typeof record.materialCategory !== 'string' || !record.materialCategory.trim()) {
    throw new Error('materialCategory is required and must be a non-empty string');
  }

  // Location validation (string or object with area)
  if (!record.location) {
    throw new Error('location is required');
  }
  if (typeof record.location === 'string' && !record.location.trim()) {
    throw new Error('location is required');
  }
  if (typeof record.location === 'object' && !record.location.area?.trim() && !record.location.city?.trim()) {
    throw new Error('location must have area or city specified');
  }

  // Timestamp check
  if (!record.timestamp || isNaN(Date.parse(record.timestamp))) {
    throw new Error('timestamp must be a valid ISO date string');
  }

  // Price Unit & Currency
  if (!record.priceUnit || typeof record.priceUnit !== 'string' || !record.priceUnit.trim()) {
    throw new Error('priceUnit is required');
  }

  // Source Type validation
  if (!record.sourceType || !VALID_SOURCE_TYPES.includes(record.sourceType)) {
    throw new Error(`Invalid sourceType. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  // Numerical Price validations
  if (record.estimatedPrice !== null && record.estimatedPrice !== undefined) {
    const val = parseFloat(record.estimatedPrice);
    if (isNaN(val) || val <= 0) {
      throw new Error('estimatedPrice must be a positive number');
    }
  }

  const otherPriceFields = ['buyingPrice', 'quotedPrice', 'sellingPrice'];
  for (const field of otherPriceFields) {
    if (record[field] !== null && record[field] !== undefined) {
      const val = parseFloat(record[field]);
      if (isNaN(val)) {
        throw new Error(`${field} must be numeric when provided`);
      }
      if (val < 0) {
        throw new Error(`${field} cannot be negative`);
      }
    }
  }

  // Weight validation if provided
  if (record.weight !== null && record.weight !== undefined) {
    const numWeight = parseFloat(record.weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      throw new Error('weight must be a valid number greater than 0');
    }
  }

  // Duplicate check: prevent creating duplicate record with same priceId or duplicate identical estimate
  if (existingRecords && existingRecords.length > 0) {
    if (record.priceId) {
      const idCollision = existingRecords.find(
        (r) => r.priceId === record.priceId && r !== record
      );
      if (idCollision) {
        throw new Error(`A price record already exists with priceId: ${record.priceId}`);
      }
    }

    // If both lotId and sourceType match, prevent duplicate identical entries for same lot and source
    if (record.lotId && record.sourceType === 'platform_estimate') {
      const dupEstimate = existingRecords.find(
        (r) => r.lotId === record.lotId && r.sourceType === 'platform_estimate' && r.priceId !== record.priceId
      );
      if (dupEstimate) {
        throw new Error(`A platform estimate already exists for lotId: ${record.lotId}`);
      }
    }
  }

  return true;
};

/**
 * Retrieve all price records from localStorage (seeds initial demo records if empty)
 */
export const getPriceRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICE_DATASET);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PRICE_DATASET, JSON.stringify(DEMO_PRICE_SEED_RECORDS));
      return [...DEMO_PRICE_SEED_RECORDS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEMO_PRICE_SEED_RECORDS];
  } catch (e) {
    console.error('Error reading price dataset from storage:', e);
    return [...DEMO_PRICE_SEED_RECORDS];
  }
};

/**
 * Find price record by Price ID (e.g. PRICE-0001)
 */
export const getPriceRecordById = (priceId) => {
  if (!priceId) return null;
  const records = getPriceRecords();
  return records.find((r) => r.priceId === priceId) || null;
};

/**
 * Find price record linked to a specific Scrap Lot ID (e.g. LOT-0001)
 */
export const getPriceRecordByLotId = (lotId) => {
  if (!lotId) return null;
  const records = getPriceRecords();
  return records.find((r) => r.lotId === lotId) || null;
};

/**
 * Retrieve price records matching a specific material category (e.g. 'PCB')
 */
export const getPriceRecordsByMaterial = (materialCategory) => {
  if (!materialCategory) return [];
  const records = getPriceRecords();
  const normalized = materialCategory.trim().toLowerCase();
  return records.filter((r) => {
    if (!r.materialCategory) return false;
    const catLower = r.materialCategory.trim().toLowerCase();
    if (catLower === normalized) return true;
    if ((normalized === 'pcb' || normalized === 'electronic components') && (catLower === 'pcb' || catLower === 'electronic components')) return true;
    if ((normalized === 'cable' || normalized === 'cables & wires') && (catLower === 'cable' || catLower === 'cables & wires')) return true;
    if ((normalized === 'battery' || normalized === 'batteries') && (catLower === 'battery' || catLower === 'batteries')) return true;
    if ((normalized === 'motor' || normalized === 'motors & compressors') && (catLower === 'motor' || catLower === 'motors & compressors')) return true;
    if ((normalized.includes('display') || normalized.includes('lcd')) && catLower.includes('display')) return true;
    if ((normalized.includes('mobile') || normalized.includes('telecom')) && (catLower.includes('mobile') || catLower.includes('telecom'))) return true;
    if ((normalized.includes('laptop') || normalized.includes('it equipment') || normalized.includes('computer')) && (catLower.includes('it') || catLower.includes('laptop'))) return true;
    return false;
  });
};

/**
 * Retrieve price records matching a specific location (area or city)
 */
export const getPriceRecordsByLocation = (locationQuery) => {
  if (!locationQuery) return [];
  const records = getPriceRecords();
  const queryStr = typeof locationQuery === 'string'
    ? locationQuery.trim().toLowerCase()
    : (locationQuery.city || locationQuery.area || '').trim().toLowerCase();

  return records.filter((r) => {
    if (!r.location) return false;
    if (typeof r.location === 'string') {
      return r.location.toLowerCase().includes(queryStr);
    }
    const area = (r.location.area || '').toLowerCase();
    const city = (r.location.city || '').toLowerCase();
    const state = (r.location.state || '').toLowerCase();
    return area.includes(queryStr) || city.includes(queryStr) || state.includes(queryStr);
  });
};

/**
 * Retrieve historical prices filtered by material, optional location, and optional time window
 */
export const getHistoricalPrices = ({ materialCategory, location, days = 30 } = {}) => {
  let records = getPriceRecords();

  if (materialCategory) {
    const normMat = materialCategory.trim().toLowerCase();
    records = records.filter((r) => {
      if (!r.materialCategory) return false;
      const catLower = r.materialCategory.trim().toLowerCase();
      if (catLower === normMat) return true;
      if ((normMat === 'pcb' || normMat === 'electronic components') && (catLower === 'pcb' || catLower === 'electronic components')) return true;
      if ((normMat === 'cable' || normMat === 'cables & wires') && (catLower === 'cable' || catLower === 'cables & wires')) return true;
      if ((normMat === 'battery' || normMat === 'batteries') && (catLower === 'battery' || catLower === 'batteries')) return true;
      if ((normMat === 'motor' || normMat === 'motors & compressors') && (catLower === 'motor' || catLower === 'motors & compressors')) return true;
      if ((normMat.includes('display') || normMat.includes('lcd')) && catLower.includes('display')) return true;
      if ((normMat.includes('mobile') || normMat.includes('telecom')) && (catLower.includes('mobile') || catLower.includes('telecom'))) return true;
      if ((normMat.includes('laptop') || normMat.includes('it equipment') || normMat.includes('computer')) && (catLower.includes('it') || catLower.includes('laptop'))) return true;
      return false;
    });
  }

  if (location) {
    const normLoc = typeof location === 'string'
      ? location.trim().toLowerCase()
      : (location.city || location.area || '').trim().toLowerCase();

    if (normLoc) {
      records = records.filter((r) => {
        if (!r.location) return false;
        if (typeof r.location === 'string') {
          return r.location.toLowerCase().includes(normLoc);
        }
        return (
          (r.location.area || '').toLowerCase().includes(normLoc) ||
          (r.location.city || '').toLowerCase().includes(normLoc)
        );
      });
    }
  }

  // Sort chronological descending (newest first)
  return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Create a new validated Price Dataset record and persist in localStorage
 */
export const createPriceRecord = ({
  materialId = null,
  lotId = null,
  materialCategory,
  materialSubcategory = '',
  location,
  timestamp = new Date().toISOString(),
  buyerId = null,
  buyerType = null,
  buyingPrice = null,
  quotedPrice = null,
  sellingPrice = null,
  estimatedPrice = null,
  priceUnit = 'INR/kg',
  currency = 'INR',
  weight = null,
  weightUnit = 'kg',
  condition = 'fair',
  sourceType = 'platform_estimate',
  recordedAt = null,
  createdAt = new Date().toISOString(),
  datasetVersion = '1.0'
}) => {
  const existingRecords = getPriceRecords();
  const nextId = generateNextPriceId(existingRecords);
  const finalRecordedAt = recordedAt || timestamp || createdAt || new Date().toISOString();

  // Normalize location
  const normalizedLocation = typeof location === 'string'
    ? { area: location.trim(), city: '', state: '' }
    : {
        area: location?.area?.trim() || 'Gunupur',
        city: location?.city?.trim() || '',
        state: location?.state?.trim() || 'Odisha'
      };

  const newRecord = {
    priceId: nextId,
    materialId,
    lotId,
    materialCategory,
    materialSubcategory: materialSubcategory || materialCategory,
    location: normalizedLocation,
    timestamp: timestamp || finalRecordedAt,
    recordedAt: finalRecordedAt,
    buyerId,
    buyerType,
    buyingPrice: buyingPrice !== null && buyingPrice !== undefined ? parseFloat(buyingPrice) : null,
    quotedPrice: quotedPrice !== null && quotedPrice !== undefined ? parseFloat(quotedPrice) : null,
    sellingPrice: sellingPrice !== null && sellingPrice !== undefined ? parseFloat(sellingPrice) : null,
    estimatedPrice: estimatedPrice !== null && estimatedPrice !== undefined ? parseFloat(estimatedPrice) : null,
    priceUnit,
    currency,
    weight: weight !== null && weight !== undefined ? parseFloat(weight) : null,
    weightUnit,
    condition: condition ? condition.toLowerCase() : 'fair',
    sourceType,
    createdAt: createdAt || finalRecordedAt,
    datasetVersion
  };

  validatePriceRecord(newRecord, existingRecords);

  const updated = [newRecord, ...existingRecords];
  localStorage.setItem(STORAGE_KEY_PRICE_DATASET, JSON.stringify(updated));

  return newRecord;
};

/**
 * Calculate dataset metrics and distribution for Admin inspection
 */
export const getPriceDatasetStats = () => {
  const records = getPriceRecords();
  const totalRecords = records.length;
  const demoSeedCount = records.filter((r) => r.sourceType === 'demo_seed').length;
  const platformEstimateCount = records.filter((r) => r.sourceType === 'platform_estimate').length;

  const materialsSet = new Set();
  const locationsSet = new Set();

  for (const r of records) {
    if (r.materialCategory) materialsSet.add(r.materialCategory);
    if (r.location) {
      if (typeof r.location === 'string') {
        locationsSet.add(r.location);
      } else {
        if (r.location.city) locationsSet.add(r.location.city);
        if (r.location.area) locationsSet.add(r.location.area);
      }
    }
  }

  return {
    totalRecords,
    seedCount: demoSeedCount,
    demoSeedCount,
    platformEstimateCount,
    materialsCovered: materialsSet.size,
    materialsCoveredCount: materialsSet.size,
    locationsCovered: locationsSet.size,
    locationsCoveredCount: locationsSet.size,
    materialsList: Array.from(materialsSet),
    locationsList: Array.from(locationsSet),
    datasetVersion: PRICE_DATASET_METADATA.datasetVersion
  };
};

/**
 * Reset price dataset back to initial seed data state
 */
export const resetPriceDataset = () => {
  localStorage.setItem(STORAGE_KEY_PRICE_DATASET, JSON.stringify(DEMO_PRICE_SEED_RECORDS));
  return [...DEMO_PRICE_SEED_RECORDS];
};
