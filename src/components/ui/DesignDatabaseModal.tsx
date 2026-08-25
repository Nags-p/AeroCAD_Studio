'use client';

import React, { useState } from 'react';
import { X, Layers, Ruler, Plus, Info } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { MATERIALS_LIBRARY } from '@/engine/data/materials';

export function DesignDatabaseModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const units = useUIStore((state) => state.units);

  // Local tab selection for the database modal
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'sections' | 'payload'>('materials');

  if (activeModal !== 'database') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5 font-bold text-cyan-705">
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
                  : 'text-slate-655 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeSubTab === 'materials' ? 'text-cyan-600' : 'text-slate-500'}`} />
              <span>Materials Library</span>
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
                <Info className="w-3.5 h-3.5 text-cyan-605" />
                <span>Aerospace Constants</span>
              </div>
              <p>Reference catalog values are standard textbook engineering values used to size structures, calculate lift, and estimate empty weights.</p>
            </div>
          </div>

          {/* Main content viewport */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
            
            {/* Header info */}
            <div className="space-y-1 mb-5">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 select-none">
                <Layers className="w-5 h-5 text-cyan-600" />
                {activeSubTab === 'materials' && 'Aerospace Materials Library'}
              </h3>
              <p className="text-slate-655 text-xs font-medium">
                {activeSubTab === 'materials' && 'Standardized catalog of materials, apparent weights, Young\'s Modulus, and yield stress parameters.'}
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

          </div>
        </div>

      </div>
    </div>
  );
}
