/**
 * Unified Telemetry Hub
 * 
 * Central aggregation point for all real-time data across:
 * - Code analysis events
 * - Universal adapter signals
 * - Evolution system broadcasts
 * - Live codebase metrics
 * - Market/chess cross-domain events
 * 
 * Provides reactive streams for frontend visualizations
 */

import { subscribeToEvolution, type EvolutionEvent } from '@/hooks/useUnifiedEvolution';
import { subscribeToAdapterEvolution } from '@/lib/pensent-core/domains/universal/adapters';
import { codebaseSyncManager } from '@/hooks/useCodebaseSync';
import { supabase } from '@/integrations/supabase/client';

// Telemetry event types
type TelemetryEvent =
  | { type: 'code_analysis'; data: CodeTelemetryData }
  | { type: 'adapter_signal'; data: AdapterTelemetryData }
  | { type: 'evolution_event'; data: EvolutionTelemetryData }
  | { type: 'codebase_sync'; data: CodebaseTelemetryData }
  | { type: 'cross_domain_resonance'; data: ResonanceTelemetryData }
  | { type: 'issue_detected'; data: IssueTelemetryData }
  | { type: 'heal_applied'; data: HealTelemetryData };

interface CodeTelemetryData {
  archetype: string;
  health: number;
  patternDensity: number;
  fileCount: number;
  linesOfCode: number;
  issuesDetected: number;
  timestamp: number;
}

interface AdapterTelemetryData {
  adapterName: string;
  domain: string;
  signalCount: number;
  learningRate: number;
  resonanceScore: number;
  isActive: boolean;
  timestamp: number;
}

interface EvolutionTelemetryData {
  eventType: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface CodebaseTelemetryData {
  version: number;
  fileCount: number;
  totalLines: number;
  checksum: string;
  syncStatus: 'synced' | 'stale' | 'syncing';
  timestamp: number;
}

interface ResonanceTelemetryData {
  adapter1: string;
  adapter2: string;
  resonanceScore: number;
  sharedPatterns: string[];
  timestamp: number;
}

interface IssueTelemetryData {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  title: string;
  timestamp: number;
}

interface HealTelemetryData {
  issueId: string;
  file: string;
  action: string;
  success: boolean;
  timestamp: number;
}

// Telemetry state container
interface UnifiedTelemetryState {
  code: CodeTelemetryData | null;
  adapters: Map<string, AdapterTelemetryData>;
  resonances: ResonanceTelemetryData[];
  issues: IssueTelemetryData[];
  heals: HealTelemetryData[];
  evolution: EvolutionTelemetryData[];
  codebase: CodebaseTelemetryData | null;
  lastUpdate: number;
}

const telemetryState: UnifiedTelemetryState = {
  code: null,
  adapters: new Map(),
  resonances: [],
  issues: [],
  heals: [],
  evolution: [],
  codebase: null,
  lastUpdate: Date.now()
};

// Event listeners
type TelemetryListener = (state: UnifiedTelemetryState) => void;
const listeners = new Set<TelemetryListener>();

// Subscribe to telemetry updates
export function subscribeToTelemetry(listener: TelemetryListener): () => void {
  listeners.add(listener);
  // Immediately emit current state
  listener({ ...telemetryState, adapters: new Map(telemetryState.adapters) });
  return () => listeners.delete(listener);
}

// Emit state update to all listeners
function emitTelemetryUpdate() {
  const state = { ...telemetryState, adapters: new Map(telemetryState.adapters) };
  listeners.forEach(listener => listener(state));
}

// Record telemetry event
function recordEvent(event: TelemetryEvent) {
  telemetryState.lastUpdate = Date.now();

  switch (event.type) {
    case 'code_analysis':
      telemetryState.code = event.data;
      break;
    case 'adapter_signal':
      telemetryState.adapters.set(event.data.adapterName, event.data);
      break;
    case 'cross_domain_resonance':
      // Keep only last 20 resonances
      telemetryState.resonances = [event.data, ...telemetryState.resonances].slice(0, 20);
      break;
    case 'issue_detected':
      telemetryState.issues = [event.data, ...telemetryState.issues].slice(0, 50);
      break;
    case 'heal_applied':
      telemetryState.heals = [event.data, ...telemetryState.heals].slice(0, 20);
      break;
    case 'evolution_event':
      telemetryState.evolution = [event.data, ...telemetryState.evolution].slice(0, 100);
      break;
    case 'codebase_sync':
      telemetryState.codebase = event.data;
      break;
  }

  emitTelemetryUpdate();

  // Persist to Supabase for historical analysis
  persistTelemetryEvent(event).catch(console.error);
}

// Persist telemetry to database
async function persistTelemetryEvent(event: TelemetryEvent) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('telemetry_events' as any).insert({
      event_type: event.type,
      event_data: event.data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Silent fail - telemetry shouldn't break the app
    console.warn('[Telemetry] Failed to persist:', err);
  }
}

// Initialize all data stream connections
export function initializeTelemetryHub(): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Subscribe to evolution events
  unsubscribers.push(
    subscribeToEvolution((event: EvolutionEvent) => {
      recordEvent({
        type: 'evolution_event',
        data: {
          eventType: event.type,
          source: event.source,
          data: event.data,
          timestamp: Date.now()
        }
      });

      // Also record as codebase event if code-related
      if (event.source === 'code') {
        recordEvent({
          type: 'code_analysis',
          data: {
            archetype: (event.data.archetype as string) || 'unknown',
            health: (event.data.health as number) || 0,
            patternDensity: (event.data.patternDensity as number) || 0,
            fileCount: (event.data.fileCount as number) || 0,
            linesOfCode: (event.data.linesOfCode as number) || 0,
            issuesDetected: (event.data.issuesDetected as number) || 0,
            timestamp: Date.now()
          }
        });
      }
    })
  );

