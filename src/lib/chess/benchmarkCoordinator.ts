/**
 * Benchmark Coordinator v7.28-SAFE
 * 
 * Coordinates between manual benchmarks and auto-evolution to prevent
 * resource conflicts (Stockfish worker contention).
 * 
 * v7.28 FIXES:
 * - NO LONGER terminates Stockfish on lock acquire (manual benchmark needs it!)
 * - Auto-evolution checks lock BEFORE starting any batch
 * - Hard timeout on lock acquisition to prevent deadlocks  
 * - Global abort signal for all running operations
 * - Faster lock acquisition (reduced timeouts)
 * 
 * When manual benchmark starts:
 * - Pauses auto-evolution
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
// v7.28: Removed terminateStockfish import - manual benchmark needs the engine!

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
 * Pauses auto-evolution for exclusive access (NO LONGER terminates Stockfish!)
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
    
    // v7.28: Quick wait for auto-evolution to yield
    await new Promise(r => setTimeout(r, 100));
  }
  
  // v7.28: DO NOT terminate Stockfish here! Manual benchmark needs the engine!
  // The engine will be initialized fresh by useHybridBenchmark.runBenchmark()
  console.log('[BenchmarkCoordinator] Skipping Stockfish termination (manual benchmark will use it)');
  
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
  
  // v7.14: Quick cleanup
  await new Promise(r => setTimeout(r, 200));
  
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
