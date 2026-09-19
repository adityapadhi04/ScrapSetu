/**
 * ScrapSetu — Recycler Inquiry Service (Module 7)
 * 
 * Manages lightweight collector inquiries and intent broadcasts sent to authorized recyclers.
 * 
 * IMPORTANT ARCHITECTURAL RULE:
 * This is a lightweight communication inquiry layer, NOT a final transaction or payment engine.
 * Statuses supported:
 * - 'sent': Collector submitted interest to the recycler
 * - 'viewed': Recycler opened/inspected the inquiry
 * - 'interested': Recycler marked interest in the scrap lot
 * - 'declined': Recycler is unable to process or collect this lot
 */

import { generateNextId } from './recyclerService.js';

export const STORAGE_KEY_RECYCLER_INQUIRIES = 'scrapsetu_recycler_inquiries';

export const VALID_INQUIRY_STATUSES = ['sent', 'viewed', 'interested', 'declined'];

/**
 * Representative initial demo inquiries for prototype exploration
 */
export const DEMO_RECYCLER_INQUIRIES = [
  {
    inquiryId: 'RINQ-0001',
    lotId: 'LOT-1001',
    collectorId: 'usr-collector-01',
    collectorName: 'Ramesh Kumar',
    recyclerId: 'REC-0001',
    recyclerName: 'GreenCycle Material Recovery Ltd.',
    materialCategory: 'PCB',
    materialSubcategory: 'Computer PCB',
    condition: 'damaged',
    weight: 8.5,
    weightUnit: 'kg',
    collectorLocation: 'Gunupur',
    estimatedPrice: '₹1,500 – ₹1,900',
    status: 'sent',
    createdAt: '2026-09-18T14:30:00.000Z',
    updatedAt: '2026-09-18T14:30:00.000Z'
  },
  {
    inquiryId: 'RINQ-0002',
    lotId: 'LOT-1002',
    collectorId: 'usr-collector-01',
    collectorName: 'Ramesh Kumar',
    recyclerId: 'REC-0006',
    recyclerName: 'Vanshdhara Green Metals',
    materialCategory: 'Battery',
    materialSubcategory: 'Lithium-ion Pack',
    condition: 'damaged',
    weight: 12.0,
    weightUnit: 'kg',
    collectorLocation: 'Gunupur',
    estimatedPrice: '₹900 – ₹1,200',
    status: 'interested',
    createdAt: '2026-09-19T09:15:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z'
  }
];

function getStorage() {
  if (typeof localStorage !== 'undefined') return localStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

/**
 * Initializes inquiries in localStorage if empty
 */
export function initializeInquiries() {
  const storage = getStorage();
  if (!storage) {
    return DEMO_RECYCLER_INQUIRIES;
  }
  try {
    const existing = storage.getItem(STORAGE_KEY_RECYCLER_INQUIRIES);
    if (!existing) {
      storage.setItem(STORAGE_KEY_RECYCLER_INQUIRIES, JSON.stringify(DEMO_RECYCLER_INQUIRIES));
      return DEMO_RECYCLER_INQUIRIES;
    }
    return JSON.parse(existing);
  } catch (err) {
    console.error('Failed to initialize recycler inquiries:', err);
    return DEMO_RECYCLER_INQUIRIES;
  }
}

/**
 * Resets recycler inquiries dataset back to initial demo seeds
 */
export function resetRecyclerInquiries() {
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY_RECYCLER_INQUIRIES, JSON.stringify(DEMO_RECYCLER_INQUIRIES));
  }
  return DEMO_RECYCLER_INQUIRIES;
}

/**
 * Retrieves inquiries matching optional filter criteria
 */
export function getRecyclerInquiries(filter = {}) {
  const all = initializeInquiries();

  return all.filter((inq) => {
    if (filter.recyclerId && inq.recyclerId !== filter.recyclerId) return false;
    if (filter.collectorId && inq.collectorId !== filter.collectorId) return false;
    if (filter.status && filter.status !== 'ALL' && inq.status !== filter.status) return false;
    if (filter.lotId && inq.lotId !== filter.lotId) return false;
    return true;
  });
}

/**
 * Retrieves all inquiries sent to a specific authorized recycler
 */
export function getInquiriesByRecycler(recyclerId) {
  return getRecyclerInquiries({ recyclerId });
}

/**
 * Retrieves all inquiries created by a specific collector
 */
export function getInquiriesByCollector(collectorId) {
  return getRecyclerInquiries({ collectorId });
}

/**
 * Validates inquiry payload
 */
export function validateInquiryRecord(data) {
  const errors = [];

  if (!data.recyclerId || typeof data.recyclerId !== 'string') {
    errors.push('recyclerId is required.');
  }

  if (!data.materialCategory || typeof data.materialCategory !== 'string') {
    errors.push('materialCategory is required.');
  }

  const wt = Number(data.weight);
  if (isNaN(wt) || wt <= 0) {
    errors.push('weight must be a positive number.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates and registers a new recycler inquiry in localStorage
 */
export function createRecyclerInquiry(data) {
  const validation = validateInquiryRecord(data);
  if (!validation.isValid) {
    throw new Error(`Inquiry validation failed: ${validation.errors.join(' ')}`);
  }

  const all = initializeInquiries();
  const existingIds = all.map((i) => i.inquiryId);
  const inquiryId = data.inquiryId || generateNextId('RINQ', existingIds);

  const now = new Date().toISOString();
  const newInquiry = {
    inquiryId,
    lotId: data.lotId || null,
    collectorId: data.collectorId || 'usr-collector-01',
    collectorName: data.collectorName || 'Ramesh Kumar',
    recyclerId: data.recyclerId,
    recyclerName: data.recyclerName || 'Authorized Recycler',
    materialCategory: data.materialCategory,
    materialSubcategory: data.materialSubcategory || data.materialCategory,
    condition: data.condition || 'damaged',
    weight: Number(data.weight) || 1,
    weightUnit: data.weightUnit || 'kg',
    collectorLocation: data.collectorLocation || 'Gunupur',
    estimatedPrice: data.estimatedPrice || null,
    status: data.status && VALID_INQUIRY_STATUSES.includes(data.status) ? data.status : 'sent',
    createdAt: data.createdAt || now,
    updatedAt: now
  };

  const updated = [newInquiry, ...all];
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY_RECYCLER_INQUIRIES, JSON.stringify(updated));
  }

  return newInquiry;
}

/**
 * Updates status of an existing inquiry (e.g. viewed, interested, declined)
 */
export function updateInquiryStatus(inquiryId, status, updaterId = null) {
  if (!VALID_INQUIRY_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_INQUIRY_STATUSES.join(', ')}`);
  }

  const all = initializeInquiries();
  const target = all.find((inq) => inq.inquiryId === inquiryId);
  if (!target) {
    throw new Error(`Inquiry with ID ${inquiryId} not found.`);
  }

  if (updaterId && target.recyclerId !== updaterId) {
    throw new Error(`Unauthorized: Recycler ${updaterId} cannot modify inquiry destined for ${target.recyclerId}`);
  }

  const updated = all.map((inq) => {
    if (inq.inquiryId === inquiryId) {
      return {
        ...inq,
        status,
        updatedAt: new Date().toISOString()
      };
    }
    return inq;
  });

  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY_RECYCLER_INQUIRIES, JSON.stringify(updated));
  }

  return updated.find((i) => i.inquiryId === inquiryId);
}
