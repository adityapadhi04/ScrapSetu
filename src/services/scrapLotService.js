/**
 * ScrapSetu — Scrap Lot Data Service (Module 3 & Module 4)
 * Centralized service managing scrap lot data, creation, ID generation,
 * collector-specific filtering, and linkage to SIH Material Dataset records.
 */

import { MATERIAL_CATALOG, MATERIAL_OPTIONS as CATALOG_MATERIAL_OPTIONS } from '../data/materialCatalog.js';
import { createMaterialRecord, resetMaterialDataset } from './materialDatasetService.js';
import { createPriceRecord, resetPriceDataset } from './priceDatasetService.js';

export const STORAGE_KEY_SCRAP_LOTS = 'scrapsetu_scrap_lots';

export const MATERIAL_OPTIONS = CATALOG_MATERIAL_OPTIONS;

export const CONDITION_OPTIONS = [
  {
    key: 'good',
    labelKey: 'conditionGood',
    fallbackName: 'Good',
    symbol: '🟢',
    badgeVariant: 'success',
    color: '#15803d',
    description: 'Intact, reusable components or high-grade scrap'
  },
  {
    key: 'fair',
    labelKey: 'conditionFair',
    fallbackName: 'Fair',
    symbol: '🟡',
    badgeVariant: 'warning',
    color: '#d97706',
    description: 'Moderate wear, mixed salvage potential'
  },
  {
    key: 'damaged',
    labelKey: 'conditionDamaged',
    fallbackName: 'Damaged',
    symbol: '🔴',
    badgeVariant: 'danger',
    color: '#dc2626',
    description: 'Cracked, burnt, or severely dismantled'
  },
  {
    key: 'mixed',
    labelKey: 'conditionMixed',
    fallbackName: 'Mixed / Unknown',
    symbol: '⚪',
    badgeVariant: 'neutral',
    color: '#64748b',
    description: 'Multiple mixed parts or condition unknown'
  }
];

// Initial seed lots for usr-collector-01 linked to MAT-0001, MAT-0002 and PRICE-0001, PRICE-0005
const SEED_LOTS = [
  {
    id: 'LOT-0001',
    materialId: 'MAT-0001',
    priceId: 'PRICE-0001',
    collectorId: 'usr-collector-01',
    materialType: 'PCB',
    materialCategory: 'Electronic Components',
    materialSubcategory: 'Computer PCB',
    photo: null,
    weight: 2.4,
    weightUnit: 'kg',
    condition: 'fair',
    location: {
      area: 'Gunupur',
      city: 'Rayagada',
      state: 'Odisha'
    },
    notes: 'Laptop motherboards and PCB fragments',
    status: 'Created',
    createdAt: '2026-09-18T10:00:00.000Z',
    identificationMethod: 'manual',
    confidenceScore: 1.0,
    collectorConfirmed: true,
    estimatedPrice: 320,
    estimatedLotValueMin: 720,
    estimatedLotValueMax: 816,
    offerStatus: 'offers_available',
    transactionStatus: 'completed'
  },
  {
    id: 'LOT-0002',
    materialId: 'MAT-0002',
    priceId: 'PRICE-0005',
    collectorId: 'usr-collector-01',
    materialType: 'Cable',
    materialCategory: 'Cables & Wires',
    materialSubcategory: 'Copper Cable',
    photo: null,
    weight: 5.0,
    weightUnit: 'kg',
    condition: 'good',
    location: {
      area: 'Gunupur',
      city: 'Rayagada',
      state: 'Odisha'
    },
    notes: 'Stripped copper power wiring',
    status: 'Created',
    createdAt: '2026-09-19T08:30:00.000Z',
    identificationMethod: 'manual',
    confidenceScore: 1.0,
    collectorConfirmed: true,
    estimatedPrice: 660,
    estimatedLotValueMin: 3200,
    estimatedLotValueMax: 3400,
    offerStatus: 'offers_available',
    transactionStatus: 'created'
  }
];

/**
 * Generate next formatted Lot ID (LOT-0001, LOT-0002, etc.)
 */
