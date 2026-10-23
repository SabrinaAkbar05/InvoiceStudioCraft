import { describe, it, expect } from 'vitest';
import { InvoiceSender, Invoice } from '@/types/invoice';
import { Workspace } from '@/types/workspace';

describe('InvoiceSender Feature Logic', () => {
  const mockWorkspace: Workspace = {
    id: 'ws_gift_garden',
    name: 'The Gift Garden',
    email: 'hello@giftgarden.pk',
    phone: '+92 300 1234567',
    website: 'https://giftgarden.pk',
    address: {
      line1: 'Shop #4, Flower Avenue',
      city: 'Karachi',
      state: 'Sindh',
      postalCode: '75500',
      country: 'Pakistan'
    },
    currency: 'PKR',
    dateFormat: 'YYYY-MM-DD',
    invoiceNumberPrefix: 'INV-',
    invoiceNumberNext: 1001,
    defaultPaymentTermsDays: 14,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const overrideSender: InvoiceSender = {
    name: 'The Gift Garden (Pop-up Store)',
    email: 'popup@giftgarden.pk',
    phone: '+92 300 9876543',
    address: {
      line1: 'Kiosk 12, Dolmen Mall',
      city: 'Karachi',
      state: 'Sindh',
      postalCode: '75500',
      country: 'Pakistan'
    }
  };

  it('renders default workspace details when no invoice sender override is present', () => {
    const invoiceWithoutSender: Partial<Invoice> = {
      id: 'inv_1',
      sender: undefined
    };

    const effectiveName = invoiceWithoutSender.sender?.name || mockWorkspace.name;
    const effectiveEmail = invoiceWithoutSender.sender?.email || mockWorkspace.email;
    const effectiveLine1 = invoiceWithoutSender.sender?.address?.line1 || mockWorkspace.address.line1;

    expect(effectiveName).toBe('The Gift Garden');
    expect(effectiveEmail).toBe('hello@giftgarden.pk');
    expect(effectiveLine1).toBe('Shop #4, Flower Avenue');
  });

  it('prioritizes invoice-specific sender override when provided', () => {
    const invoiceWithSender: Partial<Invoice> = {
      id: 'inv_2',
      sender: overrideSender
    };

    const effectiveName = invoiceWithSender.sender?.name || mockWorkspace.name;
    const effectiveEmail = invoiceWithSender.sender?.email || mockWorkspace.email;
    const effectiveLine1 = invoiceWithSender.sender?.address?.line1 || mockWorkspace.address.line1;

    expect(effectiveName).toBe('The Gift Garden (Pop-up Store)');
    expect(effectiveEmail).toBe('popup@giftgarden.pk');
    expect(effectiveLine1).toBe('Kiosk 12, Dolmen Mall');
  });

  it('preserves workspace defaults when Option A (invoice-only) is applied', () => {
    // Simulating invoice-only change: invoice receives overrideSender, workspace remains unchanged
    const invoice: Partial<Invoice> = {
      id: 'inv_draft',
      sender: overrideSender
    };

    expect(invoice.sender?.name).toBe('The Gift Garden (Pop-up Store)');
    expect(mockWorkspace.name).toBe('The Gift Garden');
    expect(mockWorkspace.address.line1).toBe('Shop #4, Flower Avenue');
  });

  it('locks sender address on issued invoices against silent rewrite', () => {
    const issuedInvoice: Invoice = {
      id: 'inv_issued_1',
      workspaceId: mockWorkspace.id,
      invoiceNumber: 'INV-1001',
      title: 'Invoice',
      status: 'issued',
      issueDate: '2026-10-24',
      dueDate: '2026-11-07',
      sender: overrideSender,
      customer: {
        name: 'Almas',
        email: 'almas@example.com'
      },
      items: [
        { id: 'item_1', description: 'Bouquet', quantity: 1, unitPrice: 2500, amount: 2500 }
      ],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 400,
      subtotal: 2500,
      discountTotal: 0,
      taxTotal: 0,
      total: 2900,
      amountPaid: 0,
      balanceDue: 2900,
      currency: 'PKR',
      brandKitSnapshot: {
        id: 'bk_1',
        workspaceId: mockWorkspace.id,
        primaryColor: '#6254E8',
        secondaryColor: '#8B7CF6',
        accentColor: '#10B981',
        neutralColor: '#F8FAFC',
        textColor: '#1E293B',
        backgroundColor: '#FFFFFF',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        templateId: 'corporate',
        updatedAt: '2026-01-01'
      },
      payments: [],
      pageFormat: 'a4',
      createdAt: '2026-10-24T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z'
    };

    // Subsequent workspace address update
    const updatedWorkspace = {
      ...mockWorkspace,
      name: 'The Gift Garden International',
      address: {
        ...mockWorkspace.address,
        line1: '99 Global Blvd'
      }
    };

    // Issued invoice snapshot retains original snapshot
    const senderOnPdf = issuedInvoice.sender?.name || updatedWorkspace.name;
    const addressOnPdf = issuedInvoice.sender?.address?.line1 || updatedWorkspace.address.line1;

    expect(senderOnPdf).toBe('The Gift Garden (Pop-up Store)');
    expect(addressOnPdf).toBe('Kiosk 12, Dolmen Mall');
    expect(issuedInvoice.status).toBe('issued');
  });
});
