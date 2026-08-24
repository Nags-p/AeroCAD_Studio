'use client';

import React from 'react';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useUIStore } from '@/store/useUIStore';

/**
 * 3D Coordinate Axes Gizmo — renders an orientation indicator in the bottom-left
 * of the viewport. Uses @react-three/drei's GizmoHelper/GizmoViewport for a 
 * highly performant, fully integrated orientation indicator that does not block 
 * the main R3F render loop. It is interactive: clicking axes snaps camera views.
 */
export function CoordinateAxesGizmo() {
  const showOrigin = useUIStore((state) => state.showOrigin);
  if (!showOrigin) return null;

  return (
    <GizmoHelper
      alignment="bottom-left"
      margin={[65, 65]}
    >
      <GizmoViewport
        axisColors={['#EF4444', '#22C55E', '#3B82F6']} // X (Red), Y (Green), Z (Blue)
        labelColor="#0F172A"
      />
    </GizmoHelper>
  );
}
