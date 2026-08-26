import { create } from 'zustand';
import { AircraftModel } from '@/types/aircraft';
import { AIRCRAFT_PRESETS } from '@/engine/presets/aircraftPresets';
import { useAircraftStore } from './useAircraftStore';
import { useUIStore } from './useUIStore';

export interface SavedFile {
  id: string;
  name: string;
  lastModified: string;
  model: AircraftModel;
  driveFileId?: string; // Cache the google drive file id
}

interface FileStoreState {
  files: SavedFile[];
  trashFiles: SavedFile[];
  activeFileId: string | null;

  // Google Drive state
  driveAccessToken: string | null;
  driveEmail: string | null;
  drivePassphrase: string | null;
  isSyncing: boolean;
  deletedDriveIds: string[]; // Track deleted Drive file IDs to prevent re-download

  loadFiles: () => void;
  saveActiveFile: (model: AircraftModel) => void;
  createNewFile: (name: string, templateKey: string) => void;
  deleteFile: (id: string) => void;
  selectFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;

  // Trash actions
  restoreFile: (id: string) => void;
  deletePermanently: (id: string) => void;
  emptyScrapYard: () => void;

  // Google Drive Actions
  connectDrive: (accessToken: string) => Promise<void>;
  disconnectDrive: () => void;
  setDrivePassphrase: (passphrase: string) => Promise<void>;
  syncWithDrive: (isManual?: boolean) => Promise<void>;
  uploadFileToDrive: (file: SavedFile) => Promise<string | null>;
  deleteFileFromDrive: (driveFileId: string) => Promise<void>;
  _mergeAndSync: (driveFiles: { id: string; name: string }[], token: string, passphrase: string) => Promise<void>;
}

// --- Helper Functions for AES-GCM-256 Client-Side Encryption ---

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptModel(model: AircraftModel, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const rawData = enc.encode(JSON.stringify(model));
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const aesKey = await deriveKey(passphrase, salt);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    aesKey,
    rawData
  );

  const payload = {
    version: '1.0',
    encrypted: true,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
  return JSON.stringify(payload);
}

async function decryptModel(encryptedJson: string, passphrase: string): Promise<AircraftModel> {
  const payload = JSON.parse(encryptedJson);
  if (!payload.encrypted) {
    throw new Error('Data is not encrypted');
  }

  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);

  const aesKey = await deriveKey(passphrase, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    aesKey,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decryptedBuffer));
}

// --- Zustand Store implementation ---

let driveUploadTimeout: NodeJS.Timeout | null = null;

