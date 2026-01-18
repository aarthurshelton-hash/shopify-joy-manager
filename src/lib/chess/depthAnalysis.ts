/**
 * En Pensent™ Effective Depth Calculator
 * 
 * Measures our "moves ahead" capability compared to Stockfish's depth.
 * 
 * Stockfish depth = how many half-moves (plies) it searches
 * En Pensent depth = effective lookahead based on pattern trajectory accuracy
 * 
 * The key insight: We don't search moves - we RECOGNIZE patterns that
 * indicate outcomes many moves in the future.
 */

import { Chess } from 'chess.js';
import { extractColorFlowSignature, predictFromColorFlow } from './colorFlowAnalysis';
import { simulateGame } from './gameSimulator';
import { evaluatePosition, type PositionEvaluation } from './lichessCloudEval';

export interface DepthMetrics {
  // Stockfish's depth in plies (half-moves)
  stockfishDepth: number;
  stockfishKnodes: number;
  
  // En Pensent's effective depth (calculated from accuracy at various horizons)
  enPensentEffectiveDepth: number;
  
  // Depth comparison
  depthAdvantage: number; // positive = En Pensent deeper
  depthRatio: number;     // > 1 = En Pensent advantage
  
  // Horizon analysis (how far ahead we can see accurately)
  horizonAccuracy: HorizonAccuracy[];
  maxAccurateHorizon: number; // moves ahead with >60% accuracy
  
  // Pattern-based depth equivalence
  patternDepthEquivalent: number;
  
  // Confidence metrics
  depthConfidence: number;
}

export interface HorizonAccuracy {
  movesAhead: number;
  accuracy: number;
  sampleSize: number;
  stockfishAccuracyAtHorizon: number;
}

export interface PositionDepthReport {
  fen: string;
  stockfish: {
    depth: number;
    evaluation: number;
    bestMove: string;
    pv: string[];
    pvDepth: number;
  };
  enPensent: {
    effectiveDepth: number;
    predictedOutcome: string;
    confidence: number;
    archetype: string;
    trajectoryHorizon: number;
  };
  comparison: {
    depthDifference: number;
    stockfishPvHorizon: number;
    enPensentPatternHorizon: number;
    effectiveAdvantage: string;
  };
}

/**
 * Calculate effective depth for En Pensent based on pattern recognition range
 * 
 * The formula considers:
 * 1. Color flow pattern span (how many moves the pattern encompasses)
 * 2. Archetype confidence (stronger archetypes = deeper effective vision)
 * 3. Trajectory prediction horizon (how far ahead we predict)
 * 4. Historical accuracy at different horizons
 */
export function calculateEffectiveDepth(
  patternSpan: number,
  archetypeConfidence: number,
  trajectoryHorizon: number,
  historicalAccuracy: number = 0.65
): number {
  // Base depth from pattern span (each pattern covers ~3-5 effective plies)
  const patternPlyEquivalent = patternSpan * 4;
  
  // Confidence multiplier (high confidence = more reliable depth)
  const confidenceMultiplier = 0.5 + (archetypeConfidence / 100) * 0.8;
  
  // Trajectory extension (how far our predictions reach)
  const trajectoryPlyEquivalent = trajectoryHorizon * 2;
  
  // Accuracy calibration (reduce depth if accuracy is low)
  const accuracyFactor = Math.pow(historicalAccuracy, 0.5);
  
  // Combined effective depth
  const rawDepth = (patternPlyEquivalent + trajectoryPlyEquivalent) * confidenceMultiplier;
  const calibratedDepth = rawDepth * accuracyFactor;
  
  return Math.round(calibratedDepth);
}

/**
 * Convert Stockfish search depth to "moves ahead" understanding
 */
export function stockfishDepthToMoves(plies: number): number {
  // 1 ply = 1 half-move, 2 plies = 1 full move
  return Math.floor(plies / 2);
}

/**
 * Analyze a position and generate comprehensive depth report
 */
