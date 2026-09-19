/**
 * ScrapSetu — Payment Seed Data (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Representative demo payment records for traceability illustration.
 * All records carry sourceType: "demo_seed" and version: "1.0".
 *
 * PROTOTYPE DISCLAIMER:
 * These are DEMO PAYMENT RECORDS only — not real payment processing.
 * No UPI API, Razorpay, Stripe, bank API, or real settlement is connected.
 * Payment method is recorded for traceability only.
 */

export const SEED_PAYMENTS = [
  {
    paymentId: 'PAY-0001',
    transactionId: 'TXN-0001',

    collectorId: 'usr-collector-01',
    buyerId: 'REC-0001',
    buyerRole: 'recycler',

    amount: 780,
    currency: 'INR',

    paymentMethod: 'Cash',

    paymentStatus: 'recorded',

    referenceNote: 'Paid in cash at facility gate during delivery.',

    paidAt: '2026-09-19T15:00:00.000Z',

    recordedBy: 'usr-collector-01',

    sourceType: 'demo_seed',

    createdAt: '2026-09-19T15:00:00.000Z',
    updatedAt: '2026-09-19T15:00:00.000Z',

    version: '1.0'
  }
];
