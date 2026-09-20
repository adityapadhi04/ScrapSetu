"""
ScrapSetu — Cashfree Payment Gateway Service (Backend)

Handles all communication with Cashfree Sandbox API:
  - Creating payment orders
  - Verifying payment status
  - Validating incoming webhook signatures

SECURITY: CASHFREE_CLIENT_SECRET is ONLY used here in the backend.
It is NEVER sent to or accessible from the React frontend.

Cashfree Sandbox API Reference:
  https://docs.cashfree.com/docs/payment-gateway
  https://sandbox.cashfree.com/pg
"""

import hashlib
import hmac
import json
import os
import base64
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

CASHFREE_CLIENT_ID = os.getenv("CASHFREE_CLIENT_ID", "")
CASHFREE_CLIENT_SECRET = os.getenv("CASHFREE_CLIENT_SECRET", "")
CASHFREE_ENVIRONMENT = os.getenv("CASHFREE_ENVIRONMENT", "sandbox")
CASHFREE_BASE_URL = os.getenv("CASHFREE_BASE_URL", "https://sandbox.cashfree.com/pg")
CASHFREE_WEBHOOK_SECRET = os.getenv("CASHFREE_WEBHOOK_SECRET", CASHFREE_CLIENT_SECRET)

# Cashfree API version header
CF_API_VERSION = "2023-08-01"

_CF_HEADERS = {
    "Content-Type": "application/json",
    "x-client-id": CASHFREE_CLIENT_ID,
    "x-client-secret": CASHFREE_CLIENT_SECRET,
    "x-api-version": CF_API_VERSION,
}


def _get_headers() -> dict:
    """Return headers for Cashfree API requests."""
    return {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_CLIENT_ID,
        "x-client-secret": CASHFREE_CLIENT_SECRET,
        "x-api-version": CF_API_VERSION,
    }


async def create_cashfree_order(
    *,
    order_id: str,
    amount: float,
    currency: str = "INR",
    customer_id: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    order_note: str = "",
    return_url: str = "http://localhost:5173/collector/lots",
) -> dict:
    """
    Create a payment order in Cashfree Sandbox.

    Returns Cashfree order object containing:
      - order_id
      - payment_session_id   (needed by the JS SDK on frontend)
      - order_status

    SECURITY: amount is ALWAYS determined by backend from trusted offer data.
    The frontend never passes an amount that we trust.
    """
    payload = {
        "order_id": order_id,
        "order_amount": round(float(amount), 2),
        "order_currency": currency,
        "customer_details": {
            "customer_id": customer_id,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": customer_phone,
        },
        "order_meta": {
            "return_url": f"{return_url}?order_id={{order_id}}&transaction_id={{order_id}}",
            "notify_url": "http://localhost:8000/api/payments/webhook",
        },
        "order_note": order_note[:200] if order_note else "",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{CASHFREE_BASE_URL}/orders",
            headers=_get_headers(),
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def get_cashfree_order(order_id: str) -> dict:
    """
    Fetch order details from Cashfree.
    Used to verify payment status server-side.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{CASHFREE_BASE_URL}/orders/{order_id}",
            headers=_get_headers(),
        )
        response.raise_for_status()
        return response.json()


async def get_cashfree_order_payments(order_id: str) -> list:
    """
    Fetch all payment attempts for a Cashfree order.
    Returns a list of payment objects.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{CASHFREE_BASE_URL}/orders/{order_id}/payments",
            headers=_get_headers(),
        )
        response.raise_for_status()
        data = response.json()
        # API returns list or dict with data key
        if isinstance(data, list):
            return data
        return data.get("data", [])


def verify_webhook_signature(raw_body: bytes, received_signature: str, timestamp: str) -> bool:
    """
    Validate a Cashfree webhook signature using HMAC-SHA256.

    Cashfree constructs the signed payload as:
        timestamp + raw_request_body

    Then computes:
        HMAC-SHA256(secret, signed_payload) → base64-encoded

    Reference: https://docs.cashfree.com/docs/webhook#webhook-authentication
    """
    if not CASHFREE_WEBHOOK_SECRET:
        # If no secret configured, reject all webhooks in production.
        # In sandbox-only demo, log and accept (but warn).
        import logging
        logging.warning("[ScrapSetu] CASHFREE_WEBHOOK_SECRET not configured — webhook not verified.")
        return False

    signed_payload = timestamp.encode("utf-8") + raw_body
    computed = hmac.new(
        CASHFREE_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).digest()
    computed_b64 = base64.b64encode(computed).decode("utf-8")
    return hmac.compare_digest(computed_b64, received_signature)


def map_cashfree_status_to_scrapsetu(cf_order_status: str, cf_payment_status: Optional[str] = None) -> str:
    """
    Map Cashfree order/payment status to ScrapSetu internal payment status.

    Cashfree order statuses: ACTIVE, PAID, EXPIRED, TERMINATED
    Cashfree payment statuses: SUCCESS, FAILED, PENDING, USER_DROPPED, CANCELLED

    ScrapSetu statuses: CREATED, PENDING, VERIFIED, FAILED, CANCELLED
    """
    if cf_payment_status:
        mapping = {
            "SUCCESS": "verified",
            "FAILED": "failed",
            "PENDING": "pending",
            "USER_DROPPED": "cancelled",
            "CANCELLED": "cancelled",
        }
        return mapping.get(cf_payment_status.upper(), "pending")

    # Fall back to order-level status
    order_mapping = {
        "PAID": "verified",
        "ACTIVE": "pending",
        "EXPIRED": "failed",
        "TERMINATED": "cancelled",
    }
    return order_mapping.get(cf_order_status.upper(), "pending")
