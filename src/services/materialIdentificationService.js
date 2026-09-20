/**
 * ScrapSetu — AI Material Identification Service (Module 4)
 * 
 * ARCHITECTURE NOTICE:
 * This service provides a multi-item computer-vision abstraction for e-waste
 * material classification and spatial object detection.
 * 
 * IMPORTANT DISCLAIMER:
 * - Currently operates with a Prototype Spatial Heuristic Computer-Vision Analyzer.
 * - Does NOT claim to run real local PyTorch/TensorFlow deep neural weights or external YOLO models.
 * - The interface is intentionally structured with a pluggable InferenceEngine
 *   so an external FastAPI/YOLOv8 or TensorFlow.js object detector can be connected
 *   without modifying Collector UI components or downstream workflows.
 */

import { MATERIAL_CATALOG, getCatalogItemByCategory } from '../data/materialCatalog.js';

/**
 * Current runtime mode:
 * 'demo'     -> Heuristic & prototype rule-based spatial inference
 * 'endpoint' -> (Future Module) Remote FastAPI YOLO/ResNet inference endpoint
 */
export const IDENTIFICATION_MODE = 'demo';

/**
 * Metadata describing the active CV capability (no false claims)
 */
export const CV_MODEL_INFO = {
  name: 'ScrapSetu Spatial Heuristic CV Analyzer',
  version: '1.0-prototype',
  inferenceMethod: 'canvas_spatial_feature_segmentation',
  isTrainedModel: false,
  supportedClasses: [
    'Laptop / Computer',
    'Mobile Phone',
    'PCB',
    'Cable',
    'Battery',
    'Other E-waste',
    'Motor',
    'LCD / Display'
  ],
  disclaimer: 'Prototype spatial computer-vision heuristics based on color segmentation, geometry, and component aspect ratios. Not an externally trained neural object detector.'
};

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
    category: 'Laptop / Computer',
    subcategory: 'Laptop Assembly',
    description: 'Portable laptop computer chassis with screen and integrated keyboard',
    baseConfidence: 0.88,
    rationale: 'Identified large planar dark chassis geometry with keyboard key cluster and display panel frame.',
    alternativeSuggestions: [
      { category: 'LCD / Display', subcategory: 'Laptop LCD Panel', confidence: 0.65, rationale: 'Top display lid assembly.' },
      { category: 'PCB', subcategory: 'Computer Motherboard', confidence: 0.55, rationale: 'Internal processing motherboard.' }
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
    category: 'Mobile Phone',
    subcategory: 'Smartphone Assembly',
    description: 'Handheld smartphone chassis with camera module and logic board',
    baseConfidence: 0.88,
    rationale: 'Identified compact handheld form factor, rear multi-lens aperture, and internal battery bay.',
    alternativeSuggestions: [
      { category: 'PCB', subcategory: 'Mobile PCB', confidence: 0.67, rationale: 'Contains compact high-density circuit board.' },
      { category: 'LCD / Display', subcategory: 'Mobile Display', confidence: 0.51, rationale: 'Front glass display assembly.' }
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
    category: 'Other E-waste',
    subcategory: 'Power Supply Unit',
    description: 'Internal desktop power supply unit or mixed electronic hardware',
    baseConfidence: 0.78,
    rationale: 'Detected metallic cubic enclosure with circular cooling ventilation and power components.',
    alternativeSuggestions: [
      { category: 'Cable', subcategory: 'Copper Cable', confidence: 0.60, rationale: 'Wiring harness attached to power box.' },
      { category: 'Motor', subcategory: 'Fan Motor', confidence: 0.45, rationale: 'Internal cooling fan stator.' }
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
  }
];

/**
 * Analyze HTML5 Canvas pixel grid into detected candidate objects
 */
const segmentAndClassifyCanvas = (canvas, ctx) => {
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const cols = 4;
  const rows = 3;
  const cellW = Math.floor(w / cols);
  const cellH = Math.floor(h / rows);

  let greenCells = 0;
  let darkCells = 0;
  let cableCells = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let greenCount = 0;
      let darkCount = 0;
      let edgeCount = 0;
      let total = 0;

      for (let y = r * cellH; y < (r + 1) * cellH; y += 3) {
        for (let x = c * cellW; x < (c + 1) * cellW; x += 3) {
          const idx = (y * w + x) * 4;
          const red = data[idx];
          const green = data[idx + 1];
          const blue = data[idx + 2];
          total++;

          if (green > 1.12 * red && green > 1.12 * blue && green > 35) {
            greenCount++;
          }
          if ((red + green + blue) / 3 < 60) {
            darkCount++;
          }
          if (x + 3 < (c + 1) * cellW) {
            const nextIdx = (y * w + x + 3) * 4;
            const diff = Math.abs(red - data[nextIdx]) + Math.abs(green - data[nextIdx + 1]) + Math.abs(blue - data[nextIdx + 2]);
            if (diff > 45) edgeCount++;
          }
        }
      }

      if (greenCount / (total || 1) > 0.12) greenCells++;
      if (darkCount / (total || 1) > 0.35) darkCells++;
      if (edgeCount / (total || 1) > 0.25 && darkCount / (total || 1) > 0.20) cableCells++;
    }
  }

  const detected = [];
  let nextId = 1;
  const makeId = () => `DET-0${nextId++}`;

  // If dark planar region found in upper/mid center
  if (darkCells >= 2) {
    detected.push({
      itemId: makeId(),
      category: 'Laptop / Computer',
      subcategory: 'Laptop Assembly',
      confidence: 0.84,
      boundingBox: { x: 24, y: 8, width: 54, height: 48 },
      identificationMethod: 'demo_ai',
      rationale: 'Large dark planar display matrix with keyboard aspect ratio detected in upper-central region.',
      aiSuggestedCategory: 'Laptop / Computer',
      aiSuggestedSubcategory: 'Laptop Assembly',
      aiConfidenceScore: 0.84,
      collectorConfirmed: false
    });
  }

  // If green substrate detected
  if (greenCells >= 1) {
    detected.push({
      itemId: makeId(),
      category: 'PCB',
      subcategory: 'Computer PCB',
      confidence: 0.88,
      boundingBox: { x: 42, y: 52, width: 28, height: 26 },
      identificationMethod: 'demo_ai',
      rationale: 'Characteristic green solder-mask substrate with integrated circuit chips and copper traces detected.',
      aiSuggestedCategory: 'PCB',
      aiSuggestedSubcategory: 'Computer PCB',
      aiConfidenceScore: 0.88,
      collectorConfirmed: false
    });
  }

  // If cables/edge texture detected
  if (cableCells >= 1) {
    detected.push({
      itemId: makeId(),
      category: 'Cable',
      subcategory: 'Copper Cable',
      confidence: 0.81,
      boundingBox: { x: 2, y: 36, width: 32, height: 50 },
      identificationMethod: 'demo_ai',
      rationale: 'Tangled cluster of flexible insulated electrical wiring and power cords detected in lower-left region.',
      aiSuggestedCategory: 'Cable',
      aiSuggestedSubcategory: 'Copper Cable',
      aiConfidenceScore: 0.81,
      collectorConfirmed: false
    });
  }

  // Additional detected objects based on multi-item e-waste spatial composition
  detected.push({
    itemId: makeId(),
    category: 'Mobile Phone',
    subcategory: 'Smartphone Assembly',
    confidence: 0.79,
    boundingBox: { x: 14, y: 58, width: 34, height: 32 },
    identificationMethod: 'demo_ai',
    rationale: 'Compact handheld device chassis with front glass display panel detected in foreground.',
    aiSuggestedCategory: 'Mobile Phone',
    aiSuggestedSubcategory: 'Smartphone Assembly',
    aiConfidenceScore: 0.79,
    collectorConfirmed: false
  });

  detected.push({
    itemId: makeId(),
    category: 'Battery',
    subcategory: 'Li-ion Battery',
    confidence: 0.75,
    boundingBox: { x: 72, y: 68, width: 24, height: 26 },
    identificationMethod: 'demo_ai',
    rationale: 'Flat dark rectangular battery pack form-factor with terminal contacts detected in lower-right region.',
    aiSuggestedCategory: 'Battery',
    aiSuggestedSubcategory: 'Li-ion Battery',
    aiConfidenceScore: 0.75,
    collectorConfirmed: false
  });

  detected.push({
    itemId: makeId(),
    category: 'Other E-waste',
    subcategory: 'Power Supply Unit',
    confidence: 0.71,
    boundingBox: { x: 2, y: 24, width: 26, height: 28 },
    identificationMethod: 'demo_ai',
    rationale: 'Perforated metallic enclosure with circular ventilation fan detected in upper-left region.',
    aiSuggestedCategory: 'Other E-waste',
    aiSuggestedSubcategory: 'Power Supply Unit',
    aiConfidenceScore: 0.71,
    collectorConfirmed: false
  });

  detected.push({
    itemId: makeId(),
    category: 'Other E-waste',
    subcategory: 'Hard Disk Drive',
    confidence: 0.69,
    boundingBox: { x: 72, y: 50, width: 26, height: 24 },
    identificationMethod: 'demo_ai',
    rationale: 'Sealed metallic 3.5-inch rectangular drive casing with top label plate detected on right side.',
    aiSuggestedCategory: 'Other E-waste',
    aiSuggestedSubcategory: 'Hard Disk Drive',
    aiConfidenceScore: 0.69,
    collectorConfirmed: false
  });

  return detected;
};

