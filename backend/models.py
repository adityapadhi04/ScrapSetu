"""
ScrapSetu — Backend Pydantic Models

Defines request/response schemas for the payment API.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
# Request Models
# ─────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    """
    Frontend sends transaction/lot identifiers plus offer amount.
    Backend validates and creates the Cashfree order.

    SECURITY: amount is taken from the accepted offer as reported by the
    frontend (from localStorage), then validated server-side.
    The backend is the only entity that can later mark it VERIFIED.
    Frontend CANNOT self-declare a payment as verified.
    """
    transaction_id: str = Field(..., description="ScrapSetu transaction ID (TXN-xxxx)")
    lot_id: str = Field(..., description="ScrapSetu scrap lot ID")
    buyer_id: str = Field(..., description="Buyer ID (repair shop or recycler)")
    buyer_name: str = Field(..., description="Buyer display name")
    buyer_type: str = Field(..., description="'repair' or 'recycler'")
    buyer_email: str = Field(default="buyer@scrapsetu.demo", description="Buyer email for Cashfree")
    buyer_phone: str = Field(default="9999999999", description="Buyer phone for Cashfree")
    collector_id: str = Field(..., description="Collector user ID")
    amount: float = Field(..., gt=0, description="Total offer amount in INR (from accepted offer)")
    currency: str = Field(default="INR")


# ─────────────────────────────────────────────
# Response Models
# ─────────────────────────────────────────────

class CreateOrderResponse(BaseModel):
    """Returned to frontend after creating Cashfree order."""
    success: bool
    cf_order_id: str                  # Cashfree order ID
    payment_session_id: str           # Used by Cashfree JS SDK to open checkout
    transaction_id: str               # ScrapSetu TXN-xxxx
    amount: float                     # Actual amount used (from trusted offer data)
    currency: str = "INR"
    buyer_name: str
    buyer_type: str                   # "repair" or "recycler"
    message: str = ""


class PaymentStatusResponse(BaseModel):
    """Returned to frontend when checking payment status."""
    success: bool
    transaction_id: str
    payment_status: str               # one of: created, pending, verified, failed, cancelled
    cf_order_id: Optional[str] = None
    cf_payment_id: Optional[str] = None
    amount: Optional[float] = None
    verified_at: Optional[str] = None
    failure_reason: Optional[str] = None
    message: str = ""
    handover_enabled: bool = False    # True ONLY if payment_status == "verified"


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
