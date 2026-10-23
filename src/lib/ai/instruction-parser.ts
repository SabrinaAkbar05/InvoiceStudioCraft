import { ExtractedInvoiceData, InvoiceAIService } from '@/types/ai';

/**
 * Local Deterministic Rule-Based Parser for natural-language invoice requests.
 * Explicitly parses:
 * - Customer names: "for <Name>", "bill to <Name>", "client <Name>"
 * - Line items: "add <Qty> <Description> for <Price>", "<Qty> <Description> at <Price>", "<Qty>x <Description> @ <Price>"
 * - Delivery/Shipping: "delivery charges <Amount>", "shipping <Amount>", "delivery <Amount>"
 * - Discounts: "discount <Amount>", "<Percent>% discount"
 * - Currency detection: "Rs.", "USD", "$", "EUR", "€", "GBP", "£", "PKR", "INR"
 * - Payment status: "no payment", "paid <Amount>", "received <Amount>"
 * - Unparsed / ambiguous segments marked explicitly
 */
export class LocalInvoiceInstructionParser implements InvoiceAIService {
  async parseInvoiceInstruction(instruction: string, defaultCurrency: string = 'USD'): Promise<ExtractedInvoiceData> {
    const recognizedFields: string[] = [];
    const unparsedSegments: string[] = [];
    const missingFields: string[] = [];

    const text = instruction.trim();
    if (!text) {
      return {
        items: [],
        recognizedFields: [],
        unparsedSegments: ['Empty instruction received'],
        confidenceScore: 0,
        missingFields: ['customerName', 'items']
      };
    }

    let customerName: string | undefined;
    let customerEmail: string | undefined;
    let deliveryCharge: number | undefined;
    let discountValue: number | undefined;
    let discountType: 'percentage' | 'fixed' | 'none' = 'none';
    let amountPaid: number | undefined;
    let currency: string = defaultCurrency;
    const items: Array<{ description: string; quantity: number; unitPrice: number }> = [];

    // Currency Detection
    if (/(\$|USD)/i.test(text)) currency = 'USD';
    else if (/(€|EUR)/i.test(text)) currency = 'EUR';
    else if (/(£|GBP)/i.test(text)) currency = 'GBP';
    else if (/(Rs\.?|PKR)/i.test(text)) currency = 'PKR';
    else if (/(₹|INR)/i.test(text)) currency = 'INR';

    // Normalize currency abbreviations like "Rs." to avoid sentence splitting issues
    const normalizedText = text.replace(/Rs\./gi, 'Rs');

    // Split sentences or comma / period clauses while avoiding abbreviation splits
    const sentences = normalizedText
      .split(/(?<=[?!])\s+|(?<=[0-9A-Za-z]{2,}\.)\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      let sentenceRecognized = false;

      // Check Customer Name: "Create an invoice for Almas", "Bill to Acme Corp", "Client: John Doe"
      const customerMatch = sentence.match(/(?:invoice\s+(?:for|to)|bill\s+to|client(?:\s+is|:)?)\s+([A-Za-z0-9&'\s]+?)(?=\.|\band\b|\badd\b|\bwith\b|$)/i);
      if (customerMatch && !customerName) {
        customerName = customerMatch[1].trim();
        recognizedFields.push(`Customer: "${customerName}"`);
        sentenceRecognized = true;
      }

      // Check Email
      const emailMatch = sentence.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !customerEmail) {
        customerEmail = emailMatch[0];
        recognizedFields.push(`Email: "${customerEmail}"`);
        sentenceRecognized = true;
      }

      // Check Delivery / Shipping: "Delivery charges Rs. 400", "shipping 25"
      const deliveryMatch = sentence.match(/(?:delivery(?:\s+charges?)?|shipping(?:\s+fee)?)\s*(?:of|is|:)?\s*(?:Rs\.?|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (deliveryMatch) {
        deliveryCharge = parseFloat(deliveryMatch[1]);
        recognizedFields.push(`Delivery Charge: ${deliveryCharge}`);
        sentenceRecognized = true;
      }

      // Check Discount: "10% discount", "discount 50", "discount of 200"
      const pctDiscountMatch = sentence.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*discount/i);
      if (pctDiscountMatch) {
        discountType = 'percentage';
        discountValue = parseFloat(pctDiscountMatch[1]);
        recognizedFields.push(`Discount: ${discountValue}%`);
        sentenceRecognized = true;
      } else {
        const fixedDiscountMatch = sentence.match(/discount(?:\s+of)?\s*(?:Rs\.?|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
        if (fixedDiscountMatch) {
          discountType = 'fixed';
          discountValue = parseFloat(fixedDiscountMatch[1]);
          recognizedFields.push(`Fixed Discount: ${discountValue}`);
          sentenceRecognized = true;
        }
      }

      // Check Payment: "no payment has been received", "paid 500", "received 200"
      if (/no\s+payment\s+(?:has\s+been\s+)?(?:received|made)/i.test(sentence)) {
        amountPaid = 0;
        recognizedFields.push('Payment status: Unpaid (0)');
        sentenceRecognized = true;
      } else {
        const paidMatch = sentence.match(/(?:received|paid|deposit\s+of)\s*(?:Rs\.?|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
        if (paidMatch) {
          amountPaid = parseFloat(paidMatch[1]);
          recognizedFields.push(`Payment recorded: ${amountPaid}`);
          sentenceRecognized = true;
        }
      }

      // Check Items in sentence:
      // Pattern: "Add one bouquet for Rs. 2500 and one bento cake for Rs. 1500"
      // or "2 brand logos at $500 each"
      const itemSegments = sentence.split(/\band\b|\balso\b/i);
      for (const segment of itemSegments) {
        const itemMatch = segment.match(/(?:add\s+)?(?:([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten)\s+)?([A-Za-z0-9\s\-]+?)\s+(?:for|at|@|costing)\s+(?:Rs\.?|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
        if (itemMatch) {
          const rawQty = itemMatch[1];
          let qty = 1;
          if (rawQty) {
            const wordToNum: Record<string, number> = {
              one: 1, two: 2, three: 3, four: 4, five: 5,
              six: 6, seven: 7, eight: 8, nine: 9, ten: 10
            };
            qty = wordToNum[rawQty.toLowerCase()] || parseInt(rawQty, 10) || 1;
          }
          let desc = itemMatch[2].replace(/^(?:an?|the|add)\s+/i, '').trim();
          if (rawQty) {
            desc = desc.replace(new RegExp(`^${rawQty}\\s+`, 'i'), '').trim();
          }
          desc = desc.replace(/^(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+/i, '').trim();
          const price = parseFloat(itemMatch[3]);

          if (desc && !isNaN(price) && !desc.toLowerCase().includes('delivery') && !desc.toLowerCase().includes('discount')) {
            items.push({
              description: desc.charAt(0).toUpperCase() + desc.slice(1),
              quantity: qty,
              unitPrice: price
            });
            recognizedFields.push(`Item: ${qty}x "${desc}" @ ${price}`);
            sentenceRecognized = true;
          }
        }
      }

      if (!sentenceRecognized) {
        unparsedSegments.push(sentence);
      }
    }

    // Detect missing fields
    if (!customerName) missingFields.push('Customer Name');
    if (items.length === 0) missingFields.push('Line Items / Products');

    // Confidence scoring
    let confidence = 0.4;
    if (customerName) confidence += 0.3;
    if (items.length > 0) confidence += 0.3;
    if (unparsedSegments.length > 0) confidence -= 0.15;
    const confidenceScore = Math.max(0.1, Math.min(1.0, Math.round(confidence * 100) / 100));

    return {
      customerName,
      customerEmail,
      items,
      deliveryCharge,
      discountValue,
      discountType,
      amountPaid,
      currency,
      recognizedFields,
      unparsedSegments,
      confidenceScore,
      missingFields
    };
  }

  async suggestInvoiceEdits(
    currentData: Partial<ExtractedInvoiceData>,
    userRequest: string
  ): Promise<Partial<ExtractedInvoiceData>> {
    // Local fallback edit suggestions based on user command
    const parsed = await this.parseInvoiceInstruction(userRequest);
    return {
      ...currentData,
      ...parsed,
      items: parsed.items.length > 0 ? parsed.items : currentData.items
    };
  }

  validateExtractedInvoice(data: ExtractedInvoiceData): { valid: boolean; warnings: string[]; errors: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.customerName || data.customerName.trim().length === 0) {
      warnings.push('Customer name was not recognized and should be specified.');
    }
    if (!data.items || data.items.length === 0) {
      errors.push('No product or service line items were recognized in the instruction.');
    }
    if (data.unparsedSegments.length > 0) {
      warnings.push(`Some parts of your request could not be reliably parsed: "${data.unparsedSegments.join('; ')}". Please review manually.`);
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  summarizeMissingFields(data: ExtractedInvoiceData): string[] {
    return data.missingFields;
  }
}

/**
 * Remote AI Service Adapter placeholder for Phase 2 backend integration.
 * In Phase 2, this will send requests to a secure server-side endpoint (/api/ai/parse-invoice).
 */
export class RemoteInvoiceAIServiceAdapter implements InvoiceAIService {
  private endpointUrl: string;

  constructor(endpointUrl: string = '/api/ai/parse-invoice') {
    this.endpointUrl = endpointUrl;
  }

  async parseInvoiceInstruction(instruction: string, defaultCurrency: string = 'USD'): Promise<ExtractedInvoiceData> {
    // When backend API route is implemented in Phase 2:
    // const res = await fetch(this.endpointUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ instruction, defaultCurrency })
    // });
    // return await res.json();

    // Fallback to local parser while backend is not connected
    const fallback = new LocalInvoiceInstructionParser();
    return fallback.parseInvoiceInstruction(instruction, defaultCurrency);
  }

  async suggestInvoiceEdits(currentData: Partial<ExtractedInvoiceData>, userRequest: string): Promise<Partial<ExtractedInvoiceData>> {
    const fallback = new LocalInvoiceInstructionParser();
    return fallback.suggestInvoiceEdits(currentData, userRequest);
  }

  validateExtractedInvoice(data: ExtractedInvoiceData): { valid: boolean; warnings: string[]; errors: string[] } {
    const fallback = new LocalInvoiceInstructionParser();
    return fallback.validateExtractedInvoice(data);
  }

  summarizeMissingFields(data: ExtractedInvoiceData): string[] {
    const fallback = new LocalInvoiceInstructionParser();
    return fallback.summarizeMissingFields(data);
  }
}

export const invoiceAIService = new LocalInvoiceInstructionParser();
