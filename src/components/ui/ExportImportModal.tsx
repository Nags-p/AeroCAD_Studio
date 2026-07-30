'use client';

import React, { useRef } from 'react';
import { X, Download, Upload, FileCode, Box, Layers } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import {
  exportAircraftJSON,
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
          alert('Invalid AeroCAD project JSON file structure.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-sky-700">
            {isImport ? <Upload className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            <span>{isImport ? 'Open / Import AeroCAD Model' : 'Export Aircraft CAD Model'}</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isImport ? (
            <div className="space-y-4 text-center py-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <Upload className="w-10 h-10 mx-auto text-sky-600" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Select AeroCAD JSON Project File</h4>
                <p className="text-xs text-slate-500">Load parametric geometry specs directly into studio memory.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* STL Export */}
              <div
                onClick={() => {
                  const scene = (window as any).__THREE_SCENE__;
                  if (scene) exportAircraftSTL(scene, `${(model.name || 'aircraft').toLowerCase().replace(/\s+/g, '_')}.stl`);
                  else exportAircraftJSON(model);
                  closeModal();
                }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 cursor-pointer transition flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center gap-2 font-bold text-sky-700">
                  <Box className="w-4 h-4" /> 3D STL Mesh (.stl)
                </div>
                <p className="text-slate-500 text-[11px]">ASCII / Binary 3D mesh standard format for 3D printing and CFD solvers.</p>
                <button className="text-sky-700 font-bold text-left group-hover:underline">Export STL →</button>
              </div>

              {/* OBJ Export */}
              <div
                onClick={() => {
                  const scene = (window as any).__THREE_SCENE__;
                  if (scene) exportAircraftOBJ(scene, `${(model.name || 'aircraft').toLowerCase().replace(/\s+/g, '_')}.obj`);
                  else exportAircraftJSON(model);
                  closeModal();
                }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center gap-2 font-bold text-purple-700">
                  <Layers className="w-4 h-4" /> Wavefront OBJ (.obj)
                </div>
                <p className="text-slate-500 text-[11px]">Universal 3D geometry file with normals and surface groups.</p>
                <button className="text-purple-700 font-bold text-left group-hover:underline">Export OBJ →</button>
              </div>

              {/* glTF Export */}
              <div
                onClick={() => {
                  const scene = (window as any).__THREE_SCENE__;
                  if (scene) exportAircraftGLTF(scene, `${(model.name || 'aircraft').toLowerCase().replace(/\s+/g, '_')}.glb`);
                  else exportAircraftJSON(model);
                  closeModal();
                }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <Box className="w-4 h-4" /> glTF / GLB (.glb)
                </div>
                <p className="text-slate-500 text-[11px]">Modern PBR 3D format for web viewers, AR/VR, and Blender.</p>
                <button className="text-emerald-700 font-bold text-left group-hover:underline">Export GLB →</button>
              </div>

              {/* Parametric JSON Export */}
              <div
                onClick={() => {
                  exportAircraftJSON(model);
                  closeModal();
                }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center gap-2 font-bold text-amber-700">
                  <FileCode className="w-4 h-4" /> Parametric JSON (.json)
                </div>
                <p className="text-slate-500 text-[11px]">Lossless raw math specification for re-editing in AeroCAD Studio.</p>
                <button className="text-amber-700 font-bold text-left group-hover:underline">Export JSON →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
