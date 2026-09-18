import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  IndianRupee, 
  Package, 
  FileText, 
  ShieldAlert, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Modal from '../../components/common/Modal';
import { 
  CORE_MATERIAL_GROUPS, 
  MOCK_COLLECTOR_LOTS, 
  MOCK_NEARBY_BUYERS 
} from '../../data/mockData';

export const CollectorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, language, isAudioActive } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'prices', 'safety', 'sell-mock'

  // Vernacular greeting strings
  const greetings = {
    en: { welcome: 'Namaste', sub: 'Ready to sell e-waste today?' },
    hi: { welcome: 'नमस्ते', sub: 'आज ई-कचरा बेचने के लिए तैयार?' },
    mr: { welcome: 'नमस्कार', sub: 'आज ई-कचरा विकण्यासाठी तयार?' }
  };

  const currentGreeting = greetings[language] || greetings['en'];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        {/* Collector Greeting & Area Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {currentGreeting.welcome}, {currentUser?.name?.split(' ')[0] || 'Collector'}!
              </h1>
              <span style={{ fontSize: '1.3rem' }}>👋</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={14} color="#16a34a" />
              {currentUser?.area || 'Dharavi Sector 3, Mumbai'}
            </p>
          </div>

          <Badge variant="success">
            <CheckCircle2 size={12} />
            Verified
          </Badge>
        </div>

        {/* PRIMARY ACTION: High-contrast large touch target "Sell Scrap" */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            id="collector-primary-sell-btn"
            onClick={() => navigate('/collector/sell')}
            className="btn-collector-camera"
            aria-label="Sell Scrap by Photographing"
          >
            <Camera size={32} strokeWidth={2.5} />
            <span>📷 Sell Scrap</span>
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#166534', fontWeight: 700, marginTop: '6px' }}>
            फोटो खींचो • सही कीमत जानो • तुरंत बेचो (Photo & Instant Fair Price)
          </p>
        </div>

        {/* Today's Earnings Card */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="card-hero-earnings">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Today's Earnings / आज की कमाई
              </span>
              <TrendingUp size={18} color="#22c55e" />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                ₹1,420
              </span>
              <span style={{ fontSize: '0.85rem', color: '#86efac', fontWeight: 600 }}>
                +₹640 from yesterday
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.75rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>2 Lots Completed</span>
                <span style={{ fontWeight: 700 }}>10.7 kg Collected</span>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1rem' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Payment Mode</span>
                <span style={{ fontWeight: 700, color: '#86efac' }}>UPI Direct & Cash</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Quick Access Touch Cards (Grid) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Quick Actions / मुख्य कार्य</h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Touch to open</span>
          </div>

          <div className="grid-cols-2" style={{ gap: '0.85rem' }}>
            {/* 1. Price Board */}
            <Card
              interactive
              onClick={() => setActiveModal('prices')}
              style={{ padding: '1rem', border: '1.5px solid #e2e8f0', background: '#ffffff' }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>💰</div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '2px' }}>
                Price Board
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                बाजार भाव (8 materials)
              </p>
            </Card>

            {/* 2. My Lots */}
            <Card
              interactive
              onClick={() => navigate('/collector/lots')}
              style={{ padding: '1rem', border: '1.5px solid #e2e8f0', background: '#ffffff' }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📦</div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '2px' }}>
                My Lots
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                2 एक्टिव लॉट (Ready)
              </p>
            </Card>

            {/* 3. Transactions */}
            <Card
              interactive
              onClick={() => navigate('/collector/transactions')}
              style={{ padding: '1rem', border: '1.5px solid #e2e8f0', background: '#ffffff' }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📄</div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '2px' }}>
                Receipts
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                लेनदेन पर्ची व कमाई
              </p>
            </Card>

            {/* 4. Safety Tips */}
            <Card
              interactive
              onClick={() => setActiveModal('safety')}
              style={{ padding: '1rem', border: '1.5px solid #fecaca', background: '#fffafb' }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>🛡️</div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#dc2626', marginBottom: '2px' }}>
                Safety Guide
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#991b1b' }}>
                सुरक्षा नियम (बैटरी/कांच)
              </p>
            </Card>
          </div>
        </div>

        {/* Nearby Verified Buyers Preview */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Nearby Buyers / पास के खरीदार</h2>
            <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>2 Available</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_NEARBY_BUYERS.map((buyer) => (
              <Card key={buyer.id} style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{buyer.name}</h4>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="#16a34a" />
                      {buyer.distance} • {buyer.address}
                    </p>
                  </div>
                  <Badge variant={buyer.cpcbVerified ? 'info' : 'warning'}>
                    {buyer.cpcbVerified ? 'CPCB Verified' : 'Licensed'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Offline sync banner status placeholder */}
        <div style={{ background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: '12px', padding: '0.85rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
            📶 Offline Ready: Photographs and lot records save locally when offline and sync automatically.
          </span>
        </div>
      </PageContainer>

      {/* Modal: Fair Price Board */}
      <Modal
        isOpen={activeModal === 'prices'}
        onClose={() => setActiveModal(null)}
        title="💰 Today's E-Waste Price Board (बाजार भाव)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            CPCB and market benchmark rates for informal scrap collectors:
          </p>
          {CORE_MATERIAL_GROUPS.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>{item.name}</strong>
                <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                  {item.vernacularName}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                  {item.benchmarkPrice}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal: Safety Guide */}
      <Modal
        isOpen={activeModal === 'safety'}
        onClose={() => setActiveModal(null)}
        title="🛡️ E-Waste Safety Guide (सुरक्षा नियम)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
            <h4 style={{ color: '#dc2626', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
              ⚠️ Battery Handling (बैटरी कभी न तोड़ें)
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.4 }}>
              Do not puncture, burn, or open lithium mobile batteries. They can explode or cause severe chemical burns. Keep them dry.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px' }}>
            <h4 style={{ color: '#b45309', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
              🧤 Wear Gloves for Broken Glass & PCBs
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.4 }}>
              Never burn wires openly for copper extraction. Burning plastics releases toxic dioxin fumes harmful to lungs. Hand over directly to authorized recyclers for mechanized stripping.
            </p>
          </div>
        </div>
      </Modal>

      {/* Collector Bottom Navigation */}
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

export default CollectorDashboard;
