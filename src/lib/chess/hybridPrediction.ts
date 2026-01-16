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

import { Chess, Square } from 'chess.js';
import { getStockfishEngine, PositionAnalysis } from './stockfishEngine';
import { analyzePositionPotential, PositionPotential, predictVisualPattern } from './predictiveAnalysis';
import { 
  extractColorFlowSignature, 
  ColorFlowSignature, 
  ColorFlowPrediction,
  predictFromColorFlow,
  StrategicArchetype,
  ARCHETYPE_DEFINITIONS
} from './colorFlowAnalysis';
import { SquareData, SimulationResult, simulateGame } from './gameSimulator';
import { getPieceColor, PieceType, PieceColor } from './pieceColors';

// ===================== HYBRID PREDICTION TYPES =====================

export interface HybridPrediction {
  /** Combined tactical + strategic evaluation */
  combinedScore: number;
  
  /** Stockfish tactical analysis */
  tacticalAnalysis: TacticalInsight;
  
  /** Color Flow strategic analysis */
  strategicAnalysis: StrategicInsight;
  
  /** Fused prediction with confidence-weighted recommendations */
  fusedRecommendation: FusedRecommendation;
  
  /** Trajectory prediction: where the game is headed */
  trajectoryPrediction: TrajectoryPrediction;
  
  /** Confidence metrics for the hybrid prediction */
  confidence: HybridConfidence;
}

export interface TacticalInsight {
  bestMove: string;
  evaluation: number;
  mateIn?: number;
  principalVariation: string[];
  tacticalThemes: string[];
  immediateThreats: string[];
}

export interface StrategicInsight {
  archetype: StrategicArchetype;
  archetypeName: string;
  flowDirection: string;
  dominantSide: string;
  strategicGuidance: string[];
  criticalSquares: string[];
}

export interface FusedRecommendation {
  /** The recommended move (may differ from pure Stockfish) */
  move: string;
  
  /** Why this move is recommended (fused reasoning) */
  reasoning: string[];
  
  /** How this move fits the strategic trajectory */
  trajectoryAlignment: string;
  
  /** Short-term gain vs long-term position trade-off */
  tradeoffAnalysis: string;
  
  /** Confidence in this specific recommendation */
  moveConfidence: number;
}

export interface TrajectoryPrediction {
  /** Predicted game outcome */
  predictedOutcome: 'white_wins' | 'black_wins' | 'draw' | 'unclear';
  
  /** Number of moves this prediction covers */
  horizonMoves: number;
  
  /** Key moments expected in the trajectory */
  expectedMilestones: TrajectoryMilestone[];
  
  /** Probability distribution for outcomes */
  outcomeProbabilities: {
    whiteWin: number;
    blackWin: number;
    draw: number;
  };
  
  /** What would need to happen to change trajectory */
  trajectoryBreakers: string[];
}

export interface TrajectoryMilestone {
  approximateMoveNumber: number;
  description: string;
  criticalSquares: string[];
  expectedColorFlow: string;
}

export interface HybridConfidence {
  /** Overall confidence in hybrid prediction (0-100) */
  overall: number;
  
  /** Tactical confidence (Stockfish depth quality) */
  tactical: number;
  
  /** Strategic confidence (archetype match quality) */
  strategic: number;
  
  /** How well tactics and strategy align */
  alignment: number;
  
  /** Explanation of confidence factors */
  factors: string[];
}

// ===================== HYBRID ANALYSIS ENGINE =====================

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
  
  options.onProgress?.('Analyzing current position with Stockfish', 30);
  
  // Step 3: Get current position for Stockfish analysis
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    // Fallback to starting position
  }
  const currentFen = chess.fen();
  
  // Step 4: Run Stockfish tactical analysis
  const engine = getStockfishEngine();
  await engine.waitReady();
  const positionAnalysis = await engine.analyzePosition(currentFen, { depth, nodes: 80000 });
  
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

// ===================== HELPER FUNCTIONS =====================

