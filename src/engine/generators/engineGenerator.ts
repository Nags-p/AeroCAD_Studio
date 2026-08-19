import * as THREE from 'three';
import { EngineComponent, WingComponent } from '@/types/aircraft';
import { generateSuperellipseSection } from '../math/superellipse';
import { loftRingsToBufferGeometry, RingStation } from '../math/lofting';

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

  const engineX = engine.position[0];

  return {
    actualPos: [engineX, engine.position[1], engineZ],
    actualPylonHeight: Math.max(0.08, Math.abs(pylonZTop - (engineZ + radius))),
    actualPylonZTop: pylonZTop,
    isWingMounted: true,
  };
}

/**
 * Builds 3D BufferGeometry for Engine nacelles, pylons, spinners, and fan/propeller blades.
 * Dynamically conforms and attaches pylon to parent wing when wing is provided.
 */
export function generateEngineGeometry(
  engine: EngineComponent,
  wings?: WingComponent[]
): THREE.BufferGeometry {
  if (!engine || !engine.visible) return new THREE.BufferGeometry();

  const geos: THREE.BufferGeometry[] = [];
  const radius = engine.diameter / 2;
  const len = engine.length;

  // Resolve dynamic wing attachment coordinates
  const attachment = computeEngineWingAttachment(engine, wings);
  const pos = attachment.actualPos; // [x, y, z] dynamically attached to wing

  // 1. Nacelle Outer Shell & Inlet Cowl
  const numRings = 16;
  const ptsPerRing = 32;

  const nacelleRings: RingStation[] = [];
  for (let i = 0; i <= numRings; i++) {
    const t = i / numRings;
    const xAbs = pos[0] + t * len;

    // Profile curve: inlet highlight lip -> barrel -> aft nozzle taper
    let rScale = 1.0;
    if (t < 0.08) {
      // Inlet lip: slight flare then contract
      rScale = 0.92 + 0.08 * Math.sin((t / 0.08) * Math.PI);
    } else if (t < 0.15) {
      // Smooth transition from lip to barrel
      const nt = (t - 0.08) / 0.07;
      rScale = 1.0 - 0.02 * (1 - nt);
    } else if (t > 0.75) {
      // Exhaust nozzle contraction
      const nt = (t - 0.75) / 0.25;
      rScale = 1.0 - 0.3 * Math.pow(nt, 1.5);
    }

    const currentRadius = radius * rScale;
    const pts = generateSuperellipseSection(currentRadius, currentRadius, 2.0, ptsPerRing, pos[1], pos[2]);

    nacelleRings.push({ x: xAbs, points: pts });
  }

  // Use custom lofting that respects offset center for caps
  const nacelleGeo = loftNacelleGeometry(nacelleRings, pos[1], pos[2]);
  geos.push(nacelleGeo);

  // 2. Central Fan Spinner Cone
  const spinnerLen = len * 0.25;
  const spinnerRad = radius * 0.32;
  const spinnerRings: RingStation[] = [];

  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const xAbs = pos[0] + t * spinnerLen;
    // Ogive spinner profile
    const rScale = Math.sqrt(1 - Math.pow(1 - t, 2));
    const r = Math.max(0.001, spinnerRad * rScale);
    const pts = generateSuperellipseSection(r, r, 2.0, 20, pos[1], pos[2]);
    spinnerRings.push({ x: xAbs, points: pts });
  }

  geos.push(loftNacelleGeometry(spinnerRings, pos[1], pos[2]));

  // 3. Pylon mounting strut (seamlessly bridges between engine nacelle and wing underside)
  if (engine.pylonHeight > 0 || attachment.isWingMounted) {
    const pylonWidth = Math.max(0.06, engine.pylonWidth || 0.2);
    const pylonLen = len * 0.7;

    const pylonBottomZ = pos[2] + radius;
    const pylonTopZ = attachment.actualPylonZTop;
    const pH = Math.max(0.08, Math.abs(pylonTopZ - pylonBottomZ));
    const pCenterZ = (pylonBottomZ + pylonTopZ) / 2;

    const pylonGeo = new THREE.BoxGeometry(pylonLen, pH, pylonWidth);
    // Lofting maps: X=length, Y=z(vertical), Z=y(lateral)
    pylonGeo.translate(
      pos[0] + len * 0.45,
      pCenterZ,
      pos[1]
    );
    // Ensure indexed for merge
    const indexedPylon = ensureIndexed(pylonGeo);
    geos.push(indexedPylon);
  }

  // 4. Fan Blades (turbofan/edf) or Propeller Blades
  if (engine.type === 'propeller') {
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
      bladeGeo.translate(pos[0] + len * 0.02, pos[2], pos[1]);

      geos.push(ensureIndexed(bladeGeo));
    }
  } else {
    const numBlades = engine.fanBlades || 16;
    const bladeLen = radius * 0.78;
    const bladeW = radius * 0.06;
    const hubRad = spinnerRad * 0.9;

    for (let b = 0; b < numBlades; b++) {
      const angle = (b / numBlades) * 2 * Math.PI;

      const bladeGeo = new THREE.BoxGeometry(bladeW, bladeLen, 0.015);
      bladeGeo.translate(0, hubRad + bladeLen / 2, 0);
      bladeGeo.rotateX(0.25);
      const rotMatrix = new THREE.Matrix4().makeRotationX(angle);
      bladeGeo.applyMatrix4(rotMatrix);
      bladeGeo.translate(pos[0] + len * 0.06, pos[2], pos[1]);

      geos.push(ensureIndexed(bladeGeo));
    }
  }

  return mergeEngineGeometries(geos);
}

/**
 * Loft nacelle rings with proper cap center points at the engine offset position.
 */
function loftNacelleGeometry(
  rings: RingStation[],
  centerY: number,
  centerZ: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  if (rings.length < 2) return geometry;

  const numRings = rings.length;
  const ptsPerRing = rings[0].points.length;

  const positions: number[] = [];
  const indices: number[] = [];

  // Build grid vertices
  for (let r = 0; r < numRings; r++) {
    const ring = rings[r];
    for (let p = 0; p < ptsPerRing; p++) {
      const pt = ring.points[p];
      // X = length axis, Y = vertical (z in aviation), Z = lateral (y in aviation)
      positions.push(ring.x, pt.z, pt.y);
    }
  }

  // Build side quads
  for (let r = 0; r < numRings - 1; r++) {
    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;

      const i0 = r * ptsPerRing + p;
      const i1 = r * ptsPerRing + pNext;
      const i2 = (r + 1) * ptsPerRing + pNext;
      const i3 = (r + 1) * ptsPerRing + p;

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  // Cap start (front inlet) — center at the engine's y/z offset
  const startRing = rings[0];
  const startCenterIdx = positions.length / 3;
  positions.push(startRing.x, centerZ, centerY);
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    indices.push(startCenterIdx, pNext, p);
  }

  // Cap end (exhaust) — center at the engine's y/z offset
  const endRing = rings[rings.length - 1];
  const lastRingOffset = (numRings - 1) * ptsPerRing;
  const endCenterIdx = positions.length / 3;
  positions.push(endRing.x, centerZ, centerY);
  for (let p = 0; p < ptsPerRing; p++) {
    const pNext = (p + 1) % ptsPerRing;
    indices.push(endCenterIdx, lastRingOffset + p, lastRingOffset + pNext);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Ensure a BufferGeometry has an index (e.g. BoxGeometry may be non-indexed).
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
