/**
 * ScrapSetu Mock Datasets for Module 1 (SIH 2026 Prototype)
 * Clearly labeled demo data ready to be swapped with FastAPI endpoints in later modules.
 */

export const CORE_MATERIAL_GROUPS = [
  {
    id: 'mat_pcb',
    name: 'Printed Circuit Boards (PCBs)',
    vernacularName: 'मदरबोर्ड / हरी प्लेट',
    category: 'High Value Electronic Scrap',
    icon: 'Cpu',
    benchmarkPrice: '₹240 - ₹380',
    unit: 'per kg',
    hazardLevel: 'Medium',
    description: 'Computer motherboards, TV circuit boards, mobile circuit boards.'
  },
  {
    id: 'mat_copper',
    name: 'Copper Wires & Cables',
    vernacularName: 'तांबे की तार / केबल',
    category: 'Non-Ferrous Metal',
    icon: 'Cable',
    benchmarkPrice: '₹450 - ₹580',
    unit: 'per kg',
    hazardLevel: 'Low',
    description: 'Power cords, internal appliance wiring, telecom cables.'
  },
  {
    id: 'mat_battery',
    name: 'Batteries (Li-ion / Lead Acid)',
    vernacularName: 'बैटरी (मोबाइल / इन्वर्टर)',
    category: 'Hazardous / Controlled',
    icon: 'BatteryCharging',
    benchmarkPrice: '₹90 - ₹160',
    unit: 'per kg',
    hazardLevel: 'High',
    description: 'Phone batteries, laptop packs, UPS batteries. Requires insulated transport.'
  },
  {
    id: 'mat_motor',
    name: 'Electric Motors & Transformers',
    vernacularName: 'मोटर / ट्रांसफार्मर',
    category: 'Copper Core Scrap',
    icon: 'Zap',
    benchmarkPrice: '₹95 - ₹150',
    unit: 'per kg',
    hazardLevel: 'Low',
    description: 'Fan motors, mixer motors, washing machine rotors.'
  },
  {
    id: 'mat_display',
    name: 'Display / LCD Panels',
    vernacularName: 'स्क्रीन / डिस्प्ले',
    category: 'Salvage Component',
    icon: 'Monitor',
    benchmarkPrice: '₹150 - ₹450',
    unit: 'per piece',
    hazardLevel: 'Medium',
    description: 'Laptop displays, monitor screens, smartphone screens for repair shops.'
  },
  {
    id: 'mat_adapter',
    name: 'Power Adapters & SMPS',
    vernacularName: 'एडाप्टर / चार्जर',
    category: 'Reusable / Scrap',
    icon: 'Plug',
    benchmarkPrice: '₹70 - ₹120',
    unit: 'per kg',
    hazardLevel: 'Low',
    description: 'Laptop chargers, set-top box power bricks, desktop SMPS.'
  },
  {
    id: 'mat_chassis',
    name: 'Appliance Casing & Chassis',
    vernacularName: 'बॉडी / प्लास्टिक व धातु',
    category: 'Mixed Structural',
    icon: 'Box',
    benchmarkPrice: '₹28 - ₹45',
    unit: 'per kg',
    hazardLevel: 'Low',
    description: 'Printer shells, CPU cabinets, microwave shells.'
  },
  {
    id: 'mat_small_appliance',
    name: 'Small Electronics Scrap',
    vernacularName: 'छोटे इलेक्ट्रॉनिक्स',
    category: 'Mixed E-Waste',
    icon: 'Radio',
    benchmarkPrice: '₹45 - ₹85',
    unit: 'per kg',
    hazardLevel: 'Medium',
    description: 'Routers, calculators, remote controls, smart watches.'
  }
];

export const MOCK_COLLECTOR_DATA = {
  id: 'SS-COL-8921',
  name: 'Ramesh Kumar',
  phone: '+91 98765 43210',
  operatingArea: 'Dharavi Sector 3, Mumbai',
  todaysEarnings: '₹1,850',
  thisMonthTotal: '₹18,450',
  completedEarnings: '₹16,900',
  pendingEarnings: '₹1,550',
  recentEarningsBreakdown: [
    { material: 'PCB / Motherboard', amount: '₹1,800', weight: '2.4 kg', date: 'Today' },
    { material: 'Copper Wire', amount: '₹1,200', weight: '2.6 kg', date: 'Yesterday' },
    { material: 'Motor & Pump', amount: '₹900', weight: '8.0 kg', date: '17 Sep 2026' }
  ]
};

