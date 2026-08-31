'use client';

import React, { useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileCode,
  Box,
  Layers,
  Cpu,
  Compass,
  HardDrive,
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import {
  exportAircraftJSON,
  exportAircraftSTEP,
  exportAircraftIGES,
  exportAircraftParasolid,
  exportAircraftSTL,
  exportAircraftOBJ,
  exportAircraftGLTF,
} from '@/engine/export/cadExporter';

export function ExportImportModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const model = useAircraftStore((state) => state.model);
  const loadJSONModel = useAircraftStore((state) => state.loadJSONModel);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (activeModal !== 'export' && activeModal !== 'import') return null;

  const isImport = activeModal === 'import';
  const cleanName = (model.name || 'aircraft').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

  const handleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && parsed.fuselage) {
          loadJSONModel(parsed);
          closeModal();
        } else {
          alert('Invalid ThermoDESiM Aero project JSON file structure.');
        }
      } catch {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-sky-700">
            {isImport ? <Upload className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            <span>{isImport ? 'Open / Import ThermoDESiM Aero Model' : 'Export Aircraft CAD Model'}</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {isImport ? (
            <div className="space-y-4 text-center py-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <Upload className="w-10 h-10 mx-auto text-sky-600" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Select ThermoDESiM Aero JSON Project File</h4>
                <p className="text-xs text-slate-500">
                  Load parametric geometry specs directly into studio memory.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleJSONUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow transition"
              >
                Browse JSON File...
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Professional CAD Solid & Surface Formats (Instant Export)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* STEP Export (.stp / .step) */}
                <div
                  onClick={() => {
                    const scene = (window as any).__THREE_SCENE__;
                    exportAircraftSTEP(scene, model, `${cleanName}.stp`);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-400 cursor-pointer transition flex flex-col justify-between space-y-2 group shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sky-800">
                      <Cpu className="w-4 h-4 text-sky-600" /> STEP (.stp)
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-sky-600 bg-sky-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                      ISO 10303 AP214 / AP242
                    </span>
                    <p className="text-slate-600 text-[11px] mt-1.5 leading-snug">
                      Topological B-Rep model for KOMPAS-3D, SolidWorks, CATIA, NX, Fusion 360, FreeCAD.
                    </p>
                  </div>
                  <button className="text-sky-700 font-bold text-left group-hover:underline text-xs pt-1">
                    Export STEP (.stp) →
                  </button>
                </div>

                {/* IGES Export (.igs / .iges) */}
                <div
                  onClick={() => {
                    const scene = (window as any).__THREE_SCENE__;
                    exportAircraftIGES(scene, model, `${cleanName}.igs`);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 hover:border-indigo-400 cursor-pointer transition flex flex-col justify-between space-y-2 group shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-indigo-800">
                      <Compass className="w-4 h-4 text-indigo-600" /> IGES (.igs)
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                      ANSI Y14.26M v5.3
                    </span>
                    <p className="text-slate-600 text-[11px] mt-1.5 leading-snug">
                      Aerospace standard surface & wireframe CAD format for ANSYS, Mastercam, and CFD.
                    </p>
                  </div>
                  <button className="text-indigo-700 font-bold text-left group-hover:underline text-xs pt-1">
                    Export IGES (.igs) →
                  </button>
                </div>

                {/* Parasolid Export (.x_t) */}
                <div
                  onClick={() => {
                    const scene = (window as any).__THREE_SCENE__;
                    exportAircraftParasolid(scene, model, `${cleanName}.x_t`);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 hover:border-teal-400 cursor-pointer transition flex flex-col justify-between space-y-2 group shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-teal-800">
                      <HardDrive className="w-4 h-4 text-teal-600" /> Parasolid (.x_t)
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-teal-600 bg-teal-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                      Siemens Parasolid Schema
                    </span>
                    <p className="text-slate-600 text-[11px] mt-1.5 leading-snug">
                      Native kernel format for Siemens NX, SolidWorks, Solid Edge, Onshape, and SpaceClaim.
                    </p>
                  </div>
                  <button className="text-teal-700 font-bold text-left group-hover:underline text-xs pt-1">
                    Export Parasolid (.x_t) →
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-100 pb-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mesh, Visualization & Project Files
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* STL Export */}
                <div
                  onClick={() => {
                    const scene = (window as any).__THREE_SCENE__;
                    if (scene) exportAircraftSTL(scene, `${cleanName}.stl`);
                    else exportAircraftJSON(model);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Box className="w-4 h-4 text-sky-600" /> 3D STL Mesh (.stl)
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Binary/ASCII triangular mesh standard for 3D printing and CFD solvers.
                    </p>
                  </div>
                  <button className="text-sky-700 font-bold text-left group-hover:underline text-xs">
                    Export STL →
                  </button>
                </div>

                {/* OBJ Export */}
                <div
                  onClick={() => {
                    const scene = (window as any).__THREE_SCENE__;
                    if (scene) exportAircraftOBJ(scene, `${cleanName}.obj`);
                    else exportAircraftJSON(model);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Layers className="w-4 h-4 text-purple-600" /> Wavefront OBJ (.obj)
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Universal 3D geometry format with surface normals and component groups.
                    </p>
                  </div>
                  <button className="text-purple-700 font-bold text-left group-hover:underline text-xs">
                    Export OBJ →
                  </button>
                </div>

                {/* glTF Export */}
                <div
                  onClick={() => {
                    const scene = (window as any).__THREE_SCENE__;
                    if (scene) exportAircraftGLTF(scene, `${cleanName}.glb`);
                    else exportAircraftJSON(model);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Box className="w-4 h-4 text-emerald-600" /> glTF / GLB (.glb)
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Modern PBR 3D format for web viewers, AR/VR, Blender, and game engines.
                    </p>
                  </div>
                  <button className="text-emerald-700 font-bold text-left group-hover:underline text-xs">
                    Export GLB →
                  </button>
                </div>

                {/* Parametric JSON Export */}
                <div
                  onClick={() => {
                    exportAircraftJSON(model);
                    closeModal();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <FileCode className="w-4 h-4 text-amber-600" /> Parametric JSON (.json)
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Lossless raw math specification for re-editing in ThermoDESiM Aero.
                    </p>
                  </div>
                  <button className="text-amber-700 font-bold text-left group-hover:underline text-xs">
                    Export JSON →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
