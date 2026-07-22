export interface WatermarkOptions {
  imageBase64: string;
  title?: string;
  staffName?: string;
  kmReading?: string;
  timestamp?: string;
}

/**
 * Draws a simple, single-line watermark strip at the bottom of the image base64.
 * Features: Pure black background bar, crisp white text, compact height.
 * Format: Date & Time  |  KM Reading  |  Staff Name  |  Type
 */
export async function addWatermarkToImage(options: WatermarkOptions): Promise<string> {
  const { imageBase64, title = 'CHECK-IN', staffName, kmReading, timestamp } = options;

  if (!imageBase64 || typeof window === 'undefined') {
    return imageBase64;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageBase64);
          return;
        }

        // 1. Draw original image
        ctx.drawImage(img, 0, 0);

        // 2. Scale font size and padding relative to image size (slim & compact)
        const minDimension = Math.min(img.width, img.height);
        const scale = Math.max(minDimension / 1000, 0.6);
        const fontSize = Math.max(12, Math.round(14 * scale));
        const verticalPadding = Math.round(7 * scale);
        const horizontalPadding = Math.round(12 * scale);

        const dateStr = timestamp || new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        // 3. Assemble single-line text segments
        const cleanTitle = title.replace('DIAGNOPRO • ', '').trim();
        const segments: string[] = [
          dateStr,
          kmReading ? kmReading.toUpperCase() : null,
          staffName ? staffName : null,
          cleanTitle ? cleanTitle.toUpperCase() : null,
        ].filter(Boolean) as string[];

        const singleLineText = segments.join('  |  ');

        // 4. Calculate slim banner dimensions (single line)
        const bannerHeight = fontSize + (verticalPadding * 2);
        const bannerY = img.height - bannerHeight;

        // 5. Solid black background banner
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, bannerY, img.width, bannerHeight);

        // 6. Crisp white text
        ctx.fillStyle = '#ffffff';
        ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillText(singleLineText, horizontalPadding, bannerY + (bannerHeight / 2));

        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch (err) {
        console.error('Failed to add watermark to image:', err);
        resolve(imageBase64);
      }
    };

    img.onerror = () => {
      resolve(imageBase64);
    };

    img.src = imageBase64;
  });
}
