'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { brandRepo } from '@/repositories/brand.repo';
import { seedDemoData } from '@/lib/db/seed';
import { Workspace, DEFAULT_WORKSPACE } from '@/types/workspace';
import { BrandKit } from '@/types/brand';
import { MigrationBanner } from '@/components/migration/MigrationBanner';
import { toast } from '@/components/ui/Toast';
import { X } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = async () => {
    try {
      let ws = await workspaceRepo.getActiveWorkspace();
      if (!ws) {
        ws = await workspaceRepo.createWorkspace(DEFAULT_WORKSPACE);
      }
      setWorkspace(ws);

      const bk = await brandRepo.getBrandKit(ws.id);
      setBrandKit(bk);
    } catch (err) {
      console.warn('Workspace initialization warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Safety watchdog: ensure page is never stuck in an infinite loading state
    const watchdogTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    loadData();

    // Listen for custom workspace update events
    const handleWorkspaceUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      if (customEvent.detail) {
        setWorkspace(customEvent.detail);
      }
    };
    window.addEventListener('workspace-updated', handleWorkspaceUpdated);

    return () => {
      clearTimeout(watchdogTimer);
      window.removeEventListener('workspace-updated', handleWorkspaceUpdated);
    };
  }, []);

  const handleLoadDemoData = async () => {
    if (confirm('Load demo workspace with sample invoices, customers, and products? (Existing local records will be replaced)')) {
      setIsLoading(true);
      try {
        await seedDemoData();
        await loadData();
        toast.success('Sample workspace data loaded successfully!');
        window.location.reload();
      } catch (err) {
        console.error(err);
        toast.error('Failed to load demo data.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#0F1128] flex flex-col antialiased">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar workspace={workspace} />
        </div>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col max-w-[280px] w-full bg-white z-10 shadow-2xl">
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar workspace={workspace} onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Workspace Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader
            workspace={workspace}
            brandKit={brandKit}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLoadDemoData={workspace?.isDemoWorkspace ? undefined : handleLoadDemoData}
            onUpdateWorkspace={(ws) => setWorkspace(ws)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-72 bg-slate-100 rounded-lg" />
                  </div>
                  <div className="h-9 w-32 bg-slate-200 rounded-xl" />
                </div>
                {/* Metric Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                      <div className="h-4 w-20 bg-slate-100 rounded" />
                      <div className="h-8 w-28 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
                {/* Content Area Skeleton */}
                <div className="h-64 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-50 rounded" />
                  <div className="h-4 w-full bg-slate-50 rounded" />
                  <div className="h-4 w-3/4 bg-slate-50 rounded" />
                </div>
              </div>
            ) : (
              <div className="page-enter">
                <MigrationBanner workspace={workspace} />
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
