'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { localDb } from '@/lib/db/indexeddb';
import { seedDemoData } from '@/lib/db/seed';
import { Workspace, SUPPORTED_CURRENCIES } from '@/types/workspace';
import {
  Settings,
  Save,
  Download,
  Upload,
  Trash2,
  Database,
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const ws = await workspaceRepo.getActiveWorkspace();
      if (ws) setWorkspace(ws);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setIsSaving(true);
    try {
      await workspaceRepo.saveWorkspace(workspace);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await localDb.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoicecraft-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export backup');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await localDb.importBackup(text);
        if (res.success) {
          setImportStatus('Backup restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          alert(res.message);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to restore backup');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (confirm('CAUTION: Are you sure you want to permanently clear all local data? This will remove all local invoices, clients, products, and brand settings.')) {
      await localDb.clearAll();
      window.location.reload();
    }
  };

  const handleLoadDemoWorkspace = async () => {
    if (confirm('Load demo workspace with sample invoices, customers, and products?')) {
      await seedDemoData();
      window.location.reload();
    }
  };

  if (!workspace) return null;

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E6E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Workspace Settings</h1>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Local-First Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your business information, default currency, numbering scheme, and manage backups.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/20 transition-all"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved Successfully!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Business Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-[#6254E8]" />
              <h3 className="text-sm font-bold text-[#171B32]">Business & Contact Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={workspace.name}
                  onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Billing Email *</label>
                <input
                  type="email"
                  required
                  value={workspace.email}
                  onChange={(e) => setWorkspace({ ...workspace, email: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={workspace.phone || ''}
                  onChange={(e) => setWorkspace({ ...workspace, phone: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Website URL</label>
                <input
                  type="text"
                  value={workspace.website || ''}
                  onChange={(e) => setWorkspace({ ...workspace, website: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tax Registration / EIN</label>
                <input
                  type="text"
                  value={workspace.taxId || ''}
                  onChange={(e) => setWorkspace({ ...workspace, taxId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address Line 1</label>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace"
                  value={workspace.address.line1}
                  onChange={(e) => setWorkspace({
                    ...workspace,
                    address: { ...workspace.address, line1: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Suite / Unit / Floor (Line 2)</label>
                <input
                  type="text"
                  placeholder="e.g. Suite 400"
                  value={workspace.address.line2 || ''}
                  onChange={(e) => setWorkspace({
                    ...workspace,
                    address: { ...workspace.address, line2: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco"
                  value={workspace.address.city}
                  onChange={(e) => setWorkspace({
                    ...workspace,
                    address: { ...workspace.address, city: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">State / Province</label>
                <input
                  type="text"
                  placeholder="e.g. CA"
                  value={workspace.address.state || ''}
                  onChange={(e) => setWorkspace({
                    ...workspace,
                    address: { ...workspace.address, state: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Postal / ZIP Code</label>
                <input
                  type="text"
                  placeholder="e.g. 94107"
                  value={workspace.address.postalCode || ''}
                  onChange={(e) => setWorkspace({
                    ...workspace,
                    address: { ...workspace.address, postalCode: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={workspace.address.country}
                  onChange={(e) => setWorkspace({
                    ...workspace,
                    address: { ...workspace.address, country: e.target.value }
                  })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Regional & Financial Defaults */}
          <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings className="w-4 h-4 text-[#6254E8]" />
              <h3 className="text-sm font-bold text-[#171B32]">Currency & Invoicing Defaults</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Default Currency</label>
                <select
                  value={workspace.currency}
                  onChange={(e) => setWorkspace({ ...workspace, currency: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Date Format</label>
                <select
                  value={workspace.dateFormat}
                  onChange={(e) => setWorkspace({ ...workspace, dateFormat: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-20)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (20/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (10/20/2026)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={workspace.invoiceNumberPrefix}
                  onChange={(e) => setWorkspace({ ...workspace, invoiceNumberPrefix: e.target.value })}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Next Number</label>
                <input
                  type="number"
                  min="1"
                  value={workspace.invoiceNumberNext}
                  onChange={(e) => setWorkspace({ ...workspace, invoiceNumberNext: parseInt(e.target.value) || 1001 })}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Default Payment Instructions (Wire / Bank)
              </label>
              <textarea
                rows={3}
                value={workspace.paymentInstructions || ''}
                onChange={(e) => setWorkspace({ ...workspace, paymentInstructions: e.target.value })}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
              />
            </div>
          </div>
        </form>

        {/* Data Management & Backup */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Database className="w-4 h-4 text-[#6254E8]" />
            <h3 className="text-sm font-bold text-[#171B32]">Local Data Management & Backup</h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            All records are stored securely in your browser profile using IndexedDB. You can export complete JSON backups or restore them at any time.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Restore JSON Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportBackup}
            />

            <button
              type="button"
              onClick={handleLoadDemoWorkspace}
              className="inline-flex items-center gap-1.5 bg-[#D9D4FF]/30 hover:bg-[#D9D4FF]/60 text-[#6254E8] text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Data</span>
            </button>
          </div>

          {importStatus && (
            <p className="text-xs text-emerald-600 font-bold pt-1">{importStatus}</p>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-700">Clear Local Workspace</p>
              <p className="text-[11px] text-slate-400">Permanently purge all locally saved invoices and data.</p>
            </div>
            <button
              type="button"
              onClick={handleClearAllData}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Local Data</span>
            </button>
          </div>
        </div>

        {/* Backend Readiness Status Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#6254E8]" />
            <span>Backend Integration Architecture Status</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            The frontend is running in isolated local-first mode. All database operations route through clean repository interfaces (<code className="bg-purple-100/80 px-1 py-0.5 rounded text-purple-900 font-mono text-[11px]">WorkspaceRepository</code>, <code className="bg-purple-100/80 px-1 py-0.5 rounded text-purple-900 font-mono text-[11px]">InvoiceRepository</code>). In the next phase, attaching Supabase/PostgreSQL requires zero changes to the UI components. Check <code className="font-mono text-purple-900 font-bold">BACKEND_SETUP_GUIDE.md</code> for full migration scripts.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
