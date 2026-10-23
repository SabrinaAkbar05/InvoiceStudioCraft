import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_BRAND_KIT } from '@/types/brand';

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
    const brandKitsRef = db.collection('workspaces').doc(workspaceId).collection('brandKits');
    const snapshot = await brandKitsRef.limit(1).get();

    if (snapshot.empty) {
      const fallback = {
        ...DEFAULT_BRAND_KIT,
        id: `bk_${workspaceId}`,
        workspaceId,
        updatedAt: new Date().toISOString()
      };
      await brandKitsRef.doc(fallback.id).set(fallback);
      return NextResponse.json(fallback);
    }

    return NextResponse.json({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch brand kit';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateServerRequest(req);
    const { id: workspaceId } = await params;

    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    const body = await req.json();
    const db = getAdminDb();
    const brandKitId = body.id || `bk_${workspaceId}`;
    const brandKitRef = db.collection('workspaces').doc(workspaceId).collection('brandKits').doc(brandKitId);

    const dataToSave = {
      ...body,
      id: brandKitId,
      workspaceId,
      updatedAt: new Date().toISOString()
    };

    await brandKitRef.set(dataToSave, { merge: true });

    return NextResponse.json(dataToSave);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save brand kit';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
