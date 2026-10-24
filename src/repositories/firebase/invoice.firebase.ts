import { IInvoiceRepository, LocalInvoiceRepository } from '../invoice.repo';
import { Invoice, InvoicePayment } from '@/types/invoice';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';

export class FirebaseInvoiceRepository implements IInvoiceRepository {
  private localFallback = new LocalInvoiceRepository();

  async getInvoices(workspaceId: string): Promise<Invoice[]> {
    if (typeof window === 'undefined') return [];

    // 1. Fast Path: Return locally cached invoices immediately (< 5ms)
    const localInvoices = await this.localFallback.getInvoices(workspaceId);

    const user = auth.currentUser;
    if (!user || !workspaceId) {
      return localInvoices;
    }

    // 2. Asynchronously revalidate from Firestore
    try {
      const q = query(
        collection(db, 'workspaces', workspaceId, 'invoices'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);

      const cloudInvoices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice));

      // Batch sync to local IndexedDB in parallel without blocking UI
      Promise.all(cloudInvoices.map((inv) => this.localFallback.saveInvoice(inv))).catch((err) =>
        console.warn('[FirebaseInvoiceRepository] Warning caching cloud invoices:', err)
      );

      // If local cache was empty or cloud has newer data, return cloud list
      if (localInvoices.length === 0 || cloudInvoices.length > 0) {
        return cloudInvoices;
      }

      return localInvoices;
    } catch (err) {
      console.warn('[FirebaseInvoiceRepository] Firestore fetch error, returning local cache:', err);
      return localInvoices;
    }
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    if (typeof window === 'undefined') return null;

    const user = auth.currentUser;
    const local = await this.localFallback.getInvoice(id);

    if (local && local.workspaceId) {
      if (!user) return local;

      // Background check
      const ref = doc(db, 'workspaces', local.workspaceId, 'invoices', id);
      getDoc(ref).then(async (snap) => {
        if (snap.exists()) {
          const cloudInv = { id: snap.id, ...snap.data() } as Invoice;
          await this.localFallback.saveInvoice(cloudInv);
        }
      }).catch(() => {});

      return local;
    }

    // If not found locally, fetch from cloud
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const wsId = userDoc.exists() ? userDoc.data()?.defaultWorkspaceId : null;
        if (wsId) {
          const ref = doc(db, 'workspaces', wsId, 'invoices', id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const cloudInv = { id: snap.id, ...snap.data() } as Invoice;
            await this.localFallback.saveInvoice(cloudInv);
            return cloudInv;
          }
        }
      } catch (err) {
        console.warn('[FirebaseInvoiceRepository] Error fetching invoice from cloud:', err);
      }
    }

    return local;
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

    // Save locally first so the user's data is never lost
    await this.localFallback.saveInvoice(updated);

    // Sync to Cloud Firestore
    if (user && updated.workspaceId && updated.workspaceId !== 'ws_current' && updated.id) {
      try {
        const ref = doc(db, 'workspaces', updated.workspaceId, 'invoices', updated.id);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Warning: Failed to sync invoice to Firestore:', err);
      }
    }
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const user = auth.currentUser;
    const local = await this.localFallback.createInvoice(data);

    if (user && local.workspaceId && local.workspaceId !== 'ws_current') {
      try {
        const ref = doc(db, 'workspaces', local.workspaceId, 'invoices', local.id);
        await setDoc(ref, local);

        // Advance next invoice number in workspace if needed
        const wsRef = doc(db, 'workspaces', local.workspaceId);
        const wsSnap = await getDoc(wsRef);
        if (wsSnap.exists()) {
          const wsData = wsSnap.data();
          const currentNext = wsData.invoiceNumberNext || 1001;
          if (local.invoiceNumber && local.invoiceNumber.includes(String(currentNext))) {
            await setDoc(wsRef, { invoiceNumberNext: currentNext + 1, updatedAt: new Date().toISOString() }, { merge: true });
          }
        }
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Error saving created invoice to Firestore:', err);
      }
    }

    return local;
  }

  async issueInvoice(id: string): Promise<Invoice | null> {
    const issued = await this.localFallback.issueInvoice(id);
    if (!issued) return null;

    const user = auth.currentUser;
    if (user && issued.workspaceId && issued.workspaceId !== 'ws_current') {
      try {
        const ref = doc(db, 'workspaces', issued.workspaceId, 'invoices', issued.id);
        await setDoc(ref, issued, { merge: true });

        // Record audit event
        const auditRef = doc(collection(db, 'workspaces', issued.workspaceId, 'auditEvents'));
        await setDoc(auditRef, {
          id: auditRef.id,
          workspaceId: issued.workspaceId,
          eventType: 'invoice.issued',
          invoiceId: issued.id,
          invoiceNumber: issued.invoiceNumber,
          performedBy: user.uid,
          timestamp: issued.updatedAt
        });
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Cloud sync warning on invoice issue:', err);
      }
    }

    return issued;
  }

  async duplicateInvoice(id: string): Promise<Invoice | null> {
    const duplicated = await this.localFallback.duplicateInvoice(id);
    if (!duplicated) return null;

    const user = auth.currentUser;
    if (user && duplicated.workspaceId && duplicated.workspaceId !== 'ws_current') {
      try {
        const ref = doc(db, 'workspaces', duplicated.workspaceId, 'invoices', duplicated.id);
        await setDoc(ref, duplicated);
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Error syncing duplicated invoice:', err);
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
    if (user && updated.workspaceId && updated.workspaceId !== 'ws_current') {
      try {
        const ref = doc(db, 'workspaces', updated.workspaceId, 'invoices', invoiceId);
        await setDoc(ref, updated, { merge: true });

        // Also add payment doc in workspace payments subcollection
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
        console.error('[FirebaseInvoiceRepository] Error syncing recorded payment:', err);
      }
    }

    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    const user = auth.currentUser;
    let existing = await this.localFallback.getInvoice(id);
    if (!existing && user) {
      existing = await this.getInvoice(id);
    }

    await this.localFallback.deleteInvoice(id);

    if (user && existing && existing.workspaceId && existing.workspaceId !== 'ws_current') {
      try {
        const ref = doc(db, 'workspaces', existing.workspaceId, 'invoices', id);
        await deleteDoc(ref);
      } catch (err) {
        console.error('[FirebaseInvoiceRepository] Error deleting invoice from Firestore:', err);
      }
    }
  }
}
