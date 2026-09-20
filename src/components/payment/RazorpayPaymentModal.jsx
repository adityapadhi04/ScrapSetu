/**
 * ScrapSetu — Razorpay Payment Modal (Module 18)
 *
 * Reusable modal that initiates Razorpay checkout for any payment context.
 * Used by:
 *   - Collector → Kabadiwala Home Pickup payment (BKG-xxxx)
 *   - Repair Shop → Transaction payment (TXN-xxxx)
 *
 * Props:
 *   isOpen       {boolean}
 *   onClose      {function}
 *   receiptId    {string}   — TXN-xxxx or BKG-xxxx
 *   amount       {number}   — INR
 *   payerId      {string}
 *   payerName    {string}
 *   payerEmail   {string}
 *   payerPhone   {string}
 *   payerRole    {string}   — 'collector' | 'repair' | 'recycler'
 *   description  {string}
 *   onSuccess    {function(result)} — called with verified payment result
 *   onFailure    {function(result)} — called on failure/cancel
 */

import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  openRazorpayCheckout,
  checkRazorpayConfig,
} from '../../services/razorpayService';

const RazorpayPaymentModal = ({
  isOpen,
  onClose,
  receiptId,
  amount,
  payerId,
  payerName,
  payerEmail = 'user@scrapsetu.demo',
  payerPhone = '9999999999',
  payerRole = 'collector',
  description = 'ScrapSetu Payment',
  onSuccess,
  onFailure,
}) => {
  const [status, setStatus] = useState('idle'); // idle | checking | paying | verifying | success | failed | error
  const [errorMsg, setErrorMsg] = useState('');
  const [backendUp, setBackendUp] = useState(null);
  const [rzpConfigured, setRzpConfigured] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  // Check backend on open
  useEffect(() => {
    if (!isOpen) { setStatus('idle'); setErrorMsg(''); setPaymentResult(null); return; }
    setStatus('checking');
    checkRazorpayConfig().then(({ backendUp: up, configured }) => {
      setBackendUp(up);
      setRzpConfigured(configured);
      setStatus('idle');
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!backendUp || !rzpConfigured) {
      setErrorMsg('Backend not running or Razorpay not configured. Start the backend server first.');
      return;
    }
    setStatus('paying');
    setErrorMsg('');
    try {
      const result = await openRazorpayCheckout({
        receiptId,
        payerId,
        payerName,
        payerEmail,
        payerPhone,
        payerRole,
        amount,
        description,
        onVerifying: () => setStatus('verifying'),
      });

      setPaymentResult(result);

      if (result.cancelled) {
        setStatus('idle');
        return;
      }

      if (result.verified) {
        setStatus('success');
        if (onSuccess) onSuccess(result);
      } else {
        setStatus('failed');
        setErrorMsg(result.message || result.errorDesc || 'Payment failed or not verified.');
        if (onFailure) onFailure(result);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Unexpected error during payment.');
      if (onFailure) onFailure({ error: err.message });
    }
  };

  const isLoading = ['checking', 'paying', 'verifying'].includes(status);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9300,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={() => { if (!isLoading) onClose(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 18,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#072654 0%,#1a56db 100%)',
          padding: '1.1rem 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CreditCard size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Secure Payment
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Pay via Razorpay
              </h2>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div style={{ padding: '1.35rem 1.4rem' }}>
          {/* ── Success State ── */}
          {status === 'success' && paymentResult && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>Payment Successful!</h3>
              <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '0.85rem' }}>
                ₹{amount?.toLocaleString('en-IN')} paid and verified by ScrapSetu.
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', textAlign: 'left', fontSize: '0.78rem' }}>
                <div><strong>Receipt ID:</strong> <span style={{ fontFamily: 'monospace' }}>{receiptId}</span></div>
                <div><strong>Payment ID:</strong> <span style={{ fontFamily: 'monospace' }}>{paymentResult.paymentId}</span></div>
                {paymentResult.verifiedAt && (
                  <div><strong>Verified at:</strong> {new Date(paymentResult.verifiedAt).toLocaleString('en-IN')}</div>
                )}
              </div>
              <button
                onClick={onClose}
                style={{ width: '100%', padding: '0.8rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Done ✓
              </button>
            </div>
          )}

          {/* ── Normal / Idle State ── */}
          {status !== 'success' && (
            <>
              {/* Amount display */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '1rem', marginBottom: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>Total Amount</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
                  ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', marginTop: 2 }}>
                  {receiptId}
                </div>
              </div>

              {/* Payer info */}
              <div style={{ background: '#f1f5f9', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#64748b' }}>Name</span>
                  <span style={{ fontWeight: 700 }}>{payerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#64748b' }}>Description</span>
                  <span style={{ fontWeight: 700 }}>{description}</span>
                </div>
              </div>

              {/* Backend status */}
              {status === 'checking' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Checking backend connection…
                </div>
              )}
              {status !== 'checking' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.77rem',
                  marginBottom: '0.75rem',
                  color: backendUp && rzpConfigured ? '#15803d' : '#dc2626',
                }}>
                  {backendUp && rzpConfigured
                    ? <><ShieldCheck size={14} /> Backend connected • Razorpay Test Mode</>
                    : <><AlertCircle size={14} /> {!backendUp ? 'Backend offline — start the FastAPI server' : 'Razorpay not configured on backend'}</>
                  }
                </div>
              )}

              {/* Error message */}
              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {errorMsg}
                </div>
              )}

              {/* Loading spinner overlay text */}
              {['paying', 'verifying'].includes(status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#1d4ed8', marginBottom: '0.85rem', fontWeight: 600 }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {status === 'paying' ? 'Opening Razorpay Checkout…' : 'Verifying payment with backend…'}
                </div>
              )}

              {/* Test card info */}
              {backendUp && rzpConfigured && status === 'idle' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.7rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.76rem', color: '#1e40af' }}>
                  <strong>🧪 Test Mode Cards:</strong>
                  <div style={{ marginTop: 4, fontFamily: 'monospace', lineHeight: 1.6 }}>
                    ✅ Success: <strong>4111 1111 1111 1111</strong><br />
                    ❌ Failure: <strong>4000 0000 0000 0002</strong><br />
                    CVV: any 3 digits • Expiry: any future date
                  </div>
                </div>
              )}

              <button
                id="btn-razorpay-pay-now"
                disabled={isLoading || !backendUp || !rzpConfigured}
                onClick={handlePay}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: isLoading || !backendUp || !rzpConfigured
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg,#072654,#1a56db)',
                  color: isLoading || !backendUp || !rzpConfigured ? '#94a3b8' : '#fff',
                  border: 'none', borderRadius: 12,
                  fontSize: '1rem', fontWeight: 800, cursor: isLoading || !backendUp || !rzpConfigured ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                {isLoading
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                  : <><CreditCard size={18} /> Pay ₹{parseFloat(amount || 0).toLocaleString('en-IN')}</>
                }
              </button>

              {!isLoading && (
                <button
                  onClick={onClose}
                  style={{ width: '100%', marginTop: 8, padding: '0.7rem', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}

              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ShieldCheck size={12} />
                Secured by Razorpay • PCI-DSS Compliant
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RazorpayPaymentModal;
