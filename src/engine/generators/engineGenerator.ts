import * as THREE from 'three';
import { EngineComponent, WingComponent } from '../../types/aircraft';

export interface EngineAttachmentInfo {
  actualPos: [number, number, number];
  actualPylonHeight: number;
  actualPylonZTop: number;
  isWingMounted: boolean;
}

/**
 * Computes parametric wing-attached coordinates and dynamic pylon bridging for an engine.
 */
export function computeEngineWingAttachment(
  engine: EngineComponent,
  wings?: WingComponent[]
): EngineAttachmentInfo {
  // If attached to wing and wings exist
  const isWingMounted =
    engine.attachToWing !== false &&
    !!wings &&
    wings.length > 0;

  if (!isWingMounted || !wings || wings.length === 0) {
    const radius = engine.diameter / 2;
    return {
      actualPos: engine.position,
      actualPylonHeight: engine.pylonHeight,
      actualPylonZTop: engine.position[2] + radius + engine.pylonHeight,
      isWingMounted: false,
    };
  }

  const wing = (engine.parentWingId ? wings.find((w) => w.id === engine.parentWingId) : null) || wings[0];
  if (!wing) {
    const radius = engine.diameter / 2;
    return {
      actualPos: engine.position,
      actualPylonHeight: engine.pylonHeight,
      actualPylonZTop: engine.position[2] + radius + engine.pylonHeight,
      isWingMounted: false,
    };
  }

  const halfSpan = Math.max(0.1, wing.span / 2);
  const spanT = Math.min(0.98, Math.max(0, Math.abs(engine.position[1] - wing.rootPos[1]) / halfSpan));
  const sweepRad = (wing.sweep * Math.PI) / 180;
  const dihedralRad = ((wing.dihedral || 0) * Math.PI) / 180;

  // Wing local vertical height at this span station
  const wingZ = wing.rootPos[2] + spanT * halfSpan * Math.sin(dihedralRad);
  const chord = wing.rootChord + (wing.tipChord - wing.rootChord) * spanT;
  const rootThick = wing.rootThickness || 12;
  const tipThick = wing.tipThickness ?? rootThick;
  const thickPercent = rootThick + (tipThick - rootThick) * spanT;
  const halfThick = chord * (thickPercent / 100) * 0.45;

  const radius = engine.diameter / 2;
  const mountStyle = engine.mountStyle || 'underwing';

  let engineZ: number;
  let pylonZTop: number;
  let pylonHeight: number;

  if (mountStyle === 'overwing') {
    const wingUpperZ = wingZ + halfThick;
    pylonHeight = Math.max(0.08, engine.pylonHeight || 0.35);
    engineZ = wingUpperZ + radius + pylonHeight;
    pylonZTop = wingUpperZ;
  } else {
    // Standard underwing mount
    const wingLowerZ = wingZ - halfThick;
    pylonHeight = Math.max(0.08, engine.pylonHeight || 0.4);
    engineZ = wingLowerZ - radius - pylonHeight;
    pylonZTop = wingLowerZ;
  }

  const wingX = wing.rootPos[0] + spanT * halfSpan * Math.tan(sweepRad);
  const engineX = wingX + engine.position[0];

  return {
    actualPos: [engineX, engine.position[1], engineZ],
    actualPylonHeight: Math.max(0.08, Math.abs(pylonZTop - (engineZ + radius))),
    actualPylonZTop: pylonZTop,
    isWingMounted: true,
  };
}

/**
 * Builds 3D BufferGeometry for Hollow Engine Nacelle with open intake duct,
 * aerodynamic lip, inner duct wall, central spinner cone, fan/propeller blades, and aft core plug.
 */
