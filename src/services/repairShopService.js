/**
 * ScrapSetu — Repair Shop Service (Module 6)
 * 
 * Manages Repair Shop marketplace data, active component demand broadcasts ("What I Need"),
 * and collector interest/inquiry records.
 * 
 * IMPORTANT ARCHITECTURAL RULE:
 * A Repair Shop is NOT an Authorized Recycler.
 * Never label repair shops as recyclers or authorized recyclers.
 */

import { DEMO_REPAIR_SHOPS, DEMO_WANTED_SEED_ITEMS } from '../data/repairShopSeedData.js';

export const STORAGE_KEY_REPAIR_SHOPS = 'scrapsetu_repair_shops';
export const STORAGE_KEY_REPAIR_WANTED = 'scrapsetu_repair_wanted';
export const STORAGE_KEY_REPAIR_INQUIRIES = 'scrapsetu_repair_inquiries';

export const VALID_SHOP_STATUSES = ['active', 'inactive', 'pending_verification'];
export const VALID_SOURCE_TYPES = ['demo_seed', 'registered', 'platform_added'];

/**
 * Generate sequential IDs with zero-padding (e.g. SHOP-0001, WANT-0001, INQ-0001)
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
 * Validates a repair shop record
 */
export function validateRepairShopRecord(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Shop name is required.');
  }

  if (!data.location) {
    errors.push('Location is required.');
  } else if (typeof data.location === 'object') {
    if (!data.location.area || typeof data.location.area !== 'string') {
      errors.push('Location area is required.');
    }
  }

  if (!Array.isArray(data.acceptedMaterials) || data.acceptedMaterials.length === 0) {
    errors.push('acceptedMaterials must be a non-empty array of strings.');
  }

  if (data.status && !VALID_SHOP_STATUSES.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_SHOP_STATUSES.join(', ')}`);
  }

  if (data.sourceType && !VALID_SOURCE_TYPES.includes(data.sourceType)) {
    errors.push(`Invalid sourceType. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a wanted item record
 */
export function validateWantedItemRecord(data) {
  const errors = [];

  if (!data.repairShopId || typeof data.repairShopId !== 'string') {
    errors.push('repairShopId is required.');
  }

  if (!data.materialCategory || typeof data.materialCategory !== 'string' || data.materialCategory.trim() === '') {
    errors.push('materialCategory is required.');
  }

  const qty = Number(data.quantityNeeded);
  if (isNaN(qty) || qty <= 0) {
    errors.push('quantityNeeded must be a positive number.');
  }

  if (!data.preferredCondition || typeof data.preferredCondition !== 'string') {
    errors.push('preferredCondition is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==========================================
// REPAIR SHOPS CRUD
// ==========================================

export function getRepairShops(filter = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPAIR_SHOPS);
    let records = raw ? JSON.parse(raw) : null;

    if (!records || !Array.isArray(records) || records.length === 0) {
      records = [...DEMO_REPAIR_SHOPS];
      localStorage.setItem(STORAGE_KEY_REPAIR_SHOPS, JSON.stringify(records));
    }

    if (filter.status) {
      records = records.filter((r) => r.status === filter.status);
    }
    if (filter.materialCategory) {
      const catLower = filter.materialCategory.toLowerCase();
      records = records.filter((r) =>
        r.acceptedMaterials.some((m) => m.toLowerCase().includes(catLower))
      );
    }
    if (filter.area) {
      const areaLower = filter.area.toLowerCase();
      records = records.filter((r) => {
        const a = typeof r.location === 'object' ? r.location.area : r.location;
        return a.toLowerCase().includes(areaLower);
      });
    }

    return records;
  } catch (err) {
    console.warn('[repairShopService] Error loading repair shops:', err);
    return [...DEMO_REPAIR_SHOPS];
  }
}

export function getRepairShopById(repairShopId) {
  const all = getRepairShops();
  return all.find((r) => r.repairShopId === repairShopId) || null;
}

export function createRepairShop(shopData) {
  const validation = validateRepairShopRecord(shopData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(' ')}`);
  }

  const existing = getRepairShops();
  const nextId = generateNextId('SHOP', existing.map((r) => r.repairShopId));

  const newRecord = {
    repairShopId: nextId,
    name: shopData.name.trim(),
    ownerName: (shopData.ownerName || 'Demo Owner').trim(),
    location: typeof shopData.location === 'string'
      ? { area: shopData.location, state: 'Odisha' }
      : shopData.location,
    acceptedMaterials: shopData.acceptedMaterials || [],
    wantedItems: shopData.wantedItems || [],
    services: shopData.services || ['Parts recovery', 'Device repair', 'Component purchase'],
    purchaseEnabled: shopData.purchaseEnabled !== false,
    pickupAvailable: Boolean(shopData.pickupAvailable),
    contact: shopData.contact || '+91 94370 00000',
    rating: shopData.rating || 4.7,
    status: shopData.status || 'active',
    sourceType: shopData.sourceType || 'registered',
    createdAt: shopData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = [newRecord, ...existing];
  localStorage.setItem(STORAGE_KEY_REPAIR_SHOPS, JSON.stringify(updated));
  return newRecord;
}

// ==========================================
// "WHAT I NEED" — WANTED ITEMS CRUD
// ==========================================

export function getWantedItems(repairShopId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPAIR_WANTED);
    let items = raw ? JSON.parse(raw) : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      items = [...DEMO_WANTED_SEED_ITEMS];
      localStorage.setItem(STORAGE_KEY_REPAIR_WANTED, JSON.stringify(items));
    }

    if (repairShopId) {
      return items.filter((i) => i.repairShopId === repairShopId);
    }
    return items;
  } catch (err) {
    console.warn('[repairShopService] Error loading wanted items:', err);
    return [...DEMO_WANTED_SEED_ITEMS];
  }
}

export function getWantedItemById(wantedId) {
  const all = getWantedItems();
  return all.find((item) => item.wantedId === wantedId) || null;
}

export function createWantedItem(wantedData) {
  const validation = validateWantedItemRecord(wantedData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(' ')}`);
  }

  const existing = getWantedItems();
  const nextId = generateNextId('WANT', existing.map((i) => i.wantedId));

  const newWanted = {
    wantedId: nextId,
    id: nextId,
    repairShopId: wantedData.repairShopId,
    name: wantedData.name || wantedData.materialSubcategory || wantedData.materialCategory.trim(),
    materialCategory: wantedData.materialCategory.trim(),
    materialSubcategory: (wantedData.materialSubcategory || '').trim(),
    category: (wantedData.materialSubcategory || wantedData.materialCategory).trim(),
    preferredCondition: wantedData.preferredCondition || 'Good',
    conditionNeeded: wantedData.preferredCondition || 'Good',
    quantityNeeded: Number(wantedData.quantityNeeded),
    offeringPrice: wantedData.offeringPrice || 'Market Rate',
    location: wantedData.location || 'Local Area',
    urgency: wantedData.urgency || 'Active Demand',
    matchesFound: 1,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const updated = [newWanted, ...existing];
  localStorage.setItem(STORAGE_KEY_REPAIR_WANTED, JSON.stringify(updated));
  return newWanted;
}

