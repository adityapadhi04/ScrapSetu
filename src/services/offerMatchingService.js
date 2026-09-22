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
 * Normalizes and checks if a Repair Shop's registered location matches a Lot's location.
 * Rule: Collector selects LOT location -> only Repair Shops registered in that SAME location can see that lot.
 *
 * Example:
 * Lot: Gunupur Sector 2
 * -> Repair Shop in Gunupur Sector 2 / Gunupur: Match (true)
 * -> Other locations: No match (false)
 */
export const isLocationMatch = (shopLoc, lotLoc) => {
  if (!shopLoc || !lotLoc) return false;

  const normalize = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.toLowerCase().trim();
    if (typeof val === 'object') {
      const parts = [val.area, val.city, val.district, val.state, val.landmark].filter(Boolean);
      return parts.join(' ').toLowerCase().trim();
    }
    return String(val).toLowerCase().trim();
  };

  const sStr = normalize(shopLoc);
  const lStr = normalize(lotLoc);

  if (!sStr || !lStr) return false;

  // 1. Direct string containment or equality
  if (sStr === lStr || sStr.includes(lStr) || lStr.includes(sStr)) {
    // If both specify different sectors (e.g. Sector 1 vs Sector 2), enforce exact sector match
    const sSector = sStr.match(/sector\s*(\d+)/i);
    const lSector = lStr.match(/sector\s*(\d+)/i);
    if (sSector && lSector) {
      return sSector[1] === lSector[1];
    }
    return true;
  }

  // 2. Significant location tokens match (e.g., 'gunupur', 'dharavi', 'mumbai', 'rayagada')
  const stopwords = new Set(['sector', 'road', 'street', 'market', 'near', 'flat', 'shop', 'odisha', 'maharashtra', 'india', 'dist', 'district', 'area', 'cluster']);
  const getTokens = (str) =>
    str
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

  const sTokens = getTokens(sStr);
  const lTokens = getTokens(lStr);

  const hasCommonToken = sTokens.some((t) => lTokens.includes(t));
  if (hasCommonToken) {
    const sSector = sStr.match(/sector\s*(\d+)/i);
    const lSector = lStr.match(/sector\s*(\d+)/i);
    if (sSector && lSector) {
      return sSector[1] === lSector[1];
    }
    return true;
  }

  return false;
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
  const lotCat = (lot.materialCategory || '').toLowerCase();
  const lotType = (lot.materialType || '').toLowerCase();
  const lotSub = (lot.materialSubcategory || '').toLowerCase();

  let materialMatch =
    lotCat.includes('mixed') ||
    lotType.includes('mixed') ||
    lotCat.includes('e-waste') ||
    lotType.includes('e-waste') ||
    acceptedMaterials.some(
      (m) =>
        (lotCat && (lotCat.includes(m) || m.includes(lotCat))) ||
        (lotType && (lotType.includes(m) || m.includes(lotType))) ||
        (lotSub && (lotSub.includes(m) || m.includes(lotSub)))
    );

  if (!materialMatch && Array.isArray(lot.items) && lot.items.length > 0) {
    materialMatch = lot.items.some((it) => {
      const itName = (it.name || '').toLowerCase();
      const itCat = (it.category || '').toLowerCase();
      const itSub = (it.subcategory || '').toLowerCase();
      return acceptedMaterials.some(
        (m) =>
          (itCat && (itCat.includes(m) || m.includes(itCat))) ||
          (itName && (itName.includes(m) || m.includes(itName))) ||
          (itSub && (itSub.includes(m) || m.includes(itSub)))
      );
    });
  }

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

  // 3. Location Relevance — STRICT SAME LOCATION MATCHING
  const locMatch = isLocationMatch(shop.location, lot.location);
  if (!locMatch) {
    return { eligible: false, reasons: [] };
  }
  const shopAreaStr = typeof shop.location === 'object' ? (shop.location.area || 'Same Location') : String(shop.location || 'Same Location');
  reasons.push(`Location match (${shopAreaStr})`);

  // 4. Active Wanted Item Demand Boost
  try {
    const shopWanted = getWantedItems({ shopId: shop.id || shop.repairShopId });
    const hasWantedDemand = shopWanted.some((w) => {
      const wCat = (w.category || '').toLowerCase();
      const wItem = (w.itemNeeded || w.name || '').toLowerCase();
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
  let shop = shops.find((s) => s.repairShopId === shopId || s.id === shopId || s.name === shopId);
  if (!shop) {
    if (shopId === 'usr-repair-01' || shopId === 'repair') {
      shop = shops.find((s) => s.repairShopId === 'SHOP-0002') || shops[0];
    } else {
      shop = shops[0];
    }
  }
  if (!shop) return [];

  const lots = getAllScrapLots();

  return lots
    .map((lot) => {
      if (lot.status === 'Sold' || lot.transactionStatus === 'completed') return null;

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
