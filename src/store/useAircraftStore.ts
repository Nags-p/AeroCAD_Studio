import { create } from 'zustand';
import { AircraftModel, FuselageSection, WingComponent, TailComponent, EngineComponent } from '@/types/aircraft';
import { AIRCRAFT_PRESETS } from '@/engine/presets/aircraftPresets';

interface AircraftStoreState {
  model: AircraftModel;
  selectedId: string | null;
  selectedType: 'fuselage' | 'section' | 'wing' | 'tail' | 'engine' | null;

  // History stack for Undo/Redo
  history: AircraftModel[];
  historyLabels: string[];
  historyIndex: number;

  // Actions
  setSelected: (id: string | null, type: 'fuselage' | 'section' | 'wing' | 'tail' | 'engine' | null) => void;
  updateFuselage: (params: Partial<AircraftModel['fuselage']>) => void;
  updateFuselageSection: (sectionId: string, params: Partial<FuselageSection>) => void;
  addFuselageSection: () => void;
  deleteFuselageSection: (sectionId: string) => void;

  updateWing: (wingId: string, params: Partial<WingComponent>) => void;
  addWing: (config?: 'low' | 'mid' | 'high' | 'custom') => void;
  deleteWing: (wingId: string) => void;

  updateTail: (tailId: string, params: Partial<TailComponent>) => void;
  addTail: () => void;
  deleteTail: (tailId: string) => void;

  updateEngine: (engineId: string, params: Partial<EngineComponent>) => void;
  addEngine: () => void;
  deleteEngine: (engineId: string) => void;

  toggleComponentVisibility: (id: string) => void;
  toggleComponentLock: (id: string) => void;

  loadPreset: (presetKey: string) => void;
  loadJSONModel: (jsonModel: AircraftModel) => void;

  undo: () => void;
  redo: () => void;
  jumpToHistoryIndex: (index: number) => void;
  duplicateComponent: (id: string, type: 'wing' | 'tail' | 'engine') => void;
  updateModelName: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
}

function sanitizeModel(model: AircraftModel): AircraftModel {
  if (!model) return model;
  const m: AircraftModel = JSON.parse(JSON.stringify(model));
  const fusLen = m.fuselage?.length || 12.0;

  if (m.tails) {
    m.tails = m.tails.map((tail: TailComponent) => {
      const copy = { ...tail };
      // Fix legacy preset tail position if placed in mid-fuselage (< 25% length)
      if (copy.position && copy.position[0] < fusLen * 0.25 && fusLen >= 8) {
        copy.position = [fusLen * 0.35, copy.position[1], copy.position[2]];
      }
      if (copy.horizontalSpan <= 0.15) {
        copy.dihedral = 0;
      }
      return copy;
    });
  }
  return m;
}

const initialModel = sanitizeModel(AIRCRAFT_PRESETS.delta_strike || AIRCRAFT_PRESETS.commercial);

