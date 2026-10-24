import 'server-only';
import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { WorkspaceRole } from '@/types/auth';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isPlatformAdmin: boolean;
}

export interface WorkspacePermissionContext {
  user: AuthenticatedUser;
  workspaceId: string;
  role: WorkspaceRole;
  isOwner: boolean;
  isAdmin: boolean;
}

/**
 * Extracts and verifies the Firebase ID token from the Authorization header
 */
export async function authenticateServerRequest(req: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    throw new Error('Unauthorized: Bearer token is empty');
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);

    // Platform admin check based on optional FIREBASE_ADMIN_UIDS
    const adminUids = (process.env.FIREBASE_ADMIN_UIDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const isPlatformAdmin = adminUids.includes(decoded.uid);

    return {
      uid: decoded.uid,
      email: decoded.email || null,
      emailVerified: !!decoded.email_verified,
      isPlatformAdmin
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    throw new Error(`Unauthorized: ${message}`);
  }
}

/**
 * Verifies that the user has authorized membership/role within the given workspace.
 */
export async function authorizeWorkspaceAccess(
  user: AuthenticatedUser,
  workspaceId: string,
  requiredRoles: WorkspaceRole[] = ['viewer', 'member', 'admin', 'owner']
): Promise<WorkspacePermissionContext> {
  if (!workspaceId) {
    throw new Error('Bad Request: workspaceId is required');
  }

  // Platform admins have access to all workspaces
  if (user.isPlatformAdmin) {
    return {
      user,
      workspaceId,
      role: 'owner',
      isOwner: true,
      isAdmin: true
    };
  }

  const db = getAdminDb();
  const workspaceRef = db.collection('workspaces').doc(workspaceId);
  const workspaceSnap = await workspaceRef.get();

  if (!workspaceSnap.exists) {
    // If workspace does not exist in Firestore yet, automatically bootstrap it for the authenticated creator
    const now = new Date().toISOString();
    await workspaceRef.set({
      id: workspaceId,
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // Also add member record
    await workspaceRef.collection('members').doc(user.uid).set({
      userId: user.uid,
      email: user.email,
      role: 'owner',
      joinedAt: now
    }, { merge: true });

    return {
      user,
      workspaceId,
      role: 'owner',
      isOwner: true,
      isAdmin: true
    };
  }

  const wsData = workspaceSnap.data() || {};

  // Check if user is the direct workspace owner
  if (wsData.ownerId === user.uid) {
    return {
      user,
      workspaceId,
      role: 'owner',
      isOwner: true,
      isAdmin: true
    };
  }

  // Check membership subcollection
  const memberSnap = await workspaceRef.collection('members').doc(user.uid).get();
  if (!memberSnap.exists) {
    throw new Error('Forbidden: You are not a member of this workspace');
  }

  const memberData = memberSnap.data() || {};
  const role = (memberData.role || 'viewer') as WorkspaceRole;

  if (!requiredRoles.includes(role)) {
    throw new Error(`Forbidden: Insufficient privileges. Required one of: ${requiredRoles.join(', ')}`);
  }

  return {
    user,
    workspaceId,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin'
  };
}
