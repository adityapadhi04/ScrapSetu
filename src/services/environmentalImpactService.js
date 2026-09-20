/**
 * ScrapSetu — Environmental Impact Service (Module 11)
 *
 * Calculates deterministic environmental metrics from active local datasets:
 * - Material mass diverted from informal landfills / open burning
 * - Clear distinction between Reuse / Repair (Repair Shop) vs Recycling (Authorized Recycler)
 * - Collector cumulative impact & platform aggregated totals
 *
 * PROTOTYPE DISCLAIMER:
 * All metrics are clearly designated as "Prototype estimates" or "Illustrative estimates".
 */

import { ENVIRONMENTAL_FACTORS } from '../data/environmentalImpactData.js';
import { getTransactions } from './transactionService.js';
import { getAllScrapLots, getScrapLotsByCollector } from './scrapLotService.js';
import { getPayments } from './paymentService.js';

const _normalize = (input) => (typeof input === 'string' ? input.toLowerCase().trim() : '');

/**
 * Lookup environmental factor definition for a material category.
 * @param {string} materialCategory
 * @returns {object}
 */
export const getEnvironmentalFactor = (materialCategory) => {
  const norm = _normalize(materialCategory);
  if (!norm) return ENVIRONMENTAL_FACTORS[ENVIRONMENTAL_FACTORS.length - 1];

  const match = ENVIRONMENTAL_FACTORS.find((item) => {
    if (_normalize(item.materialCategory) === norm) return true;
    if (item.aliases && item.aliases.some((a) => _normalize(a) === norm || norm.includes(_normalize(a)))) {
      return true;
    }
    return false;
  });

  return match || ENVIRONMENTAL_FACTORS[ENVIRONMENTAL_FACTORS.length - 1];
};

/**
 * Calculate environmental impact potential for an individual scrap lot.
 * @param {object} lot
 * @returns {object}
 */
export const calculateLotImpact = (lot) => {
  if (!lot) return null;

  const mat = lot.materialCategory || lot.materialType || 'Other E-waste';
  const factor = getEnvironmentalFactor(mat);
  const weight = parseFloat(lot.weight) || 0;

  // Pathway distinction based on reusePotential or buyer assignment
  const reusePathway = lot.reusePotential?.pathway;
  let potentialPathway = 'Reuse or Recycling';
  if (reusePathway === 'reuse') potentialPathway = 'Reuse / Repair';
  else if (reusePathway === 'recycle') potentialPathway = 'Recycling';

  let impactLevel = 'low';
  if (weight >= 20) impactLevel = 'high';
  else if (weight >= 5) impactLevel = 'medium';

  return {
    lotId: lot.id,
    materialCategory: mat,
    materialWeight: weight,
    divertedWeight: weight,
    weightUnit: lot.weightUnit || 'kg',
    potentialPathway,
    impactLevel,
    divertedDescription: factor.divertedDescription,
    benefitSummary: potentialPathway === 'Reuse / Repair' ? factor.estimatedReuseBenefit : factor.estimatedRecyclingBenefit,
    methodology: 'Prototype estimate: 1 kg diverted per 1 kg collected and channeled formally',
    isPrototypeEstimate: true,
  };
};

/**
 * Determine if a transaction is fully completed (handover confirmed + payment recorded).
 * @param {object} tx
 * @returns {boolean}
 */
const _isTransactionCompleted = (tx) => {
  if (!tx) return false;
  if (tx.transactionStatus === 'completed') return true;
  return tx.handoverStatus === 'confirmed' && tx.paymentStatus === 'recorded';
};

/**
 * Calculate environmental impact for a transaction.
 * Strictly separates Reuse / Repair (Repair Shop) vs Recycling (Recycler).
 *
 * @param {object} tx
 * @returns {object}
 */