export const MOCK_COLLECTOR_LOTS = [
  {
    id: 'SS-2026-001',
    material: 'Laptop PCB / Motherboard',
    estimatedWeight: '2.4 kg',
    fairPriceEstimate: '₹1,550 – ₹1,800',
    status: 'Ready for Handover',
    statusTag: 'COMPLETED ✓',
    matchedBuyer: 'Gunupur Digital Clinic (Repair Shop • 0.8 km)',
    date: '19 Sep 2026',
    buyerOffer: '₹1,800'
  },
  {
    id: 'SS-2026-002',
    material: 'Copper Wiring (Stripped)',
    estimatedWeight: '5.0 kg',
    fairPriceEstimate: '₹2,200 – ₹2,500',
    status: 'Offer Received',
    statusTag: 'PENDING ⏳',
    matchedBuyer: 'ABC Recycling (Recycler • 5.2 km)',
    date: '19 Sep 2026',
    buyerOffer: '₹2,200'
  }
];

export const MOCK_COLLECTOR_TRANSACTIONS = [
  {
    id: 'SS-2026-001',
    statusBadge: 'COMPLETED ✓',
    statusType: 'completed',
    material: 'Laptop PCB',
    weight: '2.4 kg',
    amount: '₹1,800',
    buyerType: 'Repair Shop',
    buyerName: 'Gunupur Digital Clinic',
    date: '19 Sept 2026',
    paymentMode: 'UPI Instant Payout'
  },
  {
    id: 'SS-2026-002',
    statusBadge: 'PENDING ⏳',
    statusType: 'pending',
    material: 'Copper Cable',
    weight: '5 kg',
    amount: '₹2,200',
    buyerType: 'Recycler',
    buyerName: 'ABC Recycling',
    date: '19 Sept 2026',
    paymentMode: 'Cash on Handover'
  }
];

export const MOCK_NEARBY_BUYERS = [
  {
    id: 'BUY-01',
    name: 'Gunupur Digital Clinic',
    type: 'Repair Shop',
    typeIcon: '🔧',
    distance: '0.8 km away',
    distanceNum: 0.8,
    specialty: 'Parts Recovery & Reusable PCBs',
    address: 'College Road Market, Gunupur, Odisha 765022',
    rating: 4.8,
    badgeText: 'Parts Buyer'
  },
  {
    id: 'BUY-02',
    name: 'ABC Recycling (Authorized)',
    type: 'Recycler',
    typeIcon: '♻️',
    distance: '5.2 km away',
    distanceNum: 5.2,
    specialty: 'Bulk High-Grade Recycling',
    address: 'MIDC Industrial Zone, Navi Mumbai',
    rating: 4.9,
    badgeText: 'Authorized Recycler'
  }
];

export const MOCK_RECYCLER_DATA = {
  name: 'ABC Recycling',
  cpcbRegNo: 'CPCB/EW/MH/2024/0981',
  authorizationStatus: 'Authorized Recycler',
  authorizationNotice: 'DEMO DATA ONLY • Facility Authorization Record',
  newLotsCount: 12,
  pickupRequestsCount: 5,
  todaysPurchases: '₹24,500',
  totalRecycledWeight: '2,480 kg'
};

export const MOCK_RECYCLER_LOTS = [
  {
    id: 'SS-2026-001',
    material: 'Laptop PCB',
    approxWeight: '2.4 kg',
    distance: '5.2 km',
    collectorLocation: 'Demo Location (Dharavi Cluster)',
    estimatedRange: '₹1,550 – ₹1,800',
    highestOffer: '₹1,750',
    status: 'Available'
  },
  {
    id: 'SS-2026-002',
    material: 'Copper Cable (Telecom grade)',
    approxWeight: '5.0 kg',
    distance: '5.2 km',
    collectorLocation: 'Demo Location (Kurla West)',
    estimatedRange: '₹2,200 – ₹2,500',
    highestOffer: '₹2,300',
    status: 'Available'
  },
  {
    id: 'SS-2026-003',
    material: 'Electric Motors (Mixer & Fan)',
    approxWeight: '12.0 kg',
    distance: '6.8 km',
    collectorLocation: 'Demo Location (Sion East)',
    estimatedRange: '₹1,200 – ₹1,600',
    highestOffer: '₹1,400',
    status: 'Available'
  }
];

