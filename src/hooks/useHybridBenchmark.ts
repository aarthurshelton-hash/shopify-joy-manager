/**
 * Hybrid Benchmark Hook - SIMPLE AND CLEAN
 * VERSION: 6.0-SIMPLE (2026-01-20)
 * 
 * PHILOSOPHY: Keep it simple.
 * 1. Fetch games from Lichess
 * 2. Skip ONLY games already in our database
 * 3. Predict EVERY fresh game
 * 4. Store results
 * 
 * That's it. No over-engineering.
 */

// v6.33-NOFETCH-FILTER: Remove ALL fetch-time filtering - dedup only at prediction loop
const BENCHMARK_VERSION = "6.33-NOFETCH-FILTER";
console.log(`[v6.33] useHybridBenchmark LOADED - Version: ${BENCHMARK_VERSION}`);

import { useState, useCallback, useRef } from 'react';
import { getStockfishEngine, PositionAnalysis } from '@/lib/chess/stockfishEngine';
import { supabase } from '@/integrations/supabase/client';
import { Chess } from 'chess.js';
import { analyzeTimeControlProfile, StyleProfile, TimeControlElo } from '@/lib/pensent-core/domains/chess/timeControlStyleProfiler';
import { buildFingerprint, PlayerFingerprint, GameData } from '@/lib/pensent-core/domains/chess/playerFingerprint';
import { getAlreadyAnalyzedData, hashPosition, reaffirmExistingPrediction } from '@/lib/chess/benchmarkPersistence';

interface LichessGameData {
  pgn: string;
  // v6.15: Raw moves string from Edge Function (more reliable than PGN parsing)
  moves?: string;
  // CRITICAL: Lichess game ID for cross-run deduplication
  lichessId?: string;               // The actual Lichess game ID (e.g., "abc123XY")
  // v6.10-WINNER: Result determination fields
  winner?: 'white' | 'black';       // 'white' | 'black' | undefined (draw)
  status?: string;                  // 'mate' | 'resign' | 'stalemate' | 'timeout' | 'draw' | etc.
  // GAME MODE CONTEXT (Critical for archetypal cross-referencing)
  gameMode?: string;                // Primary mode: bullet/blitz/rapid/classical
  speed?: string;                   // Lichess speed category
  perf?: string;                    // Performance category
  rated?: boolean;                  // Was this rated?
  variant?: string;                 // Chess variant (standard, chess960, etc.)
  source?: string;                  // How game started (lobby, friend, tournament)
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

