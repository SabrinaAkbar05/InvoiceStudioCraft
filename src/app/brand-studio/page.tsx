'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { brandRepo } from '@/repositories/brand.repo';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { extractColorsFromImage, calculateContrastRatio, ExtractedPalette, getDefaultExtractedPalette } from '@/lib/brand/color-extractor';
import { BrandKit, DEFAULT_BRAND_KIT, TemplateId } from '@/types/brand';
import { Workspace } from '@/types/workspace';
import { Invoice } from '@/types/invoice';
import { InvoiceTemplateRenderer } from '@/components/invoices/templates/InvoiceTemplateRenderer';
import { uploadToCloudinary } from '@/lib/cloudinary/client';
import { toast } from '@/components/ui/Toast';

import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  Sparkles,
  Check,
  RefreshCw,
  Palette,
  Type,
  FileCheck,
  Image as ImageIcon,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';

export default function BrandStudioPage() {
  const { user, activeWorkspaceId } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [extractedPalette, setExtractedPalette] = useState<ExtractedPalette | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Load active workspace and its brand kit
  const loadBrandStudioData = async () => {
    try {
      const ws = await workspaceRepo.getActiveWorkspace();
      if (ws) {
        setWorkspace(ws);
        const bk = await brandRepo.getBrandKit(ws.id);
        if (bk) {
          // Ensure brandKit is keyed to the current workspace
          const normalizedBk = {
            ...bk,
            workspaceId: ws.id
          };
          setBrandKit(normalizedBk);
          if (normalizedBk.logoDataUrl) {
            const palette = await extractColorsFromImage(normalizedBk.logoDataUrl);
            setExtractedPalette(palette);
          }
        }
      }
    } catch (err) {
      console.warn('[BrandStudio] Initialization warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrandStudioData();

    // Re-synchronize when workspace updates
    const handleWorkspaceUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      if (customEvent.detail) {
        setWorkspace(customEvent.detail);
        brandRepo.getBrandKit(customEvent.detail.id).then((bk) => {
          if (bk) setBrandKit(bk);
        });
      }
    };
    window.addEventListener('workspace-updated', handleWorkspaceUpdated);

    return () => {
      window.removeEventListener('workspace-updated', handleWorkspaceUpdated);
    };
  }, [user, activeWorkspaceId]);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg|webp|svg\+xml)/)) {
      toast.warning('Please upload a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Logo file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setIsExtracting(true);

      const palette = await extractColorsFromImage(dataUrl);
      setExtractedPalette(palette);

      setBrandKit((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          logoDataUrl: dataUrl,
          primaryColor: palette.primaryColor,
          secondaryColor: palette.secondaryColor,
          accentColor: palette.accentColor,
          neutralColor: palette.neutralColor
        };
      });

      setIsExtracting(false);
      toast.success('Logo uploaded and brand colors extracted successfully!');

      // Cloudinary cloud upload if workspace is active
      const activeWs = workspace || (await workspaceRepo.getActiveWorkspace());
      if (activeWs?.id && activeWs.id !== 'ws_current') {
        setIsUploadingLogo(true);
        try {
          const res = await uploadToCloudinary(file, activeWs.id, 'logos');
          setBrandKit((prev) => (prev ? { ...prev, logoUrl: res.secureUrl, logoCloudinaryId: res.publicId } : null));
          toast.success('Logo synced to cloud storage!');
        } catch (err) {
          console.warn('[Cloudinary] Logo cloud upload failed, using local fallback:', err);
          toast.info('Logo saved locally for this browser.');
        } finally {
          setIsUploadingLogo(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (file: File) => {
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      toast.warning('Signature file size must be under 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setBrandKit((prev) => (prev ? { ...prev, signatureDataUrl: dataUrl } : null));
      toast.success('Digital signature uploaded successfully!');

      // Cloudinary cloud upload if workspace is active
      const activeWs = workspace || (await workspaceRepo.getActiveWorkspace());
      if (activeWs?.id && activeWs.id !== 'ws_current') {
        setIsUploadingSignature(true);
        try {
          const res = await uploadToCloudinary(file, activeWs.id, 'signatures');
          setBrandKit((prev) =>
            prev ? { ...prev, signatureUrl: res.secureUrl, signatureCloudinaryId: res.publicId } : null
          );
          toast.success('Signature synced to cloud storage!');
        } catch (err) {
          console.warn('[Cloudinary] Signature cloud upload failed, using local fallback:', err);
          toast.info('Signature saved locally for this browser.');
        } finally {
          setIsUploadingSignature(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandKit = async () => {
    if (!brandKit || saveStatus === 'saving') return;

    // 1. Resolve and verify active workspace ID
    let currentWs = workspace;
    if (!currentWs || currentWs.id === 'ws_current') {
      currentWs = await workspaceRepo.getActiveWorkspace();
      if (currentWs) setWorkspace(currentWs);
    }

    const targetWsId = currentWs?.id;
    if (!targetWsId || targetWsId === 'ws_current') {
      setSaveStatus('error');
      setSaveErrorMessage('Workspace is still initializing. Please wait a moment.');
      toast.error('Workspace is not ready yet. Please wait a moment and try again.');
      return;
    }

    setSaveStatus('saving');
    setSaveErrorMessage(null);

    const kitToSave: BrandKit = {
      ...brandKit,
      workspaceId: targetWsId,
      id: brandKit.id && brandKit.id !== 'bk_ws_current' ? brandKit.id : `bk_${targetWsId}`
    };

    try {
      await brandRepo.saveBrandKit(kitToSave);
      setBrandKit(kitToSave);
      setSaveStatus('saved');
      toast.success('Brand Kit saved successfully!');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3500);
    } catch (err) {
      console.error('[BrandStudio] Save failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error occurred while saving';
      setSaveStatus('error');
      setSaveErrorMessage(msg);
      toast.error('Could not save Brand Kit to cloud. Click Retry to try again.');
    }
  };

  // Contrast calculation between brandKit.textColor and brandKit.backgroundColor
  const textContrast = brandKit
    ? calculateContrastRatio(brandKit.textColor, brandKit.backgroundColor)
    : { ratio: 21, score: 'Excellent', isNormalTextAA: true };

  // Contrast for primary color text against white card
  const primaryContrast = brandKit
    ? calculateContrastRatio(brandKit.primaryColor, '#FFFFFF')
    : { ratio: 4.5, score: 'Good', isNormalTextAA: true };

  // Mock invoice for live rendering
  const mockInvoice: Invoice = {
    id: 'mock_preview',
    workspaceId: workspace?.id || 'ws_preview',
    invoiceNumber: `${workspace?.invoiceNumberPrefix || 'INV-'}1001`,
    title: 'Design & Visual Strategy',
    status: 'issued',
    issueDate: '2024-01-15',
    dueDate: '2024-01-29',
    customer: {
      name: 'Aurora Creative Studio',
      email: 'billing@aurorastudio.com',
      companyName: 'Aurora Media Group',
      address: {
        line1: '450 Mission Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States'
      }
    },
    items: [
      {
        id: 'mock_1',
        description: 'Brand Identity Design & Visual System',
        quantity: 1,
        unitPrice: 3200,
        amount: 3200
      },
      {
        id: 'mock_2',
        description: 'Custom UI Component Library and Tokens',
        quantity: 1,
        unitPrice: 1800,
        amount: 1800
      }
    ],
    discountType: 'percentage',
    discountValue: 10,
    taxType: 'percentage',
    taxRate: 8.5,
    deliveryCharge: 0,
    subtotal: 5000,
    discountTotal: 500,
    taxTotal: 382.5,
    total: 4882.5,
    amountPaid: 1500,
    balanceDue: 3382.5,
    currency: workspace?.currency || 'USD',
    notes: 'Payment is due within 14 days of invoice receipt.',
    paymentInstructions: brandKit?.defaultPaymentInstructions || workspace?.paymentInstructions,
    brandKitSnapshot: brandKit || {
      ...DEFAULT_BRAND_KIT,
      id: 'bk_default',
      workspaceId: 'ws_default'
    },
    payments: [],
    pageFormat: 'a4',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  };

  const templates: Array<{ id: TemplateId; name: string; desc: string }> = [
    { id: 'corporate', name: 'Corporate', desc: 'Structured, formal table hierarchy for enterprises' },
    { id: 'minimal', name: 'Minimal', desc: 'Spacious, clean modern typography' },
    { id: 'elegant', name: 'Elegant', desc: 'Luxury serif styling for boutiques & consultants' },
    { id: 'creative', name: 'Creative', desc: 'Bold asymmetric layout for digital studios' },
  ];

  const fonts = [
    { name: 'Inter (Clean & Modern)', value: 'Inter, sans-serif' },
    { name: 'Plus Jakarta Sans (Crisp SaaS)', value: 'Plus Jakarta Sans, sans-serif' },
    { name: 'Playfair Display (Luxury Serif)', value: 'Playfair Display, Georgia, serif' },
    { name: 'Space Grotesk (Tech & Studio)', value: 'Space Grotesk, sans-serif' },
    { name: 'System Sans', value: 'system-ui, -apple-system, sans-serif' },
  ];

  if (isLoading || !brandKit) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="flex justify-between items-center pb-6 border-b border-[#E6E8F0]">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-72 bg-slate-100 rounded" />
            </div>
            <div className="h-10 w-36 bg-slate-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="h-44 bg-white rounded-2xl border border-slate-200 p-6" />
              <div className="h-64 bg-white rounded-2xl border border-slate-200 p-6" />
            </div>
            <div className="lg:col-span-7 h-[600px] bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E6E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Brand Studio</h1>
              <span className="bg-[#D9D4FF]/40 text-[#6254E8] text-xs font-bold px-2.5 py-0.5 rounded-full">
                Auto Color Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload your company logo. We automatically extract your brand colors, check contrast compliance, and style your invoices.
            </p>
          </div>

          <button
            onClick={handleSaveBrandKit}
            disabled={saveStatus === 'saving'}
            className={`inline-flex items-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : saveStatus === 'error'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                : saveStatus === 'saving'
                ? 'bg-[#6254E8]/80 text-white cursor-wait'
                : 'bg-[#6254E8] hover:bg-[#5244d4] text-white shadow-[#6254E8]/20'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving…</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Brand Kit saved successfully</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <RotateCcw className="w-4 h-4 text-white" />
                <span>Couldn&apos;t save Brand Kit — Retry</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Save Brand Kit</span>
              </>
            )}
          </button>
        </div>

        {saveStatus === 'error' && saveErrorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Brand Kit Cloud Sync Issue</p>
                <p className="text-rose-700 mt-0.5">{saveErrorMessage}</p>
                <p className="text-slate-500 text-[11px] mt-1">
                  💡 Note: Your brand kit changes are safely stored in your browser storage. If cloud permissions are pending, clicking &quot;Sync to Cloud&quot; on the banner above or re-logging in will link your cloud workspace.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setSaveStatus('idle'); setSaveErrorMessage(null); }}
              className="text-rose-500 hover:text-rose-800 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Studio Grid: Left Controls, Right Real-Time Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTROLS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Logo Upload Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#6254E8]" />
                  <h3 className="text-sm font-bold text-[#171B32]">Business Logo</h3>
                </div>
                {brandKit.logoDataUrl && (
                  <button
                    onClick={() => setBrandKit({ ...brandKit, logoDataUrl: undefined })}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Upload Zone */}
              <div
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleLogoUpload(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-[#E6E8F0] hover:border-[#6254E8] rounded-xl p-6 text-center cursor-pointer transition-all bg-[#F8F9FC] hover:bg-white group"
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                />

                {brandKit.logoDataUrl ? (
                  <div className="space-y-3">
                    <img
                      src={brandKit.logoDataUrl}
                      alt="Brand Logo"
                      className="max-h-20 max-w-[200px] object-contain mx-auto"
                    />
                    <p className="text-[11px] text-slate-500 font-medium">Click or drag new logo to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#D9D4FF]/40 text-[#6254E8] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-[#171B32]">Drop your logo here, or browse</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP up to 5MB</p>
                  </div>
                )}
              </div>

              {isExtracting && (
                <div className="flex items-center gap-2 text-xs text-[#6254E8] font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting brand palette and checking contrast...</span>
                </div>
              )}

              {isUploadingLogo && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing logo to secure cloud storage...</span>
                </div>
              )}
            </div>

            {/* Extracted Swatches & Color Customizer */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#6254E8]" />
                  <h3 className="text-sm font-bold text-[#171B32]">Brand Palette</h3>
                </div>
                {extractedPalette && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Extracted</span>
                  </span>
                )}
              </div>

              {/* Swatch Suggestions if extracted */}
              {extractedPalette?.swatches && extractedPalette.swatches.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Detected Swatches</p>
                  <div className="flex flex-wrap gap-2">
                    {extractedPalette.swatches.map((swatch, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBrandKit({ ...brandKit, primaryColor: swatch })}
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-xs hover:scale-110 transition-transform relative group"
                        style={{ backgroundColor: swatch }}
                        title={`Set ${swatch} as primary color`}
                      >
                        {brandKit.primaryColor === swatch && (
                          <Check className="w-4 h-4 text-white mx-auto drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandKit.primaryColor}
                      onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={brandKit.primaryColor}
                      onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 uppercase text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandKit.secondaryColor}
                      onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={brandKit.secondaryColor}
                      onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 uppercase text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Contrast Compliance Indicator */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">WCAG Contrast Assessment:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    primaryContrast.isNormalTextAA
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {primaryContrast.ratio}:1 ({primaryContrast.score})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {primaryContrast.isNormalTextAA
                    ? '✓ Meets accessibility guidelines for sharp, readable invoice text.'
                    : '⚠ Contrast ratio is slightly low. Consider a darker tone for maximum print clarity.'}
                </p>
              </div>
            </div>

            {/* Template Selector */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#171B32]">Invoice Template Family</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((tpl) => {
                  const selected = brandKit.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setBrandKit({ ...brandKit, templateId: tpl.id })}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-[#6254E8] bg-[#D9D4FF]/20 shadow-xs'
                          : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${selected ? 'text-[#6254E8]' : 'text-slate-800'}`}>
                          {tpl.name}
                        </p>
                        {selected && <Check className="w-3.5 h-3.5 text-[#6254E8]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{tpl.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography Selection */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[#6254E8]" />
                <h3 className="text-sm font-bold text-[#171B32]">Invoice Typography</h3>
              </div>
              <select
                value={brandKit.fontBody}
                onChange={(e) => setBrandKit({ ...brandKit, fontBody: e.target.value, fontHeading: e.target.value })}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-[#6254E8]"
              >
                {fonts.map((f) => (
                  <option key={f.value} value={f.value}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Signature Upload & Tagline Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E8F0] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#171B32]">Signature & Messaging</h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Business Tagline
                </label>
                <input
                  type="text"
                  value={brandKit.tagline || ''}
                  placeholder="e.g. Creative Direction & Architecture"
                  onChange={(e) => setBrandKit({ ...brandKit, tagline: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#6254E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Thank You Note
                </label>
                <input
                  type="text"
                  value={brandKit.thankYouNote || ''}
                  placeholder="e.g. Thank you for your partnership!"
                  onChange={(e) => setBrandKit({ ...brandKit, thankYouNote: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#6254E8]"
                />
              </div>

              {/* Signature Upload */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Authorized Signature (PNG / JPG)
                  </label>
                  {brandKit.signatureDataUrl && (
                    <button
                      onClick={() => setBrandKit({ ...brandKit, signatureDataUrl: undefined })}
                      className="text-[10px] text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div
                  onClick={() => signatureInputRef.current?.click()}
                  className="border border-dashed border-slate-200 hover:border-[#6254E8] rounded-xl p-3 text-center cursor-pointer bg-slate-50 hover:bg-white transition-colors"
                >
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleSignatureUpload(e.target.files[0])}
                  />
                  {brandKit.signatureDataUrl ? (
                    <img src={brandKit.signatureDataUrl} alt="Signature" className="max-h-12 max-w-[150px] mx-auto object-contain" />
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium">Click to upload signature scan</p>
                  )}
                </div>

                {isUploadingSignature && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse mt-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing signature to cloud storage...</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <input
                    type="text"
                    value={brandKit.signatureName || ''}
                    placeholder="Signer Name"
                    onChange={(e) => setBrandKit({ ...brandKit, signatureName: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                  <input
                    type="text"
                    value={brandKit.signatureTitle || ''}
                    placeholder="Signer Title"
                    onChange={(e) => setBrandKit({ ...brandKit, signatureTitle: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PREVIEW (7 cols) */}
          <div className="lg:col-span-7 sticky top-20">
            <div className="bg-white p-4 rounded-2xl border border-[#E6E8F0] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">Live Brand Kit Preview</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 capitalize">
                  {brandKit.templateId} Template
                </span>
              </div>

              {/* Live Render Container */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-100 max-h-[800px] overflow-y-auto">
                <InvoiceTemplateRenderer
                  invoice={mockInvoice}
                  workspace={workspace}
                  targetId="brand-studio-preview"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
