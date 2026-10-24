import { localDb } from '@/lib/db/indexeddb';
import { Workspace } from '@/types/workspace';
import { BrandKit, DEFAULT_BRAND_KIT } from '@/types/brand';

export interface IWorkspaceRepository {
  getActiveWorkspace(): Promise<Workspace | null>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>;
  clearWorkspace(): Promise<void>;
}

export class LocalWorkspaceRepository implements IWorkspaceRepository {
  async getActiveWorkspace(): Promise<Workspace | null> {
    if (typeof window === 'undefined') return null;
    const all = await localDb.getAll<Workspace>('workspaces');
    return all.length > 0 ? all[0] : null;
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const updated = {
      ...workspace,
      updatedAt: new Date().toISOString()
    };
    await localDb.put('workspaces', updated);
  }

  async createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const ws: Workspace = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    await localDb.put('workspaces', ws);

    // Also initialize default brand kit
    const brandKit: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${id}`,
      workspaceId: id,
      updatedAt: now
    };
    await localDb.put('brandKits', brandKit);

    return ws;
  }

  async clearWorkspace(): Promise<void> {
    await localDb.clearAll();
  }
}

export const workspaceRepo = new LocalWorkspaceRepository();
