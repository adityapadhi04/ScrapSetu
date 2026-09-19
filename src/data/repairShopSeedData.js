/**
 * ScrapSetu — Prototype Repair Shop Seed Dataset (Module 6)
 * 
 * Representative demo data establishing realistic repair shop entities and active component demand.
 * 
 * IMPORTANT ARCHITECTURAL DISCLAIMER:
 * These records are strictly for prototype evaluation, SIH demonstration, and offline testing.
 * They do NOT claim to represent actual commercial entities or real-world proprietary addresses.
 * All records are explicitly marked with `sourceType: "demo_seed"`.
 * 
 * A REPAIR SHOP IS NOT AN AUTHORIZED RECYCLER.
 */

export const DEMO_REPAIR_SHOPS = [
  {
    repairShopId: 'SHOP-0001',
    name: 'Demo Mobile Repair Center',
    ownerName: 'Debabrata Das',
    location: {
      area: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      landmark: 'Master Canteen Square'
    },
    acceptedMaterials: [
      'Mobile Phone',
      'Laptop / Computer',
      'LCD / Display'
    ],
    wantedItems: [
      'Mobile Phone',
      'LCD / Display'
    ],
    services: [
      'Parts recovery',
      'Device repair',
      'Component purchase',
      'Screen replacement'
    ],
    purchaseEnabled: true,
    pickupAvailable: false,
    contact: '+91 94371 88291',
    rating: 4.8,
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z'
  },
  {
    repairShopId: 'SHOP-0002',
    name: 'Om Electronics & Laptop Care',
    ownerName: 'Mahesh Sharma',
    location: {
      area: 'Lamington Road, Mumbai',
      state: 'Maharashtra',
      pincode: '400007',
      landmark: 'Near Grant Road Station'
    },
    acceptedMaterials: [
      'Laptop / Computer',
      'PCB',
      'LCD / Display',
      'Motor'
    ],
    wantedItems: [
      'Laptop / Computer',
      'LCD / Display'
    ],
    services: [
      'Motherboard micro-soldering',
      'Component purchase',
      'Parts recovery',
      'Salvage aggregation'
    ],
    purchaseEnabled: true,
    pickupAvailable: true,
    contact: '+91 98200 45678',
    rating: 4.9,
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z'
  },
  {
    repairShopId: 'SHOP-0003',
    name: 'Gunupur Digital Clinic',
    ownerName: 'Santosh Kumar Nayak',
    location: {
      area: 'Gunupur',
      state: 'Odisha',
      pincode: '765022',
      landmark: 'College Road Market'
    },
    acceptedMaterials: [
      'Mobile Phone',
      'Laptop / Computer',
      'PCB'
    ],
    wantedItems: [
      'Mobile Phone',
      'PCB'
    ],
    services: [
      'Device repair',
      'Parts recovery',
      'Component purchase'
    ],
    purchaseEnabled: true,
    pickupAvailable: false,
    contact: '+91 94390 12345',
    rating: 4.7,
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z'
  },
  {
    repairShopId: 'SHOP-0004',
    name: 'Rayagada Electro Care',
    ownerName: 'Bikash Mohanty',
    location: {
      area: 'Rayagada',
      state: 'Odisha',
      pincode: '765001',
      landmark: 'Near Bus Stand'
    },
    acceptedMaterials: [
      'Mobile Phone',
      'Motor',
      'Cable'
    ],
    wantedItems: [
      'Motor',
      'Mobile Phone'
    ],
    services: [
      'Motor rewinding',
      'Component purchase',
      'Appliance repair'
    ],
    purchaseEnabled: true,
    pickupAvailable: false,
    contact: '+91 94380 54321',
    rating: 4.6,
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-08T11:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z'
  },
  {
    repairShopId: 'SHOP-0005',
    name: 'Cuttack Component Hub',
    ownerName: 'Priyabrata Sahoo',
    location: {
      area: 'Cuttack',
      state: 'Odisha',
      pincode: '753001',
      landmark: 'Badambadi'
    },
    acceptedMaterials: [
      'PCB',
      'Laptop / Computer',
      'LCD / Display',
      'Motor'
    ],
    wantedItems: [
      'PCB',
      'Laptop / Computer'
    ],
    services: [
      'Parts recovery',
      'Component purchase',
      'Bulk salvage testing'
    ],
    purchaseEnabled: true,
    pickupAvailable: true,
    contact: '+91 94370 99887',
    rating: 4.8,
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-10T08:30:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z'
  }
];

export const DEMO_WANTED_SEED_ITEMS = [
  {
    wantedId: 'WANT-0001',
    repairShopId: 'SHOP-0001',
    materialCategory: 'Mobile Phone',
    materialSubcategory: 'Smartphone Assembly / Screens',
    preferredCondition: 'Good',
    quantityNeeded: 10,
    offeringPrice: '₹300 – ₹700 / unit',
    location: 'Bhubaneswar, Odisha',
    urgency: 'High Demand',
    status: 'active',
    createdAt: '2026-09-15T10:00:00.000Z'
  },
  {
    wantedId: 'WANT-0002',
    repairShopId: 'SHOP-0002',
    materialCategory: 'Laptop / Computer',
    materialSubcategory: 'Laptop RAM & Motherboards',
    preferredCondition: 'Fair',
    quantityNeeded: 15,
    offeringPrice: '₹400 – ₹1,200 / unit',
    location: 'Lamington Road, Mumbai',
    urgency: 'Active Demand',
    status: 'active',
    createdAt: '2026-09-16T11:00:00.000Z'
  },
  {
    wantedId: 'WANT-0003',
    repairShopId: 'SHOP-0003',
    materialCategory: 'Mobile Phone',
    materialSubcategory: 'Mobile Motherboards / Charging Daughterboards',
    preferredCondition: 'Good',
    quantityNeeded: 8,
    offeringPrice: '₹250 – ₹550 / unit',
    location: 'Gunupur, Odisha',
    urgency: 'High Demand',
    status: 'active',
    createdAt: '2026-09-17T09:30:00.000Z'
  },
  {
    wantedId: 'WANT-0004',
    repairShopId: 'SHOP-0004',
    materialCategory: 'Motor',
    materialSubcategory: 'Copper Core Appliance Motors',
    preferredCondition: 'Fair',
    quantityNeeded: 12,
    offeringPrice: '₹120 – ₹160 / kg',
    location: 'Rayagada, Odisha',
    urgency: 'Medium Demand',
    status: 'active',
    createdAt: '2026-09-18T14:15:00.000Z'
  },
  {
    wantedId: 'WANT-0005',
    repairShopId: 'SHOP-0005',
    materialCategory: 'PCB',
    materialSubcategory: 'Computer Motherboard / SMPS PCBs',
    preferredCondition: 'Good',
    quantityNeeded: 20,
    offeringPrice: '₹280 – ₹400 / kg',
    location: 'Cuttack, Odisha',
    urgency: 'Active Demand',
    status: 'active',
    createdAt: '2026-09-19T08:00:00.000Z'
  }
];
