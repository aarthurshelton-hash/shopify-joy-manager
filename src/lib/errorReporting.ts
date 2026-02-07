import { supabase } from '@/integrations/supabase/client';

interface ErrorReport {
  message: string;
  stack?: string;
  componentName?: string;
  errorType?: 'runtime' | 'network' | 'validation' | 'render' | 'performance';
  url?: string;
  metadata?: Record<string, unknown>;
}

// Queue for batching errors
let errorQueue: ErrorReport[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

const BATCH_SIZE = 5;
const FLUSH_INTERVAL = 5000; // 5 seconds

async function sendErrors(errors: ErrorReport[]): Promise<void> {
  if (errors.length === 0) return;

  try {
    // Send errors via edge function
    for (const error of errors) {
      await supabase.functions.invoke('collect-error', {
        body: {
          message: error.message,
          stack: error.stack,
          componentName: error.componentName,
          errorType: error.errorType || 'runtime',
          url: error.url || window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            ...error.metadata,
            timestamp: new Date().toISOString(),
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          },
        },
      });
    }
  } catch (e) {
    // Silently fail - don't create infinite error loops
    console.warn('Failed to report errors:', e);
  }
}

function flushErrorQueue(): void {
  if (errorQueue.length > 0) {
    const errorsToSend = [...errorQueue];
    errorQueue = [];
    sendErrors(errorsToSend);
  }
  flushTimeout = null;
}

function scheduleFlush(): void {
  if (flushTimeout) return;
  flushTimeout = setTimeout(flushErrorQueue, FLUSH_INTERVAL);
}

export function reportError(error: Error | string, options: Partial<ErrorReport> = {}): void {
  const errorReport: ErrorReport = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'object' ? error.stack : undefined,
    ...options,
  };

  errorQueue.push(errorReport);

  // Flush immediately if we hit batch size
  if (errorQueue.length >= BATCH_SIZE) {
    flushErrorQueue();
  } else {
    scheduleFlush();
  }
}

// Global error handler
export function setupGlobalErrorHandlers(): void {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, {
      errorType: 'runtime',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    reportError(
      error instanceof Error ? error : String(error),
      {
        errorType: 'runtime',
        metadata: { type: 'unhandledrejection' },
      }
    );
  });

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
    }
    // Synchronous send attempt for remaining errors
    if (errorQueue.length > 0 && navigator.sendBeacon) {
      const payload = JSON.stringify({ errors: errorQueue });
      navigator.sendBeacon('/api/collect-errors', payload);
    }
  });
}

// React Error Boundary integration
export function reportReactError(
  error: Error,
  componentStack: string,
  componentName?: string
): void {
  reportError(error, {
    errorType: 'render',
    componentName,
    metadata: {
      componentStack,
      reactVersion: '18',
    },
  });
}
