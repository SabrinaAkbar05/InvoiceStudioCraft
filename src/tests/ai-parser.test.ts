import { describe, it, expect } from 'vitest';
import { LocalInvoiceInstructionParser } from '../lib/ai/instruction-parser';

describe('Local Natural Language Invoice Parser', () => {
  const parser = new LocalInvoiceInstructionParser();

  it('correctly parses the master prompt test instruction', async () => {
    const input = 'Create an invoice for Almas. Add one bouquet for Rs. 2500 and one bento cake for Rs. 1500. Delivery charges Rs. 400. No payment has been received.';
    const result = await parser.parseInvoiceInstruction(input);

    expect(result.customerName).toBe('Almas');
    expect(result.currency).toBe('PKR');
    expect(result.deliveryCharge).toBe(400);
    expect(result.amountPaid).toBe(0);
    expect(result.items).toHaveLength(2);

    expect(result.items[0]).toEqual({
      description: 'Bouquet',
      quantity: 1,
      unitPrice: 2500
    });

    expect(result.items[1]).toEqual({
      description: 'Bento cake',
      quantity: 1,
      unitPrice: 1500
    });

    expect(result.missingFields).toHaveLength(0);
  });

  it('detects missing fields when customer or items are absent', async () => {
    const input = 'Add 3 widgets for $45. Delivery $10.';
    const result = await parser.parseInvoiceInstruction(input);

    expect(result.items).toHaveLength(1);
    expect(result.customerName).toBeUndefined();
    expect(result.missingFields).toContain('Customer Name');
  });

  it('flags unparsed segments safely without guessing', async () => {
    const input = 'Invoice for David. Add 1 consultation at $300. Please ensure the client signs the non-disclosure agreement by tomorrow evening.';
    const result = await parser.parseInvoiceInstruction(input);

    expect(result.customerName).toBe('David');
    expect(result.items).toHaveLength(1);
    expect(result.unparsedSegments.length).toBeGreaterThan(0);
  });
});
