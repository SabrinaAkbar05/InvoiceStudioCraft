'use client';

import React, { useState } from 'react';
import { X, Building2, MapPin, Mail, Phone, Globe, Shield, Check, AlertCircle } from 'lucide-react';
import { InvoiceSender } from '@/types/invoice';
import { Workspace } from '@/types/workspace';

interface SenderEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSender: InvoiceSender;
  workspace: Workspace | null;
  onSaveInvoiceOnly: (updatedSender: InvoiceSender) => void;
  onSaveAsDefault: (updatedSender: InvoiceSender) => Promise<void>;
}

export const SenderEditorModal: React.FC<SenderEditorModalProps> = ({
  isOpen,
  onClose,
  initialSender,
  workspace,
  onSaveInvoiceOnly,
  onSaveAsDefault
}) => {
  const [formData, setFormData] = useState<InvoiceSender>({ ...initialSender });
  const [saveMode, setSaveMode] = useState<'invoice_only' | 'default_workspace'>('invoice_only');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Business or sender name is required';
    if (!formData.email?.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.address?.line1?.trim()) errs.line1 = 'Street address line 1 is required';
    if (!formData.address?.city?.trim()) errs.city = 'City is required';
    if (!formData.address?.country?.trim()) errs.country = 'Country is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (saveMode === 'default_workspace') {
        await onSaveAsDefault(formData);
      } else {
        onSaveInvoiceOnly(formData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save sender details:', err);
      setErrors((prev) => ({
        ...prev,
        form: 'Failed to save changes. Please check your network and try again.'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sender-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6254E8]/10 text-[#6254E8] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="sender-modal-title" className="text-base font-bold text-slate-900">
                Edit Sender / Business Details
              </h2>
              <p className="text-xs text-slate-500">
                Customize who this invoice is sent from with live preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Section 1: Business Identity */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1. Business Identity
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Sender Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="e.g. The Gift Garden, Acme Design Studio"
                    className={`w-full text-xs bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors ${
                      errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="billing@yourbusiness.com"
                    className={`w-full text-xs bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors ${
                      errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourbusiness.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tax / NTN / VAT ID <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="e.g. US-EIN-1234567 or NTN-987654"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Physical Address */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              2. Business Physical Address
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address?.line1 || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line1: e.target.value }
                    });
                    if (errors.line1) setErrors({ ...errors, line1: '' });
                  }}
                  placeholder="Street address, building number, suite"
                  className={`w-full text-xs bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors ${
                    errors.line1 ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.line1 && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.line1}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Line 2 <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.address?.line2 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line2: e.target.value }
                    })
                  }
                  placeholder="Apartment, suite, unit, floor"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    });
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                  placeholder="City / District"
                  className={`w-full text-xs bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors ${
                    errors.city ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.city && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={formData.address?.state || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })
                  }
                  placeholder="State / Province / Region"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.address?.postalCode || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })
                  }
                  placeholder="e.g. 75500, 94107"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address?.country || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value }
                    });
                    if (errors.country) setErrors({ ...errors, country: '' });
                  }}
                  placeholder="e.g. Pakistan, United States"
                  className={`w-full text-xs bg-slate-50 border rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-[#6254E8] transition-colors ${
                    errors.country ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.country && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Save Mode Choice */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              3. Where to Apply These Changes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  saveMode === 'invoice_only'
                    ? 'border-[#6254E8] bg-[#6254E8]/5 ring-1 ring-[#6254E8]'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="saveMode"
                  value="invoice_only"
                  checked={saveMode === 'invoice_only'}
                  onChange={() => setSaveMode('invoice_only')}
                  className="mt-0.5 text-[#6254E8] focus:ring-[#6254E8]"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Update This Invoice Only
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Applies strictly to this invoice draft. Leaves your workspace profile ({workspace?.name || 'Default'}) untouched.
                  </p>
                </div>
              </label>

              <label
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  saveMode === 'default_workspace'
                    ? 'border-[#6254E8] bg-[#6254E8]/5 ring-1 ring-[#6254E8]'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="saveMode"
                  value="default_workspace"
                  checked={saveMode === 'default_workspace'}
                  onChange={() => setSaveMode('default_workspace')}
                  className="mt-0.5 text-[#6254E8] focus:ring-[#6254E8]"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Save as Default Business Profile
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Updates this invoice AND saves as your default business profile in Firestore for all future invoices.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-[#6254E8] hover:bg-[#5244d4] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-[#6254E8]/20 transition-all disabled:opacity-60"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {saveMode === 'invoice_only' ? 'Apply to This Invoice' : 'Save as Default & Apply'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
