import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import Decimal from 'decimal.js';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId query param is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['viewer', 'member', 'admin', 'owner']);

    const db = getAdminDb();
    const wsRef = db.collection('workspaces').doc(workspaceId);

    // Fetch invoices, customers, and payments in parallel
    const [invoicesSnap, customersCountSnap, productsCountSnap] = await Promise.all([
      wsRef.collection('invoices').orderBy('createdAt', 'desc').get(),
      wsRef.collection('customers').count().get(),
      wsRef.collection('products').count().get()
    ]);

    let totalInvoiced = new Decimal(0);
    let totalReceived = new Decimal(0);
    let outstandingBalance = new Decimal(0);
    let overdueAmount = new Decimal(0);

    const statusCounts: Record<string, number> = {
      draft: 0,
      issued: 0,
      partially_paid: 0,
      paid: 0,
      overdue: 0,
      voided: 0
    };

    const recentInvoices: any[] = [];
    const allPayments: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    invoicesSnap.forEach((doc) => {
      const inv = { id: doc.id, ...doc.data() } as any;

      if (recentInvoices.length < 5) {
        recentInvoices.push(inv);
      }

      const status = inv.status || 'draft';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Extract payments
      if (Array.isArray(inv.payments)) {
        for (const p of inv.payments) {
          allPayments.push({
            ...p,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customer?.name || ''
          });
        }
      }

      if (status !== 'draft' && status !== 'voided') {
        totalInvoiced = totalInvoiced.plus(inv.total || 0);
        totalReceived = totalReceived.plus(inv.amountPaid || 0);
        outstandingBalance = outstandingBalance.plus(inv.balanceDue || 0);

        if (inv.dueDate && inv.dueDate < today && (inv.balanceDue || 0) > 0) {
          overdueAmount = overdueAmount.plus(inv.balanceDue || 0);
        }
      }
    });

    // Sort recent payments
    const recentPayments = allPayments
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      totalInvoiced: totalInvoiced.toNumber(),
      totalReceived: totalReceived.toNumber(),
      outstandingBalance: outstandingBalance.toNumber(),
      overdueAmount: overdueAmount.toNumber(),
      customerCount: customersCountSnap.data().count,
      productCount: productsCountSnap.data().count,
      totalInvoicesCount: invoicesSnap.size,
      statusCounts,
      recentInvoices,
      recentPayments
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
