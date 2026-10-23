import { ICustomerRepository, LocalCustomerRepository } from '../customer.repo';
import { Customer } from '@/types/customer';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';

export class FirebaseCustomerRepository implements ICustomerRepository {
  private localFallback = new LocalCustomerRepository();

  async getCustomers(workspaceId: string): Promise<Customer[]> {
    if (typeof window === 'undefined') return [];

    const user = auth.currentUser;
    if (!user || !workspaceId) {
      return this.localFallback.getCustomers(workspaceId);
    }

    try {
      const q = query(collection(db, 'workspaces', workspaceId, 'customers'), orderBy('name', 'asc'));
      const snap = await getDocs(q);

      const customers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));

      // Cache locally
      for (const c of customers) {
        await this.localFallback.saveCustomer(c);
      }

      return customers;
    } catch (err) {
      console.warn('[FirebaseCustomerRepository] Fallback to local on error:', err);
      return this.localFallback.getCustomers(workspaceId);
    }
  }

  async getCustomer(id: string): Promise<Customer | null> {
    if (typeof window === 'undefined') return null;

    const user = auth.currentUser;
    if (!user) {
      return this.localFallback.getCustomer(id);
    }

    try {
      // Check local cache first for fast response
      const local = await this.localFallback.getCustomer(id);
      if (local && local.workspaceId) {
        const ref = doc(db, 'workspaces', local.workspaceId, 'customers', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Customer;
        }
      }
      return local;
    } catch (err) {
      return this.localFallback.getCustomer(id);
    }
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const updated = { ...customer, updatedAt: now };

    await this.localFallback.saveCustomer(updated);

    if (user && customer.workspaceId && customer.id) {
      try {
        const ref = doc(db, 'workspaces', customer.workspaceId, 'customers', customer.id);
        await setDoc(ref, updated, { merge: true });
      } catch (err) {
        console.error('[FirebaseCustomerRepository] Failed to save customer to Firestore:', err);
        throw err;
      }
    }
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const user = auth.currentUser;
    const local = await this.localFallback.createCustomer(data);

    if (user && local.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', local.workspaceId, 'customers', local.id);
        await setDoc(ref, local);
      } catch (err) {
        console.error('[FirebaseCustomerRepository] Failed to create customer in Firestore:', err);
      }
    }

    return local;
  }

  async deleteCustomer(id: string): Promise<void> {
    const user = auth.currentUser;
    const existing = await this.localFallback.getCustomer(id);

    await this.localFallback.deleteCustomer(id);

    if (user && existing && existing.workspaceId) {
      try {
        const ref = doc(db, 'workspaces', existing.workspaceId, 'customers', id);
        await deleteDoc(ref);
      } catch (err) {
        console.error('[FirebaseCustomerRepository] Failed to delete customer from Firestore:', err);
      }
    }
  }
}
