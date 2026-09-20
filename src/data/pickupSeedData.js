/**
 * ScrapSetu — Pickup Seed Data (Module 14: Pickup Scheduling & Collection Coordination)
 *
 * Seed coordination records linked to existing demo transactions.
 * Methods: 'buyer_pickup' | 'collector_dropoff'
 * Statuses: 'requested' | 'scheduled' | 'completed' | 'cancelled'
 *
 * PROTOTYPE DISCLAIMER:
 * No real GPS or live carrier tracking is implemented.
 * Locations are simple descriptive text only.
 */

export const SEED_PICKUPS = [
  {
    pickupId: 'PKP-0001',
    transactionId: 'TXN-0001',
    lotId: 'LOT-0001',
    collectorId: 'usr-collector-01',
    buyerId: 'REC-0001',
    buyerRole: 'recycler',
    method: 'collector_dropoff',
    scheduledDate: '2026-09-19',
    scheduledTime: '14:00',
    location: 'GreenCycle Facility Gate 1, Industrial Area, Rayagada',
    notes: 'Delivered in three sealed crates with safety labeling.',
    status: 'completed',
    sourceType: 'demo_seed',
    createdAt: '2026-09-19T12:30:00.000Z',
    updatedAt: '2026-09-19T14:30:00.000Z'
  },
  {
    pickupId: 'PKP-0002',
    transactionId: 'TXN-0002',
    lotId: 'LOT-0002',
    collectorId: 'usr-collector-01',
    buyerId: 'REC-0002',
    buyerRole: 'recycler',
    method: 'buyer_pickup',
    scheduledDate: '2026-09-21',
    scheduledTime: '11:00',
    location: 'Gunupur Main Road Collection Hub, Rayagada',
    notes: 'Heavy cable bundle. Buyer vehicle pickup arranged.',
    status: 'scheduled',
    sourceType: 'demo_seed',
    createdAt: '2026-09-19T16:30:00.000Z',
    updatedAt: '2026-09-19T17:00:00.000Z'
  }
];

export default SEED_PICKUPS;
