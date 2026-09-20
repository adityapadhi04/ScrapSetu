/**
 * ScrapSetu — Customer Interface Pages (Module 17 / Customer Role)
 *
 * Provides:
 *   1. CustomerDashboard      — /customer
 *   2. CustomerBookPickupPage — /customer/book-pickup
 *   3. CustomerBookingsPage   — /customer/bookings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Phone, Package, IndianRupee,
  CheckCircle2, Clock, Truck, X, ChevronRight, RefreshCw,
  User, AlertCircle, Calendar, Camera, Upload, ShieldCheck,
  CreditCard, Check, Plus
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getNearbyKabadiwalas,
  createBooking,
  getBookingsByCustomer,
  recordKabadiPayment,
  cancelBooking,
  getEstimatedPrice,
  getStatusColor,
  getStatusLabel,
  LIFECYCLE_STEPS,
  getLifecycleIndex,
  SCRAP_TYPES,
  PAYMENT_METHODS_KABADI,
} from '../../services/kabadiService';
import RazorpayPaymentModal from '../../components/payment/RazorpayPaymentModal';
import PaymentReceiptModal from '../../components/payment/PaymentReceiptModal';
import { getReceiptByTransaction } from '../../services/paymentReceiptService';

// ─── Customer Navbar ─────────────────────────────────────────────────────────

const CustomerNavBar = () => {
  const navigate = useNavigate();
  const path = window.location.pathname;

  const links = [
    { label: '📊 Dashboard', to: '/customer' },
    { label: '🚛 Book Home Pickup', to: '/customer/book-pickup' },
    { label: '📋 My Bookings', to: '/customer/bookings' },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {links.map((link) => {
        const active = path === link.to;
        return (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: active ? 700 : 500,
              border: active ? '1.5px solid #059669' : '1px solid #e2e8f0',
              background: active ? '#ecfdf5' : '#ffffff',
              color: active ? '#059669' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {link.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── Visual 6-Step Stepper Bar ───────────────────────────────────────────────

export const LifecycleStepper = ({ currentStatus }) => {
  const currentIndex = getLifecycleIndex(currentStatus);
  const isFailed = ['rejected', 'cancelled'].includes(currentStatus);

  if (isFailed) {
    return (
      <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <AlertCircle size={14} /> Status: {currentStatus === 'rejected' ? 'Rejected' : 'Cancelled'}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', margin: '0.85rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Background track line */}
        <div style={{ position: 'absolute', top: 12, left: '5%', right: '5%', height: 2, background: '#e2e8f0', zIndex: 0 }} />
        {/* Progress line */}
        <div style={{
          position: 'absolute', top: 12, left: '5%',
          width: `${Math.min(100, (currentIndex / (LIFECYCLE_STEPS.length - 1)) * 90)}%`,
          height: 2, background: '#059669', zIndex: 1, transition: 'width 0.3s'
        }} />

        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, minWidth: 48 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isDone ? '#059669' : isCurrent ? '#047857' : '#ffffff',
                border: isDone || isCurrent ? '2px solid #059669' : '2px solid #cbd5e1',
                color: isDone || isCurrent ? '#ffffff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800,
                boxShadow: isCurrent ? '0 0 0 4px rgba(5, 150, 105, 0.2)' : 'none',
                transition: 'all 0.2s',
              }}>
                {isDone ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.66rem', marginTop: 4, textAlign: 'center',
                fontWeight: isCurrent ? 800 : 600,
                color: isCurrent ? '#047857' : isDone ? '#0f172a' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 1. Customer Dashboard (/customer) ───────────────────────────────────────

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const customerId = user?.userId || 'usr-customer-01';

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    setBookings(getBookingsByCustomer(customerId));
  }, [customerId]);

  const activeBookings = bookings.filter((b) => !['paid', 'completed', 'cancelled', 'rejected'].includes(b.status));
  const completedBookings = bookings.filter((b) => ['paid', 'completed'].includes(b.status));
  const totalEarned = completedBookings.reduce((sum, b) => sum + (b.finalTotalAmount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="960px">
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Household E-Waste & Scrap Disposal
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
              Namaste, {user?.name || 'Customer'} 👋
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Book doorstep pickup for your household scrap, electronics, and e-waste.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/customer/book-pickup')}
            style={{ background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Book Home Pickup
          </Button>
        </div>

        <CustomerNavBar />

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Active Pickups</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              {activeBookings.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2 }}>In progress & scheduled</div>
          </Card>

          <Card style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Completed Pickups</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              {completedBookings.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Safely recycled & paid</div>
          </Card>

          <Card style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #d97706' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Total Cash Received</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', marginTop: 4 }}>
              ₹{totalEarned.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Paid directly to you</div>
          </Card>
        </div>

        {/* CTA Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          borderRadius: 16,
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)'
        }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800, marginBottom: 8 }}>
              ⚡ Doorstep Fair-Price Guarantee
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              Got Old Mobiles, Batteries or Electronic Scrap?
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#d1fae5', margin: 0, lineHeight: 1.5 }}>
              Choose a trusted local Kabadiwala, get accurate digital weighing on your doorstep, and receive instant cash or UPI payment with certified ScrapSetu receipts.
            </p>
          </div>

          <button
            onClick={() => navigate('/customer/book-pickup')}
            style={{
              background: '#ffffff',
              color: '#047857',
              border: 'none',
              borderRadius: 12,
              padding: '0.85rem 1.4rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <Truck size={18} /> Schedule Free Pickup →
          </button>
        </div>

        {/* Active Bookings Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Recent Pickup Requests
            </h2>
            {bookings.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/customer/bookings')}>
                View All ({bookings.length}) →
              </Button>
            )}
          </div>

          {bookings.length === 0 ? (
            <Card style={{ padding: '2.5rem 1.5rem', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>No Pickups Booked Yet</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: 360, margin: '0.4rem auto 1.2rem' }}>
                You have not booked any scrap pickups. Select your scrap type and get matched with verified local collectors.
              </p>
              <Button variant="primary" onClick={() => navigate('/customer/book-pickup')}>
                Book Your First Pickup
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {bookings.slice(0, 3).map((b) => (
                <Card key={b.bookingId} style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                          {b.bookingId}
                        </span>
                        <Badge variant={b.status === 'paid' ? 'success' : 'warning'}>
                          {getStatusLabel(b.status)}
                        </Badge>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {b.scrapType} • ~{b.estimatedWeightKg} kg
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
                        Assigned to: <strong>{b.kabadiName}</strong> ({b.kabadiPhone})
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                        {b.finalTotalAmount ? `₹${b.finalTotalAmount}` : `Est. ₹${b.estimatedTotalAmount || 0}`}
                      </div>
                      <Button variant="outline" size="sm" style={{ marginTop: 6 }} onClick={() => navigate('/customer/bookings')}>
                        Track Status →
                      </Button>
                    </div>
                  </div>

                  {/* Visual Stepper */}
                  <LifecycleStepper currentStatus={b.status} />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Current Demo Account
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
    </div>
  );
};

// ─── 2. Customer Book Pickup Page (/customer/book-pickup) ─────────────────────

export const CustomerBookPickupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user?.userId || 'usr-customer-01';

  // Step state
  const [step, setStep] = useState(1);

  // Form states
  const [scrapType, setScrapType] = useState('Mobile Phones / Tablets');
  const [approxQuantity, setApproxQuantity] = useState('2.5');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [area, setArea] = useState(user?.meta?.area || 'Dharavi Sector 3, Mumbai');
  const [address, setAddress] = useState(user?.meta?.address || 'Flat 402, Greenfield Apts, Dharavi');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 01:00 PM');
  const [notes, setNotes] = useState('');

  // Selected kabadiwala
  const [selectedKabadi, setSelectedKabadi] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nearby kabadiwalas
  const [nearbyKabadiwalas, setNearbyKabadiwalas] = useState([]);

  useEffect(() => {
    const list = getNearbyKabadiwalas(area, scrapType);
    setNearbyKabadiwalas(list);
    if (list.length > 0 && !selectedKabadi) {
      // Pick first available by default
      const firstAvail = list.find((k) => k.available) || list[0];
      setSelectedKabadi(firstAvail);
    }
  }, [area, scrapType]);

  // Handle image upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirmBooking = () => {
    if (!selectedKabadi) {
      setErrorMsg('Please select a Kabadiwala for your pickup.');
      return;
    }
    if (!area || !address) {
      setErrorMsg('Please provide your complete pickup address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const bkg = createBooking({
        collectorId: customerId,
        collectorName: user?.name || 'Pooja Verma (Customer)',
        collectorPhone: user?.meta?.phone || '+91 98112 23344',
        kabadiId: selectedKabadi.kabadiId,
        area,
        address,
        scrapType,
        estimatedWeightKg: parseFloat(approxQuantity) || 1,
        photoUrl: photoPreview,
        notes,
        preferredDate,
        preferredTime,
      });

      navigate('/customer/bookings', { state: { newBookingId: bkg.bookingId } });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create pickup request');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="840px">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/customer')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              🚛 Book Doorstep Scrap Pickup
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
              Certified local kabadiwalas collect right from your door
            </p>
          </div>
        </div>

        <CustomerNavBar />

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.75rem' }}>
          {[
            { n: 1, title: 'Scrap & Location' },
            { n: 2, title: 'Select Kabadiwala' },
            { n: 3, title: 'Confirm Appointment' },
          ].map((s) => (
            <div
              key={s.n}
              onClick={() => { if (step > s.n) setStep(s.n); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: step > s.n ? 'pointer' : 'default' }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step === s.n ? '#059669' : step > s.n ? '#047857' : '#e2e8f0',
                color: step >= s.n ? '#fff' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem'
              }}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: step === s.n ? 800 : 500, color: step === s.n ? '#059669' : '#64748b' }}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* ── STEP 1: Scrap Details & Photo Upload ── */}
        {step === 1 && (
          <Card style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              1. Scrap Items & Location
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Scrap Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Scrap Material Type *
                </label>
                <select
                  value={scrapType}
                  onChange={(e) => setScrapType(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  {SCRAP_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Approx Quantity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Approximate Weight (kg) / Quantity *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={approxQuantity}
                  onChange={(e) => setApproxQuantity(e.target.value)}
                  placeholder="e.g. 2.5"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Area */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Neighborhood / Area *
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dharavi, Gunupur, Rayagada..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Full Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Doorstep Pickup Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House no, street, landmark"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                📸 Upload Scrap Photo (Optional)
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{
                  border: '1.5px dashed #059669',
                  borderRadius: 12,
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  background: '#f0fdf4',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <Camera size={18} />
                  <span>{photoPreview ? 'Change Photo' : 'Select / Take Photo'}</span>
                  <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
                {photoPreview && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={photoPreview}
                      alt="Scrap preview"
                      style={{ width: 68, height: 68, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                Supports JPG, PNG up to 5 MB. Photos help kabadiwalas bring appropriate weighing equipment.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={() => {
                  if (!area.trim() || !address.trim()) {
                    setErrorMsg('Please provide your area and doorstep address');
                    return;
                  }
                  setErrorMsg('');
                  setStep(2);
                }}
              >
                Next: Choose Kabadiwala →
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 2: Choose Nearby Kabadiwala ── */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  2. Select a Nearby Kabadiwala
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Showing collectors serving <strong>{area}</strong> sorted by proximity & ratings
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                ← Change Details
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {nearbyKabadiwalas.map((kabadi) => {
                const isSelected = selectedKabadi?.kabadiId === kabadi.kabadiId;
                const priceEst = getEstimatedPrice(kabadi, scrapType, parseFloat(approxQuantity) || 1);

                return (
                  <div
                    key={kabadi.kabadiId}
                    onClick={() => kabadi.available && setSelectedKabadi(kabadi)}
                    style={{
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '1.15rem',
                      cursor: kabadi.available ? 'pointer' : 'not-allowed',
                      opacity: kabadi.available ? 1 : 0.65,
                      boxShadow: isSelected ? '0 8px 18px -4px rgba(5, 150, 105, 0.15)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: isSelected ? '#059669' : '#e2e8f0',
                          color: isSelected ? '#fff' : '#334155',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem', fontWeight: 800, flexShrink: 0
                        }}>
                          🚛
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{kabadi.name}</h3>
                            {kabadi.available ? (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4 }}>
                                🟢 Available Now
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: 4 }}>
                                🔴 Currently Busy
                              </span>
                            )}
                            {kabadi.badge && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 4 }}>
                                {kabadi.badge}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={13} color="#059669" /> <strong>{kabadi.distance}</strong> away
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Star size={13} color="#eab308" fill="#eab308" /> <strong>{kabadi.rating}</strong> ({kabadi.totalPickups} pickups)
                            </span>
                          </div>

                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 3 }}>
                            Serves: {kabadi.areas.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Rate for {scrapType}</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                          ₹{priceEst?.rate || 40} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/kg</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginTop: 2 }}>
                          Est. Total: ₹{priceEst?.estimated || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button variant="primary" disabled={!selectedKabadi} onClick={() => setStep(3)}>
                Next: Schedule Pickup →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Schedule Date/Time & Final Confirmation ── */}
        {step === 3 && (
          <Card style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              3. Appointment Time & Confirmation
            </h2>

            {/* Selected summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Selected Collector:</span>
                <strong style={{ fontSize: '0.85rem' }}>{selectedKabadi?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Estimated Distance:</span>
                <strong style={{ fontSize: '0.85rem' }}>{selectedKabadi?.distance}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Material & Quantity:</span>
                <strong style={{ fontSize: '0.85rem' }}>{scrapType} (~{approxQuantity} kg)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Est. Payout to You:</span>
                <strong style={{ fontSize: '1rem', color: '#059669' }}>
                  ₹{(getEstimatedPrice(selectedKabadi, scrapType, parseFloat(approxQuantity) || 1))?.estimated || 0}
                </strong>
              </div>
            </div>

            {/* Date & Time selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Preferred Date *
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Preferred Time Slot *
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                  <option value="03:00 PM - 06:00 PM">Evening (03:00 PM - 06:00 PM)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Special Instructions (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ring doorbell twice, materials kept in balcony"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                style={{ background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', fontWeight: 800 }}
              >
                {isSubmitting ? 'Booking…' : '✓ Confirm Pickup Booking'}
              </Button>
            </div>
          </Card>
        )}
      </PageContainer>
    </div>
  );
};

// ─── 3. Customer Bookings Tracking Page (/customer/bookings) ──────────────────

export const CustomerBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user?.userId || 'usr-customer-01';

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');

  // Modals
  const [razorpayBooking, setRazorpayBooking] = useState(null);
  const [receiptModalTx, setReceiptModalTx] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const refresh = () => {
    setBookings(getBookingsByCustomer(customerId));
  };

  useEffect(() => {
    refresh();
  }, [customerId]);

  const filtered = filter === 'all'
    ? bookings
    : filter === 'active'
    ? bookings.filter((b) => !['paid', 'completed', 'cancelled', 'rejected'].includes(b.status))
    : bookings.filter((b) => ['paid', 'completed'].includes(b.status));

  const handleRazorpaySuccess = (result, booking) => {
    try {
      recordKabadiPayment(booking.bookingId, 'Razorpay');
      setRazorpayBooking(null);
      refresh();
    } catch (err) {
      alert('Payment succeeded but could not update status: ' + err.message);
    }
  };

  const handleCancel = (bookingId) => {
    try {
      cancelBooking(bookingId, cancelReason || 'Cancelled by customer');
      setCancelModalId(null);
      setCancelReason('');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="960px">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/customer')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                📋 My Scrap Pickup Bookings
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Real-time tracking from request to doorstep collection and payment
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/customer/book-pickup')}
            style={{ background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', fontWeight: 700 }}
          >
            + New Pickup
          </Button>
        </div>

        <CustomerNavBar />

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: filter === f ? 700 : 500,
                border: filter === f ? '1px solid #059669' : '1px solid #cbd5e1',
                background: filter === f ? '#059669' : '#fff',
                color: filter === f ? '#fff' : '#64748b',
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'All Requests' : f === 'active' ? 'Active / In Progress' : 'Completed / Paid'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>No Bookings Found</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 360, margin: '0.4rem auto 1.25rem' }}>
              No scrap pickup requests match your selected filter.
            </p>
            <Button variant="primary" onClick={() => navigate('/customer/book-pickup')}>
              Book Doorstep Pickup
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((b) => {
              const statusCfg = getStatusColor(b.status);
              const canPayOnline = b.status === 'collected' && b.paymentStatus !== 'paid' && b.finalTotalAmount > 0;
              const isPaid = b.status === 'paid' || b.paymentStatus === 'paid';

              return (
                <Card key={b.bookingId} style={{ padding: '1.25rem' }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                          {b.bookingId}
                        </span>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 800,
                          background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                          padding: '2px 8px', borderRadius: 6
                        }}>
                          {getStatusLabel(b.status)}
                        </span>
                        {b.scheduledDate && (
                          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={13} /> {b.scheduledDate} {b.scheduledTime || ''}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 6, marginBottom: 2 }}>
                        {b.scrapType}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        📍 {b.address}, {b.area}
                      </div>
                    </div>

                    {/* Pricing Box */}
                    <div style={{ textAlign: 'right', background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      {b.finalTotalAmount ? (
                        <>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Final Weighed Amount</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669' }}>
                            ₹{b.finalTotalAmount}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {b.actualWeightKg} kg @ ₹{b.finalPricePerKg}/kg
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Estimated Amount</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155' }}>
                            ₹{b.estimatedTotalAmount || 0}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            ~{b.estimatedWeightKg} kg
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visual 6-Step Progression Stepper */}
                  <LifecycleStepper currentStatus={b.status} />

                  {/* Details strip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} color="#059669" />
                      <span>Kabadiwala: <strong>{b.kabadiName}</strong> ({b.kabadiPhone})</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {canPayOnline && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setRazorpayBooking(b)}
                          style={{ background: 'linear-gradient(135deg,#072654,#1a56db)', border: 'none', fontWeight: 700 }}
                        >
                          💳 Pay Online (Razorpay)
                        </Button>
                      )}

                      {isPaid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReceiptModalTx({
                            transactionId: b.bookingId,
                            lotId: b.scrapType,
                            totalAmount: b.finalTotalAmount || b.estimatedTotalAmount,
                            paymentMethod: b.paymentMethod || 'Cash',
                          })}
                          style={{ color: '#059669', borderColor: '#059669', fontWeight: 700 }}
                        >
                          📎 {getReceiptByTransaction(b.bookingId) ? 'View Receipt' : 'Upload Receipt'}
                        </Button>
                      )}

                      {['requested', 'pending'].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => setCancelModalId(b.bookingId)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Razorpay Modal for Customer */}
        {razorpayBooking && (
          <RazorpayPaymentModal
            isOpen={!!razorpayBooking}
            onClose={() => setRazorpayBooking(null)}
            receiptId={razorpayBooking.bookingId}
            amount={razorpayBooking.finalTotalAmount || 0}
            payerId={customerId}
            payerName={user?.name || 'Customer'}
            payerEmail={user?.email || 'customer@scrapsetu.demo'}
            payerPhone={user?.meta?.phone || '9999999999'}
            payerRole="customer"
            description={`Scrap Doorstep Pickup: ${razorpayBooking.scrapType}`}
            onSuccess={(result) => handleRazorpaySuccess(result, razorpayBooking)}
            onFailure={() => setRazorpayBooking(null)}
          />
        )}

        {/* Payment Receipt Modal */}
        {receiptModalTx && (
          <PaymentReceiptModal
            isOpen={!!receiptModalTx}
            onClose={() => setReceiptModalTx(null)}
            transaction={receiptModalTx}
            uploadedBy={customerId}
            uploadedByRole="customer"
            buyerName={user?.name || 'Customer'}
            onUploaded={() => {
              setReceiptModalTx(null);
              refresh();
            }}
          />
        )}

        {/* Cancel Modal */}
        {cancelModalId && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setCancelModalId(null)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '100%' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem' }}>🚫 Cancel Pickup Request</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>
                Are you sure you want to cancel this pickup request?
              </p>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" fullWidth onClick={() => setCancelModalId(null)}>Go Back</Button>
                <Button variant="secondary" fullWidth onClick={() => handleCancel(cancelModalId)}>
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
};