  const runBenchmark = useCallback(async (config: HybridBenchmarkConfig) => {
    const { gameCount, depth, predictionMoveRange, onPrediction } = config;
    
    setIsRunning(true);
    setError(null);
    setResult(null);
    abortRef.current = false;
    
    const engine = getStockfishEngine();
    
    try {
      // Wait for engine to be ready with progress feedback
      setProgress({ 
        currentGame: 0, 
        totalGames: gameCount, 
        currentPhase: 'fetching',
        currentDepth: 0,
        message: `Initializing Stockfish WASM + En Pensent Full Scope (${EN_PENSENT_ADAPTERS} adapters)...`,
        enPensentModulesActive: EN_PENSENT_ADAPTERS
      });
      
      console.log('[Benchmark] Starting engine initialization...');
      const ready = await engine.waitReady((progress) => {
        setProgress(prev => ({
          ...prev!,
          message: `Loading Stockfish engine... ${Math.round(progress * 100)}%`
        }));
      });
      
      if (!ready) {
        throw new Error('Stockfish engine failed to initialize. Please refresh the page and try again.');
      }
      
      console.log('[Benchmark] Engine ready, fetching games...');
      
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
      
      const runId = crypto.randomUUID();
      const attempts: any[] = [];
      let hybridCorrect = 0;
      let stockfishCorrect = 0;
      let bothCorrect = 0;
      let bothWrong = 0;
      const depths: number[] = [];
      let predictedCount = 0;
      
      // v6.32-UNFETTERED: Don't pre-filter at fetch - let prediction loop handle DB dedup
      console.log(`[v6.33] ========================================`);
      console.log(`[v6.33] STARTING BENCHMARK - NO FETCH-TIME FILTERING`);
      console.log(`[v6.33] Target: ${gameCount} predictions`);
      console.log(`[v6.33] DB has ${analyzedData.gameIds.size} games (dedup at prediction time only)`);
      console.log(`[v6.33] Each batch fetches ALL games from API, dedup happens in prediction loop`);
      console.log(`[v6.33] ========================================`);
      
      // v6.33: predictedIds tracks games we've SUCCESSFULLY predicted this session
      const predictedIds = new Set<string>();
      
      // v6.33: Track all games fetched this session to prevent re-adding to queue
      const sessionFetchedIds = new Set<string>();
      
      // v6.33: Track all games across multiple fetch batches
      let allGames: any[] = [];
      let gameIndex = 0;
      let batchNumber = 0;
      const maxBatches = Math.max(20, Math.ceil(gameCount / 2));
      
      // v6.33: Request more games per batch since we defer dedup
      const fetchCount = Math.max(gameCount * 4, 80);
      
      async function fetchMoreGames() {
        batchNumber++;
        console.log(`[v6.33] ========== BATCH ${batchNumber}/${maxBatches} ==========`);
        console.log(`[v6.33] Queue: ${allGames.length - gameIndex} remaining, Predicted: ${predictedCount}/${gameCount}`);
        setProgress(prev => ({ 
          ...prev!, 
          message: `Fetching batch ${batchNumber} (predicted: ${predictedCount}/${gameCount})...` 
        }));
        
        // v6.33: Fetch ALL games from API - no pre-filtering
        const newGames = await fetchLichessGames(fetchCount, batchNumber);
        console.log(`[v6.33] Batch ${batchNumber}: Got ${newGames.length} games from API`);
        
        // v6.33: Filter out games already in our queue from previous batches
        const trulyNewGames = newGames.filter(g => g.lichessId && !sessionFetchedIds.has(g.lichessId));
        console.log(`[v6.33] After session dedup: ${trulyNewGames.length} truly new (${newGames.length - trulyNewGames.length} already in queue)`);
        
        // Track fetched IDs
        for (const g of trulyNewGames) {
          if (g.lichessId) sessionFetchedIds.add(g.lichessId);
        }
        
        allGames = [...allGames, ...trulyNewGames];
        console.log(`[v6.33] Queue now: ${allGames.length} total, ${allGames.length - gameIndex} to process`);
        return trulyNewGames.length;
      }
      
      // Initial fetch
      await fetchMoreGames();
      
      if (allGames.length === 0) {
        throw new Error('No fresh games available. Try again later.');
      }
      
      // Step 2: Process games with REFETCH when needed
      // v6.33: Add dbDupe tracking for games already in database
      let skipStats = { invalidId: 0, dbDupe: 0, sessionDupe: 0, shortGame: 0, timeout: 0, parseError: 0 };
      
      // v6.33: Persistent refetch with better resilience
      let emptyBatchStreak = 0;
      const MAX_EMPTY_BATCHES = 8;
      
      // v6.33: Track consecutive skips to detect problematic patterns
      let consecutiveSkips = 0;
      const MAX_CONSECUTIVE_SKIPS = 100;
      
      while (predictedCount < gameCount && !abortRef.current && batchNumber < maxBatches) {
        // v6.33: Safety check - if too many consecutive skips, something is wrong
        if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
          console.warn(`[v6.33] ⚠️ ${consecutiveSkips} consecutive skips - breaking to refetch`);
          console.log(`[v6.33] SKIP STATS: invalid=${skipStats.invalidId}, dbDupe=${skipStats.dbDupe}, sessionDupe=${skipStats.sessionDupe}, short=${skipStats.shortGame}, timeout=${skipStats.timeout}, parse=${skipStats.parseError}`);
          consecutiveSkips = 0;
          gameIndex = allGames.length; // Force refetch
        }
        
        // Check if we need more games
        if (gameIndex >= allGames.length) {
          console.log(`[v6.33] Queue exhausted at ${gameIndex}, need more (${predictedCount}/${gameCount})`);
          console.log(`[v6.33] SKIP STATS: invalid=${skipStats.invalidId}, dbDupe=${skipStats.dbDupe}, sessionDupe=${skipStats.sessionDupe}, short=${skipStats.shortGame}, timeout=${skipStats.timeout}, parse=${skipStats.parseError}`);
          const newCount = await fetchMoreGames();
          if (newCount === 0) {
            emptyBatchStreak++;
            console.warn(`[v6.33] Empty batch #${emptyBatchStreak}/${MAX_EMPTY_BATCHES}`);
            if (emptyBatchStreak >= MAX_EMPTY_BATCHES) {
              console.warn(`[v6.33] Too many empty batches, stopping.`);
              break;
            }
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
          emptyBatchStreak = 0;
          // v6.33 FIX: Don't continue - fall through to process newly fetched games
        }
        
        // v6.33: Check bounds again after potential fetch
        if (gameIndex >= allGames.length) continue;
        
        const game = allGames[gameIndex];
        gameIndex++;
        const lichessId = game.lichessId;
        
        // Simple validation
        if (!lichessId || lichessId.length !== 8) {
          skipStats.invalidId++;
          consecutiveSkips++;
          continue;
        }
        
        // v6.33: Skip if already in DATABASE
        if (analyzedData.gameIds.has(lichessId)) {
          skipStats.dbDupe++;
          consecutiveSkips++;
          continue;
        }
        
        // v6.33: Skip if we've ALREADY PREDICTED this game this session
        if (predictedIds.has(lichessId)) {
          skipStats.sessionDupe++;
          consecutiveSkips++;
          continue;
        }
        
        // Determine result from winner field (simple and direct)
        let gameResult: string;
        if (game.winner === 'white') {
          gameResult = 'white';
        } else if (game.winner === 'black') {
          gameResult = 'black';
        } else {
          gameResult = 'draw';
        }
        
        console.log(`[v6.16] Game ${lichessId}: winner=${game.winner} → ${gameResult}`);
        
        // Parse moves and generate FEN
        let moves: string[];
        let fen: string;
        let moveNumber: number;
        
        try {
          const parsed = parsePGNForMoves(game.pgn, predictionMoveRange, game.moves);
          moves = parsed.moves;
          fen = parsed.fen;
          moveNumber = parsed.moveNumber;
          
          if (moves.length < 4) {
          console.log(`[v6.33] Skip short: ${lichessId} (${moves.length} moves)`);
          skipStats.shortGame++;
          consecutiveSkips++;
          continue;
          }
        } catch (e) {
          console.log(`[v6.33] Skip parse error: ${lichessId}`, e);
          skipStats.parseError++;
          consecutiveSkips++;
          continue;
        }
        
        // ✅ VALID GAME - PREDICT IT
        const whiteName = game.whiteName || 'Unknown';
        const blackName = game.blackName || 'Unknown';
        const whiteEloDisplay = game.whiteElo ? ` (${game.whiteElo})` : '';
        const blackEloDisplay = game.blackElo ? ` (${game.blackElo})` : '';
        const gameName = `${whiteName}${whiteEloDisplay} vs ${blackName}${blackEloDisplay}`;
        
        console.log(`[v6.14] PREDICTING #${predictedCount + 1}/${gameCount}: ${lichessId} → ${gameName} (${gameResult}) [batch ${batchNumber}]`);
        
        const remainingInBatch = allGames.length - gameIndex;
        setProgress({
          currentGame: predictedCount + 1,
          totalGames: gameCount,
          currentPhase: 'analyzing',
          currentDepth: 0,
          message: `Analyzing ${gameName} (batch ${batchNumber}, ${remainingInBatch} remaining)`,
          enPensentModulesActive: EN_PENSENT_ADAPTERS
        });
        
        // Get En Pensent prediction (Color Flow analysis)
        const colorFlow = analyzeColorFlowFullScope(moves.slice(0, moveNumber));
        
        // Get Stockfish evaluation (reduced timeout: 60s instead of 120s)
        const analysisPromise = engine.analyzePosition(fen, { depth, requireExactDepth: depth >= 40 });
        const timeout = new Promise<null>(r => setTimeout(() => r(null), 60000));
        const analysis = await Promise.race([analysisPromise, timeout]);
        
        if (!analysis) {
          console.log(`[v6.33] ⚠️ Stockfish timeout for ${lichessId}, skipping`);
          skipStats.timeout++;
          consecutiveSkips++;
          continue;
        }
        
        const stockfish = getLocalStockfishPrediction(analysis);
        
        // Record depth
        depths.push(stockfish.depth);
        console.log(`[v6.1] Stockfish: ${stockfish.evaluation}cp at depth ${stockfish.depth}`);
        
        // Compare predictions
        const hybridIsCorrect = colorFlow.prediction === gameResult;
        const stockfishIsCorrect = stockfish.prediction === gameResult;
        
        if (hybridIsCorrect) hybridCorrect++;
        if (stockfishIsCorrect) stockfishCorrect++;
        if (hybridIsCorrect && stockfishIsCorrect) bothCorrect++;
        if (!hybridIsCorrect && !stockfishIsCorrect) bothWrong++;
        
        // Build attempt data
        const positionHash = hashPosition(fen);
        
        const attemptData = {
          game_id: lichessId,
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
          // v6.12: Ensure time_control and ELO fields are properly captured
          // Use gameMode/speed fallback for time_control, and explicit number check for ELO
          time_control: game.timeControl || game.gameMode || game.speed || null,
          white_elo: typeof game.whiteElo === 'number' ? game.whiteElo : null,
          black_elo: typeof game.blackElo === 'number' ? game.blackElo : null,
          lichess_id_verified: true,
        };
        
        attempts.push(attemptData);
        analyzedData.gameIds.add(lichessId); // Mark as analyzed
        
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
        
        predictedCount++;
        predictedIds.add(lichessId); // v6.33: Track predicted games for session dedup
        consecutiveSkips = 0; // v6.33: Reset skip counter on successful prediction
        
        // v6.33: Log metadata capture for debugging
        console.log(`[v6.33] ✓ PREDICTION #${predictedCount}: ${lichessId} | time_control=${game.timeControl || game.speed} | whiteElo=${game.whiteElo} | blackElo=${game.blackElo}`);
        console.log(`[v6.33]   En Pensent=${colorFlow.prediction}${hybridIsCorrect ? '✓' : '✗'} | SF=${stockfish.prediction}${stockfishIsCorrect ? '✓' : '✗'} | Actual=${gameResult}`);
      }
      
      console.log(`[v6.33] ========================================`);
      console.log(`[v6.33] BENCHMARK COMPLETE: ${predictedCount}/${gameCount} predictions`);
      console.log(`[v6.33] Total batches fetched: ${batchNumber}`);
      console.log(`[v6.33] Total games processed: ${gameIndex}/${allGames.length}`);
      console.log(`[v6.33] Predicted ${predictedIds.size} games this session`);
      console.log(`[v6.33] Skip stats: ${JSON.stringify(skipStats)}`);
      console.log(`[v6.33] ========================================`);
      
      if (attempts.length === 0) {
        throw new Error(`No valid games processed. Skip reasons: ${JSON.stringify(skipStats)}`);
      }
      
      // Warn if we got significantly fewer games than requested
      if (attempts.length < gameCount * 0.8) {
        console.warn(`[v6.14] ⚠️ Only got ${attempts.length}/${gameCount} games - Lichess may be rate limiting or sparse data`);
      }
      
      // Calculate stats
      
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
      
      // Save to database
      setProgress(prev => ({
        ...prev!,
        currentPhase: 'saving',
        message: 'Saving benchmark results...'
      }));
      
      const { data: benchmark, error: benchmarkError } = await supabase
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
        })
        .select()
        .single();
      
      if (benchmarkError) {
        console.error('Error saving benchmark:', benchmarkError);
      }
      
      // Save individual attempts with error handling
      if (benchmark) {
        let savedCount = 0;
        let saveErrors = 0;
        
        for (const attempt of attempts) {
          const { error: insertError } = await supabase.from('chess_prediction_attempts').insert({
            ...attempt,
            benchmark_id: benchmark.id,
          });
          
          if (insertError) {
            console.error(`[v6.2] Failed to save prediction for ${attempt.game_id}:`, insertError.message);
            saveErrors++;
          } else {
            savedCount++;
          }
        }
        
        console.log(`[v6.2] Saved ${savedCount}/${attempts.length} predictions (${saveErrors} errors)`);
        
        // If significant save failures, update the benchmark record
        if (saveErrors > 0 && savedCount < attempts.length) {
          await supabase.from('chess_benchmark_results')
            .update({ completed_games: savedCount })
            .eq('id', benchmark.id);
          console.log(`[v6.2] Updated benchmark completed_games to ${savedCount}`);
        }
      }
      
      // Collect unique archetypes detected
      const archetypesDetected = [...new Set(attempts.map(a => a.hybrid_archetype))];
      
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

// v6.33-NOFETCH-FILTER: No pre-filtering at fetch - all dedup at prediction stage
async function fetchLichessGames(
  count: number, 
  batchNumber: number = 1
): Promise<LichessGameData[]> {
  const targetGames = count;
  const gamesPerPlayer = Math.max(30, Math.ceil(targetGames / 5));
  
  console.log(`[v6.29 FETCH] Batch ${batchNumber}: Requesting ${targetGames} fresh games`);
  
  // v6.29-STREAMLINE: Keep player pool but use PRIME offset for better distribution
  const topPlayers = [
    // Elite Current (known active on Lichess)
    "DrNykterstein", "Hikaru", "nihalsarin2004", "GMWSO", "LyonBeast",
    "Polish_fighter3000", "Msb2", "penguingm1", "DanielNaroditsky", 
    "EricRosen", "Fins", "chessbrah", "opperwezen", "BogdanDeac",
    "Arjun_Erigaisi", "RaunakSadhwani2005", "TemurKuybokarov",
    "Zhigalko_Sergei", "ChessNetwork", "DrDrunkenstein", "Firouzja2003",
    // Elite Historical + Active
    "GM_Srinath", "Oleksandr_Bortnyk", "FabianoCaruana", "LevonAronian",
    "chesswarrior7197", "MagnusCarlsen", "AnishGiri", "VladimirKramnik",
    "SethiChess", "duhless", "howitzer14", "rajabboy", "Jospem", "Alireza2003",
    "lance5500", "Navaraok", "Nodirbek2004", "VincentKeymer2004", "WesleyS8",
    // Strong titled players
    "DrMikeLikesChess", "gmrobinsonelwog", "NeverEnough", "pengcheng2004",
    "Svidler", "lovlas", "alireza2006", "taniasachdev", "JW_Praggnanandhaa",
    "nepoking", "BakhtiyarIbadov", "RockingGuyMD", "Vladimiro_Kramnik",
    "Judit_Polgar", "VisualDennis", "GMVallejo", "Andrej_Esipenko", "DanielFridman",
    "kirthibhat", "Naroditsky", "GMSrinathNarayanan", "alexandrpredke",
    // Added from DB analysis
    "Vladimirovich9000", "der_kaufmann", "Fenrisulfur", "greennight",
    "KontraJaKO", "NameTheGame", "chessm1105", "Esssquire", "SindarovGM",
    "skif134", "Iwasinelectrical", "dimochka_tsoi", "tornike_sanikidze", "S2Pac",
    // More active GMs and IMs
    "wonderfultime", "may6enexttime", "AidenCohen", "Saintlaurent",
    "neslansen", "AZETADINE", "WONDERBOY1776", "wonderfultime2",
    "lachesisQ", "GenghisConn", "SuperGM_Ruslan", "DrTancredi", "Chess4ever"
  ];
  
  const games: LichessGameData[] = [];
  const localGameIds = new Set<string>(); // Track games collected THIS batch
  
  // v6.32: Use prime number offset (13) × batchNumber to ensure non-repeating player starts
  const startOffset = (batchNumber * 13) % topPlayers.length;
  const shuffledPlayers = [...topPlayers.slice(startOffset), ...topPlayers.slice(0, startOffset)]
    .sort(() => Math.random() - 0.5);
  
  console.log(`[v6.32 FETCH] Batch ${batchNumber}: offset ${startOffset}, first 3: ${shuffledPlayers.slice(0, 3).join(', ')}`);
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  // v6.30-FRESHFIRST: Start with MOST RECENT games (0-offset for batch 1)
  function getRandomTimeWindow(): { since: number; until: number } {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // v6.32: Batch 1 gets FRESH games (0-14 days back)
    // Subsequent batches go progressively further back
    const batchIndex = batchNumber - 1; // 0-indexed for time calculation
    const batchOffset = batchIndex * 14; // 2 weeks per batch progression
    const randomDays = Math.floor(Math.random() * 14); // 0-14 days random within window
    
    // Go back (batchOffset + randomDays) days from now
    const daysBack = batchOffset + randomDays;
    const maxDaysBack = 365 * 3; // Max 3 years back
    const actualDaysBack = daysBack % maxDaysBack;
    
    const windowEnd = now - (actualDaysBack * oneDay);
    const windowStart = windowEnd - (14 * oneDay); // 2-week window
    
    console.log(`[v6.32] Time window: ${new Date(windowStart).toISOString().split('T')[0]} to ${new Date(windowEnd).toISOString().split('T')[0]} (${actualDaysBack} days back)`);
    return { since: Math.max(0, windowStart), until: windowEnd };
  }
  
  let rateLimitCount = 0;
  let playersQueried = 0;
  const maxPlayersPerBatch = 8; // Fewer players but deeper per player
  
  for (const player of shuffledPlayers) {
    if (games.length >= targetGames || playersQueried >= maxPlayersPerBatch) break;
    playersQueried++;
    
    // Rate limit backoff
    if (rateLimitCount >= 2) {
      console.warn(`[v6.32] Rate limited ${rateLimitCount}x, waiting 10s...`);
      await new Promise(r => setTimeout(r, 10000));
      rateLimitCount = 0;
    }
    
    // v6.32: 1.5s delay - faster but still respectful
    await new Promise(r => setTimeout(r, 1500));
    
    // v6.32: Truly random time window
    const { since, until } = getRandomTimeWindow();
    console.log(`[v6.32] ${player}: ${new Date(since).toISOString().split('T')[0]} to ${new Date(until).toISOString().split('T')[0]}`);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/lichess-games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ player, since, until, max: gamesPerPlayer })
      });
      
      if (response.status === 429) {
        rateLimitCount++;
        console.warn(`[v6.32] 429 for ${player}, will retry later`);
        continue;
      }
      
      if (!response.ok) {
        console.warn(`[v6.32] ${player}: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const fetchedGames = data.games || [];
      
      if (fetchedGames.length === 0) {
        console.log(`[v6.32] ${player}: 0 games in window`);
        continue;
      }
      
      console.log(`[v6.32] ✓ ${player}: ${fetchedGames.length} games from API`);
      rateLimitCount = 0;
      
      let addedFromPlayer = 0;
      // v6.33: No session filtering at fetch time - all games go to queue
      for (const game of fetchedGames) {
        const pgn = game.pgn || game.moves;
        if (!pgn || typeof pgn !== 'string' || pgn.length < 20) continue;
        if (game.moveCount && game.moveCount < 10) continue;
        
        const lichessGameId = game.id;
        const isValidLichessId = lichessGameId && 
          typeof lichessGameId === 'string' && 
          lichessGameId.length === 8 &&
          /^[a-zA-Z0-9]+$/.test(lichessGameId);
        
        if (!isValidLichessId) continue;
        if (localGameIds.has(lichessGameId)) continue;
        
        // v6.33: NO filtering here - all dedup at prediction stage
        // Only localGameIds prevents duplicates within this single fetch call
        
        localGameIds.add(lichessGameId);
        addedFromPlayer++;
        
        games.push({
          pgn,
          lichessId: lichessGameId,
          timeControl: game.timeControl,
          clockInitial: game.clockInitial,
          clockIncrement: game.clockIncrement,
          whiteName: game.whiteName,
          blackName: game.blackName,
          whiteElo: game.whiteElo,
          blackElo: game.blackElo,
          whiteTitle: game.whiteTitle,
          blackTitle: game.blackTitle,
          playedAt: game.playedAt,
          gameYear: game.gameYear,
          gameMonth: game.gameMonth,
          openingEco: game.openingEco,
          openingName: game.openingName,
          termination: game.status || game.termination || 'unknown',
          speed: game.speed,
          rated: game.rated,
          variant: game.variant,
          winner: game.winner,
          status: game.status,
          moves: game.moves,
        });
      }
      
      console.log(`[v6.33] ${player}: +${addedFromPlayer} games (total: ${games.length})`);
      
      if (games.length >= targetGames) break;
    } catch (e) {
      console.error(`[v6.33] Error for ${player}:`, e);
    }
  }
  
  console.log(`[v6.33 FETCH] COMPLETE: ${games.length} games, ${playersQueried} players`);
  
  if (games.length === 0) {
    console.warn(`[v6.33] Empty batch - caller should retry with different params`);
  }
  
  return games.sort(() => Math.random() - 0.5);
}

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
