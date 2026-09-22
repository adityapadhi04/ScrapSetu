/**
 * ScrapSetu — Scrap Lot Data Service (Module 3 & Module 4)
 * Centralized service managing scrap lot data, creation, ID generation,
 * collector-specific filtering, and linkage to SIH Material Dataset records.
 */

import { MATERIAL_CATALOG, MATERIAL_OPTIONS as CATALOG_MATERIAL_OPTIONS } from '../data/materialCatalog.js';
import { createMaterialRecord, resetMaterialDataset } from './materialDatasetService.js';
import { createPriceRecord, resetPriceDataset } from './priceDatasetService.js';
import { enqueue } from './syncQueueService.js';
import { emitDataChange } from './realtimeSync.js';
import { evaluateReusePotential } from './reuseIntelligenceService.js';

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
    items: [
      { name: 'Computer PCB', category: 'PCB', subcategory: 'Computer PCB', weight: 1.4, condition: 'fair' },
      { name: 'Motherboard Fragments', category: 'PCB', subcategory: 'Motherboard', weight: 1.0, condition: 'fair' }
    ],
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
    sourceType: 'demo_seed',
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
    items: [
      { name: 'Copper Cable', category: 'Cable', subcategory: 'Copper Cable', weight: 5.0, condition: 'good' }
    ],
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
    sourceType: 'demo_seed',
    createdAt: '2026-09-19T08:30:00.000Z',
    identificationMethod: 'manual',
    confidenceScore: 1.0,
    collectorConfirmed: true,
    estimatedPrice: 660,
    estimatedLotValueMin: 3200,
    estimatedLotValueMax: 3400,
    offerStatus: 'offers_available',
    transactionStatus: 'created'
  },
  {
    id: 'LOT-0003',
    materialId: 'MAT-0003',
    priceId: 'PRICE-0006',
    collectorId: 'usr-collector-01',
    materialType: 'Mixed E-Waste',
    materialCategory: 'Mixed E-Waste',
    materialSubcategory: 'Assorted Salvage & Scrap',
    items: [
      { name: 'Mobile Phone', category: 'Mobile Phone', subcategory: 'Smartphone Assembly', weight: 0.4, condition: 'fair' },
      { name: 'PCB', category: 'PCB', subcategory: 'Computer PCB', weight: 0.8, condition: 'fair' },
      { name: 'Cable', category: 'Cable', subcategory: 'Copper Cable', weight: 0.7, condition: 'good' },
      { name: 'Battery', category: 'Battery', subcategory: 'Li-ion Battery', weight: 0.5, condition: 'fair' }
    ],
    photo: null,
    weight: 2.4,
    weightUnit: 'kg',
    condition: 'fair',
    location: {
      area: 'Gunupur',
      city: 'Rayagada',
      state: 'Odisha'
    },
    notes: 'Mixed household electronics collection with salvageable parts and recyclable cables/batteries',
    status: 'Created',
    sourceType: 'demo_seed',
    createdAt: '2026-09-21T09:00:00.000Z',
    identificationMethod: 'demo_ai',
    confidenceScore: 0.94,
    collectorConfirmed: true,
    estimatedPrice: 420,
    estimatedLotValueMin: 950,
    estimatedLotValueMax: 1150,
    offerStatus: 'none',
    transactionStatus: 'none'
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
 * Evaluates a complete scrap lot's reuse/recycle classification based on all its constituent items.
 * Implements ScrapSetu's Reuse Before Recycle intelligence without splitting the lot.
 *
 * @param {Object} lot
 * @returns {{ pathway: 'reuse'|'recycle'|'both', isEligibleForRepair: boolean, isEligibleForRecycler: boolean, label: string, reasons: string[] }}
 */
export const getLotReuseEligibility = (lot) => {
  if (!lot) {
    return {
      pathway: 'both',
      isEligibleForRepair: true,
      isEligibleForRecycler: true,
      label: 'Both (Reuse & Recycle)',
      reasons: ['Eligible for marketplace evaluation']
    };
  }

  // Extract items list if available; fallback to primary material category
  const items = Array.isArray(lot.items) && lot.items.length > 0
    ? lot.items
    : [{
        name: lot.materialType || lot.materialCategory || 'E-waste',
        category: lot.materialCategory || lot.materialType || 'E-waste',
        subcategory: lot.materialSubcategory || '',
        condition: lot.condition || 'fair',
        weight: lot.weight || 0
      }];

  let hasReuse = false;
  let hasRecycle = false;
  const reasons = [];

  for (const it of items) {
    const itCat = it.category || it.name || lot.materialType;
    const itCond = it.condition || lot.condition || 'fair';
    const itWeight = typeof it.weight === 'number' ? it.weight : (parseFloat(it.weight) || 0);

    const evalRes = evaluateReusePotential({
      materialCategory: itCat,
      materialSubcategory: it.subcategory || '',
      condition: itCond,
      weight: itWeight
    });

    if (evalRes.pathway === 'reuse' || evalRes.pathway === 'both') {
      hasReuse = true;
      if (evalRes.reason && !reasons.includes(evalRes.reason)) {
        reasons.push(evalRes.reason);
      }
    }
    if (evalRes.pathway === 'recycle' || evalRes.pathway === 'both') {
      hasRecycle = true;
      if (evalRes.reason && !reasons.includes(evalRes.reason)) {
        reasons.push(evalRes.reason);
      }
    }
  }

  let pathway = 'both';
  if (hasReuse && !hasRecycle) {
    pathway = 'reuse';
  } else if (!hasReuse && hasRecycle) {
    pathway = 'recycle';
  } else {
    pathway = 'both';
  }

  return {
    pathway,
    isEligibleForRepair: pathway === 'reuse' || pathway === 'both',
    isEligibleForRecycler: pathway === 'recycle' || pathway === 'both',
    label: pathway === 'reuse' ? 'Reuse / Salvage' : pathway === 'recycle' ? 'Recycling' : 'Both (Reuse & Recycle)',
    reasons: reasons.length > 0 ? reasons : ['Classified by ScrapSetu circular reuse engine']
  };
};

/**
 * Create a new scrap lot, atomically create linked Material Dataset record, and persist in localStorage
 */
export const createScrapLot = ({
  collectorId,
  materialType,
  materialCategory,
  materialSubcategory = '',
  items = null,
  photo = null,
  weight,
  weightUnit = 'kg',
  condition,
  location,
  notes = '',
  sourceType = 'platform_user',
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

  // Format constituent items for whole-lot representation
  const formattedItems = Array.isArray(items) && items.length > 0
    ? items.map((it) => ({
        id: it.id || it.itemId || undefined,
        name: it.name || it.category || materialType,
        category: it.category || materialType,
        subcategory: it.subcategory || derivedSubcategory,
        weight: typeof it.weight === 'number' ? it.weight : (parseFloat(it.weight) || 0),
        condition: (it.condition || condition).toLowerCase()
      }))
    : [{
        name: materialType,
        category: derivedCategory,
        subcategory: derivedSubcategory,
        weight: numWeight,
        condition: condition.toLowerCase()
      }];

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

  // Determine reuse/recycling eligibility for the complete lot
  const reuseClassification = getLotReuseEligibility({
    items: formattedItems,
    materialType,
    materialCategory: derivedCategory,
    materialSubcategory: derivedSubcategory,
    condition,
    weight: numWeight
  });

  const newLot = {
    id: newLotId,
    materialId: materialRecord.materialId,
    priceId: priceRecord ? priceRecord.priceId : null,
    collectorId,
    materialType,
    materialCategory: derivedCategory,
    materialSubcategory: derivedSubcategory,
    items: formattedItems,
    photo,
    weight: numWeight,
    weightUnit: weightUnit === 'g' ? 'g' : 'kg',
    condition: condition.toLowerCase(),
    location: normalizedLocation,
    notes: notes?.trim() || '',
    status: 'Created',
    offerStatus: 'none',
    transactionStatus: 'none',
    sourceType: sourceType || 'platform_user',
    createdAt: materialRecord.createdAt,
    identificationMethod,
    confidenceScore: materialRecord.confidenceScore,
    collectorConfirmed: materialRecord.collectorConfirmed,
    aiSuggestedCategory: materialRecord.aiSuggestedCategory,
    aiSuggestedSubcategory: materialRecord.aiSuggestedSubcategory,
    aiConfidenceScore: materialRecord.aiConfidenceScore,
    estimatedPrice: numericEstimatedPrice,
    estimatedLotValueMin: lotValueMin,
    estimatedLotValueMax: lotValueMax,
    reuseClassification
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

  // Queue for sync — only platform_generated records
  // Seed data (demo_seed) must never enter the sync queue
  try {
    enqueue({
      operation: 'create',
      entityType: 'scrap_lot',
      entityId: newLot.id,
      payload: { id: newLot.id, materialType: newLot.materialType, weight: newLot.weight, status: newLot.status },
      userId: collectorId,
    });
  } catch (qErr) {
    // Non-fatal: local save succeeded, queue failure must not prevent lot creation
    console.warn('[scrapLotService] Could not enqueue sync operation:', qErr.message);
  }

  // Real-time synchronization event
  try {
    emitDataChange('LOT_CREATED', newLot);
  } catch (_) {}

  return newLot;
};

/**
 * Reset scrap lots, material dataset, and price dataset to initial seed state
 */
export const resetScrapLots = () => {
  localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(SEED_LOTS));
  resetMaterialDataset();
  resetPriceDataset();
  try {
    emitDataChange('LOTS_RESET', SEED_LOTS);
  } catch (_) {}
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
    emitDataChange('LOT_OFFER_STATUS_UPDATED', allLots[index]);
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
    emitDataChange('LOT_TRANSACTION_STATUS_UPDATED', allLots[index]);
  } catch (e) {
    console.error('Error updating scrap lot transactionStatus:', e);
  }

  return allLots[index];
};