export function deleteWantedItem(wantedId) {
  const existing = getWantedItems();
  const filtered = existing.filter((item) => item.wantedId !== wantedId);
  localStorage.setItem(STORAGE_KEY_REPAIR_WANTED, JSON.stringify(filtered));
  return true;
}

export function updateWantedItem(wantedId, patch) {
  const existing = getWantedItems();
  const index = existing.findIndex((item) => item.wantedId === wantedId);
  if (index === -1) return null;

  const updatedItem = {
    ...existing[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };

  existing[index] = updatedItem;
  localStorage.setItem(STORAGE_KEY_REPAIR_WANTED, JSON.stringify(existing));
  return updatedItem;
}

// ==========================================
// COLLECTOR INTEREST / INQUIRIES
// ==========================================

export function getRepairInquiries(filter = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPAIR_INQUIRIES);
    let inquiries = raw ? JSON.parse(raw) : [];

    if (filter.repairShopId) {
      inquiries = inquiries.filter((inq) => inq.repairShopId === filter.repairShopId);
    }
    if (filter.collectorId) {
      inquiries = inquiries.filter((inq) => inq.collectorId === filter.collectorId);
    }
    if (filter.lotId) {
      inquiries = inquiries.filter((inq) => inq.lotId === filter.lotId);
    }

    return inquiries;
  } catch (err) {
    console.warn('[repairShopService] Error loading inquiries:', err);
    return [];
  }
}

export function createRepairInquiry(inquiryData) {
  if (!inquiryData.repairShopId) {
    throw new Error('repairShopId is required for inquiry.');
  }

  const existing = getRepairInquiries();
  const nextId = generateNextId('INQ', existing.map((i) => i.inquiryId));

  const record = {
    inquiryId: nextId,
    collectorId: inquiryData.collectorId || 'collector-anon',
    collectorName: inquiryData.collectorName || 'Informal Scrap Collector',
    lotId: inquiryData.lotId || null,
    repairShopId: inquiryData.repairShopId,
    repairShopName: inquiryData.repairShopName || 'Repair Shop',
    materialCategory: inquiryData.materialCategory || '',
    materialSubcategory: inquiryData.materialSubcategory || '',
    condition: inquiryData.condition || 'good',
    weightKg: inquiryData.weightKg || 0,
    estimatedPrice: inquiryData.estimatedPrice || null,
    collectorLocation: inquiryData.collectorLocation || '',
    message: inquiryData.message || 'Collector expressed interest in offering salvage components.',
    status: 'sent',
    createdAt: new Date().toISOString()
  };

  const updated = [record, ...existing];
  localStorage.setItem(STORAGE_KEY_REPAIR_INQUIRIES, JSON.stringify(updated));
  return record;
}

// ==========================================
// RESET & SEED RESTORATION
// ==========================================

export function resetRepairShopDataset() {
  localStorage.setItem(STORAGE_KEY_REPAIR_SHOPS, JSON.stringify(DEMO_REPAIR_SHOPS));
  localStorage.setItem(STORAGE_KEY_REPAIR_WANTED, JSON.stringify(DEMO_WANTED_SEED_ITEMS));
  localStorage.removeItem(STORAGE_KEY_REPAIR_INQUIRIES);
  return true;
}
