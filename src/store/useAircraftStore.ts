import { create } from 'zustand';
import { AircraftModel, FuselageSection, WingComponent, TailComponent, EngineComponent, GearComponent } from '@/types/aircraft';
import { AIRCRAFT_PRESETS } from '@/engine/presets/aircraftPresets';

interface AircraftStoreState {
  model: AircraftModel;
  selectedId: string | null;
  selectedType: 'fuselage' | 'section' | 'wing' | 'tail' | 'engine' | 'gear' | null;

  // History stack for Undo/Redo
  history: AircraftModel[];
  historyIndex: number;

  // Actions
  setSelected: (id: string | null, type: 'fuselage' | 'section' | 'wing' | 'tail' | 'engine' | 'gear' | null) => void;
  updateFuselage: (params: Partial<AircraftModel['fuselage']>) => void;
  updateFuselageSection: (sectionId: string, params: Partial<FuselageSection>) => void;
  addFuselageSection: () => void;
  deleteFuselageSection: (sectionId: string) => void;

  updateWing: (wingId: string, params: Partial<WingComponent>) => void;
  addWing: () => void;
  deleteWing: (wingId: string) => void;

  updateTail: (tailId: string, params: Partial<TailComponent>) => void;
  addTail: () => void;
  deleteTail: (tailId: string) => void;

  updateEngine: (engineId: string, params: Partial<EngineComponent>) => void;
  addEngine: () => void;
  deleteEngine: (engineId: string) => void;

  updateGear: (params: Partial<GearComponent>) => void;

  toggleComponentVisibility: (id: string) => void;
  toggleComponentLock: (id: string) => void;

