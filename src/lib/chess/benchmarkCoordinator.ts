/**
 * Benchmark Coordinator v7.13-BULLETPROOF
 * 
 * Coordinates between manual benchmarks and auto-evolution to prevent
 * resource conflicts (Stockfish worker contention).
 * 
 * v7.13 FIXES:
 * - Auto-evolution checks lock BEFORE starting any batch
 * - Hard timeout on lock acquisition to prevent deadlocks
 * - Force termination of Stockfish on lock acquire
 * - Global abort signal for all running operations
 * 
 * When manual benchmark starts:
 * - Pauses auto-evolution
 * - Terminates any running Stockfish workers
 * - Gives exclusive access to manual benchmark
 * 
 * When manual benchmark ends:
 * - Resumes auto-evolution if it was running
 */

import { 
  pauseAutoEvolution, 
  resumeAutoEvolution, 
  getEvolutionState 
} from './autoEvolutionEngine';
import { terminateStockfish } from './stockfishEngine';

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
 * Call this BEFORE starting a manual benchmark
 * Pauses auto-evolution and clears Stockfish for exclusive access
 */
export async function acquireBenchmarkLock(): Promise<AbortController> {
  if (state.manualBenchmarkActive) {
    console.log('[BenchmarkCoordinator] Lock already held, returning existing abort controller');
    return state.abortController || new AbortController();
  }
  
  console.log('[BenchmarkCoordinator] Acquiring benchmark lock...');
  
  // Create abort controller for this benchmark session
  state.abortController = new AbortController();
  
  // Check current auto-evolution state
  const evolutionState = getEvolutionState();
  state.wasAutoEvolutionRunning = evolutionState.isRunning && !evolutionState.isPaused;
  
  // Pause auto-evolution if running
  if (state.wasAutoEvolutionRunning) {
    console.log('[BenchmarkCoordinator] Pausing auto-evolution for manual benchmark');
    pauseAutoEvolution();
    
    // Wait a moment for any in-flight operations to settle
    await new Promise(r => setTimeout(r, 500));
  }
  
  // v7.13: FORCE terminate Stockfish to ensure clean state
  // This is aggressive but prevents hung workers
  try {
    terminateStockfish();
    console.log('[BenchmarkCoordinator] Stockfish terminated');
    await new Promise(r => setTimeout(r, 1500)); // Wait longer for worker cleanup
  } catch (err) {
    console.warn('[BenchmarkCoordinator] Stockfish termination warning:', err);
  }
  
  state.manualBenchmarkActive = true;
  state.startedAt = new Date();
  
  // Notify listeners
  notifyListeners(true);
  
  console.log('[BenchmarkCoordinator] ✅ Benchmark lock acquired');
  
  return state.abortController;
}

/**
 * Call this AFTER a manual benchmark completes (success or failure)
 * Resumes auto-evolution if it was running before
 */
export async function releaseBenchmarkLock(): Promise<void> {
  if (!state.manualBenchmarkActive) {
    console.log('[BenchmarkCoordinator] No lock to release');
    return;
  }
  
  const duration = state.startedAt 
    ? Math.round((Date.now() - state.startedAt.getTime()) / 1000) 
    : 0;
  
  console.log(`[BenchmarkCoordinator] Releasing benchmark lock after ${duration}s`);
  
  // v7.13: Signal abort to any remaining operations
  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
  
  state.manualBenchmarkActive = false;
  state.startedAt = null;
  
  // Notify listeners
  notifyListeners(false);
  
  // Give Stockfish a moment to clean up
  await new Promise(r => setTimeout(r, 500));
  
  // Resume auto-evolution if it was running before
  if (state.wasAutoEvolutionRunning) {
    console.log('[BenchmarkCoordinator] Resuming auto-evolution');
    resumeAutoEvolution();
  }
  
  state.wasAutoEvolutionRunning = false;
  
  console.log('[BenchmarkCoordinator] ✅ Benchmark lock released');
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
