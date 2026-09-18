/**
 * ScrapSetu Mock Datasets for Module 0 (SIH 2026 Prototype)
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

export const MOCK_COLLECTOR_LOTS = [
  {
    id: 'LOT-2026-081',
    material: 'Computer PCBs & RAM sticks',
    estimatedWeight: '6.5 kg',
    fairPriceEstimate: '₹2,100 - ₹2,450',
    status: 'Ready for Handover',
    date: '18 Sep 2026',
    matchedBuyer: 'EcoGreen Recyclers (1.8 km)'
  },
  {
    id: 'LOT-2026-082',
    material: 'Copper Wiring (Stripped)',
    estimatedWeight: '4.2 kg',
    fairPriceEstimate: '₹1,900 - ₹2,200',
    status: 'Offer Received',
    date: '19 Sep 2026',
    matchedBuyer: 'Om Electronics (2.4 km)'
  }
];

export const MOCK_COLLECTOR_TRANSACTIONS = [
  {
    id: 'TXN-9842',
    date: '17 Sep 2026',
    buyer: 'EcoGreen E-Waste Recyclers',
    buyerType: 'Authorized Recycler',
    material: 'Motherboards & Laptop batteries',
    weight: '12 kg',
    amount: '₹3,450',
    status: 'Completed (Paid via UPI)'
  },
  {
    id: 'TXN-9810',
    date: '14 Sep 2026',
    buyer: 'Om Electronics & Laptop Care',
    buyerType: 'Repair Shop',
    material: '2x 15.6" Laptop Displays',
    weight: '2 units',
    amount: '₹900',
    status: 'Completed (Cash on Handover)'
  }
];

export const MOCK_NEARBY_BUYERS = [
  {
    id: 'BUY-01',
    name: 'EcoGreen E-Waste Recyclers',
    type: 'Authorized Recycler',
    distance: '1.8 km away',
    cpcbVerified: true,
    pickupAvailable: true,
    rating: 4.9,
    address: 'Plot 42, Industrial Area, Dharavi'
  },
  {
    id: 'BUY-02',
    name: 'Om Electronics & Repair Hub',
    type: 'Repair Shop',
    distance: '2.4 km away',
    cpcbVerified: false,
    tradeLicensed: true,
    pickupAvailable: false,
    rating: 4.7,
    address: 'Shop 12, Station Road'
  }
];

export const MOCK_RECYCLER_LOTS = [
  {
    id: 'LOT-2026-081',
    collectorName: 'Ramesh K.',
    collectorRating: 4.8,
    distance: '1.8 km',
    material: 'Computer Motherboards & RAM',
    weight: '6.5 kg',
    offeredRate: '₹340 / kg',
    totalValue: '₹2,210',
    pickupRequired: true,
    status: 'Pending Acceptance'
  },
  {
    id: 'LOT-2026-079',
    collectorName: 'Anil S.',
    collectorRating: 4.6,
    distance: '3.1 km',
    material: 'Telecom Copper Wires',
    weight: '11.0 kg',
    offeredRate: '₹480 / kg',
    totalValue: '₹5,280',
    pickupRequired: true,
    status: 'Pickup Scheduled'
  }
];

export const MOCK_REPAIR_SHOP_WANTED = [
  {
    id: 'WANT-01',
    category: 'Laptop Motherboards (Core i3/i5 8th-11th Gen)',
    conditionNeeded: 'Repairable / Working Chips',
    offeringPrice: '₹500 - ₹1,200 / board',
    status: 'Active Demand',
    matchCount: 3
  },
  {
    id: 'WANT-02',
    category: '14" & 15.6" Slim LED Screens (30-pin)',
    conditionNeeded: 'No cracks / Functional display',
    offeringPrice: '₹400 - ₹800 / piece',
    status: 'Urgent',
    matchCount: 1
  },
  {
    id: 'WANT-03',
    category: 'Inverter Transformer Coils',
    conditionNeeded: 'Intact copper winding',
    offeringPrice: '₹120 / kg',
    status: 'Active Demand',
    matchCount: 4
  }
];

export const MOCK_ADMIN_METRICS = {
  totalCollectors: 142,
  totalRepairShops: 38,
  totalRecyclers: 16,
  totalVolumeRecycledKg: '14,680 kg',
  totalPayouts: '₹4,82,400',
  activeLotsCount: 29,
  pendingVerifications: 5,
  eprCertificatesGenerated: 18
};

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
