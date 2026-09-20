/**
 * ScrapSetu — Razorpay Frontend Service (Module 18)
 *
 * Handles the full Razorpay checkout flow from the frontend:
 *   1. Load Razorpay checkout.js script dynamically
 *   2. Call backend to create a Razorpay order (GET key_id + order_id)
 *   3. Open Razorpay checkout popup with pre-filled payer details
 *   4. On payment success → POST to backend /api/razorpay/verify (HMAC check)
 *   5. Return verified result to caller
 *
 * SECURITY:
 *   - Key Secret NEVER touches this file. Only key_id comes from backend.
 *   - VERIFIED status is only trusted from backend verify endpoint.
 *   - Frontend CANNOT self-declare payment success.
 *
 * Usage:
 *   const result = await openRazorpayCheckout({ receiptId, payerName, ... });
 *   if (result.verified) { ... }
 */

const BACKEND_BASE = 'http://localhost:8000';

// ─── Load Razorpay checkout.js dynamically ────────────────────────────────────

let _scriptLoaded = false;

export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (_scriptLoaded && window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => { _scriptLoaded = true; resolve(true); });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout.js')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => { _scriptLoaded = true; resolve(true); };
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout.js — check internet connection'));
    document.head.appendChild(script);
  });
};

// ─── Step 1: Create Razorpay Order (backend) ─────────────────────────────────

export const createRazorpayOrder = async ({
  receiptId,
  payerName,
  payerEmail = 'user@scrapsetu.demo',
  payerPhone = '9999999999',
  payerRole,
  payerId,
  amount,
  description = 'ScrapSetu Payment',
}) => {
  const res = await fetch(`${BACKEND_BASE}/api/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receipt_id:   receiptId,
      payer_id:     payerId,
      payer_name:   payerName,
      payer_email:  payerEmail,
      payer_phone:  payerPhone,
      payer_role:   payerRole,
      amount:       parseFloat(amount),
      description,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error: ${res.status}`);
  }

  return await res.json();
};

// ─── Step 2: Verify Payment Signature (backend) ───────────────────────────────

export const verifyRazorpayPayment = async ({
  receiptId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  payerId,
}) => {
  const res = await fetch(`${BACKEND_BASE}/api/razorpay/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receipt_id:           receiptId,
      razorpay_order_id:    razorpayOrderId,
      razorpay_payment_id:  razorpayPaymentId,
      razorpay_signature:   razorpaySignature,
      payer_id:             payerId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Verification backend error: ${res.status}`);
  }

  return await res.json();
};

// ─── Full Checkout Flow ───────────────────────────────────────────────────────

/**
 * Open Razorpay checkout and wait for result.
 *
 * @param {object} opts
 * @param {string}  opts.receiptId      — TXN-xxxx, BKG-xxxx, etc.
 * @param {string}  opts.payerId        — ScrapSetu user ID
 * @param {string}  opts.payerName
 * @param {string}  opts.payerEmail
 * @param {string}  opts.payerPhone
 * @param {string}  opts.payerRole      — 'collector' | 'repair' | 'recycler'
 * @param {number}  opts.amount         — in INR
 * @param {string}  opts.description
 * @param {string}  opts.logoUrl        — optional branding logo URL
 * @param {Function} opts.onVerifying   — called while backend is verifying
 *
 * @returns {Promise<{verified: boolean, paymentId: string, orderId: string, message: string}>}
 */
export const openRazorpayCheckout = async ({
  receiptId,
  payerId,
  payerName,
  payerEmail = 'user@scrapsetu.demo',
  payerPhone = '9999999999',
  payerRole = 'collector',
  amount,
  description = 'ScrapSetu Payment',
  logoUrl = '',
  onVerifying = () => {},
}) => {
  // 1. Load checkout script
  await loadRazorpayScript();

  // 2. Create order on backend → get order_id + key_id
  let orderData;
  try {
    orderData = await createRazorpayOrder({
      receiptId, payerId, payerName, payerEmail, payerPhone, payerRole, amount, description,
    });
  } catch (err) {
    throw new Error(`Failed to create payment order: ${err.message}`);
  }

  // 3. Open Razorpay checkout popup
  return new Promise((resolve, reject) => {
    const options = {
      key:         orderData.razorpay_key_id,        // Public key from backend
      amount:      orderData.amount_paise,            // Paise
      currency:    'INR',
      name:        'ScrapSetu',
      description,
      order_id:    orderData.razorpay_order_id,
      image:       logoUrl || 'https://i.imgur.com/n5tjHFD.png',
      prefill: {
        name:  payerName,
        email: payerEmail,
        contact: payerPhone,
      },
      notes: {
        receipt_id:  receiptId,
        payer_role:  payerRole,
      },
      theme: {
        color: '#0f172a',   // ScrapSetu brand dark
      },
      modal: {
        ondismiss: () => {
          resolve({ verified: false, cancelled: true, message: 'Payment cancelled by user' });
        },
      },
      handler: async (response) => {
        // 4. Payment succeeded on Razorpay side → verify with backend
        try {
          onVerifying();
          const verifyResult = await verifyRazorpayPayment({
            receiptId,
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            payerId,
          });

          resolve({
            verified:          verifyResult.payment_status === 'verified',
            paymentId:         response.razorpay_payment_id,
            orderId:           response.razorpay_order_id,
            signature:         response.razorpay_signature,
            amount:            orderData.amount_inr,
            verifiedAt:        verifyResult.verified_at,
            message:           verifyResult.message || 'Payment verified',
          });
        } catch (verifyErr) {
          reject(new Error(`Payment verification failed: ${verifyErr.message}`));
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      resolve({
        verified: false,
        failed: true,
        errorCode:    response.error?.code,
        errorReason:  response.error?.reason,
        errorDesc:    response.error?.description,
        message:      response.error?.description || 'Payment failed',
      });
    });
    rzp.open();
  });
};

// ─── Check backend health / Razorpay config ───────────────────────────────────

export const checkRazorpayConfig = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { configured: false, backendUp: false };
    const data = await res.json();
    return {
      backendUp:   true,
      configured:  data.razorpay_configured === true,
      mode:        data.razorpay_mode || 'unknown',
    };
  } catch {
    return { configured: false, backendUp: false };
  }
};
