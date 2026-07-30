'use client';

import React, { useMemo } from 'react';
import { X, Ruler, Scale, Layers, Target, Wind, Box } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { calculateAeroMetrics } from '@/engine/math/aeroMetrics';

export function MeasurementsPanel() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const units = useUIStore((state) => state.units);

  const model = useAircraftStore((state) => state.model);
  const aero = useMemo(() => calculateAeroMetrics(model), [model]);

  if (activeModal !== 'measurements') return null;

  const lenUnit = units === 'imperial' ? 'ft' : 'm';
  const areaUnit = units === 'imperial' ? 'ft²' : 'm²';
  const volUnit = units === 'imperial' ? 'ft³' : 'm³';
  const wtUnit = units === 'imperial' ? 'lbs' : 'kg';

  const lenMult = units === 'imperial' ? 3.28084 : 1.0;
  const areaMult = units === 'imperial' ? 10.7639 : 1.0;
  const volMult = units === 'imperial' ? 35.3147 : 1.0;
  const wtMult = units === 'imperial' ? 2.20462 : 1.0;

  const wingLoading = aero.referenceArea > 0
    ? (aero.estimatedEmptyWeight * wtMult) / (aero.referenceArea * areaMult)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <Ruler className="w-5 h-5" />
            <span>Aerodynamic & Mass Properties Analysis</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-600" /> Wetted Area (S_wet)
              </span>
              <p className="text-lg font-bold font-mono text-slate-900">{(aero.wettedArea * areaMult).toFixed(1)} {areaUnit}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1">
                <Box className="w-3.5 h-3.5 text-cyan-600" /> Volume
              </span>
              <p className="text-lg font-bold font-mono text-slate-900">{(aero.totalVolume * volMult).toFixed(1)} {volUnit}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-emerald-600" /> Wing Area (S_ref)
              </span>
              <p className="text-lg font-bold font-mono text-slate-900">{(aero.referenceArea * areaMult).toFixed(1)} {areaUnit}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-purple-600" /> Empty Weight
              </span>
              <p className="text-lg font-bold font-mono text-slate-900">{Math.round(aero.estimatedEmptyWeight * wtMult)} {wtUnit}</p>
            </div>
          </div>

          {/* Aerodynamic Parameters Table */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-sky-700 flex items-center gap-2">
              <Wind className="w-4 h-4" /> Aerodynamic Parameters Breakdown
            </h4>

            <table className="w-full text-xs text-left font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Parameter</th>
                  <th className="py-2">Symbol</th>
                  <th className="py-2">Calculated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">
                <tr>
                  <td className="py-2 text-slate-600">Wing Aspect Ratio</td>
                  <td className="py-2 font-bold text-purple-600">AR</td>
                  <td className="py-2 font-bold">{aero.aspectRatio.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Mean Aerodynamic Chord</td>
                  <td className="py-2 font-bold text-emerald-600">MAC</td>
                  <td className="py-2 font-bold">{(aero.meanAerodynamicChord * lenMult).toFixed(2)} {lenUnit}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Wing Taper Ratio</td>
                  <td className="py-2 font-bold text-sky-600">λ</td>
                  <td className="py-2 font-bold">{aero.taperRatio.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Wing Loading (Empty)</td>
                  <td className="py-2 font-bold text-amber-600">W/S</td>
                  <td className="py-2 font-bold">{wingLoading.toFixed(1)} {wtUnit}/{areaUnit}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Center of Gravity Position</td>
                  <td className="py-2 font-bold text-red-600">X_cg, Y_cg, Z_cg</td>
                  <td className="py-2 font-bold">
                    [{(aero.centerOfGravity[0] * lenMult).toFixed(2)}, {(aero.centerOfGravity[1] * lenMult).toFixed(2)}, {(aero.centerOfGravity[2] * lenMult).toFixed(2)}] {lenUnit}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
