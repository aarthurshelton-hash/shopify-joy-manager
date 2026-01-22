/**
 * Auto-Evolution Engine v7.0-UNBLOCKABLE
 * 
 * PHILOSOPHY: The system NEVER stops. Uses LOCAL Stockfish only (no API dependencies).
 * 
 * v7.0 CRITICAL FIXES:
 * - All async operations have hard timeouts to prevent infinite hangs
 * - Abort controller pattern for cancelable batches
 * - Self-healing with exponential backoff
 * - Defensive Promise.race on EVERY external call
 * 
 * ARCHITECTURE:
 * - LOCAL Stockfish is the ONLY analysis source (guaranteed to work)
 * - No cloud API dependencies - pipeline works offline
 * - Self-healing error recovery
 * - Automatic restart on any failure
 * - Incremental persistence (never lose data)
 */

const AUTO_EVOLUTION_VERSION = "7.0-UNBLOCKABLE";
console.log(`[v7.0] autoEvolutionEngine.ts LOADED - Version: ${AUTO_EVOLUTION_VERSION}`);

import { 
  runCloudPoolBatch, 
  runLocalPoolBatch, 
  savePoolPredictions,
  type PoolPrediction,
  type PoolProgress,
  CLOUD_POOL_CONFIG,
  LOCAL_POOL_CONFIG,
} from './dualPoolPipeline';
import { supabase } from '@/integrations/supabase/client';
import { getStockfishEngine, terminateStockfish } from './stockfishEngine';

// ================ ENGINE STATE ================

export interface EvolutionState {
  isRunning: boolean;
  isPaused: boolean;
  
  // Lifetime stats
  totalPredictions: number;
  totalCloudPredictions: number;
  totalLocalPredictions: number;
  
  // Current session
  sessionStartedAt: Date | null;
  sessionPredictions: number;
  
  // Health
  consecutiveErrors: number;
  lastErrorAt: Date | null;
  lastSuccessAt: Date | null;
  recoveryCount: number;
  
  // Pool status
  cloudPoolStatus: 'idle' | 'running' | 'error' | 'recovering';
  localPoolStatus: 'idle' | 'running' | 'error' | 'recovering';
  
  // Current batch
  currentBatchNumber: number;
  batchStartedAt: Date | null;
}

interface EvolutionConfig {
  cloudBatchSize: number;       // Games per volume batch
  localBatchSize: number;       // Games per deep batch
  cloudBatchIntervalMs: number; // Time between volume batches
  localBatchIntervalMs: number; // Time between deep batches
  maxConsecutiveErrors: number; // Before full recovery
  recoveryDelayMs: number;      // Wait after error
  healthCheckIntervalMs: number; // Check engine health
}

// v7.0: Aggressive timeouts to prevent blocking
const DEFAULT_CONFIG: EvolutionConfig = {
  cloudBatchSize: 5,               // Smaller batches = more checkpoints
  localBatchSize: 1,               // Process 1 game per deep batch
  cloudBatchIntervalMs: 3 * 60 * 1000,   // 3 min between volume batches
  localBatchIntervalMs: 10 * 60 * 1000,  // 10 min between deep batches
  maxConsecutiveErrors: 2,         // Faster recovery trigger
  recoveryDelayMs: 10000,          // 10s recovery delay
  healthCheckIntervalMs: 2 * 60 * 1000,  // 2 min health checks
};

// v7.0: Hard timeout for any batch operation
const BATCH_TIMEOUT_MS = 90000; // 90 seconds max per batch

// Singleton state
let engineState: EvolutionState = {
  isRunning: false,
  isPaused: false,
  totalPredictions: 0,
  totalCloudPredictions: 0,
  totalLocalPredictions: 0,
  sessionStartedAt: null,
  sessionPredictions: 0,
  consecutiveErrors: 0,
  lastErrorAt: null,
  lastSuccessAt: null,
  recoveryCount: 0,
  cloudPoolStatus: 'idle',
  localPoolStatus: 'idle',
  currentBatchNumber: 0,
  batchStartedAt: null,
};

// Timer handles
let cloudBatchTimer: NodeJS.Timeout | null = null;
let localBatchTimer: NodeJS.Timeout | null = null;
let healthCheckTimer: NodeJS.Timeout | null = null;

