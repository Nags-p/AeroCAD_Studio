'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { useUIStore } from '@/store/useUIStore';
import { supabase } from '@/lib/supabaseClient';
import { AircraftThumbnail } from './AircraftThumbnail';
import { AIRCRAFT_PRESETS } from '@/engine/presets/aircraftPresets';
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
  RefreshCw,
  Pencil,
  HelpCircle,
  BookOpen,
  Info,
  ChevronDown,
  FileText,
  Scale,
  Search,
  ArrowUpDown,
  Sparkles,
  BarChart3,
  Layers,
  Clock,
  X,
  Megaphone,
  Copy,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

// Current changelog version — bump this when you want to show a new banner
const CHANGELOG_VERSION = '1.2';
const CHANGELOG_MESSAGE = 'Wing-mounted engine placement fixes, improved Google Drive sync performance, and cloud file deduplication.';

// Template showcase metadata
const TEMPLATE_SHOWCASE = [
  { id: 'blank', label: 'Blank Canvas', category: 'Clean Slate', desc: 'Start from scratch with an empty workspace', accent: 'from-slate-500 to-slate-600' },
  { id: 'commercial', label: 'Commercial Airliner', category: 'Airliner', desc: 'Low-wing swept design with twin turbofans', accent: 'from-emerald-500 to-emerald-600' },
  { id: 'high_wing_cargo', label: 'Tactical Cargo', category: 'Heavy Lift', desc: 'High-wing shoulder mount with T-tail', accent: 'from-amber-500 to-amber-600' },
  { id: 'delta_strike', label: 'Delta Fighter', category: 'Supersonic', desc: 'Mid-wing delta with single jet engine', accent: 'from-sky-500 to-sky-600' },
  { id: 'fighter', label: 'Air Superiority', category: 'Twin Jet', desc: 'Cropped delta with twin afterburners', accent: 'from-rose-500 to-rose-600' },
  { id: 'glider', label: 'High-Perf Sailplane', category: 'Glider', desc: 'Ultra-high aspect ratio soaring wing', accent: 'from-violet-500 to-violet-600' },
  { id: 'drone', label: 'ISR Drone', category: 'UAV / Drone', desc: 'V-tail pusher prop UAV configuration', accent: 'from-teal-500 to-teal-600' },
];

type SortMode = 'newest' | 'oldest' | 'az' | 'za';

