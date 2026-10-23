import { PageFormat } from '@/types/invoice';

export async function exportInvoiceToPdf(
  elementId: string,
  fileName: string = 'invoice.pdf',
  format: PageFormat = 'a4'
): Promise<void> {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Pre-wait for any embedded images (logos, etc.) to ensure complete rendering
  const images = Array.from(element.getElementsByTagName('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );

  // Dynamically import jspdf and html2canvas-pro (which supports modern lab/oklch colors) to ensure safe SSR handling
  const [jspdfModule, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas-pro').catch(() => import('html2canvas'))
  ]);

  // Robust jsPDF constructor resolution across ESM & CommonJS bundling
  // In jsPDF 4.x ESM, the constructor is exported as the named export `jsPDF`
  const JsPDFConstructor =
    (jspdfModule as any).jsPDF ||
    (typeof (jspdfModule as any).default === 'function' ? (jspdfModule as any).default : null) ||
    (jspdfModule as any).default?.jsPDF;

  const html2canvas = (html2canvasModule as any).default || html2canvasModule;

  if (!JsPDFConstructor) {
    throw new Error('jsPDF constructor could not be resolved from module exports');
  }

  const isA4 = format === 'a4';
  // Standard document widths at 96 DPI: A4 is 794px, Letter is 816px
  const standardDocWidthPx = isA4 ? 794 : 816;

  // Capture target element with high DPI scale and fixed desktop viewport
  // This ensures that regardless of gadget size (mobile, tablet, desktop),
  // the generated PDF is always formatted with consistent desktop document layout
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1280,
    windowHeight: 1600,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc: Document) => {
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.width = `${standardDocWidthPx}px`;
        clonedEl.style.minWidth = `${standardDocWidthPx}px`;
        clonedEl.style.maxWidth = `${standardDocWidthPx}px`;
        clonedEl.style.margin = '0 auto';
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.overflow = 'visible';

        // Unclamp any nested scrollable wrappers in the cloned tree
        const scrollables = clonedEl.querySelectorAll(
          '.overflow-x-auto, .overflow-y-auto, .overflow-hidden'
        );
        scrollables.forEach((node) => {
          (node as HTMLElement).style.overflow = 'visible';
          (node as HTMLElement).style.maxHeight = 'none';
        });
      }
    }
  });

  const imgData = canvas.toDataURL('image/png');

  // Page dimensions in mm
  // A4: 210 x 297 mm
  // Letter: 215.9 x 279.4 mm
  const pdfWidth = isA4 ? 210 : 215.9;
  const pdfHeight = isA4 ? 297 : 279.4;

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  const pdf = new JsPDFConstructor({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'letter',
    compress: true
  });

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Add extra pages if invoice exceeds one page (with 3mm safety margin)
  while (heightLeft > 3) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  // Save with Blob URL download fallback in case popup blocker interferes
  try {
    pdf.save(cleanFileName);
  } catch (saveErr) {
    console.warn('pdf.save failed, using fallback blob download:', saveErr);
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }
}

export function triggerBrowserPrint(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
