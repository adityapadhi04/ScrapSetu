/**
 * ScrapSetu — Kabadiwala Home Pickup Service (Module 17)
 *
 * Enables Collectors (households/individuals) to book a home scrap pickup
 * from a nearby Kabadiwala (informal scrap dealer / aggregator).
 *
 * Flow:
 *   Collector requests pickup (area + scrap details)
 *     → System shows nearby kabadiwalas
 *     → Collector picks one → Booking created (BKG-XXXX)
 *     → Kabadiwala accepts/rejects
 *     → Kabadiwala visits, sets final price
 *     → Collector confirms → Payment recorded
 *     → Booking completed
 *
 * Statuses:
 *   pending   → accepted | rejected
 *   accepted  → in_progress | cancelled
 *   in_progress → completed | cancelled
 *   completed → (terminal)
 *   rejected  → (terminal)
 *   cancelled → (terminal)
 *
 * No GPS/live maps — demo area-based matching only.
 * Stored in localStorage: `scrapsetu_kabadi_bookings`
 */

const STORAGE_KEY = 'scrapsetu_kabadi_bookings';

// ─── Demo Kabadiwala Agents ───────────────────────────────────────────────────

export const DEMO_KABADIWALAS = [
  {
    kabadiId: 'KBD-001',
    name: 'Ramesh Kumar Scrap',
    ownerName: 'Ramesh Kumar',
    phone: '+91 98765 11001',
    areas: ['Gunupur', 'Rayagada', 'Bisam Cuttack'],
    rating: 4.6,
    totalPickups: 312,
    acceptedMaterials: ['PCB', 'Cable', 'Battery', 'Metal', 'Plastic', 'Mixed E-Waste'],
    minWeightKg: 0.5,
    typicalPricePerKg: { PCB: 90, Cable: 55, Battery: 25, Metal: 30, Plastic: 15, 'Mixed E-Waste': 40 },
    available: true,
    badge: '⭐ Top Rated',
  },
  {
    kabadiId: 'KBD-002',
    name: 'Suresh Mobile Kabadi',
    ownerName: 'Suresh Patel',
    phone: '+91 99881 22002',
    areas: ['Gunupur', 'Chandrapur', 'Padampur'],
    rating: 4.2,
    totalPickups: 187,
    acceptedMaterials: ['Mobile Phones', 'Laptop', 'PCB', 'Cable', 'Mixed E-Waste'],
    minWeightKg: 0.2,
    typicalPricePerKg: { PCB: 85, Cable: 50, Battery: 20, Metal: 25, Plastic: 12, 'Mixed E-Waste': 38 },
    available: true,
    badge: '📱 Electronics Specialist',
  },
  {
    kabadiId: 'KBD-003',
    name: 'Priya Green Recycle',
    ownerName: 'Priya Sharma',
    phone: '+91 94370 33003',
    areas: ['Rayagada', 'Gunupur', 'Kalyansinghpur'],
    rating: 4.8,
    totalPickups: 521,
    acceptedMaterials: ['PCB', 'Cable', 'Battery', 'Metal', 'Plastic', 'Paper', 'Mixed E-Waste'],
    minWeightKg: 1.0,
    typicalPricePerKg: { PCB: 95, Cable: 60, Battery: 28, Metal: 32, Plastic: 18, 'Mixed E-Waste': 45 },
    available: true,
    badge: '🌱 Eco Certified',
  },
  {
    kabadiId: 'KBD-004',
    name: 'Anand Scrap Dealers',
    ownerName: 'Anand Mishra',
    phone: '+91 87654 44004',
    areas: ['Bisam Cuttack', 'Chandrapur', 'Gunupur'],
    rating: 3.9,
    totalPickups: 98,
    acceptedMaterials: ['Metal', 'Plastic', 'Mixed E-Waste', 'Cable'],
    minWeightKg: 2.0,
    typicalPricePerKg: { PCB: 80, Cable: 45, Battery: 18, Metal: 28, Plastic: 10, 'Mixed E-Waste': 35 },
    available: true,
    badge: null,
  },
  {
    kabadiId: 'KBD-005',
    name: 'Dev Electronics Kabadi',
    ownerName: 'Devraj Singh',
    phone: '+91 96320 55005',
    areas: ['Padampur', 'Rayagada', 'Gunupur'],
    rating: 4.4,
    totalPickups: 243,
    acceptedMaterials: ['PCB', 'Mobile Phones', 'Laptop', 'Cable', 'Battery', 'Mixed E-Waste'],
    minWeightKg: 0.3,
    typicalPricePerKg: { PCB: 88, Cable: 52, Battery: 22, Metal: 27, Plastic: 14, 'Mixed E-Waste': 42 },
    available: false, // Demo: currently unavailable
    badge: '⚡ Fast Pickup',
  },
];

