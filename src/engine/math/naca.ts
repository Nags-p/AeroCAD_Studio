import { AirfoilData, AirfoilPoint } from '@/types/aircraft';

/**
 * Generates analytical 4-digit NACA airfoil coordinates.
 * e.g., "NACA 2412" -> M=0.02 (2% max camber), P=0.4 (40% max camber position), T=0.12 (12% thickness)
 */
export function generateNACA4Digit(nacaCode: string, numPoints: number = 60): AirfoilData {
  // Extract 4 digits, default to 2412 if parsing fails
  const digits = nacaCode.replace(/[^0-9]/g, '');
  let m = 0.02; // max camber
  let p = 0.4;  // max camber pos
  let t = 0.12; // thickness

  if (digits.length === 4) {
    m = parseInt(digits[0], 10) / 100;
    p = parseInt(digits[1], 10) / 10;
    t = parseInt(digits.slice(2), 10) / 100;
  }

  const upper: AirfoilPoint[] = [];
  const lower: AirfoilPoint[] = [];
  const camber: AirfoilPoint[] = [];

  for (let i = 0; i <= numPoints; i++) {
    // Cosine spacing for denser points at leading and trailing edges
    const beta = (i / numPoints) * Math.PI;
    const x = 0.5 * (1 - Math.cos(beta));

    // Thickness distribution formula
    const yt = 5 * t * (
      0.2969 * Math.sqrt(x) -
      0.1260 * x -
      0.3516 * Math.pow(x, 2) +
      0.2843 * Math.pow(x, 3) -
      0.1015 * Math.pow(x, 4)
    );

    // Camber line & gradient computation
    let yc = 0;
    let dyc_dx = 0;

    if (m > 0 && p > 0) {
      if (x < p) {
        yc = (m / (p * p)) * (2 * p * x - x * x);
        dyc_dx = ((2 * m) / (p * p)) * (p - x);
      } else {
        yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x);
        dyc_dx = ((2 * m) / ((1 - p) * (1 - p))) * (p - x);
      }
    }

    const theta = Math.atan(dyc_dx);

    const xu = x - yt * Math.sin(theta);
    const yu = yc + yt * Math.cos(theta);

    const xl = x + yt * Math.sin(theta);
    const yl = yc - yt * Math.cos(theta);

    upper.push({ x: xu, y: yu });
    lower.push({ x: xl, y: yl });
    camber.push({ x, y: yc });
  }

  return {
    name: nacaCode.startsWith('NACA') ? nacaCode : `NACA ${digits || '2412'}`,
    upper,
    lower,
    camber,
    thickness: t,
    maxCamber: m,
  };
}

/**
 * Pre-baked airfoil library options
 */
export const BUILTIN_AIRFOILS = [
  'NACA 0012',
  'NACA 2412',
  'NACA 4412',
  'NACA 0009',
  'NACA 6412',
  'NACA 2415',
  'NACA 0015',
];
