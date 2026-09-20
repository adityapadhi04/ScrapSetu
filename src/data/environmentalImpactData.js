/**
 * ScrapSetu — Environmental Impact Reference Factors (Module 11)
 *
 * Transparent prototype factors for estimating environmental benefits of
 * channeling e-waste into formal reuse and authorized recycling streams.
 *
 * PROTOTYPE DISCLAIMER:
 * These are illustrative prototype factors based on material mass diversion
 * from open burning, informal acid leaching, and unlined municipal landfills.
 * They do not constitute official carbon credit certification or ISO Life Cycle Assessments.
 */

export const ENVIRONMENTAL_FACTORS = [
  {
    materialCategory: 'PCB',
    aliases: ['pcb', 'circuit board', 'motherboard', 'e-waste_pcb', 'electronic components'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Prevents virgin extraction of copper, gold, and tin; extends electronics lifespan by supplying functional microcomponents.',
    estimatedRecyclingBenefit: 'Diverts heavy metals (lead, antimony) from informal burning and groundwater contamination; supports circular secondary metals recovery.',
    divertedDescription: 'diverted from informal burning & open dumping',
    methodologyNote: 'Prototype factor — 1 kg collected e-waste equals 1 kg diverted from informal open dumping/burning.',
    version: '1.0'
  },
  {
    materialCategory: 'Cable',
    aliases: ['cable', 'cables', 'wire', 'wires', 'e-waste_cable', 'copper wire'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Supplies undamaged power and data cables directly to electrical appliance repairers without reprocessing.',
    estimatedRecyclingBenefit: 'Eliminates open-air PVC burning which releases hydrochloric acid smoke and toxic dioxins; yields high-purity secondary copper.',
    divertedDescription: 'diverted from open-wire combustion & unlined dumps',
    methodologyNote: 'Prototype factor — illustrative estimate based on direct mass recovery of copper without atmospheric burning.',
    version: '1.0'
  },
  {
    materialCategory: 'Battery',
    aliases: ['battery', 'batteries', 'e-waste_battery', 'li-ion', 'lead acid'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Recovers healthy individual cells from multi-cell packs for solar lighting, power banks, and backup kits.',
    estimatedRecyclingBenefit: 'Prevents toxic lead, cadmium, and lithium contamination of soil and drinking aquifers; enables closed-loop critical mineral recovery.',
    divertedDescription: 'safeguarded from hazardous landfill leaching',
    methodologyNote: 'Prototype factor — 100% of collected battery weight safely isolated from groundwater aquifers.',
    version: '1.0'
  },
  {
    materialCategory: 'Motor',
    aliases: ['motor', 'motors', 'e-waste_motor', 'transformer', 'fan motor'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'High reuse viability — electric motors, fans, and pump units can often be rewound or refurbished with simple bearing replacements.',
    estimatedRecyclingBenefit: 'Directly yields clean segregated scrap copper and electrical-grade steel sheets for foundry reuse.',
    divertedDescription: 'channeled to remanufacturing & circular metal reuse',
    methodologyNote: 'Prototype factor — direct mass conservation of heavy copper and electrical steel.',
    version: '1.0'
  },
  {
    materialCategory: 'LCD / Display',
    aliases: ['lcd / display', 'lcd/display', 'display', 'screen', 'monitor', 'e-waste_display'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Working display assemblies and control driver boards extend life of laptops and monitors.',
    estimatedRecyclingBenefit: 'Prevents mercury vapor release from broken CCFL backlights; isolates optical polarizers and specialized glass.',
    divertedDescription: 'isolated from glass breakage & mercury emission',
    methodologyNote: 'Prototype factor — safe capture of display glass and mercury-containing backlight components.',
    version: '1.0'
  },
  {
    materialCategory: 'Mobile Phone',
    aliases: ['mobile phone', 'mobile', 'smartphone', 'phone', 'e-waste_mobile'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Maximum circular economy impact: working screens, cameras, speakers, and modular boards provide affordable repair parts.',
    estimatedRecyclingBenefit: 'Concentrated source of critical and precious secondary minerals including gold, palladium, silver, and cobalt.',
    divertedDescription: 'retained in active circular reuse & closed recovery',
    methodologyNote: 'Prototype factor — mass diverted from informal backyard shredding and municipal waste.',
    version: '1.0'
  },
  {
    materialCategory: 'Laptop / Computer',
    aliases: ['laptop / computer', 'laptop/computer', 'laptop', 'computer', 'pc', 'e-waste_computer'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Modular parts (RAM, SSDs, keyboards, heatsinks, power supplies) directly support community computer refurbishment.',
    estimatedRecyclingBenefit: 'Clean separation of engineering plastics (ABS/polycarbonate) and aluminum chassis from electronic circuit boards.',
    divertedDescription: 'diverted to modular reuse and formal sorting',
    methodologyNote: 'Prototype factor — illustrative estimate based on device modularity and material recovery.',
    version: '1.0'
  },
  {
    materialCategory: 'Other E-waste',
    aliases: ['other e-waste', 'other', 'mixed e-waste', 'e-waste_other'],
    impactUnit: 'kg',
    estimatedAvoidedWasteKgPerKg: 1.0,
    estimatedReuseBenefit: 'Recovers switches, plugs, transformers, and plastic enclosures for secondary workshop utility.',
    estimatedRecyclingBenefit: 'Prevents non-biodegradable flame-retarded plastics from lingering in municipal dumps and burning.',
    divertedDescription: 'diverted from unsegregated municipal landfills',
    methodologyNote: 'Prototype factor — basic mass diversion of miscellaneous electronic scrap.',
    version: '1.0'
  }
];

export default ENVIRONMENTAL_FACTORS;
