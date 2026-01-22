/**
 * Edge Function Rate Limiting - Shared utilities
 * 
 * Copy this pattern into edge functions for consistent rate limiting.
 * Uses sliding window with bounded memory.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxCacheSize?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Create a rate limiter instance for edge functions
 * 
 * Usage in edge function:
 * ```ts
 * const limiter = createEdgeRateLimiter({ maxRequests: 30, windowMs: 60_000 });
 * 
 * // In request handler:
 * const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
 * const { allowed, resetInMs } = limiter.check(clientIp);
 * if (!allowed) {
 *   return new Response(JSON.stringify({ error: 'Rate limited', resetInMs }), {
 *     status: 429,
 *     headers: { ...corsHeaders, 'Retry-After': String(Math.ceil(resetInMs / 1000)) }
 *   });
 * }
 * ```
 */
export function createEdgeRateLimiter(config: RateLimitConfig) {
  const cache = new Map<string, RateLimitEntry>();
  const maxSize = config.maxCacheSize ?? 500;
  let lastCleanup = Date.now();

  function cleanup(now: number): void {
    const windowStart = now - config.windowMs;
    for (const [key, entry] of cache) {
      entry.timestamps = entry.timestamps.filter(t => t > windowStart);
      if (entry.timestamps.length === 0) {
        cache.delete(key);
      }
    }
    lastCleanup = now;
  }

  function check(identifier: string): RateLimitResult {
    const now = Date.now();

    // Periodic cleanup (every minute)
    if (now - lastCleanup > 60_000) {
      cleanup(now);
    }

    let entry = cache.get(identifier);
    if (!entry) {
      // Evict oldest if at capacity
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      entry = { timestamps: [] };
      cache.set(identifier, entry);
    }

    // Sliding window filter
    const windowStart = now - config.windowMs;
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    const allowed = entry.timestamps.length < config.maxRequests;
    if (allowed) {
      entry.timestamps.push(now);
    }

    const oldestInWindow = entry.timestamps[0] || now;
    const resetInMs = Math.max(0, (oldestInWindow + config.windowMs) - now);

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.timestamps.length),
      resetInMs,
    };
  }

  function recordExternalLimit(identifier: string, retryAfterSec: number): void {
    // When external API returns 429, block this identifier
    const now = Date.now();
    let entry = cache.get(identifier);
    if (!entry) {
      entry = { timestamps: [] };
      cache.set(identifier, entry);
    }
    // Fill timestamps to max to ensure blocking
    const futureTime = now + (retryAfterSec * 1000);
    entry.timestamps = Array(config.maxRequests).fill(futureTime);
  }

  function getStats() {
    return { size: cache.size, maxSize };
  }

  return { check, recordExternalLimit, getStats, cleanup: () => cleanup(Date.now()) };
}

/**
 * Standard rate limit response for edge functions
 */
export function rateLimitResponse(
  resetInMs: number,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.ceil(resetInMs / 1000);
  return new Response(
    JSON.stringify({ 
      error: 'Rate limited', 
      resetInMs,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Extract client identifier from request
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  
  // Simple hash
  const raw = `${ip}:${ua}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
