/**
 * ScrapSetu — Reuse Intelligence Service (Module 6)
 * 
 * Implements the "Reuse Before Recycle" decision layer mandated by the SIH26229 circular economy model.
 * Evaluates scrap materials to determine whether component harvesting / repair reuse is feasible
 * before routing materials to formal shredding and recycling.
 * 
 * IMPORTANT ARCHITECTURAL & TRANSPARENCY NOTICE:
 * Current reuse decisions operate under transparent, explainable prototype rules — NOT a black-box
 * or trained computer-vision / ML model. No claim of AI accuracy is made.
 * The clean function contract `evaluateReusePotential(...)` is designed to connect to an ML classifier
 * in future iterations without altering UI workflows.
 */

export const REUSE_PATHWAYS = {
  REUSE: 'reuse',
  RECYCLE: 'recycle',
  BOTH: 'both',
  UNKNOWN: 'unknown'
};

export const REUSE_CONFIDENCE = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Normalizes material categories to account for synonyms, catalog keys, and minor variations.
 */
function normalizeCategory(category = '') {
  const norm = String(category).toLowerCase().trim();
  if (norm.includes('pcb') || norm.includes('motherboard') || norm.includes('circuit')) return 'PCB';
  if (norm.includes('mobile') || norm.includes('phone') || norm.includes('smartphone')) return 'Mobile Phone';
  if (norm.includes('laptop') || norm.includes('computer') || norm === 'pc' || norm.includes('desktop')) return 'Laptop / Computer';
  if (norm.includes('lcd') || norm.includes('display') || norm.includes('screen') || norm.includes('monitor')) return 'LCD / Display';
  if (norm.includes('motor') || norm.includes('transformer')) return 'Motor';
  if (norm.includes('battery') || norm.includes('cell') || norm.includes('power pack')) return 'Battery';
  if (norm.includes('cable') || norm.includes('wire') || norm.includes('copper')) return 'Cable';
  if (norm.includes('adapter') || norm.includes('smps') || norm.includes('charger')) return 'Power Supply / Adapter';
  return category.trim() || 'Other E-waste';
}

/**
 * Normalizes condition string
 */
function normalizeCondition(condition = '') {
  const cond = String(condition).toLowerCase().trim();
  if (cond.includes('good') || cond.includes('intact')) return 'good';
  if (cond.includes('fair') || cond.includes('average')) return 'fair';
  if (cond.includes('damaged') || cond.includes('broken') || cond.includes('cracked')) return 'damaged';
  if (cond.includes('mixed') || cond.includes('unsorted')) return 'mixed';
  return 'fair';
}

/**
 * Evaluates the reuse potential of an identified scrap item based on transparent domain rules.
 * 
 * @param {Object} params
 * @param {string} params.materialCategory - e.g. "Mobile Phone", "PCB", "Battery"
 * @param {string} [params.materialSubcategory] - e.g. "Smartphone Assembly", "Laptop Motherboard"
 * @param {string} params.condition - "good" | "fair" | "damaged" | "mixed"
 * @param {number|string} [params.weight] - Approximate weight in kg
 * @returns {Object} Structured decision contract
 */
