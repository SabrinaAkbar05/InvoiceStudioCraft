import { IProductRepository, LocalProductRepository } from '../product.repo';
import { Product } from '@/types/product';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';

export class FirebaseProductRepository implements IProductRepository {
  private localFallback = new LocalProductRepository();

  async getProducts(workspaceId: string): Promise<Product[]> {
    if (typeof window === 'undefined') return [];

    const user = auth.currentUser;
    if (!user || !workspaceId) {
      return this.localFallback.getProducts(workspaceId);
    }

    try {
      const q = query(collection(db, 'workspaces', workspaceId, 'products'), orderBy('name', 'asc'));
      const snap = await getDocs(q);

      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

      for (const p of products) {
        await this.localFallback.saveProduct(p);
      }

      return products;
    } catch (err) {
      console.warn('[FirebaseProductRepository] Fallback to local on error:', err);
      return this.localFallback.getProducts(workspaceId);
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    if (typeof window === 'undefined') return null;

    const user = auth.currentUser;
    if (!user) {
      return this.localFallback.getProduct(id);
    }

    try {
      const local = await this.localFallback.getProduct(id);
      if (local && local.workspaceId) {
        const ref = doc(db, 'workspaces', local.workspaceId, 'products', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Product;
        }
      }
      return local;
    } catch (err) {
      return this.localFallback.getProduct(id);
    }
  }

  async saveProduct(product: Product): Promise<void> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const updated = { ...product, updatedAt: now };

    await this.localFallback.saveProduct(updated);

    if (user && product.workspaceId && product.id) {
      try {
        const ref = doc(db, 'workspaces', product.workspaceId, 'products', product.id);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.error('[FirebaseProductRepository] Failed to save product to Firestore:', err);
        throw err;
      }
    }
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const user = auth.currentUser;
    const local = await this.localFallback.createProduct(data);

    if (user && local.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', local.workspaceId, 'products', local.id);
        await setDoc(ref, local);
      } catch (err) {
        console.error('[FirebaseProductRepository] Failed to create product in Firestore:', err);
      }
    }

    return local;
  }

  async deleteProduct(id: string): Promise<void> {
    const user = auth.currentUser;
    const existing = await this.localFallback.getProduct(id);

    await this.localFallback.deleteProduct(id);

    if (user && existing && existing.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', existing.workspaceId, 'products', id);
        await deleteDoc(ref);
      } catch (err) {
        console.error('[FirebaseProductRepository] Failed to delete product from Firestore:', err);
      }
    }
  }
}