export function generateEngineGeometry(
  engine: EngineComponent,
  wings?: WingComponent[],
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): THREE.BufferGeometry {
  if (!engine || !engine.visible) return new THREE.BufferGeometry();

  const geos: THREE.BufferGeometry[] = [];
  const radius = Math.max(0.05, engine.diameter / 2);
  const len = Math.max(0.1, engine.length);
  const isPropeller = engine.type === 'propeller';

  // Resolve dynamic wing attachment coordinates
  const attachment = computeEngineWingAttachment(engine, wings);
  const pos = attachment.actualPos; // [x, y, z] dynamically attached to wing

  // 1. Hollow Nacelle Shell (Outer Cowl, Aerodynamic Intake Lip, Inner Duct Wall & Exhaust Nozzle)
  const nacelleGeo = generateHollowNacelleGeometry(pos, radius, len, isPropeller, quality);
  geos.push(nacelleGeo);

  // 2. Central Spinner Cone
  const spinnerGeo = generateCenterSpinnerGeometry(pos, radius, len, isPropeller, quality);
  geos.push(spinnerGeo);

  // 3. Aft Core Exhaust Plug / Cone (for turbofan, turbojet, and EDF)
  if (!isPropeller) {
    const aftCoreGeo = generateAftCorePlugGeometry(pos, radius, len, quality);
    geos.push(aftCoreGeo);
  }

  // 4. Pylon mounting strut (bridges engine nacelle to wing underside or fuselage)
  if (engine.pylonHeight > 0 || attachment.isWingMounted) {
    const pylonWidth = Math.max(0.06, engine.pylonWidth || 0.2);
    const pylonLen = len * 0.7;

    const pylonBottomZ = pos[2] + radius * 0.95;
    const pylonTopZ = attachment.actualPylonZTop;
    const pH = Math.max(0.08, Math.abs(pylonTopZ - pylonBottomZ));
    const pCenterZ = (pylonBottomZ + pylonTopZ) / 2;

    const pylonGeo = new THREE.BoxGeometry(pylonLen, pH, pylonWidth);
    // Aviation mapping: X=length, Y=vertical (pos[2]), Z=lateral (pos[1])
    pylonGeo.translate(
      pos[0] + len * 0.45,
      pCenterZ,
      pos[1]
    );
    geos.push(ensureIndexed(pylonGeo));
  }

  // 5. Fan Blades (inside hollow duct) or Propeller Blades
  if (isPropeller) {
    const numBlades = engine.fanBlades || 4;
    const bladeLen = radius * 1.6;
    const bladeW = radius * 0.14;

    for (let b = 0; b < numBlades; b++) {
      const angle = (b / numBlades) * 2 * Math.PI;

      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0, 0);
      bladeShape.lineTo(bladeW / 2, bladeLen * 0.1);
      bladeShape.lineTo(bladeW / 2, bladeLen * 0.85);
      bladeShape.lineTo(bladeW * 0.2, bladeLen);
      bladeShape.lineTo(-bladeW * 0.2, bladeLen);
      bladeShape.lineTo(-bladeW / 2, bladeLen * 0.85);
      bladeShape.lineTo(-bladeW / 2, bladeLen * 0.1);
      bladeShape.closePath();

      const bladeGeo = new THREE.ShapeGeometry(bladeShape);
      const pitchMatrix = new THREE.Matrix4().makeRotationX(0.35);
      bladeGeo.applyMatrix4(pitchMatrix);
      const rotMatrix = new THREE.Matrix4().makeRotationX(angle);
      bladeGeo.applyMatrix4(rotMatrix);
      bladeGeo.translate(pos[0] - len * 0.05, pos[2], pos[1]);

      geos.push(ensureIndexed(bladeGeo));
    }
  } else {
    // Turbofan / Turbojet / EDF: Fan blades mounted INSIDE the hollow intake duct
    const numBlades = Math.max(12, engine.fanBlades || 18);
    const spinnerRad = radius * 0.32;
    const wallThick = radius * 0.085;
    const innerDuctRadAtFan = (radius * 0.98) - wallThick;
    const hubRad = spinnerRad * 0.92;
    const bladeSpan = Math.max(0.02, innerDuctRadAtFan - hubRad);
    const bladeW = radius * 0.08;
    const bladeThick = Math.max(0.008, radius * 0.015);

    const fanStationX = pos[0] + len * 0.16; // Fan stage situated 16% inside the duct

    for (let b = 0; b < numBlades; b++) {
      const angle = (b / numBlades) * 2 * Math.PI;

      const bladeGeo = new THREE.BoxGeometry(bladeW, bladeSpan, bladeThick);
      // Translate along blade span so base attaches to spinner hub and tip clears inner duct wall
      bladeGeo.translate(0, hubRad + bladeSpan / 2, 0);
      bladeGeo.rotateX(0.42); // Aerodynamic fan blade twist / pitch angle
      const rotMatrix = new THREE.Matrix4().makeRotationX(angle);
      bladeGeo.applyMatrix4(rotMatrix);
      bladeGeo.translate(fanStationX, pos[2], pos[1]);

      geos.push(ensureIndexed(bladeGeo));
    }
  }

  return mergeEngineGeometries(geos);
}

