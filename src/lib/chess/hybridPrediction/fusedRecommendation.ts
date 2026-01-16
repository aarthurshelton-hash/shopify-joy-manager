/**
 * Fused Recommendation Generator
 * 
 * Combines tactical and strategic analysis into unified recommendations
 */

import { Chess } from 'chess.js';
import { ColorFlowSignature } from '../colorFlowAnalysis';
import { TacticalInsight, StrategicInsight, FusedRecommendation } from './types';

/**
 * Fuse tactical and strategic recommendations
 */
export function fuseRecommendations(
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
