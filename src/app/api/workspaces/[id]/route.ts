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
    const { id: workspaceId } = await params;

    await authorizeWorkspaceAccess(user, workspaceId, ['viewer', 'member', 'admin', 'owner']);

    const db = getAdminDb();
    const wsDoc = await db.collection('workspaces').doc(workspaceId).get();

    if (!wsDoc.exists) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const brandKitSnap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('brandKits')
      .limit(1)
      .get();

    const brandKit = !brandKitSnap.empty ? brandKitSnap.docs[0].data() : null;

    return NextResponse.json({
      ...wsDoc.data(),
      brandKit
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch workspace';
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
    const { id: workspaceId } = await params;

    // Require admin or owner to update workspace settings
    await authorizeWorkspaceAccess(user, workspaceId, ['admin', 'owner']);

    const body = await req.json();
    const db = getAdminDb();
    const workspaceRef = db.collection('workspaces').doc(workspaceId);

    const updatedData = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Prevent overwriting internal security fields
    delete updatedData.id;
    delete updatedData.ownerId;
    delete updatedData.createdAt;

    await workspaceRef.update(updatedData);

    const fresh = await workspaceRef.get();
    return NextResponse.json({ id: fresh.id, ...fresh.data() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update workspace';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
