/**
 * Edge Function Monitoring Hook
 * 
 * Provides real-time monitoring of Supabase Edge Functions with
 * automatic health checks, metrics tracking, and alerting.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  checkEdgeFunctionHealth,
  checkMultipleFunctions,
  getFunctionMetrics,
  getSystemHealthStatus,
  clearHealthCache,
  STANDARD_EDGE_FUNCTIONS,
  type HealthCheckResult,
  type FunctionMetrics,
  type EdgeFunctionName,
} from '@/lib/monitoring/edgeFunctionHealth';

interface MonitoringState {
  results: HealthCheckResult[];
  isLoading: boolean;
  lastUpdated: string | null;
  systemStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
  error: string | null;
}

interface MonitoringConfig {
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  functions: EdgeFunctionName[];
  onError?: (error: Error) => void;
  onStatusChange?: (status: MonitoringState['systemStatus']) => void;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  autoRefresh: true,
  refreshInterval: 30_000, // 30 seconds
  functions: [...STANDARD_EDGE_FUNCTIONS],
};

export function useEdgeFunctionMonitor(userConfig?: Partial<MonitoringConfig>) {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);
  
  const [state, setState] = useState<MonitoringState>({
    results: [],
    isLoading: false,
    lastUpdated: null,
    systemStatus: 'unknown',
    error: null,
  });

  const [metrics, setMetrics] = useState<Map<string, FunctionMetrics>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatus = useRef<MonitoringState['systemStatus']>('unknown');

  /**
   * Perform health check on all monitored functions
   */
  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = await checkMultipleFunctions(config.functions as string[]);
      const systemHealth = getSystemHealthStatus(results);

      // Update metrics for each function
      const newMetrics = new Map(metrics);
      results.forEach(result => {
        const functionMetrics = getFunctionMetrics(result.functionName);
        if (functionMetrics) {
          newMetrics.set(result.functionName, functionMetrics);
        }
      });
      setMetrics(newMetrics);

      // Check for status change callback
      if (
        config.onStatusChange &&
        systemHealth.status !== previousStatus.current
      ) {
        config.onStatusChange(systemHealth.status);
      }
      previousStatus.current = systemHealth.status;

      setState({
        results,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
        systemStatus: systemHealth.status,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (config.onError) {
        config.onError(error);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  }, [config, metrics]);

  /**
   * Check health of a single function
   */
  const checkSingleFunction = useCallback(async (functionName: string) => {
    try {
      const result = await checkEdgeFunctionHealth(functionName);
      
      // Update results array
      setState(prev => {
        const existingIndex = prev.results.findIndex(
          r => r.functionName === functionName
        );
        const newResults = [...prev.results];
        
        if (existingIndex >= 0) {
          newResults[existingIndex] = result;
        } else {
          newResults.push(result);
        }

        const systemHealth = getSystemHealthStatus(newResults);
        
        return {
          ...prev,
          results: newResults,
          systemStatus: systemHealth.status,
          lastUpdated: new Date().toISOString(),
        };
      });

      // Update metrics
      const functionMetrics = getFunctionMetrics(functionName);
      if (functionMetrics) {
        setMetrics(prev => {
          const newMetrics = new Map(prev);
          newMetrics.set(functionName, functionMetrics);
          return newMetrics;
        });
      }

      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to check function health');
    }
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    clearHealthCache();
    setMetrics(new Map());
    setState(prev => ({
      ...prev,
      results: [],
      lastUpdated: null,
      systemStatus: 'unknown',
    }));
  }, []);

  /**
   * Get metrics for a specific function
   */
  const getMetrics = useCallback(
    (functionName: string): FunctionMetrics | undefined => {
      return metrics.get(functionName);
    },
    [metrics]
  );

  /**
   * Get all metrics as array
   */
  const getAllMetrics = useCallback((): FunctionMetrics[] => {
    return Array.from(metrics.values());
  }, [metrics]);

  // Auto-refresh effect
  useEffect(() => {
    // Initial check
    checkHealth();

    // Setup interval if autoRefresh is enabled
    if (config.autoRefresh && config.refreshInterval > 0) {
      intervalRef.current = setInterval(checkHealth, config.refreshInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkHealth, config.autoRefresh, config.refreshInterval]);

  return {
    // State
    results: state.results,
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated,
    systemStatus: state.systemStatus,
    error: state.error,
    
    // Actions
    checkHealth,
    checkSingleFunction,
    clearCache,
    
    // Metrics
    getMetrics,
    getAllMetrics,
    
    // Helpers
    healthyCount: state.results.filter(r => r.status === 'healthy').length,
    warningCount: state.results.filter(r => r.status === 'warning').length,
    errorCount: state.results.filter(r => r.status === 'error' || r.status === 'unhealthy').length,
    totalCount: state.results.length,
  };
}

/**
 * Hook for tracking individual edge function calls
 */
export function useEdgeFunctionTracker() {
  const [invocations, setInvocations] = useState<Map<string, number>>(new Map());
  const [errors, setErrors] = useState<Map<string, number>>(new Map());

  const trackInvocation = useCallback((functionName: string, success: boolean) => {
    setInvocations(prev => {
      const newMap = new Map(prev);
      newMap.set(functionName, (newMap.get(functionName) || 0) + 1);
      return newMap;
    });

    if (!success) {
      setErrors(prev => {
        const newMap = new Map(prev);
        newMap.set(functionName, (newMap.get(functionName) || 0) + 1);
        return newMap;
      });
    }
  }, []);

  const getInvocationCount = useCallback(
    (functionName: string): number => {
      return invocations.get(functionName) || 0;
    },
    [invocations]
  );

  const getErrorCount = useCallback(
    (functionName: string): number => {
      return errors.get(functionName) || 0;
    },
    [errors]
  );

  const getErrorRate = useCallback(
    (functionName: string): number => {
      const invocations_count = invocations.get(functionName) || 0;
      const errors_count = errors.get(functionName) || 0;
      return invocations_count > 0 ? errors_count / invocations_count : 0;
    },
    [invocations, errors]
  );

  const resetTracking = useCallback(() => {
    setInvocations(new Map());
    setErrors(new Map());
  }, []);

  return {
    trackInvocation,
    getInvocationCount,
    getErrorCount,
    getErrorRate,
    resetTracking,
    totalInvocations: Array.from(invocations.values()).reduce((a, b) => a + b, 0),
    totalErrors: Array.from(errors.values()).reduce((a, b) => a + b, 0),
  };
}
