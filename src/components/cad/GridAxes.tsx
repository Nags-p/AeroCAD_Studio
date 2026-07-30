'use client';

import React from 'react';
import * as THREE from 'three';
import { useUIStore } from '@/store/useUIStore';

export function GridAxes() {
  const showGrid = useUIStore((state) => state.showGrid);
  const showAxes = useUIStore((state) => state.showAxes);

  if (!showGrid && !showAxes) return null;

  return (
    <group>
      {/* Light CAD Studio Grid */}
      {showGrid && (
        <gridHelper
          args={[120, 60, '#0284C7', '#94A3B8']}
          position={[0, -0.01, 0]}
          rotation={[0, 0, 0]}
        />
      )}

      {/* Axis Lines (X: Red [Length], Y: Green [Height], Z: Blue [Span]) */}
      {showAxes && (
        <primitive object={new THREE.AxesHelper(10)} position={[0, 0, 0]} />
      )}
    </group>
  );
}
