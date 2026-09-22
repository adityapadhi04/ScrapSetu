import React, { useState, useEffect } from 'react';
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
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  Filter
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
import { EmptyState } from '../../components/common/FeedbackStates';
import {
  getPickups,
  getPickupsByBuyer,
  schedulePickup,
  completePickup,
  cancelPickup
} from '../../services/pickupService';
import { 
  MOCK_RECYCLER_DATA, 
  MOCK_RECYCLER_LOTS
} from '../../data/mockData';
import { getRecyclerById, getActiveRecyclers } from '../../services/recyclerService';
import { getOffersForBuyer } from '../../services/offerService';
import { getTransactionsByBuyer } from '../../services/transactionService';
import { getAllScrapLots, getLotReuseEligibility } from '../../services/scrapLotService';
import { subscribeToRealtimeSync } from '../../services/realtimeSync';
import MakeOfferModal from '../../components/marketplace/MakeOfferModal';
import {
  createHandover,
  confirmBuyerReceipt,
  getHandoversByTransaction
} from '../../services/handoverService';
import {
  createPaymentRecord,
  getPaymentsByTransaction,
  VALID_PAYMENT_METHODS
} from '../../services/paymentService';
import DigitalScrapReceipt from '../../components/transactions/DigitalScrapReceipt';
import PaymentReceiptModal from '../../components/payment/PaymentReceiptModal';
import PaymentReceiptsPageShared from '../../components/payment/PaymentReceiptsPage';
import { getReceiptByTransaction } from '../../services/paymentReceiptService';

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
    { label: `📎 Payment Receipts`, path: '/recycler/receipts' },
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
  const { user } = useAuth();
  const activeBuyerId = user?.userId?.startsWith('REC') ? user.userId : (user?.recyclerId || (user?.userId || 'REC-0001'));
  const buyerName = user?.name || 'EcoGreen E-Waste Recyclers Pvt Ltd';

  const loadLotsData = () => {
    const rawLots = getAllScrapLots();
    if (!rawLots || rawLots.length === 0) return [];

    // Filter by recycling eligibility ('recycle' or 'both', and not completed/sold)
    const eligibleLots = rawLots.filter((lot) => {
      if (lot.status === 'Sold' || lot.transactionStatus === 'completed') return false;
      const eligibility = getLotReuseEligibility(lot);
      return eligibility.isEligibleForRecycler;
    });

    return eligibleLots.map((lot) => {
      const displayLocation = typeof lot.location === 'string'
        ? lot.location
        : (lot.location?.area ? `${lot.location.area}, ${lot.location.city || ''}` : (lot.location?.city || 'Local Collector'));
      const eligibility = getLotReuseEligibility(lot);
      const itemsList = Array.isArray(lot.items) && lot.items.length > 0
        ? lot.items
        : [{
            name: lot.materialType || lot.materialCategory || 'Recyclable Scrap',
            category: lot.materialCategory || lot.materialType,
            weight: lot.weight,
            condition: lot.condition || 'fair'
          }];

      return {
        id: lot.id,
        rawLot: lot,
        name: lot.materialType || lot.materialCategory,
        materialCategory: lot.materialCategory || lot.materialType,
        items: itemsList,
        collector: lot.collectorId || 'Local Collector',
        location: displayLocation,
        condition: lot.condition || 'fair',
        weight: lot.weight,
        weightUnit: lot.weightUnit || 'kg',
        availableQty: `${lot.weight} ${lot.weightUnit || 'kg'}`,
        estimatedRange: lot.estimatedLotValueMin
          ? `₹${lot.estimatedLotValueMin} - ₹${lot.estimatedLotValueMax}`
          : (lot.estimatedPrice ? `₹${Math.round(lot.estimatedPrice * (parseFloat(lot.weight) || 1))}` : (lot.priceEstimate?.priceRangeFormatted || '₹1,500 - ₹2,200')),
        sourceType: lot.sourceType || 'collector_created',
        notes: lot.notes || '',
        createdAt: lot.createdAt,
        eligibility
      };
    });
  };

  const [lots, setLots] = useState(loadLotsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLotForOffer, setSelectedLotForOffer] = useState(null);
  const [viewingLot, setViewingLot] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshLots = () => {
    setIsSyncing(true);
    setLots(loadLotsData());
    setTimeout(() => setIsSyncing(false), 300);
  };

  // Real-time synchronization subscription
  useEffect(() => {
    refreshLots();
    const unsubscribe = subscribeToRealtimeSync(() => {
      refreshLots();
    });
    return () => unsubscribe();
  }, []);

  const filtered = lots.filter((l) => {
    const term = searchTerm.toLowerCase();
    const matchesItems = l.items.some((it) =>
      (it.name && it.name.toLowerCase().includes(term)) ||
      (it.category && it.category.toLowerCase().includes(term))
    );
    return (
      l.id.toLowerCase().includes(term) ||
      l.name.toLowerCase().includes(term) ||
      l.condition.toLowerCase().includes(term) ||
      l.collector.toLowerCase().includes(term) ||
      l.location.toLowerCase().includes(term) ||
      matchesItems
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>📦 {t('availableLots')}</h1>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#ecfdf5', 
                  border: '1px solid #a7f3d0', 
                  color: '#065f46', 
                  fontSize: '0.74rem', 
                  fontWeight: 700, 
                  padding: '2px 8px', 
                  borderRadius: '999px' 
                }}>
                  <span style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    background: isSyncing ? '#f59e0b' : '#10b981',
                    boxShadow: isSyncing ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
                  }} />
                  {isSyncing ? 'Syncing...' : 'Real-Time Sync Active'}
                </span>
                <button
                  onClick={refreshLots}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  <RefreshCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </button>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Complete scrap lots available for authorized scientific recovery and recycling
              </p>
            </div>
          </div>

          <div style={{ width: '260px' }}>
            <Input
              placeholder="Search lots, materials, collector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <RecyclerNavBar />

        {filtered.length === 0 ? (
          <EmptyState
            title="No matching scrap lots"
            description="No collector has registered recycling-eligible scrap lots matching your search filter."
            actionLabel="Clear Search"
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((lot) => (
              <Card key={lot.id} style={{ padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#0f172a', color: '#f8fafc', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                        {lot.id}
                      </span>
                      {lot.sourceType === 'demo_seed' ? (
                        <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Demo Seed
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Collector Lot
                        </span>
                      )}
                      <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        ♻ {lot.eligibility?.label || 'Recycling Eligible'}
                      </span>
                      <Badge variant="success">✓ Available</Badge>
                    </div>

                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '6px 0', color: '#0f172a' }}>
                      {lot.name}
                    </h2>

                    {/* Complete Constituent Items Breakdown */}
                    <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '8px 0', maxWidth: '580px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Constituent Items & Materials ({lot.items.length}):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {lot.items.map((it, idx) => (
                          <div key={idx} style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                            <span>• <strong>{it.name || it.category}</strong> {it.subcategory ? `(${it.subcategory})` : ''}</span>
                            <span style={{ color: '#64748b' }}>{it.weight || 0} kg • {it.condition || 'fair'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', color: '#475569', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={14} color="#0284c7" />
                        Total Weight: <strong>{lot.availableQty}</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} color="#15803d" />
                        Condition: <strong>{lot.condition}</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#ea580c" />
                        Collector: <strong>{lot.collector}</strong> ({lot.location})
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '160px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Platform Valuation</span>
                    <strong style={{ fontSize: '1.25rem', color: '#0284c7' }}>{lot.estimatedRange}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingLot(lot)}
                  >
                    View Lot
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedLotForOffer(lot.rawLot)}
                  >
                    💰 MAKE OFFER
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: View Full Lot Breakdown */}
        {viewingLot && (
          <Modal
            isOpen={!!viewingLot}
            onClose={() => setViewingLot(null)}
            title={`Scrap Lot Details: ${viewingLot.id}`}
            maxWidth="600px"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{viewingLot.name}</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Registered: {viewingLot.createdAt ? new Date(viewingLot.createdAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <Badge variant="success">✓ Available</Badge>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Constituent Items & Materials Breakdown
                </span>
                <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px' }}>Item</th>
                        <th style={{ padding: '6px 10px' }}>Category</th>
                        <th style={{ padding: '6px 10px' }}>Weight</th>
                        <th style={{ padding: '6px 10px' }}>Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingLot.items.map((it, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600 }}>{it.name || it.category}</td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>{it.subcategory || it.category}</td>
                          <td style={{ padding: '6px 10px' }}>{it.weight} kg</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ textTransform: 'capitalize' }}>{it.condition || 'fair'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Total Weight</span>
                  <strong>{viewingLot.availableQty}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Platform Valuation</span>
                  <strong style={{ color: '#0284c7' }}>{viewingLot.estimatedRange}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Collector</span>
                  <strong>{viewingLot.collector}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Location</span>
                  <strong>{viewingLot.location}</strong>
                </div>
              </div>

              {viewingLot.notes && (
                <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bae6fd', marginBottom: '1rem', fontSize: '0.8rem', color: '#0369a1' }}>
                  <strong>Collector Notes:</strong> {viewingLot.notes}
                </div>
              )}

              {viewingLot.eligibility?.reasons && (
                <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#166534' }}>
                  <strong>Recycler Authorization & Processing Capability:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.1rem' }}>
                    {viewingLot.eligibility.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setViewingLot(null)}>
                  Close
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const lotToOffer = viewingLot.rawLot;
                    setViewingLot(null);
                    setSelectedLotForOffer(lotToOffer);
                  }}
                >
                  💰 Make Offer on {viewingLot.id}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Make Real Marketplace Offer */}
        {selectedLotForOffer && (
          <MakeOfferModal
            isOpen={!!selectedLotForOffer}
            onClose={() => setSelectedLotForOffer(null)}
            lot={selectedLotForOffer}
            buyerRole="recycler"
            buyerId={activeBuyerId}
            buyerName={buyerName}
            onOfferSubmitted={() => {
              setSelectedLotForOffer(null);
              refreshLots();
            }}
          />
        )}

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const activeBuyerId = user?.userId || 'REC-0001';

  const [pickups, setPickups] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedLoc, setSchedLoc] = useState('');
  const [schedNotes, setSchedNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadPickups = () => {
    let list = getPickupsByBuyer(activeBuyerId, 'recycler');
    if (!list || list.length === 0) {
      list = getPickups().filter((p) => p.buyerRole === 'recycler');
    }
    setPickups(list);
  };

  useEffect(() => {
    loadPickups();
  }, [activeBuyerId]);

  const handleOpenSchedule = (pkp) => {
    setSelectedPickup(pkp);
    setSchedDate(pkp.scheduledDate || '');
    setSchedTime(pkp.scheduledTime || '');
    setSchedLoc(pkp.location || '');
    setSchedNotes(pkp.notes || '');
    setIsScheduling(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedPickup) return;
    try {
      schedulePickup(selectedPickup.pickupId, {
        scheduledDate: schedDate,
        scheduledTime: schedTime,
        location: schedLoc,
        notes: schedNotes,
      }, user);
      loadPickups();
      setIsScheduling(false);
      setSelectedPickup(null);
    } catch (err) {
      alert(err.message || 'Scheduling failed');
    }
  };

  const handleMarkComplete = (pickupId) => {
    try {
      completePickup(pickupId, { notes: 'Material verified and received at recycler facility.' }, user);
      loadPickups();
      setSelectedPickup(null);
    } catch (err) {
      alert(err.message || 'Failed to complete pickup');
    }
  };

  const handleCancel = () => {
    if (!selectedPickup) return;
    try {
      cancelPickup(selectedPickup.pickupId, cancelReason || 'Buyer requested cancellation', user);
      loadPickups();
      setShowCancelModal(false);
      setSelectedPickup(null);
    } catch (err) {
      alert(err.message || 'Failed to cancel pickup');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge variant="success">✓ Completed</Badge>;
      case 'scheduled': return <Badge variant="info">📅 Scheduled</Badge>;
      case 'cancelled': return <Badge variant="error">✕ Cancelled</Badge>;
      default: return <Badge variant="warning">⏳ Requested</Badge>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>🚚 {t('pickupCoordination') || 'Pickup & Collection Coordination'}</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
              {t('pickupCoordinationSubtitle') || 'Material transfer and collection coordination between collectors and buyers'}
            </p>
          </div>
        </div>

        <RecyclerNavBar />

        {pickups.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚚</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{t('noPickupsFound') || 'No pickup coordination records found.'}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Pickup requests will appear here when collectors coordinate accepted offers.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pickups.map((pickup) => (
              <Card key={pickup.pickupId} style={{ padding: '1.25rem', borderLeft: `5px solid ${pickup.status === 'completed' ? '#16a34a' : (pickup.status === 'scheduled' ? '#0284c7' : '#d97706')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#0f172a' }}>
                        {pickup.pickupId}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                        Txn: {pickup.transactionId}
                      </span>
                      {getStatusBadge(pickup.status)}
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        {pickup.method === 'buyer_pickup' ? '• Vehicle Pickup' : '• Facility Drop-off'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0 6px' }}>
                      Lot ID: {pickup.lotId || 'Associated Scrap Lot'}
                    </h3>

                    <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {pickup.scheduledDate ? (
                        <div>📅 Scheduled: <strong>{pickup.scheduledDate}</strong> at <strong>{pickup.scheduledTime || 'Flexible'}</strong></div>
                      ) : (
                        <div style={{ color: '#d97706', fontWeight: 600 }}>⏳ Date & time not confirmed yet</div>
                      )}
                      {pickup.location && (
                        <div>📍 Location: <strong>{pickup.location}</strong></div>
                      )}
                      {pickup.notes && (
                        <div style={{ color: '#64748b', fontStyle: 'italic' }}>"{pickup.notes}"</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    {pickup.status === 'requested' && (
                      <Button variant="primary" size="sm" onClick={() => handleOpenSchedule(pickup)}>
                        Confirm / Set Schedule
                      </Button>
                    )}

                    {pickup.status === 'scheduled' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenSchedule(pickup)}>
                          Reschedule
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleMarkComplete(pickup.pickupId)}>
                          ✓ Mark Completed
                        </Button>
                      </div>
                    )}

                    {pickup.status !== 'completed' && pickup.status !== 'cancelled' && (
                      <button
                        onClick={() => { setSelectedPickup(pickup); setShowCancelModal(true); }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.74rem', cursor: 'pointer', padding: 0 }}
                      >
                        Cancel Coordination
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Schedule / Reschedule Modal */}
        {isScheduling && selectedPickup && (
          <Modal
            isOpen={isScheduling}
            onClose={() => setIsScheduling(false)}
            title={`Coordination Schedule: ${selectedPickup.pickupId}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.82rem' }}>
                <div>Transaction ID: <strong>{selectedPickup.transactionId}</strong></div>
                <div>Collector ID: <strong>{selectedPickup.collectorId}</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t('scheduledDate') || 'Scheduled Date'}
                  </label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t('scheduledTime') || 'Scheduled Time'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {t('pickupLocation') || 'Meeting / Facility Location'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recycler Hub Gate 1, Industrial Area"
                  value={schedLoc}
                  onChange={(e) => setSchedLoc(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {t('pickupNotes') || 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <Button variant="outline" fullWidth onClick={() => setIsScheduling(false)}>
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={handleConfirmSchedule}>
                  Confirm Dispatch Schedule
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && selectedPickup && (
          <Modal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            title={`Cancel Pickup: ${selectedPickup.pickupId}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Please provide a reason for cancelling this pickup schedule.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Rescheduling required due to transport delay"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" fullWidth onClick={() => setShowCancelModal(false)}>
                  Go Back
                </Button>
                <Button variant="secondary" fullWidth onClick={handleCancel}>
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </Modal>
        )}

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
  const { user } = useAuth();

  const activeRecyclerId = (user?.role === 'RECYCLER' && user?.userId?.startsWith('REC'))
    ? user.userId
    : 'REC-0001';

  const [realOffers, setRealOffers] = useState(() => getOffersForBuyer(activeRecyclerId));

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

        {realOffers.length === 0 ? (
          <Card style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            <Package size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              No recycling offers submitted yet
            </h3>
            <p style={{ fontSize: '0.85rem', margin: '0 auto 1.25rem auto', maxWidth: '360px' }}>
              View available collector scrap lots in your dashboard and submit formal bids for e-waste processing.
            </p>
            <Button variant="secondary" onClick={() => navigate('/recycler')}>
              View Available Scrap Lots →
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {realOffers.map((offer) => {
              const isAccepted = offer.status === 'accepted';
              const isRejected = offer.status === 'rejected';
              return (
                <Card key={offer.offerId} style={{ padding: '1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, color: '#0f172a' }}>
                          {offer.offerId}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          {offer.lotId}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {offer.materialCategory}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', margin: '3px 0' }}>
                        Weight: <strong>{offer.weight} {offer.weightUnit}</strong> • Rate: <strong>₹{offer.offeredPrice}/kg</strong>
                      </p>
                      {offer.message && (
                        <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', margin: '3px 0' }}>
                          "{offer.message}"
                        </p>
                      )}
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        📅 {new Date(offer.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Offer Value</span>
                      <strong style={{ fontSize: '1.3rem', color: '#15803d' }}>
                        ₹{offer.totalOfferValue?.toLocaleString('en-IN')}
                      </strong>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '99px',
                            background: isAccepted ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                            color: isAccepted ? '#15803d' : isRejected ? '#dc2626' : '#92400e',
                            border: `1px solid ${isAccepted ? '#86efac' : isRejected ? '#fca5a5' : '#fde68a'}`,
                            textTransform: 'uppercase'
                          }}
                        >
                          {offer.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAccepted && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #dcfce7', background: '#f0fdf4', margin: '0.85rem -1.25rem -1.25rem -1.25rem', padding: '0.75rem 1.25rem', borderRadius: '0 0 10px 10px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                        ✓ Collector selected your recycling bid! Formal dispatch and manifest will proceed in next platform phase.
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

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
 * Recycler Transactions / Orders Page — Live from transactionService (Module 9)
 */
export const RecyclerOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeRecyclerId = (user?.role === 'RECYCLER' && user?.userId?.startsWith('REC'))
    ? user.userId
    : 'REC-0001';

  const [transactions, setTransactions] = useState([]);
  const [receiptData, setReceiptData] = useState(null);

  // Payment modal state
  const [paymentModalTx, setPaymentModalTx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentRefNote, setPaymentRefNote] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Receipt upload modal state (Module 16)
  const [receiptUploadTx, setReceiptUploadTx] = useState(null);

  const refreshList = () => {
    setTransactions(getTransactionsByBuyer(activeRecyclerId));
  };

  useEffect(() => {
    refreshList();
  }, [activeRecyclerId]);

  const handleViewReceipt = (tx) => {
    const handovers = getHandoversByTransaction(tx.transactionId);
    const payments = getPaymentsByTransaction(tx.transactionId);
    setReceiptData({ transaction: tx, handover: handovers[0] || null, payment: payments[0] || null });
  };

  const handleConfirmReceipt = (tx) => {
    try {
      const existing = getHandoversByTransaction(tx.transactionId);
      let target = existing[0];
      if (!target) {
        target = createHandover({
          transactionId: tx.transactionId,
          lotId: tx.lotId,
          collectorId: tx.collectorId,
          buyerId: activeRecyclerId,
          buyerRole: 'recycler',
          materialCategory: tx.materialCategory,
          weight: tx.weight,
          weightUnit: tx.weightUnit,
          handoverMethod: 'collector_delivers',
          handoverLocation: { area: 'Recycling Facility MIDC', city: '', state: '' }
        });
      }
      confirmBuyerReceipt(target.handoverId, activeRecyclerId);
      refreshList();
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
    }
  };

  const handleOpenPayment = (tx) => {
    setPaymentModalTx(tx);
    setPaymentMethod('Bank Transfer');
    setPaymentRefNote('');
    setPaymentError('');
  };

  const handleSavePaymentSubmit = () => {
    if (!paymentModalTx) return;
    try {
      createPaymentRecord({
        transactionId: paymentModalTx.transactionId,
        collectorId: paymentModalTx.collectorId,
        buyerId: activeRecyclerId,
        buyerRole: 'recycler',
        amount: paymentModalTx.totalAmount,
        currency: 'INR',
        paymentMethod,
        referenceNote: paymentRefNote.trim(),
        recordedBy: activeRecyclerId
      });
      refreshList();
      setPaymentModalTx(null);
    } catch (err) {
      setPaymentError(err.message || 'Payment recording failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>📄 {t('transactions')} / {t('orders')}</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>ScrapSetu transaction ledger • Demo records for CPCB traceability</p>
          </div>
        </div>

        <RecyclerNavBar />

        {transactions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('noTransactionsYet')}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>
              Transactions appear here once your offers are accepted by a Collector.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1rem' }}>
            {transactions.map((tx) => {
              const isCompleted = tx.transactionStatus === 'completed';
              const canConfirmReceipt = tx.handoverStatus !== 'confirmed';
              const canRecordPayment = tx.paymentStatus !== 'recorded';

              return (
                <Card
                  key={tx.transactionId}
                  style={{ padding: '1.25rem', borderLeft: `4px solid ${isCompleted ? '#16a34a' : '#d97706'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        {[tx.transactionId, tx.offerId, tx.lotId].map((id) => (
                          <span key={id} style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{id}</span>
                        ))}
                        <Badge variant={isCompleted ? 'success' : 'warning'}>
                          {tx.transactionStatus?.replace(/_/g, ' ')}
                        </Badge>
                        {tx.handoverStatus === 'confirmed' && <Badge variant="success">Handover Confirmed ✓</Badge>}
                        {tx.paymentStatus === 'recorded' && <Badge variant="success">Payment Recorded ✓</Badge>}
                        {isCompleted && <Badge variant="success">EPR Credit Eligible</Badge>}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{tx.materialCategory}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {tx.weight} {tx.weightUnit} • Collector: <strong>{tx.collectorName}</strong>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', display: 'block' }}>₹{(tx.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '6px' }}>
                        {canConfirmReceipt && (
                          <Button
                            variant="primary"
                            size="sm"
                            id={`btn-rec-confirm-receipt-${tx.transactionId}`}
                            onClick={() => handleConfirmReceipt(tx)}
                          >
                            {t('confirmReceipt')}
                          </Button>
                        )}
                        {canRecordPayment && (
                          <Button
                            variant="outline"
                            size="sm"
                            id={`btn-rec-payment-${tx.transactionId}`}
                            onClick={() => handleOpenPayment(tx)}
                          >
                            {t('recordPayment')}
                          </Button>
                        )}
                        {/* Module 16: Upload Payment Receipt */}
                        <Button
                          variant="ghost"
                          size="sm"
                          id={`btn-rec-upload-receipt-${tx.transactionId}`}
                          onClick={() => setReceiptUploadTx(tx)}
                          style={{
                            borderColor: getReceiptByTransaction(tx.transactionId) ? '#15803d' : undefined,
                            color: getReceiptByTransaction(tx.transactionId) ? '#15803d' : undefined,
                          }}
                        >
                          📎 {getReceiptByTransaction(tx.transactionId) ? 'View Receipt' : 'Upload Receipt'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          id={`btn-rec-receipt-${tx.transactionId}`}
                          onClick={() => handleViewReceipt(tx)}
                        >
                          {t('viewReceipt')}
                        </Button>
                        {isCompleted && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={FileCheck}
                            onClick={() => alert('Downloading EPR Credit Certificate... [Demo]')}
                          >
                            EPR Credit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalTx && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setPaymentModalTx(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '1.5rem',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                💰 {t('recordPayment')}
              </h3>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', color: '#92400e', marginBottom: '1rem', fontWeight: 600 }}>
                ⚠️ Demo payment record — not real payment processing.
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Transaction <strong>{paymentModalTx.transactionId}</strong> • Total: <strong style={{ color: '#15803d' }}>₹{(paymentModalTx.totalAmount || 0).toLocaleString('en-IN')}</strong>
              </p>

              {paymentError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                  {paymentError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    {VALID_PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Reference Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank transfer ref / Demo payment note"
                    value={paymentRefNote}
                    onChange={(e) => setPaymentRefNote(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setPaymentModalTx(null)}>Cancel</Button>
                <Button variant="primary" id="btn-submit-rec-payment" onClick={handleSavePaymentSubmit}>
                  Save Payment Record
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>

      {/* Receipt Modal */}
      {receiptData && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setReceiptData(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <DigitalScrapReceipt transaction={receiptData.transaction} handover={receiptData.handover} payment={receiptData.payment} />
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <Button variant="outline" onClick={() => setReceiptData(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {/* Upload Payment Receipt Modal (Module 16) */}
      <PaymentReceiptModal
        isOpen={!!receiptUploadTx}
        onClose={() => setReceiptUploadTx(null)}
        transaction={receiptUploadTx}
        uploadedBy={activeRecyclerId}
        uploadedByRole="recycler"
        buyerName={user?.name || 'Recycler'}
        onUploaded={() => {
          setReceiptUploadTx(null);
          refreshList();
        }}
      />
      <MobileBottomNav role="RECYCLER" />
    </div>
  );
};

/**
 * Recycler Payment Receipts Page (/recycler/receipts) — Module 16
 */
export const RecyclerReceiptsPage = () => {
  return (
    <PaymentReceiptsPageShared
      role="recycler"
      backPath="/recycler/orders"
      NavBar={RecyclerNavBar}
    />
  );
};

/**
 * Recycler Profile Page
 */
export const RecyclerProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const activeRecyclerId = (user?.role === 'RECYCLER' && user?.userId?.startsWith('REC'))
    ? user.userId
    : 'REC-0001';

  const recycler = getRecyclerById(activeRecyclerId) || getActiveRecyclers()[0] || {
    recyclerId: 'REC-0001',
    businessName: 'GreenCycle Material Recovery Ltd.',
    contactName: 'Anil Mohanty',
    phone: '+91 94370 12345',
    email: 'info@greencycle-demo.org',
    address: { area: 'MIDC Industrial Estate', city: 'Rayagada', state: 'Odisha', pincode: '765001' },
    acceptedMaterials: ['PCB', 'Cable', 'Battery'],
    services: ['Collection', 'Drop-off', 'Bulk Recycling'],
    pickupAvailable: true,
    operatingAreas: ['Gunupur', 'Rayagada'],
    minimumWeightKg: 5,
    paymentMethods: ['Cash', 'UPI', 'Bank Transfer'],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0001'
  };

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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{recycler.businessName}</h2>
              <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 700 }}>
                {recycler.authorizationType}: {recycler.verificationStatus}
              </span>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#166534', marginBottom: '1rem' }}>
            ℹ️ {t('prototypeRecyclerNotice')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Authorization Number</span>
              <strong style={{ fontFamily: 'monospace' }}>{recycler.authorizationNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Contact Person</span>
              <strong>{recycler.contactName} ({recycler.phone})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Facility Address</span>
              <strong>{recycler.address.area}, {recycler.address.city}, {recycler.address.state} - {recycler.address.pincode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>{t('operatingAreasText')}</span>
              <strong>{recycler.operatingAreas?.join(', ')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Accepted Materials</span>
              <strong>{recycler.acceptedMaterials?.join(' • ')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>{t('minimumLotWeight')}</span>
              <strong>{recycler.minimumWeightKg} kg</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Pickup Service</span>
              <strong>{recycler.pickupAvailable ? '🚚 ' + t('pickupAvailableText') : '🏢 ' + t('dropOffOnly')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Services</span>
              <span>{recycler.services?.join(' • ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>{t('paymentMethodsText')}</span>
              <span>{recycler.paymentMethods?.join(', ')}</span>
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
