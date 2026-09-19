/**
 * ScrapSetu — Offer Matching & Buyer Eligibility Service (Module 8)
 * Evaluates scrap lots against buyer profiles (Repair Shops vs Authorized Recyclers)
 * to determine eligibility for making commercial scrap purchase offers.
 *
 * TRANSPARENCY PRINCIPLE:
 * Uses explicit, deterministic checklists ("Why can I offer?") rather than
 * opaque AI scores or arbitrary rankings.
 */

import { getAllScrapLots } from './scrapLotService.js';
import { getRepairShops, getWantedItems } from './repairShopService.js';
import { getRecyclerById, getActiveRecyclers } from './recyclerService.js';
import { estimateFairPrice } from './priceIntelligenceService.js';

/**
 * Normalize location string/object to lowercase strings for matching
 */
const extractLocationStrings = (loc) => {
  if (!loc) return [];
  if (typeof loc === 'string') return [loc.toLowerCase().trim()];
  const parts = [];
  if (loc.area) parts.push(String(loc.area).toLowerCase().trim());
  if (loc.city) parts.push(String(loc.city).toLowerCase().trim());
  if (loc.district) parts.push(String(loc.district).toLowerCase().trim());
  if (loc.state) parts.push(String(loc.state).toLowerCase().trim());
  return parts;
};

/**
 * Check if a Repair Shop is eligible to submit an offer for a given scrap lot
 */
export const isRepairShopEligible = (shop, lot) => {
  if (!shop || !lot) return { eligible: false, reasons: [] };

  const reasons = [];
  const lotMaterial = (lot.materialType || lot.materialCategory || '').toLowerCase();
  const lotCondition = (lot.condition || '').toLowerCase();

  // 1. Material Compatibility
  const acceptedMaterials = (shop.acceptedMaterials || []).map((m) => m.toLowerCase());
  const materialMatch = acceptedMaterials.some(
    (m) => lotMaterial.includes(m) || m.includes(lotMaterial)
  );

  if (!materialMatch) {
    return { eligible: false, reasons: [] };
  }
  reasons.push(`Accepts ${lot.materialType || lot.materialCategory}`);

  // 2. Condition Compatibility (Repair shops specialize in reuse / repair / parts salvage)
  // Rejects severely crushed or hazardous materials that have zero reuse/repair potential
  const nonRepairable = lotCondition === 'damaged' && lotMaterial.includes('battery');
  if (nonRepairable) {
    return { eligible: false, reasons: [] };
  }
  reasons.push(`Condition compatible for reuse & parts recovery (${lot.condition || 'Fair'})`);

  // 3. Location Relevance
  const lotLocParts = extractLocationStrings(lot.location);
  const shopLocParts = extractLocationStrings(shop.location);
  const locationMatch =
    lotLocParts.length === 0 ||
    shopLocParts.length === 0 ||
    shopLocParts.some((sPart) => lotLocParts.some((lPart) => lPart.includes(sPart) || sPart.includes(lPart)));

  if (locationMatch) {
    reasons.push('Located within regional service area');
  }

  // 4. Active Wanted Item Demand Boost
  try {
    const shopWanted = getWantedItems({ shopId: shop.id });
    const hasWantedDemand = shopWanted.some((w) => {
      const wCat = (w.category || '').toLowerCase();
      const wItem = (w.itemNeeded || '').toLowerCase();
      return lotMaterial.includes(wCat) || lotMaterial.includes(wItem);
    });
    if (hasWantedDemand) {
      reasons.push('Matches active wanted component broadcast');
    }
  } catch (err) {
    // Non-fatal
  }

  return {
    eligible: true,
    reasons
  };
};

/**
 * Get all eligible scrap lots for a given Repair Shop
 */
export const getEligibleLotsForRepairShop = (shopId) => {
  const shops = getRepairShops();
  const shop = shops.find((s) => s.id === shopId) || shops[0];
  if (!shop) return [];

  const lots = getAllScrapLots();

  return lots
    .map((lot) => {
      const evaluation = isRepairShopEligible(shop, lot);
      if (!evaluation.eligible) return null;

      // Platform fair price estimate
      const priceEstimate = estimateFairPrice({
        materialCategory: lot.materialCategory || lot.materialType,
        weight: lot.weight,
        condition: lot.condition,
        location: lot.location
      });

      return {
        ...lot,
        reasons: evaluation.reasons,
        priceEstimate,
        eligibleBuyerRole: 'repair'
      };
    })
    .filter(Boolean);
};

/**
 * Check if an Authorized Recycler is eligible to submit an offer for a given scrap lot
 */
export const isRecyclerEligible = (recycler, lot) => {
  if (!recycler || !lot) return { eligible: false, reasons: [] };

  const reasons = [];
  const lotMaterial = (lot.materialType || lot.materialCategory || '').toLowerCase();
  const lotWeight = parseFloat(lot.weight) || 0;

  // 1. Material Compatibility
  const acceptedMaterials = (recycler.acceptedMaterials || []).map((m) => m.toLowerCase());
  const materialMatch = acceptedMaterials.some(
    (m) => lotMaterial.includes(m) || m.includes(lotMaterial)
  );

  if (!materialMatch) {
    return { eligible: false, reasons: [] };
  }
  reasons.push(`Authorized processor for ${lot.materialType || lot.materialCategory}`);

  // 2. Minimum Lot Weight Compatibility
  const minWeight = parseFloat(recycler.minimumWeightKg) || 0;
  if (minWeight > 0 && lotWeight < minWeight) {
    // Recycler requires larger industrial bulk batch
    return { eligible: false, reasons: [] };
  }
  if (minWeight > 0) {
    reasons.push(`Lot weight (${lotWeight} kg) meets facility minimum (${minWeight} kg)`);
  } else {
    reasons.push(`Lot size (${lotWeight} kg) acceptable`);
  }

  // 3. Operating Area Coverage
  const lotLocParts = extractLocationStrings(lot.location);
  const operatingAreas = (recycler.operatingAreas || []).map((a) => a.toLowerCase());
  const recyclerAddressParts = extractLocationStrings(recycler.address);
  const combinedRecyclerAreas = [...operatingAreas, ...recyclerAddressParts];

  const areaMatch =
    lotLocParts.length === 0 ||
    combinedRecyclerAreas.length === 0 ||
    combinedRecyclerAreas.some((rArea) => lotLocParts.some((lPart) => lPart.includes(rArea) || rArea.includes(lPart)));

  if (!areaMatch) {
    return { eligible: false, reasons: [] };
  }
  reasons.push('Serves collector operating region');

  // 4. Logistics & Pickup Capability
  if (recycler.pickupAvailable) {
    reasons.push('Pickup logistics available');
  } else {
    reasons.push('Self-delivery drop-off facility');
  }

  return {
    eligible: true,
    reasons
  };
};

/**
 * Get all eligible scrap lots for a given Authorized Recycler facility
 */
export const getEligibleLotsForRecycler = (recyclerId) => {
  const recycler = getRecyclerById(recyclerId) || getActiveRecyclers()[0];
  if (!recycler) return [];

  const lots = getAllScrapLots();

  return lots
    .map((lot) => {
      const evaluation = isRecyclerEligible(recycler, lot);
      if (!evaluation.eligible) return null;

      // Platform fair price estimate
      const priceEstimate = estimateFairPrice({
        materialCategory: lot.materialCategory || lot.materialType,
        weight: lot.weight,
        condition: lot.condition,
        location: lot.location
      });

      return {
        ...lot,
        reasons: evaluation.reasons,
        priceEstimate,
        eligibleBuyerRole: 'recycler'
      };
    })
    .filter(Boolean);
};
