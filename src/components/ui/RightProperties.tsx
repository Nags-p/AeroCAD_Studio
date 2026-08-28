'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Sliders, Paintbrush, Wind, Box, Settings, CircleDot, Move, HelpCircle, Maximize2, X, Plus } from 'lucide-react';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';
import { BUILTIN_AIRFOILS } from '@/engine/math/naca';
import { SectionShapeType, FuselageSection } from '@/types/aircraft';
import { generateSectionPoints } from '@/engine/math/superellipse';
import { MATERIALS_LIBRARY } from '@/engine/data/materials';

const PARAMETER_TOOLTIPS: Record<string, string> = {
  // Fuselage Parameters
  "Total Length": "Total length of the fuselage from nose tip to tail tip. Directly scales the aircraft cabin volume and structural weight.",
  "Nose Roundness (S)": "Determines the sharpness or bluntness of the cockpit profile. Higher values create a more rounded, bulbous nose.",
  "Nose Apex Z Shift": "Shifts the nose tip vertically. Positive values raise the nose cockpit profile, negative values droop it.",
  "Nose Apex Y Shift": "Shifts the nose tip laterally (left or right) relative to the aircraft centerline.",
  "Tail Tip Z Shift": "Shifts the tail cone tip vertically. Positive values upsweep the tail cone for runway ground clearance.",
  "Tail Tip Y Shift": "Shifts the tail cone tip laterally relative to the aircraft centerline.",
  "Scale X (Width)": "Width scaling factor of the fuselage geometry.",
  "Scale Y (Height)": "Height scaling factor of the fuselage geometry.",

  // Section Parameters
  "Diameter": "Diameter of the circular cross-section at this fuselage station.",
  "Width": "Maximum width (lateral scale) of the fuselage section at this station.",
  "Height": "Maximum height (vertical scale) of the fuselage section at this station.",
  "Exponent N (Height Power)": "Superellipse height exponent. Exponents greater than 2 flatten the top and bottom, creating a boxier cargo area.",
  "Exponent M (Width Power)": "Superellipse width exponent. Exponents greater than 2 flatten the side walls to maximize cabin cabin width.",
  "Corner Fillet Radius": "Rounds the corners of a rectangular cross-section. 0 is a sharp rectangle, 1 is fully rounded.",
  "Fuselage Width": "Maximum width of this station.",
  "Upper Deck Height": "Height of the upper half of the double-deck fuselage section.",
  "Lower Cargo Height": "Height of the lower cargo compartment half of the double-deck fuselage section.",

  // Wing Parameters
  "Wingspan": "The total tip-to-tip span of the wings. Higher span increases aspect ratio, which reduces induced drag and improves gliding efficiency.",
  "Root Chord": "The width of the wing section at the root (where it meets the fuselage). Larger root chord increases wing area and root strength.",
  "Tip Chord": "The width of the wing section at the wingtips. Tapering the tip chord reduces wingtip weight and structural bending moment.",
  "Sweep Angle (deg)": "The backward slant angle of the wing. High sweep delays wave drag onset in transonic/supersonic flight, but worsens low-speed lift.",
  "Dihedral Angle (deg)": "The upward angle of the wings from root to tip. Positive dihedral provides lateral roll stability (inherent self-righting behavior).",
  "Anhedral Angle (deg)": "The downward tilt of the wings. Commonly used on high-wing cargo planes to decrease excessive roll stability and improve maneuverability.",
  "Taper Ratio": "Ratio of the tip chord to the root chord. A lower taper ratio reduces wing structural weight but increases tip stall risk.",
  "Aspect Ratio": "Ratio of wingspan to mean chord. High aspect ratio wings (like gliders) minimize induced drag, while low aspect ratio wings are structurally stronger.",
  "Incidence / Twist (deg)": "The angle difference between root and tip chord. Washout (negative twist) ensures the root stalls before the tip, preserving roll control.",
  "X Location (Aft)": "Longitudinal position of the wing attachment point along the fuselage. Critical for balancing the Center of Gravity.",
  "Z Location (Height)": "Vertical position of the wing attachment point.",
  "Y Location (Lateral)": "Lateral displacement of the wing attachment point from the centerline.",

  // Engine Parameters
  "Engine Nacelle Length": "Length of the engine housing structure.",
  "Engine Nacelle Diameter": "Maximum outer diameter of the engine nacelle, which scale propulsion weight.",
  "Thrust per Engine (kN)": "Maximum static sea-level thrust output of the engine. Governs acceleration and climb performance.",
  "Bypass Ratio (BPR)": "Ratio of bypass airflow to core airflow. High bypass ratio turbofans are highly fuel-efficient but limited in top speed.",
  "Specific Fuel Consumption (SFC)": "Rate of fuel burn per unit thrust. Lower values improve range and endurance.",
  "Propeller Diameter": "Diameter of the prop blades. Larger diameters sweep more air, improving efficiency but increasing blade tip speed.",
  "Propeller Blades": "Number of blades. More blades absorb higher engine horsepower without increasing diameter.",

  // General CAD
  "X Location": "Position along the longitudinal axis (nose to tail).",
  "Y Location": "Position along the lateral axis (left to right).",
  "Z Location": "Position along the vertical axis (bottom to top).",
  "Roll Angle (deg)": "Rotation angle about the longitudinal axis.",
  "Pitch Angle (deg)": "Rotation angle about the lateral axis.",
  "Yaw Angle (deg)": "Rotation angle about the vertical axis.",
};

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
  const tooltip = PARAMETER_TOOLTIPS[label];

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-slate-600 font-medium">
        <span className="flex items-center gap-1.5 group relative cursor-help select-none">
          <span>{label} {unitLabel ? `(${unitLabel})` : ''}</span>
          {tooltip && (
            <>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-sky-600 transition-colors" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-52 bg-slate-950/95 border border-slate-700/80 text-white text-[10px] p-2.5 rounded-lg shadow-2xl leading-normal z-50 font-sans normal-case tracking-normal font-normal">
                {tooltip}
              </div>
            </>
          )}
        </span>
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

