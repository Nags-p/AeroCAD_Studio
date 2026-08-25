'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Library, Check } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { generateNACA4Digit, BUILTIN_AIRFOILS } from '@/engine/math/naca';

export function AirfoilLibrary() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const model = useAircraftStore((state) => state.model);
  const updateWing = useAircraftStore((state) => state.updateWing);

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

  if (activeModal !== 'airfoil') return null;

  const applyToMainWing = () => {
    if (model.wings.length > 0) {
      updateWing(model.wings[0].id, { airfoilName: selectedAirfoil });
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-emerald-700">
            <Library className="w-5 h-5" />
            <span>NACA Aerodynamic Airfoil Library</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-56 space-y-2 text-xs">
            <label className="text-slate-600 block font-semibold">Pre-baked NACA Profiles</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {BUILTIN_AIRFOILS.map((af) => (
                <button
                  key={af}
                  onClick={() => setSelectedAirfoil(af)}
                  className={`w-full text-left px-3 py-2 rounded font-mono transition flex justify-between items-center ${
                    selectedAirfoil === af
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{af}</span>
                  {selectedAirfoil === af && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="text-slate-600 block font-semibold mb-1">Custom NACA 4-Digit</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={customNACA}
                  onChange={(e) => setCustomNACA(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-slate-900 w-20"
                />
                <button
                  onClick={() => setSelectedAirfoil(`NACA ${customNACA}`)}
                  className="bg-slate-100 hover:bg-slate-200 text-sky-700 px-3 py-1 rounded font-bold"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner">
              <canvas ref={canvasRef} width={380} height={200} className="w-full rounded bg-white" />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs font-mono">
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
                className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={applyToMainWing}
                className="px-4 py-2 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs flex items-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Apply to Wing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
