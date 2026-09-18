import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  IndianRupee, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  ArrowUpRight, 
  MapPin, 
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Modal from '../../components/common/Modal';
import { MOCK_RECYCLER_LOTS } from '../../data/mockData';

export const RecyclerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [selectedLot, setSelectedLot] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer maxWidth="1100px">
        {/* Recycler Facility Header & CPCB Verified Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {currentUser?.name || 'Authorized Recycler Portal'}
              </h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={14} color="#0284c7" />
              {currentUser?.facility || 'MIDC Industrial Zone, Navi Mumbai'}
            </p>
          </div>

          {/* Authorization Status Badge */}
          <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#0284c7" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369a1' }}>
                  CPCB AUTHORIZED RECYCLER
                </span>
                <span style={{ fontSize: '0.75rem', background: '#0284c7', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  ✓ VERIFIED
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0369a1', fontFamily: 'monospace' }}>
                Reg: {currentUser?.cpcbRegNo || 'CPCB/EW/MH/2024/0981'} (DEMO)
              </span>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid-cols-3" style={{ marginBottom: '1.75rem' }}>
          <Card style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                New Scrap Lots
              </span>
              <Package size={18} color="#0ea5e9" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>8 Lots</div>
            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>Nearby informal collectors</span>
          </Card>

          <Card style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Pickup Requests
              </span>
              <Truck size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>3 Active</div>
            <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>1 Dispatched today</span>
          </Card>

          <Card style={{ borderLeft: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Today's Purchases
              </span>
              <IndianRupee size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>₹7,490</div>
            <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>17.5 kg e-waste secured</span>
          </Card>
        </div>

        {/* Main Action Links Grid */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.85rem' }}>Recycler Operations</h2>
          <div className="grid-cols-4" style={{ gap: '1rem' }}>
            <Card interactive onClick={() => navigate('/recycler/lots')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Package size={22} color="#0284c7" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📦 Available Lots</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Bid on verified collector lots</p>
            </Card>

            <Card interactive onClick={() => navigate('/recycler/pickups')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Truck size={22} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🚚 Pickup Requests</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Route & logistics coordination</p>
            </Card>

            <Card interactive onClick={() => navigate('/recycler/offers')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <IndianRupee size={22} color="#15803d" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>💰 My Offers</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Active price bids & acceptances</p>
            </Card>

            <Card interactive onClick={() => navigate('/recycler/orders')} style={{ padding: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <FileText size={22} color="#334155" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📄 Transactions</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>EPR certificate & receipts</p>
            </Card>
          </div>
        </div>

        {/* Inbound Available Collector Lots Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Inbound Collector Lots (Nearby)</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Photographed and weighted by local collectors within 5 km:
              </p>
            </div>
            <Button variant="outline" size="sm" icon={Filter} onClick={() => navigate('/recycler/lots')}>
              View All
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {MOCK_RECYCLER_LOTS.map((lot) => (
              <Card key={lot.id} style={{ padding: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                        {lot.id}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{lot.material}</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Collector: <strong>{lot.collectorName}</strong> (★ {lot.collectorRating}) • Distance: <strong>{lot.distance}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
                      {lot.totalValue}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {lot.weight} @ {lot.offeredRate}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <Badge variant={lot.status === 'Pickup Scheduled' ? 'success' : 'warning'}>
                    {lot.status}
                  </Badge>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLot(lot)}
                    >
                      Inspect Lot
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert(`Offer submitted for ${lot.id} (Demo)`)}
                    >
                      Make Offer / Schedule Pickup
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal: Lot Details Inspection */}
        <Modal
          isOpen={!!selectedLot}
          onClose={() => setSelectedLot(null)}
          title={`Lot Details: ${selectedLot?.id}`}
        >
          {selectedLot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Material Group</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedLot.material}</h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                  Estimated Weight: <strong>{selectedLot.weight}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Collector</span>
                <strong>{selectedLot.collectorName} ({selectedLot.distance})</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Base Benchmark Rate</span>
                <strong>{selectedLot.offeredRate}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ color: '#64748b' }}>Total Estimated Fair Payout</span>
                <strong style={{ color: '#0284c7', fontSize: '1.1rem' }}>{selectedLot.totalValue}</strong>
              </div>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  alert(`Dispatched pickup for ${selectedLot.id} (Demo)`);
                  setSelectedLot(null);
                }}
              >
                Confirm Pickup Order
              </Button>
            </div>
          )}
        </Modal>
      </PageContainer>
    </div>
  );
};

export default RecyclerDashboard;
