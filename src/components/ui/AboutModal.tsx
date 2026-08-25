'use client';

import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, Key, Info, Zap, Github } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

type HelpTabType = 'about' | 'docs' | 'keys';

export function AboutModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  
  const activeTab = useUIStore((state) => state.activeHelpTab);
  const setActiveTab = useUIStore((state) => state.setHelpTab);

  if (activeModal !== 'about') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[70vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5 font-bold text-slate-700">
            <HelpCircle className="w-5 h-5 text-slate-600 stroke-[2.2]" />
            <span className="text-sm font-extrabold tracking-wider uppercase">Help & Documentation</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sub-tab selection sidebar */}
          <div className="w-48 bg-slate-50 border-r border-slate-200 p-3 flex flex-col gap-1.5 select-none">
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'about'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'docs'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Quick Start Docs</span>
            </button>

            <button
              onClick={() => setActiveTab('keys')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'keys'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Keyboard Keys</span>
            </button>
          </div>

          {/* Main content display */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
            
            {/* TAB 1: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-6 text-slate-700 text-xs leading-relaxed max-w-none">
                {/* Header branding */}
                <div className="text-center space-y-1 pb-4 border-b border-slate-100 select-none">
                  <h2 className="text-xl font-black text-sky-700">TurboDESiM Aero</h2>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Parametric Aircraft Design & Engineering Platform
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 font-mono">Version 1.0.0</div>
                </div>

                <div className="space-y-4">
                  <p>
                    TurboDESiM Aero is a browser-based parametric aircraft design and engineering platform developed to simplify the early-stage conceptualization, configuration, analysis, and documentation of aircraft.
                  </p>
                  <p>
                    The platform combines <strong className="font-bold">parametric aircraft geometry, 3D visualization, aerodynamic estimation, structural assessment, weight calculations, and CAD-ready geometry generation</strong> into a unified engineering workspace.
                  </p>
                  <p>
                    Instead of building aircraft geometry manually across multiple disconnected tools, TurboDESiM Aero allows engineers to define and modify an aircraft through meaningful aerodynamic and structural parameters while maintaining a consistent digital model.
                  </p>

                  <h3 className="text-sm font-extrabold text-slate-900 pt-2 border-b border-slate-100 pb-1">What You Can Do</h3>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>✈️</span> Parametric Aircraft Configuration
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Build aircraft configurations using dedicated components for fuselage and cross-section definition, wing geometry and placement, horizontal and vertical tail assemblies, engine nacelles, and propulsion configuration. Changes propagate dynamically through the design model.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>📐</span> 3D Aircraft Visualization
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Visualize the aircraft directly in the browser. The viewport provides multiple visualization modes including solid rendering, wireframe, X-ray, exploded configuration, and standard orthographic (top, front, side) and isometric views.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🌬️</span> Aerodynamic Analysis
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Evaluate lift and drag coefficients, lift-to-drag ratios, angle-of-attack response, spanwise lift distributions, and drag contributions. Quickly compare configurations before committing to high-fidelity CFD or wind-tunnel testing.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🏗️</span> Structural Assessment
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Run wing bending assessments, distributed aerodynamic loading calculations, shear force and bending moment estimations, tip deflection sizing, and load response visualization.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>⚖️</span> Weight & Balance
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Estimate components weight, structural and propulsion weight, useful payload, center of gravity (CG) location, and overall weight distribution.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🧩</span> Parametric Design Workflow
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Perfect for concept generation, configuration studies, design-space exploration, preliminary sizing, and rapid prototyping in an educational or startup setting.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>📦</span> CAD & Geometry Export
                      </h4>
                      <p className="text-slate-600 mt-1 pl-5">
                        Export fully parametric aircraft geometry to conventional CAD environments (STEP/IGES) for downstream detailed design and engineering workflows.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 pt-2 border-b border-slate-100 pb-1">Design Philosophy</h3>
                  <p className="text-slate-600">
                    TurboDESiM Aero is built around one principle:
                  </p>
                  <blockquote className="border-l-4 border-sky-500 pl-4 py-1 bg-slate-50 rounded-r font-medium text-slate-700 italic">
                    "Make aircraft design faster, more parametric, and more accessible."
                  </blockquote>
                  <p>
                    Traditional design requires separate specialized tools. TurboDESiM Aero unites these activities in a single browser-based workspace: **Concept → Configuration → Geometry → Analysis → Optimization → CAD**.
                  </p>

                  <h3 className="text-sm font-extrabold text-slate-900 pt-2 border-b border-slate-100 pb-1">Engineering Technology</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                    <li><strong className="text-slate-805">3D Geometry Engine:</strong> Interactive WebGL-based Three.js visualization.</li>
                    <li><strong className="text-slate-805">Aerodynamics:</strong> Discrete Fourier Collocation Lifting-Line methods for rapid design feedback.</li>
                    <li><strong className="text-slate-805">Structural Analysis:</strong> Cantilever box-spar bending and load-stress assessments.</li>
                    <li><strong className="text-slate-805">Parametric Geometry:</strong> Real-time propagation of configurable geometric relationships.</li>
                    <li><strong className="text-slate-805">CAD Export:</strong> High-fidelity NURBS boundary representation STEP and IGES model generation.</li>
                  </ul>

                  <h3 className="text-sm font-extrabold text-slate-900 pt-2 border-b border-slate-100 pb-1">Data & Design Storage</h3>
                  <p>
                    TurboDESiM Aero supports local design storage and optional secure cloud synchronization. Where cloud synchronization is active, your design data is protected using **client-side encryption** before it leaves your device.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">🛡️ Privacy by Design</h5>
                    <ul className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                      <li className="flex items-center gap-1.5">✓ AES-256-GCM encryption</li>
                      <li className="flex items-center gap-1.5">✓ Client-side encryption</li>
                      <li className="flex items-center gap-1.5">✓ Passphrase-based protection</li>
                      <li className="flex items-center gap-1.5">✓ Passphrase is never uploaded</li>
                    </ul>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 pt-2 border-b border-slate-100 pb-1">Who Is TurboDESiM Aero For?</h3>
                  <p>
                    TurboDESiM Aero is intended for aerospace engineers, aircraft designers, UAV developers, research teams, students, and startups looking to rapidly build, iterate, and compare configurations.
                  </p>

                  <h3 className="text-sm font-extrabold text-slate-900 pt-2 border-b border-slate-100 pb-1">Engineering Disclaimer</h3>
                  <p className="text-[11px] text-slate-500 italic bg-amber-50/50 border border-amber-100 p-3 rounded-lg leading-relaxed">
                    TurboDESiM Aero is intended primarily for <strong>conceptual and preliminary engineering analysis</strong>. Results should be independently verified before being used for detailed design, manufacturing, flight certification, safety-critical decisions, or regulatory compliance.
                  </p>
                </div>

                {/* Footer copyright */}
                <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 select-none">
                  <strong className="text-slate-500 font-bold block">Developed by DESiM Innovations (OPC) Private Limited</strong>
                  Licensed under the Apache License 2.0.
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENTATION */}
            {activeTab === 'docs' && (
              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1.5 select-none">Quick Start Guide</h4>
                
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong className="text-sky-850 font-bold block mb-1">1. Creating Components</strong>
                    Use the <strong>"Add Component"</strong> menu to add wings, fuselages, tail stabilizers, or engine nacelles to the tree. Customize their spans, sweeps, dihedrals, or positions in the properties panel.
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong className="text-sky-850 font-bold block mb-1">2. Sizing Materials</strong>
                    Select components and assign materials (Alclad Aluminum, Carbon Fiber, Sitka Spruce) in the properties dropdown to update empty weights, CG calculations, and structural stress thresholds.
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong className="text-sky-850 font-bold block mb-1">3. Running Solver Tools</strong>
                    Navigate to <strong>"Tools"</strong> to evaluate wing aerodynamics using the lifting-line solver (elliptical loading shape) or calculate spar shear forces, moment, and safety margins under custom G-loadings.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: KEYBOARD SHORTCUTS */}
            {activeTab === 'keys' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider select-none">Workspace Keyboard Keys</h4>
                
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-sans font-bold">
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2 text-right">Key Binding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-800">
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Undo Action</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Ctrl + Z</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Redo Action</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Ctrl + Y</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Open Airfoil Library</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">A</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Close Active Modal</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Escape</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Orbit Camera rotation</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Left Mouse Click + Drag</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Pan Camera translation</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Right Mouse Click + Drag</kbd></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
