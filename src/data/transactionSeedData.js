/**
 * ScrapSetu — Transaction Seed Data (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Representative demo transaction records linked to existing seed lots and offers.
 * These records do NOT represent real commercial transactions.
 *
 * All records carry sourceType: "demo_seed" and datasetVersion: "1.0".
 *
 * PROTOTYPE DISCLAIMER:
 * This module records transactions for traceability purposes only.
 * No actual payment processing, bank API, or real financial settlement occurs.
 */

export const SEED_TRANSACTIONS = [
  {
    transactionId: 'TXN-0001',
    offerId: 'OFR-0002',
    lotId: 'LOT-0001',

    collectorId: 'usr-collector-01',
    collectorName: 'Demo Collector (Informal)',

    buyerId: 'REC-0001',
    buyerRole: 'recycler',
    buyerName: 'GreenCycle Material Recovery Ltd.',

    materialCategory: 'PCB',
    materialSubcategory: 'Computer PCB',

    weight: 2.4,
    weightUnit: 'kg',

    agreedPrice: 325,
    priceUnit: 'kg',
    totalAmount: 780,

    currency: 'INR',

    transactionStatus: 'completed',

    paymentStatus: 'recorded',
    paymentMethod: 'Cash',

    handoverStatus: 'confirmed',

    handoverDate: '2026-09-19T14:30:00.000Z',
    paymentDate: '2026-09-19T15:00:00.000Z',

    notes: 'Collector delivered lot to recycler facility. Payment received on-site.',

    sourceType: 'demo_seed',
    createdAt: '2026-09-19T12:00:00.000Z',
    updatedAt: '2026-09-19T15:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    transactionId: 'TXN-0002',
    offerId: 'OFR-0003',
    lotId: 'LOT-0002',

    collectorId: 'usr-collector-01',
    collectorName: 'Demo Collector (Informal)',

    buyerId: 'REC-0002',
    buyerRole: 'recycler',
    buyerName: 'EcoRecover E-Waste Processors',

    materialCategory: 'Cable',
    materialSubcategory: 'Copper Cable',

    weight: 5.0,
    weightUnit: 'kg',

    agreedPrice: 675,
    priceUnit: 'kg',
    totalAmount: 3375,

    currency: 'INR',

    transactionStatus: 'handover_pending',

    paymentStatus: 'pending',
    paymentMethod: null,

    handoverStatus: 'pending',

    handoverDate: null,
    paymentDate: null,

    notes: 'Buyer pickup scheduled. Awaiting handover confirmation.',

    sourceType: 'demo_seed',
    createdAt: '2026-09-19T16:00:00.000Z',
    updatedAt: '2026-09-19T16:00:00.000Z',
    datasetVersion: '1.0'
  }
];
