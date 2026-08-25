import { AircraftModel } from '@/types/aircraft';
import { calculateAeroMetrics } from './aeroMetrics';
import { MATERIALS_LIBRARY } from '../data/materials';

// ==========================================
// 1. STANDARD ATMOSPHERE CALCULATOR (ISA)
// ==========================================

export interface AtmosphereProperties {
  temperature: number;      // K
  temperatureC: number;     // °C
  pressure: number;         // Pa
  density: number;          // kg/m^3
  speedOfSound: number;     // m/s
  dynamicViscosity: number; // Pa·s
  kinematicViscosity: number; // m^2/s
}

export function calculateISA(altitudeMeters: number): AtmosphereProperties {
  const g = 9.80665;
  const R = 287.05;
  const T0 = 288.15;
  const P0 = 101325;
  
  let T = T0;
  let P = P0;

  // Multi-layer ISA computation (up to 32km)
  if (altitudeMeters <= 11000) {
    // Troposphere
    const L = 0.0065; // lapse rate (K/m)
    T = T0 - L * altitudeMeters;
    P = P0 * Math.pow(T / T0, g / (R * L));
  } else if (altitudeMeters <= 20000) {
    // Lower Stratosphere
    const T11 = 216.65;
    const P11 = 22632.1;
    T = T11;
    P = P11 * Math.exp(-g * (altitudeMeters - 11000) / (R * T11));
  } else {
    // Upper Stratosphere (up to 32km)
    const T20 = 216.65;
    const P20 = 5474.89;
    const L2 = -0.001; // temperature increases
    T = T20 - L2 * (altitudeMeters - 20000);
    P = P20 * Math.pow(T / T20, -g / (R * L2));
  }

  // Cap minimum temperature to avoid negative Kelvin
  T = Math.max(10, T);
  const density = P / (R * T);

  // Speed of sound: a = sqrt(gamma * R * T)
  const gamma = 1.4;
  const speedOfSound = Math.sqrt(gamma * R * T);

  // Sutherland's Law for Dynamic Viscosity: mu = C1 * T^(3/2) / (T + C)
  // C1 = 1.458e-6, C = 110.4
  const dynamicViscosity = (1.458e-6 * Math.pow(T, 1.5)) / (T + 110.4);
  const kinematicViscosity = density > 0 ? dynamicViscosity / density : 0;

  return {
    temperature: T,
    temperatureC: T - 273.15,
    pressure: P,
    density,
    speedOfSound,
    dynamicViscosity,
    kinematicViscosity,
  };
}

// ==========================================
// 2. STATIC LONGITUDINAL STABILITY & TRIM
// ==========================================

export interface StabilityMetrics {
  wingAcX: number;          // m
  tailAcX: number;          // m
  neutralPointX: number;    // m
  staticMargin: number;     // % MAC (e.g. 0.15 for 15%)
  stabilityStatus: 'stable' | 'marginal' | 'unstable';
  wingArea: number;         // m^2
  tailArea: number;         // m^2
  tailVolumeCoeff: number;
  wingMac: number;          // m
  wingMacX: number;         // m
  cgX: number;              // m
  trimDeflection: number;   // deg (elevator deflection required for trim)
  alphaTrim: number;        // deg (trim AoA)
}

