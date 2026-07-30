import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AeroCAD Studio - Parametric Browser Aircraft CAD',
  description: 'Browser-based conceptual aircraft design software powered by procedural mathematical geometry and Three.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cad-bg text-cad-text h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
