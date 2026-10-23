import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  Check,
  ShieldCheck,
  ArrowRight,
  Database,
  Cloud,
  Lock,
  Cpu
} from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Local-First Studio',
      badge: 'CURRENTLY ACTIVE',
      price: '$0',
      period: 'Forever free',
      description: 'Fully featured, private browser-based workspace. Unlimited invoices and zero telemetry.',
      features: [
        'Unlimited local invoices & drafts',
        'Automatic logo color extraction',
        'All 4 invoice template families',
        'Decimal-safe calculation engine',
        'Instant high-res PDF generation',
        'Deterministic Natural-Language parser',
        'Private IndexedDB persistence',
        'JSON data export & backup'
      ],
      ctaText: 'Use Free Workspace Now',
      ctaHref: '/dashboard',
      primary: true
    },
    {
      name: 'Cloud Team & Sync',
      badge: 'PHASE 2 ROADMAP',
      price: '$12',
      period: 'per month (preview)',
      description: 'Multi-device synchronization, team collaboration, and hosted client payment portals.',
      features: [
        'Everything in Local-First Studio',
        'Cloud sync across devices via Supabase',
        'Multi-member team roles & permissions',
        'Client view links with read receipts',
        'Automated payment reminders via email',
        'Live AI instruction endpoint (Gemini / Claude)',
        'Stripe & PayPal direct checkout links'
      ],
      ctaText: 'View Backend Guide',
      ctaHref: '/settings',
      primary: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#171B32] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-[#6254E8] uppercase tracking-wider bg-[#D9D4FF]/40 px-3 py-1 rounded-full">
              Transparent & Honest
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#171B32] tracking-tight">
              Simple, Predictable Plans
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              InvoiceCraft Studio is currently available in a full-featured local-first edition with zero payment required. Below is our preview of the upcoming Phase 2 cloud sync roadmap.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {plans.map((p, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-8 border flex flex-col justify-between transition-all relative ${
                  p.primary
                    ? 'border-[#6254E8] shadow-xl shadow-[#6254E8]/10 ring-2 ring-[#6254E8]/20'
                    : 'border-[#E6E8F0] shadow-xs'
                }`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        p.primary
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{p.price}</span>
                      <span className="text-xs text-slate-500 font-medium">/{p.period}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className={`w-4 h-4 shrink-0 ${p.primary ? 'text-[#6254E8]' : 'text-slate-400'}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href={p.ctaHref}
                    className={`w-full py-3 rounded-xl text-xs font-bold text-center block transition-all ${
                      p.primary
                        ? 'bg-[#6254E8] hover:bg-[#5244d4] text-white shadow-md shadow-[#6254E8]/25'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {p.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Note */}
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center leading-relaxed">
            <span className="font-bold text-slate-800">No mock checkouts or fake subscriptions: </span>
            The current build is 100% free and client-side only. We do not prompt for mock billing or ask for payment data until Phase 2 is officially launched.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
