import React from 'react';
import { Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';

interface TemplateProps {
  invoice: Invoice;
  workspace?: Workspace | null;
  id?: string;
}

export const TemplateCreative: React.FC<TemplateProps> = ({ invoice, workspace, id = 'invoice-render-target' }) => {
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
      {/* Creative Header Hero Block */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden shadow-sm"
           style={{ backgroundColor: brand.secondaryColor || '#0F172A' }}>
        {/* Abstract glowing sphere */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-30 blur-2xl pointer-events-none"
             style={{ backgroundColor: brand.primaryColor }} />

        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
          <div>
            {(brand.logoUrl || brand.logoDataUrl) ? (
              <img
                src={brand.logoUrl || brand.logoDataUrl}
                alt={invoice.sender?.name || workspace?.name || 'Logo'}
                className="max-h-16 max-w-[200px] object-contain mb-3 brightness-110"
              />
            ) : (
              <h1 className="text-2xl font-black tracking-tight text-white">
                {invoice.sender?.name || workspace?.name || 'Studio Pixel'}
              </h1>
            )}
            {brand.tagline && <p className="text-xs text-slate-300 font-medium">{brand.tagline}</p>}

            <div className="mt-4 text-xs text-slate-300 space-y-0.5 leading-relaxed">
              {(invoice.sender?.address?.line1 || workspace?.address.line1) && (
                <p>
                  {invoice.sender?.address?.line1 || workspace?.address.line1}
                  {(invoice.sender?.address?.line2 || workspace?.address.line2) ? `, ${invoice.sender?.address?.line2 || workspace?.address.line2}` : ''}
                </p>
              )}
              <p>
                {[
                  invoice.sender?.address?.city || workspace?.address.city,
                  invoice.sender?.address?.state || workspace?.address.state,
                  invoice.sender?.address?.postalCode || workspace?.address.postalCode,
                  invoice.sender?.address?.country || workspace?.address.country
                ].filter(Boolean).join(', ')}
              </p>
              {(invoice.sender?.email || workspace?.email) && <p>{invoice.sender?.email || workspace?.email}</p>}
              {(invoice.sender?.phone || workspace?.phone) && <p>{invoice.sender?.phone || workspace?.phone}</p>}
              {(invoice.sender?.website || workspace?.website) && <p>{invoice.sender?.website || workspace?.website}</p>}
              {(invoice.sender?.taxId || workspace?.taxId) && <p className="text-slate-400">Tax ID: {invoice.sender?.taxId || workspace?.taxId}</p>}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">INVOICE NUMBER</span>
            <p className="text-2xl font-black tracking-tight text-white mt-0.5">
              {invoice.invoiceNumber}
            </p>
            <div className="mt-3 flex sm:justify-end gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: brand.primaryColor, color: '#FFFFFF' }}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Info Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 px-2">
        <div className="border-l-2 pl-4" style={{ borderColor: brand.primaryColor }}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">CLIENT / INVOICED TO</p>
          <p className="text-lg font-bold text-slate-900">{invoice.customer.name}</p>
          {invoice.customer.companyName && (
            <p className="text-xs font-semibold text-slate-600">{invoice.customer.companyName}</p>
          )}
          {invoice.customer.email && <p className="text-xs text-slate-500 mt-0.5">{invoice.customer.email}</p>}
          {invoice.customer.address?.line1 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {[invoice.customer.address.line1, invoice.customer.address.city, invoice.customer.address.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs"
             style={{ backgroundColor: brand.neutralColor || '#F8F9FC' }}>
          <div>
            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">ISSUE DATE</p>
            <p className="font-bold text-slate-800 mt-0.5">{formatDate(invoice.issueDate, workspace?.dateFormat)}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">PAYMENT DUE</p>
            <p className="font-bold text-slate-800 mt-0.5">{formatDate(invoice.dueDate, workspace?.dateFormat)}</p>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200/60">
            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">CURRENCY</p>
            <p className="font-bold text-slate-800 mt-0.5">{currency}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="my-6 overflow-x-auto print:overflow-visible rounded-xl border border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50"
                style={{ backgroundColor: `${brand.neutralColor}` || '#F8F9FC' }}>
              <th className="py-3 px-4">Work Item & Description</th>
              <th className="py-3 px-4 text-center w-16">Qty</th>
              <th className="py-3 px-4 text-right w-28">Rate</th>
              <th className="py-3 px-4 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50">
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-900 text-sm">{item.description}</p>
                </td>
                <td className="py-4 px-4 text-center font-medium text-slate-600">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-slate-600">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-4 px-4 text-right font-bold text-slate-900">{formatCurrency(item.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Payment Grid */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-start gap-8">
        <div className="max-w-md text-xs space-y-3">
          {invoice.paymentInstructions && (
            <div className="p-4 rounded-xl border border-slate-100" style={{ backgroundColor: `${brand.neutralColor}50` }}>
              <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Payment Instructions</p>
              <p className="mt-1 text-slate-600 whitespace-pre-line leading-relaxed">{invoice.paymentInstructions}</p>
            </div>
          )}
          {invoice.notes && (
            <p className="text-slate-500 text-xs italic pl-1">{invoice.notes}</p>
          )}
        </div>

        <div className="w-full sm:w-72 bg-slate-900 text-white p-6 rounded-2xl space-y-2 text-xs shadow-md"
             style={{ backgroundColor: brand.secondaryColor || '#0F172A' }}>
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="text-white font-medium">{formatCurrency(invoice.subtotal, currency)}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discountTotal, currency)}</span>
            </div>
          )}
          {invoice.taxTotal > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Tax ({invoice.taxRate}%)</span>
              <span className="text-white font-medium">+{formatCurrency(invoice.taxTotal, currency)}</span>
            </div>
          )}
          {invoice.deliveryCharge > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Delivery</span>
              <span className="text-white font-medium">+{formatCurrency(invoice.deliveryCharge, currency)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-700 flex justify-between text-sm font-bold">
            <span>Total</span>
            <span style={{ color: brand.accentColor || '#38BDF8' }}>{formatCurrency(invoice.total, currency)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-xs text-slate-400">
              <span>Paid</span>
              <span className="text-emerald-400">-{formatCurrency(invoice.amountPaid, currency)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-black">
            <span>DUE</span>
            <span style={{ color: brand.primaryColor }}>{formatCurrency(invoice.balanceDue, currency)}</span>
          </div>
        </div>
      </div>

      {/* Signature and Credits */}
      <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-6">
        <div>
          <p className="text-xs text-slate-400 italic">
            {brand.thankYouNote || 'Thank you for making great things happen with us.'}
          </p>
        </div>

        {(brand.signatureUrl || brand.signatureDataUrl || brand.signatureName) && (
          <div className="text-right">
            {(brand.signatureUrl || brand.signatureDataUrl) && (
              <img src={brand.signatureUrl || brand.signatureDataUrl} alt="Signature" className="max-h-12 max-w-[150px] object-contain ml-auto mb-1" />
            )}
            {brand.signatureName && <p className="text-xs font-bold text-slate-900">{brand.signatureName}</p>}
            {brand.signatureTitle && <p className="text-[10px] text-slate-400">{brand.signatureTitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
