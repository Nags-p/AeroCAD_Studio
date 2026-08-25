'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TopToolbar } from '@/components/ui/TopToolbar';
import { LeftSidebar } from '@/components/ui/LeftSidebar';
import { RightProperties } from '@/components/ui/RightProperties';
import { BottomStatusBar } from '@/components/ui/BottomStatusBar';
import { ViewportControls } from '@/components/cad/ViewportControls';
import { SketcherModal } from '@/components/ui/SketcherModal';
import { PresetSelector } from '@/components/ui/PresetSelector';
import { MeasurementsPanel } from '@/components/ui/MeasurementsPanel';
import { ExportImportModal } from '@/components/ui/ExportImportModal';
import { EngineeringToolsModal } from '@/components/ui/EngineeringToolsModal';
import { DesignDatabaseModal } from '@/components/ui/DesignDatabaseModal';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { AboutModal } from '@/components/ui/AboutModal';
import { Dashboard } from '@/components/ui/Dashboard';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { useUIStore } from '@/store/useUIStore';
import { useFileStore } from '@/store/useFileStore';
import { useAircraftStore } from '@/store/useAircraftStore';

// Dynamically import Three.js Viewport to avoid SSR window issues
const Viewport = dynamic(() => import('@/components/cad/Viewport').then((mod) => mod.Viewport), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-cad-bg flex items-center justify-center text-cad-accent font-mono text-sm">
      Loading TurboDESiM Aero 3D Engine...
    </div>
  ),
});

export default function TurboDESiMAero() {
  const currentView = useUIStore((state) => state.currentView);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const setDatabaseTab = useUIStore((state) => state.setDatabaseTab);
  const loadFiles = useFileStore((state) => state.loadFiles);
  const undo = useAircraftStore((state) => state.undo);
  const redo = useAircraftStore((state) => state.redo);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if user is actively typing in a text field
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
          target.isContentEditable)
      ) {
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
  }, [undo, redo, openModal, closeModal, setDatabaseTab]);

  if (currentView === 'dashboard') {
    return (
      <>
        <Dashboard />
        <AboutModal />
      </>
    );
  }

  return (
    <main className="w-screen h-screen flex flex-col bg-cad-bg overflow-hidden relative select-none">
      {/* Top Application Toolbar */}
      <TopToolbar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Scene Tree Sidebar */}
        <LeftSidebar />

        {/* Center 3D CAD Viewport */}
        <div className="flex-1 relative h-full">
          <ViewportControls />
          <Viewport />
        </div>

        {/* Right Property Inspector Panel */}
        <RightProperties />
      </div>

      {/* Bottom Aero Status Bar */}
      <BottomStatusBar />

      {/* Application Modals */}
      <SketcherModal />
      <PresetSelector />
      <MeasurementsPanel />
      <ExportImportModal />
      <EngineeringToolsModal />
      <DesignDatabaseModal />
      <SettingsModal />
      <AboutModal />
      <ContextMenu />
    </main>
  );
}
