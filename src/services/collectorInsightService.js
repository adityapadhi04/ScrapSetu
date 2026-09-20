/**
 * ScrapSetu — Collector Insights Service (Module 11)
 *
 * Generates simple, deterministic, rule-based insights directly from active local
 * transactions, scrap lots, and payments.
 *
 * RULES:
 * - Deterministic rules only: no ML, no predictive guessing, no fabricated trends.
 * - If insufficient data, returns clear "No insight available yet" notice.
 */

import { calculateCollectorImpact } from './environmentalImpactService.js';

/**
 * Generate practical, deterministic insights for a collector based on their real activity.
 *
 * @param {string} collectorId
 * @returns {{ insights: Array<string>, summary: object, hasData: boolean }}
 */
export const getCollectorInsights = (collectorId) => {
  if (!collectorId) {
    return {
      insights: ['No insight available yet. Create and complete scrap transactions to see activity insights.'],
      summary: null,
      hasData: false,
    };
  }

  const impact = calculateCollectorImpact(collectorId);
  const insights = [];

  // 1. Transaction volume insight
  if (impact.completedTransactionsCount > 0) {
    insights.push(
      `You have completed ${impact.completedTransactionsCount} scrap transaction${
        impact.completedTransactionsCount > 1 ? 's' : ''
      }.`
    );
  } else if (impact.lotsCount > 0) {
    insights.push(`You have created ${impact.lotsCount} scrap lot${impact.lotsCount > 1 ? 's' : ''} on the platform.`);
  }

  // 2. Reuse vs Recycling breakdown insight
  if (impact.reuseWeightKg > 0 && impact.recyclingWeightKg > 0) {
    if (impact.reuseWeightKg >= impact.recyclingWeightKg) {
      insights.push(
        `Major circular contribution: You channeled ${impact.reuseWeightKg} kg of components to repair shops for reuse before recycling.`
      );
    } else {
      insights.push(
        `Most of your recorded scrap (${impact.recyclingWeightKg} kg) was processed through authorized recyclers, with ${impact.reuseWeightKg} kg channeled to repair reuse.`
      );
    }
  } else if (impact.reuseWeightKg > 0) {
    insights.push(`You channeled ${impact.reuseWeightKg} kg of material into repair and direct component reuse.`);
  } else if (impact.recyclingWeightKg > 0) {
    insights.push(`Most of your recorded scrap (${impact.recyclingWeightKg} kg) was channeled into formal recycling.`);
  }

  // 3. Material category insight
  const breakdownEntries = Object.entries(impact.materialBreakdown || {});
  if (breakdownEntries.length > 0) {
    // Sort to find most common material
    breakdownEntries.sort((a, b) => b[1] - a[1]);
    const [topMaterial, topWeight] = breakdownEntries[0];
    insights.push(
      `Your most frequently handled material category is ${topMaterial} (${Math.round(topWeight * 10) / 10} kg).`
    );
  }

  // 4. Earnings insight
  if (impact.recordedEarnings > 0) {
    insights.push(
      `You have accumulated ₹${impact.recordedEarnings.toLocaleString('en-IN')} in recorded earnings from completed scrap transactions.`
    );
  }

  // 5. Pending activity insight
  if (impact.pendingTransactionsCount > 0) {
    insights.push(
      `You currently have ${impact.pendingTransactionsCount} transaction${
        impact.pendingTransactionsCount > 1 ? 's' : ''
      } pending handover or payment.`
    );
  }

  const hasData = insights.length > 0;

  if (!hasData) {
    insights.push('No insight available yet. Create lots and complete transactions to view your personal environmental and earnings summary.');
  }

  return {
    insights,
    summary: impact,
    hasData,
  };
};

const collectorInsightService = {
  getCollectorInsights,
};

export default collectorInsightService;
