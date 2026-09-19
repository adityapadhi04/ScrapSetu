/**
 * ScrapSetu — AI Material Identification Service (Module 4)
 * 
 * ARCHITECTURE NOTICE:
 * This service provides a clean AI/inference service abstraction for e-waste
 * material classification. Currently operating in DEMO/PROTOTYPE mode.
 * 
 * IMPORTANT DISCLAIMER:
 * - This is a prototype inference service designed for SIH system architecture.
 * - It does NOT claim to run real local YOLO, OpenCV, or PyTorch weights in-browser.
 * - The interface is intentionally structured to be seamlessly connected to a future
 *   FastAPI + Computer Vision (YOLOv8 / ResNet) microservice without modifying
 *   the Collector UI or workflow.
 */

import { MATERIAL_CATALOG, getCatalogItemByCategory } from '../data/materialCatalog.js';

/**
 * Current runtime mode:
 * 'demo'     -> Heuristic & prototype rule-based inference
 * 'endpoint' -> (Future Module) Remote FastAPI inference endpoint
 */
export const IDENTIFICATION_MODE = 'demo';

/**
 * Prototype heuristic knowledge-base for demo simulations
 */
const PROTOTYPE_RULES = [
  {
    category: 'PCB',
    subcategory: 'Computer PCB',
    description: 'Printed Circuit Board with soldered microchips and copper traces',
    baseConfidence: 0.91,
    rationale: 'Identified planar substrate geometry, dual-in-line chip pinouts, and distinctive green solder-mask patterns.',
    alternativeSuggestions: [
      { category: 'Laptop / Computer', subcategory: 'Computer Motherboard', confidence: 0.68, rationale: 'Contains integrated processor sockets and heat sink mountings.' },
      { category: 'Mobile Phone', subcategory: 'Mobile PCB', confidence: 0.44, rationale: 'High-density component traces similar to smartphone mainboards.' }
    ]
  },
  {
    category: 'Cable',
    subcategory: 'Copper Cable',
    description: 'Stripped and sheathed high-conductivity copper conductor wiring',
    baseConfidence: 0.89,
    rationale: 'Detected elongated linear flexible bundle with exposed metallic copper conductive cores.',
    alternativeSuggestions: [
      { category: 'Motor', subcategory: 'Transformer Core', confidence: 0.52, rationale: 'Wound copper enamel wire resemblance.' },
      { category: 'Other E-waste', subcategory: 'Power Adapter', confidence: 0.38, rationale: 'Associated with AC power adapter cords.' }
    ]
  },
  {
    category: 'Battery',
    subcategory: 'Li-ion Battery',
    description: 'Lithium-ion polymer battery cell with safety caution markings',
    baseConfidence: 0.94,
    rationale: 'Recognized rectangular pouch cell envelope, metallic terminal tabs, and hazardous voltage labeling.',
    alternativeSuggestions: [
      { category: 'Mobile Phone', subcategory: 'Smartphone Assembly', confidence: 0.58, rationale: 'Form factor matching internal phone battery.' },
      { category: 'Other E-waste', subcategory: 'Mixed Electronic Hardware', confidence: 0.32, rationale: 'Unsealed chemical pack.' }
    ]
  },
  {
    category: 'Motor',
    subcategory: 'Appliance Motor',
    description: 'Electric stator rotor assembly with insulated copper windings',
    baseConfidence: 0.86,
    rationale: 'Identified cylindrical ferrous stator housing with dense copper electromagnetic windings.',
    alternativeSuggestions: [
      { category: 'Cable', subcategory: 'Copper Cable', confidence: 0.61, rationale: 'High-volume copper presence.' },
      { category: 'Other E-waste', subcategory: 'Mixed Electronic Hardware', confidence: 0.41, rationale: 'Heavy mechanical core.' }
    ]
  },
  {
    category: 'LCD / Display',
    subcategory: 'Laptop LCD Panel',
    description: 'Flat panel liquid crystal display matrix with ribbon connector',
    baseConfidence: 0.92,
    rationale: 'Detected rectangular glass thin-film matrix with polarizer sheen and rear LVDS flex ribbon.',
    alternativeSuggestions: [
      { category: 'Laptop / Computer', subcategory: 'Laptop Assembly', confidence: 0.64, rationale: 'Component belonging to portable computer.' },
      { category: 'Mobile Phone', subcategory: 'Smartphone Assembly', confidence: 0.45, rationale: 'Flat touchscreen resemblance.' }
    ]
  },
  {
    category: 'Mobile Phone',
    subcategory: 'Smartphone Assembly',
    description: 'Handheld smartphone chassis with camera module and logic board',
    baseConfidence: 0.88,
    rationale: 'Identified compact handheld form factor, rear multi-lens aperture, and internal battery bay.',
    alternativeSuggestions: [
      { category: 'PCB', subcategory: 'Mobile PCB', confidence: 0.67, rationale: 'Contains compact high-density circuit board.' },
      { category: 'LCD / Display', subcategory: 'Mobile Display', confidence: 0.51, rationale: 'Front glass display assembly.' }
    ]
  }
];

