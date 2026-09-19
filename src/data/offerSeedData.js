/**
 * ScrapSetu — Offer Seed Data (Module 8: Offer & Matching Engine)
 * Realistic baseline offers for local scrap lots from registered Repair Shops
 * and Authorized Recyclers.
 *
 * All seed records carry sourceType: "demo_seed" and datasetVersion: "1.0".
 */

export const SEED_OFFERS = [
  {
    offerId: 'OFR-0001',
    lotId: 'LOT-0001',
    buyerId: 'SHOP-0001',
    buyerRole: 'repair',
    buyerName: 'Maa Tarini Electronics & Mobile Care',
    materialCategory: 'PCB',
    weight: 2.4,
    weightUnit: 'kg',
    offeredPrice: 340,
    priceUnit: 'kg',
    totalOfferValue: 816,
    currency: 'INR',
    message: 'Can salvage power ICs and charging board components for local repairs in Gunupur.',
    status: 'submitted',
    sourceType: 'demo_seed',
    createdAt: '2026-09-18T14:30:00.000Z',
    updatedAt: '2026-09-18T14:30:00.000Z',
    datasetVersion: '1.0'
  },
  {
    offerId: 'OFR-0002',
    lotId: 'LOT-0001',
    buyerId: 'REC-0001',
    buyerRole: 'recycler',
    buyerName: 'GreenCycle Material Recovery Ltd.',
    materialCategory: 'PCB',
    weight: 2.4,
    weightUnit: 'kg',
    offeredPrice: 325,
    priceUnit: 'kg',
    totalOfferValue: 780,
    currency: 'INR',
    message: 'Authorized industrial smelting and precious metal recovery at Rayagada facility.',
    status: 'submitted',
    sourceType: 'demo_seed',
    createdAt: '2026-09-18T15:45:00.000Z',
    updatedAt: '2026-09-18T15:45:00.000Z',
    datasetVersion: '1.0'
  },
  {
    offerId: 'OFR-0003',
    lotId: 'LOT-0002',
    buyerId: 'REC-0002',
    buyerRole: 'recycler',
    buyerName: 'EcoRecover E-Waste Processors',
    materialCategory: 'Cable',
    weight: 5.0,
    weightUnit: 'kg',
    offeredPrice: 675,
    priceUnit: 'kg',
    totalOfferValue: 3375,
    currency: 'INR',
    message: 'Direct granulator recovery for clean copper wire. Drop-off or bulk pickup available.',
    status: 'submitted',
    sourceType: 'demo_seed',
    createdAt: '2026-09-19T09:15:00.000Z',
    updatedAt: '2026-09-19T09:15:00.000Z',
    datasetVersion: '1.0'
  },
  {
    offerId: 'OFR-0004',
    lotId: 'LOT-0002',
    buyerId: 'REC-0001',
    buyerRole: 'recycler',
    buyerName: 'GreenCycle Material Recovery Ltd.',
    materialCategory: 'Cable',
    weight: 5.0,
    weightUnit: 'kg',
    offeredPrice: 660,
    priceUnit: 'kg',
    totalOfferValue: 3300,
    currency: 'INR',
    message: 'Competitive industrial recycling rate matching national copper recovery index.',
    status: 'submitted',
    sourceType: 'demo_seed',
    createdAt: '2026-09-19T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  }
];