export const generateNextLotId = (existingLots = []) => {
  let highestNum = 0;
  for (const lot of existingLots) {
    if (lot.id && typeof lot.id === 'string') {
      const match = lot.id.match(/^LOT-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    }
  }
  const nextNum = highestNum + 1;
  return `LOT-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Retrieve all scrap lots from localStorage (seeds initial data if empty)
 */
export const getScrapLots = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCRAP_LOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(SEED_LOTS));
      return SEED_LOTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LOTS;
  } catch (e) {
    console.error('Error reading scrap lots from storage:', e);
    return SEED_LOTS;
  }
};

export const getAllScrapLots = getScrapLots;

/**
 * Retrieve scrap lots belonging exclusively to a specific collector
 */
export const getScrapLotsByCollector = (collectorId) => {
  if (!collectorId) return [];
  const allLots = getScrapLots();
  return allLots.filter((lot) => lot.collectorId === collectorId);
};

/**
 * Retrieve a specific scrap lot by ID
 */
export const getScrapLotById = (lotId) => {
  if (!lotId) return null;
  const allLots = getScrapLots();
  return allLots.find((lot) => lot.id === lotId) || null;
};

/**
 * Create a new scrap lot, atomically create linked Material Dataset record, and persist in localStorage
 */
export const createScrapLot = ({
  collectorId,
  materialType,
  materialCategory,
  materialSubcategory = '',
  photo = null,
  weight,
  weightUnit = 'kg',
  condition,
  location,
  notes = '',
  identificationMethod = 'manual',
  confidenceScore = 1.0,
  collectorConfirmed = true,
  aiSuggestedCategory = null,
  aiSuggestedSubcategory = null,
  aiConfidenceScore = null,
  estimatedPrice = null,
  estimatedLotValueMin = null,
  estimatedLotValueMax = null
}) => {
  if (!collectorId) {
    throw new Error('collectorId is required');
  }
  if (!materialType) {
    throw new Error('materialType is required');
  }
  const numWeight = parseFloat(weight);
  if (isNaN(numWeight) || numWeight <= 0) {
    throw new Error('Valid weight greater than 0 is required');
  }
  if (!condition) {
    throw new Error('condition is required');
  }
  if (!location || (typeof location === 'string' && !location.trim()) || (typeof location === 'object' && !location.area?.trim())) {
    throw new Error('Location is required');
  }

  const allLots = getScrapLots();
  const newLotId = generateNextLotId(allLots);

  // Normalize location format
  const normalizedLocation = typeof location === 'string'
    ? { area: location.trim(), city: '', state: '' }
    : {
        area: location?.area?.trim() || 'Gunupur',
        city: location?.city?.trim() || '',
        state: location?.state?.trim() || ''
      };

  // Derive material category and subcategory if not provided
  const categoryMatch = MATERIAL_OPTIONS.find((m) => m.type === materialType);
  const derivedCategory = materialCategory || categoryMatch?.category || 'Electronic Components';
  const derivedSubcategory = materialSubcategory || categoryMatch?.defaultSubcategory || materialType;

  // Resolve numeric estimated price if passed as number or estimate object
  let numericEstimatedPrice = null;
  let lotValueMin = null;
  let lotValueMax = null;

  if (typeof estimatedPrice === 'number' && !isNaN(estimatedPrice)) {
    numericEstimatedPrice = estimatedPrice;
  } else if (estimatedPrice && typeof estimatedPrice === 'object') {
    numericEstimatedPrice = estimatedPrice.midPrice ?? estimatedPrice.estimatedPrice ?? null;
    lotValueMin = estimatedPrice.estimatedLotValueMin ?? null;
    lotValueMax = estimatedPrice.estimatedLotValueMax ?? null;
  }

  if (estimatedLotValueMin !== null && estimatedLotValueMin !== undefined) {
    lotValueMin = parseFloat(estimatedLotValueMin);
  }
  if (estimatedLotValueMax !== null && estimatedLotValueMax !== undefined) {
    lotValueMax = parseFloat(estimatedLotValueMax);
  }

  // Create linked SIH Material Dataset Record first to ensure synchronization
  const materialRecord = createMaterialRecord({
    lotId: newLotId,
    collectorId,
    materialCategory: materialType, // specific material type (e.g. PCB)
    materialSubcategory: derivedSubcategory,
    materialDescription: notes?.trim() || `${materialType} (${derivedCategory}) scrap lot`,
    image: photo,
    approximateWeight: numWeight,
    weightUnit: weightUnit === 'g' ? 'g' : 'kg',
    condition: condition.toLowerCase(),
    sourceType: 'Informal Collector',
    estimatedValue: numericEstimatedPrice,
    identificationMethod,
    confidenceScore: confidenceScore !== undefined ? parseFloat(confidenceScore) : 1.0,
    collectorConfirmed: Boolean(collectorConfirmed),
    aiSuggestedCategory: aiSuggestedCategory || null,
    aiSuggestedSubcategory: aiSuggestedSubcategory || null,
    aiConfidenceScore: aiConfidenceScore !== null && aiConfidenceScore !== undefined ? parseFloat(aiConfidenceScore) : null,
    createdAt: new Date().toISOString()
  });

  // Create linked SIH Price Dataset record if estimated price exists
  let priceRecord = null;
  if (numericEstimatedPrice !== null && numericEstimatedPrice !== undefined) {
    try {
      priceRecord = createPriceRecord({
        lotId: newLotId,
        materialId: materialRecord.materialId,
        materialCategory: derivedCategory,
        materialSubcategory: derivedSubcategory,
        location: normalizedLocation,
        estimatedPrice: numericEstimatedPrice,
        buyingPrice: null,
        quotedPrice: null,
        sellingPrice: null,
        sourceType: 'platform_estimate',
        recordedAt: materialRecord.createdAt
      });
    } catch (err) {
      console.warn('Failed to create linked price record:', err);
    }
  }

  const newLot = {
    id: newLotId,
    materialId: materialRecord.materialId,
    priceId: priceRecord ? priceRecord.priceId : null,
    collectorId,
    materialType,
    materialCategory: derivedCategory,
    materialSubcategory: derivedSubcategory,
    photo,
    weight: numWeight,
    weightUnit: weightUnit === 'g' ? 'g' : 'kg',
    condition: condition.toLowerCase(),
    location: normalizedLocation,
    notes: notes?.trim() || '',
    status: 'Created',
    offerStatus: 'none',
    transactionStatus: 'none',
    createdAt: materialRecord.createdAt,
    identificationMethod,
    confidenceScore: materialRecord.confidenceScore,
    collectorConfirmed: materialRecord.collectorConfirmed,
    aiSuggestedCategory: materialRecord.aiSuggestedCategory,
    aiSuggestedSubcategory: materialRecord.aiSuggestedSubcategory,
    aiConfidenceScore: materialRecord.aiConfidenceScore,
    estimatedPrice: numericEstimatedPrice,
    estimatedLotValueMin: lotValueMin,
    estimatedLotValueMax: lotValueMax
  };

  const updatedLots = [newLot, ...allLots];

  try {
    localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(updatedLots));
  } catch (e) {
    console.error('Error saving new scrap lot to localStorage:', e);
    // If quota exceeded due to large photo base64, save with stripped photo to ensure lot creation succeeds
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      const fallbackLot = { ...newLot, photo: null };
      const fallbackList = [fallbackLot, ...allLots];
      localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(fallbackList));
      return fallbackLot;
    }
    throw e;
  }

  return newLot;
};

/**
 * Reset scrap lots, material dataset, and price dataset to initial seed state
 */
export const resetScrapLots = () => {
  localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(SEED_LOTS));
  resetMaterialDataset();
  resetPriceDataset();
  return SEED_LOTS;
};

/**
 * Update the offerStatus of a scrap lot (Module 8)
 * Allowed: 'none', 'offers_available', 'offer_selected'
 * Does NOT mark lot as sold, paid, or completed.
 */
export const updateScrapLotOfferStatus = (lotId, newOfferStatus) => {
  const allowed = ['none', 'offers_available', 'offer_selected'];
  if (!allowed.includes(newOfferStatus)) {
    throw new Error(`Invalid offerStatus: ${newOfferStatus}. Allowed: ${allowed.join(', ')}`);
  }

  const allLots = getAllScrapLots();
  const index = allLots.findIndex((l) => l.id === lotId);
  if (index === -1) {
    return null;
  }

  allLots[index] = {
    ...allLots[index],
    offerStatus: newOfferStatus
  };

  try {
    localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(allLots));
  } catch (e) {
    console.error('Error updating scrap lot offerStatus:', e);
  }

  return allLots[index];
};

/**
 * Update the transactionStatus of a scrap lot (Module 9)
 * Allowed: 'none', 'created', 'handover_pending', 'payment_pending', 'completed', 'cancelled'
 * Does NOT remove offerStatus.
 */
export const updateScrapLotTransactionStatus = (lotId, newTransactionStatus) => {
  const allowed = ['none', 'created', 'handover_pending', 'handover_confirmed', 'payment_pending', 'payment_recorded', 'completed', 'cancelled'];
  if (!allowed.includes(newTransactionStatus)) {
    throw new Error(`Invalid transactionStatus: ${newTransactionStatus}`);
  }

  const allLots = getAllScrapLots();
  const index = allLots.findIndex((l) => l.id === lotId);
  if (index === -1) {
    return null;
  }

  allLots[index] = {
    ...allLots[index],
    transactionStatus: newTransactionStatus
  };

  try {
    localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(allLots));
  } catch (e) {
    console.error('Error updating scrap lot transactionStatus:', e);
  }

  return allLots[index];
};

