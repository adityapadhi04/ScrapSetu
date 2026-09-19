/**
 * ScrapSetu — Offer Service (Module 8: Offer & Matching Engine)
 * Manages marketplace offers submitted by Repair Shops and Authorized Recyclers,
 * provides offer queries by lot, buyer, collector, and coordinates collector selection.
 *
 * Persisted in localStorage under STORAGE_KEY_OFFERS ("scrapsetu_offers").
 * Sequential IDs: OFR-0001, OFR-0002, etc.
 *
 * STRICT NON-COMMERCIAL SCOPE:
 * No payments, UPI, escrow, transaction records, digital receipts, QR handovers,
 * or physical handovers are created.
 */

import { SEED_OFFERS } from '../data/offerSeedData.js';
import { getScrapLotsByCollector, updateScrapLotOfferStatus } from './scrapLotService.js';

export const STORAGE_KEY_OFFERS = 'scrapsetu_offers';

export const VALID_BUYER_ROLES = ['repair', 'recycler'];
export const VALID_OFFER_STATUSES = ['submitted', 'viewed', 'accepted', 'rejected', 'withdrawn'];

/**
 * Initialize offers in localStorage with SEED_OFFERS if empty
 */
export const initializeOffers = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_OFFERS);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(SEED_OFFERS));
      return [...SEED_OFFERS];
    }
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? parsed : [...SEED_OFFERS];
  } catch (err) {
    console.error('Error initializing scrapsetu_offers:', err);
    return [...SEED_OFFERS];
  }
};

/**
 * Retrieve all offers from localStorage
 */
export const getOffers = () => {
  return initializeOffers();
};

/**
 * Save offers list to localStorage
 */
const saveOffers = (offers) => {
  try {
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(offers));
  } catch (err) {
    console.error('Error saving scrapsetu_offers:', err);
  }
};

/**
 * Generate sequential formatted Offer ID (OFR-0001, OFR-0002, etc.)
 */
