/**
 * ScrapSetu — Recycler Discovery & Matching Service (Module 7)
 * 
 * Implements transparent, deterministic matching between collector scrap lots
 * and authorized e-waste recycling facilities.
 * 
 * IMPORTANT ARCHITECTURAL & TRANSPARENCY NOTICE:
 * This is NOT an unexplainable machine learning model and does not use opaque AI scores.
 * All matches are computed deterministically against explicit 6-point business rules:
 * 1. Material compatibility (facility accepts the lot's material category) [+3 pts]
 * 2. Active facility status (mandatory prerequisite)
 * 3. Location relevance (facility operates in or near the collector's area/city) [+2 pts]
 * 4. Pickup service availability (facility provides transport/collection) [+1 pt]
 * 5. Lot weight compatibility (lot weight >= minimum lot requirement) [+1 pt]
 * 6. Service diversity (offers drop-off, collection, or bulk dismantling) [+1 pt]
 * 
 * All matches include explicit, plain-language "Why this recycler?" reasons.
 * DO NOT claim "best recycler" or live GPS distances.
 */

import { getActiveRecyclers } from './recyclerService.js';

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
  if (norm.includes('battery') || norm.includes('cell') || norm.includes('lithium')) return 'Battery';
  if (norm.includes('chassis') || norm.includes('metal')) return 'Metal Chassis';
  if (norm.includes('plastic') || norm.includes('casing')) return 'Plastic Casing';
  return cat.trim();
}

/**
 * Checks geographic compatibility between collector location and recycler operating areas.
 */
function checkLocationMatch(collectorLocation = '', recycler = {}) {
  if (!collectorLocation) return { isMatch: false, matchedArea: '' };

  const locStr = String(collectorLocation).toLowerCase().trim();
  const city = (recycler.address?.city || '').toLowerCase().trim();
  const area = (recycler.address?.area || '').toLowerCase().trim();
  const state = (recycler.address?.state || '').toLowerCase().trim();
  const operatingAreas = (recycler.operatingAreas || []).map((a) => String(a).toLowerCase().trim());

  // Direct match in city or area
  if (city && (locStr.includes(city) || city.includes(locStr))) {
    return { isMatch: true, matchedArea: recycler.address?.city || locStr };
  }
  if (area && (locStr.includes(area) || area.includes(locStr))) {
    return { isMatch: true, matchedArea: recycler.address?.area || locStr };
  }

  // Check operational areas list
  for (let i = 0; i < operatingAreas.length; i++) {
    const op = operatingAreas[i];
    if (op && (locStr.includes(op) || op.includes(locStr))) {
      return { isMatch: true, matchedArea: recycler.operatingAreas[i] };
    }
  }

  // Regional keyword overlap (e.g. Gunupur, Rayagada, Bhubaneswar, Cuttack, Mumbai)
  const knownHubs = ['gunupur', 'rayagada', 'bhubaneswar', 'cuttack', 'berhampur', 'mumbai', 'navi mumbai', 'rourkela'];
  for (const hub of knownHubs) {
    if (locStr.includes(hub) && (city.includes(hub) || operatingAreas.some((a) => a.includes(hub)))) {
      return { isMatch: true, matchedArea: hub.charAt(0).toUpperCase() + hub.slice(1) };
    }
  }

  // State fallback
  if (state && locStr.includes(state)) {
    return { isMatch: true, matchedArea: recycler.address?.state };
  }

  return { isMatch: false, matchedArea: '' };
}

/**
 * Finds and ranks matching authorized recyclers for a collector scrap lot.
 * 
 * @param {Object} params
 * @param {string} params.materialCategory - e.g. "PCB", "Battery", "Cable"
 * @param {number} [params.weight] - Total lot weight in kg
 * @param {string|Object} [params.location] - Collector location/city string
 * @param {boolean} [params.requirePickup] - If true, collector specifically requests pickup
 * @returns {Array<Object>} Ranked matches with explicit "Why this recycler?" checklists
 */
export function findRecyclerMatches({
  materialCategory = '',
  weight = 0,
  location = '',
  condition = '',
  requirePickup = false
} = {}) {
  const normCategory = normalizeCategory(materialCategory);
  const numWeight = Number(weight) || 0;
  const activeRecyclers = getActiveRecyclers();

  const matches = [];

  for (const recycler of activeRecyclers) {
    // 1. Material Compatibility (Mandatory for recommendation)
    const acceptsMaterial = (recycler.acceptedMaterials || []).some((m) => {
      const normFacilityMat = normalizeCategory(m);
      return normFacilityMat.toLowerCase() === normCategory.toLowerCase() ||
        normCategory.toLowerCase().includes(normFacilityMat.toLowerCase()) ||
        normFacilityMat.toLowerCase().includes(normCategory.toLowerCase());
    });

    if (!acceptsMaterial) {
      continue;
    }

    const matchReasons = [];
    let score = 0;

    // +3 points for Material Match
    score += 3;
    matchReasons.push(`Accepts ${normCategory || materialCategory}`);

    // 2. Location Compatibility
    const locCheck = checkLocationMatch(location, recycler);
    if (locCheck.isMatch) {
      score += 2;
      matchReasons.push(`Serves ${locCheck.matchedArea || 'your location'}`);
    } else {
      matchReasons.push(`Facility based in ${recycler.address?.city || 'regional hub'}`);
    }

    // 3. Pickup Availability
    if (recycler.pickupAvailable) {
      score += 1;
      matchReasons.push('Pickup service available');
    } else {
      matchReasons.push('Drop-off facility (self-delivery)');
    }

    // If collector specifically required pickup but facility does not offer it, penalize
    if (requirePickup && !recycler.pickupAvailable) {
      score -= 2;
    }

    // 4. Weight Compatibility
    const minWeight = Number(recycler.minimumWeightKg) || 0;
    if (numWeight > 0) {
      if (numWeight >= minWeight) {
        score += 1;
        matchReasons.push(`Accepts your lot size (${numWeight} kg ≥ ${minWeight} kg min)`);
      } else {
        matchReasons.push(`Minimum lot size is ${minWeight} kg (your lot is ${numWeight} kg)`);
      }
    } else {
      matchReasons.push(`Minimum weight requirement: ${minWeight} kg`);
    }

    // 5. Condition Relevance (damaged / hazardous processing)
    if (condition && condition.toLowerCase() === 'damaged') {
      const hasSpecializedService = (recycler.services || []).some((s) => {
        const sLower = s.toLowerCase();
        return sLower.includes('neutralization') || sLower.includes('recovery') || sLower.includes('smelting') || sLower.includes('dismantling') || sLower.includes('crushing');
      });
      if (hasSpecializedService) {
        score += 1;
        matchReasons.push('Equipped for damaged e-waste & recovery processing');
      }
    }

    // 6. Verification & Authorization Clarity
    matchReasons.push('Demo verification record on file');

    matches.push({
      recycler,
      score,
      reasons: matchReasons,
      isExactMaterialMatch: true,
      isLocationMatch: locCheck.isMatch,
      isWeightCompatible: numWeight === 0 || numWeight >= minWeight,
      pickupAvailable: !!recycler.pickupAvailable
    });
  }

  // Sort by score descending, then by lower minimum weight requirement
  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return (a.recycler.minimumWeightKg || 0) - (b.recycler.minimumWeightKg || 0);
  });

  return matches;
}
