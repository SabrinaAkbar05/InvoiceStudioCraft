'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Palette,
  FileText,
  Download,
  Sliders,
  Printer,
  Lock,
  ChevronDown,
  Layers,
  Zap,
  Globe,
  Award
} from 'lucide-react';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'minimal' | 'corporate' | 'elegant' | 'creative'>('corporate');

  const faqs = [
    {
      q: 'Do I need to create an account or provide payment information to use InvoiceCraft Studio?',
      a: 'No. InvoiceCraft Studio operates in a local-first autonomous mode. All workspaces, clients, and generated invoices are saved directly in your browser using IndexedDB. No credit card or registration is required.'
    },
    {
      q: 'How does the automatic brand color extraction work?',
      a: 'When you upload your company logo (PNG, JPG, SVG, or WebP), our client-side color intelligence quantizes the image pixels, extracts dominant brand shades, selects accessible secondary accents, and verifies WCAG contrast compliance automatically.'
    },
    {
      q: 'Can I export professional, high-resolution PDF invoices?',
      a: 'Yes. Our PDF engine renders crisp, vector-accurate printable documents in both A4 and US Letter formats, ready for email delivery or printing.'
    },
    {
      q: 'How does the natural-language invoice instruction creator work?',
      a: 'You can write prompts like "Create an invoice for Almas. Add one bouquet for Rs. 2500 and one bento cake for Rs. 1500. Delivery charges Rs. 400." Our parser identifies clients, items, prices, currencies, and discounts, giving you a review screen before applying to the editor.'
    },
    {
      q: 'Will my local invoices be deleted if I close the browser?',
      a: 'No. Data is preserved persistently across reloads and browser restarts in your browser profile using IndexedDB. You can also export full JSON backups in Settings at any time.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#171B32] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#D9D4FF]/40 to-[#6254E8]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D9D4FF]/40 border border-[#6254E8]/20 text-[#6254E8] text-xs font-bold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal AI-Powered Branded Invoice Platform</span>
            </div>

            {/* Headline & Tagline */}
            <div className="max-w-4xl mx-auto space-y-4">
              <h1 className="text-4xl sm:text-6xl font-black text-[#171B32] tracking-tight leading-[1.1]">
                Invoices that look like <span className="bg-gradient-to-r from-[#6254E8] to-[#8E84F5] bg-clip-text text-transparent">your brand</span>. Created in seconds.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Your Brand. Your Invoice. Instantly. Upload your logo, extract matching color palettes, and create boardroom-ready PDF invoices with real-time math.
              </p>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/invoices/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6254E8] hover:bg-[#5244d4] text-white text-sm font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-[#6254E8]/30 hover:scale-102 transition-all group"
              >
                <span>Create Your First Invoice</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-[#E6E8F0] text-[#171B32] text-sm font-bold px-6 py-3.5 rounded-2xl shadow-xs transition-colors"
              >
                <span>Explore Features</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Backend Credentials Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Private IndexedDB Persistence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Decimal-Safe Calculation Engine</span>
              </div>
            </div>

            {/* Interactive Preview Mockup Container */}
            <div className="pt-10 max-w-5xl mx-auto">
              <div className="p-3 bg-white/70 backdrop-blur-md rounded-3xl border border-[#E6E8F0] shadow-2xl">
                <div className="bg-[#171B32] rounded-2xl p-6 sm:p-8 text-left text-white space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#6254E8] flex items-center justify-center font-bold">
                        IC
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">Live Split-Screen Studio</p>
                        <p className="text-[11px] text-slate-400">Real-time vector rendering • Dynamic palette inheritance</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-semibold">Active Session</span>
                    </div>
                  </div>

                  {/* Mock Workspace Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                      <span className="text-slate-400 font-medium text-[10px] uppercase">1. Upload Logo</span>
                      <p className="font-bold text-white text-sm">Instant Color Quantization</p>
                      <p className="text-slate-400 text-[11px]">Primary, secondary & neutral harmony generated on the fly.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                      <span className="text-slate-400 font-medium text-[10px] uppercase">2. Natural Instructions</span>
                      <p className="font-bold text-white text-sm">Smart Text Parsing</p>
                      <p className="text-slate-400 text-[11px]">Type plain English requests. Quantities & prices mapped instantly.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                      <span className="text-slate-400 font-medium text-[10px] uppercase">3. High-Res PDF Export</span>
                      <p className="font-bold text-white text-sm">Vector & Print Ready</p>
                      <p className="text-slate-400 text-[11px]">A4 and Letter formatted documents with multi-currency math.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGO-TO-INVOICE WORKFLOW */}
        <section className="py-20 bg-white border-y border-[#E6E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-[#6254E8] uppercase tracking-wider">Color Intelligence</span>
              <h2 className="text-3xl font-black text-[#171B32] tracking-tight">
                How Logo-to-Invoice Personalization Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Most invoice software forces you into generic templates. InvoiceCraft Studio extracts your unique branding DNA and molds every line, badge, and total to match.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Upload Brand Assets',
                  desc: 'Drop your logo (PNG, JPG, SVG, WebP). Your original graphics are preserved at 100% resolution with zero compression distortion.'
                },
                {
                  step: '02',
                  title: 'Auto Color Analysis',
                  desc: 'Our canvas color extractor calculates dominant RGB distributions, saturation weights, and selects vivid accents.'
                },
                {
                  step: '03',
                  title: 'WCAG Contrast Guard',
                  desc: 'We automatically audit contrast ratios to guarantee your invoice text is razor-sharp and legible on both screens and laser printers.'
                },
                {
                  step: '04',
                  title: 'Template Adoption',
                  desc: 'Switch between Minimal, Corporate, Elegant, and Creative templates. Each dynamically inherits your custom brand palette.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-[#F8F9FC] border border-[#E6E8F0] space-y-3 hover:border-[#6254E8]/50 transition-colors">
                  <span className="text-2xl font-black text-[#6254E8]/30">{item.step}</span>
                  <h3 className="text-base font-bold text-[#171B32]">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 TEMPLATE FAMILIES SHOWCASE */}
        <section id="templates" className="py-20 bg-[#F8F9FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-[#6254E8] uppercase tracking-wider">Precision Typography</span>
              <h2 className="text-3xl font-black text-[#171B32] tracking-tight">
                Four Template Families For Every Industry
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Crafted by senior financial designers. Every invoice features clear totals, breakdown of discounts, tax calculations, and optional digital signatures.
              </p>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { id: 'corporate', label: 'Corporate & Enterprise' },
                { id: 'minimal', label: 'Minimalist Clean' },
                { id: 'elegant', label: 'Elegant & Boutique' },
                { id: 'creative', label: 'Creative Studio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTemplateTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTemplateTab === tab.id
                      ? 'bg-[#6254E8] text-white shadow-xs'
                      : 'bg-white border border-[#E6E8F0] text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Showcase Card */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E6E8F0] shadow-sm max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400 border-b pb-3 border-slate-100">
                <span className="font-bold text-[#171B32] capitalize">{activeTemplateTab} Template Architecture</span>
                <span>A4 & US Letter • Vector Printable</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                {activeTemplateTab === 'corporate' && (
                  <p>Features strong dark header bands, numbered line items, explicit tax breakdown blocks, and enterprise payment routing details. Ideal for B2B contracts, engineering consultancies, and established corporate suppliers.</p>
                )}
                {activeTemplateTab === 'minimal' && (
                  <p>Spacious Swiss typography with subtle dividers, right-aligned monetary balances, and uncluttered layout. Ideal for software developers, copywriters, and modern digital professionals.</p>
                )}
                {activeTemplateTab === 'elegant' && (
                  <p>Refined serif headings, decorative border accents, and courteous settlement copy. Ideal for high-end florists, artisan bakeries, luxury event planners, and interior architects.</p>
                )}
                {activeTemplateTab === 'creative' && (
                  <p>Bold asymmetric hero header, colorful badge tags, and modern typographic geometry. Ideal for branding studios, photography directors, and creative agencies.</p>
                )}
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/brand-studio"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6254E8] hover:underline"
                >
                  <span>Preview with your own logo in Brand Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 bg-white border-t border-[#E6E8F0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-[#6254E8] uppercase tracking-wider">Answers</span>
              <h2 className="text-3xl font-black text-[#171B32] tracking-tight">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-[#E6E8F0] rounded-2xl overflow-hidden transition-all bg-[#F8F9FC]"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-[#171B32]"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#6254E8]' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="py-20 bg-gradient-to-tr from-[#171B32] to-[#252C4E] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to send invoices clients will actually love?
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Launch your local workspace now. No setup fees, no sign-ups, and zero cloud tracking.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 bg-[#6254E8] hover:bg-[#5244d4] text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg transition-transform hover:scale-102"
              >
                <span>Create Invoice Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