export const MOCK_RECYCLER_PICKUPS = [
  {
    lotId: 'SS-2026-001',
    material: 'PCB (Laptop Motherboards)',
    approxWeight: '2.4 kg',
    pickupArea: 'Dharavi Sector 3, Mumbai',
    status: 'Requested',
    statusBadge: '⏳ Pickup: Requested',
    driver: 'Dispatched (Tata Ace MH-04-AB-2910)'
  },
  {
    lotId: 'SS-2026-004',
    material: 'Telecom Copper Wires',
    approxWeight: '18.5 kg',
    pickupArea: 'Bandra Aggregation Yard',
    status: 'Scheduled',
    statusBadge: '📅 Scheduled for 3:00 PM',
    driver: 'Assigned: Surendra P.'
  }
];

export const MOCK_REPAIR_SHOP_DATA = {
  shopName: 'Gunupur Digital Clinic',
  owner: 'Santosh Kumar Nayak',
  location: 'College Road Market, Gunupur, Odisha',
  matchingItemsCount: 8,
  activeWantedItemsCount: 4,
  pendingOffersCount: 2,
  salvageSavings: '₹14,200'
};

export const MOCK_REPAIR_SHOP_WANTED = [
  {
    id: 'WANT-01',
    name: 'Laptop RAM',
    category: 'DDR4 8GB / 16GB Laptop RAM sticks',
    conditionNeeded: 'Intact gold fingers / tested chip',
    offeringPrice: '₹400 – ₹800 / stick',
    matchesFound: 3,
    urgency: 'High Demand'
  },
  {
    id: 'WANT-02',
    name: 'Display Panels',
    category: '14" & 15.6" Slim LED Screens (30-pin)',
    conditionNeeded: 'No cracks / Functional display',
    offeringPrice: '₹500 – ₹900 / piece',
    matchesFound: 2,
    urgency: 'Urgent'
  },
  {
    id: 'WANT-03',
    name: 'SMPS Power Supply',
    category: 'Desktop 450W - 650W Power Supplies',
    conditionNeeded: 'Working fan & clean capacitors',
    offeringPrice: '₹250 – ₹450 / unit',
    matchesFound: 1,
    urgency: 'Medium Demand'
  },
  {
    id: 'WANT-04',
    name: 'Motor',
    category: 'Copper Core Electric Motors (Washing Machine / Mixer)',
    conditionNeeded: 'Intact copper winding (no burnt smell)',
    offeringPrice: '₹120 / kg',
    matchesFound: 2,
    urgency: 'Medium Demand'
  },
  {
    id: 'WANT-05',
    name: 'Mobile Components',
    category: 'AMOLED / IPS Screens & Charging Daughterboards',
    conditionNeeded: 'Uncracked glass or reusable flex ribbon',
    offeringPrice: '₹200 – ₹600 / unit',
    matchesFound: 4,
    urgency: 'High Demand'
  }
];

