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
        // Automatically initialize default workspace so the user has an immediate working state
        ws = await workspaceRepo.createWorkspace(DEFAULT_WORKSPACE);
      }
      setWorkspace(ws);

      const bk = await brandRepo.getBrandKit(ws.id);
      setBrandKit(bk);
    } catch (err) {
      console.error('Failed to initialize local workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadDemoData = async () => {
    if (confirm('Load demo workspace with sample invoices, customers, and products? (Existing local records will be replaced)')) {
      setIsLoading(true);
      await seedDemoData();
      await loadData();
      window.location.reload();
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
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-[3px] border-[#EDE9FF] rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-[3px] border-[#5B4FCF] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#0F1128]">Loading workspace...</p>
                    <p className="text-xs text-slate-400 mt-1">Connecting to IndexedDB</p>
                  </div>
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
