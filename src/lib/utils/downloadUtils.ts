/**
 * Cross-browser download utilities
 * Optimized for mobile devices (iOS Safari, Android Chrome) and desktop browsers
 */

import { detectDeviceType } from '@/lib/device/deviceDetection';

/**
 * Detects if the current browser is Safari
 */
export function isSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
}

/**
 * Detects if we're on iOS (any browser)
 */
export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detects if we're on Android
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Detects if we're on a mobile device
 */
export function isMobile(): boolean {
  return detectDeviceType() === 'phone';
}

/**
 * Detects if we're on a tablet
 */
export function isTablet(): boolean {
  return detectDeviceType() === 'tablet';
}

/**
 * Detects if we're in a PWA/standalone mode
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Cross-browser download from base64 data URL
 * Works reliably on Safari, Chrome, Firefox, and mobile
 */
export async function downloadFromBase64(
  base64DataUrl: string, 
  filename: string
): Promise<boolean> {
  try {
    // Convert base64 to blob
    const response = await fetch(base64DataUrl);
    const blob = await response.blob();
    
    return downloadFromBlob(blob, filename);
  } catch (error) {
    console.error('[downloadUtils] Download from base64 failed:', error);
    
    // Mobile fallback: open in new tab for manual save
    if (isMobile() || isTablet()) {
      openInNewTab(base64DataUrl);
      return true;
    }
    
    // Desktop fallback: try direct link with data URL
    try {
      const link = document.createElement('a');
      link.href = base64DataUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (fallbackError) {
      console.error('[downloadUtils] Fallback download failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Cross-browser download from Blob
 * Uses different strategies for Safari/iOS vs other browsers
 */
export async function downloadFromBlob(
  blob: Blob, 
  filename: string
): Promise<boolean> {
  try {
    // iOS always needs special handling (all browsers use WebKit)
    if (isIOS()) {
      return downloadBlobIOS(blob, filename);
    }
    
    // Android Chrome has good blob support
    if (isAndroid()) {
      return downloadBlobAndroid(blob, filename);
    }
    
    // Safari on macOS needs special handling
    if (isSafari()) {
      return downloadBlobSafari(blob, filename);
    }
    
    // Standard approach for Chrome, Firefox, Edge on desktop
    return downloadBlobStandard(blob, filename);
  } catch (error) {
    console.error('[downloadUtils] Download from blob failed:', error);
    return false;
  }
}

/**
 * Standard download using blob URL and link click
 * Works for Chrome, Firefox, Edge on desktop
 */
function downloadBlobStandard(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Must be in DOM for Firefox
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    return true;
  } catch (error) {
    console.error('[downloadUtils] Standard download failed:', error);
    return false;
  }
}

/**
 * iOS-specific download handling
 * iOS restricts downloads heavily - we use share sheet when available
 */
async function downloadBlobIOS(blob: Blob, filename: string): Promise<boolean> {
  try {
    // Try Web Share API first (best UX on iOS)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: blob.type });
      const shareData = { files: [file] };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    }
  } catch (shareError) {
    // Share was cancelled or not available, continue with fallback
    console.log('[downloadUtils] iOS share not available or cancelled');
  }
  
  try {
    // Fallback: convert to data URL and open in new tab
    const dataUrl = await blobToDataUrl(blob);
    openInNewTab(dataUrl, filename);
    return true;
  } catch (error) {
    console.error('[downloadUtils] iOS download failed:', error);
    return false;
  }
}

/**
 * Android-specific download handling
 * Modern Android Chrome has good blob URL support
 */
async function downloadBlobAndroid(blob: Blob, filename: string): Promise<boolean> {
  try {
    // Try standard approach first - works on modern Android
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Small delay helps Android process the click
    await new Promise(resolve => setTimeout(resolve, 50));
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
    
    return true;
  } catch (error) {
    console.error('[downloadUtils] Android standard download failed:', error);
    
    // Fallback: try share API on Android
    try {
      if (navigator.share) {
        const file = new File([blob], filename, { type: blob.type });
        await navigator.share({ files: [file] });
        return true;
      }
    } catch {
      // Share failed, try data URL
    }
    
    // Last resort: data URL in new tab
    const dataUrl = await blobToDataUrl(blob);
    openInNewTab(dataUrl, filename);
    return true;
  }
}

/**
 * Safari-compatible download for macOS
 * Safari has issues with blob URLs and programmatic link clicks
 */
async function downloadBlobSafari(blob: Blob, filename: string): Promise<boolean> {
  try {
    // Try using File System Access API if available (modern Safari)
    if ('showSaveFilePicker' in window) {
      const result = await downloadWithFilePicker(blob, filename);
      if (result) return true;
    }
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    
    // For Safari on macOS, we need to open in a new window
    // then trigger the download from there
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank'; // This helps Safari
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Use a slight delay for Safari
    await new Promise(resolve => setTimeout(resolve, 100));
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
    
    return true;
  } catch (error) {
    console.error('[downloadUtils] Safari download failed:', error);
    
    // Last resort: convert to data URL and try that
    return await downloadBlobAsDataUrl(blob, filename);
  }
}

/**
 * Fallback: Convert blob to data URL and download
 * This works on Safari but is slower for large files
 */
async function downloadBlobAsDataUrl(blob: Blob, filename: string): Promise<boolean> {
  try {
    const dataUrl = await blobToDataUrl(blob);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('[downloadUtils] Data URL download failed:', error);
    return false;
  }
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Modern File System Access API download
 * Works on newer browsers with proper file picker
 */
async function downloadWithFilePicker(blob: Blob, filename: string): Promise<boolean> {
  try {
    // Determine file type from filename
    const extension = filename.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = extension === 'gif' ? 'image/gif' : 'image/png';
    
    // @ts-ignore - File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: extension.toUpperCase() + ' Image',
        accept: { [mimeType]: [`.${extension}`] },
      }],
    });
    
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    
    return true;
  } catch (error) {
    // User cancelled or API not supported
    if ((error as Error).name !== 'AbortError') {
      console.error('[downloadUtils] File picker download failed:', error);
    }
    return false;
  }
}

