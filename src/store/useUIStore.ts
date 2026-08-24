import { create } from 'zustand';
import { UnitSystem } from '@/types/aircraft';

export type CameraPresetView = 'perspective' | 'top' | 'front' | 'side' | 'iso';
export type VisualShadingMode = 'solid' | 'wireframe' | 'xray' | 'exploded';
export type ActiveModalType = 'sketcher' | 'airfoil' | 'presets' | 'measurements' | 'export' | 'import' | null;
export type AnalysisModeType = 'none' | 'pressure' | 'loading' | 'mass';

export interface ContextMenuConfig {
  isOpen: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'fuselage' | 'section' | 'wing' | 'tail' | 'engine' | 'canvas' | 'history' | null;
  targetData?: any;
}

interface UIStoreState {
  cameraView: CameraPresetView;
  shadingMode: VisualShadingMode;
  explodedOffset: number; // 0 to 1
  showGrid: boolean;
  showAxes: boolean;
  showCG: boolean;
  showSections: boolean;
  showOrigin: boolean;
  tessellationQuality: 'low' | 'medium' | 'high' | 'ultra';
  units: UnitSystem;
  activeModal: ActiveModalType;
  activeSketchSectionId: string | null;
  currentView: 'dashboard' | 'editor';
  contextMenu: ContextMenuConfig;

  setCameraView: (view: CameraPresetView) => void;
  setShadingMode: (mode: VisualShadingMode) => void;
  setExplodedOffset: (val: number) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleCG: () => void;
  toggleSections: () => void;
  toggleOrigin: () => void;
  setTessellationQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  setUnits: (units: UnitSystem) => void;
  openModal: (modal: ActiveModalType, sectionId?: string | null) => void;
  closeModal: () => void;
  setView: (view: 'dashboard' | 'editor') => void;
  showContextMenu: (x: number, y: number, targetId: string | null, targetType: ContextMenuConfig['targetType'], targetData?: any) => void;
  hideContextMenu: () => void;
  flowSimulationActive: boolean;
  flowColormapMode: 'velocity' | 'pressure' | 'none';
  toggleFlowSimulation: () => void;
  setFlowColormapMode: (mode: 'velocity' | 'pressure' | 'none') => void;
  showFlowParticles: boolean;
  showFlowStreamlines: boolean;
  toggleFlowParticles: () => void;
  toggleFlowStreamlines: () => void;
  flowVelocity: number;
  setFlowVelocity: (v: number) => void;
  analysisMode: AnalysisModeType;
  setAnalysisMode: (mode: AnalysisModeType) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  cameraView: 'iso',
  shadingMode: 'solid',
  explodedOffset: 0,
  showGrid: true,
  showAxes: true,
  showCG: true,
  showSections: true,
  showOrigin: true,
  tessellationQuality: 'medium',
  units: 'metric',
  activeModal: null,
  activeSketchSectionId: null,
  currentView: 'dashboard',
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null,
  },
  flowSimulationActive: false,
  flowColormapMode: 'velocity',
  showFlowParticles: true,
  showFlowStreamlines: true,
  flowVelocity: 120,
  analysisMode: 'none',

  setCameraView: (view) => set({ cameraView: view }),
  setShadingMode: (mode) => set({ shadingMode: mode }),
  setExplodedOffset: (val) => set({ explodedOffset: val }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),
  toggleCG: () => set((state) => ({ showCG: !state.showCG })),
  toggleSections: () => set((state) => ({ showSections: !state.showSections })),
  toggleOrigin: () => set((state) => ({ showOrigin: !state.showOrigin })),
  setTessellationQuality: (quality) => set({ tessellationQuality: quality }),
  setUnits: (units) => set({ units }),
  openModal: (modal, sectionId = null) => set({ activeModal: modal, activeSketchSectionId: sectionId }),
  closeModal: () => set({ activeModal: null, activeSketchSectionId: null }),
  setView: (view) => set({ currentView: view }),
  showContextMenu: (x, y, targetId, targetType, targetData = null) =>
    set({
      contextMenu: {
        isOpen: true,
        x,
        y,
        targetId,
        targetType,
        targetData,
      },
    }),
  hideContextMenu: () =>
    set((state) => ({
      contextMenu: {
        ...state.contextMenu,
        isOpen: false,
      },
    })),
  toggleFlowSimulation: () => set((state) => ({ flowSimulationActive: !state.flowSimulationActive })),
  setFlowColormapMode: (mode) => set({ flowColormapMode: mode }),
  toggleFlowParticles: () => set((state) => ({ showFlowParticles: !state.showFlowParticles })),
  toggleFlowStreamlines: () => set((state) => ({ showFlowStreamlines: !state.showFlowStreamlines })),
  setFlowVelocity: (v) => set({ flowVelocity: v }),
  setAnalysisMode: (mode) => set({ analysisMode: mode }),
}));
