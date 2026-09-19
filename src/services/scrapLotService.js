/**
 * ScrapSetu — Scrap Lot Data Service (Module 3)
 * Centralized service managing scrap lot data, creation, ID generation,
 * and collector-specific filtering.
 */

export const STORAGE_KEY_SCRAP_LOTS = 'scrapsetu_scrap_lots';

export const MATERIAL_OPTIONS = [
  {
    type: 'PCB',
    category: 'Electronic Components',
    nameKey: 'materialPcb',
    categoryKey: 'categoryElectronicComponents',
    fallbackName: 'PCB',
    icon: '💻',
    color: '#15803d',
    bg: '#dcfce7'
  },
  {
    type: 'Cable',
    category: 'Cables & Wires',
    nameKey: 'materialCable',
    categoryKey: 'categoryCablesWires',
    fallbackName: 'Cable',
    icon: '🔌',
    color: '#0284c7',
    bg: '#e0f2fe'
  },
  {
    type: 'Battery',
    category: 'Batteries',
    nameKey: 'materialBattery',
    categoryKey: 'categoryBatteries',
    fallbackName: 'Battery',
    icon: '🔋',
    color: '#b91c1c',
    bg: '#fee2e2'
  },
  {
    type: 'Motor',
    category: 'Motors',
    nameKey: 'materialMotor',
    categoryKey: 'categoryMotors',
    fallbackName: 'Motor',
    icon: '⚡',
    color: '#d97706',
    bg: '#fef3c7'
  },
  {
    type: 'LCD / Display',
    category: 'Displays',
    nameKey: 'materialDisplay',
    categoryKey: 'categoryDisplays',
    fallbackName: 'LCD / Display',
    icon: '🖥️',
    color: '#4f46e5',
    bg: '#e0e7ff'
  },
  {
    type: 'Mobile Phone',
    category: 'Mobile Devices',
    nameKey: 'materialMobile',
    categoryKey: 'categoryMobileDevices',
    fallbackName: 'Mobile Phone',
    icon: '📱',
    color: '#059669',
    bg: '#d1fae5'
  },
  {
    type: 'Laptop / Computer',
    category: 'Computing Devices',
    nameKey: 'materialLaptop',
    categoryKey: 'categoryComputingDevices',
    fallbackName: 'Laptop / Computer',
    icon: '💻',
    color: '#7c3aed',
    bg: '#ede9fe'
  },
  {
    type: 'Other E-waste',
    category: 'Other E-waste',
    nameKey: 'materialOther',
    categoryKey: 'categoryOtherEwaste',
    fallbackName: 'Other E-waste',
    icon: '📦',
    color: '#475569',
    bg: '#f1f5f9'
  },
  {
    type: 'Not sure',
    category: 'Unclassified',
    nameKey: 'notSureIdentifyLater',
    categoryKey: 'categoryUnclassified',
    fallbackName: 'Not sure — identify later',
    icon: '❓',
    color: '#64748b',
    bg: '#f8fafc'
  }
];

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

// Initial seed lots for usr-collector-01
const SEED_LOTS = [
  {
    id: 'LOT-0001',
    collectorId: 'usr-collector-01',
    materialType: 'PCB',
    materialCategory: 'Electronic Components',
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
    identificationMethod: 'manual'
  },
  {
    id: 'LOT-0002',
    collectorId: 'usr-collector-01',
    materialType: 'Cable',
    materialCategory: 'Cables & Wires',
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
    identificationMethod: 'manual'
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
 * Create a new scrap lot and persist in localStorage
 */
export const createScrapLot = ({
  collectorId,
  materialType,
  materialCategory,
  photo = null,
  weight,
  weightUnit = 'kg',
  condition,
  location,
  notes = ''
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
  const newId = generateNextLotId(allLots);

  // Normalize location format
  const normalizedLocation = typeof location === 'string'
    ? { area: location.trim(), city: '', state: '' }
    : {
        area: location?.area?.trim() || 'Gunupur',
        city: location?.city?.trim() || '',
        state: location?.state?.trim() || ''
      };

  // Derive material category if not provided
  const categoryMatch = MATERIAL_OPTIONS.find((m) => m.type === materialType);
  const derivedCategory = materialCategory || categoryMatch?.category || 'Electronic Components';

  const newLot = {
    id: newId,
    collectorId,
    materialType,
    materialCategory: derivedCategory,
    photo,
    weight: numWeight,
    weightUnit: weightUnit === 'g' ? 'g' : 'kg',
    condition: condition.toLowerCase(),
    location: normalizedLocation,
    notes: notes?.trim() || '',
    status: 'Created',
    createdAt: new Date().toISOString(),
    identificationMethod: 'manual'
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
 * Reset scrap lots to initial seed state (useful for test resets)
 */
export const resetScrapLots = () => {
  localStorage.setItem(STORAGE_KEY_SCRAP_LOTS, JSON.stringify(SEED_LOTS));
  return SEED_LOTS;
};
