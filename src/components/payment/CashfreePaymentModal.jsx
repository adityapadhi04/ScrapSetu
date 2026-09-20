/**
 * ScrapSetu — Cashfree Payment Modal (Frontend)
 *
 * Shown to the collector AFTER accepting an offer.
 * Displays a Payment Summary and initiates Cashfree Sandbox checkout.
 *
 * Flow:
 *   1. Shows lot, buyer, amount details
 *   2. Collector clicks "Pay ₹X" → backend creates Cashfree order
 *   3. Cashfree JS SDK opens sandbox checkout
 *   4. After checkout, backend verifies payment status
 *   5. Shows verified/pending/failed state + enables handover when VERIFIED
 *
 * SECURITY INVARIANTS (enforced here):
 *   - No amount is self-declared as verified
 *   - Payment status comes only from backend verification
 *   - Offline state blocks payment initiation
 *   - CASHFREE_CLIENT_SECRET is never in this file
 */

import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader, Wifi, RefreshCw, IndianRupee, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isOffline } from '../../services/offlineService';
import { runCashfreePaymentFlow, verifyPaymentWithBackend } from '../../services/cashfreePaymentService';

// ─────────────────────────────────────────────────────────────────────
// Payment Status State Machine
// ─────────────────────────────────────────────────────────────────────
const STATUS = {
  IDLE: 'idle',
  CREATING: 'creating',
  CHECKOUT: 'checkout',
  VERIFYING: 'verifying',
  VERIFIED: 'verified',
  PENDING: 'pending',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  OFFLINE: 'offline',
};

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {object} props.offer - The accepted offer object
 * @param {string} props.transactionId - Created TXN-xxxx
 * @param {string} props.collectorId
 * @param {function} props.onPaymentVerified - Called when backend confirms VERIFIED
 */
