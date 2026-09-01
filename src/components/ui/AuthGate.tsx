'use client';

import React, { useState } from 'react';
import {
  Plane,
  Lock,
  Mail,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Building2,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Globe,
  Check,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { TERMS_CONTENT, PRIVACY_CONTENT } from './docContent';

interface AuthGateProps {
  onSuccess?: () => void;
}

type RoleType = 'student' | 'professional' | 'educator' | 'hobbyist';
type ExperienceType = 'new' | 'beginner' | 'intermediate' | 'advanced';

export function AuthGate({ onSuccess }: AuthGateProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  // Form State
  const [role, setRole] = useState<RoleType>('student');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Role conditionals
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [gradyear, setGradyear] = useState('');
  const [company, setCompany] = useState('');
  const [jobtitle, setJobtitle] = useState('');
  const [industry, setIndustry] = useState('Aerospace and defense');
  const [dept, setDept] = useState('');
  const [interest, setInterest] = useState('');

  // Experience & Tools
  const [experience, setExperience] = useState<ExperienceType>('intermediate');
  const [usecases, setUsecases] = useState<string[]>(['conceptual']);
  const [tools, setTools] = useState<string[]>([]);

  // Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Wrap up
  const [country, setCountry] = useState('');
  const [referral, setReferral] = useState('');
  const [terms, setTerms] = useState(false);
  const [updates, setUpdates] = useState(false);

  // Signin only state
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const toggleUsecase = (val: string) => {
    setUsecases((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const toggleTool = (val: string) => {
    if (val === 'none') {
      setTools(['none']);
      return;
    }
    setTools((prev) => {
      const filtered = prev.filter((item) => item !== 'none');
      return filtered.includes(val)
        ? filtered.filter((item) => item !== val)
        : [...filtered, val];
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!fullname.trim()) {
      setMsg({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!phone.trim()) {
      setMsg({ type: 'error', text: 'Please enter your phone number for account verification.' });
      return;
    }

    // Role-specific validations
    if (role === 'student') {
      if (!institution.trim()) {
        setMsg({ type: 'error', text: 'Please enter your university or institution name.' });
        return;
      }
      if (!major.trim()) {
        setMsg({ type: 'error', text: 'Please enter your field of study (e.g. Aerospace Engineering).' });
        return;
      }
      if (!gradyear.trim()) {
        setMsg({ type: 'error', text: 'Please enter your expected graduation year.' });
        return;
      }
    } else if (role === 'professional') {
      if (!company.trim()) {
        setMsg({ type: 'error', text: 'Please enter your company / organization name.' });
        return;
      }
      if (!jobtitle.trim()) {
        setMsg({ type: 'error', text: 'Please enter your job title.' });
        return;
      }
      if (!industry.trim()) {
        setMsg({ type: 'error', text: 'Please select your industry.' });
        return;
      }
    } else if (role === 'educator') {
      if (!institution.trim()) {
        setMsg({ type: 'error', text: 'Please enter your academic institution or research lab.' });
        return;
      }
      if (!dept.trim()) {
        setMsg({ type: 'error', text: 'Please enter your department or research area.' });
        return;
      }
    } else if (role === 'hobbyist') {
      if (!interest.trim()) {
        setMsg({ type: 'error', text: 'Please specify what you are hoping to build or design.' });
        return;
      }
    }

    if (usecases.length === 0) {
      setMsg({ type: 'error', text: 'Please select at least one primary intended use case.' });
      return;
    }

    if (tools.length === 0) {
      setMsg({ type: 'error', text: 'Please select your prior CAD software experience (or choose "None yet").' });
      return;
    }

    if (password.length < 8) {
      setMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (!country.trim()) {
      setMsg({ type: 'error', text: 'Please enter your country / region for timezone & CAD units.' });
      return;
    }

    if (!referral.trim()) {
      setMsg({ type: 'error', text: 'Please select how you heard about ThermoDESiM Aero.' });
      return;
    }

    if (!terms) {
      setMsg({ type: 'error', text: 'You must agree to the Terms of Service and Privacy Policy to create an account.' });
      return;
    }

    setLoading(true);

    try {
      const orgName =
        role === 'student' || role === 'educator' ? institution : company;
      const titleName =
        role === 'student'
          ? `Student (${major || 'Aerospace'})`
          : role === 'educator'
          ? `Educator / Researcher (${dept || 'Aeronautics'})`
          : role === 'hobbyist'
          ? 'Hobbyist Designer'
          : jobtitle || 'Design Engineer';

      const metadata = {
        full_name: fullname.trim(),
        phone: phone.trim(),
        role,
        institution: institution.trim(),
        major: major.trim(),
        grad_year: gradyear.trim(),
        company: company.trim(),
        job_title: titleName,
        organization: orgName.trim(),
        industry,
        dept: dept.trim(),
        project_interest: interest.trim(),
        experience_level: experience,
        use_cases: usecases,
        prior_tools: tools,
        country: country.trim(),
        referral_source: referral,
        subscribed_to_updates: updates,
        bio: interest.trim() || `${titleName} at ${orgName || 'ThermoDESiM Aero'}`,
        avatar_color: role === 'professional' ? 'purple' : role === 'student' ? 'blue' : 'emerald',
      };

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      // Persist to admin directory cache
      const newRecord = {
        id: data.user?.id || `usr_${Date.now()}`,
        email: email.trim(),
        ...metadata,
        terms_accepted: true,
        created_at: new Date().toISOString(),
      };
      try {
        const raw = localStorage.getItem('aerocad_admin_users_cache');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newRecord);
        localStorage.setItem('aerocad_admin_users_cache', JSON.stringify(list));
      } catch (e) {
        console.error('Failed to cache admin user record', e);
      }

      try {
        await supabase.from('user_profiles').upsert(newRecord);
      } catch (e) {
        // Handled gracefully
      }

      if (data.session) {
        setMsg({ type: 'success', text: 'Account created! Initializing your aerospace workspace...' });
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        setMsg({
          type: 'success',
          text: 'Registration successful! If email verification is enabled, please check your inbox to confirm.',
        });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Account registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signinEmail.trim(),
        password: signinPassword,
      });

      if (error) throw error;
      setMsg({ type: 'success', text: 'Authenticated! Loading CAD studio...' });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Authentication failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    fullname.trim().length > 0 &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.trim().length > 0 &&
    (role === 'student'
      ? institution.trim().length > 0 && major.trim().length > 0 && gradyear.trim().length > 0
      : role === 'professional'
      ? company.trim().length > 0 && jobtitle.trim().length > 0 && industry.trim().length > 0
      : role === 'educator'
      ? institution.trim().length > 0 && dept.trim().length > 0
      : interest.trim().length > 0) &&
    usecases.length > 0 &&
    tools.length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword &&
    country.trim().length > 0 &&
    referral.trim().length > 0 &&
    terms === true;

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans select-none flex flex-col lg:flex-row">
      
      {/* Left Blueprint Panel (FIXED 100vh, NEVER SCROLLS) */}
      <aside className="hidden lg:flex lg:w-[40%] xl:w-[36%] h-full shrink-0 flex-col justify-between bg-gradient-to-b from-sky-50/90 via-slate-50 to-blue-50/70 p-8 xl:p-10 border-r border-slate-200 relative overflow-hidden bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Mark */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl border border-sky-300 bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/20">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-slate-900 leading-none">
                Thermo<span className="text-sky-600">DESiM</span> Aero
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Parametric Aerospace CAD Platform
              </div>
            </div>
          </div>
        </div>

        {/* Technical Parametric Aircraft Blueprint Showcase (Real Black Technical CAD) */}
        <div className="relative z-10 my-2 flex-1 flex flex-col justify-center items-center py-2">
          <div className="w-full max-w-sm flex items-center justify-center">
            {/* SVG Aircraft Real Black Technical CAD Drawing */}
            <svg viewBox="0 0 360 260" className="w-full h-auto max-h-[250px] drop-shadow-sm">
              <defs>
                {/* Arrow markers for precision dimensions */}
                <marker id="dim-arrow-start" viewBox="0 0 6 6" refX="0" refY="3" markerWidth="4" markerHeight="4" orient="auto">
                  <path d="M6 0 L0 3 L6 6 Z" fill="#0f172a" />
                </marker>
                <marker id="dim-arrow-end" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="4" markerHeight="4" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="#0f172a" />
                </marker>
              </defs>

              {/* Engineering Reference Grid & Centerline */}
              <g stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.7">
                <line x1="15" y1="130" x2="355" y2="130" />
                <line x1="165" y1="10" x2="165" y2="250" />
                <circle cx="165" cy="130" r="2.5" fill="none" stroke="#0f172a" strokeWidth="0.75" />
              </g>

              {/* Wingspan Dimension (Vertical on Left in Real Technical Black) */}
              <g stroke="#0f172a" strokeWidth="0.9">
                <line x1="162" y1="18" x2="20" y2="18" strokeDasharray="2 2" stroke="#64748b" opacity="0.8" />
                <line x1="162" y1="242" x2="20" y2="242" strokeDasharray="2 2" stroke="#64748b" opacity="0.8" />
                <line x1="24" y1="22" x2="24" y2="238" markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)" />
                <text x="16" y="130" fill="#0f172a" fontFamily="monospace" fontSize="8" fontWeight="bold" transform="rotate(-90 16 130)" textAnchor="middle">
                  SPAN 34.10 m
                </text>
              </g>

              {/* Fuselage Length Dimension (Horizontal at Top) */}
              <g stroke="#0f172a" strokeWidth="0.9">
                <line x1="38" y1="130" x2="38" y2="10" strokeDasharray="2 2" stroke="#64748b" opacity="0.8" />
                <line x1="336" y1="130" x2="336" y2="10" strokeDasharray="2 2" stroke="#64748b" opacity="0.8" />
                <line x1="42" y1="14" x2="332" y2="14" markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)" />
                <text x="187" y="10" fill="#0f172a" fontFamily="monospace" fontSize="8" fontWeight="bold" textAnchor="middle">
                  LENGTH 37.57 m
                </text>
              </g>

              {/* Fuselage Main Contour (Real Black High Contrast Ink) */}
              <g stroke="#0f172a" strokeWidth="1.9" fill="none" strokeLinejoin="round" strokeLinecap="round">
                {/* Fuselage Shell */}
                <path d="M336 130 C336 123 318 116 295 116 L150 116 C125 116 95 125 38 130 C95 135 125 144 150 144 L295 144 C318 144 336 137 336 130 Z" />

                {/* Top Wing with Blended Winglet */}
                <path d="M265 116 L170 18 L162 17 L160 25 L198 106 L195 116" />
                
                {/* Bottom Wing with Blended Winglet */}
                <path d="M265 144 L170 242 L162 243 L160 235 L198 154 L195 144" />

                {/* Top Horizontal Stabilizer */}
                <path d="M78 124 L44 70 L38 72 L52 127" strokeWidth="1.6" />
                
                {/* Bottom Horizontal Stabilizer */}
                <path d="M78 136 L44 190 L38 188 L52 133" strokeWidth="1.6" />
              </g>

              {/* Detailed Turbofan Engines (Realistic Top View in Real Black) */}
              <g stroke="#0f172a" strokeWidth="1.4" fill="#ffffff">
                {/* Top Turbofan Nacelle */}
                <rect x="216" y="86" width="28" height="15" rx="4" />
                <line x1="216" y1="89" x2="216" y2="98" strokeWidth="2" />
                <path d="M228 93.5 L244 93.5" stroke="#475569" strokeWidth="0.8" />
                <line x1="230" y1="101" x2="230" y2="116" stroke="#0f172a" strokeWidth="1.4" />

                {/* Bottom Turbofan Nacelle */}
                <rect x="216" y="159" width="28" height="15" rx="4" />
                <line x1="216" y1="162" x2="216" y2="171" strokeWidth="2" />
                <path d="M228 166.5 L244 166.5" stroke="#475569" strokeWidth="0.8" />
                <line x1="230" y1="159" x2="230" y2="144" stroke="#0f172a" strokeWidth="1.4" />
              </g>

              {/* Flap Track Fairings & Control Surfaces */}
              <g stroke="#0f172a" strokeWidth="1.1" fill="none">
                {/* Top Wing Flap Track Canoes */}
                <path d="M192 48 L188 44 L186 48 L190 52 Z" fill="#0f172a" />
                <path d="M204 74 L200 70 L198 74 L202 78 Z" fill="#0f172a" />
                
                {/* Bottom Wing Flap Track Canoes */}
                <path d="M192 212 L188 216 L186 212 L190 208 Z" fill="#0f172a" />
                <path d="M204 186 L200 190 L198 186 L202 182 Z" fill="#0f172a" />

                {/* Control Surface Seams (Ailerons / Spoilers / Slats) */}
                <line x1="172" y1="36" x2="194" y2="88" stroke="#334155" strokeWidth="0.9" strokeDasharray="3 2" />
                <line x1="172" y1="224" x2="194" y2="172" stroke="#334155" strokeWidth="0.9" strokeDasharray="3 2" />
                
                {/* Slat Leading Edge Line */}
                <line x1="258" y1="118" x2="174" y2="24" stroke="#334155" strokeWidth="0.75" />
                <line x1="258" y1="142" x2="174" y2="236" stroke="#334155" strokeWidth="0.75" />

                {/* Cockpit Canopy Framing */}
                <path d="M318 124 Q321 130 318 136 L312 134 Q314 130 312 126 Z" fill="#0f172a" stroke="#0f172a" strokeWidth="0.9" />

                {/* Cabin Centerline & Station Bulkheads */}
                <line x1="70" y1="130" x2="310" y2="130" stroke="#64748b" strokeWidth="0.6" strokeDasharray="2 3" />
                <line x1="150" y1="118" x2="150" y2="142" stroke="#64748b" strokeWidth="0.6" />
                <line x1="220" y1="118" x2="220" y2="142" stroke="#64748b" strokeWidth="0.6" />
                <line x1="280" y1="118" x2="280" y2="142" stroke="#64748b" strokeWidth="0.6" />
              </g>

              {/* Technical Drawing Metadata Callouts in Real Black Monospace */}
              <g fill="#0f172a" fontFamily="monospace" fontSize="7.5" fontWeight="bold">
                <text x="270" y="248">SWEEP 25.0°</text>
                <text x="187" y="254" textAnchor="middle">MAC 4.19m • AR 9.45 • L/D 24.1</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Blueprint Copy & Live Specs */}
        <div className="relative z-10 space-y-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
              Set up your design workspace
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Parametric conceptual aircraft geometry, built procedurally and rendered live — from first sketch to converged configuration.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-200">
            <div className="bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-lg font-mono font-black text-sky-600">3D</div>
              <div className="text-[10px] font-semibold text-slate-500">Live geometry</div>
            </div>
            <div className="bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-lg font-mono font-black text-sky-600">∞</div>
              <div className="text-[10px] font-semibold text-slate-500">Parametric revisions</div>
            </div>
            <div className="bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-lg font-mono font-black text-sky-600">0</div>
              <div className="text-[10px] font-semibold text-slate-500">Install required</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium text-center">
            © 2026 DESiM Innovations • Aerospace Engineering Workbench
          </div>
        </div>
      </aside>

      {/* Right Form Side (ONLY THIS SCROLLS) */}
      <main className="flex-1 h-full overflow-y-auto bg-white p-6 sm:p-10 lg:p-12 xl:p-16 flex justify-center items-start">
        <div className="w-full max-w-xl space-y-6 pb-12">

            {/* Header / Mode Toggle */}
            <div className="pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {authMode === 'signup' ? 'Create your account' : 'Sign in to workspace'}
                </h2>
                <div className="text-xs text-slate-500">
                  {authMode === 'signup' ? (
                    <>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setMsg(null);
                        }}
                        className="text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Need an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setMsg(null);
                        }}
                        className="text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        Register
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Alert */}
            {msg && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border transition-all ${
                  msg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {msg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span className="flex-1 font-semibold">{msg.text}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignin} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      placeholder="engineer@aerocad.io"
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold py-3 rounded-xl text-xs tracking-wide shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:translate-y-[1px]"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FULL SIGN UP FORM (LIGHT THEME) */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-6">

                {/* Section 1: Role Selection */}
                <fieldset className="border-0 p-0 m-0 space-y-2.5">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    Who's Designing
                  </legend>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'student', title: 'Student', desc: 'Coursework, thesis, self-study' },
                      { id: 'professional', title: 'Working professional', desc: 'Industry or consulting work' },
                      { id: 'educator', title: 'Educator / researcher', desc: 'Teaching or academic research' },
                      { id: 'hobbyist', title: 'Hobbyist', desc: 'Personal or independent projects' },
                    ].map((opt) => {
                      const isSelected = role === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setRole(opt.id as RoleType)}
                          className={`p-3 rounded-2xl border transition cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/80 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="font-extrabold text-xs">{opt.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Section 2: Contact Details */}
                <fieldset className="border-0 p-0 m-0 space-y-3">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    Contact Details
                  </legend>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Jordan Reyes"
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@aerocad.io"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 415 555 0128"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Section 3: Conditional Details By Role */}
                {role === 'student' && (
                  <fieldset className="border-0 p-0 m-0 space-y-3 animate-in fade-in duration-200">
                    <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                      Academic Details
                    </legend>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Institution / University
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. MIT, Stanford, IIT"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          required
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          placeholder="Aerospace Engineering"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          Expected Graduation
                        </label>
                        <input
                          type="number"
                          required
                          value={gradyear}
                          onChange={(e) => setGradyear(e.target.value)}
                          placeholder="2027"
                          min="2024"
                          max="2035"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </fieldset>
                )}

                {role === 'professional' && (
                  <fieldset className="border-0 p-0 m-0 space-y-3 animate-in fade-in duration-200">
                    <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                      Work Details
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Company name"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          Job Title
                        </label>
                        <input
                          type="text"
                          required
                          value={jobtitle}
                          onChange={(e) => setJobtitle(e.target.value)}
                          placeholder="Aerodynamics Design Engineer"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Industry
                      </label>
                      <select
                        required
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="Aerospace and defense">Aerospace and defense</option>
                        <option value="Automotive & eVTOL">Automotive & eVTOL</option>
                        <option value="Manufacturing & Prototyping">Manufacturing & Prototyping</option>
                        <option value="Academia and research">Academia and research</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </fieldset>
                )}

                {role === 'educator' && (
                  <fieldset className="border-0 p-0 m-0 space-y-3 animate-in fade-in duration-200">
                    <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                      Institution Details
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          Institution / Lab
                        </label>
                        <input
                          type="text"
                          required
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="University or Research Lab"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          Department / Area
                        </label>
                        <input
                          type="text"
                          required
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                          placeholder="Aeronautics & Fluid Dynamics"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </fieldset>
                )}

                {role === 'hobbyist' && (
                  <fieldset className="border-0 p-0 m-0 space-y-3 animate-in fade-in duration-200">
                    <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                      Project Goals
                    </legend>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        What are you hoping to build?
                      </label>
                      <input
                        type="text"
                        required
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                        placeholder="RC scale models, UAV wings, custom glider design..."
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  </fieldset>
                )}

                {/* Section 4: Experience Level */}
                <fieldset className="border-0 p-0 m-0 space-y-2.5">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    Experience Level
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'new', label: 'New to CAD' },
                      { id: 'beginner', label: 'Beginner' },
                      { id: 'intermediate', label: 'Intermediate' },
                      { id: 'advanced', label: 'Advanced' },
                    ].map((item) => {
                      const isSelected = experience === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setExperience(item.id as ExperienceType)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20 shadow-xs'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Section 5: What you'll use it for */}
                <fieldset className="border-0 p-0 m-0 space-y-2.5">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    What You'll Use It For
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'conceptual', label: 'Conceptual exploration' },
                      { id: 'coursework', label: 'Coursework' },
                      { id: 'research', label: 'Research' },
                      { id: 'portfolio', label: 'Portfolio projects' },
                      { id: 'professional-workflow', label: 'Professional workflow' },
                    ].map((item) => {
                      const isSelected = usecases.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleUsecase(item.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20 shadow-xs'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Section 6: Prior CAD Tools (KOMPAS-3D First) */}
                <fieldset className="border-0 p-0 m-0 space-y-2.5">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    Prior CAD / Aircraft Tools
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'kompas3d', label: 'KOMPAS-3D' },
                      { id: 'solidworks', label: 'SolidWorks' },
                      { id: 'catia', label: 'CATIA' },
                      { id: 'fusion360', label: 'Fusion 360' },
                      { id: 'openvsp', label: 'OpenVSP' },
                      { id: 'none', label: 'None yet' },
                    ].map((item) => {
                      const isSelected = tools.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleTool(item.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20 shadow-xs'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Section 7: Security */}
                <fieldset className="border-0 p-0 m-0 space-y-3">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    Security Credentials
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Section 8: Wrap-up */}
                <fieldset className="border-0 p-0 m-0 space-y-3">
                  <legend className="text-xs font-bold text-slate-600 pb-1.5 w-full border-b border-slate-200 uppercase tracking-wider">
                    Wrap-up
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Country / Region
                      </label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="For units & timezone"
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        How Did You Hear About Us
                      </label>
                      <select
                        required
                        value={referral}
                        onChange={(e) => setReferral(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="">Select one</option>
                        <option value="Search engine">Search engine</option>
                        <option value="University or course">University or course</option>
                        <option value="Colleague or classmate">Colleague or classmate</option>
                        <option value="Social media">Social media</option>
                        <option value="GitHub">GitHub</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* Checklines */}
                <div className="space-y-2.5 pt-1 text-xs text-slate-600">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                    />
                    <span className="leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLegalModal('terms');
                        }}
                        className="text-sky-600 font-bold underline hover:text-sky-700 cursor-pointer"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLegalModal('privacy');
                        }}
                        className="text-sky-600 font-bold underline hover:text-sky-700 cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updates}
                      onChange={(e) => setUpdates(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                    />
                    <span className="leading-snug text-slate-500">
                      Send me CAD updates, aerodynamics releases, and product announcements
                    </span>
                  </label>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className={`w-full font-extrabold py-3.5 rounded-2xl text-xs tracking-wide transition flex items-center justify-center gap-2 ${
                    loading || !isFormValid
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-lg shadow-sky-600/20 cursor-pointer active:translate-y-[1px]'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Create Account & Launch Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </main>

        {/* Legal & Privacy Policy Modal Viewer (Light Theme) */}
      {legalModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none font-sans">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1 rounded-xl hover:bg-white/15 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-xs leading-relaxed text-slate-600 bg-slate-50/50 whitespace-pre-wrap font-sans">
              {legalModal === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT}
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                ThermoDESiM Aero by DESiM Innovations
              </span>
              <button
                type="button"
                onClick={() => {
                  setTerms(true);
                  setLegalModal(null);
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>I Agree & Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
