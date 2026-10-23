import { Address } from './workspace';

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address: Address;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