const CashfreePaymentModal = ({
  isOpen,
  onClose,
  offer,
  transactionId,
  collectorId,
  onPaymentVerified,
}) => {
  const { t } = useLanguage();

  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [failureReason, setFailureReason] = useState('');

  const handleStatusChange = useCallback((s) => {
    setStatus(s);
  }, []);

  const handlePay = async () => {
    if (!offer || !transactionId) return;

    // Offline guard
    if (isOffline()) {
      setStatus(STATUS.OFFLINE);
      setErrorMsg(t('paymentOfflineError', 'Payment requires an internet connection. Please reconnect and try again.'));
      return;
    }

    setStatus(STATUS.CREATING);
    setErrorMsg('');
    setFailureReason('');

    try {
      const result = await runCashfreePaymentFlow(
        {
          transactionId,
          lotId: offer.lotId,
          buyerId: offer.buyerId,
          buyerName: offer.buyerName,
          buyerType: offer.buyerRole,
          collectorId,
          amount: offer.totalOfferValue,
        },
        handleStatusChange
      );

      if (result.paymentStatus === 'verified') {
        setStatus(STATUS.VERIFIED);
        setVerifiedAt(result.verificationResult?.verifiedAt);
        if (onPaymentVerified) {
          onPaymentVerified({
            transactionId,
            paymentStatus: 'verified',
            handoverEnabled: true,
          });
        }
      } else if (result.paymentStatus === 'failed') {
        setStatus(STATUS.FAILED);
        setFailureReason(result.verificationResult?.failureReason || '');
      } else if (result.paymentStatus === 'offline') {
        setStatus(STATUS.OFFLINE);
        setErrorMsg(result.message);
      } else {
        // pending or cancelled — let them retry
        setStatus(STATUS.PENDING);
      }
    } catch (err) {
      setStatus(STATUS.FAILED);
      setErrorMsg(err.message || t('paymentError', 'An error occurred. Please try again.'));
    }
  };

  const handleVerifyAgain = async () => {
    if (!transactionId) return;
    setStatus(STATUS.VERIFYING);
    try {
      const result = await verifyPaymentWithBackend(transactionId);
      if (result.paymentStatus === 'verified') {
        setStatus(STATUS.VERIFIED);
        setVerifiedAt(result.verifiedAt);
        if (onPaymentVerified) {
          onPaymentVerified({ transactionId, paymentStatus: 'verified', handoverEnabled: true });
        }
      } else if (result.paymentStatus === 'failed') {
        setStatus(STATUS.FAILED);
        setFailureReason(result.failureReason || '');
      } else {
        setStatus(STATUS.PENDING);
      }
    } catch (err) {
      setStatus(STATUS.PENDING);
      setErrorMsg(err.message || '');
    }
  };

  const handleClose = () => {
    // Only allow closing if not mid-checkout
    if (status === STATUS.CREATING || status === STATUS.CHECKOUT) return;
    setStatus(STATUS.IDLE);
    setErrorMsg('');
    setFailureReason('');
    onClose();
  };

  if (!isOpen || !offer) return null;

  const amount = offer.totalOfferValue || 0;
  const buyerTypeLabel =
    offer.buyerRole === 'repair'
      ? t('repairShopLabel', 'Repair Shop (Reuse)')
      : t('authorizedRecyclerLabel', 'Authorized Recycler');

  const isLoading =
    status === STATUS.CREATING ||
    status === STATUS.CHECKOUT ||
    status === STATUS.VERIFYING;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('paymentSummaryTitle', 'Payment Summary')}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🔒 {t('sandboxLabel', 'Cashfree Sandbox — Test Mode')}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>
              {t('paymentSummaryTitle', 'Payment Summary')}
            </h2>
          </div>
          {!isLoading && (
            <button
              id="cashfree-modal-close-btn"
              onClick={handleClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
              }}
              aria-label="Close payment modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* ── VERIFIED STATE ── */}
          {status === STATUS.VERIFIED && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem 0' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <CheckCircle2 size={40} color="#15803d" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
                {t('paymentVerifiedTitle', 'Payment Verified!')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                {t('paymentVerifiedMsg', 'Payment verified. Handover is now available.')}
              </p>
              {verifiedAt && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(verifiedAt).toLocaleString()}
                </p>
              )}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginTop: '1rem',
                  fontSize: '0.82rem',
                  color: '#166534',
                  fontWeight: 600,
                }}
              >
                ✅ {t('handoverEnabled', 'Handover is now enabled for this lot.')}
              </div>
              <button
                id="cashfree-verified-close-btn"
                onClick={handleClose}
                style={{
                  marginTop: '1.25rem',
                  width: '100%',
                  padding: '0.85rem',
                  background: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('done', 'Done')}
              </button>
            </div>
          )}

          {/* ── FAILED STATE ── */}
          {status === STATUS.FAILED && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0 0.5rem 0' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <AlertCircle size={40} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.5rem' }}>
                {t('paymentFailedTitle', 'Payment Failed')}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '0.5rem' }}>
                {t('paymentFailedMsg', 'Payment failed. You can retry.')}
              </p>
              {(failureReason || errorMsg) && (
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  {failureReason || errorMsg}
                </p>
              )}
              <button
                id="cashfree-retry-btn"
                onClick={() => setStatus(STATUS.IDLE)}
                style={{
                  marginTop: '1.25rem',
                  width: '100%',
                  padding: '0.85rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('retryPayment', 'Retry Payment')}
              </button>
            </div>
          )}

          {/* ── OFFLINE STATE ── */}
          {status === STATUS.OFFLINE && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <Wifi size={44} color="#94a3b8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {t('offlineTitle', 'No Internet Connection')}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                {errorMsg || t('paymentOfflineError', 'Payment requires an internet connection.')}
              </p>
              <button
                id="cashfree-offline-retry-btn"
                onClick={() => setStatus(STATUS.IDLE)}
                style={{
                  marginTop: '1.25rem',
                  width: '100%',
                  padding: '0.85rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('tryAgain', 'Try Again')}
              </button>
            </div>
          )}

          {/* ── PENDING STATE ── */}
          {status === STATUS.PENDING && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <RefreshCw size={36} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', marginBottom: '0.5rem' }}>
                {t('paymentPendingTitle', 'Payment Pending')}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '1rem' }}>
                {t('paymentPendingMsg', 'Payment is still being confirmed. Please check again.')}
              </p>
              <button
                id="cashfree-verify-again-btn"
                onClick={handleVerifyAgain}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginBottom: '0.75rem',
                }}
              >
                {t('checkPaymentStatus', 'Check Payment Status')}
              </button>
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('closeAndCheckLater', 'Close — Check Later')}
              </button>
            </div>
          )}

          {/* ── LOADING STATES ── */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <Loader size={32} color="#15803d" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                {status === STATUS.CREATING && t('creatingOrder', 'Creating payment order…')}
                {status === STATUS.CHECKOUT && t('openingCheckout', 'Opening Cashfree checkout…')}
                {status === STATUS.VERIFYING && t('verifyingPayment', 'Verifying payment with server…')}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {t('doNotClose', 'Please do not close this window.')}
              </p>
            </div>
          )}

          {/* ── IDLE / PAYMENT SUMMARY ── */}
          {status === STATUS.IDLE && (
            <>
              {/* Summary card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.1rem 1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  {t('paymentSummaryTitle', 'Payment Summary')}
                </div>

                {[
                  { label: t('lotId', 'Lot'), value: offer.lotId },
                  { label: t('buyer', 'Buyer'), value: offer.buyerName },
                  { label: t('buyerType', 'Buyer Type'), value: buyerTypeLabel },
                  { label: t('material', 'Material'), value: `${offer.materialCategory} (${offer.weight} ${offer.weightUnit || 'kg'})` },
                  { label: t('offeredRate', 'Rate'), value: `₹${offer.offeredPrice}/kg` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.84rem' }}
                  >
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
                  </div>
                ))}

                {/* Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1.5px solid #e2e8f0',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534' }}>
                    {t('totalPayout', 'Total Payout')}
                  </span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d' }}>
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Sandbox disclaimer */}
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '0.6rem 0.9rem',
                  fontSize: '0.74rem',
                  color: '#92400e',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  lineHeight: 1.5,
                }}
              >
                🧪 {t('sandboxDisclaimer', 'Sandbox/Test Mode — No real money is transferred. Use Cashfree test card: 4111 1111 1111 1111, CVV 123, any future expiry.')}
              </div>

              {/* Pay button */}
              <button
                id="cashfree-pay-now-btn"
                onClick={handlePay}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(21, 128, 61, 0.35)',
                  letterSpacing: '0.02em',
                }}
              >
                <IndianRupee size={20} />
                {t('payNow', 'PAY')} ₹{amount.toLocaleString('en-IN')}
              </button>

              <button
                id="cashfree-cancel-btn"
                onClick={handleClose}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('cancel', 'Cancel')}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CashfreePaymentModal;
