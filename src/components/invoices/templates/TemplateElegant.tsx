import React from 'react';
import { Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';

interface TemplateProps {
  invoice: Invoice;
  workspace?: Workspace | null;
  id?: string;
}

export const TemplateElegant: React.FC<TemplateProps> = ({ invoice, workspace, id = 'invoice-render-target' }) => {
  const brand = invoice.brandKitSnapshot;
  const currency = invoice.currency || workspace?.currency || 'USD';

  return (
    <div
      id={id}
      className="w-full bg-white text-slate-800 p-8 sm:p-14 transition-all font-serif print:p-0 print:m-0"
      style={{
        minHeight: invoice.pageFormat === 'letter' ? '1056px' : '1122px',
        color: brand.textColor || '#1E293B'
      }}
    >
      {/* Decorative Outer Border */}
      <div className="border border-amber-900/10 p-6 sm:p-10 h-full flex flex-col justify-between"
           style={{ borderColor: `${brand.primaryColor}25` }}>
        
        {/* Top Centered Crest / Header */}
        <div className="text-center pb-8 border-b border-amber-900/10" style={{ borderColor: `${brand.primaryColor}20` }}>
          {(brand.logoUrl || brand.logoDataUrl) ? (
            <img
              src={brand.logoUrl || brand.logoDataUrl}
              alt={invoice.sender?.name || workspace?.name || 'Logo'}
              className="max-h-20 max-w-[240px] object-contain mx-auto mb-3"
            />
          ) : (
            <h1 className="text-3xl font-serif tracking-widest uppercase font-normal" style={{ color: brand.primaryColor }}>
              {invoice.sender?.name || workspace?.name || 'Maison de Création'}
            </h1>
          )}
          {brand.tagline && (
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-sans">{brand.tagline}</p>
          )}

          <div className="text-xs text-slate-500 font-sans mt-3 space-y-1">
            {(invoice.sender?.address?.line1 || workspace?.address.line1) && (
              <p>
                {invoice.sender?.address?.line1 || workspace?.address.line1}
                {(invoice.sender?.address?.line2 || workspace?.address.line2) ? `, ${invoice.sender?.address?.line2 || workspace?.address.line2}` : ''}
                {', '}
                {[
                  invoice.sender?.address?.city || workspace?.address.city,
                  invoice.sender?.address?.state || workspace?.address.state,
                  invoice.sender?.address?.postalCode || workspace?.address.postalCode,
                  invoice.sender?.address?.country || workspace?.address.country
                ].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
              {(invoice.sender?.email || workspace?.email) && <span>{invoice.sender?.email || workspace?.email}</span>}
              {(invoice.sender?.phone || workspace?.phone) && <span>{invoice.sender?.phone || workspace?.phone}</span>}
              {(invoice.sender?.website || workspace?.website) && <span>{invoice.sender?.website || workspace?.website}</span>}
              {(invoice.sender?.taxId || workspace?.taxId) && <span>Tax ID: {invoice.sender?.taxId || workspace?.taxId}</span>}
            </div>
          </div>
        </div>

        {/* Invoice Metadata Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center my-8 py-4 border-y border-amber-900/10 font-sans text-xs gap-4"
             style={{ borderColor: `${brand.primaryColor}15` }}>
          <div>
            <span className="text-slate-400 uppercase tracking-widest mr-2">Invoice No:</span>
            <span className="font-bold tracking-wider" style={{ color: brand.primaryColor }}>{invoice.invoiceNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-widest mr-2">Issue Date:</span>
            <span className="font-medium text-slate-700">{formatDate(invoice.issueDate, workspace?.dateFormat)}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-widest mr-2">Due Date:</span>
            <span className="font-medium text-slate-700">{formatDate(invoice.dueDate, workspace?.dateFormat)}</span>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}>
              {invoice.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Client Details */}
        <div className="mb-8 font-sans">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Prepared Exclusively For</p>
          <p className="text-xl font-serif font-normal" style={{ color: brand.primaryColor }}>
            {invoice.customer.name}
          </p>
          {invoice.customer.companyName && (
            <p className="text-xs text-slate-600 font-medium">{invoice.customer.companyName}</p>
          )}
          {invoice.customer.email && <p className="text-xs text-slate-500">{invoice.customer.email}</p>}
          {invoice.customer.address?.line1 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {[invoice.customer.address.line1, invoice.customer.address.city, invoice.customer.address.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Items Table */}
        <div className="my-6 font-sans flex-1 overflow-x-auto print:overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-widest text-slate-400"
                  style={{ borderColor: `${brand.primaryColor}20` }}>
                <th className="py-3 font-medium">Item Description</th>
                <th className="py-3 text-center w-16 font-medium">Qty</th>
                <th className="py-3 text-right w-28 font-medium">Rate</th>
                <th className="py-3 text-right w-28 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: `${brand.primaryColor}10` }}>
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-4 pr-4">
                    <p className="font-serif text-sm font-medium text-slate-900">{item.description}</p>
                  </td>
                  <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-4 text-right text-slate-600">{formatCurrency(item.unitPrice, currency)}</td>
                  <td className="py-4 text-right font-medium text-slate-900">{formatCurrency(item.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between gap-8 font-sans"
             style={{ borderColor: `${brand.primaryColor}20` }}>
          <div className="max-w-xs text-xs text-slate-500 space-y-2">
            {invoice.paymentInstructions && (
              <div>
                <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Settlement Details</p>
                <p className="mt-1 whitespace-pre-line text-slate-600">{invoice.paymentInstructions}</p>
              </div>
            )}
            {invoice.notes && (
              <p className="italic text-slate-500 pt-2">{invoice.notes}</p>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-800">{formatCurrency(invoice.subtotal, currency)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Courtesy Discount</span>
                <span>-{formatCurrency(invoice.discountTotal, currency)}</span>
              </div>
            )}
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>+{formatCurrency(invoice.taxTotal, currency)}</span>
              </div>
            )}
            {invoice.deliveryCharge > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>White Glove Delivery</span>
                <span>+{formatCurrency(invoice.deliveryCharge, currency)}</span>
              </div>
            )}
            <div className="pt-3 border-t flex justify-between text-sm font-serif font-bold"
                 style={{ borderColor: `${brand.primaryColor}30`, color: brand.primaryColor }}>
              <span>Total Amount</span>
              <span>{formatCurrency(invoice.total, currency)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Deposit Received</span>
                <span className="text-emerald-700 font-medium">-{formatCurrency(invoice.amountPaid, currency)}</span>
              </div>
            )}
            <div className="pt-2 border-t flex justify-between text-xs font-bold uppercase tracking-widest text-slate-900"
                 style={{ borderColor: `${brand.primaryColor}20` }}>
              <span>Balance Due</span>
              <span style={{ color: brand.primaryColor }}>{formatCurrency(invoice.balanceDue, currency)}</span>
            </div>
          </div>
        </div>

        {/* Elegant Footer & Signature */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left"
             style={{ borderColor: `${brand.primaryColor}15` }}>
          <p className="text-xs font-serif italic text-slate-400">
            {brand.thankYouNote || 'With warm appreciation for your discerning patronage.'}
          </p>

          {(brand.signatureUrl || brand.signatureDataUrl || brand.signatureName) && (
            <div className="text-center sm:text-right font-sans">
              {(brand.signatureUrl || brand.signatureDataUrl) && (
                <img src={brand.signatureUrl || brand.signatureDataUrl} alt="Signature" className="max-h-12 max-w-[140px] object-contain ml-auto mb-1" />
              )}
              {brand.signatureName && <p className="text-xs font-semibold text-slate-800">{brand.signatureName}</p>}
              {brand.signatureTitle && <p className="text-[10px] text-slate-400">{brand.signatureTitle}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