export function calculateStability(model: AircraftModel, userAoA: number = 4.5): StabilityMetrics {
  const metrics = calculateAeroMetrics(model);
  const cgX = metrics.centerOfGravity[0];

  // 1. Wing parameters
  let wingArea = 0;
  let wingMac = 1.0;
  let wingMacX = 0.0;
  let wingAcX = 0.0;
  let arW = 6.0;

  if (model.wings && model.wings.length > 0) {
    const wing = model.wings[0];
    const b = wing.span;
    const cr = wing.rootChord;
    const ct = wing.tipChord;
    wingArea = b * (cr + ct) / 2;
    arW = wingArea > 0 ? (b * b) / wingArea : 6.0;

    const lam = cr > 0 ? ct / cr : 1;
    wingMac = (2 / 3) * cr * ((1 + lam + lam * lam) / (1 + lam));
    const yMac = (b / 6) * ((1 + 2 * lam) / (1 + lam));

    // Sweep quarter-chord to leading-edge sweep
    const sweepRad = (wing.sweep * Math.PI) / 180;
    const tanSweepLE = Math.tan(sweepRad) + (cr - ct) / (2 * b);
    
    // Wing MAC leading edge X position
    wingMacX = wing.rootPos[0] + yMac * tanSweepLE;
    wingAcX = wingMacX + 0.25 * wingMac;
  }

  // 2. Horizontal Tail parameters
  let tailArea = 0;
  let tailAcX = 0.0;
  let arT = 3.0;

  const hTail = model.tails.find(t => 
    t.visible && (t.type === 'conventional' || t.type === 't-tail' || t.type === 'twin-tail')
  );

  if (hTail) {
    const bt = hTail.horizontalSpan;
    const ct = hTail.horizontalChord;
    tailArea = bt * ct;
    arT = tailArea > 0 ? (bt * bt) / tailArea : 3.0;
    tailAcX = hTail.position[0] + 0.25 * ct;
  } else {
    // Fallback if tail is styled differently (e.g. V-tail projection)
    const vTail = model.tails.find(t => t.visible && t.type === 'v-tail');
    if (vTail) {
      // V-tail projected horizontal surface
      const bt = vTail.horizontalSpan * Math.cos(30 * Math.PI / 180);
      const ct = vTail.horizontalChord;
      tailArea = bt * ct;
      arT = tailArea > 0 ? (bt * bt) / tailArea : 3.0;
      tailAcX = vTail.position[0] + 0.25 * ct;
    }
  }

  // 3. Lift Curve Slopes (Per Radian)
  const a0 = 2 * Math.PI; // section lift slope
  const aW = (a0 * arW) / (arW + 2); // 3D wing lift curve slope
  const aT = tailArea > 0 ? (a0 * arT) / (arT + 2) : 0; // 3D tail lift curve slope

  // Downwash gradient: deps/dalpha = 2 * aW / (pi * arW)
  const depsDalpha = arW > 0 ? (2 * aW) / (Math.PI * arW) : 0;

  // Tail efficiency factor eta (dynamic pressure ratio)
  const eta = 0.90;

  // Tail Volume Coefficient
  const tailArm = tailArea > 0 ? tailAcX - cgX : 0;
  const tailVolumeCoeff = (wingArea > 0 && wingMac > 0) ? (tailArea * tailArm) / (wingArea * wingMac) : 0;

  // 4. Neutral Point calculation
  let neutralPointX = wingAcX;
  if (tailArea > 0 && wingArea > 0) {
    const numerator = aW * wingArea * wingAcX + eta * aT * tailArea * tailAcX * (1 - depsDalpha);
    const denominator = aW * wingArea + eta * aT * tailArea * (1 - depsDalpha);
    neutralPointX = numerator / denominator;
  }

  // 5. Static Margin
  const staticMargin = wingMac > 0 ? (neutralPointX - cgX) / wingMac : 0;

  let stabilityStatus: 'stable' | 'marginal' | 'unstable' = 'unstable';
  if (staticMargin > 0.05) {
    stabilityStatus = 'stable';
  } else if (staticMargin >= 0.0) {
    stabilityStatus = 'marginal';
  }

  // 6. Trim Calculation
  // Required elevator deflection delta_e for trim at userAoA
  // Cm_cg = Cm0 + CL_w * (cg - ac_w)/mac - eta * Vh * CL_t = 0
  // Estimate Cm0 of airfoil (e.g. proportional to root camber)
  let rootCamber = 2.0;
  if (model.wings && model.wings[0]) {
    rootCamber = model.wings[0].rootCamber;
  }
  const Cm0 = -0.04 * (rootCamber / 2.0); // simple camber pitching moment model

  const alphaRad = (userAoA * Math.PI) / 180;
  const CL_w = aW * alphaRad; // wing lift coefficient

  // Downwash angle at tail: eps = eps0 + depsDalpha * alpha
  const eps = depsDalpha * alphaRad;
  const alphaTail = alphaRad * (1 - depsDalpha) - eps;

  // Elevator effectiveness factor (tau_e ~ 0.5 for 25% chord flap)
  const tauE = 0.50;

  let trimDeflection = 0;
  if (tailArea > 0 && tailVolumeCoeff > 0) {
    // Solver for delta_e (elevator deflection in deg):
    // CL_t = aT * (alphaTail + tauE * delta_e_rad)
    // Cm0 + CL_w * (cgX - wingAcX)/wingMac - eta * Vh * CL_t = 0
    const CL_t_required = (Cm0 + CL_w * (cgX - wingAcX) / wingMac) / (eta * tailVolumeCoeff);
    const deltaERad = (CL_t_required / aT - alphaTail) / tauE;
    trimDeflection = (deltaERad * 180) / Math.PI;

    // Constrain to realistic deflection limits [-25, 25] deg
    trimDeflection = Math.max(-25, Math.min(25, trimDeflection));
  }

  return {
    wingAcX,
    tailAcX,
    neutralPointX,
    staticMargin,
    stabilityStatus,
    wingArea,
    tailArea,
    tailVolumeCoeff,
    wingMac,
    wingMacX,
    cgX,
    trimDeflection,
    alphaTrim: userAoA,
  };
}

