import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { DevToolsGuard } from '@/components/ui/DevToolsGuard';

export const metadata: Metadata = {
  title: 'ThermoDESiM Aero',
  description: 'Parametric conceptual aircraft design software powered by procedural mathematical geometry and Three.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cad-bg text-cad-text h-screen w-screen overflow-hidden">
        <DevToolsGuard />
        {children}
      </body>
    </html>
  );
}
