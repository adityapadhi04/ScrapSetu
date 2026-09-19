/**
 * ScrapSetu — Material Dataset Service (Module 4)
 * 
 * Implements the structured SIH Material Dataset layer.
 * Generates, validates, persists, and links material records created via
 * collector application activity.
 */

export const STORAGE_KEY_MATERIAL_DATASET = 'scrapsetu_material_dataset';

/**
 * SIH Dataset Provenance & Metadata specification
 */
export const DATASET_METADATA = {
  datasetName: 'ScrapSetu Material Dataset',
  datasetVersion: '1.0',
  source: 'Platform-generated collector submissions',
  collectionMethod: 'Scrap lot creation workflow',
  limitations: [
    'Prototype dataset',
    'Limited sample size',
    'AI predictions are demo-mode until a trained model is connected'
  ]
};

/**
 * Initial seed records corresponding to initial SEED_LOTS (LOT-0001, LOT-0002)
 */
export const SEED_MATERIAL_RECORDS = [
  {
    materialId: 'MAT-0001',
    lotId: 'LOT-0001',
    collectorId: 'usr-collector-01',
    materialCategory: 'PCB',
    materialSubcategory: 'Computer PCB',
    materialDescription: 'Printed Circuit Board with soldered microchips and copper traces',
    image: null,
    approximateWeight: 2.4,
    weightUnit: 'kg',
    condition: 'fair',
    sourceType: 'Informal Collector',
    estimatedValue: null,
    identificationMethod: 'manual',
    confidenceScore: 1.0,
    collectorConfirmed: true,
    aiSuggestedCategory: null,
    aiSuggestedSubcategory: null,
    aiConfidenceScore: null,
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    materialId: 'MAT-0002',
    lotId: 'LOT-0002',
    collectorId: 'usr-collector-01',
    materialCategory: 'Cable',
    materialSubcategory: 'Copper Cable',
    materialDescription: 'Stripped high-purity copper electrical wiring',
    image: null,
    approximateWeight: 5.0,
    weightUnit: 'kg',
    condition: 'good',
    sourceType: 'Informal Collector',
    estimatedValue: null,
    identificationMethod: 'manual',
    confidenceScore: 1.0,
    collectorConfirmed: true,
    aiSuggestedCategory: null,
    aiSuggestedSubcategory: null,
    aiConfidenceScore: null,
    createdAt: '2026-09-19T08:30:00.000Z',
    updatedAt: '2026-09-19T08:30:00.000Z',
    datasetVersion: '1.0'
  }
];

/**
 * Retrieve metadata describing the dataset provenance, quality, and limitations
 */
export const getDatasetMetadata = () => {
  return { ...DATASET_METADATA };
};

/**
 * Generate next sequential Material ID (MAT-0001, MAT-0002, ...)
 */