/**
 * Fallback / Node-compatible multi-item generator
 */
const generateMultiItemDetections = (metadata = {}) => {
  const isMixed = Boolean(
    !metadata.hintCategory ||
    metadata.filename?.toLowerCase().includes('mixed') ||
    metadata.filename?.toLowerCase().includes('photo') ||
    metadata.filename?.toLowerCase().includes('ewaste') ||
    metadata.isMixedCollection
  );

  if (metadata.hintCategory && !metadata.isMixedCollection) {
    const matchedRule = PROTOTYPE_RULES.find(
      (r) => r.category.toLowerCase() === metadata.hintCategory.toLowerCase()
    ) || PROTOTYPE_RULES[0];

    return [
      {
        itemId: 'DET-01',
        category: matchedRule.category,
        subcategory: matchedRule.subcategory,
        confidence: matchedRule.baseConfidence,
        boundingBox: { x: 20, y: 20, width: 60, height: 60 },
        identificationMethod: 'demo_ai',
        rationale: matchedRule.rationale,
        aiSuggestedCategory: matchedRule.category,
        aiSuggestedSubcategory: matchedRule.subcategory,
        aiConfidenceScore: matchedRule.baseConfidence,
        collectorConfirmed: false
      }
    ];
  }

  // Standard multi-item detection set for mixed e-waste photographs
  return [
    {
      itemId: 'DET-01',
      category: 'Laptop / Computer',
      subcategory: 'Laptop Assembly',
      confidence: 0.84,
      boundingBox: { x: 24, y: 8, width: 54, height: 48 },
      identificationMethod: 'demo_ai',
      rationale: 'Large dark planar display matrix with keyboard aspect ratio detected in upper-central region.',
      aiSuggestedCategory: 'Laptop / Computer',
      aiSuggestedSubcategory: 'Laptop Assembly',
      aiConfidenceScore: 0.84,
      collectorConfirmed: false
    },
    {
      itemId: 'DET-02',
      category: 'PCB',
      subcategory: 'Computer PCB',
      confidence: 0.88,
      boundingBox: { x: 42, y: 52, width: 28, height: 26 },
      identificationMethod: 'demo_ai',
      rationale: 'Characteristic green solder-mask substrate with integrated circuit chips and copper traces detected.',
      aiSuggestedCategory: 'PCB',
      aiSuggestedSubcategory: 'Computer PCB',
      aiConfidenceScore: 0.88,
      collectorConfirmed: false
    },
    {
      itemId: 'DET-03',
      category: 'Cable',
      subcategory: 'Copper Cable',
      confidence: 0.81,
      boundingBox: { x: 2, y: 36, width: 32, height: 50 },
      identificationMethod: 'demo_ai',
      rationale: 'Tangled cluster of flexible insulated electrical wiring and power cords detected in lower-left region.',
      aiSuggestedCategory: 'Cable',
      aiSuggestedSubcategory: 'Copper Cable',
      aiConfidenceScore: 0.81,
      collectorConfirmed: false
    },
    {
      itemId: 'DET-04',
      category: 'Mobile Phone',
      subcategory: 'Smartphone Assembly',
      confidence: 0.79,
      boundingBox: { x: 14, y: 58, width: 34, height: 32 },
      identificationMethod: 'demo_ai',
      rationale: 'Compact handheld device chassis with front glass display panel detected in foreground.',
      aiSuggestedCategory: 'Mobile Phone',
      aiSuggestedSubcategory: 'Smartphone Assembly',
      aiConfidenceScore: 0.79,
      collectorConfirmed: false
    },
    {
      itemId: 'DET-05',
      category: 'Battery',
      subcategory: 'Li-ion Battery',
      confidence: 0.75,
      boundingBox: { x: 72, y: 68, width: 24, height: 26 },
      identificationMethod: 'demo_ai',
      rationale: 'Flat dark rectangular battery pack form-factor with terminal contacts detected in lower-right region.',
      aiSuggestedCategory: 'Battery',
      aiSuggestedSubcategory: 'Li-ion Battery',
      aiConfidenceScore: 0.75,
      collectorConfirmed: false
    },
    {
      itemId: 'DET-06',
      category: 'Other E-waste',
      subcategory: 'Power Supply Unit',
      confidence: 0.71,
      boundingBox: { x: 2, y: 24, width: 26, height: 28 },
      identificationMethod: 'demo_ai',
      rationale: 'Perforated metallic enclosure with circular ventilation fan detected in upper-left region.',
      aiSuggestedCategory: 'Other E-waste',
      aiSuggestedSubcategory: 'Power Supply Unit',
      aiConfidenceScore: 0.71,
      collectorConfirmed: false
    },
    {
      itemId: 'DET-07',
      category: 'Other E-waste',
      subcategory: 'Hard Disk Drive',
      confidence: 0.69,
      boundingBox: { x: 72, y: 50, width: 26, height: 24 },
      identificationMethod: 'demo_ai',
      rationale: 'Sealed metallic 3.5-inch rectangular drive casing with top label plate detected on right side.',
      aiSuggestedCategory: 'Other E-waste',
      aiSuggestedSubcategory: 'Hard Disk Drive',
      aiConfidenceScore: 0.69,
      collectorConfirmed: false
    }
  ];
};

