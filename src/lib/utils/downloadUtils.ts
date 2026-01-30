/**
 * Cross-browser download utilities
 * Handles Safari, Chrome, Firefox, and mobile browsers
 */

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
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
    
    // Fallback: try direct link with data URL
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
 * Uses different strategies for Safari vs other browsers
 */
export async function downloadFromBlob(
  blob: Blob, 
  filename: string
): Promise<boolean> {
  try {
    // Safari and iOS need special handling
    if (isSafari() || isIOS()) {
      return downloadBlobSafari(blob, filename);
    }
    
    // Standard approach for Chrome, Firefox, Edge
    return downloadBlobStandard(blob, filename);
  } catch (error) {
    console.error('[downloadUtils] Download from blob failed:', error);
    return false;
  }
}

/**
 * Standard download using blob URL and link click
 * Works for Chrome, Firefox, Edge
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
 * Safari-compatible download
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
    setTimeout(() => {
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
    }, 100);
    
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
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve(true);
      } catch (error) {
        console.error('[downloadUtils] Data URL download failed:', error);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(blob);
  });
}

/**
 * Modern File System Access API download
 * Works on newer browsers with proper file picker
 */
async function downloadWithFilePicker(blob: Blob, filename: string): Promise<boolean> {
  try {
    // @ts-ignore - File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'PNG Image',
        accept: { 'image/png': ['.png'] },
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
 */
export function openInNewTab(base64DataUrl: string): void {
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head><title>Save Image</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111;">
          <div style="text-align:center;">
            <p style="color:white;font-family:system-ui;margin-bottom:20px;">
              Right-click or long-press the image to save
            </p>
            <img src="${base64DataUrl}" style="max-width:100%;max-height:90vh;" />
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
  }
}
