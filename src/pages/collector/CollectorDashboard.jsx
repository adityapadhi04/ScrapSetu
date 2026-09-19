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
  Bell,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Modal from '../../components/common/Modal';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { 
  CORE_MATERIAL_GROUPS, 
  MOCK_COLLECTOR_DATA, 
  MOCK_NEARBY_BUYERS 
} from '../../data/mockData';
import { getScrapLotsByCollector } from '../../services/scrapLotService';

export const CollectorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';
  const myLots = getScrapLotsByCollector(activeCollectorId);

  const [activeModal, setActiveModal] = useState(null); // 'prices', 'safety', 'notifications'
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [notificationCount, setNotificationCount] = useState(2);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        {/* Simple Vernacular Greeting & Notification Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                {t('greeting')} 👋
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              {t('welcomeBack')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveModal('notifications')}
              className="btn btn-outline"
              style={{
                padding: '8px',
                minHeight: '40px',
                width: '40px',
                borderRadius: '50%',
                position: 'relative'
              }}
              aria-label="Notifications"
            >
              <Bell size={18} color="#0f172a" />
              {notificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PRIMARY ACTION: Large Prominent "SELL SCRAP" Hero Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            id="collector-primary-sell-scrap-btn"
            onClick={() => navigate('/collector/sell')}
            className="btn-collector-camera"
            aria-label="Sell Scrap"
            style={{
              flexDirection: 'column',
              padding: '1.25rem 1rem',
              gap: '6px',
              minHeight: '84px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={34} strokeWidth={2.5} />
              <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '0.02em' }}>
                📷 {t('sellScrap')}
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#dcfce7', opacity: 0.95 }}>
              {t('sellScrapSubtitle')}
            </span>
          </button>
        </div>

        {/* QUICK INFORMATION: Today's Earnings */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="card-hero-earnings">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('todaysEarnings')}
              </span>
              <TrendingUp size={18} color="#22c55e" />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {MOCK_COLLECTOR_DATA.todaysEarnings}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#86efac', fontWeight: 600 }}>
                ✓ Paid directly to UPI / Cash
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '0.65rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <span>Completed today: <strong>1 Lot (2.4 kg PCB)</strong></span>
              <span
                onClick={() => navigate('/collector/earnings')}
                style={{ color: '#86efac', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                View Ledger →
              </span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS: 4 Big Touch Cards */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('quickActions')}</h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Touch to open</span>
          </div>

          <div className="grid-cols-2" style={{ gap: '0.85rem' }}>
            {/* 1. Price Board */}
            <Card
              interactive
              onClick={() => setActiveModal('prices')}
              style={{ padding: '1.1rem 1rem', background: '#ffffff', border: '1.5px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>💰</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>
                {t('priceBoard')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {t('prices')} (8 e-waste items)
              </p>
            </Card>

            {/* 2. My Lots */}
            <Card
              interactive
              onClick={() => navigate('/collector/lots')}
              style={{ padding: '1.1rem 1rem', background: '#ffffff', border: '1.5px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>📦</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>
                {t('myLots')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {myLots.length} {myLots.length === 1 ? 'Active Lot' : 'Active Lots'}
              </p>
            </Card>

            {/* 3. Transactions */}
            <Card
              interactive
              onClick={() => navigate('/collector/transactions')}
              style={{ padding: '1.1rem 1rem', background: '#ffffff', border: '1.5px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>📄</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>
                {t('transactions')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Receipts & Ledgers
              </p>
            </Card>

            {/* 4. Safety */}
            <Card
              interactive
              onClick={() => setActiveModal('safety')}
              style={{ padding: '1.1rem 1rem', background: '#fffafb', border: '1.5px solid #fecaca' }}
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginBottom: '2px' }}>
                {t('safety')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#991b1b' }}>
                Safety Guidelines
              </p>
            </Card>
          </div>
        </div>

        {/* NEARBY BUYERS PREVIEW */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('nearbyBuyers')}</h2>
            <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>2 Verified Nearby</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_NEARBY_BUYERS.map((buyer) => (
              <Card
                key={buyer.id}
                interactive
                onClick={() => setSelectedBuyer(buyer)}
                style={{ padding: '1rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{buyer.typeIcon}</span>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{buyer.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={12} color="#16a34a" />
                        <strong>{buyer.distance}</strong> • {buyer.specialty}
                      </p>
                    </div>
                  </div>

                  <Badge variant={buyer.type === 'Recycler' ? 'info' : 'warning'}>
                    {buyer.badgeText}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* LOWER NAVIGATION: Account Switcher */}
        <div style={{ marginTop: '2.5rem', marginBottom: '5.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>

      {/* Modal: Fair Price Board */}
      <Modal
        isOpen={activeModal === 'prices'}
        onClose={() => setActiveModal(null)}
        title="💰 Today's E-Waste Price Board (बाजार भाव)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Fair benchmark prices governed by CPCB compliance rules to prevent informal scrap collectors from being underpaid:
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
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ padding: '0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
            <h4 style={{ color: '#dc2626', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
              ⚠️ Never Burn Wires Openly (तार कभी न जलाएं)
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.4 }}>
              Burning plastic coating produces toxic dioxins that permanently damage lungs. Authorized recyclers use mechanized stripping machines.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px' }}>
            <h4 style={{ color: '#b45309', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
              ⚠️ Do Not Puncture Batteries (बैटरी न तोड़ें)
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.4 }}>
              Lithium phone/laptop batteries ignite instantly if punctured. Store them in dry plastic buckets away from direct heat.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal: Notifications */}
      <Modal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
        title="🔔 Notifications"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#166534', display: 'block' }}>Payment Received: ₹1,800 ✓</strong>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>Om Electronics paid for Lot SS-2026-001 (Laptop PCB).</span>
          </div>

          <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#92400e', display: 'block' }}>New Offer from ABC Recycling</strong>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>Offered ₹2,200 for your 5 kg Copper Cable lot.</span>
          </div>
        </div>
      </Modal>

      {/* Modal: Nearby Buyer Details */}
      <Modal
        isOpen={!!selectedBuyer}
        onClose={() => setSelectedBuyer(null)}
        title={`${selectedBuyer?.typeIcon || '🤝'} ${selectedBuyer?.name}`}
      >
        {selectedBuyer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Entity Type & Accreditation</span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{selectedBuyer.type}</h4>
              <p style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600, marginTop: '4px' }}>
                {selectedBuyer.badgeText} • Rating: {selectedBuyer.rating} ★
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
              <p><strong>Distance:</strong> {selectedBuyer.distance}</p>
              <p><strong>Address:</strong> {selectedBuyer.address}</p>
              <p><strong>Specialty:</strong> {selectedBuyer.specialty}</p>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setSelectedBuyer(null);
                navigate('/collector/sell');
              }}
            >
              📷 Sell Scrap to this Buyer
            </Button>
          </div>
        )}
      </Modal>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

export default CollectorDashboard;
