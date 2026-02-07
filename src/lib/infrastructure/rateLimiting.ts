/**
 * API Rate Limiting for Trading Operations
 * 
 * Implements strict rate limiting for trading endpoints to prevent
 * abuse and ensure system stability.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

/**
 * Rate limiter configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Trading operations - very strict
  TRADING: {
    maxRequests: 10,      // 10 requests
    windowMs: 60000,      // per minute
    blockDurationMs: 300000, // 5 min block if exceeded
  } as RateLimitConfig,
  
  // Market data - moderate
  MARKET_DATA: {
    maxRequests: 60,      // 60 requests
    windowMs: 60000,      // per minute
  } as RateLimitConfig,
  
  // Account info - lenient
  ACCOUNT: {
    maxRequests: 30,      // 30 requests
    windowMs: 60000,      // per minute
  } as RateLimitConfig,
  
  // Order placement - extremely strict
  ORDER_PLACE: {
    maxRequests: 5,       // 5 orders
    windowMs: 60000,      // per minute
    blockDurationMs: 600000, // 10 min block if exceeded
  } as RateLimitConfig,
} as const;

/**
 * In-memory rate limit store (per-session)
 * For production, consider Redis or similar
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private blockedClients = new Map<string, number>();
  
  /**
   * Check if client is currently blocked
   */
  isBlocked(clientId: string): { blocked: boolean; remainingMs?: number } {
    const blockedUntil = this.blockedClients.get(clientId);
    if (blockedUntil && Date.now() < blockedUntil) {
      return { 
        blocked: true, 
        remainingMs: blockedUntil - Date.now() 
      };
    }
    
    if (blockedUntil) {
      this.blockedClients.delete(clientId);
    }
    
    return { blocked: false };
  }
  
  /**
   * Record a request and check rate limit
   */
  recordRequest(clientId: string, config: RateLimitConfig): { 
    allowed: boolean; 
    remaining: number;
    resetTime: number;
    blocked?: boolean;
    blockDurationMs?: number;
  } {
    // Check if client is blocked
    const blockStatus = this.isBlocked(clientId);
    if (blockStatus.blocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (blockStatus.remainingMs || 0),
        blocked: true,
        blockDurationMs: blockStatus.remainingMs,
      };
    }
    
    const now = Date.now();
    const entry = this.store.get(clientId);
    
    // Reset window if expired
    if (!entry || now - entry.windowStart > config.windowMs) {
      this.store.set(clientId, {
        count: 1,
        windowStart: now,
        lastRequest: now,
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      // Block client if configured
      if (config.blockDurationMs) {
        this.blockedClients.set(clientId, now + config.blockDurationMs);
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.windowStart + config.windowMs,
        blocked: true,
        blockDurationMs: config.blockDurationMs,
      };
    }
    
    // Increment counter
    entry.count++;
    entry.lastRequest = now;
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.windowStart + config.windowMs,
    };
  }
  
  /**
   * Clean up old entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > maxAge) {
        this.store.delete(key);
      }
    }
    
    for (const [key, blockedUntil] of this.blockedClients.entries()) {
      if (now > blockedUntil) {
        this.blockedClients.delete(key);
      }
    }
  }
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore();

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
  blockDurationMs?: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a client
 */
export function checkRateLimit(
  clientId: string, 
  endpointType: keyof typeof RATE_LIMITS
): RateLimitResult {
  const config = RATE_LIMITS[endpointType];
  const result = rateLimitStore.recordRequest(clientId, config);
  
  return {
    limit: config.maxRequests,
    ...result,
    retryAfter: result.blocked && result.blockDurationMs 
      ? Math.ceil(result.blockDurationMs / 1000) 
      : undefined,
  };
}

/**
 * Middleware-style rate limit checker
 * Returns null if allowed, or error response if blocked
 */
export function rateLimitMiddleware(
  clientId: string,
  endpointType: keyof typeof RATE_LIMITS
): { error: string; status: number; headers: Record<string, string> } | null {
  const result = checkRateLimit(clientId, endpointType);
  
  if (!result.allowed) {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    };
    
    if (result.retryAfter) {
      headers['Retry-After'] = String(result.retryAfter);
    }
    
    return {
      error: result.blocked 
        ? `Rate limit exceeded. You are temporarily blocked for ${Math.ceil((result.blockDurationMs || 0) / 1000)} seconds.`
        : 'Rate limit exceeded. Please try again later.',
      status: 429,
      headers,
    };
  }
  
  return null;
}

/**
 * Get rate limit headers for successful requests
 */
export function getRateLimitHeaders(
  clientId: string,
  endpointType: keyof typeof RATE_LIMITS
): Record<string, string> {
  const config = RATE_LIMITS[endpointType];
  const result = rateLimitStore.recordRequest(clientId, config);
  
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
  };
}

/**
 * Generate client ID from request
 */
export function generateClientId(userId: string, endpoint: string): string {
  return `${userId}:${endpoint}`;
}

// Periodic cleanup
setInterval(() => rateLimitStore.cleanup(), 300000); // Every 5 minutes
