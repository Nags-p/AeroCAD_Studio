'use client';

import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, Key, Info, Zap, Github, ShieldAlert, FileText, Lock, Scale } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import {
  ABOUT_CONTENT,
  DISCLAIMER_CONTENT,
  EULA_CONTENT,
  PRIVACY_CONTENT,
  TERMS_CONTENT,
  USERGUIDE_CONTENT
} from './docContent';

type HelpTabType = 'about' | 'docs' | 'keys' | 'disclaimer' | 'eula' | 'privacy' | 'terms';

function cleanContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/o\^,\?/g, '✈️')
    .replace(/dY"\?/g, '📐')
    .replace(/dYO,\?/g, '🌬️')
    .replace(/dY\?-,\?/g, '🏗️')
    .replace(/s-,\?/g, '⚖️')
    .replace(/dY"/g, '📦')
    .replace(/\+'/g, '➔')
    .replace(/\?/g, '–')
    .replace(/\+/g, '➔');
}

function renderBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part))}
    </>
  );
}

function MarkdownViewer({ content }: { content: string }) {
  const cleaned = cleanContent(content);
  const lines = cleaned.split('\n');
  return (
    <div className="space-y-3 text-xs leading-relaxed text-slate-700 select-text max-w-none">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={idx} className="h-2" />;
        
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-base font-black text-slate-900 border-b border-slate-150 pb-1.5 mt-4 select-none">{trimmed.substring(2)}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-[13px] font-extrabold text-slate-950 mt-4 select-none">{trimmed.substring(3)}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-xs font-bold text-slate-900 mt-3 select-none">{trimmed.substring(4)}</h3>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h4 key={idx} className="text-[11px] font-bold text-slate-800 mt-2.5 select-none">{trimmed.substring(5)}</h4>;
        }
        if (trimmed === '---') {
          return <hr key={idx} className="my-4 border-t border-slate-200" />;
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-sky-500 pl-4 py-1.5 bg-slate-50 rounded-r font-medium italic text-slate-650 my-2">
              {trimmed.substring(2)}
            </blockquote>
          );
        }
        
        // List item checking
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-4">
              <span className="text-slate-400 select-none">•</span>
              <span className="flex-1">{renderBoldText(trimmed.substring(2))}</span>
            </div>
          );
        }
        
        const numListMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
        if (numListMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-4">
              <span className="text-sky-600 font-mono font-bold select-none text-[10px]">{numListMatch[1]}.</span>
              <span className="flex-1">{renderBoldText(numListMatch[2])}</span>
            </div>
          );
        }
        
        return <p key={idx}>{renderBoldText(line)}</p>;
      })}
    </div>
  );
}

export function AboutModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  
  const activeTab = useUIStore((state) => state.activeHelpTab);
  const setActiveTab = useUIStore((state) => state.setHelpTab);

  if (activeModal !== 'about') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[70vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5 font-bold text-slate-700">
            <HelpCircle className="w-5 h-5 text-slate-600 stroke-[2.2]" />
            <span className="text-sm font-extrabold tracking-wider uppercase">Help & Documentation</span>
          </div>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sub-tab selection sidebar */}
          <div className="w-48 bg-slate-50 border-r border-slate-200 p-3 flex flex-col gap-1.5 select-none overflow-y-auto">
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'about'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'docs'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Quick Start Docs</span>
            </button>

            <button
              onClick={() => setActiveTab('keys')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'keys'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Keyboard Keys</span>
            </button>

            <div className="my-1 border-t border-slate-200" />
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold px-3 select-none">Legal & Safety</div>

            <button
              onClick={() => setActiveTab('disclaimer')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'disclaimer'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Disclaimer</span>
            </button>

            <button
              onClick={() => setActiveTab('eula')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'eula'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>EULA</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'privacy'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition text-left border ${
                activeTab === 'terms'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Terms of Service</span>
            </button>
          </div>

          {/* Main content display */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
            
            {/* TAB 1: ABOUT */}
            {activeTab === 'about' && (
              <MarkdownViewer content={ABOUT_CONTENT} />
            )}

            {/* TAB 2: DOCUMENTATION */}
            {activeTab === 'docs' && (
              <MarkdownViewer content={USERGUIDE_CONTENT} />
            )}

            {/* TAB 3: KEYBOARD SHORTCUTS */}
            {activeTab === 'keys' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider select-none">Workspace Keyboard Keys</h4>
                
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-sans font-bold">
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2 text-right">Key Binding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-800">
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Undo Action</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Ctrl + Z</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Redo Action</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Ctrl + Y</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Open Airfoil Library</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">A</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Close Active Modal</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Escape</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Orbit Camera rotation</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Left Mouse Click + Drag</kbd></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-sans font-semibold text-slate-900">Pan Camera translation</td>
                        <td className="px-4 py-2 text-right"><kbd className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 shadow-sm text-[10px]">Right Mouse Click + Drag</kbd></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: DISCLAIMER */}
            {activeTab === 'disclaimer' && (
              <MarkdownViewer content={DISCLAIMER_CONTENT} />
            )}

            {/* TAB 5: EULA */}
            {activeTab === 'eula' && (
              <MarkdownViewer content={EULA_CONTENT} />
            )}

            {/* TAB 6: PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <MarkdownViewer content={PRIVACY_CONTENT} />
            )}

            {/* TAB 7: TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <MarkdownViewer content={TERMS_CONTENT} />
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
