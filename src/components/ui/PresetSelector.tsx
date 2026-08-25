'use client';

import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useFileStore } from '@/store/useFileStore';
import { AircraftThumbnail } from './AircraftThumbnail';
import { AIRCRAFT_PRESETS } from '@/engine/presets/aircraftPresets';

export function PresetSelector() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const currentModelId = useAircraftStore((state) => state.model.id);
  const createNewFile = useFileStore((state) => state.createNewFile);

  if (activeModal !== 'presets') return null;

  const presetsList = [
    { key: 'high_wing_cargo', title: 'Tactical Cargo Airlifter (High Wing)', subtitle: 'Heavy-lift transport with shoulder-mounted high wing, twin turboprops & T-tail', defaultName: 'Tactical Cargo' },
    { key: 'commercial', title: 'Commercial Airliner (Low Wing)', subtitle: 'High-efficiency transport airliner with low-mounted swept wings & turbofans', defaultName: 'Commercial Airliner' },
    { key: 'delta_strike', title: 'Delta Strike Fighter (Mid Wing)', subtitle: 'Mid-wing stealth strike configuration with blended winglets & jet engine', defaultName: 'Delta Strike Fighter' },
    { key: 'fighter', title: 'Supersonic Fighter (Mid Wing)', subtitle: 'Twin afterburning jet fighter with canted vertical tails & cropped delta wings', defaultName: 'Supersonic Fighter' },
    { key: 'glider', title: 'High-Performance Glider (High Wing)', subtitle: 'Ultra high aspect-ratio sailplane with C1/C2 blended winglets', defaultName: 'High-Performance Glider' },
    { key: 'drone', title: 'Recon Drone UAV (High Wing)', subtitle: 'Long-endurance tactical drone with pusher prop & inverted V-tail', defaultName: 'Recon Drone UAV' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
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

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
          {presetsList.map(({ key, title, subtitle, defaultName }) => {
            const isSelected = currentModelId.includes(key);
            const presetModel = AIRCRAFT_PRESETS[key];
            return (
              <div
                key={key}
                onClick={() => {
                  createNewFile(defaultName, key);
                  closeModal();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-3 relative overflow-hidden group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 shadow-md ring-1 ring-sky-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-sky-300'
                }`}
              >
                {presetModel && (
                  <AircraftThumbnail model={presetModel} width={52} height={52} />
                )}
                <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0 z-10">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition truncate">
                        {title}
                      </h4>
                      {isSelected && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">{subtitle}</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button className="text-xs font-bold px-3 py-1 rounded bg-white text-sky-700 border border-slate-200 group-hover:bg-sky-600 group-hover:text-white transition">
                      Load Preset
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
