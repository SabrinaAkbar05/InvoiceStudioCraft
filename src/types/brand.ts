export type TemplateId = 'minimal' | 'corporate' | 'elegant' | 'creative';

export interface BrandKit {
  id: string;
  workspaceId: string;
  logoDataUrl?: string;
  logoCloudinaryId?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
  textColor: string;
  backgroundColor: string;
  fontHeading: string;
  fontBody: string;
  templateId: TemplateId;
  tagline?: string;
  thankYouNote?: string;
  defaultPaymentInstructions?: string;
  signatureDataUrl?: string;
  signatureCloudinaryId?: string;
  signatureUrl?: string;
  signatureName?: string;
  signatureTitle?: string;
  updatedAt: string;
}

export const DEFAULT_BRAND_KIT: Omit<BrandKit, 'id' | 'workspaceId'> = {
  primaryColor: '#6254E8',
  secondaryColor: '#171B32',
  accentColor: '#38BDF8',
  neutralColor: '#F1F5F9',
  textColor: '#0F172A',
  backgroundColor: '#FFFFFF',
  fontHeading: 'Inter',
  fontBody: 'Inter',
  templateId: 'corporate',
  tagline: 'Delivering excellence on time',
  thankYouNote: 'Thank you for your business. We appreciate your partnership!',
  defaultPaymentInstructions: 'Please wire funds to Bank Account:\nIBAN: US12 3456 7890 1234 5678 90\nSWIFT / BIC: INVCUS33\nReference: Invoice Number',
  updatedAt: '2024-01-01T00:00:00.000Z'
};
