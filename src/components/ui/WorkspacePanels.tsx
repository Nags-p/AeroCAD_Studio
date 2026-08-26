'use client';

import React, { useMemo } from 'react';
import {
  Wind,
  Compass,
  LineChart,
  Scale,
  Sliders,
  HelpCircle,
  Activity,
  Gauge,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu,
  Box
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { calculateISA, calculateStability, solveLLT } from '@/engine/math/engineeringTools';
import { calculateAeroMetrics } from '@/engine/math/aeroMetrics';
import {
  exportAircraftSTEP,
  exportAircraftIGES,
  exportAircraftParasolid,
  exportAircraftSTL,
  exportAircraftOBJ
} from '@/engine/export/cadExporter';

// -------------------------------------------------------------
// 1. AERODYNAMICS WORKSPACE PANELS
// -------------------------------------------------------------

export function AerodynamicsLeftPanel() {
  const units = useUIStore((state) => state.units);
  const altitude = useUIStore((state) => state.engineeringAltitude);
  const setAltitude = useUIStore((state) => state.setEngineeringAltitude);
  
  const userAoA = useUIStore((state) => state.engineeringAoA);
  const setUserAoA = useUIStore((state) => state.setEngineeringAoA);

  const flowSpeed = useUIStore((state) => state.engineeringFlowSpeed);
  const setFlowSpeed = useUIStore((state) => state.setEngineeringFlowSpeed);

  // ISA Atmosphere calculation
  const isa = useMemo(() => calculateISA(altitude), [altitude]);

  const densityVal = units === 'imperial' ? isa.density * 0.00194032 : isa.density;
  const densityUnit = units === 'imperial' ? 'slugs/ft³' : 'kg/m³';

  const pressVal = units === 'imperial' ? isa.pressure * 0.000145038 : isa.pressure / 1000;
  const pressUnit = units === 'imperial' ? 'psi' : 'kPa';

  const tempVal = units === 'imperial' ? (isa.temperature - 273.15) * 1.8 + 32 : isa.temperatureC;
  const tempUnit = units === 'imperial' ? '°F' : '°C';

  const speedVal = units === 'imperial' ? isa.speedOfSound * 1.94384 : isa.speedOfSound;
  const speedUnit = units === 'imperial' ? 'kts' : 'm/s';

  const speedDisplay = units === 'imperial' ? Math.round(flowSpeed * 1.94384) : flowSpeed;
  const speedDisplayUnit = units === 'imperial' ? 'kts' : 'm/s';

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-r border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Sliders className="w-4 h-4 text-emerald-600" />
        <span>Aerodynamic Solvers</span>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Angle of Attack (AoA) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <span>Angle of Attack (α)</span>
            </span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {userAoA.toFixed(1)}°
            </span>
          </div>
          <input
            type="range"
            min={-10}
            max={20}
            step={0.5}
            value={userAoA}
            onChange={(e) => setUserAoA(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
          />
          <span className="text-[10px] text-slate-400 leading-normal block">
            Angle between the chord line of the main wing and the relative freestream wind vector.
          </span>
        </div>

        {/* Freestream Airspeed */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <span>Freestream Velocity</span>
            </span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {speedDisplay} {speedDisplayUnit}
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={300}
            step={5}
            value={flowSpeed}
            onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
          />
          <span className="text-[10px] text-slate-400 leading-normal block">
            True Airspeed (TAS) of flow over the lifting structures.
          </span>
        </div>

        {/* Altitude Simulator */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <span>Simulation Altitude</span>
            </span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {units === 'imperial' ? `${Math.round(altitude / 0.3048)} ft` : `${Math.round(altitude)} m`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={20000}
            step={200}
            value={altitude}
            onChange={(e) => setAltitude(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* ISA Ambient Readout */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-500" /> Standard Atmosphere
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600 leading-relaxed">
            <div>
              <span className="block text-slate-400">Air Density</span>
              <span className="font-mono text-slate-900 font-bold">{densityVal.toFixed(5)} {densityUnit}</span>
            </div>
            <div>
              <span className="block text-slate-400">Pressure</span>
              <span className="font-mono text-slate-900 font-bold">{pressVal.toFixed(2)} {pressUnit}</span>
            </div>
            <div>
              <span className="block text-slate-400">Temperature</span>
              <span className="font-mono text-slate-900 font-bold">{tempVal.toFixed(1)}{tempUnit}</span>
            </div>
            <div>
              <span className="block text-slate-400">Speed of Sound</span>
              <span className="font-mono text-slate-900 font-bold">{speedVal.toFixed(1)} {speedUnit}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AerodynamicsRightPanel() {
  const model = useAircraftStore((state) => state.model);
  const altitude = useUIStore((state) => state.engineeringAltitude);
  const userAoA = useUIStore((state) => state.engineeringAoA);
  const flowSpeed = useUIStore((state) => state.engineeringFlowSpeed);

  // Computations
  const llt = useMemo(() => solveLLT(model, userAoA, flowSpeed), [model, userAoA, flowSpeed]);
  const metrics = useMemo(() => calculateAeroMetrics(model, flowSpeed), [model, flowSpeed]);

  // Dynamic Aerodynamics Calculations based on Angle of Attack (AoA)
  const cL = llt.cL;
  const cD0 = metrics.referenceArea > 0 ? (metrics.wettedArea * 0.0055) / metrics.referenceArea : 0.02;
  const cD = cD0 + llt.cDi;
  const loD = cD > 0 ? cL / cD : 0;

  // Render SVG Lift Distribution Plot
  const renderAeroPlot = () => {
    if (!llt.yStations || llt.yStations.length === 0) return null;
    const w = 270;
    const h = 140;
    const padding = 25;

    const xMin = -llt.span / 2;
    const xMax = llt.span / 2;
    const yMax = Math.max(...llt.localClChord, 0.01) * 1.25;

    const toX = (val: number) => padding + ((val - xMin) / (xMax - xMin)) * (w - 2 * padding);
    const toY = (val: number) => h - padding - (val / yMax) * (h - 2 * padding);

    // Build SVG Path
    let pathD = '';
    llt.yStations.forEach((y, idx) => {
      const x = toX(y);
      const val = llt.localClChord[idx];
      const yVal = toY(val);
      if (idx === 0) {
        pathD += `M ${x} ${yVal}`;
      } else {
        pathD += ` L ${x} ${yVal}`;
      }
    });

    // Build Elliptic Lift Profile
    let ellipticPathD = '';
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const thetaVal = t * Math.PI;
      const yCoord = (llt.span / 2) * Math.cos(thetaVal);
      const xS = toX(yCoord);
      const val = yMax * 0.8 * Math.sin(thetaVal);
      const yS = toY(val);
      if (i === 0) {
        ellipticPathD += `M ${xS} ${yS}`;
      } else {
        ellipticPathD += ` L ${xS} ${yS}`;
      }
    }

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
        <rect width={w} height={h} fill="#f8fafc" />
        
        {/* Grid lines */}
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={w / 2} y1={padding} x2={w / 2} y2={h - padding} stroke="#e2e8f0" strokeDasharray="3 3" />

        {/* Elliptic Lift Profile */}
        <path d={ellipticPathD} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />

        {/* Calculated Lift Distribution */}
        <path d={pathD} fill="none" stroke="#10b981" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Labels */}
        <text x={w - padding} y={h - 10} fontSize={8} fill="#64748b" textAnchor="end" className="font-mono">Span</text>
        <text x={padding + 5} y={padding + 10} fontSize={8} fill="#64748b" className="font-mono">c·Cl (Lift)</text>
      </svg>
    );
  };

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-l border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Activity className="w-4 h-4 text-emerald-600" />
        <span>Aerodynamic Results</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Performance Gauges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-20">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Lift Coeff (CL)</span>
            <span className="text-xl font-black font-mono text-slate-800">{cL.toFixed(4)}</span>
            <span className="text-[9px] text-slate-400 font-medium">Induced lift coefficient</span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-20">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Drag Coeff (CD)</span>
            <span className="text-xl font-black font-mono text-slate-800">{cD.toFixed(4)}</span>
            <span className="text-[9px] text-slate-400 font-medium">Profile + Induced drag</span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-3 bg-emerald-50/40 border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">Aerodynamic Efficiency (L/D)</span>
            <span className="text-[9px] text-slate-500 block">Aerodynamic glide ratio</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-emerald-600">{loD.toFixed(2)}</span>
          </div>
        </div>

        {/* Lift Distribution Plot */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-700">Spanwise Lift Distribution</h4>
            <span className="text-[9px] bg-slate-100 border px-1.5 py-0.2 rounded text-slate-500 font-mono">LLT Model</span>
          </div>
          {renderAeroPlot()}
          <span className="text-[9px] text-slate-400 block leading-normal italic">
            Solid green line shows calculated load. Dashed line shows the ideal elliptic distribution for minimum induced drag.
          </span>
        </div>
      </div>
    </aside>
  );
}

// -------------------------------------------------------------
// 2. STABILITY WORKSPACE PANELS
// -------------------------------------------------------------

export function StabilityLeftPanel() {
  const userAoA = useUIStore((state) => state.engineeringAoA);
  const setUserAoA = useUIStore((state) => state.setEngineeringAoA);

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-r border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Sliders className="w-4 h-4 text-blue-600" />
        <span>Stability Parameters</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Reference AoA for Stability */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span>Trim Angle of Attack</span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {userAoA.toFixed(1)}°
            </span>
          </div>
          <input
            type="range"
            min={-5}
            max={15}
            step={0.5}
            value={userAoA}
            onChange={(e) => setUserAoA(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-650 leading-relaxed space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-500" /> Static Longitudinal Stability
          </h4>
          <p>
            An aircraft is statically stable if, when disturbed from its trim pitch state, it naturally generates pitching moments that act to restore the original angle of attack.
          </p>
          <p>
            This requires the center of gravity (CG) to be positioned <strong>forward</strong> of the aerodynamic neutral point (NP).
          </p>
        </div>
      </div>
    </aside>
  );
}

export function StabilityRightPanel() {
  const model = useAircraftStore((state) => state.model);
  const userAoA = useUIStore((state) => state.engineeringAoA);

  const stability = useMemo(() => calculateStability(model, userAoA), [model, userAoA]);

  const statusColors = {
    stable: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    marginal: 'text-amber-600 bg-amber-50 border-amber-200',
    unstable: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-l border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Compass className="w-4 h-4 text-blue-600" />
        <span>Stability Analysis</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Stability Status */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Stability Assessment</span>
          <div className={`border rounded-xl px-4 py-3 flex items-center justify-between font-bold ${statusColors[stability.stabilityStatus]}`}>
            <span className="text-xs uppercase tracking-wider">Aircraft is {stability.stabilityStatus}</span>
            <span className="text-base select-none">
              {stability.stabilityStatus === 'stable' ? '🟢' : stability.stabilityStatus === 'marginal' ? '🟡' : '🔴'}
            </span>
          </div>
        </div>

        {/* Static Margin & Neutral Point */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Static Margin</span>
              <span className="text-[9px] text-slate-400 block">% of Wing Mean Aerodynamic Chord (MAC)</span>
            </div>
            <span className="text-xl font-black font-mono text-slate-800">{(stability.staticMargin * 100).toFixed(1)}%</span>
          </div>

          <div className="h-px bg-slate-200 my-1" />

          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
            <div>
              <span className="block text-slate-400">Wing AC Location (X)</span>
              <span className="font-mono text-slate-900 font-bold">{stability.wingAcX.toFixed(2)} m</span>
            </div>
            <div>
              <span className="block text-slate-400">Tail AC Location (X)</span>
              <span className="font-mono text-slate-900 font-bold">{stability.tailAcX.toFixed(2)} m</span>
            </div>
            <div className="col-span-2 mt-1">
              <span className="block text-slate-400">Neutral Point X (NP)</span>
              <span className="font-mono text-slate-900 font-bold">{stability.neutralPointX.toFixed(2)} m</span>
            </div>
          </div>
        </div>

        {/* Pitch Trim Analysis */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-500" /> Pitch Trim Conditions
          </h4>
          <div className="space-y-1.5 text-[10px] text-slate-600">
            <div className="flex justify-between">
              <span>Required Elevator Deflection for Trim:</span>
              <span className="font-bold font-mono text-slate-900">{stability.trimDeflection.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Trim Angle of Attack (AoA):</span>
              <span className="font-bold font-mono text-slate-900">{stability.alphaTrim.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Tail Volume Coefficient (V_h):</span>
              <span className="font-bold font-mono text-slate-900">{stability.tailVolumeCoeff.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// -------------------------------------------------------------
// 3. PERFORMANCE WORKSPACE PANELS
// -------------------------------------------------------------

export function PerformanceLeftPanel() {
  const fuel = useUIStore((state) => state.performanceFuelMass);
  const setFuel = useUIStore((state) => state.setPerformanceFuelMass);

  const payload = useUIStore((state) => state.performancePayloadMass);
  const setPayload = useUIStore((state) => state.setPerformancePayloadMass);

  const throttle = useUIStore((state) => state.performanceThrottle);
  const setThrottle = useUIStore((state) => state.setPerformanceThrottle);

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-r border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Sliders className="w-4 h-4 text-amber-600" />
        <span>Performance Parameters</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Fuel Capacity slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span>Fuel Load</span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {fuel} kg
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={20000}
            step={100}
            value={fuel}
            onChange={(e) => setFuel(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-600"
          />
        </div>

        {/* Payload slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span>Payload Mass</span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {payload} kg
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={8000}
            step={50}
            value={payload}
            onChange={(e) => setPayload(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-600"
          />
        </div>

        {/* Throttle percentage */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-700 font-bold">
            <span>Cruise Throttle Setting</span>
            <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-extrabold text-[10px]">
              {throttle}%
            </span>
          </div>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={throttle}
            onChange={(e) => setThrottle(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-600"
          />
        </div>
      </div>
    </aside>
  );
}

export function PerformanceRightPanel() {
  const model = useAircraftStore((state) => state.model);
  const fuel = useUIStore((state) => state.performanceFuelMass);
  const payload = useUIStore((state) => state.performancePayloadMass);
  const throttle = useUIStore((state) => state.performanceThrottle);
  const units = useUIStore((state) => state.units);

  const metrics = useMemo(() => calculateAeroMetrics(model, 120), [model]);

  // Performance calculations
  const performance = useMemo(() => {
    const W = (metrics.estimatedEmptyWeight || 0) + fuel + payload; // gross takeoff weight in kg
    const S = Math.max(1.0, model.wings[0]?.span * (model.wings[0]?.rootChord + model.wings[0]?.tipChord) / 2 || 15.0);
    const CLmax = 1.6;
    const rho = 1.225; // SL density
    const g = 9.81;

    // Estimate engine thrust
    let totalThrustKn = 0;
    model.engines.forEach((eng) => {
      if (eng.visible) {
        const d = eng.diameter || 1.2;
        let factor = 75.0;
        if (eng.type === 'turbojet') factor = 90.0;
        else if (eng.type === 'propeller') factor = 50.0;
        else if (eng.type === 'edf') factor = 25.0;
        totalThrustKn += factor * d * d;
      }
    });
    if (totalThrustKn === 0) totalThrustKn = 120.0; // baseline if no visible engines

    const T = totalThrustKn * 1000 * (throttle / 100); // thrust in N

    // Takeoff roll: S_to = (1.44 * W^2) / (g * rho * S * CLmax * T)
    const takeoffRoll = (1.44 * W * W * g) / Math.max(1000, rho * S * CLmax * T);

    // Rate of Climb: (T - D) * V / W
    const D = 0.05 * 0.5 * rho * 80 * 80 * S; // approximate drag
    const rateOfClimb = Math.max(0.5, ((T - D) * 80) / (W * g));

    // Range (Breguet Range equation for turbojet/turbofan)
    // Range = (V / SFC) * (L/D) * ln(W_start / W_end)
    const SFC = 0.6 / 3600; // kg/N/s specific fuel consumption
    const LD = 15.5; // L/D efficiency ratio
    const V = 220; // cruise velocity (m/s)
    const range = (V / SFC) * LD * Math.log(W / (W - fuel)); // meters

    // Endurance: range / V
    const endurance = range / V / 3600; // hours

    return {
      takeoffRoll: Math.min(6000, Math.max(150, takeoffRoll)),
      rateOfClimb: Math.min(65, Math.max(2, rateOfClimb)),
      rangeKm: Math.round(range / 1000),
      enduranceHrs: Math.round(endurance * 10) / 10
    };
  }, [model, metrics, fuel, payload, throttle]);

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-l border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <LineChart className="w-4 h-4 text-amber-600" />
        <span>Performance Estimates</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Takeoff distance */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Takeoff Ground Roll</span>
          <span className="text-xl font-black font-mono text-slate-850">
            {units === 'imperial' ? `${Math.round(performance.takeoffRoll * 3.28084)} ft` : `${Math.round(performance.takeoffRoll)} m`}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Estimated runway distance to liftoff</span>
        </div>

        {/* Rate of climb */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Rate of Climb (RoC)</span>
          <span className="text-xl font-black font-mono text-slate-850">
            {units === 'imperial' ? `${Math.round(performance.rateOfClimb * 196.85)} ft/min` : `${performance.rateOfClimb.toFixed(1)} m/s`}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Maximum climb rate at sea level</span>
        </div>

        {/* Cruise Range */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Breguet Flight Range</span>
          <span className="text-xl font-black font-mono text-emerald-600">
            {units === 'imperial' ? `${Math.round(performance.rangeKm * 0.621371)} miles` : `${performance.rangeKm} km`}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Cruise range with selected fuel load</span>
        </div>

        {/* Endurance */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Loiter Endurance</span>
          <span className="text-xl font-black font-mono text-slate-850">{performance.enduranceHrs.toFixed(1)} hours</span>
          <span className="text-[9px] text-slate-400 font-medium">Maximum flight duration</span>
        </div>
      </div>
    </aside>
  );
}

// -------------------------------------------------------------
// 4. MASS WORKSPACE PANELS
// -------------------------------------------------------------

export function MassLeftPanel() {
  const model = useAircraftStore((state) => state.model);
  const metrics = useMemo(() => calculateAeroMetrics(model, 120), [model]);

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-r border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Sliders className="w-4 h-4 text-rose-600" />
        <span>Component Mass Breakdown</span>
      </div>

      <div className="p-4 space-y-3.5 text-xs">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Weight of Sub-Assemblies</span>
        <div className="space-y-2">
          {metrics.componentMasses?.map((comp: any) => (
            <div key={comp.id} className="border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg flex flex-col gap-1 shadow-sm">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>{comp.name}</span>
                <span className="font-mono text-slate-950 font-extrabold">{comp.mass} kg</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-450">
                <span>Type: {comp.type}</span>
                <span>Material: {comp.materialName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function MassRightPanel() {
  const model = useAircraftStore((state) => state.model);
  const fuel = useUIStore((state) => state.performanceFuelMass);
  const payload = useUIStore((state) => state.performancePayloadMass);
  const units = useUIStore((state) => state.units);

  const metrics = useMemo(() => calculateAeroMetrics(model, 120), [model]);

  const grossWeightVal = (metrics.estimatedEmptyWeight || 0) + fuel + payload;

  const cgX = metrics.centerOfGravity[0];
  const cgY = metrics.centerOfGravity[1];
  const cgZ = metrics.centerOfGravity[2];

  const weightFactor = units === 'imperial' ? 2.20462 : 1.0;
  const weightUnit = units === 'imperial' ? 'lbs' : 'kg';

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-l border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Scale className="w-4 h-4 text-rose-600" />
        <span>Weight & Balance</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Total Weight Summary */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-3 shadow-inner">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Empty Weight</span>
            </div>
            <span className="text-lg font-black font-mono text-slate-800">
              {Math.round((metrics.estimatedEmptyWeight || 0) * weightFactor)} {weightUnit}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-rose-800 font-extrabold uppercase tracking-wide block">Gross Takeoff Weight</span>
              <span className="text-[9px] text-slate-400 block">Empty Weight + Fuel + Payload</span>
            </div>
            <span className="text-xl font-black font-mono text-rose-600">
              {Math.round(grossWeightVal * weightFactor)} {weightUnit}
            </span>
          </div>
        </div>

        {/* Center of Gravity Coordinates */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-500" /> Center of Gravity Coordinates
          </h4>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-slate-600">
            <div>
              <span className="block text-slate-400">X (Aft)</span>
              <span className="font-mono text-slate-900 font-bold">{cgX.toFixed(3)} m</span>
            </div>
            <div>
              <span className="block text-slate-400">Y (Lateral)</span>
              <span className="font-mono text-slate-900 font-bold">{cgY.toFixed(3)} m</span>
            </div>
            <div>
              <span className="block text-slate-400">Z (Vertical)</span>
              <span className="font-mono text-slate-900 font-bold">{cgZ.toFixed(3)} m</span>
            </div>
          </div>
        </div>

        {/* Fuel fraction */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col justify-between h-20">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Fuel Mass Fraction</span>
          <span className="text-xl font-black font-mono text-slate-800">
            {((fuel / Math.max(1, grossWeightVal)) * 100).toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Ratio of fuel weight to gross weight</span>
        </div>
      </div>
    </aside>
  );
}

export function WorkspaceNavbar() {
  const activeWorkspace = useUIStore((state) => state.activeWorkspace) || 'design';
  const setActiveWorkspace = useUIStore((state) => state.setActiveWorkspace);

  const workspaces = [
    { id: 'design', label: 'DESIGN', desc: 'Aircraft Config', icon: Sliders, color: 'text-sky-600' },
    { id: 'geometry', label: 'GEOMETRY', desc: 'Detailed CAD', icon: Box, color: 'text-purple-600' },
    { id: 'aerodynamics', label: 'AERODYNAMICS', desc: 'Aero & CFD', icon: Wind, color: 'text-emerald-600' },
    { id: 'stability', label: 'STABILITY', desc: 'Static Margin & trim', icon: Compass, color: 'text-blue-600' },
    { id: 'performance', label: 'PERFORMANCE', desc: 'Range & Flight', icon: LineChart, color: 'text-amber-600' },
    { id: 'mass', label: 'MASS', desc: 'Weights & CG', icon: Scale, color: 'text-rose-600' },
  ] as const;

  return (
    <div className="h-10 bg-white border-b border-slate-200 px-6 flex items-center gap-1 select-none z-20 shadow-sm">
      {workspaces.map((ws) => {
        const Icon = ws.icon;
        const isActive = activeWorkspace === ws.id;
        return (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspace(ws.id)}
            className={`h-full px-4 flex items-center gap-2 border-b-2 text-[10px] font-black uppercase tracking-wider transition ${
              isActive
                ? 'border-sky-500 text-sky-600 bg-sky-50/20 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-bold'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${ws.color}`} />
            <span>{ws.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GeometryLeftPanel() {
  const showGrid = useUIStore((state) => state.showGrid);
  const toggleGrid = useUIStore((state) => state.toggleGrid);
  const showAxes = useUIStore((state) => state.showAxes);
  const toggleAxes = useUIStore((state) => state.toggleAxes);
  const showCG = useUIStore((state) => state.showCG);
  const toggleCG = useUIStore((state) => state.toggleCG);
  const showSections = useUIStore((state) => state.showSections);
  const toggleSections = useUIStore((state) => state.toggleSections);
  const showOrigin = useUIStore((state) => state.showOrigin);
  const toggleOrigin = useUIStore((state) => state.toggleOrigin);
  
  const tessellationQuality = useUIStore((state) => state.tessellationQuality);
  const setTessellationQuality = useUIStore((state) => state.setTessellationQuality);
  
  const shadingMode = useUIStore((state) => state.shadingMode);
  const setShadingMode = useUIStore((state) => state.setShadingMode);

  const analysisMode = useUIStore((state) => state.analysisMode) || 'none';
  const setAnalysisMode = useUIStore((state) => state.setAnalysisMode);

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-r border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Sliders className="w-4 h-4 text-purple-600" />
        <span>CAD Display Settings</span>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Shading Mode */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold block">Viewport Shading Mode</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'solid', label: 'Solid Mesh' },
              { id: 'wireframe', label: 'Wireframe' },
              { id: 'xray', label: 'X-Ray (Glass)' },
              { id: 'exploded', label: 'Exploded' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setShadingMode(mode.id as any)}
                className={`py-1.5 rounded-lg border text-[10px] font-bold transition ${
                  shadingMode === mode.id
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Analysis Heatmaps */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold block">3D Analysis Heatmaps</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'none', label: 'Default Shading' },
              { id: 'pressure', label: 'Pressure (Cp)' },
              { id: 'loading', label: 'Aero Loading' },
              { id: 'mass', label: 'Mass / Density' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAnalysisMode(mode.id as any)}
                className={`py-1.5 rounded-lg border text-[10px] font-bold transition ${
                  analysisMode === mode.id
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tessellation Quality */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold block">Tessellation Quality</label>
          <div className="grid grid-cols-4 gap-1">
            {['low', 'medium', 'high', 'ultra'].map((q) => (
              <button
                key={q}
                onClick={() => setTessellationQuality(q as any)}
                className={`py-1.5 rounded border text-[9px] font-bold uppercase transition ${
                  tessellationQuality === q
                    ? 'bg-purple-600 border-purple-600 text-white font-extrabold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 leading-normal block">
            Higher quality increases facet count for smoother lofts, which might impact rendering latency.
          </span>
        </div>

        <div className="h-px bg-slate-200" />

        {/* View toggles */}
        <div className="space-y-2">
          <label className="text-slate-700 font-bold block">Workspace Grid & Helpers</label>
          <div className="space-y-1.5">
            {[
              { label: 'Show Construction Grid', value: showGrid, onChange: toggleGrid },
              { label: 'Show Coordinate Axes', value: showAxes, onChange: toggleAxes },
              { label: 'Show Center of Gravity (CG)', value: showCG, onChange: toggleCG },
              { label: 'Show Segment Boundaries', value: showSections, onChange: toggleSections },
              { label: 'Show Origin Reference (0,0,0)', value: showOrigin, onChange: toggleOrigin },
            ].map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium py-0.5 select-none hover:text-slate-900 transition">
                <input
                  type="checkbox"
                  checked={opt.value}
                  onChange={opt.onChange}
                  className="rounded text-purple-600 focus:ring-purple-500 border-slate-300 w-3.5 h-3.5"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function GeometryRightPanel() {
  const model = useAircraftStore((state) => state.model);
  const units = useUIStore((state) => state.units);
  const metrics = useMemo(() => calculateAeroMetrics(model, 120), [model]);

  const cleanName = (model.name || 'aircraft').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

  const unitAreaLabel = units === 'imperial' ? 'sq ft' : 'm²';
  const unitVolLabel = units === 'imperial' ? 'cu ft' : 'm³';
  
  const areaVal = units === 'imperial' ? metrics.wettedArea * 10.7639 : metrics.wettedArea;
  const volVal = units === 'imperial' ? metrics.totalVolume * 35.3147 : metrics.totalVolume;

  const triggerExport = (format: 'step' | 'iges' | 'parasolid' | 'stl' | 'obj') => {
    const scene = (window as any).__THREE_SCENE__;
    if (!scene) {
      alert("Error: 3D Scene not initialized yet.");
      return;
    }
    
    switch (format) {
      case 'step':
        exportAircraftSTEP(scene, model, `${cleanName}.stp`);
        break;
      case 'iges':
        exportAircraftIGES(scene, model, `${cleanName}.igs`);
        break;
      case 'parasolid':
        exportAircraftParasolid(scene, model, `${cleanName}.x_t`);
        break;
      case 'stl':
        exportAircraftSTL(scene, `${cleanName}.stl`);
        break;
      case 'obj':
        exportAircraftOBJ(scene, `${cleanName}.obj`);
        break;
    }
  };

  return (
    <aside className="w-80 h-[calc(100vh-3rem-2.5rem-1.75rem)] bg-white border-l border-slate-200 flex flex-col select-none shadow-sm z-20 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-10">
        <Box className="w-4 h-4 text-purple-600" />
        <span>CAD Model Inspector</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* CAD Properties */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2.5 shadow-inner">
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Surface & Volume Geometry</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600 leading-relaxed">
            <div>
              <span className="block text-slate-400">Total Volume</span>
              <span className="font-mono text-slate-900 font-bold">{volVal.toFixed(2)} {unitVolLabel}</span>
            </div>
            <div>
              <span className="block text-slate-400">Wetted Area</span>
              <span className="font-mono text-slate-900 font-bold">{areaVal.toFixed(2)} {unitAreaLabel}</span>
            </div>
            <div>
              <span className="block text-slate-400">Reference Area</span>
              <span className="font-mono text-slate-900 font-bold">{(metrics.referenceArea * (units === 'imperial' ? 10.7639 : 1)).toFixed(2)} {unitAreaLabel}</span>
            </div>
            <div>
              <span className="block text-slate-400">Aspect Ratio</span>
              <span className="font-mono text-slate-900 font-bold">{metrics.aspectRatio}</span>
            </div>
          </div>
        </div>

        {/* CAD Solid & Mesh Exporter */}
        <div className="space-y-2.5 pt-1">
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">CAD Solid & Surface Export</span>
            <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded border border-sky-200">B-Rep</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => triggerExport('step')}
              className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-350 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center font-mono font-black text-sky-700 text-[9px] border border-sky-100 shadow-sm">STP</div>
                <div className="text-left">
                  <span className="font-bold text-slate-800 block text-[11px]">Export STEP Model</span>
                  <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">ISO B-Rep CAD format</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => triggerExport('iges')}
              className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-350 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center font-mono font-black text-indigo-700 text-[9px] border border-indigo-100 shadow-sm">IGS</div>
                <div className="text-left">
                  <span className="font-bold text-slate-800 block text-[11px]">Export IGES Surfaces</span>
                  <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">CFD/FEA mesh boundaries</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => triggerExport('parasolid')}
              className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-350 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center font-mono font-black text-teal-700 text-[9px] border border-teal-100 shadow-sm">X_T</div>
                <div className="text-left">
                  <span className="font-bold text-slate-800 block text-[11px]">Export Parasolid</span>
                  <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">SolidWorks/NX core kernel</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Tessellated Mesh Export</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200">Mesh</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => triggerExport('stl')}
              className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-350 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center font-mono font-black text-amber-700 text-[9px] border border-amber-100 shadow-sm">STL</div>
                <div className="text-left">
                  <span className="font-bold text-slate-800 block text-[11px]">Export STL Mesh</span>
                  <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">Triangulated printable mesh</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => triggerExport('obj')}
              className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-350 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center font-mono font-black text-purple-700 text-[9px] border border-purple-100 shadow-sm">OBJ</div>
                <div className="text-left">
                  <span className="font-bold text-slate-800 block text-[11px]">Export OBJ Mesh</span>
                  <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">Polygonal visual mesh</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
