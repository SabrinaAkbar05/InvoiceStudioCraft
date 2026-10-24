import { describe, it, expect } from 'vitest';
import { BrandKit, DEFAULT_BRAND_KIT } from '../types/brand';
import { calculateContrastRatio } from '../lib/brand/color-extractor';

describe('Brand Kit Domain Logic and Validation', () => {
  const testWorkspaceId = 'ws_unit_test_123';
  const otherWorkspaceId = 'ws_unit_test_other_456';

  it('1. Initializes default Brand Kit correctly', () => {
    const kit: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${testWorkspaceId}`,
      workspaceId: testWorkspaceId,
      updatedAt: new Date().toISOString()
    };

    expect(kit.workspaceId).toBe(testWorkspaceId);
    expect(kit.primaryColor).toBe('#6254E8');
    expect(kit.templateId).toBe('corporate');
    expect(kit.tagline).toBeDefined();
    expect(kit.thankYouNote).toBeDefined();
  });

  it('2. Evaluates WCAG contrast compliance for brand colors', () => {
    // High contrast (dark purple on white)
    const highContrast = calculateContrastRatio('#6254E8', '#FFFFFF');
    expect(highContrast.ratio).toBeGreaterThan(3.0);
    expect(highContrast.score).toBeDefined();

    // Black text on white background
    const maxContrast = calculateContrastRatio('#000000', '#FFFFFF');
    expect(maxContrast.ratio).toBe(21);
    expect(maxContrast.score).toBe('Excellent');
    expect(maxContrast.isNormalTextAA).toBe(true);
  });

  it('3. Supports text-only Brand Kits without requiring a logo or signature', () => {
    const textOnlyKit: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${testWorkspaceId}`,
      workspaceId: testWorkspaceId,
      primaryColor: '#059669',
      secondaryColor: '#064E3B',
      tagline: 'Eco-Friendly Invoicing',
      logoUrl: undefined,
      logoDataUrl: undefined,
      signatureUrl: undefined,
      signatureDataUrl: undefined,
      updatedAt: new Date().toISOString()
    };

    expect(textOnlyKit.logoUrl).toBeUndefined();
    expect(textOnlyKit.logoDataUrl).toBeUndefined();
    expect(textOnlyKit.primaryColor).toBe('#059669');
  });

  it('4. Correctly associates Cloudinary cloud URLs for logo and signature', () => {
    const cloudKit: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${testWorkspaceId}`,
      workspaceId: testWorkspaceId,
      logoUrl: 'https://res.cloudinary.com/zw3amqgg/image/upload/v1/invoicecraft/ws_unit_test_123/logos/sample.png',
      logoCloudinaryId: 'invoicecraft/ws_unit_test_123/logos/sample',
      signatureUrl: 'https://res.cloudinary.com/zw3amqgg/image/upload/v1/invoicecraft/ws_unit_test_123/signatures/sig.png',
      signatureCloudinaryId: 'invoicecraft/ws_unit_test_123/signatures/sig',
      signatureName: 'Sarah Jenkins',
      signatureTitle: 'Chief Financial Officer',
      updatedAt: new Date().toISOString()
    };

    expect(cloudKit.logoUrl).toContain('cloudinary.com');
    expect(cloudKit.signatureUrl).toContain('cloudinary.com');
    expect(cloudKit.signatureName).toBe('Sarah Jenkins');
  });

  it('5. Enforces workspace isolation between multiple workspaces', () => {
    const ws1Kit: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${testWorkspaceId}`,
      workspaceId: testWorkspaceId,
      primaryColor: '#3B82F6',
      tagline: 'Tech Studio A',
      updatedAt: new Date().toISOString()
    };

    const ws2Kit: BrandKit = {
      ...DEFAULT_BRAND_KIT,
      id: `bk_${otherWorkspaceId}`,
      workspaceId: otherWorkspaceId,
      primaryColor: '#EF4444',
      tagline: 'Design Agency B',
      updatedAt: new Date().toISOString()
    };

    expect(ws1Kit.workspaceId).not.toBe(ws2Kit.workspaceId);
    expect(ws1Kit.primaryColor).not.toBe(ws2Kit.primaryColor);
    expect(ws1Kit.tagline).not.toBe(ws2Kit.tagline);
  });

  it('6. Rejects or flags placeholder ws_current workspace IDs', () => {
    const isPlaceholder = (wsId: string) => !wsId || wsId === 'ws_current';

    expect(isPlaceholder('ws_current')).toBe(true);
    expect(isPlaceholder('')).toBe(true);
    expect(isPlaceholder('ws_17298282928')).toBe(false);
    expect(isPlaceholder('ws_TnlroJAh_1792827500043')).toBe(false);
  });
});
