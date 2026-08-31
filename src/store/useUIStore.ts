import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UnitSystem } from '@/types/aircraft';

export type CameraPresetView = 'perspective' | 'top' | 'front' | 'side' | 'iso';
export type VisualShadingMode = 'solid' | 'wireframe' | 'xray' | 'exploded';
export type ActiveModalType = 'sketcher' | 'airfoil' | 'presets' | 'measurements' | 'export' | 'import' | 'engineering' | 'database' | 'settings' | 'about' | 'cloud_sync' | null;
export type AnalysisModeType = 'none' | 'pressure' | 'loading' | 'mass';
export type EngineeringTabType = 'atmosphere' | 'stability' | 'aerodynamics' | 'structures';

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
  activeEngineeringTab: EngineeringTabType;
  activeHelpTab: 'about' | 'docs' | 'keys' | 'security' | 'disclaimer' | 'eula' | 'privacy' | 'terms';
  activeDatabaseTab: 'materials' | 'airfoils' | 'sections' | 'payload';
  viewportTheme: 'studio' | 'dark' | 'white' | 'sky';
  activeWorkspace: 'design' | 'geometry' | 'aerodynamics' | 'performance' | 'mass' | 'stability';
  engineeringAltitude: number;
  engineeringAoA: number;
  engineeringFlowSpeed: number;
  engineeringGLoad: number;
  engineeringSparMatId: string;
  performanceFuelMass: number;
  performancePayloadMass: number;
  performanceThrottle: number;

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
  setEngineeringTab: (tab: EngineeringTabType) => void;
  setHelpTab: (tab: 'about' | 'docs' | 'keys' | 'security' | 'disclaimer' | 'eula' | 'privacy' | 'terms') => void;
  setDatabaseTab: (tab: 'materials' | 'airfoils' | 'sections' | 'payload') => void;
  setViewportTheme: (theme: 'studio' | 'dark' | 'white' | 'sky') => void;
  setActiveWorkspace: (ws: 'design' | 'geometry' | 'aerodynamics' | 'performance' | 'mass' | 'stability') => void;
  setEngineeringAltitude: (alt: number) => void;
  setEngineeringAoA: (aoa: number) => void;
  setEngineeringFlowSpeed: (speed: number) => void;
  setEngineeringGLoad: (g: number) => void;
  setEngineeringSparMatId: (id: string) => void;
  setPerformanceFuelMass: (fuel: number) => void;
  setPerformancePayloadMass: (payload: number) => void;
  setPerformanceThrottle: (throttle: number) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
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
      activeEngineeringTab: 'atmosphere',
      activeHelpTab: 'about',
      activeDatabaseTab: 'materials',
      viewportTheme: 'studio',
      activeWorkspace: 'design',
      engineeringAltitude: 1500,
      engineeringAoA: 4.5,
      engineeringFlowSpeed: 60,
      engineeringGLoad: 2.5,
      engineeringSparMatId: 'aluminum',
      performanceFuelMass: 1000,
      performancePayloadMass: 500,
      performanceThrottle: 85,

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
      setEngineeringTab: (tab) => set({ activeEngineeringTab: tab }),
      setHelpTab: (tab) => set({ activeHelpTab: tab }),
      setDatabaseTab: (tab) => set({ activeDatabaseTab: tab }),
      setViewportTheme: (theme) => set({ viewportTheme: theme }),
      setActiveWorkspace: (ws) => {
        const updates: any = { activeWorkspace: ws };
        if (ws === 'aerodynamics') {
          updates.flowSimulationActive = true;
          updates.analysisMode = 'none';
        } else {
          updates.flowSimulationActive = false;
        }
        if (ws === 'mass') {
          updates.showCG = true;
        }
        set(updates);
      },
      setEngineeringAltitude: (alt) => set({ engineeringAltitude: alt }),
      setEngineeringAoA: (aoa) => set({ engineeringAoA: aoa }),
      setEngineeringFlowSpeed: (speed) => set({ engineeringFlowSpeed: speed }),
      setEngineeringGLoad: (g) => set({ engineeringGLoad: g }),
      setEngineeringSparMatId: (id) => set({ engineeringSparMatId: id }),
      setPerformanceFuelMass: (fuel) => set({ performanceFuelMass: fuel }),
      setPerformancePayloadMass: (payload) => set({ performancePayloadMass: payload }),
      setPerformanceThrottle: (throttle) => set({ performanceThrottle: throttle }),
    }),
    {
      name: 'aerocad_ui_settings',
      partialize: (state) => ({
        units: state.units,
        showGrid: state.showGrid,
        showAxes: state.showAxes,
        showCG: state.showCG,
        showSections: state.showSections,
        showOrigin: state.showOrigin,
        tessellationQuality: state.tessellationQuality,
        shadingMode: state.shadingMode,
        viewportTheme: state.viewportTheme,
        activeWorkspace: state.activeWorkspace,
        engineeringAltitude: state.engineeringAltitude,
        engineeringAoA: state.engineeringAoA,
        engineeringFlowSpeed: state.engineeringFlowSpeed,
        engineeringGLoad: state.engineeringGLoad,
        engineeringSparMatId: state.engineeringSparMatId,
        performanceFuelMass: state.performanceFuelMass,
        performancePayloadMass: state.performancePayloadMass,
        performanceThrottle: state.performanceThrottle,
      }),
      skipHydration: true,
    }
  )
);
