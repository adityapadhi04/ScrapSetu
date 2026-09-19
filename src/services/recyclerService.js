/**
 * ScrapSetu — Authorized Recycler Dataset Service (Module 7)
 * 
 * Manages formal recycling facility dataset records in localStorage,
 * provides deterministic query and filtering capabilities, schema validation,
 * and sequential ID generation (`REC-xxxx`).
 * 
 * IMPORTANT ARCHITECTURAL & ETHICAL RULES:
 * 1. An Authorized Recycler is NOT a Repair Shop.
 *    - Recyclers handle formal material recovery, industrial processing, and hazardous neutralization.
 * 2. All seed records are marked `sourceType: "demo_seed"`.
 *    - Never present prototype entries as legally accredited government facilities.
 */

import { DEMO_RECYCLERS } from '../data/recyclerSeedData.js';

export const STORAGE_KEY_RECYCLERS = 'scrapsetu_recycler_dataset';

export const VALID_RECYCLER_STATUSES = ['active', 'inactive', 'pending_verification'];
export const VALID_SOURCE_TYPES = ['demo_seed', 'registered', 'platform_added'];

/**
 * Generate sequential zero-padded IDs (e.g. REC-0001, REC-0002)
 */
export function generateNextId(prefix, existingIds) {
  let maxNum = 0;
  for (const id of existingIds) {
    if (typeof id === 'string' && id.startsWith(`${prefix}-`)) {
      const numPart = parseInt(id.replace(`${prefix}-`, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Validates an authorized recycler dataset record
 */
export function validateRecyclerRecord(data) {
  const errors = [];

  if (!data.businessName || typeof data.businessName !== 'string' || data.businessName.trim() === '') {
    errors.push('Business name is required.');
  }

  if (!data.address) {
    errors.push('Address object is required.');
  } else if (typeof data.address === 'object') {
    if (!data.address.city || typeof data.address.city !== 'string') {
      errors.push('City is required in address.');
    }
  }

  if (!Array.isArray(data.acceptedMaterials) || data.acceptedMaterials.length === 0) {
    errors.push('acceptedMaterials must be a non-empty array of strings.');
  }

  if (data.status && !VALID_RECYCLER_STATUSES.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_RECYCLER_STATUSES.join(', ')}`);
  }

  if (data.sourceType && !VALID_SOURCE_TYPES.includes(data.sourceType)) {
    errors.push(`Invalid sourceType. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  if (data.minimumWeightKg !== undefined) {
    const minWt = Number(data.minimumWeightKg);
    if (isNaN(minWt) || minWt < 0) {
      errors.push('minimumWeightKg must be a non-negative number.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function getStorage() {
  if (typeof localStorage !== 'undefined') return localStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

/**
 * Initializes recycler dataset in localStorage with prototype seed data if not present.
 */
export function initializeRecyclers() {
  const storage = getStorage();
  if (!storage) {
    return DEMO_RECYCLERS;
  }
  try {
    const existing = storage.getItem(STORAGE_KEY_RECYCLERS);
    if (!existing) {
      storage.setItem(STORAGE_KEY_RECYCLERS, JSON.stringify(DEMO_RECYCLERS));
      return DEMO_RECYCLERS;
    }
    return JSON.parse(existing);
  } catch (err) {
    console.error('Failed to initialize recycler dataset:', err);
    return DEMO_RECYCLERS;
  }
}

/**
 * Resets recycler dataset back to initial demo seed.
 */
export function resetRecyclerDataset() {
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY_RECYCLERS, JSON.stringify(DEMO_RECYCLERS));
  }
  return DEMO_RECYCLERS;
}

/**
 * Retrieves all recyclers matching optional query filters
 */
export function getRecyclers(filterOptions = {}) {
  const all = initializeRecyclers();

  return all.filter((rec) => {
    // Status filter
    if (filterOptions.status && filterOptions.status !== 'ALL') {
      if (rec.status !== filterOptions.status) return false;
    }

    // Material filter
    if (filterOptions.material && filterOptions.material !== 'ALL') {
      const searchMat = String(filterOptions.material).toLowerCase();
      const hasMat = (rec.acceptedMaterials || []).some((m) =>
        String(m).toLowerCase().includes(searchMat) || searchMat.includes(String(m).toLowerCase())
      );
      if (!hasMat) return false;
    }

    // City / Area / Location filter
    if (filterOptions.city && filterOptions.city !== 'ALL') {
      const cityLower = String(filterOptions.city).toLowerCase();
      const recCity = (rec.address?.city || '').toLowerCase();
      const recArea = (rec.address?.area || '').toLowerCase();
      const inOpAreas = (rec.operatingAreas || []).some((op) => String(op).toLowerCase().includes(cityLower));
      if (!recCity.includes(cityLower) && !recArea.includes(cityLower) && !inOpAreas) {
        return false;
      }
    }

    // Pickup filter
    if (filterOptions.pickupOnly) {
      if (!rec.pickupAvailable) return false;
    }

    // Search query filter
    if (filterOptions.search) {
      const q = String(filterOptions.search).toLowerCase().trim();
      const nameMatch = (rec.businessName || '').toLowerCase().includes(q);
      const contactMatch = (rec.contactName || '').toLowerCase().includes(q);
      const cityMatch = (rec.address?.city || '').toLowerCase().includes(q);
      const areaMatch = (rec.address?.area || '').toLowerCase().includes(q);
      const authMatch = (rec.authorizationNumber || '').toLowerCase().includes(q);
      const idMatch = (rec.recyclerId || '').toLowerCase().includes(q);
      if (!nameMatch && !contactMatch && !cityMatch && !areaMatch && !authMatch && !idMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returns all currently active authorized recyclers
 */
export function getActiveRecyclers() {
  return getRecyclers({ status: 'active' });
}

/**
 * Retrieves a single recycler by ID
 */
export function getRecyclerById(recyclerId) {
  const all = initializeRecyclers();
  return all.find((r) => r.recyclerId === recyclerId) || null;
}

/**
 * Convenience filter for materials
 */
export function filterByMaterial(material) {
  return getRecyclers({ material, status: 'active' });
}

/**
 * Convenience filter for location
 */
export function filterByLocation(location) {
  return getRecyclers({ city: location, status: 'active' });
}

/**
 * Convenience filter for pickup availability
 */
export function filterByPickup(pickupOnly = true) {
  return getRecyclers({ pickupOnly, status: 'active' });
}

/**
 * Creates and registers a new authorized recycler record in localStorage
 */
export function createRecycler(data) {
  const validation = validateRecyclerRecord(data);
  if (!validation.isValid) {
    throw new Error(`Recycler record validation failed: ${validation.errors.join(' ')}`);
  }

  const all = initializeRecyclers();
  const existingIds = all.map((r) => r.recyclerId);
  const recyclerId = data.recyclerId || generateNextId('REC', existingIds);

  const now = new Date().toISOString();
  const newRecycler = {
    recyclerId,
    businessName: data.businessName.trim(),
    contactName: data.contactName || '',
    phone: data.phone || '',
    email: data.email || '',
    address: {
      area: data.address?.area || '',
      city: data.address?.city || '',
      state: data.address?.state || 'Odisha',
      pincode: data.address?.pincode || ''
    },
    acceptedMaterials: [...data.acceptedMaterials],
    services: Array.isArray(data.services) ? [...data.services] : ['Collection', 'Drop-off'],
    pickupAvailable: data.pickupAvailable !== undefined ? !!data.pickupAvailable : true,
    operatingAreas: Array.isArray(data.operatingAreas) ? [...data.operatingAreas] : [data.address?.city || 'Gunupur'],
    minimumWeightKg: Number(data.minimumWeightKg) || 1,
    paymentMethods: Array.isArray(data.paymentMethods) ? [...data.paymentMethods] : ['Cash', 'UPI'],
    verificationStatus: data.verificationStatus || 'demo_verified',
    authorizationType: data.authorizationType || 'Demo Authorization Record',
    authorizationNumber: data.authorizationNumber || `DEMO-AUTH-${recyclerId.replace('REC-', '')}`,
    status: data.status || 'active',
    sourceType: data.sourceType || 'platform_added',
    createdAt: data.createdAt || now,
    updatedAt: now,
    datasetVersion: '1.0'
  };

  const updated = [...all, newRecycler];
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY_RECYCLERS, JSON.stringify(updated));
  }

  return newRecycler;
}

/**
 * Provides dataset statistics for administrative monitoring and governance
 */
export function getRecyclerDatasetStats() {
  const all = initializeRecyclers();
  const activeCount = all.filter((r) => r.status === 'active').length;
  const pickupCount = all.filter((r) => r.pickupAvailable && r.status === 'active').length;

  const cities = new Set();
  const materials = new Set();

  all.forEach((r) => {
    if (r.address?.city) cities.add(r.address.city);
    (r.operatingAreas || []).forEach((area) => cities.add(area));
    (r.acceptedMaterials || []).forEach((m) => materials.add(m));
  });

  return {
    totalRecords: all.length,
    activeRecords: activeCount,
    pickupAvailableCount: pickupCount,
    citiesCovered: cities.size,
    materialsSupported: materials.size,
    datasetSource: 'Prototype Demo Dataset (SIH26229)'
  };
}