// ==========================================
// 3. WING AERODYNAMICS SOLVER (LIFTING-LINE)
// ==========================================

export interface LLTResult {
  yStations: number[];      // Spanwise station coordinates
  localChord: number[];     // Local chords (m)
  circulation: number[];    // local circulation (m^2/s)
  localCl: number[];        // Section lift coefficient
  localClChord: number[];   // Cl * Chord (local lift shape)
  cL: number;               // Total lift coefficient
  cDi: number;              // Induced drag coefficient
  oswaldEfficiency: number; // Oswald factor e
  span: number;
}

export function solveLLT(model: AircraftModel, userAoA: number = 4.5, V: number = 120): LLTResult {
  if (!model.wings || model.wings.length === 0) {
    return {
      yStations: [], localChord: [], circulation: [], localCl: [], localClChord: [],
      cL: 0, cDi: 0, oswaldEfficiency: 0, span: 0
    };
  }

  const wing = model.wings[0];
  const b = wing.span;
  const cr = wing.rootChord;
  const ct = wing.tipChord;
  const sweep = wing.sweep;
  const twist = wing.twist; // deg (tip wash-out, e.g. -3)
  
  const ar = (b * b) / (b * (cr + ct) / 2);
  const a0 = 2 * Math.PI; // 2D lift curve slope

  // Number of Fourier terms (symmetric modes only: n = 1, 3, 5, 7, 9, 11, 13, 15)
  const K = 8; 
  const N_Fourier = [1, 3, 5, 7, 9, 11, 13, 15];

  // Set up collocated stations along half-span (theta = pi/(2K) to pi/2)
  const theta: number[] = [];
  const yStations: number[] = [];
  const localChords: number[] = [];
  const alphaLocal: number[] = [];
  const alphaL0: number[] = [];

  for (let i = 1; i <= K; i++) {
    const th = (i * Math.PI) / (2 * (K + 1));
    theta.push(th);
    
    // y goes from root (0) to tip (b/2)
    // we reflect standard y = -b/2 * cos(theta) to positive half span
    const y = (b / 2) * Math.cos(th);
    yStations.push(y);

    // Local chord: linear interpolation from cr to ct
    const chord = cr - (cr - ct) * (2 * y / b);
    localChords.push(chord);

    // Local geometric AoA (including linear twist washout)
    const localTwistVal = twist * (2 * y / b); // twist in deg
    const alphaGeoDeg = userAoA + localTwistVal;
    alphaLocal.push((alphaGeoDeg * Math.PI) / 180);

    // Zero-lift angle of attack estimate based on camber
    const camber = wing.rootCamber + (wing.tipCamber - wing.rootCamber) * (2 * y / b);
    const alphaL0Deg = -1.15 * camber; // thin airfoil approximation
    alphaL0.push((alphaL0Deg * Math.PI) / 180);
  }

  // Set up system of linear equations: M * A = B
  const M: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < K; i++) {
    const row: number[] = [];
    const th = theta[i];
    const c = localChords[i];

    for (let j = 0; j < K; j++) {
      const n = N_Fourier[j];
      // Equation: An * sin(n*theta) * [ 2*b / (c * a0) + n / sin(theta) ]
      const coeff = Math.sin(n * th) * ((2 * b) / (c * a0) + n / Math.sin(th));
      row.push(coeff);
    }
    M.push(row);
    B.push(alphaLocal[i] - alphaL0[i]);
  }

  // Solve the linear system using Gaussian Elimination
  const A = solveLinearSystem(M, B);

  // If linear system solver failed, fallback to elliptic distribution coefficients
  let cL = 0;
  let cDi = 0;
  let oswaldEfficiency = 0.95;
  const A1 = A ? A[0] : 0.05;

  if (A) {
    cL = Math.PI * ar * A1;
    
    let sumNAnSq = 0;
    for (let j = 0; j < K; j++) {
      sumNAnSq += N_Fourier[j] * A[j] * A[j];
    }
    cDi = Math.PI * ar * sumNAnSq;
    oswaldEfficiency = sumNAnSq > 0 ? (A1 * A1) / sumNAnSq : 0.95;
  } else {
    cL = a0 * (userAoA * Math.PI / 180) / (1 + a0 / (Math.PI * ar));
    cDi = (cL * cL) / (Math.PI * ar * oswaldEfficiency);
  }

  // Calculate local circulation and lift distribution at finer stations (for SVG display)
  const plotPointsCount = 21;
  const yPlot: number[] = [];
  const chordPlot: number[] = [];
  const gammaPlot: number[] = [];
  const clPlot: number[] = [];
  const clChordPlot: number[] = [];

  for (let i = 0; i < plotPointsCount; i++) {
    const frac = i / (plotPointsCount - 1); // 0 to 1
    const y = (b / 2) * (1 - frac); // from tip (b/2) to root (0)
    yPlot.push(y);

    const chord = cr - (cr - ct) * (2 * y / b);
    chordPlot.push(chord);

    // theta for this station
    const th = Math.acos(2 * y / b);

    // Calculate local circulation: Gamma = 2 * b * V * sum(An * sin(n * theta))
    let sumAnSin = 0;
    if (A) {
      for (let j = 0; j < K; j++) {
        sumAnSin += A[j] * Math.sin(N_Fourier[j] * th);
      }
    } else {
      // Fallback simple elliptic distribution
      sumAnSin = A1 * Math.sin(th);
    }
    
    const circulation = 2 * b * V * sumAnSin;
    gammaPlot.push(circulation);

    // Section lift coefficient: Cl = 2 * Gamma / (V * chord)
    // Cl = 4 * b / chord * sum(An * sin(n * theta))
    const cl = chord > 0 ? (2 * circulation) / (V * chord) : 0;
    clPlot.push(cl);
    clChordPlot.push(cl * chord);
  }

  // Mirror stations to represent the full span [-b/2, b/2] for drawing
  const fullY: number[] = [];
  const fullChord: number[] = [];
  const fullCl: number[] = [];
  const fullClChord: number[] = [];
  const fullGamma: number[] = [];

  // Left wing (negative y) from tip to root
  for (let i = 0; i < plotPointsCount - 1; i++) {
    const idx = i; // from tip to root
    fullY.push(-yPlot[idx]);
    fullChord.push(chordPlot[idx]);
    fullCl.push(clPlot[idx]);
    fullClChord.push(clChordPlot[idx]);
    fullGamma.push(gammaPlot[idx]);
  }
  // Right wing (positive y) from root to tip
  for (let i = plotPointsCount - 1; i >= 0; i--) {
    const idx = i; // from root to tip
    fullY.push(yPlot[idx]);
    fullChord.push(chordPlot[idx]);
    fullCl.push(clPlot[idx]);
    fullClChord.push(clChordPlot[idx]);
    fullGamma.push(gammaPlot[idx]);
  }

  return {
    yStations: fullY,
    localChord: fullChord,
    circulation: fullGamma,
    localCl: fullCl,
    localClChord: fullClChord,
    cL,
    cDi,
    oswaldEfficiency,
    span: b,
  };
}

