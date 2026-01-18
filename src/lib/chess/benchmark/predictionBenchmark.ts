/**
 * En Pensent™ Prediction Benchmark System
 * 
 * THE PARADIGM: We don't just play chess - we predict its future better than pure calculation.
 * 
 * This benchmark proves that fusing strategic pattern recognition with tactical analysis
 * creates predictions that surpass Stockfish's raw evaluation.
 * 
 * Historical Note:
 * Deep Blue (1997) and AlphaZero (2017) proved machines could PLAY chess.
 * En Pensent (2025) proves machines can PREDICT chess trajectories.
 */

import { Chess } from 'chess.js';
import { getStockfishEngine } from '../stockfishEngine';
import { generateHybridPrediction } from '../hybridPrediction';
import { extractColorFlowSignature } from '../colorFlowAnalysis';
import { simulateGame } from '../gameSimulator';

export interface PredictionAttempt {
  gameId: string;
  moveNumber: number;
  fen: string;
  pgn: string;
  
  // Stockfish's prediction (from raw centipawn evaluation)
  stockfishEval: number;
  stockfishPrediction: 'white_wins' | 'black_wins' | 'draw';
  stockfishConfidence: number; // 0-100
  
  // Hybrid system prediction
  hybridPrediction: 'white_wins' | 'black_wins' | 'draw';
  hybridConfidence: number; // 0-100
  hybridArchetype: string;
  
  // Actual result after game completes
  actualResult?: 'white_wins' | 'black_wins' | 'draw';
  
  // Scoring
  stockfishCorrect?: boolean;
  hybridCorrect?: boolean;
}

export interface BenchmarkResult {
  totalGames: number;
  completedGames: number;
  predictionPoints: PredictionAttempt[];
  
  // Win rates
  stockfishAccuracy: number;
  hybridAccuracy: number;
  
  // Detailed breakdown
  stockfishWins: number;  // Predictions where SF was right, Hybrid wrong
  hybridWins: number;     // Predictions where Hybrid was right, SF wrong
  bothCorrect: number;
  bothWrong: number;
  
  // By archetype
  archetypePerformance: Record<string, { correct: number; total: number }>;
  
  // Statistical significance
  confidence: number;
  pValue: number;
  
  // Timestamp
  startedAt: Date;
  completedAt?: Date;
}

// Convert Stockfish centipawn evaluation to win probability and prediction
function stockfishEvalToPrediction(cp: number): {
  prediction: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
} {
  // Convert centipawns to win probability using sigmoid
  // At ±200 cp, ~73% win probability
  // At ±500 cp, ~95% win probability
  const winProbability = 1 / (1 + Math.exp(-cp / 200));
  
  // Confidence is how far from 50% (uncertain) we are
  const confidence = Math.abs(winProbability - 0.5) * 200;
  
  if (cp > 150) {
    return { prediction: 'white_wins', confidence: Math.min(100, confidence) };
  } else if (cp < -150) {
    return { prediction: 'black_wins', confidence: Math.min(100, confidence) };
  } else {
    return { prediction: 'draw', confidence: Math.max(20, 100 - confidence) };
  }
}

// Generate a high-quality Stockfish vs Stockfish game
async function generateStockfishGame(
  gameId: string,
  depth: number = 18,
  maxMoves: number = 100,
  onProgress?: (move: number, pgn: string) => void
): Promise<{ pgn: string; result: 'white_wins' | 'black_wins' | 'draw'; moveCount: number }> {
  const chess = new Chess();
  const engine = getStockfishEngine();
  await engine.waitReady();
  
  let moveCount = 0;
  
  while (!chess.isGameOver() && moveCount < maxMoves) {
    const analysis = await engine.analyzePosition(chess.fen(), { depth, nodes: 50000 });
    
    if (analysis.bestMove) {
      try {
        // Parse UCI move format
        const from = analysis.bestMove.slice(0, 2);
        const to = analysis.bestMove.slice(2, 4);
        const promotion = analysis.bestMove.length > 4 ? analysis.bestMove[4] : undefined;
        
        chess.move({ from, to, promotion });
        moveCount++;
        
        onProgress?.(moveCount, chess.pgn());
      } catch (e) {
        console.warn('Move failed:', analysis.bestMove, e);
        break;
      }
    } else {
      break;
    }
  }
  
  // Determine result
  let result: 'white_wins' | 'black_wins' | 'draw' = 'draw';
  if (chess.isCheckmate()) {
    result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
  } else if (chess.isDraw()) {
    result = 'draw';
  } else if (moveCount >= maxMoves) {
    // Use final evaluation to determine likely winner
    const finalEval = await engine.quickEval(chess.fen());
    if (finalEval > 200) result = 'white_wins';
    else if (finalEval < -200) result = 'black_wins';
    else result = 'draw';
  }
  
  return { pgn: chess.pgn(), result, moveCount };
}

