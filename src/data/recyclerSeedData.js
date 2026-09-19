/**
 * ScrapSetu — Prototype Authorized Recycler Seed Dataset (Module 7)
 * 
 * Representative demo data establishing realistic formal recycling entities,
 * material acceptance parameters, collection capabilities, and prototype authorization records.
 * 
 * IMPORTANT ARCHITECTURAL & ETHICAL DISCLAIMER:
 * These records are strictly for prototype evaluation, SIH demonstration, and local simulation.
 * They do NOT represent legally registered commercial recyclers or official government credentials.
 * All records are explicitly marked with `sourceType: "demo_seed"`, `verificationStatus: "demo_verified"`,
 * and `authorizationType: "Demo Authorization Record"`.
 * 
 * AN AUTHORIZED RECYCLER IS NOT A REPAIR SHOP:
 * - Repair Shop = informal reuse, parts harvesting, device repair, active wanted demand.
 * - Authorized Recycler = formal material recovery, industrial smelting, authorized processing, compliance.
 */

export const DEMO_RECYCLERS = [
  {
    recyclerId: 'REC-0001',
    businessName: 'GreenCycle Material Recovery Ltd.',
    contactName: 'Anil Mohanty',
    phone: '+91 94370 12345',
    email: 'info@greencycle-demo.org',
    address: {
      area: 'MIDC Industrial Estate',
      city: 'Rayagada',
      state: 'Odisha',
      pincode: '765001'
    },
    acceptedMaterials: [
      'PCB',
      'Cable',
      'Battery',
      'Metal Chassis'
    ],
    services: [
      'Collection',
      'Drop-off',
      'Bulk Recycling',
      'Hazardous Neutralization'
    ],
    pickupAvailable: true,
    operatingAreas: [
      'Gunupur',
      'Rayagada',
      'JK Pur',
      'Koraput'
    ],
    minimumWeightKg: 5,
    paymentMethods: [
      'Cash',
      'UPI',
      'Bank Transfer'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0001',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0002',
    businessName: 'Pragati E-Waste Solutions Hub',
    contactName: 'Sunita Tripathy',
    phone: '+91 98610 99881',
    email: 'contact@pragatieco-demo.in',
    address: {
      area: 'Mancheswar Industrial Area',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751010'
    },
    acceptedMaterials: [
      'PCB',
      'Mobile Phone',
      'Laptop / Computer',
      'Cable',
      'LCD / Display'
    ],
    services: [
      'Collection',
      'Drop-off',
      'E-Waste Dismantling',
      'Rare Earth Recovery'
    ],
    pickupAvailable: true,
    operatingAreas: [
      'Bhubaneswar',
      'Cuttack',
      'Puri',
      'Khordha'
    ],
    minimumWeightKg: 2,
    paymentMethods: [
      'UPI',
      'Bank Transfer',
      'Cash'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0002',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-02T11:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0003',
    businessName: 'Kalinga Smelting & Metal Refiners',
    contactName: 'Bikram Sahu',
    phone: '+91 94399 44321',
    email: 'operations@kalingasmelters-demo.com',
    address: {
      area: 'Choudwar Industrial Corridor',
      city: 'Cuttack',
      state: 'Odisha',
      pincode: '754025'
    },
    acceptedMaterials: [
      'PCB',
      'Motor',
      'Cable',
      'Metal Chassis'
    ],
    services: [
      'Drop-off',
      'Bulk Recycling',
      'Copper Smelting'
    ],
    pickupAvailable: false,
    operatingAreas: [
      'Cuttack',
      'Bhubaneswar',
      'Jajpur'
    ],
    minimumWeightKg: 25,
    paymentMethods: [
      'Bank Transfer',
      'UPI'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0003',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-03T09:30:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0004',
    businessName: 'South Odisha EcoProcessors',
    contactName: 'Santosh Patnaik',
    phone: '+91 94372 77123',
    email: 'help@southodisha-recycle-demo.org',
    address: {
      area: 'Station Road',
      city: 'Berhampur',
      state: 'Odisha',
      pincode: '760001'
    },
    acceptedMaterials: [
      'Battery',
      'PCB',
      'Cable',
      'Plastic Casing'
    ],
    services: [
      'Collection',
      'Drop-off',
      'Secondary Refining'
    ],
    pickupAvailable: true,
    operatingAreas: [
      'Berhampur',
      'Ganjam',
      'Gunupur',
      'Gajapati'
    ],
    minimumWeightKg: 3,
    paymentMethods: [
      'Cash',
      'UPI'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0004',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-04T12:15:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0005',
    businessName: 'Western Maharashtra E-Dismantlers',
    contactName: 'Vikas Deshmukh',
    phone: '+91 98201 11223',
    email: 'plant@westmahadismantle-demo.co.in',
    address: {
      area: 'TTC Industrial Area, Turbhe',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '400705'
    },
    acceptedMaterials: [
      'PCB',
      'Laptop / Computer',
      'Mobile Phone',
      'LCD / Display',
      'Battery',
      'Cable'
    ],
    services: [
      'Collection',
      'Drop-off',
      'Industrial Crushing',
      'Precious Metal Extraction'
    ],
    pickupAvailable: true,
    operatingAreas: [
      'Mumbai',
      'Navi Mumbai',
      'Thane',
      'Panvel'
    ],
    minimumWeightKg: 10,
    paymentMethods: [
      'Bank Transfer',
      'UPI'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0005',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-05T08:45:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0006',
    businessName: 'Vanshdhara Green Metals',
    contactName: 'Rabin Kumar Jena',
    phone: '+91 94378 66543',
    email: 'contact@vanshdhara-metals-demo.in',
    address: {
      area: 'Main Market Road',
      city: 'Gunupur',
      state: 'Odisha',
      pincode: '765022'
    },
    acceptedMaterials: [
      'PCB',
      'Cable',
      'Battery',
      'Motor'
    ],
    services: [
      'Collection',
      'Drop-off',
      'Sorting & Aggregation'
    ],
    pickupAvailable: true,
    operatingAreas: [
      'Gunupur',
      'Rayagada',
      'Padmapur',
      'Gudari'
    ],
    minimumWeightKg: 1,
    paymentMethods: [
      'Cash',
      'UPI'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0006',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-06T14:20:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0007',
    businessName: 'ElectroRecycle SafeHazard Inc.',
    contactName: 'Pooja Iyer',
    phone: '+91 98219 87654',
    email: 'support@electrorecyclesafe-demo.com',
    address: {
      area: 'Kurla West Industrial Zone',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400070'
    },
    acceptedMaterials: [
      'Battery',
      'PCB',
      'LCD / Display'
    ],
    services: [
      'Drop-off',
      'Chemical Neutralization',
      'Thermal Pyrolysis'
    ],
    pickupAvailable: false,
    operatingAreas: [
      'Mumbai',
      'Dharavi',
      'Kurla'
    ],
    minimumWeightKg: 5,
    paymentMethods: [
      'UPI',
      'Bank Transfer'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0007',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-07T10:10:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0008',
    businessName: 'East Coast Secondary Smelters',
    contactName: 'Gouranga Pradhan',
    phone: '+91 94374 33211',
    email: 'eastcoastsmelters@demo-recycle.org',
    address: {
      area: 'Paradip Port Hinterland',
      city: 'Jagatsinghpur',
      state: 'Odisha',
      pincode: '754142'
    },
    acceptedMaterials: [
      'Motor',
      'Metal Chassis',
      'Cable',
      'PCB'
    ],
    services: [
      'Bulk Recycling',
      'Drop-off'
    ],
    pickupAvailable: false,
    operatingAreas: [
      'Jagatsinghpur',
      'Cuttack',
      'Bhubaneswar',
      'Kendrapara'
    ],
    minimumWeightKg: 50,
    paymentMethods: [
      'Bank Transfer'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0008',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-08T15:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0009',
    businessName: 'EcoShred Clean Earth Systems',
    contactName: 'Tapaswini Sahoo',
    phone: '+91 98615 67890',
    email: 'info@ecoshred-systems-demo.in',
    address: {
      area: 'Infocity Technology Corridor',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024'
    },
    acceptedMaterials: [
      'Mobile Phone',
      'Laptop / Computer',
      'PCB',
      'Battery',
      'Plastic Casing'
    ],
    services: [
      'Collection',
      'Drop-off',
      'Data Destruction',
      'Mechanical Shredding'
    ],
    pickupAvailable: true,
    operatingAreas: [
      'Bhubaneswar',
      'Cuttack',
      'Rayagada',
      'Gunupur'
    ],
    minimumWeightKg: 2,
    paymentMethods: [
      'UPI',
      'Cash',
      'Bank Transfer'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0009',
    status: 'active',
    sourceType: 'demo_seed',
    createdAt: '2026-09-09T09:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  },
  {
    recyclerId: 'REC-0010',
    businessName: 'Nav Durga Thermal Recovery (Decommissioned Plant)',
    contactName: 'Rajesh Agrawal',
    phone: '+91 94379 00000',
    email: 'archive@navdurga-demo.org',
    address: {
      area: 'Old By-Pass Road',
      city: 'Rourkela',
      state: 'Odisha',
      pincode: '769001'
    },
    acceptedMaterials: [
      'Metal Chassis',
      'Motor'
    ],
    services: [
      'Drop-off'
    ],
    pickupAvailable: false,
    operatingAreas: [
      'Rourkela',
      'Sundargarh'
    ],
    minimumWeightKg: 100,
    paymentMethods: [
      'Bank Transfer'
    ],
    verificationStatus: 'demo_verified',
    authorizationType: 'Demo Authorization Record',
    authorizationNumber: 'DEMO-AUTH-0010',
    status: 'inactive',
    sourceType: 'demo_seed',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    datasetVersion: '1.0'
  }
];