export const generateNextOfferId = (existingOffers = null) => {
  const list = existingOffers || getOffers();
  let highestNum = 0;
  for (const o of list) {
    if (o.offerId && typeof o.offerId === 'string') {
      const match = o.offerId.match(/^OFR-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  }
  return `OFR-${String(highestNum + 1).padStart(4, '0')}`;
};

/**
 * Validate offer record schema
 */
export const validateOffer = (offerData) => {
  const errors = [];

  if (!offerData.lotId || typeof offerData.lotId !== 'string') {
    errors.push('lotId is required and must be a string');
  }

  if (!offerData.buyerId || typeof offerData.buyerId !== 'string') {
    errors.push('buyerId is required and must be a string');
  }

  if (!offerData.buyerRole || !VALID_BUYER_ROLES.includes(offerData.buyerRole)) {
    errors.push(`buyerRole must be one of: ${VALID_BUYER_ROLES.join(', ')}`);
  }

  if (!offerData.buyerName || typeof offerData.buyerName !== 'string' || !offerData.buyerName.trim()) {
    errors.push('buyerName is required');
  }

  if (!offerData.materialCategory || typeof offerData.materialCategory !== 'string') {
    errors.push('materialCategory is required');
  }

  const weightNum = parseFloat(offerData.weight);
  if (isNaN(weightNum) || weightNum <= 0) {
    errors.push('weight must be a positive number');
  }

  const priceNum = parseFloat(offerData.offeredPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    errors.push('offeredPrice must be a positive number');
  }

  if (offerData.status && !VALID_OFFER_STATUSES.includes(offerData.status)) {
    errors.push(`status must be one of: ${VALID_OFFER_STATUSES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Create a new offer
 */
export const createOffer = (offerData) => {
  const validation = validateOffer(offerData);
  if (!validation.valid) {
    throw new Error(`Offer validation failed: ${validation.errors.join('; ')}`);
  }

  const offers = getOffers();
  const offerId = offerData.offerId || generateNextOfferId(offers);

  const weight = parseFloat(offerData.weight);
  const offeredPrice = parseFloat(offerData.offeredPrice);
  const totalOfferValue = Math.round(weight * offeredPrice);

  const now = new Date().toISOString();

  const newOffer = {
    offerId,
    lotId: offerData.lotId,
    buyerId: offerData.buyerId,
    buyerRole: offerData.buyerRole,
    buyerName: offerData.buyerName.trim(),
    materialCategory: offerData.materialCategory,
    weight,
    weightUnit: offerData.weightUnit || 'kg',
    offeredPrice,
    priceUnit: offerData.priceUnit || 'kg',
    totalOfferValue,
    currency: offerData.currency || 'INR',
    message: (offerData.message || '').trim(),
    status: offerData.status || 'submitted',
    sourceType: offerData.sourceType || 'platform_user',
    createdAt: offerData.createdAt || now,
    updatedAt: now,
    datasetVersion: '1.0'
  };

  offers.push(newOffer);
  saveOffers(offers);

  // Mark scrap lot as having active offers if currently 'none'
  try {
    updateScrapLotOfferStatus(offerData.lotId, 'offers_available');
  } catch (err) {
    // Non-fatal if lot service is independent
  }

  return newOffer;
};

/**
 * Find offer by ID
 */
export const getOfferById = (offerId) => {
  const offers = getOffers();
  return offers.find((o) => o.offerId === offerId) || null;
};

/**
 * Query offers for a specific scrap lot
 */
export const getOffersForLot = (lotId) => {
  const offers = getOffers();
  return offers.filter((o) => o.lotId === lotId);
};

/**
 * Query offers submitted by a specific buyer
 */
export const getOffersForBuyer = (buyerId) => {
  const offers = getOffers();
  return offers.filter((o) => o.buyerId === buyerId);
};

/**
 * Query offers for all lots owned by a specific collector
 */
export const getOffersForCollector = (collectorId) => {
  try {
    const collectorLots = getScrapLotsByCollector(collectorId);
    const lotIds = new Set(collectorLots.map((l) => l.id));
    const offers = getOffers();
    return offers.filter((o) => lotIds.has(o.lotId));
  } catch (err) {
    console.error('Error fetching offers for collector:', err);
    return [];
  }
};

/**
 * Update status of an individual offer
 */
export const updateOfferStatus = (offerId, newStatus, updaterId = null) => {
  if (!VALID_OFFER_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid offer status: ${newStatus}`);
  }

  const offers = getOffers();
  const index = offers.findIndex((o) => o.offerId === offerId);
  if (index === -1) {
    throw new Error(`Offer not found: ${offerId}`);
  }

  const offer = offers[index];

  // Optional authorization guard: if updaterId provided and it's a buyer, only update their own offer
  if (updaterId && offer.buyerId !== updaterId && newStatus === 'withdrawn') {
    throw new Error(`Unauthorized: Buyer ${updaterId} cannot withdraw offer ${offerId} belonging to ${offer.buyerId}`);
  }

  offer.status = newStatus;
  offer.updatedAt = new Date().toISOString();

  offers[index] = offer;
  saveOffers(offers);

  return offer;
};

/**
 * Collector accepts ONE offer:
 * - Selected offer status becomes 'accepted'
 * - Other active offers for the SAME lot become 'rejected'
 * - Scrap lot offerStatus becomes 'offer_selected'
 * - NO payment, transaction, or sale completion is created.
 */
export const acceptOffer = (offerId, lotId) => {
  const offers = getOffers();
  const targetIndex = offers.findIndex((o) => o.offerId === offerId && o.lotId === lotId);
  if (targetIndex === -1) {
    throw new Error(`Offer ${offerId} for lot ${lotId} not found`);
  }

  const now = new Date().toISOString();

  // Accept target offer and reject other active offers for the lot
  for (let i = 0; i < offers.length; i++) {
    if (offers[i].lotId === lotId) {
      if (offers[i].offerId === offerId) {
        offers[i].status = 'accepted';
        offers[i].updatedAt = now;
      } else if (offers[i].status === 'submitted' || offers[i].status === 'viewed') {
        offers[i].status = 'rejected';
        offers[i].updatedAt = now;
      }
    }
  }

  saveOffers(offers);

  // Update lot state to offer_selected (without marking as sold/paid)
  try {
    updateScrapLotOfferStatus(lotId, 'offer_selected');
  } catch (err) {
    console.error('Failed to update scrap lot offerStatus:', err);
  }

  return offers[targetIndex];
};

/**
 * Aggregate summary statistics for platform administration & governance
 */
export const getOfferStats = () => {
  const offers = getOffers();
  const totalOffers = offers.length;
  const acceptedOffers = offers.filter((o) => o.status === 'accepted').length;
  const submittedOffers = offers.filter((o) => o.status === 'submitted').length;
  const rejectedOffers = offers.filter((o) => o.status === 'rejected').length;
  const repairOffers = offers.filter((o) => o.buyerRole === 'repair').length;
  const recyclerOffers = offers.filter((o) => o.buyerRole === 'recycler').length;

  const totalValue = offers.reduce((sum, o) => sum + (o.totalOfferValue || 0), 0);

  return {
    totalOffers,
    acceptedOffers,
    submittedOffers,
    rejectedOffers,
    repairOffers,
    recyclerOffers,
    totalValue
  };
};

/**
 * Reset offers dataset to seed data
 */
export const resetOfferDataset = () => {
  try {
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(SEED_OFFERS));
    return [...SEED_OFFERS];
  } catch (err) {
    console.error('Error resetting offer dataset:', err);
    return [...SEED_OFFERS];
  }
};