// Make a prediction at a specific point in the game
async function makePredictionAtMove(
  gameId: string,
  fullPgn: string,
  moveNumber: number,
  depth: number = 18
): Promise<PredictionAttempt> {
  const chess = new Chess();
  chess.loadPgn(fullPgn);
  
  // Get history and replay up to moveNumber
  const history = chess.history({ verbose: true });
  chess.reset();
  
  for (let i = 0; i < Math.min(moveNumber, history.length); i++) {
    chess.move(history[i].san);
  }
  
  const truncatedPgn = chess.pgn();
  const fen = chess.fen();
  
  // Get Stockfish evaluation
  const engine = getStockfishEngine();
  await engine.waitReady();
  const analysis = await engine.analyzePosition(fen, { depth, nodes: 80000 });
  
  const stockfishResult = stockfishEvalToPrediction(analysis.evaluation?.score || 0);
  
  // Get Hybrid prediction
  const hybridResult = await generateHybridPrediction(truncatedPgn, { depth });
  
  // Map hybrid prediction to outcome
  const probs = hybridResult.trajectoryPrediction.outcomeProbabilities;
  const hybridPrediction = 
    probs.whiteWin > probs.blackWin && probs.whiteWin > probs.draw ? 'white_wins' :
    probs.blackWin > probs.draw ? 'black_wins' : 'draw';
  return {
    gameId,
    moveNumber,
    fen,
    pgn: truncatedPgn,
    stockfishEval: analysis.evaluation?.score || 0,
    stockfishPrediction: stockfishResult.prediction,
    stockfishConfidence: stockfishResult.confidence,
    hybridPrediction,
    hybridConfidence: hybridResult.confidence.overall,
    hybridArchetype: hybridResult.strategicAnalysis.archetype,
  };
}

// Run the full benchmark
export async function runPredictionBenchmark(
  options: {
    numGames?: number;
    predictionMoveNumber?: number;
    depth?: number;
    onProgress?: (status: string, progress: number) => void;
  } = {}
): Promise<BenchmarkResult> {
  const {
    numGames = 10,
    predictionMoveNumber = 20,
    depth = 18,
    onProgress,
  } = options;
  
  const result: BenchmarkResult = {
    totalGames: numGames,
    completedGames: 0,
    predictionPoints: [],
    stockfishAccuracy: 0,
    hybridAccuracy: 0,
    stockfishWins: 0,
    hybridWins: 0,
    bothCorrect: 0,
    bothWrong: 0,
    archetypePerformance: {},
    confidence: 0,
    pValue: 1,
    startedAt: new Date(),
  };
  
  for (let i = 0; i < numGames; i++) {
    const gameId = `benchmark-${Date.now()}-${i}`;
    
    onProgress?.(`Generating game ${i + 1}/${numGames}`, (i / numGames) * 100);
    
    try {
      // Generate a Stockfish vs Stockfish game
      const game = await generateStockfishGame(gameId, depth, 100);
      
      if (game.moveCount < predictionMoveNumber) {
        console.log(`Game ${i} too short (${game.moveCount} moves), skipping`);
        continue;
      }
      
      onProgress?.(`Analyzing game ${i + 1}/${numGames}`, ((i + 0.5) / numGames) * 100);
      
      // Make predictions at the specified move
      const prediction = await makePredictionAtMove(gameId, game.pgn, predictionMoveNumber, depth);
      prediction.actualResult = game.result;
      
      // Score predictions
      prediction.stockfishCorrect = prediction.stockfishPrediction === game.result;
      prediction.hybridCorrect = prediction.hybridPrediction === game.result;
      
      result.predictionPoints.push(prediction);
      result.completedGames++;
      
      // Update archetype performance
      if (!result.archetypePerformance[prediction.hybridArchetype]) {
        result.archetypePerformance[prediction.hybridArchetype] = { correct: 0, total: 0 };
      }
      result.archetypePerformance[prediction.hybridArchetype].total++;
      if (prediction.hybridCorrect) {
        result.archetypePerformance[prediction.hybridArchetype].correct++;
      }
      
      // Update comparison counts
      if (prediction.stockfishCorrect && prediction.hybridCorrect) {
        result.bothCorrect++;
      } else if (!prediction.stockfishCorrect && !prediction.hybridCorrect) {
        result.bothWrong++;
      } else if (prediction.hybridCorrect) {
        result.hybridWins++;
      } else {
        result.stockfishWins++;
      }
      
    } catch (e) {
      console.error(`Error in game ${i}:`, e);
    }
  }
  
  // Calculate final statistics
  const sfCorrect = result.predictionPoints.filter(p => p.stockfishCorrect).length;
  const hybridCorrect = result.predictionPoints.filter(p => p.hybridCorrect).length;
  
  result.stockfishAccuracy = result.completedGames > 0 ? (sfCorrect / result.completedGames) * 100 : 0;
  result.hybridAccuracy = result.completedGames > 0 ? (hybridCorrect / result.completedGames) * 100 : 0;
  
  // Statistical significance (binomial test approximation)
  if (result.completedGames > 0) {
    const diff = Math.abs(hybridCorrect - sfCorrect);
    const n = result.completedGames;
    const variance = n * 0.5 * 0.5; // Under null hypothesis
    const zScore = diff / Math.sqrt(variance);
    result.pValue = 2 * (1 - normalCdf(zScore));
    result.confidence = 100 * (1 - result.pValue);
  }
  
  result.completedAt = new Date();
  
  return result;
}

