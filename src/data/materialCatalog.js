/**
 * ScrapSetu — Centralized Material Catalog (Module 4)
 * Central catalog of e-waste categories, subcategories, metadata, and dataset mapping.
 * Provides extensible foundation for AI inference and SIH Material Dataset.
 */

export const MATERIAL_CATALOG = [
  {
    id: 'pcb',
    materialCategory: 'PCB',
    datasetLabel: 'e-waste_pcb',
    displayName: 'PCB',
    nameKey: 'materialPcb',
    categoryKey: 'categoryElectronicComponents',
    category: 'Electronic Components',
    icon: '💻',
    color: '#15803d',
    bg: '#dcfce7',
    description: 'Printed circuit boards containing copper traces, soldered microcontrollers, resistors, and connectors.',
    subcategories: [
      'Computer PCB',
      'Mobile PCB',
      'Power Supply PCB',
      'Mixed Circuit Board'
    ],
    defaultSubcategory: 'Computer PCB',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'cable',
    materialCategory: 'Cable',
    datasetLabel: 'e-waste_cable',
    displayName: 'Cable',
    nameKey: 'materialCable',
    categoryKey: 'categoryCablesWires',
    category: 'Cables & Wires',
    icon: '🔌',
    color: '#0284c7',
    bg: '#e0f2fe',
    description: 'Insulated copper and aluminum electrical wiring, charging cables, and ribbon cords.',
    subcategories: [
      'Copper Cable',
      'Power Cable',
      'Data Cable',
      'Mixed Wiring'
    ],
    defaultSubcategory: 'Copper Cable',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'battery',
    materialCategory: 'Battery',
    datasetLabel: 'e-waste_battery',
    displayName: 'Battery',
    nameKey: 'materialBattery',
    categoryKey: 'categoryBatteries',
    category: 'Batteries',
    icon: '🔋',
    color: '#b91c1c',
    bg: '#fee2e2',
    description: 'Rechargeable and single-use battery packs requiring isolated fire-safe handling.',
    subcategories: [
      'Li-ion Battery',
      'Lead Acid Battery',
      'Mobile Battery Pack',
      'Nickel-Cadmium Cell'
    ],
    defaultSubcategory: 'Li-ion Battery',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'motor',
    materialCategory: 'Motor',
    datasetLabel: 'e-waste_motor',
    displayName: 'Motor',
    nameKey: 'materialMotor',
    categoryKey: 'categoryMotors',
    category: 'Motors',
    icon: '⚡',
    color: '#d97706',
    bg: '#fef3c7',
    description: 'Electric motors, stators, and transformers containing high-purity copper windings.',
    subcategories: [
      'Fan Motor',
      'Appliance Motor',
      'Transformer Core',
      'Stepping Motor'
    ],
    defaultSubcategory: 'Appliance Motor',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'display',
    materialCategory: 'LCD / Display',
    datasetLabel: 'e-waste_display',
    displayName: 'LCD / Display',
    nameKey: 'materialDisplay',
    categoryKey: 'categoryDisplays',
    category: 'Displays',
    icon: '🖥️',
    color: '#4f46e5',
    bg: '#e0e7ff',
    description: 'Flat panel liquid crystal and LED displays from laptops, televisions, and monitors.',
    subcategories: [
      'Laptop LCD Panel',
      'Monitor Screen',
      'Television Panel',
      'Industrial Display'
    ],
    defaultSubcategory: 'Laptop LCD Panel',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'mobile',
    materialCategory: 'Mobile Phone',
    datasetLabel: 'e-waste_mobile',
    displayName: 'Mobile Phone',
    nameKey: 'materialMobile',
    categoryKey: 'categoryMobileDevices',
    category: 'Mobile Devices',
    icon: '📱',
    color: '#059669',
    bg: '#d1fae5',
    description: 'Complete or dismantled smartphones, feature phones, and handheld communications devices.',
    subcategories: [
      'Smartphone Assembly',
      'Feature Phone',
      'Mobile Chassis',
      'Tablet Unit'
    ],
    defaultSubcategory: 'Smartphone Assembly',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'laptop',
    materialCategory: 'Laptop / Computer',
    datasetLabel: 'e-waste_computer',
    displayName: 'Laptop / Computer',
    nameKey: 'materialLaptop',
    categoryKey: 'categoryComputingDevices',
    category: 'Computing Devices',
    icon: '💻',
    color: '#7c3aed',
    bg: '#ede9fe',
    description: 'Computing motherboards, desktop CPU towers, server units, and laptop chassis.',
    subcategories: [
      'Laptop Assembly',
      'Desktop Tower CPU',
      'Server Unit',
      'Computer Motherboard'
    ],
    defaultSubcategory: 'Laptop Assembly',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'other',
    materialCategory: 'Other E-waste',
    datasetLabel: 'e-waste_other',
    displayName: 'Other E-waste',
    nameKey: 'materialOther',
    categoryKey: 'categoryOtherEwaste',
    category: 'Other E-waste',
    icon: '📦',
    color: '#475569',
    bg: '#f1f5f9',
    description: 'Miscellaneous electronic waste including adapters, keyboards, plastics, and peripheral hardware.',
    subcategories: [
      'Power Adapter',
      'Peripheral Keyboard/Mouse',
      'Plastic Casing / Shell',
      'Mixed Electronic Hardware'
    ],
    defaultSubcategory: 'Power Adapter',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'unclassified',
    materialCategory: 'Not sure',
    datasetLabel: 'e-waste_unclassified',
    displayName: 'Not sure — identify later',
    nameKey: 'notSureIdentifyLater',
    categoryKey: 'categoryUnclassified',
    category: 'Unclassified',
    icon: '❓',
    color: '#64748b',
    bg: '#f8fafc',
    description: 'Unclassified scrap lot requiring manual inspection, laboratory verification, or grading.',
    subcategories: [
      'Unsorted E-waste',
      'Unknown Component',
      'Mixed Residue'
    ],
    defaultSubcategory: 'Unsorted E-waste',
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
];

/**
 * Backward-compatible mapping for existing Module 3 components
 */
export const MATERIAL_OPTIONS = MATERIAL_CATALOG.map((item) => ({
  type: item.materialCategory,
  category: item.category,
  nameKey: item.nameKey,
  categoryKey: item.categoryKey,
  fallbackName: item.displayName,
  icon: item.icon,
  color: item.color,
  bg: item.bg,
  subcategories: item.subcategories,
  defaultSubcategory: item.defaultSubcategory
}));

/**
 * Find catalog item by material category name (e.g. 'PCB', 'Cable')
 */
export const getCatalogItemByCategory = (categoryName) => {
  if (!categoryName) return null;
  const normalized = categoryName.trim().toLowerCase();
  return (
    MATERIAL_CATALOG.find(
      (c) =>
        c.materialCategory.toLowerCase() === normalized ||
        c.id.toLowerCase() === normalized ||
        c.displayName.toLowerCase() === normalized
    ) || null
  );
};

/**
 * Retrieve all registered material categories
 */
export const getAllMaterialCategories = () => {
  return MATERIAL_CATALOG.map((c) => c.materialCategory);
};
