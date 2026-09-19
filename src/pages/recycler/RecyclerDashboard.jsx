import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { 
  MOCK_RECYCLER_DATA, 
  MOCK_RECYCLER_LOTS 
} from '../../data/mockData';

export const RecyclerDashboard = () => {
  const navigate = useNavigate();
  const [selectedLotForOffer, setSelectedLotForOffer] = useState(null);
  const [offerBid, setOfferBid] = useState('');

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    alert(`Offer of ₹${offerBid} submitted for lot ${selectedLotForOffer.id}! (Demo)`);
    setSelectedLotForOffer(null);
    setOfferBid('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer maxWidth="1100px">
        {/* Recycler Facility Header & Authorization Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_RECYCLER_DATA.name}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              MIDC Industrial Zone, Navi Mumbai • Registered Hazardous & High-Grade E-Waste Processor
            </p>
          </div>

          {/* Authorization Status Badge (Clearly marked DEMO DATA ONLY) */}
          <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '12px', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <ShieldCheck size={20} color="#0284c7" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0369a1' }}>
                Authorization Status: {MOCK_RECYCLER_DATA.authorizationStatus}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, display: 'block' }}>
              {MOCK_RECYCLER_DATA.authorizationNotice}
            </span>
          </div>
        </div>

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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>💰 My Offers</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Track active price bids and collector acceptances
              </p>
            </Card>
          </div>
        </div>

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
      </PageContainer>
    </div>
  );
};

export default RecyclerDashboard;