  // 2. Subscribe to adapter evolution
  unsubscribers.push(
    subscribeToAdapterEvolution((event) => {
      recordEvent({
        type: 'evolution_event',
        data: {
          eventType: event.type,
          source: 'adapter',
          data: event,
          timestamp: Date.now()
        }
      });

      if (event.type === 'resonance_detected' && event.resonance) {
        recordEvent({
          type: 'cross_domain_resonance',
          data: {
            adapter1: event.resonance.adapter1,
            adapter2: event.resonance.adapter2,
            resonanceScore: event.resonance.score,
            sharedPatterns: [],
            timestamp: Date.now()
          }
        });
      }
    })
  );

  // 3. Set up codebase sync monitoring
  const syncInterval = setInterval(() => {
    const version = codebaseSyncManager.getVersion();
    recordEvent({
      type: 'codebase_sync',
      data: {
        version,
        fileCount: 0, // Would need actual file count
        totalLines: 0,
        checksum: '',
        syncStatus: 'synced',
        timestamp: Date.now()
      }
    });
  }, 30000); // Every 30 seconds

  unsubscribers.push(() => clearInterval(syncInterval));

  console.log('[TelemetryHub] All data streams connected');

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub());
    clearInterval(syncInterval);
    console.log('[TelemetryHub] All data streams disconnected');
  };
}

// Manual event recording (for components to use)
export function recordCodeAnalysis(data: CodeTelemetryData) {
  recordEvent({ type: 'code_analysis', data });
}

export function recordAdapterSignal(data: AdapterTelemetryData) {
  recordEvent({ type: 'adapter_signal', data });
}

export function recordIssueDetected(data: IssueTelemetryData) {
  recordEvent({ type: 'issue_detected', data });
}

export function recordHealApplied(data: HealTelemetryData) {
  recordEvent({ type: 'heal_applied', data });
}

// Get current telemetry state (for non-reactive access)
export function getTelemetryState(): Readonly<UnifiedTelemetryState> {
  return {
    ...telemetryState,
    adapters: new Map(telemetryState.adapters)
  };
}

// Export types
export type {
  TelemetryEvent,
  UnifiedTelemetryState,
  CodeTelemetryData,
  AdapterTelemetryData,
  ResonanceTelemetryData,
  IssueTelemetryData,
  HealTelemetryData
};
