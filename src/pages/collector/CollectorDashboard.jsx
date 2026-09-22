import React, { useState, useEffect } from 'react';
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
  X,
  Recycle,
  Wrench,
  Truck,
  RefreshCw
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
import { calculateCollectorImpact } from '../../services/environmentalImpactService';
import { getOffersForCollector, acceptOffer } from '../../services/offerService';
import { createTransaction, getTransactionByOffer } from '../../services/transactionService';
import { subscribeToRealtimeSync } from '../../services/realtimeSync';

export const CollectorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';
  const [myLots, setMyLots] = useState(() => getScrapLotsByCollector(activeCollectorId));
  const [collectorOffers, setCollectorOffers] = useState(() => getOffersForCollector(activeCollectorId));
  const impact = calculateCollectorImpact(activeCollectorId);

  const [activeModal, setActiveModal] = useState(null); // 'prices', 'safety', 'notifications'
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedOfferForConfirm, setSelectedOfferForConfirm] = useState(null);
  const [acceptedOfferConfirmation, setAcceptedOfferConfirmation] = useState(null); // {offer, txnId}
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshData = () => {
    setIsSyncing(true);
    setMyLots(getScrapLotsByCollector(activeCollectorId));
    setCollectorOffers(getOffersForCollector(activeCollectorId));
    setTimeout(() => setIsSyncing(false), 300);
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToRealtimeSync(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [activeCollectorId]);

  const pendingOffers = collectorOffers.filter((o) => o.status === 'submitted' || o.status === 'viewed');
  const notificationCount = pendingOffers.length;

  const handleConfirmAccept = () => {
    if (!selectedOfferForConfirm) return;
    try {
      const updatedOffer = acceptOffer(selectedOfferForConfirm.offerId, selectedOfferForConfirm.lotId);
      let txnId = null;
      try {
        const newTxn = createTransaction({
          offerId: selectedOfferForConfirm.offerId,
          lotId: selectedOfferForConfirm.lotId,
          collectorId: activeCollectorId,
          collectorName: user?.name || 'Collector',
          buyerId: selectedOfferForConfirm.buyerId,
          buyerRole: selectedOfferForConfirm.buyerRole,
          buyerName: selectedOfferForConfirm.buyerName,
          materialCategory: selectedOfferForConfirm.materialCategory,
          materialSubcategory: selectedOfferForConfirm.materialSubcategory || '',
          weight: selectedOfferForConfirm.weight,
          weightUnit: selectedOfferForConfirm.weightUnit || 'kg',
          agreedPrice: selectedOfferForConfirm.offeredPrice,
          totalAmount: selectedOfferForConfirm.totalOfferValue,
        });
        txnId = newTxn?.transactionId || null;
      } catch (txErr) {
        try {
          const existingTxn = getTransactionByOffer(selectedOfferForConfirm.offerId);
          txnId = existingTxn?.transactionId || null;
        } catch (_) {}
      }

      // Show "Offer Accepted" confirmation — buyer pays, NOT the collector
      setAcceptedOfferConfirmation({
        offer: { ...selectedOfferForConfirm },
        txnId,
      });
      setSelectedOfferForConfirm(null);
      refreshData();
    } catch (err) {
      console.error('Failed to accept offer:', err);
    }
  };

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

        {/* PROMINENT LIVE BUYER OFFERS SECTION */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>💰</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Incoming Buyer Offers {pendingOffers.length > 0 ? `(${pendingOffers.length})` : ''}
              </h2>
              {pendingOffers.length > 0 && (
                <span style={{ background: '#dc2626', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                  ACTION NEEDED
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/collector/lots')}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>View All Lots</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {pendingOffers.length === 0 ? (
            <Card style={{ padding: '1.15rem', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📡</div>
              <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', margin: '0 0 2px 0' }}>
                No active buyer offers awaiting review
              </p>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                When Repair Shops or Authorized Recyclers submit offers on your scrap lots, they will appear right here with instant accept & digital payment.
              </span>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pendingOffers.map((offer) => {
                const isRepair = offer.buyerRole === 'repair';
                return (
                  <Card
                    key={offer.offerId}
                    style={{
                      padding: '1.15rem',
                      border: isRepair ? '1.5px solid #fed7aa' : '1.5px solid #bae6fd',
                      background: isRepair ? 'linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)' : 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', background: '#0f172a', color: '#f8fafc', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                            {offer.lotId}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: isRepair ? '#fef3c7' : '#e0f2fe', color: isRepair ? '#92400e' : '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {isRepair ? '🔧 Repair Shop Offer' : '♻ Recycler Offer'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
                          {offer.buyerName}
                        </h3>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                          Material: <strong>{offer.materialCategory}</strong> • {offer.weight} {offer.weightUnit || 'kg'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                          Total Offered Price
                        </span>
                        <strong style={{ fontSize: '1.35rem', color: '#15803d', fontWeight: 900 }}>
                          ₹{offer.totalOfferValue ? offer.totalOfferValue.toLocaleString('en-IN') : Math.round(offer.weight * offer.offeredPrice).toLocaleString('en-IN')}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                          (₹{offer.offeredPrice}/kg)
                        </span>
                      </div>
                    </div>

                    {offer.message && (
                      <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '6px 0 10px 0', fontSize: '0.78rem', color: '#334155', fontStyle: 'italic' }}>
                        💬 "{offer.message}"
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ flex: 1 }}
                        onClick={() => navigate('/collector/lots')}
                      >
                        Compare Offers
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        style={{ flex: 1.4 }}
                        onClick={() => setSelectedOfferForConfirm(offer)}
                      >
                        ✓ Accept Offer (स्वीकार करें)
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
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
              onClick={() => navigate('/collector/safety')}
              style={{ padding: '1.1rem 1rem', background: '#fffafb', border: '1.5px solid #fecaca' }}
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', marginBottom: '2px' }}>
                {t('safety', 'Safety')}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#991b1b' }}>
                {t('safetyGuidelines', 'Safety Guidelines')}
              </p>
            </Card>

            {/* 5. Book Home Pickup — Module 17 */}
            <Card
              interactive
              onClick={() => navigate('/collector/book-pickup')}
              style={{ padding: '1.1rem 1rem', background: '#eff6ff', border: '1.5px solid #bfdbfe' }}
              id="dashboard-card-book-pickup"
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>🏠</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '2px' }}>
                Book Pickup
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#1e40af' }}>
                Nearby Kabadiwala
              </p>
            </Card>

            {/* 6. My Pickups — Module 17 */}
            <Card
              interactive
              onClick={() => navigate('/collector/pickups')}
              style={{ padding: '1.1rem 1rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}
              id="dashboard-card-my-pickups"
            >
              <div style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>🚛</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#15803d', marginBottom: '2px' }}>
                My Pickups
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#166534' }}>
                Track Kabadiwala visits
              </p>
            </Card>
          </div>
        </div>

        {/* MODULE 11: MY ENVIRONMENTAL IMPACT */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2rem' }}>🌱</span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {t('myImpact', 'My Impact')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/collector/insights')}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>{t('insights', 'Insights')}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <Card style={{ padding: '1.15rem', border: '1.5px solid #bbf7d0', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '0.85rem' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('scrapHandled', 'Scrap Handled')}
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  {impact.totalScrapHandledKg} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kg</span>
                </span>
              </div>

              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('divertedWeight', 'Diverted from Landfill')}
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}>
                  {impact.divertedWeightKg} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>kg</span>
                </span>
              </div>
            </div>

            {/* Reuse vs Recycling Mini Breakdown */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <Wrench size={14} color="#b45309" />
                <span style={{ fontSize: '0.76rem', color: '#92400e', fontWeight: 700 }}>
                  {t('pathwayReuse', 'Reuse')}: {impact.reuseWeightKg} kg
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <Recycle size={14} color="#0369a1" />
                <span style={{ fontSize: '0.76rem', color: '#075985', fontWeight: 700 }}>
                  {t('pathwayRecycle', 'Recycle')}: {impact.recyclingWeightKg} kg
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                ⚠️ {t('prototypeEstimate', 'Prototype environmental estimate')}
              </span>
              <button
                type="button"
                onClick={() => navigate('/collector/insights')}
                style={{
                  background: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {t('viewInsights', 'View Insights →')}
              </button>
            </div>
          </Card>
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
          {pendingOffers.length > 0 ? (
            pendingOffers.map((o) => (
              <div key={o.offerId} style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#92400e', display: 'block' }}>
                  New Offer from {o.buyerName}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginTop: '2px' }}>
                  Offered <strong>₹{o.totalOfferValue || (o.weight * o.offeredPrice)}</strong> for Lot <strong>{o.lotId}</strong> ({o.materialCategory}, {o.weight} {o.weightUnit || 'kg'}).
                </span>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setSelectedOfferForConfirm(o);
                  }}
                  style={{
                    marginTop: '6px',
                    padding: '3px 10px',
                    background: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Review & Accept Offer →
                </button>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.84rem', color: '#64748b' }}>No pending offer notifications at this time.</p>
          )}

          <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#166534', display: 'block' }}>Payment Recorded: ₹780 ✓</strong>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>GreenCycle Material Recovery Ltd. paid for Lot LOT-0001 (PCB).</span>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirm Accept Offer */}
      {selectedOfferForConfirm && (
        <Modal
          isOpen={!!selectedOfferForConfirm}
          onClose={() => setSelectedOfferForConfirm(null)}
          title={`Accept Offer: ${selectedOfferForConfirm.offerId}`}
          maxWidth="480px"
        >
          <div>
            <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '1rem' }}>
              Are you sure you want to accept the offer from <strong>{selectedOfferForConfirm.buyerName}</strong> for Lot <strong>{selectedOfferForConfirm.lotId}</strong>?
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem', color: '#475569' }}>
                <span>Agreed Rate:</span>
                <strong>₹{selectedOfferForConfirm.offeredPrice}/kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ fontWeight: 700, color: '#166534' }}>Total You Will Receive:</span>
                <strong style={{ color: '#15803d', fontSize: '1.25rem', fontWeight: 900 }}>
                  ₹{selectedOfferForConfirm.totalOfferValue || (selectedOfferForConfirm.weight * selectedOfferForConfirm.offeredPrice)}
                </strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setSelectedOfferForConfirm(null)}>
                Cancel
              </Button>
              <Button variant="accent" onClick={handleConfirmAccept}>
                ✓ Confirm & Accept Offer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Offer Accepted Confirmation Modal */}
      {acceptedOfferConfirmation && (
        <Modal
          isOpen={!!acceptedOfferConfirmation}
          onClose={() => setAcceptedOfferConfirmation(null)}
          title="✅ Offer Accepted!"
          maxWidth="460px"
        >
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <CheckCircle2 size={40} color="#15803d" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
              Offer Accepted Successfully!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
              You've accepted the offer from <strong>{acceptedOfferConfirmation.offer.buyerName}</strong>. 
              The buyer has been notified and will complete the payment.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748b' }}>Lot</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{acceptedOfferConfirmation.offer.lotId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748b' }}>Buyer</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{acceptedOfferConfirmation.offer.buyerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748b' }}>Material</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{acceptedOfferConfirmation.offer.materialCategory} • {acceptedOfferConfirmation.offer.weight} {acceptedOfferConfirmation.offer.weightUnit || 'kg'}</span>
              </div>
              {acceptedOfferConfirmation.txnId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.84rem' }}>
                  <span style={{ color: '#64748b' }}>Transaction</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', fontSize: '0.8rem' }}>{acceptedOfferConfirmation.txnId}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1.5px solid #e2e8f0',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534' }}>
                  You Will Receive
                </span>
                <strong style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}>
                  ₹{(acceptedOfferConfirmation.offer.totalOfferValue || (acceptedOfferConfirmation.offer.weight * acceptedOfferConfirmation.offer.offeredPrice)).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
                fontSize: '0.78rem',
                color: '#1e40af',
                fontWeight: 600,
                marginBottom: '1rem',
                lineHeight: 1.5,
              }}
            >
              💳 The buyer ({acceptedOfferConfirmation.offer.buyerName}) will now complete payment via Cashfree. 
              You'll be notified once payment is verified.
            </div>

            <Button
              variant="accent"
              fullWidth
              onClick={() => setAcceptedOfferConfirmation(null)}
              style={{ padding: '0.85rem', fontSize: '0.95rem', fontWeight: 800 }}
            >
              Done ✓
            </Button>
          </div>
        </Modal>
      )}

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
