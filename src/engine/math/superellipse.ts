import { SectionShapeType } from '@/types/aircraft';

export interface Point2D {
  y: number;
  z: number;
}

/**
 * OpenVSP Cross-Section Geometry Generator.
 * Generates 2D ring points for all OpenVSP shape types:
 * - POINT: Zero-dimension spatial apex
 * - CIRCLE: Pure circular section (Radius = width / 2)
 * - ELLIPSE: Standard elliptical section (semi-width, semi-height)
 * - SUPER_ELLIPSE: (y/a)^m + (z/b)^n = 1
 * - ROUNDED_RECTANGLE: Box section with corner fillet radius
 * - GENERAL_FUSE: Upper height & lower height general fuselage section
 * - BICONVEX: Double parabolic arc section
 * - WEDGE: Trapezoidal / flat bottom wedge section
 */
export function generateSectionPoints(
  shapeType: SectionShapeType = 'ellipse',
  width: number = 2.0,
  height: number = 2.0,
  nExp: number = 2.0,
  mExp: number = 2.0,
  cornerRadius: number = 0.3,
  upperHeight?: number,
  lowerHeight?: number,
  numPoints: number = 64,
  yOffset: number = 0,
  zOffset: number = 0
): Point2D[] {
  const points: Point2D[] = [];
  const semiWidth = width / 2;
  const semiHeight = height / 2;

  // 1. POINT Shape Type
  if (shapeType === 'point') {
    for (let i = 0; i < numPoints; i++) {
      points.push({ y: yOffset, z: zOffset });
    }
    return points;
  }

  // 2. CIRCLE Shape Type
  if (shapeType === 'circle') {
    const radius = width / 2;
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const y = radius * Math.cos(theta) + yOffset;
      const z = radius * Math.sin(theta) + zOffset;
      points.push({ y, z });
    }
    return points;
  }

  // 3. ELLIPSE Shape Type
  if (shapeType === 'ellipse') {
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const y = semiWidth * Math.cos(theta) + yOffset;
      const z = semiHeight * Math.sin(theta) + zOffset;
      points.push({ y, z });
    }
    return points;
  }

  // 4. SUPER_ELLIPSE Shape Type
  if (shapeType === 'super_ellipse') {
    const safeN = Math.max(0.5, Math.min(10.0, nExp));
    const safeM = Math.max(0.5, Math.min(10.0, mExp || nExp));
    const expN = 2.0 / safeN;
    const expM = 2.0 / safeM;

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const sgnCos = Math.sign(cosT) || 1;
      const sgnSin = Math.sign(sinT) || 1;

      const y = semiWidth * sgnCos * Math.pow(Math.abs(cosT), expM) + yOffset;
      const z = semiHeight * sgnSin * Math.pow(Math.abs(sinT), expN) + zOffset;
      points.push({ y, z });
    }
    return points;
  }

  // 5. ROUNDED_RECTANGLE Shape Type
  if (shapeType === 'rounded_rectangle') {
    const pPower = 2.0 + (cornerRadius || 0.3) * 6.0;
    const expP = 2.0 / pPower;

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const sgnCos = Math.sign(cosT) || 1;
      const sgnSin = Math.sign(sinT) || 1;

      const y = semiWidth * sgnCos * Math.pow(Math.abs(cosT), expP) + yOffset;
      const z = semiHeight * sgnSin * Math.pow(Math.abs(sinT), expP) + zOffset;
      points.push({ y, z });
    }
    return points;
  }

  // 6. GENERAL_FUSE Shape Type
  if (shapeType === 'general_fuse') {
    const hUpper = upperHeight !== undefined ? upperHeight : semiHeight;
    const hLower = lowerHeight !== undefined ? lowerHeight : semiHeight;

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const y = semiWidth * cosT + yOffset;
      const z = (sinT >= 0 ? hUpper * sinT : hLower * sinT) + zOffset;
      points.push({ y, z });
    }
    return points;
  }

  // 7. BICONVEX Shape Type
  if (shapeType === 'biconvex') {
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const yNorm = cosT;
      const arcVal = (1 - yNorm * yNorm) * Math.sign(sinT);

      const y = semiWidth * cosT + yOffset;
      const z = semiHeight * arcVal + zOffset;
      points.push({ y, z });
    }
    return points;
  }

  // 8. WEDGE Shape Type
  if (shapeType === 'wedge') {
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let y = semiWidth * cosT;
      let z = semiHeight * sinT;

      if (sinT < 0) {
        // Flat bottom wedge
        z = -semiHeight * 0.5;
      }

      points.push({ y: y + yOffset, z: z + zOffset });
    }
    return points;
  }

  // Fallback Ellipse
  for (let i = 0; i < numPoints; i++) {
    const theta = (i / numPoints) * 2 * Math.PI;
    const y = semiWidth * Math.cos(theta) + yOffset;
    const z = semiHeight * Math.sin(theta) + zOffset;
    points.push({ y, z });
  }
  return points;
}

/**
 * Legacy alias for backwards compatibility
 */
export function generateSuperellipseSection(
  semiWidth: number,
  semiHeight: number,
  nExp: number = 2.0,
  numPoints: number = 32,
  yOffset: number = 0,
  zOffset: number = 0
): Point2D[] {
  return generateSectionPoints('super_ellipse', semiWidth * 2, semiHeight * 2, nExp, nExp, 0.3, undefined, undefined, numPoints, yOffset, zOffset);
}