export const MOCK_REPAIR_SHOP_COMPONENTS = [
  {
    id: 'CMP-101',
    name: '15.6" Slim LED Panel (30-Pin)',
    collector: 'Ramesh Kumar',
    collectorPhone: '+91 98765 43210',
    location: 'Dharavi Sector 3 (2.1 km away)',
    condition: 'Uncracked, tested salvage',
    estimatedPrice: '₹450 / piece',
    availableQty: 2,
    dateAdded: '19 Sep 2026',
    status: 'Available'
  },
  {
    id: 'CMP-102',
    name: 'Dell Inspiron 15 Motherboard (i5 8th Gen)',
    collector: 'Anil Sakpal',
    collectorPhone: '+91 98111 22334',
    location: 'Kurla West (3.4 km away)',
    condition: 'Complete board, minor charging IC issue',
    estimatedPrice: '₹1,200',
    availableQty: 1,
    dateAdded: '19 Sep 2026',
    status: 'Available'
  },
  {
    id: 'CMP-103',
    name: 'Desktop SMPS Power Supply (450W Bronze)',
    collector: 'Sunil Verma',
    collectorPhone: '+91 98222 33445',
    location: 'Sion East (4.0 km away)',
    condition: 'Working fan, all 12V rails intact',
    estimatedPrice: '₹350',
    availableQty: 3,
    dateAdded: '18 Sep 2026',
    status: 'Available'
  },
  {
    id: 'CMP-104',
    name: 'Washing Machine Copper Rotor Motor',
    collector: 'Deepak Shinde',
    collectorPhone: '+91 98333 44556',
    location: 'Bandra Aggregation Yard (4.8 km away)',
    condition: 'Solid winding, tested bearings',
    estimatedPrice: '₹480',
    availableQty: 2,
    dateAdded: '18 Sep 2026',
    status: 'Available'
  }
];

export const MOCK_REPAIR_SHOP_OFFERS = [
  {
    id: 'OFF-301',
    componentName: 'Laptop PCB / Motherboard (Lot SS-2026-001)',
    collector: 'Ramesh Kumar',
    offeredAmount: '₹1,800',
    benchmarkRate: '₹1,550 – ₹1,800',
    status: 'Accepted ✓',
    statusType: 'accepted',
    date: '19 Sep 2026, 11:15 AM'
  },
  {
    id: 'OFF-302',
    componentName: '14" IPS Matte Screen Panel',
    collector: 'Sunil Verma',
    offeredAmount: '₹650',
    benchmarkRate: '₹500 – ₹750',
    status: 'Pending ⏳',
    statusType: 'pending',
    date: '19 Sep 2026, 09:30 AM'
  },
  {
    id: 'OFF-303',
    componentName: '3x 8GB DDR4 Laptop RAM',
    collector: 'Deepak Shinde',
    offeredAmount: '₹1,500',
    benchmarkRate: '₹1,200 – ₹1,800',
    status: 'Under Counter-Offer',
    statusType: 'pending',
    date: '18 Sep 2026, 05:40 PM'
  }
];

export const MOCK_REPAIR_SHOP_PURCHASES = [
  {
    id: 'PUR-801',
    component: 'Laptop Motherboard (Core i3 Board)',
    collector: 'Ramesh Kumar',
    amount: '₹1,800',
    date: '19 Sep 2026',
    salvageYield: 'Chipset + 8x Capacitors + Audio IC',
    status: 'Received ✓'
  },
  {
    id: 'PUR-802',
    component: '2x Inverter Copper Transformers',
    collector: 'Anil Sakpal',
    amount: '₹760',
    date: '16 Sep 2026',
    salvageYield: 'Rewound copper wire + Core',
    status: 'Received ✓'
  },
  {
    id: 'PUR-803',
    component: '5x Smartphone Motherboards (Broken Screen)',
    collector: 'Deepak Shinde',
    amount: '₹1,250',
    date: '14 Sep 2026',
    salvageYield: 'Camera sensors + PMIC chips',
    status: 'Received ✓'
  }
];

export const MOCK_ADMIN_METRICS = {
  totalCollectors: '1,248',
  totalRepairShops: '86',
  totalRecyclers: '42',
  totalTransactions: '5,842',
  totalVolumeRecycledKg: '48,650 kg',
  totalPayouts: '₹38.4 Lakhs',
  notice: 'DEMO / MOCK VALUES FOR PROTOTYPE'
};

