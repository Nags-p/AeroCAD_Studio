'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { TopToolbar } from '@/components/ui/TopToolbar';
import { LeftSidebar } from '@/components/ui/LeftSidebar';
import { RightProperties } from '@/components/ui/RightProperties';
import { BottomStatusBar } from '@/components/ui/BottomStatusBar';
import { ViewportControls } from '@/components/cad/ViewportControls';
import { SketcherModal } from '@/components/ui/SketcherModal';
import { AirfoilLibrary } from '@/components/ui/AirfoilLibrary';
import { PresetSelector } from '@/components/ui/PresetSelector';
import { MeasurementsPanel } from '@/components/ui/MeasurementsPanel';
import { ExportImportModal } from '@/components/ui/ExportImportModal';

// Dynamically import Three.js Viewport to avoid SSR window issues
const Viewport = dynamic(() => import('@/components/cad/Viewport').then((mod) => mod.Viewport), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-cad-bg flex items-center justify-center text-cad-accent font-mono text-sm">
      Loading AeroCAD 3D Engine...
    </div>
  ),
});

export default function AeroCADStudio() {
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
      <AirfoilLibrary />
      <PresetSelector />
      <MeasurementsPanel />
      <ExportImportModal />
    </main>
  );
}
