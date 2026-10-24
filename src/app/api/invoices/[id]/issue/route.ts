import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';
import { DEFAULT_BRAND_KIT } from '@/types/brand';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: invoiceId } = await params;
    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const db = getAdminDb();
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const invoiceRef = workspaceRef.collection('invoices').doc(invoiceId);
    const brandKitSnap = await workspaceRef.collection('brandKits').limit(1).get();
    const brandKitData = !brandKitSnap.empty
      ? brandKitSnap.docs[0].data()
      : { ...DEFAULT_BRAND_KIT, id: `bk_${workspaceId}`, workspaceId };

    // Transaction for atomic invoice numbering and issuance
    const issuedInvoice = await db.runTransaction(async (transaction) => {
      const wsDoc = await transaction.get(workspaceRef);
      if (!wsDoc.exists) {
        throw new Error('Workspace not found');
      }

      const invDoc = await transaction.get(invoiceRef);
      const incomingInvoice = body.invoice || (body.items ? body : null);
      if (!invDoc.exists && !incomingInvoice) {
        throw new Error('Invoice not found and no invoice data provided in payload');
      }

      const invoiceData = invDoc.exists ? (invDoc.data() || {}) : { ...incomingInvoice, id: invoiceId, workspaceId };
      const wsData = wsDoc.data() || {};

      // If already issued, return existing
      if (invDoc.exists && invoiceData.status && invoiceData.status !== 'draft') {
        return invoiceData;
      }

      const prefix = wsData.invoiceNumberPrefix || 'INV-';
      const nextNum = wsData.invoiceNumberNext || 1001;
      const allocatedInvoiceNumber = `${prefix}${nextNum}`;

      // Recalculate totals server-side
      const calc = calculateInvoiceTotals({
        items: invoiceData.items || [],
        discountType: invoiceData.discountType || 'none',
        discountValue: invoiceData.discountValue || 0,
        taxType: invoiceData.taxType || 'none',
        taxRate: invoiceData.taxRate || 0,
        deliveryCharge: invoiceData.deliveryCharge || 0,
        payments: invoiceData.payments || [],
        dueDate: invoiceData.dueDate,
        currentStatus: 'issued'
      });

      const now = new Date().toISOString();
      const updatedInvoice = {
        ...invoiceData,
        invoiceNumber: allocatedInvoiceNumber,
        status: calc.computedStatus === 'draft' ? 'issued' : calc.computedStatus,
        subtotal: calc.subtotal,
        discountTotal: calc.discountTotal,
        taxTotal: calc.taxTotal,
        total: calc.total,
        amountPaid: calc.amountPaid,
        balanceDue: calc.balanceDue,
        brandKitSnapshot: brandKitData,
        issueDate: invoiceData.issueDate || now.split('T')[0],
        updatedAt: now
      };

      // Increment next invoice number
      transaction.update(workspaceRef, {
        invoiceNumberNext: nextNum + 1,
        updatedAt: now
      });

      // Update invoice document
      transaction.set(invoiceRef, updatedInvoice);

      // Record audit event
      const auditRef = workspaceRef.collection('auditEvents').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        workspaceId,
        eventType: 'invoice.issued',
        invoiceId,
        invoiceNumber: allocatedInvoiceNumber,
        performedBy: user.uid,
        timestamp: now
      });

      return updatedInvoice;
    });

    return NextResponse.json(issuedInvoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to issue invoice';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
