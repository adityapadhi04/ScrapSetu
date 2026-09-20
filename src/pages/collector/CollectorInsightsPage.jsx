import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Package,
  Recycle,
  Wrench,
  IndianRupee,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { calculateCollectorImpact } from '../../services/environmentalImpactService';
import { getCollectorInsights } from '../../services/collectorInsightService';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';

export const CollectorInsightsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';
  const impact = calculateCollectorImpact(activeCollectorId);
  const { insights } = getCollectorInsights(activeCollectorId);

  // Most common material
  const breakdownEntries = Object.entries(impact.materialBreakdown || {});
  breakdownEntries.sort((a, b) => b[1] - a[1]);
  const mostCommonMaterial = breakdownEntries.length > 0 ? breakdownEntries[0][0] : 'None yet';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer mobile>
        {/* Header with back navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', paddingTop: '0.5rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155'
            }}
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              📊 {t('collectorInsights', 'Collector Insights & Impact')}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              {t('collectorInsightsSubtitle', 'Your recorded environmental diversion and earnings history')}
            </p>
          </div>
        </div>

        {/* Prototype Estimate Notice */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} color="#15803d" style={{ flexShrink: 0 }} />
          <span>
            <strong>Prototype estimate:</strong> All environmental contributions are calculated from your real confirmed transactions on ScrapSetu.
          </span>
        </div>

        {/* Dynamic Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* Total Handled */}
          <Card style={{ padding: '1rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Package size={14} color="#0284c7" />
              <span>{t('scrapHandled', 'Total Handled')}</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
              {impact.totalScrapHandledKg} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              Across {impact.lotsCount} created lots
            </div>
          </Card>

          {/* Recorded Earnings */}
          <Card style={{ padding: '1rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <IndianRupee size={14} color="#15803d" />
              <span>{t('recordedEarnings', 'Recorded Earnings')}</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              ₹{impact.recordedEarnings.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              Confirmed receipts
            </div>
          </Card>

          {/* Reuse / Repair Weight */}
          <Card style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Wrench size={14} color="#2563eb" />
              <span>{t('reuseAndRepair', 'Reuse / Repair')}</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>
              {impact.reuseWeightKg} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: '2px' }}>
              Channeled to repair shops
            </div>
          </Card>

          {/* Recycled Weight */}
          <Card style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Recycle size={14} color="#16a34a" />
              <span>{t('recycling', 'Recycled')}</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {impact.recyclingWeightKg} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>
              Authorized recyclers
            </div>
          </Card>
        </div>

        {/* Supplementary Status Stats */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Activity Summary
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Completed Transactions</span>
              <strong>{impact.completedTransactionsCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Pending Transactions</span>
              <strong style={{ color: impact.pendingTransactionsCount > 0 ? '#d97706' : '#0f172a' }}>
                {impact.pendingTransactionsCount} ({impact.pendingWeightKg} kg)
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Top Handled Material</span>
              <strong>{mostCommonMaterial}</strong>
            </div>
          </div>
        </div>

        {/* Deterministic Collector Insights Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#d97706" />
            <span>{t('yourActivityInsights', 'Your Activity Insights')}</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {insights.map((text, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.86rem',
                  lineHeight: '1.45',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                }}
              >
                <span style={{ color: '#15803d', fontWeight: 800, marginTop: '1px' }}>•</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick action to sell scrap */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/collector/sell')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span> {t('sellScrap', 'Sell More Scrap')}
          </button>
        </div>
      </PageContainer>
    </div>
  );
};

export default CollectorInsightsPage;
