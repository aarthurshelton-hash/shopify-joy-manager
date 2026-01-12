import { supabase } from '@/integrations/supabase/client';

interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Moderate text content for inappropriate language
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('moderate-content', {
      body: { type: 'text', content: text },
    });

    if (error) {
      console.error('Text moderation error:', error);
      // Fail open - allow if moderation fails
      return { safe: true };
    }

    return {
      safe: data.safe,
      reason: data.reason,
    };
  } catch (error) {
    console.error('Text moderation error:', error);
    return { safe: true };
  }
}

/**
 * Moderate image content for inappropriate imagery
 */
export async function moderateImage(imageBase64: string): Promise<ModerationResult> {
  if (!imageBase64) {
    return { safe: false, reason: 'No image provided' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('moderate-content', {
      body: { type: 'image', content: imageBase64 },
    });

    if (error) {
      console.error('Image moderation error:', error);
      // Fail open - allow if moderation fails
      return { safe: true };
    }

    return {
      safe: data.safe,
      reason: data.reason,
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    return { safe: true };
  }
}

/**
 * Convert a File to base64 string for moderation
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Client-side quick check for obviously inappropriate text
 * Use as a fast pre-filter before server-side moderation
 */
export function quickTextCheck(text: string): { safe: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  // Very basic patterns for instant rejection
  const obviousPatterns = [
    /\b(fuck|shit|cunt|nigger|faggot)\b/gi,
  ];

  const normalized = text.toLowerCase();
  
  for (const pattern of obviousPatterns) {
    if (pattern.test(normalized)) {
      return { 
        safe: false, 
        reason: 'Content contains inappropriate language' 
      };
    }
  }

  return { safe: true };
}
