import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  IndianRupee, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldCheck, 
  MapPin,
  LogOut
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  MOCK_RECYCLER_DATA, 
  MOCK_RECYCLER_LOTS, 
  MOCK_RECYCLER_PICKUPS 
} from '../../data/mockData';

/**
 * Reusable Recycler Navigation Bar
 */
export const RecyclerNavBar = () => {
  const { t } = useLanguage();
  const navItems = [
    { label: `🏠 ${t('dashboard')}`, path: '/recycler', end: true },
    { label: `📦 ${t('availableLots')}`, path: '/recycler/lots' },
    { label: `🚚 ${t('pickupRequests')}`, path: '/recycler/pickups' },
    { label: `💰 ${t('offers')}`, path: '/recycler/offers' },
    { label: `📋 ${t('orders')}`, path: '/recycler/orders' },
    { label: `👤 ${t('profile')}`, path: '/recycler/profile' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '8px',
      marginBottom: '1.5rem',
      borderBottom: '1px solid #e2e8f0',
      scrollbarWidth: 'none'
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => `btn ${isActive ? 'btn-secondary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap', fontSize: '0.86rem', padding: '0.5rem 0.9rem' }}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
};

/**
 * Recycler Lots Page (Cards matching Step 10)
 */
export const RecyclerLotsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedLotForOffer, setSelectedLotForOffer] = useState(null);
  const [offerBid, setOfferBid] = useState('1750');

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    alert(`Offer of ₹${offerBid} submitted for ${selectedLotForOffer.material} (Lot ${selectedLotForOffer.id})! [Demo]`);
    setSelectedLotForOffer(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>📦 {t('availableLots')}</h1>
        </div>

        <RecyclerNavBar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MOCK_RECYCLER_LOTS.map((lot) => (
            <Card key={lot.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {lot.id}
                    </span>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{lot.material}</h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Approx. weight: <strong>{lot.approxWeight}</strong> • Distance: <strong>{lot.distance}</strong>
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Collector location: {lot.collectorLocation}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Estimated Range</span>
                  <strong style={{ fontSize: '1.25rem', color: '#0284c7' }}>{lot.estimatedRange}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedLotForOffer(lot)}
                >
                  MAKE OFFER
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal: Make Offer */}
        <Modal
          isOpen={!!selectedLotForOffer}
          onClose={() => setSelectedLotForOffer(null)}
          title={`Make Offer: ${selectedLotForOffer?.material}`}
        >
          {selectedLotForOffer && (
            <form onSubmit={handleOfferSubmit}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Submitting competitive offer for Lot {selectedLotForOffer.id} ({selectedLotForOffer.approxWeight}). Estimated range is {selectedLotForOffer.estimatedRange}.
              </p>
              <Input
                label="Offer Amount (₹)"
                type="number"
                value={offerBid}
                onChange={(e) => setOfferBid(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" fullWidth style={{ marginTop: '1rem' }}>
                Submit Offer to Collector
              </Button>
            </form>
          )}
        </Modal>

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
      <MobileBottomNav role="RECYCLER" />
    </div>
  );
};

/**
 * Recycler Pickups Page (Cards matching Step 11)
 */
export const RecyclerPickupsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedPickup, setSelectedPickup] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>🚚 {t('pickupRequests')}</h1>
        </div>

        <RecyclerNavBar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MOCK_RECYCLER_PICKUPS.map((pickup) => (
            <Card key={pickup.lotId} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      Lot ID: {pickup.lotId}
                    </span>
                    <Badge variant="warning">{pickup.statusBadge}</Badge>
                  </div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{pickup.material}</h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Approximate weight: <strong>{pickup.approxWeight}</strong>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Pickup area: {pickup.pickupArea}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPickup(pickup)}
                >
                  VIEW DETAILS
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal: View Pickup Details */}
        <Modal
          isOpen={!!selectedPickup}
          onClose={() => setSelectedPickup(null)}
          title={`Pickup Details: Lot ${selectedPickup?.lotId}`}
        >
          {selectedPickup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Item & Weight</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedPickup.material} ({selectedPickup.approxWeight})</h4>
                <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                  Pickup Cluster: <strong>{selectedPickup.pickupArea}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <Badge variant="warning">{selectedPickup.status}</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Logistics Assigned</span>
                <strong>{selectedPickup.driver}</strong>
              </div>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  alert(`Confirming route for ${selectedPickup.lotId}! (Demo)`);
                  setSelectedPickup(null);
                }}
              >
                Confirm Dispatch Schedule
              </Button>
            </div>
          )}
        </Modal>

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
      <MobileBottomNav role="RECYCLER" />
    </div>
  );
};

/**
 * Recycler Offers Page
 */
export const RecyclerOffersPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>💰 {t('offers')}</h1>
        </div>

        <RecyclerNavBar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Offer on Lot SS-2026-001</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Laptop PCB (2.4 kg)</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>Your Bid: ₹1,650 (CPCB Benchmark rate)</p>
              </div>
              <Badge variant="info">Pending Collector Review</Badge>
            </div>
          </Card>

          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Offer on Lot SS-2026-002</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Copper Cable (5.0 kg)</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>Your Bid: ₹2,200</p>
              </div>
              <Badge variant="success">Accepted ✓</Badge>
            </div>
          </Card>
        </div>

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
      <MobileBottomNav role="RECYCLER" />
    </div>
  );
};

/**
 * Recycler Transactions / Orders Page
 */
export const RecyclerOrdersPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>📄 {t('transactions')} / {t('orders')}</h1>
        </div>

        <RecyclerNavBar />

        <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <Badge variant="success">EPR Certificate Generated ✓</Badge>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>
                TXN-9842 (Handover Verified via QR)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                12 kg Motherboards • ₹3,450 paid to Ramesh K. (Collector)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={FileCheck}
              onClick={() => alert('Downloading EPR Credit Certificate... [Demo]')}
            >
              Download EPR Credit
            </Button>
          </div>
        </Card>

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
      <MobileBottomNav role="RECYCLER" />
    </div>
  );
};

/**
 * Recycler Profile Page
 */
export const RecyclerProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>👤 {t('profile')}</h1>
        </div>

        <RecyclerNavBar />

        <Card style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={32} color="#0284c7" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{MOCK_RECYCLER_DATA.name}</h2>
              <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 700 }}>
                CPCB Authorization: {MOCK_RECYCLER_DATA.authorizationStatus}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>CPCB Registration No.</span>
              <strong style={{ fontFamily: 'monospace' }}>{MOCK_RECYCLER_DATA.cpcbRegNo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Notice</span>
              <span style={{ color: '#64748b' }}>{MOCK_RECYCLER_DATA.authorizationNotice}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Facility Address</span>
              <strong>MIDC Industrial Zone, Navi Mumbai</strong>
            </div>
          </div>
        </Card>

        {/* Switch Account Section */}
        <Card style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            🔄 {t('switchAccount')}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>
            Switch to a different portal account on this device.
          </p>
          <AccountSwitcher dropup={false} />
        </Card>

        {/* Logout Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button
            id="recycler-logout-button"
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              width: '100%',
              maxWidth: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.85rem',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </PageContainer>
      <MobileBottomNav role="RECYCLER" />
    </div>
  );
};