export const SCRAP_TYPES = [
  'PCB / Circuit Boards',
  'Mobile Phones / Tablets',
  'Laptop / Computer',
  'Cable / Wire',
  'Battery / UPS',
  'Metal Scrap',
  'Plastic / PVC',
  'Mixed E-Waste',
  'Other',
];

export const BOOKING_STATUSES = ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];

export const PAYMENT_METHODS_KABADI = ['Cash', 'UPI', 'Bank Transfer'];

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export const INITIAL_SEED_BOOKINGS = [
  {
    bookingId: 'BKG-0001',
    collectorId: 'usr-customer-01',
    collectorName: 'Pooja Verma',
    collectorPhone: '+91 98112 23344',
    customerId: 'usr-customer-01',
    customerName: 'Pooja Verma',
    customerPhone: '+91 98112 23344',
    kabadiId: 'KBD-001',
    kabadiName: 'Ramesh Kumar Scrap',
    kabadiOwner: 'Ramesh Kumar',
    kabadiPhone: '+91 98765 11001',
    area: 'Dharavi Sector 3, Mumbai',
    address: 'Flat 402, Greenfield Apts, Dharavi',
    scrapType: 'Mobile Phones / Tablets',
    estimatedWeightKg: 2.0,
    estimatedTotalAmount: 170,
    photoUrl: null,
    notes: 'Two old Redmi phones with cracked screens and dead battery',
    preferredDate: '2026-09-20',
    preferredTime: '10:00 AM - 01:00 PM',
    status: 'requested',
    scheduledDate: '2026-09-20',
    scheduledTime: '10:00 AM - 01:00 PM',
    actualWeightKg: null,
    finalPricePerKg: null,
    finalTotalAmount: null,
    paymentMethod: null,
    paymentStatus: 'unpaid',
    createdAt: '2026-09-20T08:30:00.000Z',
    updatedAt: '2026-09-20T08:30:00.000Z',
  },
  {
    bookingId: 'BKG-0002',
    collectorId: 'usr-customer-01',
    collectorName: 'Pooja Verma',
    collectorPhone: '+91 98112 23344',
    customerId: 'usr-customer-01',
    customerName: 'Pooja Verma',
    customerPhone: '+91 98112 23344',
    kabadiId: 'KBD-001',
    kabadiName: 'Ramesh Kumar Scrap',
    kabadiOwner: 'Ramesh Kumar',
    kabadiPhone: '+91 98765 11001',
    area: 'Dharavi Sector 3, Mumbai',
    address: 'Flat 402, Greenfield Apts, Dharavi',
    scrapType: 'Laptop / Computer',
    estimatedWeightKg: 4.5,
    estimatedTotalAmount: 380,
    photoUrl: null,
    notes: 'Old desktop CPU cabinet and power supply unit',
    preferredDate: '2026-09-20',
    preferredTime: '11:00 AM - 02:00 PM',
    status: 'arrived',
    scheduledDate: '2026-09-20',
    scheduledTime: '11:00 AM - 02:00 PM',
    actualWeightKg: null,
    finalPricePerKg: null,
    finalTotalAmount: null,
    paymentMethod: null,
    paymentStatus: 'unpaid',
    createdAt: '2026-09-20T07:15:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  },
  {
    bookingId: 'BKG-0003',
    collectorId: 'usr-customer-01',
    collectorName: 'Pooja Verma',
    collectorPhone: '+91 98112 23344',
    customerId: 'usr-customer-01',
    customerName: 'Pooja Verma',
    customerPhone: '+91 98112 23344',
    kabadiId: 'KBD-001',
    kabadiName: 'Ramesh Kumar Scrap',
    kabadiOwner: 'Ramesh Kumar',
    kabadiPhone: '+91 98765 11001',
    area: 'Dharavi Sector 3, Mumbai',
    address: 'Flat 402, Greenfield Apts, Dharavi',
    scrapType: 'PCB / Circuit Boards',
    estimatedWeightKg: 3.0,
    estimatedTotalAmount: 270,
    photoUrl: null,
    notes: 'Assorted motherboard circuit boards from discarded home inverter',
    preferredDate: '2026-09-19',
    preferredTime: '09:00 AM - 12:00 PM',
    status: 'collected',
    scheduledDate: '2026-09-19',
    scheduledTime: '09:00 AM - 12:00 PM',
    actualWeightKg: 3.2,
    finalPricePerKg: 90,
    finalTotalAmount: 288,
    paymentMethod: null,
    paymentStatus: 'unpaid',
    createdAt: '2026-09-19T09:00:00.000Z',
    updatedAt: '2026-09-19T11:00:00.000Z',
  }
];

const getBookings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_BOOKINGS));
      return [...INITIAL_SEED_BOOKINGS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let changed = false;
      for (const seed of INITIAL_SEED_BOOKINGS) {
        if (!parsed.some((b) => b.bookingId === seed.bookingId)) {
          parsed.push(seed);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return [...INITIAL_SEED_BOOKINGS];
  } catch {
    return [...INITIAL_SEED_BOOKINGS];
  }
};

const saveBookings = (bookings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

const generateBookingId = () => {
  const all = getBookings();
  const max = all.reduce((acc, b) => {
    const n = parseInt((b.bookingId || '').replace('BKG-', ''), 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `BKG-${String(max + 1).padStart(4, '0')}`;
};

// ─── Kabadiwala Availability (localStorage backed) ──────────────────────────
const STORAGE_KEY_AGENTS = 'scrapsetu_kabadi_agents';

export const getKabadiAgents = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(DEMO_KABADIWALAS));
      return [...DEMO_KABADIWALAS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEMO_KABADIWALAS];
  } catch {
    return [...DEMO_KABADIWALAS];
  }
};

export const getKabadiAvailability = (kabadiId) => {
  const agents = getKabadiAgents();
  const agent = agents.find((k) => k.kabadiId === kabadiId);
  return agent ? agent.available : true;
};

export const setKabadiAvailability = (kabadiId, isAvailable) => {
  const agents = getKabadiAgents();
  const idx = agents.findIndex((k) => k.kabadiId === kabadiId);
  if (idx !== -1) {
    agents[idx].available = isAvailable;
  } else {
    agents.push({ kabadiId, available: isAvailable });
  }
  localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agents));
  return isAvailable;
};

