'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Sliders, Save } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { generateSectionPoints } from '@/engine/math/superellipse';
import { SectionShapeType } from '@/types/aircraft';

export function SketcherModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const activeSketchSectionId = useUIStore((state) => state.activeSketchSectionId);
  const closeModal = useUIStore((state) => state.closeModal);

  const model = useAircraftStore((state) => state.model);
  const updateFuselageSection = useAircraftStore((state) => state.updateFuselageSection);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const section = model.fuselage.sections.find((s) => s.id === activeSketchSectionId) || model.fuselage.sections[0];

  const [shapeType, setShapeType] = useState<SectionShapeType>(section ? section.shapeType : 'ellipse');
  const [width, setWidth] = useState(section ? section.width : 1.8);
  const [height, setHeight] = useState(section ? section.height : 1.6);
  const [nExp, setNExp] = useState(section ? (section.nExp || 2.0) : 2.0);
  const [mExp, setMExp] = useState(section ? (section.mExp || 2.0) : 2.0);
  const [cornerRadius, setCornerRadius] = useState(section ? (section.cornerRadius || 0.3) : 0.3);

  useEffect(() => {
    if (section) {
      setShapeType(section.shapeType || 'ellipse');
      setWidth(section.width || 1.8);
      setHeight(section.height || 1.6);
      setNExp(section.nExp || 2.0);
      setMExp(section.mExp || 2.0);
      setCornerRadius(section.cornerRadius || 0.3);
    }
  }, [section]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const gridSize = 30;

    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    ctx.strokeStyle = '#2563EB';
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('+Y (Width)', w - 65, cy - 6);
    ctx.fillStyle = '#2563EB';
    // Adaptive Scale based on current dimensions
    const maxDim = Math.max(width, height, 1.0);
    const targetRadius = Math.min((w / 2) * 0.68, (h / 2) * 0.68);
    const scale = targetRadius / (maxDim / 2);

    const pts = generateSectionPoints(
      shapeType,
      width,
      height,
      nExp,
      mExp,
      cornerRadius,
      undefined,
      undefined,
      64,
      0,
      0
    );

    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    pts.forEach((pt, i) => {
      const px = cx + pt.y * scale;
      const py = cy - pt.z * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(2, 132, 199, 0.1)';
    ctx.fill();

    const rx = (width / 2) * scale;
    const ry = (height / 2) * scale;

    const drawHandle = (hx: number, hy: number, color: string) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    if (shapeType === 'circle') {
      drawHandle(cx + rx, cy, '#0284C7');
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Ø = ${width.toFixed(2)}m`, cx, cy + ry + 22);
    } else if (shapeType !== 'point') {
      drawHandle(cx + rx, cy, '#D97706');
      drawHandle(cx - rx, cy, '#D97706');
      drawHandle(cx, cy - ry, '#0284C7');
      drawHandle(cx, cy + ry, '#0284C7');

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`W = ${width.toFixed(2)}m`, cx, cy + ry + 22);
      ctx.fillText(`H = ${height.toFixed(2)}m`, cx + rx + 35, cy + 4);
    }
    ctx.textAlign = 'left';
  }, [shapeType, width, height, nExp, mExp, cornerRadius]);

  if (activeModal !== 'sketcher') return null;

  const handleSave = () => {
    if (section) {
      updateFuselageSection(section.id, {
        shapeType,
        width,
        height,
        nExp,
        mExp,
        cornerRadius,
      });
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-sky-700">
            <Sliders className="w-5 h-5" />
            <span>OpenVSP 2D Cross-Section Sketcher - {section?.name}</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-inner">
            <canvas ref={canvasRef} width={340} height={340} className="rounded cursor-crosshair bg-white" />
          </div>

          <div className="flex-1 space-y-4 text-xs w-full">
            {/* OpenVSP Cross-Section Type */}
            <div className="space-y-1">
              <label className="text-sky-700 font-bold block">OpenVSP Cross-Section Type (XSec)</label>
              <select
                value={shapeType}
                onChange={(e) => setShapeType(e.target.value as SectionShapeType)}
                className="w-full bg-slate-50 border border-sky-300 rounded p-1.5 text-slate-900 font-mono font-bold"
              >
                <option value="point">POINT (Apex Tip)</option>
                <option value="circle">CIRCLE (Pure Circular)</option>
                <option value="ellipse">ELLIPSE (Standard Elliptic)</option>
                <option value="super_ellipse">SUPER_ELLIPSE (M & N Exponents)</option>
                <option value="rounded_rectangle">ROUNDED_RECTANGLE (Box + Fillet)</option>
                <option value="general_fuse">GENERAL_FUSE (Upper/Lower Height)</option>
                <option value="biconvex">BICONVEX (Lens Profile)</option>
                <option value="wedge">WEDGE (Flat Bottom)</option>
              </select>
            </div>

            {/* Width */}
            {shapeType !== 'point' && (
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Width (W)</span>
                  <span className="font-mono text-slate-900 font-bold">{width.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="8.0"
                  step="0.1"
                  value={width}
                  onChange={(e) => {
                    setWidth(parseFloat(e.target.value));
                    if (shapeType === 'circle') setHeight(parseFloat(e.target.value));
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            )}

            {/* Height */}
            {shapeType !== 'circle' && shapeType !== 'point' && (
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Height (H)</span>
                  <span className="font-mono text-slate-900 font-bold">{height.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="8.0"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            )}

            {/* Super Ellipse Exponents */}
            {shapeType === 'super_ellipse' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Exponent N (Height Power)</span>
                    <span className="font-mono text-sky-700 font-bold">{nExp.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.1"
                    value={nExp}
                    onChange={(e) => setNExp(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Exponent M (Width Power)</span>
                    <span className="font-mono text-sky-700 font-bold">{mExp.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.1"
                    value={mExp}
                    onChange={(e) => setMExp(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                  />
                </div>
              </div>
            )}

            {/* Rounded Rectangle Fillet Radius */}
            {shapeType === 'rounded_rectangle' && (
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Corner Fillet Radius</span>
                  <span className="font-mono text-slate-900 font-bold">{(cornerRadius * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-sky-600 text-white font-bold hover:bg-sky-700 flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
