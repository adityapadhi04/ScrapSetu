/**
 * ScrapSetu — Safety Guidance Service (Module 11)
 *
 * Provides deterministic rules for assessing material hazard levels,
 * safe handling procedures, prohibited do-not actions, storage, and transport guidelines.
 *
 * Offline-first: operates purely on local static reference datasets.
 * Transparent & Educational: explicitly labeled as prototype safety guidance.
 */

import { SAFETY_CATALOG, HAZARD_LEVELS } from '../data/safetyGuidanceData.js';

// Re-export so consumers can do: import { HAZARD_LEVELS } from '...safetyGuidanceService'
export { HAZARD_LEVELS };

/**
 * Normalizes input material string for flexible matching against catalog.
 * @param {string} input
 * @returns {string}
 */
const _normalize = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.toLowerCase().trim();
};

/**
 * Find safety catalog entry matching category name, id, or alias.
 * Fallback to 'other' if no match is found.
 * @param {string} materialCategory
 * @returns {object}
 */
export const findSafetyEntry = (materialCategory) => {
  const norm = _normalize(materialCategory);
  if (!norm) {
    return SAFETY_CATALOG.find((item) => item.id === 'other') || SAFETY_CATALOG[0];
  }

  const match = SAFETY_CATALOG.find((item) => {
    if (item.id === norm) return true;
    if (_normalize(item.materialCategory) === norm) return true;
    if (item.aliases && item.aliases.some((a) => _normalize(a) === norm || norm.includes(_normalize(a)))) {
      return true;
    }
    return false;
  });

  return match || SAFETY_CATALOG.find((item) => item.id === 'other') || SAFETY_CATALOG[0];
};

/**
 * Get comprehensive safety guidance tailored to material category and condition.
 *
 * @param {string} materialCategory - e.g. 'Battery', 'PCB', 'Cable'
 * @param {string} [condition='fair'] - 'clean' | 'fair' | 'damaged' | 'burnt' | etc.
 * @returns {object} Full guidance object with adjusted hazard level and condition warning
 */
export const getSafetyGuidance = (materialCategory, condition = 'fair') => {
  const entry = findSafetyEntry(materialCategory);
  const condNorm = _normalize(condition);

  let effectiveHazardLevel = entry.hazardLevel;
  let conditionWarning = null;

  // Condition override escalation (e.g. damaged battery or burnt PCB)
  if (entry.conditionOverrides && condNorm && entry.conditionOverrides[condNorm]) {
    const override = entry.conditionOverrides[condNorm];
    if (override.hazardLevel) {
      effectiveHazardLevel = override.hazardLevel;
    }
    conditionWarning = override.urgentWarning || null;
  } else if (condNorm === 'damaged' || condNorm === 'burnt' || condNorm === 'poor') {
    // Universal condition bump for hazardous materials if damaged
    if (entry.hazardLevel === HAZARD_LEVELS.MEDIUM) {
      effectiveHazardLevel = HAZARD_LEVELS.HIGH;
    }
    if (condNorm === 'damaged') {
      conditionWarning = `Condition is marked as ${condition}. Extra caution is required due to broken edges or exposed components.`;
    }
  }

  return {
    ...entry,
    condition,
    hazardLevel: effectiveHazardLevel,
    isConditionEscalated: effectiveHazardLevel !== entry.hazardLevel || !!conditionWarning,
    conditionWarning,
    disclaimer: 'Prototype educational safety guidance. Not a certified industrial hazard assessment.',
  };
};

/**
 * Get hazard level for a material category and condition.
 * @param {string} materialCategory
 * @param {string} [condition='fair']
 * @returns {'low'|'medium'|'high'}
 */
export const getHazardLevel = (materialCategory, condition = 'fair') => {
  const guidance = getSafetyGuidance(materialCategory, condition);
  return guidance.hazardLevel;
};

/**
 * Get safe handling procedures for a material and condition.
 * @param {string} materialCategory
 * @param {string} [condition='fair']
 * @returns {string[]}
 */
export const getHandlingGuidance = (materialCategory, condition = 'fair') => {
  const guidance = getSafetyGuidance(materialCategory, condition);
  return guidance.handlingGuidance || [];
};

/**
 * Get prohibited actions (do nots) for a material and condition.
 * @param {string} materialCategory
 * @param {string} [condition='fair']
 * @returns {string[]}
 */
export const getDoNotActions = (materialCategory, condition = 'fair') => {
  const guidance = getSafetyGuidance(materialCategory, condition);
  return guidance.doNotActions || [];
};

/**
 * Get all relevant safety warnings for a material and condition.
 * @param {string} materialCategory
 * @param {string} [condition='fair']
 * @returns {string[]}
 */
export const getSafetyWarnings = (materialCategory, condition = 'fair') => {
  const guidance = getSafetyGuidance(materialCategory, condition);
  const warnings = [];
  if (guidance.conditionWarning) {
    warnings.push(guidance.conditionWarning);
  }
  if (guidance.emergencyNote) {
    warnings.push(guidance.emergencyNote);
  }
  if (guidance.doNotActions && guidance.doNotActions.length > 0) {
    warnings.push(...guidance.doNotActions);
  }
  return warnings;
};

/**
 * Retrieve the full safety catalog for reference.
 * @returns {Array<object>}
 */
export const getAllSafetyCatalog = () => {
  return SAFETY_CATALOG;
};

/**
 * Aggregate safety risk profile for a list of scrap lots.
 * Useful for Admin Safety Overview and Collector Risk summaries.
 *
 * @param {Array<object>} lots
 * @returns {{ total: number, highRisk: number, mediumRisk: number, lowRisk: number, highRiskLots: Array<object> }}
 */
export const getHazardSummaryForLots = (lots = []) => {
  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;
  const highRiskLots = [];

  for (const lot of lots) {
    const mat = lot.materialType || lot.materialCategory;
    const cond = lot.condition || 'fair';
    const level = getHazardLevel(mat, cond);

    if (level === HAZARD_LEVELS.HIGH) {
      highRisk++;
      highRiskLots.push({ ...lot, evaluatedHazardLevel: level });
    } else if (level === HAZARD_LEVELS.MEDIUM) {
      mediumRisk++;
    } else {
      lowRisk++;
    }
  }

  return {
    total: lots.length,
    highRisk,
    mediumRisk,
    lowRisk,
    highRiskLots,
  };
};

const safetyGuidanceService = {
  findSafetyEntry,
  getSafetyGuidance,
  getHazardLevel,
  getSafetyWarnings,
  getHandlingGuidance,
  getDoNotActions,
  getAllSafetyCatalog,
  getHazardSummaryForLots,
  HAZARD_LEVELS,
};

export default safetyGuidanceService;
