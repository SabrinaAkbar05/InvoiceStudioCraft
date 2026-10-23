import { IInvoiceRepository, LocalInvoiceRepository } from '../invoice.repo';
import { Invoice, InvoicePayment } from '@/types/invoice';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, orderBy, query, runTransaction } from 'firebase/firestore';

export class FirebaseInvoiceRepository implements IInvoiceRepository {
  private localFallback = new LocalInvoiceRepository();

  async getInvoices(workspaceId: string): Promise<Invoice[]> {
    if (typeof window === 'undefined') return [];

    const user = auth.currentUser;
    if (!user || !workspaceId) {
      return this.localFallback.getInvoices(workspaceId);
    }

    try {
      const q = query(
        collection(db, 'workspaces', workspaceId, 'invoices'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);

      const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));

      // Cache locally
      for (const inv of invoices) {
        await this.localFallback.saveInvoice(inv);
      }

      return invoices;
    } catch (err) {
      console.warn('[FirebaseInvoiceRepository] Fallback to local on error:', err);
      return this.localFallback.getInvoices(workspaceId);
    }
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    if (typeof window === 'undefined') return null;

    const user = auth.currentUser;
    const local = await this.localFallback.getInvoice(id);

    if (!user || !local || !local.workspaceId) {
      return local;
    }

    try {
      const ref = doc(db, 'workspaces', local.workspaceId, 'invoices', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const cloudInv = { id: snap.id, ...snap.data() } as Invoice;
        await this.localFallback.saveInvoice(cloudInv);
        return cloudInv;
      }
      return local;
    } catch (err) {
      return local;
    }
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    const user = auth.currentUser;

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
      status: invoice.status === 'draft' ? 'draft' : calc.computedStatus,
      updatedAt: new Date().toISOString()
    };

    // Keep local DB updated
    await this.localFallback.saveInvoice(updated);

    if (user && updated.workspaceId && updated.id) {
      try {
        const ref = doc(db, 'workspaces', updated.workspaceId, 'invoices', updated.id);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Failed to save invoice to Firestore:', err);
        throw err;
      }
    }
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const user = auth.currentUser;
    const local = await this.localFallback.createInvoice(data);

    if (user && local.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', local.workspaceId, 'invoices', local.id);
        await setDoc(ref, local);

        // Update next invoice number in workspace
        const wsRef = doc(db, 'workspaces', local.workspaceId);
        const wsSnap = await getDoc(wsRef);
        if (wsSnap.exists()) {
          const wsData = wsSnap.data();
          if (local.invoiceNumber.includes(String(wsData.invoiceNumberNext))) {
            await setDoc(wsRef, { invoiceNumberNext: (wsData.invoiceNumberNext || 1001) + 1 }, { merge: true });
          }
        }
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Failed to create invoice in Firestore:', err);
      }
    }

    return local;
  }

  async duplicateInvoice(id: string): Promise<Invoice | null> {
    const duplicated = await this.localFallback.duplicateInvoice(id);
    if (!duplicated) return null;

    const user = auth.currentUser;
    if (user && duplicated.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', duplicated.workspaceId, 'invoices', duplicated.id);
        await setDoc(ref, duplicated);
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Failed to sync duplicated invoice to Firestore:', err);
      }
    }

    return duplicated;
  }

  async recordPayment(
    invoiceId: string,
    paymentData: Omit<InvoicePayment, 'id' | 'invoiceId' | 'createdAt'>
  ): Promise<Invoice | null> {
    const updated = await this.localFallback.recordPayment(invoiceId, paymentData);
    if (!updated) return null;

    const user = auth.currentUser;
    if (user && updated.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', updated.workspaceId, 'invoices', invoiceId);
        await setDoc(ref, updated, { merge: true });

        // Also add payment doc
        const latestPayment = updated.payments[updated.payments.length - 1];
        if (latestPayment) {
          const payRef = doc(db, 'workspaces', updated.workspaceId, 'payments', latestPayment.id);
          await setDoc(payRef, {
            ...latestPayment,
            workspaceId: updated.workspaceId,
            invoiceNumber: updated.invoiceNumber,
            customerName: updated.customer?.name || ''
          });
        }
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Failed to sync payment to Firestore:', err);
      }
    }

    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    const user = auth.currentUser;
    const existing = await this.localFallback.getInvoice(id);

    await this.localFallback.deleteInvoice(id);

    if (user && existing && existing.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', existing.workspaceId, 'invoices', id);
        await deleteDoc(ref);
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Failed to delete invoice from Firestore:', err);
      }
    }
  }
}
