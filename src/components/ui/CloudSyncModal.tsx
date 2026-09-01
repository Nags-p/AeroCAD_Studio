'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Radio,
  Pencil,
  Building2,
  Briefcase,
  Mail,
  FileText,
  Check,
  Sparkles,
  ShieldCheck,
  Phone,
  Globe,
  GraduationCap,
  Wrench,
  Compass,
  Layers,
  Award,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useFileStore } from '@/store/useFileStore';
import { useUIStore } from '@/store/useUIStore';

const AVATAR_THEMES: { id: string; name: string; bg: string; ring: string }[] = [
  { id: 'blue', name: 'Sky Blue', bg: 'bg-gradient-to-br from-sky-500 to-blue-600', ring: 'ring-sky-400' },
  { id: 'purple', name: 'Indigo Purple', bg: 'bg-gradient-to-br from-indigo-500 to-purple-600', ring: 'ring-indigo-400' },
  { id: 'emerald', name: 'Emerald Teal', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', ring: 'ring-emerald-400' },
  { id: 'amber', name: 'Amber Orange', bg: 'bg-gradient-to-br from-amber-500 to-orange-600', ring: 'ring-amber-400' },
  { id: 'rose', name: 'Rose Pink', bg: 'bg-gradient-to-br from-rose-500 to-pink-600', ring: 'ring-rose-400' },
  { id: 'slate', name: 'Obsidian Slate', bg: 'bg-gradient-to-br from-slate-700 to-slate-900', ring: 'ring-slate-400' },
];

const USE_CASE_OPTIONS = [
  { id: 'conceptual', label: 'Conceptual exploration' },
  { id: 'coursework', label: 'Coursework' },
  { id: 'research', label: 'Research' },
  { id: 'portfolio', label: 'Portfolio projects' },
  { id: 'professional-workflow', label: 'Professional workflow' },
];

const PRIOR_TOOLS_OPTIONS = [
  { id: 'kompas3d', label: 'KOMPAS-3D' },
  { id: 'solidworks', label: 'SolidWorks' },
  { id: 'catia', label: 'CATIA' },
  { id: 'fusion360', label: 'Fusion 360' },
  { id: 'openvsp', label: 'OpenVSP' },
  { id: 'none', label: 'None yet' },
];

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  student: { label: 'Student', icon: GraduationCap, color: 'bg-sky-50 text-sky-700 border-sky-200' },
  professional: { label: 'Working Professional', icon: Briefcase, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  educator: { label: 'Educator / Researcher', icon: Award, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hobbyist: { label: 'Hobbyist Designer', icon: Compass, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function CloudSyncModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const openModal = useUIStore((state) => state.openModal);
  const syncAllFilesToVault = useFileStore((state) => state.syncAllFilesToVault);
  const isSyncing = useFileStore((state) => state.isSyncing);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Full User Profile State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    role: 'student',
    // Student fields
    institution: '',
    major: '',
    grad_year: '',
    // Professional fields
    company: '',
    job_title: '',
    industry: 'Aerospace and defense',
    // Educator fields
    dept: '',
    // Hobbyist fields
    project_interest: '',
    // Experience & tools
    experience_level: 'intermediate',
    use_cases: [] as string[],
    prior_tools: [] as string[],
    // Bio & Theme
    bio: '',
    avatar_color: 'blue',
  });

  const extractUserData = (userObj: any) => {
    if (!userObj?.user_metadata) return;
    const meta = userObj.user_metadata;
    setFormData({
      full_name: meta.full_name || '',
      phone: meta.phone || '',
      country: meta.country || '',
      role: meta.role || 'student',
      institution: meta.institution || '',
      major: meta.major || '',
      grad_year: meta.grad_year || '',
      company: meta.company || meta.organization || '',
      job_title: meta.job_title || '',
      industry: meta.industry || 'Aerospace and defense',
      dept: meta.dept || '',
      project_interest: meta.project_interest || '',
      experience_level: meta.experience_level || 'intermediate',
      use_cases: Array.isArray(meta.use_cases) ? meta.use_cases : ['conceptual'],
      prior_tools: Array.isArray(meta.prior_tools) ? meta.prior_tools : [],
      bio: meta.bio || '',
      avatar_color: meta.avatar_color || 'blue',
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) extractUserData(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) extractUserData(currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const currentTheme = AVATAR_THEMES.find((t) => t.id === formData.avatar_color) || AVATAR_THEMES[0];
  const roleInfo = ROLE_LABELS[formData.role] || ROLE_LABELS.student;
  const RoleIcon = roleInfo.icon;

  const getInitials = () => {
    if (formData.full_name?.trim()) {
      const parts = formData.full_name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return formData.full_name.trim().slice(0, 2).toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const toggleUsecase = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      use_cases: prev.use_cases.includes(val)
        ? prev.use_cases.filter((item) => item !== val)
        : [...prev.use_cases, val],
    }));
  };

  const toggleTool = (val: string) => {
    if (val === 'none') {
      setFormData((prev) => ({ ...prev, prior_tools: ['none'] }));
      return;
    }
    setFormData((prev) => {
      const filtered = prev.prior_tools.filter((item) => item !== 'none');
      return {
        ...prev,
        prior_tools: filtered.includes(val)
          ? filtered.filter((item) => item !== val)
          : [...filtered, val],
      };
    });
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.full_name.trim()) {
      setMsg({ type: 'error', text: 'Full Name is required.' });
      return;
    }

    setSavingProfile(true);
    setMsg(null);

    const orgName =
      formData.role === 'student' || formData.role === 'educator'
        ? formData.institution
        : formData.company;

    const titleName =
      formData.role === 'student'
        ? `Student (${formData.major || 'Aerospace'})`
        : formData.role === 'educator'
        ? `Educator / Researcher (${formData.dept || 'Aeronautics'})`
        : formData.role === 'hobbyist'
        ? 'Hobbyist Designer'
        : formData.job_title || 'Design Engineer';

    const updatedMetadata = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      country: formData.country.trim(),
      role: formData.role,
      institution: formData.institution.trim(),
      major: formData.major.trim(),
      grad_year: formData.grad_year.trim(),
      company: formData.company.trim(),
      job_title: titleName,
      organization: orgName.trim(),
      industry: formData.industry,
      dept: formData.dept.trim(),
      project_interest: formData.project_interest.trim(),
      experience_level: formData.experience_level,
      use_cases: formData.use_cases,
      prior_tools: formData.prior_tools,
      bio: formData.bio.trim() || `${titleName} at ${orgName || 'ThermoDESiM Aero'}`,
      avatar_color: formData.avatar_color,
    };

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        extractUserData(data.user);
      }

      // Update local storage cache for admin directory
      try {
        const raw = localStorage.getItem('aerocad_admin_users_cache');
        if (raw && user?.id) {
          const list = JSON.parse(raw);
          const idx = list.findIndex((u: any) => u.id === user.id || u.email === user.email);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...updatedMetadata };
            localStorage.setItem('aerocad_admin_users_cache', JSON.stringify(list));
          }
        }
      } catch (e) {
        // Cache update fail safe
      }

      try {
        await supabase.from('user_profiles').upsert({
          id: user?.id,
          email: user?.email,
          ...updatedMetadata,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        // RLS fail safe
      }

      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) extractUserData(user);
    setIsEditing(false);
  };

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
      setMsg({ type: 'success', text: 'All workspace designs are fully synchronized with your cloud storage!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (activeModal !== 'cloud_sync') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 lg:p-8 select-none font-sans overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[82vh] my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <span>User Profile</span>
              </h3>
              <p className="text-[11px] text-sky-100/90 font-medium">Account Details & CAD Credentials</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Banner */}
        {msg && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 shrink-0 ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-red-50 text-red-800 border-b border-red-100'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />}
            <span className="flex-1 font-semibold">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5">
          {user ? (
            <div className="space-y-3.5">
              
              {/* Profile Main Card */}
              <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                
                {/* User Top Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-2xl ${currentTheme.bg} text-white flex items-center justify-center font-black text-lg shadow-md ring-2 ring-white shrink-0`}>
                      {getInitials()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-base truncate">
                          {formData.full_name || 'AeroCAD Designer'}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user?.email}</span>
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Connected Workspace Account
                      </p>
                    </div>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  )}
                </div>

                {/* VIEW MODE: Rich Data Showcase */}
                {!isEditing && (
                  <div className="pt-3 border-t border-slate-200/80 space-y-3.5 text-xs">
                    
                    {/* Bio / Project Focus */}
                    {formData.bio && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-slate-700">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          Design Focus & Bio
                        </span>
                        <p className="italic text-xs leading-relaxed text-slate-800">
                          "{formData.bio}"
                        </p>
                      </div>
                    )}

                    {/* Affiliation & Role Specific Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {formData.role === 'student' && (
                        <>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-sky-500" /> University
                            </span>
                            <div className="font-bold text-xs text-slate-900">{formData.institution || '—'}</div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Major & Class
                            </span>
                            <div className="font-bold text-xs text-slate-900">
                              {formData.major ? `${formData.major} (${formData.grad_year || 'Class'})` : '—'}
                            </div>
                          </div>
                        </>
                      )}

                      {formData.role === 'professional' && (
                        <>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-indigo-500" /> Company / Title
                            </span>
                            <div className="font-bold text-xs text-slate-900">
                              {formData.company || '—'} • {formData.job_title || 'Engineer'}
                            </div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Industry
                            </span>
                            <div className="font-bold text-xs text-slate-900">{formData.industry || 'Aerospace and defense'}</div>
                          </div>
                        </>
                      )}

                      {formData.role === 'educator' && (
                        <>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-500" /> Institution / Lab
                            </span>
                            <div className="font-bold text-xs text-slate-900">{formData.institution || '—'}</div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Department / Area
                            </span>
                            <div className="font-bold text-xs text-slate-900">{formData.dept || '—'}</div>
                          </div>
                        </>
                      )}

                      {formData.role === 'hobbyist' && (
                        <div className="sm:col-span-2 bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Compass className="w-3 h-3 text-amber-500" /> Project Goals
                          </span>
                          <div className="font-bold text-xs text-slate-900">{formData.project_interest || 'Custom Aircraft Designs'}</div>
                        </div>
                      )}
                    </div>

                    {/* Contact & Location Details */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3 h-3 text-sky-500" /> Phone
                        </span>
                        <div className="font-bold text-xs text-slate-900">{formData.phone || '—'}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Globe className="w-3 h-3 text-indigo-500" /> Region / Country
                        </span>
                        <div className="font-bold text-xs text-slate-900">{formData.country || 'Global'}</div>
                      </div>
                    </div>

                    {/* Experience Level & Use Cases */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          CAD Proficiency
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                          {formData.experience_level}
                        </span>
                      </div>

                      {/* Use Cases */}
                      {formData.use_cases.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Primary Use Cases
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {formData.use_cases.map((uc) => (
                              <span
                                key={uc}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200/80"
                              >
                                {USE_CASE_OPTIONS.find((o) => o.id === uc)?.label || uc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prior Tools */}
                      {formData.prior_tools.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Prior CAD Tools
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {formData.prior_tools.map((tool) => (
                              <span
                                key={tool}
                                className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[10px] font-medium border border-sky-200"
                              >
                                {PRIOR_TOOLS_OPTIONS.find((o) => o.id === tool)?.label || tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Real-time Sync Status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" /> Auto Cloud Storage Sync:
                      </span>
                      <span className="font-bold text-sky-600">Active (Encrypted)</span>
                    </div>
                  </div>
                )}

                {/* EDIT PROFILE FORM */}
                {isEditing && (
                  <form onSubmit={handleSaveProfile} className="pt-3 border-t border-slate-200/80 space-y-4">
                    
                    {/* Basic info */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Full Name <span className="text-amber-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="e.g. Nagaraju K P"
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Phone Number
                          </label>
                          <div className="relative">
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+1 415 555 0128"
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Country / Region
                          </label>
                          <div className="relative">
                            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              placeholder="e.g. United States"
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Role Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'student', title: 'Student' },
                          { id: 'professional', title: 'Working Professional' },
                          { id: 'educator', title: 'Educator / Researcher' },
                          { id: 'hobbyist', title: 'Hobbyist' },
                        ].map((r) => {
                          const isSel = formData.role === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, role: r.id })}
                              className={`p-2 rounded-xl text-left border text-xs font-bold transition cursor-pointer ${
                                isSel
                                  ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {r.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Role Specific Dynamic Fields */}
                    {formData.role === 'student' && (
                      <div className="space-y-2.5 p-3 bg-white rounded-xl border border-slate-200 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            University / Institution
                          </label>
                          <input
                            type="text"
                            value={formData.institution}
                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                            placeholder="e.g. MIT, Stanford"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Major / Field</label>
                            <input
                              type="text"
                              value={formData.major}
                              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                              placeholder="Aerospace"
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Graduation Year</label>
                            <input
                              type="number"
                              value={formData.grad_year}
                              onChange={(e) => setFormData({ ...formData, grad_year: e.target.value })}
                              placeholder="2027"
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.role === 'professional' && (
                      <div className="space-y-2.5 p-3 bg-white rounded-xl border border-slate-200 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Company</label>
                            <input
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              placeholder="Company Name"
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Job Title</label>
                            <input
                              type="text"
                              value={formData.job_title}
                              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                              placeholder="Aero Engineer"
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Industry</label>
                          <select
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                          >
                            <option value="Aerospace and defense">Aerospace and defense</option>
                            <option value="Automotive & eVTOL">Automotive & eVTOL</option>
                            <option value="Manufacturing & Prototyping">Manufacturing & Prototyping</option>
                            <option value="Academia and research">Academia and research</option>
                            <option value="Consulting">Consulting</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {formData.role === 'educator' && (
                      <div className="space-y-2.5 p-3 bg-white rounded-xl border border-slate-200 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Institution / Lab</label>
                          <input
                            type="text"
                            value={formData.institution}
                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                            placeholder="University or Research Lab"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Department / Area</label>
                          <input
                            type="text"
                            value={formData.dept}
                            onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                            placeholder="Aeronautics & Fluids"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {formData.role === 'hobbyist' && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 animate-in fade-in duration-150">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Goals</label>
                        <input
                          type="text"
                          value={formData.project_interest}
                          onChange={(e) => setFormData({ ...formData, project_interest: e.target.value })}
                          placeholder="RC planes, scale gliders, custom UAVs..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                        />
                      </div>
                    )}

                    {/* Experience Level */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Experience Level
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'new', label: 'New to CAD' },
                          { id: 'beginner', label: 'Beginner' },
                          { id: 'intermediate', label: 'Intermediate' },
                          { id: 'advanced', label: 'Advanced' },
                        ].map((item) => {
                          const isSel = formData.experience_level === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, experience_level: item.id })}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                                isSel
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Primary Use Cases (Select Any)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {USE_CASE_OPTIONS.map((opt) => {
                          const isSel = formData.use_cases.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleUsecase(opt.id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                                isSel
                                  ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Prior CAD Tools */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Prior CAD Tools Experience
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRIOR_TOOLS_OPTIONS.map((opt) => {
                          const isSel = formData.prior_tools.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleTool(opt.id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                                isSel
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Bio / Design Specialization
                      </label>
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <textarea
                          rows={2}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="e.g. Wing aerodynamics, UAV design and CAD modeling..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 resize-none"
                        />
                      </div>
                    </div>

                    {/* Avatar Theme */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Avatar Color Theme
                      </label>
                      <div className="flex items-center gap-2">
                        {AVATAR_THEMES.map((theme) => {
                          const isSelected = formData.avatar_color === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, avatar_color: theme.id })}
                              className={`w-7 h-7 rounded-full ${theme.bg} transition-all cursor-pointer flex items-center justify-center ${
                                isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm' : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                              title={theme.name}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
                      >
                        {savingProfile ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Save Profile
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingProfile}
                        className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sync Actions */}
              <button
                onClick={handleManualSyncAll}
                disabled={loading || isSyncing || isEditing}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing || loading ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing Workspace...' : 'Sync Workspace to Cloud Now'}</span>
              </button>

              {/* Admin Panel Link */}
              <button
                onClick={() => {
                  closeModal();
                  openModal('admin_panel');
                }}
                disabled={isEditing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Open Admin Directory & Analytics</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={loading || isEditing}
                className="w-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <User className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">Not Signed In</p>
              <p className="text-xs text-slate-500">Please sign in to access your cloud profile and synchronize designs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
