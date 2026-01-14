import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a base64 print image to Supabase storage and returns the public URL.
 * This URL is used by the fulfillment system (Printify) to fetch the print image.
 */
export async function uploadPrintImageToStorage(
  base64Image: string,
  gameTitle: string
): Promise<string | null> {
  try {
    // Extract the base64 data (remove data URL prefix if present)
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = gameTitle
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .substring(0, 50);
    const filename = `print-orders/${sanitizedTitle}-${timestamp}.png`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('print-images')
      .upload(filename, blob, {
        contentType: 'image/png',
        upsert: false,
      });
    
    if (error) {
      console.error('Failed to upload print image:', error);
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('print-images')
      .getPublicUrl(filename);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading print image to storage:', error);
    return null;
  }
}
