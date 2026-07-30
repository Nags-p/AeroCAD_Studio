export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Computes cubic Bezier point at parameter t in [0, 1]
 */
export function cubicBezier1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
}

/**
 * Smooth interpolation between a list of numeric keyframes
 */
export function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t2 * t;

  return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * v0 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * v1;
}
