'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  Box,
  Wind,
  Settings,
  CircleDot,
  Sliders
} from 'lucide-react';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';

export function LeftSidebar() {
  const model = useAircraftStore((state) => state.model);
  const selectedId = useAircraftStore((state) => state.selectedId);
  const setSelected = useAircraftStore((state) => state.setSelected);
  const toggleVisibility = useAircraftStore((state) => state.toggleComponentVisibility);
  const toggleLock = useAircraftStore((state) => state.toggleComponentLock);

  const addFuselageSection = useAircraftStore((state) => state.addFuselageSection);
  const deleteFuselageSection = useAircraftStore((state) => state.deleteFuselageSection);

  const addWing = useAircraftStore((state) => state.addWing);
  const deleteWing = useAircraftStore((state) => state.deleteWing);

  const addTail = useAircraftStore((state) => state.addTail);
  const deleteTail = useAircraftStore((state) => state.deleteTail);

  const addEngine = useAircraftStore((state) => state.addEngine);
  const deleteEngine = useAircraftStore((state) => state.deleteEngine);

  const openModal = useUIStore((state) => state.openModal);

  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({
    fuselage: true,
    sections: true,
    wings: true,
    tails: true,
    engines: true,
  });

  const toggleNode = (node: string) => {
    setOpenNodes((prev) => ({ ...prev, [node]: !prev[node] }));
  };

  return (
    <aside className="w-72 h-[calc(100vh-3rem-1.75rem)] bg-white border-r border-slate-200 flex flex-col select-none shadow-sm z-20">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>Scene Tree Graph</span>
        </div>
      </div>

      {/* Component Tree View */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
        {/* 1. Fuselage Component */}
        <div className="rounded border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div
            onClick={() => setSelected(model.fuselage.id, 'fuselage')}
            className={`flex items-center justify-between p-2 cursor-pointer transition ${
              selectedId === model.fuselage.id
                ? 'bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode('fuselage');
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                {openNodes.fuselage ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <Box className="w-3.5 h-3.5 text-sky-600" />
              <span>{model.fuselage.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(model.fuselage.id);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Toggle Visibility"
              >
                {model.fuselage.visible ? <Eye className="w-3.5 h-3.5 text-slate-600" /> : <EyeOff className="w-3.5 h-3.5 text-red-500" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(model.fuselage.id);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Lock Component"
              >
                {model.fuselage.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Fuselage Stations Sub-tree */}
          {openNodes.fuselage && (
            <div className="pl-6 pr-2 py-1.5 space-y-1 bg-slate-50/70 border-t border-slate-200">
              <div className="flex justify-between items-center py-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Cross-Sections</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addFuselageSection();
                  }}
                  className="flex items-center gap-1 text-[10px] text-sky-700 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
                  title="Add New Fuselage Cross-Section Station"
                >
                  <Plus className="w-3 h-3" /> Add Section
                </button>
              </div>

              {model.fuselage.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  onClick={() => setSelected(sec.id, 'section')}
                  className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                    selectedId === sec.id ? 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-3 h-3 text-sky-600" />
                    <span>Station {idx + 1} ({sec.name})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('sketcher', sec.id);
                      }}
                      className="p-1 text-sky-600 hover:bg-white rounded"
                      title="2D Sketch Cross-Section"
                    >
                      <Sliders className="w-3 h-3" />
                    </button>

                    {model.fuselage.sections.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFuselageSection(sec.id);
                        }}
                        className="p-1 text-red-500 hover:bg-white rounded"
                        title="Delete Section Station"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Wings Component Tree */}
        <div className="rounded border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Wind className="w-3.5 h-3.5 text-emerald-600" />
              <span>Wing Components</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addWing();
              }}
              className="flex items-center gap-1 text-[10px] text-emerald-700 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
              title="Add New Wing"
            >
              <Plus className="w-3 h-3" /> Add Wing
            </button>
          </div>

          <div className="p-1 space-y-1">
            {model.wings.map((w) => (
              <div
                key={w.id}
                onClick={() => setSelected(w.id, 'wing')}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                  selectedId === w.id ? 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">{w.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono font-bold uppercase border border-slate-200">
                    {w.mountConfig || (w.rootPos[2] > 0.3 ? 'HIGH' : w.rootPos[2] < -0.2 ? 'LOW' : 'MID')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(w.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Toggle Visibility"
                  >
                    {w.visible ? <Eye className="w-3 h-3 text-slate-600" /> : <EyeOff className="w-3 h-3 text-red-500" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWing(w.id);
                    }}
                    className="p-1 text-red-500 hover:bg-slate-100 rounded"
                    title="Delete Wing"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Tail Assembly Tree */}
        <div className="rounded border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Settings className="w-3.5 h-3.5 text-amber-600" />
              <span>Tail Assembly</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addTail();
              }}
              className="flex items-center gap-1 text-[10px] text-amber-700 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
              title="Add Tail Component"
            >
              <Plus className="w-3 h-3" /> Add Tail
            </button>
          </div>

          <div className="p-1 space-y-1">
            {model.tails.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t.id, 'tail')}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                  selectedId === t.id ? 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{t.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(t.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Toggle Visibility"
                  >
                    {t.visible ? <Eye className="w-3 h-3 text-slate-600" /> : <EyeOff className="w-3 h-3 text-red-500" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTail(t.id);
                    }}
                    className="p-1 text-red-500 hover:bg-slate-100 rounded"
                    title="Delete Tail"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Engine Nacelles Tree */}
        <div className="rounded border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Box className="w-3.5 h-3.5 text-purple-600" />
              <span>Engine Nacelles</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addEngine();
              }}
              className="flex items-center gap-1 text-[10px] text-purple-700 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
              title="Add Engine Nacelle"
            >
              <Plus className="w-3 h-3" /> Add Engine
            </button>
          </div>

          <div className="p-1 space-y-1">
            {model.engines.map((eng) => (
              <div
                key={eng.id}
                onClick={() => setSelected(eng.id, 'engine')}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                  selectedId === eng.id ? 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">{eng.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 font-mono font-bold uppercase border border-purple-200">
                    {eng.attachToWing !== false && model.wings.length > 0 ? 'WING MOUNTED' : 'FUSELAGE'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(eng.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Toggle Visibility"
                  >
                    {eng.visible ? <Eye className="w-3 h-3 text-slate-600" /> : <EyeOff className="w-3 h-3 text-red-500" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEngine(eng.id);
                    }}
                    className="p-1 text-red-500 hover:bg-slate-100 rounded"
                    title="Delete Engine"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </aside>
  );
}