export function evaluateReusePotential({
  materialCategory = '',
  materialSubcategory = '',
  condition = 'fair',
  weight = 0
} = {}) {
  const category = normalizeCategory(materialCategory);
  const cond = normalizeCondition(condition);
  const parsedWeight = parseFloat(weight) || 0;

  let pathway = REUSE_PATHWAYS.UNKNOWN;
  let confidence = REUSE_CONFIDENCE.MEDIUM;
  let reason = '';
  let suggestedActions = [];

  switch (category) {
    case 'Mobile Phone':
      if (cond === 'good') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Intact mobile devices have high reuse value for functional screens, camera modules, daughterboards, and repairable logic boards.';
        suggestedActions = [
          'Connect with local mobile repair centers for parts purchase',
          'Offer for diagnostic repair or screen recovery before scrap lotting'
        ];
      } else if (cond === 'fair') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Minor cosmetic wear does not prevent harvesting valuable AMOLED/IPS displays, cameras, charging ports, and internal flex ribbons.';
        suggestedActions = [
          'Check with repair shops for component harvesting',
          'Salvage intact display assembly'
        ];
      } else if (cond === 'damaged') {
        pathway = REUSE_PATHWAYS.BOTH;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Even damaged mobile phones often retain undamaged IC chips, micro-connectors, and chassis components. Unsalvageable frames proceed to recyclers.';
        suggestedActions = [
          'Allow repair technician to extract surviving components',
          'Send remaining stripped scrap to authorized recyclers'
        ];
      } else {
        pathway = REUSE_PATHWAYS.BOTH;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Mixed mobile scrap contains a blend of salvageable parts and degraded scrap.';
        suggestedActions = ['Pre-sort for salvageable screens before recycling'];
      }
      break;

    case 'Laptop / Computer':
      if (cond === 'good' || cond === 'fair') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Laptops and computers possess modular salvageable subsystems: RAM modules, SSD/HDD storage, keyboard assemblies, and cooling fans.';
        suggestedActions = [
          'Offer to IT repair technicians and refurbished PC specialists',
          'Test and harvest RAM and display panel before destruction'
        ];
      } else if (cond === 'damaged') {
        pathway = REUSE_PATHWAYS.BOTH;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Heavily damaged computing units may have intact power delivery MOSFETs, heat pipes, and ports. Shredding remainder yields copper and gold recovery.';
        suggestedActions = [
          'Harvest surviving surface-mount components',
          'Forward non-functional chassis to formal recycler'
        ];
      } else {
        pathway = REUSE_PATHWAYS.BOTH;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Mixed computer scrap can yield modular parts like RAM and adapters before raw board shredding.';
        suggestedActions = ['Inspect for modular RAM/DRAM before bulk processing'];
      }
      break;

    case 'LCD / Display':
      if (cond === 'good') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Uncracked LCD and LED panels are in high demand by laptop and monitor repair shops as direct OEM replacement units.';
        suggestedActions = [
          'Sell directly to repair shops as replacement screens',
          'Avoid mechanical stress during handling to maintain salvage value'
        ];
      } else if (cond === 'fair') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Screens with minor scratches may still have functional backlights, T-Con boards, and inverter logic boards suitable for repair salvage.';
        suggestedActions = [
          'Salvage internal driver boards and LED backlight strips',
          'Offer to display repair specialists'
        ];
      } else {
        pathway = REUSE_PATHWAYS.BOTH;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Cracked glass has zero display value, but driver controller boards and aluminum backplates can be salvaged prior to recycling.';
        suggestedActions = [
          'Remove intact T-Con board if present',
          'Send cracked glass panel to safe e-waste recycler'
        ];
      }
      break;

    case 'PCB':
      if (cond === 'good' || cond === 'fair') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Intact circuit boards contain usable microcontrollers, voltage regulators, capacitors, and ICs that local repair technicians desolder for repair.';
        suggestedActions = [
          'Offer to electronic repair and salvage technicians',
          'Inspect for intact high-value ICs and chips'
        ];
      } else {
        pathway = REUSE_PATHWAYS.RECYCLE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Damaged, cracked, or burnt circuit boards are difficult to salvage safely. They should be sent directly to authorized recyclers for pyrometallurgical copper and precious metal recovery.';
        suggestedActions = [
          'Route directly to CPCB-authorized recycler for material extraction',
          'Do not incinerate or acid-wash informally'
        ];
      }
      break;

    case 'Motor':
      if (cond === 'good' || cond === 'fair') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Functional electric appliance motors (mixers, fans, pumps) can be rewound or directly reused in refurbished household appliances.';
        suggestedActions = [
          'Offer to local appliance repair workshops',
          'Test rotor rotation and bearing condition'
        ];
      } else {
        pathway = REUSE_PATHWAYS.RECYCLE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Burnt or seized motor cores are non-repairable and should be recycled for pure copper winding and electrical steel extraction.';
        suggestedActions = [
          'Provide to authorized recycler for mechanical copper stripping'
        ];
      }
      break;

    case 'Battery':
      // Battery Safety Protocol: Damaged batteries are hazardous and should NEVER go to repair shops
      if (cond === 'damaged' || cond === 'mixed') {
        pathway = REUSE_PATHWAYS.RECYCLE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Damaged, swollen, or punctured batteries present severe chemical and thermal runaway fire risks. Repair or informal reuse is dangerous. Formal recycling is strictly recommended.';
        suggestedActions = [
          'Route immediately to authorized hazardous e-waste recycler',
          'Handle with insulation and keep away from heat sources'
        ];
      } else {
        pathway = REUSE_PATHWAYS.RECYCLE;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Lithium-ion and lead-acid batteries require specialized diagnostic testing and certified refurbishment. For informal scrap lots, authorized recycling is recommended.';
        suggestedActions = [
          'Formal recycling through certified e-waste channels recommended',
          'Ensure terminals are taped during transport'
        ];
      }
      break;

    case 'Cable':
      if (cond === 'good' || cond === 'fair') {
        pathway = REUSE_PATHWAYS.BOTH;
        confidence = REUSE_CONFIDENCE.MEDIUM;
        reason = 'Intact power cords and standard data cables can be reused directly, while bulk wiring is recycled for high-grade copper content.';
        suggestedActions = [
          'Separate functional power cords for repair shop reuse',
          'Recycle stripped copper cabling'
        ];
      } else {
        pathway = REUSE_PATHWAYS.RECYCLE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Damaged and frayed cables are sent to formal recyclers with mechanical granulators to recover clean copper without toxic burning.';
        suggestedActions = [
          'Route to authorized recycler with zero-burn mechanical stripper'
        ];
      }
      break;

    case 'Power Supply / Adapter':
      if (cond === 'good' || cond === 'fair') {
        pathway = REUSE_PATHWAYS.REUSE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'OEM power adapters and desktop SMPS units are frequently sought by repair technicians to power test benches and replace broken customer chargers.';
        suggestedActions = [
          'Test voltage output and offer to computer repair shops',
          'Check cord integrity'
        ];
      } else {
        pathway = REUSE_PATHWAYS.RECYCLE;
        confidence = REUSE_CONFIDENCE.HIGH;
        reason = 'Blown power supplies with leaking electrolytic capacitors should be formally recycled.';
        suggestedActions = ['Recycle with certified e-waste processors'];
      }
      break;

    default:
      pathway = REUSE_PATHWAYS.UNKNOWN;
      confidence = REUSE_CONFIDENCE.LOW;
      reason = 'Unclassified or mixed e-waste requires manual physical inspection by an authorized technician to determine salvage feasibility.';
      suggestedActions = [
        'Request manual inspection by nearby repair specialist or aggregator',
        'Sort into recognized material categories'
      ];
      break;
  }

  return {
    pathway,
    confidence,
    reason,
    suggestedActions,
    category,
    condition: cond,
    weightKg: parsedWeight,
    isPrototype: true,
    prototypeNotice: 'Transparent prototype rules — not a trained classifier.'
  };
}
