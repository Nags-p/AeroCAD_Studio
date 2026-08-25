'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Layers, Ruler, Plus, Info, BookOpen, Library, Check } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { MATERIALS_LIBRARY } from '@/engine/data/materials';
import { generateNACA4Digit, BUILTIN_AIRFOILS } from '@/engine/math/naca';

export function DesignDatabaseModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const units = useUIStore((state) => state.units);

  const activeSubTab = useUIStore((state) => state.activeDatabaseTab);
  const setActiveSubTab = useUIStore((state) => state.setDatabaseTab);

  if (activeModal !== 'database') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5 font-bold text-cyan-700">
            <Layers className="w-5 h-5 text-cyan-600 stroke-[2.2]" />
            <span className="text-sm font-extrabold tracking-wider uppercase">Design Reference Database</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sub-navigation categories sidebar */}
          <div className="w-60 bg-slate-50/50 border-r border-slate-200 p-4 flex flex-col gap-1.5 select-none">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Reference Catalogs</div>
            
            <button
              onClick={() => setActiveSubTab('materials')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeSubTab === 'materials' 
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-sm font-bold' 
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeSubTab === 'materials' ? 'text-cyan-600' : 'text-slate-500'}`} />
              <span>Materials Catalog</span>
            </button>

            <button
              onClick={() => setActiveSubTab('airfoils')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeSubTab === 'airfoils' 
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-sm font-bold' 
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Library className={`w-4 h-4 ${activeSubTab === 'airfoils' ? 'text-cyan-600' : 'text-slate-500'}`} />
              <span>Airfoil Library</span>
            </button>

            <button
              disabled
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border border-transparent text-slate-400 cursor-not-allowed"
              title="Standard beam sections catalog coming soon."
            >
              <Ruler className="w-4 h-4 text-slate-300" />
              <div className="flex items-center justify-between w-full">
                <span>Standard Spar Sections</span>
                <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded font-bold">Soon</span>
              </div>
            </button>

            <button
              disabled
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border border-transparent text-slate-400 cursor-not-allowed"
              title="Payload specifications coming soon."
            >
              <Plus className="w-4 h-4 text-slate-300" />
              <div className="flex items-center justify-between w-full">
                <span>Payload & Avionics</span>
                <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded font-bold">Soon</span>
              </div>
            </button>

            <div className="mt-auto p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[10px] text-slate-500 leading-relaxed font-sans font-medium">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="w-3.5 h-3.5 text-cyan-600" />
                <span>Aerospace Constants</span>
              </div>
              <p>Reference catalog values are standard textbook engineering values used to size structures, calculate lift, and estimate empty weights.</p>
            </div>
          </div>

          {/* Main content viewport */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
            
            {/* Header info */}
            <div className="space-y-1 mb-5 select-none">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {activeSubTab === 'materials' ? (
                  <>
                    <Layers className="w-5 h-5 text-cyan-600" />
                    <span>Aerospace Materials Catalog</span>
                  </>
                ) : (
                  <>
                    <Library className="w-5 h-5 text-emerald-600" />
                    <span>Airfoil Library</span>
                  </>
                )}
              </h3>
              <p className="text-slate-600 text-xs font-medium">
                {activeSubTab === 'materials' 
                  ? 'Standardized catalog of materials, densities, Young\'s Modulus, and yield stress parameters.'
                  : 'Generate standard and custom 4-digit NACA profiles and visualize aerodynamic geometries.'}
              </p>
            </div>

            {/* Materials Viewer Sub-tab */}
            {activeSubTab === 'materials' && (
              <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                {(() => {
                  const categories = {
                    metals: { name: 'Aerospace Metals', color: 'border-blue-500 text-blue-700 bg-blue-50' },
                    composites: { name: 'Fiber Composites', color: 'border-sky-500 text-sky-700 bg-sky-50' },
                    woods: { name: 'Aviation Woods', color: 'border-amber-500 text-amber-700 bg-amber-50' },
                    fabrics: { name: 'Skins & Fabrics', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                    specialty: { name: 'Specialty & Canopies', color: 'border-purple-500 text-purple-700 bg-purple-50' }
                  };

                  return Object.entries(categories).map(([catKey, catMeta]) => {
                    const mats = Object.values(MATERIALS_LIBRARY).filter(m => m.category === catKey);
                    if (mats.length === 0) return null;

                    return (
                      <div key={catKey} className="space-y-2">
                        <h4 className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${catMeta.color} inline-block select-none`}>
                          {catMeta.name}
                        </h4>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-xs text-left font-mono border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-sans font-bold">
                                <th className="px-4 py-2 w-1/4">Material Name</th>
                                <th className="px-4 py-2 text-right w-1/8">Density (ρ)</th>
                                <th className="px-4 py-2 text-right w-1/8">Elasticity (E)</th>
                                <th className="px-4 py-2 text-right w-1/8">Yield Stress (σ_y)</th>
                                <th className="px-4 py-2 w-3/8">Typical Aerospace Application & Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 text-slate-800">
                              {mats.map((mat) => (
                                <tr key={mat.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-2.5 font-bold text-slate-900">{mat.name}</td>
                                  <td className="px-4 py-2.5 text-right font-semibold">{mat.density} kg/m³</td>
                                  <td className="px-4 py-2.5 text-right">
                                    {mat.youngsModulus ? `${(mat.youngsModulus / 1e9).toFixed(1)} GPa` : 'N/A'}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {mat.yieldStrength ? `${(mat.yieldStrength / 1e6).toFixed(0)} MPa` : 'N/A'}
                                  </td>
                                  <td className="px-4 py-2.5 font-sans text-slate-600 leading-normal text-[11px]">
                                    {mat.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Airfoils Library Sub-tab */}
            {activeSubTab === 'airfoils' && (
              <div className="flex-1 overflow-y-auto pr-1">
                <AirfoilCatalogTab />
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

function AirfoilCatalogTab() {
  const model = useAircraftStore((state) => state.model);
  const updateWing = useAircraftStore((state) => state.updateWing);
  const closeModal = useUIStore((state) => state.closeModal);

  const [selectedAirfoil, setSelectedAirfoil] = useState('NACA 2412');
  const [customNACA, setCustomNACA] = useState('4415');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const airfoilData = generateNACA4Digit(selectedAirfoil);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const scaleX = w * 0.8;
    const scaleY = h * 1.5;
    const offsetX = w * 0.1;
    const offsetY = h * 0.5;

    // Camber line
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    airfoilData.camber.forEach((pt, i) => {
      const cx = offsetX + pt.x * scaleX;
      const cy = offsetY - pt.y * scaleY;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Contour
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath();

    airfoilData.upper.forEach((pt, i) => {
      const cx = offsetX + pt.x * scaleX;
      const cy = offsetY - pt.y * scaleY;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });

    [...airfoilData.lower].reverse().forEach((pt) => {
      const cx = offsetX + pt.x * scaleX;
      const cy = offsetY - pt.y * scaleY;
      ctx.lineTo(cx, cy);
    });

    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(5, 150, 105, 0.1)';
    ctx.fill();
  }, [selectedAirfoil, airfoilData]);

  const applyToMainWing = () => {
    if (model.wings.length > 0) {
      updateWing(model.wings[0].id, { airfoilName: selectedAirfoil });
    }
    closeModal();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 space-y-3 text-xs">
        <label className="text-slate-600 block font-semibold">Pre-baked NACA Profiles</label>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {BUILTIN_AIRFOILS.map((af) => (
            <button
              key={af}
              onClick={() => setSelectedAirfoil(af)}
              className={`w-full text-left px-3 py-2 rounded font-mono transition flex justify-between items-center ${
                selectedAirfoil === af
                  ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{af}</span>
              {selectedAirfoil === af && <Check className="w-3.5 h-3.5 text-cyan-600" />}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200">
          <label className="text-slate-600 block font-semibold mb-1">Custom NACA 4-Digit</label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={customNACA}
              onChange={(e) => setCustomNACA(e.target.value)}
              className="bg-slate-50 border border-slate-350 rounded px-2 py-1 font-mono text-slate-900 w-20"
            />
            <button
              onClick={() => setSelectedAirfoil(`NACA ${customNACA}`)}
              className="bg-slate-100 hover:bg-slate-200 text-sky-700 px-3 py-1 rounded font-bold border border-slate-250"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <canvas ref={canvasRef} width={420} height={200} className="w-full rounded-lg bg-white border border-slate-150" />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500">Max Thickness (t/c): </span>
            <span className="text-slate-900 font-bold">{(airfoilData.thickness * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-500">Max Camber: </span>
            <span className="text-slate-900 font-bold">{(airfoilData.maxCamber * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={applyToMainWing}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 text-xs flex items-center gap-1.5 shadow transition"
          >
            <Check className="w-4 h-4 stroke-[3]" /> Apply to Wing
          </button>
        </div>
      </div>
    </div>
  );
}
