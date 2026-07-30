import * as THREE from 'three';
import { GearComponent } from '@/types/aircraft';

/**
 * Builds 3D BufferGeometry for Nose Gear and Main Landing Gear.
 */
export function generateGearGeometry(gear: GearComponent): THREE.BufferGeometry {
  if (!gear || !gear.visible) return new THREE.BufferGeometry();

  const geos: THREE.BufferGeometry[] = [];

  // Helper to build single gear assembly (strut + axle + 2 wheels)
  const buildGearUnit = (
    posX: number,
    posY: number,
    posZ: number,
    strutLen: number,
    wheelDiam: number,
    retractDeg: number = 0
  ) => {
    const x = isNaN(posX) ? 0 : posX;
    const y = isNaN(posY) ? 0 : posY;
    const z = isNaN(posZ) ? 0 : posZ;
    const sLen = Math.max(0.2, isNaN(strutLen) ? 1.4 : strutLen);
    const wDiam = Math.max(0.1, isNaN(wheelDiam) ? 0.6 : wheelDiam);
    const rDeg = isNaN(retractDeg) ? 0 : retractDeg;

    // Oleo strut cylinder
    const strutRadius = Math.max(0.04, wDiam * 0.25);
    const strutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius * 0.9, sLen, 16);

    // Apply retraction pivot rotation if needed
    if (rDeg > 0) {
      strutGeo.rotateZ((rDeg * Math.PI) / 180);
    }

    strutGeo.translate(x, z - sLen / 2, y);
    geos.push(strutGeo);

    // Axle
    const axleLen = wDiam * 1.4;
    const axleGeo = new THREE.CylinderGeometry(strutRadius * 0.7, strutRadius * 0.7, axleLen, 12);
    axleGeo.rotateX(Math.PI / 2); // horizontal axle
    axleGeo.translate(x, z - sLen, y);
    geos.push(axleGeo);

    // Left & Right Rubber Tires (Torus)
    const tireRadius = wDiam / 2;
    const tubeRadius = wDiam * 0.22;

    const tireLeft = new THREE.TorusGeometry(tireRadius, tubeRadius, 16, 24);
    tireLeft.rotateY(Math.PI / 2);
    tireLeft.translate(x, z - sLen, y + axleLen / 2);
    geos.push(tireLeft);

    const tireRight = new THREE.TorusGeometry(tireRadius, tubeRadius, 16, 24);
    tireRight.rotateY(Math.PI / 2);
    tireRight.translate(x, z - sLen, y - axleLen / 2);
    geos.push(tireRight);
  };

  // 1. Nose Gear
  const ng = gear.noseGear || {};
  const ngX = ng.position ? ng.position[0] : ((ng as any).x !== undefined ? (ng as any).x : -3.5);
  const ngY = ng.position ? ng.position[1] : ((ng as any).y !== undefined ? (ng as any).y : 0);
  const ngZ = ng.position ? ng.position[2] : ((ng as any).z !== undefined ? (ng as any).z : -1.2);
  const ngRetract = (ng as any).retractionAngle || 0;

  buildGearUnit(ngX, ngY, ngZ, ng.strutLength || 1.3, ng.wheelDiameter || 0.5, ngRetract);

  // 2. Left & Right Main Gear
  const mg = gear.mainGear || {};
  const mgX = mg.position ? mg.position[0] : ((mg as any).x !== undefined ? (mg as any).x : 1.8);
  const mgY = mg.position ? mg.position[1] : ((mg as any).y !== undefined ? (mg as any).y : 0);
  const mgZ = mg.position ? mg.position[2] : ((mg as any).z !== undefined ? (mg as any).z : -1.3);
  const mgRetract = mg.retractionAngle || 0;
  const trackHalf = (mg.trackWidth || 3.2) / 2;

  buildGearUnit(mgX, mgY + trackHalf, mgZ, mg.strutLength || 1.4, mg.wheelDiameter || 0.7, mgRetract);
  buildGearUnit(mgX, mgY - trackHalf, mgZ, mg.strutLength || 1.4, mg.wheelDiameter || 0.7, mgRetract);

  return mergeGearGeometries(geos);
}

function mergeGearGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
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

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setIndex(new THREE.BufferAttribute(mergedIdx, 1));
  merged.computeVertexNormals();

  return merged;
}
