'use client';

import React from 'react';
import {
  Box,
  Layers,
  Sparkles,
  Grid,
  Target
} from 'lucide-react';
import { useUIStore, CameraPresetView, VisualShadingMode } from '@/store/useUIStore';

export function ViewportControls() {
  const cameraView = useUIStore((state) => state.cameraView);
  const setCameraView = useUIStore((state) => state.setCameraView);

  const shadingMode = useUIStore((state) => state.shadingMode);
  const setShadingMode = useUIStore((state) => state.setShadingMode);

  const explodedOffset = useUIStore((state) => state.explodedOffset);
  const setExplodedOffset = useUIStore((state) => state.setExplodedOffset);

  const showGrid = useUIStore((state) => state.showGrid);
  const toggleGrid = useUIStore((state) => state.toggleGrid);

  const showCG = useUIStore((state) => state.showCG);
  const toggleCG = useUIStore((state) => state.toggleCG);

  const views: { id: CameraPresetView; label: string }[] = [
    { id: 'iso', label: 'ISO' },
    { id: 'top', label: 'TOP' },
    { id: 'front', label: 'FRONT' },
    { id: 'side', label: 'SIDE' },
    { id: 'perspective', label: 'PERSP' },
  ];

  const modes: { id: VisualShadingMode; label: string; icon: any }[] = [
    { id: 'solid', label: 'Solid', icon: Box },
    { id: 'wireframe', label: 'Wireframe', icon: Grid },
    { id: 'xray', label: 'X-Ray', icon: Layers },
    { id: 'exploded', label: 'Exploded', icon: Sparkles },
  ];

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-3 pointer-events-none">
      {/* Shading & Camera Toolbar Floating Container */}
      <div className="pointer-events-auto flex items-center bg-white/90 backdrop-blur-md border border-slate-300 p-1.5 rounded-lg shadow-lg gap-1">
        {/* Shading modes */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setShadingMode(id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                shadingMode === id
                  ? 'bg-sky-600 text-white shadow-md font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={`${label} View Mode`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Camera Views */}
        <div className="flex items-center gap-1 pl-1">
          {views.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCameraView(id)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                cameraView === id
                  ? 'bg-slate-100 text-sky-700 border border-sky-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
          <button
            onClick={toggleGrid}
            className={`p-1.5 rounded text-xs transition-colors ${
              showGrid ? 'text-sky-600 bg-sky-50' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Toggle CAD Floor Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={toggleCG}
            className={`p-1.5 rounded text-xs transition-colors ${
              showCG ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Toggle Center of Gravity Indicator"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Exploded View Slider */}
      {shadingMode === 'exploded' && (
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-300 p-3 rounded-lg shadow-lg w-64 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-sky-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Exploded View Offset
            </span>
            <span className="text-slate-600 font-mono">{Math.round(explodedOffset * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explodedOffset}
            onChange={(e) => setExplodedOffset(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>
      )}
    </div>
  );
}
