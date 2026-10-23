import React from 'react';
import { Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';

interface TemplateProps {
  invoice: Invoice;
  workspace?: Workspace | null;
  id?: string;
}

export const TemplateCorporate: React.FC<TemplateProps> = ({ invoice, workspace, id = 'invoice-render-target' }) => {
  const brand = invoice.brandKitSnapshot;
  const currency = invoice.currency || workspace?.currency || 'USD';

  return (
    <div
      id={id}
      className="w-full bg-white text-slate-800 p-8 sm:p-12 transition-all font-sans print:p-0 print:m-0"
      style={{
        fontFamily: brand.fontBody || 'Inter, sans-serif',
        minHeight: invoice.pageFormat === 'letter' ? '1056px' : '1122px',
        color: brand.textColor || '#0F172A'
      }}
    >
      {/* Top Brand Banner */}
      <div className="h-2 w-full rounded-t" style={{ backgroundColor: brand.primaryColor }} />

      {/* Corporate Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start pt-6 pb-8 border-b border-slate-200 gap-6">
        <div>
          {(brand.logoUrl || brand.logoDataUrl) ? (
            <img
              src={brand.logoUrl || brand.logoDataUrl}
              alt={invoice.sender?.name || workspace?.name || 'Logo'}
              className="max-h-16 max-w-[220px] object-contain mb-3"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-base"
                   style={{ backgroundColor: brand.primaryColor }}>
                {(invoice.sender?.name || workspace?.name || 'I').charAt(0)}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {invoice.sender?.name || workspace?.name || 'Enterprise Corporation'}
              </h1>
            </div>
          )}
          {brand.tagline && <p className="text-xs text-slate-500 italic mt-1">{brand.tagline}</p>}

          <div className="mt-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700">{invoice.sender?.address?.line1 || workspace?.address.line1}</p>
            {(invoice.sender?.address?.line2 || workspace?.address.line2) && (
              <p>{invoice.sender?.address?.line2 || workspace?.address.line2}</p>
            )}
            <p>
              {[
                invoice.sender?.address?.city || workspace?.address.city,
                invoice.sender?.address?.state || workspace?.address.state,
                invoice.sender?.address?.postalCode || workspace?.address.postalCode,
                invoice.sender?.address?.country || workspace?.address.country
              ].filter(Boolean).join(', ')}
            </p>
            {(invoice.sender?.email || workspace?.email) && (
              <p className="mt-1">Email: {invoice.sender?.email || workspace?.email}</p>
            )}
            {(invoice.sender?.phone || workspace?.phone) && (
              <p>Phone: {invoice.sender?.phone || workspace?.phone}</p>
            )}
            {(invoice.sender?.taxId || workspace?.taxId) && (
              <p>Tax ID / EIN: {invoice.sender?.taxId || workspace?.taxId}</p>
            )}
            {(invoice.sender?.website || workspace?.website) && (
              <p>Web: {invoice.sender?.website || workspace?.website}</p>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider mb-3"
               style={{ backgroundColor: brand.secondaryColor || '#0F172A' }}>
            TAX INVOICE
          </div>
          <p className="text-2xl font-black tracking-tight" style={{ color: brand.primaryColor }}>
            {invoice.invoiceNumber}
          </p>

          <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs space-y-1.5 text-left sm:text-right"
               style={{ backgroundColor: brand.neutralColor || '#F8F9FC' }}>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-500 font-medium">Issue Date:</span>
              <span className="font-bold text-slate-800">{formatDate(invoice.issueDate, workspace?.dateFormat)}</span>
            </div>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-500 font-medium">Payment Due:</span>
              <span className="font-bold text-slate-800">{formatDate(invoice.dueDate, workspace?.dateFormat)}</span>
            </div>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-bold uppercase tracking-wider text-xs" style={{ color: brand.primaryColor }}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Ship To Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 p-5 rounded-lg bg-slate-50 border border-slate-100"
           style={{ backgroundColor: `${brand.neutralColor}80` || '#F8F9FC' }}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Invoice Recipient (Client)</p>
          <p className="text-base font-bold text-slate-900">{invoice.customer.name}</p>
          {invoice.customer.companyName && (
            <p className="text-xs font-semibold text-slate-700">{invoice.customer.companyName}</p>
          )}
          {invoice.customer.address?.line1 && (
            <p className="text-xs text-slate-500 mt-1">
              {invoice.customer.address.line1}
              {invoice.customer.address.line2 ? `, ${invoice.customer.address.line2}` : ''}<br />
              {[invoice.customer.address.city, invoice.customer.address.state, invoice.customer.address.postalCode, invoice.customer.address.country].filter(Boolean).join(', ')}
            </p>
          )}
          {invoice.customer.email && <p className="text-xs text-slate-500 mt-1">{invoice.customer.email}</p>}
          {invoice.customer.taxId && <p className="text-xs text-slate-500">Tax ID: {invoice.customer.taxId}</p>}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Payment Terms & Instructions</p>
          <p className="text-xs font-semibold text-slate-700">Due within {workspace?.defaultPaymentTermsDays || 14} days</p>
          <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
            {invoice.paymentInstructions || workspace?.paymentInstructions || 'Net 14 payment terms. Electronic transfer preferred.'}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-lg border border-slate-200 overflow-x-auto print:overflow-visible shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: brand.secondaryColor || '#1E293B' }}>
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4 text-center w-20">Qty</th>
              <th className="py-3.5 px-4 text-right w-28">Unit Price</th>
              <th className="py-3.5 px-4 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">{item.description}</td>
                <td className="py-3.5 px-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(item.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations & Total */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-8">
        <div className="max-w-md text-xs text-slate-500 space-y-3">
          {invoice.notes && (
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Client Notes</p>
              <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
          {brand.thankYouNote && (
            <p className="italic text-slate-500 text-xs">{brand.thankYouNote}</p>
          )}
        </div>

        <div className="w-full sm:w-80 bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal, currency)}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'}):</span>
              <span>-{formatCurrency(invoice.discountTotal, currency)}</span>
            </div>
          )}
          {invoice.taxTotal > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tax ({invoice.taxRate}%):</span>
              <span className="font-semibold text-slate-900">+{formatCurrency(invoice.taxTotal, currency)}</span>
            </div>
          )}
          {invoice.deliveryCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Delivery:</span>
              <span className="font-semibold text-slate-900">+{formatCurrency(invoice.deliveryCharge, currency)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
            <span>Invoice Total:</span>
            <span style={{ color: brand.primaryColor }}>{formatCurrency(invoice.total, currency)}</span>
          </div>

          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Paid to Date:</span>
              <span className="font-semibold text-emerald-600">-{formatCurrency(invoice.amountPaid, currency)}</span>
            </div>
          )}

          <div className="pt-2 border-t-2 flex justify-between text-sm font-extrabold"
               style={{ borderColor: brand.primaryColor, color: brand.primaryColor }}>
            <span>BALANCE DUE:</span>
            <span>{formatCurrency(invoice.balanceDue, currency)}</span>
          </div>
        </div>
      </div>

      {/* Signature and Authorization */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end">
        <p className="text-[10px] text-slate-400">
          This document is generated by {workspace?.name || 'InvoiceCraft Studio'} and represents an official financial record.
        </p>

        {(brand.signatureUrl || brand.signatureDataUrl || brand.signatureName) && (
          <div className="text-right">
            {(brand.signatureUrl || brand.signatureDataUrl) && (
              <img src={brand.signatureUrl || brand.signatureDataUrl} alt="Signature" className="max-h-12 max-w-[150px] object-contain ml-auto mb-1" />
            )}
            {brand.signatureName && <p className="text-xs font-bold text-slate-800">{brand.signatureName}</p>}
            {brand.signatureTitle && <p className="text-[10px] text-slate-500">{brand.signatureTitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
