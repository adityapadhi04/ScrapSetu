/**
 * ScrapSetu — Repair Matching Service (Module 6)
 * 
 * Implements transparent, deterministic matching between collector scrap lots
 * and nearby repair shops seeking salvageable electronic components.
 * 
 * IMPORTANT ARCHITECTURAL & TRANSPARENCY NOTICE:
 * This is NOT an unexplainable machine learning model and does not use opaque AI scores.
 * All matches are computed deterministically against explicit 6-point business rules:
 * 1. Material accepted by shop
 * 2. Active component demand (Wanted Items)
 * 3. Condition compatibility
 * 4. Geographic area relevance
 * 5. Purchase capability enabled
 * 6. Active shop operational status
 * 
 * All matches include explicit, plain-language "Why this shop?" reasons.
 * DO NOT claim actual GPS distance; uses clearly labeled "Location match" or regional area.
 */

import { getRepairShops, getWantedItems } from './repairShopService.js';

/**
 * Normalizes category strings for robust matching against synonyms.
 */
function normalizeCategory(cat = '') {
  const norm = String(cat).toLowerCase().trim();
  if (norm.includes('pcb') || norm.includes('motherboard') || norm.includes('circuit')) return 'PCB';
  if (norm.includes('mobile') || norm.includes('phone') || norm.includes('smartphone')) return 'Mobile Phone';
  if (norm.includes('laptop') || norm.includes('computer') || norm === 'pc' || norm.includes('desktop')) return 'Laptop / Computer';
  if (norm.includes('lcd') || norm.includes('display') || norm.includes('screen') || norm.includes('monitor')) return 'LCD / Display';
  if (norm.includes('motor') || norm.includes('transformer')) return 'Motor';
  if (norm.includes('cable') || norm.includes('wire') || norm.includes('copper')) return 'Cable';
  if (norm.includes('battery') || norm.includes('cell')) return 'Battery';
  return cat.trim();
}

/**
 * Determines whether two locations have a geographic area or state match.
 */
function checkLocationMatch(collectorLocation = '', shopLocation = {}) {
  if (!collectorLocation) return false;

  const locStr = String(collectorLocation).toLowerCase();
  const shopArea = (typeof shopLocation === 'object' ? shopLocation.area : shopLocation || '').toLowerCase();
  const shopState = (typeof shopLocation === 'object' ? shopLocation.state : '').toLowerCase();

  // Check area keyword overlap (e.g. Bhubaneswar, Gunupur, Rayagada, Cuttack, Mumbai)
  const areas = ['bhubaneswar', 'gunupur', 'rayagada', 'cuttack', 'berhampur', 'mumbai', 'dharavi', 'kurla'];
  for (const area of areas) {
    if (locStr.includes(area) && shopArea.includes(area)) {
      return true;
    }
  }

  // Exact substring checks
  if (shopArea && (locStr.includes(shopArea) || shopArea.includes(locStr))) {
    return true;
  }
  if (shopState && locStr.includes(shopState)) {
    return true;
  }

  return false;
}

/**
 * Finds and ranks matching repair shops for a given scrap lot item.
 * 
 * @param {Object} params
 * @param {string} params.materialCategory - e.g. "Mobile Phone"
 * @param {string} [params.materialSubcategory] - e.g. "Smartphone Assembly"
 * @param {string} params.condition - "good" | "fair" | "damaged" | "mixed"
 * @param {string|Object} [params.location] - Collector location area/string
 * @returns {Array<Object>} Ranked matches with explicit "Why this shop?" explanation
 */
export function findRepairShopMatches({
  materialCategory = '',
  materialSubcategory = '',
  condition = 'good',
  location = ''
} = {}) {
  const normCategory = normalizeCategory(materialCategory);
  const normSubcategory = String(materialSubcategory).toLowerCase();
  const condLower = String(condition).toLowerCase();

  const allShops = getRepairShops({ status: 'active' });
  const allWanted = getWantedItems();

  const matches = [];

  for (const shop of allShops) {
    // Must have purchase capability enabled and active status
    if (shop.purchaseEnabled === false || shop.status !== 'active') {
      continue;
    }

    const matchReasons = [];
    let score = 0;

    // 1. Material Acceptance Check
    const acceptsMaterial = (shop.acceptedMaterials || []).some((accepted) => {
      const normAccepted = normalizeCategory(accepted);
      return normAccepted.toLowerCase() === normCategory.toLowerCase() ||
        normCategory.toLowerCase().includes(normAccepted.toLowerCase()) ||
        normAccepted.toLowerCase().includes(normCategory.toLowerCase());
    });

    if (acceptsMaterial) {
      matchReasons.push(`Accepts ${normCategory} components`);
      score += 40;
    }

    // 2. Active Wanted Demand Check
    const shopWanted = allWanted.filter(
      (w) => w.repairShopId === shop.repairShopId && w.status === 'active'
    );

    const matchingWanted = shopWanted.find((w) => {
      const wantedCat = normalizeCategory(w.materialCategory);
      return wantedCat.toLowerCase() === normCategory.toLowerCase() ||
        (normSubcategory && w.materialSubcategory && w.materialSubcategory.toLowerCase().includes(normSubcategory));
    });

    if (matchingWanted) {
      matchReasons.push(`Actively looking for ${matchingWanted.materialCategory} (${matchingWanted.offeringPrice || 'Market Rate'})`);
      score += 35;
    }

    // If shop does not accept this material AND has no wanted item for it, skip
    if (!acceptsMaterial && !matchingWanted) {
      continue;
    }

    // 3. Condition Compatibility
    let conditionCompatible = false;
    if (matchingWanted) {
      const preferred = (matchingWanted.preferredCondition || '').toLowerCase();
      if (preferred === 'any' || condLower === preferred || (condLower === 'good' && preferred === 'fair')) {
        conditionCompatible = true;
        matchReasons.push(`Wants ${matchingWanted.preferredCondition}-condition items`);
        score += 15;
      } else {
        matchReasons.push(`Accepts ${condition} condition for parts recovery`);
        score += 5;
      }
    } else {
      if (condLower === 'good' || condLower === 'fair') {
        conditionCompatible = true;
        matchReasons.push(`Prefers intact, salvageable parts (${condition})`);
        score += 10;
      } else {
        matchReasons.push(`Accepts ${condition} items for component desoldering`);
        score += 5;
      }
    }

    // 4. Location Relevance Check
    const isLocationMatch = checkLocationMatch(location, shop.location);
    const shopArea = typeof shop.location === 'object' ? shop.location.area : shop.location;

    if (isLocationMatch) {
      matchReasons.push(`Location match (${shopArea})`);
      score += 20;
    } else {
      matchReasons.push(`Regional repair network (${shopArea})`);
      score += 5;
    }

    // 5. Purchase Capability
    matchReasons.push('Currently purchasing components from local collectors');

    // Determine human-readable compatibility badge
    let compatibility = 'Compatible Shop';
    if (matchingWanted && isLocationMatch) {
      compatibility = 'High Demand Match';
    } else if (matchingWanted || isLocationMatch) {
      compatibility = 'Strong Match';
    }

    matches.push({
      repairShopId: shop.repairShopId,
      shop,
      matchReasons,
      matchedWantedItem: matchingWanted || null,
      hasActiveDemand: Boolean(matchingWanted),
      locationMatch: isLocationMatch,
      distanceLabel: isLocationMatch ? `Location match (${shopArea})` : `Regional area (${shopArea})`,
      compatibility,
      score
    });
  }

  // Sort descending by score (most relevant matches first)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}