interface SideProfileSketchCanvasProps {
  fuselage: any;
  onChangeSection: (id: string, params: any) => void;
  onChangeFuselage: (params: any) => void;
}

interface CanvasPoint {
  id: string;
  x: number;
  y: number;
  top: number;
  bot: number;
}

function SideProfileSketchCanvas({
  fuselage,
  onChangeSection,
  onChangeFuselage,
}: SideProfileSketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeView, setActiveView] = useState<'side' | 'top'>('side');
  const [syncDimensions, setSyncDimensions] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<{ type: 'center' | 'top' | 'nose' | 'tail' | 'tail-top'; secId: string } | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  const selectedId = useAircraftStore((state) => state.selectedId);
  const selectedType = useAircraftStore((state) => state.selectedType);
  const setSelected = useAircraftStore((state) => state.setSelected);

  const snap = (val: number, step: number): number => {
    return Math.round(val / step) * step;
  };

  const resolved = useMemo((): FuselageSection[] => {
    return [...fuselage.sections].sort((a: FuselageSection, b: FuselageSection) => a.xPos - b.xPos);
  }, [fuselage.sections]);

  const handleAddSection = () => {
    if (resolved.length < 2) return;
    
    // Find the largest gap between adjacent stations
    let maxGap = 0;
    let insertIndex = 0;
    for (let i = 0; i < resolved.length - 1; i++) {
      const gap = resolved[i+1].xPos - resolved[i].xPos;
      if (gap > maxGap) {
        maxGap = gap;
        insertIndex = i;
      }
    }

    const sA = resolved[insertIndex];
    const sB = resolved[insertIndex + 1];
    const newX = parseFloat(((sA.xPos + sB.xPos) / 2).toFixed(3));
    
    // Interpolate dimensions and offsets
    const newWidth = parseFloat(((sA.width + sB.width) / 2).toFixed(2));
    const newHeight = parseFloat(((sA.height + sB.height) / 2).toFixed(2));
    const newZ = parseFloat(((sA.zOffset + sB.zOffset) / 2).toFixed(2));
    const newY = parseFloat(((sA.yOffset + sB.yOffset) / 2).toFixed(2));

    const newSec: FuselageSection = {
      id: `sec-${Date.now()}`,
      name: `Cabin Station ${fuselage.sections.length + 1}`,
      xPos: newX,
      width: newWidth,
      height: newHeight,
      shapeType: sA.shapeType,
      nExp: sA.nExp || 2.0,
      mExp: sA.mExp || sA.nExp || 2.0,
      cornerRadius: sA.cornerRadius || 0.3,
      zOffset: newZ,
      yOffset: newY
    };

    const newSections = [...fuselage.sections, newSec];
    onChangeFuselage({ sections: newSections });
    
    // Select the new section
    setTimeout(() => {
      setSelected(newSec.id, 'section');
    }, 50);
  };

  const handleDeleteSelected = () => {
    if (resolved.length <= 2) return; // Keep at least cockpit and tail cone
    if (selectedType !== 'section' || !selectedId) return;

    const updatedSections = fuselage.sections.filter((s: FuselageSection) => s.id !== selectedId);
    onChangeFuselage({ sections: updatedSections });
    setSelected(null, null);
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const W = isExpanded ? 840 : 270;
  const H = isExpanded ? 460 : 160;
  const padX = isExpanded ? 40 : 25;
  const padY = isExpanded ? 30 : 25;
  const pw = W - 2 * padX;
  const ph = H - 2 * padY;
  const cy = H / 2;
  const scaleZ = isExpanded ? 63 : 22;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    
    // Premium dark-mode CAD background
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;

    // Subtle CAD vertical grid lines at 10% increments (length alignment)
    for (let pct = 1; pct <= 9; pct++) {
      const t = pct / 10;
      const x = padX + t * pw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      if (pct === 5) {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)'; // Prominent 50% line
        ctx.lineWidth = 1.2;
      } else {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
        ctx.lineWidth = 0.8;
      }
      ctx.stroke();
    }
    
    // Subtle CAD horizontal grid lines at physical offsets (-2m, -1m, 1m, 2m)
    for (let dy = -2; dy <= 2; dy++) {
      if (dy === 0) continue; // reference centerline is drawn separately
      const y = cy - dy * scaleZ;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Reference centerline axis
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, cy);
    ctx.lineTo(W - padX, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    if (resolved.length < 2) {
      ctx.restore();
      return;
    }

    const noseZ = fuselage.noseZ || 0.0;
    const noseY = fuselage.noseY || 0.0;
    const tailZ = fuselage.tailZ || 0.0;
    const tailY = fuselage.tailY || 0.0;
    const S = fuselage.noseRoundness !== undefined ? fuselage.noseRoundness : 0.75;
    const tailScale = fuselage.tail !== undefined ? fuselage.tail : 0.3;

    const s0 = resolved[0];
    const s1 = resolved.find((s: FuselageSection) => s.xPos > 0) || resolved[1] || s0;
    const sLast = resolved[resolved.length - 1];

    const t1 = Math.max(0.02, s1.xPos);
    const tEnd = sLast.xPos;

    // High-resolution math profile evaluator
    const getProfileAt = (t: number) => {
      let rx = 0;
      let ry = 0;

      // 1. Radius interpolation matching generator math exactly
      if (t <= t1) {
        const ratio = Math.max(0, Math.min(1.0, t / t1));
        let blend = 0;
        if (S <= 1.0) {
          const domeCurve = Math.sqrt(ratio * (2.0 - ratio));
          blend = S * domeCurve + (1.0 - S) * ratio;
        } else {
          blend = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(1.0 - ratio, 1.0 + S)));
        }
        rx = (s1.width / 2) * blend;
        ry = (s1.height / 2) * blend;
      } else if (t >= tEnd && tEnd < 0.99) {
        const denom = 1.0 - tEnd;
        const ratio = Math.max(0, Math.min(1.0, (t - tEnd) / denom));
        const blend = ratio * ratio * (3.0 - 2.0 * ratio);
        const scaleFactor = 1.0 - (1.0 - tailScale) * blend;
        rx = (sLast.width / 2) * scaleFactor;
        ry = (sLast.height / 2) * scaleFactor;
      } else {
        let idx = 0;
        for (let i = 0; i < resolved.length - 1; i++) {
          if (t >= resolved[i].xPos && t <= resolved[i + 1].xPos) {
            idx = i;
            break;
          }
        }
        const sA = resolved[idx];
        const sB = resolved[idx + 1];
        const denom = sB.xPos - sA.xPos;
        const ratio = denom > 0.001 ? Math.max(0, Math.min(1.0, (t - sA.xPos) / denom)) : 0.0;
        const blend = ratio * ratio * (3.0 - 2.0 * ratio);

        rx = (sA.width / 2) * (1.0 - blend) + (sB.width / 2) * blend;
        ry = (sA.height / 2) * (1.0 - blend) + (sB.height / 2) * blend;
      }

      rx = Math.max(0.0001, rx);
      ry = Math.max(0.0001, ry);

      // 2. Spatial shift interpolation
      let offsetZ = 0;
      let offsetY = 0;

      if (t <= t1) {
        const ratio = Math.max(0, Math.min(1.0, t / t1));
        let blend = 0;
        if (S <= 1.0) {
          const domeCurve = Math.sqrt(ratio * (2.0 - ratio));
          blend = S * domeCurve + (1.0 - S) * ratio;
        } else {
          blend = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(1.0 - ratio, 1.0 + S)));
        }
        offsetZ = noseZ + (s1.zOffset - noseZ) * blend;
        offsetY = noseY + (s1.yOffset - noseY) * blend;
      } else if (t >= tEnd) {
        const tailDenom = 1.0 - tEnd;
        if (tailDenom > 0.01) {
          const ratio = Math.max(0, Math.min(1.0, (t - tEnd) / tailDenom));
          const blend = ratio * ratio * (3.0 - 2.0 * ratio);
          offsetZ = sLast.zOffset + (tailZ - sLast.zOffset) * blend;
          offsetY = sLast.yOffset + (tailY - sLast.yOffset) * blend;
        } else {
          offsetZ = sLast.zOffset;
          offsetY = sLast.yOffset;
        }
      } else {
        let idx = 0;
        for (let i = 0; i < resolved.length - 1; i++) {
          if (t >= resolved[i].xPos && t <= resolved[i + 1].xPos) {
            idx = i;
            break;
          }
        }
        const sA = resolved[idx];
        const sB = resolved[idx + 1];
        const denom = sB.xPos - sA.xPos;
        const ratio = denom > 0.001 ? Math.max(0, Math.min(1.0, (t - sA.xPos) / denom)) : 0.0;
        const blend = ratio * ratio * (3.0 - 2.0 * ratio);
        offsetZ = sA.zOffset * (1.0 - blend) + sB.zOffset * blend;
        offsetY = sA.yOffset * (1.0 - blend) + sB.yOffset * blend;
      }

      return { rx, ry, offsetZ, offsetY };
    };

    // Evaluate 150 points along length for high-resolution spline drawing
    const curvePointsCount = 150;
    const topPathPoints: { x: number; y: number }[] = [];
    const botPathPoints: { x: number; y: number }[] = [];
    const centerPathPoints: { x: number; y: number }[] = [];

    for (let k = 0; k <= curvePointsCount; k++) {
      const t = k / curvePointsCount;
      const x_pt = padX + t * pw;
      const profile = getProfileAt(t);

      const offsetVal = activeView === 'side' ? profile.offsetZ : profile.offsetY;
      const dimVal = activeView === 'side' ? profile.ry : profile.rx;

      const cy_pt = cy - offsetVal * scaleZ;
      const top_pt = cy - (offsetVal + dimVal) * scaleZ;
      const bot_pt = cy - (offsetVal - dimVal) * scaleZ;

      topPathPoints.push({ x: x_pt, y: top_pt });
      botPathPoints.push({ x: x_pt, y: bot_pt });
      centerPathPoints.push({ x: x_pt, y: cy_pt });
    }

    // Render filled body silhouette (semi-transparent glow)
    ctx.fillStyle = activeView === 'side' ? 'rgba(56, 189, 248, 0.06)' : 'rgba(52, 211, 153, 0.06)';
    ctx.beginPath();
    ctx.moveTo(topPathPoints[0].x, topPathPoints[0].y);
    for (let i = 1; i < topPathPoints.length; i++) ctx.lineTo(topPathPoints[i].x, topPathPoints[i].y);
    for (let i = botPathPoints.length - 1; i >= 0; i--) ctx.lineTo(botPathPoints[i].x, botPathPoints[i].y);
    ctx.closePath();
    ctx.fill();

    // Draw Top/Left glowing profile curve
    ctx.strokeStyle = activeView === 'side' ? '#38BDF8' : '#34D399';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(topPathPoints[0].x, topPathPoints[0].y);
    for (let i = 1; i < topPathPoints.length; i++) ctx.lineTo(topPathPoints[i].x, topPathPoints[i].y);
    ctx.stroke();

    // Draw Bottom/Right glowing profile curve
    ctx.beginPath();
    ctx.moveTo(botPathPoints[0].x, botPathPoints[0].y);
    for (let i = 1; i < botPathPoints.length; i++) ctx.lineTo(botPathPoints[i].x, botPathPoints[i].y);
    ctx.stroke();

    // Draw Centerline spline
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerPathPoints[0].x, centerPathPoints[0].y);
    for (let i = 1; i < centerPathPoints.length; i++) ctx.lineTo(centerPathPoints[i].x, centerPathPoints[i].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Coordinates of stations for handles and bulkheads
    const pts = resolved.map((sec: FuselageSection): CanvasPoint => {
      const cx_pt = padX + sec.xPos * pw;
      const offsetVal = activeView === 'side' ? sec.zOffset : sec.yOffset;
      const dimensionVal = activeView === 'side' ? sec.height : sec.width;
      
      const cy_pt = cy - offsetVal * scaleZ;
      const top_pt = cy - (offsetVal + dimensionVal / 2) * scaleZ;
      const bot_pt = cy - (offsetVal - dimensionVal / 2) * scaleZ;
      return { id: sec.id, x: cx_pt, y: cy_pt, top: top_pt, bot: bot_pt };
    });

    // Draw station structural bulkheads
    pts.forEach((pt: CanvasPoint) => {
      const isSelected = selectedType === 'section' && selectedId === pt.id;
      ctx.strokeStyle = isSelected ? 'rgba(34, 211, 238, 0.7)' : 'rgba(226, 232, 240, 0.15)';
      ctx.lineWidth = isSelected ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.top);
      ctx.lineTo(pt.x, pt.bot);
      ctx.stroke();
    });

    // Draw structural station handles
    pts.forEach((pt: CanvasPoint) => {
      const isSelected = selectedType === 'section' && selectedId === pt.id;

      // Center handle (Centerline droop/offset and placement)
      ctx.fillStyle = '#22D3EE';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Outer selection ring for center handle
      if (isSelected) {
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Top handle (Height/Width control) - Only render if not the nose tip station (xPos > 0.01)
      const secObj = resolved.find((s: FuselageSection) => s.id === pt.id);
      if (secObj && secObj.xPos > 0.01) {
        ctx.fillStyle = '#FB923C';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.top, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Outer selection ring for top handle
        if (isSelected) {
          ctx.strokeStyle = '#FB923C';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.top, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    // Draw single point handle at nose apex (x = 0)
    const noseOffset = activeView === 'side' ? (fuselage.noseZ || 0) : (fuselage.noseY || 0);
    const noseY_pt = cy - noseOffset * scaleZ;
    ctx.fillStyle = '#22D3EE';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(padX, noseY_pt, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw single point handle at tail tip apex (x = W - padX) - Only render if the last station is not already at the end
    if (tEnd < 0.99) {
      const tailOffset = activeView === 'side' ? (fuselage.tailZ || 0) : (fuselage.tailY || 0);
      const tailY_pt = cy - tailOffset * scaleZ;
      ctx.fillStyle = '#22D3EE';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(W - padX, tailY_pt, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tail tip orange handle (Tail scale)
      const tailScale = fuselage.tail || 0.3;
      const sLast = resolved[resolved.length - 1];
      const tailDim = activeView === 'side' ? sLast.height : sLast.width;
      const tailTop_pt = tailY_pt - (tailDim / 2) * tailScale * scaleZ;

      ctx.fillStyle = '#FB923C';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(W - padX, tailTop_pt, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }, [fuselage, resolved, activeView, isExpanded]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const tEnd = resolved.length > 0 ? resolved[resolved.length - 1].xPos : 1.0;

    // Nose apex check
    const noseOffset = activeView === 'side' ? (fuselage.noseZ || 0) : (fuselage.noseY || 0);
    const noseY_pt = cy - noseOffset * scaleZ;
    if (Math.hypot(mx - padX, my - noseY_pt) < 10) {
      setIsDragging({ type: 'nose', secId: 'nose-apex' });
      return;
    }

    // Tail tip check - Only check if not already handled by a station at the end
    if (tEnd < 0.99) {
      const tailOffset = activeView === 'side' ? (fuselage.tailZ || 0) : (fuselage.tailY || 0);
      const tailY_pt = cy - tailOffset * scaleZ;
      if (Math.hypot(mx - (W - padX), my - tailY_pt) < 10) {
        setIsDragging({ type: 'tail', secId: 'tail-apex' });
        return;
      }

      // Tail tip top handle (Tail scale)
      const tailScale = fuselage.tail || 0.3;
      const sLast = resolved[resolved.length - 1];
      const tailDim = activeView === 'side' ? sLast.height : sLast.width;
      const tailTop_pt = tailY_pt - (tailDim / 2) * tailScale * scaleZ;
      if (Math.hypot(mx - (W - padX), my - tailTop_pt) < 10) {
        setIsDragging({ type: 'tail-top', secId: 'tail-apex-top' });
        return;
      }
    }

    for (const sec of resolved) {
      const cx_pt = padX + sec.xPos * pw;
      const offsetVal = activeView === 'side' ? sec.zOffset : sec.yOffset;
      const dimensionVal = activeView === 'side' ? sec.height : sec.width;
      
      const cy_pt = cy - offsetVal * scaleZ;
      const top_pt = cy - (offsetVal + dimensionVal / 2) * scaleZ;

      if (Math.hypot(mx - cx_pt, my - cy_pt) < 10) {
        setSelected(sec.id, 'section');
        setIsDragging({ type: 'center', secId: sec.id });
        return;
      }

      if (sec.xPos > 0.01 && Math.hypot(mx - cx_pt, my - top_pt) < 10) {
        setSelected(sec.id, 'section');
        setIsDragging({ type: 'top', secId: sec.id });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const tEnd = resolved.length > 0 ? resolved[resolved.length - 1].xPos : 1.0;

    if (isDragging) {
      let valOffset = (cy - my) / scaleZ;
      if (snapToGrid) {
        if (Math.abs(valOffset) < 0.08) {
          valOffset = 0.0;
        } else {
          valOffset = snap(valOffset, 0.05);
        }
      }

      if (isDragging.type === 'nose') {
        if (activeView === 'side') {
          onChangeFuselage({ noseZ: parseFloat(valOffset.toFixed(2)) });
        } else {
          onChangeFuselage({ noseY: parseFloat(valOffset.toFixed(2)) });
        }
        return;
      }

      if (isDragging.type === 'tail') {
        if (activeView === 'side') {
          onChangeFuselage({ tailZ: parseFloat(valOffset.toFixed(2)) });
        } else {
          onChangeFuselage({ tailY: parseFloat(valOffset.toFixed(2)) });
        }
        return;
      }

      if (isDragging.type === 'tail-top') {
        const tailOffset = activeView === 'side' ? (fuselage.tailZ || 0) : (fuselage.tailY || 0);
        let targetTopVal = (cy - my) / scaleZ;
        if (snapToGrid) {
          targetTopVal = snap(targetTopVal, 0.05);
        }
        const newRadius = targetTopVal - tailOffset;
        const sLast = resolved[resolved.length - 1];
        const tailDim = activeView === 'side' ? sLast.height : sLast.width;
        const targetRadius = Math.max(0.1, tailDim / 2);
        
        const newTailScale = Math.max(0.01, Math.min(2.0, newRadius / targetRadius));
        onChangeFuselage({ tail: parseFloat(newTailScale.toFixed(3)) });
        return;
      }

      const sec = resolved.find((s: FuselageSection) => s.id === isDragging.secId);
      if (!sec) return;

      let newXPos = Math.max(0.0, Math.min(1.0, (mx - padX) / pw));
      if (snapToGrid) {
        newXPos = snap(newXPos, 0.05);
      }

      if (isDragging.type === 'center') {
        const isBoundary = sec.xPos < 0.001 || sec.xPos > 0.999;
        if (activeView === 'side') {
          onChangeSection(sec.id, {
            xPos: isBoundary ? sec.xPos : parseFloat(newXPos.toFixed(3)),
            zOffset: parseFloat(valOffset.toFixed(2)),
          });
        } else {
          onChangeSection(sec.id, {
            xPos: isBoundary ? sec.xPos : parseFloat(newXPos.toFixed(3)),
            yOffset: parseFloat(valOffset.toFixed(2)),
          });
        }
      } else if (isDragging.type === 'top') {
        const secOffset = activeView === 'side' ? sec.zOffset : sec.yOffset;
        let targetTopVal = (cy - my) / scaleZ;
        if (snapToGrid) {
          targetTopVal = snap(targetTopVal, 0.05); // snap top outline position directly to grid lines
        }
        const newRadius = targetTopVal - secOffset;
        let newDim = Math.max(0.1, newRadius * 2);
        
        if (syncDimensions) {
          onChangeSection(sec.id, {
            height: parseFloat(newDim.toFixed(2)),
            width: parseFloat(newDim.toFixed(2)),
          });
        } else {
          if (activeView === 'side') {
            onChangeSection(sec.id, { height: parseFloat(newDim.toFixed(2)) });
          } else {
            onChangeSection(sec.id, { width: parseFloat(newDim.toFixed(2)) });
          }
        }
      }
      return;
    }

    let found = false;

    // Nose check
    const noseOffset = activeView === 'side' ? (fuselage.noseZ || 0) : (fuselage.noseY || 0);
    const noseY_pt = cy - noseOffset * scaleZ;
    if (Math.hypot(mx - padX, my - noseY_pt) < 10) {
      setCursorStyle('move');
      found = true;
    }

    // Tail check
    if (tEnd < 0.99) {
      const tailOffset = activeView === 'side' ? (fuselage.tailZ || 0) : (fuselage.tailY || 0);
      const tailY_pt = cy - tailOffset * scaleZ;
      if (!found && Math.hypot(mx - (W - padX), my - tailY_pt) < 10) {
        setCursorStyle('move');
        found = true;
      }

      // Tail tip top handle check (Tail scale)
      const tailScale = fuselage.tail || 0.3;
      const sLast = resolved[resolved.length - 1];
      const tailDim = activeView === 'side' ? sLast.height : sLast.width;
      const tailTop_pt = tailY_pt - (tailDim / 2) * tailScale * scaleZ;
      if (!found && Math.hypot(mx - (W - padX), my - tailTop_pt) < 10) {
        setCursorStyle('ns-resize');
        found = true;
      }
    }

    if (!found) {
      for (const sec of resolved) {
        const cx_pt = padX + sec.xPos * pw;
        const offsetVal = activeView === 'side' ? sec.zOffset : sec.yOffset;
        const dimensionVal = activeView === 'side' ? sec.height : sec.width;
        
        const cy_pt = cy - offsetVal * scaleZ;
        const top_pt = cy - (offsetVal + dimensionVal / 2) * scaleZ;

        if (Math.hypot(mx - cx_pt, my - cy_pt) < 10) {
          setCursorStyle('move');
          found = true;
          break;
        }
        if (sec.xPos > 0.01 && Math.hypot(mx - cx_pt, my - top_pt) < 10) {
          setCursorStyle('ns-resize');
          found = true;
          break;
        }
      }
    }
    if (!found) setCursorStyle('default');
  };

  const handleMouseUp = () => setIsDragging(null);

  return (
    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex flex-col items-center space-y-2 my-2.5 shadow-md">
      <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Move className="w-3.5 h-3.5 text-sky-500" /> Longitudinal Splines
        </span>
        {!isExpanded ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              title="Expand Editor"
              className="p-1 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-900 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
              <button
                onClick={() => setActiveView('side')}
                className={`px-2 py-0.5 rounded text-[9px] transition-all duration-150 ${activeView === 'side' ? 'bg-sky-550/20 text-sky-400 border border-sky-500/30 font-extrabold shadow-inner' : 'text-slate-500 font-medium hover:text-slate-300'}`}
              >
                Side (Z)
              </button>
              <button
                onClick={() => setActiveView('top')}
                className={`px-2 py-0.5 rounded text-[9px] transition-all duration-150 ${activeView === 'top' ? 'bg-emerald-550/20 text-emerald-400 border border-emerald-500/30 font-extrabold shadow-inner' : 'text-slate-500 font-medium hover:text-slate-300'}`}
              >
                Top (Y)
              </button>
            </div>
          </div>
        ) : (
          <span className="text-[9px] text-sky-400 animate-pulse font-bold tracking-normal font-sans">Expanded Editor Open</span>
        )}
      </div>

      {!isExpanded ? (
        <canvas
          ref={canvasRef}
          style={{ width: `${W}px`, height: `${H}px`, cursor: cursorStyle }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="rounded bg-[#0B0F19] border border-slate-850 shadow-inner"
        />
      ) : (
        <div
          onClick={() => setIsExpanded(true)}
          className="rounded bg-[#0B0F19] border border-slate-850 w-[270px] h-[160px] flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-slate-900/50 transition-all duration-150 group shadow-inner"
        >
          <Maximize2 className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform duration-150 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-mono font-bold">Open Expanded View</span>
        </div>
      )}

      {!isExpanded && (
        <>
          <div className="text-[9px] text-slate-500 flex items-center justify-between w-full font-mono px-1 gap-2">
            <div className="flex gap-2.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span> Position
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> {activeView === 'side' ? 'Height' : 'Width'}
              </span>
            </div>
            <div className="flex gap-2.5">
              <label className="flex items-center gap-1 cursor-pointer text-slate-400 select-none hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                />
                <span>Snap</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-slate-400 select-none hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={syncDimensions}
                  onChange={(e) => setSyncDimensions(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                />
                <span>Sync W&H</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between w-full border-t border-slate-900/50 pt-2 gap-2 mt-0.5 px-0.5">
            <button
              onClick={handleAddSection}
              className="flex-1 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 rounded hover:bg-emerald-500/20 text-[9px] font-bold transition flex items-center justify-center gap-1"
            >
              <Plus className="w-2.5 h-2.5" /> Add Station
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={resolved.length <= 2 || selectedType !== 'section'}
              className="flex-1 py-1 bg-rose-500/10 text-rose-400 border border-rose-550/20 rounded hover:bg-rose-500/20 text-[9px] font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <X className="w-2.5 h-2.5" /> Delete Selected
            </button>
          </div>
        </>
      )}

      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-[880px] shadow-2xl flex flex-col space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-sky-500" />
                <span className="font-bold text-xs text-slate-200 uppercase font-mono tracking-wider">Longitudinal Profile Editor</span>
              </div>
              <div className="flex items-center gap-4">
                {/* Station Manager Buttons */}
                <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
                  <button
                    onClick={handleAddSection}
                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 rounded hover:bg-emerald-500/20 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Station
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={resolved.length <= 2 || selectedType !== 'section'}
                    className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-550/20 rounded hover:bg-rose-500/20 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                </div>

                {/* Tab switchers */}
                <div className="flex bg-slate-950 rounded p-0.5 border border-slate-850">
                  <button
                    onClick={() => setActiveView('side')}
                    className={`px-3 py-1 rounded text-xs transition-all duration-150 ${activeView === 'side' ? 'bg-sky-550/20 text-sky-400 border border-sky-550/30 font-bold shadow-inner' : 'text-slate-500 font-medium hover:text-slate-300'}`}
                  >
                    Side View (Z-Offsets & Height)
                  </button>
                  <button
                    onClick={() => setActiveView('top')}
                    className={`px-3 py-1 rounded text-xs transition-all duration-150 ${activeView === 'top' ? 'bg-emerald-550/20 text-emerald-400 border border-emerald-550/30 font-bold shadow-inner' : 'text-slate-500 font-medium hover:text-slate-300'}`}
                  >
                    Top View (Y-Offsets & Width)
                  </button>
                </div>
                {/* Close Button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Canvas */}
            <div className="flex justify-center bg-slate-950 rounded-xl p-4 border border-slate-850 shadow-inner">
              <canvas
                ref={canvasRef}
                style={{ width: `${W}px`, height: `${H}px`, cursor: cursorStyle }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="rounded bg-[#0B0F19] border border-slate-850"
              />
            </div>

            {/* Modal Footer */}
            <div className="text-[10px] text-slate-500 flex items-center justify-between w-full font-mono px-1">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span> Position & Offsets
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> {activeView === 'side' ? 'Height' : 'Width'}
                </span>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 select-none hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-xs">Snap to Grid</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 select-none hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={syncDimensions}
                    onChange={(e) => setSyncDimensions(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-xs">Sync Width/Height</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderMaterialOptions() {
  const categories = {
    metals: 'Metals',
    composites: 'Composites',
    woods: 'Woods',
    fabrics: 'Fabrics & Skins',
    specialty: 'Specialty & Canopies',
  };

  return Object.entries(categories).map(([catKey, catName]) => {
    const mats = Object.values(MATERIALS_LIBRARY).filter((m) => m.category === catKey);
    if (mats.length === 0) return null;
    return (
      <optgroup key={catKey} label={catName}>
        {mats.map((mat) => (
          <option key={mat.id} value={mat.id}>
            {mat.name} ({mat.density} kg/m³)
          </option>
        ))}
      </optgroup>
    );
  });
}
export function RightProperties() {
  const model = useAircraftStore((state) => state.model);
  const selectedId = useAircraftStore((state) => state.selectedId);
  const selectedType = useAircraftStore((state) => state.selectedType);

  const updateFuselage = useAircraftStore((state) => state.updateFuselage);
  const updateFuselageSection = useAircraftStore((state) => state.updateFuselageSection);
  const addFuselageSection = useAircraftStore((state) => state.addFuselageSection);
  const deleteFuselageSection = useAircraftStore((state) => state.deleteFuselageSection);
  const setSelected = useAircraftStore((state) => state.setSelected);
  const updateWing = useAircraftStore((state) => state.updateWing);
  const updateTail = useAircraftStore((state) => state.updateTail);
  const updateEngine = useAircraftStore((state) => state.updateEngine);

  const canUndo = useAircraftStore((state) => state.canUndo);
  const canRedo = useAircraftStore((state) => state.canRedo);
  const undo = useAircraftStore((state) => state.undo);
  const redo = useAircraftStore((state) => state.redo);

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

            {/* Tail Roundness (S) */}
            <PropertyRow
              label="Tail Roundness (S)"
              value={activeFuselage.tailRoundness !== undefined ? activeFuselage.tailRoundness : 0.75}
              min={0.0}
              max={2.0}
              step={0.05}
              onChange={(val) => updateFuselage({ tailRoundness: val })}
            />

            {/* Interactive Longitudinal Splines (Side View) Editor */}
            <SideProfileSketchCanvas
              fuselage={activeFuselage}
              onChangeSection={updateFuselageSection}
              onChangeFuselage={updateFuselage}
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

            {/* Structural Material */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5" title="Material selection updates weight, CG calculations and 3D rendering."><Sliders className="w-3.5 h-3.5 text-sky-600" /> Structural Material</span>
              <select
                value={activeFuselage.material || 'paint_glossy'}
                onChange={(e) => updateFuselage({ material: e.target.value })}
                className="bg-slate-50 border border-slate-300 rounded p-1 text-[11px] font-bold text-slate-800 w-44"
              >
                {renderMaterialOptions()}
              </select>
            </div>

            {/* FUSELAGE PROFILE PRESETS */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <span className="text-slate-600 font-bold block text-sky-700">Fuselage Design Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    updateFuselage({
                      length: 35.0,
                      noseRoundness: 0.75,
                      noseZ: -0.2,
                      tail: 0.25,
                      tailZ: 1.2,
                      sections: [
                        { id: 'sec-0', name: 'Nose Dome', xPos: 0.0, width: 0.8, height: 0.8, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-1', name: 'Cockpit Station', xPos: 0.12, width: 2.2, height: 2.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-2', name: 'Mid Cabin', xPos: 0.50, width: 2.2, height: 2.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-3', name: 'Aft Cabin', xPos: 0.75, width: 2.2, height: 2.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-4', name: 'Tail Cone', xPos: 0.95, width: 1.2, height: 1.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                      ],
                    });
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-sky-100 border border-slate-200 rounded text-center font-medium transition duration-150"
                >
                  Commercial Airliner
                </button>
                <button
                  onClick={() => {
                    updateFuselage({
                      length: 16.0,
                      noseRoundness: 0.15,
                      noseZ: 0.0,
                      tail: 0.75,
                      tailZ: 0.0,
                      sections: [
                        { id: 'sec-0', name: 'Radome Tip', xPos: 0.0, width: 0.2, height: 0.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-1', name: 'Cockpit', xPos: 0.25, width: 1.2, height: 1.4, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-2', name: 'Engine Intake', xPos: 0.50, width: 1.6, height: 1.4, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-3', name: 'Mid Fuselage', xPos: 0.75, width: 1.8, height: 1.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-4', name: 'Nozzle Exit', xPos: 1.0, width: 1.1, height: 1.1, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                      ],
                    });
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-sky-100 border border-slate-200 rounded text-center font-medium transition duration-150"
                >
                  Fighter Jet
                </button>
                <button
                  onClick={() => {
                    updateFuselage({
                      length: 7.5,
                      noseRoundness: 0.6,
                      noseZ: -0.05,
                      tail: 0.1,
                      tailZ: 0.15,
                      sections: [
                        { id: 'sec-0', name: 'Nose Tip', xPos: 0.0, width: 0.3, height: 0.3, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-1', name: 'Pilot Cockpit', xPos: 0.18, width: 0.65, height: 0.75, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-2', name: 'Fuselage Pod', xPos: 0.35, width: 0.65, height: 0.75, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-3', name: 'Tail Boom Start', xPos: 0.60, width: 0.25, height: 0.25, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-4', name: 'Boom End', xPos: 0.98, width: 0.08, height: 0.08, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                      ],
                    });
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-sky-100 border border-slate-200 rounded text-center font-medium transition duration-150"
                >
                  Glider / Sailplane
                </button>
                <button
                  onClick={() => {
                    updateFuselage({
                      length: 8.5,
                      noseRoundness: 0.6,
                      noseZ: 0.0,
                      tail: 0.2,
                      tailZ: 0.3,
                      sections: [
                        { id: 'sec-0', name: 'Spinner Tip', xPos: 0.0, width: 0.4, height: 0.4, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-1', name: 'Engine Cowl', xPos: 0.12, width: 1.1, height: 1.1, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-2', name: 'Cabin Front', xPos: 0.38, width: 1.25, height: 1.35, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-3', name: 'Cabin Aft', xPos: 0.65, width: 1.1, height: 1.2, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                        { id: 'sec-4', name: 'Tail Cone', xPos: 0.95, width: 0.45, height: 0.45, nExp: 2.0, shapeType: 'ellipse', yOffset: 0, zOffset: 0 },
                      ],
                    });
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-sky-100 border border-slate-200 rounded text-center font-medium transition duration-150"
                >
                  General Aviation
                </button>
              </div>
            </div>

            {/* FUSELAGE QUICK ALIGNMENT UTILITIES */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <span className="text-slate-600 font-bold block text-sky-700">Quick Alignment Utilities</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    updateFuselage({
                      noseY: 0,
                      tailY: 0,
                      sections: activeFuselage.sections.map((sec) => ({
                        ...sec,
                        yOffset: 0,
                        zOffset: 0,
                      })),
                    });
                  }}
                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold border border-sky-200 rounded text-center transition"
                  title="Resets all lateral (Y) and vertical (Z) station offsets to zero for perfect alignment."
                >
                  Align Centerline
                </button>
                <button
                  onClick={() => {
                    const count = activeFuselage.sections.length;
                    if (count < 2) return;
                    
                    const sorted = [...activeFuselage.sections].sort((a, b) => a.xPos - b.xPos);
                    const distributed = sorted.map((sec, idx) => ({
                      ...sec,
                      xPos: idx / (count - 1),
                    }));
                    
                    updateFuselage({ sections: distributed });
                  }}
                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold border border-sky-200 rounded text-center transition"
                  title="Resets station longitudinal position percentages to be evenly spaced along the fuselage length."
                >
                  Evenly Space Stations
                </button>
              </div>
            </div>

            {/* ACTIVE STATIONS LIST MANAGER */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-sky-700 font-bold">
                <span>Cross-Sections Manager ({activeFuselage.sections.length})</span>
                <button
                  onClick={() => {
                    addFuselageSection();
                  }}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px]"
                >
                  + Add Station
                </button>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50 max-h-[180px] overflow-y-auto">
                <table className="w-full text-[10px] text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 text-left font-mono">
                      <th className="px-2 py-1 font-bold">Name</th>
                      <th className="px-2 py-1 font-bold">Pos %</th>
                      <th className="px-2 py-1 font-bold">Size (W x H)</th>
                      <th className="px-2 py-1 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFuselage.sections.map((sec) => (
                      <tr
                        key={sec.id}
                        onClick={() => setSelected(sec.id, 'section')}
                        className={`border-b border-slate-200/60 hover:bg-sky-50/60 cursor-pointer transition ${selectedId === sec.id ? 'bg-sky-50 font-semibold text-sky-800' : ''}`}
                      >
                        <td className="px-2 py-1 truncate max-w-[80px]" title={sec.name}>{sec.name}</td>
                        <td className="px-2 py-1 font-mono">{Math.round(sec.xPos * 100)}%</td>
                        <td className="px-2 py-1 font-mono">{sec.width.toFixed(1)} x {sec.height.toFixed(1)}m</td>
                        <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => deleteFuselageSection(sec.id)}
                            className="text-slate-400 hover:text-red-500 font-bold p-0.5"
                            title="Delete Section"
                            disabled={activeFuselage.sections.length <= 2}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

            {/* Nose Cone Radome parameters for the first section (Section 0) */}
            {model.fuselage.sections[0]?.id === activeSection.id && (
              <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100/70 space-y-4 my-2.5">
                <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-sky-100 pb-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-600" /> Nose Cone / Radome Parameters
                </div>
                
                {/* Nose Roundness / Bluntness */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-700 font-semibold">
                    <span>Nose Roundness / Bluntness</span>
                    <input
                      type="number"
                      step={0.05}
                      min={0.0}
                      max={2.0}
                      value={model.fuselage.noseRoundness}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateFuselage({ noseRoundness: val });
                      }}
                      className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-slate-800 text-right text-xs focus:ring-1 focus:ring-sky-500 font-bold"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.05"
                    value={model.fuselage.noseRoundness}
                    onChange={(e) => updateFuselage({ noseRoundness: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="text-[10px] text-slate-500 leading-tight">
                    0.0 = Sharp point, 0.7 = Aerodynamic radome, 2.0 = Ultra-blunt sphere
                  </div>
                </div>

                {/* Nose Vertical Offset (Droop / Commercial Nose) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-700 font-semibold">
                    <span>Nose Vertical Offset</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step={10}
                        min={-2000}
                        max={2000}
                        value={Math.round((model.fuselage.noseZ || 0) * 1000)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateFuselage({ noseZ: val / 1000 });
                        }}
                        className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-slate-800 text-right text-xs focus:ring-1 focus:ring-sky-500 font-bold"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">mm</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.05"
                    value={model.fuselage.noseZ || 0}
                    onChange={(e) => updateFuselage({ noseZ: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Negative values droop nose down (Commercial Airliner profile)
                  </div>
                </div>
              </div>
            )}

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

            {/* Structural Material */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5" title="Material selection updates weight, CG calculations and 3D rendering."><Sliders className="w-3.5 h-3.5 text-emerald-600" /> Structural Material</span>
              <select
                value={activeWing.material || 'paint_glossy'}
                onChange={(e) => updateWing(activeWing.id, { material: e.target.value })}
                className="bg-slate-50 border border-slate-300 rounded p-1 text-[11px] font-bold text-slate-800 w-44"
              >
                {renderMaterialOptions()}
              </select>
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

            {/* Structural Material */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5" title="Material selection updates weight, CG calculations and 3D rendering."><Sliders className="w-3.5 h-3.5 text-amber-600" /> Structural Material</span>
              <select
                value={activeTail.material || 'paint_glossy'}
                onChange={(e) => updateTail(activeTail.id, { material: e.target.value })}
                className="bg-slate-50 border border-slate-300 rounded p-1 text-[11px] font-bold text-slate-800 w-44"
              >
                {renderMaterialOptions()}
              </select>
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

            {/* Structural Material */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium flex items-center gap-1.5" title="Material selection updates weight, CG calculations and 3D rendering."><Sliders className="w-3.5 h-3.5 text-purple-600" /> Structural Material</span>
              <select
                value={activeEngine.material || 'paint_glossy'}
                onChange={(e) => updateEngine(activeEngine.id, { material: e.target.value })}
                className="bg-slate-50 border border-slate-300 rounded p-1 text-[11px] font-bold text-slate-800 w-44"
              >
                {renderMaterialOptions()}
              </select>
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
