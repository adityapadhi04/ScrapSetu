/**
 * ScrapSetu — Kabadiwala Dashboard (Module 17 / Kabadiwala Role)
 *
 * Dedicated dashboard for local Kabadiwalas / scrap aggregators:
 *   - Available / Unavailable toggle (persisted)
 *   - Incoming customer pickup requests with Accept / Reject actions
 *   - Active pickups progression: Accepted → On the Way → Arrived → Weighed & Price Set → Completed/Paid
 *   - Weighing modal for entering final actual weight and price per kg
 *   - Payment collection & receipt upload integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, MapPin, Phone, User, Calendar, CheckCircle2,
  XCircle, Clock, AlertCircle, IndianRupee, Scale,
  Camera, ArrowLeft, RefreshCw, Power, ShieldCheck
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getBookingsByKabadi,
  getKabadiAvailability,
  toggleKabadiAvailability,
  acceptBooking,
  rejectBooking,
  startOnTheWay,
  markArrived,
  setFinalPrice,
  recordKabadiPayment,
  getStatusColor,
  getStatusLabel,
  LIFECYCLE_STEPS,
  PAYMENT_METHODS_KABADI,
} from '../../services/kabadiService';
import { LifecycleStepper } from '../customer/CustomerPages';
import RazorpayPaymentModal from '../../components/payment/RazorpayPaymentModal';
import PaymentReceiptModal from '../../components/payment/PaymentReceiptModal';
import { getReceiptByTransaction } from '../../services/paymentReceiptService';

export const KabadiwalaDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const kabadiId = user?.kabadiId || user?.meta?.kabadiId || 'KBD-001';

  // Availability state
  const [isAvailable, setIsAvailable] = useState(() => getKabadiAvailability(kabadiId));
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming'); // incoming | active | completed

  // Modals
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [weighModalBooking, setWeighModalBooking] = useState(null);
  const [actualWeight, setActualWeight] = useState('');
  const [finalPricePerKg, setFinalPricePerKg] = useState('40');
  const [weighError, setWeighError] = useState('');

  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [razorpayBooking, setRazorpayBooking] = useState(null);
  const [receiptModalTx, setReceiptModalTx] = useState(null);

  const refresh = () => {
    setBookings(getBookingsByKabadi(kabadiId));
    setIsAvailable(getKabadiAvailability(kabadiId));
  };

  useEffect(() => {
    refresh();
  }, [kabadiId]);

  const handleToggleAvailability = () => {
    const next = toggleKabadiAvailability(kabadiId);
    setIsAvailable(next);
  };

  // Status transitions
  const handleAccept = (bookingId) => {
    acceptBooking(bookingId);
    refresh();
  };

  const handleReject = () => {
    if (!rejectModalBooking) return;
    rejectBooking(rejectModalBooking.bookingId, rejectReason || 'Unavailable at this time');
    setRejectModalBooking(null);
    setRejectReason('');
    refresh();
  };

  const handleStartTrip = (bookingId) => {
    startOnTheWay(bookingId);
    refresh();
  };

  const handleMarkArrived = (bookingId) => {
    markArrived(bookingId);
    refresh();
  };

  const handleSaveWeighing = () => {
    if (!weighModalBooking) return;
    const w = parseFloat(actualWeight);
    const p = parseFloat(finalPricePerKg);
    if (!w || w <= 0) {
      setWeighError('Please enter a valid weight in kg');
      return;
    }
    if (!p || p <= 0) {
      setWeighError('Please enter a valid price per kg');
      return;
    }
    try {
      setFinalPrice(weighModalBooking.bookingId, { actualWeightKg: w, finalPricePerKg: p });
      setWeighModalBooking(null);
      setActualWeight('');
      setWeighError('');
      refresh();
    } catch (err) {
      setWeighError(err.message);
    }
  };

  const handleRecordPaymentSubmit = () => {
    if (!paymentModalBooking) return;
    try {
      recordKabadiPayment(paymentModalBooking.bookingId, paymentMethod);
      setPaymentModalBooking(null);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRazorpaySuccess = (result, booking) => {
    recordKabadiPayment(booking.bookingId, 'Razorpay');
    setRazorpayBooking(null);
    refresh();
  };

  // Groupings
  const incomingRequests = bookings.filter((b) => ['requested', 'pending'].includes(b.status));
  const activePickups = bookings.filter((b) => ['accepted', 'on_the_way', 'in_progress', 'arrived', 'collected'].includes(b.status));
  const completedPickups = bookings.filter((b) => ['paid', 'completed'].includes(b.status));
  const totalRevenue = completedPickups.reduce((sum, b) => sum + (b.finalTotalAmount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="980px">
        {/* Top bar with Availability Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kabadiwala Partner Portal
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
              🚛 {user?.name || 'Local Kabadiwala'}
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              ID: <strong>{kabadiId}</strong> • Operating Area: <strong>{user?.meta?.area || 'Dharavi / Kurla / Sion'}</strong>
            </p>
          </div>

          {/* Availability Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isAvailable ? '#15803d' : '#64748b' }}>
              {isAvailable ? '🟢 Available for Pickups' : '🔴 Currently Unavailable'}
            </span>
            <button
              onClick={handleToggleAvailability}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: isAvailable ? '#15803d' : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                padding: 2,
              }}
              title="Click to toggle available/unavailable status"
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ffffff',
                transform: isAvailable ? 'translateX(20px)' : 'translateX(0px)',
                transition: 'transform 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <Card style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>New Requests</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              {incomingRequests.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#d97706' }}>Awaiting your acceptance</div>
          </Card>

          <Card style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Active Trips</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              {activePickups.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>Scheduled & collected</div>
          </Card>

          <Card style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Completed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              {completedPickups.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#059669' }}>Paid & settled</div>
          </Card>

          <Card style={{ padding: '1rem', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Scrap Payouts Given</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d', marginTop: 2 }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>To customers</div>
          </Card>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('incoming')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: activeTab === 'incoming' ? 800 : 500,
              border: activeTab === 'incoming' ? '1.5px solid #d97706' : '1px solid #e2e8f0',
              background: activeTab === 'incoming' ? '#fef3c7' : '#fff',
              color: activeTab === 'incoming' ? '#92400e' : '#64748b',
              cursor: 'pointer'
            }}
          >
            📬 Incoming Requests ({incomingRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: activeTab === 'active' ? 800 : 500,
              border: activeTab === 'active' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
              background: activeTab === 'active' ? '#eff6ff' : '#fff',
              color: activeTab === 'active' ? '#1e40af' : '#64748b',
              cursor: 'pointer'
            }}
          >
            🚛 Active In-Progress ({activePickups.length})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: activeTab === 'completed' ? 800 : 500,
              border: activeTab === 'completed' ? '1.5px solid #059669' : '1px solid #e2e8f0',
              background: activeTab === 'completed' ? '#ecfdf5' : '#fff',
              color: activeTab === 'completed' ? '#065f46' : '#64748b',
              cursor: 'pointer'
            }}
          >
            ✔️ Completed ({completedPickups.length})
          </button>
        </div>

        {/* ── SECTION 1: INCOMING REQUESTS ── */}
        {activeTab === 'incoming' && (
          <div>
            {incomingRequests.length === 0 ? (
              <Card style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>No New Pickup Requests</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
                  Nearby customer pickup requests for {user?.meta?.area || 'your area'} will appear here.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {incomingRequests.map((b) => (
                  <Card key={b.bookingId} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4 }}>
                            {b.bookingId}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                            Requested on: {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '6px 0 2px' }}>
                          {b.scrapType} • ~{b.estimatedWeightKg} kg
                        </h3>

                        <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 4 }}>
                          👤 Customer: <strong>{b.customerName || b.collectorName}</strong> ({b.customerPhone || b.collectorPhone})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                          📍 Address: <strong>{b.address}</strong>, {b.area}
                        </div>
                        {b.scheduledDate && (
                          <div style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: 2 }}>
                            📅 Preferred Appointment: <strong>{b.scheduledDate} ({b.scheduledTime || 'Flexible'})</strong>
                          </div>
                        )}
                        {b.notes && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>
                            Note: {b.notes}
                          </div>
                        )}
                      </div>

                      {/* Photo preview thumbnail if present */}
                      {b.photoUrl && (
                        <div>
                          <img
                            src={b.photoUrl}
                            alt="Scrap preview"
                            style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        Est. Payout to Customer: <strong style={{ color: '#059669' }}>₹{b.estimatedTotalAmount || 0}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectModalBooking(b)}
                          style={{ borderColor: '#ef4444', color: '#dc2626' }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAccept(b.bookingId)}
                          style={{ background: '#059669', borderColor: '#059669' }}
                        >
                          ✓ Accept Pickup
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 2: ACTIVE PICKUPS ── */}
        {activeTab === 'active' && (
          <div>
            {activePickups.length === 0 ? (
              <Card style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚚</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>No Active Pickups In-Progress</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
                  Accepted customer requests will appear here for doorstep collection.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activePickups.map((b) => {
                  const statusCfg = getStatusColor(b.status);

                  return (
                    <Card key={b.bookingId} style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
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
                          </div>

                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '6px 0 2px' }}>
                            {b.scrapType} • ~{b.estimatedWeightKg} kg
                          </h3>
                          <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                            Customer: <strong>{b.customerName || b.collectorName}</strong> • 📞 <a href={`tel:${b.customerPhone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{b.customerPhone || b.collectorPhone}</a>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                            📍 Doorstep: <strong>{b.address}</strong>, {b.area}
                          </div>
                        </div>

                        {/* Weighed Price Display */}
                        {b.finalTotalAmount && (
                          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: 8, textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 700 }}>Final Weighed Amount</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>₹{b.finalTotalAmount}</div>
                            <div style={{ fontSize: '0.7rem', color: '#065f46' }}>{b.actualWeightKg} kg @ ₹{b.finalPricePerKg}/kg</div>
                          </div>
                        )}
                      </div>

                      {/* Stepper */}
                      <LifecycleStepper currentStatus={b.status} />

                      {/* Dynamic Action Buttons according to current status */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        {b.status === 'accepted' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartTrip(b.bookingId)}
                            style={{ background: '#4f46e5', border: 'none', fontWeight: 700 }}
                          >
                            🚛 Start Trip (On the Way)
                          </Button>
                        )}

                        {['on_the_way', 'in_progress'].includes(b.status) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleMarkArrived(b.bookingId)}
                            style={{ background: '#d97706', border: 'none', fontWeight: 700 }}
                          >
                            📍 Mark Arrived at Customer Door
                          </Button>
                        )}

                        {b.status === 'arrived' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setWeighModalBooking(b);
                              setActualWeight(b.estimatedWeightKg ? String(b.estimatedWeightKg) : '');
                              setFinalPricePerKg('40');
                            }}
                            style={{ background: '#059669', border: 'none', fontWeight: 700 }}
                          >
                            ⚖️ Weigh Scrap & Enter Price
                          </Button>
                        )}

                        {b.status === 'collected' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setWeighModalBooking(b);
                                setActualWeight(b.actualWeightKg ? String(b.actualWeightKg) : '');
                                setFinalPricePerKg(b.finalPricePerKg ? String(b.finalPricePerKg) : '40');
                              }}
                            >
                              ✏️ Edit Weight
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setPaymentModalBooking(b)}
                              style={{ background: '#15803d', border: 'none', fontWeight: 700 }}
                            >
                              💰 Pay Customer (₹{b.finalTotalAmount})
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 3: COMPLETED PICKUPS ── */}
        {activeTab === 'completed' && (
          <div>
            {completedPickups.length === 0 ? (
              <Card style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>No Completed Pickups Yet</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
                  Pickups will appear here once weighed and paid.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {completedPickups.map((b) => (
                  <Card key={b.bookingId} style={{ padding: '1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4 }}>
                            {b.bookingId}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d' }}>
                            ✓ Paid & Settled via {b.paymentMethod || 'Cash'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0 2px' }}>
                          {b.scrapType} • {b.actualWeightKg || b.estimatedWeightKg} kg
                        </h3>

                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Customer: <strong>{b.customerName || b.collectorName}</strong> ({b.area})
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d' }}>
                          ₹{b.finalTotalAmount || b.estimatedTotalAmount}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ marginTop: 4, color: '#059669', borderColor: '#059669' }}
                          onClick={() => setReceiptModalTx({
                            transactionId: b.bookingId,
                            lotId: b.scrapType,
                            totalAmount: b.finalTotalAmount || b.estimatedTotalAmount,
                            paymentMethod: b.paymentMethod || 'Cash',
                          })}
                        >
                          📎 {getReceiptByTransaction(b.bookingId) ? 'View Receipt' : 'Upload Receipt'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODAL: Weigh Scrap & Set Final Price ── */}
        {weighModalBooking && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setWeighModalBooking(null)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 420, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <Scale size={22} color="#059669" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Weigh Scrap on Doorstep
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Enter the verified scale reading and price rate agreed with the customer.
              </p>

              {weighError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                  {weighError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Actual Weighed Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    placeholder="e.g. 2.4"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Rate per kg (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={finalPricePerKg}
                    onChange={(e) => setFinalPricePerKg(e.target.value)}
                    placeholder="e.g. 40"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }}
                  />
                </div>

                {/* Calculation preview */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>Total Payable to Customer</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d' }}>
                    ₹{((parseFloat(actualWeight) || 0) * (parseFloat(finalPricePerKg) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setWeighModalBooking(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveWeighing}>
                  Save & Complete Collection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: Payment Collection ── */}
        {paymentModalBooking && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setPaymentModalBooking(null)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 420, width: '100%' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                💰 Pay Customer
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Total amount: <strong style={{ color: '#15803d', fontSize: '1.1rem' }}>₹{paymentModalBooking.finalTotalAmount}</strong>
              </p>

              {/* Online Payment via Razorpay Option */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                  ⚡ Pay Online (Card / UPI)
                </div>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6', margin: '0 0 8px 0' }}>
                  Pay directly via verified gateway with instant digital receipt.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    const b = paymentModalBooking;
                    setPaymentModalBooking(null);
                    setRazorpayBooking(b);
                  }}
                  style={{ background: 'linear-gradient(135deg,#072654,#1a56db)', border: 'none', fontWeight: 700 }}
                >
                  💳 Launch Razorpay Checkout (₹{paymentModalBooking.finalTotalAmount})
                </Button>
              </div>

              {/* Or Cash / UPI manual */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Or Record Cash Payment
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}
                >
                  {PAYMENT_METHODS_KABADI.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setPaymentModalBooking(null)}>Cancel</Button>
                <Button variant="secondary" onClick={handleRecordPaymentSubmit}>
                  Confirm Cash Payment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: Reject Request ── */}
        {rejectModalBooking && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setRejectModalBooking(null)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '100%' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.5rem' }}>
                Reject Pickup Request
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>
                Provide a reason for rejecting this request:
              </p>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Schedule full today / Out of service area"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" fullWidth onClick={() => setRejectModalBooking(null)}>Cancel</Button>
                <Button variant="secondary" fullWidth onClick={handleReject} style={{ background: '#dc2626', color: '#fff' }}>
                  Confirm Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Razorpay Modal */}
        {razorpayBooking && (
          <RazorpayPaymentModal
            isOpen={!!razorpayBooking}
            onClose={() => setRazorpayBooking(null)}
            receiptId={razorpayBooking.bookingId}
            amount={razorpayBooking.finalTotalAmount || 0}
            payerId={kabadiId}
            payerName={user?.name || 'Local Kabadiwala'}
            payerEmail={user?.email || 'kabadi@scrapsetu.demo'}
            payerPhone={user?.meta?.phone || '9999999999'}
            payerRole="collector"
            description={`Doorstep Scrap Payout: ${razorpayBooking.scrapType} (${razorpayBooking.actualWeightKg} kg)`}
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
            uploadedBy={kabadiId}
            uploadedByRole="collector"
            buyerName={user?.name || 'Kabadiwala'}
            onUploaded={() => {
              setReceiptModalTx(null);
              refresh();
            }}
          />
        )}

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

export default KabadiwalaDashboard;
