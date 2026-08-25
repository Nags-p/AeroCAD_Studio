'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Cloud,
  Compass,
  LineChart,
  Hammer,
  Scale,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wind,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useUIStore, EngineeringTabType } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import {
  calculateISA,
  calculateStability,
  solveLLT,
  analyzeStructures,
  SPAR_MATERIALS
} from '@/engine/math/engineeringTools';

export function EngineeringToolsModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const units = useUIStore((state) => state.units);
  const activeTab = useUIStore((state) => state.activeEngineeringTab);
  const setTab = useUIStore((state) => state.setEngineeringTab);

  const model = useAircraftStore((state) => state.model);

  // --- 1. Atmosphere State ---
  const [altitude, setAltitude] = useState<number>(1500); // meters
  const [altInputMode, setAltInputMode] = useState<'meters' | 'feet'>('meters');

  // --- 2. Aerodynamics / Stability State ---
  const [userAoA, setUserAoA] = useState<number>(4.5); // degrees
  const [flowSpeed, setFlowSpeed] = useState<number>(60); // m/s (approx 120 knots)

  // --- 3. Structures State ---
  const [gLoad, setGLoad] = useState<number>(2.5); // Gs
  const [sparMatId, setSparMatId] = useState<string>('aluminum');

  // Active chart type for structures (shear, moment, deflection)
  const [structChartType, setStructChartType] = useState<'deflection' | 'moment' | 'shear'>('deflection');

  if (activeModal !== 'engineering') return null;

  // Conversions for Altitudes
  const handleAltitudeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (altInputMode === 'meters') {
      setAltitude(val);
    } else {
      setAltitude(val * 0.3048); // ft to m
    }
  };

  const altDisplayVal = Math.round(altInputMode === 'meters' ? altitude : altitude / 0.3048);
  const altMaxSlider = altInputMode === 'meters' ? 25000 : 80000;

  // Calculators
  const isa = calculateISA(altitude);
  const stability = calculateStability(model, userAoA);
  const llt = solveLLT(model, userAoA, flowSpeed);
  const structures = analyzeStructures(model, gLoad, sparMatId, userAoA, flowSpeed);

  // Atmospheric outputs conversion
  const densityUnits = units === 'imperial' ? 'slugs/ft³' : 'kg/m³';
  const densityVal = units === 'imperial' ? isa.density * 0.00194032 : isa.density;
  
  const pressUnits = units === 'imperial' ? 'psi' : 'kPa';
  const pressVal = units === 'imperial' ? isa.pressure * 0.000145038 : isa.pressure / 1000;

  const tempUnits = units === 'imperial' ? '°F' : '°C';
  const tempVal = units === 'imperial' ? (isa.temperature - 273.15) * 1.8 + 32 : isa.temperatureC;

  const speedUnits = units === 'imperial' ? 'kts' : 'm/s';
  const speedVal = units === 'imperial' ? isa.speedOfSound * 1.94384 : isa.speedOfSound;

  // Render SVG for Aerodynamics (LLT spanwise lift distribution) - LIGHT THEME
  const renderAeroPlot = () => {
    if (!llt.yStations || llt.yStations.length === 0) return null;
    const w = 500;
    const h = 220;
    const padding = 40;

    const xMin = -llt.span / 2;
    const xMax = llt.span / 2;
    const yMax = Math.max(...llt.localClChord, 0.01) * 1.2;

    const toX = (val: number) => padding + ((val - xMin) / (xMax - xMin)) * (w - 2 * padding);
    const toY = (val: number) => h - padding - (val / yMax) * (h - 2 * padding);

    // Generate lift distribution path (c * Cl)
    let liftPath = '';
    for (let i = 0; i < llt.yStations.length; i++) {
      const px = toX(llt.yStations[i]);
      const py = toY(llt.localClChord[i]);
      liftPath += `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }

    // Generate Ideal Elliptic Lift Path for comparison
    let idealPath = '';
    const rootLift = llt.localClChord[Math.floor(llt.yStations.length / 2)];
    for (let i = 0; i < llt.yStations.length; i++) {
      const y = llt.yStations[i];
      const frac = 2 * y / llt.span;
      const idealLift = rootLift * Math.sqrt(Math.max(0, 1 - frac * frac));
      const px = toX(y);
      const py = toY(idealLift);
      idealPath += `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full bg-slate-50 border border-slate-200 rounded-lg shadow-inner font-mono text-[9px] fill-none">
        {/* Grids */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + f * (h - 2 * padding)}
            x2={w - padding}
            y2={padding + f * (h - 2 * padding)}
            className="stroke-slate-200"
            strokeDasharray="4 4"
          />
        ))}
        <line
          x1={w / 2}
          y1={padding}
          x2={w / 2}
          y2={h - padding}
          className="stroke-slate-300"
          strokeDasharray="2 2"
        />

        {/* X Axis */}
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} className="stroke-slate-400 stroke-[1.5]" />
        {/* Y Axis */}
        <line x1={padding} y1={padding} x2={padding} y2={h - padding} className="stroke-slate-400 stroke-[1.5]" />

        {/* Axis Labels */}
        <text x={w / 2} y={h - 10} className="fill-slate-600 text-center font-bold font-sans" textAnchor="middle">
          Span Position y ({units === 'imperial' ? 'ft' : 'm'})
        </text>
        <text x={12} y={h / 2} className="fill-slate-600 font-bold font-sans" transform={`rotate(-90 12 ${h/2})`} textAnchor="middle">
          Sectional Lift c·Cl ({units === 'imperial' ? 'ft' : 'm'})
        </text>

        {/* Dynamic Axis ticks */}
        <text x={padding} y={h - padding + 12} className="fill-slate-500" textAnchor="middle">{(xMin * (units === 'imperial' ? 3.28084 : 1)).toFixed(1)}</text>
        <text x={w / 2} y={h - padding + 12} className="fill-slate-500" textAnchor="middle">0.0</text>
        <text x={w - padding} y={h - padding + 12} className="fill-slate-500" textAnchor="middle">{(xMax * (units === 'imperial' ? 3.28084 : 1)).toFixed(1)}</text>

        <text x={padding - 5} y={padding + 4} className="fill-slate-500" textAnchor="end">{(yMax * (units === 'imperial' ? 3.28084 : 1)).toFixed(2)}</text>
        <text x={padding - 5} y={h - padding} className="fill-slate-500" textAnchor="end">0.00</text>

        {/* Ideal Ellipse Path (Dotted) */}
        <path d={idealPath} className="stroke-slate-400 stroke-1" strokeDasharray="3 3" />

        {/* Actual Lift Path */}
        <path d={liftPath} className="stroke-sky-600 stroke-[2.5] filter drop-shadow-[0_1.5px_3px_rgba(14,165,233,0.15)]" />

        {/* Legend */}
        <g transform={`translate(${w - 140}, 15)`} className="text-[8px] font-sans">
          <line x1={0} y1={5} x2={15} y2={5} className="stroke-sky-600 stroke-[2]" />
          <text x={20} y={8} className="fill-slate-600 font-medium">Actual Lift (c·Cl)</text>

          <line x1={0} y1={18} x2={15} y2={18} className="stroke-slate-400 stroke-1" strokeDasharray="3 3" />
          <text x={20} y={21} className="fill-slate-600 font-medium">Ideal Elliptic</text>
        </g>
      </svg>
    );
  };

  // Render SVG for Structures (bending, shear, deflection) - LIGHT THEME
  const renderStructPlot = () => {
    if (!structures.yStations || structures.yStations.length === 0) return null;
    const w = 500;
    const h = 220;
    const padding = 45;

    const lenMult = units === 'imperial' ? 3.28084 : 1.0;

    const xMin = 0;
    const xMax = model.wings[0]?.span / 2 || 1;

    let chartData: number[] = [];
    let strokeColor = 'stroke-purple-600';
    let filterColor = 'rgba(147,51,234,0.15)';
    let chartTitle = '';
    let yUnit = '';
    let mult = 1.0;

    if (structChartType === 'deflection') {
      chartData = structures.deflection;
      strokeColor = 'stroke-indigo-600';
      filterColor = 'rgba(79,70,229,0.15)';
      chartTitle = 'Wing Spar Deflection';
      yUnit = units === 'imperial' ? 'in' : 'cm';
      mult = units === 'imperial' ? 39.3701 : 100.0;
    } else if (structChartType === 'moment') {
      chartData = structures.bendingMoment;
      strokeColor = 'stroke-pink-600';
      filterColor = 'rgba(219,39,119,0.15)';
      chartTitle = 'Bending Moment';
      yUnit = units === 'imperial' ? 'ft·lbs' : 'N·m';
      mult = units === 'imperial' ? 0.737562 : 1.0;
    } else {
      chartData = structures.shearForce;
      strokeColor = 'stroke-cyan-600';
      filterColor = 'rgba(8,145,178,0.15)';
      chartTitle = 'Internal Shear Force';
      yUnit = units === 'imperial' ? 'lbf' : 'N';
      mult = units === 'imperial' ? 0.224809 : 1.0;
    }

    const yMax = Math.max(...chartData.map(Math.abs), 0.0001) * 1.15;
    const toX = (val: number) => padding + (val / xMax) * (w - 2 * padding);
    const toY = (val: number) => h - padding - (val / yMax) * (h - 2 * padding);

    let path = '';
    for (let i = 0; i < structures.yStations.length; i++) {
      const px = toX(structures.yStations[i]);
      const py = toY(chartData[i]);
      path += `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full bg-slate-50 border border-slate-200 rounded-lg shadow-inner font-mono text-[9px] fill-none">
        {/* Grids */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + f * (h - 2 * padding)}
            x2={w - padding}
            y2={padding + f * (h - 2 * padding)}
            className="stroke-slate-200"
            strokeDasharray="4 4"
          />
        ))}

        {/* X Axis */}
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} className="stroke-slate-400 stroke-[1.5]" />
        {/* Y Axis */}
        <line x1={padding} y1={padding} x2={padding} y2={h - padding} className="stroke-slate-400 stroke-[1.5]" />

        {/* Axis Labels */}
        <text x={w / 2} y={h - 10} className="fill-slate-600 font-bold font-sans" textAnchor="middle">
          Wing Station y ({units === 'imperial' ? 'ft' : 'm'})
        </text>
        <text x={12} y={h / 2} className="fill-slate-600 font-bold font-sans" transform={`rotate(-90 12 ${h/2})`} textAnchor="middle">
          {chartTitle} ({yUnit})
        </text>

        {/* Ticks */}
        <text x={padding} y={h - padding + 12} className="fill-slate-500" textAnchor="middle">0.0 (Root)</text>
        <text x={w - padding} y={h - padding + 12} className="fill-slate-500" textAnchor="middle">{(xMax * lenMult).toFixed(1)} (Tip)</text>

        <text x={padding - 5} y={padding + 4} className="fill-slate-500" textAnchor="end">{(yMax * mult).toFixed(0)}</text>
        <text x={padding - 5} y={h - padding} className="fill-slate-500" textAnchor="end">0</text>

        {/* Plot path */}
        <path d={path} className={`${strokeColor} stroke-[2.5] filter drop-shadow-[0_1.5px_3px_${filterColor}]`} />

        {/* Reference line */}
        {structChartType === 'deflection' && (
          <line
            x1={padding}
            y1={h - padding}
            x2={w - padding}
            y2={h - padding}
            className="stroke-slate-300"
            strokeDasharray="2 2"
          />
        )}
      </svg>
    );
  };

  const currentSparMaterial = SPAR_MATERIALS[sparMatId] || SPAR_MATERIALS['aluminum'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5 font-bold text-sky-700">
            <Activity className="w-5 h-5 text-sky-600 stroke-[2.2]" />
            <span className="text-sm font-extrabold tracking-wider uppercase">Aerospace Engineering Tools Suite</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-60 bg-slate-50/50 border-r border-slate-200 p-4 flex flex-col gap-1.5 select-none">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Analysis Tool Modules</div>
            <button
              onClick={() => setTab('atmosphere')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'atmosphere' 
                  ? 'bg-sky-50 text-sky-750 border-sky-200 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Cloud className={`w-4 h-4 ${activeTab === 'atmosphere' ? 'text-sky-600' : 'text-slate-500'}`} />
              <span>Standard Atmosphere</span>
            </button>
            <button
              onClick={() => setTab('stability')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'stability' 
                  ? 'bg-amber-50 text-amber-800 border-amber-250 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Compass className={`w-4 h-4 ${activeTab === 'stability' ? 'text-amber-600' : 'text-slate-500'}`} />
              <span>Stability & Trim</span>
            </button>
            <button
              onClick={() => setTab('aerodynamics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'aerodynamics' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-250 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <LineChart className={`w-4 h-4 ${activeTab === 'aerodynamics' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>Wing Aerodynamics (LLT)</span>
            </button>
            <button
              onClick={() => setTab('structures')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'structures' 
                  ? 'bg-purple-50 text-purple-800 border-purple-250 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Hammer className={`w-4 h-4 ${activeTab === 'structures' ? 'text-purple-600' : 'text-slate-500'}`} />
              <span>Wing Spar Bending</span>
            </button>

            <div className="mt-auto p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[10px] text-slate-500 leading-relaxed font-sans font-medium">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                <span>Real-time Sync</span>
              </div>
              <p>These calculations update live as you edit components in the background editor viewports.</p>
            </div>
          </div>

          {/* Main Module Panel Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">

            {/* TAB 1: STANDARD ATMOSPHERE */}
            {activeTab === 'atmosphere' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-sky-600" />
                      Standard Atmosphere (ISA Model)
                    </h3>
                    <p className="text-slate-650 text-xs font-medium">
                      Calculates standard atmospheric properties and viscosity layers up to 32,000 meters (105,000 ft).
                    </p>
                  </div>

                  {/* Meter/Feet toggle */}
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
                    <button
                      onClick={() => setAltInputMode('meters')}
                      className={`px-2.5 py-1 rounded transition ${altInputMode === 'meters' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Meters
                    </button>
                    <button
                      onClick={() => setAltInputMode('feet')}
                      className={`px-2.5 py-1 rounded transition ${altInputMode === 'feet' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Feet
                    </button>
                  </div>
                </div>

                {/* Slider Input */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-700 select-none">
                    <span>Input Altitude:</span>
                    <span className="text-sky-600 font-mono font-extrabold text-sm">
                      {altDisplayVal.toLocaleString()} {altInputMode === 'meters' ? 'm' : 'ft'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={altMaxSlider}
                    step={altInputMode === 'meters' ? 100 : 500}
                    value={altInputMode === 'meters' ? altitude : altitude / 0.3048}
                    onChange={handleAltitudeSliderChange}
                    className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-550 font-mono">
                    <span>Sea Level</span>
                    <span>Tropopause (11km / 36,000 ft)</span>
                    <span>Stratosphere Max</span>
                  </div>
                </div>

                {/* Visual Altitude Gauge */}
                <div className="h-6 bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden flex text-[10px] font-bold text-slate-600 select-none">
                  {/* Troposphere section */}
                  <div
                    className="h-full bg-sky-50 border-r border-sky-250 flex items-center justify-center transition-all duration-300"
                    style={{ width: `${Math.min(100, (11000 / 32000) * 100)}%` }}
                  >
                    <span>Troposphere</span>
                  </div>
                  {/* Stratosphere section */}
                  <div className="h-full bg-indigo-50/70 flex-1 flex items-center justify-center">
                    <span>Lower Stratosphere</span>
                  </div>
                  {/* Needle indicator for current altitude */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] z-10 transition-all duration-300"
                    style={{ left: `${Math.min(99.5, (altitude / 32000) * 100)}%` }}
                  />
                </div>

                {/* Side-by-side properties tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Thermal & Mechanical Properties</h4>
                    <table className="w-full text-xs font-mono">
                      <tbody className="divide-y divide-slate-200 text-slate-900">
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Temperature</td>
                          <td className="py-2 text-right text-slate-900 font-extrabold">{tempVal.toFixed(1)} {tempUnits}</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Absolute Temp</td>
                          <td className="py-2 text-right text-slate-800 font-extrabold">{isa.temperature.toFixed(2)} K</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Pressure</td>
                          <td className="py-2 text-right text-slate-900 font-extrabold">{pressVal.toFixed(3)} {pressUnits}</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Density</td>
                          <td className="py-2 text-right text-slate-900 font-extrabold">{densityVal.toExponential(4)} {densityUnits}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Aerodynamic Constants</h4>
                    <table className="w-full text-xs font-mono">
                      <tbody className="divide-y divide-slate-200 text-slate-900">
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Speed of Sound</td>
                          <td className="py-2 text-right text-slate-900 font-extrabold">{speedVal.toFixed(1)} {speedUnits}</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Dynamic Viscosity (μ)</td>
                          <td className="py-2 text-right text-slate-800 font-extrabold">{isa.dynamicViscosity.toExponential(4)} Pa·s</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Kinematic Viscosity (ν)</td>
                          <td className="py-2 text-right text-slate-800 font-extrabold">{isa.kinematicViscosity.toExponential(4)} m²/s</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Relative Density Ratio (σ)</td>
                          <td className="py-2 text-right text-sky-600 font-extrabold">{(isa.density / 1.225).toFixed(4)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STABILITY & TRIM */}
            {activeTab === 'stability' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-600" />
                    Static Longitudinal Stability & Pitch Trim
                  </h3>
                  <p className="text-slate-650 text-xs font-medium">
                    {"Estimates the Neutral Point ($X_{np}$) of the geometry and calculates the required elevator deflection to balance pitching moments."}
                  </p>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-55 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-sans">Wing AC (X_ac)</span>
                    <p className="text-base font-bold text-slate-800">{(stability.wingAcX * (units === 'imperial' ? 3.28084 : 1)).toFixed(2)} {units === 'imperial' ? 'ft' : 'm'}</p>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-sans">Tail AC (X_ac,t)</span>
                    <p className="text-base font-bold text-slate-800">
                      {stability.tailArea > 0 ? `${(stability.tailAcX * (units === 'imperial' ? 3.28084 : 1)).toFixed(2)} ${units === 'imperial' ? 'ft' : 'm'}` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-sans">Neutral Point (X_np)</span>
                    <p className="text-base font-bold text-sky-650">{(stability.neutralPointX * (units === 'imperial' ? 3.28084 : 1)).toFixed(2)} {units === 'imperial' ? 'ft' : 'm'}</p>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-sans">Center of Gravity (X_cg)</span>
                    <p className="text-base font-bold text-purple-650">{(stability.cgX * (units === 'imperial' ? 3.28084 : 1)).toFixed(2)} {units === 'imperial' ? 'ft' : 'm'}</p>
                  </div>
                </div>

                {/* Spatial layout visualization gauge */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-700">Parametric Point Spacings (X positions)</span>
                  <div className="h-10 bg-slate-100 rounded-lg border border-slate-200 relative flex items-center select-none font-mono text-[9px]">
                    
                    {/* Fuselage representation */}
                    <div className="absolute left-[10%] right-[10%] h-3 bg-slate-200 rounded-full border border-slate-355 flex items-center justify-between px-2 text-slate-550">
                      <span>Nose</span>
                      <span>Fuselage Station Axis</span>
                      <span>Tail</span>
                    </div>

                    {/* CG indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-purple-500 z-10 transition-all duration-300"
                      style={{ left: `${Math.min(95, Math.max(5, 10 + (stability.cgX / (stability.tailAcX || 12)) * 80))}%` }}
                    >
                      <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-[7px] text-white font-bold border border-white shadow">CG</div>
                    </div>

                    {/* Wing AC indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-emerald-500 z-10 transition-all duration-300"
                      style={{ left: `${Math.min(95, Math.max(5, 10 + (stability.wingAcX / (stability.tailAcX || 12)) * 80))}%` }}
                    >
                      <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-[7px] text-white font-bold border border-white shadow">AC</div>
                    </div>

                    {/* Neutral Point indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-sky-500 z-10 transition-all duration-300"
                      style={{ left: `${Math.min(95, Math.max(5, 10 + (stability.neutralPointX / (stability.tailAcX || 12)) * 80))}%` }}
                    >
                      <div className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-sky-600 flex items-center justify-center text-[7px] text-white font-bold border border-white shadow">NP</div>
                    </div>
                  </div>
                </div>

                {/* Stability margins and status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-sky-600" /> Stability Assessment
                    </h4>

                    {stability.stabilityStatus === 'stable' && (
                      <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-slate-900">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 stroke-[2.2]" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">Stability Status</span>
                          <h4 className="text-sm font-extrabold text-emerald-800">STATICALLY STABLE</h4>
                          <p className="text-[10px] text-emerald-650">Static margin is above +5% MAC, providing natural recovery from gusts.</p>
                        </div>
                      </div>
                    )}
                    {stability.stabilityStatus === 'marginal' && (
                      <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-900">
                        <AlertTriangle className="w-10 h-10 text-amber-600 stroke-[2.2]" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-amber-700 font-bold uppercase">Stability Status</span>
                          <h4 className="text-sm font-extrabold text-amber-800">MARGINALLY STABLE</h4>
                          <p className="text-[10px] text-amber-650">Static margin is neutral to thin (0-5%). Flyable but highly maneuverable/twitchy.</p>
                        </div>
                      </div>
                    )}
                    {stability.stabilityStatus === 'unstable' && (
                      <div className="flex items-center gap-4 bg-rose-50 p-4 rounded-xl border border-rose-100 text-slate-900">
                        <AlertTriangle className="w-10 h-10 text-rose-600 stroke-[2.2]" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-rose-700 font-bold uppercase">Stability Status</span>
                          <h4 className="text-sm font-extrabold text-rose-800">STATICALLY UNSTABLE</h4>
                          <p className="text-[10px] text-rose-650">CG is behind the Neutral Point. Requires active computer control (fly-by-wire) to prevent pitch divergence.</p>
                        </div>
                      </div>
                    )}

                    <table className="w-full text-xs font-mono">
                      <tbody className="divide-y divide-slate-200 text-slate-900">
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Static Margin</td>
                          <td className={`py-2 text-right font-extrabold ${(stability.staticMargin >= 0.05) ? 'text-emerald-600' : (stability.staticMargin >= 0 ? 'text-amber-650' : 'text-rose-600')}`}>
                            {(stability.staticMargin * 100).toFixed(1)}% MAC
                          </td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Tail Volume Coefficient (V_h)</td>
                          <td className="py-2 text-right text-slate-800 font-extrabold">{stability.tailVolumeCoeff.toFixed(3)}</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Horizontal Stabilizer Area</td>
                          <td className="py-2 text-right text-slate-800 font-extrabold">{(stability.tailArea * (units === 'imperial' ? 10.7639 : 1)).toFixed(2)} {units === 'imperial' ? 'ft²' : 'm²'}</td>
                        </tr>
                        <tr className="py-2">
                          <td className="py-2 text-slate-550 font-sans">Wing Mean Aero Chord (MAC)</td>
                          <td className="py-2 text-right text-slate-800 font-extrabold">{(stability.wingMac * (units === 'imperial' ? 3.28084 : 1)).toFixed(2)} {units === 'imperial' ? 'ft' : 'm'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Trim Control deflection */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-amber-600" /> Longitudinal Trim Solver
                    </h4>
                    
                    <p className="text-[10px] text-slate-550 leading-relaxed font-sans font-medium">
                      Calculates the elevator angle required to counter the pitching moment generated by camber and CG offset in level flight.
                    </p>

                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-slate-700 select-none">
                        <span>Target Flight Angle of Attack:</span>
                        <span className="text-amber-600 font-mono font-extrabold text-sm">{userAoA.toFixed(1)}°</span>
                      </div>
                      <input
                        type="range"
                        min="-4"
                        max="15"
                        step="0.5"
                        value={userAoA}
                        onChange={(e) => setUserAoA(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold font-sans uppercase">Required Elevator Deflection</span>
                        <h4 className={`text-base font-extrabold ${Math.abs(stability.trimDeflection) > 20 ? 'text-rose-600' : 'text-amber-650'}`}>
                          {stability.tailArea > 0 ? `${stability.trimDeflection.toFixed(2)}°` : 'N/A (No Tail)'}
                        </h4>
                        <span className="text-[9px] text-slate-500 font-sans">
                          {stability.trimDeflection < 0 ? 'Negative (Nose-Up Trim)' : 'Positive (Nose-Down Trim)'}
                        </span>
                      </div>
                      
                      {stability.tailArea > 0 && (
                        <div className="h-14 w-14 border border-slate-200 bg-white rounded-full flex items-center justify-center relative select-none">
                          {/* Visual angle indicator */}
                          <div
                            className="w-8 h-1.5 bg-amber-500 rounded-full origin-right transition-transform duration-300"
                            style={{ transform: `rotate(${-stability.trimDeflection}deg)`, marginRight: '28px' }}
                          />
                          <div className="absolute text-[8px] text-slate-400 bottom-1 font-bold">ELEVATOR</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AERODYNAMICS (LLT) */}
            {activeTab === 'aerodynamics' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-emerald-600" />
                    Wing Aerodynamics Solver (Lifting-Line Theory)
                  </h3>
                  <p className="text-slate-655 text-xs font-medium">
                    Solves the circulation matrix across the wing span using Fourier symmetric modes, plotting the sectional lift shape compared to ideal elliptical profiles.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Inputs & Parameters */}
                  <div className="space-y-4 lg:col-span-1">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Solver Controls</h4>
                      
                      {/* AoA Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-705 select-none">
                          <span>Angle of Attack (α):</span>
                          <span className="text-emerald-600 font-mono font-extrabold">{userAoA.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="15"
                          step="0.5"
                          value={userAoA}
                          onChange={(e) => setUserAoA(parseFloat(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                        />
                      </div>

                      {/* Velocity Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-705 select-none">
                          <span>Airspeed (V):</span>
                          <span className="text-emerald-600 font-mono font-extrabold">
                            {Math.round(units === 'imperial' ? flowSpeed * 1.94384 : flowSpeed)} {units === 'imperial' ? 'kts' : 'm/s'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="250"
                          step="5"
                          value={flowSpeed}
                          onChange={(e) => setFlowSpeed(parseInt(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                        />
                      </div>
                    </div>

                    {/* Calculated Metrics */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs text-slate-900">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 font-sans">LLT Outputs</h4>
                      <div className="flex justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 font-sans">Lift Coefficient (C_L)</span>
                        <span className="text-slate-805 font-extrabold">{llt.cL.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 font-sans">Induced Drag (C_Di)</span>
                        <span className="text-rose-605 font-extrabold">{llt.cDi.toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 font-sans">Oswald Factor (e)</span>
                        <span className="text-emerald-600 font-extrabold">{llt.oswaldEfficiency.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-500 font-sans">Efficiency (L/D_i)</span>
                        <span className="text-sky-600 font-extrabold">{llt.cDi > 0 ? (llt.cL / llt.cDi).toFixed(1) : '∞'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: SVG Plot */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Spanwise Lift Profile</span>
                      <span className="text-slate-500 font-medium font-sans">Symmetric wing loading curve</span>
                    </div>
                    <div className="aspect-[2.2/1] w-full">
                      {renderAeroPlot()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STRUCTURES (WING SPAR BENDING) */}
            {activeTab === 'structures' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-purple-600" />
                    Wing Structural Spar Bending & Shear Load FEA
                  </h3>
                  <p className="text-slate-655 text-xs font-medium">
                    Calculates shear load, bending moments, and elastic wingtip deflection under accelerative loading for a box spar.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Structural Controls & Properties */}
                  <div className="space-y-4 lg:col-span-1 text-xs">
                    
                    {/* Controls box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 font-sans">Loads & Material</h4>
                      
                      {/* G-Load Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700 select-none">
                          <span>Design Load Factor (n):</span>
                          <span className="text-purple-600 font-mono font-extrabold text-sm">+{gLoad.toFixed(1)}g</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="9"
                          step="0.5"
                          value={gLoad}
                          onChange={(e) => setGLoad(parseFloat(e.target.value))}
                          className="w-full accent-purple-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                        />
                      </div>

                      {/* Material Select */}
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold select-none font-sans">Internal Spar Material:</label>
                        <select
                          value={sparMatId}
                          onChange={(e) => setSparMatId(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-1.5 px-3 focus:outline-none focus:border-purple-500 font-semibold"
                        >
                          {Object.values(SPAR_MATERIALS).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Stress dashboard */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-slate-900">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 font-sans flex items-center gap-1">
                        <Scale className="w-4 h-4 text-purple-600" /> Stress Assessment
                      </h4>

                      {structures.isSafe ? (
                        <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[2.2]" />
                          <div>
                            <h4 className="font-extrabold text-emerald-800 text-[11px] uppercase">Structure Safe</h4>
                            <p className="text-[9px] text-emerald-650 font-sans font-medium">Bending stress is well below material yield limit.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-rose-50 p-3 rounded-lg border border-rose-100">
                          <AlertTriangle className="w-8 h-8 text-rose-600 stroke-[2.2]" />
                          <div>
                            <h4 className="font-extrabold text-rose-800 text-[11px] uppercase">Structural Yield!</h4>
                            <p className="text-[9px] text-rose-650 font-sans font-medium">Wing spar exceeds material limits. Size chord/thickness larger.</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 font-mono">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-sans">Max Bending Stress</span>
                          <span className={`font-extrabold ${structures.isSafe ? 'text-slate-800' : 'text-rose-600'}`}>
                            {(structures.maxStress / 1e6).toFixed(1)} MPa
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-sans">Yield Strength</span>
                          <span className="text-slate-650 font-extrabold">{(structures.yieldStrength / 1e6).toFixed(1)} MPa</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-500 font-sans">Max Elastic Deflection</span>
                          <span className="text-slate-805 font-extrabold">
                            {units === 'imperial' 
                              ? `${(structures.maxDeflection * 39.3701).toFixed(1)} in`
                              : `${(structures.maxDeflection * 100).toFixed(1)} cm`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Safety Margin</span>
                          <span className={`font-extrabold ${structures.isSafe ? 'text-emerald-600' : 'text-rose-605'}`}>
                            {structures.safetyFactor.toFixed(2)}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: SVG Plot & Plot Toggle Tabs */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-705">Structural Diagrams</span>
                      
                      {/* Diagram selector */}
                      <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
                        <button
                          onClick={() => setStructChartType('deflection')}
                          className={`px-2 py-0.5 rounded transition ${structChartType === 'deflection' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-900'}`}
                        >
                          Deflection
                        </button>
                        <button
                          onClick={() => setStructChartType('moment')}
                          className={`px-2 py-0.5 rounded transition ${structChartType === 'moment' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-900'}`}
                        >
                          Moment
                        </button>
                        <button
                          onClick={() => setStructChartType('shear')}
                          className={`px-2 py-0.5 rounded transition ${structChartType === 'shear' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-900'}`}
                        >
                          Shear Force
                        </button>
                      </div>
                    </div>

                    <div className="aspect-[2.2/1] w-full">
                      {renderStructPlot()}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
