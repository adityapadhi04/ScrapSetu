/**
 * ScrapSetu — Admin Analytics Service (Module 12)
 *
 * Aggregates existing localStorage datasets to provide Admin-facing
 * platform analytics and reporting.
 *
 * PRINCIPLES:
 * - Reads ONLY from existing data services; creates no new data models.
 * - All calculations are deterministic and transparent.
 * - Insufficient data → returns explicit empty/null indicators.
 * - No ML, no AI prediction, no fabricated numbers.
 * - Does NOT enqueue any analytics operations into the sync queue.
 * - Admin-only; caller is responsible for role authorization.
 *
 * PROTOTYPE DISCLAIMER:
 * All analytics are derived from local localStorage prototype data.
 * Not connected to live market feeds, government systems, or real financial records.
 */

import { calculatePlatformImpact } from './environmentalImpactService.js';
import { getHazardSummaryForLots } from './safetyGuidanceService.js';
import { getQueueStats } from './syncQueueService.js';
import { isOnline } from './offlineService.js';

// ─── Raw localStorage readers (no auto-seeding side effects) ─────────────────
//
// Analytics reads data directly from localStorage without going through the
// application service layer. This ensures:
//   - Analytics functions are pure (no writes, no side effects)
//   - Empty storage correctly returns empty arrays (not seed data)
//   - Test isolation is preserved

const _readRaw = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
};

const _getLots = () => _readRaw('scrapsetu_scrap_lots');
const _getTransactions = () => _readRaw('scrapsetu_transactions');
const _getOffers = () => _readRaw('scrapsetu_offers');
const _getPayments = () => _readRaw('scrapsetu_payments');
const _getPriceRecords = () => _readRaw('scrapsetu_price_dataset');
const _getRepairShops = () => _readRaw('scrapsetu_repair_shops');
const _getRecyclers = () => _readRaw('scrapsetu_recycler_dataset');
const _getMaterialRecords = () => _readRaw('scrapsetu_material_dataset');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const _round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const _round1 = (n) => Math.round((n + Number.EPSILON) * 10) / 10;

/** Extract a city/area label from a location field (string or object). */
const _locationLabel = (location) => {
  if (!location) return 'Unknown';
  if (typeof location === 'string') return location.trim() || 'Unknown';
  if (typeof location === 'object') {
    return location.city || location.area || location.state || 'Unknown';
  }
  return 'Unknown';
};

/** Group an array by a key extractor and count occurrences. */
const _groupCount = (arr, keyFn) => {
  const map = {};
  for (const item of arr) {
    const key = keyFn(item) || 'Unknown';
    map[key] = (map[key] || 0) + 1;
  }
  return map;
};

/** Group an array by a key extractor and sum a numeric field. */
const _groupSum = (arr, keyFn, valueFn) => {
  const map = {};
  for (const item of arr) {
    const key = keyFn(item) || 'Unknown';
    map[key] = (map[key] || 0) + (valueFn(item) || 0);
  }
  return map;
};

/** Convert a count map to sorted [{label, count}] array. */
const _mapToSortedList = (map, valueKey = 'count') =>
  Object.entries(map)
    .map(([label, value]) => ({ label, [valueKey]: value }))
    .sort((a, b) => b[valueKey] - a[valueKey]);

/** Compute avg, min, max, median from a numeric array. */
const _stats = (arr) => {
  if (!arr || arr.length === 0) return { count: 0, avg: null, min: null, max: null, median: null };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  const count = sorted.length;
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    count,
    avg: _round2(sum / count),
    min: _round2(sorted[0]),
    max: _round2(sorted[count - 1]),
    median: _round2(median),
  };
};

/** Extract unique collector IDs from lots/transactions. */
const _distinctCollectors = (lots) => {
  const ids = new Set(lots.map((l) => l.collectorId).filter(Boolean));
  return [...ids];
};

// ─── 1. Platform Overview ─────────────────────────────────────────────────────

/**
 * High-level platform snapshot for the Admin Overview panel.
 * Reads: lots, offers, transactions, repair shops, recyclers, payments.
 * @returns {object}
 */
