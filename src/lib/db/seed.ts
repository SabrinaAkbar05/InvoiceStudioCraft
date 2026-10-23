import { localDb } from './indexeddb';
import { Workspace } from '@/types/workspace';
import { BrandKit } from '@/types/brand';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';
import { Invoice } from '@/types/invoice';
import { calculateInvoiceTotals } from '../calculations/engine';

export async function seedDemoData(): Promise<void> {
  await localDb.clearAll();

  const wsId = 'ws_demo_lumina';
  const now = new Date();
  const _todayStr = now.toISOString().split('T')[0]; // kept for future use

  const ws: Workspace = {
    id: wsId,
    name: 'Lumina Creative Studio',
    email: 'hello@luminastudio.design',
    phone: '+1 (415) 890-4321',
    website: 'https://luminastudio.design',
    address: {
      line1: '580 Howard Street',
      line2: 'Floor 3',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States'
    },
    taxId: 'US-94-3982176',
    currency: 'USD',
    dateFormat: 'YYYY-MM-DD',
    invoiceNumberPrefix: 'LUM-',
    invoiceNumberNext: 1006,
    defaultPaymentTermsDays: 14,
    paymentInstructions: 'ACH or Wire transfers to Chase Bank:\nAccount: 8839-2094-1102\nRouting: 121000358\nSwift: CHASUS33\nReference: Invoice Number',
    isDemoWorkspace: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  await localDb.put('workspaces', ws);

  const brandKit: BrandKit = {
    id: `bk_${wsId}`,
    workspaceId: wsId,
    primaryColor: '#6254E8',
    secondaryColor: '#171B32',
    accentColor: '#38BDF8',
    neutralColor: '#F8F9FC',
    textColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    templateId: 'corporate',
    tagline: 'Design, Branding & Visual Experiences',
    thankYouNote: 'Thank you for choosing Lumina Creative Studio. We look forward to our continued creative collaboration!',
    defaultPaymentInstructions: ws.paymentInstructions,
    signatureName: 'Sarah Jenkins',
    signatureTitle: 'Founder & Principal Designer',
    updatedAt: now.toISOString()
  };

  await localDb.put('brandKits', brandKit);

  const customers: Customer[] = [
    {
      id: 'cust_almas',
      workspaceId: wsId,
      name: 'Almas Rahman',
      email: 'almas@apexventures.io',
      phone: '+1 (555) 723-9012',
      companyName: 'Apex Ventures',
      address: {
        line1: '100 Montgomery St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94104',
        country: 'United States'
      },
      taxId: 'US-88-2938102',
      notes: 'Prefers electronic wire transfers and bi-weekly billing.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'cust_zenith',
      workspaceId: wsId,
      name: 'Elena Rostova',
      email: 'elena@zenithhealth.co',
      phone: '+1 (415) 302-8841',
      companyName: 'Zenith Healthtech',
      address: {
        line1: '250 King St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94107',
        country: 'United States'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'cust_solaris',
      workspaceId: wsId,
      name: 'Marcus Vance',
      email: 'marcus@solarisretail.com',
      phone: '+1 (650) 492-1082',
      companyName: 'Solaris Retail Group',
      address: {
        line1: '400 University Ave',
        city: 'Palo Alto',
        state: 'CA',
        postalCode: '94301',
        country: 'United States'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  for (const c of customers) {
    await localDb.put('customers', c);
  }

  const products: Product[] = [
    {
      id: 'prod_brand_identity',
      workspaceId: wsId,
      name: 'Brand Identity & Design System',
      description: 'Comprehensive brand guidelines, logo suite, typography hierarchy, and UI design tokens.',
      unitPrice: 4500,
      currency: 'USD',
      category: 'Design Services',
      sku: 'SRV-BRAND-01',
      taxRate: 8.5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'prod_web_redesign',
      workspaceId: wsId,
      name: 'Next.js Web Application UI/UX',
      description: 'High-fidelity Figma prototypes, interactive design components, and responsive front-end implementation.',
      unitPrice: 6200,
      currency: 'USD',
      category: 'Engineering & Design',
      sku: 'SRV-WEB-02',
      taxRate: 8.5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'prod_packaging',
      workspaceId: wsId,
      name: 'Custom Product Packaging Design',
      description: 'Die-cut packaging blueprints, 3D renders, and vendor-ready print production files.',
      unitPrice: 2800,
      currency: 'USD',
      category: 'Print & Packaging',
      sku: 'SRV-PKG-03',
      taxRate: 8.5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'prod_retainer',
      workspaceId: wsId,
      name: 'Monthly Creative Advisory Retainer',
      description: '20 hours of senior design direction, creative reviews, and on-demand brand asset production.',
      unitPrice: 3500,
      currency: 'USD',
      category: 'Retainer',
      sku: 'SRV-RET-04',
      taxRate: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  for (const p of products) {
    await localDb.put('products', p);
  }

  // 4 Realistic Invoices
  const makeDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const sampleInvoices: Array<Omit<Invoice, 'subtotal' | 'discountTotal' | 'taxTotal' | 'total' | 'amountPaid' | 'balanceDue' | 'status'>> = [
    {
      id: 'inv_demo_1001',
      workspaceId: wsId,
      invoiceNumber: 'LUM-1001',
      title: 'Brand Identity & Design System',
      issueDate: makeDate(-20),
      dueDate: makeDate(-6), // Overdue if unpaid
      customerId: 'cust_almas',
      customer: {
        name: 'Almas Rahman',
        email: 'almas@apexventures.io',
        companyName: 'Apex Ventures',
        address: customers[0].address
      },
      items: [
        {
          id: 'item_1',
          description: 'Brand Identity & Design System (Phase 1 Deliverables)',
          quantity: 1,
          unitPrice: 4500,
          amount: 4500
        },
        {
          id: 'item_2',
          description: 'Custom Iconography & Typography Package',
          quantity: 1,
          unitPrice: 1200,
          amount: 1200
        }
      ],
      discountType: 'percentage',
      discountValue: 5,
      taxType: 'percentage',
      taxRate: 8.5,
      deliveryCharge: 0,
      currency: 'USD',
      notes: 'Deliverables transferred via Figma and GitHub repository.',
      paymentInstructions: ws.paymentInstructions,
      brandKitSnapshot: brandKit,
      payments: [
        {
          id: 'pay_1',
          invoiceId: 'inv_demo_1001',
          amount: 3000,
          date: makeDate(-10),
          method: 'bank_transfer',
          reference: 'WIRE-99210-A',
          note: 'Initial 50% milestone deposit received.',
          createdAt: makeDate(-10)
        }
      ],
      pageFormat: 'a4',
      createdAt: makeDate(-20),
      updatedAt: makeDate(-10)
    },
    {
      id: 'inv_demo_1002',
      workspaceId: wsId,
      invoiceNumber: 'LUM-1002',
      title: 'Next.js Web Application UI/UX',
      issueDate: makeDate(-15),
      dueDate: makeDate(-1),
      customerId: 'cust_zenith',
      customer: {
        name: 'Elena Rostova',
        email: 'elena@zenithhealth.co',
        companyName: 'Zenith Healthtech',
        address: customers[1].address
      },
      items: [
        {
          id: 'item_3',
          description: 'Next.js Web Application UI/UX (Sprint 1 & 2)',
          quantity: 1,
          unitPrice: 6200,
          amount: 6200
        }
      ],
      discountType: 'none',
      discountValue: 0,
      taxType: 'percentage',
      taxRate: 8.5,
      deliveryCharge: 0,
      currency: 'USD',
      paymentInstructions: ws.paymentInstructions,
      brandKitSnapshot: { ...brandKit, templateId: 'elegant' },
      payments: [
        {
          id: 'pay_2',
          invoiceId: 'inv_demo_1002',
          amount: 6727,
          date: makeDate(-5),
          method: 'stripe',
          reference: 'ch_3M4K8L2eZvKYlo2C1',
          createdAt: makeDate(-5)
        }
      ],
      pageFormat: 'a4',
      createdAt: makeDate(-15),
      updatedAt: makeDate(-5)
    },
    {
      id: 'inv_demo_1003',
      workspaceId: wsId,
      invoiceNumber: 'LUM-1003',
      title: 'Custom Product Packaging Design',
      issueDate: makeDate(-5),
      dueDate: makeDate(9),
      customerId: 'cust_solaris',
      customer: {
        name: 'Marcus Vance',
        email: 'marcus@solarisretail.com',
        companyName: 'Solaris Retail Group',
        address: customers[2].address
      },
      items: [
        {
          id: 'item_4',
          description: 'Custom Product Packaging Design (3 Box Variants)',
          quantity: 1,
          unitPrice: 2800,
          amount: 2800
        },
        {
          id: 'item_5',
          description: 'Express Physical Print Proof Production & Courier',
          quantity: 1,
          unitPrice: 450,
          amount: 450
        }
      ],
      discountType: 'fixed',
      discountValue: 150,
      taxType: 'percentage',
      taxRate: 8.5,
      deliveryCharge: 75,
      currency: 'USD',
      paymentInstructions: ws.paymentInstructions,
      brandKitSnapshot: { ...brandKit, templateId: 'minimal' },
      payments: [],
      pageFormat: 'a4',
      createdAt: makeDate(-5),
      updatedAt: makeDate(-5)
    },
    {
      id: 'inv_demo_1004',
      workspaceId: wsId,
      invoiceNumber: 'LUM-1004',
      title: 'Monthly Creative Retainer — Q4',
      issueDate: makeDate(-2),
      dueDate: makeDate(12),
      customerId: 'cust_almas',
      customer: {
        name: 'Almas Rahman',
        email: 'almas@apexventures.io',
        companyName: 'Apex Ventures',
        address: customers[0].address
      },
      items: [
        {
          id: 'item_6',
          description: 'Monthly Creative Advisory Retainer (October)',
          quantity: 1,
          unitPrice: 3500,
          amount: 3500
        }
      ],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0,
      currency: 'USD',
      paymentInstructions: ws.paymentInstructions,
      brandKitSnapshot: { ...brandKit, templateId: 'creative' },
      payments: [],
      pageFormat: 'a4',
      createdAt: makeDate(-2),
      updatedAt: makeDate(-2)
    }
  ];

  for (const invData of sampleInvoices) {
    const calc = calculateInvoiceTotals({
      items: invData.items,
      discountType: invData.discountType,
      discountValue: invData.discountValue,
      taxType: invData.taxType,
      taxRate: invData.taxRate,
      deliveryCharge: invData.deliveryCharge,
      payments: invData.payments,
      dueDate: invData.dueDate,
      currentStatus: 'issued'
    });

    const fullInv: Invoice = {
      ...invData,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxTotal: calc.taxTotal,
      total: calc.total,
      amountPaid: calc.amountPaid,
      balanceDue: calc.balanceDue,
      status: calc.computedStatus
    };

    await localDb.put('invoices', fullInv);
  }
}