export const MOCK_ADMIN_COLLECTORS = [
  {
    id: 'COL-101',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    area: 'Dharavi Sector 3, Mumbai',
    lotsSubmitted: 42,
    rating: '4.8 ★',
    payoutTotal: '₹48,200',
    status: 'Active ✓',
    verification: 'Aadhaar Verified'
  },
  {
    id: 'COL-102',
    name: 'Anil Sakpal',
    phone: '+91 98111 22334',
    area: 'Kurla West, Mumbai',
    lotsSubmitted: 28,
    rating: '4.7 ★',
    payoutTotal: '₹31,450',
    status: 'Active ✓',
    verification: 'Aadhaar Verified'
  },
  {
    id: 'COL-103',
    name: 'Sunil Verma',
    phone: '+91 98222 33445',
    area: 'Sion East, Mumbai',
    lotsSubmitted: 19,
    rating: '4.9 ★',
    payoutTotal: '₹22,800',
    status: 'Active ✓',
    verification: 'Aadhaar Verified'
  },
  {
    id: 'COL-104',
    name: 'Deepak Shinde',
    phone: '+91 98333 44556',
    area: 'Bandra Aggregation Yard',
    lotsSubmitted: 35,
    rating: '4.6 ★',
    payoutTotal: '₹39,100',
    status: 'Active ✓',
    verification: 'Aadhaar Verified'
  }
];

export const MOCK_ADMIN_REPAIR_SHOPS = [
  {
    id: 'REP-201',
    shopName: 'Om Electronics & Laptop Care',
    owner: 'Mahesh Sharma',
    location: 'Lamington Road, Mumbai',
    licenseNo: 'SE-84910/MUM',
    activeWantedItems: 5,
    salvagePurchases: 14,
    status: 'Verified ✓'
  },
  {
    id: 'REP-202',
    shopName: 'MicroTech Mobile & Chip Fix',
    owner: 'Nitin Patel',
    location: 'Grant Road Station Market',
    licenseNo: 'SE-88219/MUM',
    activeWantedItems: 3,
    salvagePurchases: 8,
    status: 'Pending Verification ⏳'
  },
  {
    id: 'REP-203',
    shopName: 'SmartCare Appliance Solutions',
    owner: 'K. Rajan',
    location: 'Kurla Station Road',
    licenseNo: 'SE-79102/MUM',
    activeWantedItems: 2,
    salvagePurchases: 19,
    status: 'Verified ✓'
  }
];

export const MOCK_ADMIN_RECYCLERS = [
  {
    id: 'RCY-301',
    name: 'ABC Recycling Facility',
    cpcbNumber: 'CPCB/EW/MH/2024/0981',
    location: 'MIDC Industrial Zone, Navi Mumbai',
    processingCapacity: '500 MT / month',
    activePickups: 5,
    status: 'Authorized ✓'
  },
  {
    id: 'RCY-302',
    name: 'Maharashtra E-Cycle Solutions',
    cpcbNumber: 'CPCB/EW/MH/2026/1109',
    location: 'Taloja MIDC, Raigad',
    processingCapacity: '350 MT / month',
    activePickups: 2,
    status: 'Pending Document Review ⏳'
  },
  {
    id: 'RCY-303',
    name: 'EcoGreen Precious Metals Refinery',
    cpcbNumber: 'CPCB/EW/MH/2023/0412',
    location: 'Bhiwandi Logistics Hub',
    processingCapacity: '800 MT / month',
    activePickups: 9,
    status: 'Authorized ✓'
  }
];

export const MOCK_ADMIN_LOTS = [
  {
    id: 'SS-2026-001',
    material: 'Laptop PCB / Motherboard',
    weight: '2.4 kg',
    collector: 'Ramesh Kumar (Dharavi)',
    buyer: 'Om Electronics (Repair Shop)',
    benchmarkRange: '₹1,550 – ₹1,800',
    finalAmount: '₹1,800',
    status: 'Completed ✓'
  },
  {
    id: 'SS-2026-002',
    material: 'Copper Wiring (Telecom Grade)',
    weight: '5.0 kg',
    collector: 'Anil Sakpal (Kurla)',
    buyer: 'ABC Recycling (Recycler)',
    benchmarkRange: '₹2,200 – ₹2,500',
    finalAmount: '₹2,200',
    status: 'Pending Handover ⏳'
  },
  {
    id: 'SS-2026-003',
    material: 'Electric Motors (Mixer & Fan)',
    weight: '12.0 kg',
    collector: 'Sunil Verma (Sion)',
    buyer: 'Open for bidding',
    benchmarkRange: '₹1,200 – ₹1,600',
    finalAmount: '₹1,400 (Bid)',
    status: 'Bidding Active'
  },
  {
    id: 'SS-2026-004',
    material: 'Li-ion Battery Packs (Laptop & UPS)',
    weight: '8.5 kg',
    collector: 'Deepak Shinde (Bandra)',
    buyer: 'ABC Recycling (Recycler)',
    benchmarkRange: '₹850 – ₹1,200',
    finalAmount: '₹1,100',
    status: 'Hazardous Escrow ⚠️'
  }
];

