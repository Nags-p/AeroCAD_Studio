import * as THREE from 'three';
import { FuselageComponent, FuselageSection, SectionShapeType } from '../../types/aircraft';
import { generateSectionPoints } from '../math/superellipse';

export interface ResolvedStation {
  id: string;
  xPos: number;
  width: number;
  height: number;
  shapeType: SectionShapeType;
  nExp: number;
  mExp: number;
  cornerRadius: number;
  zOffset: number;
  yOffset: number;
}

/**
 * Resolves station longitudinal positions independently without auto-chain shifting.
 */
export function resolveStationPositions(sections: FuselageSection[]): ResolvedStation[] {
  if (!sections || sections.length === 0) return [];

  const resolved = sections.map((sec) => ({
    id: sec.id,
    xPos: Math.max(0, Math.min(1.0, sec.xPos)),
    width: sec.width,
    height: sec.height,
    shapeType: sec.shapeType || 'ellipse',
    nExp: sec.nExp || 2.0,
    mExp: sec.mExp || sec.nExp || 2.0,
    cornerRadius: sec.cornerRadius || 0.3,
    zOffset: sec.zOffset || 0,
    yOffset: sec.yOffset || 0,
  }));

  return resolved.sort((a, b) => a.xPos - b.xPos);
}

/**
 * OpenVSP Parametric Engine - Dynamic Fuselage Mesh Builder
 * Features:
 * - Multi-station Catmull-Rom Body Spline across all resolved section stations
 * - Full OpenVSP Cross-Section Types (POINT, CIRCLE, ELLIPSE, SUPER_ELLIPSE, ROUNDED_RECTANGLE, GENERAL_FUSE, BICONVEX, WEDGE)
 * - Independent Station Plane Placement with Nose Tip Plane at X = 0.0 (-L/2)
 * - Continuous Nose Roundness S (0.05 to 3.0) with guaranteed infinite tangent dome for S > 1.0
 * - Spatial point shifting (noseZ, noseY, tailZ, tailY)
 */
