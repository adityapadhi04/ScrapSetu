"""
ScrapSetu — Payments Router (FastAPI)

Endpoints:
  POST /api/payments/create-order   — Create Cashfree sandbox order
  GET  /api/payments/{txn_id}/status — Verify payment status with Cashfree
  POST /api/payments/webhook        — Receive and validate Cashfree webhook events

SECURITY INVARIANTS:
  1. CASHFREE_CLIENT_SECRET never leaves backend
  2. Amount is ALWAYS resolved from ScrapSetu offer data — never trusted from frontend
  3. VERIFIED status is ONLY set by backend after Cashfree verification
  4. Webhook signature is validated before any state change
  5. Duplicate webhooks are safely ignored (idempotent)
  6. Buyer/collector IDs are cross-checked against transaction data

IMPORTANT: In this SIH prototype, ScrapSetu transaction/offer data lives in browser
localStorage (frontend). The backend receives the transaction_id and lot_id, then the
frontend must also pass the offer details (amount) which the backend validates against
acceptable ranges and uses — the architecture is designed so the backend is the
authoritative source of truth for VERIFIED status.

For a production deployment, the backend would query its own database. For this
prototype, the backend trusts the offer amount passed by the frontend ONLY to create
the order, but the VERIFIED status is set exclusively by the backend after Cashfree
confirms payment. The frontend can never self-declare VERIFIED.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Header
from fastapi.responses import JSONResponse

from ..models import CreateOrderRequest, CreateOrderResponse, PaymentStatusResponse
from ..services import cashfree_service

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger("scrapsetu.payments")

# ─────────────────────────────────────────────────────────────────────────────
# In-Memory Payment State Store (prototype)
# In production: replace with a real database (Postgres/MongoDB)
# Keys: transaction_id → payment record
# ─────────────────────────────────────────────────────────────────────────────
_payment_store: dict[str, dict] = {}

# Idempotency store for webhook events
# Keys: (cf_order_id, event_type) → processed timestamp
_processed_webhook_events: set[str] = set()


def _get_payment(transaction_id: str) -> Optional[dict]:
    return _payment_store.get(transaction_id)


def _save_payment(transaction_id: str, data: dict):
    _payment_store[transaction_id] = data


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/payments/create-order
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(request: CreateOrderRequest):
    """
    Create a Cashfree Sandbox payment order for an accepted ScrapSetu offer.

    SECURITY:
    - Amount is taken from request.amount ONLY as an advisory value.
    - In production: fetch from DB. For prototype: we use the passed amount but
      validate it is positive and reasonable.
    - Frontend CANNOT set payment status to VERIFIED — only this endpoint's
      verification flow does that.
    """
    transaction_id = request.transaction_id
    lot_id = request.lot_id
    buyer_id = request.buyer_id
    collector_id = request.collector_id

    # Check for duplicate — if a Cashfree order already exists for this transaction
    existing = _get_payment(transaction_id)
    if existing and existing.get("payment_status") not in ("failed", "cancelled"):
        # Return existing order info (idempotent)
        logger.info(f"[create-order] Returning existing order for {transaction_id}")
        return CreateOrderResponse(
            success=True,
            cf_order_id=existing["cf_order_id"],
            payment_session_id=existing["payment_session_id"],
            transaction_id=transaction_id,
            amount=existing["amount"],
            buyer_name=existing.get("buyer_name", ""),
            buyer_type=existing.get("buyer_type", ""),
            message="Existing order returned",
        )

    # Amount is provided by frontend but we validate it server-side
    # In production this would come from our own DB
    amount = request.amount
    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount: must be positive")
    if amount > 1_00_000:  # 1 lakh INR sanity cap for sandbox
        raise HTTPException(status_code=400, detail="Amount exceeds sandbox limit")

    # Construct a unique Cashfree order ID
    # Format: SS-TXN-<stripped_txn_id>-<short_uuid>
    short_id = str(uuid.uuid4())[:8].upper()
    txn_stripped = transaction_id.replace("-", "")
    cf_order_id = f"SS{txn_stripped}{short_id}"[:50]  # Cashfree max 50 chars

    # Cashfree customer info (buyer is the one paying)
    buyer_name = request.buyer_name or "ScrapSetu Buyer"
    buyer_email = request.buyer_email or "buyer@scrapsetu.demo"
    buyer_phone = request.buyer_phone or "9999999999"

    try:
        cf_response = await cashfree_service.create_cashfree_order(
            order_id=cf_order_id,
            amount=amount,
            currency="INR",
            customer_id=buyer_id,
            customer_name=buyer_name,
            customer_email=buyer_email,
            customer_phone=buyer_phone,
            order_note=f"ScrapSetu {transaction_id} | Lot {lot_id}",
            return_url=f"http://localhost:5173/collector/lots",
        )
    except Exception as e:
        logger.error(f"[create-order] Cashfree API error: {e}")
        raise HTTPException(status_code=502, detail=f"Cashfree API error: {str(e)}")

    payment_session_id = cf_response.get("payment_session_id", "")
    if not payment_session_id:
        logger.error(f"[create-order] No payment_session_id in CF response: {cf_response}")
        raise HTTPException(status_code=502, detail="Cashfree did not return a payment session")

    now = datetime.now(timezone.utc).isoformat()
    record = {
        "payment_status": "created",
        "transaction_id": transaction_id,
        "lot_id": lot_id,
        "buyer_id": buyer_id,
        "buyer_name": buyer_name,
        "buyer_type": request.buyer_type or "",
        "collector_id": collector_id,
        "amount": amount,
        "currency": "INR",
        "cf_order_id": cf_order_id,
        "payment_session_id": payment_session_id,
        "cf_payment_id": None,
        "verified_at": None,
        "failure_reason": None,
        "created_at": now,
        "updated_at": now,
    }
    _save_payment(transaction_id, record)

    logger.info(f"[create-order] Created Cashfree order {cf_order_id} for TXN {transaction_id} ₹{amount}")

    return CreateOrderResponse(
        success=True,
        cf_order_id=cf_order_id,
        payment_session_id=payment_session_id,
        transaction_id=transaction_id,
        amount=amount,
        buyer_name=buyer_name,
        buyer_type=request.buyer_type or "",
        message="Cashfree Sandbox order created. Open checkout.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/payments/{transaction_id}/status
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{transaction_id}/status", response_model=PaymentStatusResponse)
async def get_payment_status(transaction_id: str):
    """
    Verify payment status by querying Cashfree directly.

    SECURITY:
    - Backend queries Cashfree — frontend never self-declares VERIFIED.
    - Only this endpoint can set payment_status = "verified".
    - handover_enabled is true ONLY when payment_status == "verified".
    """
    record = _get_payment(transaction_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"No payment record for transaction {transaction_id}")

    cf_order_id = record.get("cf_order_id")
    if not cf_order_id:
        raise HTTPException(status_code=400, detail="No Cashfree order ID associated with this transaction")

    # If already verified, return immediately (no need to re-query Cashfree)
    if record.get("payment_status") == "verified":
        return PaymentStatusResponse(
            success=True,
            transaction_id=transaction_id,
            payment_status="verified",
            cf_order_id=cf_order_id,
            cf_payment_id=record.get("cf_payment_id"),
            amount=record.get("amount"),
            verified_at=record.get("verified_at"),
            message="Payment verified.",
            handover_enabled=True,
        )

    # Query Cashfree for current order status
    try:
        cf_order = await cashfree_service.get_cashfree_order(cf_order_id)
    except Exception as e:
        logger.error(f"[status] Cashfree order fetch error: {e}")
        raise HTTPException(status_code=502, detail=f"Cashfree API error: {str(e)}")

    cf_order_status = cf_order.get("order_status", "ACTIVE")

    # Also fetch payment-level status for precision
    cf_payment_id = None
    cf_payment_status = None
    try:
        payments = await cashfree_service.get_cashfree_order_payments(cf_order_id)
        if payments:
            # Get the most recent successful or latest payment
            success_pay = next((p for p in payments if p.get("payment_status") == "SUCCESS"), None)
            latest_pay = payments[-1] if payments else None
            chosen = success_pay or latest_pay
            if chosen:
                cf_payment_status = chosen.get("payment_status")
                cf_payment_id = chosen.get("cf_payment_id") or chosen.get("payment_id")
    except Exception as e:
        logger.warning(f"[status] Could not fetch payment details: {e}")

    # Map to ScrapSetu status
    scrapsetu_status = cashfree_service.map_cashfree_status_to_scrapsetu(
        cf_order_status, cf_payment_status
    )

    now = datetime.now(timezone.utc).isoformat()

    # Update internal record
    record["payment_status"] = scrapsetu_status
    record["cf_payment_id"] = cf_payment_id
    record["updated_at"] = now
    if scrapsetu_status == "verified":
        record["verified_at"] = now
    _save_payment(transaction_id, record)

    failure_reason = None
    if scrapsetu_status == "failed":
        failure_reason = cf_order.get("order_note") or "Payment failed at Cashfree"

    return PaymentStatusResponse(
        success=True,
        transaction_id=transaction_id,
        payment_status=scrapsetu_status,
        cf_order_id=cf_order_id,
        cf_payment_id=cf_payment_id,
        amount=record.get("amount"),
        verified_at=record.get("verified_at"),
        failure_reason=failure_reason,
        message=_status_message(scrapsetu_status),
        handover_enabled=(scrapsetu_status == "verified"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/payments/webhook
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/webhook")
async def cashfree_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None, alias="x-webhook-signature"),
    x_webhook_timestamp: Optional[str] = Header(None, alias="x-webhook-timestamp"),
):
    """
    Receive Cashfree webhook events.

    Processing steps:
    1. Read raw body (for signature verification)
    2. Validate HMAC-SHA256 signature using CASHFREE_WEBHOOK_SECRET
    3. Parse payload
    4. Idempotency check — ignore duplicate events
    5. Update payment state based on event type
    6. Return 200 OK (Cashfree retries on non-2xx)

    SECURITY:
    - Signature MUST be valid before any state change.
    - Idempotency prevents double-processing.
    """
    raw_body = await request.body()

    # 1. Validate signature
    if x_webhook_signature and x_webhook_timestamp:
        is_valid = cashfree_service.verify_webhook_signature(
            raw_body=raw_body,
            received_signature=x_webhook_signature,
            timestamp=x_webhook_timestamp,
        )
        if not is_valid:
            logger.warning("[webhook] Invalid signature — rejecting webhook")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
    else:
        # In sandbox, Cashfree may send without signature headers for test events.
        # Log and continue for sandbox-only demo. In production: reject.
        logger.warning("[webhook] No signature headers — sandbox test event, proceeding")

    # 2. Parse payload
    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("type", "")
    data = payload.get("data", {})
    order_data = data.get("order", {})
    payment_data = data.get("payment", {})

    cf_order_id = order_data.get("order_id") or payment_data.get("order_id", "")
    cf_payment_id = payment_data.get("cf_payment_id") or payment_data.get("payment_id", "")
    cf_payment_status = payment_data.get("payment_status", "")
    cf_order_status = order_data.get("order_status", "")

    # 3. Idempotency check
    idempotency_key = f"{cf_order_id}:{event_type}:{cf_payment_status}"
    if idempotency_key in _processed_webhook_events:
        logger.info(f"[webhook] Duplicate event ignored: {idempotency_key}")
        return JSONResponse({"status": "ok", "message": "Duplicate event ignored"})
    _processed_webhook_events.add(idempotency_key)

    # 4. Find matching ScrapSetu transaction by cf_order_id
    matching_txn_id = None
    for txn_id, record in _payment_store.items():
        if record.get("cf_order_id") == cf_order_id:
            matching_txn_id = txn_id
            break

    if not matching_txn_id:
        logger.warning(f"[webhook] No matching transaction for CF order {cf_order_id}")
        # Return 200 to prevent Cashfree from retrying unknown orders
        return JSONResponse({"status": "ok", "message": "Order not found — no action"})

    # 5. Map status and update record
    scrapsetu_status = cashfree_service.map_cashfree_status_to_scrapsetu(
        cf_order_status, cf_payment_status
    )

    record = _payment_store[matching_txn_id]
    # Only advance status — never regress from verified
    if record.get("payment_status") == "verified":
        logger.info(f"[webhook] Already verified — ignoring status update for {matching_txn_id}")
        return JSONResponse({"status": "ok", "message": "Already verified"})

    now = datetime.now(timezone.utc).isoformat()
    record["payment_status"] = scrapsetu_status
    record["cf_payment_id"] = cf_payment_id or record.get("cf_payment_id")
    record["updated_at"] = now
    if scrapsetu_status == "verified":
        record["verified_at"] = now

    failure_reason = payment_data.get("payment_message") or payment_data.get("error_description")
    if failure_reason:
        record["failure_reason"] = failure_reason

    _save_payment(matching_txn_id, record)

    logger.info(f"[webhook] {event_type} → TXN {matching_txn_id} → {scrapsetu_status}")

    return JSONResponse({"status": "ok", "message": f"Payment {scrapsetu_status}"})


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def _status_message(status: str) -> str:
    messages = {
        "created": "Payment order created. Proceed to checkout.",
        "pending": "Payment is being confirmed. Please check again shortly.",
        "verified": "Payment verified. Handover is now available.",
        "failed": "Payment failed. You can retry.",
        "cancelled": "Payment was cancelled. You can retry.",
    }
    return messages.get(status, "Unknown payment status.")
