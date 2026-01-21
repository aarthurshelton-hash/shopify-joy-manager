/**
 * Auto-Evolution Engine v6.93-NEVER-STOP
 * 
 * PHILOSOPHY: The system NEVER stops. If it stops, it fixes itself.
 * 
 * ARCHITECTURE:
 * - Continuous dual-pool processing
 * - Self-healing error recovery
 * - Automatic restart on any failure
 * - Incremental persistence (never lose data)
 * - Health monitoring with auto-correction
 * 
 * THROUGHPUT TARGETS:
 * - CLOUD-VOLUME: 100+ predictions/hour (fast, volume-focused)
 * - LOCAL-DEEP: 5+ predictions/hour (precise, pattern-discovery)
 * - Combined: 105+ unique games/hour MINIMUM
 */

const AUTO_EVOLUTION_VERSION = "6.93-NEVER-STOP";
console.log(`[v6.93] autoEvolutionEngine.ts LOADED - Version: ${AUTO_EVOLUTION_VERSION}`);

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
  cloudBatchSize: number;       // Games per cloud batch
  localBatchSize: number;       // Games per local batch
  cloudBatchIntervalMs: number; // Time between cloud batches
  localBatchIntervalMs: number; // Time between local batches
  maxConsecutiveErrors: number; // Before full recovery
  recoveryDelayMs: number;      // Wait after error
  healthCheckIntervalMs: number; // Check engine health
}

