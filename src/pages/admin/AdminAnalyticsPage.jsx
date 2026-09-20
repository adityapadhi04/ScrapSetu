/**
 * ScrapSetu — Admin Platform Analytics Page (Module 12)
 *
 * Decision-support platform analytics derived from real application data.
 *
 * KEY RULES:
 * - Admin-only role authorization guard.
 * - Displays REAL data from adminAnalyticsService; no fake numbers.
 * - Handles empty/insufficient data gracefully with explicit indicators.
 * - Full CSV export capabilities across datasets.
 * - 13 distinct sections:
 *   1. Overview
 *   2. Materials
 *   3. Reuse vs Recycling
 *   4. Offers
 *   5. Transactions
 *   6. Prices
 *   7. Locations
 *   8. Collectors
 *   9. Repair Shops
 *   10. Authorized Recyclers
 *   11. Safety
 *   12. Environmental
 *   13. Activity
 *
 * PROTOTYPE DISCLAIMER:
 * All metrics are derived from local prototype data. Not connected to
 * government, live market, or certified environmental systems.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart3, Package, Users, Store, Recycle, IndianRupee, MapPin,
  ShieldAlert, Leaf, Activity, Wifi, WifiOff, Download,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
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
} from '../../services/adminAnalyticsService';

// ─── Mini chart components (SVG/CSS based, no external lib) ───────────────────

/** Simple horizontal bar chart */
const HBarChart = ({ data, valueKey = 'count', labelKey = 'label', colorFn }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {data.map((row, idx) => {
        const val = row[valueKey] || 0;
        const pct = (val / maxVal) * 100;
        const color = colorFn ? colorFn(row, idx) : '#15803d';
        return (
          <div key={row[labelKey] || idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>{row[labelKey]}</span>
              <span style={{ color, fontWeight: 800 }}>{typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}</span>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease',
                  minWidth: val > 0 ? '4px' : '0'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Simple donut-style percentage display (CSS only) */
const PathwaySplit = ({ reuseCount, recycleCount }) => {
  const total = reuseCount + recycleCount;
  if (total === 0) return <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No pathway data yet.</div>;
  const reusePct = Math.round((reuseCount / total) * 100);
  const recyclePct = 100 - reusePct;
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '120px' }}>
        <div style={{ height: '20px', borderRadius: '10px', overflow: 'hidden', display: 'flex', background: '#e2e8f0' }}>
          <div style={{ width: `${reusePct}%`, background: '#d97706', transition: 'width 0.4s' }} />
          <div style={{ width: `${recyclePct}%`, background: '#0284c7', transition: 'width 0.4s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontWeight: 700 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
          Reuse {reusePct}%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: 700 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
          Recycling {recyclePct}%
        </span>
      </div>
    </div>
  );
};

// ─── Reusable UI sub-components ──────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, color = '#15803d', subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
    {Icon && <Icon size={22} color={color} />}
    <div>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>{subtitle}</p>}
    </div>
  </div>
);

const StatCard = ({ label, value, unit, color = '#0f172a', bg = '#f8fafc', icon: Icon, iconColor }) => (
  <div style={{ background: bg, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
    {Icon && <Icon size={20} color={iconColor || color} style={{ marginBottom: '6px' }} />}
    <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{value ?? '—'}</div>
    {unit && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{unit}</div>}
    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '6px' }}>{label}</div>
  </div>
);

const NoDataState = ({ message = 'Not enough data yet.' }) => (
  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
    <Info size={28} style={{ marginBottom: '8px' }} />
    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{message}</p>
  </div>
);

const DisclaimerNote = ({ text }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.72rem', color: '#64748b', marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
    <Info size={13} style={{ flexShrink: 0, marginTop: '1px', color: '#94a3b8' }} />
    <span>⚠️ {text}</span>
  </div>
);

const DataTable = ({ headers, rows, onExport, exportLabel = 'Export CSV' }) => (
  <div>
    {onExport && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.65rem' }}>
        <Button variant="outline" size="sm" icon={Download} onClick={onExport}>{exportLabel}</Button>
      </div>
    )}
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: '0.6rem 0.85rem', textAlign: 'left', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>No data</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '0.6rem 0.85rem', color: '#334155' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminAnalyticsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Role authorization guard: Admin only
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{t('accessDenied', 'Access Restricted')}</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', margin: '0.5rem auto 0' }}>
          {t('adminOnlyNotice', 'Platform analytics and intelligence reports are restricted to administrators.')}
        </p>
      </div>
    );
  }

  // Load analytics data (memoized per mount)
  const overview = useMemo(() => getPlatformOverview(), []);
  const material = useMemo(() => getMaterialAnalytics(), []);
  const reuseRecycle = useMemo(() => getReuseRecycleAnalytics(), []);
  const offerData = useMemo(() => getOfferAnalytics(), []);
  const txData = useMemo(() => getTransactionAnalytics(), []);
  const priceData = useMemo(() => getPriceAnalytics(), []);
  const locationData = useMemo(() => getLocationAnalytics(), []);
  const collectorData = useMemo(() => getCollectorAnalytics(), []);
  const buyerData = useMemo(() => getBuyerAnalytics(), []);
  const safetyData = useMemo(() => getSafetyAnalytics(), []);
  const envData = useMemo(() => getEnvironmentalAnalytics(), []);
  const activityData = useMemo(() => getPlatformActivityTimeline(), []);
  const syncData = useMemo(() => getSyncHealthAnalytics(), []);

  // 13 Distinct Sections matching requirement 4
  const analyticsTabs = [
    { id: 'overview',        label: t('overview', 'Overview'),                       icon: BarChart3 },
    { id: 'materials',       label: t('materials', 'Materials'),                     icon: Package },
    { id: 'reuse-recycle',   label: t('pathwayOverview', 'Reuse vs Recycling'),       icon: Recycle },
    { id: 'offers',          label: t('offers', 'Offers'),                           icon: TrendingUp },
    { id: 'transactions',    label: t('transactions', 'Transactions'),               icon: IndianRupee },
    { id: 'prices',          label: t('prices', 'Prices'),                           icon: IndianRupee },
    { id: 'locations',       label: t('location', 'Locations'),                      icon: MapPin },
    { id: 'collectors',      label: t('collectors', 'Collectors'),                   icon: Users },
    { id: 'repair-shops',    label: t('repairShops', 'Repair Shops'),                 icon: Store },
    { id: 'recyclers',       label: t('authorizedRecyclers', 'Authorized Recyclers'), icon: Recycle },
    { id: 'safety',          label: t('safety', 'Safety'),                           icon: ShieldAlert },
    { id: 'environmental',   label: t('environmentalImpact', 'Environmental'),       icon: Leaf },
    { id: 'activity',        label: t('activity', 'Activity'),                       icon: Activity },
  ];

  return (
    <div>
      <SectionHeader
        icon={BarChart3}
        title={t('platformAnalytics', 'Platform Analytics')}
        subtitle={t('analyticsSubtitle', 'Decision-support insights from real application data. Prototype data only.')}
      />

      {/* Sync health bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem',
        padding: '0.55rem 0.85rem', background: '#f8fafc', borderRadius: '8px',
        border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569'
      }}>
        {syncData.isOnline
          ? <Wifi size={14} color="#15803d" />
          : <WifiOff size={14} color="#dc2626" />}
        <span>{syncData.isOnline ? t('online', 'Online') : t('offline', 'Offline')}</span>
        <span style={{ color: '#94a3b8' }}>·</span>
        <span>Queue: {syncData.pending || 0} pending · {syncData.failed || 0} failed · {syncData.synced || 0} synced</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8' }}>
          {t('analyticsOfflineNote', 'Analytics read from local data — available offline.')}
        </span>
      </div>

      {/* Tab navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
          {analyticsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#15803d' : '#475569',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: isActive ? '2px solid #15803d' : '2px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ 1. OVERVIEW ════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <StatCard label={t('totalLots', 'Total Lots')} value={overview.lots.total} icon={Package} color="#15803d" bg="#f0fdf4" iconColor="#15803d" />
            <StatCard label={t('totalWeight', 'Total Weight')} value={overview.lots.totalWeight} unit="kg" icon={Package} color="#0f172a" />
            <StatCard label={t('completedLots', 'Completed Lots')} value={overview.lots.completed} icon={CheckCircle2} color="#15803d" />
            <StatCard label={t('collectors', 'Collectors')} value={overview.collectors.distinct} icon={Users} color="#7c3aed" bg="#faf5ff" iconColor="#7c3aed" />
            <StatCard label={t('totalOffers', 'Total Offers')} value={overview.offers.total} icon={TrendingUp} color="#d97706" bg="#fffbeb" iconColor="#d97706" />
            <StatCard label={t('acceptedOffers', 'Accepted Offers')} value={overview.offers.accepted} icon={CheckCircle2} color="#15803d" />
            <StatCard label={t('totalTransactions', 'Transactions')} value={overview.transactions.total} icon={IndianRupee} color="#0284c7" bg="#eff6ff" iconColor="#0284c7" />
            <StatCard label={t('completedTransactions', 'Completed')} value={overview.transactions.completed} icon={CheckCircle2} color="#15803d" />
            <StatCard label={t('repairShops', 'Repair Shops')} value={overview.partners.repairShops.total} icon={Store} color="#d97706" />
            <StatCard label={t('recyclers', 'Recyclers')} value={overview.partners.recyclers.total} icon={Recycle} color="#0284c7" />
            <StatCard label={t('recordedValue', 'Recorded Value')} value={`₹${(overview.payments.totalRecordedValue || 0).toLocaleString('en-IN')}`} icon={IndianRupee} color="#7c3aed" />
            <StatCard
              label={t('offerAcceptanceRate', 'Acceptance Rate')}
              value={overview.offers.acceptanceRate != null ? `${overview.offers.acceptanceRate}%` : '—'}
              icon={BarChart3}
              color="#15803d"
            />
          </div>

          <Card style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              📊 {t('platformSummary', 'Platform Summary')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Scrap Lots</div>
                <div>{overview.lots.total} total · {overview.lots.pending} pending · {overview.lots.completed} completed</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Offers</div>
                <div>{overview.offers.total} total · {overview.offers.active} active · {overview.offers.accepted} accepted</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Transactions</div>
                <div>{overview.transactions.total} total · {overview.transactions.pending} pending · {overview.transactions.cancelled} cancelled</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Partners</div>
                <div>{overview.partners.repairShops.active} active repair shops · {overview.partners.recyclers.active} active recyclers</div>
              </div>
            </div>
          </Card>
          <DisclaimerNote text={overview.disclaimer} />
        </div>
      )}

      {/* ═══ 2. MATERIALS ═══════════════════════════════════════════════════ */}
      {activeTab === 'materials' && (
        <div>
          {!material.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  📦 {t('materialDistribution', 'Material Category Distribution')}
                </h3>
                <HBarChart
                  data={material.categoryTable}
                  valueKey="count"
                  labelKey="category"
                  colorFn={(_, i) => ['#15803d', '#0284c7', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#ea580c', '#4f46e5'][i % 8]}
                />
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  ⚖️ {t('weightByMaterial', 'Weight by Category (kg)')}
                </h3>
                <HBarChart
                  data={material.categoryTable}
                  valueKey="totalWeightKg"
                  labelKey="category"
                  colorFn={() => '#0284c7'}
                />
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  🔍 {t('conditionBreakdown', 'Condition Breakdown')}
                </h3>
                <HBarChart
                  data={material.conditionBreakdown}
                  colorFn={(row) =>
                    row.label === 'damaged' ? '#dc2626' :
                    row.label === 'good' ? '#15803d' :
                    row.label === 'fair' ? '#d97706' : '#64748b'
                  }
                />
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  📈 {t('weightStats', 'Weight Statistics (kg)')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: t('average', 'Average'), val: material.weightStats.avg },
                    { label: t('median', 'Median'), val: material.weightStats.median },
                    { label: t('min', 'Min'), val: material.weightStats.min },
                    { label: t('max', 'Max'), val: material.weightStats.max },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.65rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{val ?? '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {material.topMaterial && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#15803d', fontWeight: 700 }}>
                    🏆 {t('topMaterial', 'Most collected')}: {material.topMaterial}
                  </div>
                )}
              </Card>
            </div>
          )}
          {material.hasData && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                  {t('materialTable', 'Material Category Table')}
                </h3>
                <Button
                  variant="outline" size="sm" icon={Download}
                  onClick={() => exportToCsv(material.categoryTable, 'scrapsetu_materials.csv', ['category', 'count', 'totalWeightKg', 'share'])}
                >
                  {t('exportCsv', 'Export CSV')}
                </Button>
              </div>
              <DataTable
                headers={[t('category', 'Category'), t('count', 'Count'), t('totalWeight', 'Total Weight (kg)'), t('sharePercent', 'Share %')]}
                rows={material.categoryTable.map((r) => [r.category, r.count, r.totalWeightKg, `${r.share}%`])}
              />
            </Card>
          )}
          <DisclaimerNote text={material.disclaimer || 'Derived from collector scrap lot submissions.'} />
        </div>
      )}

      {/* ═══ 3. REUSE VS RECYCLING ══════════════════════════════════════════ */}
      {activeTab === 'reuse-recycle' && (
        <div>
          {!reuseRecycle.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  🔄 {t('pathwayOverview', 'Pathway Overview')}
                </h3>
                <PathwaySplit reuseCount={reuseRecycle.reuse.total} recycleCount={reuseRecycle.recycle.total} />
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>{reuseRecycle.note}</div>
              </Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Card style={{ borderLeft: '4px solid #d97706' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    🔧 {reuseRecycle.reuse.label}
                  </div>
                  {[
                    { label: t('transactions', 'Transactions'), val: reuseRecycle.reuse.total },
                    { label: t('completedTransactions', 'Completed'), val: reuseRecycle.reuse.completed },
                    { label: t('totalWeight', 'Total Weight (kg)'), val: reuseRecycle.reuse.totalWeightKg },
                    { label: t('completedWeight', 'Completed Weight (kg)'), val: reuseRecycle.reuse.completedWeightKg },
                    { label: t('sharePercent', 'Share of Transactions'), val: reuseRecycle.reuse.shareOfTransactions != null ? `${reuseRecycle.reuse.shareOfTransactions}%` : '—' },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{val}</span>
                    </div>
                  ))}
                </Card>
                <Card style={{ borderLeft: '4px solid #0284c7' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    ♻️ {reuseRecycle.recycle.label}
                  </div>
                  {[
                    { label: t('transactions', 'Transactions'), val: reuseRecycle.recycle.total },
                    { label: t('completedTransactions', 'Completed'), val: reuseRecycle.recycle.completed },
                    { label: t('totalWeight', 'Total Weight (kg)'), val: reuseRecycle.recycle.totalWeightKg },
                    { label: t('completedWeight', 'Completed Weight (kg)'), val: reuseRecycle.recycle.completedWeightKg },
                    { label: t('sharePercent', 'Share of Transactions'), val: reuseRecycle.recycle.shareOfTransactions != null ? `${reuseRecycle.recycle.shareOfTransactions}%` : '—' },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{val}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 4. OFFERS ══════════════════════════════════════════════════════ */}
      {activeTab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!offerData.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <StatCard label={t('total', 'Total')} value={offerData.total} icon={TrendingUp} color="#d97706" bg="#fffbeb" />
                <StatCard label={t('accepted', 'Accepted')} value={offerData.byStatus.accepted} icon={CheckCircle2} color="#15803d" />
                <StatCard label={t('submitted', 'Active')} value={offerData.byStatus.submitted} icon={Clock} color="#0284c7" />
                <StatCard label={t('rejected', 'Rejected')} value={offerData.byStatus.rejected} icon={AlertTriangle} color="#dc2626" />
                <StatCard label={t('acceptanceRate', 'Acceptance Rate')} value={offerData.acceptanceRate != null ? `${offerData.acceptanceRate}%` : '—'} color="#7c3aed" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Card>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>By Buyer Type</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: offerData.byRole.repair.label, count: offerData.byRole.repair.count, color: '#d97706' },
                      { label: offerData.byRole.recycler.label, count: offerData.byRole.recycler.count, color: '#0284c7' },
                    ].map((r) => (
                      <div key={r.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '2px' }}>
                          <span style={{ color: '#475569' }}>{r.label}</span>
                          <span style={{ fontWeight: 800, color: r.color }}>{r.count}</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: offerData.total > 0 ? `${(r.count / offerData.total) * 100}%` : '0%', height: '100%', background: r.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Top Materials by Offer</h3>
                    <Button
                      variant="outline" size="sm" icon={Download}
                      onClick={() => exportToCsv(offerData.topMaterials, 'scrapsetu_offer_materials.csv', ['label', 'count'])}
                    >
                      {t('exportCsv', 'Export CSV')}
                    </Button>
                  </div>
                  <HBarChart data={offerData.topMaterials} colorFn={(_, i) => ['#15803d', '#0284c7', '#d97706', '#7c3aed', '#dc2626'][i % 5]} />
                </Card>
              </div>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {t('totalOfferValue', 'Total Offer Value')}: <strong>₹{offerData.totalValue?.toLocaleString('en-IN') || 0}</strong>&nbsp;&nbsp;·&nbsp;&nbsp;
                    {t('acceptedValue', 'Accepted Value')}: <strong>₹{offerData.acceptedValue?.toLocaleString('en-IN') || 0}</strong>
                  </span>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ═══ 5. TRANSACTIONS ════════════════════════════════════════════════ */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!txData.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <StatCard label={t('total', 'Total')} value={txData.total} icon={IndianRupee} color="#0284c7" bg="#eff6ff" />
                <StatCard label={t('completed', 'Completed')} value={txData.completed} icon={CheckCircle2} color="#15803d" />
                <StatCard label={t('pending', 'Pending')} value={txData.pending} icon={Clock} color="#d97706" />
                <StatCard label={t('cancelled', 'Cancelled')} value={txData.cancelled} icon={AlertTriangle} color="#94a3b8" />
                <StatCard label={t('totalWeight', 'Total Weight (kg)')} value={txData.totalWeightKg} color="#0f172a" />
                <StatCard label={t('recordedValue', 'Recorded Value (₹)')} value={`₹${(txData.totalRecordedValue || 0).toLocaleString('en-IN')}`} color="#7c3aed" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Card>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>By Buyer Type</h3>
                  <HBarChart
                    data={[
                      { label: 'Repair Shop (Reuse)', count: txData.byRole.repair },
                      { label: 'Recycler (Recycling)', count: txData.byRole.recycler },
                    ]}
                    valueKey="count"
                    colorFn={(r) => r.label.includes('Repair') ? '#d97706' : '#0284c7'}
                  />
                </Card>
                <Card>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Payment Methods</h3>
                  {txData.paymentMethods.length === 0
                    ? <div style={{ color: '#94a3b8', fontSize: '0.83rem' }}>{t('notEnoughData', 'Not enough data yet.')}</div>
                    : <HBarChart data={txData.paymentMethods} colorFn={(_, i) => ['#7c3aed', '#0284c7', '#15803d', '#d97706'][i % 4]} />
                  }
                </Card>
                <Card style={{ gridColumn: '1/-1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Top Materials by Transaction</h3>
                    <Button variant="outline" size="sm" icon={Download}
                      onClick={() => exportToCsv(txData.topMaterials, 'scrapsetu_transaction_materials.csv', ['label', 'count'])}>
                      {t('exportCsv', 'Export CSV')}
                    </Button>
                  </div>
                  <HBarChart data={txData.topMaterials} colorFn={(_, i) => ['#15803d', '#0284c7', '#d97706', '#7c3aed', '#dc2626'][i % 5]} />
                </Card>
              </div>
              <DisclaimerNote text={txData.disclaimer} />
            </>
          )}
        </div>
      )}

      {/* ═══ 6. PRICES ══════════════════════════════════════════════════════ */}
      {activeTab === 'prices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!priceData.hasData ? (
            <NoDataState message={t('notEnoughHistoricalData', 'Not enough historical price data.')} />
          ) : (
            <>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                    💰 {t('historicalPrices', 'Historical Price Data by Material (₹/kg)')}
                  </h3>
                  <Button variant="outline" size="sm" icon={Download}
                    onClick={() => exportToCsv(priceData.materialPriceTable, 'scrapsetu_prices.csv', ['category', 'count', 'avg', 'median', 'min', 'max'])}>
                    {t('exportCsv', 'Export CSV')}
                  </Button>
                </div>
                <DataTable
                  headers={[t('material', 'Material'), t('records', 'Records'), t('average', 'Avg (₹/kg)'), t('median', 'Median'), t('min', 'Min'), t('max', 'Max')]}
                  rows={priceData.materialPriceTable.map((r) => [r.category, r.count, r.avg ?? '—', r.median ?? '—', r.min ?? '—', r.max ?? '—'])}
                />
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Avg Price by Material</h3>
                <HBarChart
                  data={priceData.materialPriceTable.filter((r) => r.avg != null)}
                  valueKey="avg"
                  labelKey="category"
                  colorFn={(_, i) => ['#15803d', '#0284c7', '#d97706', '#7c3aed', '#dc2626'][i % 5]}
                />
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Price Records by Location</h3>
                <HBarChart data={priceData.locationBreakdown.slice(0, 8)} colorFn={() => '#0284c7'} />
              </Card>
              <DisclaimerNote text={priceData.disclaimer} />
            </>
          )}
        </div>
      )}

      {/* ═══ 7. LOCATIONS ═══════════════════════════════════════════════════ */}
      {activeTab === 'locations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!locationData.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                    📍 {t('locationDistribution', 'Lots and Transactions by Location')}
                  </h3>
                  <Button variant="outline" size="sm" icon={Download}
                    onClick={() => exportToCsv(locationData.locationTable, 'scrapsetu_locations.csv', ['location', 'lots', 'totalWeightKg', 'transactions'])}>
                    {t('exportCsv', 'Export CSV')}
                  </Button>
                </div>
                <DataTable
                  headers={[t('location', 'Location'), t('lots', 'Lots'), t('totalWeight', 'Weight (kg)'), t('transactions', 'Transactions')]}
                  rows={locationData.locationTable.map((r) => [r.location, r.lots, r.totalWeightKg, r.transactions])}
                />
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Lots by Location</h3>
                <HBarChart data={locationData.locationTable.slice(0, 10)} valueKey="lots" labelKey="location" colorFn={() => '#15803d'} />
              </Card>
              <DisclaimerNote text={locationData.note} />
            </>
          )}
        </div>
      )}

      {/* ═══ 8. COLLECTORS ══════════════════════════════════════════════════ */}
      {activeTab === 'collectors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!collectorData.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <StatCard label={t('collectors', 'Collectors')} value={collectorData.totalCollectors} icon={Users} color="#7c3aed" bg="#faf5ff" />
                <StatCard label={t('totalLots', 'Total Lots')} value={collectorData.totalLots} icon={Package} color="#15803d" />
                <StatCard label={t('totalWeight', 'Total Weight (kg)')} value={collectorData.totalWeightKg} color="#0f172a" />
                <StatCard label={t('avgLotsPerCollector', 'Avg Lots / Collector')} value={collectorData.avgLotsPerCollector} color="#0284c7" />
              </div>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Collector Activity Summary</h3>
                  <Button variant="outline" size="sm" icon={Download}
                    onClick={() => exportToCsv(collectorData.perCollector, 'scrapsetu_collectors.csv', ['collectorId', 'totalLots', 'totalWeightKg', 'completedTx', 'totalEarnings'])}>
                    {t('exportCsv', 'Export CSV')}
                  </Button>
                </div>
                <DataTable
                  headers={['Collector ID', t('lots', 'Lots'), t('totalWeight', 'Weight (kg)'), t('completedTransactions', 'Completed Tx'), 'Recorded Earnings (₹)']}
                  rows={collectorData.perCollector.map((c) => [c.collectorId, c.totalLots, c.totalWeightKg, c.completedTx, `₹${c.totalEarnings.toLocaleString('en-IN')}`])}
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* ═══ 9. REPAIR SHOPS ════════════════════════════════════════════════ */}
      {activeTab === 'repair-shops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <StatCard label="Total Repair Shops" value={buyerData.repairShops.total} icon={Store} color="#d97706" bg="#fffbeb" />
            <StatCard label="Active Shops" value={buyerData.repairShops.active} icon={CheckCircle2} color="#15803d" bg="#f0fdf4" />
            <StatCard label="Wanted Items Posted" value={buyerData.repairShops.wantedItems} icon={Package} color="#0284c7" />
            <StatCard label="Offers Submitted" value={buyerData.repairShops.offers} icon={TrendingUp} color="#7c3aed" />
            <StatCard label="Total Transactions" value={buyerData.repairShops.transactions} icon={IndianRupee} color="#0f172a" />
            <StatCard label="Completed Tx" value={buyerData.repairShops.completedTransactions} icon={CheckCircle2} color="#15803d" />
          </div>
          <Card style={{ borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#d97706', margin: 0 }}>
                🔧 {buyerData.repairShops.label}
              </h3>
              <Button
                variant="outline" size="sm" icon={Download}
                onClick={() => exportToCsv([buyerData.repairShops], 'scrapsetu_repair_shops.csv', ['label', 'total', 'active', 'wantedItems', 'offers', 'transactions', 'completedTransactions'])}
              >
                {t('exportCsv', 'Export CSV')}
              </Button>
            </div>
            {[
              ['Total Partners Registered', buyerData.repairShops.total],
              ['Active Repair Shops', buyerData.repairShops.active],
              ['Wanted Items / Components Posted', buyerData.repairShops.wantedItems],
              ['Purchase Offers Submitted', buyerData.repairShops.offers],
              ['Total Transactions Initiated', buyerData.repairShops.transactions],
              ['Completed Reuse Transactions', buyerData.repairShops.completedTransactions],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{val}</span>
              </div>
            ))}
          </Card>
          <DisclaimerNote text={buyerData.note} />
        </div>
      )}

      {/* ═══ 10. AUTHORIZED RECYCLERS ═══════════════════════════════════════ */}
      {activeTab === 'recyclers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <StatCard label="Total Recyclers" value={buyerData.recyclers.total} icon={Recycle} color="#0284c7" bg="#eff6ff" />
            <StatCard label="Active Recyclers" value={buyerData.recyclers.active} icon={CheckCircle2} color="#15803d" bg="#f0fdf4" />
            <StatCard label="Offers Submitted" value={buyerData.recyclers.offers} icon={TrendingUp} color="#7c3aed" />
            <StatCard label="Total Transactions" value={buyerData.recyclers.transactions} icon={IndianRupee} color="#0f172a" />
            <StatCard label="Completed Tx" value={buyerData.recyclers.completedTransactions} icon={CheckCircle2} color="#15803d" />
          </div>
          <Card style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0284c7', margin: 0 }}>
                ♻️ {buyerData.recyclers.label}
              </h3>
              <Button
                variant="outline" size="sm" icon={Download}
                onClick={() => exportToCsv([buyerData.recyclers], 'scrapsetu_authorized_recyclers.csv', ['label', 'total', 'active', 'offers', 'transactions', 'completedTransactions'])}
              >
                {t('exportCsv', 'Export CSV')}
              </Button>
            </div>
            {[
              ['Total Authorized Recyclers', buyerData.recyclers.total],
              ['Active Recycling Facilities', buyerData.recyclers.active],
              ['Bulk Scrap Offers Submitted', buyerData.recyclers.offers],
              ['Total Transactions Initiated', buyerData.recyclers.transactions],
              ['Completed Recycling Transactions', buyerData.recyclers.completedTransactions],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{val}</span>
              </div>
            ))}
          </Card>
          <DisclaimerNote text={buyerData.note} />
        </div>
      )}

      {/* ═══ 11. SAFETY ═════════════════════════════════════════════════════ */}
      {activeTab === 'safety' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!safetyData.hasData ? (
            <NoDataState message={t('notEnoughData', 'Not enough data yet.')} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <StatCard label={t('totalLots', 'Total Lots')} value={safetyData.totalLots} icon={Package} color="#0f172a" />
                <StatCard label={t('highRiskLabel', 'High Risk')} value={safetyData.highRisk} icon={AlertTriangle} color="#dc2626" bg="#fef2f2" iconColor="#dc2626" />
                <StatCard label={t('mediumRiskLabel', 'Medium Risk')} value={safetyData.mediumRisk} icon={AlertTriangle} color="#d97706" bg="#fffbeb" iconColor="#d97706" />
                <StatCard label={t('lowRiskLabel', 'Low Risk')} value={safetyData.lowRisk} icon={CheckCircle2} color="#15803d" bg="#f0fdf4" iconColor="#15803d" />
                <StatCard label="Batteries Total" value={safetyData.batteries.total} icon={ShieldAlert} color="#0284c7" />
                <StatCard label="Damaged Batteries" value={safetyData.batteries.damaged} icon={ShieldAlert} color="#dc2626" bg="#fef2f2" iconColor="#dc2626" />
              </div>
              {safetyData.highRiskMaterials.length > 0 && (
                <Card>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    🚨 High-Risk Materials in Current Lots
                  </h3>
                  <HBarChart data={safetyData.highRiskMaterials} colorFn={() => '#dc2626'} />
                </Card>
              )}
              <DisclaimerNote text={safetyData.disclaimer} />
            </>
          )}
        </div>
      )}

      {/* ═══ 12. ENVIRONMENTAL ══════════════════════════════════════════════ */}
      {activeTab === 'environmental' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}>
            <StatCard label={t('totalHandled', 'Total Scrap Handled (kg)')} value={envData.totalScrapHandledKg} icon={Package} color="#15803d" bg="#f0fdf4" />
            <StatCard label={t('reuseWeight', 'Reuse Pathway (kg)')} value={envData.reuseWeightKg} icon={Store} color="#d97706" bg="#fffbeb" />
            <StatCard label={t('recyclingWeight', 'Recycling Pathway (kg)')} value={envData.recyclingWeightKg} icon={Recycle} color="#0284c7" bg="#eff6ff" />
            <StatCard label={t('divertedWeight', 'Diverted Weight (kg)')} value={envData.divertedWeightKg} icon={Leaf} color="#15803d" />
            <StatCard label={t('completedPathways', 'Completed Pathways')} value={envData.completedTransactionsCount} icon={CheckCircle2} color="#7c3aed" />
            <StatCard label={t('totalLots', 'Total Lots')} value={envData.totalLotsCount} icon={Package} color="#0f172a" />
          </div>
          <Card>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              🌱 Reuse vs Recycling Weight
            </h3>
            <PathwaySplit reuseCount={envData.reuseWeightKg || 0} recycleCount={envData.recyclingWeightKg || 0} />
          </Card>
          {Object.keys(envData.materialTotals || {}).length > 0 && (
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>Weight by Material Category</h3>
              <HBarChart
                data={Object.entries(envData.materialTotals).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)}
                colorFn={(_, i) => ['#15803d', '#0284c7', '#d97706', '#7c3aed'][i % 4]}
              />
            </Card>
          )}
          <DisclaimerNote text={envData.disclaimer} />
        </div>
      )}

      {/* ═══ 13. ACTIVITY TIMELINE ══════════════════════════════════════════ */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!activityData.hasData ? (
            <NoDataState message={t('notEnoughHistoricalData', 'Not enough historical data to display a timeline.')} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <StatCard label={t('activeDays', 'Active Days')} value={activityData.days.length} icon={Activity} color="#15803d" />
                <StatCard label={t('totalLots', 'Total Lots')} value={activityData.totalActivity.lots} icon={Package} color="#0284c7" />
                <StatCard label={t('totalOffers', 'Total Offers')} value={activityData.totalActivity.offers} icon={TrendingUp} color="#d97706" />
                <StatCard label={t('totalTransactions', 'Total Transactions')} value={activityData.totalActivity.transactions} icon={IndianRupee} color="#7c3aed" />
              </div>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                    📅 {t('activityByDay', 'Activity by Day')}
                  </h3>
                  <Button variant="outline" size="sm" icon={Download}
                    onClick={() => exportToCsv(activityData.days, 'scrapsetu_activity.csv', ['date', 'lots', 'offers', 'transactions'])}>
                    {t('exportCsv', 'Export CSV')}
                  </Button>
                </div>
                <DataTable
                  headers={['Date', t('lots', 'Lots'), t('offers', 'Offers'), t('transactions', 'Transactions')]}
                  rows={activityData.days.map((d) => [d.date, d.lots, d.offers, d.transactions])}
                />
              </Card>
              <DisclaimerNote text={activityData.note} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
