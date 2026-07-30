import * as THREE from 'three';

export interface RingStation {
  x: number; // longitudinal position
  points: { y: number; z: number }[]; // 2D section contour points (clockwise or counter-clockwise)
}

/**
 * Skin/loft a series of 2D cross-section rings along the X-axis into a Three.js BufferGeometry.
 */
export function loftRingsToBufferGeometry(
  rings: RingStation[],
  capStart: boolean = true,
  capEnd: boolean = true
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  if (rings.length < 2) return geometry;

  const numRings = rings.length;
  const ptsPerRing = rings[0].points.length;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Build grid vertices
  for (let r = 0; r < numRings; r++) {
    const ring = rings[r];
    const u = r / (numRings - 1);

    for (let p = 0; p < ptsPerRing; p++) {
      const pt = ring.points[p];
      const v = p / ptsPerRing;

      positions.push(ring.x, pt.z, pt.y); // X = length, Y = vertical (z in aviation), Z = lateral (y in aviation)
      uvs.push(u, v);
    }
  }

  // Build side quads as 2 triangles
  for (let r = 0; r < numRings - 1; r++) {
    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;

      const i0 = r * ptsPerRing + p;
      const i1 = r * ptsPerRing + pNext;
      const i2 = (r + 1) * ptsPerRing + pNext;
      const i3 = (r + 1) * ptsPerRing + p;

      // Triangle 1
      indices.push(i0, i1, i2);
      // Triangle 2
      indices.push(i0, i2, i3);
    }
  }

  // Cap start (nose/front cap)
  if (capStart) {
    const startRing = rings[0];
    const centerIdx = positions.length / 3;
    // Nose center point
    positions.push(startRing.x, 0, 0);
    uvs.push(0, 0.5);

    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;
      indices.push(centerIdx, pNext, p);
    }
  }

  // Cap end (tail cap)
  if (capEnd) {
    const endRing = rings[rings.length - 1];
    const lastRingOffset = (numRings - 1) * ptsPerRing;
    const centerIdx = positions.length / 3;

    positions.push(endRing.x, 0, 0);
    uvs.push(1, 0.5);

    for (let p = 0; p < ptsPerRing; p++) {
      const pNext = (p + 1) % ptsPerRing;
      indices.push(centerIdx, lastRingOffset + p, lastRingOffset + pNext);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  geometry.computeVertexNormals();
  return geometry;
}
