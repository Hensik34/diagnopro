export interface LetterheadAnalysis {
  topMargin: number;      // px from top where header artwork ends
  bottomMargin: number;   // px from bottom where footer artwork starts
  leftMargin: number;     // px from left where side artwork ends
  rightMargin: number;    // px from right where side artwork ends
  confidence: {           // 0-1 confidence score for each edge
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Automatically analyzes an image File to detect letterhead margins and content boundaries.
 * Scales the image internally to 794x1123 (A4 dimensions).
 */
export function analyzeLetterhead(file: File): Promise<LetterheadAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 794;
        canvas.height = 1123;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2D canvas context');
        }

        ctx.drawImage(img, 0, 0, 794, 1123);
        const imgData = ctx.getImageData(0, 0, 794, 1123);
        const pixels = imgData.data;

        // 1. Detect if colored/textured background (>80% non-white)
        let totalSamples = 0;
        let nonWhiteSamples = 0;
        const sampleStep = 15;

        for (let y = 10; y < 1123 - 10; y += sampleStep) {
          for (let x = 10; x < 794 - 10; x += sampleStep) {
            const idx = (y * 794 + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];

            totalSamples++;
            // Non-white if alpha > 30 and color is not pure/almost-pure white
            if (a > 30 && (r < 245 || g < 245 || b < 245)) {
              nonWhiteSamples++;
            }
          }
        }

        const isColoredBackground = totalSamples > 0 && (nonWhiteSamples / totalSamples) > 0.8;

        // 2. Determine background color by sampling a 100x100 box in the center
        let bgR = 255, bgG = 255, bgB = 255;
        if (isColoredBackground) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          const startX = 347; // 794/2 - 50
          const endX = 447;
          const startY = 511; // 1123/2 - 50
          const endY = 611;

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx = (y * 794 + x) * 4;
              sumR += pixels[idx];
              sumG += pixels[idx + 1];
              sumB += pixels[idx + 2];
              count++;
            }
          }

          if (count > 0) {
            bgR = Math.round(sumR / count);
            bgG = Math.round(sumG / count);
            bgB = Math.round(sumB / count);
          }
        }

        // 3. Define the content check function
        const isContentPixel = (r: number, g: number, b: number, a: number): boolean => {
          if (a <= 30) return false;
          if (isColoredBackground) {
            // Deviates significantly from the central background color
            return Math.abs(r - bgR) > 25 || Math.abs(g - bgG) > 25 || Math.abs(b - bgB) > 25;
          } else {
            // Deviates from pure white
            return r < 235 || g < 235 || b < 235;
          }
        };

        const topContentRows: number[] = [];
        const bottomContentRows: number[] = [];

        // 4. TOP detection (top 45% = 0 to 505)
        const topLimit = Math.floor(1123 * 0.45);
        for (let y = 0; y <= topLimit; y++) {
          let hasContent = false;
          // skip 20px from left/right edges, sample every 3rd pixel
          for (let x = 20; x <= 794 - 20; x += 3) {
            const idx = (y * 794 + x) * 4;
            if (isContentPixel(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3])) {
              hasContent = true;
              break;
            }
          }
          if (hasContent) {
            topContentRows.push(y);
          }
        }

        // 5. BOTTOM detection (bottom 45% = 1122 down to 618)
        const bottomLimit = 1123 - Math.floor(1123 * 0.45);
        for (let y = 1122; y >= bottomLimit; y--) {
          let hasContent = false;
          for (let x = 20; x <= 794 - 20; x += 3) {
            const idx = (y * 794 + x) * 4;
            if (isContentPixel(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3])) {
              hasContent = true;
              break;
            }
          }
          if (hasContent) {
            bottomContentRows.push(y);
          }
        }

        // 6. LEFT detection (left 20% = 0 to 158)
        const leftContentCols: number[] = [];
        const leftLimit = Math.floor(794 * 0.20);
        const middleHeightStart = Math.floor(1123 * 0.20);
        const middleHeightEnd = Math.floor(1123 * 0.80);

        for (let x = 0; x <= leftLimit; x++) {
          let hasContent = false;
          // Sample middle 60% height to avoid header/footer artwork
          for (let y = middleHeightStart; y <= middleHeightEnd; y += 3) {
            const idx = (y * 794 + x) * 4;
            if (isContentPixel(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3])) {
              hasContent = true;
              break;
            }
          }
          if (hasContent) {
            leftContentCols.push(x);
          }
        }

        // 7. RIGHT detection (right 20% = 793 down to 636)
        const rightContentCols: number[] = [];
        const rightLimit = 794 - Math.floor(794 * 0.20);
        for (let x = 793; x >= rightLimit; x--) {
          let hasContent = false;
          for (let y = middleHeightStart; y <= middleHeightEnd; y += 3) {
            const idx = (y * 794 + x) * 4;
            if (isContentPixel(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3])) {
              hasContent = true;
              break;
            }
          }
          if (hasContent) {
            rightContentCols.push(x);
          }
        }

        // 8. Calculate margins with buffers
        // TOP: last content row + 12px
        const lastTopRow = topContentRows.length > 0 ? Math.max(...topContentRows) : -1;
        const topMargin = lastTopRow !== -1 ? Math.max(30, lastTopRow + 12) : 60;

        // BOTTOM: 1123 - lastContentRow + 12px
        const lastBottomRow = bottomContentRows.length > 0 ? Math.min(...bottomContentRows) : -1;
        const bottomMargin = lastBottomRow !== -1 ? Math.max(20, (1123 - lastBottomRow) + 12) : 50;

        // LEFT: last content column + 8px
        const lastLeftCol = leftContentCols.length > 0 ? Math.max(...leftContentCols) : -1;
        const leftMargin = lastLeftCol !== -1 ? Math.max(12, lastLeftCol + 8) : 20;

        // RIGHT: 794 - lastContentColumn + 8px
        const lastRightCol = rightContentCols.length > 0 ? Math.min(...rightContentCols) : -1;
        const rightMargin = lastRightCol !== -1 ? Math.max(12, (794 - lastRightCol) + 8) : 20;

        // 9. Confidence scoring
        const computeConfidence = (indices: number[]): number => {
          if (indices.length === 0) return 1.0; // default value
          if (indices.length < 5) return 0.7; // too few content rows/cols to be sure

          const sorted = [...indices].sort((a, b) => a - b);
          const lastTen = sorted.slice(-10);
          let totalGap = 0;
          for (let i = 1; i < lastTen.length; i++) {
            totalGap += lastTen[i] - lastTen[i - 1];
          }
          const avgGap = totalGap / (lastTen.length - 1);

          if (avgGap <= 1.5) return 0.95;
          if (avgGap <= 3.0) return 0.85;
          if (avgGap <= 6.0) return 0.65;
          return 0.45;
        };

        const confidence = {
          top: computeConfidence(topContentRows),
          bottom: computeConfidence(bottomContentRows),
          left: computeConfidence(leftContentCols),
          right: computeConfidence(rightContentCols),
        };

        resolve({
          topMargin,
          bottomMargin,
          leftMargin,
          rightMargin,
          confidence,
        });

      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };

    img.src = objectUrl;
  });
}
