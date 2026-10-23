import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';

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
    const snap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('customers')
      .orderBy('name', 'asc')
      .get();

    const customers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(customers);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch customers';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();
    const { workspaceId, ...customerData } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const db = getAdminDb();
    const customerId = body.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newCustomer = {
      ...customerData,
      id: customerId,
      workspaceId,
      createdAt: now,
      updatedAt: now
    };

    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('customers')
      .doc(customerId)
      .set(newCustomer);

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create customer';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
