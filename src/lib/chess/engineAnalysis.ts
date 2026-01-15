/**
 * Engine-Powered Analysis Integration
 * 
 * Bridges the Stockfish WASM engine with the existing analysis system.
 * Falls back to heuristic analysis when engine is unavailable.
 */

import { Chess } from 'chess.js';
import { 
  StockfishEngine, 
  getStockfishEngine,
  GameAnalysis,
  MoveAnalysis,
} from '@/lib/chess/stockfishEngine';
import {
  MoveQuality,
  MoveQualityInfo,
  MOVE_QUALITY_INFO,
  ClassifiedMove,
  classifyMoves as heuristicClassifyMoves,
} from '@/lib/chess/moveQuality';
import {
  GameScore,
  MoveQualityType,
  ENHANCED_QUALITY_INFO,
} from '@/lib/chess/advancedAnalysis';

// ===================== TYPES =====================

export interface EngineClassifiedMove extends ClassifiedMove {
  engineAnalysis?: {
    evalBefore: number;
    evalAfter: number;
    cpLoss: number;
    accuracy: number;
    bestMove: string;
    wasBestMove: boolean;
    pvLine: string[];
  };
}

export interface EnhancedGameAnalysis {
  moves: EngineClassifiedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  enginePowered: boolean;
  engineVersion?: string;
  analysisDepth: number;
  gameScore: GameScore;
}

// ===================== MAIN ANALYSIS FUNCTION =====================

/**
 * Analyze a game with Stockfish engine, falling back to heuristics if unavailable
 */
