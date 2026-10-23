'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus, Sparkles, ChevronDown, Check, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Workspace, SUPPORTED_CURRENCIES } from '@/types/workspace';
import { BrandKit } from '@/types/brand';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/invoices': 'Invoices',
  '/invoices/new': 'Create Invoice',
  '/brand-studio': 'Brand Studio',
  '/customers': 'Customers',
  '/products': 'Products & Items',
  '/settings': 'Settings',
};

interface AppHeaderProps {
  workspace: Workspace | null;
  brandKit: BrandKit | null;
  onOpenMobileMenu: () => void;
  onLoadDemoData?: () => void;
  onClearData?: () => void;
  onUpdateWorkspace?: (updated: Workspace) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  workspace,
  brandKit,
  onOpenMobileMenu,
  onLoadDemoData,
  onUpdateWorkspace,
}) => {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCurrency = async (currCode: string) => {
    if (!workspace) return;
    try {
      const updated: Workspace = {
        ...workspace,
        currency: currCode
      };
      await workspaceRepo.saveWorkspace(updated);
      onUpdateWorkspace?.(updated);
      setCurrencyDropdownOpen(false);
      window.dispatchEvent(new CustomEvent('workspace-currency-changed', { detail: currCode }));
    } catch (err) {
      console.error('Failed to update currency:', err);
    }
  };

  const pageTitle =
    PAGE_TITLES[pathname] ||
    (pathname.startsWith('/invoices/') ? 'Invoice Detail' : 'InvoiceCraft Studio');

  const brandColor = brandKit?.primaryColor || '#5B4FCF';
  const currentCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === (workspace?.currency || 'USD')) || {
    code: workspace?.currency || 'USD',
    symbol: '$',
    name: 'Currency'
  };

  return (
    <header
      className={`sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E4E6F2]'
          : 'bg-white border-b border-[#E4E6F2]'
      }`}
    >
      {/* Left: Mobile toggle + Page breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-[15px] font-bold text-[#0F1128] leading-none">
            {pageTitle}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block font-medium">
            {workspace?.name
              ? `${workspace.name}${workspace.isDemoWorkspace ? ' · Demo' : ''}`
              : 'Set up your workspace →'}
          </p>
        </div>

        {workspace?.isDemoWorkspace && (
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
            Demo Workspace
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Brand Kit color chip */}
        <Link
          href="/brand-studio"
          id="header-brand-kit-link"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E4E6F2] hover:border-[#5B4FCF] bg-[#F5F6FA] hover:bg-[#EDE9FF] text-[12px] font-semibold text-slate-700 hover:text-[#5B4FCF] transition-all"
          title="Manage Brand Kit"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: brandColor }}
          />
          <span>Brand Kit</span>
        </Link>

        {/* Currency Dropdown Menu */}
        <div className="relative" ref={currencyDropdownRef}>
          <button
            type="button"
            id="header-currency-dropdown-btn"
            onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#6254E8] bg-slate-50 hover:bg-[#EDE9FF]/40 text-slate-800 hover:text-[#6254E8] text-[11px] font-bold tracking-wide transition-all shadow-2xs"
            title="Select Default Workspace Currency"
          >
            <span>{currentCurrency.code}</span>
            <span className="text-[10px] text-slate-400 font-normal">({currentCurrency.symbol})</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {currencyDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Currency</p>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const isSelected = (workspace?.currency || 'USD') === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCurrency(c.code)}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-[#EDE9FF]/50 text-[#6254E8] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold w-10 text-[11px]">{c.code}</span>
                        <span className="text-slate-600 font-normal truncate max-w-[120px] text-[11px]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">{c.symbol}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#6254E8]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Load Demo Data */}
        {onLoadDemoData && (
          <button
            id="load-demo-data-btn"
            onClick={onLoadDemoData}
            className="hidden lg:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#5B4FCF] bg-[#EDE9FF] hover:bg-[#DCD9FF] px-3 py-1.5 rounded-xl transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Data</span>
          </button>
        )}

        {/* New Invoice CTA */}
        <Link
          href="/invoices/new"
          id="header-new-invoice-btn"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#5B4FCF] to-[#7B70E2] hover:from-[#4C42BE] hover:to-[#6C63D6] text-white text-[12px] font-semibold px-3.5 py-2 rounded-xl shadow-md shadow-[#5B4FCF]/20 hover:shadow-[#5B4FCF]/30 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Invoice</span>
        </Link>

        {/* User Authentication Control */}
        {user ? (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium max-w-[140px] truncate"
              title={user.email || 'Signed in'}
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{user.displayName || user.email?.split('@')[0]}</span>
            </div>
            <button
              type="button"
              onClick={() => signOutUser()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            id="header-login-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#6254E8] bg-white text-slate-700 hover:text-[#6254E8] text-xs font-semibold transition-all shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};