export const calculateTransactionImpact = (tx) => {
  if (!tx) return null;

  const weight = parseFloat(tx.weight || tx.agreedWeight) || 0;
  const mat = tx.materialCategory || tx.materialType || 'Other E-waste';
  const factor = getEnvironmentalFactor(mat);

  // Strict role classification
  const isRepairShop = tx.buyerRole === 'repair' || tx.buyerRole === 'repair-shop';
  const pathway = isRepairShop ? 'Reuse / Repair' : 'Recycling';

  const isCompleted = _isTransactionCompleted(tx);

  const reuseWeight = isCompleted && isRepairShop ? weight : 0;
  const recyclingWeight = isCompleted && !isRepairShop ? weight : 0;
  const divertedWeight = isCompleted ? weight : 0;

  let impactLevel = 'low';
  if (weight >= 20) impactLevel = 'high';
  else if (weight >= 5) impactLevel = 'medium';

  return {
    transactionId: tx.transactionId,
    lotId: tx.lotId,
    materialCategory: mat,
    materialWeight: weight,
    divertedWeight,
    reuseWeight,
    recyclingWeight,
    pathway,
    status: tx.transactionStatus,
    isCompleted,
    impactLevel,
    benefitDescription: isRepairShop ? factor.estimatedReuseBenefit : factor.estimatedRecyclingBenefit,
    methodology: 'Prototype estimate: Diverted from informal disposal / open burning',
    isPrototypeEstimate: true,
  };
};

/**
 * Calculate cumulative environmental and recovery metrics for a specific collector.
 *
 * @param {string} collectorId
 * @returns {object}
 */
export const calculateCollectorImpact = (collectorId) => {
  if (!collectorId) {
    return {
      collectorId: null,
      totalScrapHandledKg: 0,
      reuseWeightKg: 0,
      recyclingWeightKg: 0,
      divertedWeightKg: 0,
      pendingTransactionsCount: 0,
      pendingWeightKg: 0,
      completedTransactionsCount: 0,
      recordedEarnings: 0,
      lotsCount: 0,
      materialBreakdown: {},
      methodology: 'Prototype estimate: calculated from confirmed local transactions and created scrap lots.',
    };
  }

  const allTx = getTransactions();
  const collectorTx = allTx.filter((t) => t.collectorId === collectorId);

  const collectorLots = getScrapLotsByCollector(collectorId);

  let reuseWeightKg = 0;
  let recyclingWeightKg = 0;
  let divertedWeightKg = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let pendingWeightKg = 0;
  const materialBreakdown = {};

  for (const tx of collectorTx) {
    const w = parseFloat(tx.weight || tx.agreedWeight) || 0;
    const isRepair = tx.buyerRole === 'repair' || tx.buyerRole === 'repair-shop';
    const completed = _isTransactionCompleted(tx);

    const mat = tx.materialCategory || tx.materialType || 'Other E-waste';
    materialBreakdown[mat] = (materialBreakdown[mat] || 0) + w;

    if (completed) {
      completedCount++;
      divertedWeightKg += w;
      if (isRepair) {
        reuseWeightKg += w;
      } else {
        recyclingWeightKg += w;
      }
    } else if (tx.transactionStatus !== 'cancelled' && tx.transactionStatus !== 'failed') {
      pendingCount++;
      pendingWeightKg += w;
    }
  }

  // Total scrap handled: sum of lots created by collector, or completed transactions weight, whichever is higher
  const lotsTotalWeight = collectorLots.reduce((acc, l) => acc + (parseFloat(l.weight) || 0), 0);
  const totalScrapHandledKg = Math.max(lotsTotalWeight, divertedWeightKg + pendingWeightKg);

  // Compute recorded earnings from payments associated with this collector
  const payments = getPayments().filter(
    (p) => p.collectorId === collectorId && p.paymentStatus === 'recorded'
  );
  const recordedEarnings = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  return {
    collectorId,
    totalScrapHandledKg: Math.round(totalScrapHandledKg * 10) / 10,
    reuseWeightKg: Math.round(reuseWeightKg * 10) / 10,
    recyclingWeightKg: Math.round(recyclingWeightKg * 10) / 10,
    divertedWeightKg: Math.round(divertedWeightKg * 10) / 10,
    pendingTransactionsCount: pendingCount,
    pendingWeightKg: Math.round(pendingWeightKg * 10) / 10,
    completedTransactionsCount: completedCount,
    recordedEarnings: Math.round(recordedEarnings),
    lotsCount: collectorLots.length,
    materialBreakdown,
    methodology: 'Prototype estimate: calculated from confirmed local transactions and created scrap lots.',
    isPrototypeEstimate: true,
  };
};

