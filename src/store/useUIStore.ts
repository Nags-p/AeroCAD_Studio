import { create } from 'zustand';
import { UnitSystem } from '@/types/aircraft';

export type CameraPresetView = 'perspective' | 'top' | 'front' | 'side' | 'iso';
export type VisualShadingMode = 'solid' | 'wireframe' | 'xray' | 'exploded';
export type ActiveModalType = 'sketcher' | 'airfoil' | 'presets' | 'measurements' | 'export' | 'import' | null;

interface UIStoreState {
  cameraView: CameraPresetView;
  shadingMode: VisualShadingMode;
  explodedOffset: number; // 0 to 1
  showGrid: boolean;
  showAxes: boolean;
  showCG: boolean;
  units: UnitSystem;
  activeModal: ActiveModalType;
  activeSketchSectionId: string | null;

  setCameraView: (view: CameraPresetView) => void;
  setShadingMode: (mode: VisualShadingMode) => void;
  setExplodedOffset: (val: number) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleCG: () => void;
  setUnits: (units: UnitSystem) => void;
  openModal: (modal: ActiveModalType, sectionId?: string | null) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  cameraView: 'iso',
  shadingMode: 'solid',
  explodedOffset: 0,
  showGrid: true,
  showAxes: true,
  showCG: true,
  units: 'metric',
  activeModal: null,
  activeSketchSectionId: null,

  setCameraView: (view) => set({ cameraView: view }),
  setShadingMode: (mode) => set({ shadingMode: mode }),
  setExplodedOffset: (val) => set({ explodedOffset: val }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),
  toggleCG: () => set((state) => ({ showCG: !state.showCG })),
  setUnits: (units) => set({ units }),
  openModal: (modal, sectionId = null) => set({ activeModal: modal, activeSketchSectionId: sectionId }),
  closeModal: () => set({ activeModal: null, activeSketchSectionId: null }),
}));
