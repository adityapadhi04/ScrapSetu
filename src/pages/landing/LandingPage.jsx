import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_CONFIG } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Zap,
  Smartphone,
  RefreshCw,
  Award
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { CORE_MATERIAL_GROUPS } from '../../data/mockData';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { currentRole, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      const targetPath = ROLE_CONFIG[currentRole]?.path || '/collector';
      navigate(targetPath);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 45%)' }}>
      {/* Hero Section */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 1.5rem 3rem 1.5rem', textAlign: 'center' }}>
        
        {/* Vernacular / Mission Tagline */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#dcfce7', padding: '0.45rem 1.15rem', borderRadius: '99px', marginBottom: '1.75rem', border: '1px solid #86efac' }}>
          <Sparkles size={16} color="#15803d" />
          <span style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 700 }}>
            {t('heroSubtitle')}
          </span>
        </div>

        {/* Main Brand Heading */}
        <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 3.6rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
          ScrapSetu <span style={{ color: '#15803d' }}>/ {t('appName')}</span>
        </h1>

        {/* Core Product Description */}
        <p style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.28rem)', color: '#475569', maxWidth: '780px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          {t('heroDesc')}
        </p>

        {/* Primary CTA - Simple, Clear "Get Started →" */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem' }}>
          <button
            id="landing-primary-cta"
            onClick={handleGetStarted}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.9rem 2.25rem',
              fontSize: '1.15rem',
              fontWeight: 800,
              borderRadius: '14px',
              border: 'none',
              background: '#15803d',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(21, 128, 61, 0.4), 0 4px 8px -2px rgba(21, 128, 61, 0.2)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = '#166534';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#15803d';
            }}
          >
            <span>{t('getStarted')}</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* 3 Core Platform Pillars (Value Propositions, NOT Role Cards) */}
        <div className="grid-cols-3" style={{ gap: '1.25rem', marginBottom: '4rem', textAlign: 'left' }}>
          <Card style={{ padding: '1.35rem', borderTop: '4px solid #15803d' }}>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <Smartphone size={22} color="#15803d" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>
              Low-Literacy & Vernacular
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
              Visual recognition workflows, high-contrast layouts, and full support for 8 native regional languages.
            </p>
          </Card>

          <Card style={{ padding: '1.35rem', borderTop: '4px solid #0284c7' }}>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <Zap size={22} color="#0284c7" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>
              Fair Price Benchmarks
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
              Transparent market rates across 8 material groups prevent exploitation of informal waste pickers.
            </p>
          </Card>

          <Card style={{ padding: '1.35rem', borderTop: '4px solid #d97706' }}>
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <ShieldCheck size={22} color="#d97706" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>
              Formal Circular Chain
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
              Direct linkage to licensed repair shops for component reuse and authorized recyclers for EPR compliance.
            </p>
          </Card>
        </div>

        {/* 8 Material Categories Reference Section */}
        <div style={{ textAlign: 'left', marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              8 Core E-Waste Material Groups Supported
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Standardized classification and fair pricing categories under CPCB governance guidelines:
            </p>
          </div>

          <div className="grid-cols-4" style={{ gap: '1rem' }}>
            {CORE_MATERIAL_GROUPS.map((mat) => (
              <Card key={mat.id} style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚡</span>
                  <Badge variant={mat.hazardLevel === 'High' ? 'danger' : 'neutral'}>
                    {mat.hazardLevel} Hazard
                  </Badge>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>{mat.name}</h4>
                <p style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {mat.vernacularName}
                </p>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {mat.benchmarkPrice} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{mat.unit}</span>
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
