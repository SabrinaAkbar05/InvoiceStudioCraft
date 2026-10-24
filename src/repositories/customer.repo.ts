import { localDb } from '@/lib/db/indexeddb';
import { Customer } from '@/types/customer';

export interface ICustomerRepository {
  getCustomers(workspaceId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  saveCustomer(customer: Customer): Promise<void>;
  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
}

export class LocalCustomerRepository implements ICustomerRepository {
  async getCustomers(workspaceId: string): Promise<Customer[]> {
    if (typeof window === 'undefined') return [];
    const all = await localDb.getAll<Customer>('customers');
    return all.filter((c) => c.workspaceId === workspaceId);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    if (typeof window === 'undefined') return null;
    return await localDb.get<Customer>('customers', id);
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const updated = {
      ...customer,
      updatedAt: new Date().toISOString()
    };
    await localDb.put('customers', updated);
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    await localDb.put('customers', customer);
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await localDb.delete('customers', id);
  }
}

export const customerRepo = new LocalCustomerRepository();