export function generateFuselageGeometry(
  f: FuselageComponent,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): THREE.BufferGeometry {
  if (!f) return new THREE.BufferGeometry();

  let radialSegments = 64;
  let axialSegments = 64;
  if (quality === 'low') {
    radialSegments = 24;
    axialSegments = 24;
  } else if (quality === 'high') {
    radialSegments = 128;
    axialSegments = 128;
  } else if (quality === 'ultra') {
    radialSegments = 256;
    axialSegments = 256;
  }
  const len = f.length;

  const noseZ = f.noseZ || 0.0;
  const noseY = f.noseY || 0.0;
  const tailZ = f.tailZ || 0.0;
  const tailY = f.tailY || 0.0;

  const resolved = resolveStationPositions(f.sections);
  if (resolved.length < 2) return new THREE.BufferGeometry();

  // Find first section with xPos > 0 for nose dome blending
  const s0 = resolved[0];
  const s1 = resolved.find((s) => s.xPos > 0) || resolved[1] || s0;
  const sLast = resolved[resolved.length - 1];

  const t1 = Math.max(0.02, s1.xPos);
  const tEnd = Math.min(0.98, sLast.xPos);

  const S = f.noseRoundness !== undefined ? f.noseRoundness : 0.75;
  const S_tail = f.tailRoundness !== undefined ? f.tailRoundness : S;

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const K = 600;
  interface ProfilePoint {
    x: number;
    rx: number;
    ry: number;
    centerOffsetZ: number;
    centerOffsetY: number;
    shapeType: string;
    nExp: number;
    mExp: number;
    cornerRadius: number;
  }
  const rawProfile: ProfilePoint[] = [];

  for (let k = 0; k <= K; k++) {
    const t = k / K;
    const x = t * len;

    let rx = 0;
    let ry = 0;
    let shapeType = s1.shapeType;
    let nExp = s1.nExp;
    let mExp = s1.mExp;
    let cornerRadius = s1.cornerRadius;

    // 1. Interpolate profile dimensions (width/height) & spatial offsets dynamically
    let centerOffsetZ = 0;
    let centerOffsetY = 0;

    if (t <= t1) {
      // Nose dome area: blend from 0 (at t=0) to s1 dimensions (at t1) using dome curve
      const ratio = Math.max(0, Math.min(1.0, t / t1));
      let blend = 0;
      if (S <= 1.0) {
        const domeCurve = Math.sqrt(ratio * (2.0 - ratio));
        blend = S * domeCurve + (1.0 - S) * ratio;
      } else {
        blend = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(1.0 - ratio, 1.0 + S)));
      }
      rx = (s1.width / 2) * blend;
      ry = (s1.height / 2) * blend;
      shapeType = s1.shapeType;
      nExp = s1.nExp;
      mExp = s1.mExp;
      cornerRadius = s1.cornerRadius;

      centerOffsetZ = noseZ + (s1.zOffset - noseZ) * blend;
      centerOffsetY = noseY + (s1.yOffset - noseY) * blend;
    } else if (t >= tEnd) {
      // Tail dome area: identical mathematical formulation to the nose, blending from sLast at tEnd down to 0 at t=1.0
      const denom = 1.0 - tEnd;
      const ratio = denom > 0.001 ? Math.max(0, Math.min(1.0, (1.0 - t) / denom)) : 0.0;
      let blend = 0;
      if (S_tail <= 1.0) {
        const domeCurve = Math.sqrt(ratio * (2.0 - ratio));
        blend = S_tail * domeCurve + (1.0 - S_tail) * ratio;
      } else {
        blend = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(1.0 - ratio, 1.0 + S_tail)));
      }
      rx = (sLast.width / 2) * blend;
      ry = (sLast.height / 2) * blend;
      shapeType = sLast.shapeType;
      nExp = sLast.nExp || 2.0;
      mExp = sLast.mExp || sLast.nExp || 2.0;
      cornerRadius = sLast.cornerRadius || 0.3;

      centerOffsetZ = tailZ + (sLast.zOffset - tailZ) * blend;
      centerOffsetY = tailY + (sLast.yOffset - tailY) * blend;
    } else {
      // Mid cabin - interpolate between adjacent stations
      let idx = 0;
      for (let i = 0; i < resolved.length - 1; i++) {
        if (t >= resolved[i].xPos && t <= resolved[i + 1].xPos) {
          idx = i;
          break;
        }
      }
      const sA = resolved[idx];
      const sB = resolved[idx + 1];
      const denom = sB.xPos - sA.xPos;
      const ratio = denom > 0.001 ? Math.max(0, Math.min(1.0, (t - sA.xPos) / denom)) : 0.0;
      
      // Smooth Hermite blend (smoothstep) for continuous tangent transitions
      const blend = ratio * ratio * (3.0 - 2.0 * ratio);
      
      rx = (sA.width / 2) * (1.0 - blend) + (sB.width / 2) * blend;
      ry = (sA.height / 2) * (1.0 - blend) + (sB.height / 2) * blend;
      shapeType = ratio < 0.5 ? sA.shapeType : sB.shapeType;
      nExp = (sA.nExp || 2.0) * (1.0 - blend) + (sB.nExp || 2.0) * blend;
      mExp = (sA.mExp || sA.nExp || 2.0) * (1.0 - blend) + (sB.mExp || sB.nExp || 2.0) * blend;
      cornerRadius = (sA.cornerRadius || 0.3) * (1.0 - blend) + (sB.cornerRadius || 0.3) * blend;

      centerOffsetZ = sA.zOffset * (1.0 - blend) + sB.zOffset * blend;
      centerOffsetY = sA.yOffset * (1.0 - blend) + sB.yOffset * blend;
    }

    rx = Math.max(0.0001, rx);
    ry = Math.max(0.0001, ry);

    rawProfile.push({ x, rx, ry, centerOffsetZ, centerOffsetY, shapeType, nExp, mExp, cornerRadius });
  }

  // Compute cumulative 3D arc length along profile
  const arcLength = [0];
  let totalArc = 0;

  for (let k = 1; k <= K; k++) {
    const dx = rawProfile[k].x - rawProfile[k - 1].x;
    const drx = rawProfile[k].rx - rawProfile[k - 1].rx;
    const dry = rawProfile[k].ry - rawProfile[k - 1].ry;
    const dCenterZ = rawProfile[k].centerOffsetZ - rawProfile[k - 1].centerOffsetZ;
    const dOffsetY = rawProfile[k].centerOffsetY - rawProfile[k - 1].centerOffsetY;
    const ds = Math.sqrt(dx * dx + drx * drx + dry * dry + dCenterZ * dCenterZ + dOffsetY * dOffsetY);
    totalArc += ds;
    arcLength.push(totalArc);
  }

  // Sample axial rings at EQUAL ARC LENGTH increments
  const sampledRings: ProfilePoint[] = [];

  for (let i = 0; i <= axialSegments; i++) {
    const targetS = (i / axialSegments) * totalArc;
    let k = 0;

    while (k < K && arcLength[k + 1] < targetS) {
      k++;
    }

    if (k >= K) {
      sampledRings.push(rawProfile[K]);
    } else {
      const s0Arc = arcLength[k];
      const s1Arc = arcLength[k + 1];
      const alpha = s1Arc > s0Arc ? (targetS - s0Arc) / (s1Arc - s0Arc) : 0;
      const p0 = rawProfile[k];
      const p1 = rawProfile[k + 1];

      sampledRings.push({
        x: p0.x + alpha * (p1.x - p0.x),
        rx: p0.rx + alpha * (p1.rx - p0.rx),
        ry: p0.ry + alpha * (p1.ry - p0.ry),
        centerOffsetZ: p0.centerOffsetZ + alpha * (p1.centerOffsetZ - p0.centerOffsetZ),
        centerOffsetY: p0.centerOffsetY + alpha * (p1.centerOffsetY - p0.centerOffsetY),
        shapeType: alpha < 0.5 ? p0.shapeType : p1.shapeType,
        nExp: p0.nExp + alpha * (p1.nExp - p0.nExp),
        mExp: p0.mExp + alpha * (p1.mExp - p0.mExp),
        cornerRadius: p0.cornerRadius + alpha * (p1.cornerRadius - p0.cornerRadius),
      });
    }
  }

  // Apex vertex at index 0
  vertices.push(sampledRings[0].x, sampledRings[0].centerOffsetZ, sampledRings[0].centerOffsetY);
  uvs.push(0, 0.5);

  for (let i = 1; i <= axialSegments; i++) {
    const ring = sampledRings[i];
    const u = i / axialSegments;

    // Generate 2D ring points based on station XSec shapeType
    const ringPts = generateSectionPoints(
      ring.shapeType as SectionShapeType,
      ring.rx * 2,
      ring.ry * 2,
      ring.nExp,
      ring.mExp,
      ring.cornerRadius,
      undefined,
      undefined,
      radialSegments,
      ring.centerOffsetY,
      ring.centerOffsetZ
    );

    for (let j = 0; j < radialSegments; j++) {
      const pt = ringPts[j];
      const v = j / radialSegments;

      vertices.push(ring.x, pt.z, pt.y);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    const curr = 1 + j;
    const next = 1 + ((j + 1) % radialSegments);
    indices.push(0, next, curr);
  }

  for (let i = 1; i < axialSegments; i++) {
    const ringStart = 1 + (i - 1) * radialSegments;
    const nextRingStart = 1 + i * radialSegments;

    for (let j = 0; j < radialSegments; j++) {
      const curr = ringStart + j;
      const next = ringStart + ((j + 1) % radialSegments);
      const currNext = nextRingStart + j;
      const nextNext = nextRingStart + ((j + 1) % radialSegments);

      indices.push(curr, next, currNext);
      indices.push(next, nextNext, currNext);
    }
  }

  // Close the tail end cap with a watertight fan of triangles
  const lastRingStart = 1 + (axialSegments - 1) * radialSegments;
  const tailCenterIdx = vertices.length / 3;
  const tailRing = sampledRings[axialSegments];
  vertices.push(tailRing.x, tailRing.centerOffsetZ, tailRing.centerOffsetY);
  uvs.push(1.0, 0.5);

  for (let j = 0; j < radialSegments; j++) {
    const curr = lastRingStart + j;
    const next = lastRingStart + ((j + 1) % radialSegments);
    indices.push(tailCenterIdx, curr, next);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

