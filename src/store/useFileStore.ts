import { create } from 'zustand';
import { AircraftModel } from '@/types/aircraft';
import { AIRCRAFT_PRESETS } from '@/engine/presets/aircraftPresets';
import { useAircraftStore } from './useAircraftStore';
import { useUIStore } from './useUIStore';
import { supabase, saveAircraftToCloud, fetchUserAircraftModels, deleteAircraftFromCloud, CloudAircraftRecord } from '@/lib/supabaseClient';

export interface SavedFile {
  id: string;
  name: string;
  lastModified: string;
  model: AircraftModel;
  cloudSynced?: boolean;
  cloudFileId?: string;
}

interface FileStoreState {
  files: SavedFile[];
  trashFiles: SavedFile[];
  activeFileId: string | null;
  isSyncing: boolean;

  loadFiles: () => void;
  syncAllFilesToVault: () => Promise<void>;
  saveActiveFile: (model: AircraftModel) => void;
  createNewFile: (name: string, templateKey: string) => void;
  deleteFile: (id: string) => void;
  selectFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  duplicateFile: (id: string) => void;

  // Trash actions
  restoreFile: (id: string) => void;
  deletePermanently: (id: string) => void;
  emptyScrapYard: () => void;
}

const DEFAULT_BLANK_MODEL: AircraftModel = AIRCRAFT_PRESETS.commercial || AIRCRAFT_PRESETS.delta_strike;

