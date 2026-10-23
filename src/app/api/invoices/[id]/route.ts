import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: invoiceId } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId query param is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['viewer', 'member', 'admin', 'owner']);

    const db = getAdminDb();
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('invoices')
      .doc(invoiceId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch invoice';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: invoiceId } = await params;
    const body = await req.json();
    const { workspaceId, ...updates } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const db = getAdminDb();
    const invoiceRef = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('invoices')
      .doc(invoiceId);

    const existingSnap = await invoiceRef.get();
    if (!existingSnap.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentData = existingSnap.data() || {};
    const merged = { ...currentData, ...updates };

    // Recalculate totals
    const calc = calculateInvoiceTotals({
      items: merged.items || [],
      discountType: merged.discountType || 'none',
      discountValue: merged.discountValue || 0,
      taxType: merged.taxType || 'none',
      taxRate: merged.taxRate || 0,
      deliveryCharge: merged.deliveryCharge || 0,
      payments: merged.payments || [],
      dueDate: merged.dueDate,
      currentStatus: merged.status || 'draft'
    });

    const updatedInvoice = {
      ...merged,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      total: calc.total,
      amountPaid: calc.amountPaid,
      balanceDue: calc.balanceDue,
      status: merged.status === 'draft' ? 'draft' : calc.computedStatus,
      updatedAt: new Date().toISOString()
    };

    delete updatedInvoice.id;
    delete updatedInvoice.workspaceId;
    delete updatedInvoice.createdAt;

    await invoiceRef.update(updatedInvoice);

    return NextResponse.json({ id: invoiceId, workspaceId, ...updatedInvoice });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update invoice';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: invoiceId } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId query param is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['admin', 'owner']);

    const db = getAdminDb();
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('invoices')
      .doc(invoiceId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete invoice';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
