export interface ExtractedPalette {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
  textColor: string;
  backgroundColor: string;
  swatches: string[];
}

export interface ContrastResult {
  ratio: number;
  isNormalTextAA: boolean;
  isNormalTextAAA: boolean;
  isLargeTextAA: boolean;
  score: 'Poor' | 'Fair' | 'Good' | 'Excellent';
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Relative luminance for WCAG contrast
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(fgHex: string, bgHex: string): ContrastResult {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  const rounded = Math.round(ratio * 100) / 100;
  const isLargeTextAA = rounded >= 3.0;
  const isNormalTextAA = rounded >= 4.5;
  const isNormalTextAAA = rounded >= 7.0;

  let score: 'Poor' | 'Fair' | 'Good' | 'Excellent' = 'Poor';
  if (rounded >= 7.0) score = 'Excellent';
  else if (rounded >= 4.5) score = 'Good';
  else if (rounded >= 3.0) score = 'Fair';

  return {
    ratio: rounded,
    isNormalTextAA,
    isNormalTextAAA,
    isLargeTextAA,
    score
  };
}

/**
 * Extracts dominant colors from an image data URL using an offscreen canvas.
 * Safe for client-side execution in Next.js.
 */
export async function extractColorsFromImage(dataUrl: string): Promise<ExtractedPalette> {
  if (typeof window === 'undefined') {
    return getDefaultExtractedPalette();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(getDefaultExtractedPalette());
          return;
        }

        // Downscale for fast and smooth sampling
        const maxDim = 120;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.max(1, Math.floor(img.width * scale));
        const h = Math.max(1, Math.floor(img.height * scale));
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h).data;

        // Color quantization bucket map
        const colorCounts: { [hex: string]: { count: number; r: number; g: number; b: number; sat: number; lum: number } } = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const a = imgData[i + 3];
          if (a < 128) continue; // Skip transparent pixels

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Skip pure whites and pure blacks from dominant accent selection
          const lum = getLuminance(r, g, b);
          if (lum > 0.96 || lum < 0.04) continue;

          // Round down to bucket
          const step = 24;
          const qr = Math.floor(r / step) * step;
          const qg = Math.floor(g / step) * step;
          const qb = Math.floor(b / step) * step;
          const hex = rgbToHex(qr, qg, qb);

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;

          if (!colorCounts[hex]) {
            colorCounts[hex] = { count: 0, r: qr, g: qg, b: qb, sat, lum };
          }
          colorCounts[hex].count += 1;
        }

        const sortedColors = Object.values(colorCounts).sort((a, b) => {
          // Weight by frequency and saturation (we want vivid brand colors first)
          const scoreA = a.count * (1 + a.sat * 2);
          const scoreB = b.count * (1 + b.sat * 2);
          return scoreB - scoreA;
        });

        if (sortedColors.length === 0) {
          resolve(getDefaultExtractedPalette());
          return;
        }

        const swatches = sortedColors.slice(0, 8).map((c) => rgbToHex(c.r, c.g, c.b));

        // Primary color: highest scored vibrant color
        const primary = sortedColors[0];
        const primaryHex = rgbToHex(primary.r, primary.g, primary.b);

        // Secondary color: either deep shade or distinct complementary
        let secondaryHex = '#1E293B';
        const distinct = sortedColors.find((c) => {
          const dist = Math.abs(c.r - primary.r) + Math.abs(c.g - primary.g) + Math.abs(c.b - primary.b);
          return dist > 120 && c.lum < 0.45;
        });
        if (distinct) {
          secondaryHex = rgbToHex(distinct.r, distinct.g, distinct.b);
        } else {
          // Darken primary for secondary
          secondaryHex = rgbToHex(
            Math.max(15, Math.floor(primary.r * 0.4)),
            Math.max(20, Math.floor(primary.g * 0.4)),
            Math.max(35, Math.floor(primary.b * 0.4))
          );
        }

        // Accent color: bright high-saturation tone
        const accentCandidate = sortedColors.find((c) => {
          const hex = rgbToHex(c.r, c.g, c.b);
          return hex !== primaryHex && hex !== secondaryHex && c.sat > 0.4;
        });
        const accentHex = accentCandidate
          ? rgbToHex(accentCandidate.r, accentCandidate.g, accentCandidate.b)
          : '#38BDF8';

        // Neutral color: very light tint of primary
        const neutralHex = rgbToHex(
          Math.min(255, Math.floor(primary.r * 0.08 + 245)),
          Math.min(255, Math.floor(primary.g * 0.08 + 245)),
          Math.min(255, Math.floor(primary.b * 0.08 + 247))
        );

        resolve({
          primaryColor: primaryHex,
          secondaryColor: secondaryHex,
          accentColor: accentHex,
          neutralColor: neutralHex,
          textColor: '#0F172A',
          backgroundColor: '#FFFFFF',
          swatches
        });
      } catch {
        resolve(getDefaultExtractedPalette());
      }
    };

    img.onerror = () => {
      resolve(getDefaultExtractedPalette());
    };

    img.src = dataUrl;
  });
}

export function getDefaultExtractedPalette(): ExtractedPalette {
  return {
    primaryColor: '#6254E8',
    secondaryColor: '#171B32',
    accentColor: '#38BDF8',
    neutralColor: '#F8F9FC',
    textColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    swatches: ['#6254E8', '#171B32', '#38BDF8', '#10B981', '#F59E0B', '#64748B']
  };
}