const DEFAULT_CONFIG: EvolutionConfig = {
  cloudBatchSize: 25,              // Process 25 games per cloud batch
  localBatchSize: 2,               // Process 2 games per local batch
  cloudBatchIntervalMs: 15 * 60 * 1000,  // 15 min between cloud batches (100/hr)
  localBatchIntervalMs: 24 * 60 * 1000,  // 24 min between local batches (5/hr)
  maxConsecutiveErrors: 5,
  recoveryDelayMs: 30000,          // 30s recovery delay
  healthCheckIntervalMs: 5 * 60 * 1000,  // 5 min health checks
};

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
    const { error } = await supabase
      .from('evolution_state')
      .upsert({
        state_type: 'auto_evolution_engine',
        genes: {
          version: AUTO_EVOLUTION_VERSION,
          total_predictions: engineState.totalPredictions,
          total_cloud: engineState.totalCloudPredictions,
          total_local: engineState.totalLocalPredictions,
          recovery_count: engineState.recoveryCount,
          consecutive_errors: engineState.consecutiveErrors,
        },
        fitness_score: engineState.consecutiveErrors === 0 ? 100 : 
          Math.max(0, 100 - engineState.consecutiveErrors * 20),
        generation: engineState.currentBatchNumber,
        last_mutation_at: new Date().toISOString(),
      });
    
    if (error) {
      console.warn('[v6.93] State persistence warning:', error.message);
    }
  } catch (err) {
    console.error('[v6.93] State persistence failed:', err);
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

async function runCloudBatch(): Promise<void> {
  if (engineState.isPaused || !engineState.isRunning) return;
  
  console.log(`[v6.93-CLOUD] Starting batch ${engineState.currentBatchNumber}...`);
  engineState.cloudPoolStatus = 'running';
  engineState.batchStartedAt = new Date();
  emitEvent('cloud_batch_started', { batch: engineState.currentBatchNumber });
  
  try {
    const predictions = await runCloudPoolBatch(
      DEFAULT_CONFIG.cloudBatchSize,
      engineState.currentBatchNumber,
      (status, progress, prediction) => {
        if (prediction) {
          emitEvent('prediction_complete', { 
            pool: 'cloud', 
            prediction,
            sessionTotal: engineState.sessionPredictions 
          });
        }
      }
    );
    
    if (predictions.length > 0) {
      // Save predictions
      const runId = await savePoolPredictions(predictions, 'CLOUD-VOLUME');
      
      // Update stats
      engineState.totalPredictions += predictions.length;
      engineState.totalCloudPredictions += predictions.length;
      engineState.sessionPredictions += predictions.length;
      engineState.consecutiveErrors = 0;
      engineState.lastSuccessAt = new Date();
      
      console.log(`[v6.93-CLOUD] Batch complete: ${predictions.length} predictions saved (Run: ${runId})`);
      emitEvent('cloud_batch_complete', { 
        count: predictions.length, 
        runId,
        totalSession: engineState.sessionPredictions,
        totalLifetime: engineState.totalPredictions 
      });
    } else {
      console.warn('[v6.93-CLOUD] Batch returned 0 predictions');
    }
    
    engineState.cloudPoolStatus = 'idle';
    await persistEvolutionState();
    
  } catch (err) {
    console.error('[v6.93-CLOUD] Batch failed:', err);
    
    engineState.consecutiveErrors++;
    engineState.lastErrorAt = new Date();
    engineState.cloudPoolStatus = 'error';
    
    emitEvent('cloud_batch_error', { error: err, consecutiveErrors: engineState.consecutiveErrors });
    
    // Trigger recovery if too many errors
    if (engineState.consecutiveErrors >= DEFAULT_CONFIG.maxConsecutiveErrors) {
      await performFullRecovery();
    }
  }
  
  engineState.currentBatchNumber++;
  
  // Schedule next batch (self-healing: always reschedule)
  if (engineState.isRunning && !engineState.isPaused) {
    cloudBatchTimer = setTimeout(runCloudBatch, DEFAULT_CONFIG.cloudBatchIntervalMs);
  }
}

async function runLocalBatch(): Promise<void> {
  if (engineState.isPaused || !engineState.isRunning) return;
  
  console.log(`[v6.93-LOCAL] Starting deep batch ${engineState.currentBatchNumber}...`);
  engineState.localPoolStatus = 'running';
  emitEvent('local_batch_started', { batch: engineState.currentBatchNumber });
  
  try {
    const predictions = await runLocalPoolBatch(
      DEFAULT_CONFIG.localBatchSize,
      engineState.currentBatchNumber + 1000, // Different window than cloud
      (status, progress, prediction) => {
        if (prediction) {
          emitEvent('prediction_complete', { 
            pool: 'local', 
            prediction,
            sessionTotal: engineState.sessionPredictions 
          });
        }
      }
    );
    
    if (predictions.length > 0) {
      const runId = await savePoolPredictions(predictions, 'LOCAL-DEEP');
      
      engineState.totalPredictions += predictions.length;
      engineState.totalLocalPredictions += predictions.length;
      engineState.sessionPredictions += predictions.length;
      engineState.consecutiveErrors = 0;
      engineState.lastSuccessAt = new Date();
      
      console.log(`[v6.93-LOCAL] Deep batch complete: ${predictions.length} predictions saved (Run: ${runId})`);
      emitEvent('local_batch_complete', { 
        count: predictions.length, 
        runId,
        totalSession: engineState.sessionPredictions,
        totalLifetime: engineState.totalPredictions 
      });
    }
    
    engineState.localPoolStatus = 'idle';
    await persistEvolutionState();
    
  } catch (err) {
    console.error('[v6.93-LOCAL] Deep batch failed:', err);
    
    engineState.consecutiveErrors++;
    engineState.lastErrorAt = new Date();
    engineState.localPoolStatus = 'error';
    
    emitEvent('local_batch_error', { error: err });
    
    if (engineState.consecutiveErrors >= DEFAULT_CONFIG.maxConsecutiveErrors) {
      await performFullRecovery();
    }
  }
  
  // Schedule next batch (self-healing)
  if (engineState.isRunning && !engineState.isPaused) {
    localBatchTimer = setTimeout(runLocalBatch, DEFAULT_CONFIG.localBatchIntervalMs);
  }
}

function runHealthCheck(): void {
  performHealthCheck().then(healthy => {
    if (!healthy && engineState.isRunning) {
      console.warn('[v6.93] Health check failed, triggering recovery...');
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
  console.log('[v6.93] Starting evolution timers...');
  
  // Start cloud pool immediately, then every 15 min
  cloudBatchTimer = setTimeout(runCloudBatch, 1000);
  
  // Start local pool after 2 min, then every 24 min
  localBatchTimer = setTimeout(runLocalBatch, 2 * 60 * 1000);
  
  // Health checks every 5 min
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
    console.log('[v6.93] Already running');
    return;
  }
  
  console.log(`[v6.93] ========== AUTO-EVOLUTION ENGINE STARTING ==========`);
  console.log(`[v6.93] Version: ${AUTO_EVOLUTION_VERSION}`);
  console.log(`[v6.93] Cloud target: ${DEFAULT_CONFIG.cloudBatchSize} games every ${DEFAULT_CONFIG.cloudBatchIntervalMs / 60000} min`);
  console.log(`[v6.93] Local target: ${DEFAULT_CONFIG.localBatchSize} games every ${DEFAULT_CONFIG.localBatchIntervalMs / 60000} min`);
  console.log(`[v6.93] ======================================================`);
  
  // Load previous state
  await loadPreviousStats();
  
  // Initialize state
  engineState.isRunning = true;
  engineState.isPaused = false;
  engineState.sessionStartedAt = new Date();
  engineState.sessionPredictions = 0;
  engineState.consecutiveErrors = 0;
  
  // Pre-warm Stockfish
  try {
    const engine = getStockfishEngine();
    await engine.waitReady();
    console.log('[v6.93] Stockfish pre-warmed ✓');
  } catch (err) {
    console.warn('[v6.93] Stockfish pre-warm failed, will retry during first batch');
  }
  
  // Start timers
  startTimers();
  
  // Persist and emit
  await persistEvolutionState();
  emitEvent('engine_started', { 
    version: AUTO_EVOLUTION_VERSION,
    totalPredictions: engineState.totalPredictions 
  });
  
  console.log('[v6.93] Auto-evolution engine RUNNING. NEVER STOPS. 🚀');
}

export function pauseAutoEvolution(): void {
  if (!engineState.isRunning || engineState.isPaused) return;
  
  console.log('[v6.93] Pausing evolution...');
  engineState.isPaused = true;
  stopTimers();
  emitEvent('engine_paused');
}

export function resumeAutoEvolution(): void {
  if (!engineState.isRunning || !engineState.isPaused) return;
  
  console.log('[v6.93] Resuming evolution...');
  engineState.isPaused = false;
  startTimers();
  emitEvent('engine_resumed');
}

export function stopAutoEvolution(): void {
  if (!engineState.isRunning) return;
  
  console.log('[v6.93] Stopping evolution engine...');
  
  engineState.isRunning = false;
  engineState.isPaused = false;
  stopTimers();
  
  persistEvolutionState();
  emitEvent('engine_stopped', { sessionPredictions: engineState.sessionPredictions });
  
  console.log(`[v6.93] Evolution stopped. Session: ${engineState.sessionPredictions} predictions`);
}

export function getEvolutionState(): EvolutionState {
  return { ...engineState };
}

export function forceRunBatch(pool: 'cloud' | 'local'): void {
  if (!engineState.isRunning) {
    console.warn('[v6.93] Engine not running');
    return;
  }
  
  if (pool === 'cloud') {
    runCloudBatch();
  } else {
    runLocalBatch();
  }
}

export { AUTO_EVOLUTION_VERSION };
