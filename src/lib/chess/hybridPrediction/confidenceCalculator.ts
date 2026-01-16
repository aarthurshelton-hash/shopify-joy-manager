/**
 * Hybrid Confidence Calculator
 * 
 * Calculates confidence metrics for hybrid predictions
 */

import { PositionAnalysis } from '../stockfishEngine';
import { ColorFlowSignature, ARCHETYPE_DEFINITIONS } from '../colorFlowAnalysis';
import { TacticalInsight, StrategicInsight, HybridConfidence } from './types';

/**
 * Calculate hybrid prediction confidence metrics
 */
export function calculateHybridConfidence(
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
  const alignment = calculateAlignment(analysis, signature, factors);
  
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

function calculateAlignment(
  analysis: PositionAnalysis,
  signature: ColorFlowSignature,
  factors: string[]
): number {
  const tacticsPreferWhite = analysis.evaluation.score > 0;
  const strategyPreferWhite = signature.dominantSide === 'white';
  
  if ((tacticsPreferWhite && strategyPreferWhite) || 
      (!tacticsPreferWhite && !strategyPreferWhite)) {
    factors.push('Tactics and strategy aligned');
    return 85;
  }
  
  if (signature.dominantSide === 'contested') {
    factors.push('Strategy contested, tactics decisive');
    return 65;
  }
  
  factors.push('Tactics and strategy diverge - complex position');
  return 40;
}

/**
 * Calculate combined score from all analysis factors
 */
export function calculateCombinedScore(
  analysis: PositionAnalysis,
  signature: ColorFlowSignature,
  confidence: HybridConfidence
): number {
  const tacticalScore = analysis.evaluation.score;
  
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  const strategicBias = (archetypeDef.historicalWinRate - 0.5) * 100;
  
  const alignmentFactor = confidence.alignment / 100;
  
  return Math.round(
    tacticalScore * 0.7 + 
    strategicBias * signature.intensity / 100 * 0.3 * alignmentFactor
  );
}
