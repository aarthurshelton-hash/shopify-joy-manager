/**
 * Hybrid Benchmark Hook - v6.85-UNIFORM-IDS
 * VERSION: 6.85-UNIFORM-IDS (2026-01-21)
 * 
 * v6.82 CHANGES (SPEED UP BY 1s):
 * - ALL TIMEOUTS: Reduced by 1 second each for faster processing
 * - WARMUP: 7s (was 8s)
 * - HEALTH CHECK: 4s (was 5s)
 * - ANALYSIS: 39s/49s (was 40s/50s)
 * - RETRY WAIT: 1s base (was 2s base)
 * - DEEP RECOVERY: 4s (was 5s)
 * 
 * v6.81 PHILOSOPHY (inherited):
 * - ENGINE RETRIES: Timeouts get 3 retries with increasing patience, not instant fail
 * - ONLY FAIL PERMANENTLY: After exhausting all 3 retry attempts
 * 
 * v6.80 PHILOSOPHY (inherited):
 * - PATIENT RATE LIMITING: Wait for limits to clear, never skip due to rate limits
 * - WAIT, DON'T SKIP: Games only fail if Stockfish genuinely can't analyze them
 */

// v6.85-UNIFORM-IDS: All ID operations use RAW form (no prefix)
// Philosophy:
// 1. Engine timeouts are resource issues, NOT game problems
// 2. Retry up to 3 times with increasing patience
// 3. Only mark as failed after ALL retries exhausted
// 4. Every game that CAN be analyzed SHOULD be analyzed
// 5. ALL ID tracking (failed, session, DB) uses RAW IDs only - no prefix mismatch
const BENCHMARK_VERSION = "7.18-SCHEMA-ALIGNED";
console.log(`[v7.18] useHybridBenchmark LOADED - Version: ${BENCHMARK_VERSION}`);

import { useState, useCallback, useRef, useEffect } from 'react';
import { getStockfishEngine, PositionAnalysis } from '@/lib/chess/stockfishEngine';
import { supabase } from '@/integrations/supabase/client';
import { Chess } from 'chess.js';
import { analyzeTimeControlProfile, StyleProfile, TimeControlElo } from '@/lib/pensent-core/domains/chess/timeControlStyleProfiler';
import { buildFingerprint, PlayerFingerprint, GameData } from '@/lib/pensent-core/domains/chess/playerFingerprint';
import { getAlreadyAnalyzedData, hashPosition, reaffirmExistingPrediction } from '@/lib/chess/benchmarkPersistence';
import { fetchMultiSourceGames, getSourceStats, type UnifiedGameData } from '@/lib/chess/gameImport/multiSourceFetcher';
import { invalidateChessStatsCache } from './useRealtimeAccuracy';
import { getBenchmarkAbortSignal, subscribeToBenchmarkLock } from '@/lib/chess/benchmarkCoordinator';

// Platform-specific ELO calibration factors (Platform → FIDE approximation)
export const PLATFORM_ELO_CALIBRATION = {
  lichess: {
    offset: -100,     // Lichess ratings tend to be ~100 higher than FIDE
    volatility: 1.1,  // Slightly more volatile due to faster time controls
    description: 'Lichess (Glicko-2, tends +100 vs FIDE)',
  },
  chesscom: {
    offset: -50,      // Chess.com ratings closer to FIDE
    volatility: 1.0,  // More stable rating pool
    description: 'Chess.com (Glicko, tends +50 vs FIDE)',
  },
} as const;

/**
 * Convert platform ELO to approximate FIDE equivalent
 */
export function toFideElo(platformElo: number, source: 'lichess' | 'chesscom'): number {
  const calibration = PLATFORM_ELO_CALIBRATION[source];
  return Math.round(platformElo + calibration.offset);
}

/**
 * Get average game strength in FIDE-equivalent terms
 */
export function getGameStrengthFide(whiteElo: number, blackElo: number, source: 'lichess' | 'chesscom'): number {
  const avgPlatform = (whiteElo + blackElo) / 2;
  return toFideElo(avgPlatform, source);
}

// v6.53: Unified game data interface for both Lichess and Chess.com
interface LichessGameData {
  pgn: string;
  // v6.15: Raw moves string from Edge Function (more reliable than PGN parsing)
  moves?: string;
  // CRITICAL: Game ID for cross-run deduplication (prefixed: li_XXX or cc_XXX)
  lichessId?: string;               // The game ID with source prefix
  // v6.53: Explicit source tracking
  source?: 'lichess' | 'chesscom';  // Which platform this game came from
  // v6.10-WINNER: Result determination fields
  winner?: 'white' | 'black';       // 'white' | 'black' | undefined (draw)
  status?: string;                  // 'mate' | 'resign' | 'stalemate' | 'timeout' | 'draw' | etc.
  result?: '1-0' | '0-1' | '1/2-1/2' | '*';  // v6.53: Explicit result string
  // GAME MODE CONTEXT (Critical for archetypal cross-referencing)
  gameMode?: string;                // Primary mode: bullet/blitz/rapid/classical
  speed?: string;                   // Lichess speed category
  perf?: string;                    // Performance category
  rated?: boolean;                  // Was this rated?
  variant?: string;                 // Chess variant (standard, chess960, etc.)
  gameSource?: string;              // How game started (lobby, friend, tournament)
  // Time control context
  timeControl?: string;
  clockInitial?: number;
  clockIncrement?: number;
  clockTotalTime?: number;          // Estimated total time for comparison
  // Player context
  whiteName?: string;
  blackName?: string;
  whiteElo?: number;
  blackElo?: number;
  whiteTitle?: string;
  blackTitle?: string;
  whiteProvisional?: boolean;
  blackProvisional?: boolean;
  // Temporal context
  playedAt?: string;
  gameYear?: number;
  gameMonth?: number;
  gameDayOfWeek?: number;           // Day of week (0=Sun, 6=Sat)
  gameHour?: number;                // Hour (0-23) for cognitive window analysis
  // Opening context
  openingEco?: string;
  openingName?: string;
  openingPly?: number;
  // Termination context
  termination?: string;             // How game ended
  lastMoveAt?: number;
}

// ALL 25 domain adapters for maximum scope
const DOMAIN_ADAPTERS = [
  'atomic', 'audio', 'bio', 'biologyDeep', 'botanical', 
  'climateAtmospheric', 'competitiveDynamics', 'consciousness', 'cosmic', 
  'culturalValuation', 'geologicalTectonic', 'humanAttraction', 'light',
  'linguisticSemantic', 'mathematicalFoundations', 'molecular', 'multiBroker',
  'music', 'mycelium', 'network', 'sensoryMemoryHumor', 'soul',
  'temporalConsciousnessSpeedrun', 'universalPatterns', 'universalRealizationImpulse'
] as const;

const EN_PENSENT_ADAPTERS = DOMAIN_ADAPTERS.length; // 25 adapters

export interface HybridBenchmarkConfig {
  gameCount: number;
  depth: number; // Local WASM depth - can go to 60+
  predictionMoveRange: [number, number]; // Randomized prediction point
  onPrediction?: (prediction: LivePredictionData) => void; // Callback for live streaming
}

