'use client';

import React, { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useUIStore, CameraPresetView } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { AircraftRenderer } from './AircraftRenderer';
import { GridAxes } from './GridAxes';
import { CoordinateAxesGizmo } from './CoordinateAxesGizmo';
import { WindTunnelFlow } from './WindTunnelFlow';
import { calculateAeroMetrics } from '@/engine/math/aeroMetrics';

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
  const showContextMenu = useUIStore((state) => state.showContextMenu);
  const setSelected = useAircraftStore((state) => state.setSelected);
  const model = useAircraftStore((state) => state.model);

  const flowSimulationActive = useUIStore((state) => state.flowSimulationActive);
  const flowColormapMode = useUIStore((state) => state.flowColormapMode);
  const flowVelocity = useUIStore((state) => state.flowVelocity);

  const aero = useMemo(() => calculateAeroMetrics(model, flowVelocity), [model, flowVelocity]);

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, null, 'canvas');
      }}
      className="w-full h-full relative bg-slate-200 overflow-hidden select-none"
    >
      <Canvas
        camera={{ position: [-25, 20, 35], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => setSelected(null, null)}
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
        <WindTunnelFlow />
        <CoordinateAxesGizmo />
      </Canvas>

      {flowSimulationActive && (
        <div className="absolute top-4 left-4 z-10 w-64 bg-slate-950/85 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-left-4 font-mono select-none">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
            <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              Wind Tunnel CFD Live
            </span>
            <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase font-sans">
              Mode: {flowColormapMode}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Tunnel Velocity:</span>
              <span className="font-bold text-emerald-400">{flowVelocity.toFixed(1)} m/s</span>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Lift Coeff (C_L):</span>
              <span className="font-bold text-sky-300">{(aero.cL || 0).toFixed(3)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Drag Coeff (C_D):</span>
              <span className="font-bold text-rose-400">{(aero.cD || 0).toFixed(4)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">L/D Efficiency:</span>
              <span className={`font-bold ${
                (aero.loD || 0) > 12 ? 'text-emerald-400' : (aero.loD || 0) > 8 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {(aero.loD || 0).toFixed(1)}
              </span>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Stall Speed (V_s):</span>
              <span className="font-bold text-yellow-400">
                {aero.referenceArea > 0
                  ? Math.round(Math.sqrt((2 * aero.estimatedEmptyWeight * 9.81) / (1.225 * aero.referenceArea * 1.4)))
                  : 0} m/s
              </span>
            </div>

            <div className="text-[8px] text-slate-500 leading-normal mt-1 border-t border-slate-800/40 pt-1.5 font-sans">
              *Calculated at sea level density (1.225 kg/m³), nominal angle of attack α = 4.5°.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