export const useAircraftStore = create<AircraftStoreState>((set, get) => {
  let historyTimeout: NodeJS.Timeout | null = null;
  let pendingState: AircraftModel | null = null;
  let pendingLabel = 'Modify Design';

  const commitPendingState = () => {
    if (historyTimeout) {
      clearTimeout(historyTimeout);
      historyTimeout = null;
    }
    if (!pendingState) return;

    const sanitized = pendingState;
    const label = pendingLabel;
    pendingState = null;

    const { history, historyLabels, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    const newLabels = historyLabels.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(sanitized)));
    newLabels.push(label);
    
    if (newHistory.length > 50) {
      newHistory.shift();
      newLabels.shift();
    }

    set({
      history: newHistory,
      historyLabels: newLabels,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  };

  const pushState = (newModel: AircraftModel, label = 'Modify Design', debounce = false) => {
    const sanitized = sanitizeModel(newModel);

    // Update active model immediately for real-time response
    set({
      model: sanitized,
      canUndo: true,
      canRedo: false,
    });

    pendingState = sanitized;
    pendingLabel = label;

    if (historyTimeout) {
      clearTimeout(historyTimeout);
    }

    if (debounce) {
      historyTimeout = setTimeout(() => {
        commitPendingState();
      }, 500);
    } else {
      commitPendingState();
    }
  };

  return {
    model: sanitizeModel(initialModel),
    selectedId: 'sec-1',
    selectedType: 'section',
    history: [sanitizeModel(initialModel)],
    historyLabels: ['Initial Design Load'],
    historyIndex: 0,
    canUndo: false,
    canRedo: false,

    setSelected: (id, type) => set({ selectedId: id, selectedType: type }),

    updateModelName: (name) => {
      const model = get().model;
      const newModel = { ...model, name };
      pushState(newModel, `Rename Model to "${name}"`);
    },

    updateFuselage: (params) => {
      const model = get().model;
      const newModel: AircraftModel = {
        ...model,
        fuselage: { ...model.fuselage, ...params },
      };
      let label = 'Update Fuselage';
      if (params.length !== undefined) label = `Change Fuselage Length (${params.length}m)`;
      else if (params.radius !== undefined) label = `Change Fuselage Radius (${params.radius}m)`;
      else if (params.color !== undefined) label = 'Change Fuselage Color';
      else if (params.material !== undefined) label = 'Change Fuselage Material';
      else if (params.noseRoundness !== undefined) label = 'Change Nose Roundness';
      else if (params.noseZ !== undefined || params.noseY !== undefined) label = 'Shift Nose Position';
      else if (params.tailZ !== undefined || params.tailY !== undefined) label = 'Shift Tail Position';
      else if (params.visible !== undefined) label = params.visible ? 'Show Fuselage' : 'Hide Fuselage';
      
      pushState(newModel, label, true);
    },

    updateFuselageSection: (sectionId, params) => {
      const model = get().model;
      const sections = model.fuselage.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...params } : sec
      );
      const targetSec = model.fuselage.sections.find((sec) => sec.id === sectionId);
      const name = targetSec ? targetSec.name : 'Section';

      let label = `Update ${name}`;
      if (params.width !== undefined || params.height !== undefined) label = `Resize ${name}`;
      else if (params.shapeType !== undefined) label = `Change ${name} Shape`;

      const newFuselage = {
        ...model.fuselage,
        sections,
      };

      pushState({ ...model, fuselage: newFuselage }, label, true);
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
      pushState({ ...model, fuselage: { ...model.fuselage, sections } }, `Add Fuselage Section ${count + 1}`);
    },

    deleteFuselageSection: (sectionId) => {
      const model = get().model;
      if (model.fuselage.sections.length <= 1) return;
      const targetSec = model.fuselage.sections.find((sec) => sec.id === sectionId);
      const name = targetSec ? targetSec.name : 'Section';
      const sections = model.fuselage.sections.filter((sec) => sec.id !== sectionId);
      const { selectedId } = get();
      pushState({ ...model, fuselage: { ...model.fuselage, sections } }, `Delete ${name}`);
      if (selectedId === sectionId) {
        set({ selectedId: sections[0]?.id || null, selectedType: sections[0] ? 'section' : null });
      }
    },

    updateWing: (wingId, params) => {
      const model = get().model;
      const oldWing = model.wings.find((w) => w.id === wingId);
      const name = oldWing ? oldWing.name : 'Wing';
      const wings = model.wings.map((w) => (w.id === wingId ? { ...w, ...params } : w));

      let engines = model.engines;
      if (oldWing && params.rootPos) {
        const deltaX = params.rootPos[0] - oldWing.rootPos[0];
        const deltaY = params.rootPos[1] - oldWing.rootPos[1];
        if (deltaX !== 0 || deltaY !== 0) {
          engines = engines.map((eng) => {
            const isAttached = eng.attachToWing !== false && (eng.parentWingId === wingId || (!eng.parentWingId && model.wings[0]?.id === wingId));
            if (isAttached) {
              return {
                ...eng,
                position: [eng.position[0] + deltaX, eng.position[1] + deltaY, eng.position[2]],
              };
            }
            return eng;
          });
        }
      }

      let label = `Update ${name}`;
      if (params.span !== undefined) label = `Change ${name} Span (${params.span}m)`;
      else if (params.sweep !== undefined) label = `Change ${name} Sweep (${params.sweep}°)`;
      else if (params.dihedral !== undefined) label = `Change ${name} Dihedral (${params.dihedral}°)`;
      else if (params.rootChord !== undefined || params.tipChord !== undefined) label = `Resize ${name} Chords`;
      else if (params.color !== undefined) label = `Change ${name} Color`;
      else if (params.material !== undefined) label = `Change ${name} Material`;

      pushState({ ...model, wings, engines }, label, true);
    },

    addWing: (config = 'mid') => {
      const model = get().model;
      const fusRadius = model.fuselage?.radius || 1.8;
      let zPos = 0;
      let dihedral = 1.0;
      let label = 'Mid';

      if (config === 'high') {
        zPos = fusRadius * 0.75;
        dihedral = 0.0;
        label = 'High';
      } else if (config === 'low') {
        zPos = -fusRadius * 0.45;
        dihedral = 3.5;
        label = 'Low';
      }

      const wingName = `${label} Wing ${model.wings.length + 1}`;
      const newWing: WingComponent = {
        id: `wing-${Date.now()}`,
        name: wingName,
        visible: true,
        locked: false,
        mountConfig: config,
        span: 12.0,
        rootChord: 2.5,
        tipChord: 1.0,
        sweep: 15,
        dihedral,
        twist: 0,
        rootThickness: 10,
        tipThickness: 8,
        rootCamber: 1,
        tipCamber: 0,
        airfoilName: 'NACA 0012',
        rootPos: [model.fuselage.length * 0.35, 0, zPos],
        color: '#0284C7',
        winglets: { enabled: false, height: 1.0, root: 0.8, tip: 0.3, sweep: 30.0, cant: 15.0, filletRadius: 0.5 },
      };
      const wings = [...model.wings, newWing];
      pushState({ ...model, wings }, `Add ${wingName}`);
    },

    deleteWing: (wingId) => {
      const model = get().model;
      const oldWing = model.wings.find((w) => w.id === wingId);
      const name = oldWing ? oldWing.name : 'Wing';
      const wings = model.wings.filter((w) => w.id !== wingId);
      const { selectedId } = get();
      // Also detach engines referencing this wing
      const engines = model.engines.map((eng) =>
        eng.parentWingId === wingId ? { ...eng, parentWingId: wings[0]?.id } : eng
      );
      pushState({ ...model, wings, engines }, `Delete ${name}`);
      if (selectedId === wingId) {
        set({ selectedId: null, selectedType: null });
      }
    },

    updateTail: (tailId, params) => {
      const model = get().model;
      const oldTail = model.tails.find((t) => t.id === tailId);
      const name = oldTail ? oldTail.name : 'Tail';
      const tails = model.tails.map((t) => (t.id === tailId ? { ...t, ...params } : t));
      
      let label = `Update ${name}`;
      if (params.type !== undefined) label = `Change ${name} Configuration (${params.type})`;
      else if (params.color !== undefined) label = `Change ${name} Color`;
      else if (params.material !== undefined) label = `Change ${name} Material`;

      pushState({ ...model, tails }, label, true);
    },

    addTail: () => {
      const model = get().model;
      const tailName = `Tail Fin ${model.tails.length + 1}`;
      const newTail: TailComponent = {
        id: `tail-${Date.now()}`,
        name: tailName,
        visible: true,
        locked: false,
        type: 'conventional',
        horizontalSpan: 4.0,
        horizontalChord: 1.2,
        verticalHeight: 2.5,
        verticalChord: 1.5,
        sweep: 30.0,
        dihedral: 0,
        position: [model.fuselage.length * 0.85, 0, model.fuselage.radius * 0.25],
        color: '#0369A1',
      };
      const tails = [...model.tails, newTail];
      pushState({ ...model, tails }, `Add ${tailName}`);
    },

    deleteTail: (tailId) => {
      const model = get().model;
      const oldTail = model.tails.find((t) => t.id === tailId);
      const name = oldTail ? oldTail.name : 'Tail';
      const tails = model.tails.filter((t) => t.id !== tailId);
      const { selectedId } = get();
      pushState({ ...model, tails }, `Delete ${name}`);
      if (selectedId === tailId) {
        set({ selectedId: null, selectedType: null });
      }
    },

    updateEngine: (engineId, params) => {
      const model = get().model;
      const oldEng = model.engines.find((e) => e.id === engineId);
      const name = oldEng ? oldEng.name : 'Engine';
      const engines = model.engines.map((e) => (e.id === engineId ? { ...e, ...params } : e));
      
      let label = `Update ${name}`;
      if (params.type !== undefined) label = `Change ${name} Type (${params.type})`;
      else if (params.diameter !== undefined) label = `Change ${name} Diameter (${params.diameter}m)`;
      else if (params.length !== undefined) label = `Change ${name} Length (${params.length}m)`;
      else if (params.color !== undefined) label = `Change ${name} Color`;
      else if (params.material !== undefined) label = `Change ${name} Material`;

      pushState({ ...model, engines }, label, true);
    },

    addEngine: () => {
      const model = get().model;
      const wing = model.wings[0];
      const spanY = wing ? wing.rootPos[1] + (wing.span / 2) * 0.35 : 3.0;
      const rootX = wing ? wing.rootPos[0] + wing.rootChord * 0.45 : model.fuselage.length * 0.4;
      const engName = `Engine Nacelle ${model.engines.length + 1}`;
      const newEngine: EngineComponent = {
        id: `eng-${Date.now()}`,
        name: engName,
        visible: true,
        locked: false,
        type: 'turbofan',
        diameter: 1.4,
        length: 3.0,
        position: [rootX, spanY, wing ? wing.rootPos[2] - 0.8 : -0.8],
        pylonHeight: 0.45,
        pylonWidth: 0.2,
        fanBlades: 16,
        attachToWing: true,
        parentWingId: wing ? wing.id : undefined,
        mountStyle: 'underwing',
        color: '#475569',
      };
      const engines = [...model.engines, newEngine];
      pushState({ ...model, engines }, `Add ${engName}`);
    },

    deleteEngine: (engineId) => {
      const model = get().model;
      const oldEng = model.engines.find((e) => e.id === engineId);
      const name = oldEng ? oldEng.name : 'Engine';
      const engines = model.engines.filter((e) => e.id !== engineId);
      const { selectedId } = get();
      pushState({ ...model, engines }, `Delete ${name}`);
      if (selectedId === engineId) {
        set({ selectedId: null, selectedType: null });
      }
    },

    toggleComponentVisibility: (id) => {
      const model = get().model;
      const newModel: AircraftModel = { ...model };
      let name = 'Component';

      if (newModel.fuselage.id === id) {
        newModel.fuselage.visible = !newModel.fuselage.visible;
        name = newModel.fuselage.name;
      }
      newModel.wings = newModel.wings.map((w) => {
        if (w.id === id) {
          name = w.name;
          return { ...w, visible: !w.visible };
        }
        return w;
      });
      newModel.tails = newModel.tails.map((t) => {
        if (t.id === id) {
          name = t.name;
          return { ...t, visible: !t.visible };
        }
        return t;
      });
      newModel.engines = newModel.engines.map((e) => {
        if (e.id === id) {
          name = e.name;
          return { ...e, visible: !e.visible };
        }
        return e;
      });

      pushState(newModel, `Toggle Visibility (${name})`);
    },

    toggleComponentLock: (id) => {
      const model = get().model;
      const newModel: AircraftModel = { ...model };
      let name = 'Component';

      if (newModel.fuselage.id === id) {
        newModel.fuselage.locked = !newModel.fuselage.locked;
        name = newModel.fuselage.name;
      }
      newModel.wings = newModel.wings.map((w) => {
        if (w.id === id) {
          name = w.name;
          return { ...w, locked: !w.locked };
        }
        return w;
      });
      newModel.tails = newModel.tails.map((t) => {
        if (t.id === id) {
          name = t.name;
          return { ...t, locked: !t.locked };
        }
        return t;
      });
      newModel.engines = newModel.engines.map((e) => {
        if (e.id === id) {
          name = e.name;
          return { ...e, locked: !e.locked };
        }
        return e;
      });

      pushState(newModel, `Toggle Lock (${name})`);
    },

    loadPreset: (presetKey) => {
      const preset = AIRCRAFT_PRESETS[presetKey];
      if (preset) {
        pushState(sanitizeModel(JSON.parse(JSON.stringify(preset))), `Load Preset (${preset.name})`);
      }
    },

    loadJSONModel: (jsonModel) => {
      pushState(sanitizeModel(JSON.parse(JSON.stringify(jsonModel))), `Import Design (${jsonModel.name || 'Untitled'})`);
    },

    undo: () => {
      commitPendingState();
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
      commitPendingState();
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

    jumpToHistoryIndex: (index) => {
      commitPendingState();
      const { history } = get();
      if (index >= 0 && index < history.length) {
        set({
          model: JSON.parse(JSON.stringify(history[index])),
          historyIndex: index,
          canUndo: index > 0,
          canRedo: index < history.length - 1,
        });
      }
    },

    duplicateComponent: (id, type) => {
      const model = get().model;
      const newModel = { ...model };
      if (type === 'wing') {
        const wing = model.wings.find((w) => w.id === id);
        if (wing) {
          const newWing = {
            ...JSON.parse(JSON.stringify(wing)),
            id: `wing-${Date.now()}`,
            name: `${wing.name} (Copy)`,
            rootPos: [wing.rootPos[0], wing.rootPos[1], wing.rootPos[2] + 0.5],
          };
          newModel.wings = [...model.wings, newWing];
          pushState(newModel, `Duplicate ${wing.name}`);
        }
      } else if (type === 'tail') {
        const tail = model.tails.find((t) => t.id === id);
        if (tail) {
          const newTail = {
            ...JSON.parse(JSON.stringify(tail)),
            id: `tail-${Date.now()}`,
            name: `${tail.name} (Copy)`,
            position: [tail.position[0], tail.position[1], tail.position[2] + 0.5],
          };
          newModel.tails = [...model.tails, newTail];
          pushState(newModel, `Duplicate ${tail.name}`);
        }
      } else if (type === 'engine') {
        const eng = model.engines.find((e) => e.id === id);
        if (eng) {
          const newEng = {
            ...JSON.parse(JSON.stringify(eng)),
            id: `eng-${Date.now()}`,
            name: `${eng.name} (Copy)`,
            position: [eng.position[0], eng.position[1] + 1.0, eng.position[2]],
          };
          newModel.engines = [...model.engines, newEng];
          pushState(newModel, `Duplicate ${eng.name}`);
        }
      }
    },
  };
});
