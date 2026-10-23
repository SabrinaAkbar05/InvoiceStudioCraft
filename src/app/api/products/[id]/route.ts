import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: productId } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId query param is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['viewer', 'member', 'admin', 'owner']);

    const db = getAdminDb();
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('products')
      .doc(productId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch product';
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
    const { id: productId } = await params;
    const body = await req.json();
    const { workspaceId, ...updates } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const db = getAdminDb();
    const docRef = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('products')
      .doc(productId);

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    delete updatedData.id;
    delete updatedData.workspaceId;
    delete updatedData.createdAt;

    await docRef.update(updatedData);

    const fresh = await docRef.get();
    return NextResponse.json({ id: fresh.id, ...fresh.data() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product';
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
    const { id: productId } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId query param is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['admin', 'owner']);

    const db = getAdminDb();
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('products')
      .doc(productId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
