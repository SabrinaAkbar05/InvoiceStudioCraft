'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const [year, setYear] = useState(2024);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);
  return (
    <footer className="bg-[#171B32] text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6254E8] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">InvoiceCraft Studio</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your Brand. Your Invoice. Instantly. Universal AI-powered branded invoice platform for businesses of every size.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
              <Lock className="w-3.5 h-3.5" />
              <span>Local-First Private Workspace</span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/brand-studio" className="hover:text-white transition-colors">Brand Studio & Color Extractor</Link></li>
              <li><Link href="/invoices/new" className="hover:text-white transition-colors">Live Split-Screen Editor</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">4 Invoice Template Families</Link></li>
              <li><Link href="/invoices" className="hover:text-white transition-colors">Invoice Tracking & Payments</Link></li>
              <li><Link href="/customers" className="hover:text-white transition-colors">Customer Directory</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Item Catalog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/settings" className="hover:text-white transition-colors">Local IndexedDB Persistence</Link></li>
              <li><span className="text-slate-500">Decimal.js Safe Math</span></li>
              <li><span className="text-slate-500">Client Vector & Canvas PDF</span></li>
              <li><span className="text-slate-500">Deterministic NL Instruction Parser</span></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Future Cloud Sync Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Open Development</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Ready for Next.js 16 App Router on Vercel with future Supabase PostgreSQL backend integration points.
            </p>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <p className="font-semibold text-white">Zero Cloud Dependencies</p>
              <p className="text-slate-400 mt-1">All data persists privately in your local browser profile.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {year} InvoiceCraft Studio. Designed with precision for global entrepreneurs.</p>
          <div className="flex items-center gap-6">
            <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/settings" className="hover:text-white transition-colors">Backup Data</Link>
            <Link href="/setup" className="hover:text-white transition-colors">Workspace Setup</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