/**
 * Generates hollow nacelle geometry with outer cowl, smooth inlet lip, inner duct wall, and aft nozzle.
 */
function generateHollowNacelleGeometry(
  pos: [number, number, number],
  radius: number,
  len: number,
  isPropeller: boolean,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  let numRings = 24;
  let ptsPerRing = 36;
  if (quality === 'low') {
    numRings = 12;
    ptsPerRing = 18;
  } else if (quality === 'high') {
    numRings = 48;
    ptsPerRing = 72;
  } else if (quality === 'ultra') {
    numRings = 96;
    ptsPerRing = 144;
  }
  const wallThick = radius * (isPropeller ? 0.07 : 0.085);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 1. Compute Outer Profile Radii
  const outerRings: { x: number; r: number }[] = [];
  for (let i = 0; i <= numRings; i++) {
    const t = i / numRings;
    const xAbs = pos[0] + t * len;

    let rScale = 1.0;
    if (t < 0.06) {
      // Smooth inlet lip highlight
      rScale = 0.94 + 0.06 * Math.sin((t / 0.06) * (Math.PI / 2));
    } else if (t < 0.15) {
      rScale = 1.0;
    } else if (t > 0.68) {
      // Exhaust nozzle taper
      const nt = (t - 0.68) / 0.32;
      rScale = 1.0 - 0.20 * Math.pow(nt, 1.35);
    }

    outerRings.push({ x: xAbs, r: radius * rScale });
  }

  // 2. Compute Inner Duct Radii
  const innerRings: { x: number; r: number }[] = [];
  for (let i = 0; i <= numRings; i++) {
    const t = i / numRings;
    const xAbs = pos[0] + t * len;
    const outerR = outerRings[i].r;

    let innerR = outerR - wallThick;
    if (t < 0.08) {
      // Smooth inlet bellmouth curvature
      const nt = t / 0.08;
      innerR = outerR - wallThick * (0.55 + 0.45 * Math.sin(nt * Math.PI * 0.5));
    } else if (t > 0.75) {
      // Exhaust nozzle interior
      innerR = outerR - wallThick * 0.75;
    }

    innerRings.push({ x: xAbs, r: Math.max(0.04, innerR) });
  }

  // 3. Generate Outer Shell Vertices
  const outerStartIdx = 0;
  for (let r = 0; r <= numRings; r++) {
    const ring = outerRings[r];
    const u = r / numRings;
    for (let p = 0; p < ptsPerRing; p++) {
      const angle = (p / ptsPerRing) * Math.PI * 2;
      const v = p / ptsPerRing;
      const vy = pos[1] + ring.r * Math.sin(angle); // lateral
      const vz = pos[2] + ring.r * Math.cos(angle); // vertical
      // Aviation mapping: X=length, Y=vertical(vz), Z=lateral(vy)
      positions.push(ring.x, vz, vy);
      uvs.push(u, v);
    }
  }

  // Outer Shell Quads (Facing outward)
  for (let r = 0; r < numRings; r++) {
    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;
      const i0 = outerStartIdx + r * ptsPerRing + p;
      const i1 = outerStartIdx + r * ptsPerRing + pNext;
      const i2 = outerStartIdx + (r + 1) * ptsPerRing + pNext;
      const i3 = outerStartIdx + (r + 1) * ptsPerRing + p;

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  // 4. Generate Inner Shell Vertices
  const innerStartIdx = positions.length / 3;
  for (let r = 0; r <= numRings; r++) {
    const ring = innerRings[r];
    const u = r / numRings;
    for (let p = 0; p < ptsPerRing; p++) {
      const angle = (p / ptsPerRing) * Math.PI * 2;
      const v = p / ptsPerRing;
      const vy = pos[1] + ring.r * Math.sin(angle);
      const vz = pos[2] + ring.r * Math.cos(angle);
      positions.push(ring.x, vz, vy);
      uvs.push(u, v);
    }
  }

  // Inner Shell Quads (Facing inward toward duct axis)
  for (let r = 0; r < numRings; r++) {
    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;
      const i0 = innerStartIdx + r * ptsPerRing + p;
      const i1 = innerStartIdx + r * ptsPerRing + pNext;
      const i2 = innerStartIdx + (r + 1) * ptsPerRing + pNext;
      const i3 = innerStartIdx + (r + 1) * ptsPerRing + p;

      // Inward facing winding order
      indices.push(i0, i2, i1);
      indices.push(i0, i3, i2);
    }
  }

  // 5. Front Inlet Lip (Connecting Outer Ring 0 to Inner Ring 0) - Facing Forward (-X)
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    const outCurrent = outerStartIdx + p;
    const outNext = outerStartIdx + pNext;
    const inCurrent = innerStartIdx + p;
    const inNext = innerStartIdx + pNext;

    indices.push(outCurrent, inCurrent, outNext);
    indices.push(inCurrent, inNext, outNext);
  }

  // 6. Aft Exhaust Nozzle Lip (Connecting Outer Ring N to Inner Ring N) - Facing Aft (+X)
  const lastOuterOffset = outerStartIdx + numRings * ptsPerRing;
  const lastInnerOffset = innerStartIdx + numRings * ptsPerRing;
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    const outCurrent = lastOuterOffset + p;
    const outNext = lastOuterOffset + pNext;
    const inCurrent = lastInnerOffset + p;
    const inNext = lastInnerOffset + pNext;

    indices.push(outCurrent, outNext, inCurrent);
    indices.push(inCurrent, outNext, inNext);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Generates aerodynamic center spinner / ogive cone inside the intake duct.
 */
