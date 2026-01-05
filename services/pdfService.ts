
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { WatermarkConfig } from '../types';

/**
 * Detects if a string contains non-Latin characters (e.g., Chinese, Japanese, Korean)
 */
const isNonLatin = (text: string) => /[^\u0000-\u007F]/.test(text);

/**
 * Converts a hex color string to RGB object for pdf-lib
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0.8, g: 0.8, b: 0.8 };
};

// Global cache for font bytes to avoid repeated downloads in the same session
let cachedFontBytes: ArrayBuffer | null = null;

export const applyWatermark = async (
  pdfBuffer: ArrayBuffer,
  config: WatermarkConfig,
  onStatusUpdate?: (status: string) => void
): Promise<Uint8Array> => {
  try {
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdfDoc = await PDFDocument.load(uint8Array, { ignoreEncryption: false });
    
    // Register fontkit to enable custom font embedding
    pdfDoc.registerFontkit(fontkit);
    
    if (pdfDoc.isEncrypted) {
      throw new Error('This PDF is encrypted. Please remove protection first.');
    }

    const pages = pdfDoc.getPages();
    let font;

    // Handle CJK characters by embedding Noto Serif SC (Songti)
    if (isNonLatin(config.text)) {
      if (!cachedFontBytes) {
        onStatusUpdate?.('Downloading Songti Font (~10MB)...');
        
        // More reliable URLs for Noto Serif SC from the official google/fonts repository
        const fontSources = [
          'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notoserifsc/NotoSerifSC-Regular.ttf',
          'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC-Regular.ttf',
          'https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-serif@2.001R/SubsetOTF/CN/SourceHanSerifCN-Regular.otf'
        ];

        let success = false;
        let lastError = '';

        for (const url of fontSources) {
          try {
            onStatusUpdate?.(`Trying font source...`);
            const response = await fetch(url, { 
              mode: 'cors', 
              cache: 'force-cache',
              signal: AbortSignal.timeout(120000) // 2 minute timeout for large fonts
            });
            
            if (response.ok) {
              cachedFontBytes = await response.arrayBuffer();
              success = true;
              break;
            }
            lastError = `HTTP ${response.status}: ${response.statusText}`;
          } catch (e: any) {
            lastError = e.message;
            console.warn(`Failed to fetch from ${url}:`, e);
          }
        }

        if (!success) {
          throw new Error(`Font Load Failed: ${lastError}. Please check your internet connection or try a different network.`);
        }
      }
      
      onStatusUpdate?.('Embedding font subset...');
      font = await pdfDoc.embedFont(cachedFontBytes!);
    } else {
      onStatusUpdate?.('Loading standard font...');
      font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    onStatusUpdate?.('Applying watermark pattern...');
    const color = hexToRgb(config.color);
    const stepX = Math.max(config.spacingX, 20);
    const stepY = Math.max(config.spacingY, 20);

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      const diagonal = Math.sqrt(width * width + height * height);
      const startX = -diagonal / 2;
      const endX = width + diagonal / 2;
      const startY = -diagonal / 2;
      const endY = height + diagonal / 2;

      for (let x = startX; x < endX; x += stepX) {
        for (let y = startY; y < endY; y += stepY) {
          page.drawText(config.text, {
            x: x,
            y: y,
            size: config.fontSize,
            font: font,
            color: rgb(color.r, color.g, color.b),
            opacity: config.opacity,
            rotate: degrees(config.rotation),
          });
        }
      }
    }

    onStatusUpdate?.('Finalizing document...');
    return await pdfDoc.save();
  } catch (error: any) {
    console.error('PDF Service Error:', error);
    throw new Error(error.message || 'Unknown error during PDF processing.');
  }
};
