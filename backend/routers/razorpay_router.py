"""
ScrapSetu — Razorpay Router (FastAPI)

Endpoints:
  POST /api/razorpay/create-order   — Create a Razorpay order, return order_id + key_id
  POST /api/razorpay/verify         — Verify payment signature (HMAC-SHA256)
  GET  /api/razorpay/config         — Return public Key ID to frontend (safe)

SECURITY:
  - RAZORPAY_KEY_SECRET stays exclusively in backend/services/razorpay_service.py
  - Amount is received from frontend but validated (>0, ≤ 500000 INR sanity cap)
  - VERIFIED status is ONLY set after successful HMAC-SHA256 signature check
  - Duplicate verifications for same payment_id are safely idempotent
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..services import razorpay_service

router = APIRouter(prefix="/api/razorpay", tags=["razorpay"])
logger = logging.getLogger("scrapsetu.razorpay_router")

# ─── In-memory store (prototype) — replace with DB in production ──────────────
_rzp_payment_store: dict[str, dict] = {}
_verified_payment_ids: set[str] = set()   # idempotency


# ─── Request / Response Models ────────────────────────────────────────────────

class RzpCreateOrderRequest(BaseModel):
    """
    Sent by frontend when collector/repair-shop initiates payment.
    """
    receipt_id:   str   = Field(..., description="ScrapSetu TXN-xxxx or BKG-xxxx")
    payer_id:     str   = Field(..., description="User ID of the payer")
    payer_name:   str   = Field(..., description="Payer display name")
    payer_email:  str   = Field(default="user@scrapsetu.demo")
    payer_phone:  str   = Field(default="9999999999")
    payer_role:   str   = Field(..., description="'collector' | 'repair' | 'recycler'")
    amount:       float = Field(..., gt=0, le=500000, description="Amount in INR")
    description:  str   = Field(default="ScrapSetu Payment")
    currency:     str   = Field(default="INR")


class RzpCreateOrderResponse(BaseModel):
    success:      bool
    razorpay_order_id: str
    razorpay_key_id:   str     # Public Key ID — safe to send to frontend
    receipt_id:   str
    amount_paise: int
    amount_inr:   float
    currency:     str = "INR"
    payer_name:   str
    payer_email:  str
    payer_phone:  str
    description:  str
    message:      str = ""


class RzpVerifyRequest(BaseModel):
    """
    Frontend sends all three Razorpay-provided values after checkout completes.
    """
    receipt_id:           str = Field(..., description="ScrapSetu TXN-xxxx or BKG-xxxx")
    razorpay_order_id:    str
    razorpay_payment_id:  str
    razorpay_signature:   str
    payer_id:             str


class RzpVerifyResponse(BaseModel):
    success:             bool
    receipt_id:          str
    payment_status:      str     # "verified" | "failed"
    razorpay_order_id:   Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    amount_inr:          Optional[float] = None
    verified_at:         Optional[str] = None
    message:             str = ""


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/config")
async def get_razorpay_config():
    """Return public Razorpay Key ID — safe for frontend to receive."""
    if not razorpay_service.is_configured():
        raise HTTPException(status_code=503, detail="Razorpay not configured on backend")
    return {
        "key_id": razorpay_service.get_key_id(),
        "currency": "INR",
        "configured": True,
    }


@router.post("/create-order", response_model=RzpCreateOrderResponse)
async def create_razorpay_order(req: RzpCreateOrderRequest):
    """
    Create a Razorpay order. Returns order_id + public key_id for frontend checkout.
    Amount is validated server-side (>0, ≤500,000 INR).
    """
    if not razorpay_service.is_configured():
        raise HTTPException(status_code=503, detail="Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env")

    try:
        notes = {
            "receipt_id":  req.receipt_id,
            "payer_id":    req.payer_id,
            "payer_role":  req.payer_role,
            "description": req.description,
        }
        order = razorpay_service.create_razorpay_order(
            amount_inr=req.amount,
            receipt=req.receipt_id,
            notes=notes,
        )

        # Persist locally
        _rzp_payment_store[req.receipt_id] = {
            "receipt_id":          req.receipt_id,
            "razorpay_order_id":   order["id"],
            "payer_id":            req.payer_id,
            "payer_role":          req.payer_role,
            "amount_inr":          req.amount,
            "amount_paise":        order["amount"],
            "currency":            "INR",
            "status":              "created",
            "created_at":          datetime.now(timezone.utc).isoformat(),
            "razorpay_payment_id": None,
            "verified_at":         None,
        }

        return RzpCreateOrderResponse(
            success=True,
            razorpay_order_id=order["id"],
            razorpay_key_id=razorpay_service.get_key_id(),
            receipt_id=req.receipt_id,
            amount_paise=order["amount"],
            amount_inr=req.amount,
            currency="INR",
            payer_name=req.payer_name,
            payer_email=req.payer_email,
            payer_phone=req.payer_phone,
            description=req.description,
            message="Order created successfully",
        )

    except Exception as e:
        logger.error(f"[Razorpay] create-order failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/verify", response_model=RzpVerifyResponse)
async def verify_razorpay_payment(req: RzpVerifyRequest):
    """
    Verify Razorpay payment signature (HMAC-SHA256).
    This is the ONLY way payment_status becomes 'verified'.
    Frontend CANNOT self-declare verification.
    """
    if not razorpay_service.is_configured():
        raise HTTPException(status_code=503, detail="Razorpay not configured")

    # Idempotent: already verified
    if req.razorpay_payment_id in _verified_payment_ids:
        record = _rzp_payment_store.get(req.receipt_id, {})
        return RzpVerifyResponse(
            success=True,
            receipt_id=req.receipt_id,
            payment_status="verified",
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            amount_inr=record.get("amount_inr"),
            verified_at=record.get("verified_at"),
            message="Already verified (idempotent)",
        )

    try:
        is_valid = razorpay_service.verify_payment_signature(
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            razorpay_signature=req.razorpay_signature,
        )
    except Exception as e:
        logger.error(f"[Razorpay] signature verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if not is_valid:
        # Update store with failed status
        if req.receipt_id in _rzp_payment_store:
            _rzp_payment_store[req.receipt_id]["status"] = "failed"
        return RzpVerifyResponse(
            success=False,
            receipt_id=req.receipt_id,
            payment_status="failed",
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            message="Payment signature verification failed — possible tampering",
        )

    # Signature valid → mark as verified
    now = datetime.now(timezone.utc).isoformat()
    _verified_payment_ids.add(req.razorpay_payment_id)

    if req.receipt_id in _rzp_payment_store:
        _rzp_payment_store[req.receipt_id].update({
            "status":              "verified",
            "razorpay_payment_id": req.razorpay_payment_id,
            "verified_at":         now,
        })

    record = _rzp_payment_store.get(req.receipt_id, {})

    return RzpVerifyResponse(
        success=True,
        receipt_id=req.receipt_id,
        payment_status="verified",
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        amount_inr=record.get("amount_inr"),
        verified_at=now,
        message="Payment verified successfully",
    )


@router.get("/status/{receipt_id}")
async def get_payment_status(receipt_id: str):
    """Fetch current payment status for a given receipt_id."""
    record = _rzp_payment_store.get(receipt_id)
    if not record:
        return JSONResponse({"success": False, "status": "not_found", "receipt_id": receipt_id})
    return {
        "success": True,
        "receipt_id": receipt_id,
        "status": record.get("status", "unknown"),
        "razorpay_order_id": record.get("razorpay_order_id"),
        "razorpay_payment_id": record.get("razorpay_payment_id"),
        "amount_inr": record.get("amount_inr"),
        "verified_at": record.get("verified_at"),
    }
