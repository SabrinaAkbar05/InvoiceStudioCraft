import { IWorkspaceRepository, LocalWorkspaceRepository } from '../workspace.repo';
import { Workspace } from '@/types/workspace';
import { BrandKit, DEFAULT_BRAND_KIT } from '@/types/brand';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export class FirebaseWorkspaceRepository implements IWorkspaceRepository {
  private localFallback = new LocalWorkspaceRepository();
  private memoryCache: Workspace | null = null;
  private lastRevalidateTime = 0;
  private isRevalidating = false;

  async getActiveWorkspace(): Promise<Workspace | null> {
    if (typeof window === 'undefined') return null;

    // 1. Fast Path: Return in-memory cache instantly (0ms)
    if (this.memoryCache) {
      this.revalidateInBackground();
      return this.memoryCache;
    }

    // 2. Local-first Path: Return IndexedDB cache immediately (2-5ms)
    const localWs = await this.localFallback.getActiveWorkspace();
    if (localWs) {
      this.memoryCache = localWs;
      this.revalidateInBackground();
      return localWs;
    }

    // 3. Cloud fetch if no local workspace exists yet
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let targetWsId = userDoc.exists() ? userDoc.data()?.defaultWorkspaceId : null;

      if (!targetWsId) {
        const ownedQuery = query(collection(db, 'workspaces'), where('ownerId', '==', user.uid));
        const ownedSnap = await getDocs(ownedQuery);
        if (!ownedSnap.empty) {
          targetWsId = ownedSnap.docs[0].id;
        }
      }

      if (targetWsId) {
        const wsDoc = await getDoc(doc(db, 'workspaces', targetWsId));
        if (wsDoc.exists()) {
          const cloudWs = { id: wsDoc.id, ...wsDoc.data() } as Workspace;
          this.memoryCache = cloudWs;
          await this.localFallback.saveWorkspace(cloudWs);
          return cloudWs;
        }
      }

      return null;
    } catch (err) {
      console.warn('[FirebaseWorkspaceRepository] Cloud fetch error, using local fallback:', err);
      return this.localFallback.getActiveWorkspace();
    }
  }

  /**
   * Revalidates workspace with Cloud Firestore in the background without blocking the UI
   */
  private async revalidateInBackground(): Promise<void> {
    const user = auth.currentUser;
    if (!user || this.isRevalidating) return;

    // Only revalidate at most once every 15 seconds
    const now = Date.now();
    if (now - this.lastRevalidateTime < 15000) return;

    this.isRevalidating = true;
    this.lastRevalidateTime = now;

    try {
      let targetWsId = this.memoryCache?.id;

      if (!targetWsId) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        targetWsId = userDoc.exists() ? userDoc.data()?.defaultWorkspaceId : null;
      }

      if (targetWsId) {
        const wsDoc = await getDoc(doc(db, 'workspaces', targetWsId));
        if (wsDoc.exists()) {
          const freshWs = { id: wsDoc.id, ...wsDoc.data() } as Workspace;
          this.memoryCache = freshWs;
          await this.localFallback.saveWorkspace(freshWs);
        }
      }
    } catch (err) {
      console.warn('[FirebaseWorkspaceRepository] Background revalidation warning:', err);
    } finally {
      this.isRevalidating = false;
    }
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const updated = { ...workspace, updatedAt: now };

    // Update memory and local IndexedDB instantly
    this.memoryCache = updated;
    await this.localFallback.saveWorkspace(updated);

    if (user && workspace.id) {
      try {
        const wsRef = doc(db, 'workspaces', workspace.id);
        const wsDoc = await getDoc(wsRef);
        if (wsDoc.exists()) {
          const currentOwner = wsDoc.data()?.ownerId || user.uid;
          await updateDoc(wsRef, {
            ...updated,
            ownerId: currentOwner
          });
        } else {
          await setDoc(wsRef, {
            ...updated,
            ownerId: user.uid,
            createdAt: now
          });
        }
      } catch (err) {
        console.error('[FirebaseWorkspaceRepository] Error syncing workspace to Firestore:', err);
        // Do not throw: local save is already safe and successful
      }
    }
  }

  async createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const user = auth.currentUser;
    const localWs = await this.localFallback.createWorkspace(data);

    this.memoryCache = localWs;

    if (user) {
      const now = new Date().toISOString();
      const wsRef = doc(db, 'workspaces', localWs.id);

      try {
        await setDoc(wsRef, {
          ...localWs,
          ownerId: user.uid,
          createdAt: now,
          updatedAt: now
        });

        // Initialize owner membership
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
      } catch (err) {
        console.error('[FirebaseWorkspaceRepository] Error syncing new workspace to Firestore:', err);
      }
    }

    return localWs;
  }

  async clearWorkspace(): Promise<void> {
    this.memoryCache = null;
    await this.localFallback.clearWorkspace();
  }
}
