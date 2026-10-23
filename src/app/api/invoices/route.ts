import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { calculateInvoiceTotals } from '@/lib/calculations/engine';
import { Invoice } from '@/types/invoice';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const status = req.nextUrl.searchParams.get('status');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId query param is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['viewer', 'member', 'admin', 'owner']);

    const db = getAdminDb();
    let query = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('invoices')
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snap = await query.get();
    const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json(invoices);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch invoices';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();
    const { workspaceId, ...invoiceData } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    // Server-side recalculation using Decimal.js engine
    const calc = calculateInvoiceTotals({
      items: invoiceData.items || [],
      discountType: invoiceData.discountType || 'none',
      discountValue: invoiceData.discountValue || 0,
      taxType: invoiceData.taxType || 'none',
      taxRate: invoiceData.taxRate || 0,
      deliveryCharge: invoiceData.deliveryCharge || 0,
      payments: invoiceData.payments || [],
      dueDate: invoiceData.dueDate,
      currentStatus: invoiceData.status || 'draft'
    });

    const db = getAdminDb();
    const invoiceId = body.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      workspaceId,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      total: calc.total,
      amountPaid: calc.amountPaid,
      balanceDue: calc.balanceDue,
      status: invoiceData.status || calc.computedStatus,
      payments: invoiceData.payments || [],
      createdAt: now,
      updatedAt: now
    };

    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('invoices')
      .doc(invoiceId)
      .set(newInvoice);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save invoice';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
