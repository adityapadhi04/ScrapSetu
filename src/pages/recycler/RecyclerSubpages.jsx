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
import { getRecyclerById, getActiveRecyclers } from '../../services/recyclerService';
import { getOffersForBuyer } from '../../services/offerService';
import { getTransactionsByBuyer } from '../../services/transactionService';
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
      <MobileBottomNav role="RECYCLER" />
    </div>
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