// Event listeners
type EvolutionListener = (state: EvolutionState, event: string, data?: any) => void;
const listeners: Set<EvolutionListener> = new Set();

// ================ EVENT SYSTEM ================

export function subscribeToEvolution(listener: EvolutionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitEvent(event: string, data?: any) {
  listeners.forEach(listener => {
    try {
      listener({ ...engineState }, event, data);
    } catch (err) {
      console.error('[v6.93] Listener error:', err);
    }
  });
}

// ================ PERSISTENCE ================

async function persistEvolutionState() {
  try {
    // First check if record exists
    const { data: existing } = await supabase
      .from('evolution_state')
      .select('id')
      .eq('state_type', 'auto_evolution_engine')
      .maybeSingle();
    
    const payload = {
      state_type: 'auto_evolution_engine',
      genes: {
        version: AUTO_EVOLUTION_VERSION,
        total_predictions: engineState.totalPredictions,
        total_cloud: engineState.totalCloudPredictions,
        total_local: engineState.totalLocalPredictions,
        recovery_count: engineState.recoveryCount,
        consecutive_errors: engineState.consecutiveErrors,
      },
      fitness_score: engineState.consecutiveErrors === 0 ? 1 : 
        Math.max(0, 1 - engineState.consecutiveErrors * 0.2),
      generation: engineState.currentBatchNumber,
      last_mutation_at: new Date().toISOString(),
    };
    
    let error;
    if (existing?.id) {
      // Update existing
      const result = await supabase
        .from('evolution_state')
        .update(payload)
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from('evolution_state')
        .insert(payload);
      error = result.error;
    }
    
    if (error) {
      console.warn('[v6.95] State persistence warning:', error.message);
    }
  } catch (err) {
    console.error('[v6.95] State persistence failed:', err);
  }
}

async function loadPreviousStats(): Promise<void> {
  try {
    // Load total prediction count from database
    const { count } = await supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true });
    
    if (count) {
      engineState.totalPredictions = count;
    }
    
    // Load evolution state
    const { data } = await supabase
      .from('evolution_state')
      .select('*')
      .eq('state_type', 'auto_evolution_engine')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data?.genes) {
      const genes = data.genes as any;
      engineState.currentBatchNumber = data.generation || 0;
      engineState.recoveryCount = genes.recovery_count || 0;
    }
    
    console.log(`[v6.93] Loaded state: ${engineState.totalPredictions} total predictions, batch ${engineState.currentBatchNumber}`);
  } catch (err) {
    console.warn('[v6.93] Could not load previous stats:', err);
  }
}

// ================ HEALTH & RECOVERY ================

async function performHealthCheck(): Promise<boolean> {
  console.log('[v6.93] Performing health check...');
  
  try {
    // Check Stockfish engine
    const engine = getStockfishEngine();
    if (!engine.available) {
      console.warn('[v6.93] Stockfish not available, attempting recovery...');
      await recoverStockfish();
    }
    
    // Check database connectivity
    const { error } = await supabase
      .from('chess_prediction_attempts')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('[v6.93] Database health check failed:', error);
      return false;
    }
    
    console.log('[v6.93] Health check passed ✓');
    return true;
    
  } catch (err) {
    console.error('[v6.93] Health check failed:', err);
    return false;
  }
}

async function recoverStockfish(): Promise<void> {
  console.log('[v6.93] Recovering Stockfish engine...');
  
  try {
    terminateStockfish();
    await new Promise(r => setTimeout(r, 2000));
    
    const engine = getStockfishEngine();
    await engine.waitReady();
    
    console.log('[v6.93] Stockfish recovered ✓');
  } catch (err) {
    console.error('[v6.93] Stockfish recovery failed:', err);
  }
}