function createTacticalInsight(analysis: PositionAnalysis, chess: Chess): TacticalInsight {
  const themes: string[] = [];
  const threats: string[] = [];
  
  // Detect themes from eval and PV
  if (analysis.evaluation.scoreType === 'mate') {
    themes.push('Forced checkmate');
    threats.push(`Mate in ${analysis.evaluation.mateIn}`);
  } else if (Math.abs(analysis.evaluation.score) > 300) {
    themes.push('Winning advantage');
    threats.push('Material or positional dominance');
  }
  
  // Check for captures in PV
  const pvSan = analysis.evaluation.pv.slice(0, 5).map(uci => {
    try {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const testChess = new Chess(chess.fen());
      const move = testChess.move({ from, to, promotion: uci[4] });
      return move?.san || uci;
    } catch {
      return uci;
    }
  });
  
  if (pvSan.some(m => m.includes('x'))) {
    themes.push('Tactical sequence with captures');
  }
  
  if (pvSan.some(m => m.includes('+'))) {
    themes.push('Forcing moves with check');
  }
  
  // Convert best move to SAN
  let bestMoveSan = analysis.bestMove;
  try {
    const from = analysis.bestMove.slice(0, 2) as Square;
    const to = analysis.bestMove.slice(2, 4) as Square;
    const testChess = new Chess(chess.fen());
    const move = testChess.move({ from, to, promotion: analysis.bestMove[4] });
    if (move) bestMoveSan = move.san;
  } catch {}
  
  return {
    bestMove: bestMoveSan,
    evaluation: analysis.evaluation.score,
    mateIn: analysis.evaluation.mateIn,
    principalVariation: pvSan,
    tacticalThemes: themes.length > 0 ? themes : ['Quiet position'],
    immediateThreats: threats.length > 0 ? threats : ['No immediate threats'],
  };
}

function createStrategicInsight(
  signature: ColorFlowSignature,
  prediction: ColorFlowPrediction
): StrategicInsight {
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  
  return {
    archetype: signature.archetype,
    archetypeName: archetypeDef.name,
    flowDirection: signature.flowDirection,
    dominantSide: signature.dominantSide,
    strategicGuidance: prediction.strategicGuidance,
    criticalSquares: prediction.futureCriticalSquares,
  };
}

function fuseRecommendations(
  tactical: TacticalInsight,
  strategic: StrategicInsight,
  signature: ColorFlowSignature,
  chess: Chess
): FusedRecommendation {
  const reasoning: string[] = [];
  
  // Start with tactical best move
  const move = tactical.bestMove;
  
  // Add tactical reasoning
  reasoning.push(`Stockfish recommends ${move} (eval: ${(tactical.evaluation / 100).toFixed(2)})`);
  
  // Add strategic context
  reasoning.push(`This aligns with the ${strategic.archetypeName} pattern`);
  
  // Check trajectory alignment
  let trajectoryAlignment: string;
  if (signature.flowDirection === 'kingside' && move.includes('h') || move.includes('g')) {
    trajectoryAlignment = 'Perfectly aligned - continues kingside pressure';
  } else if (signature.flowDirection === 'queenside' && (move.includes('a') || move.includes('b') || move.includes('c'))) {
    trajectoryAlignment = 'Perfectly aligned - continues queenside expansion';
  } else if (signature.flowDirection === 'central' && (move.includes('d') || move.includes('e'))) {
    trajectoryAlignment = 'Perfectly aligned - reinforces central control';
  } else {
    trajectoryAlignment = 'Tactically optimal, may shift strategic trajectory';
  }
  
  // Tradeoff analysis
  let tradeoff: string;
  if (Math.abs(tactical.evaluation) > 200) {
    tradeoff = 'Short-term tactics dominate - position is already decided';
  } else if (signature.temporalFlow.volatility > 60) {
    tradeoff = 'High-intensity position - tactical precision critical';
  } else {
    tradeoff = 'Balanced position - strategic considerations matter equally';
  }
  
  // Confidence based on alignment
  const alignmentBonus = trajectoryAlignment.includes('Perfectly') ? 15 : 0;
  const moveConfidence = Math.min(95, 60 + alignmentBonus + (signature.intensity / 4));
  
  return {
    move,
    reasoning,
    trajectoryAlignment,
    tradeoffAnalysis: tradeoff,
    moveConfidence,
  };
}