// Helper: Solve M * X = B via Gaussian Elimination
function solveLinearSystem(M: number[][], B: number[]): number[] | null {
  const n = B.length;
  // Create augmented matrix
  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    aug.push([...M[i], B[i]]);
  }

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const temp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = temp;

    // Check singular matrix
    if (Math.abs(aug[i][i]) < 1e-12) {
      return null;
    }

    // Pivot elimination
    for (let k = i + 1; k < n; k++) {
      const c = -aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) {
        if (i === j) {
          aug[k][j] = 0;
        } else {
          aug[k][j] += c * aug[i][j];
        }
      }
    }
  }

  // Back substitution
  const X = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    X[i] = aug[i][n] / aug[i][i];
    for (let k = i - 1; k >= 0; k--) {
      aug[k][n] -= aug[k][i] * X[i];
    }
  }

  return X;
}

// ==========================================
// 4. WING STRUCTURAL BENDING & SHEAR ANALYSIS
// ==========================================

export interface StructuralResult {
  yStations: number[];      // Stations along half span (0 to b/2)
  shearForce: number[];     // N
  bendingMoment: number[];  // N·m
  bendingStress: number[];  // Pa (Max fiber stress in spar)
  deflection: number[];     // m
  maxDeflection: number;    // m
  maxStress: number;        // Pa
  yieldStrength: number;    // Pa
  safetyFactor: number;     // Allowable / Max stress
  isSafe: boolean;
}

