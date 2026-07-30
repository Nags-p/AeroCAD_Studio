'use client';

import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useUIStore, CameraPresetView } from '@/store/useUIStore';
import { AircraftRenderer } from './AircraftRenderer';
import { GridAxes } from './GridAxes';

function CameraHandler({ view }: { view: CameraPresetView }) {
  const { camera, controls } = useThree() as any;

  useEffect(() => {
    if (!camera || !controls) return;

    const target = new THREE.Vector3(0, 0, 0);
    controls.target.copy(target);

    switch (view) {
      case 'top':
        camera.position.set(0, 50, 0.1);
        camera.up.set(0, 1, 0);
        break;
      case 'front':
        camera.position.set(-50, 0, 0);
        camera.up.set(0, 1, 0);
        break;
      case 'side':
        camera.position.set(0, 0, 50);
        camera.up.set(0, 1, 0);
        break;
      case 'iso':
        camera.position.set(-25, 20, 35);
        camera.up.set(0, 1, 0);
        break;
      case 'perspective':
        camera.position.set(-30, 22, 38);
        camera.up.set(0, 1, 0);
        break;
    }

    controls.update();
  }, [view, camera, controls]);

  return null;
}

export function Viewport() {
  const cameraView = useUIStore((state) => state.cameraView);

  return (
    <div className="w-full h-full relative bg-slate-200 overflow-hidden select-none">
      <Canvas
        camera={{ position: [-25, 20, 35], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#E2E8F0']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[40, 60, 50]} intensity={1.3} castShadow />
        <directionalLight position={[-40, -30, -40]} intensity={0.5} />
        <directionalLight position={[0, -50, 0]} intensity={0.3} />

        <CameraHandler view={cameraView} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={200} />

        <GridAxes />
        <AircraftRenderer />
      </Canvas>
    </div>
  );
}
