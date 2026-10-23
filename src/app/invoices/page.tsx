'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { invoiceRepo } from '@/repositories/invoice.repo';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';
import { exportInvoiceToPdf } from '@/lib/export/pdf';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';

export default function InvoicesListPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const ws = await workspaceRepo.getActiveWorkspace();
      if (ws) {
        setWorkspace(ws);
        const list = await invoiceRepo.getInvoices(ws.id);
        setInvoices(list);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDuplicate = async (id: string) => {
    const dup = await invoiceRepo.duplicateInvoice(id);
    if (dup) {
      await loadInvoices();
      router.push(`/invoices/${dup.id}`);
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      await invoiceRepo.deleteInvoice(id);
      await loadInvoices();
    }
  };

  // Filter & Sort Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customer.companyName && inv.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    if (sortBy === 'date_asc') return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    if (sortBy === 'amount_desc') return b.total - a.total;
    if (sortBy === 'amount_asc') return a.total - b.total;
    return 0;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Paid</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Partial</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Overdue</span>
          </span>
        );
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6254E8] bg-[#D9D4FF]/30 px-2.5 py-0.5 rounded-full border border-[#D9D4FF]">
            <Clock className="w-3 h-3 text-[#6254E8]" />
            <span>Issued</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <FileText className="w-3 h-3 text-slate-500" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E6E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Invoices</h1>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {invoices.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage drafts, track issued invoices, record customer payments, and export PDFs.
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice # or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-[#6254E8]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="issued">Issued</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Table Card */}
        <div className="bg-white rounded-2xl border border-[#E6E8F0] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No invoices found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria or clear status filters.'
                  : 'Start by creating your first branded invoice or load our demo workspace.'}
              </p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 bg-[#6254E8] text-white text-xs font-semibold px-4 py-2 rounded-xl mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F8F9FC] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Invoice #</th>
                    <th className="py-3.5 px-5">Client</th>
                    <th className="py-3.5 px-5">Issue Date</th>
                    <th className="py-3.5 px-5">Due Date</th>
                    <th className="py-3.5 px-5">Total</th>
                    <th className="py-3.5 px-5">Balance Due</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const curr = inv.currency || workspace?.currency || 'USD';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-4 px-5">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-bold text-[#6254E8] hover:underline"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900">{inv.customer.name}</p>
                          {inv.customer.companyName && (
                            <p className="text-[11px] text-slate-500">{inv.customer.companyName}</p>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-600">
                          {formatDate(inv.issueDate, workspace?.dateFormat)}
                        </td>
                        <td className="py-4 px-5 text-slate-600">
                          {formatDate(inv.dueDate, workspace?.dateFormat)}
                        </td>
                        <td className="py-4 px-5 font-bold text-slate-900">
                          {formatCurrency(inv.total, curr)}
                        </td>
                        <td className="py-4 px-5 font-semibold">
                          <span style={{ color: inv.balanceDue > 0 ? '#6254E8' : '#10B981' }}>
                            {formatCurrency(inv.balanceDue, curr)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="p-1.5 text-slate-400 hover:text-[#6254E8] rounded-lg hover:bg-slate-100"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-[#6254E8] rounded-lg hover:bg-slate-100"
                              title="Duplicate as new draft"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                              title="Delete invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