export const toggleKabadiAvailability = (kabadiId) => {
  const current = getKabadiAvailability(kabadiId);
  return setKabadiAvailability(kabadiId, !current);
};

// ─── Nearby Matching ──────────────────────────────────────────────────────────

/**
 * Get kabadiwalas that serve the given area with simulated distance.
 */
export const getNearbyKabadiwalas = (area = '', scrapType = '') => {
  const agents = getKabadiAgents();
  return agents.map((k, i) => {
    // Simulated distance based on agent index and area
    const dist = (0.8 + (i * 0.6)).toFixed(1);
    return {
      ...k,
      distance: `${dist} km`,
      distanceKm: parseFloat(dist),
    };
  }).filter((k) => {
    if (!area) return true;
    return k.areas.some((a) =>
      a.toLowerCase().includes(area.toLowerCase()) ||
      area.toLowerCase().includes(a.toLowerCase())
    );
  }).sort((a, b) => b.rating - a.rating);
};

export const getKabadiById = (kabadiId) => {
  const agents = getKabadiAgents();
  return agents.find((k) => k.kabadiId === kabadiId) || null;
};

// ─── Booking CRUD ─────────────────────────────────────────────────────────────

export const createBooking = ({
  collectorId,
  collectorName = '',
  collectorPhone = '',
  kabadiId,
  area,
  address = '',
  scrapType,
  estimatedWeightKg,
  photoUrl = null,
  notes = '',
  preferredDate = '',
  preferredTime = '',
}) => {
  if (!collectorId) throw new Error('collectorId / customerId is required');
  if (!kabadiId) throw new Error('kabadiId is required');
  if (!area) throw new Error('area is required');
  if (!scrapType) throw new Error('scrapType is required');

  const kabadi = getKabadiById(kabadiId);
  if (!kabadi) throw new Error(`Kabadiwala not found: ${kabadiId}`);

  const now = new Date().toISOString();
  const weight = parseFloat(estimatedWeightKg) || 0;
  const priceEst = getEstimatedPrice(kabadi, scrapType, weight);

  const booking = {
    bookingId: generateBookingId(),
    collectorId,
    collectorName,
    collectorPhone,
    customerId: collectorId,
    customerName: collectorName,
    customerPhone: collectorPhone,
    kabadiId,
    kabadiName: kabadi.name,
    kabadiOwner: kabadi.ownerName,
    kabadiPhone: kabadi.phone,
    area,
    address,
    scrapType,
    estimatedWeightKg: weight,
    estimatedTotalAmount: priceEst?.estimated || 0,
    photoUrl,
    notes,
    preferredDate,
    preferredTime,
    // Status progression: requested → accepted → on_the_way → arrived → collected → paid
    status: 'requested',
    scheduledDate: preferredDate || null,
    scheduledTime: preferredTime || null,
    rejectionReason: null,
    cancellationReason: null,
    // Weighing & final price
    actualWeightKg: null,
    finalPricePerKg: null,
    finalTotalAmount: null,
    // Payment
    paymentMethod: null,
    paymentStatus: 'unpaid', // unpaid | paid
    paymentRecordedAt: null,
    // Timestamps
    createdAt: now,
    updatedAt: now,
    acceptedAt: null,
    onTheWayAt: null,
    arrivedAt: null,
    collectedAt: null,
    paidAt: null,
    completedAt: null,
  };

  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);
  return booking;
};

