import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  blocked_until?: string;
  retry_after?: number;
}

// Local in-memory cache for rate limiting (reduces DB calls)
const localCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a request should be rate limited
 * Uses local cache first, then falls back to database for persistence
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const cacheKey = `${identifier}:${endpoint}`;
  const now = Date.now();
  
  // Check local cache first (faster)
  const cached = localCache.get(cacheKey);
  if (cached) {
    if (now < cached.resetAt) {
      if (cached.count >= maxRequests) {
        return {
          allowed: false,
          retry_after: Math.ceil((cached.resetAt - now) / 1000),
        };
      }
      cached.count++;
      return {
        allowed: true,
        remaining: maxRequests - cached.count,
      };
    } else {
      // Window expired, reset
      localCache.delete(cacheKey);
    }
  }
  
  // Initialize new window in local cache
  localCache.set(cacheKey, {
    count: 1,
    resetAt: now + (windowSeconds * 1000),
  });
  
  // For persistent tracking (abuse detection), also log to database
  // This runs in background and doesn't block the request
  logRateLimitCheck(identifier, endpoint, maxRequests, windowSeconds).catch(() => {
    // Silently fail - rate limiting should not break the app
  });
  
  return {
    allowed: true,
    remaining: maxRequests - 1,
  };
}

/**
 * Log rate limit check to database for persistence and abuse tracking
 */
async function logRateLimitCheck(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<void> {
  try {
    await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });
  } catch (error) {
    // Log but don't throw
    console.warn('Rate limit logging failed:', error);
  }
}

/**
 * Generate a hash for anonymous users based on available identifiers
 */
export function getAnonymousIdentifier(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth,
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `anon_${Math.abs(hash).toString(36)}`;
}

/**
 * Higher-order function to wrap API calls with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  endpoint: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = getAnonymousIdentifier();
    const result = await checkRateLimit(identifier, endpoint, maxRequests, windowSeconds);
    
    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${result.retry_after} seconds.`,
        result.retry_after || 60
      );
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Custom error class for rate limiting
 */
export class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Sensitive operations
  auth: { maxRequests: 5, windowSeconds: 60 },
  payment: { maxRequests: 10, windowSeconds: 60 },
  
  // Standard operations
  api: { maxRequests: 100, windowSeconds: 60 },
  search: { maxRequests: 30, windowSeconds: 60 },
  
  // Heavy operations
  download: { maxRequests: 20, windowSeconds: 60 },
  upload: { maxRequests: 10, windowSeconds: 60 },
  
  // Public endpoints
  publicView: { maxRequests: 200, windowSeconds: 60 },
} as const;

/**
 * Clean up expired entries from local cache (call periodically)
 */
export function cleanupLocalCache(): void {
  const now = Date.now();
  for (const [key, value] of localCache.entries()) {
    if (now >= value.resetAt) {
      localCache.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupLocalCache, 5 * 60 * 1000);
}