export const useFileStore = create<FileStoreState>((set, get) => ({
  files: [],
  trashFiles: [],
  activeFileId: null,

  // Google Drive state
  driveAccessToken: null,
  driveEmail: null,
  drivePassphrase: null,
  isSyncing: false,
  deletedDriveIds: [],

  loadFiles: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('aerocad_files');
      const token = localStorage.getItem('aerocad_drive_token');
      const email = localStorage.getItem('aerocad_drive_email');
      const passphrase = localStorage.getItem('aerocad_drive_passphrase');
      const storedTrash = localStorage.getItem('aerocad_trash');
      const storedDeletedIds = localStorage.getItem('aerocad_deleted_drive_ids');

      if (token) set({ driveAccessToken: token });
      if (email) set({ driveEmail: email });
      if (passphrase) set({ drivePassphrase: passphrase });
      if (storedDeletedIds) set({ deletedDriveIds: JSON.parse(storedDeletedIds) });

      if (stored) {
        const parsedFiles: SavedFile[] = JSON.parse(stored);
        // Filter out initial demo files so default is 0 files
        const userFiles = parsedFiles.filter((f) => !f.id.startsWith('file-demo-'));
        set({ files: userFiles });
        localStorage.setItem('aerocad_files', JSON.stringify(userFiles));
      } else {
        localStorage.setItem('aerocad_files', JSON.stringify([]));
        set({ files: [] });
      }

      if (storedTrash) {
        set({ trashFiles: JSON.parse(storedTrash) });
      }

      // If already logged in to Google Drive and passphrase exists, trigger a background sync
      if (token && passphrase) {
        get().syncWithDrive();
      }
    } catch (e) {
      console.error('Failed to load files from localStorage:', e);
    }
  },

  saveActiveFile: (model) => {
    const { activeFileId, files } = get();
    if (!activeFileId) return;

    const updatedFiles = files.map((file) =>
      file.id === activeFileId
        ? { ...file, model: JSON.parse(JSON.stringify(model)), lastModified: new Date().toLocaleString() }
        : file
    );

    set({ files: updatedFiles });
    localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));

    // Upload to drive if connected
    const activeFile = updatedFiles.find((f) => f.id === activeFileId);
    if (activeFile && get().driveAccessToken && get().drivePassphrase) {
      if (driveUploadTimeout) {
        clearTimeout(driveUploadTimeout);
      }
      driveUploadTimeout = setTimeout(() => {
        get().uploadFileToDrive(activeFile);
      }, 1500); // Debounce Google Drive uploads to prevent rate limiting
    }
  },

  createNewFile: (name, templateKey) => {
    const template = AIRCRAFT_PRESETS[templateKey] || AIRCRAFT_PRESETS.blank || AIRCRAFT_PRESETS.delta_strike;
    const newModel: AircraftModel = JSON.parse(JSON.stringify(template));
    newModel.name = name;

    const newFile: SavedFile = {
      id: `file-${Date.now()}`,
      name,
      lastModified: new Date().toLocaleString(),
      model: newModel,
    };

    const updatedFiles = [newFile, ...get().files];
    set({ files: updatedFiles, activeFileId: newFile.id });
    localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));

    // Upload to drive if connected
    if (get().driveAccessToken && get().drivePassphrase) {
      get().uploadFileToDrive(newFile);
    }

    useAircraftStore.getState().loadJSONModel(newModel);
    useUIStore.getState().setView('editor');
  },

  deleteFile: (id) => {
    const file = get().files.find((f) => f.id === id);
    if (!file) return;

    const updatedFiles = get().files.filter((f) => f.id !== id);

    // Move to trash
    const trashedFile: SavedFile = {
      ...file,
      lastModified: new Date().toLocaleString(),
    };
    const updatedTrash = [trashedFile, ...get().trashFiles];

    // If file has a driveFileId, track it in deletedDriveIds so sync will NEVER restore it
    let updatedDeletedIds = get().deletedDriveIds;
    if (file.driveFileId) {
      updatedDeletedIds = Array.from(new Set([...updatedDeletedIds, file.driveFileId]));
      if (get().driveAccessToken) {
        get().deleteFileFromDrive(file.driveFileId);
      }
    }

    set({ files: updatedFiles, trashFiles: updatedTrash, deletedDriveIds: updatedDeletedIds });
    localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    localStorage.setItem('aerocad_trash', JSON.stringify(updatedTrash));
    localStorage.setItem('aerocad_deleted_drive_ids', JSON.stringify(updatedDeletedIds));

    if (get().activeFileId === id) {
      set({ activeFileId: null });
    }
  },

  selectFile: (id) => {
    const file = get().files.find((f) => f.id === id);
    if (!file) return;

    set({ activeFileId: id });
    useAircraftStore.getState().loadJSONModel(JSON.parse(JSON.stringify(file.model)));
    useUIStore.getState().setView('editor');
  },

  renameFile: (id, newName) => {
    const updatedFiles = get().files.map((file) =>
      file.id === id
        ? { ...file, name: newName, lastModified: new Date().toLocaleString() }
        : file
    );
    set({ files: updatedFiles });
    localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));

    // Rename also triggers upload to sync changes
    const file = updatedFiles.find((f) => f.id === id);
    if (file && get().driveAccessToken && get().drivePassphrase) {
      get().uploadFileToDrive(file);
    }
  },

  restoreFile: (id) => {
    const file = get().trashFiles.find((f) => f.id === id);
    if (!file) return;

    const updatedTrash = get().trashFiles.filter((f) => f.id !== id);

    // Remove file.driveFileId from deletedDriveIds if present so it can sync again
    let updatedDeletedIds = get().deletedDriveIds;
    if (file.driveFileId) {
      updatedDeletedIds = updatedDeletedIds.filter((dId) => dId !== file.driveFileId);
    }

    const restoredFile: SavedFile = {
      ...file,
      lastModified: new Date().toLocaleString(),
    };
    const updatedFiles = [restoredFile, ...get().files];

    set({ files: updatedFiles, trashFiles: updatedTrash, deletedDriveIds: updatedDeletedIds });
    localStorage.setItem('aerocad_files', JSON.stringify(updatedFiles));
    localStorage.setItem('aerocad_trash', JSON.stringify(updatedTrash));
    localStorage.setItem('aerocad_deleted_drive_ids', JSON.stringify(updatedDeletedIds));

    // Re-upload to drive if connected
    if (get().driveAccessToken && get().drivePassphrase) {
      get().uploadFileToDrive(restoredFile);
    }
  },

  deletePermanently: (id) => {
    const file = get().trashFiles.find((f) => f.id === id);
    let updatedDeletedIds = get().deletedDriveIds;

    if (file && file.driveFileId) {
      updatedDeletedIds = Array.from(new Set([...updatedDeletedIds, file.driveFileId]));
      if (get().driveAccessToken) {
        get().deleteFileFromDrive(file.driveFileId);
      }
    }

    const updatedTrash = get().trashFiles.filter((f) => f.id !== id);
    set({ trashFiles: updatedTrash, deletedDriveIds: updatedDeletedIds });
    localStorage.setItem('aerocad_trash', JSON.stringify(updatedTrash));
    localStorage.setItem('aerocad_deleted_drive_ids', JSON.stringify(updatedDeletedIds));
  },

  emptyScrapYard: () => {
    const trashDriveIds = get().trashFiles
      .map((f) => f.driveFileId)
      .filter((id): id is string => !!id);

    let updatedDeletedIds = get().deletedDriveIds;
    if (trashDriveIds.length > 0) {
      updatedDeletedIds = Array.from(new Set([...updatedDeletedIds, ...trashDriveIds]));
      if (get().driveAccessToken) {
        trashDriveIds.forEach((driveFileId) => {
          get().deleteFileFromDrive(driveFileId);
        });
      }
    }

    set({ trashFiles: [], deletedDriveIds: updatedDeletedIds });
    localStorage.setItem('aerocad_trash', JSON.stringify([]));
    localStorage.setItem('aerocad_deleted_drive_ids', JSON.stringify(updatedDeletedIds));
  },

  // --- Google Drive Cloud Sync Implementations ---

  connectDrive: async (accessToken) => {
    set({ driveAccessToken: accessToken });
    localStorage.setItem('aerocad_drive_token', accessToken);

    try {
      // Get user email profile using Google oauth userinfo endpoint
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const userInfo = await response.json();
        set({ driveEmail: userInfo.email });
        localStorage.setItem('aerocad_drive_email', userInfo.email);
      }
    } catch (e) {
      console.error('Error fetching user email from Google:', e);
    }

    // If passphrase is already present, sync immediately
    if (get().drivePassphrase) {
      get().syncWithDrive();
    }
  },

  disconnectDrive: () => {
    set({
      driveAccessToken: null,
      driveEmail: null,
      isSyncing: false,
      files: [],
      trashFiles: [],
      activeFileId: null,
    });
    localStorage.removeItem('aerocad_drive_token');
    localStorage.removeItem('aerocad_drive_email');
    localStorage.removeItem('aerocad_files');
    localStorage.removeItem('aerocad_trash');
  },

  resetPassphrase: () => {
    set({ drivePassphrase: null });
    localStorage.removeItem('aerocad_drive_passphrase');
  },

  setDrivePassphrase: async (passphrase) => {
    set({ drivePassphrase: passphrase });
    localStorage.setItem('aerocad_drive_passphrase', passphrase);

    if (get().driveAccessToken) {
      await get().syncWithDrive();
    }
  },

  syncWithDrive: async (isManual = false) => {
    const token = get().driveAccessToken;
    const passphrase = get().drivePassphrase;
    if (!token) {
      if (isManual) alert('Not connected to Google Drive. Please connect first.');
      return;
    }
    if (!passphrase) {
      if (isManual) alert('Cloud encryption passphrase is not set. Please set it using the key icon.');
      return;
    }

    set({ isSyncing: true });

    try {
      // 1. Search files ending in '.aerocad' in appDataFolder (hidden from user's Drive)
      const query = encodeURIComponent("name contains '.aerocad'");
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!searchRes.ok) {
        if (searchRes.status === 401) {
          get().disconnectDrive();
          alert('Your Google Drive session has expired. Please connect to Google Drive again.');
          return;
        }
        // Fallback: try regular Drive search for backward compatibility with existing files
        const fallbackQuery = encodeURIComponent("name contains '.aerocad' and trashed = false");
        const fallbackRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${fallbackQuery}&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!fallbackRes.ok) {
          if (fallbackRes.status === 401) {
            get().disconnectDrive();
            alert('Your Google Drive session has expired. Please connect to Google Drive again.');
            return;
          }
          throw new Error('Search failed on Google Drive');
        }
        const fallbackData = await fallbackRes.json();
        const driveFiles: { id: string; name: string }[] = fallbackData.files || [];
        await get()._mergeAndSync(driveFiles, token, passphrase);
        if (isManual) {
          alert('Google Drive sync completed successfully!');
        }
        return;
      }

      const searchData = await searchRes.json();
      let driveFiles: { id: string; name: string }[] = searchData.files || [];

      // Also check regular Drive for legacy files and migrate them
      try {
        const legacyQuery = encodeURIComponent("name contains '.aerocad' and trashed = false");
        const legacyRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${legacyQuery}&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          const legacyFiles: { id: string; name: string }[] = legacyData.files || [];
          // Include legacy files that aren't already in appDataFolder
          const appDataIds = new Set(driveFiles.map(f => f.name));
          for (const lf of legacyFiles) {
            if (!appDataIds.has(lf.name)) {
              driveFiles.push(lf);
            }
          }
        }
      } catch {
        // Legacy search is best-effort
      }

      await get()._mergeAndSync(driveFiles, token, passphrase);
      if (isManual) {
        alert('Google Drive sync completed successfully!');
      }
    } catch (e) {
      console.error('Error during Google Drive sync:', e);
      if (isManual) {
        alert('Google Drive sync failed. Please check your connection.');
      }
    } finally {
      set({ isSyncing: false });
    }
  },

  _mergeAndSync: async (driveFiles: { id: string; name: string }[], token: string, passphrase: string) => {
    const deletedIds = get().deletedDriveIds;
    const successfullyDecryptedIds = new Set<string>();

    // 2. Loop through all Google Drive files and download/merge them
    let updatedLocalFiles = [...get().files];

    for (const dFile of driveFiles) {
      // Skip files that were explicitly deleted locally
      if (deletedIds.includes(dFile.id)) {
        get().deleteFileFromDrive(dFile.id);
        continue;
      }

      const cleanName = dFile.name.replace('.aerocad', '');

      // Also skip if the file name or driveFileId exists in trash
      const isInTrash = get().trashFiles.some((f) => f.name === cleanName || f.driveFileId === dFile.id);
      if (isInTrash) {
        continue;
      }

      try {
        // Download encrypted file contents
        const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${dFile.id}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!fileRes.ok) continue;
        const encryptedText = await fileRes.text();

        // Decrypt the file
        const decryptedModel = await decryptModel(encryptedText, passphrase);
        successfullyDecryptedIds.add(dFile.id);

        const localIndex = updatedLocalFiles.findIndex((f) => f.name === cleanName);

        if (localIndex >= 0) {
          // File already exists locally, update it and preserve driveFileId
          updatedLocalFiles[localIndex] = {
            ...updatedLocalFiles[localIndex],
            model: decryptedModel,
            driveFileId: dFile.id,
            lastModified: new Date().toLocaleString(),
          };
        } else {
          // New file from cloud
          const newCloudFile: SavedFile = {
            id: `file-cloud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: cleanName,
            lastModified: new Date().toLocaleString(),
            model: decryptedModel,
            driveFileId: dFile.id,
          };
          updatedLocalFiles.push(newCloudFile);
        }
      } catch (decryptErr) {
        console.warn(`Could not decrypt cloud file ${dFile.name}. Passphrase might differ.`, decryptErr);
      }
    }

    // 3. Upload any local files that do NOT exist on Google Drive (or failed to decrypt/corrupt)
    for (let i = 0; i < updatedLocalFiles.length; i++) {
      const localFile = updatedLocalFiles[i];
      const cloudFile = driveFiles.find((df) => df.name.replace('.aerocad', '') === localFile.name);

      if (cloudFile && successfullyDecryptedIds.has(cloudFile.id)) {
        // Keep drive file ID updated
        localFile.driveFileId = cloudFile.id;
      } else {
        // Encrypt and upload local file
        if (cloudFile) {
          localFile.driveFileId = cloudFile.id; // overwrite the empty/corrupt file
        }
        const driveId = await get().uploadFileToDrive(localFile);
        if (driveId) {
          localFile.driveFileId = driveId;
        }
      }
    }

    // 4. Save merged list to store & localStorage
    set({ files: updatedLocalFiles });
    localStorage.setItem('aerocad_files', JSON.stringify(updatedLocalFiles));
  },

  uploadFileToDrive: async (file) => {
    const token = get().driveAccessToken;
    const passphrase = get().drivePassphrase;
    if (!token || !passphrase) return null;

    try {
      const encryptedJson = await encryptModel(file.model, passphrase);
      const fileName = `${file.name}.aerocad`;

      if (file.driveFileId) {
        // OVERWRITE existing file content
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${file.driveFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: encryptedJson,
          }
        );
        if (updateRes.status === 401) {
          get().disconnectDrive();
          alert('Your Google Drive session has expired. Please connect to Google Drive again.');
          return null;
        }
        if (updateRes.ok) return file.driveFileId;
      }

      // CREATE a new file on Google Drive (hidden in appDataFolder)
      // Step A: Create file metadata in appDataFolder so it's hidden from user's Drive
      const createMetaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: 'application/json',
          parents: ['appDataFolder'],
        }),
      });

      if (!createMetaRes.ok) {
        if (createMetaRes.status === 401) {
          get().disconnectDrive();
          alert('Your Google Drive session has expired. Please connect to Google Drive again.');
        }
        throw new Error('Failed to create Drive metadata');
      }
      const metaData = await createMetaRes.json();
      const driveFileId = metaData.id;

      // Step B: Upload file content
      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: encryptedJson,
        }
      );

      if (uploadRes.status === 401) {
        get().disconnectDrive();
        alert('Your Google Drive session has expired. Please connect to Google Drive again.');
        return null;
      }

      if (uploadRes.ok) {
        // Cache the file ID back in state
        set((state) => ({
          files: state.files.map((f) => (f.id === file.id ? { ...f, driveFileId } : f)),
        }));
        localStorage.setItem('aerocad_files', JSON.stringify(get().files));
        return driveFileId;
      }
    } catch (e) {
      console.error(`Failed to upload ${file.name} to Drive:`, e);
    }
    return null;
  },

  deleteFileFromDrive: async (driveFileId) => {
    const token = get().driveAccessToken;
    if (!token) return;

    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(`Failed to delete file ${driveFileId} from Drive:`, e);
    }
  },
}));

if (typeof window !== 'undefined') {
  useAircraftStore.subscribe((state) => {
    const activeId = useFileStore.getState().activeFileId;
    if (activeId) {
      const currentFile = useFileStore.getState().files.find((f) => f.id === activeId);
      if (currentFile && JSON.stringify(currentFile.model) !== JSON.stringify(state.model)) {
        useFileStore.getState().saveActiveFile(state.model);
      }
    }
  });
}
