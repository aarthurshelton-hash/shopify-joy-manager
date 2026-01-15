import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { 
  checkRateLimit, 
  getAnonymousIdentifier, 
  RateLimitError,
  RATE_LIMITS 
} from '@/lib/rateLimit';

interface UseRateLimitOptions {
  endpoint: string;
  maxRequests?: number;
  windowSeconds?: number;
  showToast?: boolean;
}

interface UseRateLimitReturn {
  checkLimit: () => Promise<boolean>;
  isLimited: boolean;
  retryAfter: number | null;
  remaining: number | null;
}

/**
 * React hook for rate limiting user actions
 */
export function useRateLimit({
  endpoint,
  maxRequests = 100,
  windowSeconds = 60,
  showToast = true,
}: UseRateLimitOptions): UseRateLimitReturn {
  const [isLimited, setIsLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    try {
      const identifier = getAnonymousIdentifier();
      const result = await checkRateLimit(identifier, endpoint, maxRequests, windowSeconds);

      if (!result.allowed) {
        setIsLimited(true);
        setRetryAfter(result.retry_after || null);
        setRemaining(0);

        if (showToast) {
          toast.error(`Too many requests. Please wait ${result.retry_after} seconds.`);
        }

        // Auto-reset after retry period
        if (result.retry_after) {
          setTimeout(() => {
            setIsLimited(false);
            setRetryAfter(null);
          }, result.retry_after * 1000);
        }

        return false;
      }

      setIsLimited(false);
      setRetryAfter(null);
      setRemaining(result.remaining || null);
      return true;
    } catch (error) {
      if (error instanceof RateLimitError) {
        setIsLimited(true);
        setRetryAfter(error.retryAfter);
        
        if (showToast) {
          toast.error(error.message);
        }
        
        return false;
      }
      
      // For other errors, allow the request (fail open)
      console.warn('Rate limit check failed:', error);
      return true;
    }
  }, [endpoint, maxRequests, windowSeconds, showToast]);

  return {
    checkLimit,
    isLimited,
    retryAfter,
    remaining,
  };
}

/**
 * Pre-configured hooks for common operations
 */
export function useAuthRateLimit() {
  return useRateLimit({
    endpoint: 'auth',
    ...RATE_LIMITS.auth,
  });
}

export function usePaymentRateLimit() {
  return useRateLimit({
    endpoint: 'payment',
    ...RATE_LIMITS.payment,
  });
}

export function useSearchRateLimit() {
  return useRateLimit({
    endpoint: 'search',
    ...RATE_LIMITS.search,
    showToast: false, // Don't show toast for search
  });
}

export function useDownloadRateLimit() {
  return useRateLimit({
    endpoint: 'download',
    ...RATE_LIMITS.download,
  });
}

export function useUploadRateLimit() {
  return useRateLimit({
    endpoint: 'upload',
    ...RATE_LIMITS.upload,
  });
}

export function useListingRateLimit() {
  return useRateLimit({
    endpoint: 'listing',
    ...RATE_LIMITS.listing,
  });
}

export function useSaveRateLimit() {
  return useRateLimit({
    endpoint: 'save',
    ...RATE_LIMITS.save,
  });
}

export function useOfferRateLimit() {
  return useRateLimit({
    endpoint: 'offer',
    ...RATE_LIMITS.offer,
  });
}

export function useScanRateLimit() {
  return useRateLimit({
    endpoint: 'scan',
    ...RATE_LIMITS.scan,
  });
}