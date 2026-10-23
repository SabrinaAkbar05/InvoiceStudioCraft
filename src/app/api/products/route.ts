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
      .collection('products')
      .orderBy('name', 'asc')
      .get();

    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(products);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();
    const { workspaceId, ...productData } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const db = getAdminDb();
    const productId = body.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newProduct = {
      ...productData,
      id: productId,
      workspaceId,
      createdAt: now,
      updatedAt: now
    };

    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('products')
      .doc(productId)
      .set(newProduct);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
