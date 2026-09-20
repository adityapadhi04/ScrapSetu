import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  Truck,
  Box,
  HeartHandshake,
  HelpCircle
} from 'lucide-react';
import { getAllSafetyCatalog, HAZARD_LEVELS } from '../../services/safetyGuidanceService';
import { useLanguage } from '../../context/LanguageContext';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';

export const SafetyPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const catalog = getAllSafetyCatalog();

  const [selectedId, setSelectedId] = useState(catalog[0]?.id || 'battery');

  const selectedItem = catalog.find((i) => i.id === selectedId) || catalog[0];

  const hazardConfigs = {
    [HAZARD_LEVELS.HIGH]: {
      label: t('highRisk', 'HIGH RISK'),
      icon: AlertOctagon,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fca5a5',
      badgeBg: '#dc2626',
      badgeText: '#ffffff',
    },
    [HAZARD_LEVELS.MEDIUM]: {
      label: t('mediumRisk', 'MEDIUM RISK'),
      icon: AlertTriangle,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      badgeBg: '#d97706',
      badgeText: '#ffffff',
    },
    [HAZARD_LEVELS.LOW]: {
      label: t('lowRisk', 'LOW RISK'),
      icon: CheckCircle2,
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badgeBg: '#15803d',
      badgeText: '#ffffff',
    },
  };

  const currentHazard = hazardConfigs[selectedItem.hazardLevel] || hazardConfigs[HAZARD_LEVELS.LOW];
  const HazardIcon = currentHazard.icon;

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
              🛡️ {t('safety', 'Common E-waste Safety')}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              {t('safetySubtitle', 'Practical safe handling rules for informal scrap collectors')}
            </p>
          </div>
        </div>

        {/* Offline local notice */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✓ Works offline • Local reference guide for safer collection and handling</span>
        </div>

        {/* Horizontal scrollable material tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            {t('selectMaterialCategory', 'Select Material Category:')}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '6px',
              scrollbarWidth: 'thin'
            }}
          >
            {catalog.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #15803d' : '1px solid #e2e8f0',
                    background: isSelected ? '#f0fdf4' : '#ffffff',
                    color: isSelected ? '#15803d' : '#334155',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.materialCategory}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Safety Information for Selected Material */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main overview card */}
          <Card style={{ padding: '1.25rem', border: `1.5px solid ${currentHazard.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '2rem' }}>{selectedItem.icon}</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedItem.materialCategory}
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Standard E-waste Stream
                  </span>
                </div>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: currentHazard.badgeBg,
                  color: currentHazard.badgeText,
                  letterSpacing: '0.04em'
                }}
              >
                <HazardIcon size={14} />
                {currentHazard.label}
              </span>
            </div>

            {/* Prohibited DO NOT Actions */}
            <div style={{ marginBottom: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#dc2626', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={17} /> {t('doNotActions', 'DO NOT ACTIONS (CRITICAL)')}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#7f1d1d', lineHeight: '1.5' }}>
                {selectedItem.doNotActions.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px', fontWeight: 600 }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Safe Handling Procedures */}
            <div style={{ marginBottom: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#15803d', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={17} /> {t('safeHandling', 'SAFE HANDLING PROCEDURES')}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#14532d', lineHeight: '1.5' }}>
                {selectedItem.handlingGuidance.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Safe Storage & Transport */}
            <div className="grid-cols-2" style={{ gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box size={15} color="#0284c7" /> {t('storageGuidance', 'Safe Storage')}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#475569', lineHeight: '1.45' }}>
                  {selectedItem.storageGuidance.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '3px' }}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={15} color="#0284c7" /> {t('transportGuidance', 'Transport & Carrying')}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#475569', lineHeight: '1.45' }}>
                  {selectedItem.transportGuidance.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '3px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Pathway */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <HeartHandshake size={18} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#1e40af', display: 'block' }}>
                    {t('recommendedPath', 'Recommended Disposal/Reuse Path')}
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: '#1e3a8a' }}>
                    {selectedItem.recommendedPath}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency note */}
            {selectedItem.emergencyNote && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#92400e' }}>
                <strong>🚨 Emergency / First Response:</strong> {selectedItem.emergencyNote}
              </div>
            )}
          </Card>

          {/* Educational disclaimer */}
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            ⚠️ Prototype educational guidance for informal scrap workers. Always prioritize personal safety and avoid open-flame processing.
          </p>
        </div>
      </PageContainer>
    </div>
  );
};

export default SafetyPage;
