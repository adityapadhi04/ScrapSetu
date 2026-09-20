/**
 * ScrapSetu — Material Safety Catalog (Module 11)
 *
 * Structured safety and safe-handling guidance for informal scrap collectors
 * and handlers dealing with common e-waste streams.
 *
 * PROTOTYPE DISCLAIMER:
 * These guidelines are educational prototype classifications to help informal
 * waste pickers avoid hazardous practices (burning cables, puncturing lithium batteries).
 * They do not constitute formal hazardous-material certification or industrial legal compliance.
 */

export const HAZARD_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const SAFETY_CATALOG = [
  {
    id: 'battery',
    materialCategory: 'Battery',
    aliases: ['battery', 'batteries', 'e-waste_battery', 'li-ion', 'lead acid'],
    hazardLevel: HAZARD_LEVELS.HIGH,
    icon: '🔋',
    color: '#b91c1c',
    bg: '#fee2e2',
    borderColor: '#fca5a5',
    titleKey: 'safetyBatteryTitle',
    handlingGuidance: [
      'Tape exposed metal terminals with non-conductive electrical tape to prevent short circuits.',
      'Wear protective gloves and eye protection when handling heavy or swelling cells.',
      'Keep dry; store in dedicated non-metallic, fire-resistant containers away from combustible scrap.',
      'Handle swollen or bloated batteries with extreme care without applying pressure.'
    ],
    doNotActions: [
      'DO NOT puncture, crush, hammer, or bend battery cells.',
      'DO NOT expose to open flame, sparks, or direct sunlight.',
      'DO NOT submerge in water or leave in rain puddles.',
      'DO NOT mix damaged or leaking batteries with undamaged ones.',
      'DO NOT attempt informal chemical acid extraction or burning.'
    ],
    storageGuidance: [
      'Store in a cool, well-ventilated dry area isolated from flammable materials.',
      'Use sand or vermiculite buckets for damaged, swelling, or leaking cells.',
      'Keep away from living areas and sleeping spaces.'
    ],
    transportGuidance: [
      'Pack tightly in insulated plastic bins so terminals do not touch or rub together during transit.',
      'Do not stack heavy items on top of battery boxes.',
      'Secure cargo so containers do not tip or bounce.'
    ],
    recommendedPath: 'Authorized Recycler equipped for battery recovery',
    emergencyNote: 'If leaking acid occurs, neutralise with baking soda or dry sand. In case of smoke or fire, do not inhale fumes; use dry powder extinguisher or sand, never water on lithium fires.',
    conditionOverrides: {
      damaged: {
        hazardLevel: HAZARD_LEVELS.HIGH,
        urgentWarning: 'CRITICAL HAZARD: Damaged or ruptured battery has immediate thermal runaway and acid burn risk. Isolate immediately in dry sand.'
      },
      burnt: {
        hazardLevel: HAZARD_LEVELS.HIGH,
        urgentWarning: 'Toxic chemical residues present. Do not touch bare-handed; place in sealed container.'
      }
    },
    version: '1.0'
  },
  {
    id: 'pcb',
    materialCategory: 'PCB',
    aliases: ['pcb', 'circuit board', 'motherboard', 'e-waste_pcb', 'electronic components'],
    hazardLevel: HAZARD_LEVELS.MEDIUM,
    icon: '💻',
    color: '#d97706',
    bg: '#fef3c7',
    borderColor: '#fde68a',
    titleKey: 'safetyPcbTitle',
    handlingGuidance: [
      'Wear cut-resistant gloves to protect hands from sharp soldered pins and fiberglass edges.',
      'Handle by board edges rather than snatching delicate surface-mount ICs.',
      'Wear a dust mask if sorting dusty or aged circuit boards in enclosed sheds.',
      'Identify complete, undamaged boards for high-value repair shop reuse before recycling.'
    ],
    doNotActions: [
      'DO NOT burn circuit boards to recover precious metals (releases carcinogenic dioxins and lead fumes).',
      'DO NOT use open acid baths (aqua regia, cyanide) in residential areas or informal setups.',
      'DO NOT smash or grind dry boards without mechanical ventilation (generates inhalable toxic dust).',
      'DO NOT allow children or family members near acid or smelting areas.'
    ],
    storageGuidance: [
      'Keep flat and sheltered from moisture to prevent trace corrosion.',
      'Stack horizontally in shallow bins or cardboard boxes with dividers.',
      'Separate high-grade computer motherboards from lower-grade brown paper-phenolic boards.'
    ],
    transportGuidance: [
      'Bundle securely to prevent board flexing or shattering into sharp splinters.',
      'Cover with tarpaulin during rainy transport.'
    ],
    recommendedPath: 'Repair Shop (if intact for harvesting) or Authorized Recycler (closed-loop hydrometallurgical recovery)',
    emergencyNote: 'If cut by soldered pins, wash immediately with antiseptic soap and water; consult healthcare worker if deeply punctured by lead solder.',
    conditionOverrides: {
      damaged: {
        hazardLevel: HAZARD_LEVELS.MEDIUM,
        urgentWarning: 'Broken fiberglass board fragments are sharp and shed lead-bearing dust. Handle with thick gloves.'
      },
      burnt: {
        hazardLevel: HAZARD_LEVELS.HIGH,
        urgentWarning: 'Burnt boards contain toxic dioxin residues. Wear mask and gloves; do not breathe residues.'
      }
    },
    version: '1.0'
  },
  {
    id: 'cable',
    materialCategory: 'Cable',
    aliases: ['cable', 'cables', 'wire', 'wires', 'e-waste_cable', 'copper wire'],
    hazardLevel: HAZARD_LEVELS.LOW,
    icon: '🔌',
    color: '#0284c7',
    bg: '#e0f2fe',
    borderColor: '#bae6fd',
    titleKey: 'safetyCableTitle',
    handlingGuidance: [
      'Use mechanical wire strippers or manual peelers to separate copper from PVC insulation.',
      'Wear utility gloves when pulling or coiling wires to prevent friction blisters and cuts.',
      'Sort cables into categories: thick single-core, flexible multi-strand, and data ribbons for best price.'
    ],
    doNotActions: [
      'DO NOT burn insulation off wires (open wire burning releases highly toxic hydrochloric acid and dioxin smoke).',
      'DO NOT burn wires in residential streets, backyards, or open fields.',
      'DO NOT breathe black fumes from heated PVC or rubber cords.'
    ],
    storageGuidance: [
      'Coil neatly and tie with scrap wire to avoid large tangled mounds that create trip hazards.',
      'Keep off damp ground to prevent oxidation of exposed copper tips.'
    ],
    transportGuidance: [
      'Bundle into tied sacks or coiled bundles. Easy to load and weigh accurately.'
    ],
    recommendedPath: 'Mechanical Granulation Recycler or Metal Smelting Partner',
    emergencyNote: 'Smoke inhalation from PVC combustion requires immediate relocation to fresh air. Seek medical care if chest tightness develops.',
    conditionOverrides: {
      burnt: {
        hazardLevel: HAZARD_LEVELS.MEDIUM,
        urgentWarning: 'Previously charred insulation can shed irritating carbon soot. Wear gloves and mask.'
      }
    },
    version: '1.0'
  },
  {
    id: 'display',
    materialCategory: 'LCD / Display',
    aliases: ['lcd / display', 'lcd/display', 'display', 'screen', 'monitor', 'e-waste_display'],
    hazardLevel: HAZARD_LEVELS.MEDIUM,
    icon: '🖥️',
    color: '#4f46e5',
    bg: '#e0e7ff',
    borderColor: '#c7d2fe',
    titleKey: 'safetyDisplayTitle',
    handlingGuidance: [
      'Wear safety goggles and puncture-resistant gloves when handling display panels.',
      'Carry panels vertically by the bezel or frame, never by pulling on ribbon cables.',
      'Inspect older CCFL backlit screens carefully — their miniature fluorescent tubes contain trace mercury.'
    ],
    doNotActions: [
      'DO NOT crush, shatter, or step on LCD screens.',
      'DO NOT break cold cathode backlight tubes (releases invisible mercury vapor).',
      'DO NOT dump cracked LCD panels near water sources or soil.'
    ],
    storageGuidance: [
      'Store vertically on cushioned edges (cardboard or rubber mats).',
      'Cover screen faces with scrap cardboard to prevent impact damage.'
    ],
    transportGuidance: [
      'Stand upright in transit with cardboard padding between panels. Do not lay flat under heavy weights.'
    ],
    recommendedPath: 'Authorized E-Waste Dismantler with specialized mercury and glass recovery',
    emergencyNote: 'If glass breaks and liquid crystal fluid contacts skin, wash immediately with warm soapy water for 15 minutes. If an older CCFL tube breaks, ventilate the room for 15 minutes before cleanup.',
    conditionOverrides: {
      damaged: {
        hazardLevel: HAZARD_LEVELS.HIGH,
        urgentWarning: 'Shattered glass and potential liquid crystal or mercury leakage. Wear eye protection and thick gloves.'
      }
    },
    version: '1.0'
  },
  {
    id: 'mobile',
    materialCategory: 'Mobile Phone',
    aliases: ['mobile phone', 'mobile', 'smartphone', 'phone', 'e-waste_mobile'],
    hazardLevel: HAZARD_LEVELS.LOW,
    icon: '📱',
    color: '#059669',
    bg: '#d1fae5',
    borderColor: '#a7f3d0',
    titleKey: 'safetyMobileTitle',
    handlingGuidance: [
      'Check if device is intact before dismantling; intact devices fetch significantly higher value at repair shops.',
      'If dismantling, remove the battery gently using plastic pry tools, never metal screwdrivers.',
      'Keep display assemblies, cameras, and charging ports intact for spare parts harvesting.'
    ],
    doNotActions: [
      'DO NOT pry glued-in lithium batteries with sharp metal blades (can pierce the pouch and cause a fireball).',
      'DO NOT heat glued phone bodies over open cooking stoves or direct fire.'
    ],
    storageGuidance: [
      'Store in clean plastic crates sorted by brand or intactness.',
      'Remove loose swollen batteries and isolate them in safety sand buckets.'
    ],
    transportGuidance: [
      'Pack in cushioned crates to preserve display and glass backs from cracking during transport.'
    ],
    recommendedPath: 'Repair Shop (first priority for parts reuse) → Authorized Recycler (precious metals)',
    emergencyNote: 'If a phone battery begins hissing or swelling, drop the device immediately into a metal bucket or on bare dirt. Do not inhale the white vapor.',
    conditionOverrides: {
      damaged: {
        hazardLevel: HAZARD_LEVELS.MEDIUM,
        urgentWarning: 'Cracked phone glass and potentially compromised battery pouch inside. Inspect battery before opening.'
      }
    },
    version: '1.0'
  },
  {
    id: 'laptop',
    materialCategory: 'Laptop / Computer',
    aliases: ['laptop / computer', 'laptop/computer', 'laptop', 'computer', 'pc', 'e-waste_computer'],
    hazardLevel: HAZARD_LEVELS.LOW,
    icon: '💻',
    color: '#7c3aed',
    bg: '#ede9fe',
    borderColor: '#ddd6fe',
    titleKey: 'safetyLaptopTitle',
    handlingGuidance: [
      'Test for power or screen life if chargers are available; working units are high-value reuse candidates.',
      'Remove battery pack safely before opening chassis.',
      'Carefully harvest RAM modules, SSDs/HDDs, Wi-Fi cards, and copper heat pipes for component reuse.'
    ],
    doNotActions: [
      'DO NOT smash computer towers with sledgehammers (breaks glass panels, motherboards, and capacitors).',
      'DO NOT puncture internal pouch batteries in modern ultrabooks.'
    ],
    storageGuidance: [
      'Stack horizontally in dry rooms. Keep high-value harvested RAM and CPU chips in antistatic or plastic pill boxes.'
    ],
    transportGuidance: [
      'Transport in covered vehicles; tie securely to prevent tower cases from shifting and crashing.'
    ],
    recommendedPath: 'Repair Shop (modules/refurbishment) or Authorized Recycler (metals/plastics)',
    emergencyNote: 'Discharge power supplies before opening desktop towers to avoid residual high-voltage capacitor shock.',
    conditionOverrides: {
      damaged: {
        hazardLevel: HAZARD_LEVELS.MEDIUM,
        urgentWarning: 'Broken plastic chassis, exposed sharp metal frames, and broken screen glass. Wear gloves.'
      }
    },
    version: '1.0'
  },
  {
    id: 'motor',
    materialCategory: 'Motor',
    aliases: ['motor', 'motors', 'e-waste_motor', 'transformer', 'fan motor'],
    hazardLevel: HAZARD_LEVELS.LOW,
    icon: '⚡',
    color: '#d97706',
    bg: '#fef3c7',
    borderColor: '#fde68a',
    titleKey: 'safetyMotorTitle',
    handlingGuidance: [
      'Lift with bent knees and keep heavy motor assemblies close to your body to prevent back injury.',
      'Check if motor windings or bearings can be serviced before uncoiling copper wire.',
      'Use proper mechanical chisels or pullers to separate copper coils from laminated steel cores.'
    ],
    doNotActions: [
      'DO NOT burn motor stator coils to remove insulating lacquer (produces toxic smoke and lowers copper grade).',
      'DO NOT drop heavy motors onto feet or hands.'
    ],
    storageGuidance: [
      'Store heavy iron stator cores on lower shelves or floor pallets to avoid shelf collapse.'
    ],
    transportGuidance: [
      'Distribute weight evenly across cart or vehicle floor; secure with ropes to prevent shifting.'
    ],
    recommendedPath: 'Repair Shop (rewinding/reuse) or Metal Recycler (copper/steel recovery)',
    emergencyNote: 'Watch for old capacitors attached to motor housings; discharge with insulated screwdriver before cutting wires.',
    conditionOverrides: {
      burnt: {
        hazardLevel: HAZARD_LEVELS.LOW,
        urgentWarning: 'Charred varnish creates soot. Clean hands thoroughly after handling.'
      }
    },
    version: '1.0'
  },
  {
    id: 'other',
    materialCategory: 'Other E-waste',
    aliases: ['other e-waste', 'other', 'mixed e-waste', 'e-waste_other'],
    hazardLevel: HAZARD_LEVELS.LOW,
    icon: '📦',
    color: '#475569',
    bg: '#f1f5f9',
    borderColor: '#cbd5e1',
    titleKey: 'safetyOtherTitle',
    handlingGuidance: [
      'Wear standard work gloves and safety boots when sorting mixed e-waste loads.',
      'Separate plastic housings, metal chassis, and internal electrical parts for distinct sale streams.',
      'Check for hidden alkaline or button-cell batteries in consumer toys, remotes, and small appliances.'
    ],
    doNotActions: [
      'DO NOT burn mixed electronics in open burn pits.',
      'DO NOT dump mixed electronic residues into municipal storm drains or wetlands.'
    ],
    storageGuidance: [
      'Organize into categorized sacks or bins to maximize sale value and maintain clean work area.'
    ],
    transportGuidance: [
      'Use secure sacks or pallet boxes to avoid dropping small items on roads.'
    ],
    recommendedPath: 'Authorized Recycler / Formal E-waste Aggregator',
    emergencyNote: 'Treat any unidentified powder or chemical residue with caution; do not inhale or touch without heavy gloves.',
    conditionOverrides: {
      damaged: {
        hazardLevel: HAZARD_LEVELS.MEDIUM,
        urgentWarning: 'Broken edges and mixed shattered plastics require protective footwear and gloves.'
      }
    },
    version: '1.0'
  }
];

export default SAFETY_CATALOG;
