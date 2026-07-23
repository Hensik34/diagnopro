import * as pdfjsLib from 'pdfjs-dist';
// Bundled worker (Vite resolves `?url` to an emitted asset URL)
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// A4 aspect ratio target width for rasterized pages (keeps file size reasonable
// while staying crisp when printed to A4).
const RASTER_TARGET_WIDTH = 1240; // ~150 DPI at A4 width

export interface RasterizedPage {
  dataUrl: string;   // data:image/jpeg;base64,...
  pageIndex: number;
  totalPages: number;
}

/**
 * Render every page of a PDF file into JPEG data URLs using pdf.js.
 */
export async function rasterizePdf(file: File): Promise<RasterizedPage[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;
  const pages: RasterizedPage[] = [];

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = RASTER_TARGET_WIDTH / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      // White background so transparent PDFs don't render black.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      pages.push({
        dataUrl: canvas.toDataURL('image/jpeg', 0.85),
        pageIndex: pageNum - 1,
        totalPages,
      });
      page.cleanup();
    }
  } finally {
    pdf.destroy();
  }

  return pages;
}

/**
 * Read an image file into a data URL.
 */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

/**
 * Turn a selected file (PDF or image) into one or more page images ready to upload.
 * PDFs are rasterized page-by-page; images become a single page.
 */
export async function fileToAttachmentPages(
  file: File
): Promise<{ sourceType: 'pdf' | 'image'; pages: { dataUrl: string; pageIndex: number; totalPages: number }[] }> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) {
    const rasterized = await rasterizePdf(file);
    return { sourceType: 'pdf', pages: rasterized };
  }
  const dataUrl = await readImageAsDataUrl(file);
  return { sourceType: 'image', pages: [{ dataUrl, pageIndex: 0, totalPages: 1 }] };
}
