/**
 * Strategic Insight Generator
 * 
 * Creates strategic insights from Color Flow analysis
 */

import { 
  ColorFlowSignature, 
  ColorFlowPrediction, 
  ARCHETYPE_DEFINITIONS 
} from '../colorFlowAnalysis';
import { StrategicInsight } from './types';

/**
 * Create strategic insight from color flow signature and prediction
 */
export function createStrategicInsight(
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
