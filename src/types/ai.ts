export interface ExtractedInvoiceData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryCharge?: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed' | 'none';
  taxRate?: number;
  notes?: string;
  amountPaid?: number;
  currency?: string;
  recognizedFields: string[];
  unparsedSegments: string[];
  confidenceScore: number;
  missingFields: string[];
}

export interface InvoiceAIService {
  parseInvoiceInstruction(instruction: string, defaultCurrency?: string): Promise<ExtractedInvoiceData>;
  suggestInvoiceEdits(currentData: Partial<ExtractedInvoiceData>, userRequest: string): Promise<Partial<ExtractedInvoiceData>>;
  validateExtractedInvoice(data: ExtractedInvoiceData): { valid: boolean; warnings: string[]; errors: string[] };
  summarizeMissingFields(data: ExtractedInvoiceData): string[];
}
