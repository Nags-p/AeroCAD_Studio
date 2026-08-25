'use client';

import React, { useState } from 'react';
import {
  Plane,
  Download,
  Upload,
  Plus,
  Undo2,
  Redo2,
  Ruler,
  Sliders,
  Sparkles,
  Library,
  ChevronDown,
  Home,
  Check,
  FilePlus,
  Copy,
  LogOut,
  Wind,
  Cloud,
  Compass,
  LineChart,
  Hammer,
  Layers,
  Settings,
  HelpCircle,
  BookOpen,
  Info,
  Key,
  Edit2,
  ShieldAlert,
  FileText,
  Lock,
  Scale
} from 'lucide-react';
import { useAircraftStore } from '@/store/useAircraftStore';
import { useUIStore } from '@/store/useUIStore';
import { useFileStore } from '@/store/useFileStore';

export function TopToolbar() {
  const model = useAircraftStore((state) => state.model);
  const canUndo = useAircraftStore((state) => state.canUndo);
  const canRedo = useAircraftStore((state) => state.canRedo);
  const undo = useAircraftStore((state) => state.undo);
  const redo = useAircraftStore((state) => state.redo);
  const addWing = useAircraftStore((state) => state.addWing);
  const addTail = useAircraftStore((state) => state.addTail);
  const addEngine = useAircraftStore((state) => state.addEngine);
  const addFuselageSection = useAircraftStore((state) => state.addFuselageSection);
  const updateModelName = useAircraftStore((state) => state.updateModelName);
  const updateFuselage = useAircraftStore((state) => state.updateFuselage);

  const units = useUIStore((state) => state.units);
  const setUnits = useUIStore((state) => state.setUnits);
  const openModal = useUIStore((state) => state.openModal);
  const setView = useUIStore((state) => state.setView);
  const tessellationQuality = useUIStore((state) => state.tessellationQuality);
  const setTessellationQuality = useUIStore((state) => state.setTessellationQuality);
  const analysisMode = useUIStore((state) => state.analysisMode);
  const setAnalysisMode = useUIStore((state) => state.setAnalysisMode);
  const setEngineeringTab = useUIStore((state) => state.setEngineeringTab);
  const showGrid = useUIStore((state) => state.showGrid);
  const toggleGrid = useUIStore((state) => state.toggleGrid);
  const setHelpTab = useUIStore((state) => state.setHelpTab);
  const setDatabaseTab = useUIStore((state) => state.setDatabaseTab);

  const flowSimulationActive = useUIStore((state) => state.flowSimulationActive);
  const toggleFlowSimulation = useUIStore((state) => state.toggleFlowSimulation);
  const flowColormapMode = useUIStore((state) => state.flowColormapMode);
  const setFlowColormapMode = useUIStore((state) => state.setFlowColormapMode);
  const showFlowParticles = useUIStore((state) => state.showFlowParticles);
  const showFlowStreamlines = useUIStore((state) => state.showFlowStreamlines);
  const toggleFlowParticles = useUIStore((state) => state.toggleFlowParticles);
  const toggleFlowStreamlines = useUIStore((state) => state.toggleFlowStreamlines);
  const flowVelocity = useUIStore((state) => state.flowVelocity);
  const setFlowVelocity = useUIStore((state) => state.setFlowVelocity);

  const activeFileId = useFileStore((state) => state.activeFileId);
  const files = useFileStore((state) => state.files);
  const activeFile = files.find((f) => f.id === activeFileId);
  const createNewFile = useFileStore((state) => state.createNewFile);
  const renameFile = useFileStore((state) => state.renameFile);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleStartRename = () => {
    setTempName(activeFile ? activeFile.name : model.name || 'Temporary Design');
    setIsEditingName(true);
  };

  const handleFinishRename = () => {
    setIsEditingName(false);
    const cleaned = tempName.trim();
    if (!cleaned) return;
    updateModelName(cleaned);
    if (activeFileId) {
      renameFile(activeFileId, cleaned);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-30 relative shadow-sm">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('dashboard')}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-950 flex items-center gap-1 border border-slate-200 shadow-sm"
          title="Back to Files Dashboard"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 bg-sky-600 px-2.5 py-1 rounded text-white font-bold text-sm shadow">
          <Plane className="w-4 h-4 text-white stroke-[2.5]" />
          <span>TurboDESiM Aero</span>
        </div>

        <span className="text-slate-300">/</span>

        <div className="flex items-center gap-1.5">
          {isEditingName ? (
            <input
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={handleKeyDown}
              className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-sky-400 max-w-[200px] outline-none shadow-[0_0_0_2.5px_rgba(56,189,248,0.18)]"
            />
          ) : (
            <button
              onClick={handleStartRename}
              className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:border-slate-350 px-2 py-0.5 rounded border border-slate-200 max-w-[180px] truncate transition flex items-center gap-1 group select-none cursor-pointer"
              title="Click to rename design"
            >
              <span>{activeFile ? activeFile.name : model.name || 'Temporary Design'}</span>
              <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 transition" />
            </button>
          )}
          <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5 font-mono select-none">
            <Check className="w-3 h-3 text-emerald-500" /> Saved
          </span>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Menu Bar Dropdowns */}
        <nav className="flex items-center gap-1 text-xs text-slate-700 font-medium relative">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('file')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>File</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    createNewFile("Untitled Design", "blank");
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <FilePlus className="w-3.5 h-3.5 text-slate-500" /> New Blank Design
                </button>
                <button
                  onClick={() => { openModal('presets'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> New from Preset...
                </button>
                <button
                  onClick={() => {
                    if (activeFile) {
                      const name = `${activeFile.name} (Copy)`;
                      const newFile = {
                        id: `file-${Date.now()}`,
                        name,
                        lastModified: new Date().toLocaleString(),
                        model: JSON.parse(JSON.stringify(model)),
                      };
                      const updatedFiles = [newFile, ...files];
                      useFileStore.setState({ files: updatedFiles, activeFileId: newFile.id });
                      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
                      if (useFileStore.getState().driveAccessToken && useFileStore.getState().drivePassphrase) {
                        useFileStore.getState().uploadFileToDrive(newFile);
                      }
                      useAircraftStore.getState().loadJSONModel(newFile.model);
                    }
                    setActiveDropdown(null);
                  }}
                  disabled={!activeFile}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 ${
                    activeFile ? 'text-slate-800' : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" /> Save Design Copy
                </button>

                <div className="my-1 border-t border-slate-200" />

                <button
                  onClick={() => { openModal('export'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-sky-600 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Export CAD (STEP, IGES, Parasolid, STL, OBJ)...
                </button>

                <div className="my-1 border-t border-slate-200" />

                <button
                  onClick={() => { setView('dashboard'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" /> Exit to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Add Component Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('add')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Add Component</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'add' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => { updateFuselage({ visible: true }); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" /> Standard Fuselage
                </button>
                <button
                  onClick={() => { addFuselageSection(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" /> Fuselage Section
                </button>
                <div className="py-1 border-y border-slate-100 my-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Wing</div>
                  <button
                    onClick={() => { addWing('high'); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" /> High Wing (Cargo/Bush)
                  </button>
                  <button
                    onClick={() => { addWing('mid'); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" /> Mid Wing (Fighter/Canard)
                  </button>
                  <button
                    onClick={() => { addWing('low'); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" /> Low Wing (Airliner/GA)
                  </button>
                </div>
                <button
                  onClick={() => { addTail(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" /> Tail Assembly
                </button>
                <button
                  onClick={() => { addEngine(); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" /> Engine Nacelle
                </button>
              </div>
            )}
          </div>

          {/* Tools Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('tools')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => { openModal('sketcher'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-600" /> 2D Cross-Section Sketcher
                </button>
                <button
                  onClick={() => {
                    openModal('database');
                    setDatabaseTab('airfoils');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Library className="w-3.5 h-3.5 text-emerald-600" /> NACA Airfoil Library
                </button>
                <button
                  onClick={() => { openModal('measurements'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Ruler className="w-3.5 h-3.5 text-amber-600" /> Aerodynamic Mass & CG Analysis
                </button>

                <div className="my-1 border-t border-slate-200" />

                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aerospace Engineering</div>
                <button
                  onClick={() => { setEngineeringTab('atmosphere'); openModal('engineering'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Cloud className="w-3.5 h-3.5 text-sky-600" /> Standard Atmosphere
                </button>
                <button
                  onClick={() => { setEngineeringTab('stability'); openModal('engineering'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-600" /> Stability & Trim Analysis
                </button>
                <button
                  onClick={() => { setEngineeringTab('aerodynamics'); openModal('engineering'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <LineChart className="w-3.5 h-3.5 text-emerald-600" /> Wing Aerodynamics (LLT)
                </button>
                <button
                  onClick={() => { setEngineeringTab('structures'); openModal('engineering'); setActiveDropdown(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-150 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Hammer className="w-3.5 h-3.5 text-purple-600" /> Wing Spar Bending (FEA)
                </button>

                <div className="my-1 border-t border-slate-200" />

                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">3D Analysis Views</div>
                <button
                  onClick={() => { setAnalysisMode('none'); setActiveDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 ${
                    analysisMode === 'none' ? 'text-sky-700 font-bold bg-sky-50' : 'text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> CAD Shading (Default)
                </button>
                <button
                  onClick={() => { setAnalysisMode('pressure'); setActiveDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 ${
                    analysisMode === 'pressure' ? 'text-sky-700 font-bold bg-sky-50' : 'text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Surface Pressure (Cp)
                </button>
                <button
                  onClick={() => { setAnalysisMode('loading'); setActiveDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 ${
                    analysisMode === 'loading' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Aerodynamic Loading
                </button>
                <button
                  onClick={() => { setAnalysisMode('mass'); setActiveDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 ${
                    analysisMode === 'mass' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Mass / Density Heatmap
                </button>

                <div className="my-1 border-t border-slate-200" />

                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wind Tunnel CFD</div>
                <button
                  onClick={() => { toggleFlowSimulation(); setActiveDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 ${
                    flowSimulationActive ? 'text-sky-700 font-bold bg-sky-50' : 'text-slate-800'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5 text-sky-500" />
                  {flowSimulationActive ? '⏹ Stop Wind Tunnel' : '▶ Start Wind Tunnel'}
                </button>

                {flowSimulationActive && (
                  <>
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase w-10">Speed:</span>
                      <input
                        type="range"
                        min="20"
                        max="350"
                        step="5"
                        value={flowVelocity}
                        onChange={(e) => setFlowVelocity(parseInt(e.target.value))}
                        className="flex-1 accent-sky-600 cursor-pointer h-1"
                      />
                      <span className="text-sky-600 font-mono text-[10px] font-extrabold w-[42px] text-right">{flowVelocity}m/s</span>
                    </div>

                    <div className="px-3 py-1 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase w-10">Color:</span>
                      <button
                        onClick={() => setFlowColormapMode('velocity')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                          flowColormapMode === 'velocity' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Velocity
                      </button>
                      <button
                        onClick={() => setFlowColormapMode('pressure')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                          flowColormapMode === 'pressure' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Pressure
                      </button>
                    </div>

                    <div className="px-3 py-1 flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-600 hover:text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={showFlowStreamlines}
                          onChange={toggleFlowStreamlines}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3 h-3 cursor-pointer"
                        />
                        Streamlines
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-600 hover:text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={showFlowParticles}
                          onChange={toggleFlowParticles}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3 h-3 cursor-pointer"
                        />
                        Bubbles
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Database Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('database_menu')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Database</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'database_menu' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    openModal('database');
                    setDatabaseTab('materials');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-605" /> Materials Catalog
                </button>
                <button
                  onClick={() => {
                    openModal('database');
                    setDatabaseTab('airfoils');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Library className="w-3.5 h-3.5 text-emerald-600" /> NACA Airfoil Library
                </button>
                <div className="my-1 border-t border-slate-200" />
                <button
                  disabled
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-slate-300 cursor-not-allowed"
                >
                  <Ruler className="w-3.5 h-3.5 text-slate-250" /> Standard Spar Sections (Soon)
                </button>
                <button
                  disabled
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 text-slate-300 cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-250" /> Payload & Avionics (Soon)
                </button>
              </div>
            )}
          </div>

          {/* Settings Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('settings_menu')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Settings</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'settings_menu' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    openModal('settings');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" /> Application Settings...
                </button>
                <div className="my-1 border-t border-slate-200" />
                <button
                  onClick={() => {
                    setUnits(units === 'metric' ? 'imperial' : 'metric');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center justify-between text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-405" /> Toggle Unit System
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 px-1 bg-slate-100 rounded">
                    {units === 'metric' ? 'Metric' : 'Imperial'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    toggleGrid();
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center justify-between text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-slate-405" /> Viewport Grid Lines
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 px-1 bg-slate-100 rounded">
                    {showGrid ? 'On' : 'Off'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('help_menu')}
              className="px-2.5 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Help</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {activeDropdown === 'help_menu' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    setHelpTab('about');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500" /> About TurboDESiM Aero
                </button>
                <div className="my-1 border-t border-slate-205" />
                <button
                  onClick={() => {
                    setHelpTab('docs');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Quick Start Docs
                </button>
                <button
                  onClick={() => {
                    setHelpTab('keys');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Keyboard Shortcuts
                </button>
                <div className="my-1 border-t border-slate-200" />
                <button
                  onClick={() => {
                    setHelpTab('disclaimer');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Safety Disclaimer
                </button>
                <button
                  onClick={() => {
                    setHelpTab('eula');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> License (EULA)
                </button>
                <button
                  onClick={() => {
                    setHelpTab('privacy');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" /> Privacy Policy
                </button>
                <button
                  onClick={() => {
                    setHelpTab('terms');
                    openModal('about');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2 text-slate-800"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" /> Terms of Service
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Center: Quick Action Buttons */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition ${
            canUndo ? 'text-slate-700 hover:bg-white' : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition ${
            canRedo ? 'text-slate-700 hover:bg-white' : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-300 my-auto mx-1" />

        <button
          onClick={() => openModal('presets')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 text-sky-700 font-medium border border-slate-200 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Presets</span>
        </button>

        <button
          onClick={() => {
            openModal('database');
            setDatabaseTab('airfoils');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 text-emerald-700 font-medium border border-slate-200 transition shadow-sm"
        >
          <Library className="w-3.5 h-3.5 text-emerald-600" />
          <span>Airfoils</span>
        </button>

        <button
          onClick={() => openModal('measurements')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 text-amber-700 font-medium border border-slate-200 transition shadow-sm"
        >
          <Ruler className="w-3.5 h-3.5 text-amber-600" />
          <span>Analysis</span>
        </button>

      </div>

      {/* Right: Units & Export CTA */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200 text-xs">
          <button
            onClick={() => setUnits('metric')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              units === 'metric' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Metric (m)
          </button>
          <button
            onClick={() => setUnits('imperial')}
            className={`px-2 py-0.5 rounded font-bold transition ${
              units === 'imperial' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Imperial (ft)
          </button>
        </div>

        {/* Smoothness / Tessellation Toggle */}
        <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200 text-xs gap-0.5">
          <span className="text-[10px] text-slate-400 font-bold px-1 select-none">Smoothness:</span>
          <button
            onClick={() => setTessellationQuality('low')}
            className={`px-1.5 py-0.5 rounded transition font-medium ${
              tessellationQuality === 'low' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Coarse (Lowest poly, highest FPS)"
          >
            Coarse
          </button>
          <button
            onClick={() => setTessellationQuality('medium')}
            className={`px-1.5 py-0.5 rounded transition font-medium ${
              tessellationQuality === 'medium' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Medium (Standard quality)"
          >
            Med
          </button>
          <button
            onClick={() => setTessellationQuality('high')}
            className={`px-1.5 py-0.5 rounded transition font-medium ${
              tessellationQuality === 'high' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Fine (High quality, smooth curved edges)"
          >
            Fine
          </button>
          <button
            onClick={() => setTessellationQuality('ultra')}
            className={`px-1.5 py-0.5 rounded transition font-medium ${
              tessellationQuality === 'ultra' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Ultra (Extremely smooth curves, high poly count)"
          >
            Ultra
          </button>
        </div>

        <button
          onClick={() => openModal('export')}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-md text-xs shadow transition"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export CAD</span>
        </button>
      </div>
    </header>
  );
}
