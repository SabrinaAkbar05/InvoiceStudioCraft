'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { invoiceRepo } from '@/repositories/invoice.repo';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { exportInvoiceToPdf, triggerBrowserPrint } from '@/lib/export/pdf';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';
import { InvoiceTemplateRenderer } from '@/components/invoices/templates/InvoiceTemplateRenderer';
import { Invoice, InvoicePayment, InvoiceSender } from '@/types/invoice';
import { SenderEditorModal } from '@/components/invoices/SenderEditorModal';
import { Workspace } from '@/types/workspace';
import { toast } from '@/components/ui/Toast';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Building2,
  Edit3,
  Download,
  Printer,
  Copy,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Plus,
  Trash2,
  FileText,
  X,
  Loader2,
  Building,
  MapPin
} from 'lucide-react';

export function InvoiceDetailClient() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;


  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'cash' | 'paypal' | 'stripe' | 'check' | 'other'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);

  // Business Owner Info modal state
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizTaxId, setBizTaxId] = useState('');
  const [bizLine1, setBizLine1] = useState('');
  const [bizLine2, setBizLine2] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [bizState, setBizState] = useState('');
  const [bizPostalCode, setBizPostalCode] = useState('');
  const [bizCountry, setBizCountry] = useState('');

  useEffect(() => {
    async function load() {
      if (!invoiceId) return;
      const inv = await invoiceRepo.getInvoice(invoiceId);
      if (inv) {
        setInvoice(inv);
        setPaymentAmount(inv.balanceDue);
      }
      const ws = await workspaceRepo.getActiveWorkspace();
      if (ws) setWorkspace(ws);
      // Set payment date client-side to avoid Next.js 16 prerender error
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
    load();
  }, [invoiceId]);

  // Sync when workspace currency is changed in the header
  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      if (workspace) {
        setWorkspace((prev) => prev ? { ...prev, currency: e.detail } : null);
      }
    };
    window.addEventListener('workspace-currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('workspace-currency-changed', handleCurrencyChange);
  }, [workspace]);

  if (!invoice) {
    return (
      <AppShell>
        <div className="text-center py-20 space-y-4">
          <p className="text-sm font-semibold text-slate-500">Invoice not found or loading...</p>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6254E8] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to All Invoices</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const currency = invoice.currency || workspace?.currency || 'USD';

  // Handle Recording Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      toast.warning('Please enter a payment amount greater than zero.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await invoiceRepo.recordPayment(invoice.id, {
        amount: paymentAmount,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference,
        note: paymentNote
      });

      if (updated) {
        setInvoice(updated);
        setIsPaymentModalOpen(false);
        toast.success(`Payment of ${formatCurrency(paymentAmount, currency)} recorded successfully!`);

        if (updated.status === 'paid') {
          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Issue Draft Invoice
  const handleIssueDraftInvoice = async () => {
    if (!invoice) return;
    setIsSubmitting(true);
    try {
      const issued = await invoiceRepo.issueInvoice(invoice.id);
      if (issued) {
        setInvoice(issued);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        toast.success(`Invoice ${issued.invoiceNumber} officially issued!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to issue invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate Invoice
  const handleDuplicate = async () => {
    if (confirm('Create a duplicate copy of this invoice as a new draft?')) {
      const dup = await invoiceRepo.duplicateInvoice(invoice.id);
      if (dup) {
        router.push(`/invoices/${dup.id}`);
      }
    }
  };

  // Sender handlers
  const handleSaveSenderInvoiceOnly = async (updatedSender: InvoiceSender) => {
    if (!invoice) return;
    if (invoice.status !== 'draft') {
      const confirmDup = confirm(
        'This invoice has already been issued and its financial record is locked. Would you like to create a new draft invoice with this updated sender information?'
      );
      if (confirmDup) {
        const duplicated = await invoiceRepo.duplicateInvoice(invoice.id);
        if (duplicated) {
          const updatedDraft = { ...duplicated, sender: updatedSender };
          await invoiceRepo.saveInvoice(updatedDraft);
          router.push(`/invoices/${duplicated.id}`);
        }
      }
      return;
    }

    const updated = { ...invoice, sender: updatedSender };
    await invoiceRepo.saveInvoice(updated);
    setInvoice(updated);
  };

  const handleSaveSenderAsDefault = async (updatedSender: InvoiceSender) => {
    if (workspace) {
      const updatedWs: Workspace = {
        ...workspace,
        name: updatedSender.name,
        email: updatedSender.email,
        phone: updatedSender.phone || '',
        website: updatedSender.website || '',
        taxId: updatedSender.taxId || '',
        address: { ...updatedSender.address }
      };
      await workspaceRepo.saveWorkspace(updatedWs);
      setWorkspace(updatedWs);
      window.dispatchEvent(new CustomEvent('workspace-updated', { detail: updatedWs }));
    }

    // If current invoice is draft, also update this draft
    if (invoice && invoice.status === 'draft') {
      const updated = { ...invoice, sender: updatedSender };
      await invoiceRepo.saveInvoice(updated);
      setInvoice(updated);
    }
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!invoice || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await exportInvoiceToPdf('invoice-detail-render-target', `${invoice.invoiceNumber}.pdf`, invoice.pageFormat);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Unable to generate PDF directly. Please use the Print button to print or save as PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paid</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Partially Paid</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Overdue</span>
          </span>
        );
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6254E8] bg-[#D9D4FF]/30 border border-[#D9D4FF] px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[#6254E8]" />
            <span>Issued / Awaiting Payment</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E6E8F0]">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-[#171B32] tracking-tight">{invoice.invoiceNumber}</h1>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Issued to {invoice.customer.name} on {formatDate(invoice.issueDate, workspace?.dateFormat)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {invoice.status === 'draft' && (
              <button
                type="button"
                onClick={handleIssueDraftInvoice}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Issue Invoice</span>
              </button>
            )}

            {invoice.balanceDue > 0 && invoice.status !== 'draft' && (
              <button
                type="button"
                onClick={() => {
                  setPaymentAmount(invoice.balanceDue);
                  setIsPaymentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6254E8]" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={triggerBrowserPrint}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicate}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSenderModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-2xs"
              title="Edit sender business details"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Sender Details</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Left Document, Right Payment History & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Document Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-white p-3 sm:p-6 rounded-2xl border border-[#E6E8F0] shadow-sm">
            {/* Mobile Swipe Hint */}
            <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-400 pb-2 px-1">
              <span className="font-semibold text-slate-600">Document Preview</span>
              <span className="italic">← Scroll horizontally on phone →</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs bg-slate-50">
              <div className="min-w-[620px] sm:min-w-0">
                <InvoiceTemplateRenderer
                  invoice={invoice}
                  workspace={workspace}
                  targetId="invoice-detail-render-target"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Details & Payment Log (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Balance Due Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Financial Balance</p>
              <div>
                <p className="text-xs text-slate-500">Remaining Balance Due</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {formatCurrency(invoice.balanceDue, currency)}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Total:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(invoice.total, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount Received:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(invoice.amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due Date:</span>
                  <span className="font-medium text-slate-800">{formatDate(invoice.dueDate, workspace?.dateFormat)}</span>
                </div>
              </div>

              {invoice.balanceDue > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(invoice.balanceDue);
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              )}
            </div>

            {/* Payment History Log */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#171B32]">Payment History</h3>
                <span className="text-xs text-slate-400 font-bold">
                  {invoice.payments?.length || 0} recorded
                </span>
              </div>

              {(!invoice.payments || invoice.payments.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-2">No payments have been recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-700">{formatCurrency(p.amount, currency)}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(p.date, workspace?.dateFormat)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 capitalize">Method: {p.method.replace('_', ' ')}</p>
                      {p.reference && <p className="text-[10px] text-slate-500 font-mono">Ref: {p.reference}</p>}
                      {p.note && <p className="text-[11px] text-slate-500 italic mt-0.5">{p.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recipient Quick Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-2 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer Details</p>
              <p className="font-bold text-slate-900 text-sm">{invoice.customer.name}</p>
              {invoice.customer.companyName && <p className="text-slate-600 font-medium">{invoice.customer.companyName}</p>}
              {invoice.customer.email && <p className="text-slate-500">{invoice.customer.email}</p>}
              {invoice.customer.phone && <p className="text-slate-500">{invoice.customer.phone}</p>}
            </div>

          </div>

        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Invoice Payment</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Amount ({currency}) *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={invoice.balanceDue}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date Received</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 capitalize"
                  >
                    <option value="bank_transfer">Bank Transfer / Wire</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. WIRE-88910-A"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit milestone settled"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Phase 2: Sender Details Modal */}
      {invoice && (
        <SenderEditorModal
          isOpen={isSenderModalOpen}
          onClose={() => setIsSenderModalOpen(false)}
          initialSender={
            invoice.sender || {
              name: workspace?.name || '',
              email: workspace?.email || '',
              phone: workspace?.phone || '',
              website: workspace?.website || '',
              taxId: workspace?.taxId || '',
              address: workspace?.address || {
                line1: '',
                line2: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
              }
            }
          }
          workspace={workspace}
          onSaveInvoiceOnly={handleSaveSenderInvoiceOnly}
          onSaveAsDefault={handleSaveSenderAsDefault}
        />
      )}
    </AppShell>
  );
}
