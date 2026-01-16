/**
 * Trajectory Prediction Generator
 * 
 * Generates game trajectory predictions from hybrid analysis
 */

import { Chess } from 'chess.js';
import { PositionAnalysis } from '../stockfishEngine';
import { ColorFlowSignature, ARCHETYPE_DEFINITIONS } from '../colorFlowAnalysis';
import { TrajectoryPrediction, TrajectoryMilestone } from './types';

/**
 * Generate trajectory prediction for the game
 */
export function generateTrajectoryPrediction(
  signature: ColorFlowSignature,
  analysis: PositionAnalysis,
  currentMove: number,
  chess: Chess
): TrajectoryPrediction {
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  
  // Determine predicted outcome
  const predictedOutcome = determinePredictedOutcome(signature, analysis, archetypeDef);
  
  // Calculate horizon
  const horizonMoves = archetypeDef.lookaheadConfidence;
  
  // Generate milestones
  const milestones = generateMilestones(signature, currentMove);
  
  // Calculate probabilities
  const outcomeProbabilities = calculateOutcomeProbabilities(archetypeDef, analysis);
  
  // Trajectory breakers
  const trajectoryBreakers = getTrajectoryBreakers(signature);
  
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
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS]
): 'white_wins' | 'black_wins' | 'draw' | 'unclear' {
  if (analysis.evaluation.scoreType === 'mate') {
    return analysis.evaluation.score > 0 ? 'white_wins' : 'black_wins';
  }
  
  if (Math.abs(analysis.evaluation.score) > 500) {
    return analysis.evaluation.score > 0 ? 'white_wins' : 'black_wins';
  }
  
  if (signature.dominantSide !== 'contested') {
    if (archetypeDef.historicalWinRate > 0.55) {
      return signature.dominantSide === 'white' ? 'white_wins' : 'black_wins';
    }
    return 'unclear';
  }
  
  return signature.temporalFlow.volatility > 50 ? 'unclear' : 'draw';
}

function generateMilestones(
  signature: ColorFlowSignature,
  currentMove: number
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
  
  return milestones;
}

function calculateOutcomeProbabilities(
  archetypeDef: typeof ARCHETYPE_DEFINITIONS[keyof typeof ARCHETYPE_DEFINITIONS],
  analysis: PositionAnalysis
): { whiteWin: number; blackWin: number; draw: number } {
  const baseWin = archetypeDef.historicalWinRate;
  const evalAdjust = Math.min(0.3, analysis.evaluation.score / 1000);
  
  const whiteWin = Math.min(0.95, Math.max(0.05, baseWin + evalAdjust));
  const blackWin = Math.min(0.95, Math.max(0.05, (1 - baseWin) - evalAdjust));
  const draw = 1 - whiteWin - blackWin;
  
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