const _patch = (bookingId, patch) => {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.bookingId === bookingId);
  if (idx === -1) throw new Error(`Booking not found: ${bookingId}`);
  bookings[idx] = { ...bookings[idx], ...patch, updatedAt: new Date().toISOString() };
  saveBookings(bookings);
  return bookings[idx];
};

export const getBookingById = (bookingId) =>
  getBookings().find((b) => b.bookingId === bookingId) || null;

export const getBookingsByCollector = (collectorId) =>
  getBookings()
    .filter((b) => b.collectorId === collectorId || b.customerId === collectorId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const getBookingsByCustomer = (customerId) =>
  getBookingsByCollector(customerId);

export const getBookingsByKabadi = (kabadiId) =>
  getBookings()
    .filter((b) => b.kabadiId === kabadiId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// ─── Status Transitions (6-Step Lifecycle) ────────────────────────────────────

/** 1. Accept Pickup Request */
export const acceptBooking = (bookingId, scheduledDate = '', scheduledTime = '') => {
  return _patch(bookingId, {
    status: 'accepted',
    scheduledDate: scheduledDate || undefined,
    scheduledTime: scheduledTime || undefined,
    acceptedAt: new Date().toISOString(),
  });
};

/** 2. Reject Pickup Request */
export const rejectBooking = (bookingId, reason = '') => {
  return _patch(bookingId, {
    status: 'rejected',
    rejectionReason: reason,
    rejectedAt: new Date().toISOString(),
  });
};

/** 3. On The Way */
export const startOnTheWay = (bookingId) => {
  return _patch(bookingId, {
    status: 'on_the_way',
    onTheWayAt: new Date().toISOString(),
  });
};
export const startPickup = startOnTheWay;

/** 4. Arrived at Customer Location */
export const markArrived = (bookingId) => {
  return _patch(bookingId, {
    status: 'arrived',
    arrivedAt: new Date().toISOString(),
  });
};

/** 5. Collected & Enter Final Price */
export const setFinalPrice = (bookingId, { actualWeightKg, finalPricePerKg }) => {
  const weight = parseFloat(actualWeightKg);
  const rate = parseFloat(finalPricePerKg);
  if (isNaN(weight) || weight <= 0) throw new Error('actualWeightKg must be positive');
  if (isNaN(rate) || rate <= 0) throw new Error('finalPricePerKg must be positive');
  return _patch(bookingId, {
    status: 'collected',
    actualWeightKg: weight,
    finalPricePerKg: rate,
    finalTotalAmount: parseFloat((weight * rate).toFixed(2)),
    collectedAt: new Date().toISOString(),
  });
};

/** 6. Complete Payment */
export const recordKabadiPayment = (bookingId, paymentMethod) => {
  const validMethods = [...PAYMENT_METHODS_KABADI, 'Razorpay', 'Cashfree'];
  if (!validMethods.includes(paymentMethod)) {
    throw new Error(`Invalid payment method: ${paymentMethod}`);
  }
  const now = new Date().toISOString();
  return _patch(bookingId, {
    status: 'paid',
    paymentMethod,
    paymentStatus: 'paid',
    paymentRecordedAt: now,
    paidAt: now,
    completedAt: now,
  });
};

export const completeBooking = (bookingId) => {
  const b = getBookingById(bookingId);
  if (!b) throw new Error(`Booking not found: ${bookingId}`);
  const now = new Date().toISOString();
  return _patch(bookingId, {
    status: 'paid',
    completedAt: now,
  });
};

export const cancelBooking = (bookingId, reason = '') => {
  return _patch(bookingId, {
    status: 'cancelled',
    cancellationReason: reason,
  });
};

// ─── Lifecycle Steps Definition ───────────────────────────────────────────────

export const LIFECYCLE_STEPS = [
  { key: 'requested', label: 'Requested', icon: '📝' },
  { key: 'accepted', label: 'Accepted', icon: '✅' },
  { key: 'on_the_way', label: 'On the Way', icon: '🚛' },
  { key: 'arrived', label: 'Arrived', icon: '📍' },
  { key: 'collected', label: 'Collected', icon: '📦' },
  { key: 'paid', label: 'Paid', icon: '💰' },
];

export const getLifecycleIndex = (status) => {
  if (status === 'pending') return 0;
  if (status === 'in_progress') return 2;
  if (status === 'completed') return 5;
  const idx = LIFECYCLE_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

// ─── Utils ────────────────────────────────────────────────────────────────────

export const getStatusColor = (status) => {
  switch (status) {
    case 'requested':
    case 'pending':     return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    case 'accepted':    return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' };
    case 'on_the_way':
    case 'in_progress': return { bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' };
    case 'arrived':     return { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' };
    case 'collected':   return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
    case 'paid':
    case 'completed':   return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
    case 'rejected':    return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' };
    case 'cancelled':   return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
    default:            return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'requested':
    case 'pending':     return '⏳ Requested — Waiting for Kabadiwala';
    case 'accepted':    return '✅ Accepted — Scheduled';
    case 'on_the_way':
    case 'in_progress': return '🚛 On the Way';
    case 'arrived':     return '📍 Arrived at Location';
    case 'collected':   return '📦 Collected & Weighed';
    case 'paid':
    case 'completed':   return '💰 Paid & Completed';
    case 'rejected':    return '❌ Rejected';
    case 'cancelled':   return '🚫 Cancelled';
    default:            return status;
  }
};

export const getEstimatedPrice = (kabadi, scrapType, weightKg) => {
  if (!kabadi || !weightKg) return null;
  const key = Object.keys(kabadi.typicalPricePerKg || {}).find((k) =>
    scrapType?.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(scrapType?.toLowerCase())
  ) || 'Mixed E-Waste';
  const rate = kabadi.typicalPricePerKg?.[key] || kabadi.typicalPricePerKg?.['Mixed E-Waste'] || 40;
  return { rate, estimated: parseFloat((rate * weightKg).toFixed(2)) };
};
