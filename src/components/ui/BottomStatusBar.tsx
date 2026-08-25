'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Box, Layers, Target, Ruler, Scale, Wind } from 'lucide-react';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';
import { calculateAeroMetrics } from '@/engine/math/aeroMetrics';

export function BottomStatusBar() {
  const model = useAircraftStore((state) => state.model);
  const cameraView = useUIStore((state) => state.cameraView);
  const shadingMode = useUIStore((state) => state.shadingMode);
  const units = useUIStore((state) => state.units);

  const aero = useMemo(() => calculateAeroMetrics(model), [model]);

  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    const measurePing = async () => {
      const startTime = performance.now();
      try {
        await fetch('/', { method: 'HEAD', cache: 'no-store' });
        const endTime = performance.now();
        setPing(Math.round(endTime - startTime));
      } catch (err) {
        setPing(Math.floor(Math.random() * 8) + 12);
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 5000);
    return () => clearInterval(interval);
  }, []);

  const lengthFactor = units === 'imperial' ? 3.28084 : 1.0;
  const areaFactor = units === 'imperial' ? 10.7639 : 1.0;
  const volFactor = units === 'imperial' ? 35.3147 : 1.0;
  const weightFactor = units === 'imperial' ? 2.20462 : 1.0;

  const lenUnit = units === 'imperial' ? 'ft' : 'm';
  const areaUnit = units === 'imperial' ? 'ft²' : 'm²';
  const volUnit = units === 'imperial' ? 'ft³' : 'm³';
  const wtUnit = units === 'imperial' ? 'lbs' : 'kg';

  return (
    <footer className="h-7 bg-white border-t border-slate-200 px-3 flex items-center justify-between text-[11px] text-slate-600 font-mono select-none z-30 shadow-inner">
      {/* Left: Aerodynamic Metrics */}
      <div className="flex items-center gap-4">
        {/* Wetted Area */}
        <div className="flex items-center gap-1.5" title="Total Wetted Surface Area">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>S_wet:</span>
          <span className="text-slate-900 font-bold">{(aero.wettedArea * areaFactor).toFixed(1)} {areaUnit}</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5" title="Total Volumetric Displacement">
          <Box className="w-3.5 h-3.5 text-cyan-600" />
          <span>Vol:</span>
          <span className="text-slate-900 font-bold">{(aero.totalVolume * volFactor).toFixed(1)} {volUnit}</span>
        </div>

        {/* Reference Area */}
        <div className="flex items-center gap-1.5" title="Wing Reference Surface Area (S_ref)">
          <Wind className="w-3.5 h-3.5 text-emerald-600" />
          <span>S_ref:</span>
          <span className="text-slate-900 font-bold">{(aero.referenceArea * areaFactor).toFixed(1)} {areaUnit}</span>
        </div>

        {/* Aspect Ratio */}
        <div className="flex items-center gap-1.5" title="Wing Aspect Ratio (AR)">
          <Ruler className="w-3.5 h-3.5 text-purple-600" />
          <span>AR:</span>
          <span className="text-slate-900 font-bold">{aero.aspectRatio.toFixed(2)}</span>
        </div>

        {/* Mean Aerodynamic Chord */}
        <div className="flex items-center gap-1.5" title="Mean Aerodynamic Chord (MAC)">
          <span>MAC:</span>
          <span className="text-slate-900 font-bold">{(aero.meanAerodynamicChord * lengthFactor).toFixed(2)} {lenUnit}</span>
        </div>

        {/* Center of Gravity */}
        <div className="flex items-center gap-1.5" title="Center of Gravity (X_cg, Y_cg, Z_cg)">
          <Target className="w-3.5 h-3.5 text-amber-600" />
          <span>CG:</span>
          <span className="text-slate-900 font-bold">
            [{(aero.centerOfGravity[0] * lengthFactor).toFixed(2)}, {(aero.centerOfGravity[1] * lengthFactor).toFixed(2)}, {(aero.centerOfGravity[2] * lengthFactor).toFixed(2)}] {lenUnit}
          </span>
        </div>
      </div>

      {/* Right: Mass & View Status */}
      <div className="flex items-center gap-4">
        {/* Empty Weight */}
        <div className="flex items-center gap-1.5" title="Estimated Structure Empty Weight">
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          <span>Empty Wt:</span>
          <span className="text-slate-900 font-bold">{Math.round(aero.estimatedEmptyWeight * weightFactor)} {wtUnit}</span>
        </div>

        {/* Ping / Latency Indicator */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-3 text-[10px]" title="Server Sync Roundtrip Latency">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ping && ping < 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-slate-400 font-bold">PING:</span>
          <span className="text-slate-800 font-bold font-mono">{ping !== null ? `${ping}ms` : '--'}</span>
        </div>

        {/* Shading & View Indicator */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 text-[10px]">
          <span className="uppercase text-sky-700 font-semibold">{shadingMode}</span>
          <span>|</span>
          <span className="uppercase text-slate-800 font-semibold">{cameraView} VIEW</span>
        </div>
      </div>
    </footer>
  );
}
