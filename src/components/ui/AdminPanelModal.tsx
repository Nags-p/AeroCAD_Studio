'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  Filter,
  RefreshCw,
  X,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  BookOpen,
  Wrench,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  Globe,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { supabase } from '@/lib/supabaseClient';

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'student' | 'professional' | 'educator' | 'hobbyist' | string;
  institution?: string;
  major?: string;
  grad_year?: string;
  company?: string;
  job_title?: string;
  organization?: string;
  industry?: string;
  dept?: string;
  project_interest?: string;
  experience_level?: 'new' | 'beginner' | 'intermediate' | 'advanced' | string;
  use_cases?: string[];
  prior_tools?: string[];
  country?: string;
  referral_source?: string;
  subscribed_to_updates?: boolean;
  terms_accepted?: boolean;
  created_at: string;
  avatar_color?: string;
}

const LOCAL_ADMIN_USERS_KEY = 'aerocad_admin_users_cache';

export function AdminPanelModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [expFilter, setExpFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Fetch users on open
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Try fetching from Supabase 'user_profiles' table if it exists
      const { data: dbProfiles, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Load from local cache
      let localProfiles: UserRecord[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
        if (raw) localProfiles = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse local admin users', e);
      }

      // Also get currently logged-in user to ensure they are listed
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const meta = currentUser.user_metadata || {};
        const currentRecord: UserRecord = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: meta.full_name || currentUser.email?.split('@')[0] || 'User',
          phone: meta.phone || '',
          role: meta.role || 'professional',
          institution: meta.institution || '',
          major: meta.major || '',
          grad_year: meta.grad_year || '',
          company: meta.company || '',
          job_title: meta.job_title || 'Designer',
          organization: meta.organization || meta.company || meta.institution || '',
          industry: meta.industry || '',
          dept: meta.dept || '',
          project_interest: meta.project_interest || meta.bio || '',
          experience_level: meta.experience_level || 'intermediate',
          use_cases: meta.use_cases || ['conceptual'],
          prior_tools: meta.prior_tools || [],
          country: meta.country || '',
          referral_source: meta.referral_source || '',
          subscribed_to_updates: !!meta.subscribed_to_updates,
          terms_accepted: true,
          created_at: currentUser.created_at || new Date().toISOString(),
          avatar_color: meta.avatar_color || 'blue',
        };

        // Merge if not exists
        const exists = localProfiles.some((u) => u.id === currentRecord.id || u.email === currentRecord.email);
        if (!exists) {
          localProfiles.unshift(currentRecord);
          localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(localProfiles));
        }
      }

      if (!dbError && dbProfiles && dbProfiles.length > 0) {
        // Merge db profiles and local profiles
        const mergedMap = new Map<string, UserRecord>();
        [...localProfiles, ...dbProfiles].forEach((u) => {
          mergedMap.set(u.id || u.email, u);
        });
        setUsers(Array.from(mergedMap.values()));
      } else {
        setUsers(localProfiles);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'admin_panel') {
      fetchUsers();
    }
  }, [activeModal]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.organization?.toLowerCase().includes(q) ||
        u.institution?.toLowerCase().includes(q) ||
        u.company?.toLowerCase().includes(q) ||
        u.job_title?.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q) ||
        u.major?.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesExp = expFilter === 'all' || u.experience_level === expFilter;

      return matchesSearch && matchesRole && matchesExp;
    });
  }, [users, searchQuery, roleFilter, expFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => u.role === 'student').length;
    const pros = users.filter((u) => u.role === 'professional').length;
    const educators = users.filter((u) => u.role === 'educator').length;
    const hobbyists = users.filter((u) => u.role === 'hobbyist').length;
    const subscribed = users.filter((u) => u.subscribed_to_updates).length;

    return { total, students, pros, educators, hobbyists, subscribed };
  }, [users]);

  // Export to CSV
  const handleExportCSV = () => {
    if (users.length === 0) return;

    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone',
      'Role',
      'Organization/Company',
      'Job Title',
      'Institution',
      'Major',
      'Grad Year',
      'Industry',
      'Department',
      'Experience Level',
      'Use Cases',
      'Prior CAD Tools',
      'Country',
      'Referral Source',
      'Subscribed To Updates',
      'Terms Accepted',
      'Registered At',
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role || ''}"`,
      `"${(u.organization || u.company || u.institution || '').replace(/"/g, '""')}"`,
      `"${(u.job_title || '').replace(/"/g, '""')}"`,
      `"${(u.institution || '').replace(/"/g, '""')}"`,
      `"${(u.major || '').replace(/"/g, '""')}"`,
      `"${u.grad_year || ''}"`,
      `"${(u.industry || '').replace(/"/g, '""')}"`,
      `"${(u.dept || '').replace(/"/g, '""')}"`,
      `"${u.experience_level || ''}"`,
      `"${(u.use_cases || []).join('; ')}"`,
      `"${(u.prior_tools || []).join('; ')}"`,
      `"${(u.country || '').replace(/"/g, '""')}"`,
      `"${(u.referral_source || '').replace(/"/g, '""')}"`,
      `"${u.subscribed_to_updates ? 'Yes' : 'No'}"`,
      `"${u.terms_accepted !== false ? 'Yes' : 'No'}"`,
      `"${u.created_at || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `thermodesim_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (users.length === 0) return;
    const jsonStr = JSON.stringify(filteredUsers, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `thermodesim_users_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (activeModal !== 'admin_panel') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 select-none font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-black text-lg tracking-tight text-white">
                  User Intelligence & Admin Directory
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Access registered user profiles, research specializations, CAD experience, and platform analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={closeModal}
              className="p-2 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">{metrics.total}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Students
            </div>
            <div className="text-xl font-black text-sky-700 mt-0.5 font-mono">{metrics.students}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Professionals
            </div>
            <div className="text-xl font-black text-indigo-700 mt-0.5 font-mono">{metrics.pros}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Researchers
            </div>
            <div className="text-xl font-black text-emerald-700 mt-0.5 font-mono">{metrics.educators}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> Hobbyists
            </div>
            <div className="text-xl font-black text-amber-700 mt-0.5 font-mono">{metrics.hobbyists}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Subscribers</div>
            <div className="text-xl font-black text-purple-700 mt-0.5 font-mono">{metrics.subscribed}</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, institution, company, country..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* Filters & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="professional">Professionals</option>
              <option value="educator">Educators / Researchers</option>
              <option value="hobbyist">Hobbyists</option>
            </select>

            {/* Experience Filter */}
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Experience Levels</option>
              <option value="new">New to CAD</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Export Buttons */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-auto p-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">No users found</p>
              <p className="text-xs text-slate-500">
                {searchQuery ? 'Try adjusting your search criteria or filters.' : 'Registered user accounts will appear here.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role & Specialization</th>
                    <th className="py-3 px-4">Experience & Prior CAD</th>
                    <th className="py-3 px-4">Primary Use Cases</th>
                    <th className="py-3 px-4">Origin / Country</th>
                    <th className="py-3 px-4">Legal & Privacy</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-slate-700">
                  {filteredUsers.map((u) => {
                    const initials = u.full_name
                      ? u.full_name.trim().split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
                      : u.email?.[0].toUpperCase() || 'U';

                    return (
                      <tr key={u.id || u.email} className="hover:bg-slate-50/80 transition-colors">
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{u.full_name || 'Anonymous User'}</div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5 shrink-0" />
                                {u.email}
                              </div>
                              {u.phone && (
                                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5 shrink-0" />
                                  {u.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role & Specifics */}
                        <td className="py-3 px-4">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'student'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : u.role === 'professional'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : u.role === 'educator'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {u.role}
                            </span>
                            <div className="font-semibold text-slate-800 text-[11px] mt-1 truncate">
                              {u.organization || u.company || u.institution || u.job_title || 'Independent'}
                            </div>
                            {(u.major || u.dept || u.industry) && (
                              <div className="text-[10px] text-slate-500 truncate">
                                {u.major ? `Major: ${u.major} (${u.grad_year || 'N/A'})` : u.dept || u.industry}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Experience & Tools */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-700 capitalize text-[11px]">
                              {u.experience_level || 'Intermediate'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {u.prior_tools && u.prior_tools.length > 0 ? (
                                u.prior_tools.map((tool) => (
                                  <span
                                    key={tool}
                                    className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-medium"
                                  >
                                    {tool}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[10px]">None specified</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Use Cases */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.use_cases && u.use_cases.length > 0 ? (
                              u.use_cases.map((uc) => (
                                <span
                                  key={uc}
                                  className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded text-[10px] font-medium capitalize"
                                >
                                  {uc.replace(/-/g, ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[10px]">General CAD</span>
                            )}
                          </div>
                        </td>

                        {/* Country & Referral */}
                        <td className="py-3 px-4">
                          <div className="text-[11px] font-medium text-slate-800">
                            {u.country || 'Global / Web'}
                          </div>
                          {u.referral_source && (
                            <div className="text-[10px] text-slate-500 truncate">
                              Via: {u.referral_source}
                            </div>
                          )}
                        </td>

                        {/* Legal / Terms Checkmark */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Terms & Privacy Accepted</span>
                            </div>
                            {u.subscribed_to_updates && (
                              <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                                Updates Opt-in
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Dossier Drill-down Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 font-sans">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                    {selectedUser.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{selectedUser.full_name}</h3>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-medium">Account Role:</span>
                    <p className="font-bold text-slate-900 capitalize mt-0.5">{selectedUser.role}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">CAD Experience:</span>
                    <p className="font-bold text-slate-900 capitalize mt-0.5">{selectedUser.experience_level}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Organization / Lab:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedUser.organization || selectedUser.company || selectedUser.institution || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Job Title / Major:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedUser.job_title || selectedUser.major || 'N/A'}</p>
                  </div>
                </div>

                {selectedUser.project_interest && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900">Project Goals & Specialization:</span>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic">
                      "{selectedUser.project_interest}"
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="font-bold text-slate-900">Prior Software Experience:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.prior_tools && selectedUser.prior_tools.length > 0 ? (
                      selectedUser.prior_tools.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-800">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900">Primary Intended Use Cases:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.use_cases && selectedUser.use_cases.length > 0 ? (
                      selectedUser.use_cases.map((uc) => (
                        <span key={uc} className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md font-semibold capitalize">
                          {uc.replace(/-/g, ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-bold text-slate-800">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Country / Region:</span>
                    <span className="font-bold text-slate-800">{selectedUser.country || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Referral Source:</span>
                    <span className="font-bold text-slate-800">{selectedUser.referral_source || 'Direct'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terms & Privacy Status:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Agreed & Accepted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
