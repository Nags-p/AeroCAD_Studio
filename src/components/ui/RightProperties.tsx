'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sliders, Paintbrush, Wind, Box, Settings, CircleDot, Move } from 'lucide-react';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';
import { BUILTIN_AIRFOILS } from '@/engine/math/naca';
import { SectionShapeType, FuselageSection } from '@/types/aircraft';
import { generateSectionPoints } from '@/engine/math/superellipse';

/**
 * Reusable CAD Property Control with synchronized Slider + Editable Numeric Input Box
 */
function PropertyRow({
  label,
  value,
  min,
  max,
  step = 0.05,
  unitLabel = '',
  unitFactor = 1.0,
  accentClass = 'accent-sky-600',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unitLabel?: string;
  unitFactor?: number;
  accentClass?: string;
  onChange: (val: number) => void;
}) {
  const displayVal = value * unitFactor;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-slate-600 font-medium">
        <span>{label} {unitLabel ? `(${unitLabel})` : ''}</span>
        <input
          type="number"
          step={step}
          min={min * unitFactor}
          max={max * unitFactor}
          value={isNaN(displayVal) ? '' : Number(displayVal.toFixed(2))}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed)) {
              onChange(parsed / unitFactor);
            }
          }}
          className="w-20 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 font-mono text-slate-900 font-bold text-right text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer ${accentClass}`}
      />
    </div>
  );
}

/**
 * Ultra-Crisp HiDPI Interactive 2D Cross-Section Sketch Canvas with Drag-to-Resize Handles
 */
