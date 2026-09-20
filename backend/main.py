"""
ScrapSetu — FastAPI Backend Entry Point

Starts the payment verification backend that:
  1. Creates Cashfree Sandbox payment orders
  2. Verifies payment status with Cashfree
  3. Validates and processes Cashfree webhooks

Run with:
  uvicorn backend.main:app --reload --port 8000

Or use start.bat from the project root.
"""

import logging
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import payments as payments_router
from .routers import razorpay_router

# ─────────────────────────────────────────────
# Logging Setup
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger("scrapsetu.backend")

# ─────────────────────────────────────────────
# App Init
# ─────────────────────────────────────────────
app = FastAPI(
    title="ScrapSetu Payment API",
    description="Backend payment gateway integration for ScrapSetu (Cashfree Sandbox)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ─────────────────────────────────────────────
# CORS — Allow Vite dev server
# ─────────────────────────────────────────────
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────
app.include_router(payments_router.router)
app.include_router(razorpay_router.router)

# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────
@app.get("/api/health")
async def health():
    cf_id = os.getenv("CASHFREE_CLIENT_ID", "")
    cf_env = os.getenv("CASHFREE_ENVIRONMENT", "sandbox")
    rzp_key = os.getenv("RAZORPAY_KEY_ID", "")
    return {
        "status": "ok",
        "service": "ScrapSetu Payment API",
        "cashfree_environment": cf_env,
        "cashfree_configured": bool(cf_id and cf_id != "your_cashfree_sandbox_client_id_here"),
        "razorpay_configured": bool(rzp_key and rzp_key.startswith("rzp_")),
        "razorpay_mode": "test" if rzp_key.startswith("rzp_test_") else ("live" if rzp_key.startswith("rzp_live_") else "not_set"),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
