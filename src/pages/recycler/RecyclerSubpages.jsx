import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, IndianRupee, FileCheck, CheckCircle2 } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { MOCK_RECYCLER_LOTS } from '../../data/mockData';

export const RecyclerLotsPage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer maxWidth="1100px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>📦 Available Collector Scrap Lots</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {MOCK_RECYCLER_LOTS.map((lot) => (
          <Card key={lot.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{lot.id}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{lot.material}</h3>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Weight: {lot.weight} • Collector: {lot.collectorName} ({lot.distance})
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>{lot.totalValue}</span>
                <Badge variant="info" style={{ display: 'block', marginTop: '4px' }}>{lot.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

export const RecyclerPickupsPage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer maxWidth="1100px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>🚚 Active Pickup Requests & Dispatch</h1>
      </div>

      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Badge variant="success">Dispatched</Badge>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>Pickup #PK-402 - Dharavi Aggregation Cluster</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Vehicle: Tata Ace (MH-04-AB-2910) • Driver: Surendra P.</p>
          </div>
          <Button variant="outline" size="sm">Track Route</Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export const RecyclerOffersPage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer maxWidth="1100px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>💰 My Offers & Bids</h1>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Offer on LOT-2026-081</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Computer Motherboards & RAM</h3>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>Bid: ₹340/kg (Total: ₹2,210)</p>
          </div>
          <Badge variant="warning">Awaiting Collector Confirmation</Badge>
        </div>
      </Card>
    </PageContainer>
  );
};

export const RecyclerOrdersPage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer maxWidth="1100px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/recycler')} className="btn btn-ghost" style={{ padding: '6px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>📄 Completed Transactions & EPR Credits</h1>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Badge variant="success">EPR Certificate Generated</Badge>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>TXN-9842 (Handover Verified via QR)</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>12 kg Motherboards • ₹3,450 paid to Ramesh K.</p>
          </div>
          <Button variant="outline" size="sm" icon={FileCheck}>Download EPR Credit</Button>
        </div>
      </Card>
    </PageContainer>
  );
};
