'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFileStore } from '@/store/useFileStore';
import {
  Plane,
  FolderOpen,
  Plus,
  Trash2,
  Cloud,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Database,
  Lock,
  Loader2,
  Key,
  ShieldCheck,
  LogOut,
  RotateCcw,
  Pencil
} from 'lucide-react';

export function Dashboard() {
  const {
    files,
    trashFiles,
    loadFiles,
    createNewFile,
    deleteFile,
    selectFile,
    renameFile,
    driveAccessToken,
    driveEmail,
    drivePassphrase,
    isSyncing,
    connectDrive,
    disconnectDrive,
    setDrivePassphrase,
    restoreFile,
    deletePermanently,
    emptyScrapYard
  } = useFileStore();

  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  // Rename state
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Modal toggle states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isScrapYardOpen, setIsScrapYardOpen] = useState(false);

  // Encryption password state
  const [passphraseInput, setPassphraseInput] = useState('');
  const [passphraseConfirmInput, setPassphraseConfirmInput] = useState('');
  const [passphraseError, setPassphraseError] = useState('');

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName.trim() || `Untitled Design ${new Date().toLocaleDateString()}`;
    createNewFile(name, selectedTemplate);
    setNewFileName('');
  };

  // Google OAuth Login
  const handleConnectDrive = () => {
    if (typeof window === 'undefined' || !(window as any).google) {
      alert('Google API library is loading. Please try again in a moment.');
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: '321941150855-2cajees07vnousmchpp5c913gj3vpn2d.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            await connectDrive(tokenResponse.access_token);
            // Open the password prompt modal if no password is set
            const currentPass = useFileStore.getState().drivePassphrase;
            if (!currentPass) {
              setIsPasswordModalOpen(true);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Error initializing Google token client:', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassphraseError('');

    if (passphraseInput.length < 6) {
      setPassphraseError('Passphrase must be at least 6 characters.');
      return;
    }

    if (passphraseInput !== passphraseConfirmInput) {
      setPassphraseError('Passphrases do not match.');
      return;
    }

    await setDrivePassphrase(passphraseInput);
    setIsPasswordModalOpen(false);
    setPassphraseInput('');
    setPassphraseConfirmInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Background CAD Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-50/50 via-slate-50 to-indigo-50/30 pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md relative z-10 shadow-sm">
        <div className="flex items-center gap-2 bg-sky-600 px-3 py-1.5 rounded-lg text-white font-bold text-base shadow">
          <Plane className="w-5 h-5 text-white stroke-[2.5]" />
          <span>AeroCAD Studio</span>
          <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-white/20 rounded text-white">PRO</span>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center gap-3">
          {driveAccessToken ? (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-xs">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600">Connected: <strong className="text-slate-800 font-semibold">{driveEmail}</strong></span>
              <div className="w-px h-3 bg-slate-300 mx-1" />
              {isSyncing ? (
                <span className="text-sky-600 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Encrypted Sync
                </span>
              )}
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="ml-1 p-1 text-slate-400 hover:text-sky-600 rounded transition"
                title="Passcode Settings / Change Passphrase"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={disconnectDrive}
                className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                title="Disconnect Google Drive (Passcode remains saved on this device)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectDrive}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-full transition shadow hover:shadow-md active:translate-y-[1px]"
            >
              <Cloud className="w-3.5 h-3.5 text-white" />
              <span>Connect Google Drive</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>Storage: <strong className="text-slate-700 font-semibold">{driveAccessToken ? 'Encrypted Drive + Local' : 'Local Disk'}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Column: Create New File */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col gap-6 shadow-sm h-fit">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-sky-600 flex items-center gap-2">
              <Plus className="w-5 h-5 animate-pulse" />
              <span>Create New Design</span>
            </h2>
            <p className="text-xs text-slate-500">Initialize a new parametric aircraft model from a template.</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="fileName" className="text-xs font-semibold text-slate-700">Design Name</label>
              <input
                id="fileName"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. Skycruiser MK-I"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-700">Choose Starting Template</span>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'blank', label: 'Blank Canvas', desc: 'Empty workspace with basic fuselage only', icon: FileCode, accent: 'text-slate-500' },
                  { id: 'high_wing_cargo', label: 'Tactical Cargo (High Wing)', desc: 'High-mount shoulder wings, T-tail & twin turboprops', icon: Plane, accent: 'text-amber-500' },
                  { id: 'commercial', label: 'Commercial Airliner (Low Wing)', desc: 'Low-mount swept wings, conventional tail & twin turbofans', icon: Plane, accent: 'text-emerald-500' },
                  { id: 'delta_strike', label: 'Delta Strike Fighter (Mid Wing)', desc: 'Mid-mount supersonic delta wings & single jet engine', icon: Plane, accent: 'text-sky-500' },
                ].map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        selectedTemplate === tpl.id
                          ? 'bg-sky-50/70 border-sky-500/80 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-slate-50 border border-slate-100 ${tpl.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold block text-slate-800">{tpl.label}</span>
                        <span className="text-[10px] text-slate-500 leading-normal">{tpl.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow hover:shadow-md active:translate-y-[1px]"
            >
              <span>Create Design</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>
        </section>

        {/* Center Column: Saved / Recent Files */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-sky-500" />
                  <span>Recent Aircraft Designs</span>
                </h2>
                <p className="text-xs text-slate-500">Manage and load your saved parametric designs.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScrapYardOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 transition active:translate-y-[1px] shadow-sm select-none"
                  title="Open Hangar Scrap Yard"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Scrap Yard</span>
                  {trashFiles.length > 0 && (
                    <span className="text-[10px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                      {trashFiles.length}
                    </span>
                  )}
                </button>

                <span className="text-xs bg-slate-50 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
              </div>
            </div>

            {/* Files Grid / List */}
            {files.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
                <div className="p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600">No saved designs found</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-normal">
                    Get started by creating a new design from the templates on the left.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[30rem] pr-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => selectFile(file.id)}
                    className="group bg-white border border-slate-200 hover:border-sky-500/60 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between gap-4 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                          <Plane className="w-4 h-4" />
                        </div>
                        <div>
                          {renamingFileId === file.id ? (
                            <input
                              ref={renameInputRef}
                              value={renamingFileName}
                              onChange={(e) => setRenamingFileName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (renamingFileName.trim()) {
                                    renameFile(file.id, renamingFileName.trim());
                                  }
                                  setRenamingFileId(null);
                                } else if (e.key === 'Escape') {
                                  setRenamingFileId(null);
                                }
                              }}
                              onBlur={() => {
                                if (renamingFileName.trim()) {
                                  renameFile(file.id, renamingFileName.trim());
                                }
                                setRenamingFileId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-bold text-slate-800 bg-sky-50 border border-sky-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-sky-400 w-full"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-800 group-hover:text-sky-600 transition block leading-tight">
                              {file.name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Modified: {file.lastModified}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFileId(file.id);
                            setRenamingFileName(file.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-slate-50 rounded-lg transition"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition"
                          title="Move to Scrap Yard"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                          {file.model.units === 'imperial' ? 'Imperial (ft)' : 'Metric (m)'}
                        </span>
                        {file.driveFileId && (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono select-none" title="Synced in Cloud">
                            <Cloud className="w-2.5 h-2.5" /> Cloud
                          </span>
                        )}
                      </div>
                      <span className="text-sky-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-0.5">
                        Open Design <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row: Cloud Sync Info */}
          <div className="bg-gradient-to-r from-sky-50/40 via-indigo-50/20 to-slate-100/40 p-5 rounded-2xl border border-sky-100 shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-100/50 border border-sky-200 text-sky-600">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Recommended: Secure Cloud Sync Integration</h3>
                <span className="text-[9px] bg-sky-100 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                AeroCAD Studio supports secure client-side encryption. Connect Google Drive to sync your design files. We encrypt the files locally using **AES-256-GCM** before uploading them, making it impossible for third parties (or Google) to read your designs without your passphrase.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-sky-600" /> AES-256 Client-Side Encryption
                </span>
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Passphrase is Never Uploaded
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- Passphrase Modal --- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl relative overflow-hidden text-slate-800">
            {/* Background Accent glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-50 rounded-full blur-2xl pointer-events-none" />

            {drivePassphrase && (
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            )}

            <div className="text-center space-y-2.5">
              <div className="w-12 h-12 bg-sky-50 border border-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {drivePassphrase ? 'Update Encryption Passphrase' : 'Setup Cloud Encryption Passphrase'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {drivePassphrase
                  ? 'Your encryption passcode is currently saved on this device. You can update your passcode below.'
                  : 'Enter a secret passcode for AES-256 client-side encryption. This passcode is saved locally on your device so logging out and in will automatically remember it.'}
                <span className="block mt-1 font-semibold text-amber-600">
                  ⚠️ Google and AeroCAD do not store this passcode. If lost, your cloud files cannot be recovered.
                </span>
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Passphrase</label>
                <input
                  type="password"
                  value={passphraseInput}
                  onChange={(e) => setPassphraseInput(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500/80 transition"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Confirm Passphrase</label>
                <input
                  type="password"
                  value={passphraseConfirmInput}
                  onChange={(e) => setPassphraseConfirmInput(e.target.value)}
                  placeholder="Repeat passphrase"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500/80 transition"
                  required
                />
              </div>

              {passphraseError && (
                <div className="text-red-600 text-xs bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{passphraseError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {drivePassphrase && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow flex items-center justify-center gap-2 active:translate-y-[1px]"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>{drivePassphrase ? 'Save Passphrase' : 'Initialize Encrypted Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Hangar Scrap Yard Modal --- */}
      {isScrapYardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl relative overflow-hidden text-slate-800 flex flex-col max-h-[85vh]">
            {/* Background Accent glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-50 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Hangar Scrap Yard</span>
                </h3>
                <p className="text-xs text-slate-505">Decommissioned aircraft designs. Restore them or scrap them permanently.</p>
              </div>
              <button
                onClick={() => setIsScrapYardOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* List of Trashed Files */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {trashFiles.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Trash2 className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold">Scrap yard is empty</p>
                  <p className="text-xs text-slate-400">Decommissioned designs will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trashFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-inner"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-200/50 text-slate-600 border border-slate-200">
                          <Plane className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Trashed: {file.lastModified}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                        <span className="font-mono bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                          {file.model.units === 'imperial' ? 'Imperial (ft)' : 'Metric (m)'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => restoreFile(file.id)}
                            className="flex items-center gap-0.5 font-bold text-sky-600 hover:text-sky-700 bg-white hover:bg-slate-100/50 border border-slate-200 px-2 py-1 rounded transition"
                            title="Restore Design"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-sky-600" /> Restore
                          </button>
                          <button
                            onClick={() => deletePermanently(file.id)}
                            className="flex items-center gap-0.5 font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50/50 border border-slate-200 px-2 py-1 rounded transition"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" /> Scrap
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {trashFiles.length > 0 && (
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-505 font-mono">
                  Contains {trashFiles.length} item{trashFiles.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={emptyScrapYard}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl transition shadow active:translate-y-[1px]"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Purge Scrap Yard</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
