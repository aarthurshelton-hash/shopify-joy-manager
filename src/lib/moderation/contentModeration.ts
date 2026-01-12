import { supabase } from '@/integrations/supabase/client';
import { flagContent, checkUserBanStatus } from './flagContent';

interface ModerationResult {
  safe: boolean;
  reason?: string;
  flagged?: boolean; // Content was flagged for admin review
}

/**
 * Check if the current user is banned before allowing content submission
 */
export async function checkBanBeforeAction(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const banStatus = await checkUserBanStatus(userId);
  if (banStatus.isBanned) {
    const expiryText = banStatus.expiresAt 
      ? `Your ban expires on ${new Date(banStatus.expiresAt).toLocaleDateString()}.` 
      : 'This is a permanent ban.';
    return { 
      allowed: false, 
      reason: `Your account has been suspended. Reason: ${banStatus.reason}. ${expiryText}` 
    };
  }
  return { allowed: true };
}

/**
 * Moderate text content for inappropriate language
 * Also flags suspicious content for admin review
 */
export async function moderateText(
  text: string, 
  options?: { 
    userId?: string; 
    contentType?: string;
    contentId?: string;
  }
): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  // Check if user is banned first
  if (options?.userId) {
    const banCheck = await checkBanBeforeAction(options.userId);
    if (!banCheck.allowed) {
      return { safe: false, reason: banCheck.reason };
    }
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

    // If content is flagged as unsafe, record it for admin review
    if (!data.safe && options?.userId && options?.contentType) {
      await flagContent(
        options.contentType,
        options.userId,
        data.reason || 'Detected inappropriate content',
        {
          contentId: options.contentId,
          contentText: text,
          severity: 'medium',
        }
      );
    }

    return {
      safe: data.safe,
      reason: data.reason,
      flagged: !data.safe,
    };
  } catch (error) {
    console.error('Text moderation error:', error);
    return { safe: true };
  }
}

/**
 * Moderate image content for inappropriate imagery
 * Also flags suspicious content for admin review
 */
export async function moderateImage(
  imageBase64: string,
  options?: {
    userId?: string;
    contentType?: string;
    contentId?: string;
    imageUrl?: string;
  }
): Promise<ModerationResult> {
  if (!imageBase64) {
    return { safe: false, reason: 'No image provided' };
  }

  // Check if user is banned first
  if (options?.userId) {
    const banCheck = await checkBanBeforeAction(options.userId);
    if (!banCheck.allowed) {
      return { safe: false, reason: banCheck.reason };
    }
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

    // If content is flagged as unsafe, record it for admin review
    if (!data.safe && options?.userId && options?.contentType) {
      await flagContent(
        options.contentType,
        options.userId,
        data.reason || 'Detected inappropriate image',
        {
          contentId: options.contentId,
          contentImageUrl: options.imageUrl,
          severity: 'high',
        }
      );
    }

    return {
      safe: data.safe,
      reason: data.reason,
      flagged: !data.safe,
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
