/**
 * ScrapSetu — Cashfree Payment Service (Frontend)
 *
 * Handles all client-side Cashfree Sandbox integration:
 *   1. Calls backend to create a Cashfree payment order
 *   2. Opens Cashfree JS SDK checkout
 *   3. Calls backend to verify payment status after checkout
 *   4. Updates local paymentService record
 *
 * SECURITY RULES (ALL ENFORCED):
 *   - CASHFREE_CLIENT_SECRET is NEVER in this file
 *   - Amount is NEVER self-declared as verified by frontend
 *   - Offline state is checked before any payment attempt
 *   - Only backend /api/payments/{txn_id}/status can mark a payment VERIFIED
 *
 * Cashfree JS SDK is loaded via CDN in index.html (no npm package needed).
 * The SDK exposes a global `Cashfree` function when loaded.
 */

import { isOffline } from './offlineService.js';
import { updatePaymentWithCashfree } from './paymentService.js';
import { _patchTransactionFields } from './transactionService.js';

// Backend API base (proxied through Vite to http://localhost:8000)
const API_BASE = '/api/payments';

/**
 * Payment status constants — MUST match backend
 */
export const CF_PAYMENT_STATUS = {
  CREATED: 'created',
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// ─────────────────────────────────────────────────────────────────────
// Step 1: Create Cashfree Order via Backend
// ─────────────────────────────────────────────────────────────────────

/**
 * Request the backend to create a Cashfree Sandbox payment order.
 * Amount is derived from the accepted offer on the backend — never trusted
 * directly from the return value; the actual amount comes from the response.
 *
 * @param {object} params
 * @param {string} params.transactionId - ScrapSetu TXN-xxxx
 * @param {string} params.lotId
 * @param {string} params.buyerId
 * @param {string} params.buyerName
 * @param {string} params.buyerType - 'repair' or 'recycler'
 * @param {string} params.collectorId
 * @param {number} params.amount - From accepted offer (backend validates/sanctions this)
 * @returns {Promise<{cfOrderId: string, paymentSessionId: string, amount: number, buyerType: string}>}
 */
export const createCashfreeOrder = async ({
  transactionId,
  lotId,
  buyerId,
  buyerName,
  buyerType,
  collectorId,
  amount,
}) => {
  if (isOffline()) {
    throw new Error('OFFLINE: Payment requires an internet connection. Please connect and try again.');
  }

  if (!transactionId || !lotId || !buyerId || !collectorId) {
    throw new Error('Missing required payment parameters.');
  }

  const response = await fetch(`${API_BASE}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_id: transactionId,
      lot_id: lotId,
      buyer_id: buyerId,
      buyer_name: buyerName || 'Buyer',
      buyer_type: buyerType || '',
      buyer_email: 'buyer@scrapsetu.demo',
      buyer_phone: '9999999999',
      collector_id: collectorId,
      amount: amount, // Backend validates and uses this from the accepted offer
      currency: 'INR',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Backend error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.payment_session_id) {
    throw new Error('Backend did not return a valid payment session.');
  }

  return {
    cfOrderId: data.cf_order_id,
    paymentSessionId: data.payment_session_id,
    amount: data.amount,
    buyerType: data.buyer_type,
  };
};

// ─────────────────────────────────────────────────────────────────────
// Step 2: Open Cashfree JS SDK Checkout
// ─────────────────────────────────────────────────────────────────────

/**
 * Open Cashfree Sandbox JS SDK checkout modal.
 * The SDK is loaded from CDN in index.html.
 *
 * Returns a promise that resolves when checkout completes/closes.
 * DO NOT interpret the checkout callback as payment success —
 * always verify with backend afterward.
 *
 * @param {string} paymentSessionId - From create-order response
 * @returns {Promise<{status: string, orderId: string}>}
 */
export const openCashfreeCheckout = async (paymentSessionId) => {
  if (isOffline()) {
    throw new Error('OFFLINE: Cannot open checkout without internet connection.');
  }

  // Ensure Cashfree SDK is loaded
  if (typeof window.Cashfree !== 'function') {
    throw new Error('Cashfree SDK not loaded. Check index.html for the SDK script tag.');
  }

  return new Promise((resolve) => {
    const cashfree = window.Cashfree({ mode: 'sandbox' });

    const checkoutOptions = {
      paymentSessionId,
      redirectTarget: '_modal', // Open in modal overlay
    };

    cashfree
      .checkout(checkoutOptions)
      .then((result) => {
        // result.error — payment failed/cancelled
        // result.redirect — redirect happened (non-modal mode)
        // result.paymentDetails — contains order id
        const orderId = result?.paymentDetails?.paymentMessage || '';
        if (result?.error) {
          resolve({ status: 'user_action', orderId, raw: result });
        } else {
          resolve({ status: 'checkout_complete', orderId, raw: result });
        }
      })
      .catch((err) => {
        // SDK threw — likely user closed modal
        resolve({ status: 'cancelled', orderId: '', raw: err });
      });
  });
};

// ─────────────────────────────────────────────────────────────────────
// Step 3: Verify Payment Status with Backend
// ─────────────────────────────────────────────────────────────────────

/**
 * Ask backend to verify the payment with Cashfree and return the
 * trusted payment status.
 *
 * CRITICAL: This is the ONLY way to determine if a payment is VERIFIED.
 * Frontend NEVER self-declares VERIFIED.
 *
 * @param {string} transactionId
 * @returns {Promise<{paymentStatus: string, handoverEnabled: boolean, verifiedAt: string|null, failureReason: string|null, message: string}>}
 */
export const verifyPaymentWithBackend = async (transactionId) => {
  if (isOffline()) {
    return {
      paymentStatus: 'pending',
      handoverEnabled: false,
      verifiedAt: null,
      failureReason: null,
      message: 'Cannot verify: offline. Please reconnect and check again.',
    };
  }

  const response = await fetch(`${API_BASE}/${transactionId}/status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Verification error: ${response.status}`);
  }

  const data = await response.json();

  return {
    paymentStatus: data.payment_status,
    handoverEnabled: data.handover_enabled === true,
    verifiedAt: data.verified_at || null,
    failureReason: data.failure_reason || null,
    cfPaymentId: data.cf_payment_id || null,
    cfOrderId: data.cf_order_id || null,
    amount: data.amount || null,
    message: data.message || '',
  };
};

// ─────────────────────────────────────────────────────────────────────
// Step 4: Sync Verified Status to Local State
// ─────────────────────────────────────────────────────────────────────

/**
 * After backend confirms VERIFIED, update the local payment record
 * and transaction record in localStorage.
 *
 * This propagates the backend truth into the existing paymentService
 * and transactionService without replacing them.
 *
 * @param {string} transactionId
 * @param {object} verificationResult - From verifyPaymentWithBackend
 * @param {object} paymentMeta - {paymentId, collectorId, buyerId, buyerRole, amount}
 */
export const syncVerifiedPaymentToLocal = (transactionId, verificationResult, paymentMeta) => {
  const { paymentStatus, verifiedAt, cfPaymentId, cfOrderId } = verificationResult;

  try {
    // Update existing payment record with Cashfree fields + verified status
    updatePaymentWithCashfree({
      paymentId: paymentMeta.paymentId,
      transactionId,
      collectorId: paymentMeta.collectorId,
      buyerId: paymentMeta.buyerId,
      buyerRole: paymentMeta.buyerRole,
      amount: paymentMeta.amount,
      paymentStatus,
      cfOrderId: cfOrderId || '',
      cfPaymentId: cfPaymentId || '',
      verifiedAt: verifiedAt || null,
    });
  } catch (err) {
    // Non-fatal — local sync failure doesn't invalidate backend truth
    console.warn('[cashfreePaymentService] Local payment sync failed:', err.message);
  }

  try {
    // Patch transaction paymentStatus to reflect backend truth
    _patchTransactionFields(transactionId, {
      paymentStatus: paymentStatus === 'verified' ? 'verified' : paymentStatus,
      ...(verifiedAt ? { paymentDate: verifiedAt } : {}),
    });
  } catch (err) {
    console.warn('[cashfreePaymentService] Transaction patch failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────
// Full Integrated Flow (convenience)
// ─────────────────────────────────────────────────────────────────────

/**
 * Complete payment flow:
 *   1. Create order on backend
 *   2. Open Cashfree checkout
 *   3. Verify with backend
 *   4. Sync to local state
 *
 * @param {object} params - { transactionId, lotId, buyerId, buyerName, buyerType, collectorId, amount }
 * @param {function} onStatusChange - Callback with status string during each step
 * @returns {Promise<{paymentStatus, handoverEnabled, message, verificationResult}>}
 */
export const runCashfreePaymentFlow = async (params, onStatusChange = () => {}) => {
  const { transactionId, collectorId, buyerId, buyerRole, amount } = params;

  // Guard: offline
  if (isOffline()) {
    return {
      paymentStatus: 'offline',
      handoverEnabled: false,
      message: 'Payment requires an internet connection.',
      verificationResult: null,
    };
  }

  onStatusChange('creating');

  // Step 1: Create order
  let orderResult;
  try {
    orderResult = await createCashfreeOrder(params);
  } catch (err) {
    onStatusChange('failed');
    throw err;
  }

  onStatusChange('checkout');

  // Step 2: Open checkout
  let checkoutResult;
  try {
    checkoutResult = await openCashfreeCheckout(orderResult.paymentSessionId);
  } catch (err) {
    onStatusChange('cancelled');
    return {
      paymentStatus: 'cancelled',
      handoverEnabled: false,
      message: 'Checkout could not be opened.',
      verificationResult: null,
    };
  }

  // If user cancelled (closed modal), don't auto-fail — let them retry
  if (checkoutResult.status === 'cancelled') {
    onStatusChange('pending');
    return {
      paymentStatus: 'pending',
      handoverEnabled: false,
      message: 'Checkout was closed. Your payment may still be processing.',
      verificationResult: null,
    };
  }

  onStatusChange('verifying');

  // Step 3: Verify with backend (always — never trust checkout callback alone)
  let verificationResult;
  try {
    verificationResult = await verifyPaymentWithBackend(transactionId);
  } catch (err) {
    onStatusChange('pending');
    return {
      paymentStatus: 'pending',
      handoverEnabled: false,
      message: 'Could not verify payment status. Please check again.',
      verificationResult: null,
    };
  }

  // Step 4: Sync to local state
  syncVerifiedPaymentToLocal(transactionId, verificationResult, {
    paymentId: null, // Will be auto-generated
    collectorId,
    buyerId,
    buyerRole,
    amount: orderResult.amount,
  });

  onStatusChange(verificationResult.paymentStatus);

  return {
    paymentStatus: verificationResult.paymentStatus,
    handoverEnabled: verificationResult.handoverEnabled,
    message: verificationResult.message,
    verificationResult,
  };
};
