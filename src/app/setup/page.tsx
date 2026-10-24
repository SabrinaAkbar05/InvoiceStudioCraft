'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { workspaceRepo } from '@/repositories/workspace.repo';
import { brandRepo } from '@/repositories/brand.repo';
import { extractColorsFromImage } from '@/lib/brand/color-extractor';
import { SUPPORTED_CURRENCIES } from '@/types/workspace';
import { toast } from '@/components/ui/Toast';
import {
  Sparkles,
  Building,
  Upload,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Palette
} from 'lucide-react';

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Business Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [taxId, setTaxId] = useState('');

  // Step 2: Financial Defaults
  const [currency, setCurrency] = useState('USD');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [paymentTerms, setPaymentTerms] = useState(14);
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // Step 3: Brand Logo & Signature
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [primaryColor, setPrimaryColor] = useState('#6254E8');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(undefined);
  const [signatureName, setSignatureName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setLogoDataUrl(dataUrl);
      const palette = await extractColorsFromImage(dataUrl);
      setPrimaryColor(palette.primaryColor);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteSetup = async () => {
    if (!name.trim() || !email.trim()) {
      toast.warning('Please provide your business name and billing email.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const ws = await workspaceRepo.createWorkspace({
        name,
        email,
        phone,
        website,
        address: {
          line1: line1 || 'Primary Office',
          city: city || 'City',
          country: country || 'United States'
        },
        taxId,
        currency,
        dateFormat: 'YYYY-MM-DD',
        invoiceNumberPrefix: invoicePrefix || 'INV-',
        invoiceNumberNext: 1001,
        defaultPaymentTermsDays: paymentTerms,
        paymentInstructions: paymentInstructions || 'Payment is due within invoice terms. Electronic wire preferred.'
      });

      // Update brand kit
      const bk = await brandRepo.getBrandKit(ws.id);
      if (bk) {
        await brandRepo.saveBrandKit({
          ...bk,
          logoDataUrl,
          primaryColor,
          signatureDataUrl,
          signatureName,
          defaultPaymentInstructions: paymentInstructions
        });
      }

      toast.success('Workspace configured successfully!');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#171B32] py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Logo and Progress Stepper */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#6254E8] text-white flex items-center justify-center shadow-md shadow-[#6254E8]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-[#171B32] tracking-tight">InvoiceCraft Studio</span>
          </Link>
          <h1 className="text-2xl font-black text-[#171B32] tracking-tight">Set Up Your Business Workspace</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your local business profile. All records will be saved directly in your browser.
          </p>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {[
              { num: 1, title: 'Profile' },
              { num: 2, title: 'Finance' },
              { num: 3, title: 'Branding' }
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num
                      ? 'bg-[#6254E8] text-white shadow-xs'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className={`text-xs font-medium ${step === s.num ? 'text-[#171B32] font-bold' : 'text-slate-400'}`}>
                  {s.title}
                </span>
                {s.num < 3 && <div className="w-6 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Cards */}
        <div className="bg-white p-8 rounded-2xl border border-[#E6E8F0] shadow-sm space-y-6">
          
          {/* STEP 1: BUSINESS PROFILE */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-[#6254E8]" />
                <h3 className="text-sm font-bold text-slate-900">Step 1: Business Information</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Design Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Email *</label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="billing@acmestudio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+1 (555) 234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website URL (Optional)</label>
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://acmestudio.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax ID / EIN</label>
                  <input
                    type="text"
                    placeholder="US-EIN-98-7654321"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    autoComplete="street-address"
                    placeholder="742 Evergreen Terrace"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    placeholder="San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-[#6254E8]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim() || !email.trim()) {
                      toast.warning('Please provide your business name and billing email.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <span>Continue to Finance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FINANCIAL DEFAULTS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-[#6254E8]" />
                <h3 className="text-sm font-bold text-slate-900">Step 2: Currency & Payment Defaults</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Payment Terms (Days)</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 14)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                >
                  <option value={7}>Due in 7 days (Net 7)</option>
                  <option value={14}>Due in 14 days (Net 14)</option>
                  <option value={30}>Due in 30 days (Net 30)</option>
                  <option value={60}>Due in 60 days (Net 60)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank / Wire Instructions
                </label>
                <textarea
                  rows={3}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="e.g. Wire transfer details, IBAN, SWIFT or PayPal email..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <span>Continue to Branding</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BRANDING & FINISH */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Palette className="w-4 h-4 text-[#6254E8]" />
                <h3 className="text-sm font-bold text-slate-900">Step 3: Logo & Brand Kit</h3>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Logo (Optional)</label>
                <div
                  onClick={() => logoRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#6254E8] p-5 rounded-xl text-center cursor-pointer bg-slate-50 transition-colors"
                >
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  {logoDataUrl ? (
                    <img src={logoDataUrl} alt="Logo preview" className="max-h-16 mx-auto object-contain" />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Click to upload brand logo</p>
                      <p className="text-[10px] text-slate-400">Colors will be extracted automatically</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Color Picker */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Primary Brand Accent</p>
                  <p className="text-[10px] text-slate-400">Used for highlights, headings, and totals</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-bold text-slate-800 uppercase">{primaryColor}</span>
                </div>
              </div>

              {/* Signature */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Authorized Signature (Optional)</label>
                <div
                  onClick={() => sigRef.current?.click()}
                  className="border border-dashed border-slate-200 p-3 rounded-xl text-center cursor-pointer bg-slate-50 hover:bg-white text-xs text-slate-500"
                >
                  <input
                    ref={sigRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                  {signatureDataUrl ? (
                    <img src={signatureDataUrl} alt="Signature" className="max-h-10 mx-auto object-contain" />
                  ) : (
                    <span>Click to upload signature scan</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Signer Name (e.g. Sarah Jenkins)"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Finalizing Workspace...' : 'Launch Workspace'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
