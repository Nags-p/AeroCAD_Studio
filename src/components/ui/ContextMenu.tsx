'use client';

import React, { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Compass,
  Grid,
  Target,
  CircleDot,
  Layers,
  Settings,
  Plus,
  RefreshCw,
  Sliders
} from 'lucide-react';

export function ContextMenu() {
  const contextMenu = useUIStore((state) => state.contextMenu);
  const hideContextMenu = useUIStore((state) => state.hideContextMenu);

  const model = useAircraftStore((state) => state.model);
  const setSelected = useAircraftStore((state) => state.setSelected);
  const selectedId = useAircraftStore((state) => state.selectedId);
  const selectedType = useAircraftStore((state) => state.selectedType);
  
  const toggleVisibility = useAircraftStore((state) => state.toggleComponentVisibility);
  const toggleLock = useAircraftStore((state) => state.toggleComponentLock);
  const duplicateComponent = useAircraftStore((state) => state.duplicateComponent);
  const jumpToHistoryIndex = useAircraftStore((state) => state.jumpToHistoryIndex);

  const deleteFuselageSection = useAircraftStore((state) => state.deleteFuselageSection);
  const updateFuselage = useAircraftStore((state) => state.updateFuselage);
  const deleteWing = useAircraftStore((state) => state.deleteWing);
  const deleteTail = useAircraftStore((state) => state.deleteTail);
  const deleteEngine = useAircraftStore((state) => state.deleteEngine);

  const addFuselageSection = useAircraftStore((state) => state.addFuselageSection);
  const addWing = useAircraftStore((state) => state.addWing);
  const addTail = useAircraftStore((state) => state.addTail);
  const addEngine = useAircraftStore((state) => state.addEngine);

  const toggleGrid = useUIStore((state) => state.toggleGrid);
  const showGrid = useUIStore((state) => state.showGrid);
  const toggleCG = useUIStore((state) => state.toggleCG);
  const showCG = useUIStore((state) => state.showCG);
  const toggleSections = useUIStore((state) => state.toggleSections);
  const showSections = useUIStore((state) => state.showSections);
  const toggleAxes = useUIStore((state) => state.toggleAxes);
  const toggleOrigin = useUIStore((state) => state.toggleOrigin);
  const showOrigin = useUIStore((state) => state.showOrigin);
  const showAxes = useUIStore((state) => state.showAxes);
  const setCameraView = useUIStore((state) => state.setCameraView);
  const setShadingMode = useUIStore((state) => state.setShadingMode);
  const openModal = useUIStore((state) => state.openModal);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };
    const handleScroll = () => hideContextMenu();

    if (contextMenu.isOpen) {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu.isOpen, hideContextMenu]);

  if (!contextMenu.isOpen) return null;

  let name = 'Component';
  let isVisible = true;
  let isLocked = false;

  if (contextMenu.targetType === 'fuselage') {
    name = model.fuselage.name;
    isVisible = model.fuselage.visible !== false;
    isLocked = model.fuselage.locked === true;
  } else if (contextMenu.targetType === 'wing') {
    const wing = model.wings.find((w) => w.id === contextMenu.targetId);
    name = wing ? wing.name : 'Wing';
    isVisible = wing ? wing.visible !== false : true;
    isLocked = wing ? wing.locked === true : false;
  } else if (contextMenu.targetType === 'tail') {
    const tail = model.tails.find((t) => t.id === contextMenu.targetId);
    name = tail ? tail.name : 'Tail Fin';
    isVisible = tail ? tail.visible !== false : true;
    isLocked = tail ? tail.locked === true : false;
  } else if (contextMenu.targetType === 'engine') {
    const eng = model.engines.find((e) => e.id === contextMenu.targetId);
    name = eng ? eng.name : 'Engine Nacelle';
    isVisible = eng ? eng.visible !== false : true;
    isLocked = eng ? eng.locked === true : false;
  } else if (contextMenu.targetType === 'section') {
    const sec = model.fuselage.sections.find((s) => s.id === contextMenu.targetId);
    name = sec ? sec.name : 'Cross-Section';
  } else if (contextMenu.targetType === 'history') {
    name = `Stage #${(contextMenu.targetData?.index ?? 0) + 1}`;
  }

  const triggerAction = (action: () => void) => {
    action();
    hideContextMenu();
  };

  const x = Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 240 : contextMenu.x);
  const y = Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 380 : contextMenu.y);

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-[1000] w-56 backdrop-blur-md bg-slate-900/90 text-slate-100 border border-slate-700/80 shadow-2xl rounded-xl p-1.5 select-none font-sans text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
        <span className="truncate">{name}</span>
        {contextMenu.targetType !== 'canvas' && (
          <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded-sm capitalize border border-slate-700 font-mono">
            {contextMenu.targetType}
          </span>
        )}
      </div>

      {(contextMenu.targetType === 'fuselage' ||
        contextMenu.targetType === 'wing' ||
        contextMenu.targetType === 'tail' ||
        contextMenu.targetType === 'engine') && (
        <>
          <button
            onClick={() => triggerAction(() => setSelected(contextMenu.targetId, contextMenu.targetType as any))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Select Assembly</span>
          </button>

          <button
            onClick={() => triggerAction(() => toggleVisibility(contextMenu.targetId!))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            {isVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Hide Component</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Show Component</span>
              </>
            )}
          </button>

          <button
            onClick={() => triggerAction(() => toggleLock(contextMenu.targetId!))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-sky-400" />
                <span>Unlock Parameters</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lock Parameters</span>
              </>
            )}
          </button>

          {contextMenu.targetType !== 'fuselage' && (
            <button
              onClick={() => triggerAction(() => duplicateComponent(contextMenu.targetId!, contextMenu.targetType as any))}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Duplicate Component</span>
            </button>
          )}

          <div className="border-t border-slate-800 my-1" />

          {contextMenu.targetType === 'fuselage' && (
            <button
              onClick={() => triggerAction(() => {
                if (confirm('Are you sure you want to delete the complete fuselage?')) {
                  updateFuselage({ visible: false, sections: [] });
                }
              })}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Fuselage</span>
            </button>
          )}

          {contextMenu.targetType === 'wing' && (
            <button
              onClick={() => triggerAction(() => deleteWing(contextMenu.targetId!))}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Wing</span>
            </button>
          )}

          {contextMenu.targetType === 'tail' && (
            <button
              onClick={() => triggerAction(() => deleteTail(contextMenu.targetId!))}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Tail</span>
            </button>
          )}

          {contextMenu.targetType === 'engine' && (
            <button
              onClick={() => triggerAction(() => deleteEngine(contextMenu.targetId!))}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Engine</span>
            </button>
          )}
        </>
      )}

      {contextMenu.targetType === 'section' && (
        <>
          <button
            onClick={() => triggerAction(() => setSelected(contextMenu.targetId, 'section'))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Select Section</span>
          </button>

          <button
            onClick={() => triggerAction(() => openModal('sketcher', contextMenu.targetId))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Edit 2D Sketch</span>
          </button>

          {model.fuselage.sections.length > 2 && (
            <>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => triggerAction(() => deleteFuselageSection(contextMenu.targetId!))}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition text-left text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete Section</span>
              </button>
            </>
          )}
        </>
      )}

      {contextMenu.targetType === 'history' && (
        <>
          <button
            onClick={() => triggerAction(() => jumpToHistoryIndex(contextMenu.targetData?.index ?? 0))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Restore to Stage</span>
          </button>
        </>
      )}

      {contextMenu.targetType === 'canvas' && (
        <>
          <div className="px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Quick Add
          </div>
          <button
            onClick={() => triggerAction(() => addWing('mid'))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Wing Component</span>
          </button>
          <button
            onClick={() => triggerAction(() => addEngine())}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Engine Nacelle</span>
          </button>
          <button
            onClick={() => triggerAction(() => addTail())}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Tail Assembly</span>
          </button>
          <button
            onClick={() => triggerAction(() => addFuselageSection())}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Fuselage Section</span>
          </button>

          <div className="border-t border-slate-800 my-1" />

          <div className="px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            Viewport Camera
          </div>
          <div className="grid grid-cols-2 gap-1 p-1">
            <button
              onClick={() => triggerAction(() => setCameraView('iso'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-center"
            >
              Isometric
            </button>
            <button
              onClick={() => triggerAction(() => setCameraView('top'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-center"
            >
              Top View
            </button>
            <button
              onClick={() => triggerAction(() => setCameraView('front'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-center"
            >
              Front
            </button>
            <button
              onClick={() => triggerAction(() => setCameraView('side'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-center"
            >
              Side View
            </button>
          </div>

          <div className="border-t border-slate-800 my-1" />

          <div className="px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            Rendering Mode
          </div>
          <div className="grid grid-cols-3 gap-1 p-1">
            <button
              onClick={() => triggerAction(() => setShadingMode('solid'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-[10px] text-center"
            >
              Solid
            </button>
            <button
              onClick={() => triggerAction(() => setShadingMode('wireframe'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-[10px] text-center"
            >
              Wire
            </button>
            <button
              onClick={() => triggerAction(() => setShadingMode('xray'))}
              className="py-1 rounded bg-slate-800 hover:bg-sky-600/40 hover:text-sky-200 text-[10px] text-center"
            >
              X-Ray
            </button>
          </div>

          <div className="border-t border-slate-800 my-1" />

          <div className="px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            Show / Hide Helpers
          </div>
          <button
            onClick={() => triggerAction(() => toggleGrid())}
            className="flex items-center justify-between w-full px-2.5 py-1 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              <span>Floor Grid</span>
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${showGrid ? 'bg-sky-500' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => triggerAction(() => toggleCG())}
            className="flex items-center justify-between w-full px-2.5 py-1 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Center of Gravity</span>
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${showCG ? 'bg-sky-500' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => triggerAction(() => toggleSections())}
            className="flex items-center justify-between w-full px-2.5 py-1 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <span className="flex items-center gap-2">
              <CircleDot className="w-3.5 h-3.5 text-slate-400" />
              <span>Section Rings</span>
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${showSections ? 'bg-sky-500' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => triggerAction(() => {
              toggleOrigin();
              toggleAxes();
            })}
            className="flex items-center justify-between w-full px-2.5 py-1 rounded-lg hover:bg-sky-600/30 hover:text-sky-200 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Origin Axes</span>
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${showOrigin || showAxes ? 'bg-sky-500' : 'bg-slate-700'}`} />
          </button>
        </>
      )}
    </div>
  );
}
