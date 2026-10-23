import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  Palette,
  Calculator,
  Download,
  Users,
  Package,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Printer,
  Sliders,
  DollarSign,
  Clock
} from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    {
      icon: Palette,
      title: 'Automated Brand Color Extraction',
      description: 'Upload your company logo in any major format. Our client-side canvas algorithms sample the image, quantize dominant colors, suggest primary and secondary palettes, and verify WCAG 2.1 contrast ratios.',
      tag: 'Brand Studio'
    },
    {
      icon: Calculator,
      title: 'Decimal.js Safe Financial Engine',
      description: 'Never worry about floating-point calculation errors. Every line item, percentage discount, fixed coupon, multi-tiered tax, and partial payment is calculated with strict 20-digit decimal arithmetic.',
      tag: 'Math & Accuracy'
    },
    {
      icon: Sparkles,
      title: 'Natural-Language Invoice Parser',
      description: 'Type instructions in plain English, like "Create an invoice for Almas. Add one bouquet for Rs. 2500 and delivery Rs. 400". The system identifies recognized entities and displays a structured review before applying.',
      tag: 'Local AI Parser'
    },
    {
      icon: Download,
      title: 'High-Resolution PDF & Native Print',
      description: 'Generate publication-ready PDF documents directly in the browser with support for both A4 and US Letter page sizes, along with seamless native printing support.',
      tag: 'Export Engine'
    },
    {
      icon: Layers,
      title: 'Four Designer Template Families',
      description: 'Select from Minimal, Corporate, Elegant, and Creative layouts. Each template dynamically adopts the brand kit colors extracted from your logo instead of generic default themes.',
      tag: 'Document Design'
    },
    {
      icon: ShieldCheck,
      title: 'Local-First Private Persistence',
      description: 'Zero third-party cloud tracking. All workspaces, invoices, payments, client profiles, and product catalogs are stored safely inside browser IndexedDB, with full JSON backup and restore capabilities.',
      tag: 'Privacy & Offline'
    },
    {
      icon: Users,
      title: 'Customer Directory & Balance Ledger',
      description: 'Keep client contact details, billing addresses, and tax numbers organized. Track cumulative invoiced volume and real-time outstanding balances on individual client cards.',
      tag: 'Client Management'
    },
    {
      icon: Package,
      title: 'Reusable Product & Service Catalog',
      description: 'Store standard items, default hourly rates, packaging fees, and tax categories to insert them into new invoices with a single click.',
      tag: 'Catalog'
    },
    {
      icon: DollarSign,
      title: 'Payment Tracking & Status Workflow',
      description: 'Record partial payments and deposits with transaction IDs, payment methods, and notes. Invoices automatically transition between Draft, Issued, Partially Paid, Paid, and Overdue.',
      tag: 'Cashflow'
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
              Complete Capabilities
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#171B32] tracking-tight">
              Built for Modern Entrepreneurs and Studios
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every detail in InvoiceCraft Studio is engineered for visual elegance, mathematical reliability, and private local productivity.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-7 rounded-2xl border border-[#E6E8F0] shadow-xs hover:border-[#6254E8]/50 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#D9D4FF]/40 text-[#6254E8] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Banner */}
          <div className="bg-[#171B32] text-white p-8 sm:p-12 rounded-3xl text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Test the full workflow in your browser now
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              No registration or setup delay. Jump straight into the live invoice editor.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-transform hover:scale-102"
              >
                <span>Launch Invoice Editor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