export const generateNextMaterialId = (existingRecords = []) => {
  let highestNum = 0;
  for (const record of existingRecords) {
    if (record?.materialId && typeof record.materialId === 'string') {
      const match = record.materialId.match(/^MAT-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    }
  }
  const nextNum = highestNum + 1;
  return `MAT-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Validate material dataset record fields against SIH quality criteria
 */
export const validateMaterialRecord = (record, existingRecords = []) => {
  if (!record || typeof record !== 'object') {
    throw new Error('Record object is required');
  }

  // Required field checks
  if (!record.lotId || typeof record.lotId !== 'string' || !record.lotId.trim()) {
    throw new Error('lotId is required and must be a non-empty string');
  }
  if (!record.collectorId || typeof record.collectorId !== 'string' || !record.collectorId.trim()) {
    throw new Error('collectorId is required and must be a non-empty string');
  }
  if (!record.materialCategory || typeof record.materialCategory !== 'string' || !record.materialCategory.trim()) {
    throw new Error('materialCategory is required and must be a non-empty string');
  }

  // Weight validation
  const numWeight = parseFloat(record.approximateWeight);
  if (isNaN(numWeight) || numWeight <= 0) {
    throw new Error('approximateWeight must be a valid number greater than 0');
  }

  // Condition validation
  if (!record.condition || typeof record.condition !== 'string' || !record.condition.trim()) {
    throw new Error('condition is required');
  }

  // Method validation
  const validMethods = ['demo_ai', 'manual', 'ml_model'];
  if (record.identificationMethod && !validMethods.includes(record.identificationMethod)) {
    throw new Error(`identificationMethod must be one of: ${validMethods.join(', ')}`);
  }

  // Confidence score range check (0.0 to 1.0)
  if (record.confidenceScore !== null && record.confidenceScore !== undefined) {
    const score = parseFloat(record.confidenceScore);
    if (isNaN(score) || score < 0 || score > 1) {
      throw new Error('confidenceScore must be a number between 0 and 1');
    }
  }

  // AI confidence score range check if present
  if (record.aiConfidenceScore !== null && record.aiConfidenceScore !== undefined) {
    const aiScore = parseFloat(record.aiConfidenceScore);
    if (isNaN(aiScore) || aiScore < 0 || aiScore > 1) {
      throw new Error('aiConfidenceScore must be a number between 0 and 1');
    }
  }

  // CreatedAt check
  if (record.createdAt && isNaN(Date.parse(record.createdAt))) {
    throw new Error('createdAt must be a valid ISO date string');
  }

  // Duplicate Lot ID protection
  if (existingRecords && existingRecords.length > 0) {
    const existing = existingRecords.find(
      (r) => r.lotId === record.lotId && r.materialId !== record.materialId
    );
    if (existing) {
      throw new Error(`A material record already exists for lotId: ${record.lotId}`);
    }
  }

  return true;
};

/**
 * Retrieve all material records from localStorage (seeds initial records if empty)
 */
export const getMaterialRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MATERIAL_DATASET);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MATERIAL_DATASET, JSON.stringify(SEED_MATERIAL_RECORDS));
      return SEED_MATERIAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_MATERIAL_RECORDS;
  } catch (e) {
    console.error('Error reading material dataset from storage:', e);
    return SEED_MATERIAL_RECORDS;
  }
};

/**
 * Find material record by Material ID (e.g. MAT-0001)
 */
export const getMaterialRecordById = (materialId) => {
  if (!materialId) return null;
  const records = getMaterialRecords();
  return records.find((r) => r.materialId === materialId) || null;
};

/**
 * Find material record by linked Scrap Lot ID (e.g. LOT-0001)
 */
export const getMaterialRecordByLotId = (lotId) => {
  if (!lotId) return null;
  const records = getMaterialRecords();
  return records.find((r) => r.lotId === lotId) || null;
};

/**
 * Retrieve all material records submitted by a specific collector
 */
export const getMaterialRecordsByCollector = (collectorId) => {
  if (!collectorId) return [];
  const records = getMaterialRecords();
  return records.filter((r) => r.collectorId === collectorId);
};

/**
 * Create a new validated Material Dataset record and persist in localStorage
 */
export const createMaterialRecord = ({
  lotId,
  collectorId,
  materialCategory,
  materialSubcategory = '',
  materialDescription = '',
  image = null,
  approximateWeight,
  weightUnit = 'kg',
  condition,
  sourceType = 'Informal Collector',
  identificationMethod = 'manual',
  confidenceScore = 1.0,
  collectorConfirmed = true,
  aiSuggestedCategory = null,
  aiSuggestedSubcategory = null,
  aiConfidenceScore = null,
  createdAt = new Date().toISOString()
}) => {
  const existingRecords = getMaterialRecords();

  const numWeight = parseFloat(approximateWeight);

  const candidateRecord = {
    materialId: generateNextMaterialId(existingRecords),
    lotId,
    collectorId,
    materialCategory,
    materialSubcategory: materialSubcategory || materialCategory,
    materialDescription: materialDescription || `${materialCategory} scrap lot`,
    image,
    approximateWeight: numWeight,
    weightUnit: weightUnit === 'g' ? 'g' : 'kg',
    condition: condition ? condition.toLowerCase() : 'fair',
    sourceType,
    estimatedValue: null, // Explicitly null for Module 4 (Module 5 will implement pricing)
    identificationMethod,
    confidenceScore: confidenceScore !== undefined ? parseFloat(confidenceScore) : 1.0,
    collectorConfirmed: Boolean(collectorConfirmed),
    aiSuggestedCategory: aiSuggestedCategory || null,
    aiSuggestedSubcategory: aiSuggestedSubcategory || null,
    aiConfidenceScore: aiConfidenceScore !== null && aiConfidenceScore !== undefined ? parseFloat(aiConfidenceScore) : null,
    createdAt,
    updatedAt: createdAt,
    datasetVersion: '1.0'
  };

  // Perform validation
  validateMaterialRecord(candidateRecord, existingRecords);

  const updated = [candidateRecord, ...existingRecords];

  try {
    localStorage.setItem(STORAGE_KEY_MATERIAL_DATASET, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save material record to localStorage:', e);
    // If storage quota exceeded due to base64 image, strip image to guarantee dataset integrity
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      const fallbackRecord = { ...candidateRecord, image: null };
      const fallbackList = [fallbackRecord, ...existingRecords];
      localStorage.setItem(STORAGE_KEY_MATERIAL_DATASET, JSON.stringify(fallbackList));
      return fallbackRecord;
    }
    throw e;
  }

  return candidateRecord;
};

/**
 * Update collector confirmation or label correction for human-in-the-loop tracking
 */
export const updateMaterialConfirmation = (materialId, updates = {}) => {
  const existingRecords = getMaterialRecords();
  const index = existingRecords.findIndex((r) => r.materialId === materialId);
  if (index === -1) {
    throw new Error(`Record with materialId ${materialId} not found`);
  }

  const record = existingRecords[index];
  const updatedRecord = {
    ...record,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  validateMaterialRecord(updatedRecord, existingRecords);

  existingRecords[index] = updatedRecord;
  localStorage.setItem(STORAGE_KEY_MATERIAL_DATASET, JSON.stringify(existingRecords));
  return updatedRecord;
};

/**
 * Calculate dataset metrics and distribution for Admin inspection
 */
export const getDatasetStats = () => {
  const records = getMaterialRecords();
  const totalRecords = records.length;
  const aiAssistedCount = records.filter((r) => r.identificationMethod === 'demo_ai' || r.identificationMethod === 'ml_model').length;
  const manualCount = records.filter((r) => r.identificationMethod === 'manual').length;
  const confirmedCount = records.filter((r) => r.collectorConfirmed === true).length;

  const categoryBreakdown = {};
  for (const r of records) {
    const cat = r.materialCategory || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  }

  return {
    totalRecords,
    aiAssistedCount,
    manualCount,
    confirmedCount,
    confirmedRate: totalRecords > 0 ? Math.round((confirmedCount / totalRecords) * 100) : 0,
    categoryBreakdown,
    datasetVersion: DATASET_METADATA.datasetVersion
  };
};

/**
 * Reset material dataset back to initial seed state (used in testing and demo reset)
 */
export const resetMaterialDataset = () => {
  localStorage.setItem(STORAGE_KEY_MATERIAL_DATASET, JSON.stringify(SEED_MATERIAL_RECORDS));
  return [...SEED_MATERIAL_RECORDS];
};
