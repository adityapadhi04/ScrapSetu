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
  Info,
  Upload,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  Recycle
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { getStrings } from '../../locales/strings';
import { 
  MOCK_COLLECTOR_DATA, 
  MOCK_COLLECTOR_LOTS, 
  MOCK_COLLECTOR_TRANSACTIONS 
} from '../../data/mockData';

/**
 * 6-Step Interactive Sell Scrap Wizard for Collector
 * Visually demonstrates the future ML and matching workflow using demo data
 */
export const CollectorSellPage = () => {
  const navigate = useNavigate();
  const { language } = useAuth();
  const t = getStrings(language);

  // Step state: 1 (Photo) -> 2 (Material Identified) -> 3 (Weight) -> 4 (Price) -> 5 (Buyers) -> 6 (Handover Done)
  const [step, setStep] = useState(1);
  const [selectedBuyer, setSelectedBuyer] = useState('repair_shop');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        {/* Step Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else navigate('/collector');
              }}
              className="btn btn-ghost"
              style={{ padding: '6px', minHeight: '36px' }}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {step === 6 ? 'Handover Ready' : `Sell Scrap (Step ${step}/5)`}
            </h1>
          </div>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '99px' }}>
            Interactive Demo
          </span>
        </div>

        {/* STEP 1: TAKE PHOTO OR UPLOAD PHOTO */}
        {step === 1 && (
          <div>
            <div
              style={{
                borderRadius: '20px',
                background: '#0f172a',
                color: 'white',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                border: '2px dashed #475569'
              }}
            >
              <Camera size={52} color="#86efac" style={{ margin: '0 auto 0.75rem auto' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                Take Photo of E-Waste
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                Take a clear photo of the scrap. (ई-कचरे की साफ फोटो लें)
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={Camera}
                  onClick={() => setStep(2)}
                  style={{ minHeight: '56px', fontSize: '1.1rem' }}
                >
                  📷 Take Photo (कैमरा खोलें)
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  icon={Upload}
                  onClick={() => setStep(2)}
                  style={{ color: '#ffffff', borderColor: '#475569', background: 'rgba(255,255,255,0.06)' }}
                >
                  📁 Upload Photo from Gallery
                </Button>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.85rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                💡 Tip: Place scrap on a flat surface with good lighting for highest identification accuracy.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: MATERIAL IDENTIFIED (DEMO/MOCK) */}
        {step === 2 && (
          <div>
            <Card style={{ padding: '1.5rem', border: '2px solid #86efac', background: '#f0fdf4', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Badge variant="success">Material Identified</Badge>
                <span style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#475569' }}>
                  DEMO / MOCK DATA
                </span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>💻</span>
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  PCB: Laptop Motherboard
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 700 }}>
                  मदरबोर्ड (उच्च श्रेणी का ई-कचरा)
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>AI Classification Confidence</span>
                <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>92% High Match</strong>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => setStep(3)}
                style={{ minHeight: '52px' }}
              >
                Confirm Material & Continue →
              </Button>
            </Card>

            <Button variant="ghost" fullWidth onClick={() => setStep(1)}>
              Wrong item? Retake Photo
            </Button>
          </div>
        )}

        {/* STEP 3: APPROXIMATE WEIGHT */}
        {step === 3 && (
          <div>
            <Card style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Approximate Weight / वजन
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Enter the approximate scrap weight. The buyer will verify on calibrated digital scales during handover.
              </p>

              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Measured Weight (Demo)
                </span>
                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  [ 2.4 kg ]
                </span>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => setStep(4)}
                style={{ minHeight: '52px' }}
              >
                Calculate Fair Estimated Value →
              </Button>
            </Card>
          </div>
        )}

        {/* STEP 4: ESTIMATED VALUE */}
        {step === 4 && (
          <div>
            <Card style={{ padding: '1.5rem', marginBottom: '1.25rem', border: '2px solid #fde68a', background: '#fffbeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Badge variant="warning">Estimated Fair Value</Badge>
                <span style={{ fontSize: '0.72rem', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#92400e' }}>
                  DEMO BENCHMARK
                </span>
              </div>

              <div style={{ textAlign: 'center', margin: '1rem 0 1.5rem 0' }}>
                <span style={{ fontSize: '0.85rem', color: '#92400e', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Estimated Fair Payout / अनुमानित भाव
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#78350f', letterSpacing: '-0.02em' }}>
                  ₹1,550 – ₹1,800
                </div>
                <p style={{ fontSize: '0.78rem', color: '#a16207', marginTop: '4px' }}>
                  Based on 2.4 kg Laptop PCB benchmark rate of ₹650–₹750/kg
                </p>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => setStep(5)}
                style={{ minHeight: '52px' }}
              >
                Discover Available Buyers →
              </Button>
            </Card>
          </div>
        )}

        {/* STEP 5: AVAILABLE BUYERS */}
        {step === 5 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Available Buyers (खरीदार चुनें)</h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Select whether to sell to a parts recovery shop or an authorized recycler:
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* Option A: Repair Shop */}
              <Card
                interactive
                onClick={() => setSelectedBuyer('repair_shop')}
                style={{
                  padding: '1.25rem',
                  border: selectedBuyer === 'repair_shop' ? '2.5px solid #d97706' : '1px solid #e2e8f0',
                  background: selectedBuyer === 'repair_shop' ? '#fffbeb' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔧</span>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Repair Shop</h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Om Electronics (2.8 km)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>₹1,800</span>
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'block', fontWeight: 700 }}>Highest Offer</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Will salvage intact chips & capacitors before processing.
                </p>
              </Card>

              {/* Option B: Recycler */}
              <Card
                interactive
                onClick={() => setSelectedBuyer('recycler')}
                style={{
                  padding: '1.25rem',
                  border: selectedBuyer === 'recycler' ? '2.5px solid #0284c7' : '1px solid #e2e8f0',
                  background: selectedBuyer === 'recycler' ? '#f0f9ff' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>♻️</span>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Authorized Recycler</h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ABC Recycling (5.2 km)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>₹1,650</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>CPCB Rate</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Formal recycling with EPR digital traceability certificate.
                </p>
              </Card>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => setStep(6)}
              style={{ minHeight: '52px' }}
            >
              Accept Offer & Generate Handover →
            </Button>
          </div>
        )}

        {/* STEP 6: HANDOVER SUMMARY & QR RECEIPT */}
        {step === 6 && (
          <div>
            <Card style={{ textAlign: 'center', padding: '1.75rem 1.25rem', border: '2px solid #86efac', background: '#f0fdf4', marginBottom: '1.25rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#bbf7d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', color: '#15803d' }}>
                <Check size={32} />
              </div>
              <Badge variant="success">Handover Scheduled</Badge>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: '0.5rem 0 0.25rem 0' }}>
                Lot SS-2026-001 Created!
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem' }}>
                Show this Handover QR to the buyer upon physical inspection.
              </p>

              {/* QR Code Placeholder Box */}
              <div style={{ background: '#ffffff', border: '2px dashed #86efac', borderRadius: '16px', padding: '1.5rem', width: '200px', margin: '0 auto 1.25rem auto' }}>
                <QrCode size={120} color="#0f172a" style={{ margin: '0 auto' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', display: 'block', marginTop: '6px' }}>
                  SCAN TO COMPLETE HANDOVER
                </span>
              </div>

              <div style={{ textAlign: 'left', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Material</span>
                  <strong>Laptop PCB (2.4 kg)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Agreed Payout</span>
                  <strong style={{ color: '#15803d', fontSize: '1rem' }}>
                    {selectedBuyer === 'repair_shop' ? '₹1,800' : '₹1,650'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Buyer</span>
                  <strong>{selectedBuyer === 'repair_shop' ? 'Om Electronics' : 'ABC Recycling'}</strong>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => navigate('/collector/transactions')}
              >
                View in Transactions & Receipts
              </Button>
            </Card>

            <Button variant="ghost" fullWidth onClick={() => navigate('/collector')}>
              Back to Collector Home
            </Button>
          </div>
        )}
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Mobile-friendly Collector Transactions History (Card layout, not a table)
 */
export const CollectorTransactionsPage = () => {
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
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Transactions (लेनदेन पर्ची)</h1>
          </div>
          <Badge variant="neutral">2 Records</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {MOCK_COLLECTOR_TRANSACTIONS.map((tx) => (
            <Card
              key={tx.id}
              style={{
                padding: '1.15rem',
                borderLeft: tx.statusType === 'completed' ? '5px solid #16a34a' : '5px solid #d97706'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <Badge variant={tx.statusType === 'completed' ? 'success' : 'warning'}>
                  {tx.statusBadge}
                </Badge>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: tx.statusType === 'completed' ? '#15803d' : '#b45309' }}>
                  {tx.amount}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '2px' }}>
                {tx.material}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                Weight: <strong>{tx.weight}</strong> • Buyer: <strong>{tx.buyerName}</strong> ({tx.buyerType})
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span>LOT: <strong>{tx.id}</strong> • {tx.date}</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>{tx.paymentMode}</span>
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
 * Simple Collector Earnings Screen
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
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Earnings (कुल कमाई)</h1>
        </div>

        {/* Hero Card: THIS MONTH */}
        <div className="card-hero-earnings" style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            THIS MONTH / इस महीने
          </span>
          <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>
            {MOCK_COLLECTOR_DATA.thisMonthTotal}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Completed ✓</span>
              <strong style={{ fontSize: '1.1rem', color: '#86efac' }}>
                {MOCK_COLLECTOR_DATA.completedEarnings}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Pending ⏳</span>
              <strong style={{ fontSize: '1.1rem', color: '#fde68a' }}>
                {MOCK_COLLECTOR_DATA.pendingEarnings}
              </strong>
            </div>
          </div>
        </div>

        {/* Recent Earnings List */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            Recent Earnings (हाल की बिक्री)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_COLLECTOR_DATA.recentEarningsBreakdown.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.92rem', display: 'block' }}>{item.material}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.weight} • {item.date}
                  </span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Minimal Privacy-Conscious Collector Profile
 */
export const CollectorProfilePage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useAuth();

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
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Profile (प्रोफ़ाइल)</h1>
        </div>

        {/* Identity Summary Card */}
        <Card style={{ textAlign: 'center', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: '#15803d' }}>
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{MOCK_COLLECTOR_DATA.name}</h2>
          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b', display: 'block', margin: '2px 0 6px 0' }}>
            ID: {MOCK_COLLECTOR_DATA.id}
          </span>
          <Badge variant="success">Registered Informal Collector ✓</Badge>
        </Card>

        {/* Minimal Information Fields */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Operating Area</span>
              <strong>{MOCK_COLLECTOR_DATA.operatingArea}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Total Completed Transactions</span>
              <strong>2 Lots (₹16,900)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Pending Handovers</span>
              <strong style={{ color: '#b45309' }}>1 Lot (₹1,550)</strong>
            </div>
          </div>
        </Card>

        {/* Switch Account Section */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            🔄 Switch Account
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem' }}>
            Switch to a different portal account on this device.
          </p>
          <AccountSwitcher dropup={false} />
        </Card>
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
                <Badge variant={lot.statusTag.includes('COMPLETED') ? 'success' : 'warning'}>
                  {lot.statusTag}
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
                  {lot.matchedBuyer}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={QrCode}
                  onClick={() => alert(`Showing QR code for Lot ${lot.id}`)}
                >
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