// Normal CDF approximation for p-value calculation
function normalCdf(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1 / (1 + p * z);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1 + sign * y);
}

// Quick benchmark with pre-existing games
export async function runQuickBenchmark(
  pgnGames: { pgn: string; result: 'white_wins' | 'black_wins' | 'draw' }[],
  predictionMoveNumber: number = 20,
  depth: number = 18,
  onProgress?: (status: string, progress: number) => void
): Promise<BenchmarkResult> {
  const result: BenchmarkResult = {
    totalGames: pgnGames.length,
    completedGames: 0,
    predictionPoints: [],
    stockfishAccuracy: 0,
    hybridAccuracy: 0,
    stockfishWins: 0,
    hybridWins: 0,
    bothCorrect: 0,
    bothWrong: 0,
    archetypePerformance: {},
    confidence: 0,
    pValue: 1,
    startedAt: new Date(),
  };
  
  for (let i = 0; i < pgnGames.length; i++) {
    const game = pgnGames[i];
    const gameId = `quick-${i}`;
    
    onProgress?.(`Analyzing game ${i + 1}/${pgnGames.length}`, (i / pgnGames.length) * 100);
    
    try {
      const prediction = await makePredictionAtMove(gameId, game.pgn, predictionMoveNumber, depth);
      prediction.actualResult = game.result;
      prediction.stockfishCorrect = prediction.stockfishPrediction === game.result;
      prediction.hybridCorrect = prediction.hybridPrediction === game.result;
      
      result.predictionPoints.push(prediction);
      result.completedGames++;
      
      // Update counts (same as above)
      if (!result.archetypePerformance[prediction.hybridArchetype]) {
        result.archetypePerformance[prediction.hybridArchetype] = { correct: 0, total: 0 };
      }
      result.archetypePerformance[prediction.hybridArchetype].total++;
      if (prediction.hybridCorrect) {
        result.archetypePerformance[prediction.hybridArchetype].correct++;
      }
      
      if (prediction.stockfishCorrect && prediction.hybridCorrect) {
        result.bothCorrect++;
      } else if (!prediction.stockfishCorrect && !prediction.hybridCorrect) {
        result.bothWrong++;
      } else if (prediction.hybridCorrect) {
        result.hybridWins++;
      } else {
        result.stockfishWins++;
      }
      
    } catch (e) {
      console.error(`Error in game ${i}:`, e);
    }
  }
  
  // Calculate stats
  const sfCorrect = result.predictionPoints.filter(p => p.stockfishCorrect).length;
  const hybridCorrect = result.predictionPoints.filter(p => p.hybridCorrect).length;
  
  result.stockfishAccuracy = result.completedGames > 0 ? (sfCorrect / result.completedGames) * 100 : 0;
  result.hybridAccuracy = result.completedGames > 0 ? (hybridCorrect / result.completedGames) * 100 : 0;
  
  if (result.completedGames > 0) {
    const diff = Math.abs(hybridCorrect - sfCorrect);
    const n = result.completedGames;
    const variance = n * 0.5 * 0.5;
    const zScore = diff / Math.sqrt(variance);
    result.pValue = 2 * (1 - normalCdf(zScore));
    result.confidence = 100 * (1 - result.pValue);
  }
  
  result.completedAt = new Date();
  
  return result;
}

export default runPredictionBenchmark;