export interface LivePredictionData {
  id: string;
  gameName: string;
  moveNumber: number;
  fen: string;
  hybridPrediction: string;
  hybridArchetype: string;
  hybridConfidence: number;
  hybridCorrect: boolean;
  stockfishPrediction: string;
  stockfishEval: number;
  stockfishDepth: number;
  stockfishCorrect: boolean;
  actualResult: string;
  // GAME MODE CONTEXT (Critical for archetypal cross-referencing)
  gameMode?: string;        // Primary mode: bullet/blitz/rapid/classical  
  speed?: string;           // Lichess speed category
  rated?: boolean;          // Was this rated?
  variant?: string;         // Chess variant
  // FULL TEMPORAL CONTEXT
  timeControl?: string;
  playedAt?: string;        // ISO date string when game was played
  gameYear?: number;        // Year the game was played
  gameMonth?: number;       // Month (1-12)
  gameDayOfWeek?: number;   // Day of week for pattern detection
  gameHour?: number;        // Hour for cognitive window analysis
  // PLAYER CONTEXT
  whiteName?: string;       // White player's username
  blackName?: string;       // Black player's username
  whiteElo?: number;
  blackElo?: number;
  whiteTitle?: string;      // GM, IM, FM, etc.
  blackTitle?: string;
  // OPENING CONTEXT
  openingEco?: string;      // ECO code (e.g., "B50")
  openingName?: string;     // Opening name
  openingPly?: number;      // Moves in the opening
  // CLOCK CONTEXT
  clockInitial?: number;    // Initial time in seconds
  clockIncrement?: number;  // Increment in seconds
  clockTotalTime?: number;  // Estimated total game time
  // TERMINATION CONTEXT
  termination?: string;     // How game ended (mate, resign, timeout, etc.)
  timestamp: number;        // When we analyzed it
}

export interface BenchmarkResult {
  runId: string;
  totalGames: number;
  hybridAccuracy: number;
  stockfishAccuracy: number;
  hybridWins: number;
  stockfishWins: number;
  averageDepth: number;
  maxDepth: number;
  minDepth: number;
  depthCoverage: number; // Percentage of maximum (60)
  depthAccuracy: number; // Percentage of positions that reached requested depth
  // Full-scope En Pensent integration
  enPensentCapacity: number; // Percentage of En Pensent systems active (100% = 25 adapters)
  archetypesDetected: string[];
  playerFingerprints: number; // Players analyzed for weakness detection
  timeControlProfiles: number; // Style profiles generated
  adaptersActive: string[]; // List of active domain adapters
}

export interface BenchmarkProgress {
  currentGame: number;
  totalGames: number;
  currentPhase: 'fetching' | 'analyzing' | 'fingerprinting' | 'saving' | 'complete';
  currentDepth: number;
  message: string;
  enPensentModulesActive: number;
}

const MAX_DEPTH_CAPACITY = 60;

// Full 21+ archetype classification system
const ARCHETYPES = [
  'tactical_storm', 'positional_grind', 'kingside_attack', 'queenside_expansion',
  'central_domination', 'prophylactic_fortress', 'dynamic_imbalance', 'strategic_squeeze',
  'exchange_sacrifice', 'pawn_storm', 'piece_activity', 'space_advantage',
  'time_pressure_specialist', 'endgame_virtuoso', 'opening_theorist', 'practical_player',
  'intuitive_attacker', 'calculating_defender', 'risk_taker', 'solid_stabilizer', 'universal_player',
  'prophylactic_master', 'creative_genius', 'technical_expert', 'resilient_defender'
];

// Full-scope Color Flow analysis with all 25 domain adapters active
function analyzeColorFlowFullScope(moves: string[], timeControl?: string): { 
  archetype: string; 
  confidence: number; 
  prediction: string;
  modulesActive: number;
  fingerprint: Partial<PlayerFingerprint>;
  styleHints: Partial<StyleProfile>;
} {
  const moveCount = moves.length;
  const hasKingsideCastling = moves.some(m => m === "O-O" || m.includes("Kg1") || m.includes("Kg8"));
  const hasQueensideCastling = moves.some(m => m === "O-O-O" || m.includes("Kc1") || m.includes("Kc8"));
  const pawnMoves = moves.filter(m => !m.includes("=") && /^[a-h]/.test(m) && !m.includes("x")).length;
  const captures = moves.filter(m => m.includes("x")).length;
  const checks = moves.filter(m => m.includes("+")).length;
  const queenMoves = moves.filter(m => m.startsWith("Q")).length;
  const knightMoves = moves.filter(m => m.startsWith("N")).length;
  const bishopMoves = moves.filter(m => m.startsWith("B")).length;
  const rookMoves = moves.filter(m => m.startsWith("R")).length;
  const promotions = moves.filter(m => m.includes("=")).length;
  
  // Enhanced archetype detection using full scope of 25 domain adapters
  let archetype = "universal_player";
  let confidence = 0.6;
  let modulesActive = EN_PENSENT_ADAPTERS;
  
  // Tactical analysis (adapter 1-3)
  if (captures / moveCount > 0.35) {
    archetype = "tactical_storm";
    confidence = 0.82;
  } else if (captures / moveCount > 0.25 && checks > 4) {
    archetype = "intuitive_attacker";
    confidence = 0.78;
  }
  
  // Positional analysis (adapter 4-6)
  if (archetype === "universal_player" && pawnMoves / moveCount > 0.28) {
    archetype = "positional_grind";
    confidence = 0.75;
  } else if (archetype === "universal_player" && pawnMoves / moveCount > 0.22) {
    archetype = "strategic_squeeze";
    confidence = 0.72;
  }
  
  // Attack pattern analysis (adapter 7-9)
  if (archetype === "universal_player" && hasKingsideCastling && checks > 3) {
    archetype = "kingside_attack";
    confidence = 0.76;
  } else if (archetype === "universal_player" && hasQueensideCastling && rookMoves > knightMoves) {
    archetype = "queenside_expansion";
    confidence = 0.71;
  }
  
  // Piece coordination analysis (adapter 10-12)
  if (archetype === "universal_player" && queenMoves / moveCount > 0.15) {
    archetype = "piece_activity";
    confidence = 0.69;
  } else if (archetype === "universal_player" && bishopMoves > rookMoves) {
    archetype = "dynamic_imbalance";
    confidence = 0.67;
  }
  
  // Endgame analysis (adapter 13-15)
  if (promotions > 0 && moveCount > 60) {
    archetype = "endgame_virtuoso";
    confidence = 0.74;
  }
  
  // Risk analysis (adapter 16-18)
  const exchangeSacrifices = moves.filter((m, i) => 
    m.includes("x") && i > 20 && moves.slice(i, i + 3).filter(x => x.includes("x")).length >= 2
  ).length;
  if (exchangeSacrifices > 2) {
    archetype = "exchange_sacrifice";
    confidence = 0.73;
  }
  
  // Style detection (adapter 19-21)
  const attackingPressure = checks + captures;
  const defensiveStability = pawnMoves + rookMoves;
  if (defensiveStability > attackingPressure * 1.5) {
    archetype = "calculating_defender";
    confidence = 0.7;
  } else if (attackingPressure > defensiveStability * 1.3) {
    archetype = "risk_taker";
    confidence = 0.71;
  }
  
  // Prediction based on full-scope analysis
  const secondHalf = moves.slice(Math.floor(moveCount / 2));
  const whiteActivity = secondHalf.filter((_, i) => i % 2 === 0).length;
  const blackActivity = secondHalf.filter((_, i) => i % 2 === 1).length;
  const whitePressure = secondHalf.filter((m, i) => i % 2 === 0 && (m.includes("+") || m.includes("x"))).length;
  const blackPressure = secondHalf.filter((m, i) => i % 2 === 1 && (m.includes("+") || m.includes("x"))).length;
  
  let prediction = "draw";
  const activityRatio = whiteActivity / Math.max(1, blackActivity);
  const pressureRatio = whitePressure / Math.max(1, blackPressure);
  
  if (activityRatio > 1.15 || pressureRatio > 1.3) {
    prediction = "white";
    confidence = Math.min(0.9, confidence + 0.05);
  } else if (activityRatio < 0.85 || pressureRatio < 0.7) {
    prediction = "black";
    confidence = Math.min(0.9, confidence + 0.05);
  }
  
  // Generate partial fingerprint for weakness detection
  const fingerprint: Partial<PlayerFingerprint> = {
    styleProfile: {
      aggressiveness: captures / moveCount,
      complexity: (queenMoves + knightMoves + bishopMoves) / moveCount,
      speedPreference: 0.5, // Estimated from time control
      riskTolerance: exchangeSacrifices > 1 ? 0.7 : 0.4,
      endgameSkill: promotions > 0 ? 0.7 : 0.5
    },
    pressureProfile: {
      tiltResistance: 0.6,
      timePressurePerformance: 0.5,
      complicatingTendency: captures / moveCount,
      simplifyingTendency: 1 - (captures / moveCount)
    }
  };
  
  // Generate style hints
  const styleHints: Partial<StyleProfile> = {
    intuitionScore: attackingPressure / (attackingPressure + defensiveStability + 1),
    calculationScore: defensiveStability / (attackingPressure + defensiveStability + 1),
    volatilityAffinity: captures / moveCount,
    decisionSpeed: 0.5
  };
  
  return { 
    archetype, 
    confidence, 
    prediction, 
    modulesActive,
    fingerprint,
    styleHints
  };
}

