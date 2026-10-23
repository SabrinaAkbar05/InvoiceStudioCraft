'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { localDb } from '@/lib/db/indexeddb';
import { CloudUpload, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Workspace } from '@/types/workspace';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { Invoice } from '@/types/invoice';
import { BrandKit } from '@/types/brand';

export const MigrationBanner: React.FC<{ workspace: Workspace | null }> = ({ workspace }) => {
  const { user } = useAuth();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkLocalData() {
      if (!user || !workspace || dismissed) return;

      try {
        const isDismissed = localStorage.getItem(`migration_dismissed_${workspace.id}`);
        if (isDismissed) return;

        const [custs, prods, invs] = await Promise.all([
          localDb.getAll<Customer>('customers'),
          localDb.getAll<Product>('products'),
          localDb.getAll<Invoice>('invoices')
        ]);

        const count = custs.length + prods.length + invs.length;
        if (count > 0) {
          setItemCount(count);
          setHasLocalData(true);
        }
      } catch (e) {
        console.warn('Could not check local data for migration:', e);
      }
    }

    checkLocalData();
  }, [user, workspace, dismissed]);

  if (!user || !workspace || !hasLocalData || dismissed) return null;

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);

    try {
      const token = await user.getIdToken();

      // 1. Read all local data
      const [brandKits, customers, products, invoices] = await Promise.all([
        localDb.getAll<BrandKit>('brandKits'),
        localDb.getAll<Customer>('customers'),
        localDb.getAll<Product>('products'),
        localDb.getAll<Invoice>('invoices')
      ]);

      const brandKit = brandKits.find((b) => b.workspaceId === workspace.id) || brandKits[0];

      // 2. Stable migration ID
      const migrationId = `mig_${workspace.id}_${user.uid}`;

      // 3. Post to migration API
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          migrationId,
          workspace,
          brandKit,
          customers,
          products,
          invoices
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Cloud migration failed');
      }

      setMigrationDone(true);
      localStorage.setItem(`migration_dismissed_${workspace.id}`, 'true');

      setTimeout(() => {
        setHasLocalData(false);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed. Your local data remains safe.');
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (workspace) {
      localStorage.setItem(`migration_dismissed_${workspace.id}`, 'true');
    }
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#EDE9FF] via-white to-[#EDE9FF] border border-[#6254E8]/20 shadow-sm relative overflow-hidden transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6254E8]/10 text-[#6254E8] flex items-center justify-center shrink-0 mt-0.5">
            {migrationDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <CloudUpload className="w-5 h-5 text-[#6254E8]" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0F1128]">
              {migrationDone
                ? 'Cloud Migration Complete!'
                : `Local Offline Records Detected (${itemCount} items)`}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {migrationDone
                ? 'All your local business records, customers, and invoices are now securely stored in Cloud Firestore.'
                : 'Would you like to sync your existing local records to your secure cloud Firebase account? Your local data will remain intact.'}
            </p>
            {error && (
              <div className="mt-2 text-[11px] text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!migrationDone && (
            <>
              <button
                type="button"
                onClick={handleMigrate}
                disabled={migrating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6254E8] hover:bg-[#5143D6] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Sync to Cloud</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Keep local only"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
