/**
 * Unified Rate Limiting Core - v7.12
 * 
 * Single source of truth for rate limiting with:
 * - Sliding window algorithm (more accurate than fixed buckets)
 * - Bounded memory with automatic cleanup
 * - No redundant DB calls (log only on limit exceeded)
 * - Shared configuration across client and edge functions
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  retryAfter?: number;
}

interface SlidingWindowEntry {
  timestamps: number[];
  lastCleanup: number;
}

// Bounded cache with automatic eviction
const MAX_CACHE_ENTRIES = 1000;
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute

class SlidingWindowLimiter {
  private cache = new Map<string, SlidingWindowEntry>();
  private lastGlobalCleanup = Date.now();

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    
    // Periodic global cleanup
    if (now - this.lastGlobalCleanup > CLEANUP_INTERVAL_MS) {
      this.globalCleanup(now, config.windowMs);
    }

    let entry = this.cache.get(key);
    
    if (!entry) {
      // Evict oldest if at capacity
      if (this.cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) this.cache.delete(oldestKey);
      }
      entry = { timestamps: [], lastCleanup: now };
      this.cache.set(key, entry);
    }

    // Sliding window: filter to only timestamps within window
    const windowStart = now - config.windowMs;
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);
    
    const requestCount = entry.timestamps.length;
    const allowed = requestCount < config.maxRequests;
    
    if (allowed) {
      entry.timestamps.push(now);
    }

    // Calculate reset time (when oldest request expires)
    const oldestInWindow = entry.timestamps[0] || now;
    const resetInMs = Math.max(0, (oldestInWindow + config.windowMs) - now);

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.timestamps.length),
      resetInMs,
      retryAfter: allowed ? undefined : Math.ceil(resetInMs / 1000),
    };
  }

  private globalCleanup(now: number, windowMs: number): void {
    this.lastGlobalCleanup = now;
    const windowStart = now - windowMs;
    
    for (const [key, entry] of this.cache) {
      // Remove entries with no recent activity
      if (entry.timestamps.every(t => t <= windowStart)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: MAX_CACHE_ENTRIES };
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const rateLimiter = new SlidingWindowLimiter();

// ============================================
// Pre-configured rate limit profiles
// ============================================

export const RATE_LIMIT_PROFILES = {
  // User-facing actions (generous)
  auth: { maxRequests: 10, windowMs: 60_000 },
  search: { maxRequests: 60, windowMs: 60_000 },
  
  // Data operations (moderate)
  download: { maxRequests: 10, windowMs: 60_000 },
  upload: { maxRequests: 20, windowMs: 60_000 },
  save: { maxRequests: 30, windowMs: 60_000 },
  listing: { maxRequests: 50, windowMs: 60_000 },
  
  // Payment/sensitive (strict)
  payment: { maxRequests: 5, windowMs: 60_000 },
  offer: { maxRequests: 10, windowMs: 60_000 },
  
  // Expensive operations (very strict)
  benchmark: { maxRequests: 5, windowMs: 300_000 }, // 5 per 5 min
  scan: { maxRequests: 3, windowMs: 300_000 },
  
  // External API proxies (conservative to avoid upstream limits)
  lichessApi: { maxRequests: 30, windowMs: 60_000 },
  lichessCloudEval: { maxRequests: 20, windowMs: 60_000 },
  chesscomApi: { maxRequests: 30, windowMs: 60_000 },
} as const;

export type RateLimitProfile = keyof typeof RATE_LIMIT_PROFILES;

// ============================================
// Utility functions
// ============================================

/**
 * Generate a consistent identifier from request metadata
 */
export function generateIdentifier(ip?: string, userAgent?: string, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  // Anonymous: hash of IP + UA
  const raw = `${ip || 'unknown'}:${userAgent || 'unknown'}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `anon:${Math.abs(hash).toString(36)}`;
}

/**
 * Check rate limit with a pre-defined profile
 */
export function checkRateLimit(
  identifier: string, 
  profile: RateLimitProfile | RateLimitConfig
): RateLimitResult {
  const config = typeof profile === 'string' 
    ? RATE_LIMIT_PROFILES[profile] 
    : profile;
  
  const key = typeof profile === 'string' 
    ? `${profile}:${identifier}` 
    : `custom:${identifier}`;
    
  return rateLimiter.check(key, config);
}

/**
 * Browser-safe identifier using fingerprinting
 */
export function getBrowserIdentifier(): string {
  if (typeof window === 'undefined') return 'server';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ];
  
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `browser:${Math.abs(hash).toString(36)}`;
}
