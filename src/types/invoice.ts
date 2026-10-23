import { BrandKit } from './brand';
import { Address } from './workspace';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'voided';

export type DiscountType = 'none' | 'percentage' | 'fixed';
export type TaxType = 'none' | 'percentage';
export type PageFormat = 'a4' | 'letter';

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRatePercent?: number;
  amount: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'paypal' | 'stripe' | 'check' | 'other';
  reference?: string;
  note?: string;
  createdAt: string;
}

export interface InvoiceCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: Address;
  taxId?: string;
}

export interface InvoiceSender {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address: Address;
  taxId?: string;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  sender?: InvoiceSender;
  customerId?: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  discountType: DiscountType;
  discountValue: number;
  taxType: TaxType;
  taxRate: number;
  taxTitle?: string;
  deliveryCharge: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  brandKitSnapshot: BrandKit;
  payments: InvoicePayment[];
  pageFormat: PageFormat;
  createdAt: string;
  updatedAt: string;
}
