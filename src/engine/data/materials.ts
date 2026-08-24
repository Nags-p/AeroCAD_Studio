export interface MaterialData {
  id: string;
  name: string;
  density: number; // kg/m^3
  finish: string;  // key for Three.js material shader mapping
  description: string;
}

export const MATERIALS_LIBRARY: Record<string, MaterialData> = {
  paint_glossy: {
    id: 'paint_glossy',
    name: 'Fiberglass / Gloss Paint',
    density: 1850,
    finish: 'paint_glossy',
    description: 'Standard fiberglass composite construction with glossy clearcoat.'
  },
  paint_matte: {
    id: 'paint_matte',
    name: 'Composite (Matte Finish)',
    density: 1550,
    finish: 'paint_matte',
    description: 'Lightweight composite structure with matte non-reflective paint.'
  },
  metal_polished: {
    id: 'metal_polished',
    name: 'Alclad Aluminum (7075-T6)',
    density: 2810,
    finish: 'metal_polished',
    description: 'High-strength aerospace grade aluminum alloy with polished finish.'
  },
  metal_brushed: {
    id: 'metal_brushed',
    name: 'Titanium Alloy (Ti-6Al-4V)',
    density: 4430,
    finish: 'metal_brushed',
    description: 'Premium high-temperature strength-to-weight titanium alloy.'
  },
  carbon_fiber: {
    id: 'carbon_fiber',
    name: 'Carbon Fiber Composite',
    density: 1600,
    finish: 'carbon_fiber',
    description: 'Ultra-lightweight structural carbon epoxy weave layout.'
  },
  glass: {
    id: 'glass',
    name: 'Acrylic Glass (PMMA Canopy)',
    density: 1180,
    finish: 'glass',
    description: 'Transparent aircraft canopy acrylic glass.'
  },
  gold_foil: {
    id: 'gold_foil',
    name: 'Polyimide Gold Thermal Foil',
    density: 1420,
    finish: 'gold_foil',
    description: 'High-temperature multilayer insulation thermal wrap.'
  },
  spruce_wood: {
    id: 'spruce_wood',
    name: 'Sitka Spruce (Aviation Wood)',
    density: 430,
    finish: 'paint_matte',
    description: 'Traditional lightweight structural aircraft grade wood.'
  },
  aviation_fabric: {
    id: 'aviation_fabric',
    name: 'Dacron (Aircraft Fabric)',
    density: 150,
    finish: 'paint_matte',
    description: 'Tensioned polyester structural aircraft skin fabric.'
  },
  structural_steel: {
    id: 'structural_steel',
    name: 'Chromoly Steel (4130)',
    density: 7850,
    finish: 'metal_brushed',
    description: 'High-strength structural tubing steel for frames and engine mounts.'
  }
};