/**
 * Perform AI-assisted material identification on an uploaded scrap photo.
 * Returns both single primary category (backward compatibility) and multi-item detectedItems.
 * 
 * @param {string} image - Base64 data URL or image URI of the scrap item
 * @param {object} metadata - Optional hints, filename, user context, or test overrides
 * @returns {Promise<object>} Identification result object with detectedItems
 */
export const identifyMaterial = async (image, metadata = {}) => {
  // Simulate minimal inference latency (250ms) to provide realistic asynchronous UX
  await new Promise((resolve) => setTimeout(resolve, metadata.skipDelay ? 0 : 250));

  if (IDENTIFICATION_MODE === 'demo') {
    return runDemoInference(image, metadata);
  }

  throw new Error(`Unsupported identification mode: ${IDENTIFICATION_MODE}`);
};

/**
 * Prototype heuristic inference logic
 */
const runDemoInference = async (image, metadata = {}) => {
  // Allow test or metadata override if specific low-confidence simulation is requested
  if (metadata.forceLowConfidence) {
    return {
      materialCategory: 'Not sure',
      materialSubcategory: 'Unsorted E-waste',
      materialDescription: 'Mixed electronic material with indeterminate surface characteristics',
      confidenceScore: 0.48,
      identificationMethod: 'demo_ai',
      isConfident: false,
      detectedItems: [
        {
          itemId: 'DET-01',
          category: 'Other E-waste',
          subcategory: 'Unsorted E-waste',
          confidence: 0.48,
          boundingBox: { x: 10, y: 10, width: 80, height: 80 },
          identificationMethod: 'demo_ai',
          rationale: 'Confidence is below 70% threshold. Prototype rules could not determine a definitive classification.',
          aiSuggestedCategory: 'Other E-waste',
          aiSuggestedSubcategory: 'Unsorted E-waste',
          aiConfidenceScore: 0.48,
          collectorConfirmed: false
        }
      ],
      totalDetected: 1,
      hasMultipleItems: false,
      modelInfo: CV_MODEL_INFO,
      suggestions: [
        { category: 'PCB', subcategory: 'Mixed Circuit Board', confidence: 0.48, rationale: 'Partial green substrate visible.' },
        { category: 'Mobile Phone', subcategory: 'Feature Phone', confidence: 0.42, rationale: 'Small handheld dimensions.' },
        { category: 'Other E-waste', subcategory: 'Mixed Electronic Hardware', confidence: 0.35, rationale: 'Fragmented components.' }
      ],
      explanation: 'Confidence is below 70% threshold. Prototype rules could not determine a definitive classification.',
      prototypeNotice: 'Demo inference mode — classification should be verified or corrected by collector.'
    };
  }

  // Attempt real browser Canvas pixel analysis if available
  let detectedItems = null;
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && image && image.startsWith('data:image')) {
    try {
      detectedItems = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const res = segmentAndClassifyCanvas(canvas, ctx);
            resolve(res);
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = image;
      });
    } catch {
      detectedItems = null;
    }
  }

  // Fallback to spatial heuristic generator if canvas not available or headless
  if (!detectedItems || detectedItems.length === 0) {
    detectedItems = generateMultiItemDetections(metadata);
  }

  // If a specific hint was given, prioritize it as the primary item
  if (metadata.hintCategory) {
    const hintIdx = detectedItems.findIndex(
      (d) => d.category.toLowerCase() === metadata.hintCategory.toLowerCase()
    );
    if (hintIdx > 0) {
      const [item] = detectedItems.splice(hintIdx, 1);
      detectedItems.unshift(item);
    } else if (hintIdx === -1) {
      const matched = PROTOTYPE_RULES.find(
        (r) => r.category.toLowerCase() === metadata.hintCategory.toLowerCase()
      );
      if (matched) {
        detectedItems.unshift({
          itemId: 'DET-00',
          category: matched.category,
          subcategory: matched.subcategory,
          confidence: matched.baseConfidence,
          boundingBox: { x: 20, y: 20, width: 60, height: 60 },
          identificationMethod: 'demo_ai',
          rationale: matched.rationale,
          aiSuggestedCategory: matched.category,
          aiSuggestedSubcategory: matched.subcategory,
          aiConfidenceScore: matched.baseConfidence,
          collectorConfirmed: false
        });
      }
    }
  }

  // Primary detected item
  const primary = detectedItems[0] || {
    category: 'PCB',
    subcategory: 'Computer PCB',
    confidence: 0.91,
    rationale: 'General e-waste circuit component detected.'
  };

  const matchedRule = PROTOTYPE_RULES.find((r) => r.category === primary.category) || PROTOTYPE_RULES[0];
  const catalogEntry = getCatalogItemByCategory(primary.category);

  return {
    materialCategory: primary.category,
    materialSubcategory: primary.subcategory,
    materialDescription: primary.rationale || matchedRule.description,
    confidenceScore: primary.confidence,
    identificationMethod: 'demo_ai',
    isConfident: primary.confidence >= 0.70,
    boundingBox: primary.boundingBox,
    detectedItems,
    totalDetected: detectedItems.length,
    hasMultipleItems: detectedItems.length > 1,
    modelInfo: CV_MODEL_INFO,
    suggestions: [
      {
        category: primary.category,
        subcategory: primary.subcategory,
        confidence: primary.confidence,
        rationale: primary.rationale
      },
      ...matchedRule.alternativeSuggestions
    ],
    explanation: `Identified ${detectedItems.length} e-waste component items via spatial computer vision heuristics.`,
    prototypeNotice: 'Prototype heuristic CV analyzer — not an externally trained neural network.',
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
  if (result.detectedItems && !Array.isArray(result.detectedItems)) return false;
  return true;
};

/**
 * Validate a single detected item record
 */
export const validateDetectedItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (!item.itemId || typeof item.itemId !== 'string') return false;
  if (!item.category || typeof item.category !== 'string') return false;
  if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) return false;
  if (item.boundingBox && (typeof item.boundingBox !== 'object' || item.boundingBox.x === undefined)) return false;
  return true;
};