export const getPlatformOverview = () => {
  const lots = _getLots();
  const offers = _getOffers();
  const transactions = _getTransactions();
  const repairShops = _getRepairShops();
  const recyclers = _getRecyclers();
  const payments = _getPayments();

  const totalLots = lots.length;
  const totalWeight = _round1(lots.reduce((s, l) => s + (parseFloat(l.weight) || 0), 0));
  const completedLots = lots.filter((l) => l.transactionStatus === 'completed').length;
  const pendingLots = lots.filter(
    (l) => !l.transactionStatus || l.transactionStatus === 'created'
  ).length;

  const distinctCollectors = _distinctCollectors(lots);

  const totalOffers = offers.length;
  const acceptedOffers = offers.filter((o) => o.status === 'accepted').length;
  const activeOffers = offers.filter((o) => o.status === 'submitted' || o.status === 'viewed').length;
  const rejectedOffers = offers.filter((o) => o.status === 'rejected').length;
  const offerAcceptanceRate =
    totalOffers > 0 ? _round2((acceptedOffers / totalOffers) * 100) : null;

  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter((t) => t.transactionStatus === 'completed').length;
  const pendingTransactions = transactions.filter(
    (t) => t.transactionStatus !== 'completed' && t.transactionStatus !== 'cancelled'
  ).length;
  const cancelledTransactions = transactions.filter((t) => t.transactionStatus === 'cancelled').length;

  const recordedPayments = payments.filter((p) => p.paymentStatus === 'recorded');
  const totalRecordedValue = Math.round(
    recordedPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  );

  const activeRepairShops = repairShops.filter((r) => r.status === 'active').length;
  const activeRecyclers = recyclers.filter((r) => r.status === 'active').length;

  return {
    lots: { total: totalLots, totalWeight, completed: completedLots, pending: pendingLots },
    collectors: { distinct: distinctCollectors.length, ids: distinctCollectors },
    offers: {
      total: totalOffers,
      accepted: acceptedOffers,
      active: activeOffers,
      rejected: rejectedOffers,
      acceptanceRate: offerAcceptanceRate,
    },
    transactions: {
      total: totalTransactions,
      completed: completedTransactions,
      pending: pendingTransactions,
      cancelled: cancelledTransactions,
    },
    payments: { totalRecordedValue },
    partners: {
      repairShops: { total: repairShops.length, active: activeRepairShops },
      recyclers: { total: recyclers.length, active: activeRecyclers },
    },
    disclaimer:
      'Platform prototype analytics — derived from local application data only. Not connected to live government or financial systems.',
  };
};

// ─── 2. Material Analytics ───────────────────────────────────────────────────

/**
 * Material category distribution, weight distribution, condition breakdown.
 * Reads: lots, material dataset.
 * @returns {object}
 */
