import Decimal from 'decimal.js';
import { DiscountType, TaxType, InvoiceStatus } from '@/types/invoice';

export interface CalculationInput {
  items: Array<{
    quantity: number | string;
    unitPrice: number | string;
    discountPercent?: number | string;
    taxRatePercent?: number | string;
  }>;
  discountType: DiscountType;
  discountValue: number | string;
  taxType: TaxType;
  taxRate: number | string;
  deliveryCharge: number | string;
  payments?: Array<{ amount: number | string }>;
  dueDate?: string;
  currentStatus?: InvoiceStatus;
}

export interface CalculationResult {
  items: Array<{
    lineSubtotal: number;
    lineDiscount: number;
    lineTax: number;
    amount: number;
  }>;
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  deliveryCharge: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  computedStatus: InvoiceStatus;
}

// Decimal precision setup
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(val: number | string | undefined | null): Decimal {
  if (val === undefined || val === null || val === '') return new Decimal(0);
  try {
    const clean = String(val).replace(/[^0-9.-]/g, '');
    if (!clean || isNaN(Number(clean))) return new Decimal(0);
    return new Decimal(clean);
  } catch {
    return new Decimal(0);
  }
}

export function roundTo2Decimals(dec: Decimal): number {
  return dec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculates complete financial totals for an invoice using decimal-safe arithmetic.
 */
export function calculateInvoiceTotals(input: CalculationInput): CalculationResult {
  let subtotalDec = new Decimal(0);
  const calculatedItems = (input.items || []).map((item) => {
    const qty = toDecimal(item.quantity);
    const price = toDecimal(item.unitPrice);
    const lineRaw = qty.times(price);

    const discPct = toDecimal(item.discountPercent);
    const lineDiscount = discPct.greaterThan(0)
      ? lineRaw.times(discPct).dividedBy(100)
      : new Decimal(0);

    const afterDisc = Decimal.max(0, lineRaw.minus(lineDiscount));

    const lineTaxRate = toDecimal(item.taxRatePercent);
    const lineTax = lineTaxRate.greaterThan(0)
      ? afterDisc.times(lineTaxRate).dividedBy(100)
      : new Decimal(0);

    const lineTotal = afterDisc.plus(lineTax);

    subtotalDec = subtotalDec.plus(lineRaw);

    return {
      lineSubtotal: roundTo2Decimals(lineRaw),
      lineDiscount: roundTo2Decimals(lineDiscount),
      lineTax: roundTo2Decimals(lineTax),
      amount: roundTo2Decimals(lineTotal)
    };
  });

  const subtotal = roundTo2Decimals(subtotalDec);

  // Global Discount
  let discountTotalDec = new Decimal(0);
  const discountVal = toDecimal(input.discountValue);

  if (input.discountType === 'percentage' && discountVal.greaterThan(0)) {
    const pct = Decimal.min(100, Decimal.max(0, discountVal));
    discountTotalDec = subtotalDec.times(pct).dividedBy(100);
  } else if (input.discountType === 'fixed' && discountVal.greaterThan(0)) {
    discountTotalDec = Decimal.min(subtotalDec, discountVal);
  }

  const discountTotal = roundTo2Decimals(discountTotalDec);

  // Taxable amount after global discount
  const taxableDec = Decimal.max(0, subtotalDec.minus(discountTotalDec));
  const taxableAmount = roundTo2Decimals(taxableDec);

  // Global Tax
  let taxTotalDec = new Decimal(0);
  const taxRate = toDecimal(input.taxRate);

  if (input.taxType === 'percentage' && taxRate.greaterThan(0)) {
    taxTotalDec = taxableDec.times(taxRate).dividedBy(100);
  }

  const taxTotal = roundTo2Decimals(taxTotalDec);

  // Delivery / shipping charge
  const deliveryDec = Decimal.max(0, toDecimal(input.deliveryCharge));
  const deliveryCharge = roundTo2Decimals(deliveryDec);

  // Final Total
  const totalDec = taxableDec.plus(taxTotalDec).plus(deliveryDec);
  const total = roundTo2Decimals(totalDec);

  // Payments
  let paidDec = new Decimal(0);
  if (input.payments && input.payments.length > 0) {
    for (const p of input.payments) {
      paidDec = paidDec.plus(Decimal.max(0, toDecimal(p.amount)));
    }
  }
  const amountPaid = roundTo2Decimals(paidDec);

  // Balance due
  const balanceDec = totalDec.minus(paidDec);
  const balanceDue = roundTo2Decimals(Decimal.max(0, balanceDec));

  // Determine invoice status
  let computedStatus: InvoiceStatus = input.currentStatus || 'draft';

  if (input.currentStatus !== 'voided' && input.currentStatus !== 'draft') {
    if (total > 0 && balanceDue === 0 && amountPaid >= total) {
      computedStatus = 'paid';
    } else if (amountPaid > 0 && balanceDue > 0) {
      computedStatus = 'partially_paid';
    } else if (input.dueDate && new Date(input.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) && balanceDue > 0) {
      computedStatus = 'overdue';
    } else {
      computedStatus = 'issued';
    }
  }

  return {
    items: calculatedItems,
    subtotal,
    discountTotal,
    taxableAmount,
    taxTotal,
    deliveryCharge,
    total,
    amountPaid,
    balanceDue,
    computedStatus
  };
}

/**
 * Format currency with international number formats
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateString: string | undefined, format: string = 'YYYY-MM-DD'): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  if (format === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
  if (format === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
  return `${yyyy}-${mm}-${dd}`;
}
