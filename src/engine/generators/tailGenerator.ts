import * as THREE from 'three';
import { TailComponent, WingComponent } from '@/types/aircraft';
import { generateWingGeometry } from './wingGenerator';

/**
 * Builds standard 3D BufferGeometry for Tail configurations (Conventional, V-Tail, T-Tail, Twin-Tail, Canard).
 * Now uses independent horizontalSweep / verticalSweep when available, falling back to shared `sweep`.
 */
export function generateTailGeometry(tail: TailComponent): THREE.BufferGeometry {
  if (!tail || !tail.visible) return new THREE.BufferGeometry();

  const pos = tail.position;
  const hSweep = tail.horizontalSweep ?? tail.sweep;
  const vSweep = tail.verticalSweep ?? tail.sweep;
  const hTipChord = tail.horizontalTipChord ?? tail.horizontalChord * 0.6;
  const vTipChord = tail.verticalTipChord ?? tail.verticalChord * 0.6;

  // Helper to create a default disabled winglet config
  const noWinglets = () => ({ enabled: false, height: 0, root: 0, tip: 0, sweep: 0, cant: 0, filletRadius: 0 });

  // Convert Tail configuration into parametric Wing components and invoke wing generator
  if (tail.type === 'v-tail') {
    const vWing: WingComponent = {
      id: tail.id,
      name: tail.name,
      visible: true,
      locked: false,
      span: tail.horizontalSpan,
      rootChord: tail.horizontalChord,
      tipChord: hTipChord,
      sweep: hSweep,
      dihedral: tail.dihedral > 0 ? tail.dihedral : 35, // Dihedral angle for V-tail fins
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0010',
      rootPos: pos,
      color: tail.color,
      winglets: noWinglets(),
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
      tipChord: vTipChord,
      sweep: vSweep,
      dihedral: 90, // vertical standing
      twist: 0,
      rootThickness: 12,
      tipThickness: 9,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0012',
      rootPos: pos,
      color: tail.color,
      winglets: noWinglets(),
    };

    // Top horizontal tail mounted at top of vertical fin
    const topPos: [number, number, number] = [
      pos[0] + tail.verticalHeight * Math.tan((vSweep * Math.PI) / 180),
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
      tipChord: hTipChord,
      sweep: hSweep * 0.7,
      dihedral: 0,
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0009',
      rootPos: topPos,
      color: tail.color,
      winglets: noWinglets(),
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
      tipChord: hTipChord,
      sweep: hSweep * 0.5,
      dihedral: 0,
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0010',
      rootPos: pos,
      color: tail.color,
      winglets: noWinglets(),
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
      tipChord: vTipChord,
      sweep: vSweep,
      dihedral: 90,
      twist: 0,
      rootThickness: 10,
      tipThickness: 8,
      rootCamber: 0,
      tipCamber: 0,
      airfoilName: 'NACA 0010',
      rootPos: finRightPos,
      color: tail.color,
      winglets: noWinglets(),
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
    tipChord: hTipChord,
    sweep: hSweep,
    dihedral: tail.dihedral,
    twist: 0,
    rootThickness: 10,
    tipThickness: 8,
    rootCamber: 0,
    tipCamber: 0,
    airfoilName: 'NACA 0009',
    rootPos: pos,
    color: tail.color,
    winglets: noWinglets(),
  };

  const vert: WingComponent = {
    id: tail.id + '_v',
    name: tail.name + ' Vert',
    visible: true,
    locked: false,
    span: tail.verticalHeight * 2,
    rootChord: tail.verticalChord,
    tipChord: vTipChord,
    sweep: vSweep + 5,
    dihedral: 90,
    twist: 0,
    rootThickness: 12,
    tipThickness: 9,
    rootCamber: 0,
    tipCamber: 0,
    airfoilName: 'NACA 0012',
    rootPos: pos,
    color: tail.color,
    winglets: noWinglets(),
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
