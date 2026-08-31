'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TopToolbar } from '@/components/ui/TopToolbar';
import { LeftSidebar } from '@/components/ui/LeftSidebar';
import { RightProperties } from '@/components/ui/RightProperties';
import { BottomStatusBar } from '@/components/ui/BottomStatusBar';
import {
  WorkspaceNavbar,
  AerodynamicsLeftPanel,
  AerodynamicsRightPanel,
  StabilityLeftPanel,
  StabilityRightPanel,
  PerformanceLeftPanel,
  PerformanceRightPanel,
  MassLeftPanel,
  MassRightPanel,
  GeometryLeftPanel,
  GeometryRightPanel
} from '@/components/ui/WorkspacePanels';
import { ViewportControls } from '@/components/cad/ViewportControls';
import { SketcherModal } from '@/components/ui/SketcherModal';
import { PresetSelector } from '@/components/ui/PresetSelector';
import { MeasurementsPanel } from '@/components/ui/MeasurementsPanel';
import { ExportImportModal } from '@/components/ui/ExportImportModal';
import { EngineeringToolsModal } from '@/components/ui/EngineeringToolsModal';
import { DesignDatabaseModal } from '@/components/ui/DesignDatabaseModal';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { AboutModal } from '@/components/ui/AboutModal';
import { CloudSyncModal } from '@/components/ui/CloudSyncModal';
import { Dashboard } from '@/components/ui/Dashboard';
import { AuthGate } from '@/components/ui/AuthGate';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { useUIStore } from '@/store/useUIStore';
import { useFileStore } from '@/store/useFileStore';
import { useAircraftStore } from '@/store/useAircraftStore';
import { supabase } from '@/lib/supabaseClient';

// Dynamically import Three.js Viewport to avoid SSR window issues
const Viewport = dynamic(() => import('@/components/cad/Viewport').then((mod) => mod.Viewport), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-cad-bg flex items-center justify-center text-cad-accent font-mono text-sm">
      Loading ThermoDESiM Aero 3D Engine...
    </div>
  ),
});

export default function ThermoDESiMAero() {
  const [supabaseUser, setSupabaseUser] = React.useState<any>(null);
  const [authChecking, setAuthChecking] = React.useState(true);

  const currentView = useUIStore((state) => state.currentView);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const setDatabaseTab = useUIStore((state) => state.setDatabaseTab);
  const loadFiles = useFileStore((state) => state.loadFiles);
  const undo = useAircraftStore((state) => state.undo);
  const redo = useAircraftStore((state) => state.redo);
  const activeWorkspace = useUIStore((state) => state.activeWorkspace) || 'design';

  // Check Supabase authentication state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
      setAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const renderLeftPanel = () => {
    switch (activeWorkspace) {
      case 'design':
        return <LeftSidebar />;
      case 'geometry':
        return <GeometryLeftPanel />;
      case 'aerodynamics':
        return <AerodynamicsLeftPanel />;
      case 'stability':
        return <StabilityLeftPanel />;
      case 'performance':
        return <PerformanceLeftPanel />;
      case 'mass':
        return <MassLeftPanel />;
      default:
        return <LeftSidebar />;
    }
  };

  const renderRightPanel = () => {
    switch (activeWorkspace) {
      case 'design':
        return <RightProperties />;
      case 'geometry':
        return <GeometryRightPanel />;
      case 'aerodynamics':
        return <AerodynamicsRightPanel />;
      case 'stability':
        return <StabilityRightPanel />;
      case 'performance':
        return <PerformanceRightPanel />;
      case 'mass':
        return <MassRightPanel />;
      default:
        return <RightProperties />;
    }
  };

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if user is actively typing in ANY input, textarea, select, or editable element
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Do not trigger CAD shortcuts if not authenticated or in dashboard
      if (!supabaseUser || currentView === 'dashboard') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        openModal('database');
        setDatabaseTab('airfoils');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, openModal, closeModal, setDatabaseTab, supabaseUser, currentView]);

  if (authChecking) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 font-sans space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-lg shadow-sky-100">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-slate-900 tracking-wide">ThermoDESiM Aero</h2>
          <p className="text-xs text-slate-500">Verifying secure credentials...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Aerospace Auth Gateway
  if (!supabaseUser) {
    return <AuthGate onSuccess={() => setAuthChecking(false)} />;
  }

  return (
    <>
      {currentView === 'dashboard' ? (
        <Dashboard />
      ) : (
        <main className="w-screen h-screen flex flex-col bg-cad-bg overflow-hidden relative select-none">
          {/* Top Application Toolbar */}
          <TopToolbar />

          {/* Workspace Navbar */}
          <WorkspaceNavbar />

          {/* Main Workspace Layout */}
          <div className="flex-1 flex relative overflow-hidden">
            {/* Left Panel */}
            {renderLeftPanel()}

            {/* Center 3D CAD Viewport */}
            <div className="flex-1 relative h-full">
              <ViewportControls />
              <Viewport />
            </div>

            {/* Right Panel */}
            {renderRightPanel()}
          </div>

          {/* Bottom Aero Status Bar */}
          <BottomStatusBar />
        </main>
      )}

      {/* Application Modals (Universally Accessible in Dashboard & Editor) */}
      <SketcherModal />
      <PresetSelector />
      <MeasurementsPanel />
      <ExportImportModal />
      <EngineeringToolsModal />
      <DesignDatabaseModal />
      <SettingsModal />
      <AboutModal />
      <CloudSyncModal />
      <ContextMenu />
    </>
  );
}
