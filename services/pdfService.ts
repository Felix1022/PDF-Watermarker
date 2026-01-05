
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

    // Handle CJK characters by embedding a Songti (Noto Serif SC) font
    if (isNonLatin(config.text)) {
      if (!cachedFontBytes) {
        onStatusUpdate?.('正在下载宋体字体 (约10MB)...');
        
        // Use the official Google Fonts repository main branch which is more stable
        const fontSources = [
          'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notoserifsc/static/NotoSerifSC-Regular.ttf',
          'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/static/NotoSerifSC-Regular.ttf',
          'https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-serif@2.001R/SubsetOTF/CN/SourceHanSerifCN-Regular.otf'
        ];

        let success = false;
        let lastError = '';

        for (const url of fontSources) {
          try {
            onStatusUpdate?.(`尝试从节点下载字体...`);
            const response = await fetch(url, { 
              mode: 'cors', 
              cache: 'force-cache',
              // Add a longer timeout for large font files
              signal: AbortSignal.timeout(60000) 
            });
            
            if (response.ok) {
              cachedFontBytes = await response.arrayBuffer();
              success = true;
              break;
            }
            lastError = `HTTP ${response.status}: ${response.statusText}`;
          } catch (e: any) {
            lastError = e.message;
            console.warn(`Font source ${url} failed:`, e);
          }
        }

        if (!success) {
          throw new Error(`字体下载失败: ${lastError}。请检查您的网络连接或尝试更换网络环境。`);
        }
      }
      
      onStatusUpdate?.('正在向 PDF 注入字体资源...');
      font = await pdfDoc.embedFont(cachedFontBytes!);
    } else {
      onStatusUpdate?.('正在加载标准字体...');
      font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    onStatusUpdate?.('正在为每一页添加水印...');
    const color = hexToRgb(config.color);
    const stepX = Math.max(config.spacingX, 20);
    const stepY = Math.max(config.spacingY, 20);

    for (const page of pages) {
      const { width, height } = page.getSize();
      // Calculate a large enough area to cover the page regardless of rotation
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

    onStatusUpdate?.('正在保存并优化文档...');
    return await pdfDoc.save();
  } catch (error: any) {
    console.error('PDF Service Error:', error);
    if (error.message.includes('encode')) {
      throw new Error(`编码错误: 字体加载可能不完整，或包含特殊不支持的字符。`);
    }
    throw new Error(error.message || '处理 PDF 时发生未知错误。');
  }
};
