export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface Workspace {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address: Address;
  taxId?: string;
  currency: string;
  dateFormat: string;
  invoiceNumberPrefix: string;
  invoiceNumberNext: number;
  defaultPaymentTermsDays: number;
  paymentInstructions?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  isDemoWorkspace?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const DEFAULT_WORKSPACE: Omit<Workspace, 'id'> = {
  name: 'Acme Creative Studio',
  email: 'billing@acmestudio.design',
  phone: '+1 (555) 234-5678',
  website: 'https://acmestudio.design',
  address: {
    line1: '742 Evergreen Terrace',
    line2: 'Suite 400',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    country: 'United States'
  },
  taxId: 'US-EIN-98-7654321',
  currency: 'USD',
  dateFormat: 'YYYY-MM-DD',
  invoiceNumberPrefix: 'INV-',
  invoiceNumberNext: 1001,
  defaultPaymentTermsDays: 14,
  paymentInstructions: 'ACH or Wire transfers accepted. Net 14 days.',
  isDemoWorkspace: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};