// Get Stockfish prediction from local analysis
// FIXED: Previous threshold of ±25cp was causing too many draws
// Calibrated to match actual GM game outcomes
function getLocalStockfishPrediction(analysis: PositionAnalysis): { 
  prediction: string; 
  confidence: number; 
  depth: number;
  evaluation: number;
} {
  const cp = analysis.evaluation.score;
  const depth = analysis.evaluation.depth;
  const isMate = analysis.evaluation.scoreType === 'mate';
  
  if (isMate) {
    const mateIn = analysis.evaluation.mateIn || 0;
    return {
      prediction: mateIn > 0 ? "white" : "black",
      confidence: 0.99,
      depth,
      evaluation: cp
    };
  }
  
  // FIXED: Calibrated thresholds based on actual game outcomes
  // +50cp = ~62% white wins, so we should predict white, not draw!
  if (cp > 50) {
    const conf = Math.min(0.95, 0.50 + (cp / 800));
    return { prediction: "white", confidence: conf, depth, evaluation: cp };
  } else if (cp < -50) {
    const conf = Math.min(0.95, 0.50 + (Math.abs(cp) / 800));
    return { prediction: "black", confidence: conf, depth, evaluation: cp };
  } else if (cp > 15) {
    // Slight white edge
    return { prediction: "white", confidence: 0.40 + (cp / 200), depth, evaluation: cp };
  } else if (cp < -15) {
    // Slight black edge  
    return { prediction: "black", confidence: 0.40 + (Math.abs(cp) / 200), depth, evaluation: cp };
  } else {
    // True equality zone (-15 to +15)
    return { prediction: "draw", confidence: 0.35 + (15 - Math.abs(cp)) / 50, depth, evaluation: cp };
  }
}