export const useFileStore = create<FileStoreState>((set, get) => ({
  files: [],
  trashFiles: [],
  activeFileId: null,
  isSyncing: false,

  loadFiles: () => {
    if (typeof window === 'undefined') return;

    try {
      const storedFiles = localStorage.getItem('aerocad_files');
      const storedTrash = localStorage.getItem('aerocad_trash_files');

      let parsedFiles: SavedFile[] = [];
      let parsedTrash: SavedFile[] = [];

      if (storedFiles) {
        parsedFiles = JSON.parse(storedFiles);
      }

      if (storedTrash) {
        parsedTrash = JSON.parse(storedTrash);
      }

      // If no files exist, populate standard initial files
      if (parsedFiles.length === 0 && parsedTrash.length === 0) {
        const defaultFiles: SavedFile[] = [
          {
            id: 'file-default-1',
            name: 'Commercial Airliner Concept',
            lastModified: new Date().toLocaleString(),
            model: AIRCRAFT_PRESETS.airliner,
            cloudSynced: false,
          },
          {
            id: 'file-default-2',
            name: 'Delta Strike Fighter',
            lastModified: new Date().toLocaleString(),
            model: AIRCRAFT_PRESETS.fighter,
            cloudSynced: false,
          },
        ];
        parsedFiles = defaultFiles;
        localStorage.setItem('aerocad_files', JSON.stringify(defaultFiles));
      }

      // Ensure all loaded files have a valid model structure
      parsedFiles = parsedFiles.map((file) => ({
        ...file,
        model: file.model || AIRCRAFT_PRESETS.commercial || DEFAULT_BLANK_MODEL,
      }));
      parsedTrash = parsedTrash.map((file) => ({
        ...file,
        model: file.model || AIRCRAFT_PRESETS.commercial || DEFAULT_BLANK_MODEL,
      }));

      set({ files: parsedFiles, trashFiles: parsedTrash });

      // Automatically select the first file if none is selected
      if (!get().activeFileId && parsedFiles.length > 0) {
        set({ activeFileId: parsedFiles[0].id });
      }

      // Trigger automatic cloud vault synchronization
      get().syncAllFilesToVault();
    } catch (e) {
      console.error('Error loading files from localStorage:', e);
    }
  },

  /**
   * Synchronizes every file in the workspace with the Supabase Cloud Vault
   */
  syncAllFilesToVault: async () => {
    if (typeof window === 'undefined') return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // User not logged in

      set({ isSyncing: true });

      // 1. Fetch all cloud models saved for this user
      const cloudRes = await fetchUserAircraftModels();
      const cloudRecords: CloudAircraftRecord[] = cloudRes.success && cloudRes.data ? cloudRes.data : [];

      let currentFiles = [...get().files];

      // 2. Import any cloud models that are not in current local files
      for (const record of cloudRecords) {
        const existsLocally = currentFiles.some(
          (f) => f.cloudFileId === record.id || f.name.toLowerCase() === record.name.toLowerCase()
        );
        if (!existsLocally && record.model_json) {
          const importedFile: SavedFile = {
            id: `cloud-${record.id}`,
            name: record.name,
            lastModified: new Date(record.updated_at).toLocaleString(),
            model: record.model_json,
            cloudSynced: true,
            cloudFileId: record.id,
          };
          currentFiles.push(importedFile);
        }
      }

      // 3. Sync all current files to Supabase cloud
      const updatedFiles: SavedFile[] = [];
      for (const file of currentFiles) {
        if (!file.model) {
          updatedFiles.push(file);
          continue;
        }

        const matchCloud = cloudRecords.find(
          (r) => r.id === file.cloudFileId || r.name.toLowerCase() === file.name.toLowerCase()
        );

        const res = await saveAircraftToCloud(
          file.model,
          'Auto-synced from ThermoDESiM Aero CAD Studio',
          file.cloudFileId || matchCloud?.id
        );

        if (res.success && res.data) {
          updatedFiles.push({
            ...file,
            cloudSynced: true,
            cloudFileId: res.data.id,
          });
        } else {
          updatedFiles.push(file);
        }
      }

      set({ files: updatedFiles, isSyncing: false });
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    } catch (err) {
      console.error('Error syncing files to cloud vault:', err);
      set({ isSyncing: false });
    }
  },

  saveActiveFile: (model: AircraftModel) => {
    const { files, activeFileId } = get();
    if (!activeFileId) return;

    const updatedFiles = files.map((file) => {
      if (file.id === activeFileId) {
        return {
          ...file,
          lastModified: new Date().toLocaleString(),
          model: JSON.parse(JSON.stringify(model)),
        };
      }
      return file;
    });

    set({ files: updatedFiles });
    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    }

    // Auto-save to Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const target = updatedFiles.find((f) => f.id === activeFileId);
        saveAircraftToCloud(model, 'Updated design in CAD Studio', target?.cloudFileId).then((res) => {
          if (res.success && res.data) {
            const syncedFiles = get().files.map((f) =>
              f.id === activeFileId ? { ...f, cloudSynced: true, cloudFileId: res.data.id } : f
            );
            set({ files: syncedFiles });
            localStorage.setItem('aerocad_files', JSON.stringify(syncedFiles));
          }
        });
      }
    });
  },

  createNewFile: (name: string, templateKey: string) => {
    let baseModel = DEFAULT_BLANK_MODEL;
    if (templateKey !== 'blank' && AIRCRAFT_PRESETS[templateKey as keyof typeof AIRCRAFT_PRESETS]) {
      baseModel = AIRCRAFT_PRESETS[templateKey as keyof typeof AIRCRAFT_PRESETS];
    }

    const newFile: SavedFile = {
      id: `file-${Date.now()}`,
      name,
      lastModified: new Date().toLocaleString(),
      model: {
        ...JSON.parse(JSON.stringify(baseModel)),
        name,
      },
      cloudSynced: false,
    };

    const updatedFiles = [newFile, ...get().files];
    set({ files: updatedFiles, activeFileId: newFile.id });

    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    }

    // Switch to editor view and load the model
    useAircraftStore.getState().loadJSONModel(newFile.model);
    useUIStore.getState().setView('editor');

    // Auto-save to Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        saveAircraftToCloud(newFile.model, 'New design initialized in CAD Studio').then((res) => {
          if (res.success && res.data) {
            const syncedFiles = get().files.map((f) =>
              f.id === newFile.id ? { ...f, cloudSynced: true, cloudFileId: res.data.id } : f
            );
            set({ files: syncedFiles });
            localStorage.setItem('aerocad_files', JSON.stringify(syncedFiles));
          }
        });
      }
    });
  },

  selectFile: (id: string) => {
    const file = get().files.find((f) => f.id === id);
    if (file) {
      set({ activeFileId: id });
      useAircraftStore.getState().loadJSONModel(file.model);
      useUIStore.getState().setView('editor');
    }
  },

  deleteFile: (id: string) => {
    const { files, trashFiles, activeFileId } = get();
    const file = files.find((f) => f.id === id);
    if (!file) return;

    const updatedFiles = files.filter((f) => f.id !== id);
    const updatedTrash = [file, ...trashFiles];

    let newActiveId = activeFileId;
    if (activeFileId === id) {
      newActiveId = updatedFiles.length > 0 ? updatedFiles[0].id : null;
    }

    set({ files: updatedFiles, trashFiles: updatedTrash, activeFileId: newActiveId });

    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
      localStorage.setItem('aerocad_trash_files', JSON.stringify(updatedTrash));
    }
  },

  restoreFile: (id: string) => {
    const { files, trashFiles } = get();
    const file = trashFiles.find((f) => f.id === id);
    if (!file) return;

    const updatedTrash = trashFiles.filter((f) => f.id !== id);
    const updatedFiles = [file, ...files];

    set({ files: updatedFiles, trashFiles: updatedTrash });

    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
      localStorage.setItem('aerocad_trash_files', JSON.stringify(updatedTrash));
    }
  },

  deletePermanently: (id: string) => {
    const { trashFiles } = get();
    const file = trashFiles.find((f) => f.id === id);
    const updatedTrash = trashFiles.filter((f) => f.id !== id);

    set({ trashFiles: updatedTrash });

    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_trash_files', JSON.stringify(updatedTrash));
    }

    // If it exists in cloud vault, delete from cloud
    if (file?.cloudFileId) {
      deleteAircraftFromCloud(file.cloudFileId);
    }
  },

  emptyScrapYard: () => {
    const { trashFiles } = get();
    // Delete all trashed files from cloud if they have cloud ids
    for (const f of trashFiles) {
      if (f.cloudFileId) {
        deleteAircraftFromCloud(f.cloudFileId);
      }
    }

    set({ trashFiles: [] });
    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_trash_files', JSON.stringify([]));
    }
  },

  renameFile: (id: string, newName: string) => {
    const { files } = get();
    const updatedFiles = files.map((file) => {
      if (file.id === id) {
        return {
          ...file,
          name: newName,
          lastModified: new Date().toLocaleString(),
          model: {
            ...file.model,
            name: newName,
          },
        };
      }
      return file;
    });

    set({ files: updatedFiles });
    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    }

    // Auto-sync rename to Supabase
    const renamed = updatedFiles.find((f) => f.id === id);
    if (renamed?.model) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          saveAircraftToCloud(renamed.model, 'Renamed aircraft', renamed.cloudFileId);
        }
      });
    }
  },

  duplicateFile: (id: string) => {
    const file = get().files.find((f) => f.id === id);
    if (!file) return;

    const newFile: SavedFile = {
      id: `file-${Date.now()}`,
      name: `${file.name} (Copy)`,
      lastModified: new Date().toLocaleString(),
      model: {
        ...JSON.parse(JSON.stringify(file.model)),
        name: `${file.name} (Copy)`,
      },
      cloudSynced: false,
    };

    const updatedFiles = [newFile, ...get().files];
    set({ files: updatedFiles });

    if (typeof window !== 'undefined') {
      localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    }

    // Auto-save copy to Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        saveAircraftToCloud(newFile.model, 'Duplicated aircraft').then((res) => {
          if (res.success && res.data) {
            const syncedFiles = get().files.map((f) =>
              f.id === newFile.id ? { ...f, cloudSynced: true, cloudFileId: res.data.id } : f
            );
            set({ files: syncedFiles });
            localStorage.setItem('aerocad_files', JSON.stringify(syncedFiles));
          }
        });
      }
    });
  },
}));
