import { IWorkspaceRepository, LocalWorkspaceRepository } from '../workspace.repo';
import { Workspace } from '@/types/workspace';
import { BrandKit, DEFAULT_BRAND_KIT } from '@/types/brand';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export class FirebaseWorkspaceRepository implements IWorkspaceRepository {
  private localFallback = new LocalWorkspaceRepository();

  async getActiveWorkspace(): Promise<Workspace | null> {
    if (typeof window === 'undefined') return null;

    const user = auth.currentUser;
    if (!user) {
      return this.localFallback.getActiveWorkspace();
    }

    try {
      // 1. Check user profile's defaultWorkspaceId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let targetWsId = userDoc.exists() ? userDoc.data()?.defaultWorkspaceId : null;

      if (!targetWsId) {
        // Query owned workspaces
        const ownedQuery = query(collection(db, 'workspaces'), where('ownerId', '==', user.uid));
        const ownedSnap = await getDocs(ownedQuery);
        if (!ownedSnap.empty) {
          targetWsId = ownedSnap.docs[0].id;
        }
      }

      if (targetWsId) {
        const wsDoc = await getDoc(doc(db, 'workspaces', targetWsId));
        if (wsDoc.exists()) {
          return { id: wsDoc.id, ...wsDoc.data() } as Workspace;
        }
      }

      // If user has no cloud workspace yet, check if there's local data to offer
      return this.localFallback.getActiveWorkspace();
    } catch (err) {
      console.warn('[FirebaseWorkspaceRepository] Fallback to local DB on error:', err);
      return this.localFallback.getActiveWorkspace();
    }
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const updated = { ...workspace, updatedAt: now };

    // Always keep local DB synced
    await this.localFallback.saveWorkspace(updated);

    if (user && workspace.id) {
      try {
        const wsRef = doc(db, 'workspaces', workspace.id);
        const wsDoc = await getDoc(wsRef);
        if (wsDoc.exists()) {
          await updateDoc(wsRef, {
            ...updated,
            ownerId: wsDoc.data()?.ownerId || user.uid
          });
        } else {
          await setDoc(wsRef, {
            ...updated,
            ownerId: user.uid,
            createdAt: now
          });
        }
      } catch (err) {
        console.error('[FirebaseWorkspaceRepository] Failed to save workspace to Firestore:', err);
        throw err;
      }
    }
  }

  async createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const user = auth.currentUser;
    const localWs = await this.localFallback.createWorkspace(data);

    if (user) {
      const now = new Date().toISOString();
      const wsRef = doc(db, 'workspaces', localWs.id);

      await setDoc(wsRef, {
        ...localWs,
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now
      });

      // Initialize member
      const memberRef = doc(db, 'workspaces', localWs.id, 'members', user.uid);
      await setDoc(memberRef, {
        userId: user.uid,
        email: user.email,
        role: 'owner',
        joinedAt: now
      });

      // Initialize brand kit in Firestore
      const brandKit: BrandKit = {
        ...DEFAULT_BRAND_KIT,
        id: `bk_${localWs.id}`,
        workspaceId: localWs.id,
        updatedAt: now
      };
      await setDoc(doc(db, 'workspaces', localWs.id, 'brandKits', brandKit.id), brandKit);

      // Set user profile default workspace
      await setDoc(
        doc(db, 'users', user.uid),
        { defaultWorkspaceId: localWs.id, updatedAt: now },
        { merge: true }
      );
    }

    return localWs;
  }

  async clearWorkspace(): Promise<void> {
    await this.localFallback.clearWorkspace();
  }
}