/**
 * Calculate platform-wide aggregated environmental impact metrics for Admin.
 *
 * @returns {object}
 */
export const calculatePlatformImpact = () => {
  const allTx = getTransactions();
  const allLots = getAllScrapLots();

  let totalReuseKg = 0;
  let totalRecyclingKg = 0;
  let totalDivertedKg = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let totalHandledKg = 0;
  const materialTotals = {};

  for (const tx of allTx) {
    const w = parseFloat(tx.weight || tx.agreedWeight) || 0;
    const isRepair = tx.buyerRole === 'repair' || tx.buyerRole === 'repair-shop';
    const completed = _isTransactionCompleted(tx);

    const mat = tx.materialCategory || tx.materialType || 'Other E-waste';
    materialTotals[mat] = (materialTotals[mat] || 0) + w;

    if (completed) {
      completedCount++;
      totalDivertedKg += w;
      if (isRepair) totalReuseKg += w;
      else totalRecyclingKg += w;
    } else if (tx.transactionStatus !== 'cancelled' && tx.transactionStatus !== 'failed') {
      pendingCount++;
    }
  }

  const lotsTotalKg = allLots.reduce((acc, l) => acc + (parseFloat(l.weight) || 0), 0);
  totalHandledKg = Math.max(lotsTotalKg, totalDivertedKg);

  const payments = getPayments().filter((p) => p.paymentStatus === 'recorded');
  const totalRecordedValue = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  return {
    totalScrapHandledKg: Math.round(totalHandledKg * 10) / 10,
    reuseWeightKg: Math.round(totalReuseKg * 10) / 10,
    recyclingWeightKg: Math.round(totalRecyclingKg * 10) / 10,
    divertedWeightKg: Math.round(totalDivertedKg * 10) / 10,
    completedTransactionsCount: completedCount,
    pendingTransactionsCount: pendingCount,
    totalLotsCount: allLots.length,
    totalRecordedValue: Math.round(totalRecordedValue),
    materialTotals,
    distinctMaterialsCount: Object.keys(materialTotals).length,
    methodology: 'Prototype estimate: aggregated from local platform transactions and lots.',
    isPrototypeEstimate: true,
  };
};

/**
 * Calculate impact for a specified material and weight with pathway.
 * @param {string} materialCategory
 * @param {number} [weight=0]
 * @param {string} [pathway='recycle']
 * @returns {object}
 */
export const calculateMaterialImpact = (materialCategory, weight = 0, pathway = 'recycle') => {
  const factor = getEnvironmentalFactor(materialCategory);
  const numWeight = parseFloat(weight) || 0;
  const isReuse = pathway === 'reuse' || pathway === 'repair' || pathway === 'Reuse / Repair';
  const effectivePathway = isReuse ? 'Reuse / Repair' : 'Recycling';
  const benefit = isReuse ? factor.estimatedReuseBenefit : factor.estimatedRecyclingBenefit;

  let impactLevel = 'low';
  if (numWeight >= 20) impactLevel = 'high';
  else if (numWeight >= 5) impactLevel = 'medium';

  return {
    materialCategory,
    weight: numWeight,
    divertedWeightKg: Math.round(numWeight * factor.estimatedAvoidedWasteKgPerKg * 10) / 10,
    pathway: effectivePathway,
    benefit,
    impactLevel,
    divertedDescription: factor.divertedDescription,
    methodology: 'Prototype environmental estimate based on material mass diversion.',
    isPrototypeEstimate: true,
  };
};

/**
 * Get pathway-specific environmental impact for weight and material.
 * @param {string} pathway - 'reuse' | 'recycle'
 * @param {number} [weight=0]
 * @param {string} [materialCategory='Other E-waste']
 * @returns {object}
 */
export const getPathwayImpact = (pathway, weight = 0, materialCategory = 'Other E-waste') => {
  return calculateMaterialImpact(materialCategory, weight, pathway);
};

const environmentalImpactService = {
  getEnvironmentalFactor,
  calculateLotImpact,
  calculateTransactionImpact,
  calculateCollectorImpact,
  calculatePlatformImpact,
  calculateMaterialImpact,
  getPathwayImpact,
};

export default environmentalImpactService;
