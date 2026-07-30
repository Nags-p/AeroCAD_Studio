import * as THREE from 'three';
import { WingComponent, WingletConfig } from '@/types/aircraft';
import { generateNACA4Digit } from '../math/naca';

/**
 * OpenVSP Refined Wing & 100% C1/C2 Tangent Smooth Fillet Arc Winglet Builder.
 */
export function generateWingGeometry(w: WingComponent, isVertical: boolean = false): THREE.BufferGeometry {
  const spanSections = 32;
  const wl = w.winglets;
  const wingletSections = wl && wl.enabled && !isVertical ? 32 : 0;
  const chordSamples = 32;

  const airfoil = generateNACA4Digit(w.airfoilName || 'NACA 2412', chordSamples);

  const halfSpan = w.span / 2;
  const sweepRad = (w.sweep * Math.PI) / 180;
  const dihedralRad = ((w.dihedral || 0) * Math.PI) / 180;

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sides = isVertical ? [1] : [1, -1];

  sides.forEach((sideMultiplier) => {
    const baseIndex = vertices.length / 3;

    // SECTION 1: MAIN WING PLANFORM
    for (let s = 0; s <= spanSections; s++) {
      const spanT = s / spanSections;
      const chord = w.rootChord + (w.tipChord - w.rootChord) * spanT;
      const xOffset = spanT * halfSpan * Math.tan(sweepRad);

      let y = spanT * halfSpan * Math.cos(dihedralRad) * sideMultiplier;
      let z = spanT * halfSpan * Math.sin(dihedralRad);

      if (isVertical) {
        z = spanT * halfSpan;
        y = 0;
      }

      for (let c = 0; c <= chordSamples; c++) {
        const pt = airfoil.upper[c];
        if (isVertical) {
          vertices.push(w.rootPos[0] + xOffset + pt.x * chord, w.rootPos[2] + z, w.rootPos[1] + pt.y * chord);
        } else {
          vertices.push(w.rootPos[0] + xOffset + pt.x * chord, w.rootPos[2] + z + pt.y * chord, w.rootPos[1] + y);
        }
        uvs.push(spanT, c / chordSamples);
      }

      for (let c = chordSamples; c >= 0; c--) {
        const pt = airfoil.lower[c];
        if (isVertical) {
          vertices.push(w.rootPos[0] + xOffset + pt.x * chord, w.rootPos[2] + z, w.rootPos[1] + pt.y * chord);
        } else {
          vertices.push(w.rootPos[0] + xOffset + pt.x * chord, w.rootPos[2] + z + pt.y * chord, w.rootPos[1] + y);
        }
        uvs.push(spanT, c / chordSamples);
      }
    }

    // SECTION 2: 100% C1/C2 TANGENT SMOOTH FILLET ARC WINGLET EXTENSION
    if (wl && wl.enabled && !isVertical) {
      const tipX = halfSpan * Math.tan(sweepRad);
      const tipY = halfSpan * Math.cos(dihedralRad) * sideMultiplier;
      const tipZ = halfSpan * Math.sin(dihedralRad);

      const wlSweepRad = (wl.sweep * Math.PI) / 180;
      const targetCantRad = (wl.cant * Math.PI) / 180;
      const R_fillet = wl.filletRadius !== undefined ? wl.filletRadius : 0.6;
      const wlTotalHeight = Math.max(0.001, wl.height);
      const wlTipChord = wl.tip !== undefined ? wl.tip : w.tipChord * 0.5;

      let currX = tipX;
      let currY = tipY;
      let currZ = tipZ;

      const ds = wlTotalHeight / wingletSections;

      for (let ws = 1; ws <= wingletSections; ws++) {
        const wlT = ws / wingletSections;
        const sLoc = wlT * wlTotalHeight;
        const chord = w.tipChord + (wlTipChord - w.tipChord) * wlT;

        let alpha = 1.0;

        if (R_fillet <= 0.001) {
          alpha = 1.0;
        } else if (sLoc <= R_fillet) {
          const u = Math.min(1.0, Math.max(0.0, sLoc / R_fillet));
          alpha = u * u * u * (u * (u * 6.0 - 15.0) + 10.0); // C1/C2 smooth quintic polynomial
        } else {
          alpha = 1.0;
        }

        const currentAngle = dihedralRad + (Math.PI / 2 - targetCantRad - dihedralRad) * alpha;

        const dx = ds * Math.tan(wlSweepRad);
        const dy = ds * Math.cos(currentAngle) * sideMultiplier;
        const dz = ds * Math.sin(currentAngle);

        currX += dx;
        currY += dy;
        currZ += dz;

        const nY = -Math.sin(currentAngle) * sideMultiplier;
        const nZ = Math.cos(currentAngle);

        for (let c = 0; c <= chordSamples; c++) {
          const pt = airfoil.upper[c];
          const tThick = pt.y * chord;

          vertices.push(
            w.rootPos[0] + currX + pt.x * chord,
            w.rootPos[2] + currZ + tThick * nZ,
            w.rootPos[1] + currY + tThick * nY
          );
          uvs.push(1 + wlT, c / chordSamples);
        }

        for (let c = chordSamples; c >= 0; c--) {
          const pt = airfoil.lower[c];
          const tThick = pt.y * chord;

          vertices.push(
            w.rootPos[0] + currX + pt.x * chord,
            w.rootPos[2] + currZ + tThick * nZ,
            w.rootPos[1] + currY + tThick * nY
          );
          uvs.push(1 + wlT, c / chordSamples);
        }
      }
    }

    const totalSections = spanSections + wingletSections;
    const ptsPerSection = (chordSamples + 1) * 2;

    for (let s = 0; s < totalSections; s++) {
      for (let p = 0; p < ptsPerSection - 1; p++) {
        const curr = baseIndex + s * ptsPerSection + p;
        const next = curr + 1;
        const currAbove = curr + ptsPerSection;
        const nextAbove = next + ptsPerSection;

        if (sideMultiplier === 1) {
          indices.push(curr, next, currAbove);
          indices.push(next, nextAbove, currAbove);
        } else {
          indices.push(curr, currAbove, next);
          indices.push(next, currAbove, nextAbove);
        }
      }
    }
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
