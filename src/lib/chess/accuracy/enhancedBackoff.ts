/**
 * Enhanced Exponential Backoff v1.0
 * 
 * Configurable backoff strategy for API rate limiting.
 * Used across edge functions and client-side fetching.
 */

export interface BackoffConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitterMs: number;
  maxRetries: number;
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 120000, // 2 minutes max
  multiplier: 2,
  jitterMs: 250,
  maxRetries: 5,
};

export const AGGRESSIVE_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 500,
  maxDelayMs: 30000, // 30 seconds max
  multiplier: 1.5,
  jitterMs: 100,
  maxRetries: 3,
};

export const CONSERVATIVE_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 2000,
  maxDelayMs: 300000, // 5 minutes max
  multiplier: 2.5,
  jitterMs: 500,
  maxRetries: 8,
};

/**
 * Calculate delay for a given attempt number
 */
export function calculateBackoffDelay(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
): number {
  const baseDelay = config.initialDelayMs * Math.pow(config.multiplier, attempt);
  const jitter = Math.floor(Math.random() * config.jitterMs);
  return Math.min(baseDelay + jitter, config.maxDelayMs);
}

/**
 * Execute a function with exponential backoff retry logic
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  onRetry?: (attempt: number, delay: number, error: unknown) => void
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        onRetry?.(attempt + 1, delay, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Create a rate limiter with backoff for API calls
 */
export function createRateLimitedFetcher(
  minIntervalMs: number = 1000,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
) {
  let lastCallTime = 0;
  let consecutiveErrors = 0;

  return async function fetch<T>(
    fetcher: () => Promise<T>,
    onRateLimit?: () => void
  ): Promise<T | null> {
    // Enforce minimum interval
    const now = Date.now();
    const timeSinceLast = now - lastCallTime;
    
    // Increase interval after consecutive errors
    const effectiveInterval = minIntervalMs * (1 + consecutiveErrors * 0.5);
    
    if (timeSinceLast < effectiveInterval) {
      await new Promise(r => setTimeout(r, effectiveInterval - timeSinceLast));
    }

    lastCallTime = Date.now();

    try {
      const result = await withBackoff(fetcher, config);
      consecutiveErrors = 0; // Reset on success
      return result;
    } catch (error) {
      consecutiveErrors++;
      
      // Check for rate limit errors
      if (error instanceof Error && error.message.includes('429')) {
        onRateLimit?.();
        const cooldownDelay = calculateBackoffDelay(consecutiveErrors, config);
        await new Promise(r => setTimeout(r, cooldownDelay));
      }
      
      return null;
    }
  };
}

/**
 * Track rate limit state across multiple endpoints
 */
export class RateLimitTracker {
  private state: Map<string, { 
    blockedUntil: number; 
    consecutiveHits: number;
  }> = new Map();

  isBlocked(endpoint: string): boolean {
    const entry = this.state.get(endpoint);
    if (!entry) return false;
    return Date.now() < entry.blockedUntil;
  }

  recordRateLimit(endpoint: string, retryAfterSeconds?: number): void {
    const existing = this.state.get(endpoint);
    const consecutiveHits = (existing?.consecutiveHits || 0) + 1;
    
    // Use retry-after header if provided, otherwise calculate
    const blockDuration = retryAfterSeconds 
      ? retryAfterSeconds * 1000
      : calculateBackoffDelay(consecutiveHits, DEFAULT_BACKOFF_CONFIG);

    this.state.set(endpoint, {
      blockedUntil: Date.now() + blockDuration,
      consecutiveHits,
    });
  }

  recordSuccess(endpoint: string): void {
    this.state.delete(endpoint);
  }

  getWaitTime(endpoint: string): number {
    const entry = this.state.get(endpoint);
    if (!entry) return 0;
    return Math.max(0, entry.blockedUntil - Date.now());
  }
}

// Global rate limit tracker instance
export const globalRateLimitTracker = new RateLimitTracker();