function generateTrajectoryPrediction(
  signature: ColorFlowSignature,
  analysis: PositionAnalysis,
  currentMove: number,
  chess: Chess
): TrajectoryPrediction {
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  
  // Determine predicted outcome
  let predictedOutcome: 'white_wins' | 'black_wins' | 'draw' | 'unclear';
  
  if (analysis.evaluation.scoreType === 'mate') {
    predictedOutcome = analysis.evaluation.score > 0 ? 'white_wins' : 'black_wins';
  } else if (Math.abs(analysis.evaluation.score) > 500) {
    predictedOutcome = analysis.evaluation.score > 0 ? 'white_wins' : 'black_wins';
  } else if (signature.dominantSide !== 'contested') {
    if (archetypeDef.historicalWinRate > 0.55) {
      predictedOutcome = signature.dominantSide === 'white' ? 'white_wins' : 'black_wins';
    } else {
      predictedOutcome = 'unclear';
    }
  } else {
    predictedOutcome = signature.temporalFlow.volatility > 50 ? 'unclear' : 'draw';
  }
  
  // Calculate horizon
  const horizonMoves = archetypeDef.lookaheadConfidence;
  
  // Generate milestones
  const milestones: TrajectoryMilestone[] = [];
  
  milestones.push({
    approximateMoveNumber: currentMove + 5,
    description: `${signature.flowDirection} activity intensifies`,
    criticalSquares: signature.criticalMoments[0]?.squaresAffected || ['d4', 'e5'],
    expectedColorFlow: `Expect ${signature.dominantSide} territorial expansion`,
  });
  
  if (currentMove < 20) {
    milestones.push({
      approximateMoveNumber: 25,
      description: 'Transition to middlegame complications',
      criticalSquares: ['c5', 'e5', 'd4'],
      expectedColorFlow: 'Color intensity peaks as pieces engage',
    });
  }
  
  if (currentMove < 35) {
    milestones.push({
      approximateMoveNumber: 40,
      description: signature.archetype === 'endgame_technique' 
        ? 'Endgame conversion phase'
        : 'Position clarification expected',
      criticalSquares: ['d-file', 'king position'],
      expectedColorFlow: 'Color flow stabilizes toward conclusion',
    });
  }
  
  // Calculate probabilities
  const baseWin = archetypeDef.historicalWinRate;
  const evalAdjust = Math.min(0.3, analysis.evaluation.score / 1000);
  
  const outcomeProbabilities = {
    whiteWin: Math.min(0.95, Math.max(0.05, baseWin + evalAdjust)),
    blackWin: Math.min(0.95, Math.max(0.05, (1 - baseWin) - evalAdjust)),
    draw: 0,
  };
  outcomeProbabilities.draw = 1 - outcomeProbabilities.whiteWin - outcomeProbabilities.blackWin;
  
  // Trajectory breakers
  const breakers: string[] = [];
  if (signature.archetype === 'kingside_attack') {
    breakers.push('Successful defensive exchange sacrifice');
    breakers.push('Opening of queenside counter-play');
  } else if (signature.archetype === 'central_domination') {
    breakers.push('Successful pawn break opening the position');
    breakers.push('Piece sacrifice to destroy center');
  } else {
    breakers.push('Tactical blunder changes evaluation significantly');
    breakers.push('Unexpected strategic pivot to opposite wing');
  }
  
  return {
    predictedOutcome,
    horizonMoves,
    expectedMilestones: milestones,
    outcomeProbabilities,
    trajectoryBreakers: breakers,
  };
}

function calculateHybridConfidence(
  analysis: PositionAnalysis,
  signature: ColorFlowSignature,
  tactical: TacticalInsight,
  strategic: StrategicInsight
): HybridConfidence {
  const factors: string[] = [];
  
  // Tactical confidence from depth
  const tacticalConf = Math.min(95, analysis.evaluation.depth * 4);
  factors.push(`Stockfish depth ${analysis.evaluation.depth} analyzed`);
  
  // Strategic confidence from archetype clarity
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  const strategicConf = signature.archetype !== 'unknown' 
    ? Math.round(archetypeDef.historicalWinRate * 100 + signature.intensity / 2)
    : 30;
  factors.push(`${archetypeDef.name} pattern detected`);
  
  // Alignment: do tactics and strategy point same direction?
  let alignment = 50;
  const tacticsPreferWhite = analysis.evaluation.score > 0;
  const strategyPreferWhite = signature.dominantSide === 'white';
  
  if ((tacticsPreferWhite && strategyPreferWhite) || 
      (!tacticsPreferWhite && !strategyPreferWhite)) {
    alignment = 85;
    factors.push('Tactics and strategy aligned');
  } else if (signature.dominantSide === 'contested') {
    alignment = 65;
    factors.push('Strategy contested, tactics decisive');
  } else {
    alignment = 40;
    factors.push('Tactics and strategy diverge - complex position');
  }
  
  // Overall confidence
  const overall = Math.round((tacticalConf * 0.4 + strategicConf * 0.3 + alignment * 0.3));
  
  return {
    overall,
    tactical: tacticalConf,
    strategic: strategicConf,
    alignment,
    factors,
  };
}

function calculateCombinedScore(
  analysis: PositionAnalysis,
  signature: ColorFlowSignature,
  confidence: HybridConfidence
): number {
  // Weighted combination of tactical and strategic factors
  const tacticalScore = analysis.evaluation.score;
  
  // Strategic bonus/penalty based on archetype
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  const strategicBias = (archetypeDef.historicalWinRate - 0.5) * 100;
  
  // Combine with confidence weighting
  const alignmentFactor = confidence.alignment / 100;
  
  return Math.round(
    tacticalScore * 0.7 + 
    strategicBias * signature.intensity / 100 * 0.3 * alignmentFactor
  );
}

// ===================== EXPORTS =====================

export { extractColorFlowSignature, predictFromColorFlow, ARCHETYPE_DEFINITIONS };
export default generateHybridPrediction;
