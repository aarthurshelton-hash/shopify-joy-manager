/**
 * Benchmark Coordinator v7.12
 * 
 * Coordinates between manual benchmarks and auto-evolution to prevent
 * resource conflicts (Stockfish worker contention).
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
}

const state: CoordinatorState = {
  manualBenchmarkActive: false,
  wasAutoEvolutionRunning: false,
  startedAt: null,
};

/**
 * Call this BEFORE starting a manual benchmark
 * Pauses auto-evolution and clears Stockfish for exclusive access
 */
export async function acquireBenchmarkLock(): Promise<void> {
  if (state.manualBenchmarkActive) {
    console.log('[BenchmarkCoordinator] Lock already held');
    return;
  }
  
  console.log('[BenchmarkCoordinator] Acquiring benchmark lock...');
  
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
  
  // Terminate Stockfish to ensure clean state
  try {
    terminateStockfish();
    await new Promise(r => setTimeout(r, 1000));
  } catch (err) {
    console.warn('[BenchmarkCoordinator] Stockfish termination warning:', err);
  }
  
  state.manualBenchmarkActive = true;
  state.startedAt = new Date();
  
  console.log('[BenchmarkCoordinator] ✅ Benchmark lock acquired');
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
  
  state.manualBenchmarkActive = false;
  state.startedAt = null;
  
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
 */
export function isManualBenchmarkActive(): boolean {
  return state.manualBenchmarkActive;
}

/**
 * Get coordinator state for debugging
 */
export function getCoordinatorState(): CoordinatorState {
  return { ...state };
}