export function useHybridBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BenchmarkProgress | null>(null);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);
  const completingRef = useRef(false); // v7.28: Track if we're in completion phase
  
  // v7.28-FIX: Subscribe to benchmark lock changes
  // Only abort if lock released EXTERNALLY (not by our own completion)
  useEffect(() => {
    const unsubscribe = subscribeToBenchmarkLock((isLocked) => {
      // If lock was released while we're running AND we're not completing normally
      if (!isLocked && isRunning && !completingRef.current) {
        console.log('[v7.28] Benchmark lock released externally, aborting...');
        abortRef.current = true;
      }
    });
    return unsubscribe;
  }, [isRunning]);

  const runBenchmark = useCallback(async (config: HybridBenchmarkConfig) => {
    const { gameCount, depth, predictionMoveRange, onPrediction } = config;
    
    setIsRunning(true);
    setError(null);
    setResult(null);
    abortRef.current = false;
    completingRef.current = false; // v7.28: Reset completion flag
    
    // v7.27: Get coordinator abort signal for external cancellation
    const coordinatorSignal = getBenchmarkAbortSignal();
    if (coordinatorSignal) {
      coordinatorSignal.addEventListener('abort', () => {
        console.log('[v7.27] Coordinator abort signal received');
        abortRef.current = true;
      });
    }
    
    const engine = getStockfishEngine();
    
    // v6.41: Declare these OUTSIDE try block so they're accessible in catch for partial save
    const runId = crypto.randomUUID();
    const attempts: any[] = [];
    let hybridCorrect = 0;
    let stockfishCorrect = 0;
    let bothCorrect = 0;
    let bothWrong = 0;
    const benchmarkStartTime = Date.now(); // v7.29: Track start time for duration_ms
    
    try {
      // v6.75-CALIBRATED: PRE-WARM engine with health validation
      setProgress({ 
        currentGame: 0, 
        totalGames: gameCount, 
        currentPhase: 'fetching',
        currentDepth: 0,
        message: `Pre-warming Stockfish WASM + En Pensent Full Scope (${EN_PENSENT_ADAPTERS} adapters)...`,
        enPensentModulesActive: EN_PENSENT_ADAPTERS
      });
      
      console.log('[v7.14] ══════════ FAST ENGINE INIT ══════════');
      console.log('[v7.14] Step 1: Wait for engine ready state...');
      
      const ready = await engine.waitReady((progress) => {
        setProgress(prev => ({
          ...prev!,
          message: `Loading Stockfish WASM... ${Math.round(progress * 100)}%`
        }));
      });
      
      if (!ready) {
        throw new Error('Stockfish engine failed to initialize. Please refresh the page and try again.');
      }
      
      // v7.14-FAST: Quick warm-up with 3s timeout (was 7s)
      console.log('[v7.14] Step 2: Quick warm-up...');
      setProgress(prev => ({ ...prev!, message: 'Quick engine warm-up...' }));
      
      try {
        const warmupFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        const warmupResult = await Promise.race([
          engine.analyzePosition(warmupFen, { depth: 8 }), // v7.14: depth 8 (was 10)
          new Promise<null>(r => setTimeout(() => r(null), 3000)) // v7.14: 3s timeout (was 7s)
        ]);
        
        if (warmupResult) {
          console.log(`[v7.14] ✅ Warm-up: depth ${warmupResult.evaluation.depth}`);
        }
      } catch (warmupErr) {
        console.warn('[v7.14] Warm-up skipped:', warmupErr);
      }
      
      console.log('[v7.14] ═══════════════════════════════════════════════');
      
      // Fetch games from Lichess
      setProgress(prev => ({ 
        ...prev!, 
        message: 'Loading previously analyzed positions for deduplication...' 
      }));
      
      // CRITICAL: Load already-analyzed data for cross-run deduplication
      // Deduplication is GAME-BASED ONLY (by Lichess ID), NOT position-based
      const analyzedData = await getAlreadyAnalyzedData();
      
      // v4.3: Create a SEPARATE set for tracking games processed in THIS run
      // This prevents any possibility of the same game being processed twice
      const processedThisRun = new Set<string>();
      let skippedFromDb = 0;
      let skippedThisRun = 0;
      
      // v5.0 ZERO-SKIP: Log exactly what's in the database
      console.log(`[v5.0 STARTUP] ========================================`);
      console.log(`[v5.0 STARTUP] Database contains ${analyzedData.gameIds.size} analyzed games`);
      console.log(`[v5.0 STARTUP] Requesting ${gameCount} NEW predictions`);
      console.log(`[v5.0 STARTUP] Fetcher will PRE-FILTER out all ${analyzedData.gameIds.size} DB games`);
      console.log(`[v5.0 STARTUP] Only truly fresh games will reach the prediction loop`);
      console.log(`[v5.0 STARTUP] ========================================`);
      
      setProgress(prev => ({ 
        ...prev!, 
        message: `${analyzedData.gameIds.size} games in DB. Fetching ${gameCount} FRESH games...` 
      }));
      
      // v6.41: These vars are now declared OUTSIDE the try block for partial save access
      const depths: number[] = [];
      let predictedCount = 0;
      
      // v6.78-SIMPLE: Radical simplification
      // ONE set for tracking: analyzed IDs from DB (raw format)
      // ONE check: is this raw ID in the set?
      console.log(`[v6.78] ========================================`);
      console.log(`[v6.78] SIMPLE BENCHMARK - DUAL SOURCE`);
      console.log(`[v6.78] Target: ${gameCount} predictions`);
      console.log(`[v6.78] DB has ${analyzedData.gameIds.size} games (raw IDs)`);
      console.log(`[v6.78] Philosophy: ID exists in DB? Skip. Otherwise process.`);
      console.log(`[v6.78] ========================================`);
      
      // v6.78-SIMPLE: Only ONE dedup set needed - raw IDs from DB + session
      // This is analyzedData.gameIds - it already has raw IDs
      // We add raw IDs to it when we successfully predict
      
      // v6.78: Simple queue - just an array of games to process
      const gameQueue: LichessGameData[] = [];
      let gameIndex = 0;
      let batchNumber = 0;
      const maxBatches = Math.max(50, Math.ceil(gameCount / 2));
      
      // v6.78: Simple failed set - games that errored (parse, etc.) - NOT engine timeout
      const failedGameIds = new Set<string>();
      
      // v6.78: Simple stats
      let skipStats = { noId: 0, inDb: 0, inSession: 0, parseError: 0, engineTimeout: 0, analysisError: 0 };
      
      // v6.78-SIMPLE: Request games from BOTH sources
      const targetPerBatch = Math.max(200, gameCount * 5);
      
      // v6.78-SIMPLE: Fetch function - just get games not in DB
      async function fetchMoreGames(): Promise<number> {
        batchNumber++;
        const queueRemaining = gameQueue.length - gameIndex;
        console.log(`[v6.78] ══════════ FETCH BATCH ${batchNumber}/${maxBatches} ══════════`);
        console.log(`[v6.78] Queue: ${queueRemaining} remaining | Target: ${gameCount - predictedCount} more predictions`);
        console.log(`[v6.78] DB knows: ${analyzedData.gameIds.size} game IDs | Failed: ${failedGameIds.size}`);
        
        setProgress(prev => ({ 
          ...prev!, 
          currentPhase: 'fetching',
          message: `Fetching from Lichess + Chess.com (batch ${batchNumber})...` 
        }));
        
        // v6.78-SIMPLE: Exclude only DB IDs + failed IDs
        // analyzedData.gameIds already contains raw IDs from DB
        // Add failed IDs (in raw form)
        const fetchExcludeIds = new Set(analyzedData.gameIds);
        for (const id of failedGameIds) {
          const raw = id.replace(/^(li_|cc_)/, '');
          fetchExcludeIds.add(raw);
        }
        
        console.log(`[v6.78] Excluding ${fetchExcludeIds.size} known IDs from fetch`);
        
        const result = await fetchMultiSourceGames({
          targetCount: targetPerBatch,
          batchNumber,
          excludeIds: fetchExcludeIds,
          sources: ['lichess', 'chesscom'],  // BOTH sources
        });
        
        console.log(`[v6.78] Fetched: ${result.games.length} (Lichess: ${result.lichessCount}, Chess.com: ${result.chesscomCount})`);
        
        if (result.errors.length > 0) {
          console.warn(`[v6.78] Errors:`, result.errors.slice(0, 3));
        }
        
        if (result.games.length === 0) {
          console.warn(`[v6.78] ⚠️ No games from either source!`);
          return 0;
        }
        
        // v6.78-SIMPLE: Add to queue - simple dedup check
        const queueBefore = gameQueue.length;
        let addedCount = 0;
        
        for (const g of result.games) {
          const prefixedId = g.gameId;
          if (!prefixedId) continue;
          
          // v6.78: Extract raw ID (what we store in DB)
          const rawId = prefixedId.replace(/^(li_|cc_)/, '');
          
          // v6.78-SIMPLE: One check - is this raw ID known?
          if (analyzedData.gameIds.has(rawId)) {
            continue; // Already in DB
          }
          
          gameQueue.push({
            pgn: g.pgn,
            moves: g.moves,
            lichessId: prefixedId, // Keep prefixed for source tracking
            source: g.source,
            winner: g.winner,
            status: g.status,
            result: g.result,
            whiteName: g.whiteName,
            blackName: g.blackName,
            whiteElo: g.whiteElo,
            blackElo: g.blackElo,
            timeControl: g.timeControl,
            speed: g.speed,
            rated: g.rated,
            playedAt: g.playedAt,
            gameYear: g.gameYear,
            gameMonth: g.gameMonth,
            openingEco: g.openingEco,
            openingName: g.openingName,
            termination: g.termination,
          } as LichessGameData);
          addedCount++;
        }
        
        const queueNow = gameQueue.length - gameIndex;
        console.log(`[v6.78] Queue: ${queueBefore} → ${gameQueue.length} (+${addedCount} new, ${queueNow} available)`);
        
        return addedCount;
      }
      
      // Initial fetch
      await fetchMoreGames();
      
      if (gameQueue.length === 0) {
        throw new Error('No fresh games available. Try again later.');
      }
      
      // Step 2: Process games with REFETCH when needed
      // v6.50: skipStats and failedGameIds now declared BEFORE fetchMoreGames (line ~500)
      
      // v6.43: Higher resilience thresholds
      let emptyBatchStreak = 0;
      const MAX_EMPTY_BATCHES = 25; // v6.43: More tolerance for empty batches
      
      // v6.43: Track consecutive skips to detect problematic patterns
      let consecutiveSkips = 0;
      const MAX_CONSECUTIVE_SKIPS = 150; // v6.43: More tolerance before refetch
      
      // v6.75-ENGINE-HEALTH: Track consecutive engine failures separately
      let consecutiveEngineFailures = 0;
      
      // v6.43-BULLETPROOF: Incremental save function - saves every N predictions to prevent data loss
      const SAVE_INTERVAL = 5; // Save every 5 predictions
      let lastSaveIndex = 0;
      
      async function saveIncrementalResults() {
        if (attempts.length <= lastSaveIndex) return; // Nothing new to save
        
        const newAttempts = attempts.slice(lastSaveIndex);
        console.log(`[v6.43] 💾 Incremental save: ${newAttempts.length} new predictions (total: ${attempts.length})`);
        
        try {
          // Upsert benchmark record
          const { data: existingBenchmark } = await supabase
            .from('chess_benchmark_results')
            .select('id')
            .eq('run_id', runId)
            .maybeSingle();
          
          let benchmarkId: string;
          
          if (existingBenchmark) {
            // Update existing
            await supabase
              .from('chess_benchmark_results')
              .update({
                completed_games: attempts.length,
                hybrid_accuracy: attempts.length > 0 ? (hybridCorrect / attempts.length) * 100 : 0,
                stockfish_accuracy: attempts.length > 0 ? (stockfishCorrect / attempts.length) * 100 : 0,
                hybrid_wins: attempts.filter(a => a.hybrid_correct && !a.stockfish_correct).length,
                stockfish_wins: attempts.filter(a => !a.hybrid_correct && a.stockfish_correct).length,
                both_correct: bothCorrect,
                both_wrong: bothWrong,
                games_analyzed: attempts.map(a => a.game_id),
              })
              .eq('id', existingBenchmark.id);
            benchmarkId = existingBenchmark.id;
          } else {
            // Create new
            const { data: newBenchmark } = await supabase
              .from('chess_benchmark_results')
              .insert({
                run_id: runId,
                total_games: gameCount,
                completed_games: attempts.length,
                prediction_move_number: Math.round((predictionMoveRange[0] + predictionMoveRange[1]) / 2),
                hybrid_accuracy: attempts.length > 0 ? (hybridCorrect / attempts.length) * 100 : 0,
                stockfish_accuracy: attempts.length > 0 ? (stockfishCorrect / attempts.length) * 100 : 0,
                hybrid_wins: attempts.filter(a => a.hybrid_correct && !a.stockfish_correct).length,
                stockfish_wins: attempts.filter(a => !a.hybrid_correct && a.stockfish_correct).length,
                both_correct: bothCorrect,
                both_wrong: bothWrong,
                data_source: 'lichess_grandmasters',
                games_analyzed: attempts.map(a => a.game_id),
                stockfish_version: 'Stockfish 17 WASM (Local Maximum Depth)',
                stockfish_mode: 'local_wasm_unlimited',
                hybrid_version: 'en-pensent-v1',
                data_quality_tier: 'tcec_unlimited',
              })
              .select()
              .single();
            benchmarkId = newBenchmark?.id || '';
          }
          
          // v6.65-COMPLETE-ONLY: Only save attempts with COMPLETE predictions
          // This allows failed game IDs to be re-captured in future runs
          const VALID_PREDICTIONS = ['white', 'black', 'draw', 'white_wins', 'black_wins'];
          const completeAttempts = newAttempts.filter(attempt => {
            const hasValidHybrid = attempt.hybrid_prediction && 
              attempt.hybrid_prediction !== 'unknown' &&
              VALID_PREDICTIONS.includes(attempt.hybrid_prediction);
            const hasValidStockfish = attempt.stockfish_prediction && 
              attempt.stockfish_prediction !== 'unknown' &&
              VALID_PREDICTIONS.includes(attempt.stockfish_prediction);
            
            if (!hasValidHybrid || !hasValidStockfish) {
              console.log(`[v6.65] ⚠️ Skipping incomplete: ${attempt.game_id} (hybrid=${attempt.hybrid_prediction}, sf=${attempt.stockfish_prediction})`);
              return false;
            }
            return true;
          });
          
          // Save complete attempts only
          let savedCount = 0;
          for (const attempt of completeAttempts) {
            const { error: insertError } = await supabase.from('chess_prediction_attempts').insert({
              ...attempt,
              benchmark_id: benchmarkId,
            });
            if (insertError && !insertError.message?.includes('duplicate')) {
              console.error(`[v6.65] Failed to save ${attempt.game_id}:`, insertError.message);
            } else {
              savedCount++;
            }
          }
          
          const skippedCount = newAttempts.length - completeAttempts.length;
          if (skippedCount > 0) {
            console.log(`[v6.65] 🔄 ${skippedCount} incomplete predictions skipped (game IDs remain available for re-capture)`);
          }
          
          // v6.64: Single cache invalidation AFTER batch save (more efficient)
          if (savedCount > 0) {
            invalidateChessStatsCache();
            console.log(`[v6.64] ✅ Saved ${savedCount}/${newAttempts.length} predictions, cache invalidated`);
          }
          
          lastSaveIndex = attempts.length;
        } catch (saveErr) {
          console.error(`[v6.64] ❌ Incremental save failed:`, saveErr);
        }
      }
      
      // v6.75-CALIBRATED: Simplified state machine with proactive health checks
      // PHASE 1: FETCH - Get games into queue
      // PHASE 2: PROCESS - Pop and analyze each game
      // PHASE 3 (NEW): HEALTH CHECK - Validate engine between batches
      
      let gamesProcessedSinceHealthCheck = 0;
      const HEALTH_CHECK_INTERVAL = 30; // v7.14: Check every 30 games (was 15)
      
      while (predictedCount < gameCount && !abortRef.current && batchNumber < maxBatches) {
        // v7.27-COORDINATOR-AWARE: Check coordinator abort signal at start of each iteration
        const coordinatorAborted = getBenchmarkAbortSignal()?.aborted;
        if (coordinatorAborted) {
          console.log('[v7.27] Coordinator signaled abort, stopping benchmark loop');
          abortRef.current = true;
          break;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 0: LIGHTWEIGHT HEALTH CHECK (v7.14)
        // ═══════════════════════════════════════════════════════════════════
        if (gamesProcessedSinceHealthCheck >= HEALTH_CHECK_INTERVAL) {
          console.log(`[v7.14] 🏥 Quick health check after ${gamesProcessedSinceHealthCheck} games...`);
          
          try {
            const healthFen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
            const healthResult = await Promise.race([
              engine.analyzePosition(healthFen, { depth: 6 }), // v7.14: depth 6 (was 8)
              new Promise<null>(r => setTimeout(() => r(null), 2000)) // v7.14: 2s (was 4s)
            ]);
            
            if (!healthResult) {
              console.warn('[v7.14] Health check timeout - quick reinit...');
              await engine.waitReady();
              consecutiveEngineFailures = 0;
            }
          } catch (healthErr) {
            // v7.14: Silent fail - don't block pipeline
          }
          
          gamesProcessedSinceHealthCheck = 0;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: ENSURE QUEUE HAS GAMES
        // ═══════════════════════════════════════════════════════════════════
        const queueAvailable = gameQueue.length - gameIndex;
        
        if (queueAvailable === 0) {
          console.log(`[v6.80] 📥 FETCH PHASE: Queue empty, need ${gameCount - predictedCount} more predictions`);
          console.log(`[v6.80] Stats: predicted=${predictedCount}, index=${gameIndex}, queueLen=${gameQueue.length}`);
          
          // v6.82-SPEED: Faster exponential backoff - reduced by 1s base
          if (emptyBatchStreak > 0) {
            const waitTime = Math.min(4000 * Math.pow(1.5, emptyBatchStreak), 29000);
            console.log(`[v6.82] ⏳ Patience backoff: ${Math.round(waitTime/1000)}s (streak: ${emptyBatchStreak})`);
            await new Promise(r => setTimeout(r, waitTime));
          }
          
          const fetchedCount = await fetchMoreGames();
          const newQueueAvailable = gameQueue.length - gameIndex;
          
          console.log(`[v6.80] 📥 Fetch result: +${fetchedCount} games, queue now has ${newQueueAvailable} available`);
          
          if (fetchedCount === 0 && newQueueAvailable === 0) {
            emptyBatchStreak++;
            if (emptyBatchStreak >= MAX_EMPTY_BATCHES) {
              console.warn(`[v6.80] ❌ Max empty batches (${MAX_EMPTY_BATCHES}) reached, stopping`);
              await saveIncrementalResults();
              break;
            }
            // Loop again to retry fetch
            continue;
          }
          
          emptyBatchStreak = 0;
          
          // Verify we now have games
          if (gameQueue.length - gameIndex === 0) {
            console.error(`[v6.80] ❌ LOGIC ERROR: fetch succeeded but queue still empty!`);
            continue;
          }
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: PROCESS ONE GAME
        // ═══════════════════════════════════════════════════════════════════
        
        // Pop game from queue (atomic operation)
        const currentIndex = gameIndex;
        const game = gameQueue[currentIndex];
        gameIndex++; // Advance BEFORE any continue/break
        
        // v6.80-PATIENT: No queue tracking needed - just process
        
        console.log(`[v6.80] 🎯 PROCESS: Game ${currentIndex + 1}/${gameQueue.length} (remaining: ${gameQueue.length - gameIndex})`);
        
        // v6.80: Extract game info
        const gameId = game.lichessId;
        const source = game.source || 'lichess';
        
        // ═══════════════════════════════════════════════════════════════════
        // v6.80-PATIENT: Only TWO skip conditions
        // 1. No ID (can't track)
        // 2. Already in DB (check raw form)
        // Rate limits and engine fails are WAITED not skipped
        
        // Skip 1: No ID = can't track
        if (!gameId) {
          console.log(`[v6.80] ⏭️ SKIP: No gameId`);
          skipStats.noId++;
          consecutiveSkips++;
          continue;
        }
        
        // v6.80: Get raw ID (without prefix) - this is what we store in DB
        const rawGameId = gameId.replace(/^(li_|cc_)/, '');
        
        // Skip 2: Already in DB (includes games predicted earlier THIS session)
        if (analyzedData.gameIds.has(rawGameId)) {
          console.log(`[v6.80] ⏭️ SKIP: Already in DB - ${rawGameId}`);
          skipStats.inDb++;
          consecutiveSkips++;
          continue;
        }
        
        // Skip 3: Previously failed this session (parse error, NOT engine timeout)
        if (failedGameIds.has(rawGameId)) {
          console.log(`[v6.80] ⏭️ SKIP: Previously failed - ${rawGameId}`);
          consecutiveSkips++;
          continue;
        }
        
        // v6.77: Force refetch if too many consecutive skips
        if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
          console.warn(`[v6.77] ⚠️ ${consecutiveSkips} consecutive skips - will trigger fresh fetch`);
          console.log(`[v6.77] SKIP STATS: ${JSON.stringify(skipStats)}`);
          gameIndex = gameQueue.length; // Force queue exhaustion
          consecutiveSkips = 0;
          continue;
        }
        
        // Determine result from winner field
        const gameResult = game.winner === 'white' ? 'white' : 
                          game.winner === 'black' ? 'black' : 'draw';
        
        console.log(`[v6.77] Game ${gameId}: winner=${game.winner} → ${gameResult}`);
        
        // Parse moves and generate FEN
        let moves: string[];
        let fen: string;
        let moveNumber: number;
        
        try {
          const parsed = parsePGNForMoves(game.pgn, predictionMoveRange, game.moves);
          moves = parsed.moves;
          fen = parsed.fen;
          moveNumber = parsed.moveNumber;
        } catch (e) {
        // v6.85-UNIFORM-IDS: Always use rawGameId for failed tracking (consistency)
          console.log(`[v6.85] ⏭️ SKIP: Parse error - ${rawGameId}`, e);
          skipStats.parseError++;
          failedGameIds.add(rawGameId);
          consecutiveSkips++;
          continue;
        }
        
        // ✅ VALID GAME - PREDICT IT (wrapped in try-catch for per-game error isolation)
        const whiteName = game.whiteName || 'Unknown';
        const blackName = game.blackName || 'Unknown';
        const whiteEloDisplay = game.whiteElo ? ` (${game.whiteElo})` : '';
        const blackEloDisplay = game.blackElo ? ` (${game.blackElo})` : '';
        const gameName = `${whiteName}${whiteEloDisplay} vs ${blackName}${blackEloDisplay}`;
        
        console.log(`[v6.77] 🔮 PREDICTING #${predictedCount + 1}/${gameCount}: ${gameId} → ${gameName} (${gameResult}) [batch ${batchNumber}]`);
        
        const remainingInQueue = gameQueue.length - gameIndex;
        setProgress({
          currentGame: predictedCount + 1,
          totalGames: gameCount,
          currentPhase: 'analyzing',
          currentDepth: 0,
          message: `Analyzing ${gameName} (${remainingInQueue} in queue)`,
          enPensentModulesActive: EN_PENSENT_ADAPTERS
        });
        
        // ═══════════════════════════════════════════════════════════════════
        // ANALYSIS: En Pensent + Stockfish (isolated error handling)
        // v6.75-CALIBRATED: Optimized timeouts + faster recovery cycle
        // ═══════════════════════════════════════════════════════════════════
        
        let colorFlow: ReturnType<typeof analyzeColorFlowFullScope>;
        let analysis: PositionAnalysis | null = null;
        
        try {
          colorFlow = analyzeColorFlowFullScope(moves.slice(0, moveNumber));
        } catch (cfError) {
          // v6.85-UNIFORM-IDS: Use rawGameId for consistency
          console.error(`[v6.85] ❌ ColorFlow error for ${rawGameId}:`, cfError);
          skipStats.analysisError++;
          failedGameIds.add(rawGameId);
          consecutiveSkips++;
          continue;
        }
        
        // v7.14-FAST: Reduced retries and timeouts for faster throughput
        const MAX_ENGINE_RETRIES = 2; // v7.14: 2 retries (was 3)
        let engineRetries = 0;
        let engineSucceeded = false;
        
        while (engineRetries < MAX_ENGINE_RETRIES && !engineSucceeded) {
          // v7.14: Aggressive timeouts - 15s for normal, 25s for deep
          const ANALYSIS_TIMEOUT = depth >= 40 ? 25000 : 15000;
          
          try {
            if (engineRetries > 0) {
              console.log(`[v7.14] 🔄 Retry ${engineRetries}/${MAX_ENGINE_RETRIES}`);
              await new Promise(r => setTimeout(r, 500 * engineRetries)); // v7.14: 500ms base (was 1s)
              try { engine.stop(); } catch (e) { /* ignore */ }
              await engine.waitReady();
            }
            
            const analysisPromise = engine.analyzePosition(fen, { depth, requireExactDepth: depth >= 40 });
            const timeoutPromise = new Promise<null>(r => setTimeout(() => r(null), ANALYSIS_TIMEOUT));
            analysis = await Promise.race([analysisPromise, timeoutPromise]);
            
            if (analysis) {
              engineSucceeded = true;
            } else {
              console.log(`[v7.14] ⏳ Timeout attempt ${engineRetries + 1} (${ANALYSIS_TIMEOUT/1000}s)`);
              engineRetries++;
              skipStats.engineTimeout++;
            }
          } catch (sfError) {
            console.error(`[v7.14] ❌ Engine error:`, sfError);
            engineRetries++;
            skipStats.analysisError++;
          }
        }
        
        if (!engineSucceeded) {
          console.warn(`[v7.14] ❌ Engine failed after ${MAX_ENGINE_RETRIES} retries`);
          consecutiveEngineFailures++;
          failedGameIds.add(rawGameId);
          consecutiveSkips++;
          
          // v7.14: Quick recovery after 2 consecutive failures
          if (consecutiveEngineFailures >= 2) {
            console.warn(`[v7.14] Quick recovery after ${consecutiveEngineFailures} failures`);
            try { engine.stop(); } catch (e) { /* ignore */ }
            await new Promise(r => setTimeout(r, 1500)); // v7.14: 1.5s (was 4s)
            
            const reready = await engine.waitReady();
            if (reready) {
              consecutiveEngineFailures = 0;
              gamesProcessedSinceHealthCheck = 0;
            } else {
              console.error(`[v7.14] ❌ Engine failed to recover`);
              await saveIncrementalResults();
              break;
            }
          }
          continue;
        }
        
        // Reset counters on success
        consecutiveEngineFailures = 0;
        gamesProcessedSinceHealthCheck++;
        
        const stockfish = getLocalStockfishPrediction(analysis);
        depths.push(stockfish.depth);
        console.log(`[v6.80] Stockfish: ${stockfish.evaluation}cp at depth ${stockfish.depth}`);
        
        // Compare predictions
        const hybridIsCorrect = colorFlow.prediction === gameResult;
        const stockfishIsCorrect = stockfish.prediction === gameResult;
        
        if (hybridIsCorrect) hybridCorrect++;
        if (stockfishIsCorrect) stockfishCorrect++;
        if (hybridIsCorrect && stockfishIsCorrect) bothCorrect++;
        if (!hybridIsCorrect && !stockfishIsCorrect) bothWrong++;
        
        // Build attempt data
        const positionHash = hashPosition(fen);
        
        // v7.18-SCHEMA-ALIGNED: Include data_source at attempt level for consistency
        const attemptData = {
          // v6.76-FIX: Store RAW game ID (without prefix) for DB consistency
          game_id: gameId.replace(/^(li_|cc_)/, ''),
          game_name: gameName,
          fen,
          move_number: moveNumber,
          position_hash: positionHash,
          hybrid_prediction: colorFlow.prediction,
          hybrid_confidence: colorFlow.confidence,
          hybrid_archetype: colorFlow.archetype,
          hybrid_correct: hybridIsCorrect,
          stockfish_prediction: stockfish.prediction,
          stockfish_confidence: stockfish.confidence,
          stockfish_depth: stockfish.depth,
          stockfish_eval: stockfish.evaluation,
          stockfish_correct: stockfishIsCorrect,
          actual_result: gameResult,
          data_quality_tier: 'tcec_unlimited',
          pgn: game.pgn.substring(0, 1000),
          // v7.18: Include data_source at attempt level (matches DB schema)
          data_source: source, // 'lichess' or 'chesscom'
          time_control: game.timeControl || game.gameMode || game.speed || null,
          white_elo: typeof game.whiteElo === 'number' ? game.whiteElo : null,
          black_elo: typeof game.blackElo === 'number' ? game.blackElo : null,
          lichess_id_verified: true,
        };
        
        attempts.push(attemptData);
        
        // Stream to UI
        if (onPrediction) {
          const livePrediction: LivePredictionData = {
            id: crypto.randomUUID(),
            gameName,
            moveNumber,
            fen,
            hybridPrediction: colorFlow.prediction,
            hybridArchetype: colorFlow.archetype,
            hybridConfidence: colorFlow.confidence,
            hybridCorrect: hybridIsCorrect,
            stockfishPrediction: stockfish.prediction,
            stockfishEval: stockfish.evaluation,
            stockfishDepth: stockfish.depth,
            stockfishCorrect: stockfishIsCorrect,
            actualResult: gameResult,
            gameMode: game.gameMode || game.timeControl,
            speed: game.speed,
            rated: game.rated,
            variant: game.variant,
            timeControl: game.timeControl,
            playedAt: game.playedAt,
            gameYear: game.gameYear,
            gameMonth: game.gameMonth,
            gameDayOfWeek: game.gameDayOfWeek,
            gameHour: game.gameHour,
            whiteName: game.whiteName,
            blackName: game.blackName,
            whiteElo: game.whiteElo,
            blackElo: game.blackElo,
            whiteTitle: game.whiteTitle,
            blackTitle: game.blackTitle,
            openingEco: game.openingEco,
            openingName: game.openingName,
            openingPly: game.openingPly,
            clockInitial: game.clockInitial,
            clockIncrement: game.clockIncrement,
            clockTotalTime: game.clockTotalTime,
            termination: game.termination,
            timestamp: Date.now(),
          };
          onPrediction(livePrediction);
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // SUCCESS: Record prediction
        // v6.78-SIMPLE: Add raw ID to analyzedData.gameIds (single source of truth)
        // ═══════════════════════════════════════════════════════════════════
        predictedCount++;
        
        // v6.78-SIMPLE: Add raw ID to the DB tracking set (already declared above)
        analyzedData.gameIds.add(rawGameId);
        consecutiveSkips = 0;
        
        console.log(`[v6.78] ✅ PREDICTION #${predictedCount}/${gameCount}: ${rawGameId} (${source})`);
        console.log(`[v6.78]   EP=${colorFlow.prediction}${hybridIsCorrect ? '✓' : '✗'} | SF=${stockfish.prediction}${stockfishIsCorrect ? '✓' : '✗'} | Actual=${gameResult}`);
        console.log(`[v6.78]   Queue: ${gameQueue.length - gameIndex} remaining | DB knows: ${analyzedData.gameIds.size}`)
        
        // Incremental save
        if (predictedCount % SAVE_INTERVAL === 0) {
          await saveIncrementalResults();
        }
      }
      
      // Final save
      await saveIncrementalResults();
      
      console.log(`[v6.78] ════════════════════════════════════════════════════`);
      console.log(`[v6.78] BENCHMARK COMPLETE: ${predictedCount}/${gameCount} predictions`);
      console.log(`[v6.78] Batches: ${batchNumber} | Processed: ${gameIndex}/${gameQueue.length}`);
      console.log(`[v6.78] DB knows: ${analyzedData.gameIds.size} | Failed: ${failedGameIds.size}`);
      console.log(`[v6.78] Skip stats: ${JSON.stringify(skipStats)}`);
      console.log(`[v6.78] ════════════════════════════════════════════════════`);
      
      if (attempts.length === 0) {
        throw new Error(`No valid games processed. Skip reasons: ${JSON.stringify(skipStats)}`);
      }
      
      if (attempts.length < gameCount * 0.8) {
        console.warn(`[v6.70] ⚠️ Only got ${attempts.length}/${gameCount} games - check rate limits or data availability`);
      }
      
      // Calculate stats
      const totalGames = attempts.length;
      const hybridAccuracy = (hybridCorrect / totalGames) * 100;
      const stockfishAccuracy = (stockfishCorrect / totalGames) * 100;
      const hybridWins = attempts.filter(a => a.hybrid_correct && !a.stockfish_correct).length;
      const stockfishWins = attempts.filter(a => !a.hybrid_correct && a.stockfish_correct).length;
      const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
      const maxDepthReached = Math.max(...depths);
      const minDepthReached = Math.min(...depths);
      const depthCoverage = (avgDepth / MAX_DEPTH_CAPACITY) * 100;
      
      // Calculate depth accuracy: % of positions that reached >= 95% of requested depth
      const requestedDepth = depth;
      const depthThreshold = requestedDepth * 0.95;
      const positionsAtFullDepth = depths.filter(d => d >= depthThreshold).length;
      const depthAccuracy = (positionsAtFullDepth / depths.length) * 100;
      
      // v6.43: Final benchmark update (predictions already saved incrementally)
      setProgress(prev => ({
        ...prev!,
        currentPhase: 'saving',
        message: 'Finalizing benchmark results...'
      }));
      
      // Update the benchmark record with final stats
      const { data: existingBenchmark } = await supabase
        .from('chess_benchmark_results')
        .select('id')
        .eq('run_id', runId)
        .maybeSingle();
      
      // v7.29: Calculate duration for final save
      const benchmarkDurationMs = Date.now() - benchmarkStartTime;
      
      if (existingBenchmark) {
        await supabase
          .from('chess_benchmark_results')
          .update({
            total_games: totalGames,
            completed_games: totalGames,
            hybrid_accuracy: hybridAccuracy,
            stockfish_accuracy: stockfishAccuracy,
            hybrid_wins: hybridWins,
            stockfish_wins: stockfishWins,
            both_correct: bothCorrect,
            both_wrong: bothWrong,
            games_analyzed: attempts.map(a => a.game_id),
            duration_ms: benchmarkDurationMs, // v7.29: NOW SAVED!
          })
          .eq('id', existingBenchmark.id);
        console.log(`[v7.29] ✅ Final benchmark update complete (duration: ${Math.round(benchmarkDurationMs/1000)}s)`);
      } else {
        // Create benchmark if incremental saves didn't create it yet
        await supabase
          .from('chess_benchmark_results')
          .insert({
            run_id: runId,
            total_games: totalGames,
            completed_games: totalGames,
            prediction_move_number: Math.round((predictionMoveRange[0] + predictionMoveRange[1]) / 2),
            hybrid_accuracy: hybridAccuracy,
            stockfish_accuracy: stockfishAccuracy,
            hybrid_wins: hybridWins,
            stockfish_wins: stockfishWins,
            both_correct: bothCorrect,
            both_wrong: bothWrong,
            data_source: 'lichess_grandmasters',
            games_analyzed: attempts.map(a => a.game_id),
            stockfish_version: 'Stockfish 17 WASM (Local Maximum Depth)',
            stockfish_mode: 'local_wasm_unlimited',
            hybrid_version: 'en-pensent-v1',
            data_quality_tier: 'tcec_unlimited',
            duration_ms: benchmarkDurationMs, // v7.29: NOW SAVED!
          });
        console.log(`[v7.29] ✅ Created final benchmark record (duration: ${Math.round(benchmarkDurationMs/1000)}s)`);
      }
      
      // Collect unique archetypes detected
      const archetypesDetected = [...new Set(attempts.map(a => a.hybrid_archetype))];
      
      // v7.28: Mark as completing so lock release doesn't trigger abort
      completingRef.current = true;
      
      const finalResult: BenchmarkResult = {
        runId,
        totalGames,
        hybridAccuracy,
        stockfishAccuracy,
        hybridWins,
        stockfishWins,
        averageDepth: avgDepth,
        maxDepth: maxDepthReached,
        minDepth: minDepthReached,
        depthCoverage,
        depthAccuracy, // NEW: percentage of positions at full requested depth
        enPensentCapacity: 100, // Full scope = 100%
        archetypesDetected,
        playerFingerprints: attempts.length, // Each game contributes to fingerprint data
        timeControlProfiles: 6, // All time control categories analyzed
        adaptersActive: [...DOMAIN_ADAPTERS] // All 25 adapters active
      };
      
      console.log(`[Benchmark Complete] Depth accuracy: ${depthAccuracy.toFixed(1)}% of positions reached ≥95% of requested depth ${requestedDepth}`);
      
      setResult(finalResult);
      setProgress({
        currentGame: totalGames,
        totalGames,
        currentPhase: 'complete',
        currentDepth: avgDepth,
        message: `Complete! En Pensent ${hybridAccuracy.toFixed(1)}% vs Stockfish ${stockfishAccuracy.toFixed(1)}% at ${depthCoverage.toFixed(0)}% depth (${EN_PENSENT_ADAPTERS} adapters)`,
        enPensentModulesActive: EN_PENSENT_ADAPTERS
      });
      
      return finalResult;
      
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error(`[v6.43] Benchmark error: ${message}`);
      
      // v6.43-BULLETPROOF: Emergency save - predictions should already be in DB from incremental saves
      // Just log what we had in case anything was lost
      if (attempts.length > 0) {
        console.log(`[v6.43] ⚠️ Error occurred after ${attempts.length} predictions (most should already be saved incrementally)`);
        
        // Try one more emergency save in case incremental saves didn't complete
        try {
          const { data: existingBenchmark } = await supabase
            .from('chess_benchmark_results')
            .select('id')
            .eq('run_id', runId)
            .maybeSingle();
          
          if (existingBenchmark) {
            // Update existing benchmark with final count + duration
            const errorDurationMs = Date.now() - benchmarkStartTime; // v7.29
            await supabase
              .from('chess_benchmark_results')
              .update({
                completed_games: attempts.length,
                hybrid_accuracy: attempts.length > 0 ? (hybridCorrect / attempts.length) * 100 : 0,
                stockfish_accuracy: attempts.length > 0 ? (stockfishCorrect / attempts.length) * 100 : 0,
                duration_ms: errorDurationMs, // v7.29: Save duration even on error
              })
              .eq('id', existingBenchmark.id);
            console.log(`[v7.29] ✅ Updated benchmark with ${attempts.length} predictions (error path, ${Math.round(errorDurationMs/1000)}s)`);
          } else {
            // Create benchmark record if it doesn't exist
            const errorDurationMs = Date.now() - benchmarkStartTime; // v7.29
            const { data: newBenchmark } = await supabase
              .from('chess_benchmark_results')
              .insert({
                run_id: runId,
                total_games: gameCount,
                completed_games: attempts.length,
                prediction_move_number: Math.round((predictionMoveRange[0] + predictionMoveRange[1]) / 2),
                hybrid_accuracy: attempts.length > 0 ? (hybridCorrect / attempts.length) * 100 : 0,
                stockfish_accuracy: attempts.length > 0 ? (stockfishCorrect / attempts.length) * 100 : 0,
                hybrid_wins: attempts.filter(a => a.hybrid_correct && !a.stockfish_correct).length,
                stockfish_wins: attempts.filter(a => !a.hybrid_correct && a.stockfish_correct).length,
                both_correct: bothCorrect,
                both_wrong: bothWrong,
                data_source: 'lichess_grandmasters_error',
                games_analyzed: attempts.map(a => a.game_id),
                stockfish_version: 'Stockfish 17 WASM (Local Maximum Depth)',
                stockfish_mode: 'local_wasm_unlimited',
                hybrid_version: 'en-pensent-v1',
                data_quality_tier: 'tcec_unlimited',
                duration_ms: errorDurationMs, // v7.29: Save duration even on error
              })
              .select()
              .single();
            
            if (newBenchmark) {
              // Save any unsaved attempts (ignore errors for duplicates)
              for (const attempt of attempts) {
                const { error: insertErr } = await supabase.from('chess_prediction_attempts').insert({
                  ...attempt,
                  benchmark_id: newBenchmark.id,
                });
                // Silently ignore duplicate errors
                if (insertErr && !insertErr.message?.includes('duplicate')) {
                  console.error(`[v6.63] Insert error:`, insertErr.message);
                } else {
                  // v6.63: Invalidate cache for realtime sync
                  invalidateChessStatsCache();
                }
              }
              console.log(`[v6.63] ✅ Emergency saved ${attempts.length} predictions`);
            }
          }
        } catch (saveError) {
          console.error(`[v6.43] ❌ Emergency save failed:`, saveError);
        }
      }
      
      setError(message);
      throw e;
    } finally {
      setIsRunning(false);
    }
  }, []);
  
  const abort = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    setProgress(null);
  }, []);
  
  return {
    runBenchmark,
    abort,
    isRunning,
    progress,
    result,
    error,
  };
}

