/**
 * Marketplace Monitoring and Alerting
 * 
 * Tracks key metrics and triggers alerts for heavy business load
 */

import { supabase } from '@/integrations/supabase/client';

// Alert thresholds
const THRESHOLDS = {
  errorRate: 0.05,        // 5% error rate
  responseTime: 5000,     // 5 seconds
  queueDepth: 100,        // 100 pending items
  memoryUsage: 0.9,       // 90% memory
  checkoutFailures: 10,   // 10 failures in 5 minutes
};

interface MetricEntry {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}

// In-memory metrics storage (in production, use time-series DB)
const metricsStore = new Map<string, MetricEntry[]>();
const MAX_METRICS_PER_KEY = 1000;

/**
 * Record a metric
 */
export function recordMetric(
  name: string,
  value: number,
  metadata?: Record<string, unknown>
): void {
  const entry: MetricEntry = {
    timestamp: Date.now(),
    value,
    metadata,
  };
  
  if (!metricsStore.has(name)) {
    metricsStore.set(name, []);
  }
  
  const metrics = metricsStore.get(name)!;
  metrics.push(entry);
  
  // Keep only recent metrics
  if (metrics.length > MAX_METRICS_PER_KEY) {
    metrics.shift();
  }
}

/**
 * Get metrics for a time range
 */
export function getMetrics(
  name: string,
  timeRangeMs: number = 5 * 60 * 1000
): MetricEntry[] {
  const metrics = metricsStore.get(name) || [];
  const cutoff = Date.now() - timeRangeMs;
  return metrics.filter(m => m.timestamp > cutoff);
}

/**
 * Calculate error rate for an operation
 */
export function calculateErrorRate(operation: string): number {
  const total = getMetrics(`${operation}:total`).length;
  const errors = getMetrics(`${operation}:error`).length;
  
  if (total === 0) return 0;
  return errors / total;
}

/**
 * Check if any thresholds are breached
 */
export async function checkHealth(): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // Check error rates
  const checkoutErrorRate = calculateErrorRate('checkout');
  if (checkoutErrorRate > THRESHOLDS.errorRate) {
    issues.push(`High checkout error rate: ${(checkoutErrorRate * 100).toFixed(1)}%`);
  }
  
  const purchaseErrorRate = calculateErrorRate('marketplace_purchase');
  if (purchaseErrorRate > THRESHOLDS.errorRate) {
    issues.push(`High purchase error rate: ${(purchaseErrorRate * 100).toFixed(1)}%`);
  }
  
  // Check queue depths
  try {
    const { data: queueStats } = await supabase
      .from('processing_queue')
      .select('status')
      .in('status', ['pending', 'failed']);
    
    const pending = queueStats?.filter(i => i.status === 'pending').length || 0;
    const failed = queueStats?.filter(i => i.status === 'failed').length || 0;
    
    if (pending > THRESHOLDS.queueDepth) {
      issues.push(`High queue depth: ${pending} pending items`);
    }
    
    if (failed > 10) {
      issues.push(`High failure count: ${failed} failed jobs`);
    }
  } catch {
    // Ignore errors in health check
  }
  
  // Check recent checkout failures
  const recentFailures = getMetrics('checkout:failure', 5 * 60 * 1000).length;
  if (recentFailures > THRESHOLDS.checkoutFailures) {
    issues.push(`High checkout failure count: ${recentFailures} in 5 minutes`);
  }
  
  return {
    healthy: issues.length === 0,
    issues,
  };
}

/**
 * Log alert to database
 */
export async function logAlert(
  severity: 'warning' | 'critical',
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('system_alerts').insert({
      severity,
      message,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Monitor] Failed to log alert:', error);
  }
}

/**
 * Track operation start
 */
export function trackOperationStart(operation: string): void {
  recordMetric(`${operation}:total`, 1);
  recordMetric(`${operation}:start_time`, Date.now());
}

/**
 * Track operation success
 */
export function trackOperationSuccess(operation: string, durationMs: number): void {
  recordMetric(`${operation}:success`, 1);
  recordMetric(`${operation}:duration`, durationMs);
}

/**
 * Track operation failure
 */
export function trackOperationFailure(operation: string, error: Error): void {
  recordMetric(`${operation}:error`, 1);
  recordMetric(`${operation}:failure`, 1, { message: error.message });
}

/**
 * Wrap function with monitoring
 */
export async function withMonitoring<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  trackOperationStart(operation);
  
  try {
    const result = await fn();
    trackOperationSuccess(operation, Date.now() - startTime);
    return result;
  } catch (error) {
    trackOperationFailure(operation, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Run periodic health checks
 */
export function startHealthChecks(intervalMs: number = 60000): () => void {
  const check = async () => {
    const health = await checkHealth();
    
    if (!health.healthy) {
      for (const issue of health.issues) {
        console.warn('[HealthCheck] Issue detected:', issue);
        await logAlert('warning', issue);
      }
    }
  };
  
  // Run immediately
  check();
  
  // Schedule periodic checks
  const interval = setInterval(check, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Get system status summary
 */
export async function getSystemStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, number>;
  issues: string[];
}> {
  const health = await checkHealth();
  
  const metrics = {
    checkoutErrorRate: calculateErrorRate('checkout'),
    purchaseErrorRate: calculateErrorRate('marketplace_purchase'),
    avgCheckoutDuration: calculateAverage('checkout:duration'),
    pendingQueue: getMetrics('queue:pending').length,
  };
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (health.issues.length > 2) {
    status = 'unhealthy';
  } else if (health.issues.length > 0) {
    status = 'degraded';
  }
  
  return {
    status,
    metrics,
    issues: health.issues,
  };
}

function calculateAverage(metric: string): number {
  const metrics = getMetrics(metric);
  if (metrics.length === 0) return 0;
  
  const sum = metrics.reduce((acc, m) => acc + m.value, 0);
  return sum / metrics.length;
}
