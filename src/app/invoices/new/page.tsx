'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { brandRepo } from '@/repositories/brand.repo';
import { customerRepo } from '@/repositories/customer.repo';
import { productRepo } from '@/repositories/product.repo';
import { invoiceRepo } from '@/repositories/invoice.repo';
import { calculateInvoiceTotals, formatCurrency, toDecimal, roundTo2Decimals } from '@/lib/calculations/engine';
import { exportInvoiceToPdf, triggerBrowserPrint } from '@/lib/export/pdf';
import { InvoiceTemplateRenderer } from '@/components/invoices/templates/InvoiceTemplateRenderer';
import { AIInstructionModal } from '@/components/invoices/AIInstructionModal';
import { Workspace } from '@/types/workspace';
import { BrandKit, DEFAULT_BRAND_KIT, TemplateId } from '@/types/brand';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { Invoice, InvoiceItem, InvoiceSender, DiscountType, TaxType, PageFormat } from '@/types/invoice';
import { SenderEditorModal } from '@/components/invoices/SenderEditorModal';
import { ExtractedInvoiceData } from '@/types/ai';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Save,
  Send,
  Download,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  Eye,
  Sliders,
  Users,
  Package,
  Layers,
  CreditCard,
  FileCheck,
  Loader2,
  Building2,
  MapPin,
  Edit3,
  ArrowRight
} from 'lucide-react';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'adjustments' | 'payment' | 'style'>('items');

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [title, setTitle] = useState('Invoice');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pageFormat, setPageFormat] = useState<PageFormat>('a4');
  const [currency, setCurrency] = useState('USD');

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [customerTaxId, setCustomerTaxId] = useState('');

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item_init_1',
      description: 'Consulting & Creative Direction',
      quantity: 1,
      unitPrice: 1500,
      amount: 1500
    }
  ]);

  // Adjustments
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxType, setTaxType] = useState<TaxType>('percentage');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);

  // Notes & Payment instructions
  const [notes, setNotes] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // Template override
  const [templateId, setTemplateId] = useState<TemplateId>('corporate');

  // Sender / Business Information override
  const [sender, setSender] = useState<InvoiceSender>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    taxId: ''
  });
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const ws = await workspaceRepo.getActiveWorkspace();
      if (ws) {
        setWorkspace(ws);
        setCurrency(ws.currency);
        setInvoiceNumber(`${ws.invoiceNumberPrefix}${ws.invoiceNumberNext}`);
        setPaymentInstructions(ws.paymentInstructions || '');
        setSender({
          name: ws.name,
          email: ws.email,
          phone: ws.phone || '',
          website: ws.website || '',
          address: { ...ws.address },
          taxId: ws.taxId || ''
        });
        // Set date defaults client-side to avoid Next.js 16 prerender error
        const todayStr = new Date().toISOString().split('T')[0];
        const in14Days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        setIssueDate((prev) => prev || todayStr);
        setDueDate((prev) => prev || in14Days);

        const bk = await brandRepo.getBrandKit(ws.id);
        if (bk) {
          setBrandKit(bk);
          setTemplateId(bk.templateId || 'corporate');
          if (bk.defaultPaymentInstructions && !ws.paymentInstructions) {
            setPaymentInstructions(bk.defaultPaymentInstructions);
          }
        }

        const custs = await customerRepo.getCustomers(ws.id);
        setCustomers(custs);

        const prods = await productRepo.getProducts(ws.id);
        setProducts(prods);
      }
    }
    loadData();

    const handleCurrencyChange = (e: any) => {
      if (e.detail) {
        setCurrency(e.detail);
      }
    };
    window.addEventListener('workspace-currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('workspace-currency-changed', handleCurrencyChange);
  }, []);

  // Update customer when dropdown selection changes
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email);
      setCustomerCompany(found.companyName || '');
      setCustomerPhone(found.phone || '');
      setCustomerAddress({
        line1: found.address?.line1 || '',
        line2: found.address?.line2 || '',
        city: found.address?.city || '',
        state: found.address?.state || '',
        postalCode: found.address?.postalCode || '',
        country: found.address?.country || ''
      });
      setCustomerTaxId(found.taxId || '');
    }
  };

  // Add line item
  const handleAddItem = (product?: Product) => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: product?.id,
      description: product ? product.name : 'New Item / Service',
      quantity: 1,
      unitPrice: product ? product.unitPrice : 0,
      amount: product ? product.unitPrice : 0
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };
      // Use decimal-safe arithmetic for line total
      const amount = roundTo2Decimals(
        toDecimal(current.quantity).times(toDecimal(current.unitPrice))
      );
      current.amount = amount;
      next[index] = current;
      return next;
    });
  };

  const handleDuplicateItem = (index: number) => {
    setItems((prev) => {
      const target = prev[index];
      const dup: InvoiceItem = {
        ...target,
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      };
      const copy = [...prev];
      copy.splice(index + 1, 0, dup);
      return copy;
    });
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      alert('An invoice must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Apply natural language AI parsed data
  const handleApplyAIData = (data: ExtractedInvoiceData) => {
    if (data.customerName) setCustomerName(data.customerName);
    if (data.customerEmail) setCustomerEmail(data.customerEmail);
    if (data.currency) setCurrency(data.currency);
    if (data.deliveryCharge !== undefined) setDeliveryCharge(data.deliveryCharge);
    if (data.discountValue !== undefined) {
      setDiscountValue(data.discountValue);
      setDiscountType(data.discountType || 'fixed');
    }
    if (data.items.length > 0) {
      const newItems: InvoiceItem[] = data.items.map((it, idx) => ({
        id: `item_ai_${Date.now()}_${idx}`,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: Math.round(it.quantity * it.unitPrice * 100) / 100
      }));
      setItems(newItems);
    }
  };

  // Real-time calculation engine totals
  const calc = calculateInvoiceTotals({
    items,
    discountType,
    discountValue,
    taxType,
    taxRate,
    deliveryCharge,
    payments: [],
    dueDate,
    currentStatus: 'draft'
  });

  // Current live invoice object for preview
  const previewInvoice: Invoice = {
    id: 'live_editor_preview',
    workspaceId: workspace?.id || 'ws_current',
    invoiceNumber: invoiceNumber || 'INV-0000',
    title,
    status: 'draft',
    issueDate,
    dueDate,
    sender: sender.name ? sender : undefined,
    customerId: selectedCustomerId || undefined,
    customer: {
      name: customerName || 'Client Name',
      email: customerEmail,
      companyName: customerCompany,
      phone: customerPhone,
      address: customerAddress,
      taxId: customerTaxId
    },
    items,
    discountType,
    discountValue,
    taxType,
    taxRate,
    deliveryCharge,
    subtotal: calc.subtotal,
    discountTotal: calc.discountTotal,
    taxTotal: calc.taxTotal,
    total: calc.total,
    amountPaid: 0,
    balanceDue: calc.total,
    currency,
    notes,
    paymentInstructions,
    brandKitSnapshot: {
      ...(brandKit || {
        ...DEFAULT_BRAND_KIT,
        id: 'bk_default',
        workspaceId: workspace?.id || 'ws_default'
      }),
      templateId
    },
    payments: [],
    pageFormat,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  // Sender / Business Information Handlers
  const handleSaveSenderInvoiceOnly = (updatedSender: InvoiceSender) => {
    setSender(updatedSender);
  };

  const handleSaveSenderAsDefault = async (updatedSender: InvoiceSender) => {
    setSender(updatedSender);
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
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!customerName.trim()) {
      alert('Please provide a client name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const inv = await invoiceRepo.createInvoice({
        ...previewInvoice,
        status: 'draft'
      });
      router.push(`/invoices/${inv.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save draft invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Issue Invoice
  const handleIssueInvoice = async () => {
    if (!customerName.trim()) {
      alert('Please specify the recipient/client name before issuing.');
      return;
    }
    setIsSubmitting(true);
    try {
      const inv = await invoiceRepo.createInvoice({
        ...previewInvoice,
        status: 'issued'
      });

      // Celebration effect!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      router.push(`/invoices/${inv.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to issue invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await exportInvoiceToPdf('invoice-editor-render-target', `${invoiceNumber || 'invoice'}.pdf`, pageFormat);
    } catch (err) {
      console.error(err);
      alert('Unable to generate PDF directly. Please try printing to PDF using the Print button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all fields? Unsaved changes will be lost.')) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerCompany('');
      setItems([{
        id: `item_${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }]);
      setDiscountValue(0);
      setTaxRate(0);
      setDeliveryCharge(0);
      setNotes('');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E6E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Create Invoice</h1>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {invoiceNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Build your invoice with real-time preview, automatic math, and branded templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Natural Language AI Assistant Button */}
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Prompt Creator</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6254E8]" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF</span>
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
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleIssueInvoice}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-[#6254E8]/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Issue Invoice</span>
            </button>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: EDITING PANEL (6 cols) */}
          <div className="lg:col-span-6 space-y-6">

            {/* MANDATORY PHASE 2: VISIBLE SENDER & RECIPIENT SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FROM — Sender / Business Details */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 hover:border-[#6254E8]/50 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#6254E8]" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#6254E8]">FROM (SENDER)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSenderModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6254E8] bg-[#6254E8]/10 hover:bg-[#6254E8]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Sender Details</span>
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-900 truncate">
                    {sender.name || workspace?.name || 'Your Business Name'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {sender.address?.line1 || workspace?.address.line1 || 'No street address set'}
                    {(sender.address?.line2 || workspace?.address.line2) ? `, ${sender.address?.line2 || workspace?.address.line2}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[
                      sender.address?.city || workspace?.address.city,
                      sender.address?.state || workspace?.address.state,
                      sender.address?.postalCode || workspace?.address.postalCode,
                      sender.address?.country || workspace?.address.country
                    ].filter(Boolean).join(', ') || 'City, Country'}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                    {(sender.email || workspace?.email) && <p>Email: {sender.email || workspace?.email}</p>}
                    {(sender.phone || workspace?.phone) && <p>Phone: {sender.phone || workspace?.phone}</p>}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Sender on invoice</span>
                  <button
                    type="button"
                    onClick={() => setIsSenderModalOpen(true)}
                    className="text-xs font-semibold text-[#6254E8] hover:underline"
                  >
                    Change sender &rarr;
                  </button>
                </div>
              </div>

              {/* BILL TO — Customer / Client Details */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">BILL TO (CLIENT)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>Edit Client</span>
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-900 truncate">
                    {customerName || 'No Client Selected'}
                  </p>
                  {customerCompany && (
                    <p className="text-xs font-medium text-slate-600 mt-0.5">{customerCompany}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {customerAddress.line1 || 'No street address entered'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[customerAddress.city, customerAddress.country].filter(Boolean).join(', ') || 'City, Country'}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                    {customerEmail && <p>Email: {customerEmail}</p>}
                    {customerPhone && <p>Phone: {customerPhone}</p>}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Billed recipient</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    Select from contacts &rarr;
                  </button>
                </div>
              </div>
            </div>
            
            {/* Editor Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1 overflow-x-auto">
              {[
                { id: 'items', label: 'Items & Products', icon: Package },
                { id: 'details', label: 'Client & Info', icon: Users },
                { id: 'adjustments', label: 'Tax & Discounts', icon: Sliders },
                { id: 'payment', label: 'Terms & Notes', icon: CreditCard },
                { id: 'style', label: 'Style & Template', icon: Layers },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#6254E8] shadow-xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: LINE ITEMS */}
            {activeTab === 'items' && (
              <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#171B32]">Invoice Line Items</h3>
                    <p className="text-[11px] text-slate-500">Add services or select from your product catalog.</p>
                  </div>

                  {/* Quick Select from Saved Catalog */}
                  {products.length > 0 && (
                    <select
                      onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        if (prod) handleAddItem(prod);
                        e.target.value = '';
                      }}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                    >
                      <option value="">+ Add From Catalog</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.unitPrice, currency)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 relative group hover:bg-white hover:border-[#6254E8]/50 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Item #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateItem(idx)}
                            className="p-1 text-slate-400 hover:text-[#6254E8]"
                            title="Duplicate line item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Description Input */}
                      <input
                        type="text"
                        value={item.description}
                        placeholder="Description of product, service, or milestone"
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-[#6254E8]"
                      />

                      {/* Qty, Price, Amount Grid */}
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                          />
                        </div>

                        <div className="col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit Price</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                          />
                        </div>

                        <div className="col-span-4 text-right">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Line Total</label>
                          <p className="text-xs font-bold text-slate-900 pt-1.5">
                            {formatCurrency(item.amount, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="w-full py-2.5 border border-dashed border-[#6254E8]/40 hover:border-[#6254E8] bg-[#D9D4FF]/10 hover:bg-[#D9D4FF]/20 text-[#6254E8] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line Item</span>
                </button>
              </div>
            )}

            {/* TAB 2: CLIENT & INVOICE DETAILS */}
            {activeTab === 'details' && (
              <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-5">
                {/* Client Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#171B32]">Client Information</h3>
                    {customers.length > 0 && (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => handleSelectCustomer(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
                      >
                        <option value="">Select Saved Client</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.companyName ? `(${c.companyName})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Client Name *</label>
                      <input
                        type="text"
                        value={customerName}
                        placeholder="e.g. Almas Rahman"
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={customerCompany}
                        placeholder="e.g. Apex Ventures"
                        onChange={(e) => setCustomerCompany(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Client Email</label>
                      <input
                        type="email"
                        value={customerEmail}
                        placeholder="client@company.com"
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={customerPhone}
                        placeholder="+1 (555) 000-0000"
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Address Line</label>
                      <input
                        type="text"
                        value={customerAddress.line1}
                        placeholder="Street Address"
                        onChange={(e) => setCustomerAddress({ ...customerAddress, line1: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">City / Country</label>
                      <input
                        type="text"
                        value={customerAddress.city}
                        placeholder="San Francisco, US"
                        onChange={(e) => setCustomerAddress({ ...customerAddress, city: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates & Numbers */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-sm font-bold text-[#171B32]">Invoice Identification & Dates</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Invoice Number</label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Invoice Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 font-bold"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="PKR">PKR (Rs.)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD (CA$)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="AED">AED (AED)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TAXES & DISCOUNTS */}
            {activeTab === 'adjustments' && (
              <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#171B32]">Discounts, Taxes & Delivery Charges</h3>

                {/* Discount */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Discount</label>
                    <div className="flex gap-2">
                      {(['none', 'percentage', 'fixed'] as DiscountType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDiscountType(t)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize ${
                            discountType === t
                              ? 'bg-[#6254E8] text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {discountType !== 'none' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder={discountType === 'percentage' ? 'Percentage %' : 'Amount'}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                      <span className="text-xs font-bold text-slate-500">
                        {discountType === 'percentage' ? '%' : currency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tax */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Tax / VAT / GST Rate</label>
                    <span className="text-[11px] text-slate-500">Applied on discounted subtotal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 8.5"
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* Delivery */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Delivery / Shipping Charges</label>
                    <span className="text-[11px] text-slate-500">Fixed courier or handling fee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 400"
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-500">{currency}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENT TERMS & NOTES */}
            {activeTab === 'payment' && (
              <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#171B32]">Payment Instructions & Notes</h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Bank Transfer / Wire Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Enter bank wire details, IBAN, Swift code, or PayPal link..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Client Notes & Thank You Message
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Deliverables were verified. Thank you for your continued partnership!"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: STYLE & TEMPLATES */}
            {activeTab === 'style' && (
              <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-[#171B32]">Template & Page Format</h3>

                {/* Template Selection */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'corporate', name: 'Corporate', desc: 'Structured table hierarchy' },
                    { id: 'minimal', name: 'Minimal', desc: 'Spacious clean typography' },
                    { id: 'elegant', name: 'Elegant', desc: 'Luxury boutique serif styling' },
                    { id: 'creative', name: 'Creative', desc: 'Bold asymmetric layout' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id as TemplateId)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                        templateId === tpl.id
                          ? 'border-[#6254E8] bg-[#D9D4FF]/20 shadow-xs'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <p className={`text-xs font-bold ${templateId === tpl.id ? 'text-[#6254E8]' : 'text-slate-800'}`}>
                        {tpl.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tpl.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Page Format */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Document Size:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPageFormat('a4')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                        pageFormat === 'a4' ? 'bg-[#6254E8] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      A4 (210 × 297 mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageFormat('letter')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                        pageFormat === 'letter' ? 'bg-[#6254E8] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      US Letter (8.5 × 11 in)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Summary Card in Editor Panel */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calculated Total</p>
                <p className="text-xl font-black text-white">{formatCurrency(calc.total, currency)}</p>
              </div>
              <div className="text-right text-xs space-y-0.5 text-slate-300">
                <p>Subtotal: {formatCurrency(calc.subtotal, currency)}</p>
                {calc.discountTotal > 0 && <p className="text-emerald-400">Discount: -{formatCurrency(calc.discountTotal, currency)}</p>}
                {calc.taxTotal > 0 && <p>Tax: +{formatCurrency(calc.taxTotal, currency)}</p>}
                {calc.deliveryCharge > 0 && <p>Delivery: +{formatCurrency(calc.deliveryCharge, currency)}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all fields</span>
            </button>
          </div>

          {/* RIGHT: REAL-TIME PREVIEW PANEL (6 cols) */}
          <div className="lg:col-span-6 sticky top-20">
            <div className="bg-white p-4 rounded-2xl border border-[#E6E8F0] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#6254E8]" />
                  <span className="text-xs font-bold text-slate-800">Live Invoice Document</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {templateId} • {pageFormat.toUpperCase()}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-400 pb-1 px-1">
                <span className="font-semibold text-slate-600">Live Preview</span>
                <span className="italic">← Scroll horizontally on phone →</span>
              </div>

              {/* Real-time Render Target */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs bg-slate-100 max-h-[820px] overflow-y-auto">
                <div className="min-w-[620px] sm:min-w-0">
                  <InvoiceTemplateRenderer
                    invoice={previewInvoice}
                    workspace={workspace}
                    targetId="invoice-editor-render-target"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Natural Language AI Modal */}
      <AIInstructionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApply={handleApplyAIData}
        defaultCurrency={currency}
      />

      {/* Mandatory Phase 2: Sender Details Modal */}
      <SenderEditorModal
        isOpen={isSenderModalOpen}
        onClose={() => setIsSenderModalOpen(false)}
        initialSender={sender}
        workspace={workspace}
        onSaveInvoiceOnly={handleSaveSenderInvoiceOnly}
        onSaveAsDefault={handleSaveSenderAsDefault}
      />
    </AppShell>
  );
}
