/**
 * Trajectory Prediction Generator v7.75
 * 
 * Generates game trajectory predictions from hybrid analysis
 * - Phase Specialization for improved accuracy
 * - White Win Calibration to fix systematic under-prediction of white wins
 */

import { Chess } from 'chess.js';
import { PositionAnalysis } from '../stockfishEngine';
import { ColorFlowSignature, ARCHETYPE_DEFINITIONS } from '../colorFlowAnalysis';
import { TrajectoryPrediction, TrajectoryMilestone } from './types';
import { 
  getPhaseSpecializedPrediction, 
  getPhaseOptimalHorizon,
  isArchetypePhaseMatch 
} from '../accuracy/phaseSpecialization';
import { detectGamePhase } from '../accuracy/temporalPhaseWeighting';
import { calibrateForWhiteBias } from '../accuracy/whiteWinCalibration';

/**
 * Count pieces on the board for phase detection
 */
function countPieces(chess: Chess): number {
  const board = chess.board();
  let count = 0;
  for (const row of board) {
    for (const sq of row) {
      if (sq) count++;
    }
  }
  return count;
}

/**
 * Generate trajectory prediction for the game
 * v7.61: Uses phase-specialized prediction models
 */
export function generateTrajectoryPrediction(
  signature: ColorFlowSignature,
  analysis: PositionAnalysis,
  currentMove: number,
  chess: Chess
): TrajectoryPrediction {
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  const pieceCount = countPieces(chess);
  const phase = detectGamePhase(currentMove, pieceCount);
  
  // v7.61: Get phase-specialized prediction
  const phaseSpecialized = getPhaseSpecializedPrediction(
    signature,
    archetypeDef.historicalWinRate,
    currentMove,
    pieceCount
  );
  
  // Determine predicted outcome using phase-adjusted win rate
  const predictedOutcome = determinePredictedOutcome(
    signature, 
    analysis, 
    archetypeDef,
    phaseSpecialized.phaseAdjustedWinRate,
    phaseSpecialized.shouldPredict
  );
  
  // v7.61: Use phase-optimal horizon
  const horizonMoves = getPhaseOptimalHorizon(phase);
  
  // Generate milestones
  const milestones = generateMilestones(signature, currentMove, phase);
  
  // Calculate probabilities using phase-adjusted rates
  const outcomeProbabilities = calculateOutcomeProbabilities(
    archetypeDef, 
    analysis,
    phaseSpecialized.phaseAdjustedWinRate
  );
  
  // Trajectory breakers
  const trajectoryBreakers = getTrajectoryBreakers(signature);
  
  // v7.61: Add phase info to breakers
  if (!isArchetypePhaseMatch(signature.archetype, phase)) {
    trajectoryBreakers.unshift(`⚠️ ${signature.archetype} archetype unreliable in ${phase} phase`);
  }
  
  return {
    predictedOutcome,
    horizonMoves,
    expectedMilestones: milestones,
    outcomeProbabilities,
    trajectoryBreakers,
  };
}

function determinePredictedOutcome(
  signature: ColorFlowSignature,
  analysis: PositionAnalysis,
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS],
  phaseAdjustedWinRate?: number,
  shouldPredict: boolean = true
): 'white_wins' | 'black_wins' | 'draw' | 'unclear' {
  // Forced outcomes: mate or decisive material
  if (analysis.evaluation.scoreType === 'mate') {
    return analysis.evaluation.score > 0 ? 'white_wins' : 'black_wins';
  }
  
  if (Math.abs(analysis.evaluation.score) > 500) {
    return analysis.evaluation.score > 0 ? 'white_wins' : 'black_wins';
  }
  
  // v7.61: If phase reliability is too low, abstain
  if (!shouldPredict) {
    return 'unclear';
  }
  
  // Use phase-adjusted win rate if available
  const effectiveWinRate = phaseAdjustedWinRate ?? archetypeDef.historicalWinRate;
  
  // v7.61: Phase-specialized thresholds
  let rawPrediction: 'white_wins' | 'black_wins' | 'draw' | 'unclear';
  
  if (signature.dominantSide !== 'contested') {
    // Higher threshold = more confident predictions
    if (effectiveWinRate > 0.58) {
      rawPrediction = signature.dominantSide === 'white' ? 'white_wins' : 'black_wins';
    } else if (effectiveWinRate < 0.42) {
      rawPrediction = signature.dominantSide === 'white' ? 'black_wins' : 'white_wins';
    } else if (signature.temporalFlow.volatility < 30) {
      rawPrediction = 'draw';  // Low volatility + uncertain = draw likely
    } else {
      rawPrediction = 'unclear';
    }
  } else {
    rawPrediction = signature.temporalFlow.volatility > 50 ? 'unclear' : 'draw';
  }
  
  // v7.75: Apply white win calibration to fix systematic bias
  // Calculate a rough confidence from effective win rate distance from 0.5
  const rawConfidence = Math.abs(effectiveWinRate - 0.5) * 200; // 0-100 scale
  
  const calibrated = calibrateForWhiteBias(
    rawPrediction,
    signature.archetype,
    signature.dominantSide,
    analysis.evaluation.score,
    rawConfidence
  );
  
  // Log significant calibration adjustments
  if (calibrated.adjustmentMagnitude !== 0) {
    console.log(`[WhiteWinCalibration] ${rawPrediction} → ${calibrated.calibratedPrediction}: ${calibrated.adjustmentApplied}`);
  }
  
  return calibrated.calibratedPrediction;
}

function generateMilestones(
  signature: ColorFlowSignature,
  currentMove: number,
  phase?: string
): TrajectoryMilestone[] {
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
  
  // v7.61: Add phase-specific milestone if in endgame
  if (phase === 'endgame' || phase === 'deep_endgame') {
    milestones.push({
      approximateMoveNumber: currentMove + 15,
      description: 'Technique conversion window',
      criticalSquares: ['king activity', 'passed pawns'],
      expectedColorFlow: 'High reliability phase - patterns crystallized',
    });
  }
  
  return milestones;
}

function calculateOutcomeProbabilities(
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS],
  analysis: PositionAnalysis,
  phaseAdjustedWinRate?: number
): { whiteWin: number; blackWin: number; draw: number } {
  // v7.61: Use phase-adjusted rate if available
  const baseWin = phaseAdjustedWinRate ?? archetypeDef.historicalWinRate;
  const evalAdjust = Math.min(0.3, analysis.evaluation.score / 1000);
  
  const whiteWin = Math.min(0.95, Math.max(0.05, baseWin + evalAdjust));
  const blackWin = Math.min(0.95, Math.max(0.05, (1 - baseWin) - evalAdjust));
  const draw = Math.max(0, 1 - whiteWin - blackWin);
  
  return { whiteWin, blackWin, draw };
}

function getTrajectoryBreakers(signature: ColorFlowSignature): string[] {
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
  
  return breakers;
}
