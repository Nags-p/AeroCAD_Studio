import * as THREE from 'three';
import { FuselageComponent, FuselageSection, SectionShapeType } from '@/types/aircraft';
import { generateSectionPoints } from '@/engine/math/superellipse';

export interface ResolvedStation {
  id: string;
  xPos: number;
  width: number;
  height: number;
  shapeType: SectionShapeType;
  nExp: number;
  mExp: number;
  cornerRadius: number;
}

/**
 * Resolves station longitudinal positions independently without auto-chain shifting.
 */
export function resolveStationPositions(sections: FuselageSection[]): ResolvedStation[] {
  if (!sections || sections.length === 0) return [];

  return sections.map((sec) => ({
    id: sec.id,
    xPos: Math.max(0, Math.min(1.0, sec.xPos)),
    width: sec.width,
    height: sec.height,
    shapeType: sec.shapeType || 'ellipse',
    nExp: sec.nExp || 2.0,
    mExp: sec.mExp || sec.nExp || 2.0,
    cornerRadius: sec.cornerRadius || 0.3,
  }));
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
export function generateFuselageGeometry(f: FuselageComponent): THREE.BufferGeometry {
  if (!f) return new THREE.BufferGeometry();

  const radialSegments = 64;
  const axialSegments = 64;
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
  const tEnd = sLast.xPos;

  const S = f.noseRoundness !== undefined ? f.noseRoundness : 0.75;
  const tailScale = f.tail !== undefined ? f.tail : 0.3;

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Filter sections with xPos > 0 for Catmull-Rom body spline
  const bodySections = resolved.filter((sec) => sec.xPos > 0);
  if (bodySections.length === 0) bodySections.push(s1);

  const splineControlPoints: THREE.Vector3[] = bodySections.map(
    (sec) => new THREE.Vector3(sec.xPos, sec.width / 2, sec.height / 2)
  );

  // Append tail base control point
  splineControlPoints.push(
    new THREE.Vector3(1.0, Math.max(0.05, (sLast.width / 2) * tailScale), Math.max(0.05, (sLast.height / 2) * tailScale))
  );

  const bodySpline = new THREE.CatmullRomCurve3(splineControlPoints, false, 'catmullrom', 0.5);

  const K = 600;
  const rawProfile: { x: number; rx: number; ry: number; centerOffsetZ: number; centerOffsetY: number }[] = [];

  for (let k = 0; k <= K; k++) {
    const t = k / K;
    const x = t * len - len / 2;

    let rx = 0;
    let ry = 0;

    if (t <= t1) {
      const u = Math.min(1.0, Math.max(0.0, t / t1));

      let blendFactor = 0;
      if (S <= 1.0) {
        const roundWeight = Math.max(0.0, S);
        const domeCurve = Math.sqrt(u * (2.0 - u));
        blendFactor = roundWeight * domeCurve + (1.0 - roundWeight) * u;
      } else {
        blendFactor = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(1.0 - u, 1.0 + S)));
      }

      rx = (s1.width / 2) * blendFactor;
      ry = (s1.height / 2) * blendFactor;

      rx = Math.max(0.0001, rx);
      ry = Math.max(0.0001, ry);
    } else {
      const bodyT = (t - t1) / (1.0 - t1);
      const p = bodySpline.getPoint(Math.min(1.0, Math.max(0.0, bodyT)));
      rx = Math.max(0.0001, p.y);
      ry = Math.max(0.0001, p.z);
    }

    let centerOffsetZ = 0;
    let centerOffsetY = 0;

    if (t <= t1) {
      const u = Math.min(1.0, Math.max(0.0, t / t1));
      centerOffsetZ = noseZ * (1.0 - u) * (1.0 - u);
      centerOffsetY = noseY * (1.0 - u) * (1.0 - u);
    } else if (t >= tEnd) {
      const v = Math.min(1.0, Math.max(0.0, (t - tEnd) / (1.0 - tEnd)));
      centerOffsetZ = tailZ * v * v;
      centerOffsetY = tailY * v * v;
    }

    rawProfile.push({ x, rx, ry, centerOffsetZ, centerOffsetY });
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
  const sampledRings: { x: number; rx: number; ry: number; centerOffsetZ: number; centerOffsetY: number }[] = [];

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
      s1.shapeType,
      ring.rx * 2,
      ring.ry * 2,
      s1.nExp,
      s1.mExp,
      s1.cornerRadius,
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

