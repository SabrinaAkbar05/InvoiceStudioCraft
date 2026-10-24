import { localDb } from '@/lib/db/indexeddb';
import { BrandKit, DEFAULT_BRAND_KIT } from '@/types/brand';

export interface IBrandRepository {
  getBrandKit(workspaceId: string): Promise<BrandKit | null>;
  saveBrandKit(brandKit: BrandKit): Promise<void>;
}

export class LocalBrandRepository implements IBrandRepository {
  async getBrandKit(workspaceId: string): Promise<BrandKit | null> {
    if (typeof window === 'undefined') return null;
    const all = await localDb.getAll<BrandKit>('brandKits');
    const kit = all.find((b) => b.workspaceId === workspaceId);
    if (kit) return kit;

    // Fallback if none exists
    const fallback: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${workspaceId}`,
      workspaceId,
      updatedAt: new Date().toISOString()
    };
    await localDb.put('brandKits', fallback);
    return fallback;
  }

  async saveBrandKit(brandKit: BrandKit): Promise<void> {
    const updated = {
      ...brandKit,
      updatedAt: new Date().toISOString()
    };
    await localDb.put('brandKits', updated);
  }
}

export const brandRepo = new LocalBrandRepository();
