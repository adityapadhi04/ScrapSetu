/**
 * ScrapSetu — Collector Home Pickup Pages (Module 17)
 *
 * CollectorBookPickupPage  → /collector/book-pickup
 * CollectorPickupTrackingPage → /collector/pickups
 *
 * Full flow:
 *   1. Enter scrap details + area
 *   2. Browse nearby kabadiwalas
 *   3. Select one & confirm booking
 *   4. Track status (pending → accepted → in_progress → completed)
 *   5. View final price & payment on completion
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Phone, Package, IndianRupee,
  CheckCircle2, Clock, Truck, X, ChevronRight, RefreshCw,
  User, AlertCircle, Calendar
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getNearbyKabadiwalas,
  createBooking,
  getBookingsByCollector,
  acceptBooking,
  rejectBooking,
  setFinalPrice,
  recordKabadiPayment,
  completeBooking,
  cancelBooking,
  getEstimatedPrice,
  getStatusColor,
  getStatusLabel,
  SCRAP_TYPES,
  PAYMENT_METHODS_KABADI,
} from '../../services/kabadiService';
import RazorpayPaymentModal from '../../components/payment/RazorpayPaymentModal';

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepDot = ({ n, active, done }) => (
  <div style={{
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.78rem', fontWeight: 800,
    background: done ? '#15803d' : active ? '#0f172a' : '#e2e8f0',
    color: done || active ? '#fff' : '#94a3b8',
    flexShrink: 0,
    transition: 'all 0.2s',
  }}>
    {done ? '✓' : n}
  </div>
);

const Steps = ({ current }) => {
  const steps = ['Details', 'Nearby', 'Confirm'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '1.5rem' }}>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <StepDot n={i + 1} active={current === i + 1} done={current > i + 1} />
            <span style={{ fontSize: '0.68rem', color: current === i + 1 ? '#0f172a' : '#94a3b8', fontWeight: 700 }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: current > i + 1 ? '#15803d' : '#e2e8f0', marginBottom: 16 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Kabadiwala Card ──────────────────────────────────────────────────────────

const KabadiCard = ({ kabadi, scrapType, weight, selected, onSelect }) => {
  const priceInfo = getEstimatedPrice(kabadi, scrapType, parseFloat(weight) || 0);
  return (
    <div
      onClick={() => kabadi.available && onSelect(kabadi)}
      style={{
        border: selected ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '1rem 1.1rem',
        cursor: kabadi.available ? 'pointer' : 'not-allowed',
        background: selected ? '#f8fafc' : '#fff',
        opacity: kabadi.available ? 1 : 0.55,
        transition: 'all 0.15s',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{kabadi.name}</span>
            {kabadi.badge && (
              <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 99, fontWeight: 700, border: '1px solid #fde68a' }}>
                {kabadi.badge}
              </span>
            )}
            {!kabadi.available && (
              <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>Unavailable</span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>{kabadi.ownerName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{kabadi.rating}</span>
            <span>•  {kabadi.totalPickups} pickups</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
            📍 Serves: {kabadi.areas.join(', ')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
            Min: {kabadi.minWeightKg} kg
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          {priceInfo && parseFloat(weight) > 0 ? (
            <>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Est. payout</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>
                ₹{priceInfo.estimated.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>₹{priceInfo.rate}/kg</div>
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tap to select</div>
          )}
          {selected && (
            <div style={{ marginTop: 6, background: '#0f172a', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
              ✓ Selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: Book Home Pickup (/collector/book-pickup)
// ─────────────────────────────────────────────────────────────────────────────

export const CollectorBookPickupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const collectorId = user?.userId || 'usr-collector-01';

  const [step, setStep] = useState(1);
  const [scrapType, setScrapType] = useState('Mixed E-Waste');
  const [weight, setWeight] = useState('');
  const [area, setArea] = useState(user?.meta?.area || 'Gunupur');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [nearbyList, setNearbyList] = useState([]);
  const [selectedKabadi, setSelectedKabadi] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStep1Next = () => {
    if (!area.trim()) { setError('Please enter your area/locality.'); return; }
    if (!scrapType) { setError('Please select scrap type.'); return; }
    setError('');
    const list = getNearbyKabadiwalas(area, scrapType);
    setNearbyList(list);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!selectedKabadi) { setError('Please select a kabadiwala.'); return; }
    setError('');
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!selectedKabadi) return;
    setIsSubmitting(true);
    setError('');
    try {
      const booking = createBooking({
        collectorId,
        collectorName: user?.name || 'Collector',
        collectorPhone: user?.phone || '',
        kabadiId: selectedKabadi.kabadiId,
        area,
        address,
        scrapType,
        estimatedWeightKg: weight || 0,
        notes,
        preferredDate,
        preferredTime,
      });
      setBookingResult(booking);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '5rem' }}>
      <PageContainer mobile>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <button onClick={() => navigate('/collector')} className="btn btn-ghost" style={{ padding: 6 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📦 Book Home Pickup</h1>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Get a kabadiwala to pick up scrap from your home</p>
          </div>
        </div>

        {step < 4 && <Steps current={step} />}

        {/* ── Step 1: Scrap Details ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.9rem' }}>🗑️ What scrap do you have?</h2>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={labelStyle}>Scrap Type</label>
                <select
                  value={scrapType}
                  onChange={(e) => setScrapType(e.target.value)}
                  style={selectStyle}
                >
                  {SCRAP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={labelStyle}>Estimated Weight (kg) <span style={{ fontWeight: 400, color: '#94a3b8' }}>— optional</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={labelStyle}>Your Area / Locality *</label>
                <input
                  type="text"
                  placeholder="e.g. Gunupur, Rayagada..."
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={labelStyle}>Full Address <span style={{ fontWeight: 400, color: '#94a3b8' }}>— optional</span></label>
                <input
                  type="text"
                  placeholder="Door no., street..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={labelStyle}>Preferred Date</label>
                  <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Preferred Time</label>
                  <input type="text" placeholder="e.g. 10:00 AM" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: '#94a3b8' }}>— optional</span></label>
                <textarea
                  rows={2}
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </Card>

            {error && <ErrorBanner msg={error} />}

            <Button variant="primary" fullWidth onClick={handleStep1Next} id="btn-pickup-next-1">
              Find Nearby Kabadiwalas →
            </Button>
          </div>
        )}

        {/* ── Step 2: Select Kabadiwala ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>🔍 Kabadiwalas Near You</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{area} • {scrapType}{weight ? ` • ~${weight}kg` : ''}</p>
              </div>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>
                ← Edit
              </button>
            </div>

            {nearbyList.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                <h3 style={{ fontWeight: 800 }}>No kabadiwalas found nearby</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>Try a different area name like "Gunupur" or "Rayagada".</p>
                <Button variant="outline" onClick={() => setStep(1)} style={{ marginTop: 12 }}>← Try Different Area</Button>
              </Card>
            ) : (
              nearbyList.map((k) => (
                <KabadiCard
                  key={k.kabadiId}
                  kabadi={k}
                  scrapType={scrapType}
                  weight={weight}
                  selected={selectedKabadi?.kabadiId === k.kabadiId}
                  onSelect={setSelectedKabadi}
                />
              ))
            )}

            {error && <ErrorBanner msg={error} />}

            {nearbyList.length > 0 && (
              <Button variant="primary" fullWidth onClick={handleStep2Next} id="btn-pickup-next-2" style={{ marginTop: 12 }}>
                Continue with {selectedKabadi ? selectedKabadi.name : 'Selected'} →
              </Button>
            )}
          </div>
        )}

        {/* ── Step 3: Confirm Booking ── */}
        {step === 3 && selectedKabadi && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem' }}>✅ Confirm Your Booking</h2>

              {/* Summary */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.85rem', marginBottom: '0.85rem', border: '1px solid #e2e8f0' }}>
                <InfoRow label="Kabadiwala" value={selectedKabadi.name} />
                <InfoRow label="Owner" value={selectedKabadi.ownerName} />
                <InfoRow label="Phone" value={selectedKabadi.phone} />
                <InfoRow label="Rating" value={`⭐ ${selectedKabadi.rating}`} />
                <InfoRow label="Scrap Type" value={scrapType} />
                {weight && <InfoRow label="Est. Weight" value={`~${weight} kg`} />}
                <InfoRow label="Area" value={area} />
                {address && <InfoRow label="Address" value={address} />}
                {preferredDate && <InfoRow label="Preferred Date" value={`${preferredDate} ${preferredTime || ''}`} />}
                {(() => {
                  const p = getEstimatedPrice(selectedKabadi, scrapType, parseFloat(weight) || 0);
                  return p && parseFloat(weight) > 0 ? (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Estimated Payout</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>₹{p.estimated.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>@ ₹{p.rate}/kg (indicative — final price set at visit)</div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div style={{ fontSize: '0.76rem', color: '#64748b', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '0.6rem 0.85rem', marginBottom: '0.85rem' }}>
                ℹ️ The kabadiwala will confirm the pickup time. Final price is determined after physical inspection at your home.
              </div>
            </Card>

            {error && <ErrorBanner msg={error} />}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" fullWidth onClick={() => setStep(2)}>← Back</Button>
              <Button
                variant="primary" fullWidth
                id="btn-confirm-kabadi-booking"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Booking…' : '📦 Confirm Booking'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Booking Success ── */}
        {step === 4 && bookingResult && (
          <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', marginBottom: 4 }}>Booking Confirmed!</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Your home pickup request has been sent to {bookingResult.kabadiName}.
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '0.85rem', marginBottom: '1.25rem', textAlign: 'left' }}>
              <InfoRow label="Booking ID" value={<span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{bookingResult.bookingId}</span>} />
              <InfoRow label="Status" value="⏳ Pending Acceptance" />
              <InfoRow label="Kabadiwala" value={bookingResult.kabadiName} />
              <InfoRow label="Phone" value={bookingResult.kabadiPhone} />
            </div>
            <Button variant="primary" fullWidth id="btn-view-pickups" onClick={() => navigate('/collector/pickups')}>
              📋 Track My Pickups
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/collector')} style={{ marginTop: 8 }}>
              Back to Dashboard
            </Button>
          </Card>
        )}
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: Track Pickups (/collector/pickups)
// ─────────────────────────────────────────────────────────────────────────────

export const CollectorPickupTrackingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const collectorId = user?.userId || 'usr-collector-01';

  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const refresh = () => setBookings(getBookingsByCollector(collectorId));

  useEffect(() => { refresh(); }, [collectorId]);

  const filtered = filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus);

  const handleComplete = (booking) => {
    try {
      if (!booking.finalTotalAmount) {
        // Demo: auto-set a price if kabadi hasn't set one
        setFinalPrice(booking.bookingId, { actualWeightKg: booking.estimatedWeightKg || 1, finalPricePerKg: 40 });
      }
      const updated = getBookingsByCollector(collectorId).find((b) => b.bookingId === booking.bookingId);
      setPaymentBooking(updated);
      setPaymentModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRazorpaySuccess = (result, booking) => {
    try {
      // Record payment in localStorage and complete booking
      recordKabadiPayment(booking.bookingId, 'Razorpay');
      completeBooking(booking.bookingId);
      setPaymentModalOpen(false);
      setPaymentBooking(null);
      refresh();
    } catch (err) {
      alert('Payment verified but could not complete booking: ' + err.message);
    }
  };

  const handleCancel = (bookingId) => {
    try {
      cancelBooking(bookingId, cancelReason || 'Cancelled by collector');
      setCancelModalId(null);
      setCancelReason('');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '5rem' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <button onClick={() => navigate('/collector')} className="btn btn-ghost" style={{ padding: 6 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📋 My Pickup Requests</h1>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Track your home pickup bookings</p>
          </div>
          <button
            onClick={refresh}
            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: '1rem', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                background: filterStatus === s ? '#0f172a' : '#e2e8f0',
                color: filterStatus === s ? '#fff' : '#475569',
              }}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* New Booking CTA */}
        <button
          id="btn-new-pickup"
          onClick={() => navigate('/collector/book-pickup')}
          style={{
            width: '100%', marginBottom: '1rem', padding: '0.8rem', borderRadius: 12,
            background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', color: '#fff',
            border: 'none', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Package size={18} /> + Book New Pickup
        </button>

        {filtered.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
            <h3 style={{ fontWeight: 800 }}>No pickup requests yet</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>Book your first home pickup to get started.</p>
            <Button variant="primary" onClick={() => navigate('/collector/book-pickup')} style={{ marginTop: 12 }} id="btn-start-pickup">
              Book Home Pickup
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filtered.map((booking) => {
              const sc = getStatusColor(booking.status);
              const isActive = ['pending', 'accepted', 'in_progress'].includes(booking.status);
              return (
                <Card
                  key={booking.bookingId}
                  style={{ padding: '1.1rem', borderLeft: `4px solid ${sc.border}`, cursor: 'pointer' }}
                  onClick={() => setSelectedBooking(selectedBooking?.bookingId === booking.bookingId ? null : booking)}
                >
                  {/* IDs + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                        {booking.bookingId}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'uppercase'
                    }}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: 2 }}>{booking.scrapType}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    🏠 {booking.area} {booking.address ? `• ${booking.address}` : ''}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                    👤 <strong>{booking.kabadiName}</strong> • {booking.kabadiPhone}
                  </div>
                  {booking.estimatedWeightKg > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                      Est. {booking.estimatedWeightKg} kg
                    </div>
                  )}
                  {booking.scheduledDate && (
                    <div style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: 3 }}>
                      📅 Scheduled: {booking.scheduledDate} {booking.scheduledTime || ''}
                    </div>
                  )}
                  {booking.finalTotalAmount && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Final Payout:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                        ₹{booking.finalTotalAmount.toLocaleString('en-IN')}
                      </span>
                      {booking.paymentStatus === 'paid' && (
                        <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                          ✓ Paid ({booking.paymentMethod})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {selectedBooking?.bookingId === booking.bookingId && (
                    <div style={{ marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: '0.6rem 0.85rem', marginBottom: '0.75rem' }}>
                        {getStatusLabel(booking.status)}
                        {booking.rejectionReason && <div style={{ marginTop: 3, color: '#dc2626' }}>Reason: {booking.rejectionReason}</div>}
                        {booking.cancellationReason && <div style={{ marginTop: 3 }}>Reason: {booking.cancellationReason}</div>}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Booked: {new Date(booking.createdAt).toLocaleString('en-IN')}
                      </div>
                      {booking.completedAt && (
                        <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                          Completed: {new Date(booking.completedAt).toLocaleString('en-IN')}
                        </div>
                      )}

                      {/* Demo actions for collector */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {booking.status === 'accepted' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleComplete(booking); }}
                            style={actionBtnStyle('#15803d')}
                            id={`btn-complete-${booking.bookingId}`}
                          >
                            ✓ Mark Completed & Pay
                          </button>
                        )}
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleComplete(booking); }}
                            style={actionBtnStyle('#6d28d9')}
                            id={`btn-pay-${booking.bookingId}`}
                          >
                            💳 Record Payment & Complete
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setCancelModalId(booking.bookingId); }}
                            style={actionBtnStyle('#dc2626')}
                            id={`btn-cancel-${booking.bookingId}`}
                          >
                            🚫 Cancel
                          </button>
                        )}
                      </div>

                      {/* Demo: Simulate kabadiwala acceptance */}
                      {booking.status === 'pending' && (
                        <div style={{ marginTop: 8, padding: '0.6rem 0.85rem', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.76rem', color: '#78350f' }}>
                          <strong>Demo:</strong> Simulate kabadiwala response →
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); acceptBooking(booking.bookingId, booking.preferredDate || '', booking.preferredTime || ''); refresh(); }}
                              style={{ ...actionBtnStyle('#15803d'), fontSize: '0.73rem' }}
                              id={`btn-demo-accept-${booking.bookingId}`}
                            >✓ Accept (Demo)</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); rejectBooking(booking.bookingId, 'Not available in this area currently'); refresh(); }}
                              style={{ ...actionBtnStyle('#dc2626'), fontSize: '0.73rem' }}
                              id={`btn-demo-reject-${booking.bookingId}`}
                            >✗ Reject (Demo)</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      {/* Razorpay Payment Modal (Module 18) */}
      {paymentBooking && (
        <RazorpayPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => { setPaymentModalOpen(false); setPaymentBooking(null); }}
          receiptId={paymentBooking.bookingId}
          amount={paymentBooking.finalTotalAmount || 0}
          payerId={collectorId}
          payerName={user?.name || 'Collector'}
          payerEmail={user?.email || 'collector@scrapsetu.demo'}
          payerPhone={user?.phone || '9999999999'}
          payerRole="collector"
          description={`Kabadiwala Pickup — ${paymentBooking.scrapType} — ${paymentBooking.kabadiName}`}
          onSuccess={(result) => handleRazorpaySuccess(result, paymentBooking)}
          onFailure={() => { setPaymentModalOpen(false); setPaymentBooking(null); }}
        />
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setCancelModalId(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem' }}>🚫 Cancel Booking</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>Please provide a reason for cancellation (optional).</p>
            <textarea
              rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. No longer needed..."
              style={{ ...inputStyle, marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" fullWidth onClick={() => setCancelModalId(null)}>Go Back</Button>
              <Button variant="secondary" fullWidth id="btn-confirm-cancel" onClick={() => handleCancel(cancelModalId)}>
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

// ─── Shared Styles & Helpers ──────────────────────────────────────────────────

const labelStyle = {
  fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4,
};

const inputStyle = {
  width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: '0.85rem',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: '0.85rem',
  background: '#fff', boxSizing: 'border-box',
};

const actionBtnStyle = (color) => ({
  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: '0.78rem', fontWeight: 700,
  background: color + '18', color, borderColor: color + '44',
  borderWidth: 1, borderStyle: 'solid',
});

const ErrorBanner = ({ msg }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.8rem' }}>
    <AlertCircle size={14} /> {msg}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, fontSize: '0.8rem' }}>
    <span style={{ color: '#64748b', flexShrink: 0, marginRight: 8 }}>{label}</span>
    <span style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{value}</span>
  </div>
);