export async function analyzePositionDepth(
  pgn: string,
  currentMove?: number
): Promise<PositionDepthReport | null> {
  try {
    const chess = new Chess();
    
    // Load and potentially truncate PGN
    chess.loadPgn(pgn);
    const history = chess.history();
    
    if (currentMove !== undefined) {
      chess.reset();
      for (let i = 0; i < Math.min(currentMove, history.length); i++) {
        chess.move(history[i]);
      }
    }
    
    const fen = chess.fen();
    
    // Get Stockfish evaluation
    const stockfishEval = await evaluatePosition(fen);
    
    // Get En Pensent analysis
    const simulation = simulateGame(chess.pgn());
    const colorSignature = extractColorFlowSignature(
      simulation.board,
      simulation.gameData,
      simulation.totalMoves
    );
    const colorPrediction = predictFromColorFlow(colorSignature, simulation.totalMoves);
    
    // Calculate En Pensent effective depth
    const patternSpan = simulation.totalMoves;
    const archetypeConfidence = colorSignature.intensity * 100;
    const trajectoryHorizon = colorPrediction.lookaheadMoves;
    const effectiveDepth = calculateEffectiveDepth(
      patternSpan,
      archetypeConfidence,
      trajectoryHorizon
    );
    
    // Stockfish metrics
    const sfDepth = stockfishEval?.depth || 0;
    const sfPvLength = stockfishEval?.pv?.length || 0;
    
    // Calculate depth comparison
    const depthDifference = effectiveDepth - sfDepth;
    const stockfishMovesAhead = stockfishDepthToMoves(sfDepth);
    const enPensentMovesAhead = Math.floor(effectiveDepth / 2);
    
    return {
      fen,
      stockfish: {
        depth: sfDepth,
        evaluation: stockfishEval?.evaluation || 0,
        bestMove: stockfishEval?.bestMoveSan || 'N/A',
        pv: stockfishEval?.pv || [],
        pvDepth: sfPvLength,
      },
      enPensent: {
        effectiveDepth,
        predictedOutcome: colorPrediction.predictedWinner || 'unclear',
        confidence: colorPrediction.confidence,
        archetype: colorSignature.archetype,
        trajectoryHorizon,
      },
      comparison: {
        depthDifference,
        stockfishPvHorizon: stockfishMovesAhead,
        enPensentPatternHorizon: enPensentMovesAhead,
        effectiveAdvantage: depthDifference > 0 
          ? `En Pensent +${depthDifference} plies`
          : depthDifference < 0 
            ? `Stockfish +${-depthDifference} plies`
            : 'Equal depth',
      },
    };
  } catch (error) {
    console.error('[DepthAnalysis] Error:', error);
    return null;
  }
}

/**
 * Calculate depth metrics from benchmark results
 */
export function calculateDepthMetricsFromBenchmark(
  benchmarkResults: Array<{
    stockfishDepth: number;
    stockfishCorrect: boolean;
    hybridCorrect: boolean;
    hybridConfidence: number;
    hybridArchetype: string;
    moveNumber: number;
    gameMoveCount?: number;
  }>
): DepthMetrics {
  if (benchmarkResults.length === 0) {
    return {
      stockfishDepth: 0,
      stockfishKnodes: 0,
      enPensentEffectiveDepth: 0,
      depthAdvantage: 0,
      depthRatio: 1,
      horizonAccuracy: [],
      maxAccurateHorizon: 0,
      patternDepthEquivalent: 0,
      depthConfidence: 0,
    };
  }
  
  // Average Stockfish depth
  const avgStockfishDepth = benchmarkResults.reduce((sum, r) => sum + r.stockfishDepth, 0) / benchmarkResults.length;
  
  // Calculate En Pensent accuracy at different horizons
  const horizonGroups = new Map<number, { sfCorrect: number; epCorrect: number; total: number }>();
  
  for (const result of benchmarkResults) {
    // Calculate how many moves ahead we were predicting
    const movesAhead = result.gameMoveCount 
      ? result.gameMoveCount - result.moveNumber 
      : 30; // Assume average game length
    
    const horizonBucket = Math.floor(movesAhead / 5) * 5; // Group by 5-move buckets
    
    if (!horizonGroups.has(horizonBucket)) {
      horizonGroups.set(horizonBucket, { sfCorrect: 0, epCorrect: 0, total: 0 });
    }
    
    const group = horizonGroups.get(horizonBucket)!;
    group.total++;
    if (result.stockfishCorrect) group.sfCorrect++;
    if (result.hybridCorrect) group.epCorrect++;
  }
  
  // Convert to horizon accuracy array
  const horizonAccuracy: HorizonAccuracy[] = [];
  let maxAccurateHorizon = 0;
  
  for (const [movesAhead, stats] of horizonGroups.entries()) {
    const accuracy = stats.total > 0 ? stats.epCorrect / stats.total : 0;
    const sfAccuracy = stats.total > 0 ? stats.sfCorrect / stats.total : 0;
    
    horizonAccuracy.push({
      movesAhead,
      accuracy: accuracy * 100,
      sampleSize: stats.total,
      stockfishAccuracyAtHorizon: sfAccuracy * 100,
    });
    
    if (accuracy > 0.6 && movesAhead > maxAccurateHorizon) {
      maxAccurateHorizon = movesAhead;
    }
  }
  
  horizonAccuracy.sort((a, b) => a.movesAhead - b.movesAhead);
  
  // Calculate overall accuracies
  const sfCorrectCount = benchmarkResults.filter(r => r.stockfishCorrect).length;
  const epCorrectCount = benchmarkResults.filter(r => r.hybridCorrect).length;
  const sfAccuracy = sfCorrectCount / benchmarkResults.length;
  const epAccuracy = epCorrectCount / benchmarkResults.length;
  
  // Calculate effective depth based on accuracy advantage
  // Formula: Depth advantage = log2(accuracyRatio) * baseDepth
  const accuracyRatio = epAccuracy / Math.max(sfAccuracy, 0.01);
  const avgConfidence = benchmarkResults.reduce((sum, r) => sum + r.hybridConfidence, 0) / benchmarkResults.length;
  
  // Pattern depth equivalent: how deep would Stockfish need to search to match our accuracy?
  // Each doubling of depth roughly adds 5-10% accuracy
  const depthEquivalentBonus = Math.log2(Math.max(accuracyRatio, 0.5)) * 10;
  const patternDepthEquivalent = avgStockfishDepth + depthEquivalentBonus;
  
  // En Pensent effective depth (based on accuracy and horizon)
  const baseEffectiveDepth = maxAccurateHorizon * 2; // Convert moves to plies
  const confidenceBonus = (avgConfidence / 100) * 10;
  const enPensentEffectiveDepth = Math.round(baseEffectiveDepth + confidenceBonus + depthEquivalentBonus);
  
  // Calculate advantage
  const depthAdvantage = enPensentEffectiveDepth - avgStockfishDepth;
  const depthRatio = enPensentEffectiveDepth / Math.max(avgStockfishDepth, 1);
  
  return {
    stockfishDepth: Math.round(avgStockfishDepth),
    stockfishKnodes: 0, // Would need to be tracked separately
    enPensentEffectiveDepth,
    depthAdvantage: Math.round(depthAdvantage),
    depthRatio: Math.round(depthRatio * 100) / 100,
    horizonAccuracy,
    maxAccurateHorizon,
    patternDepthEquivalent: Math.round(patternDepthEquivalent),
    depthConfidence: avgConfidence,
  };
}

