import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  ArrowLeft, 
  Check, 
  Package, 
  IndianRupee, 
  QrCode, 
  FileCheck, 
  User, 
  Sparkles,
  Info
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';
import { 
  CORE_MATERIAL_GROUPS, 
  MOCK_COLLECTOR_LOTS, 
  MOCK_COLLECTOR_TRANSACTIONS 
} from '../../data/mockData';

/**
 * Sell Scrap Page (Collector Camera & Lot Creation Placeholder)
 */
export const CollectorSellPage = () => {
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState('mat_pcb');
  const [weight, setWeight] = useState('5.0');
  const [submitted, setSubmitted] = useState(false);

  const selectedMatObj = CORE_MATERIAL_GROUPS.find((m) => m.id === selectedMaterial);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/collector')}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: '36px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📷 Sell Scrap (ई-कचरा बेचें)</h1>
        </div>

        {submitted ? (
          <Card style={{ textAlign: 'center', padding: '2rem 1.5rem', border: '2px solid #86efac', background: '#f0fdf4' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#bbf7d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#15803d' }}>
              <Check size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
              Lot Created Successfully!
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.5rem' }}>
              Your lot has been matched to nearby authorized buyers.
            </p>
            <Button variant="primary" fullWidth onClick={() => navigate('/collector/lots')}>
              View in My Lots
            </Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Camera Viewport Placeholder */}
            <div
              style={{
                borderRadius: '16px',
                background: '#0f172a',
                color: 'white',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                border: '2px dashed #475569'
              }}
            >
              <Camera size={44} color="#86efac" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Take Photo of E-Waste
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                फोटो खींचने के लिए टैप करें (Tap to Capture)
              </p>
              <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.72rem', color: '#86efac' }}>
                <Sparkles size={12} />
                <span>AI Material Classifier activates in Module 5</span>
              </div>
            </div>

            {/* Manual Confirmation of Material */}
            <Select
              label="Select Material Category / कचरे का प्रकार"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              options={CORE_MATERIAL_GROUPS.map((m) => ({
                value: m.id,
                label: `${m.name} (${m.vernacularName})`
              }))}
            />

            {/* Weight Input */}
            <Input
              label="Estimated Weight (kg) / वजन"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 5.0"
              required
            />

            {/* Estimated Price Range Banner */}
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 700, textTransform: 'uppercase' }}>
                  Fair Market Benchmark
                </span>
                <Badge variant="warning">Estimated</Badge>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#713f12' }}>
                {selectedMatObj?.benchmarkPrice} / kg
              </div>
              <p style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '2px' }}>
                Approx total: ₹{Math.round((parseFloat(weight) || 1) * 310)} (Subject to inspection)
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              style={{ minHeight: '56px', fontSize: '1.1rem' }}
            >
              Post Scrap Lot (लॉट बनाएं)
            </Button>
          </form>
        )}
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Collector Lots Page
 */
export const CollectorLotsPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => navigate('/collector')}
              className="btn btn-ghost"
              style={{ padding: '6px', minHeight: '36px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📦 My Lots (मेरे लॉट)</h1>
          </div>
          <Badge variant="info">2 Active</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MOCK_COLLECTOR_LOTS.map((lot) => (
            <Card key={lot.id} style={{ border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{lot.id}</span>
                <Badge variant={lot.status === 'Ready for Handover' ? 'success' : 'warning'}>
                  {lot.status}
                </Badge>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {lot.material}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                Weight: <strong>{lot.estimatedWeight}</strong> • Value: <strong style={{ color: '#15803d' }}>{lot.fairPriceEstimate}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Matched: {lot.matchedBuyer}
                </span>
                <Button variant="outline" size="sm" icon={QrCode}>
                  Handover QR
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Collector Transactions Page
 */
export const CollectorTransactionsPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/collector')}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: '36px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📄 Transactions (लेनदेन पर्ची)</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {MOCK_COLLECTOR_TRANSACTIONS.map((tx) => (
            <Card key={tx.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{tx.id}</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{tx.buyer}</h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>{tx.amount}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{tx.date}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.5rem' }}>
                {tx.material} • {tx.weight}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                <Badge variant="success">{tx.status}</Badge>
                <Button variant="ghost" size="sm" icon={FileCheck}>
                  Receipt
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Collector Earnings Page
 */
export const CollectorEarningsPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/collector')}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: '36px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>💰 Earnings Ledger (कुल कमाई)</h1>
        </div>

        <div className="card-hero-earnings" style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>This Month's Total</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>
            ₹18,450
          </div>
          <span style={{ fontSize: '0.82rem', color: '#86efac' }}>
            ✓ 100% paid directly to UPI & Cash
          </span>
        </div>

        <Card style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Material Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Motherboards & Circuit Boards</span>
              <strong>₹9,200 (50%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Copper Cables & Wiring</span>
              <strong>₹6,150 (33%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Motors & Appliances</span>
              <strong>₹3,100 (17%)</strong>
            </div>
          </div>
        </Card>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Collector Profile Page
 */
export const CollectorProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, language, setLanguage, isAudioActive, toggleAudio } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/collector')}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: '36px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>👤 Profile (प्रोफ़ाइल)</h1>
        </div>

        <Card style={{ textAlign: 'center', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: '#15803d' }}>
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentUser?.name}</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>{currentUser?.phone}</p>
          <Badge variant="success">Verified Collector ✓</Badge>
        </Card>

        <Card style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Language & Voice Settings</h3>
          <Select
            label="App Language / भाषा"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी (Hindi)' },
              { value: 'mr', label: 'मराठी (Marathi)' }
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Audio Guide (आवाज़ में सुनें)</span>
            <Button
              variant={isAudioActive ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleAudio}
            >
              {isAudioActive ? 'Audio ON' : 'Turn ON'}
            </Button>
          </div>
        </Card>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};