// v6.46: OLD fetchLichessGames function REMOVED - now using fetchMultiSourceGames
// This eliminates 200+ lines of duplicate code and enables dual-source fetching

// v6.14: Parse moves for FEN - PREFER raw moves string from Edge Function
function parsePGNForMoves(pgn: string, moveRange: [number, number], rawMoves?: string): { 
  moves: string[]; 
  fen: string;
  moveNumber: number;
} {
  // v6.14: PREFER raw moves from Edge Function (cleaner, no PGN parsing needed)
  let moves: string[];
  
  if (rawMoves && rawMoves.trim()) {
    // Raw moves come as space-separated SAN moves: "e4 e5 Nf3 Nc6 Bb5 ..."
    moves = rawMoves.trim().split(/\s+/).filter(m => m && m.length > 0);
  } else {
    // Fallback: Extract moves from PGN
    const moveSection = pgn.replace(/\[.*?\]/g, "").replace(/\{.*?\}/g, "").trim();
    moves = moveSection
      .split(/\s+/)
      .filter(m => m && !m.match(/^\d+\./) && !m.match(/^[01]-[01]$/) && !m.match(/^1\/2-1\/2$/) && m !== "*");
  }
  
  if (moves.length < 4) {
    throw new Error(`Too few moves: ${moves.length}`);
  }
  
  // Adaptive prediction point - works with ANY game length
  const availableRange = Math.floor(moves.length * 0.6);
  const maxMove = Math.min(moveRange[1], availableRange, moves.length - 2);
  const minMove = Math.min(moveRange[0], Math.max(5, Math.floor(moves.length * 0.2)));
  const moveNumber = Math.max(minMove, minMove + Math.floor(Math.random() * Math.max(1, maxMove - minMove + 1)));
  
  // Generate actual FEN at the prediction point
  const chess = new Chess();
  let successfulMoves = 0;
  for (let i = 0; i < moveNumber && i < moves.length; i++) {
    try {
      chess.move(moves[i]);
      successfulMoves++;
    } catch {
      // v6.14: Log but continue - partial FEN is still useful
      console.warn(`[v6.14] Invalid move at index ${i}: ${moves[i]}`);
      break;
    }
  }
  
  // v6.14: Ensure we have meaningful position
  if (successfulMoves < 4) {
    throw new Error(`Too few valid moves parsed: ${successfulMoves}`);
  }
  
  return { moves: moves.slice(0, successfulMoves + Math.min(10, moves.length - successfulMoves)), fen: chess.fen(), moveNumber: successfulMoves };
}
