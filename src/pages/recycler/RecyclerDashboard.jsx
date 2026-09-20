import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  IndianRupee, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  MapPin, 
  Filter,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { RecyclerNavBar } from './RecyclerSubpages';
import { 
  MOCK_RECYCLER_DATA, 
  MOCK_RECYCLER_LOTS 
} from '../../data/mockData';
import { 
  getInquiriesByRecycler, 
  updateInquiryStatus, 
  getRecyclerInquiries 
} from '../../services/recyclerInquiryService';
import { getRecyclerById } from '../../services/recyclerService';
import { getEligibleLotsForRecycler } from '../../services/offerMatchingService';
import { getOffersForBuyer } from '../../services/offerService';
import { subscribeToRealtimeSync } from '../../services/realtimeSync';
import MakeOfferModal from '../../components/marketplace/MakeOfferModal';


export const RecyclerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedLotForOffer, setSelectedLotForOffer] = useState(null);
  const [offerBid, setOfferBid] = useState('');

  // Active recycler facility ID (fallback to REC-0001 for demo)
  const activeRecyclerId = (user?.userId?.startsWith('REC'))
    ? user.userId
    : 'REC-0001';
  const recyclerRecord = getRecyclerById(activeRecyclerId);
  const recyclerName = recyclerRecord?.businessName || user?.name || MOCK_RECYCLER_DATA.name;

  // Module 8: Eligible Lots and Live Offers State
  const [eligibleLots, setEligibleLots] = useState(() => getEligibleLotsForRecycler(activeRecyclerId));
  const [myOffers, setMyOffers] = useState(() => getOffersForBuyer(activeRecyclerId));
  const [selectedLotForModal, setSelectedLotForModal] = useState(null);

  const refreshOffersAndLots = () => {
    setEligibleLots(getEligibleLotsForRecycler(activeRecyclerId));
    setMyOffers(getOffersForBuyer(activeRecyclerId));
  };

  useEffect(() => {
    refreshOffersAndLots();
    const unsubscribe = subscribeToRealtimeSync(() => {
      refreshOffersAndLots();
    });
    return () => unsubscribe();
  }, [activeRecyclerId]);


  // Module 7: Recycler Inquiries State
  const [inquiries, setInquiries] = useState(() => getInquiriesByRecycler(activeRecyclerId));
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const handleStatusChange = (inquiryId, newStatus) => {
    try {
      updateInquiryStatus(inquiryId, newStatus, activeRecyclerId);
      setInquiries(getInquiriesByRecycler(activeRecyclerId));
      if (selectedInquiry?.inquiryId === inquiryId) {
        setSelectedInquiry((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    }
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    alert(`Offer of ₹${offerBid} submitted for lot ${selectedLotForOffer.id}! (Demo)`);
    setSelectedLotForOffer(null);
    setOfferBid('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2.5rem' }}>
      <PageContainer maxWidth="1100px">
        {/* Recycler Facility Header & Authorization Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {recyclerName}
              </h1>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, color: '#0f172a' }}>
                {activeRecyclerId}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              📍 {recyclerRecord ? `${recyclerRecord.address.area}, ${recyclerRecord.address.city}, ${recyclerRecord.address.state}` : 'MIDC Industrial Estate, Rayagada, Odisha'} • {t('authorizedRecyclers')}
            </p>
          </div>

          {/* Authorization Status Badge (Clearly marked DEMO DATA ONLY) */}
          <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <ShieldCheck size={20} color="#0284c7" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0369a1' }}>
                {recyclerRecord?.authorizationType || t('demoAuthorizationRecord')}: {recyclerRecord?.verificationStatus || t('demoVerified')}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, display: 'block' }}>
              {recyclerRecord?.authorizationNumber || 'DEMO-AUTH-0001'} • {t('prototypeRecyclerNotice')}
            </span>
          </div>
        </div>

        {/* Recycler Navigation Bar */}
        <RecyclerNavBar />

        {/* 3 Stats Cards: New Lots (12), Pickup Requests (5), Today's Purchases (₹24,500) */}
        <div className="grid-cols-3" style={{ marginBottom: '1.75rem' }}>
          <Card style={{ borderLeft: '5px solid #0ea5e9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                New Lots
              </span>
              <Package size={20} color="#0ea5e9" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_RECYCLER_DATA.newLotsCount}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>
              Available in 10 km radius (DEMO)
            </span>
          </Card>

          <Card style={{ borderLeft: '5px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Pickup Requests
              </span>
              <Truck size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_RECYCLER_DATA.pickupRequestsCount}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
              Coordination pending (DEMO)
            </span>
          </Card>

          <Card style={{ borderLeft: '5px solid #16a34a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Today's Purchases
              </span>
              <IndianRupee size={20} color="#16a34a" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_RECYCLER_DATA.todaysPurchases}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
              Total Weight: {MOCK_RECYCLER_DATA.totalRecycledWeight} (DEMO)
            </span>
          </Card>
        </div>

        {/* Main Actions: Available Lots, Pickup Requests, My Offers */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.85rem' }}>Recycler Actions</h2>
          <div className="grid-cols-3" style={{ gap: '1rem' }}>
            <Card interactive onClick={() => navigate('/recycler/lots')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Package size={24} color="#0284c7" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>📦 Available Lots</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                View and make offers on aggregated collector scrap lots
              </p>
            </Card>

            <Card interactive onClick={() => navigate('/recycler/pickups')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Truck size={24} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>🚚 Pickup Requests</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Coordinate transport logistics & verified driver dispatch
              </p>
            </Card>

            <Card interactive onClick={() => navigate('/recycler/offers')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <IndianRupee size={24} color="#15803d" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>💰 My Offers ({myOffers.length})</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Track active price bids and collector acceptances
              </p>
            </Card>
          </div>
        </div>

        {/* Module 8: Available Scrap Lots Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  📦 {t('availableScrapLots')}
                </h2>
                <Badge variant="info">{eligibleLots.length} Eligible</Badge>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                Scrap lots matching your accepted material categories, operating location, and recycling capacity:
              </p>
            </div>
          </div>

          {eligibleLots.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <Package size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No eligible scrap lots currently available.</p>
              <span style={{ fontSize: '0.78rem' }}>New lots created by local collectors will appear here for formal bidding.</span>
            </Card>
          ) : (
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              {eligibleLots.map((lot) => {
                const displayLocation = typeof lot.location === 'string'
                  ? lot.location
                  : (lot.location?.area || lot.location?.city || 'Local Pickup');
                return (
                  <Card key={lot.id} style={{ padding: '1.2rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, color: '#0f172a' }}>
                          {lot.id}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '3px 0 1px 0' }}>
                          {lot.materialType || lot.materialCategory}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                          Weight: <strong style={{ color: '#15803d' }}>{lot.weight} {lot.weightUnit}</strong> • Condition: <strong>{lot.condition}</strong>
                        </div>
                      </div>
                      <Badge variant="info">
                        Formal Recycling
                      </Badge>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.65rem' }}>
                      📍 {displayLocation}
                    </div>

                    {/* Platform Estimated Range */}
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <span style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IndianRupee size={13} color="#0284c7" />
                        <span>{t('platformEstimate')}:</span>
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#0284c7' }}>
                        {lot.priceEstimate?.priceRangeFormatted || 'Estimate pending'}
                      </strong>
                    </div>

                    {/* Why can I offer checklist */}
                    {lot.reasons && lot.reasons.length > 0 && (
                      <div style={{ background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          ✓ {t('whyEligible')}
                        </span>
                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.74rem', color: '#15803d' }}>
                          {lot.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      id={`btn-recycler-offer-${lot.id}`}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => setSelectedLotForModal(lot)}
                    >
                      💰 {t('makeOffer')}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Module 7: Incoming Scrap Requests Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  📥 {t('incomingScrapRequests')}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '99px'
                  }}
                >
                  {inquiries.length} Active
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Direct inquiries sent by informal collectors matching your accepted materials & operating areas:
              </p>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <Package size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No incoming scrap inquiries yet.</p>
              <span style={{ fontSize: '0.78rem' }}>When collectors request recycling for materials you accept, inquiries will appear here.</span>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {inquiries.map((inq) => {
                const isInterested = inq.status === 'interested';
                const isDeclined = inq.status === 'declined';
                return (
                  <Card key={inq.inquiryId} style={{ padding: '1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, color: '#0f172a' }}>
                            {inq.inquiryId}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {inq.materialCategory}
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ({inq.materialSubcategory || inq.materialCategory})
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.84rem', color: '#475569', flexWrap: 'wrap', marginTop: '4px' }}>
                          <span>
                            Weight: <strong style={{ color: '#15803d' }}>{inq.weight} {inq.weightUnit}</strong>
                          </span>
                          <span>
                            Collector: <strong>{inq.collectorName}</strong>
                          </span>
                          <span>
                            📍 <strong>{inq.collectorLocation}</strong>
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                            📅 {new Date(inq.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '99px',
                            background: isInterested ? '#dcfce7' : isDeclined ? '#fee2e2' : '#fef3c7',
                            color: isInterested ? '#15803d' : isDeclined ? '#dc2626' : '#92400e',
                            border: `1px solid ${isInterested ? '#86efac' : isDeclined ? '#fca5a5' : '#fde68a'}`,
                            textTransform: 'uppercase'
                          }}
                        >
                          {inq.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInquiry(inq);
                          if (inq.status === 'sent') {
                            handleStatusChange(inq.inquiryId, 'viewed');
                          }
                        }}
                      >
                        {t('viewDetails')}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeclined}
                        style={{ color: isDeclined ? '#94a3b8' : '#dc2626' }}
                        onClick={() => handleStatusChange(inq.inquiryId, 'declined')}
                      >
                        {t('decline')}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isInterested}
                        style={{
                          background: isInterested ? '#dcfce7' : '#15803d',
                          color: isInterested ? '#15803d' : '#ffffff',
                          border: isInterested ? '1px solid #86efac' : 'none'
                        }}
                        onClick={() => handleStatusChange(inq.inquiryId, 'interested')}
                      >
                        {isInterested ? 'Interested ✓' : t('markInterested')}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: View Inquiry Details */}
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Inquiry: ${selectedInquiry?.inquiryId || ''}`}
        >
          {selectedInquiry && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Material</span>
                  <strong>{selectedInquiry.materialCategory} ({selectedInquiry.materialSubcategory})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Lot Weight</span>
                  <strong style={{ color: '#15803d' }}>{selectedInquiry.weight} {selectedInquiry.weightUnit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Condition</span>
                  <strong>{selectedInquiry.condition}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Collector Name</span>
                  <strong>{selectedInquiry.collectorName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Location</span>
                  <strong>📍 {selectedInquiry.collectorLocation}</strong>
                </div>
                {selectedInquiry.estimatedPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Estimated Price Range</span>
                    <strong style={{ color: '#0284c7' }}>{selectedInquiry.estimatedPrice}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Current Status</span>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: selectedInquiry.status === 'interested' ? '#15803d' : selectedInquiry.status === 'declined' ? '#dc2626' : '#d97706' }}>
                    {selectedInquiry.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Received On</span>
                  <span>{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setSelectedInquiry(null)}
                >
                  Close
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  style={{ color: '#dc2626' }}
                  onClick={() => {
                    handleStatusChange(selectedInquiry.inquiryId, 'declined');
                    setSelectedInquiry(null);
                  }}
                >
                  {t('decline')}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    handleStatusChange(selectedInquiry.inquiryId, 'interested');
                    setSelectedInquiry(null);
                  }}
                >
                  {t('markInterested')}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Available Lots Preview List */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Available Lots in Your Region</h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Lots created by informal collectors ready for bidding:
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/recycler/lots')}>
              View All Lots
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {MOCK_RECYCLER_LOTS.map((lot) => (
              <Card key={lot.id} style={{ padding: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {lot.id}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{lot.material}</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Approx. weight: <strong>{lot.approxWeight}</strong> • Distance: <strong>{lot.distance}</strong>
                    </p>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Collector location: {lot.collectorLocation}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Estimated Range</span>
                    <strong style={{ fontSize: '1.25rem', color: '#0284c7' }}>{lot.estimatedRange}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedLotForOffer(lot);
                      setOfferBid('1750');
                    }}
                  >
                    MAKE OFFER
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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

        {/* Module 8: Make Offer Modal */}
        <MakeOfferModal
          isOpen={!!selectedLotForModal}
          onClose={() => setSelectedLotForModal(null)}
          lot={selectedLotForModal}
          buyerRole="recycler"
          buyerId={activeRecyclerId}
          buyerName={recyclerName}
          onOfferSubmitted={refreshOffersAndLots}
        />

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
    </div>
  );
};

export default RecyclerDashboard;