export function Dashboard() {
  const {
    files,
    trashFiles,
    loadFiles,
    createNewFile,
    deleteFile,
    selectFile,
    renameFile,
    duplicateFile,
    restoreFile,
    deletePermanently,
    emptyScrapYard,
    isSyncing,
    syncAllFilesToVault
  } = useFileStore();

  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  
  const openModal = useUIStore((state) => state.openModal);
  const setHelpTab = useUIStore((state) => state.setHelpTab);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Rename state
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Modal toggle states
  const [isScrapYardOpen, setIsScrapYardOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  // Changelog banner state
  const [isChangelogDismissed, setIsChangelogDismissed] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Check Supabase authentication state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check localStorage for changelog dismissal on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`aerocad_changelog_dismissed_${CHANGELOG_VERSION}`);
      setIsChangelogDismissed(dismissed === 'true');
    }
  }, []);

  const handleDismissChangelog = () => {
    setIsChangelogDismissed(true);
    localStorage.setItem(`aerocad_changelog_dismissed_${CHANGELOG_VERSION}`, 'true');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName.trim();
    if (!name) {
      alert('Please enter a name for your design.');
      return;
    }
    createNewFile(name, selectedTemplate);
    setNewFileName('');
    setIsCreateModalOpen(false);
  };

  // --- Computed Stats ---
  const totalComponents = useMemo(() => {
    let count = 0;
    for (const f of files) {
      if (!f?.model) continue;
      count += (f.model.wings?.length ?? 0);
      count += (f.model.tails?.length ?? 0);
      count += (f.model.engines?.length ?? 0);
      if (f.model.fuselage) count += 1;
    }
    return count;
  }, [files]);

  const lastEditedStr = useMemo(() => {
    if (files.length === 0) return 'Never';
    let newest = files[0];
    for (const f of files) {
      if (new Date(f.lastModified).getTime() > new Date(newest.lastModified).getTime()) {
        newest = f;
      }
    }
    const diff = Date.now() - new Date(newest.lastModified).getTime();
    if (isNaN(diff) || diff < 0) return newest.lastModified;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return newest.lastModified;
  }, [files]);

  // --- Search & Sort ---
  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    switch (sortMode) {
      case 'newest':
        result.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [files, searchQuery, sortMode]);

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none relative overflow-hidden">
      {/* Background CAD Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-50/40 via-slate-50 to-indigo-50/20 pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-slate-200/80 px-8 flex items-center justify-between bg-white/80 backdrop-blur-lg relative z-20 shadow-sm overflow-visible">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2 rounded-xl text-white font-extrabold text-base shadow-md shadow-sky-200/50 hover:shadow-lg transition">
            <Plane className="w-5 h-5 text-white stroke-[2.5]" />
            <span>ThermoDESiM Aero</span>
          </div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/70 px-2.5 py-1 rounded-full hidden sm:inline-block">
            Studio Workbench
          </span>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center gap-3">
          {/* Help Dropdown Menu */}
          <div className="relative mr-1">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm hover:shadow cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Help & Docs</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {isHelpOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsHelpOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setHelpTab('about');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" /> About ThermoDESiM Aero
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setHelpTab('docs');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Quick Start Docs
                  </button>
                  <button
                    onClick={() => {
                      setHelpTab('keys');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" /> Keyboard Shortcuts
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setHelpTab('disclaimer');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Safety Disclaimer
                  </button>
                  <button
                    onClick={() => {
                      setHelpTab('eula');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> License (EULA)
                  </button>
                  <button
                    onClick={() => {
                      setHelpTab('privacy');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Privacy Policy
                  </button>
                  <button
                    onClick={() => {
                      setHelpTab('terms');
                      openModal('about');
                      setIsHelpOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex items-center gap-2.5 text-slate-800 cursor-pointer font-medium"
                  >
                    <Scale className="w-3.5 h-3.5 text-slate-500" /> Terms of Service
                  </button>
                </div>
              </>
            )}
          </div>

          {supabaseUser ? (
            <div className="flex items-center gap-2.5 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600">Vault: <strong className="text-slate-800 font-semibold">{supabaseUser.email}</strong></span>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5" />
              {isSyncing ? (
                <span className="text-sky-600 font-bold text-[11px] flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Syncing All...
                </span>
              ) : (
                <button
                  onClick={() => syncAllFilesToVault()}
                  className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold text-[11px]"
                  title="Sync all designs to Cloud Vault now"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  <span>Sync All</span>
                </button>
              )}
              <button
                onClick={() => openModal('cloud_sync')}
                className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold text-[11px]"
                title="Open Cloud Vault"
              >
                <Cloud className="w-3 h-3 text-sky-500" />
                <span>Vault</span>
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition cursor-pointer"
                title="Sign Out of Supabase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openModal('cloud_sync')}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md hover:shadow-lg active:translate-y-[1px] cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-white" />
              <span>Connect Supabase Vault</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-inner">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>Storage: <strong className="text-slate-700 font-bold">{supabaseUser ? 'Supabase Cloud & Local' : 'Local Disk'}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-6 flex flex-col gap-6 relative z-10 overflow-y-auto min-h-0">

        {/* ========== 1. CHANGELOG BANNER ========== */}
        {!isChangelogDismissed && (
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-lg shadow-sky-100/50 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md">
                <Megaphone className="w-4 h-4 text-sky-100" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full text-white">Version {CHANGELOG_VERSION}</span>
                <p className="text-xs text-white/95 leading-relaxed mt-1 font-semibold">{CHANGELOG_MESSAGE}</p>
              </div>
            </div>
            <button
              onClick={handleDismissChangelog}
              className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4.5 h-4.5 text-white" />
            </button>
          </div>
        )}

        {/* ========== 2. WELCOME HERO BANNER ========== */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-xl relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-bl from-sky-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
                <Sparkles className="w-6 h-6 text-sky-400" />
                Welcome to ThermoDESiM Aero{supabaseUser?.email ? `, ${supabaseUser.email.split('@')[0]}` : ''}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                High-precision parametric aerospace design and aerodynamics workbench. You have <strong className="text-white font-extrabold">{files.length}</strong> active aircraft design{files.length === 1 ? '' : 's'} loaded in your workspace.
                {files.length > 0 && <> Last edit session was <strong className="text-white">{lastEditedStr}</strong>.</>}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 active:translate-y-[1px] cursor-pointer"
            >
              <Plus className="w-5 h-5 text-white" />
              <span>Create Workspace</span>
            </button>
          </div>
        </section>

        {/* ========== 3. STATS CARDS ========== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Designs',
              value: files.length.toString(),
              icon: FolderOpen,
              color: 'text-sky-500',
              accent: 'bg-sky-500/10 border-sky-100',
            },
            {
              label: 'Storage Mode',
              value: supabaseUser ? 'Supabase & Local' : 'Local Only',
              icon: Database,
              color: 'text-emerald-500',
              accent: 'bg-emerald-500/10 border-emerald-100',
            },
            {
              label: 'Last Edited',
              value: lastEditedStr,
              icon: Clock,
              color: 'text-amber-500',
              accent: 'bg-amber-500/10 border-amber-100',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition duration-200 group hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${stat.accent} border shadow-inner flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{stat.label}</p>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ========== 4 & 5. TWO-COLUMN: RECENT DESIGNS + TEMPLATES ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start flex-1 min-h-0">

          {/* LEFT COLUMN: Recent Designs */}
          <section className="flex flex-col gap-4 min-h-0">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-sky-500" />
                    <span>Recent Aircraft Designs</span>
                  </h2>
                  <p className="text-xs text-slate-400">Manage and open your saved parametric aerospace models.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white rounded-xl transition active:translate-y-[1px] shadow-sm select-none cursor-pointer"
                    title="Create New Aircraft Design"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Create Design</span>
                  </button>

                  <button
                    onClick={() => setIsScrapYardOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 transition active:translate-y-[1px] shadow-sm select-none cursor-pointer"
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

                  <span className="text-xs bg-slate-50 text-slate-600 font-mono px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              {files.length > 0 && (
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search designs by name..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="appearance-none pl-8 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-400 cursor-pointer transition"
                    >
                      <option value="newest">Last Modified</option>
                      <option value="oldest">Oldest First</option>
                      <option value="az">Name A → Z</option>
                      <option value="za">Name Z → A</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  {searchQuery && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Files Grid */}
              {files.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="p-5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 shadow-inner">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-600">No saved designs found</p>
                    <p className="text-xs text-slate-400 max-w-xs leading-normal">
                      Get started by clicking the &quot;Create Design&quot; button above or choose a template from the gallery.
                    </p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
                  <Search className="w-8 h-8 text-slate-300" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-600">No designs match &quot;{searchQuery}&quot;</p>
                    <p className="text-xs text-slate-400">Try a different search term.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFiles.map((file) => {
                    const wingspan = Math.max(0, ...(file.model?.wings?.map((w) => w.span) || []));
                    const fuselageLen = file.model?.fuselage?.length || 0;
                    const partsCount =
                      (file.model?.fuselage && file.model.fuselage.visible ? 1 : 0) +
                      (file.model?.wings?.filter((w) => w.visible).length || 0) +
                      (file.model?.tails?.filter((t) => t.visible).length || 0) +
                      (file.model?.engines?.filter((e) => e.visible).length || 0);
                    const enginesCount = file.model?.engines?.filter((e) => e.visible).length || 0;
                    const enginesType = file.model?.engines?.[0]?.type || 'propulsion';

                    return (
                      <div
                        key={file.id}
                        onClick={() => selectFile(file.id)}
                        className="group bg-white border border-slate-200/90 hover:border-sky-500/70 rounded-3xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-4 shadow-xs hover:shadow-lg hover:-translate-y-1 relative overflow-hidden"
                      >
                        {/* Top Section: CAD Thumbnail + Title + Specs + Actions */}
                        <div className="flex items-start gap-4">
                          {/* 3D CAD Preview Thumbnail (84x84) */}
                          <div className="flex-shrink-0">
                            <AircraftThumbnail model={file.model} width={84} height={84} />
                          </div>

                          {/* Content / Info Area */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Title & Quick Actions */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
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
                                    className="text-sm font-extrabold text-slate-900 bg-sky-50 border border-sky-400 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-sky-400/30 w-full"
                                    autoFocus
                                  />
                                ) : (
                                  <h3
                                    className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors truncate tracking-tight"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </h3>
                                )}
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{file.lastModified}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingFileId(file.id);
                                    setRenamingFileName(file.name);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                  title="Rename Design"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateFile(file.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                  title="Duplicate Design"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFile(file.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Move to Scrap Yard"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Aircraft Specs Pill Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {wingspan > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                                  Span: <strong className="font-mono text-slate-900">{wingspan.toFixed(1)} {file.model.units === 'imperial' ? 'ft' : 'm'}</strong>
                                </span>
                              )}
                              {fuselageLen > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                                  Length: <strong className="font-mono text-slate-900">{fuselageLen.toFixed(1)} {file.model.units === 'imperial' ? 'ft' : 'm'}</strong>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                                <Layers className="w-2.5 h-2.5 text-slate-400" />
                                <span>{partsCount} component{partsCount === 1 ? '' : 's'}</span>
                              </span>
                              {enginesCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200/60">
                                  <span>{enginesCount}x {enginesType}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Info & Open Button */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/70 font-medium">
                              {file.model?.units === 'imperial' ? 'Imperial (ft)' : 'Metric (m)'}
                            </span>
                            {file.cloudSynced || supabaseUser ? (
                              <span className="bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono text-[10px] font-bold shadow-2xs">
                                <Cloud className="w-3 h-3 text-sky-600" /> Vault Synced
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono text-[10px]">
                                Local Disk
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-sky-600 font-extrabold group-hover:text-sky-700 transition-colors">
                            <span>Open CAD Studio</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-150" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Templates Gallery */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                <span>Template Gallery</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Browse aerodynamic presets to initialize new projects.</p>
            </div>

            <div className="flex flex-col gap-3">
              {TEMPLATE_SHOWCASE.map((tpl) => {
                const presetModel = AIRCRAFT_PRESETS[tpl.id];
                return (
                  <div
                    key={tpl.id}
                    className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3 hover:border-sky-400 hover:bg-sky-50/30 hover:shadow-sm transition group cursor-pointer flex items-center gap-3.5 duration-200"
                    onClick={() => handleUseTemplate(tpl.id)}
                  >
                    <div className="flex-shrink-0">
                      {presetModel ? (
                        <AircraftThumbnail model={presetModel} width={56} height={56} />
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tpl.accent} text-white flex items-center justify-center shadow-inner`}>
                          <FileCode className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-extrabold text-slate-800 group-hover:text-sky-650 transition truncate">{tpl.label}</p>
                        <span className="text-[9px] font-mono font-bold bg-white text-slate-500 border border-slate-200/80 px-1.5 py-0.2 rounded-sm uppercase">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 truncate">{tpl.desc}</p>
                    </div>
                    <button
                      className="flex-shrink-0 p-2 text-sky-500 hover:text-sky-600 hover:bg-white border border-transparent hover:border-sky-100 rounded-xl transition cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(tpl.id);
                      }}
                      title="Use template blueprint"
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* --- Create Design Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-50 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-sky-600 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>Create New Design</span>
                </h3>
                <p className="text-xs text-slate-500">Initialize a new parametric aircraft model from a blueprint template.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="modalFileName" className="text-xs font-semibold text-slate-700">Design Name</label>
                <input
                  id="modalFileName"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Skycruiser MK-I"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-700">Choose Starting Template</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {[
                    { id: 'blank', label: 'Blank Canvas', desc: 'Empty workspace with no initial parts', icon: FileCode, accent: 'text-slate-500' },
                    { id: 'commercial', label: 'Commercial Airliner', desc: 'Low-mount swept wings & twin turbofans', icon: Plane, accent: 'text-emerald-500' },
                    { id: 'high_wing_cargo', label: 'Tactical Cargo', desc: 'High-mount shoulder wings & T-tail', icon: Plane, accent: 'text-amber-500' },
                    { id: 'delta_strike', label: 'Delta Strike Fighter', desc: 'Mid-mount delta wings & single jet', icon: Plane, accent: 'text-sky-500' },
                    { id: 'fighter', label: 'Air Superiority', desc: 'Cropped delta with twin afterburners', icon: Plane, accent: 'text-rose-500' },
                    { id: 'glider', label: 'High-Perf Sailplane', desc: 'Ultra-high aspect ratio soaring wing', icon: Plane, accent: 'text-violet-500' },
                  ].map((tpl) => {
                    const presetModel = AIRCRAFT_PRESETS[tpl.id];
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          selectedTemplate === tpl.id
                            ? 'bg-sky-50/80 border-sky-500 shadow-sm ring-2 ring-sky-300/60'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {presetModel ? (
                            <AircraftThumbnail model={presetModel} width={48} height={48} />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center ${tpl.accent}`}>
                              <FileCode className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold block text-slate-800 truncate">{tpl.label}</span>
                          <span className="text-[10px] text-slate-500 leading-normal block truncate">{tpl.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow hover:shadow-md active:translate-y-[1px] cursor-pointer"
                >
                  <span>Create Design</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Hangar Scrap Yard Modal --- */}
      {isScrapYardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-50 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Hangar Scrap Yard</span>
                </h3>
                <p className="text-xs text-slate-500">Decommissioned aircraft designs. Restore them or scrap them permanently.</p>
              </div>
              <button
                onClick={() => setIsScrapYardOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base cursor-pointer"
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
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-inner"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <AircraftThumbnail model={file.model} width={52} height={52} />
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
                        <span className="font-mono bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200">
                          {file.model?.units === 'imperial' ? 'Imperial (ft)' : 'Metric (m)'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => restoreFile(file.id)}
                            className="flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700 bg-white hover:bg-slate-100/50 border border-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                            title="Restore Design"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-sky-600" /> Restore
                          </button>
                          <button
                            onClick={() => deletePermanently(file.id)}
                            className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50/50 border border-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
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
                <span className="text-slate-500 font-mono">
                  Contains {trashFiles.length} item{trashFiles.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={emptyScrapYard}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl transition shadow active:translate-y-[1px] cursor-pointer"
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
