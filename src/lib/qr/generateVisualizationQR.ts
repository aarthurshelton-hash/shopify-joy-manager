import QRCode from 'qrcode';

interface QROptions {
  shareId: string;
  size?: number;
  includeLabel?: boolean;
}

/**
 * Generates a QR code data URL for a visualization share link
 */
export const generateQRDataUrl = async (
  shareId: string, 
  size: number = 100
): Promise<string> => {
  const url = `${window.location.origin}/v/${shareId}`;
  
  return QRCode.toDataURL(url, {
    width: size,
    margin: 0,
    color: {
      dark: '#D4AF37', // Brand gold
      light: '#00000000' // Transparent
    },
    errorCorrectionLevel: 'H' // High - allows for 30% logo overlay
  });
};

/**
 * Draws an artistic QR code onto a canvas context
 * Used for embedding in print images
 */
export const drawArtisticQR = async (
  ctx: CanvasRenderingContext2D,
  shareId: string,
  x: number,
  y: number,
  size: number = 60,
  logoImg?: HTMLImageElement
): Promise<void> => {
  const qrDataUrl = await generateQRDataUrl(shareId, size * 2);
  
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    
    qrImg.onload = () => {
      // Draw subtle background
      ctx.save();
      
      // Background with transparency
      const padding = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(x - padding, y - padding, size + padding * 2, size + padding * 2 + 10, 4);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw QR
      ctx.drawImage(qrImg, x, y, size, size);
      
      // Draw logo in center if provided
      if (logoImg) {
        const logoSize = size * 0.25;
        const logoX = x + (size - logoSize) / 2;
        const logoY = y + (size - logoSize) / 2;
        
        // Logo background circle
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Logo border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Draw logo
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      }
      
      // Draw "SCAN" label
      ctx.restore();
      ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.font = '6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN', x + size / 2, y + size + 8);
      
      resolve();
    };
    
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });
};

/**
 * Preloads the logo image for QR embedding
 */
export const preloadLogo = (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Use dynamic import to get the logo path
    img.src = '/src/assets/en-pensent-logo-new.png';
  });
};