function Station2DSketchCanvas({
  section,
  onChange,
}: {
  section: FuselageSection;
  onChange: (params: Partial<FuselageSection>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<'width' | 'height' | 'both' | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('crosshair');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI / Retina Sharp Canvas Scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const displayWidth = 270;
    const displayHeight = 190;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = displayWidth;
    const h = displayHeight;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Light CAD Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const gridSize = 25;

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

    // Coordinate Axes
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

    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('+Y', w - 18, cy - 5);
    ctx.fillStyle = '#2563EB';
    ctx.fillText('+Z', cx + 5, 12);

    // Contour Points
    const scale = 32;
    const pts = generateSectionPoints(
      section.shapeType || 'ellipse',
      section.width,
      section.height,
      section.nExp || 2.0,
      section.mExp || section.nExp || 2.0,
      section.cornerRadius || 0.3,
      section.upperHeight,
      section.lowerHeight,
      64,
      0,
      0
    );

    ctx.strokeStyle = isDragging ? '#2563EB' : '#0284C7';
    ctx.lineWidth = isDragging ? 3 : 2.5;

    ctx.beginPath();
    pts.forEach((pt, i) => {
      const px = cx + pt.y * scale;
      const py = cy - pt.z * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = isDragging ? 'rgba(37, 99, 235, 0.2)' : 'rgba(2, 132, 199, 0.12)';
    ctx.fill();

    const rx = (section.width / 2) * scale;
    const ry = (section.height / 2) * scale;

    const drawHandle = (hx: number, hy: number, color: string, active: boolean) => {
      ctx.save();
      ctx.fillStyle = active ? '#38BDF8' : color;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, active ? 7 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    if (section.shapeType !== 'point') {
      drawHandle(cx + rx, cy, '#D97706', isDragging === 'width' || isDragging === 'both');
      drawHandle(cx - rx, cy, '#D97706', isDragging === 'width' || isDragging === 'both');
      drawHandle(cx, cy - ry, '#0284C7', isDragging === 'height' || isDragging === 'both');
      drawHandle(cx, cy + ry, '#0284C7', isDragging === 'height' || isDragging === 'both');
    }

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`W = ${section.width.toFixed(2)}m`, cx, Math.min(cy + ry + 15, h - 6));
    ctx.fillText(`H = ${section.height.toFixed(2)}m`, Math.min(cx + rx + 25, w - 26), cy + 4);

    ctx.restore();
  }, [section, isDragging]);

  // Mouse Interaction Handlers for Canvas Dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = 270 / 2;
    const cy = 190 / 2;
    const scale = 32;
    const rx = (section.width / 2) * scale;
    const ry = (section.height / 2) * scale;

    // Right handle (Width)
    if (Math.hypot(mx - (cx + rx), my - cy) < 14 || Math.hypot(mx - (cx - rx), my - cy) < 14) {
      setIsDragging('width');
      return;
    }

    // Top handle (Height)
    if (Math.hypot(mx - cx, my - (cy - ry)) < 14 || Math.hypot(mx - cx, my - (cy + ry)) < 14) {
      setIsDragging('height');
      return;
    }

    // Inside body (Both)
    const normDist = Math.hypot((mx - cx) / Math.max(1, rx), (my - cy) / Math.max(1, ry));
    if (normDist < 1.1) {
      setIsDragging('both');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = 270 / 2;
    const cy = 190 / 2;
    const scale = 32;

    if (isDragging) {
      if (isDragging === 'width') {
        const newW = Math.max(0.2, (Math.abs(mx - cx) * 2) / scale);
        onChange(section.shapeType === 'circle' ? { width: newW, height: newW } : { width: newW });
      } else if (isDragging === 'height') {
        const newH = Math.max(0.2, (Math.abs(cy - my) * 2) / scale);
        onChange({ height: newH });
      } else if (isDragging === 'both') {
        const newW = Math.max(0.2, (Math.abs(mx - cx) * 2) / scale);
        const newH = Math.max(0.2, (Math.abs(cy - my) * 2) / scale);
        onChange(section.shapeType === 'circle' ? { width: newW, height: newW } : { width: newW, height: newH });
      }
      return;
    }

    // Hover Cursor Detection
    const rx = (section.width / 2) * scale;
    const ry = (section.height / 2) * scale;

    if (Math.hypot(mx - (cx + rx), my - cy) < 14 || Math.hypot(mx - (cx - rx), my - cy) < 14) {
      setCursorStyle('ew-resize');
    } else if (Math.hypot(mx - cx, my - (cy - ry)) < 14 || Math.hypot(mx - cx, my - (cy + ry)) < 14) {
      setCursorStyle('ns-resize');
    } else if (Math.hypot((mx - cx) / Math.max(1, rx), (my - cy) / Math.max(1, ry)) < 1.1) {
      setCursorStyle('grab');
    } else {
      setCursorStyle('crosshair');
    }
  };

  const handleMouseUp = () => setIsDragging(null);

  return (
    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-inner flex flex-col items-center space-y-1.5 my-2">
      <div className="w-full flex justify-between items-center text-[10px] font-bold text-sky-700 uppercase tracking-wider font-mono">
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-sky-600" /> Interactive 2D Drag Canvas
        </span>
        <span className="text-slate-500">{section.shapeType || 'ellipse'}</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '270px', height: '190px', cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="rounded bg-white border border-slate-200 shadow-sm"
      />
    </div>
  );
}

export function RightProperties() {
  const model = useAircraftStore((state) => state.model);
  const selectedId = useAircraftStore((state) => state.selectedId);
  const selectedType = useAircraftStore((state) => state.selectedType);

  const updateFuselage = useAircraftStore((state) => state.updateFuselage);
  const updateFuselageSection = useAircraftStore((state) => state.updateFuselageSection);
  const updateWing = useAircraftStore((state) => state.updateWing);
  const updateTail = useAircraftStore((state) => state.updateTail);
  const updateEngine = useAircraftStore((state) => state.updateEngine);

  const units = useUIStore((state) => state.units);
  const unitFactor = units === 'imperial' ? 3.28084 : 1.0;
  const unitLabel = units === 'imperial' ? 'ft' : 'm';

  const activeFuselage = selectedType === 'fuselage' ? model.fuselage : null;

  const activeSection = selectedType === 'section'
    ? model.fuselage.sections.find((s) => s.id === selectedId) ||
      model.fuselage.sections.find((s, idx) => selectedId === `sec${idx + 1}` || selectedId === `sec-${idx}` || selectedId?.includes(`sec${idx}`) || selectedId?.includes(`sec-${idx}`)) ||
      model.fuselage.sections[0]
    : null;

  const activeWing = selectedType === 'wing'
    ? model.wings.find((w) => w.id === selectedId) || model.wings[0]
    : null;

  const activeTail = selectedType === 'tail'
    ? model.tails.find((t) => t.id === selectedId) || model.tails[0]
    : null;

  const activeEngine = selectedType === 'engine'
    ? model.engines.find((e) => e.id === selectedId) || model.engines[0]
    : null;

  return (
    <aside className="w-80 h-[calc(100vh-3rem-1.75rem)] bg-white border-l border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      {/* Property Inspector Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-sky-600" />
          <span>Property Inspector</span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold border border-sky-200">
          {selectedType || 'None'}
        </span>
      </div>

      <div className="p-3 space-y-4 text-xs">
        {/* 1. FUSELAGE PARAMETERS */}
        {activeFuselage && (
          <div className="space-y-3">
            <div className="font-semibold text-sky-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Box className="w-4 h-4" /> Fuselage Parameters ({activeFuselage.name})
            </div>

            {/* Total Length */}
            <PropertyRow
              label="Total Length"
              value={activeFuselage.length}
              min={1.0}
              max={150.0}
              step={0.5}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              onChange={(val) => updateFuselage({ length: val })}
            />

            {/* Nose Roundness (S) */}
            <PropertyRow
              label="Nose Roundness (S)"
              value={activeFuselage.noseRoundness}
              min={0.05}
              max={3.0}
              step={0.05}
              onChange={(val) => updateFuselage({ noseRoundness: val })}
            />

            {/* Nose Apex Z Shift */}
            <PropertyRow
              label="Nose Apex Z Shift"
              value={activeFuselage.noseZ || 0}
              min={-5.0}
              max={5.0}
              step={0.05}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              onChange={(val) => updateFuselage({ noseZ: val })}
            />

            {/* Nose Apex Y Shift */}
            <PropertyRow
              label="Nose Apex Y Shift"
              value={activeFuselage.noseY || 0}
              min={-5.0}
              max={5.0}
              step={0.05}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              onChange={(val) => updateFuselage({ noseY: val })}
            />

            {/* Tail Tip Z Shift */}
            <PropertyRow
              label="Tail Tip Z Shift"
              value={activeFuselage.tailZ || 0}
              min={-5.0}
              max={5.0}
              step={0.05}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-amber-600"
              onChange={(val) => updateFuselage({ tailZ: val })}
            />

            {/* Tail Scale */}
            <PropertyRow
              label="Tail Scale"
              value={activeFuselage.tail || 0.3}
              min={0.01}
              max={2.0}
              step={0.05}
              onChange={(val) => updateFuselage({ tail: val })}
            />

            {/* Color */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5"><Paintbrush className="w-3.5 h-3.5" /> Component Color</span>
              <input
                type="color"
                value={activeFuselage.color}
                onChange={(e) => updateFuselage({ color: e.target.value })}
                className="w-8 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}

        {/* 2. OPENVSP FUSELAGE SECTION STATION PARAMETERS WITH INTERACTIVE DRAG 2D SKETCH */}
        {activeSection && (
          <div className="space-y-3">
            <div className="font-semibold text-sky-700 flex items-center justify-between border-b border-slate-200 pb-1">
              <div className="flex items-center gap-1.5">
                <CircleDot className="w-4 h-4 text-sky-600" />
                <span>Station ({activeSection.name})</span>
              </div>
            </div>

            {/* EMBEDDED ULTRA-CRISP HIGH-DPI INTERACTIVE DRAG 2D SKETCH CANVAS */}
            <Station2DSketchCanvas
              section={activeSection}
              onChange={(params) => updateFuselageSection(activeSection.id, params)}
            />

            {/* Station Label */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium block">Station Label</label>
              <input
                type="text"
                value={activeSection.name}
                onChange={(e) => updateFuselageSection(activeSection.id, { name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* OpenVSP Cross-Section Type (XSec Type Dropdown) */}
            <div className="space-y-1">
              <label className="text-slate-600 font-bold block text-sky-700">OpenVSP Cross-Section Type (XSec)</label>
              <select
                value={activeSection.shapeType || 'ellipse'}
                onChange={(e) => updateFuselageSection(activeSection.id, { shapeType: e.target.value as SectionShapeType })}
                className="w-full bg-slate-50 border border-sky-300 rounded p-1.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-sky-500"
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

            {/* Station X Position % (Hidden for Nose Tip Station at xPos = 0) */}
            {activeSection.xPos > 0.001 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Longitudinal Position (X)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(activeSection.xPos * 100)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          updateFuselageSection(activeSection.id, { xPos: Math.max(0, Math.min(100, val)) / 100 });
                        }
                      }}
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 font-mono text-slate-900 font-bold text-right text-xs focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="font-mono text-slate-700">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={activeSection.xPos}
                  onChange={(e) => updateFuselageSection(activeSection.id, { xPos: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            )}

            {/* DYNAMIC SHAPE CONTROLS */}
            {/* CIRCLE: Radius / Diameter */}
            {activeSection.shapeType === 'circle' && (
              <PropertyRow
                label="Diameter"
                value={activeSection.width}
                min={0.1}
                max={20.0}
                step={0.05}
                unitLabel={unitLabel}
                unitFactor={unitFactor}
                onChange={(val) => updateFuselageSection(activeSection.id, { width: val, height: val })}
              />
            )}

            {/* ELLIPSE, SUPER_ELLIPSE, ROUNDED_RECTANGLE, BICONVEX, WEDGE: Width & Height */}
            {activeSection.shapeType !== 'circle' && activeSection.shapeType !== 'point' && activeSection.shapeType !== 'general_fuse' && (
              <>
                <PropertyRow
                  label="Width"
                  value={activeSection.width}
                  min={0.1}
                  max={20.0}
                  step={0.05}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  onChange={(val) => updateFuselageSection(activeSection.id, { width: val })}
                />
                <PropertyRow
                  label="Height"
                  value={activeSection.height}
                  min={0.1}
                  max={20.0}
                  step={0.05}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  onChange={(val) => updateFuselageSection(activeSection.id, { height: val })}
                />
              </>
            )}

            {/* SUPER_ELLIPSE: Exponents M & N */}
            {activeSection.shapeType === 'super_ellipse' && (
              <div className="space-y-2 bg-slate-50 p-2 rounded border border-slate-200">
                <PropertyRow
                  label="Exponent N (Height Power)"
                  value={activeSection.nExp || 2.0}
                  min={0.5}
                  max={10.0}
                  step={0.1}
                  onChange={(val) => updateFuselageSection(activeSection.id, { nExp: val })}
                />
                <PropertyRow
                  label="Exponent M (Width Power)"
                  value={activeSection.mExp || activeSection.nExp || 2.0}
                  min={0.5}
                  max={10.0}
                  step={0.1}
                  onChange={(val) => updateFuselageSection(activeSection.id, { mExp: val })}
                />
              </div>
            )}

            {/* ROUNDED_RECTANGLE: Corner Radius */}
            {activeSection.shapeType === 'rounded_rectangle' && (
              <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                <PropertyRow
                  label="Corner Fillet Radius"
                  value={activeSection.cornerRadius || 0.3}
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  onChange={(val) => updateFuselageSection(activeSection.id, { cornerRadius: val })}
                />
              </div>
            )}

            {/* GENERAL_FUSE: Width, Upper Height & Lower Height */}
            {activeSection.shapeType === 'general_fuse' && (
              <div className="space-y-2 bg-slate-50 p-2 rounded border border-slate-200">
                <PropertyRow
                  label="Fuselage Width"
                  value={activeSection.width}
                  min={0.1}
                  max={20.0}
                  step={0.05}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  onChange={(val) => updateFuselageSection(activeSection.id, { width: val })}
                />
                <PropertyRow
                  label="Upper Deck Height"
                  value={activeSection.upperHeight || activeSection.height / 2}
                  min={0.1}
                  max={15.0}
                  step={0.05}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  onChange={(val) => updateFuselageSection(activeSection.id, { upperHeight: val })}
                />
                <PropertyRow
                  label="Lower Cargo Height"
                  value={activeSection.lowerHeight || activeSection.height / 2}
                  min={0.1}
                  max={15.0}
                  step={0.05}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  onChange={(val) => updateFuselageSection(activeSection.id, { lowerHeight: val })}
                />
              </div>
            )}
          </div>
        )}

        {/* 3. WING PARAMETERS */}
        {activeWing && (
          <div className="space-y-3">
            <div className="font-semibold text-emerald-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Wind className="w-4 h-4" /> Wing Parameters ({activeWing.name})
            </div>

            {/* NACA Airfoil Picker */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium block">NACA Airfoil Profile</label>
              <select
                value={activeWing.airfoilName}
                onChange={(e) => updateWing(activeWing.id, { airfoilName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono"
              >
                {BUILTIN_AIRFOILS.map((af) => (
                  <option key={af} value={af}>{af}</option>
                ))}
              </select>
            </div>

            {/* Wingspan */}
            <PropertyRow
              label="Wingspan"
              value={activeWing.span}
              min={1.0}
              max={150.0}
              step={0.5}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-emerald-600"
              onChange={(val) => updateWing(activeWing.id, { span: val })}
            />

            {/* Root Chord */}
            <PropertyRow
              label="Root Chord"
              value={activeWing.rootChord}
              min={0.2}
              max={30.0}
              step={0.1}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-emerald-600"
              onChange={(val) => updateWing(activeWing.id, { rootChord: val })}
            />

            {/* Tip Chord */}
            <PropertyRow
              label="Tip Chord"
              value={activeWing.tipChord}
              min={0.1}
              max={20.0}
              step={0.1}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-emerald-600"
              onChange={(val) => updateWing(activeWing.id, { tipChord: val })}
            />

            {/* Sweep */}
            <PropertyRow
              label="Sweep Angle (deg)"
              value={activeWing.sweep}
              min={-45}
              max={80}
              step={1}
              accentClass="accent-emerald-600"
              onChange={(val) => updateWing(activeWing.id, { sweep: val })}
            />

            {/* Dihedral */}
            <PropertyRow
              label="Dihedral Angle (deg)"
              value={activeWing.dihedral}
              min={-30}
              max={45}
              step={0.5}
              accentClass="accent-emerald-600"
              onChange={(val) => updateWing(activeWing.id, { dihedral: val })}
            />

            {/* Wing Mounting Configuration (High, Mid, Low Wing) */}
            <div className="space-y-1.5 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
              <label className="text-emerald-900 font-bold text-[11px] uppercase tracking-wider block flex items-center justify-between">
                <span>Wing Mounting Configuration</span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                  {(() => {
                  const currentZ = activeWing.rootPos[2];
                  const activeMount = activeWing.mountConfig || (currentZ > 0.3 ? 'high' : currentZ < -0.2 ? 'low' : 'mid');
                  return activeMount.toUpperCase();
                })()}
                </span>
              </label>

              {/* Quick Preset Selector Buttons */}
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[
                  {
                    id: 'low',
                    label: 'Low Wing',
                    desc: 'Bottom mount (Airliner/GA)',
                    zTarget: -Math.max(0.4, (model.fuselage?.radius || 1.8) * 0.45),
                    suggestedDihedral: 3.5,
                  },
                  {
                    id: 'mid',
                    label: 'Mid Wing',
                    desc: 'Fuselage centerline (Fighter)',
                    zTarget: 0.0,
                    suggestedDihedral: 1.0,
                  },
                  {
                    id: 'high',
                    label: 'High Wing',
                    desc: 'Top mount (Cargo/Bush)',
                    zTarget: Math.max(0.5, (model.fuselage?.radius || 1.8) * 0.75),
                    suggestedDihedral: 0.0,
                  },
                  {
                    id: 'custom',
                    label: 'Custom',
                    desc: 'Manual height offset',
                    zTarget: activeWing.rootPos[2],
                    suggestedDihedral: activeWing.dihedral,
                  },
                ].map((cfg) => {
                  const currentZ = activeWing.rootPos[2];
                  const activeMount = activeWing.mountConfig || (currentZ > 0.3 ? 'high' : currentZ < -0.2 ? 'low' : 'mid');
                  const isActive = activeMount === cfg.id;

                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => {
                        if (cfg.id === 'custom') {
                          updateWing(activeWing.id, { mountConfig: 'custom' });
                        } else {
                          updateWing(activeWing.id, {
                            mountConfig: cfg.id as any,
                            rootPos: [activeWing.rootPos[0], activeWing.rootPos[1], cfg.zTarget],
                          });
                        }
                      }}
                      className={`px-1.5 py-1.5 rounded text-[10px] font-bold transition flex flex-col items-center justify-center text-center ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white text-slate-700 hover:bg-emerald-100/50 border border-slate-200'
                      }`}
                      title={cfg.desc}
                    >
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position Z (Mount Height) */}
            <PropertyRow
              label="Mount Height (Position Z)"
              value={activeWing.rootPos[2]}
              min={-10.0}
              max={15.0}
              step={0.05}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-emerald-600"
              onChange={(val) => {
                updateWing(activeWing.id, {
                  mountConfig: 'custom',
                  rootPos: [activeWing.rootPos[0], activeWing.rootPos[1], val],
                });
              }}
            />

            {/* Position X Offset */}
            <PropertyRow
              label="Position X Offset"
              value={activeWing.rootPos[0]}
              min={-50.0}
              max={100.0}
              step={0.2}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-emerald-600"
              onChange={(val) =>
                updateWing(activeWing.id, {
                  rootPos: [val, activeWing.rootPos[1], activeWing.rootPos[2]],
                })
              }
            />

            {/* Position Y (Lateral) Offset */}
            <PropertyRow
              label="Lateral Offset (Position Y)"
              value={activeWing.rootPos[1]}
              min={-20.0}
              max={20.0}
              step={0.1}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-emerald-600"
              onChange={(val) =>
                updateWing(activeWing.id, {
                  rootPos: [activeWing.rootPos[0], val, activeWing.rootPos[2]],
                })
              }
            />

            {/* Winglets & C1/C2 Fillet Radius */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={activeWing.winglets.enabled}
                  onChange={(e) =>
                    updateWing(activeWing.id, {
                      winglets: { ...activeWing.winglets, enabled: e.target.checked },
                    })
                  }
                  className="rounded accent-emerald-600"
                />
                <span>Enable Winglets</span>
              </label>

              {activeWing.winglets.enabled && (
                <div className="pl-3 space-y-2 border-l border-emerald-400 pt-1">
                  <PropertyRow
                    label="Winglet Height"
                    value={activeWing.winglets.height}
                    min={0.1}
                    max={10.0}
                    step={0.1}
                    unitLabel={unitLabel}
                    unitFactor={unitFactor}
                    accentClass="accent-emerald-600"
                    onChange={(val) =>
                      updateWing(activeWing.id, {
                        winglets: { ...activeWing.winglets, height: val },
                      })
                    }
                  />

                  <PropertyRow
                    label="Fillet Radius C1/C2"
                    value={activeWing.winglets.filletRadius || 0.6}
                    min={0.0}
                    max={5.0}
                    step={0.05}
                    unitLabel={unitLabel}
                    unitFactor={unitFactor}
                    accentClass="accent-emerald-600"
                    onChange={(val) =>
                      updateWing(activeWing.id, {
                        winglets: { ...activeWing.winglets, filletRadius: val },
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Color */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5"><Paintbrush className="w-3.5 h-3.5" /> Component Color</span>
              <input
                type="color"
                value={activeWing.color}
                onChange={(e) => updateWing(activeWing.id, { color: e.target.value })}
                className="w-8 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}

        {/* 4. TAIL ASSEMBLY PARAMETERS */}
        {activeTail && (
          <div className="space-y-3">
            <div className="font-semibold text-amber-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Settings className="w-4 h-4" /> Tail Parameters ({activeTail.name})
            </div>

            {/* Tail Configuration Type Dropdown */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium block">Tail Configuration</label>
              <select
                value={activeTail.type}
                onChange={(e) => updateTail(activeTail.id, { type: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono"
              >
                <option value="conventional">Conventional (H-Stab + V-Stab)</option>
                <option value="v-tail">V-Tail (Angled Fins)</option>
                <option value="t-tail">T-Tail (Top Mounted H-Stab)</option>
                <option value="twin-tail">Twin-Tail (Dual Vertical Fins)</option>
                <option value="canard">Canard (Forward Elevator)</option>
              </select>
            </div>

            {/* ── Horizontal Stabilizer ── */}
            <div className="space-y-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
              <div className="font-bold text-[11px] text-amber-800 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-amber-200">
                <span className="w-2.5 h-0.5 bg-amber-600 rounded-full inline-block" />
                Horizontal Stabilizer
              </div>

              {/* Horizontal Span */}
              <PropertyRow
                label="Span"
                value={activeTail.horizontalSpan}
                min={0.5}
                max={50.0}
                step={0.2}
                unitLabel={unitLabel}
                unitFactor={unitFactor}
                accentClass="accent-amber-600"
                onChange={(val) => updateTail(activeTail.id, { horizontalSpan: val })}
              />

              {/* Horizontal Root Chord */}
              <PropertyRow
                label="Root Chord"
                value={activeTail.horizontalChord}
                min={0.1}
                max={15.0}
                step={0.1}
                unitLabel={unitLabel}
                unitFactor={unitFactor}
                accentClass="accent-amber-600"
                onChange={(val) => updateTail(activeTail.id, { horizontalChord: val })}
              />

              {/* Horizontal Tip Chord */}
              <PropertyRow
                label="Tip Chord"
                value={activeTail.horizontalTipChord ?? activeTail.horizontalChord * 0.6}
                min={0.05}
                max={10.0}
                step={0.05}
                unitLabel={unitLabel}
                unitFactor={unitFactor}
                accentClass="accent-amber-600"
                onChange={(val) => updateTail(activeTail.id, { horizontalTipChord: val })}
              />

              {/* Horizontal Sweep */}
              <PropertyRow
                label="Sweep (deg)"
                value={activeTail.horizontalSweep ?? activeTail.sweep}
                min={-10}
                max={75}
                step={1}
                accentClass="accent-amber-600"
                onChange={(val) => updateTail(activeTail.id, { horizontalSweep: val, sweep: val })}
              />

              {/* Dihedral (only relevant for horizontal) */}
              {(activeTail.type === 'conventional' || activeTail.type === 'v-tail') && (
                <PropertyRow
                  label="Dihedral (deg)"
                  value={activeTail.dihedral}
                  min={-30}
                  max={60}
                  step={1}
                  accentClass="accent-amber-600"
                  onChange={(val) => updateTail(activeTail.id, { dihedral: val })}
                />
              )}
            </div>

            {/* ── Vertical Stabilizer ── */}
            {activeTail.type !== 'v-tail' && activeTail.type !== 'canard' && (
              <div className="space-y-2 bg-sky-50/50 p-2.5 rounded-lg border border-sky-200">
                <div className="font-bold text-[11px] text-sky-800 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-sky-200">
                  <span className="w-0.5 h-2.5 bg-sky-600 rounded-full inline-block" />
                  Vertical Stabilizer
                </div>

                {/* Vertical Height */}
                <PropertyRow
                  label="Fin Height"
                  value={activeTail.verticalHeight}
                  min={0.5}
                  max={25.0}
                  step={0.2}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  accentClass="accent-sky-600"
                  onChange={(val) => updateTail(activeTail.id, { verticalHeight: val })}
                />

                {/* Vertical Root Chord */}
                <PropertyRow
                  label="Root Chord"
                  value={activeTail.verticalChord}
                  min={0.1}
                  max={15.0}
                  step={0.1}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  accentClass="accent-sky-600"
                  onChange={(val) => updateTail(activeTail.id, { verticalChord: val })}
                />

                {/* Vertical Tip Chord */}
                <PropertyRow
                  label="Tip Chord"
                  value={activeTail.verticalTipChord ?? activeTail.verticalChord * 0.6}
                  min={0.05}
                  max={10.0}
                  step={0.05}
                  unitLabel={unitLabel}
                  unitFactor={unitFactor}
                  accentClass="accent-sky-600"
                  onChange={(val) => updateTail(activeTail.id, { verticalTipChord: val })}
                />

                {/* Vertical Sweep */}
                <PropertyRow
                  label="Sweep (deg)"
                  value={activeTail.verticalSweep ?? activeTail.sweep + 5}
                  min={0}
                  max={80}
                  step={1}
                  accentClass="accent-sky-600"
                  onChange={(val) => updateTail(activeTail.id, { verticalSweep: val })}
                />
              </div>
            )}

            {/* Tail Position X Offset */}
            <PropertyRow
              label="Tail Position X"
              value={activeTail.position[0]}
              min={-20.0}
              max={100.0}
              step={0.5}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-amber-600"
              onChange={(val) =>
                updateTail(activeTail.id, {
                  position: [val, activeTail.position[1], activeTail.position[2]],
                })
              }
            />

            {/* Tail Position Z (Vertical) Offset */}
            <PropertyRow
              label="Tail Position Z"
              value={activeTail.position[2]}
              min={-10.0}
              max={15.0}
              step={0.1}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-amber-600"
              onChange={(val) =>
                updateTail(activeTail.id, {
                  position: [activeTail.position[0], activeTail.position[1], val],
                })
              }
            />

            {/* Color */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5"><Paintbrush className="w-3.5 h-3.5" /> Component Color</span>
              <input
                type="color"
                value={activeTail.color}
                onChange={(e) => updateTail(activeTail.id, { color: e.target.value })}
                className="w-8 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}

        {/* 5. ENGINE NACELLE PARAMETERS */}
        {activeEngine && (
          <div className="space-y-3">
            <div className="font-semibold text-purple-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Box className="w-4 h-4" /> Engine Nacelle ({activeEngine.name})
            </div>

            {/* Engine Type */}
            <div className="space-y-1">
              <label className="text-slate-600 font-medium block">Engine Type</label>
              <select
                value={activeEngine.type}
                onChange={(e) => updateEngine(activeEngine.id, { type: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono"
              >
                <option value="turbofan">Turbofan (Commercial Nacelle)</option>
                <option value="turbojet">Turbojet (Afterburning Jet)</option>
                <option value="propeller">Helical Propeller Turboprop</option>
                <option value="edf">Electric Ducted Fan (EDF)</option>
              </select>
            </div>

            {/* Engine Mounting Configuration (Wing Attachment vs Fuselage) */}
            {model.wings.length > 0 && (
              <div className="space-y-2 bg-purple-50/60 p-2.5 rounded-lg border border-purple-200">
                <label className="text-purple-900 font-bold text-[11px] uppercase tracking-wider block flex items-center justify-between">
                  <span>Wing Attachment</span>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-300">
                    {activeEngine.attachToWing !== false ? 'ATTACHED TO WING' : 'FUSELAGE'}
                  </span>
                </label>

                {/* Parent Wing Selector (if multiple wings) */}
                {model.wings.length > 1 && (
                  <div className="space-y-1 pt-1">
                    <label className="text-slate-600 text-[10px] font-medium block">Parent Wing Assembly</label>
                    <select
                      value={activeEngine.parentWingId || model.wings[0].id}
                      onChange={(e) => updateEngine(activeEngine.id, { parentWingId: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-[11px] text-slate-800"
                    >
                      {model.wings.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const firstWing = model.wings[0];
                      const currentY = activeEngine.position[1] !== 0 ? activeEngine.position[1] : (firstWing.span / 2) * 0.35;
                      updateEngine(activeEngine.id, {
                        attachToWing: true,
                        position: [activeEngine.position[0], currentY, activeEngine.position[2]],
                      });
                    }}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 text-center ${
                      activeEngine.attachToWing !== false
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500'
                        : 'bg-white text-slate-700 hover:bg-purple-100/50 border border-slate-200'
                    }`}
                  >
                    <span>✈️ Attached to Wing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateEngine(activeEngine.id, {
                        attachToWing: false,
                        position: [activeEngine.position[0], 0, 0],
                      });
                    }}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 text-center ${
                      activeEngine.attachToWing === false
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500'
                        : 'bg-white text-slate-700 hover:bg-purple-100/50 border border-slate-200'
                    }`}
                  >
                    <span>🚀 Fuselage Free</span>
                  </button>
                </div>

                {/* Stance: Underwing vs Overwing */}
                {activeEngine.attachToWing !== false && (
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => updateEngine(activeEngine.id, { mountStyle: 'underwing' })}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                        (activeEngine.mountStyle || 'underwing') === 'underwing'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Under-Wing Pylon
                    </button>
                    <button
                      type="button"
                      onClick={() => updateEngine(activeEngine.id, { mountStyle: 'overwing' })}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                        activeEngine.mountStyle === 'overwing'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Over-Wing Mount
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Diameter */}
            <PropertyRow
              label="Inlet Diameter"
              value={activeEngine.diameter}
              min={0.2}
              max={10.0}
              step={0.05}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-purple-600"
              onChange={(val) => updateEngine(activeEngine.id, { diameter: val })}
            />

            {/* Length */}
            <PropertyRow
              label="Nacelle Length"
              value={activeEngine.length}
              min={0.5}
              max={20.0}
              step={0.1}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-purple-600"
              onChange={(val) => updateEngine(activeEngine.id, { length: val })}
            />

            {/* Position X (Longitudinal Offset) */}
            <PropertyRow
              label="Position X (Longitudinal)"
              value={activeEngine.position[0]}
              min={-30.0}
              max={100.0}
              step={0.2}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-purple-600"
              onChange={(val) =>
                updateEngine(activeEngine.id, {
                  position: [val, activeEngine.position[1], activeEngine.position[2]],
                })
              }
            />

            {/* Position Y (Lateral / Spanwise Offset) */}
            <PropertyRow
              label="Lateral Span Offset (Y)"
              value={activeEngine.position[1]}
              min={-30.0}
              max={30.0}
              step={0.1}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-purple-600"
              onChange={(val) =>
                updateEngine(activeEngine.id, {
                  position: [activeEngine.position[0], val, activeEngine.position[2]],
                })
              }
            />

            {/* Pylon Height / Clearance */}
            <PropertyRow
              label="Pylon Height / Clearance"
              value={activeEngine.pylonHeight}
              min={0.05}
              max={5.0}
              step={0.05}
              unitLabel={unitLabel}
              unitFactor={unitFactor}
              accentClass="accent-purple-600"
              onChange={(val) => updateEngine(activeEngine.id, { pylonHeight: val })}
            />

            {/* Position Z (Height) - only show when NOT attached to wing */}
            {activeEngine.attachToWing === false ? (
              <PropertyRow
                label="Vertical Offset Z"
                value={activeEngine.position[2]}
                min={-15.0}
                max={15.0}
                step={0.1}
                unitLabel={unitLabel}
                unitFactor={unitFactor}
                accentClass="accent-purple-600"
                onChange={(val) =>
                  updateEngine(activeEngine.id, {
                    position: [activeEngine.position[0], activeEngine.position[1], val],
                  })
                }
              />
            ) : null}

            {/* Color */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5"><Paintbrush className="w-3.5 h-3.5" /> Component Color</span>
              <input
                type="color"
                value={activeEngine.color}
                onChange={(e) => updateEngine(activeEngine.id, { color: e.target.value })}
                className="w-8 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Empty fallback */}
        {!activeFuselage && !activeSection && !activeWing && !activeTail && !activeEngine && (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Sliders className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
            <p>Select a component in the Scene Tree or Viewport to edit parameters.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
