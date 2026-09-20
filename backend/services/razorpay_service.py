"""
ScrapSetu — Razorpay Service (Backend)

Creates Razorpay orders and verifies payment signatures.

SECURITY INVARIANTS:
  - RAZORPAY_KEY_SECRET never leaves this file / backend
  - Amount is always trusted from the ScrapSetu transaction data
  - VERIFIED status is ONLY set after HMAC-SHA256 signature check passes
  - razorpay_payment_id + razorpay_order_id + razorpay_signature are all required
"""

import hashlib
import hmac
import logging
import os
from typing import Optional

from dotenv import load_dotenv
import razorpay

logger = logging.getLogger("scrapsetu.razorpay")

# ─── Load Environment ────────────────────────────────────────────────────────
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(_env_path):
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


def get_key_id() -> str:
    """Return the public Key ID (safe to send to frontend)."""
    return os.getenv("RAZORPAY_KEY_ID", "")


def get_key_secret() -> str:
    return os.getenv("RAZORPAY_KEY_SECRET", "")


def is_configured() -> bool:
    return bool(get_key_id() and get_key_secret())


def _get_client() -> razorpay.Client:
    key_id = get_key_id()
    key_secret = get_key_secret()
    if not key_id or not key_secret:
        raise RuntimeError(
            "Razorpay credentials not configured. "
            "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
        )
    return razorpay.Client(auth=(key_id, key_secret))


# ─── Order Creation ───────────────────────────────────────────────────────────

def create_razorpay_order(
    amount_inr: float,
    receipt: str,
    notes: Optional[dict] = None,
) -> dict:
    """
    Create a Razorpay order.

    Args:
        amount_inr: Amount in INR (will be converted to paise internally)
        receipt:    Unique receipt string (ScrapSetu TXN-xxxx or BKG-xxxx)
        notes:      Optional metadata dict

    Returns:
        Razorpay order dict with `id`, `amount`, `currency`, `receipt`, etc.
    """
    client = _get_client()
    amount_paise = int(round(amount_inr * 100))  # Razorpay uses paise (1 INR = 100 paise)

    payload = {
        "amount":   amount_paise,
        "currency": "INR",
        "receipt":  receipt[:40],  # max 40 chars
        "notes":    notes or {},
    }

    logger.info(f"[Razorpay] Creating order — receipt={receipt} amount=₹{amount_inr}")
    order = client.order.create(data=payload)
    logger.info(f"[Razorpay] Order created — id={order['id']}")
    return order


# ─── Signature Verification ───────────────────────────────────────────────────

def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verify that the payment came from Razorpay and was not tampered with.

    Razorpay signature = HMAC-SHA256(
        key   = RAZORPAY_KEY_SECRET,
        msg   = razorpay_order_id + "|" + razorpay_payment_id
    )

    Returns True if signature is valid.
    """
    key_secret = get_key_secret()
    if not key_secret:
        raise RuntimeError("RAZORPAY_KEY_SECRET not set — cannot verify signature")

    msg = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        key_secret.encode("utf-8"),
        msg.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    valid = hmac.compare_digest(expected, razorpay_signature)
    if valid:
        logger.info(f"[Razorpay] Signature VALID for order={razorpay_order_id} payment={razorpay_payment_id}")
    else:
        logger.warning(f"[Razorpay] Signature INVALID for order={razorpay_order_id}")
    return valid


# ─── Fetch Payment Details ────────────────────────────────────────────────────

def fetch_payment(razorpay_payment_id: str) -> dict:
    """Fetch payment details from Razorpay API."""
    client = _get_client()
    return client.payment.fetch(razorpay_payment_id)
