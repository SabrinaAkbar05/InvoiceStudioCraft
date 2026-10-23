'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Brand Studio', href: '/brand-studio' },
    { label: 'Templates', href: '/#templates' },
    { label: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E6E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6254E8] to-[#8E84F5] flex items-center justify-center text-white shadow-md shadow-[#6254E8]/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#171B32] tracking-tight">InvoiceCraft</span>
              <span className="text-xs font-bold text-[#6254E8] uppercase tracking-wider ml-1 bg-[#D9D4FF]/40 px-1.5 py-0.5 rounded">Studio</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    active ? 'text-[#6254E8]' : 'text-[#171B32]/70 hover:text-[#171B32]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-[#171B32] hover:text-[#6254E8] px-3 py-2 rounded-lg transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 bg-[#6254E8] hover:bg-[#5244d4] text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/25 hover:shadow-lg hover:shadow-[#6254E8]/30 transition-all group"
            >
              <span>Create Invoice</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#171B32] hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E6E8F0] px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-[#171B32] py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center w-full py-2.5 text-sm font-semibold text-[#171B32] bg-slate-100 rounded-xl"
            >
              Dashboard
            </Link>
            <Link
              href="/invoices/new"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center w-full py-2.5 text-sm font-semibold text-white bg-[#6254E8] rounded-xl shadow-md"
            >
              Create Free Invoice
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
