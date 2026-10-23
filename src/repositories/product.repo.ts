import { localDb } from '@/lib/db/indexeddb';
import { Product } from '@/types/product';

export interface IProductRepository {
  getProducts(workspaceId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<void>;
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

export class LocalProductRepository implements IProductRepository {
  async getProducts(workspaceId: string): Promise<Product[]> {
    if (typeof window === 'undefined') return [];
    const all = await localDb.getAll<Product>('products');
    return all.filter((p) => p.workspaceId === workspaceId);
  }

  async getProduct(id: string): Promise<Product | null> {
    if (typeof window === 'undefined') return null;
    return await localDb.get<Product>('products', id);
  }

  async saveProduct(product: Product): Promise<void> {
    const updated = {
      ...product,
      updatedAt: new Date().toISOString()
    };
    await localDb.put('products', updated);
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const product: Product = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    await localDb.put('products', product);
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await localDb.delete('products', id);
  }
}

import { FirebaseProductRepository } from './firebase/product.firebase';

export const productRepo = new FirebaseProductRepository();
