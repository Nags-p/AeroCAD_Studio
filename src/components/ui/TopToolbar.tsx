'use client';

import React, { useState } from 'react';
import {
  Plane,
  Download,
  Upload,
  Plus,
  Undo2,
  Redo2,
  Ruler,
  Sliders,
  Sparkles,
  Library,
  ChevronDown
} from 'lucide-react';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';

export function TopToolbar() {
  const model = useAircraftStore((state) => state.model);
  const canUndo = useAircraftStore((state) => state.canUndo);
  const canRedo = useAircraftStore((state) => state.canRedo);
  const undo = useAircraftStore((state) => state.undo);
  const redo = useAircraftStore((state) => state.redo);
  const addWing = useAircraftStore((state) => state.addWing);
  const addTail = useAircraftStore((state) => state.addTail);
  const addEngine = useAircraftStore((state) => state.addEngine);
  const addFuselageSection = useAircraftStore((state) => state.addFuselageSection);

  const units = useUIStore((state) => state.units);
  const setUnits = useUIStore((state) => state.setUnits);
  const openModal = useUIStore((state) => state.openModal);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-30 relative shadow-sm">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-sky-600 px-2.5 py-1 rounded text-white font-bold text-sm shadow">
          <Plane className="w-4 h-4 text-white stroke-[2.5]" />
          <span>AeroCAD</span>
          <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-white/20 rounded text-white">PRO</span>
        </div>

        {/* Menu Bar Dropdowns */}
        <nav className="flex items-center gap-1 text-xs text-slate-700 font-medium relative">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('file')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>File</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => { openModal('presets'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> New from Preset...
                </button>
                <button
                  onClick={() => { openModal('import'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-600" /> Open / Import JSON...
                </button>

                <div className="my-1 border-t border-slate-200" />

                <button
                  onClick={() => { openModal('export'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-sky-600 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Export CAD (STL, OBJ, glTF, JSON)...
                </button>
              </div>
            )}
          </div>

          {/* Add Component Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('add')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Add Component</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'add' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => { addFuselageSection(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" /> Fuselage Section
                </button>
                <button
                  onClick={() => { addWing(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> Auxiliary Wing / Canard
                </button>
                <button
                  onClick={() => { addTail(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" /> Tail Assembly
                </button>
                <button
                  onClick={() => { addEngine(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" /> Engine Nacelle
                </button>
              </div>
            )}
          </div>

          {/* Tools Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('tools')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => { openModal('sketcher'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-600" /> 2D Cross-Section Sketcher
                </button>
                <button
                  onClick={() => { openModal('airfoil'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Library className="w-3.5 h-3.5 text-emerald-600" /> NACA Airfoil Library
                </button>
                <button
                  onClick={() => { openModal('measurements'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Ruler className="w-3.5 h-3.5 text-amber-600" /> Aerodynamic Mass & CG Analysis
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Center: Quick Action Buttons */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition ${
            canUndo ? 'text-slate-700 hover:bg-white' : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition ${
            canRedo ? 'text-slate-700 hover:bg-white' : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-300 my-auto mx-1" />

        <button
          onClick={() => openModal('presets')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 text-sky-700 font-medium border border-slate-200 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Presets</span>
        </button>

        <button
          onClick={() => openModal('airfoil')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 text-emerald-700 font-medium border border-slate-200 transition shadow-sm"
        >
          <Library className="w-3.5 h-3.5 text-emerald-600" />
          <span>Airfoils</span>
        </button>

        <button
          onClick={() => openModal('measurements')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 text-amber-700 font-medium border border-slate-200 transition shadow-sm"
        >
          <Ruler className="w-3.5 h-3.5 text-amber-600" />
          <span>Analysis</span>
        </button>
      </div>

      {/* Right: Units & Export CTA */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200 text-xs">
          <button
            onClick={() => setUnits('metric')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              units === 'metric' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Metric (m)
          </button>
          <button
            onClick={() => setUnits('imperial')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              units === 'imperial' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Imperial (ft)
          </button>
        </div>

        <button
          onClick={() => openModal('export')}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-md text-xs shadow transition"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export CAD</span>
        </button>
      </div>
    </header>
  );
}
