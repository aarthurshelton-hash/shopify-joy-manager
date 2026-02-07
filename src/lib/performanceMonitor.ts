/**
 * Performance Monitoring Utilities
 * 
 * Tracks Core Web Vitals and custom performance metrics
 * for the En Pensent application.
 * 
 * @module performanceMonitor
 */

import { reportError } from '@/lib/errorReporting';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  id: string;
}

const RATING_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating based on metric thresholds
 */
function getRating(
  metricName: keyof typeof RATING_THRESHOLDS,
  value: number
): PerformanceMetric['rating'] {
  const thresholds = RATING_THRESHOLDS[metricName];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Core Web Vital to analytics
 */
function reportWebVital(metric: WebVitalMetric): void {
  const rating = getRating(metric.name, metric.value);
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${rating})`);
  }
  
  // Send to analytics in production
  if (import.meta.env.PROD) {
    // Use sendBeacon for reliability
    const payload = JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      timestamp: Date.now(),
    });
    
    navigator.sendBeacon?.('/api/analytics/vitals', payload);
  }
  
  // Report poor metrics as errors
  if (rating === 'poor') {
    reportError(`Poor ${metric.name}: ${metric.value}ms`, {
      errorType: 'performance',
      metadata: { metric: metric.name, value: metric.value },
    });
  }
}

/**
 * Measure and report Largest Contentful Paint (LCP)
 */
export function measureLCP(): void {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry & { element?: Element };
    
    reportWebVital({
      name: 'LCP',
      value: lastEntry.startTime,
      id: lastEntry.entryType,
    });
  });
  
  observer.observe({ entryTypes: ['largest-contentful-paint'] });
}

/**
 * Measure and report First Input Delay (FID)
 */
export function measureFID(): void {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    
    entries.forEach((entry) => {
      const fidEntry = entry as PerformanceEntry & { processingStart: number };
      const delay = fidEntry.processingStart - fidEntry.startTime;
      
      reportWebVital({
        name: 'FID',
        value: delay,
        id: entry.entryType,
      });
    });
  });
  
  observer.observe({ entryTypes: ['first-input'] });
}

/**
 * Measure and report Cumulative Layout Shift (CLS)
 */
export function measureCLS(): void {
  if (!('PerformanceObserver' in window)) return;
  
  let clsValue = 0;
  const clsEntries: PerformanceEntry[] = [];
  
  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[];
    
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        clsEntries.push(entry);
      }
    });
  });
  
  observer.observe({ entryTypes: ['layout-shift'] });
  
  // Report CLS when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && clsEntries.length > 0) {
      reportWebVital({
        name: 'CLS',
        value: clsValue,
        id: 'cls-final',
      });
    }
  });
}

/**
 * Measure and report First Contentful Paint (FCP)
 */
export function measureFCP(): void {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const fcpEntry = entries[0];
    
    if (fcpEntry) {
      reportWebVital({
        name: 'FCP',
        value: fcpEntry.startTime,
        id: fcpEntry.entryType,
      });
    }
  });
  
  observer.observe({ entryTypes: ['paint'] });
}

/**
 * Measure and report Time to First Byte (TTFB)
 */
export function measureTTFB(): void {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  
  if (navigation) {
    const ttfb = navigation.responseStart - navigation.startTime;
    
    reportWebVital({
      name: 'TTFB',
      value: ttfb,
      id: 'navigation',
    });
  }
}

/**
 * Initialize all Core Web Vitals monitoring
 */
export function initializePerformanceMonitoring(): void {
  // Wait for page to be interactive
  if (document.readyState === 'complete') {
    initMetrics();
  } else {
    window.addEventListener('load', initMetrics);
  }
}

function initMetrics(): void {
  measureLCP();
  measureFID();
  measureCLS();
  measureFCP();
  measureTTFB();
  
  console.log('[Performance] Core Web Vitals monitoring initialized');
}

/**
 * Measure custom component render time
 * 
 * @param {string} componentName Name of the component
 * @param {() => T} fn Function to measure
 * @returns {T} Result of the function
 * 
 * @example
 * ```typescript
 * const data = measureComponentRender('UserProfile', () => {
 *   return fetchUserData();
 * });
 * ```
 */
export function measureComponentRender<T>(componentName: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  // Report slow renders
  if (duration > 100) {
    console.warn(`[Performance] Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    
    if (duration > 500) {
      reportError(`Very slow component render: ${componentName}`, {
        errorType: 'performance',
        metadata: { component: componentName, duration },
      });
    }
  }
  
  return result;
}

/**
 * Mark performance milestones
 * 
 * @param {string} label Label for the mark
 */
export function mark(label: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(label);
  }
}

/**
 * Measure time between two marks
 * 
 * @param {string} name Name for the measurement
 * @param {string} startMark Starting mark label
 * @param {string} endMark Ending mark label
 */
export function measure(name: string, startMark: string, endMark: string): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      
      const entries = performance.getEntriesByName(name);
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { duration: number };
      
      if (lastEntry && lastEntry.duration > 1000) {
        console.warn(`[Performance] Long operation: ${name} took ${lastEntry.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Ignore measurement errors
    }
  }
}
