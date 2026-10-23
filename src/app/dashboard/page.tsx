'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { invoiceRepo } from '@/repositories/invoice.repo';
import { customerRepo } from '@/repositories/customer.repo';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';
import { Invoice } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { Workspace } from '@/types/workspace';
import {
  Plus,
  ArrowUpRight,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Palette,
  Sparkles,
  FileText,
  Layers,
  TrendingUp,
  ArrowRight,
  Zap,
} from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    partially_paid: { label: 'Partial', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    issued: { label: 'Issued', cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
    overdue: { label: 'Overdue', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
    draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

function MetricCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E7E9F2] shadow-sm space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#73788C] uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-[#171B32] tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-[#73788C] mt-1.5">{sub}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6254E8] to-[#8B7CF6] flex items-center justify-center shadow-xl shadow-[#6254E8]/25">
          <FileText className="w-9 h-9 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
          <Plus className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="space-y-2 max-w-xs">
        <h2 className="text-lg font-black text-[#171B32]">No invoices yet</h2>
        <p className="text-sm text-[#73788C] leading-relaxed">
          Create your first invoice in under 2 minutes. Add your client, items, and download a professional PDF.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 bg-[#6254E8] hover:bg-[#5244d4] text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-[#6254E8]/25 transition-all hover:scale-105"
        >
          <Zap className="w-4 h-4" />
          Create Your First Invoice
        </Link>
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-[#E7E9F2] text-[#171B32] text-sm font-semibold px-5 py-3 rounded-xl transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#6254E8]" />
          Set Up Workspace
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm pt-4">
        {[
          { icon: '⚡', label: 'Quick Create', sub: '< 2 minutes' },
          { icon: '🎨', label: 'Brand Studio', sub: 'Your logo & colors' },
          { icon: '📄', label: 'PDF Export', sub: 'Professional quality' },
        ].map((f) => (
          <div key={f.label} className="text-center p-3 rounded-xl bg-[#F8F9FC] border border-[#E7E9F2]">
            <div className="text-xl mb-1">{f.icon}</div>
            <p className="text-[11px] font-bold text-[#171B32]">{f.label}</p>
            <p className="text-[10px] text-[#73788C]">{f.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const ws = await workspaceRepo.getActiveWorkspace();
        if (ws) {
          setWorkspace(ws);
          const [invList, custList] = await Promise.all([
            invoiceRepo.getInvoices(ws.id),
            customerRepo.getCustomers(ws.id),
          ]);
          setInvoices(invList);
          setCustomers(custList);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const currency = workspace?.currency || 'USD';

  let totalInvoiced = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  const statusCounts: Record<string, number> = { paid: 0, partially_paid: 0, issued: 0, overdue: 0, draft: 0 };

  invoices.forEach((inv) => {
    totalInvoiced += inv.total;
    totalReceived += inv.amountPaid;
    totalOutstanding += inv.balanceDue;
    const now = new Date();
    if (inv.status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < now && inv.balanceDue > 0)) {
      totalOverdue += inv.balanceDue;
    }
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
  });

  const recentInvoices = invoices.slice(0, 5);
  const hasInvoices = invoices.length > 0;

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-100 rounded-xl w-56" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
          </div>
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#E7E9F2]">
          <div>
            <h1 className="text-2xl font-black text-[#171B32] tracking-tight">
              Welcome back{workspace?.name ? `, ${workspace.name}` : ''} 👋
            </h1>
            <p className="text-sm text-[#73788C] mt-0.5">
              {hasInvoices
                ? "Here's what's happening with your invoices."
                : 'Ready to send your first invoice? It only takes 2 minutes.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/brand-studio"
              id="btn-brand-studio"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-[#E7E9F2] text-[#171B32] text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-[#6254E8]" />
              <span>Brand Studio</span>
            </Link>
            <Link
              href="/invoices/new"
              id="btn-create-invoice"
              className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/25 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Link>
          </div>
        </div>

        {!hasInvoices ? (
          <EmptyState />
        ) : (
          <>
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Invoiced"
                value={formatCurrency(totalInvoiced, currency)}
                sub={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} generated`}
                icon={<FileText className="w-4 h-4" />}
                accent="bg-violet-100 text-[#6254E8]"
              />
              <MetricCard
                label="Total Received"
                value={formatCurrency(totalReceived, currency)}
                sub="Settled payments & deposits"
                icon={<CheckCircle2 className="w-4 h-4" />}
                accent="bg-emerald-100 text-emerald-700"
              />
              <MetricCard
                label="Outstanding"
                value={formatCurrency(totalOutstanding, currency)}
                sub="Pending payments due"
                icon={<Clock className="w-4 h-4" />}
                accent="bg-blue-100 text-blue-700"
              />
              <MetricCard
                label="Overdue"
                value={formatCurrency(totalOverdue, currency)}
                sub={totalOverdue > 0 ? 'Needs immediate attention' : 'All invoices on time'}
                icon={<AlertCircle className="w-4 h-4" />}
                accent={totalOverdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}
              />
            </div>

            {/* Status Bar + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Status Distribution */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E7E9F2] shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#171B32]">Status Distribution</h3>
                  <span className="text-[10px] font-bold text-[#73788C] bg-slate-100 px-2 py-0.5 rounded-full">
                    {invoices.length} total
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  {statusCounts.paid > 0 && (
                    <div style={{ width: `${(statusCounts.paid / invoices.length) * 100}%` }} className="bg-emerald-500 h-full" />
                  )}
                  {statusCounts.partially_paid > 0 && (
                    <div style={{ width: `${(statusCounts.partially_paid / invoices.length) * 100}%` }} className="bg-blue-500 h-full" />
                  )}
                  {statusCounts.issued > 0 && (
                    <div style={{ width: `${(statusCounts.issued / invoices.length) * 100}%` }} className="bg-[#6254E8] h-full" />
                  )}
                  {statusCounts.overdue > 0 && (
                    <div style={{ width: `${(statusCounts.overdue / invoices.length) * 100}%` }} className="bg-rose-500 h-full" />
                  )}
                  {statusCounts.draft > 0 && (
                    <div style={{ width: `${(statusCounts.draft / invoices.length) * 100}%` }} className="bg-slate-300 h-full" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {[
                    { label: 'Paid', count: statusCounts.paid, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                    { label: 'Partial', count: statusCounts.partially_paid, cls: 'text-blue-700 bg-blue-50 border-blue-100' },
                    { label: 'Issued', count: statusCounts.issued, cls: 'text-violet-700 bg-violet-50 border-violet-100' },
                    { label: 'Overdue', count: statusCounts.overdue, cls: 'text-rose-700 bg-rose-50 border-rose-100' },
                    { label: 'Draft', count: statusCounts.draft, cls: 'text-slate-600 bg-slate-50 border-slate-200' },
                  ].map(({ label, count, cls }) => (
                    <div key={label} className={`flex items-center justify-between p-2 rounded-lg border ${cls}`}>
                      <span className="font-semibold">{label}</span>
                      <span className="font-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E7E9F2] shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#171B32]">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { href: '/brand-studio', icon: <Palette className="w-4 h-4" />, accent: 'bg-[#6254E8]', label: 'Brand Studio', sub: 'Logo & colors' },
                    { href: '/customers', icon: <Users className="w-4 h-4" />, accent: 'bg-blue-600', label: `Customers (${customers.length})`, sub: 'Client directory' },
                    { href: '/settings', icon: <Layers className="w-4 h-4" />, accent: 'bg-slate-800', label: 'Backup Data', sub: 'JSON export' },
                  ].map(({ href, icon, accent, label, sub }) => (
                    <Link
                      key={href}
                      href={href}
                      className="p-4 rounded-xl border border-[#E7E9F2] bg-[#F8F9FC] hover:bg-white hover:border-[#6254E8] hover:shadow-sm transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-xl ${accent} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        {icon}
                      </div>
                      <p className="text-xs font-bold text-[#171B32]">{label}</p>
                      <p className="text-[10px] text-[#73788C] mt-0.5">{sub}</p>
                    </Link>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-violet-900">Try natural language creation</p>
                    <p className="text-[11px] text-violet-600 mt-0.5">
                      Type: &ldquo;Invoice for Almas, 2 bouquets at PKR 2200 each&rdquo;
                    </p>
                  </div>
                  <Link
                    href="/invoices/new"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#6254E8] hover:underline whitespace-nowrap"
                  >
                    Try it <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-2xl border border-[#E7E9F2] shadow-sm">
              <div className="p-5 border-b border-[#E7E9F2] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#6254E8]" />
                  <h3 className="text-sm font-bold text-[#171B32]">Recent Invoices</h3>
                </div>
                <Link
                  href="/invoices"
                  className="text-xs font-bold text-[#6254E8] hover:underline flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E9F2] text-[#73788C] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-5">Invoice #</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Issue Date</th>
                      <th className="py-3 px-4 hidden md:table-cell">Due Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F1F8]">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#F8F9FC] transition-colors">
                        <td className="py-3.5 px-5">
                          <Link href={`/invoices/${inv.id}`} className="font-bold text-[#6254E8] hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#171B32]">{inv.customer.name}</td>
                        <td className="py-3.5 px-4 text-[#73788C] hidden sm:table-cell">{formatDate(inv.issueDate, workspace?.dateFormat)}</td>
                        <td className="py-3.5 px-4 text-[#73788C] hidden md:table-cell">{formatDate(inv.dueDate, workspace?.dateFormat)}</td>
                        <td className="py-3.5 px-4 font-bold text-[#171B32]">{formatCurrency(inv.total, currency)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
