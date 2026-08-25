import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'TurboDESiM Aero',
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
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      </body>
    </html>
  );
}
