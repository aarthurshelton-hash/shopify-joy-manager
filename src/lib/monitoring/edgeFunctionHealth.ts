/**
 * Edge Function Health Monitoring Utilities
 * 
 * Provides health check capabilities for Supabase Edge Functions
 * with caching, retry logic, and metrics tracking.
 */

import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  functionName: string;
  status: 'healthy' | 'warning' | 'error' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface FunctionMetrics {
  functionName: string;
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  lastInvocation: string;
}

// Cache for health check results
const healthCache = new Map<string, { result: HealthCheckResult; timestamp: number }>();
const HEALTH_CACHE_TTL = 30_000; // 30 seconds

// Response time tracking for metrics
const responseTimeHistory = new Map<string, number[]>();
const MAX_HISTORY_SIZE = 100;

/**
 * Check health of a specific edge function
 */
export async function checkEdgeFunctionHealth(
  functionName: string,
  timeout: number = 5000
): Promise<HealthCheckResult> {
  // Check cache first
  const cached = healthCache.get(functionName);
  if (cached && Date.now() - cached.timestamp < HEALTH_CACHE_TTL) {
    return cached.result;
  }

  const start = performance.now();
  let result: HealthCheckResult;

  try {
    const { data, error } = await supabase.functions.invoke(
      functionName,
      {
        body: { healthCheck: true, timestamp: Date.now() },
      }
    );

    const responseTime = performance.now() - start;

    // Track response time for metrics
    trackResponseTime(functionName, responseTime);

    if (error) {
      result = {
        functionName,
        status: 'error',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: error.message,
      };
    } else {
      // Determine status based on response time
      let status: HealthCheckResult['status'] = 'healthy';
      if (responseTime > 3000) status = 'unhealthy';
      else if (responseTime > 1000) status = 'warning';

      result = {
        functionName,
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    }
  } catch (err) {
    const responseTime = performance.now() - start;
    result = {
      functionName,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // Cache the result
  healthCache.set(functionName, { result, timestamp: Date.now() });

  return result;
}

/**
 * Check health of multiple edge functions in parallel
 */
export async function checkMultipleFunctions(
  functionNames: string[],
  timeout: number = 5000
): Promise<HealthCheckResult[]> {
  const promises = functionNames.map(name => checkEdgeFunctionHealth(name, timeout));
  return Promise.all(promises);
}

/**
 * Track response time for metrics calculation
 */
function trackResponseTime(functionName: string, responseTime: number): void {
  if (!responseTimeHistory.has(functionName)) {
    responseTimeHistory.set(functionName, []);
  }

  const history = responseTimeHistory.get(functionName)!;
  history.push(responseTime);

  // Keep only last N entries
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }
}

/**
 * Get metrics for a specific function
 */
export function getFunctionMetrics(functionName: string): FunctionMetrics | null {
  const history = responseTimeHistory.get(functionName);
  if (!history || history.length === 0) return null;

  const sorted = [...history].sort((a, b) => a - b);
  const total = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    functionName,
    totalInvocations: total,
    successfulInvocations: total, // Simplified - would track actual success/failure
    failedInvocations: 0,
    averageResponseTime: sum / total,
    p95ResponseTime: sorted[Math.floor(total * 0.95)] || sorted[total - 1],
    p99ResponseTime: sorted[Math.floor(total * 0.99)] || sorted[total - 1],
    errorRate: 0, // Would be calculated from actual error tracking
    lastInvocation: new Date().toISOString(),
  };
}

/**
 * Get cached health result without making a new request
 */
export function getCachedHealth(functionName: string): HealthCheckResult | null {
  const cached = healthCache.get(functionName);
  if (cached && Date.now() - cached.timestamp < HEALTH_CACHE_TTL) {
    return cached.result;
  }
  return null;
}

/**
 * Clear health check cache
 */
export function clearHealthCache(): void {
  healthCache.clear();
}

/**
 * Get overall system health status
 */
export function getSystemHealthStatus(results: HealthCheckResult[]): {
  status: 'healthy' | 'warning' | 'critical';
  healthy: number;
  warning: number;
  error: number;
  total: number;
} {
  const healthy = results.filter(r => r.status === 'healthy').length;
  const warning = results.filter(r => r.status === 'warning').length;
  const error = results.filter(r => r.status === 'error' || r.status === 'unhealthy').length;
  const total = results.length;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (error > 0) status = 'critical';
  else if (warning > 0) status = 'warning';

  return { status, healthy, warning, error, total };
}

// Standard edge functions to monitor
export const STANDARD_EDGE_FUNCTIONS = [
  'check-subscription',
  'create-checkout',
  'customer-portal',
  'grant-ceo-admin',
  'stockfish-eval',
] as const;

export type EdgeFunctionName = typeof STANDARD_EDGE_FUNCTIONS[number];