export async function analyzeGameWithEngine(
  pgn: string,
  options: {
    depth?: number;
    useEngine?: boolean;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<EnhancedGameAnalysis> {
  const { depth = 15, useEngine = true, onProgress } = options;
  
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch (e) {
    throw new Error('Invalid PGN');
  }
  
  const history = chess.history({ verbose: true });
  const totalMoves = history.length;
  
  // Try engine analysis first
  if (useEngine) {
    try {
      const engine = getStockfishEngine();
      const ready = await engine.waitReady();
      
      if (ready) {
        const engineAnalysis = await engine.analyzeGame(pgn, {
          depth,
          onProgress,
        });
        
        // Convert engine analysis to our format
        return convertEngineAnalysis(engineAnalysis, pgn);
      }
    } catch (e) {
      console.warn('Engine analysis failed, falling back to heuristics:', e);
    }
  }
  
  // Fallback to heuristic analysis
  const heuristicMoves = heuristicClassifyMoves(pgn);
  
  if (onProgress) {
    onProgress(totalMoves, totalMoves);
  }
  
  return convertHeuristicAnalysis(heuristicMoves, totalMoves);
}

// ===================== CONVERSION FUNCTIONS =====================

function convertEngineAnalysis(
  engineAnalysis: GameAnalysis,
  pgn: string
): EnhancedGameAnalysis {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const history = chess.history({ verbose: true });
  
  const moves: EngineClassifiedMove[] = engineAnalysis.moves.map((m, i) => {
    const move = history[i];
    const quality = cpLossToQuality(m.cpLoss, m.wasBestMove);
    
    return {
      moveNumber: Math.floor(i / 2) + 1,
      color: i % 2 === 0 ? 'w' : 'b',
      san: m.san,
      uci: m.uci,
      quality,
      info: MOVE_QUALITY_INFO[quality],
      materialChange: 0, // Not calculated by engine
      isCapture: m.san.includes('x'),
      isCheck: m.san.includes('+'),
      isCheckmate: m.san.includes('#'),
      isCastle: m.san === 'O-O' || m.san === 'O-O-O',
      isPromotion: m.san.includes('='),
      isSacrifice: false, // Would need more complex analysis
      engineAnalysis: {
        evalBefore: m.evalBefore,
        evalAfter: m.evalAfter,
        cpLoss: m.cpLoss,
        accuracy: m.accuracy,
        bestMove: m.bestMove,
        wasBestMove: m.wasBestMove,
        pvLine: m.pvLine,
      },
    };
  });
  
  // Calculate game score from engine analysis
  const gameScore = calculateGameScoreFromEngine(moves, engineAnalysis);
  
  return {
    moves,
    whiteAccuracy: engineAnalysis.whiteAccuracy,
    blackAccuracy: engineAnalysis.blackAccuracy,
    enginePowered: true,
    engineVersion: engineAnalysis.engineVersion,
    analysisDepth: engineAnalysis.averageDepth,
    gameScore,
  };
}

function convertHeuristicAnalysis(
  moves: ClassifiedMove[],
  totalMoves: number
): EnhancedGameAnalysis {
  const whiteMoves = moves.filter((_, i) => i % 2 === 0);
  const blackMoves = moves.filter((_, i) => i % 2 === 1);
  
  // Estimate accuracy from heuristic quality
  const qualityToAccuracy = (q: MoveQuality): number => {
    switch (q) {
      case 'brilliant': return 100;
      case 'great': return 98;
      case 'best': return 95;
      case 'good': return 85;
      case 'book': return 90;
      case 'inaccuracy': return 70;
      case 'mistake': return 50;
      case 'blunder': return 20;
      default: return 80;
    }
  };
  
  const whiteAccuracy = whiteMoves.length
    ? whiteMoves.reduce((sum, m) => sum + qualityToAccuracy(m.quality), 0) / whiteMoves.length
    : 0;
  const blackAccuracy = blackMoves.length
    ? blackMoves.reduce((sum, m) => sum + qualityToAccuracy(m.quality), 0) / blackMoves.length
    : 0;
  
  const gameScore = calculateGameScoreFromHeuristics(moves);
  
  return {
    moves: moves as EngineClassifiedMove[],
    whiteAccuracy: Math.round(whiteAccuracy * 10) / 10,
    blackAccuracy: Math.round(blackAccuracy * 10) / 10,
    enginePowered: false,
    analysisDepth: 0,
    gameScore,
  };
}

// ===================== UTILITY FUNCTIONS =====================

function cpLossToQuality(cpLoss: number, wasBest: boolean): MoveQuality {
  if (cpLoss < 0) return 'brilliant';
  if (wasBest || cpLoss <= 5) return 'best';
  if (cpLoss <= 15) return 'great';
  if (cpLoss <= 30) return 'good';
  if (cpLoss <= 75) return 'inaccuracy';
  if (cpLoss <= 200) return 'mistake';
  return 'blunder';
}

function calculateGameScoreFromEngine(
  moves: EngineClassifiedMove[],
  engineAnalysis: GameAnalysis
): GameScore {
  const whiteMoves = moves.filter((_, i) => i % 2 === 0);
  const blackMoves = moves.filter((_, i) => i % 2 === 1);
  
  const countQuality = (arr: EngineClassifiedMove[], quality: MoveQuality) =>
    arr.filter(m => m.quality === quality).length;
  
  const whiteCpLoss = whiteMoves.reduce((sum, m) => 
    sum + (m.engineAnalysis?.cpLoss || 0), 0);
  const blackCpLoss = blackMoves.reduce((sum, m) => 
    sum + (m.engineAnalysis?.cpLoss || 0), 0);
  
  // Estimate rating from accuracy
  const estimateRating = (accuracy: number) => {
    if (accuracy >= 98) return 2700;
    if (accuracy >= 95) return 2400;
    if (accuracy >= 90) return 2100;
    if (accuracy >= 85) return 1800;
    if (accuracy >= 80) return 1500;
    if (accuracy >= 70) return 1200;
    return 900;
  };
  
  const whiteRating = estimateRating(engineAnalysis.whiteAccuracy);
  const blackRating = estimateRating(engineAnalysis.blackAccuracy);
  const avgRating = (whiteRating + blackRating) / 2;
  
  let category: GameScore['rating']['category'] = 'beginner';
  if (avgRating >= 2500) category = 'grandmaster';
  else if (avgRating >= 2200) category = 'master';
  else if (avgRating >= 1800) category = 'advanced';
  else if (avgRating >= 1400) category = 'intermediate';
  
  // Calculate complexity (based on evaluation swings)
  const evalSwings = moves.filter(m => 
    m.engineAnalysis && Math.abs(m.engineAnalysis.evalAfter - m.engineAnalysis.evalBefore) > 100
  ).length;
  const complexity = Math.min(100, (evalSwings / moves.length) * 200);
  
  // Calculate sharpness (based on tactical density)
  const tacticalMoves = moves.filter(m => 
    m.isCapture || m.isCheck || m.isSacrifice
  ).length;
  const sharpness = Math.min(100, (tacticalMoves / moves.length) * 150);
  
  return {
    whiteAccuracy: engineAnalysis.whiteAccuracy,
    blackAccuracy: engineAnalysis.blackAccuracy,
    overallAccuracy: (engineAnalysis.whiteAccuracy + engineAnalysis.blackAccuracy) / 2,
    whiteCpLoss,
    blackCpLoss,
    brilliantMoves: {
      white: countQuality(whiteMoves, 'brilliant'),
      black: countQuality(blackMoves, 'brilliant'),
    },
    greatMoves: {
      white: countQuality(whiteMoves, 'great'),
      black: countQuality(blackMoves, 'great'),
    },
    blunders: {
      white: countQuality(whiteMoves, 'blunder'),
      black: countQuality(blackMoves, 'blunder'),
    },
    mistakes: {
      white: countQuality(whiteMoves, 'mistake'),
      black: countQuality(blackMoves, 'mistake'),
    },
    inaccuracies: {
      white: countQuality(whiteMoves, 'inaccuracy'),
      black: countQuality(blackMoves, 'inaccuracy'),
    },
    tacticsExecuted: { white: 0, black: 0 }, // Not tracked by engine
    tacticsMissed: { white: 0, black: 0 },
    complexity: Math.round(complexity),
    sharpness: Math.round(sharpness),
    rating: {
      estimated: { white: whiteRating, black: blackRating },
      category,
    },
  };
}

function calculateGameScoreFromHeuristics(moves: ClassifiedMove[]): GameScore {
  const whiteMoves = moves.filter((_, i) => i % 2 === 0);
  const blackMoves = moves.filter((_, i) => i % 2 === 1);
  
  const qualityToAccuracy = (q: MoveQuality): number => {
    switch (q) {
      case 'brilliant': return 100;
      case 'great': return 98;
      case 'best': return 95;
      case 'good': return 85;
      case 'book': return 90;
      case 'inaccuracy': return 70;
      case 'mistake': return 50;
      case 'blunder': return 20;
      default: return 80;
    }
  };
  
  const countQuality = (arr: ClassifiedMove[], quality: MoveQuality) =>
    arr.filter(m => m.quality === quality).length;
  
  const whiteAccuracy = whiteMoves.length
    ? whiteMoves.reduce((sum, m) => sum + qualityToAccuracy(m.quality), 0) / whiteMoves.length
    : 0;
  const blackAccuracy = blackMoves.length
    ? blackMoves.reduce((sum, m) => sum + qualityToAccuracy(m.quality), 0) / blackMoves.length
    : 0;
  
  const estimateRating = (accuracy: number) => {
    if (accuracy >= 98) return 2700;
    if (accuracy >= 95) return 2400;
    if (accuracy >= 90) return 2100;
    if (accuracy >= 85) return 1800;
    if (accuracy >= 80) return 1500;
    if (accuracy >= 70) return 1200;
    return 900;
  };
  
  const whiteRating = estimateRating(whiteAccuracy);
  const blackRating = estimateRating(blackAccuracy);
  const avgRating = (whiteRating + blackRating) / 2;
  
  let category: GameScore['rating']['category'] = 'beginner';
  if (avgRating >= 2500) category = 'grandmaster';
  else if (avgRating >= 2200) category = 'master';
  else if (avgRating >= 1800) category = 'advanced';
  else if (avgRating >= 1400) category = 'intermediate';
  
  return {
    whiteAccuracy: Math.round(whiteAccuracy * 10) / 10,
    blackAccuracy: Math.round(blackAccuracy * 10) / 10,
    overallAccuracy: Math.round((whiteAccuracy + blackAccuracy) / 2 * 10) / 10,
    whiteCpLoss: 0,
    blackCpLoss: 0,
    brilliantMoves: {
      white: countQuality(whiteMoves, 'brilliant'),
      black: countQuality(blackMoves, 'brilliant'),
    },
    greatMoves: {
      white: countQuality(whiteMoves, 'great'),
      black: countQuality(blackMoves, 'great'),
    },
    blunders: {
      white: countQuality(whiteMoves, 'blunder'),
      black: countQuality(blackMoves, 'blunder'),
    },
    mistakes: {
      white: countQuality(whiteMoves, 'mistake'),
      black: countQuality(blackMoves, 'mistake'),
    },
    inaccuracies: {
      white: countQuality(whiteMoves, 'inaccuracy'),
      black: countQuality(blackMoves, 'inaccuracy'),
    },
    tacticsExecuted: { white: 0, black: 0 },
    tacticsMissed: { white: 0, black: 0 },
    complexity: 50, // Default estimate
    sharpness: 50,
    rating: {
      estimated: { white: whiteRating, black: blackRating },
      category,
    },
  };
}

// ===================== EXPORTS =====================

export { getStockfishEngine, type GameAnalysis, type MoveAnalysis };
