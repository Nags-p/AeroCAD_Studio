import * as THREE from 'three';
import { EngineComponent } from '@/types/aircraft';
import { generateSuperellipseSection } from '../math/superellipse';
import { loftRingsToBufferGeometry, RingStation } from '../math/lofting';

/**
 * Builds 3D BufferGeometry for Engine nacelles, pylons, spinners, and fan/propeller blades.
 */
export function generateEngineGeometry(engine: EngineComponent): THREE.BufferGeometry {
  if (!engine || !engine.visible) return new THREE.BufferGeometry();

  const geos: THREE.BufferGeometry[] = [];
  const radius = engine.diameter / 2;
  const len = engine.length;
  const pos = engine.position; // [x, y, z]

  // 1. Nacelle Outer Shell & Inlet Cowl
  const numRings = 12;
  const ringStations: RingStation[] = [];
  const ptsPerRing = 24;

  for (let i = 0; i <= numRings; i++) {
    const t = i / numRings;
    const xAbs = pos[0] + t * len;

    // Profile curve: inlet highlight lip -> barrel -> aft nozzle taper
    let rScale = 1.0;
    if (t < 0.15) {
      // Inlet lip contraction
      rScale = 0.85 + 0.15 * Math.sin((t / 0.15) * (Math.PI / 2));
    } else if (t > 0.7) {
      // Exhaust nozzle contraction
      const nt = (t - 0.7) / 0.3;
      rScale = 1.0 - 0.25 * Math.pow(nt, 1.2);
    }

    const currentRadius = radius * rScale;
    const pts = generateSuperellipseSection(currentRadius, currentRadius, 2.0, ptsPerRing, pos[1], pos[2]);

    ringStations.push({ x: xAbs, points: pts });
  }

  const nacelleGeo = loftRingsToBufferGeometry(ringStations, true, true);
  geos.push(nacelleGeo);

  // 2. Central Fan Spinner Cone
  const spinnerLen = len * 0.3;
  const spinnerRad = radius * 0.35;
  const spinnerRings: RingStation[] = [];

  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const xAbs = pos[0] + t * spinnerLen;
    const rScale = Math.sin((t * Math.PI) / 2);
    const pts = generateSuperellipseSection(spinnerRad * rScale, spinnerRad * rScale, 2.0, 16, pos[1], pos[2]);
    spinnerRings.push({ x: xAbs, points: pts });
  }

  geos.push(loftRingsToBufferGeometry(spinnerRings, true, true));

  // 3. Pylon mounting strut
  if (engine.pylonHeight > 0) {
    const pylonWidth = Math.max(0.05, engine.pylonWidth);
    const pylonLen = len * 0.7;
    const pylonHeight = engine.pylonHeight;

    const pylonGeo = new THREE.BoxGeometry(pylonLen, pylonHeight, pylonWidth);
    pylonGeo.translate(
      pos[0] + len * 0.45,
      pos[2] + radius + pylonHeight / 2, // vertical offset
      pos[1] // lateral
    );
    geos.push(pylonGeo);
  }

  // 4. Propeller / Fan Blades (if engine.type === 'propeller' or turbofan)
  const numBlades = engine.type === 'propeller' ? 3 : engine.fanBlades || 12;
  const bladeLength = engine.type === 'propeller' ? radius * 1.8 : radius * 0.85;
  const bladeWidth = radius * 0.12;

  for (let b = 0; b < numBlades; b++) {
    const angle = (b / numBlades) * 2 * Math.PI;

    const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeLength, 0.02);
    bladeGeo.rotateX(0.3); // Pitch angle twist
    bladeGeo.rotateZ(angle);
    bladeGeo.translate(pos[0] + 0.05, pos[2] + (bladeLength / 2) * Math.cos(angle), pos[1] + (bladeLength / 2) * Math.sin(angle));

    geos.push(bladeGeo);
  }

  return mergeEngineGeometries(geos);
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
  const mergedIdx = new Uint32Array(totalIdx);

  let pOff = 0;
  let iOff = 0;
  let vOff = 0;

  for (const g of geos) {
    const posArr = g.attributes.position.array;
    mergedPos.set(posArr, pOff);
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
  res.setIndex(new THREE.BufferAttribute(mergedIdx, 1));
  res.computeVertexNormals();

  return res;
}