async function performFullRecovery(): Promise<void> {
  console.log('[v6.93] FULL RECOVERY initiated...');
  engineState.recoveryCount++;
  
  emitEvent('recovery_started', { count: engineState.recoveryCount });
  
  // 1. Stop all timers
  stopTimers();
  
  // 2. Wait for any in-flight operations
  await new Promise(r => setTimeout(r, DEFAULT_CONFIG.recoveryDelayMs));
  
  // 3. Recover Stockfish
  await recoverStockfish();
  
  // 4. Reset error count
  engineState.consecutiveErrors = 0;
  engineState.cloudPoolStatus = 'idle';
  engineState.localPoolStatus = 'idle';
  
  // 5. Persist state
  await persistEvolutionState();
  
  // 6. Restart if engine was running
  if (engineState.isRunning && !engineState.isPaused) {
    console.log('[v6.93] Restarting after recovery...');
    await new Promise(r => setTimeout(r, 5000));
    startTimers();
  }
  
  emitEvent('recovery_complete', { count: engineState.recoveryCount });
  console.log('[v6.93] FULL RECOVERY complete ✓');
}

// ================ BATCH PROCESSORS ================

/**
 * v7.0: Wrap any promise with a hard timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms)
    )
  ]);
}

async function runCloudBatch(): Promise<void> {
  if (engineState.isPaused || !engineState.isRunning) return;
  
  console.log(`[v7.0-VOLUME] Starting batch ${engineState.currentBatchNumber}...`);
  engineState.cloudPoolStatus = 'running';
  engineState.batchStartedAt = new Date();
  emitEvent('cloud_batch_started', { batch: engineState.currentBatchNumber });
  
  try {
    // v7.0: HARD TIMEOUT on entire batch operation
    const predictions = await withTimeout(
      runCloudPoolBatch(
        DEFAULT_CONFIG.cloudBatchSize,
        engineState.currentBatchNumber,
        (status, progress, prediction) => {
          console.log(`[v7.0-VOLUME] ${status}`);
          if (prediction) {
            emitEvent('prediction_complete', { 
              pool: 'volume', 
              prediction,
              sessionTotal: engineState.sessionPredictions 
            });
          }
        }
      ),
      BATCH_TIMEOUT_MS,
      'CloudBatch'
    );
    
    if (predictions.length > 0) {
      // v7.0: Timeout on save too
      const runId = await withTimeout(
        savePoolPredictions(predictions, 'VOLUME-LOCAL'),
        30000,
        'SavePredictions'
      );
      
      // Update stats
      engineState.totalPredictions += predictions.length;
      engineState.totalCloudPredictions += predictions.length;
      engineState.sessionPredictions += predictions.length;
      engineState.consecutiveErrors = 0;
      engineState.lastSuccessAt = new Date();
      
      console.log(`[v7.0-VOLUME] ✅ Batch complete: ${predictions.length} predictions saved (Run: ${runId})`);
      emitEvent('cloud_batch_complete', { 
        count: predictions.length, 
        runId,
        totalSession: engineState.sessionPredictions,
        totalLifetime: engineState.totalPredictions 
      });
    } else {
      console.warn('[v7.0-VOLUME] ⚠️ Batch returned 0 predictions - will retry next batch');
      // Don't count as error - may just be no fresh games
    }
    
    engineState.cloudPoolStatus = 'idle';
    await withTimeout(persistEvolutionState(), 10000, 'PersistState');
    
  } catch (err) {
    console.error('[v7.0-VOLUME] ❌ Batch failed:', err);
    
    engineState.consecutiveErrors++;
    engineState.lastErrorAt = new Date();
    engineState.cloudPoolStatus = 'error';
    
    emitEvent('cloud_batch_error', { error: err, consecutiveErrors: engineState.consecutiveErrors });
    
    // v7.0: Force stop Stockfish on timeout to prevent hung state
    if (String(err).includes('timeout')) {
      console.warn('[v7.0-VOLUME] ⏱️ Timeout detected, forcing Stockfish reset...');
      try {
        terminateStockfish();
        await new Promise(r => setTimeout(r, 2000));
      } catch {}
    }
    
    // Trigger recovery if too many errors
    if (engineState.consecutiveErrors >= DEFAULT_CONFIG.maxConsecutiveErrors) {
      await performFullRecovery();
    }
  }
  
  engineState.currentBatchNumber++;
  
  // Schedule next batch (self-healing: ALWAYS reschedule)
  if (engineState.isRunning && !engineState.isPaused) {
    console.log(`[v7.0-VOLUME] Next batch in ${DEFAULT_CONFIG.cloudBatchIntervalMs / 60000} min`);
    cloudBatchTimer = setTimeout(runCloudBatch, DEFAULT_CONFIG.cloudBatchIntervalMs);
  }
}

async function runLocalBatch(): Promise<void> {
  if (engineState.isPaused || !engineState.isRunning) return;
  
  console.log(`[v7.0-DEEP] Starting deep batch ${engineState.currentBatchNumber}...`);
  engineState.localPoolStatus = 'running';
  emitEvent('local_batch_started', { batch: engineState.currentBatchNumber });
  
  try {
    // v7.0: HARD TIMEOUT on deep batch (2 min for deep analysis)
    const predictions = await withTimeout(
      runLocalPoolBatch(
        DEFAULT_CONFIG.localBatchSize,
        engineState.currentBatchNumber + 1000,
        (status, progress, prediction) => {
          console.log(`[v7.0-DEEP] ${status}`);
          if (prediction) {
            emitEvent('prediction_complete', { 
              pool: 'deep', 
              prediction,
              sessionTotal: engineState.sessionPredictions 
            });
          }
        }
      ),
      120000, // 2 min timeout for deep analysis
      'LocalBatch'
    );
    
    if (predictions.length > 0) {
      const runId = await withTimeout(
        savePoolPredictions(predictions, 'LOCAL-DEEP'),
        30000,
        'SavePredictions'
      );
      
      engineState.totalPredictions += predictions.length;
      engineState.totalLocalPredictions += predictions.length;
      engineState.sessionPredictions += predictions.length;
      engineState.consecutiveErrors = 0;
      engineState.lastSuccessAt = new Date();
      
      console.log(`[v7.0-DEEP] ✅ Deep batch complete: ${predictions.length} predictions saved (Run: ${runId})`);
      emitEvent('local_batch_complete', { 
        count: predictions.length, 
        runId,
        totalSession: engineState.sessionPredictions,
        totalLifetime: engineState.totalPredictions 
      });
    } else {
      console.warn('[v7.0-DEEP] ⚠️ Deep batch returned 0 predictions');
    }
    
    engineState.localPoolStatus = 'idle';
    await withTimeout(persistEvolutionState(), 10000, 'PersistState');
    
  } catch (err) {
    console.error('[v7.0-DEEP] ❌ Deep batch failed:', err);
    
    engineState.consecutiveErrors++;
    engineState.lastErrorAt = new Date();
    engineState.localPoolStatus = 'error';
    
    emitEvent('local_batch_error', { error: err });
    
    // v7.0: Force Stockfish reset on timeout
    if (String(err).includes('timeout')) {
      console.warn('[v7.0-DEEP] ⏱️ Timeout detected, forcing Stockfish reset...');
      try {
        terminateStockfish();
        await new Promise(r => setTimeout(r, 2000));
      } catch {}
    }
    
    if (engineState.consecutiveErrors >= DEFAULT_CONFIG.maxConsecutiveErrors) {
      await performFullRecovery();
    }
  }
  
  // Schedule next batch (self-healing: ALWAYS reschedule)
  if (engineState.isRunning && !engineState.isPaused) {
    console.log(`[v7.0-DEEP] Next deep batch in ${DEFAULT_CONFIG.localBatchIntervalMs / 60000} min`);
    localBatchTimer = setTimeout(runLocalBatch, DEFAULT_CONFIG.localBatchIntervalMs);
  }
}

function runHealthCheck(): void {
  withTimeout(performHealthCheck(), 30000, 'HealthCheck')
    .then(healthy => {
      if (!healthy && engineState.isRunning) {
        console.warn('[v7.0] Health check failed, triggering recovery...');
        performFullRecovery();
      }
    })
    .catch(err => {
      console.warn('[v7.0] Health check timeout:', err);
      if (engineState.isRunning) {
        performFullRecovery();
      }
    });
  
  // Always reschedule
  if (engineState.isRunning) {
    healthCheckTimer = setTimeout(runHealthCheck, DEFAULT_CONFIG.healthCheckIntervalMs);
  }
}

// ================ TIMER MANAGEMENT ================

function startTimers(): void {
  console.log('[v7.0] Starting evolution timers...');
  
  // Start volume pool immediately, then every 3 min
  cloudBatchTimer = setTimeout(runCloudBatch, 1000);
  
  // Start deep pool after 30s, then every 10 min
  localBatchTimer = setTimeout(runLocalBatch, 30 * 1000);
  
  // Health checks every 2 min
  healthCheckTimer = setTimeout(runHealthCheck, DEFAULT_CONFIG.healthCheckIntervalMs);
}

function stopTimers(): void {
  if (cloudBatchTimer) {
    clearTimeout(cloudBatchTimer);
    cloudBatchTimer = null;
  }
  if (localBatchTimer) {
    clearTimeout(localBatchTimer);
    localBatchTimer = null;
  }
  if (healthCheckTimer) {
    clearTimeout(healthCheckTimer);
    healthCheckTimer = null;
  }
}

// ================ PUBLIC API ================

export async function startAutoEvolution(): Promise<void> {
  if (engineState.isRunning) {
    console.log('[v7.0] Already running');
    return;
  }
  
  console.log(`[v7.0] ========== AUTO-EVOLUTION ENGINE STARTING ==========`);
  console.log(`[v7.0] Version: ${AUTO_EVOLUTION_VERSION}`);
  console.log(`[v7.0] Volume: ${DEFAULT_CONFIG.cloudBatchSize} games every ${DEFAULT_CONFIG.cloudBatchIntervalMs / 60000} min`);
  console.log(`[v7.0] Deep: ${DEFAULT_CONFIG.localBatchSize} games every ${DEFAULT_CONFIG.localBatchIntervalMs / 60000} min`);
  console.log(`[v7.0] Batch timeout: ${BATCH_TIMEOUT_MS / 1000}s`);
  console.log(`[v7.0] ======================================================`);
  
  // Load previous state with timeout
  try {
    await withTimeout(loadPreviousStats(), 15000, 'LoadStats');
  } catch (err) {
    console.warn('[v7.0] Failed to load previous stats, starting fresh:', err);
  }
  
  // Initialize state
  engineState.isRunning = true;
  engineState.isPaused = false;
  engineState.sessionStartedAt = new Date();
  engineState.sessionPredictions = 0;
  engineState.consecutiveErrors = 0;
  
  // Pre-warm Stockfish with timeout
  try {
    const engine = getStockfishEngine();
    await withTimeout(engine.waitReady(), 20000, 'StockfishWarmup');
    console.log('[v7.0] ✅ Stockfish pre-warmed');
  } catch (err) {
    console.warn('[v7.0] ⚠️ Stockfish pre-warm failed, will retry during first batch:', err);
  }
  
  // Start timers
  startTimers();
  
  // Persist and emit
  try {
    await withTimeout(persistEvolutionState(), 10000, 'PersistState');
  } catch {}
  
  emitEvent('engine_started', { 
    version: AUTO_EVOLUTION_VERSION,
    totalPredictions: engineState.totalPredictions 
  });
  
  console.log('[v7.0] 🚀 Auto-evolution engine RUNNING - UNBLOCKABLE MODE');
}

export function pauseAutoEvolution(): void {
  if (!engineState.isRunning || engineState.isPaused) return;
  
  console.log('[v7.0] Pausing evolution...');
  engineState.isPaused = true;
  stopTimers();
  emitEvent('engine_paused');
}

export function resumeAutoEvolution(): void {
  if (!engineState.isRunning || !engineState.isPaused) return;
  
  console.log('[v7.0] Resuming evolution...');
  engineState.isPaused = false;
  startTimers();
  emitEvent('engine_resumed');
}

export function stopAutoEvolution(): void {
  
  console.log('[v7.0] Stopping evolution engine...');
  
  engineState.isRunning = false;
  engineState.isPaused = false;
  stopTimers();
  
  persistEvolutionState();
  emitEvent('engine_stopped', { sessionPredictions: engineState.sessionPredictions });
  
  console.log(`[v7.0] Evolution stopped. Session: ${engineState.sessionPredictions} predictions`);
}

export function getEvolutionState(): EvolutionState {
  return { ...engineState };
}

export function forceRunBatch(pool: 'cloud' | 'local'): void {
  if (!engineState.isRunning) {
    console.warn('[v7.0] Engine not running');
    return;
  }
  
  if (pool === 'cloud') {
    runCloudBatch();
  } else {
    runLocalBatch();
  }
}

export { AUTO_EVOLUTION_VERSION };
