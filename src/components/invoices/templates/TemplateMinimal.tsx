import React from 'react';
import { Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';
import { formatCurrency, formatDate } from '@/lib/calculations/engine';

interface TemplateProps {
  invoice: Invoice;
  workspace?: Workspace | null;
  id?: string;
}

export const TemplateMinimal: React.FC<TemplateProps> = ({ invoice, workspace, id = 'invoice-render-target' }) => {
  const brand = invoice.brandKitSnapshot;
  const currency = invoice.currency || workspace?.currency || 'USD';

  return (
    <div
      id={id}
      className={`w-full bg-white text-slate-800 p-8 sm:p-12 transition-all font-sans print:p-0 print:m-0`}
      style={{
        fontFamily: brand.fontBody || 'Inter, sans-serif',
        minHeight: invoice.pageFormat === 'letter' ? '1056px' : '1122px',
        color: brand.textColor || '#0F172A'
      }}
    >
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-8 gap-6" style={{ borderColor: brand.neutralColor || '#F1F5F9' }}>
        <div>
          {(brand.logoUrl || brand.logoDataUrl) ? (
            <img
              src={brand.logoUrl || brand.logoDataUrl}
              alt={invoice.sender?.name || workspace?.name || 'Logo'}
              className="max-h-16 max-w-[200px] object-contain mb-3"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: brand.primaryColor }}>
              {invoice.sender?.name || workspace?.name || 'Your Company'}
            </h1>
          )}
          {brand.tagline && <p className="text-xs text-slate-500 mt-1">{brand.tagline}</p>}
          <div className="mt-3 text-xs text-slate-500 space-y-0.5 leading-relaxed">
            {(invoice.sender?.address?.line1 || workspace?.address.line1) && (
              <p className="font-medium text-slate-700">
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
            {(invoice.sender?.taxId || workspace?.taxId) && <p>Tax ID: {invoice.sender?.taxId || workspace?.taxId}</p>}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">INVOICE</p>
          <p className="text-xl font-bold tracking-tight mt-1" style={{ color: brand.primaryColor }}>
            {invoice.invoiceNumber}
          </p>
          <div className="mt-4 text-xs space-y-1 text-slate-600">
            <p>
              <span className="text-slate-400">Issue Date: </span>
              {formatDate(invoice.issueDate, workspace?.dateFormat)}
            </p>
            <p>
              <span className="text-slate-400">Due Date: </span>
              {formatDate(invoice.dueDate, workspace?.dateFormat)}
            </p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider"
                 style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}>
              {invoice.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Billed To */}
      <div className="my-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Billed To</p>
        <p className="text-base font-bold" style={{ color: brand.textColor }}>
          {invoice.customer.name || 'Valued Customer'}
        </p>
        {invoice.customer.companyName && (
          <p className="text-sm font-medium text-slate-600">{invoice.customer.companyName}</p>
        )}
        {invoice.customer.email && <p className="text-xs text-slate-500">{invoice.customer.email}</p>}
        {invoice.customer.phone && <p className="text-xs text-slate-500">{invoice.customer.phone}</p>}
        {invoice.customer.address?.line1 && (
          <p className="text-xs text-slate-500 mt-1">
            {invoice.customer.address.line1}
            {invoice.customer.address.line2 ? `, ${invoice.customer.address.line2}` : ''}
            {invoice.customer.address.city ? `, ${invoice.customer.address.city}` : ''}
            {invoice.customer.address.country ? `, ${invoice.customer.address.country}` : ''}
          </p>
        )}
        {invoice.customer.taxId && <p className="text-xs text-slate-500">Tax ID: {invoice.customer.taxId}</p>}
      </div>

      {/* Items Table */}
      <div className="mt-6 overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ borderColor: brand.neutralColor || '#F1F5F9' }}>
              <th className="py-3 pr-4">Description</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 pl-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm" style={{ borderColor: brand.neutralColor || '#F1F5F9' }}>
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3.5 pr-4">
                  <p className="font-medium text-slate-800">{item.description}</p>
                </td>
                <td className="py-3.5 px-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">
                  {formatCurrency(item.unitPrice, currency)}
                </td>
                <td className="py-3.5 pl-4 text-right font-medium text-slate-800">
                  {formatCurrency(item.amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between gap-8" style={{ borderColor: brand.neutralColor || '#F1F5F9' }}>
        <div className="max-w-xs space-y-3 text-xs text-slate-500">
          {invoice.notes && (
            <div>
              <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Notes</p>
              <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
          {invoice.paymentInstructions && (
            <div>
              <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Payment Instructions</p>
              <p className="mt-1 whitespace-pre-line text-slate-600">{invoice.paymentInstructions}</p>
            </div>
          )}
        </div>

        <div className="w-full sm:w-64 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-medium text-slate-800">{formatCurrency(invoice.subtotal, currency)}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}:</span>
              <span>-{formatCurrency(invoice.discountTotal, currency)}</span>
            </div>
          )}
          {invoice.taxTotal > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Tax ({invoice.taxRate}%):</span>
              <span className="font-medium text-slate-800">+{formatCurrency(invoice.taxTotal, currency)}</span>
            </div>
          )}
          {invoice.deliveryCharge > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Delivery / Shipping:</span>
              <span className="font-medium text-slate-800">+{formatCurrency(invoice.deliveryCharge, currency)}</span>
            </div>
          )}

          <div className="pt-3 border-t flex justify-between text-base font-bold" style={{ borderColor: brand.primaryColor, color: brand.primaryColor }}>
            <span>Total:</span>
            <span>{formatCurrency(invoice.total, currency)}</span>
          </div>

          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Amount Paid:</span>
              <span className="font-medium text-emerald-600">{formatCurrency(invoice.amountPaid, currency)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-semibold pt-2 border-t text-slate-900" style={{ borderColor: brand.neutralColor }}>
            <span>Balance Due:</span>
            <span style={{ color: invoice.balanceDue > 0 ? brand.primaryColor : '#10B981' }}>
              {formatCurrency(invoice.balanceDue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Signature and Footer */}
      <div className="mt-14 pt-8 border-t flex flex-col sm:flex-row justify-between items-end gap-6" style={{ borderColor: brand.neutralColor || '#F1F5F9' }}>
        <div>
          {brand.thankYouNote && (
            <p className="text-xs italic text-slate-400">{brand.thankYouNote}</p>
          )}
        </div>

        {(brand.signatureUrl || brand.signatureDataUrl || brand.signatureName) && (
          <div className="text-center sm:text-right">
            {(brand.signatureUrl || brand.signatureDataUrl) && (
              <img
                src={brand.signatureUrl || brand.signatureDataUrl}
                alt="Signature"
                className="max-h-12 max-w-[150px] object-contain ml-auto mb-1"
              />
            )}
            {brand.signatureName && (
              <p className="text-xs font-bold text-slate-800">{brand.signatureName}</p>
            )}
            {brand.signatureTitle && (
              <p className="text-[10px] text-slate-500">{brand.signatureTitle}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
