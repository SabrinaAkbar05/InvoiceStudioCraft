import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, toDecimal } from '../lib/calculations/engine';

describe('Financial Calculation Engine', () => {
  it('handles empty invoices gracefully', () => {
    const result = calculateInvoiceTotals({
      items: [],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0
    });

    expect(result.subtotal).toBe(0);
    expect(result.discountTotal).toBe(0);
    expect(result.taxTotal).toBe(0);
    expect(result.deliveryCharge).toBe(0);
    expect(result.total).toBe(0);
    expect(result.amountPaid).toBe(0);
    expect(result.balanceDue).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('handles zero values and invalid inputs correctly', () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 0, unitPrice: 100 }, { quantity: 5, unitPrice: 0 }],
      discountType: 'percentage',
      discountValue: 0,
      taxType: 'percentage',
      taxRate: 0,
      deliveryCharge: 0
    });

    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.balanceDue).toBe(0);
  });

  it('accurately calculates multiple items with decimal values without IEEE floating-point errors', () => {
    // Classic 0.1 + 0.2 floating point anomaly
    const result = calculateInvoiceTotals({
      items: [
        { quantity: 3, unitPrice: 19.99 },
        { quantity: 1.5, unitPrice: 45.33 }
      ],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0
    });

    // 3 * 19.99 = 59.97
    // 1.5 * 45.33 = 67.995 -> 68.00 rounded
    // 59.97 + 67.995 = 127.965 -> 127.97
    expect(result.items[0].lineSubtotal).toBe(59.97);
    expect(result.items[1].lineSubtotal).toBe(68.00);
    expect(result.subtotal).toBe(127.97);
    expect(result.total).toBe(127.97);
  });

  it('calculates percentage discounts correctly', () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 2, unitPrice: 100 }], // 200
      discountType: 'percentage',
      discountValue: 15, // 15% of 200 = 30
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0
    });

    expect(result.subtotal).toBe(200);
    expect(result.discountTotal).toBe(30);
    expect(result.taxableAmount).toBe(170);
    expect(result.total).toBe(170);
    expect(result.balanceDue).toBe(170);
  });

  it('calculates fixed discounts capped at subtotal', () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 50 }],
      discountType: 'fixed',
      discountValue: 80, // larger than subtotal
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0
    });

    expect(result.subtotal).toBe(50);
    expect(result.discountTotal).toBe(50);
    expect(result.taxableAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('calculates tax after discount and adds delivery charge', () => {
    const result = calculateInvoiceTotals({
      items: [
        { quantity: 1, unitPrice: 2500 }, // bouquet
        { quantity: 1, unitPrice: 1500 }  // cake
      ], // subtotal = 4000
      discountType: 'fixed',
      discountValue: 200, // taxable = 3800
      taxType: 'percentage',
      taxRate: 10, // 10% of 3800 = 380
      deliveryCharge: 400 // delivery = 400
    });

    expect(result.subtotal).toBe(4000);
    expect(result.discountTotal).toBe(200);
    expect(result.taxableAmount).toBe(3800);
    expect(result.taxTotal).toBe(380);
    expect(result.deliveryCharge).toBe(400);
    // 3800 + 380 + 400 = 4580
    expect(result.total).toBe(4580);
    expect(result.balanceDue).toBe(4580);
  });

  it('calculates partial payments and status accurately', () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0,
      payments: [
        { amount: 300 },
        { amount: 250 }
      ],
      currentStatus: 'issued'
    });

    expect(result.total).toBe(1000);
    expect(result.amountPaid).toBe(550);
    expect(result.balanceDue).toBe(450);
    expect(result.computedStatus).toBe('partially_paid');
  });

  it('marks invoice as paid when fully settled', () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 2, unitPrice: 250 }],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 50, // total = 550
      payments: [
        { amount: 200 },
        { amount: 350 }
      ],
      currentStatus: 'issued'
    });

    expect(result.total).toBe(550);
    expect(result.amountPaid).toBe(550);
    expect(result.balanceDue).toBe(0);
    expect(result.computedStatus).toBe('paid');
  });

  it('marks invoice as overdue if dueDate has passed and balance remains', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 300 }],
      discountType: 'none',
      discountValue: 0,
      taxType: 'none',
      taxRate: 0,
      deliveryCharge: 0,
      payments: [],
      dueDate: yesterday.toISOString().split('T')[0],
      currentStatus: 'issued'
    });

    expect(result.balanceDue).toBe(300);
    expect(result.computedStatus).toBe('overdue');
  });
});
