export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
  category?: string;
  sku?: string;
  taxRate?: number;
  createdAt: string;
  updatedAt: string;
}
