import { IBrandRepository, LocalBrandRepository } from '../brand.repo';
import { BrandKit, DEFAULT_BRAND_KIT } from '@/types/brand';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';

export class FirebaseBrandRepository implements IBrandRepository {
  private localFallback = new LocalBrandRepository();

  async getBrandKit(workspaceId: string): Promise<BrandKit | null> {
    if (typeof window === 'undefined') return null;

    const user = auth.currentUser;
    if (!user || !workspaceId) {
      return this.localFallback.getBrandKit(workspaceId);
    }

    try {
      const q = query(collection(db, 'workspaces', workspaceId, 'brandKits'), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const kit = { id: snap.docs[0].id, ...snap.docs[0].data() } as BrandKit;
        // Keep local cache synced
        await this.localFallback.saveBrandKit(kit);
        return kit;
      }

      return this.localFallback.getBrandKit(workspaceId);
    } catch (err) {
      console.warn('[FirebaseBrandRepository] Fallback to local on error:', err);
      return this.localFallback.getBrandKit(workspaceId);
    }
  }

  async saveBrandKit(brandKit: BrandKit): Promise<void> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const updated = { ...brandKit, updatedAt: now };

    // Always save locally
    await this.localFallback.saveBrandKit(updated);

    if (user && brandKit.workspaceId) {
      try {
        const brandKitId = brandKit.id || `bk_${brandKit.workspaceId}`;
        const ref = doc(db, 'workspaces', brandKit.workspaceId, 'brandKits', brandKitId);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.error('[FirebaseBrandRepository] Failed to save brand kit to Firestore:', err);
        throw err;
      }
    }
  }
}
