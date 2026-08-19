'use client';

import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';

export function PresetSelector() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const currentModelId = useAircraftStore((state) => state.model.id);
  const loadPreset = useAircraftStore((state) => state.loadPreset);

  if (activeModal !== 'presets') return null;

  const presetsList = [
    { key: 'high_wing_cargo', title: 'Tactical Cargo Airlifter (High Wing)', subtitle: 'Heavy-lift transport with shoulder-mounted high wing, twin turboprops & T-tail', color: 'from-amber-600 to-amber-800' },
    { key: 'commercial', title: 'Commercial Airliner (Low Wing)', subtitle: 'High-efficiency transport airliner with low-mounted swept wings & turbofans', color: 'from-sky-600 to-blue-800' },
    { key: 'delta_strike', title: 'Delta Strike Fighter (Mid Wing)', subtitle: 'Mid-wing stealth strike configuration with blended winglets & jet engine', color: 'from-blue-600 to-indigo-700' },
    { key: 'fighter', title: 'Supersonic Fighter (Mid Wing)', subtitle: 'Twin afterburning jet fighter with canted vertical tails & cropped delta wings', color: 'from-slate-700 to-slate-900' },
    { key: 'glider', title: 'High-Performance Glider (High Wing)', subtitle: 'Ultra high aspect-ratio sailplane with C1/C2 blended winglets', color: 'from-slate-300 to-slate-500' },
    { key: 'drone', title: 'Recon Drone UAV (High Wing)', subtitle: 'Long-endurance tactical drone with pusher prop & inverted V-tail', color: 'from-slate-600 to-slate-800' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <Sparkles className="w-5 h-5" />
            <span>OpenVSP Aircraft Presets</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {presetsList.map(({ key, title, subtitle }) => {
            const isSelected = currentModelId.includes(key);
            return (
              <div
                key={key}
                onClick={() => {
                  loadPreset(key);
                  closeModal();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 shadow-md ring-1 ring-sky-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-sky-300'
                }`}
              >
                <div className="space-y-1 z-10">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-700 transition">
                      {title}
                    </h4>
                    {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                  </div>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>

                <div className="flex justify-end pt-2 z-10">
                  <button className="text-xs font-bold px-3 py-1.5 rounded bg-white text-sky-700 border border-slate-200 group-hover:bg-sky-600 group-hover:text-white transition">
                    Load Preset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
