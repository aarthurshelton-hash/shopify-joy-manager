/**
 * Benchmark Coordinator v7.42-AUTONOMOUS
 * 
 * Coordinates between manual benchmarks and auto-evolution to prevent
 * resource conflicts (Stockfish worker contention).
 * 
 * v7.42 AUTONOMOUS CHANGES:
 * - Sets DATABASE LOCK when manual benchmark starts (so server-side cron yields)
 * - Lock expires after 10 minutes (stale lock protection)
 * - Auto-evolution (both client and server) checks lock before starting
 * 
 * When manual benchmark starts:
 * - Sets database lock (for server-side awareness)
 * - Pauses client-side auto-evolution
 * - Gives exclusive access to manual benchmark
 * 
 * When manual benchmark ends:
 * - Releases database lock
 * - Resumes auto-evolution if it was running
 */

import { 
  pauseAutoEvolution, 
  resumeAutoEvolution, 
  getEvolutionState 
} from './autoEvolutionEngine';
import { supabase } from '@/integrations/supabase/client';

const COORDINATOR_VERSION = "8.01-SMOOTH";

interface CoordinatorState {
  manualBenchmarkActive: boolean;
  wasAutoEvolutionRunning: boolean;
  startedAt: Date | null;
  abortController: AbortController | null;
}

const state: CoordinatorState = {
  manualBenchmarkActive: false,
  wasAutoEvolutionRunning: false,
  startedAt: null,
  abortController: null,
};

// v7.13: Subscribers that get notified when lock state changes
type LockListener = (isLocked: boolean) => void;
const lockListeners: Set<LockListener> = new Set();

export function subscribeToBenchmarkLock(listener: LockListener): () => void {
  lockListeners.add(listener);
  return () => lockListeners.delete(listener);
}

function notifyListeners(isLocked: boolean): void {
  lockListeners.forEach(listener => {
    try {
      listener(isLocked);
    } catch (e) {
      console.warn('[BenchmarkCoordinator] Listener error:', e);
    }
  });
}

/**
 * v8.01-SMOOTH: Set database lock with retry logic to prevent constraint errors
 */
async function setDatabaseLock(locked: boolean): Promise<void> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // v8.01: First try to update existing record
      const { data: existing } = await supabase
        .from('evolution_state')
        .select('id')
        .eq('state_type', 'benchmark_lock')
        .maybeSingle();
      
      const payload = {
        state_type: 'benchmark_lock',
        genes: { 
          locked,
          version: COORDINATOR_VERSION,
          timestamp: new Date().toISOString(),
        },
        fitness_score: locked ? 0 : 100,
        generation: 0,
      };
      
      let error;
      if (existing?.id) {
        // Update existing record by ID (no conflict possible)
        const result = await supabase
          .from('evolution_state')
          .update(payload)
          .eq('id', existing.id);
        error = result.error;
      } else {
        // Insert new with upsert as fallback
        const result = await supabase
          .from('evolution_state')
          .upsert(payload, { 
            onConflict: 'state_type',
            ignoreDuplicates: false 
          });
        error = result.error;
      }
      
      if (!error) {
        console.log(`[${COORDINATOR_VERSION}] Database lock ${locked ? 'SET' : 'RELEASED'}`);
        return;
      }
      
      // If duplicate key error, retry after brief delay
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 100 * attempt));
          continue;
        }
      }
      
      console.warn(`[${COORDINATOR_VERSION}] Failed to set database lock:`, error);
      return;
      
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 100 * attempt));
        continue;
      }
      console.warn(`[${COORDINATOR_VERSION}] Database lock error:`, err);
      return;
    }
  }
}

/**
 * Call this BEFORE starting a manual benchmark
 * Sets database lock + pauses client-side auto-evolution
 */
export async function acquireBenchmarkLock(): Promise<AbortController> {
  if (state.manualBenchmarkActive) {
    console.log(`[${COORDINATOR_VERSION}] Lock already held, returning existing abort controller`);
    return state.abortController || new AbortController();
  }
  
  console.log(`[${COORDINATOR_VERSION}] Acquiring benchmark lock...`);
  
  // Create abort controller for this benchmark session
  state.abortController = new AbortController();
  
  // v7.42: Set database lock FIRST (so server-side cron yields)
  await setDatabaseLock(true);
  
  // Check current auto-evolution state
  const evolutionState = getEvolutionState();
  state.wasAutoEvolutionRunning = evolutionState.isRunning && !evolutionState.isPaused;
  
  // Pause client-side auto-evolution if running
  if (state.wasAutoEvolutionRunning) {
    console.log(`[${COORDINATOR_VERSION}] Pausing client-side auto-evolution for manual benchmark`);
    pauseAutoEvolution();
    
    // Quick wait for auto-evolution to yield
    await new Promise(r => setTimeout(r, 100));
  }
  
  state.manualBenchmarkActive = true;
  state.startedAt = new Date();
  
  // Notify listeners
  notifyListeners(true);
  
  console.log(`[${COORDINATOR_VERSION}] ✅ Benchmark lock acquired (database + client)`);
  
  return state.abortController;
}

/**
 * Call this AFTER a manual benchmark completes (success or failure)
 * Releases database lock + resumes auto-evolution if it was running before
 */
export async function releaseBenchmarkLock(): Promise<void> {
  if (!state.manualBenchmarkActive) {
    console.log(`[${COORDINATOR_VERSION}] No lock to release`);
    return;
  }
  
  const duration = state.startedAt 
    ? Math.round((Date.now() - state.startedAt.getTime()) / 1000) 
    : 0;
  
  console.log(`[${COORDINATOR_VERSION}] Releasing benchmark lock after ${duration}s`);
  
  // Signal abort to any remaining operations
  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
  
  state.manualBenchmarkActive = false;
  state.startedAt = null;
  
  // Notify listeners
  notifyListeners(false);
  
  // v7.42: Release database lock (so server-side cron can resume)
  await setDatabaseLock(false);
  
  // Quick cleanup
  await new Promise(r => setTimeout(r, 200));
  
  // Resume client-side auto-evolution if it was running before
  if (state.wasAutoEvolutionRunning) {
    console.log(`[${COORDINATOR_VERSION}] Resuming client-side auto-evolution`);
    resumeAutoEvolution();
  }
  
  state.wasAutoEvolutionRunning = false;
  
  console.log(`[${COORDINATOR_VERSION}] ✅ Benchmark lock released (database + client)`);
}

/**
 * Check if a manual benchmark is currently active
 * CRITICAL: Auto-evolution should check this before EVERY batch
 */
export function isManualBenchmarkActive(): boolean {
  return state.manualBenchmarkActive;
}

/**
 * Get the current abort signal (for cancellation)
 */
export function getBenchmarkAbortSignal(): AbortSignal | null {
  return state.abortController?.signal || null;
}

/**
 * Get coordinator state for debugging
 */
export function getCoordinatorState(): CoordinatorState & { hasAbortController: boolean } {
  return { 
    ...state,
    hasAbortController: state.abortController !== null,
  };
}
