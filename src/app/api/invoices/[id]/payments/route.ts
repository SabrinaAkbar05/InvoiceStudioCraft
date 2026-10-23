import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';
import { InvoicePayment } from '@/types/invoice';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: invoiceId } = await params;
    const body = await req.json();
    const { workspaceId, amount, date, method, reference, note, idempotencyKey } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const db = getAdminDb();
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const invoiceRef = workspaceRef.collection('invoices').doc(invoiceId);

    const updatedInvoice = await db.runTransaction(async (transaction) => {
      const invDoc = await transaction.get(invoiceRef);
      if (!invDoc.exists) {
        throw new Error('Invoice not found');
      }

      const invoiceData = invDoc.data() || {};
      const existingPayments: InvoicePayment[] = invoiceData.payments || [];

      // Idempotency check: if reference or idempotencyKey matches recent payment, reject duplicate
      if (idempotencyKey) {
        const duplicate = existingPayments.find(
          (p) => (p as any).idempotencyKey === idempotencyKey
        );
        if (duplicate) {
          return invoiceData;
        }
      }

      const now = new Date().toISOString();
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newPayment: InvoicePayment = {
        id: paymentId,
        invoiceId,
        amount: Number(amount),
        date: date || now.split('T')[0],
        method: method || 'bank_transfer',
        reference: reference || '',
        note: note || '',
        createdAt: now
      };
      if (idempotencyKey) {
        (newPayment as any).idempotencyKey = idempotencyKey;
      }

      const allPayments = [...existingPayments, newPayment];

      // Decimal-safe calculations
      const calc = calculateInvoiceTotals({
        items: invoiceData.items || [],
        discountType: invoiceData.discountType || 'none',
        discountValue: invoiceData.discountValue || 0,
        taxType: invoiceData.taxType || 'none',
        taxRate: invoiceData.taxRate || 0,
        deliveryCharge: invoiceData.deliveryCharge || 0,
        payments: allPayments,
        dueDate: invoiceData.dueDate,
        currentStatus: invoiceData.status || 'issued'
      });

      const updated = {
        ...invoiceData,
        payments: allPayments,
        amountPaid: calc.amountPaid,
        balanceDue: calc.balanceDue,
        status: invoiceData.status === 'draft' ? 'issued' : calc.computedStatus,
        updatedAt: now
      };

      transaction.set(invoiceRef, updated);

      // Record in workspace-level payments subcollection
      const wsPaymentRef = workspaceRef.collection('payments').doc(paymentId);
      transaction.set(wsPaymentRef, {
        ...newPayment,
        workspaceId,
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customer?.name || ''
      });

      // Audit event
      const auditRef = workspaceRef.collection('auditEvents').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        workspaceId,
        eventType: 'payment.recorded',
        invoiceId,
        paymentId,
        amount: Number(amount),
        performedBy: user.uid,
        timestamp: now
      });

      return updated;
    });

    return NextResponse.json(updatedInvoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record payment';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
