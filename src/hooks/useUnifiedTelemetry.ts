/**
 * Unified Telemetry Hook
 * 
 * React hook for consuming real-time telemetry data from all systems.
 * Provides reactive access to code analysis, adapter signals, evolution events,
 * and cross-domain resonances.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToTelemetry,
  getTelemetryState,
  recordCodeAnalysis,
  recordIssueDetected,
  recordHealApplied,
  initializeTelemetryHub,
  type UnifiedTelemetryState,
  type CodeTelemetryData,
  type AdapterTelemetryData,
  type ResonanceTelemetryData,
  type IssueTelemetryData,
  type HealTelemetryData
} from '@/lib/pensent-core/telemetry';

// Extended hook state with computed metrics
interface TelemetryHookState extends UnifiedTelemetryState {
  // Computed aggregates
  totalAdapters: number;
  activeAdapters: number;
  totalSignals: number;
  averageHealth: number;
  issueCounts: { critical: number; high: number; medium: number; low: number };
  recentResonances: ResonanceTelemetryData[];
  topDomains: Array<{ domain: string; count: number; signals: number }>;
  isLive: boolean;
}

export function useUnifiedTelemetry() {
  const [state, setState] = useState<TelemetryHookState>(() => {
    const initial = getTelemetryState();
    return computeDerivedMetrics(initial, false);
  });

  const hubInitialized = useRef(false);

  // Initialize telemetry hub on mount
  useEffect(() => {
    if (!hubInitialized.current) {
      const cleanup = initializeTelemetryHub();
      hubInitialized.current = true;

      return () => {
        cleanup();
        hubInitialized.current = false;
      };
    }
  }, []);

  // Subscribe to telemetry updates
  useEffect(() => {
    const unsubscribe = subscribeToTelemetry((telemetryState) => {
      setState(computeDerivedMetrics(telemetryState, true));
    });

    return unsubscribe;
  }, []);

  // Manual recording functions
  const reportCodeAnalysis = useCallback((data: CodeTelemetryData) => {
    recordCodeAnalysis(data);
  }, []);

  const reportIssue = useCallback((data: IssueTelemetryData) => {
    recordIssueDetected(data);
  }, []);

  const reportHeal = useCallback((data: HealTelemetryData) => {
    recordHealApplied(data);
  }, []);

  return {
    ...state,
    reportCodeAnalysis,
    reportIssue,
    reportHeal,
    isInitialized: hubInitialized.current
  };
}

// Compute derived metrics from base state
function computeDerivedMetrics(
  base: UnifiedTelemetryState,
  isLive: boolean
): TelemetryHookState {
  const adapters = Array.from(base.adapters.values());
  const activeAdapters = adapters.filter(a => a.isActive);
  const totalSignals = adapters.reduce((sum, a) => sum + a.signalCount, 0);
  
  // Calculate average health
  const healthValues = adapters.map(a => a.resonanceScore);
  const averageHealth = healthValues.length > 0
    ? healthValues.reduce((a, b) => a + b, 0) / healthValues.length
    : base.code?.health || 0;

  // Count issues by severity
  const issueCounts = base.issues.reduce((counts, issue) => {
    counts[issue.severity]++;
    return counts;
  }, { critical: 0, high: 0, medium: 0, low: 0 });

  // Get recent resonances (last 10)
  const recentResonances = base.resonances.slice(0, 10);

  // Aggregate by domain
  const domainMap = new Map<string, { count: number; signals: number }>();
  adapters.forEach(adapter => {
    const existing = domainMap.get(adapter.domain) || { count: 0, signals: 0 };
    existing.count++;
    existing.signals += adapter.signalCount;
    domainMap.set(adapter.domain, existing);
  });

  const topDomains = Array.from(domainMap.entries())
    .map(([domain, stats]) => ({ domain, ...stats }))
    .sort((a, b) => b.signals - a.signals)
    .slice(0, 6);

  return {
    ...base,
    adapters: new Map(base.adapters),
    totalAdapters: adapters.length,
    activeAdapters: activeAdapters.length,
    totalSignals,
    averageHealth,
    issueCounts,
    recentResonances,
    topDomains,
    isLive
  };
}

// Hook for code-specific telemetry
export function useCodeTelemetry() {
  const { code, issueCounts, issues, heals, reportCodeAnalysis, reportIssue, reportHeal } = useUnifiedTelemetry();

  return {
    analysis: code,
    issues: {
      all: issues,
      counts: issueCounts
    },
    heals,
    reportAnalysis: reportCodeAnalysis,
    reportIssue,
    reportHeal
  };
}

// Hook for adapter-specific telemetry
export function useAdapterTelemetry() {
  const {
    adapters,
    totalAdapters,
    activeAdapters,
    totalSignals,
    averageHealth,
    recentResonances,
    topDomains
  } = useUnifiedTelemetry();

  return {
    adapters: Array.from(adapters.values()),
    totalAdapters,
    activeAdapters,
    totalSignals,
    averageHealth,
    resonances: recentResonances,
    topDomains
  };
}

// Hook for evolution event stream
export function useEvolutionTelemetry() {
  const { evolution } = useUnifiedTelemetry();

  const recentEvents = evolution.slice(0, 20);
  
  const eventsByType = recentEvents.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const crossDomainEvents = recentEvents.filter(e => 
    e.eventType === 'cross_domain_learning' || 
    e.eventType === 'market_sync' ||
    e.eventType === 'resonance_detected'
  );

  return {
    allEvents: evolution,
    recentEvents,
    eventsByType,
    crossDomainEvents,
    eventCount: evolution.length
  };
}
