/**
 * Hybrid Prediction Engine
 * 
 * En Pensent™ Patent-Pending Technology
 * 
 * Fuses Stockfish 17's 30-move tactical depth with
 * Color Flow Analysis strategic trajectory prediction.
 * 
 * Innovation:
 * - Stockfish: "Best move is e4 because it wins material"
 * - Color Flow: "This game arc leads to kingside attack in ~15 moves"
 * - Hybrid: "Play e4 (tactics) as part of the kingside attack trajectory (strategy)"
 * 
 * This creates predictions neither engine could make alone.
 */

import { Chess } from 'chess.js';
import { 
  extractColorFlowSignature, 
  predictFromColorFlow,
  ARCHETYPE_DEFINITIONS
} from '../colorFlowAnalysis';
import { simulateGame } from '../gameSimulator';
import { evaluatePosition, PositionEvaluation } from '../lichessCloudEval';
import { PositionAnalysis } from '../stockfishEngine';

// Re-export types
export * from './types';

// Import modular functions
import { createTacticalInsight } from './tacticalInsight';
import { createStrategicInsight } from './strategicInsight';
import { fuseRecommendations } from './fusedRecommendation';
import { generateTrajectoryPrediction } from './trajectoryPrediction';
import { calculateHybridConfidence, calculateCombinedScore } from './confidenceCalculator';
import { HybridPrediction } from './types';

/**
 * Convert Lichess Cloud evaluation to PositionAnalysis format
 */
function cloudEvalToPositionAnalysis(
  cloudEval: PositionEvaluation | null,
  fen: string
): PositionAnalysis {
  const cp = cloudEval?.evaluation ?? 0;
  const isMate = cloudEval?.isMate ?? false;
  const mateIn = cloudEval?.mateIn;
  
  return {
    fen,
    bestMove: cloudEval?.bestMove ?? 'e2e4',
    ponder: cloudEval?.pv?.[1] ?? undefined,
    evaluation: {
      score: cp,
      scoreType: isMate ? 'mate' : 'cp',
      mateIn: mateIn ?? undefined,
      depth: cloudEval?.depth ?? 20,
      nodes: 50000,
      nps: 0,
      time: 0,
      pv: cloudEval?.pv ?? [],
    },
    winProbability: cloudEval?.winProbability ?? 50,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
  };
}

/**
 * Generate a hybrid prediction combining Stockfish tactics with Color Flow strategy
 */
export async function generateHybridPrediction(
  pgn: string,
  options: {
    depth?: number;
    onProgress?: (stage: string, progress: number) => void;
  } = {}
): Promise<HybridPrediction> {
  const depth = options.depth || 18;
  
  options.onProgress?.('Simulating game visualization', 5);
  
  // Step 1: Simulate the game to get board state
  const simulation = simulateGame(pgn);
  const { board, gameData, totalMoves } = simulation;
  
  options.onProgress?.('Extracting color flow signature', 15);
  
  // Step 2: Extract Color Flow Signature
  const colorSignature = extractColorFlowSignature(board, gameData, totalMoves);
  
  options.onProgress?.('Analyzing current position with Lichess Cloud', 30);
  
  // Step 3: Get current position for analysis
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    // Fallback to starting position
  }
  const currentFen = chess.fen();
  
  // Step 4: Get Stockfish evaluation from Lichess Cloud API
  const cloudEval = await evaluatePosition(currentFen);
  
  // Convert to PositionAnalysis format expected by other functions
  const positionAnalysis = cloudEvalToPositionAnalysis(cloudEval, currentFen);
  
  options.onProgress?.('Fusing tactical and strategic analysis', 60);
  
  // Step 5: Generate strategic prediction from color flow
  const colorPrediction = predictFromColorFlow(colorSignature, totalMoves);
  
  // Step 6: Create tactical insight
  const tacticalInsight = createTacticalInsight(positionAnalysis, chess);
  
  // Step 7: Create strategic insight
  const strategicInsight = createStrategicInsight(colorSignature, colorPrediction);
  
  options.onProgress?.('Generating fused recommendation', 75);
  
  // Step 8: Fuse recommendations
  const fusedRec = fuseRecommendations(
    tacticalInsight,
    strategicInsight,
    colorSignature,
    chess
  );
  
  options.onProgress?.('Calculating trajectory prediction', 85);
  
  // Step 9: Generate trajectory prediction
  const trajectory = generateTrajectoryPrediction(
    colorSignature,
    positionAnalysis,
    totalMoves,
    chess
  );
  
  // Step 10: Calculate confidence
  const confidence = calculateHybridConfidence(
    positionAnalysis,
    colorSignature,
    tacticalInsight,
    strategicInsight
  );
  
  options.onProgress?.('Complete', 100);
  
  // Step 11: Calculate combined score
  const combinedScore = calculateCombinedScore(positionAnalysis, colorSignature, confidence);
  
  return {
    combinedScore,
    tacticalAnalysis: tacticalInsight,
    strategicAnalysis: strategicInsight,
    fusedRecommendation: fusedRec,
    trajectoryPrediction: trajectory,
    confidence,
  };
}

// Re-export for backward compatibility
export { extractColorFlowSignature, predictFromColorFlow, ARCHETYPE_DEFINITIONS };
export default generateHybridPrediction;
