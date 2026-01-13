/**
 * Invisible Watermark Utility
 * 
 * Embeds invisible ownership data into visualization images using LSB steganography.
 * This allows tracking of unauthorized distribution without visible marks on the image.
 * 
 * The watermark encodes:
 * - Visualization ID
 * - Owner user ID  
 * - Timestamp of export
 * - Checksum for verification
 */

// Magic header to identify En Pensent watermarked images
const WATERMARK_HEADER = 'ENPENSENT';
const VERSION = 1;

interface WatermarkData {
  visualizationId: string;
  userId: string;
  timestamp: number;
  shareId?: string;
}

/**
 * Converts a string to binary representation
 */
function stringToBinary(str: string): string {
  return str.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
}

/**
 * Converts binary string back to regular string
 */
function binaryToString(binary: string): string {
  const bytes = binary.match(/.{8}/g);
  if (!bytes) return '';
  return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
}

/**
 * Simple checksum for data verification
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
}

/**
 * Prepares watermark payload
 */
function preparePayload(data: WatermarkData): string {
  const content = JSON.stringify({
    v: VERSION,
    vid: data.visualizationId,
    uid: data.userId,
    ts: data.timestamp,
    sid: data.shareId || '',
  });
  
  const checksum = calculateChecksum(content);
  return `${WATERMARK_HEADER}|${checksum}|${content}|END`;
}

/**
 * Embeds invisible watermark into a canvas using LSB steganography
 * Modifies the least significant bit of color channels to encode data
 * 
 * @param canvas - The canvas to watermark
 * @param data - The watermark data to embed
 * @returns The watermarked canvas
 */
export function embedInvisibleWatermark(
  canvas: HTMLCanvasElement,
  data: WatermarkData
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  const payload = preparePayload(data);
  const binaryData = stringToBinary(payload);
  
  // Calculate how many pixels we need (3 bits per pixel - R, G, B channels)
  const bitsNeeded = binaryData.length;
  const pixelsNeeded = Math.ceil(bitsNeeded / 3);
  
  // Check if image has enough capacity
  const totalPixels = canvas.width * canvas.height;
  if (pixelsNeeded > totalPixels * 0.1) {
    console.warn('Watermark data too large for image, truncating');
  }
  
  // Embed data using LSB steganography
  // We modify the least significant bit of R, G, B channels
  let bitIndex = 0;
  
  // First, encode the length of the data (32 bits)
  const lengthBinary = binaryData.length.toString(2).padStart(32, '0');
  
  // Embed length in first ~11 pixels
  for (let i = 0; i < 32 && i < pixels.length; i++) {
    const pixelBase = Math.floor(i / 3) * 4;
    const channel = i % 3; // 0=R, 1=G, 2=B
    
    if (pixelBase + channel < pixels.length) {
      // Clear LSB and set new value
      pixels[pixelBase + channel] = (pixels[pixelBase + channel] & 0xFE) | parseInt(lengthBinary[i], 10);
    }
  }
  
  // Start embedding actual data after length header
  const startPixel = 11 * 4; // Start after length pixels
  
  for (let i = 0; i < binaryData.length && startPixel + Math.floor(i / 3) * 4 < pixels.length; i++) {
    const pixelBase = startPixel + Math.floor(i / 3) * 4;
    const channel = i % 3;
    
    if (pixelBase + channel < pixels.length) {
      const bit = parseInt(binaryData[i], 10);
      pixels[pixelBase + channel] = (pixels[pixelBase + channel] & 0xFE) | bit;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Extracts invisible watermark from an image
 * Used for verification and tracking
 * 
 * @param canvas - The canvas to extract from
 * @returns The watermark data or null if not found/invalid
 */
export function extractInvisibleWatermark(canvas: HTMLCanvasElement): WatermarkData | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  try {
    // Extract length from first 32 bits
    let lengthBinary = '';
    for (let i = 0; i < 32 && i < pixels.length; i++) {
      const pixelBase = Math.floor(i / 3) * 4;
      const channel = i % 3;
      lengthBinary += (pixels[pixelBase + channel] & 1).toString();
    }
    
    const dataLength = parseInt(lengthBinary, 2);
    if (dataLength <= 0 || dataLength > 10000) {
      return null; // Invalid or no watermark
    }
    
    // Extract actual data
    const startPixel = 11 * 4;
    let binaryData = '';
    
    for (let i = 0; i < dataLength && startPixel + Math.floor(i / 3) * 4 < pixels.length; i++) {
      const pixelBase = startPixel + Math.floor(i / 3) * 4;
      const channel = i % 3;
      binaryData += (pixels[pixelBase + channel] & 1).toString();
    }
    
    const payload = binaryToString(binaryData);
    
    // Verify header
    if (!payload.startsWith(WATERMARK_HEADER)) {
      return null;
    }
    
    // Parse payload
    const parts = payload.split('|');
    if (parts.length < 4) return null;
    
    const checksum = parts[1];
    const content = parts[2];
    
    // Verify checksum
    if (calculateChecksum(content) !== checksum) {
      console.warn('Watermark checksum mismatch');
      return null;
    }
    
    const parsed = JSON.parse(content);
    
    return {
      visualizationId: parsed.vid,
      userId: parsed.uid,
      timestamp: parsed.ts,
      shareId: parsed.sid || undefined,
    };
  } catch (error) {
    console.error('Failed to extract watermark:', error);
    return null;
  }
}

/**
 * Applies invisible watermark to a base64 image
 * 
 * @param base64Image - The base64 encoded image
 * @param data - The watermark data to embed
 * @returns Promise with the watermarked base64 image
 */
export async function watermarkBase64Image(
  base64Image: string,
  data: WatermarkData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Embed watermark
      embedInvisibleWatermark(canvas, data);
      
      // Return as base64
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
}