export const MOCK_ADMIN_TRACEABILITY_LOGS = [
  {
    traceId: 'TRC-9901-MH',
    lotId: 'SS-2026-001',
    material: 'Laptop PCB',
    weight: '2.4 kg',
    originCollector: 'Ramesh Kumar (Dharavi)',
    destinationFacility: 'Om Electronics (Repair Shop, Lamington Rd)',
    qrHash: 'sha256:8f92a1c0...93e1',
    eprCreditGenerated: 'EPR-CR-2026-0081',
    complianceStatus: 'Verified & Logged ✓',
    timestamp: '19 Sep 2026, 11:30 AM'
  },
  {
    traceId: 'TRC-9902-MH',
    lotId: 'SS-2026-002',
    material: 'Copper Wires (Stripped)',
    weight: '5.0 kg',
    originCollector: 'Anil Sakpal (Kurla)',
    destinationFacility: 'ABC Recycling (Navi Mumbai MIDC)',
    qrHash: 'sha256:7b14d2e8...42f7',
    eprCreditGenerated: 'EPR-CR-2026-0082',
    complianceStatus: 'Pickup Dispatched ⏳',
    timestamp: '19 Sep 2026, 10:15 AM'
  },
  {
    traceId: 'TRC-9899-MH',
    lotId: 'SS-2026-000',
    material: 'Lead-Acid Inverter Battery',
    weight: '24.0 kg',
    originCollector: 'Sunil Verma (Sion)',
    destinationFacility: 'ABC Recycling (Navi Mumbai MIDC)',
    qrHash: 'sha256:5e32c890...11a3',
    eprCreditGenerated: 'EPR-CR-2026-0079',
    complianceStatus: 'Hazardous Disposal Certified ✓',
    timestamp: '18 Sep 2026, 04:45 PM'
  }
];

export const MOCK_RECENT_TRANSACTIONS = [
  {
    id: 'TXN-5842',
    lotId: 'SS-2026-001',
    collector: 'Ramesh Kumar (Collector)',
    buyer: 'Om Electronics (Repair Shop)',
    material: 'Laptop PCB (2.4 kg)',
    amount: '₹1,800',
    status: 'Completed ✓',
    timestamp: '19 Sep 2026, 11:30 AM'
  },
  {
    id: 'TXN-5841',
    lotId: 'SS-2026-002',
    collector: 'Anil Sakpal (Collector)',
    buyer: 'ABC Recycling (Recycler)',
    material: 'Copper Wires (5.0 kg)',
    amount: '₹2,200',
    status: 'Pending ⏳',
    timestamp: '19 Sep 2026, 10:15 AM'
  },
  {
    id: 'TXN-5840',
    lotId: 'SS-2026-000',
    collector: 'Sunil Verma (Collector)',
    buyer: 'ABC Recycling (Recycler)',
    material: 'Inverter Batteries (24 kg)',
    amount: '₹3,600',
    status: 'Completed ✓',
    timestamp: '18 Sep 2026, 04:45 PM'
  }
];

export const MOCK_VERIFICATION_QUEUE = [
  {
    id: 'VER-901',
    name: 'Maharashtra E-Cycle Solutions',
    type: 'Recycler',
    regDoc: 'CPCB EPR Certificate No. EW/2026/1109',
    submittedDate: '18 Sep 2026',
    status: 'Pending Document Review'
  },
  {
    id: 'VER-902',
    name: 'MicroTech Mobile & Chip Fix',
    type: 'Repair Shop',
    regDoc: 'Shop & Establishment Act Reg #SE-88219',
    submittedDate: '17 Sep 2026',
    status: 'Awaiting Physical Verification'
  }
];

