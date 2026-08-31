'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ShieldCheck,
  Lock,
  Database,
  Radio,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useFileStore } from '@/store/useFileStore';
import { useUIStore } from '@/store/useUIStore';

export function CloudSyncModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const syncAllFilesToVault = useFileStore((state) => state.syncAllFilesToVault);
  const isSyncing = useFileStore((state) => state.isSyncing);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check auth status on mount and subscribe to auth state changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setMsg({ type: 'success', text: 'Signed out successfully.' });
    setLoading(false);
  };

  const handleManualSyncAll = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await syncAllFilesToVault();
      setMsg({ type: 'success', text: 'All workspace designs are fully synchronized with your AES-256 encrypted vault!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (activeModal !== 'cloud_sync') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>Cloud CAD Vault</span>
                <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-300/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">
                  AES-256
                </span>
              </h3>
              <p className="text-xs text-sky-100/90 font-medium">Automatic End-to-End Encrypted Storage</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {msg && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-red-50 text-red-800 border-b border-red-100'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            <span className="flex-1 font-semibold">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {user ? (
            <div className="space-y-4">
              {/* User Account Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-sky-600/20">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate">{user?.email}</h4>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Authenticated Cloud Vault
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-sky-600" /> Security Model:
                    </span>
                    <span className="font-bold text-slate-800">PostgreSQL RLS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" /> Payload Cipher:
                    </span>
                    <span className="font-bold text-emerald-600">
                      AES-256-GCM
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" /> Auto Cloud Sync:
                    </span>
                    <span className="font-bold text-sky-600">Active (Real-time)</span>
                  </div>
                </div>
              </div>

              {/* Sync Actions */}
              <button
                onClick={handleManualSyncAll}
                disabled={loading || isSyncing}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing || loading ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing Workspace...' : 'Sync Workspace to Vault Now'}</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out of Supabase</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <Cloud className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">Not Authenticated</p>
              <p className="text-xs text-slate-500">Please sign in to connect to your Supabase Cloud CAD Vault.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
