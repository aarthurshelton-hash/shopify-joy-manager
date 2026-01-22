/**
 * Rate Limiting Hook v2 - Uses unified core
 * 
 * Simplified API with sliding window accuracy
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  checkRateLimit, 
  getBrowserIdentifier,
  RateLimitProfile,
  RateLimitResult,
  RATE_LIMIT_PROFILES 
} from '@/lib/rateLimitCore';

interface UseRateLimitOptions {
  profile: RateLimitProfile;
  showToast?: boolean;
  onLimited?: (result: RateLimitResult) => void;
}

interface UseRateLimitReturn {
  check: () => RateLimitResult;
  isLimited: boolean;
  remaining: number | null;
  resetInMs: number | null;
  reset: () => void;
}

export function useRateLimitV2({
  profile,
  showToast = true,
  onLimited,
}: UseRateLimitOptions): UseRateLimitReturn {
  const [state, setState] = useState({
    isLimited: false,
    remaining: null as number | null,
    resetInMs: null as number | null,
  });
  
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const identifierRef = useRef<string>();

  // Memoize identifier
  useEffect(() => {
    identifierRef.current = getBrowserIdentifier();
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const check = useCallback((): RateLimitResult => {
    const identifier = identifierRef.current || getBrowserIdentifier();
    const result = checkRateLimit(identifier, profile);

    setState({
      isLimited: !result.allowed,
      remaining: result.remaining,
      resetInMs: result.resetInMs,
    });

    if (!result.allowed) {
      if (showToast && result.retryAfter) {
        toast.error(`Rate limited. Try again in ${result.retryAfter}s`);
      }
      onLimited?.(result);

      // Auto-reset state when limit expires
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setState(s => ({ ...s, isLimited: false }));
      }, result.resetInMs);
    }

    return result;
  }, [profile, showToast, onLimited]);

  const reset = useCallback(() => {
    setState({ isLimited: false, remaining: null, resetInMs: null });
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  return {
    check,
    isLimited: state.isLimited,
    remaining: state.remaining,
    resetInMs: state.resetInMs,
    reset,
  };
}

// ============================================
// Pre-configured hooks for common use cases
// ============================================

export function useAuthRateLimit() {
  return useRateLimitV2({ profile: 'auth' });
}

export function usePaymentRateLimit() {
  return useRateLimitV2({ profile: 'payment' });
}

export function useSearchRateLimit() {
  return useRateLimitV2({ profile: 'search', showToast: false });
}

export function useDownloadRateLimit() {
  return useRateLimitV2({ profile: 'download' });
}

export function useUploadRateLimit() {
  return useRateLimitV2({ profile: 'upload' });
}

export function useBenchmarkRateLimit() {
  return useRateLimitV2({ profile: 'benchmark' });
}

export function useScanRateLimit() {
  return useRateLimitV2({ profile: 'scan' });
}

// Export profiles for reference
export { RATE_LIMIT_PROFILES };