/**
 * Open image in new tab for manual save
 * Last resort fallback that always works
 * Mobile-optimized with touch-friendly instructions
 */
export function openInNewTab(base64DataUrl: string, filename?: string): void {
  const isMobileDevice = isMobile() || isTablet();
  const isIOSDevice = isIOS();
  
  const instructions = isIOSDevice 
    ? 'Tap and hold the image, then select "Add to Photos" or "Save Image"'
    : isMobileDevice
    ? 'Long-press the image and select "Download image" or "Save image"'
    : 'Right-click the image to save';
  
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename ? `Save: ${filename}` : 'Save Image'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #111;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 16px;
              -webkit-tap-highlight-color: transparent;
            }
            .container {
              max-width: 100%;
              text-align: center;
            }
            .instructions {
              color: #fff;
              font-size: ${isMobileDevice ? '16px' : '14px'};
              margin-bottom: 20px;
              padding: ${isMobileDevice ? '16px' : '12px'};
              background: rgba(255,255,255,0.1);
              border-radius: 12px;
              line-height: 1.5;
            }
            .filename {
              color: #888;
              font-size: 12px;
              margin-top: 8px;
              word-break: break-all;
            }
            img {
              max-width: 100%;
              max-height: ${isMobileDevice ? '70vh' : '80vh'};
              border-radius: 8px;
              box-shadow: 0 4px 24px rgba(0,0,0,0.5);
              touch-action: manipulation;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <p class="instructions">
              ${instructions}
              ${filename ? `<span class="filename">${filename}</span>` : ''}
            </p>
            <img src="${base64DataUrl}" alt="Vision Export" />
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
  } else {
    // Popup blocked - try direct navigation
    window.location.href = base64DataUrl;
  }
}