/**
 * Perform AI-assisted material identification on an uploaded scrap photo.
 * 
 * @param {string} image - Base64 data URL or image URI of the scrap item
 * @param {object} metadata - Optional hints, filename, user context, or test overrides
 * @returns {Promise<object>} Identification result object
 */
export const identifyMaterial = async (image, metadata = {}) => {
  // Simulate minimal inference latency (350ms) to provide realistic asynchronous UX
  await new Promise((resolve) => setTimeout(resolve, metadata.skipDelay ? 0 : 350));

  if (IDENTIFICATION_MODE === 'demo') {
    return runDemoInference(image, metadata);
  }

  // Future Module: remote endpoint call
  // const response = await fetch('/api/v1/inference/classify', { ... });
  // return response.json();
  throw new Error(`Unsupported identification mode: ${IDENTIFICATION_MODE}`);
};

/**
 * Prototype heuristic inference logic
 */
const runDemoInference = (image, metadata = {}) => {
  // Allow test or metadata override if specific category simulation is requested
  if (metadata.forceLowConfidence) {
    return {
      materialCategory: 'Not sure',
      materialSubcategory: 'Unsorted E-waste',
      materialDescription: 'Mixed electronic material with indeterminate surface characteristics',
      confidenceScore: 0.48,
      identificationMethod: 'demo_ai',
      isConfident: false,
      suggestions: [
        { category: 'PCB', subcategory: 'Mixed Circuit Board', confidence: 0.48, rationale: 'Partial green substrate visible.' },
        { category: 'Mobile Phone', subcategory: 'Feature Phone', confidence: 0.42, rationale: 'Small handheld dimensions.' },
        { category: 'Other E-waste', subcategory: 'Mixed Electronic Hardware', confidence: 0.35, rationale: 'Fragmented components.' }
      ],
      explanation: 'Confidence is below 70% threshold. Prototype rules could not determine a definitive classification.',
      prototypeNotice: 'Demo inference mode — classification should be verified or corrected by collector.'
    };
  }

  // If caller specified a preferred category hint
  let selectedRule = PROTOTYPE_RULES[0]; // Default to PCB
  if (metadata.hintCategory) {
    const matched = PROTOTYPE_RULES.find(
      (r) => r.category.toLowerCase() === metadata.hintCategory.toLowerCase()
    );
    if (matched) selectedRule = matched;
  } else if (metadata.filename) {
    const fn = metadata.filename.toLowerCase();
    const matched = PROTOTYPE_RULES.find((r) => fn.includes(r.category.toLowerCase()));
    if (matched) selectedRule = matched;
  }

  const catalogEntry = getCatalogItemByCategory(selectedRule.category);

  return {
    materialCategory: selectedRule.category,
    materialSubcategory: selectedRule.subcategory,
    materialDescription: selectedRule.description,
    confidenceScore: selectedRule.baseConfidence,
    identificationMethod: 'demo_ai',
    isConfident: selectedRule.baseConfidence >= 0.70,
    suggestions: [
      {
        category: selectedRule.category,
        subcategory: selectedRule.subcategory,
        confidence: selectedRule.baseConfidence,
        rationale: selectedRule.rationale
      },
      ...selectedRule.alternativeSuggestions
    ],
    explanation: 'Based on the uploaded image and available prototype classification rules.',
    prototypeNotice: 'Prototype inference mode — not a trained CV model.',
    catalogMeta: catalogEntry
  };
};

/**
 * Validate an identification result structure
 */
export const validateIdentificationResult = (result) => {
  if (!result || typeof result !== 'object') return false;
  if (!result.materialCategory || typeof result.materialCategory !== 'string') return false;
  if (!result.materialSubcategory || typeof result.materialSubcategory !== 'string') return false;
  if (typeof result.confidenceScore !== 'number' || result.confidenceScore < 0 || result.confidenceScore > 1) return false;
  if (!result.identificationMethod || !['demo_ai', 'manual', 'ml_model'].includes(result.identificationMethod)) return false;
  if (!Array.isArray(result.suggestions)) return false;
  return true;
};