export const getMaterialAnalytics = () => {
  const lots = _getLots();
  const materialRecords = _getMaterialRecords();

  if (lots.length === 0 && materialRecords.length === 0) {
    return { hasData: false, totalLots: 0, totalWeightKg: 0 };
  }

  const categoryCount = _groupCount(lots, (l) => l.materialType || l.materialCategory);
  const categoryWeight = _groupSum(
    lots,
    (l) => l.materialType || l.materialCategory,
    (l) => parseFloat(l.weight) || 0
  );
  const conditionCount = _groupCount(lots, (l) => l.condition);

  const totalWeightKg = _round1(lots.reduce((s, l) => s + (parseFloat(l.weight) || 0), 0));

  // Weight stats
  const weights = lots.map((l) => parseFloat(l.weight) || 0).filter((w) => w > 0);
  const weightStats = _stats(weights);

  // Category table
  const categoryTable = Object.entries(categoryCount).map(([category, count]) => ({
    category,
    count,
    totalWeightKg: _round1(categoryWeight[category] || 0),
    share: lots.length > 0 ? _round2((count / lots.length) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const topMaterial = categoryTable.length > 0 ? categoryTable[0].category : null;

  return {
    hasData: lots.length > 0,
    totalLots: lots.length,
    totalWeightKg,
    weightStats,
    categoryTable,
    conditionBreakdown: _mapToSortedList(conditionCount),
    topMaterial,
    materialRecordCount: materialRecords.length,
    disclaimer: 'Prototype dataset — derived from collector scrap lot submissions.',
  };
};

// ─── 3. Reuse vs Recycle Analytics ───────────────────────────────────────────

/**
 * Strict Reuse / Repair Shop vs Authorized Recycling pathway analytics.
 * buyerRole 'repair' → Reuse / Repair
 * buyerRole 'recycler' → Authorized Recycling
 *
 * RULE: Repair Shops are NOT Authorized Recyclers. Never merge them.
 * @returns {object}
 */
export const getReuseRecycleAnalytics = () => {
  const transactions = _getTransactions();

  const reuseTransactions = transactions.filter(
    (t) => t.buyerRole === 'repair' || t.buyerRole === 'repair-shop'
  );
  const recycleTransactions = transactions.filter((t) => t.buyerRole === 'recycler');

  const _summarize = (txList) => {
    const total = txList.length;
    const completed = txList.filter((t) => t.transactionStatus === 'completed').length;
    const totalWeightKg = _round1(txList.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0));
    const completedWeightKg = _round1(
      txList
        .filter((t) => t.transactionStatus === 'completed')
        .reduce((s, t) => s + (parseFloat(t.weight) || 0), 0)
    );
    return { total, completed, totalWeightKg, completedWeightKg };
  };

  const reuseStats = _summarize(reuseTransactions);
  const recycleStats = _summarize(recycleTransactions);
  const totalTx = transactions.length;

  return {
    hasData: totalTx > 0,
    reuse: {
      label: 'Reuse / Repair (Repair Shop)',
      ...reuseStats,
      shareOfTransactions: totalTx > 0 ? _round2((reuseStats.total / totalTx) * 100) : null,
    },
    recycle: {
      label: 'Authorized Recycling (Recycler)',
      ...recycleStats,
      shareOfTransactions: totalTx > 0 ? _round2((recycleStats.total / totalTx) * 100) : null,
    },
    totalTransactions: totalTx,
    note: 'Repair Shops enable component reuse. Authorized Recyclers perform formal material recovery. These are distinct pathways.',
  };
};

// ─── 4. Offer Analytics ──────────────────────────────────────────────────────

/**
 * Offer statistics by status, by buyer role, value.
 * @returns {object}
 */
export const getOfferAnalytics = () => {
  const offers = _getOffers();
  if (offers.length === 0) return { hasData: false };

  const byStatus = _groupCount(offers, (o) => o.status);
  const byRole = _groupCount(offers, (o) => o.buyerRole);
  const byMaterial = _groupCount(offers, (o) => o.materialCategory);

  const repairOffers = offers.filter((o) => o.buyerRole === 'repair');
  const recyclerOffers = offers.filter((o) => o.buyerRole === 'recycler');

  const accepted = offers.filter((o) => o.status === 'accepted').length;
  const submitted = offers.filter((o) => o.status === 'submitted').length;
  const rejected = offers.filter((o) => o.status === 'rejected').length;
  const withdrawn = offers.filter((o) => o.status === 'withdrawn').length;

  const totalValue = _round2(offers.reduce((s, o) => s + (o.totalOfferValue || 0), 0));
  const acceptedValue = _round2(
    offers.filter((o) => o.status === 'accepted').reduce((s, o) => s + (o.totalOfferValue || 0), 0)
  );

  const acceptanceRate =
    offers.length > 0 ? _round2((accepted / offers.length) * 100) : null;

  return {
    hasData: true,
    total: offers.length,
    byStatus: { accepted, submitted, rejected, withdrawn },
    byRole: {
      repair: { count: repairOffers.length, label: 'Repair Shop (Reuse)' },
      recycler: { count: recyclerOffers.length, label: 'Authorized Recycler (Recycling)' },
    },
    topMaterials: _mapToSortedList(byMaterial).slice(0, 5),
    totalValue,
    acceptedValue,
    acceptanceRate,
  };
};

// ─── 5. Transaction Analytics ─────────────────────────────────────────────────

/**
 * Transaction statistics, value, status breakdown, pathway breakdown.
 * @returns {object}
 */
export const getTransactionAnalytics = () => {
  const transactions = _getTransactions();
  const payments = _getPayments();

  if (transactions.length === 0) return { hasData: false };

  const byStatus = _groupCount(transactions, (t) => t.transactionStatus);
  const byRole = {
    repair: transactions.filter((t) => t.buyerRole === 'repair' || t.buyerRole === 'repair-shop').length,
    recycler: transactions.filter((t) => t.buyerRole === 'recycler').length,
  };

  const completed = transactions.filter((t) => t.transactionStatus === 'completed').length;
  const pending = transactions.filter(
    (t) => t.transactionStatus !== 'completed' && t.transactionStatus !== 'cancelled'
  ).length;
  const cancelled = transactions.filter((t) => t.transactionStatus === 'cancelled').length;

  const totalWeightKg = _round1(
    transactions.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0)
  );

  const recordedPayments = payments.filter((p) => p.paymentStatus === 'recorded');
  const totalRecordedValue = Math.round(
    recordedPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  );

  const byMaterial = _groupCount(transactions, (t) => t.materialCategory);
  const byPaymentMethod = _groupCount(
    payments.filter((p) => p.paymentStatus === 'recorded'),
    (p) => p.paymentMethod
  );

  return {
    hasData: true,
    total: transactions.length,
    completed,
    pending,
    cancelled,
    totalWeightKg,
    totalRecordedValue,
    byStatus: _mapToSortedList(byStatus),
    byRole,
    topMaterials: _mapToSortedList(byMaterial).slice(0, 5),
    paymentMethods: _mapToSortedList(byPaymentMethod),
    disclaimer: 'Prototype transaction records only — no real payment or bank settlement.',
  };
};

// ─── 6. Price Analytics ───────────────────────────────────────────────────────

/**
 * Historical price analytics from the price dataset.
 * Clearly labeled as prototype historical data, not real-time market prices.
 * @returns {object}
 */
export const getPriceAnalytics = () => {
  const records = _getPriceRecords();
  if (records.length === 0) return { hasData: false };

  // Per-material stats
  const byMaterial = {};
  for (const r of records) {
    const cat = r.materialCategory || 'Unknown';
    if (!byMaterial[cat]) byMaterial[cat] = [];
    if (r.pricePerKg != null) byMaterial[cat].push(parseFloat(r.pricePerKg));
  }

  const materialPriceTable = Object.entries(byMaterial).map(([category, prices]) => {
    const s = _stats(prices);
    return { category, ...s };
  }).sort((a, b) => (b.avg || 0) - (a.avg || 0));

  // By location
  const byLocation = _groupCount(records, (r) => _locationLabel(r.location));

  return {
    hasData: true,
    totalRecords: records.length,
    materialPriceTable,
    locationBreakdown: _mapToSortedList(byLocation),
    disclaimer:
      'Platform prototype price data — sourced from demo seed and collector-submitted records. Prices are indicative only and are not verified against current or live market data.',
  };
};

// ─── 7. Location Analytics ───────────────────────────────────────────────────

/**
 * Geographic distribution of lots, transactions using city/area fields.
 * Does NOT use GPS. Uses existing location string/object fields only.
 * @returns {object}
 */
export const getLocationAnalytics = () => {
  const lots = _getLots();
  const transactions = _getTransactions();

  if (lots.length === 0) return { hasData: false };

  const lotsByLocation = _groupCount(lots, (l) => _locationLabel(l.location));
  const weightByLocation = _groupSum(
    lots,
    (l) => _locationLabel(l.location),
    (l) => parseFloat(l.weight) || 0
  );
  const txByLocation = _groupCount(transactions, (t) => _locationLabel(t.location));

  const locationTable = Object.keys(lotsByLocation).map((loc) => ({
    location: loc,
    lots: lotsByLocation[loc] || 0,
    totalWeightKg: _round1(weightByLocation[loc] || 0),
    transactions: txByLocation[loc] || 0,
  })).sort((a, b) => b.lots - a.lots);

  return {
    hasData: true,
    locationTable,
    totalLocations: locationTable.length,
    note: 'Location data from collector-entered city/area fields. No GPS tracking is used.',
  };
};

// ─── 8. Collector Analytics ───────────────────────────────────────────────────

/**
 * Aggregate collector activity from lots and transactions.
 * Does NOT expose unnecessary private collector info.
 * @returns {object}
 */
export const getCollectorAnalytics = () => {
  const lots = _getLots();
  const transactions = _getTransactions();
  const payments = _getPayments();

  const distinctIds = _distinctCollectors(lots);
  if (distinctIds.length === 0) return { hasData: false };

  const perCollector = distinctIds.map((cid) => {
    const cLots = lots.filter((l) => l.collectorId === cid);
    const cTx = transactions.filter((t) => t.collectorId === cid);
    const cPay = payments.filter((p) => p.collectorId === cid && p.paymentStatus === 'recorded');

    const totalLots = cLots.length;
    const totalWeightKg = _round1(cLots.reduce((s, l) => s + (parseFloat(l.weight) || 0), 0));
    const completedTx = cTx.filter((t) => t.transactionStatus === 'completed').length;
    const totalEarnings = Math.round(cPay.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0));

    return { collectorId: cid, totalLots, totalWeightKg, completedTx, totalEarnings };
  });

  const totalWeight = _round1(perCollector.reduce((s, c) => s + c.totalWeightKg, 0));
  const avgLotsPerCollector =
    perCollector.length > 0 ? _round1(lots.length / perCollector.length) : 0;

  return {
    hasData: true,
    totalCollectors: distinctIds.length,
    totalLots: lots.length,
    totalWeightKg: totalWeight,
    avgLotsPerCollector,
    perCollector,
  };
};

// ─── 9. Buyer / Partner Analytics ────────────────────────────────────────────

/**
 * Separate analytics for Repair Shops (Reuse pathway) and
 * Authorized Recyclers (Recycling pathway).
 * RULE: These two roles must NEVER be merged into one category.
 * @returns {object}
 */
export const getBuyerAnalytics = () => {
  const repairShops = _getRepairShops();
  const recyclers = _getRecyclers();
  const wantedItems = [];
  const offers = _getOffers();
  const transactions = _getTransactions();

  const repairOffers = offers.filter((o) => o.buyerRole === 'repair');
  const recyclerOffers = offers.filter((o) => o.buyerRole === 'recycler');
  const repairTx = transactions.filter(
    (t) => t.buyerRole === 'repair' || t.buyerRole === 'repair-shop'
  );
  const recyclerTx = transactions.filter((t) => t.buyerRole === 'recycler');

  return {
    repairShops: {
      label: 'Repair Shops (Reuse / Repair Pathway)',
      total: repairShops.length,
      active: repairShops.filter((r) => r.status === 'active').length,
      wantedItems: wantedItems.length,
      offers: repairOffers.length,
      transactions: repairTx.length,
      completedTransactions: repairTx.filter((t) => t.transactionStatus === 'completed').length,
    },
    recyclers: {
      label: 'Authorized Recyclers (Formal Recycling Pathway)',
      total: recyclers.length,
      active: recyclers.filter((r) => r.status === 'active').length,
      offers: recyclerOffers.length,
      transactions: recyclerTx.length,
      completedTransactions: recyclerTx.filter((t) => t.transactionStatus === 'completed').length,
    },
    note: 'Repair Shops and Authorized Recyclers are distinct partner categories with separate roles in the e-waste chain.',
  };
};

// ─── 10. Safety Analytics ─────────────────────────────────────────────────────

/**
 * Safety risk summary from scrap lots.
 * Uses Module 11 safety guidance service.
 * @returns {object}
 */
export const getSafetyAnalytics = () => {
  const lots = _getLots();
  if (lots.length === 0) return { hasData: false };

  const summary = getHazardSummaryForLots(lots);

  const batteryLots = lots.filter(
    (l) =>
      (l.materialType || l.materialCategory || '')
        .toLowerCase()
        .includes('battery')
  );
  const damagedBatteries = batteryLots.filter(
    (l) => l.condition === 'damaged' || l.condition === 'burnt'
  );

  const byMaterial = _groupCount(
    summary.highRiskLots,
    (l) => l.materialType || l.materialCategory
  );

  return {
    hasData: true,
    totalLots: lots.length,
    highRisk: summary.highRisk,
    mediumRisk: summary.mediumRisk,
    lowRisk: summary.lowRisk,
    highRiskMaterials: _mapToSortedList(byMaterial),
    batteries: { total: batteryLots.length, damaged: damagedBatteries.length },
    disclaimer:
      'Prototype safety classification based on material category and condition. Not a certified industrial hazard assessment.',
  };
};

// ─── 11. Environmental Analytics ─────────────────────────────────────────────

/**
 * Platform environmental impact — delegates to environmentalImpactService.
 * Always labeled as prototype estimates.
 * @returns {object}
 */
export const getEnvironmentalAnalytics = () => {
  const impact = calculatePlatformImpact();
  return {
    ...impact,
    disclaimer:
      'Prototype environmental estimate based on material mass diversion. These figures are indicative only and have no regulatory standing or formal verification.',
  };
};

// ─── 12. Platform Activity Timeline ──────────────────────────────────────────

/**
 * Activity timeline grouped by day using actual timestamps.
 * Does NOT manufacture historical dates.
 * @returns {object}
 */
export const getPlatformActivityTimeline = () => {
  const lots = _getLots();
  const transactions = _getTransactions();
  const offers = _getOffers();

  if (lots.length + transactions.length + offers.length === 0) {
    return { hasData: false, days: [] };
  }

  // Build a map of date → { lots, transactions, offers }
  const dayMap = {};

  const _addDay = (isoStr, field) => {
    if (!isoStr) return;
    try {
      const day = isoStr.slice(0, 10); // YYYY-MM-DD
      if (!dayMap[day]) dayMap[day] = { lots: 0, transactions: 0, offers: 0 };
      dayMap[day][field]++;
    } catch (_) { /* ignore */ }
  };

  lots.forEach((l) => _addDay(l.createdAt, 'lots'));
  transactions.forEach((t) => _addDay(t.createdAt, 'transactions'));
  offers.forEach((o) => _addDay(o.createdAt, 'offers'));

  const days = Object.entries(dayMap)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalActivity = days.reduce(
    (s, d) => ({ lots: s.lots + d.lots, transactions: s.transactions + d.transactions, offers: s.offers + d.offers }),
    { lots: 0, transactions: 0, offers: 0 }
  );

  return {
    hasData: days.length > 0,
    days,
    totalActivity,
    note: 'Activity derived from actual record timestamps in local storage.',
  };
};

// ─── 13. Sync Health Analytics ────────────────────────────────────────────────

/**
 * Sync queue health for Admin monitoring.
 * @returns {object}
 */
export const getSyncHealthAnalytics = () => {
  const queueStats = getQueueStats();
  // Coerce to boolean — navigator.onLine may be undefined in non-browser environments
  const online = typeof isOnline === 'function' ? !!isOnline() : true;

  return {
    isOnline: online,
    ...queueStats,
    disclaimer: 'Sync queue reflects local operation queue status only.',
  };
};

// ─── 14. CSV Export Utility ───────────────────────────────────────────────────

/**
 * Export an array of objects as a CSV file using browser download.
 * Data must come from actual application data — no fabricated records.
 *
 * @param {Array<object>} rows - Data rows (array of plain objects)
 * @param {string} [filename='scrapsetu_export.csv'] - Download filename
 * @param {string[]} [columns] - Optional column keys; defaults to all keys in first row
 */
export const exportToCsv = (rows, filename = 'scrapsetu_export.csv', columns = null) => {
  if (!rows || rows.length === 0) {
    console.warn('[adminAnalyticsService] exportToCsv: no data to export');
    return;
  }

  const cols = columns || Object.keys(rows[0]);
  const header = cols.join(',');
  const csvRows = rows.map((row) =>
    cols
      .map((col) => {
        const val = row[col] ?? '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        // Escape double-quotes by doubling them; wrap in quotes if contains comma/newline/quote
        const escaped = str.replace(/"/g, '""');
        return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      })
      .join(',')
  );

  const csvContent = [header, ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Default Export ───────────────────────────────────────────────────────────

const adminAnalyticsService = {
  getPlatformOverview,
  getMaterialAnalytics,
  getReuseRecycleAnalytics,
  getOfferAnalytics,
  getTransactionAnalytics,
  getPriceAnalytics,
  getLocationAnalytics,
  getCollectorAnalytics,
  getBuyerAnalytics,
  getSafetyAnalytics,
  getEnvironmentalAnalytics,
  getPlatformActivityTimeline,
  getSyncHealthAnalytics,
  exportToCsv,
};

export default adminAnalyticsService;
