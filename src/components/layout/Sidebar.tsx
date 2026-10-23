'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Palette,
  Users,
  Package,
  Settings,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Zap
} from 'lucide-react';
import { Workspace } from '@/types/workspace';

interface SidebarProps {
  workspace: Workspace | null;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  cta?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_ITEMS: NavGroup[] = [
  {
    group: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Invoices', href: '/invoices', icon: FileText },
      { name: 'New Invoice', href: '/invoices/new', icon: PlusCircle, cta: true },
    ]
  },
  {
    group: 'Manage',
    items: [
      { name: 'Brand Studio', href: '/brand-studio', icon: Palette },
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Products & Items', href: '/products', icon: Package },
    ]
  },
  {
    group: 'System',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ workspace, onCloseMobile }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/invoices/new') return false;
    return pathname === href || (pathname.startsWith(href + '/') && href !== '/');
  };

  return (
    <aside className="w-[260px] bg-white border-r border-[#E4E6F2] flex flex-col h-full min-h-screen">
      {/* Logo Header */}
      <div className="px-5 py-5 border-b border-[#E4E6F2]">
        <Link href="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6254E8] to-[#8B7CF6] flex items-center justify-center text-white shadow-lg shadow-[#6254E8]/25 group-hover:shadow-[#6254E8]/40 transition-shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="font-black text-[15px] text-[#171B32] tracking-tight leading-none">
              InvoiceCraft
            </p>
            <p className="text-[10px] font-bold text-[#6254E8] tracking-[0.12em] uppercase mt-0.5">
              Studio
            </p>
          </div>
        </Link>
      </div>

      {/* Active Workspace Banner */}
      <div className="px-3 py-3">
        <div className="px-3 py-2.5 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FF] rounded-xl border border-[#DCD9FF]">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#6254E8]">
            Active Workspace
          </p>
          <p className="font-bold text-[13px] text-[#0F1128] truncate mt-0.5">
            {workspace?.name || 'My Business'}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Local-First
            </span>
            <span className="text-[10px] text-slate-500 font-medium">IndexedDB</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        {NAV_ITEMS.map((group) => (
          <div key={group.group} className="mb-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400 px-3 py-2 mt-1">
              {group.group}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              if (item.cta) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-[#6254E8] to-[#8B7CF6] text-white hover:from-[#5244d4] hover:to-[#7B6CE5] shadow-md shadow-[#6254E8]/20 hover:shadow-[#6254E8]/30 transition-all mb-1 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-white/90" />
                      <span>{item.name}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all group ${
                    active
                      ? 'bg-[#EDE9FF] text-[#6254E8]'
                      : 'text-[#73788C] hover:text-[#171B32] hover:bg-slate-50'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] bg-[#6254E8] rounded-r-full" />
                  )}
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      active ? 'text-[#6254E8]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 pt-2 border-t border-[#E4E6F2] space-y-2">
        {/* Homepage Link */}
        <Link
          href="/"
          className="flex items-center justify-between text-[12px] font-medium text-[#73788C] hover:text-[#6254E8] py-1.5 px-3 rounded-lg hover:bg-[#F5F3FF] transition-colors"
          onClick={onCloseMobile}
        >
          <span>View Landing Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Offline mode status */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <p className="text-[11px] font-bold text-slate-700">Offline Autonomous Mode</p>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            No cloud credentials required. Data saved locally. Ready for Vercel deploy.
          </p>
        </div>
      </div>
    </aside>
  );
};
