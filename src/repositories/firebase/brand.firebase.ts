import { IBrandRepository, LocalBrandRepository } from '../brand.repo';
import { BrandKit, DEFAULT_BRAND_KIT } from '@/types/brand';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * Sanitizes object by removing any properties with undefined values
 * which would otherwise cause Firestore modular SDK to throw an error.
 */
function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

export class FirebaseBrandRepository implements IBrandRepository {
  private localFallback = new LocalBrandRepository();

  async getBrandKit(workspaceId: string): Promise<BrandKit | null> {
    if (typeof window === 'undefined') return null;

    // 1. Fast local cache path (< 5ms)
    const localKit = await this.localFallback.getBrandKit(workspaceId);

    const user = auth.currentUser;
    if (!user || !workspaceId || workspaceId === 'ws_current') {
      return localKit;
    }

    // 2. Fetch fresh Brand Kit from Firestore
    try {
      const q = query(collection(db, 'workspaces', workspaceId, 'brandKits'), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const cloudKit = { id: snap.docs[0].id, ...snap.docs[0].data() } as BrandKit;
        
        // Preserve local data URLs if cloud only has URLs
        const mergedKit: BrandKit = {
          ...cloudKit,
          logoDataUrl: localKit?.logoDataUrl || cloudKit.logoDataUrl,
          signatureDataUrl: localKit?.signatureDataUrl || cloudKit.signatureDataUrl
        };

        await this.localFallback.saveBrandKit(mergedKit);
        return mergedKit;
      }

      // If no brand kit document in Firestore yet, bootstrap with local or default
      if (localKit) {
        const brandKitId = localKit.id || `bk_${workspaceId}`;
        const ref = doc(db, 'workspaces', workspaceId, 'brandKits', brandKitId);
        const cleanPayload = sanitizeFirestorePayload({
          ...localKit,
          id: brandKitId,
          workspaceId,
          updatedAt: new Date().toISOString()
        });
        setDoc(ref, cleanPayload, { merge: true }).catch(() => {});
      }

      return localKit;
    } catch (err) {
      console.warn('[FirebaseBrandRepository] Cloud fetch error, using local fallback:', err);
      return localKit;
    }
  }

  async saveBrandKit(brandKit: BrandKit): Promise<void> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    
    // Resolve target workspace ID
    let targetWsId = brandKit.workspaceId;
    if (!targetWsId || targetWsId === 'ws_current') {
      // Avoid writing placeholder workspace ID to Firestore
      throw new Error('Valid workspace ID is required to save Brand Kit. Please wait for workspace to initialize.');
    }

    const brandKitId = brandKit.id || `bk_${targetWsId}`;
    const updated: BrandKit = {
      ...brandKit,
      id: brandKitId,
      workspaceId: targetWsId,
      updatedAt: now
    };

    // 1. Always save full data locally in IndexedDB first (guarantees zero user data loss)
    await this.localFallback.saveBrandKit(updated);

    // 2. Sync to Cloud Firestore if user is authenticated
    if (user && targetWsId && targetWsId !== 'ws_current') {
      // Prepare sanitized cloud payload:
      // If logoUrl / signatureUrl exists from Cloudinary, don't store multi-MB base64 data URLs in Firestore
      const cloudData = { ...updated };
      if (cloudData.logoUrl && cloudData.logoDataUrl && cloudData.logoDataUrl.length > 100000) {
        delete cloudData.logoDataUrl; // Saved in IndexedDB, omit from Firestore to keep doc lean
      }
      if (cloudData.signatureUrl && cloudData.signatureDataUrl && cloudData.signatureDataUrl.length > 100000) {
        delete cloudData.signatureDataUrl;
      }

      const cleanPayload = sanitizeFirestorePayload(cloudData);

      try {
        // Primary path: Direct client Firestore write
        const ref = doc(db, 'workspaces', targetWsId, 'brandKits', brandKitId);
        await setDoc(ref, cleanPayload, { merge: true });
      } catch (clientErr) {
        console.warn('[FirebaseBrandRepository] Client SDK setDoc failed, attempting server API route:', clientErr);
        
        // Secondary path: Call authenticated server API route with Firebase ID token
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/workspaces/${targetWsId}/brand`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cleanPayload)
          });

          if (!res.ok) {
            const errRes = await res.json().catch(() => ({}));
            throw new Error(errRes.error || `Server API save failed with status ${res.status}`);
          }
        } catch (serverErr) {
          console.error('[FirebaseBrandRepository] Both client and server cloud saves failed:', serverErr);
          throw serverErr;
        }
      }
    }
  }
}
