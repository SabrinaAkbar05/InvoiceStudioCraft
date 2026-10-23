import { Workspace } from '@/types/workspace';
import { BrandKit } from '@/types/brand';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { Invoice } from '@/types/invoice';

const DB_NAME = 'invoicecraft_studio_db';
const DB_VERSION = 1;

export interface AppDatabaseSchema {
  workspaces: Workspace;
  brandKits: BrandKit;
  customers: Customer;
  products: Product;
  invoices: Invoice;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private isConnecting: Promise<IDBDatabase> | null = null;

  private async open(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB is only accessible in the browser');
    }

    if (this.db) return this.db;
    if (this.isConnecting) return this.isConnecting;

    this.isConnecting = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('brandKits')) {
          db.createObjectStore('brandKits', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          const custStore = db.createObjectStore('customers', { keyPath: 'id' });
          custStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        }
        if (!db.objectStoreNames.contains('products')) {
          const prodStore = db.createObjectStore('products', { keyPath: 'id' });
          prodStore.createIndex('workspaceId', 'workspaceId', { unique: false });
        }
        if (!db.objectStoreNames.contains('invoices')) {
          const invStore = db.createObjectStore('invoices', { keyPath: 'id' });
          invStore.createIndex('workspaceId', 'workspaceId', { unique: false });
          invStore.createIndex('status', 'status', { unique: false });
          invStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.isConnecting;
  }

  async getAll<T>(storeName: keyof AppDatabaseSchema): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(storeName: keyof AppDatabaseSchema, id: string): Promise<T | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: keyof AppDatabaseSchema, value: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: keyof AppDatabaseSchema, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearStore(storeName: keyof AppDatabaseSchema): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAll(): Promise<void> {
    await this.clearStore('invoices');
    await this.clearStore('products');
    await this.clearStore('customers');
    await this.clearStore('brandKits');
    await this.clearStore('workspaces');
  }

  async exportBackup(): Promise<string> {
    const workspaces = await this.getAll<Workspace>('workspaces');
    const brandKits = await this.getAll<BrandKit>('brandKits');
    const customers = await this.getAll<Customer>('customers');
    const products = await this.getAll<Product>('products');
    const invoices = await this.getAll<Invoice>('invoices');

    const backup = {
      version: 1,
      appName: 'InvoiceCraft Studio',
      exportedAt: new Date().toISOString(),
      data: {
        workspaces,
        brandKits,
        customers,
        products,
        invoices
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !parsed.appName) {
        throw new Error('Invalid backup file structure.');
      }

      await this.clearAll();

      const { workspaces, brandKits, customers, products, invoices } = parsed.data;

      if (Array.isArray(workspaces)) {
        for (const w of workspaces) await this.put('workspaces', w);
      }
      if (Array.isArray(brandKits)) {
        for (const b of brandKits) await this.put('brandKits', b);
      }
      if (Array.isArray(customers)) {
        for (const c of customers) await this.put('customers', c);
      }
      if (Array.isArray(products)) {
        for (const p of products) await this.put('products', p);
      }
      if (Array.isArray(invoices)) {
        for (const i of invoices) await this.put('invoices', i);
      }

      return { success: true, message: 'Workspace restored successfully.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import backup.';
      return { success: false, message };
    }
  }
}

export const localDb = new LocalDatabase();
