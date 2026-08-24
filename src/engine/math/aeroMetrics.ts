import { AircraftModel, AeroMetrics } from '@/types/aircraft';
import { computeEngineWingAttachment } from '../generators/engineGenerator';
import { MATERIALS_LIBRARY } from '../data/materials';

/**
 * Computes aerodynamic parameters, wetted area, volume, MAC, and CG estimation for an AircraftModel.
 */
export function calculateAeroMetrics(model: AircraftModel, velocity: number = 120): AeroMetrics {
  let totalVol = 0; // m^3
  let totalWettedArea = 0; // m^2

  // Center of Gravity weighted sum accumulator
  let sumMassX = 0;
  let sumMassY = 0;
  let sumMassZ = 0;
  let totalMass = 0;
  const componentMasses: any[] = [];

  // 1. Fuselage volume & mass
  const fus = model.fuselage;
  if (fus && fus.visible) {
    const fusLength = fus.length;
    const fusRadius = fus.radius;
    // Approximated volumetric cylinder with nose/tail taper factors
    const fusVol = Math.PI * Math.pow(fusRadius, 2) * fusLength * (1 - 0.2 * fus.noseRoundness - 0.3 * fus.tail);
    const fusWetted = 2 * Math.PI * fusRadius * fusLength;
    
    // Compute mass from material density
    const fusMatKey = fus.material || 'paint_glossy';
    const fusMat = MATERIALS_LIBRARY[fusMatKey] || MATERIALS_LIBRARY['paint_glossy'];
    const fusDensity = fusMat.density * 0.085; // 8.5% apparent density factor
    const fusMass = fusVol * fusDensity;

    totalVol += fusVol;
    totalWettedArea += fusWetted;

    sumMassX += (fusLength * 0.45) * fusMass;
    sumMassY += 0 * fusMass;
    sumMassZ += 0 * fusMass;
    totalMass += fusMass;

    componentMasses.push({
      id: fus.id,
      name: fus.name || 'Fuselage',
      type: 'Fuselage',
      materialName: fusMat.name,
      density: Math.round(fusDensity),
      volume: Math.round(fusVol * 100) / 100,
      mass: Math.round(fusMass * 10) / 10,
    });
  }

  // 2. Wing Metrics
  let refArea = 0;
  let ar = 0;
  let mac = 0;
  let taper = 0;

  // Let's compute aerodynamic reference area from the first wing
  if (model.wings.length > 0) {
    const mainWing = model.wings[0];
    if (mainWing && mainWing.visible) {
      const b = mainWing.span;
      const cr = mainWing.rootChord;
      const ct = mainWing.tipChord;
      taper = cr > 0 ? ct / cr : 1;
      refArea = b * (cr + ct) / 2;
      ar = refArea > 0 ? (b * b) / refArea : 0;
      const lam = Math.max(0.01, taper);
      mac = (2 / 3) * cr * ((1 + lam + lam * lam) / (1 + lam));
    }
  }

  // Iterate all wings for mass & volume
  for (const wing of model.wings) {
    if (!wing.visible) continue;
    const b = wing.span;
    const cr = wing.rootChord;
    const ct = wing.tipChord;
    const sArea = b * (cr + ct) / 2;
    const avgThick = (wing.rootThickness + wing.tipThickness) / 200; // t/c
    const wingVol = sArea * avgThick * 0.6;
    const wingWetted = sArea * 2.05;

    const wingMatKey = wing.material || 'paint_glossy';
    const wingMat = MATERIALS_LIBRARY[wingMatKey] || MATERIALS_LIBRARY['paint_glossy'];
    const wingDensity = wingMat.density * 0.105; // 10.5% apparent density factor
    const wingMass = wingVol * wingDensity;

    totalVol += wingVol;
    totalWettedArea += wingWetted;

    const wingPosX = wing.rootPos[0] + (cr * 0.4);
    const wingPosY = wing.rootPos[1];
    const wingPosZ = wing.rootPos[2];

    sumMassX += wingPosX * wingMass;
    sumMassY += wingPosY * wingMass;
    sumMassZ += wingPosZ * wingMass;
    totalMass += wingMass;

    componentMasses.push({
      id: wing.id,
      name: wing.name || 'Wing Assembly',
      type: 'Wing',
      materialName: wingMat.name,
      density: Math.round(wingDensity),
      volume: Math.round(wingVol * 100) / 100,
      mass: Math.round(wingMass * 10) / 10,
    });
  }

  // 3. Tails
  for (const tail of model.tails) {
    if (!tail.visible) continue;
    const hArea = tail.horizontalSpan * tail.horizontalChord;
    const vArea = tail.verticalHeight * tail.verticalChord;
    const tailArea = hArea + vArea;
    const tailVol = tailArea * 0.08 * 0.6;
    
    // Compute mass from material density
    const tailMatKey = tail.material || 'paint_glossy';
    const tailMat = MATERIALS_LIBRARY[tailMatKey] || MATERIALS_LIBRARY['paint_glossy'];
    const tailDensity = tailMat.density * 0.095; // 9.5% apparent density factor
    const tailMass = tailVol * tailDensity;

    totalVol += tailVol;
    totalWettedArea += tailArea * 2;

    sumMassX += tail.position[0] * tailMass;
    sumMassY += tail.position[1] * tailMass;
    sumMassZ += tail.position[2] * tailMass;
    totalMass += tailMass;

    componentMasses.push({
      id: tail.id,
      name: tail.name || 'Tail Assembly',
      type: 'Tail',
      materialName: tailMat.name,
      density: Math.round(tailDensity),
      volume: Math.round(tailVol * 100) / 100,
      mass: Math.round(tailMass * 10) / 10,
    });
  }

  // 4. Engines
  for (const eng of model.engines) {
    if (!eng.visible) continue;
    const r = eng.diameter / 2;
    const engVol = Math.PI * r * r * eng.length;
    const engWetted = 2 * Math.PI * r * eng.length;
    
    // Compute mass from material density
    const engMatKey = eng.material || 'paint_glossy';
    const engMat = MATERIALS_LIBRARY[engMatKey] || MATERIALS_LIBRARY['paint_glossy'];
    const engDensity = engMat.density * 0.26; // 26% apparent density factor
    const engMass = engVol * engDensity;

    totalVol += engVol;
    totalWettedArea += engWetted;

    const attachment = computeEngineWingAttachment(eng, model.wings);
    const pos = attachment.isWingMounted ? attachment.actualPos : eng.position;

    sumMassX += pos[0] * engMass;
    sumMassY += pos[1] * engMass;
    sumMassZ += pos[2] * engMass;
    totalMass += engMass;

    componentMasses.push({
      id: eng.id,
      name: eng.name || 'Engine Nacelle',
      type: 'Engine',
      materialName: engMat.name,
      density: Math.round(engDensity),
      volume: Math.round(engVol * 100) / 100,
      mass: Math.round(engMass * 10) / 10,
    });
  }

  // Calculate final CG
  const cgX = totalMass > 0 ? sumMassX / totalMass : 0;
  const cgY = totalMass > 0 ? sumMassY / totalMass : 0;
  const cgZ = totalMass > 0 ? sumMassZ / totalMass : 0;

  // Dynamic Aerodynamic Coefficients Estimation
  const vSelected = Math.max(10, velocity); // Cap minimum speed to prevent division by zero
  const rho = 1.225; // kg/m^3
  
  // Required Lift Coefficient to maintain level flight:
  // L = W => CL * 0.5 * rho * V^2 * S_ref = Mass * 9.81
  // CL = (2 * Mass * 9.81) / (rho * V^2 * S_ref)
  let cL = 0.45; // default nominal
  if (refArea > 0) {
    cL = (2 * totalMass * 9.81) / (rho * vSelected * vSelected * refArea);
  }

  // Cap Lift Coefficient to realistic limits: [0.05, 1.8]
  cL = Math.max(0.05, Math.min(1.8, cL));

  const e = 0.82; // Oswald efficiency factor
  const cDi = ar > 0 ? (cL * cL) / (Math.PI * ar * e) : 0;
  const cf = 0.0055; // average skin friction coefficient
  const cD0 = refArea > 0 ? (totalWettedArea * cf) / refArea : 0.02;
  const cD = cD0 + cDi;
  const loD = cD > 0 ? cL / cD : 0;

  return {
    totalVolume: Math.round(totalVol * 100) / 100,
    wettedArea: Math.round(totalWettedArea * 100) / 100,
    referenceArea: Math.round(refArea * 100) / 100,
    aspectRatio: Math.round(ar * 100) / 100,
    meanAerodynamicChord: Math.round(mac * 100) / 100,
    taperRatio: Math.round(taper * 100) / 100,
    estimatedEmptyWeight: Math.round(totalMass),
    centerOfGravity: [Math.round(cgX * 100) / 100, Math.round(cgY * 100) / 100, Math.round(cgZ * 100) / 100],
    componentMasses,
    cL: Math.round(cL * 1000) / 1000,
    cD: Math.round(cD * 1000) / 1000,
    loD: Math.round(loD * 100) / 100,
  };
}
