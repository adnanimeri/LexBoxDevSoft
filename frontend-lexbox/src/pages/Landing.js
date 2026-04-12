// ===================================================================
// LANDING PAGE — LexBox
// ===================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicService } from '../services/publicService';
import {
  Shield, Users, FileText, Receipt, Settings2,
  Lock, Globe, Smartphone, Monitor, Tablet,
  ChevronRight, Check, Star, Zap, Menu, X,
  ArrowRight, CheckCircle2, BarChart3
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────

const useScrollY = () => {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return y;
};

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

// ── Navbar ────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features',  id: 'features'  },
  { label: 'Security',  id: 'security'  },
  { label: 'Pricing',   id: 'pricing'   },
];

const Navbar = ({ onRegister, onLogin }) => {
  const scrollY   = useScrollY();
  const [open, setOpen] = useState(false);
  const solid = scrollY > 40;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      solid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-4.5 w-4.5 text-white h-5 w-5" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${solid ? 'text-gray-900' : 'text-white'}`}>
            LexBox
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                solid
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onLogin}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              solid
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-600/25"
          >
            Register Your Firm
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 rounded-lg ${solid ? 'text-gray-700' : 'text-white'}`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-2 shadow-lg">
          {NAV_LINKS.map(l => (
            <button
              key={l.id}
              onClick={() => { scrollTo(l.id); setOpen(false); }}
              className="block w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t border-gray-100">
            <button onClick={onLogin} className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
              Sign In
            </button>
            <button onClick={onRegister} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Register Your Firm
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

// ── Hero Section ──────────────────────────────────────────────────────

const Hero = ({ onRegister, onLogin }) => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
    {/* Animated background grid */}
    <div className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
        backgroundSize: '64px 64px'
      }}
    />

    {/* Glowing orbs */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

    <div className="relative max-w-5xl mx-auto px-6 text-center pt-20">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-8">
        <Shield className="h-3.5 w-3.5" />
        AES-256 Encrypted · GDPR Ready · Cloud-Based
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
        Welcome to{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          LexBox
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-blue-200 font-medium mb-4">
        The Legal Document Management System
      </p>

      <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
        Manage your legal cases from your{' '}
        <span className="text-white font-semibold">phone</span>,{' '}
        <span className="text-white font-semibold">tablet</span>, or{' '}
        <span className="text-white font-semibold">desktop</span> — anywhere, anytime, with bank-grade security.
      </p>

      {/* Device icons */}
      <div className="flex items-center justify-center gap-6 mb-12 text-slate-500">
        <div className="flex flex-col items-center gap-1.5">
          <Smartphone className="h-7 w-7 text-blue-400" />
          <span className="text-xs text-slate-400">Mobile</span>
        </div>
        <div className="h-px w-8 bg-slate-700" />
        <div className="flex flex-col items-center gap-1.5">
          <Tablet className="h-7 w-7 text-indigo-400" />
          <span className="text-xs text-slate-400">Tablet</span>
        </div>
        <div className="h-px w-8 bg-slate-700" />
        <div className="flex flex-col items-center gap-1.5">
          <Monitor className="h-7 w-7 text-blue-300" />
          <span className="text-xs text-slate-400">Desktop</span>
        </div>
        <div className="h-px w-8 bg-slate-700" />
        <div className="flex flex-col items-center gap-1.5">
          <Globe className="h-7 w-7 text-indigo-300" />
          <span className="text-xs text-slate-400">Any Browser</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onRegister}
          className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-bold transition-all shadow-2xl shadow-blue-600/40 hover:shadow-blue-500/40 hover:scale-105"
        >
          Start Free Trial
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={onLogin}
          className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-base font-semibold transition-all border border-white/20 hover:border-white/40"
        >
          Sign In to Your Firm
        </button>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        14-day free trial · No credit card required · Cancel anytime
      </p>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-blue-500/50" />
        <div className="h-2 w-2 rounded-full bg-blue-400" />
      </div>
    </div>
  </section>
);

// ── Features Section ──────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    bg:    'bg-blue-50',
    title: 'Team Management',
    desc:  'Invite lawyers, secretaries, and paralegals. Assign roles and control exactly what each team member can access.',
    bullets: ['Role-based permissions', 'Unlimited team members (Pro)', 'Activity audit trail']
  },
  {
    icon: FileText,
    color: 'from-indigo-500 to-indigo-600',
    bg:    'bg-indigo-50',
    title: 'Clients & Dossiers',
    desc:  'Centralise all your cases. Create client profiles, open dossiers, track status and priority — all in one place.',
    bullets: ['Unlimited clients', 'Case timeline tracking', 'Status & priority labels']
  },
  {
    icon: Shield,
    color: 'from-violet-500 to-violet-600',
    bg:    'bg-violet-50',
    title: 'Encrypted Documents',
    desc:  'Upload sensitive legal documents with AES-256 encryption. Each firm gets its own isolated encryption key — never shared.',
    bullets: ['AES-256-GCM encryption', 'Per-firm isolated keys', 'Secure PDF preview']
  },
  {
    icon: Receipt,
    color: 'from-emerald-500 to-emerald-600',
    bg:    'bg-emerald-50',
    title: 'Invoicing',
    desc:  'Generate professional invoices from billable time entries. Send them by email with one click, track payment status.',
    bullets: ['Auto-calculated from hours', 'PDF export', 'Email delivery']
  },
  {
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    bg:    'bg-amber-50',
    title: 'Dashboard & Analytics',
    desc:  'Get a clear picture of your firm at a glance — open cases, unpaid invoices, recent activity, and team workload.',
    bullets: ['Real-time overview', 'Revenue tracking', 'Case pipeline view']
  },
  {
    icon: Settings2,
    color: 'from-slate-500 to-slate-600',
    bg:    'bg-slate-50',
    title: 'Firm Settings',
    desc:  'Configure your firm\'s branding, billing defaults, SMTP for emails, and invoice templates — everything personalised.',
    bullets: ['Custom invoice prefix', 'SMTP configuration', 'Tax & payment terms']
  }
];

const FeaturesSection = () => (
  <section id="features" className="py-28 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-blue-600 text-sm font-semibold mb-6">
          <Zap className="h-3.5 w-3.5" /> Everything your firm needs
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          Built for law firms,<br />not general business
        </h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Every feature is designed around the daily workflow of legal professionals — from intake to invoice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="group bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1 transition-all duration-300">
              <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} mb-5 shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
              <ul className="space-y-1.5">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ── Security Section ──────────────────────────────────────────────────

const SecuritySection = () => (
  <section id="security" className="py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}
    />
    <div className="absolute top-0 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />

    <div className="relative max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left — text */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold mb-8">
            <Lock className="h-3.5 w-3.5" /> Bank-Grade Security
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Your clients' data is<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              protected by design
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            LexBox uses AES-256-GCM encryption — the same standard used by banks and governments. Each law firm gets a unique encryption key derived from a platform master key, meaning your documents are completely isolated from other firms.
          </p>

          <div className="space-y-4">
            {[
              { title: 'AES-256-GCM Encryption',    desc: 'Every document is encrypted at rest using authenticated encryption.' },
              { title: 'Per-Firm Key Isolation',     desc: 'Your encryption key is unique. No other firm can ever access your data.' },
              { title: 'Zero-Knowledge Architecture',desc: 'Keys are derived at runtime — never stored in the database.' },
              { title: 'Secure Storage Paths',       desc: 'Documents stored in isolated directories per organisation.' },
            ].map(item => (
              <div key={item.title} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-blue-600/20 blur-2xl scale-110" />

            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 w-80">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Encryption Status</p>
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                    All documents secured
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {['Contract_NDA_2026.pdf', 'Will_Testament_Smith.pdf', 'CaseFile_2024_091.pdf'].map((file, i) => (
                  <div key={file} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                    <div className="h-8 w-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{file}</p>
                      <p className="text-slate-400 text-xs">AES-256 encrypted</p>
                    </div>
                    <div className="h-5 w-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-xs text-center font-mono">
                  Key: PBKDF2(MASTER, org_salt)<br />
                  <span className="text-slate-500">— never stored, derived at runtime</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Pricing Section ───────────────────────────────────────────────────

const PLAN_ICONS   = { starter: Star, professional: Zap, enterprise: Shield };
const PLAN_ACCENTS = {
  starter:      { ring: 'ring-gray-200',   badge: 'bg-gray-100 text-gray-700',     btn: 'bg-gray-900 hover:bg-gray-700 text-white',         popular: false },
  professional: { ring: 'ring-blue-500',   badge: 'bg-blue-600 text-white',         btn: 'bg-blue-600 hover:bg-blue-700 text-white',         popular: true  },
  enterprise:   { ring: 'ring-indigo-300', badge: 'bg-indigo-100 text-indigo-700',  btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',     popular: false },
};

const PricingSection = ({ onRegister }) => {
  const [plans, setPlans]     = useState([]);
  const [billing, setBilling] = useState('monthly');

  useEffect(() => {
    publicService.getPlans().then(r => setPlans(r.data || [])).catch(() => {});
  }, []);

  return (
    <section id="pricing" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-sm font-semibold mb-6">
            <Receipt className="h-3.5 w-3.5" /> Simple, transparent pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
            Plans for every firm size
          </h2>
          <p className="text-lg text-gray-500 mb-8">All plans include a 14-day free trial. No credit card required.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {['monthly', 'yearly'].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  billing === b ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {b === 'yearly' ? 'Yearly (save 17%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-gray-400">Loading plans…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map(plan => {
              const key    = plan.code;
              const accent = PLAN_ACCENTS[key] || PLAN_ACCENTS.starter;
              const Icon   = PLAN_ICONS[key]   || Star;
              const price  = billing === 'yearly' ? (plan.price_yearly / 12).toFixed(0) : plan.price_monthly;
              const saving = billing === 'yearly' ? `Save €${(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)}/yr` : null;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl p-8 flex flex-col ring-2 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${accent.ring}`}
                >
                  {accent.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-6">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent.badge}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {saving && (
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{saving}</span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">€{price}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                    {billing === 'yearly' && <p className="text-xs text-gray-400 mt-1">Billed €{plan.price_yearly}/year</p>}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {[
                      `${plan.max_users >= 999 ? 'Unlimited' : `Up to ${plan.max_users}`} users`,
                      `${plan.max_storage_gb >= 500 ? 'Unlimited' : `${plan.max_storage_gb} GB`} storage`,
                      plan.max_clients ? `Up to ${plan.max_clients} clients` : 'Unlimited clients',
                      'AES-256 document encryption',
                      ...(plan.features?.priority_support  ? ['Priority support'] : []),
                      ...(plan.features?.audit_logs        ? ['Audit logs']       : []),
                      ...(plan.features?.custom_branding   ? ['Custom branding']  : []),
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={onRegister}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${accent.btn}`}
                  >
                    Start Free Trial <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

// ── CTA Banner ────────────────────────────────────────────────────────

const CTASection = ({ onRegister }) => (
  <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}
    />
    <div className="relative max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
        Ready to modernise your firm?
      </h2>
      <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
        Join law firms that trust LexBox to manage their most sensitive cases and documents — securely, efficiently, everywhere.
      </p>
      <button
        onClick={onRegister}
        className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 rounded-xl text-base font-extrabold hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
      >
        Register Your Firm — It's Free
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </button>
      <p className="mt-5 text-blue-200 text-sm">14-day trial · No credit card · Cancel anytime</p>
    </div>
  </section>
);

// ── Footer ────────────────────────────────────────────────────────────

const Footer = ({ onLogin, onRegister }) => (
  <footer className="bg-slate-900 text-slate-400 py-12">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">LexBox</span>
          <span className="text-slate-600 text-sm">· Legal Document Management</span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} className="hover:text-white transition-colors">
              {l.label}
            </button>
          ))}
          <button onClick={onLogin}     className="hover:text-white transition-colors">Sign In</button>
          <button onClick={onRegister}  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Register
          </button>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LexBox. All rights reserved. · AES-256 Encrypted · GDPR Compliant
      </div>
    </div>
  </footer>
);

// ── Main Landing Page ─────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();

  const goRegister = () => navigate('/register');
  const goLogin    = () => navigate('/login');

  return (
    <div className="min-h-screen">
      <Navbar    onRegister={goRegister} onLogin={goLogin} />
      <Hero      onRegister={goRegister} onLogin={goLogin} />
      <FeaturesSection />
      <SecuritySection />
      <PricingSection  onRegister={goRegister} />
      <CTASection      onRegister={goRegister} />
      <Footer    onLogin={goLogin} onRegister={goRegister} />
    </div>
  );
};

export default Landing;
