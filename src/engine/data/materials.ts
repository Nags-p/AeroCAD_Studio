export type MaterialCategory = 'metals' | 'composites' | 'woods' | 'fabrics' | 'specialty';

export interface MaterialData {
  id: string;
  name: string;
  density: number;        // kg/m^3
  finish: string;         // key for Three.js material shader mapping
  description: string;
  category: MaterialCategory;
  youngsModulus?: number; // Young's Modulus E (Pa)
  yieldStrength?: number; // Yield Strength (Pa)
}

export const MATERIALS_LIBRARY: Record<string, MaterialData> = {
  // --- METALS ---
  metal_polished: {
    id: 'metal_polished',
    name: 'Alclad Aluminum (7075-T6)',
    density: 2810,
    finish: 'metal_polished',
    description: 'High-strength aerospace grade aluminum alloy with polished finish. Standard for skins and spar webs.',
    category: 'metals',
    youngsModulus: 71.7e9,
    yieldStrength: 503e6,
  },
  aluminum_2024: {
    id: 'aluminum_2024',
    name: 'Aluminum Sheet (2024-T3)',
    density: 2780,
    finish: 'metal_polished',
    description: 'Highly damage-tolerant aerospace aluminum. Excellent fatigue resistance, standard for wings and fuselage skins.',
    category: 'metals',
    youngsModulus: 73.1e9,
    yieldStrength: 324e6,
  },
  metal_brushed: {
    id: 'metal_brushed',
    name: 'Titanium Alloy (Ti-6Al-4V)',
    density: 4430,
    finish: 'metal_brushed',
    description: 'Premium high-temperature strength-to-weight titanium alloy. Used in engine firewalls and critical spar attachments.',
    category: 'metals',
    youngsModulus: 113.8e9,
    yieldStrength: 880e6,
  },
  structural_steel: {
    id: 'structural_steel',
    name: 'Chromoly Steel (4130)',
    density: 7850,
    finish: 'metal_brushed',
    description: 'High-strength structural tubing steel. Standard for welded fuselage truss frames and engine mounts.',
    category: 'metals',
    youngsModulus: 205e9,
    yieldStrength: 460e6,
  },
  magnesium_alloy: {
    id: 'magnesium_alloy',
    name: 'Magnesium Alloy (AZ31B)',
    density: 1770,
    finish: 'metal_brushed',
    description: 'Ultra-lightweight structural metal alloy. Highly machinable, used in gearbox housings and cast control brackets.',
    category: 'metals',
    youngsModulus: 45e9,
    yieldStrength: 200e6,
  },

  // --- COMPOSITES ---
  carbon_fiber: {
    id: 'carbon_fiber',
    name: 'Carbon Fiber Composite',
    density: 1600,
    finish: 'carbon_fiber',
    description: 'Ultra-lightweight structural carbon epoxy weave layout. Maximum stiffness-to-weight ratio for primary structures.',
    category: 'composites',
    youngsModulus: 135e9,
    yieldStrength: 600e6,
  },
  kevlar_epoxy: {
    id: 'kevlar_epoxy',
    name: 'Kevlar / Aramid Epoxy',
    density: 1450,
    finish: 'paint_matte',
    description: 'Aramid fiber composite. Extreme impact/abrasion resistance and high tensile strength. Excellent for containment shrouds.',
    category: 'composites',
    youngsModulus: 76e9,
    yieldStrength: 400e6,
  },
  fiberglass_epoxy: {
    id: 'fiberglass_epoxy',
    name: 'E-Glass Epoxy Composite',
    density: 1950,
    finish: 'paint_glossy',
    description: 'Standard composite structural glass fiber matrix. Good strength, highly radio-transparent. Ideal for radomes.',
    category: 'composites',
    youngsModulus: 40e9,
    yieldStrength: 250e6,
  },
  paint_glossy: {
    id: 'paint_glossy',
    name: 'Fiberglass / Gloss Paint',
    density: 1850,
    finish: 'paint_glossy',
    description: 'Standard fiberglass composite construction with glossy clearcoat.',
    category: 'composites',
    youngsModulus: 35e9,
    yieldStrength: 200e6,
  },
  paint_matte: {
    id: 'paint_matte',
    name: 'Composite (Matte Finish)',
    density: 1550,
    finish: 'paint_matte',
    description: 'Lightweight composite structure with matte non-reflective paint.',
    category: 'composites',
    youngsModulus: 30e9,
    yieldStrength: 180e6,
  },

  // --- WOODS ---
  spruce_wood: {
    id: 'spruce_wood',
    name: 'Sitka Spruce (Aviation Wood)',
    density: 430,
    finish: 'paint_matte',
    description: 'Traditional lightweight structural aircraft grade wood. Exceptional elasticity and strength-to-weight ratio.',
    category: 'woods',
    youngsModulus: 11e9,
    yieldStrength: 40e6,
  },
  birch_plywood: {
    id: 'birch_plywood',
    name: 'Aviation Birch Plywood',
    density: 680,
    finish: 'paint_matte',
    description: 'Multi-ply aviation birch plywood. Used for structural gussets, spar reinforcements, and rib webbing.',
    category: 'woods',
    youngsModulus: 9e9,
    yieldStrength: 35e6,
  },
  balsa_wood: {
    id: 'balsa_wood',
    name: 'Balsa Wood Core',
    density: 130,
    finish: 'paint_matte',
    description: 'Ultra-low density core wood. Standard shear-web core filler in composite sandwich panel construction.',
    category: 'woods',
    youngsModulus: 3e9,
    yieldStrength: 12e6,
  },

  // --- FABRICS & SKINS ---
  aviation_fabric: {
    id: 'aviation_fabric',
    name: 'Dacron (Aircraft Fabric)',
    density: 150,
    finish: 'paint_matte',
    description: 'Tensioned heat-shrinkable polyester structural aircraft skin fabric. Standard for vintage and light aircraft.',
    category: 'fabrics',
    youngsModulus: 1.5e9,
    yieldStrength: 20e6,
  },
  linen_fabric: {
    id: 'linen_fabric',
    name: 'Aviation Linen Canvas',
    density: 120,
    finish: 'paint_matte',
    description: 'Traditional doped linen fabric. Light and historical fabric cover for vintage biplane ribs and tail structures.',
    category: 'fabrics',
    youngsModulus: 1.0e9,
    yieldStrength: 15e6,
  },
  carbon_veil: {
    id: 'carbon_veil',
    name: 'Ultralight Carbon Veil Skin',
    density: 100,
    finish: 'carbon_fiber',
    description: 'Super-thin non-woven carbon fiber veil. Ideal skin overlay for reinforcement on lightweight foam cores.',
    category: 'fabrics',
    youngsModulus: 15e9,
    yieldStrength: 80e6,
  },

  // --- SPECIALTY ---
  glass: {
    id: 'glass',
    name: 'Acrylic Glass (PMMA Canopy)',
    density: 1180,
    finish: 'glass',
    description: 'Transparent aircraft canopy acrylic glass. Excellent optical clarity and weathering resistance.',
    category: 'specialty',
    youngsModulus: 3.3e9,
    yieldStrength: 70e6,
  },
  polycarbonate: {
    id: 'polycarbonate',
    name: 'Polycarbonate Canopy (Lexan)',
    density: 1200,
    finish: 'glass',
    description: 'Impact-resistant polycarbonate thermoplastic. Used in military high-speed fighter canopies for bird-strike survival.',
    category: 'specialty',
    youngsModulus: 2.4e9,
    yieldStrength: 65e6,
  },
  gold_foil: {
    id: 'gold_foil',
    name: 'Polyimide Gold Thermal Foil',
    density: 1420,
    finish: 'gold_foil',
    description: 'High-temperature multilayer insulation thermal wrap. Standard for heat-shielding engine compartments.',
    category: 'specialty',
    youngsModulus: 2.8e9,
    yieldStrength: 50e6,
  }
};