export interface SparMaterial {
  id: string;
  name: string;
  youngsModulus: number;   // Pa
  yieldStrength: number;   // Pa
  density: number;          // kg/m^3
}

export const SPAR_MATERIALS: Record<string, SparMaterial> = {
  aluminum: {
    id: 'aluminum',
    name: 'Aluminum 7075-T6',
    youngsModulus: 71.7e9,
    yieldStrength: 503e6,
    density: 2810,
  },
  carbon_fiber: {
    id: 'carbon_fiber',
    name: 'Carbon Fiber Laminate',
    youngsModulus: 135e9,
    yieldStrength: 600e6,
    density: 1600,
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium (Ti-6Al-4V)',
    youngsModulus: 113.8e9,
    yieldStrength: 880e6,
    density: 4430,
  },
  wood: {
    id: 'wood',
    name: 'Sitka Spruce Wood',
    youngsModulus: 11e9,
    yieldStrength: 40e6,
    density: 430,
  },
  steel: {
    id: 'steel',
    name: 'Chromoly Steel 4130',
    youngsModulus: 205e9,
    yieldStrength: 460e6,
    density: 7850,
  }
};

export function analyzeStructures(
  model: AircraftModel,
  loadFactorG: number = 2.5,
  materialId: string = 'aluminum',
  userAoA: number = 4.5,
  V: number = 120
): StructuralResult {
  const resultFallback: StructuralResult = {
    yStations: [], shearForce: [], bendingMoment: [], bendingStress: [], deflection: [],
    maxDeflection: 0, maxStress: 0, yieldStrength: 1, safetyFactor: 1, isSafe: true
  };

  if (!model.wings || model.wings.length === 0) {
    return resultFallback;
  }

  const wing = model.wings[0];
  const b = wing.span;
  const cr = wing.rootChord;
  const ct = wing.tipChord;
  const thicknessRootPct = wing.rootThickness; // e.g. 12 (%)
  const thicknessTipPct = wing.tipThickness;
  
  const mat = SPAR_MATERIALS[materialId] || SPAR_MATERIALS['aluminum'];
  const E = mat.youngsModulus;

  // Run LLT to get section lift distribution
  const llt = solveLLT(model, userAoA, V);
  const aeroMetrics = calculateAeroMetrics(model, V);
  
  // Total aircraft weight in Newtons
  const W_total = aeroMetrics.estimatedEmptyWeight * 9.81;

  // Discretize half span [0, b/2] into M segments
  const M_steps = 30;
  const dy = (b / 2) / M_steps;

  const yStations: number[] = [];
  const localChords: number[] = [];
  const liftPerUnit: number[] = [];
  const weightPerUnit: number[] = [];
  const netLoadPerUnit: number[] = [];

  // Scale the lift distribution so that the total lift at 1G equals W_total
  const rho = 1.225;
  const q = 0.5 * rho * V * V;

  // First pass: compute unscaled load distribution
  let unscaledIntegratedLift = 0;
  const tempLifts: number[] = [];
  const tempWeights: number[] = [];

  for (let i = 0; i <= M_steps; i++) {
    const y = i * dy;
    yStations.push(y);

    const c = cr - (cr - ct) * (2 * y / b);
    localChords.push(c);

    // Retrieve Cl(y) from llt stations
    let cl = 0;
    if (llt.yStations.length > 0) {
      let minDiff = Infinity;
      let closestIdx = 0;
      for (let j = 0; j < llt.yStations.length; j++) {
        const diff = Math.abs(Math.abs(llt.yStations[j]) - y);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = j;
        }
      }
      cl = llt.localCl[closestIdx];
    } else {
      cl = 0.1 * userAoA;
    }

    const liftVal = q * c * cl;
    tempLifts.push(liftVal);

    // Wing weight per unit span based on local thickness & cross sectional area
    const thicknessPct = thicknessRootPct + (thicknessTipPct - thicknessRootPct) * (2 * y / b);
    const t = c * (thicknessPct / 100);
    const area = 0.6 * c * t;

    // Weight per unit span = area * density * apparent factor (10.5%) * g
    const wtVal = area * mat.density * 0.105 * 9.81;
    tempWeights.push(wtVal);

    if (i > 0) {
      unscaledIntegratedLift += 0.5 * (tempLifts[i] + tempLifts[i-1]) * dy;
    }
  }

  // Scale factor: Total Lift (both wings) must equal W_total in level 1G flight
  const liftScale = unscaledIntegratedLift > 0.1 ? (W_total / (2 * unscaledIntegratedLift)) : 1.0;

  for (let i = 0; i <= M_steps; i++) {
    const liftScaled = tempLifts[i] * liftScale;
    liftPerUnit.push(liftScaled);
    weightPerUnit.push(tempWeights[i]);

    // Net load w(y) = G * Lift1g - Weight1g * G
    const w = loadFactorG * (liftScaled - tempWeights[i]);
    netLoadPerUnit.push(w);
  }

  // Double integration: Shear Force and Bending Moment
  const shearForce = new Array(M_steps + 1).fill(0);
  for (let i = M_steps - 1; i >= 0; i--) {
    const avgLoad = 0.5 * (netLoadPerUnit[i] + netLoadPerUnit[i+1]);
    shearForce[i] = shearForce[i+1] + avgLoad * dy;
  }

  const bendingMoment = new Array(M_steps + 1).fill(0);
  for (let i = M_steps - 1; i >= 0; i--) {
    const avgShear = 0.5 * (shearForce[i] + shearForce[i+1]);
    bendingMoment[i] = bendingMoment[i+1] + avgShear * dy;
  }

  // Spar stress & deflection
  const bendingStress = new Array(M_steps + 1).fill(0);
  const I_inertia = new Array(M_steps + 1).fill(1e-6);

  for (let i = 0; i <= M_steps; i++) {
    const y = yStations[i];
    const c = localChords[i];
    const thicknessPct = thicknessRootPct + (thicknessTipPct - thicknessRootPct) * (2 * y / b);
    const t = c * (thicknessPct / 100);

    const h = t * 0.8;
    const w_spar = c * 0.2;
    const t_f = h * 0.08;
    const t_w = w_spar * 0.05;

    let I = 1e-6;
    if (h > 0.001 && w_spar > 0.001) {
      const h_inner = Math.max(0.0, h - 2 * t_f);
      const w_inner = Math.max(0.0, w_spar - 2 * t_w);
      I = (w_spar * Math.pow(h, 3)) / 12 - (w_inner * Math.pow(h_inner, 3)) / 12;
      I = Math.max(1e-9, I);
    }
    I_inertia[i] = I;

    const M_mom = Math.abs(bendingMoment[i]);
    bendingStress[i] = I > 0 ? (M_mom * (h / 2)) / I : 0;
  }

  // Tip deflection by integrating M / (E * I) twice
  const M_EI = yStations.map((_, i) => bendingMoment[i] / (E * I_inertia[i]));
  
  const slope = new Array(M_steps + 1).fill(0);
  for (let i = 1; i <= M_steps; i++) {
    const avgMEI = 0.5 * (M_EI[i] + M_EI[i-1]);
    slope[i] = slope[i-1] + avgMEI * dy;
  }

  const deflection = new Array(M_steps + 1).fill(0);
  for (let i = 1; i <= M_steps; i++) {
    const avgSlope = 0.5 * (slope[i] + slope[i-1]);
    deflection[i] = deflection[i-1] + avgSlope * dy;
  }

  // Collect maxes
  const maxStress = Math.max(...bendingStress);
  const maxDeflection = Math.max(...deflection);
  const safetyFactor = maxStress > 0 ? mat.yieldStrength / maxStress : 100;
  const isSafe = maxStress < mat.yieldStrength;

  return {
    yStations,
    shearForce,
    bendingMoment,
    bendingStress,
    deflection,
    maxDeflection,
    maxStress,
    yieldStrength: mat.yieldStrength,
    safetyFactor: Math.min(100, Math.max(0.1, safetyFactor)),
    isSafe
  };
}
