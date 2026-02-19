/**
 * Signal Calibration Cache — Self-Learned Parameters from Outcomes
 * 
 * Loads empirical signal distributions from the learned_signal_calibration table
 * (populated by signal-calibration-worker.mjs) and provides lookup functions
 * for the equilibrium predictor to use INSTEAD of hardcoded constants.
 * 
 * The key insight: with 700K+ labeled outcomes, we KNOW the actual
 * white/black/draw distribution for every eval bucket, archetype, and phase.
 * Using empirical truth instead of hand-tuned guesses is what closes the
 * feedback loop and enables accuracy to grow with data volume.
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface SignalDistribution {
  white: number;
  black: number;
  draw: number;
  sampleSize: number;
}

export interface ArchetypeFusionWeights {
  sfMultiplier: number;       // How much to boost/dampen SF weight for this archetype
  controlMultiplier: number;  // Board control signal importance
  momentumMultiplier: number; // Temporal momentum importance
  kingSafetyMultiplier: number; // King safety importance
  pawnStructureMultiplier: number; // Pawn structure importance
  sampleSize: number;
  accuracy: number;
}

interface CalibrationData {
  stockfishEval: Record<string, SignalDistribution>;
  archetype: Record<string, SignalDistribution>;
  phase: Record<string, SignalDistribution>;
  interaction: Record<string, SignalDistribution>;
  archetypePhase: Record<string, SignalDistribution>;
  archetypeFusionWeights: Record<string, ArchetypeFusionWeights>;
  fusionAnalysis: {
    overallAccuracy: number;
    byArchetype: Record<string, { accuracy: number; sampleSize: number }>;
    byEvalStrength: Record<string, { accuracy: number; sampleSize: number }>;
    byPhase: Record<string, { accuracy: number; sampleSize: number }>;
  } | null;
  loadedAt: number;
  available: boolean;
}

// Singleton cache
const calibration: CalibrationData = {
  stockfishEval: {},
  archetype: {},
  phase: {},
  interaction: {},
  archetypePhase: {},
  archetypeFusionWeights: {},
  fusionAnalysis: null,
  loadedAt: 0,
  available: false,
};

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
let loadPromise: Promise<void> | null = null;

/**
 * Initialize calibration from Supabase. Called once on first use.
 * Non-blocking: if it fails, the predictor falls back to hardcoded values.
 */
export async function loadCalibration(): Promise<void> {
  try {
    // Resolve Supabase credentials from environment
    // Farm workers (CommonJS): use process.env
    // Browser (Vite): env vars are inlined at build time via globalThis.__SUPABASE_URL__
    // or from the app's existing supabase client config
    const g = (typeof globalThis !== 'undefined' ? globalThis : {}) as unknown as Record<string, string>;
    const supabaseUrl = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL)
      || g.__SUPABASE_URL__
      || undefined;
    const supabaseKey = (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY))
      || g.__SUPABASE_ANON_KEY__
      || undefined;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('[SignalCal] No Supabase credentials — using hardcoded signals');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('learned_signal_calibration')
      .select('id, calibration_type, parameters');
    
    if (error || !data || data.length === 0) {
      console.log('[SignalCal] No calibration data available yet — using hardcoded signals');
      return;
    }
    
    for (const row of data) {
      const params = typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters;
      
      switch (row.calibration_type) {
        case 'stockfish_eval':
          calibration.stockfishEval = params.distributions || {};
          break;
        case 'archetype':
          calibration.archetype = params.distributions || {};
          break;
        case 'phase':
          calibration.phase = params.distributions || {};
          break;
        case 'interaction':
          calibration.interaction = params.distributions || {};
          break;
        case 'archetype_phase':
          calibration.archetypePhase = params.distributions || {};
          break;
        case 'archetype_fusion_weights':
          calibration.archetypeFusionWeights = params.weights || {};
          break;
        case 'fusion_analysis':
          calibration.fusionAnalysis = params;
          break;
      }
    }
    
    calibration.loadedAt = Date.now();
    calibration.available = true;
    
    const sfBuckets = Object.keys(calibration.stockfishEval).length;
    const archCount = Object.keys(calibration.archetype).length;
    const interCount = Object.keys(calibration.interaction).length;
    const archPhaseCount = Object.keys(calibration.archetypePhase).length;
    const fusionWeightCount = Object.keys(calibration.archetypeFusionWeights).length;
    
    console.log(`[SignalCal] ✓ Loaded: ${sfBuckets} SF buckets, ${archCount} archetypes, ${interCount} interactions, ${archPhaseCount} arch×phase, ${fusionWeightCount} fusion weights`);
  } catch (e) {
    console.log(`[SignalCal] Load failed (non-fatal): ${(e as Error).message}`);
  }
}

/**
 * Ensure calibration is loaded (call once, cached)
 */
export function ensureCalibrationLoaded(): void {
  if (!loadPromise && (Date.now() - calibration.loadedAt > CACHE_TTL)) {
    loadPromise = loadCalibration().finally(() => { loadPromise = null; });
  }
}

/**
 * Check if calibration data is available
 */
export function isCalibrated(): boolean {
  return calibration.available;
}

// ═══════════════════════════════════════════════════════════════
// LOOKUP FUNCTIONS — used by equilibriumPredictor signal functions
// ═══════════════════════════════════════════════════════════════

/**
 * Get empirical SF eval distribution for a given centipawn evaluation.
 * Returns null if no calibration data is available (falls back to hardcoded).
 */