function generateCenterSpinnerGeometry(
  pos: [number, number, number],
  radius: number,
  len: number,
  isPropeller: boolean,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  let numRings = 14;
  let ptsPerRing = 24;
  if (quality === 'low') {
    numRings = 8;
    ptsPerRing = 12;
  } else if (quality === 'high') {
    numRings = 28;
    ptsPerRing = 48;
  } else if (quality === 'ultra') {
    numRings = 56;
    ptsPerRing = 96;
  }
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const spinnerRad = radius * (isPropeller ? 0.38 : 0.32);
  const spinnerLen = len * (isPropeller ? 0.35 : 0.28);
  const startX = isPropeller ? pos[0] - len * 0.12 : pos[0] + len * 0.05;

  // Apex tip vertex at index 0
  positions.push(startX, pos[2], pos[1]);
  uvs.push(0, 0.5);

  for (let r = 1; r <= numRings; r++) {
    const t = r / numRings;
    const x = startX + t * spinnerLen;
    // Ogive nose profile curve
    const rFrac = Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2)));
    const currentR = Math.max(0.005, spinnerRad * rFrac);

    for (let p = 0; p < ptsPerRing; p++) {
      const angle = (p / ptsPerRing) * Math.PI * 2;
      const vy = pos[1] + currentR * Math.sin(angle);
      const vz = pos[2] + currentR * Math.cos(angle);
      positions.push(x, vz, vy);
      uvs.push(t, p / ptsPerRing);
    }
  }

  // Connect apex to ring 1
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    indices.push(0, 1 + pNext, 1 + p);
  }

  // Connect subsequent rings
  for (let r = 1; r < numRings; r++) {
    const rStart = 1 + (r - 1) * ptsPerRing;
    const nextRStart = 1 + r * ptsPerRing;
    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;
      const i0 = rStart + p;
      const i1 = rStart + pNext;
      const i2 = nextRStart + pNext;
      const i3 = nextRStart + p;

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  // Spinner base cap
  const lastOffset = 1 + (numRings - 1) * ptsPerRing;
  const baseCenterIdx = positions.length / 3;
  positions.push(startX + spinnerLen, pos[2], pos[1]);
  uvs.push(1, 0.5);
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    indices.push(baseCenterIdx, lastOffset + p, lastOffset + pNext);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Generates aft core exhaust cone / plug inside the rear of the engine.
 */
function generateAftCorePlugGeometry(
  pos: [number, number, number],
  radius: number,
  len: number,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  let numRings = 12;
  let ptsPerRing = 24;
  if (quality === 'low') {
    numRings = 6;
    ptsPerRing = 12;
  } else if (quality === 'high') {
    numRings = 24;
    ptsPerRing = 48;
  } else if (quality === 'ultra') {
    numRings = 48;
    ptsPerRing = 96;
  }
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const plugRad = radius * 0.32;
  const startX = pos[0] + len * 0.65;
  const endX = pos[0] + len * 1.04;
  const plugLen = endX - startX;

  // Base cap of core generator
  const baseCenterIdx = 0;
  positions.push(startX, pos[2], pos[1]);
  uvs.push(0, 0.5);

  for (let r = 0; r < numRings; r++) {
    const t = r / numRings;
    const x = startX + t * plugLen;
    const rFrac = 1.0 - t;
    const currentR = Math.max(0.005, plugRad * rFrac);

    for (let p = 0; p < ptsPerRing; p++) {
      const angle = (p / ptsPerRing) * Math.PI * 2;
      const vy = pos[1] + currentR * Math.sin(angle);
      const vz = pos[2] + currentR * Math.cos(angle);
      positions.push(x, vz, vy);
      uvs.push(t, p / ptsPerRing);
    }
  }

  // Connect base cap to ring 0
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    indices.push(baseCenterIdx, 1 + p, 1 + pNext);
  }

  // Tip apex vertex
  const apexIdx = positions.length / 3;
  positions.push(endX, pos[2], pos[1]);
  uvs.push(1, 0.5);

  // Connect rings
  for (let r = 0; r < numRings - 1; r++) {
    const rStart = 1 + r * ptsPerRing;
    const nextRStart = 1 + (r + 1) * ptsPerRing;
    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;
      const i0 = rStart + p;
      const i1 = rStart + pNext;
      const i2 = nextRStart + pNext;
      const i3 = nextRStart + p;

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  // Connect last ring to apex
  const lastOffset = 1 + (numRings - 1) * ptsPerRing;
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    indices.push(apexIdx, lastOffset + p, lastOffset + pNext);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Ensure a BufferGeometry has an index.
 */
function ensureIndexed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.index) {
    const posCount = geo.attributes.position.count;
    const idxArr = new Uint32Array(posCount);
    for (let i = 0; i < posCount; i++) {
      idxArr[i] = i;
    }
    geo.setIndex(new THREE.BufferAttribute(idxArr, 1));
  }
  return geo;
}

function mergeEngineGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geos.length === 0) return new THREE.BufferGeometry();
  if (geos.length === 1) return geos[0];

  let totalPos = 0;
  let totalIdx = 0;

  for (const g of geos) {
    totalPos += g.attributes.position.count * 3;
    if (g.index) totalIdx += g.index.count;
  }

  const mergedPos = new Float32Array(totalPos);
  const mergedNrm = new Float32Array(totalPos);
  const mergedIdx = new Uint32Array(totalIdx);

  let pOff = 0;
  let iOff = 0;
  let vOff = 0;

  for (const g of geos) {
    if (!g.attributes.normal) {
      g.computeVertexNormals();
    }

    const posArr = g.attributes.position.array;
    mergedPos.set(posArr, pOff);

    if (g.attributes.normal) {
      const nrmArr = g.attributes.normal.array;
      mergedNrm.set(nrmArr, pOff);
    }

    pOff += posArr.length;

    if (g.index) {
      const idxArr = g.index.array;
      for (let i = 0; i < idxArr.length; i++) {
        mergedIdx[iOff + i] = idxArr[i] + vOff;
      }
      iOff += idxArr.length;
    }

    vOff += g.attributes.position.count;
  }

  const res = new THREE.BufferGeometry();
  res.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  res.setAttribute('normal', new THREE.BufferAttribute(mergedNrm, 3));
  res.setIndex(new THREE.BufferAttribute(mergedIdx, 1));
  res.computeVertexNormals();

  return res;
}
