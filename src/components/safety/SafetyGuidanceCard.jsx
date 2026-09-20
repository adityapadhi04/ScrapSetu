import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, AlertOctagon, XCircle, Info, Truck } from 'lucide-react';
import { getSafetyGuidance, HAZARD_LEVELS } from '../../services/safetyGuidanceService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ScrapSetu — Reusable Safety Guidance Card (Module 11)
 *
 * Displays deterministic safety instructions, hazard warnings, and prohibited
 * practices for informal waste handlers.
 *
 * Accessibility:
 * Uses icons + explicit text badges (not color alone).
 */
export const SafetyGuidanceCard = ({
  materialCategory,
  condition = 'fair',
  compact = false,
  showDoNotActions = true,
  showHandling = true,
  showTransport = false,
  style = {}
}) => {
  const { t } = useLanguage();
  const guidance = getSafetyGuidance(materialCategory, condition);

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

  const currentHazard = hazardConfigs[guidance.hazardLevel] || hazardConfigs[HAZARD_LEVELS.LOW];
  const HazardIcon = currentHazard.icon;

  if (compact) {
    return (
      <div
        role="region"
        aria-label={`Safety Guidance for ${guidance.materialCategory}`}
        style={{
          background: currentHazard.bg,
          border: `1.5px solid ${currentHazard.border}`,
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          ...style
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem' }}>{guidance.icon}</span>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
              {guidance.materialCategory} {t('safety', 'Safety')}
            </strong>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '99px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: currentHazard.badgeBg,
              color: currentHazard.badgeText,
              letterSpacing: '0.04em'
            }}
          >
            <HazardIcon size={12} />
            {currentHazard.label}
          </span>
        </div>

        {guidance.conditionWarning && (
          <div style={{ fontSize: '0.78rem', color: currentHazard.color, fontWeight: 700, marginTop: '4px' }}>
            ⚠️ {guidance.conditionWarning}
          </div>
        )}

        {showDoNotActions && guidance.doNotActions?.length > 0 && (
          <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '6px', fontWeight: 600 }}>
            🛑 <strong>Avoid:</strong> {guidance.doNotActions[0]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`Detailed Safety Guidance for ${guidance.materialCategory}`}
      style={{
        background: '#ffffff',
        border: `1.5px solid ${currentHazard.border}`,
        borderRadius: '14px',
        padding: '1.15rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        ...style
      }}
    >
      {/* Header banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{guidance.icon}</span>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {guidance.materialCategory} — {t('safetyGuidance', 'Safety Guidance')}
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {t('condition', 'Condition')}: <strong style={{ textTransform: 'capitalize' }}>{condition}</strong>
            </span>
          </div>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '0.75rem',
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

      {/* Urgent condition warning if present */}
      {guidance.conditionWarning && (
        <div
          style={{
            background: currentHazard.bg,
            border: `1px solid ${currentHazard.border}`,
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            marginBottom: '0.85rem',
            color: currentHazard.color,
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{guidance.conditionWarning}</span>
        </div>
      )}

      {/* Prohibited DO NOT Actions */}
      {showDoNotActions && guidance.doNotActions?.length > 0 && (
        <div style={{ marginBottom: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', marginBottom: '6px' }}>
            <XCircle size={15} /> {t('doNotActions', 'DO NOT DO THIS:')}
          </span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: '1.45' }}>
            {guidance.doNotActions.map((action, idx) => (
              <li key={idx} style={{ marginBottom: '3px' }}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safe Handling Procedures */}
      {showHandling && guidance.handlingGuidance?.length > 0 && (
        <div style={{ marginBottom: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#15803d', marginBottom: '6px' }}>
            <CheckCircle2 size={15} /> {t('safeHandling', 'SAFE HANDLING PROCEDURES:')}
          </span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#14532d', lineHeight: '1.45' }}>
            {guidance.handlingGuidance.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: '3px' }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Transport Guidance */}
      {showTransport && guidance.transportGuidance?.length > 0 && (
        <div style={{ marginBottom: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', marginBottom: '6px' }}>
            <Truck size={15} /> {t('transportGuidance', 'TRANSPORT & CARRYING:')}
          </span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#075985', lineHeight: '1.45' }}>
            {guidance.transportGuidance.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: '3px' }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended pathway */}
      {guidance.recommendedPath && (
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} color="#64748b" style={{ flexShrink: 0 }} />
          <span>
            <strong>{t('recommendedPath', 'Recommended Disposal/Reuse Path')}:</strong> {guidance.recommendedPath}
          </span>
        </div>
      )}

      <div style={{ marginTop: '0.65rem', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right' }}>
        ⚠️ {guidance.disclaimer}
      </div>
    </div>
  );
};

export default SafetyGuidanceCard;
