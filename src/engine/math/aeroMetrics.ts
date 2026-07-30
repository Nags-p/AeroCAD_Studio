import { AircraftModel, AeroMetrics } from '@/types/aircraft';

/**
 * Computes aerodynamic parameters, wetted area, volume, MAC, and CG estimation for an AircraftModel.
 */
export function calculateAeroMetrics(model: AircraftModel): AeroMetrics {
  let totalVol = 0; // m^3
  let totalWettedArea = 0; // m^2

  // Center of Gravity weighted sum accumulator
  let sumMassX = 0;
  let sumMassY = 0;
  let sumMassZ = 0;
  let totalMass = 0;

  // 1. Fuselage volume & mass
  const fus = model.fuselage;
  if (fus && fus.visible) {
    const fusLength = fus.length;
    const fusRadius = fus.maxRadius;
    // Approximated volumetric cylinder with nose/tail taper factors
    const fusVol = Math.PI * Math.pow(fusRadius, 2) * fusLength * (1 - 0.2 * fus.noseRoundness - 0.3 * fus.tailTaper);
    const fusWetted = 2 * Math.PI * fusRadius * fusLength;
    const fusMass = fusVol * 120; // ~120 kg/m^3 structural density for aluminum/composite shell

    totalVol += fusVol;
    totalWettedArea += fusWetted;

    sumMassX += (fusLength * 0.45) * fusMass;
    sumMassY += 0 * fusMass;
    sumMassZ += 0 * fusMass;
    totalMass += fusMass;
  }

  // 2. Main Wing Metrics
  let refArea = 0;
  let ar = 0;
  let mac = 0;
  let taper = 0;

  if (model.wings.length > 0) {
    const mainWing = model.wings[0];
    if (mainWing && mainWing.visible) {
      const b = mainWing.span;
      const cr = mainWing.rootChord;
      const ct = mainWing.tipChord;
      taper = cr > 0 ? ct / cr : 1;

      // Wing area S = b * (cr + ct) / 2
      refArea = b * (cr + ct) / 2;
      ar = refArea > 0 ? (b * b) / refArea : 0;

      // MAC formula
      const lam = Math.max(0.01, taper);
      mac = (2 / 3) * cr * ((1 + lam + lam * lam) / (1 + lam));

      // Volume & Mass approximation
      const avgThick = (mainWing.rootThickness + mainWing.tipThickness) / 200; // t/c
      const wingVol = refArea * avgThick * 0.6; // airfoil area factor ~0.6
      const wingWetted = refArea * 2.05; // upper + lower + LE
      const wingMass = wingVol * 180; // ~180 kg/m^3

      totalVol += wingVol;
      totalWettedArea += wingWetted;

      const wingPosX = mainWing.rootPos[0] + (cr * 0.4);
      const wingPosY = mainWing.rootPos[1];
      const wingPosZ = mainWing.rootPos[2];

      sumMassX += wingPosX * wingMass;
      sumMassY += wingPosY * wingMass;
      sumMassZ += wingPosZ * wingMass;
      totalMass += wingMass;
    }
  }

  // 3. Tails
  for (const tail of model.tails) {
    if (!tail.visible) continue;
    const hArea = tail.horizontalSpan * tail.horizontalChord;
    const vArea = tail.verticalHeight * tail.verticalChord;
    const tailArea = hArea + vArea;
    const tailVol = tailArea * 0.08 * 0.6;
    const tailMass = tailVol * 160;

    totalVol += tailVol;
    totalWettedArea += tailArea * 2;

    sumMassX += tail.position[0] * tailMass;
    sumMassY += tail.position[1] * tailMass;
    sumMassZ += tail.position[2] * tailMass;
    totalMass += tailMass;
  }

  // 4. Engines
  for (const eng of model.engines) {
    if (!eng.visible) continue;
    const r = eng.diameter / 2;
    const engVol = Math.PI * r * r * eng.length;
    const engWetted = 2 * Math.PI * r * eng.length;
    const engMass = engVol * 450; // Heavy engine core density

    totalVol += engVol;
    totalWettedArea += engWetted;

    sumMassX += eng.position[0] * engMass;
    sumMassY += eng.position[1] * engMass;
    sumMassZ += eng.position[2] * engMass;
    totalMass += engMass;
  }

  // Calculate final CG
  const cgX = totalMass > 0 ? sumMassX / totalMass : 0;
  const cgY = totalMass > 0 ? sumMassY / totalMass : 0;
  const cgZ = totalMass > 0 ? sumMassZ / totalMass : 0;

  return {
    totalVolume: Math.round(totalVol * 100) / 100,
    wettedArea: Math.round(totalWettedArea * 100) / 100,
    referenceArea: Math.round(refArea * 100) / 100,
    aspectRatio: Math.round(ar * 100) / 100,
    meanAerodynamicChord: Math.round(mac * 100) / 100,
    taperRatio: Math.round(taper * 100) / 100,
    estimatedEmptyWeight: Math.round(totalMass),
    centerOfGravity: [Math.round(cgX * 100) / 100, Math.round(cgY * 100) / 100, Math.round(cgZ * 100) / 100],
  };
}
