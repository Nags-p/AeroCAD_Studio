export type UnitSystem = 'metric' | 'imperial';

export type SectionShapeType =
  | 'point'
  | 'circle'
  | 'ellipse'
  | 'super_ellipse'
  | 'rounded_rectangle'
  | 'general_fuse'
  | 'biconvex'
  | 'wedge';

export interface FuselageSection {
  id: string;
  name: string;
  xPos: number;         // Position along fuselage length (0 to 1)
  width: number;        // Width / diameter (m)
  height: number;       // Height / diameter (m)
  nExp?: number;        // Superellipse exponent N (default 2.0)
  mExp?: number;        // Superellipse exponent M (default 2.0)
  cornerRadius?: number;// Corner radius for rounded rectangle (0 to 1)
  upperHeight?: number; // Upper height for GENERAL_FUSE (m)
  lowerHeight?: number; // Lower height for GENERAL_FUSE (m)
  shapeType: SectionShapeType;
  yOffset: number;      // Lateral offset (m)
  zOffset: number;      // Vertical offset (m)
}

export interface FuselageComponent {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  length: number;        // Total length (m)
  radius: number;        // Reference max radius (m)
  noseRoundness: number; // 0 to 1
  noseAngle: number;     // Nose angle deg
  noseZ: number;         // Nose apex vertical shift (m)
  noseY: number;         // Nose apex lateral shift (m)
  tail: number;          // Tail taper scale (0 to 1)
  tailZ: number;         // Tail tip vertical shift (m)
  tailY: number;         // Tail tip lateral shift (m)
  sec1_w: number;
  sec1_h: number;
  sec1_x: number;
  sec2_w: number;
  sec2_h: number;
  sec2_x: number;
  sec3_w: number;
  sec3_h: number;
  sec3_x: number;
  color: string;
  material?: string;
  sections: FuselageSection[];
}

export interface WingletConfig {
  enabled: boolean;
  height: number;       // Winglet height (m)
  root: number;         // Root chord (m)
  tip: number;          // Tip chord (m)
  sweep: number;        // Winglet sweep angle (deg)
  cant: number;         // Outward cant angle (deg)
  filletRadius: number; // Smooth C1/C2 blending fillet radius (m)
}

export type WingMountConfig = 'low' | 'mid' | 'high' | 'custom';

export interface WingComponent {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  mountConfig?: WingMountConfig; // High, Mid, Low, or Custom vertical mounting configuration
  span: number;         // Total wingspan (m)
  rootChord: number;    // Root chord length (m)
  tipChord: number;     // Tip chord length (m)
  sweep: number;        // Quarter-chord sweep angle (deg)
  dihedral: number;     // Dihedral angle (deg)
  twist: number;        // Washout twist angle (deg)
  rootThickness: number;// Root thickness percentage (e.g. 12 = 12%)
  tipThickness: number; // Tip thickness percentage
  rootCamber: number;   // Root camber percentage
  tipCamber: number;    // Tip camber percentage
  airfoilName: string;  // NACA airfoil profile key
  rootPos: [number, number, number]; // Root attachment position [x, y, z]
  color: string;
  material?: string;
  winglets: WingletConfig;
}

export interface TailComponent {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: 'conventional' | 'v-tail' | 't-tail' | 'twin-tail' | 'canard';
  horizontalSpan: number;
  horizontalChord: number;
  horizontalTipChord?: number;
  horizontalSweep?: number;     // Independent sweep for horizontal stabilizer (deg)
  verticalHeight: number;
  verticalChord: number;
  verticalTipChord?: number;
  verticalSweep?: number;       // Independent sweep for vertical stabilizer (deg)
  sweep: number;                // Shared/legacy sweep (used as fallback)
  dihedral: number;
  position: [number, number, number];
  color: string;
  material?: string;
}

export interface EngineComponent {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: 'turbofan' | 'turbojet' | 'propeller' | 'edf';
  diameter: number;
  length: number;
  position: [number, number, number];
  pylonHeight: number;
  pylonWidth: number;
  fanBlades: number;
  color: string;
  material?: string;
  attachToWing?: boolean;      // Automatically attach and conform to parent wing surface
  parentWingId?: string;      // Wing ID to attach to (defaults to first wing)
  spanFraction?: number;      // Spanwise station along wing (0 to 1)
  mountStyle?: 'underwing' | 'overwing' | 'fuselage';
}

export interface AircraftModel {
  id: string;
  name: string;
  version?: string;
  units?: UnitSystem;
  fuselage: FuselageComponent;
  wings: WingComponent[];
  tails: TailComponent[];
  engines: EngineComponent[];
}

export interface AirfoilPoint {
  x: number;
  y: number;
}

export interface AirfoilData {
  name: string;
  upper: AirfoilPoint[];
  lower: AirfoilPoint[];
  camber: AirfoilPoint[];
  thickness: number;
  maxCamber: number;
}

export interface ComponentMassBreakdown {
  id: string;
  name: string;
  type: string;
  materialName: string;
  density: number;
  volume: number;
  mass: number;
}

export interface AeroMetrics {
  totalVolume: number;
  wettedArea: number;
  referenceArea: number;
  aspectRatio: number;
  meanAerodynamicChord: number;
  taperRatio: number;
  estimatedEmptyWeight: number;
  centerOfGravity: [number, number, number];
  componentMasses?: ComponentMassBreakdown[];
  cL?: number;
  cD?: number;
  loD?: number;
}