export function getCalibratedStockfishSignal(eval_cp: number): SignalDistribution | null {
  if (!calibration.available) return null;
  
  let bucket: string;
  if (eval_cp > 200) bucket = 'white_winning';
  else if (eval_cp > 60) bucket = 'white_clear';
  else if (eval_cp > 35) bucket = 'white_moderate';
  else if (eval_cp > 20) bucket = 'white_slight';
  else if (eval_cp > -20) bucket = 'equal';
  else if (eval_cp > -35) bucket = 'black_slight';
  else if (eval_cp > -60) bucket = 'black_moderate';
  else if (eval_cp > -200) bucket = 'black_clear';
  else bucket = 'black_winning';
  
  return calibration.stockfishEval[bucket] || null;
}

/**
 * Get empirical archetype distribution.
 */
export function getCalibratedArchetypeSignal(archetype: string): SignalDistribution | null {
  if (!calibration.available) return null;
  return calibration.archetype[archetype] || null;
}

/**
 * Get empirical phase distribution.
 */
export function getCalibratedPhaseSignal(moveNumber: number): SignalDistribution | null {
  if (!calibration.available) return null;
  
  let phase: string;
  if (moveNumber < 15) phase = 'opening';
  else if (moveNumber < 25) phase = 'early_middle';
  else if (moveNumber < 35) phase = 'late_middle';
  else if (moveNumber < 50) phase = 'early_endgame';
  else phase = 'deep_endgame';
  
  return calibration.phase[phase] || null;
}

/**
 * Get empirical archetype × eval interaction distribution.
 * This is the POWER MOVE — captures how archetypes behave differently
 * at different eval magnitudes.
 */
export function getCalibratedInteractionSignal(
  archetype: string,
  eval_cp: number
): SignalDistribution | null {
  if (!calibration.available) return null;
  
  // v30.3: MICRO-ZONE interaction — 9 zones instead of 5
  // Old: ±30/±100 boundaries lumped 0-30cp together (EP edge varies 12-29pp within that range)
  // New: near_equal/slight_edge/small_edge/moderate_edge/strong with white/black variants
  const absEvalCp = Math.abs(eval_cp);
  let evalZone: string;
  if (absEvalCp < 10) evalZone = 'near_equal';
  else if (absEvalCp < 25) evalZone = eval_cp > 0 ? 'white_slight' : 'black_slight';
  else if (absEvalCp < 50) evalZone = eval_cp > 0 ? 'white_small' : 'black_small';
  else if (absEvalCp < 100) evalZone = eval_cp > 0 ? 'white_moderate' : 'black_moderate';
  else evalZone = eval_cp > 0 ? 'white_strong' : 'black_strong';
  
  const key = `${archetype}__${evalZone}`;
  // Fallback to old coarse zones if micro-zone not in calibration data yet
  if (calibration.interaction[key]) return calibration.interaction[key];
  const fallbackZone = eval_cp > 100 ? 'white_strong' : eval_cp > 30 ? 'white_edge' : eval_cp > -30 ? 'equal' : eval_cp > -100 ? 'black_edge' : 'black_strong';
  return calibration.interaction[`${archetype}__${fallbackZone}`] || null;
}

/**
 * Get empirical archetype × phase interaction distribution.
 * v17.8: Captures how each archetype performs at different game phases.
 * e.g., kingside_attack peaks in late_middle, positional_squeeze in early_endgame.
 */
export function getCalibratedArchetypePhaseSignal(
  archetype: string,
  moveNumber: number
): SignalDistribution | null {
  if (!calibration.available) return null;
  
  // v30.3: FINE PHASE — 8 phases instead of 5 (from 5-move bucket analysis on 2.5M games)
  // Old: opening(<15) lumped 1-5 (+11.9pp EP edge) with 11-15 (+9.4pp)
  // New: early_opening/opening/opening_transition/early_middle/middlegame/late_middle/endgame/deep_endgame
  let phase: string;
  if (moveNumber <= 5) phase = 'early_opening';
  else if (moveNumber <= 10) phase = 'opening';
  else if (moveNumber <= 15) phase = 'opening_transition';
  else if (moveNumber <= 25) phase = 'early_middle';
  else if (moveNumber <= 35) phase = 'middlegame';
  else if (moveNumber <= 45) phase = 'late_middle';
  else if (moveNumber <= 55) phase = 'endgame';
  else phase = 'deep_endgame';
  
  const key = `${archetype}__${phase}`;
  // Fallback to old coarse phases if fine phase not in calibration data yet
  if (calibration.archetypePhase[key]) return calibration.archetypePhase[key];
  const fallbackPhase = moveNumber < 15 ? 'opening' : moveNumber < 25 ? 'early_middle' : moveNumber < 35 ? 'late_middle' : moveNumber < 50 ? 'early_endgame' : 'deep_endgame';
  return calibration.archetypePhase[`${archetype}__${fallbackPhase}`] || null;
}

/**
 * Get per-archetype fusion weight adjustments.
 * v17.8: Auto-tuned multipliers that adjust signal weights per archetype.
 * e.g., kingside_attack gets higher kingSafety weight, positional_squeeze gets higher pawnStructure.
 */
export function getArchetypeFusionWeights(archetype: string): ArchetypeFusionWeights | null {
  if (!calibration.available) return null;
  return calibration.archetypeFusionWeights[archetype] || null;
}

/**
 * Get archetype accuracy from fusion analysis.
 * Used to weight or suppress predictions from weak archetypes.
 */
export function getArchetypeAccuracy(archetype: string): { accuracy: number; sampleSize: number } | null {
  if (!calibration.fusionAnalysis?.byArchetype) return null;
  return calibration.fusionAnalysis.byArchetype[archetype] || null;
}
