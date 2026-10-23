import { localDb } from '@/lib/db/indexeddb';
import { Invoice, InvoicePayment } from '@/types/invoice';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';
import { workspaceRepo } from './workspace.repo';

export interface IInvoiceRepository {
  getInvoices(workspaceId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | null>;
  saveInvoice(invoice: Invoice): Promise<void>;
  createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>;
  duplicateInvoice(id: string): Promise<Invoice | null>;
  recordPayment(invoiceId: string, paymentData: Omit<InvoicePayment, 'id' | 'invoiceId' | 'createdAt'>): Promise<Invoice | null>;
  deleteInvoice(id: string): Promise<void>;
}

export class LocalInvoiceRepository implements IInvoiceRepository {
  async getInvoices(workspaceId: string): Promise<Invoice[]> {
    if (typeof window === 'undefined') return [];
    const all = await localDb.getAll<Invoice>('invoices');
    return all
      .filter((inv) => inv.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    if (typeof window === 'undefined') return null;
    return await localDb.get<Invoice>('invoices', id);
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    // Recalculate totals and status
    const calc = calculateInvoiceTotals({
      items: invoice.items,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      taxType: invoice.taxType,
      taxRate: invoice.taxRate,
      deliveryCharge: invoice.deliveryCharge,
      payments: invoice.payments,
      dueDate: invoice.dueDate,
      currentStatus: invoice.status
    });

    const updated: Invoice = {
      ...invoice,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      total: calc.total,
      amountPaid: calc.amountPaid,
      balanceDue: calc.balanceDue,
      status: calc.computedStatus,
      updatedAt: new Date().toISOString()
    };

    await localDb.put('invoices', updated);
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const calc = calculateInvoiceTotals({
      items: data.items,
      discountType: data.discountType,
      discountValue: data.discountValue,
      taxType: data.taxType,
      taxRate: data.taxRate,
      deliveryCharge: data.deliveryCharge,
      payments: data.payments,
      dueDate: data.dueDate,
      currentStatus: data.status
    });

    const invoice: Invoice = {
      ...data,
      id,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      total: calc.total,
      amountPaid: calc.amountPaid,
      balanceDue: calc.balanceDue,
      status: calc.computedStatus,
      createdAt: now,
      updatedAt: now
    };

    await localDb.put('invoices', invoice);

    // Increment workspace next invoice number if matched
    const ws = await workspaceRepo.getActiveWorkspace();
    if (ws && invoice.invoiceNumber.includes(String(ws.invoiceNumberNext))) {
      ws.invoiceNumberNext += 1;
      await workspaceRepo.saveWorkspace(ws);
    }

    return invoice;
  }

  async duplicateInvoice(id: string): Promise<Invoice | null> {
    const original = await this.getInvoice(id);
    if (!original) return null;

    const ws = await workspaceRepo.getActiveWorkspace();
    const nextNum = ws ? `${ws.invoiceNumberPrefix}${ws.invoiceNumberNext}` : `${original.invoiceNumber}-COPY`;

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 14);

    const duplicated: Invoice = {
      ...original,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceNumber: nextNum,
      status: 'draft',
      issueDate: today,
      dueDate: due.toISOString().split('T')[0],
      payments: [],
      amountPaid: 0,
      balanceDue: original.total,
      createdAt: now,
      updatedAt: now
    };

    await this.saveInvoice(duplicated);

    if (ws) {
      ws.invoiceNumberNext += 1;
      await workspaceRepo.saveWorkspace(ws);
    }

    return duplicated;
  }

  async recordPayment(
    invoiceId: string,
    paymentData: Omit<InvoicePayment, 'id' | 'invoiceId' | 'createdAt'>
  ): Promise<Invoice | null> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return null;

    const payment: InvoicePayment = {
      ...paymentData,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceId,
      createdAt: new Date().toISOString()
    };

    const updatedPayments = [...(invoice.payments || []), payment];
    const updatedInvoice: Invoice = {
      ...invoice,
      payments: updatedPayments,
      status: invoice.status === 'draft' ? 'issued' : invoice.status
    };

    await this.saveInvoice(updatedInvoice);
    return await this.getInvoice(invoiceId);
  }

  async deleteInvoice(id: string): Promise<void> {
    await localDb.delete('invoices', id);
  }
}

import { FirebaseInvoiceRepository } from './firebase/invoice.firebase';

export const invoiceRepo = new FirebaseInvoiceRepository();
