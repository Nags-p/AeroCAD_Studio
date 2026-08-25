'use client';

import React from 'react';
import { X, Settings, Sliders, Shield, RefreshCw, Paintbrush } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export function SettingsModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const units = useUIStore((state) => state.units);
  const setUnits = useUIStore((state) => state.setUnits);
  const showGrid = useUIStore((state) => state.showGrid);
  const toggleGrid = useUIStore((state) => state.toggleGrid);
  const tessellationQuality = useUIStore((state) => state.tessellationQuality);
  const setTessellationQuality = useUIStore((state) => state.setTessellationQuality);
  const shadingMode = useUIStore((state) => state.shadingMode);
  const setShadingMode = useUIStore((state) => state.setShadingMode);
  const viewportTheme = useUIStore((state) => state.viewportTheme);
  const setViewportTheme = useUIStore((state) => state.setViewportTheme);

  if (activeModal !== 'settings') return null;

  const handleReset = () => {
    setUnits('metric');
    if (!showGrid) toggleGrid();
    setTessellationQuality('medium');
    setShadingMode('solid');
    setViewportTheme('studio');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5 font-bold text-slate-700">
            <Settings className="w-5 h-5 text-slate-600 stroke-[2.2]" />
            <span className="text-sm font-extrabold tracking-wider uppercase">Application Settings</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section: General Design Units */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Sliders className="w-3.5 h-3.5 text-sky-655" />
              General Configuration
            </h4>
            
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Unit System</div>
                <div className="text-[10px] text-slate-500">Defines coordinates, dimensions, and structural properties.</div>
              </div>
              <div className="flex bg-white rounded border border-slate-250 p-0.5 text-xs select-none">
                <button
                  onClick={() => setUnits('metric')}
                  className={`px-3 py-1 rounded font-bold transition ${
                    units === 'metric' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  Metric (m)
                </button>
                <button
                  onClick={() => setUnits('imperial')}
                  className={`px-3 py-1 rounded font-bold transition ${
                    units === 'imperial' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  Imperial (ft)
                </button>
              </div>
            </div>
          </div>

          {/* Section: Viewport Theme (Appearance) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Paintbrush className="w-3.5 h-3.5 text-sky-655" />
              Viewport Appearance
            </h4>
            
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Background Style</div>
                <div className="text-[10px] text-slate-500">Defines the background theme of the active 3D CAD editor.</div>
              </div>
              <div className="flex bg-white rounded border border-slate-250 p-0.5 text-xs select-none">
                <button
                  onClick={() => setViewportTheme('studio')}
                  className={`px-3 py-1 rounded font-bold transition text-[11px] ${
                    viewportTheme === 'studio' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  Studio
                </button>
                <button
                  onClick={() => setViewportTheme('dark')}
                  className={`px-3 py-1 rounded font-bold transition text-[11px] ${
                    viewportTheme === 'dark' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  Dark Slate
                </button>
                <button
                  onClick={() => setViewportTheme('white')}
                  className={`px-3 py-1 rounded font-bold transition text-[11px] ${
                    viewportTheme === 'white' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setViewportTheme('sky')}
                  className={`px-3 py-1 rounded font-bold transition text-[11px] ${
                    viewportTheme === 'sky' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-655 hover:text-slate-900'
                  }`}
                >
                  Sky Blue
                </button>
              </div>
            </div>
          </div>

          {/* Section: 3D Graphics Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Shield className="w-3.5 h-3.5 text-sky-655" />
              Graphics & Viewport Rendering
            </h4>

            {/* Smoothness Quality Selection */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Model Tessellation (Smoothness)</div>
                <div className="text-[10px] text-slate-500">Controls surface mesh resolution and lofting segments.</div>
              </div>
              <select
                value={tessellationQuality}
                onChange={(e) => setTessellationQuality(e.target.value as any)}
                className="bg-white border border-slate-350 rounded p-1 text-[11px] font-bold text-slate-800 w-32"
              >
                <option value="low">Low (Fastest)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Detailed)</option>
                <option value="ultra">Ultra (Maximum)</option>
              </select>
            </div>

            {/* Shading Viewport Selection */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Default Shading Mode</div>
                <div className="text-[10px] text-slate-500">How 3D shapes are shaded in the active editor.</div>
              </div>
              <select
                value={shadingMode}
                onChange={(e) => setShadingMode(e.target.value as any)}
                className="bg-white border border-slate-350 rounded p-1 text-[11px] font-bold text-slate-800 w-32"
              >
                <option value="solid">Solid Shading</option>
                <option value="wireframe">Wireframe</option>
                <option value="xray">X-Ray (Semi-Trans)</option>
                <option value="exploded">Exploded</option>
              </select>
            </div>

            {/* Grid display toggle */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Construction Grid Lines</div>
                <div className="text-[10px] text-slate-500">Render horizontal 2D structural lines in 3D scene.</div>
              </div>
              <button
                onClick={toggleGrid}
                className={`px-3 py-1 rounded text-xs font-bold border transition ${
                  showGrid
                    ? 'bg-sky-50 text-sky-705 border-sky-300'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {showGrid ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center select-none">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-md hover:shadow-lg transition"
          >
            Close & Apply
          </button>
        </div>

      </div>
    </div>
  );
}
