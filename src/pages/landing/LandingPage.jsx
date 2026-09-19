import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getStrings } from '../../locales/strings';
import { 
  Recycle, 
  Wrench, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { CORE_MATERIAL_GROUPS } from '../../data/mockData';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { setRole, language } = useAuth();
  const t = getStrings(language);

  const handleSelectRole = (roleKey, path) => {
    setRole(roleKey);
    navigate(path);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%)' }}>
      {/* Hero Section */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem 2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#dcfce7', padding: '0.45rem 1.15rem', borderRadius: '99px', marginBottom: '1.5rem', border: '1px solid #86efac' }}>
          <Sparkles size={16} color="#15803d" />
          <span style={{ color: '#166534', fontSize: '0.88rem', fontWeight: 700 }}>
            Bringing the Informal Collector into the Formal Recycling Chain
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: '1rem' }}>
          ScrapSetu <span style={{ color: '#15803d' }}>/ स्क्रैप सेतु</span>
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#475569', maxWidth: '740px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          A vernacular, low-literacy, offline-tolerant e-waste bridge connecting informal scrap collectors with repair shops and authorized recyclers.
        </p>

        {/* 4 Role Entry Cards */}
        <div style={{ textAlign: 'left', marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              Select how you want to continue
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Choose an account portal</span>
          </div>

          <div className="grid-cols-2" style={{ gap: '1.25rem' }}>
            {/* 1. Informal Scrap Collector */}
            <Card
              interactive
              onClick={() => handleSelectRole(ROLES.COLLECTOR, '/collector')}
              style={{ borderLeft: '6px solid #15803d', position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={26} color="#15803d" />
                </div>
                <Badge variant="success">Mobile First</Badge>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
                Informal Scrap Collector
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700, marginBottom: '0.5rem' }}>
                कबाड़ीवाला / भंगारवाला
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Low-literacy visual interface. Photograph e-waste, check fair benchmark rates, discover nearby buyers, and get digital handover receipts.
              </p>
              <Button variant="primary" size="md" fullWidth icon={ArrowRight}>
                Enter Portal →
              </Button>
            </Card>

            {/* 2. Authorized Recycler */}
            <Card
              interactive
              onClick={() => handleSelectRole(ROLES.RECYCLER, '/recycler')}
              style={{ borderLeft: '6px solid #0284c7' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Recycle size={26} color="#0284c7" />
                </div>
                <Badge variant="info">Authorized Recycler</Badge>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
                Authorized Recycler
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 700, marginBottom: '0.5rem' }}>
                अधिकृत रिसायकलर
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Direct access to aggregated e-waste scrap lots from informal collectors, pickup dispatching, weight verification, and EPR credit generation.
              </p>
              <Button variant="secondary" size="md" fullWidth icon={ArrowRight}>
                Enter Portal →
              </Button>
            </Card>

            {/* 3. Repair Shop */}
            <Card
              interactive
              onClick={() => handleSelectRole(ROLES.REPAIR_SHOP, '/repair-shop')}
              style={{ borderLeft: '6px solid #d97706' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={26} color="#d97706" />
                </div>
                <Badge variant="warning">Parts Recovery</Badge>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
                Repair Shop
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 700, marginBottom: '0.5rem' }}>
                इलेक्ट्रॉनिक्स रिपेयर दुकान
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Salvage reusable electronic parts (PCBs, displays, power boards) before shredding. Broadcast wanted components via "What I Need".
              </p>
              <Button variant="accent" size="md" fullWidth icon={ArrowRight}>
                Enter Portal →
              </Button>
            </Card>

            {/* 4. Administrator */}
            <Card
              interactive
              onClick={() => handleSelectRole(ROLES.ADMIN, '/admin')}
              style={{ borderLeft: '6px solid #0f172a' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={26} color="#0f172a" />
                </div>
                <Badge variant="neutral">Governance</Badge>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
                Administrator
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, marginBottom: '0.5rem' }}>
                सिस्टम व CPCB अनुपालन
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Maintain fair price benchmark datasets across 8 material groups, review recycler authorizations, and audit end-to-end traceability.
              </p>
              <Button variant="outline" size="md" fullWidth icon={ArrowRight}>
                Enter Portal →
              </Button>
            </Card>
          </div>
        </div>

        {/* 8 Material Categories Showcase */}
        <div style={{ textAlign: 'left', marginTop: '3rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>8 Core E-Waste Material Groups Supported</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Standardized classification and fair pricing categories:
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
