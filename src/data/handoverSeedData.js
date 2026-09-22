/**
 * ScrapSetu — Handover Seed Data (Module 9: Transaction + Digital Handover + Payment Record)
 *
 * Representative demo handover records linked to seed transactions.
 * All records carry sourceType: "demo_seed" and version: "1.0".
 *
 * PROTOTYPE DISCLAIMER:
 * These handover records are demo data for traceability illustration.
 * No real GPS, logistics, or carrier tracking is involved.
 */

export const SEED_HANDOVERS = [
  {
    handoverId: 'HAND-0001',
    transactionId: 'TXN-0001',
    lotId: 'LOT-0001',

    collectorId: 'usr-collector-01',
    buyerId: 'REC-0001',
    buyerRole: 'recycler',

    materialCategory: 'PCB',
    weight: 2.4,
    weightUnit: 'kg',

    handoverMethod: 'collector_delivers',

    pickupLocation: {
      area: 'Gunupur',
      city: 'Rayagada',
      state: 'Odisha'
    },
    handoverLocation: {
      area: 'MIDC Industrial Estate',
      city: 'Rayagada',
      state: 'Odisha'
    },

    collectorConfirmed: true,
    buyerConfirmed: true,

    handoverStatus: 'confirmed',

    handoverDate: '2026-09-19T14:30:00.000Z',

    notes: 'Collector delivered lot to recycler facility in person.',

    createdAt: '2026-09-19T12:00:00.000Z',
    updatedAt: '2026-09-19T14:30:00.000Z',

    version: '1.0',
    sourceType: 'demo_seed'
  },
  {
    handoverId: 'HAND-0002',
    transactionId: 'TXN-0002',
    lotId: 'LOT-0002',

    collectorId: 'usr-collector-01',
    buyerId: 'REC-0002',
    buyerRole: 'recycler',

    materialCategory: 'Cable',
    weight: 5.0,
    weightUnit: 'kg',

    handoverMethod: 'buyer_pickup',

    pickupLocation: {
      area: 'Gunupur',
      city: 'Rayagada',
      state: 'Odisha'
    },
    handoverLocation: {
      area: 'Gunupur',
      city: 'Rayagada',
      state: 'Odisha'
    },

    collectorConfirmed: false,
    buyerConfirmed: false,

    handoverStatus: 'pending',

    handoverDate: null,

    notes: 'Buyer will pick up from collector location.',

    createdAt: '2026-09-19T16:00:00.000Z',
    updatedAt: '2026-09-19T16:00:00.000Z',

    version: '1.0',
    sourceType: 'demo_seed'
  },
  {
    handoverId: 'HAND-0003',
    transactionId: 'TXN-0003',
    lotId: 'LOT-0001',

    collectorId: 'usr-collector-02',
    buyerId: 'usr-repair-01',
    buyerRole: 'repair',

    materialCategory: 'PCB',
    weight: 2.4,
    weightUnit: 'kg',

    handoverMethod: 'collector_delivers',

    pickupLocation: {
      area: 'Dharavi Sector 3',
      city: 'Mumbai',
      state: 'Maharashtra'
    },
    handoverLocation: {
      area: 'Lamington Road',
      city: 'Mumbai',
      state: 'Maharashtra'
    },

    collectorConfirmed: true,
    buyerConfirmed: true,

    handoverStatus: 'confirmed',

    handoverDate: '2026-09-20T10:00:00.000Z',

    notes: 'Collector delivered PCB scrap directly to repair shop. Handover verified.',

    createdAt: '2026-09-20T09:30:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',

    version: '1.0',
    sourceType: 'demo_seed'
  }
];