/**
 * Generate a human-readable depth report
 */
export function generateDepthReport(metrics: DepthMetrics): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════',
    '       EN PENSENT™ vs STOCKFISH 17 DEPTH ANALYSIS      ',
    '═══════════════════════════════════════════════════════',
    '',
    '┌─────────────────────────────────────────────────────┐',
    '│                  DEPTH COMPARISON                   │',
    '├─────────────────────────────────────────────────────┤',
    `│  Stockfish 17 Search Depth:    ${metrics.stockfishDepth.toString().padStart(3)} plies             │`,
    `│  Stockfish Moves Ahead:        ${stockfishDepthToMoves(metrics.stockfishDepth).toString().padStart(3)} moves             │`,
    '├─────────────────────────────────────────────────────┤',
    `│  En Pensent Effective Depth:   ${metrics.enPensentEffectiveDepth.toString().padStart(3)} plies             │`,
    `│  En Pensent Moves Ahead:       ${Math.floor(metrics.enPensentEffectiveDepth / 2).toString().padStart(3)} moves             │`,
    '├─────────────────────────────────────────────────────┤',
    `│  DEPTH ADVANTAGE:              ${(metrics.depthAdvantage >= 0 ? '+' : '') + metrics.depthAdvantage} plies            │`,
    `│  DEPTH RATIO:                  ${metrics.depthRatio.toFixed(2)}x                 │`,
    '└─────────────────────────────────────────────────────┘',
    '',
    '┌─────────────────────────────────────────────────────┐',
    '│              HORIZON ACCURACY ANALYSIS              │',
    '├─────────────────────────────────────────────────────┤',
  ];
  
  for (const horizon of metrics.horizonAccuracy) {
    const epBar = '█'.repeat(Math.round(horizon.accuracy / 5));
    const sfBar = '░'.repeat(Math.round(horizon.stockfishAccuracyAtHorizon / 5));
    lines.push(
      `│  ${horizon.movesAhead.toString().padStart(2)} moves: EP ${horizon.accuracy.toFixed(1).padStart(5)}% ${epBar.padEnd(20)}│`
    );
    lines.push(
      `│          SF ${horizon.stockfishAccuracyAtHorizon.toFixed(1).padStart(5)}% ${sfBar.padEnd(20)}│`
    );
  }
  
  lines.push('├─────────────────────────────────────────────────────┤');
  lines.push(`│  Max Accurate Horizon: ${metrics.maxAccurateHorizon.toString().padStart(2)} moves (>60% accuracy)    │`);
  lines.push('└─────────────────────────────────────────────────────┘');
  lines.push('');
  lines.push('┌─────────────────────────────────────────────────────┐');
  lines.push('│                   INTERPRETATION                    │');
  lines.push('├─────────────────────────────────────────────────────┤');
  
  if (metrics.depthAdvantage > 0) {
    lines.push(`│  En Pensent sees ${metrics.depthAdvantage} plies (~${Math.floor(metrics.depthAdvantage / 2)} moves) DEEPER    │`);
    lines.push(`│  than Stockfish 17's ${metrics.stockfishDepth}-ply search.                  │`);
    lines.push('│                                                     │');
    lines.push('│  This is achieved through PATTERN RECOGNITION       │');
    lines.push('│  rather than brute-force search.                    │');
  } else if (metrics.depthAdvantage < 0) {
    lines.push(`│  Stockfish 17 searches ${-metrics.depthAdvantage} plies deeper,            │`);
    lines.push(`│  but En Pensent compensates with pattern insight.   │`);
  } else {
    lines.push('│  Both engines show equivalent effective depth.      │');
  }
  
  lines.push('└─────────────────────────────────────────────────────┘');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`  Analysis confidence: ${metrics.depthConfidence.toFixed(1)}%`);
  lines.push('═══════════════════════════════════════════════════════');
  
  return lines.join('\n');
}
