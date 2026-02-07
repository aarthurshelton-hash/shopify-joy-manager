/**
 * API Retry Logic with Exponential Backoff
 * 
 * Provides resilient API calls with automatic retry for transient failures.
 * Implements exponential backoff with jitter to prevent thundering herd.
 * 
 * @module retryLogic
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 5, baseDelayMs: 500 }
 * );
 * ```
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (error instanceof Response) {
    return config.retryableStatuses.includes(error.status);
  }
  
  if (error instanceof Error) {
    // Network errors are retryable
    const networkErrors = ['fetch', 'network', 'timeout', 'abort'];
    return networkErrors.some(e => error.message.toLowerCase().includes(e));
  }
  
  return false;
}

/**
 * Execute function with retry logic
 * 
 * @template T Return type of the function
 * @param {() => Promise<T>} fn Function to execute
 * @param {Partial<RetryConfig>} [config] Retry configuration
 * @returns {Promise<T>} Result of the function
 * @throws {Error} After all retries are exhausted
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 5, baseDelayMs: 500 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === fullConfig.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (!isRetryableError(error, fullConfig)) {
        throw error;
      }
      
      // Calculate and wait for delay
      const delay = calculateDelay(attempt, fullConfig);
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Fetch with automatic retry
 * 
 * @param {string | Request | URL} input Fetch input
 * @param {RequestInit} [init] Fetch options
 * @param {Partial<RetryConfig>} [retryConfig] Retry configuration
 * @returns {Promise<Response>} Fetch response
 * 
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ id: 1 })
 * });
 * ```
 */
export async function fetchWithRetry(
  input: string | Request | URL,
  init?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(input, init);
    
    // Throw on error status to trigger retry
    if (!response.ok) {
      throw response;
    }
    
    return response;
  }, retryConfig);
}

/**
 * Supabase RPC with retry
 * 
 * @template T Return type
 * @param {Function} rpcFn Supabase RPC function
 * @param {Partial<RetryConfig>} [retryConfig] Retry configuration
 * @returns {Promise<T>} RPC result
 */
export async function supabaseRpcWithRetry<T>(
  rpcFn: () => Promise<{ data: T | null; error: Error | null }>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await rpcFn();
    
    if (error) {
      throw error;
    }
    
    if (data === null) {
      throw new Error('No data returned from RPC');
    }
    
    return data;
  }, retryConfig);
}
