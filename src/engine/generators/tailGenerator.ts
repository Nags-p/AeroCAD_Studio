import * as THREE from 'three';
import { TailComponent, WingComponent } from '@/types/aircraft';
import { generateWingGeometry } from './wingGenerator';

/**
 * Builds standard 3D BufferGeometry for Tail configurations (Conventional, V-Tail, T-Tail, Twin-Tail, Canard).
 */
export function generateTailGeometry(tail: TailComponent): THREE.BufferGeometry {
  if (!tail || !tail.visible) return new THREE.BufferGeometry();

  const pos = tail.position;

  // Convert Tail configuration into parametric Wing components and invoke wing generator
  if (tail.type === 'v-tail') {
    const vWing: WingComponent = {
      id: tail.id,
      name: tail.name,
      visible: true,
      locked: false,
      span: tail.horizontalSpan,
      rootChord: tail.horizontalChord,
      tipChord: tail.horizontalChord * 0.6,
      sweep: tail.sweep,
      dihedral: tail.dihedral > 0 ? tail.dihedral : 35, // Dihedral angle for V-tail fins
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0010',
      rootPos: pos,
      color: tail.color,
      winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
    };
    return generateWingGeometry(vWing);
  }

  if (tail.type === 't-tail') {
    // Vertical tail fin
    const vertWing: WingComponent = {
      id: tail.id + '_v',
      name: tail.name + ' Vertical',
      visible: true,
      locked: false,
      span: tail.verticalHeight * 2,
      rootChord: tail.verticalChord,
      tipChord: tail.verticalChord * 0.7,
      sweep: tail.sweep,
      dihedral: 90, // vertical standing
      twist: 0,
      rootThickness: 12,
      tipThickness: 9,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0012',
      rootPos: pos,
      color: tail.color,
      winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
    };

    // Top horizontal tail mounted at top of vertical fin
    const topPos: [number, number, number] = [
      pos[0] + tail.verticalHeight * Math.tan((tail.sweep * Math.PI) / 180),
      pos[1],
      pos[2] + tail.verticalHeight,
    ];

    const horizWing: WingComponent = {
      id: tail.id + '_h',
      name: tail.name + ' Horizontal',
      visible: true,
      locked: false,
      span: tail.horizontalSpan,
      rootChord: tail.horizontalChord,
      tipChord: tail.horizontalChord * 0.65,
      sweep: tail.sweep * 0.7,
      dihedral: 0,
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0009',
      rootPos: topPos,
      color: tail.color,
      winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
    };

    return mergeGeometries([generateWingGeometry(vertWing), generateWingGeometry(horizWing)]);
  }

  if (tail.type === 'twin-tail') {
    // Central horizontal stab
    const horizWing: WingComponent = {
      id: tail.id + '_h',
      name: tail.name + ' Central',
      visible: true,
      locked: false,
      span: tail.horizontalSpan,
      rootChord: tail.horizontalChord,
      tipChord: tail.horizontalChord * 0.8,
      sweep: tail.sweep * 0.5,
      dihedral: 0,
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0010',
      rootPos: pos,
      color: tail.color,
      winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
    };

    // Left & right twin vertical fins mounted on horizontal tips
    const tipOffsetZ = tail.horizontalSpan / 2;
    const finRightPos: [number, number, number] = [pos[0], pos[1] + tipOffsetZ, pos[2]];
    const finLeftPos: [number, number, number] = [pos[0], pos[1] - tipOffsetZ, pos[2]];

    const rFin: WingComponent = {
      id: tail.id + '_rf',
      name: 'Right Fin',
      visible: true,
      locked: false,
      span: tail.verticalHeight * 2,
      rootChord: tail.verticalChord,
      tipChord: tail.verticalChord * 0.6,
      sweep: tail.sweep,
      dihedral: 90,
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0010',
      rootPos: finRightPos,
      color: tail.color,
      winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
    };

    const lFin: WingComponent = { ...rFin, id: tail.id + '_lf', rootPos: finLeftPos };

    return mergeGeometries([
      generateWingGeometry(horizWing),
      generateWingGeometry(rFin),
      generateWingGeometry(lFin),
    ]);
  }

  // Default: Conventional Tail (Horizontal + Vertical)
  const horiz: WingComponent = {
    id: tail.id + '_h',
    name: tail.name + ' Horiz',
    visible: true,
    locked: false,
    span: tail.horizontalSpan,
    rootChord: tail.horizontalChord,
    tipChord: tail.horizontalChord * 0.6,
    sweep: tail.sweep,
    dihedral: tail.dihedral,
    twist: 0,
    rootThickness: 10,
    tipThickness: 8,
    rootCamber: 0,
    tipCamber: 0,
    airfoilName: 'NACA 0009',
    rootPos: pos,
    color: tail.color,
    winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
  };

  const vert: WingComponent = {
    id: tail.id + '_v',
    name: tail.name + ' Vert',
    visible: true,
    locked: false,
    span: tail.verticalHeight * 2,
    rootChord: tail.verticalChord,
    tipChord: tail.verticalChord * 0.6,
    sweep: tail.sweep + 5,
    dihedral: 90,
    twist: 0,
    rootThickness: 12,
    tipThickness: 9,
    rootCamber: 0,
    tipCamber: 0,
    airfoilName: 'NACA 0012',
    rootPos: pos,
    color: tail.color,
    winglets: { enabled: false, height: 0, sweep: 0, cant: 0, toe: 0, filletRadius: 0 },
  };

  return mergeGeometries([generateWingGeometry(horiz), generateWingGeometry(vert)]);
}

function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
