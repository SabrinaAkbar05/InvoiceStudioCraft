import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { DEFAULT_BRAND_KIT } from '@/types/brand';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const db = getAdminDb();

    // Query workspaces where user is the owner
    const ownedSnapshot = await db.collection('workspaces').where('ownerId', '==', user.uid).get();
    const workspaces: any[] = [];

    ownedSnapshot.forEach((doc) => {
      workspaces.push({ id: doc.id, ...doc.data() });
    });

    // Also query membership collectionGroup if user was invited to other workspaces
    const memberSnapshot = await db.collectionGroup('members').where('userId', '==', user.uid).get();
    for (const memberDoc of memberSnapshot.docs) {
      const parentWorkspace = memberDoc.ref.parent.parent;
      if (parentWorkspace && !workspaces.some((w) => w.id === parentWorkspace.id)) {
        const wsDoc = await parentWorkspace.get();
        if (wsDoc.exists) {
          workspaces.push({ id: wsDoc.id, ...wsDoc.data() });
        }
      }
    }

    return NextResponse.json(workspaces);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch workspaces';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();

    const db = getAdminDb();
    const now = new Date().toISOString();

    const workspaceId = body.id || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const workspaceRef = db.collection('workspaces').doc(workspaceId);

    const workspaceData = {
      ...body,
      id: workspaceId,
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now
    };

    // Use a batch to write workspace, owner membership, and default brand kit atomically
    const batch = db.batch();

    batch.set(workspaceRef, workspaceData);

    const memberRef = workspaceRef.collection('members').doc(user.uid);
    batch.set(memberRef, {
      userId: user.uid,
      email: user.email,
      role: 'owner',
      joinedAt: now
    });

    const brandKitRef = workspaceRef.collection('brandKits').doc(`bk_${workspaceId}`);
    batch.set(brandKitRef, {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${workspaceId}`,
      workspaceId,
      updatedAt: now
    });

    // Also update user's default workspace in their user profile
    const userRef = db.collection('users').doc(user.uid);
    batch.set(userRef, { defaultWorkspaceId: workspaceId, updatedAt: now }, { merge: true });

    await batch.commit();

    return NextResponse.json(workspaceData, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create workspace';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
