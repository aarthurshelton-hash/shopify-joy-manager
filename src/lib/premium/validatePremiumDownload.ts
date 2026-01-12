import { supabase } from '@/integrations/supabase/client';

interface PremiumValidationResult {
  allowed: boolean;
  reason: 'visionary' | 'subscription' | 'no_subscription' | 'error';
  message?: string;
  subscriptionEnd?: string;
}

/**
 * Validates premium download access via server-side edge function.
 * This ensures that premium features are validated on the server,
 * not just client-side.
 */
export async function validatePremiumDownload(): Promise<PremiumValidationResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return {
        allowed: false,
        reason: 'no_subscription',
        message: 'Please sign in to download HD images',
      };
    }

    const { data, error } = await supabase.functions.invoke('validate-premium-download', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Premium validation error:', error);
      return {
        allowed: false,
        reason: 'error',
        message: 'Failed to validate premium status. Please try again.',
      };
    }

    return {
      allowed: data.allowed,
      reason: data.reason,
      message: data.message,
      subscriptionEnd: data.subscription_end,
    };
  } catch (error) {
    console.error('Premium validation error:', error);
    return {
      allowed: false,
      reason: 'error',
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Checks if the user has premium access and returns a user-friendly message
 * if they don't.
 */
export async function checkPremiumAccess(): Promise<{
  hasPremium: boolean;
  message?: string;
}> {
  const result = await validatePremiumDownload();
  
  if (result.allowed) {
    return { hasPremium: true };
  }

  let message = 'Premium subscription required for HD downloads';
  
  if (result.reason === 'no_subscription') {
    message = result.message || 'Upgrade to Premium for unlimited HD downloads';
  } else if (result.reason === 'error') {
    message = result.message || 'Unable to verify premium status';
  }

  return { hasPremium: false, message };
}
