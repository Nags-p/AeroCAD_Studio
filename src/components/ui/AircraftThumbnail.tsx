'use client';

import React from 'react';
import { AircraftModel } from '@/types/aircraft';

interface AircraftThumbnailProps {
  model: AircraftModel;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * High-performance vector SVG CAD top-view planform preview thumbnail component.
 * Accurately aligns the 3D aviation coordinate space (nose at -L/2, tail at +L/2)
 * to render precise 2D top-view planform thumbnails for any parametric aircraft model.
 */
export function AircraftThumbnail({
  model,
  width = 64,
  height = 64,
  className = '',
}: AircraftThumbnailProps) {
  if (!model) return null;

  const viewBoxSize = 120;
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;

  // Fuselage bounds: nose is at -L/2, tail is at +L/2
  const fus = model.fuselage;
  const fusLen = fus ? fus.length : 10;
  const fusRadius = fus ? fus.radius : 1.5;

  const noseX = -fusLen / 2;
  const tailX = fusLen / 2;

  let minX = noseX - fusLen * 0.05;
  let maxX = tailX + fusLen * 0.05;
  let maxYSpan = fusRadius * 2.2;

  // Calculate wing planform extents
  if (model.wings && model.wings.length > 0) {
    for (const w of model.wings) {
      const halfSpan = w.span / 2;
      maxYSpan = Math.max(maxYSpan, halfSpan * 1.15);

      const sweepRad = ((w.sweep || 0) * Math.PI) / 180;
      const rootX_LE = w.rootPos[0];
      const rootX_TE = rootX_LE + w.rootChord;
      const tipX_LE = rootX_LE + halfSpan * Math.tan(sweepRad);
      const tipX_TE = tipX_LE + w.tipChord;

      minX = Math.min(minX, rootX_LE, tipX_LE);
      maxX = Math.max(maxX, rootX_TE, tipX_TE);
    }
  }

  // Calculate tail planform extents
  if (model.tails && model.tails.length > 0) {
    for (const t of model.tails) {
      const hSpan = (t.horizontalSpan || 3) / 2;
      maxYSpan = Math.max(maxYSpan, hSpan * 1.1);

      const sweepRad = ((t.sweep || t.horizontalSweep || 0) * Math.PI) / 180;
      const rootX_LE = t.position[0];
      const rootX_TE = rootX_LE + (t.horizontalChord || 2);
      const tipX_LE = rootX_LE + hSpan * Math.tan(sweepRad);
      const tipX_TE = tipX_LE + (t.horizontalTipChord || (t.horizontalChord || 2) * 0.6);

      minX = Math.min(minX, rootX_LE, tipX_LE);
      maxX = Math.max(maxX, rootX_TE, tipX_TE);
    }
  }

  // Calculate engine extents
  if (model.engines && model.engines.length > 0) {
    for (const eng of model.engines) {
      minX = Math.min(minX, eng.position[0]);
      maxX = Math.max(maxX, eng.position[0] + eng.length);
      maxYSpan = Math.max(maxYSpan, Math.abs(eng.position[1]) + eng.diameter);
    }
  }

  const modelLength = Math.max(1, maxX - minX);
  const modelWidth = Math.max(1, maxYSpan * 2);
  const maxDim = Math.max(modelLength, modelWidth);

  // Scaling factor to fit nicely inside viewBox padding
  const scale = (viewBoxSize * 0.78) / maxDim;

  const midX = (minX + maxX) / 2;
  const toSvgX = (x: number) => cx + (x - midX) * scale;
  const toSvgY = (y: number) => cy + y * scale;

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-sm overflow-hidden select-none flex-shrink-0 ${className}`}
      style={{ width, height }}
    >
      {/* Background CAD Blueprint Grid & Glow */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern
            id={`grid-${model.id || 'thumb'}`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 12 0 L 0 0 0 12"
              fill="none"
              stroke="#334155"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          </pattern>

          {/* Core Body Gradient */}
          <linearGradient
            id={`grad-${model.id || 'thumb'}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0.85" />
          </linearGradient>

          {/* Wing Fill Gradient */}
          <linearGradient
            id={`wing-grad-${model.id || 'thumb'}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Blueprint Grid Background */}
        <rect width={viewBoxSize} height={viewBoxSize} fill={`url(#grid-${model.id || 'thumb'})`} />

        {/* Center Axis Guidelines */}
        <line
          x1="0"
          y1={cy}
          x2={viewBoxSize}
          y2={cy}
          stroke="#0EA5E9"
          strokeWidth="0.4"
          strokeDasharray="2,2"
          strokeOpacity="0.35"
        />

        {/* --- 1. MAIN WINGS PLANFORM --- */}
        {model.wings &&
          model.wings.map((w, idx) => {
            const halfSpan = w.span / 2;
            const sweepRad = ((w.sweep || 0) * Math.PI) / 180;
            const rootX = w.rootPos[0];
            const rootY = w.rootPos[1];

            const rxLE = toSvgX(rootX);
            const rxTE = toSvgX(rootX + w.rootChord);

            const txLE = toSvgX(rootX + halfSpan * Math.tan(sweepRad));
            const txTE = toSvgX(rootX + halfSpan * Math.tan(sweepRad) + w.tipChord);

            const ryPort = toSvgY(rootY - halfSpan);
            const ryStarboard = toSvgY(rootY + halfSpan);
            const ryRoot = toSvgY(rootY);

            // Wing path
            const wingPath = `
              M ${rxLE} ${ryRoot}
              L ${txLE} ${ryStarboard}
              L ${txTE} ${ryStarboard}
              L ${rxTE} ${ryRoot}
              L ${txTE} ${ryPort}
              L ${txLE} ${ryPort}
              Z
            `;

            return (
              <g key={w.id || idx}>
                <path
                  d={wingPath}
                  fill={`url(#wing-grad-${model.id || 'thumb'})`}
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Winglets if enabled */}
                {w.winglets && w.winglets.enabled && (
                  <>
                    <line
                      x1={txLE}
                      y1={ryStarboard}
                      x2={txTE + scale * 0.3}
                      y2={ryStarboard + scale * 0.25}
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1={txLE}
                      y1={ryPort}
                      x2={txTE + scale * 0.3}
                      y2={ryPort - scale * 0.25}
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </g>
            );
          })}

        {/* --- 2. TAILS PLANFORM --- */}
        {model.tails &&
          model.tails.map((t, idx) => {
            const hSpan = (t.horizontalSpan || 3) / 2;
            const sweepRad = ((t.sweep || t.horizontalSweep || 0) * Math.PI) / 180;
            const posX = t.position[0];
            const posY = t.position[1];

            const rxLE = toSvgX(posX);
            const rxTE = toSvgX(posX + (t.horizontalChord || 2));
            const txLE = toSvgX(posX + hSpan * Math.tan(sweepRad));
            const txTE = toSvgX(posX + hSpan * Math.tan(sweepRad) + (t.horizontalTipChord || (t.horizontalChord || 2) * 0.6));

            const ryPort = toSvgY(posY - hSpan);
            const ryStarboard = toSvgY(posY + hSpan);
            const ryRoot = toSvgY(posY);

            const tailPath = `
              M ${rxLE} ${ryRoot}
              L ${txLE} ${ryStarboard}
              L ${txTE} ${ryStarboard}
              L ${rxTE} ${ryRoot}
              L ${txTE} ${ryPort}
              L ${txLE} ${ryPort}
              Z
            `;

            return (
              <path
                key={t.id || idx}
                d={tailPath}
                fill="#0284C7"
                fillOpacity="0.5"
                stroke="#7DD3FC"
                strokeWidth="1.0"
              />
            );
          })}

        {/* --- 3. ENGINES NACELLES --- */}
        {model.engines &&
          model.engines.map((eng, idx) => {
            const engX = toSvgX(eng.position[0]);
            const engY = toSvgY(eng.position[1]);
            const engW = Math.max(3, eng.length * scale);
            const engH = Math.max(2.5, eng.diameter * scale);

            return (
              <rect
                key={eng.id || idx}
                x={engX}
                y={engY - engH / 2}
                width={engW}
                height={engH}
                rx={engH * 0.3}
                fill="#F59E0B"
                fillOpacity="0.8"
                stroke="#FBBF24"
                strokeWidth="0.8"
              />
            );
          })}

        {/* --- 4. FUSELAGE OUTLINE & SECTIONS --- */}
        {fus && (
          <g>
            {/* Smooth Fuselage Contour centered from nose (-L/2) to tail (+L/2) */}
            {(() => {
              const svgNoseX = toSvgX(noseX);
              const svgTailX = toSvgX(tailX);
              const maxR = fusRadius * scale;

              const fusPath = `
                M ${svgNoseX} ${cy}
                C ${toSvgX(noseX + fusLen * 0.15)} ${cy - maxR * 1.05}, ${toSvgX(noseX + fusLen * 0.6)} ${cy - maxR}, ${svgTailX} ${cy - maxR * (fus.tail || 0.3)}
                L ${svgTailX} ${cy + maxR * (fus.tail || 0.3)}
                C ${toSvgX(noseX + fusLen * 0.6)} ${cy + maxR}, ${toSvgX(noseX + fusLen * 0.15)} ${cy + maxR * 1.05}, ${svgNoseX} ${cy}
                Z
              `;

              return (
                <path
                  d={fusPath}
                  fill={`url(#grad-${model.id || 'thumb'})`}
                  stroke="#E0F2FE"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              );
            })()}

            {/* Nose Tip Indicator */}
            <circle
              cx={toSvgX(noseX)}
              cy={cy}
              r="1.8"
              fill="#38BDF8"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
          </g>
        )}
      </svg>

      {/* Glassmorphism Edge Highlight */}
      <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none" />
    </div>
  );
}