  loadPreset: (presetKey: string) => void;
  loadJSONModel: (jsonModel: AircraftModel) => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const initialModel = AIRCRAFT_PRESETS.delta_strike || AIRCRAFT_PRESETS.commercial;

export const useAircraftStore = create<AircraftStoreState>((set, get) => {
  const pushState = (newModel: AircraftModel) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newModel)));
    if (newHistory.length > 50) newHistory.shift();

    set({
      model: newModel,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  };

  return {
    model: JSON.parse(JSON.stringify(initialModel)),
    selectedId: 'sec-1',
    selectedType: 'section',
    history: [JSON.parse(JSON.stringify(initialModel))],
    historyIndex: 0,
    canUndo: false,
    canRedo: false,

    setSelected: (id, type) => set({ selectedId: id, selectedType: type }),

    updateFuselage: (params) => {
      const model = get().model;
      const newModel: AircraftModel = {
        ...model,
        fuselage: { ...model.fuselage, ...params },
      };
      pushState(newModel);
    },

    updateFuselageSection: (sectionId, params) => {
      const model = get().model;
      // Strict single-section update by exact sectionId
      const sections = model.fuselage.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...params } : sec
      );

      const newFuselage = {
        ...model.fuselage,
        sections,
      };

      pushState({ ...model, fuselage: newFuselage });
    },

    addFuselageSection: () => {
      const model = get().model;
      const count = model.fuselage.sections.length;
      const newSec: FuselageSection = {
        id: `sec-${Date.now()}`,
        name: `Section ${count + 1}`,
        xPos: 0.6,
        width: model.fuselage.radius,
        height: model.fuselage.radius,
        nExp: 2.0,
        shapeType: 'super_ellipse',
        yOffset: 0,
        zOffset: 0,
      };
      const sections = [...model.fuselage.sections, newSec];
      pushState({ ...model, fuselage: { ...model.fuselage, sections } });
    },

    deleteFuselageSection: (sectionId) => {
      const model = get().model;
      if (model.fuselage.sections.length <= 2) return;
      const sections = model.fuselage.sections.filter((sec) => sec.id !== sectionId);
      pushState({ ...model, fuselage: { ...model.fuselage, sections } });
    },

    updateWing: (wingId, params) => {
      const model = get().model;
      const wings = model.wings.map((w) => (w.id === wingId ? { ...w, ...params } : w));
      pushState({ ...model, wings });
    },

    addWing: () => {
      const model = get().model;
      const newWing: WingComponent = {
        id: `wing-${Date.now()}`,
        name: `Auxiliary Wing ${model.wings.length + 1}`,
        visible: true,
        locked: false,
        span: 12.0,
        rootChord: 2.5,
        tipChord: 1.0,
        sweep: 15,
        dihedral: 2,
        twist: 0,
        rootThickness: 10,
        tipThickness: 8,
        rootCamber: 1,
        tipCamber: 0,
        airfoilName: 'NACA 0012',
        rootPos: [0, 0, 0],
        color: '#0284C7',
        winglets: { enabled: false, height: 1.0, root: 0.8, tip: 0.3, sweep: 30.0, cant: 15.0, filletRadius: 0.5 },
      };
      const wings = [...model.wings, newWing];
      pushState({ ...model, wings });
    },

    deleteWing: (wingId) => {
      const model = get().model;
      if (model.wings.length <= 1) return;
      const wings = model.wings.filter((w) => w.id !== wingId);
      pushState({ ...model, wings });
    },

    updateTail: (tailId, params) => {
      const model = get().model;
      const tails = model.tails.map((t) => (t.id === tailId ? { ...t, ...params } : t));
      pushState({ ...model, tails });
    },

    addTail: () => {
      const model = get().model;
      const newTail: TailComponent = {
        id: `tail-${Date.now()}`,
        name: `Tail Fin ${model.tails.length + 1}`,
        visible: true,
        locked: false,
        type: 'conventional',
        horizontalSpan: 4.0,
        horizontalChord: 1.2,
        verticalHeight: 2.5,
        verticalChord: 1.5,
        sweep: 30.0,
        dihedral: 0,
        position: [4.0, 0, 0],
        color: '#0369A1',
      };
      const tails = [...model.tails, newTail];
      pushState({ ...model, tails });
    },

    deleteTail: (tailId) => {
      const model = get().model;
      if (model.tails.length <= 1) return;
      const tails = model.tails.filter((t) => t.id !== tailId);
      pushState({ ...model, tails });
    },

    updateEngine: (engineId, params) => {
      const model = get().model;
      const engines = model.engines.map((e) => (e.id === engineId ? { ...e, ...params } : e));
      pushState({ ...model, engines });
    },

    addEngine: () => {
      const model = get().model;
      const newEngine: EngineComponent = {
        id: `eng-${Date.now()}`,
        name: `Engine Nacelle ${model.engines.length + 1}`,
        visible: true,
        locked: false,
        type: 'turbofan',
        diameter: 1.4,
        length: 3.0,
        position: [1.0, 3.0, -0.8],
        pylonHeight: 0.5,
        pylonWidth: 0.2,
        fanBlades: 16,
        color: '#475569',
      };
      const engines = [...model.engines, newEngine];
      pushState({ ...model, engines });
    },

    deleteEngine: (engineId) => {
      const model = get().model;
      if (model.engines.length <= 1) return;
      const engines = model.engines.filter((e) => e.id !== engineId);
      pushState({ ...model, engines });
    },

    updateGear: (params) => {
      const model = get().model;
      pushState({
        ...model,
        gear: { ...model.gear, ...params },
      });
    },

    toggleComponentVisibility: (id) => {
      const model = get().model;
      const newModel: AircraftModel = { ...model };

      if (newModel.fuselage.id === id) {
        newModel.fuselage.visible = !newModel.fuselage.visible;
      }
      newModel.wings = newModel.wings.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
      newModel.tails = newModel.tails.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t));
      newModel.engines = newModel.engines.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e));
      if (newModel.gear.id === id) {
        newModel.gear.visible = !newModel.gear.visible;
      }

      pushState(newModel);
    },

    toggleComponentLock: (id) => {
      const model = get().model;
      const newModel: AircraftModel = { ...model };

      if (newModel.fuselage.id === id) {
        newModel.fuselage.locked = !newModel.fuselage.locked;
      }
      newModel.wings = newModel.wings.map((w) => (w.id === id ? { ...w, locked: !w.locked } : w));
      newModel.tails = newModel.tails.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t));
      newModel.engines = newModel.engines.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e));
      if (newModel.gear.id === id) {
        newModel.gear.locked = !newModel.gear.locked;
      }

      pushState(newModel);
    },

    loadPreset: (presetKey) => {
      const preset = AIRCRAFT_PRESETS[presetKey];
      if (preset) {
        pushState(JSON.parse(JSON.stringify(preset)));
      }
    },

    loadJSONModel: (jsonModel) => {
      pushState(JSON.parse(JSON.stringify(jsonModel)));
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        set({
          model: JSON.parse(JSON.stringify(history[newIndex])),
          historyIndex: newIndex,
          canUndo: newIndex > 0,
          canRedo: true,
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        set({
          model: JSON.parse(JSON.stringify(history[newIndex])),
          historyIndex: newIndex,
          canUndo: true,
          canRedo: newIndex < history.length - 1,
        });
      }
    },
  };
});
