/**
 * Hybrid Confidence Calculator v3.0 (COMPOUND INTELLIGENCE)
 * 
 * v3.0: Integrated with Intelligence Compounding System
 * - Live confidence calibration from rolling accuracy
 * - Disagreement amplifier for archetypes that beat Stockfish
 * - Temporal decay weighting (recent predictions matter more)
 */

import { PositionAnalysis } from '../stockfishEngine';
import { ColorFlowSignature, ARCHETYPE_DEFINITIONS } from '../colorFlowAnalysis';
import { TacticalInsight, StrategicInsight, HybridConfidence } from './types';
import { 
  getCalibratedConfidence, 
  getIntelligenceMetrics,
  initializeFromDatabase 
} from '../accuracy/intelligenceCompounding';

// In-memory accuracy tracker (gets populated from database on first load)
let accuracyCache: {
  totalPredictions: number;
  correctPredictions: number;
  lastUpdated: number;
} = {
  totalPredictions: 0,
  correctPredictions: 0,
  lastUpdated: 0,
};

// Initialize intelligence system on module load
let initPromise: Promise<void> | null = null;
function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeFromDatabase();
  }
  return initPromise;
}

/**
 * Update accuracy cache from external source (called by benchmark system)
 */
export function updateAccuracyCache(total: number, correct: number): void {
  accuracyCache = {
    totalPredictions: total,
    correctPredictions: correct,
    lastUpdated: Date.now(),
  };
  console.log(`[ConfidenceCalc] Accuracy cache updated: ${correct}/${total} = ${total > 0 ? ((correct/total)*100).toFixed(1) : 0}%`);
}

/**
 * Get current actual accuracy (0-100)
 */
function getActualAccuracy(): number {
  if (accuracyCache.totalPredictions < 10) {
    // Not enough data - return baseline (random would be ~33.3% for 3-way)
    return 33.3;
  }
  return (accuracyCache.correctPredictions / accuracyCache.totalPredictions) * 100;
}

/**
 * Calculate hybrid prediction confidence metrics
 * 
 * v2.0: Confidence is now GROUNDED in actual performance:
 * - Base confidence starts at actual accuracy %
 * - Theoretical factors can only SLIGHTLY modify, not override
 * - Until accuracy exceeds 50%, confidence stays capped
 */
export function calculateHybridConfidence(
  analysis: PositionAnalysis,
  signature: ColorFlowSignature,
  tactical: TacticalInsight,
  strategic: StrategicInsight
): HybridConfidence {
  const factors: string[] = [];
  
  // Ensure intelligence system is initializing
  ensureInitialized();
  
  // PRIMARY: Actual accuracy is the foundation
  const actualAccuracy = getActualAccuracy();
  factors.push(`Historical accuracy: ${actualAccuracy.toFixed(1)}%`);
  
  // SECONDARY: Tactical quality (minor modifier, max ±5%)
  const depthQuality = Math.min(1, analysis.evaluation.depth / 25); // 0-1 scale
  const tacticalModifier = (depthQuality - 0.5) * 10; // -5 to +5
  const tacticalConf = Math.max(20, Math.min(95, actualAccuracy + tacticalModifier));
  factors.push(`Depth ${analysis.evaluation.depth} (${tacticalModifier > 0 ? '+' : ''}${tacticalModifier.toFixed(1)}%)`);
  
  // SECONDARY: Archetype clarity (minor modifier, max ±5%)
  const archetypeDef = ARCHETYPE_DEFINITIONS[signature.archetype];
  const archetypeModifier = signature.archetype !== 'unknown' 
    ? (archetypeDef.historicalWinRate - 0.5) * 10 + signature.intensity / 20
    : -5;
  const strategicConf = Math.max(20, Math.min(95, actualAccuracy + archetypeModifier));
  factors.push(`${archetypeDef.name} archetype (${archetypeModifier > 0 ? '+' : ''}${archetypeModifier.toFixed(1)}%)`);
  
  // Alignment: do tactics and strategy point same direction?
  const alignment = calculateAlignment(analysis, signature, factors);
  const alignmentModifier = (alignment - 50) / 10; // -1 to +3.5
  
  // BASE: Actual accuracy + small modifiers
  const baseConfidence = actualAccuracy + (tacticalModifier + archetypeModifier + alignmentModifier) / 3;
  
  // v3.0: APPLY COMPOUND INTELLIGENCE CALIBRATION
  const calibrated = getCalibratedConfidence(signature.archetype, baseConfidence);
  factors.push(...calibrated.factors);
  
  // Log intelligence metrics periodically
  const metrics = getIntelligenceMetrics();
  if (metrics.isLearning && Math.random() < 0.1) {
    console.log(`[Intelligence] Learning active: ${metrics.archetypeCount} archetypes, ${(metrics.globalDisagreementWinRate * 100).toFixed(0)}% disagreement wins`);
  }
  
  const maxConfidence = Math.min(95, actualAccuracy + 15); // Allow +15% with compounding
  const overall = Math.round(Math.max(20, Math.min(maxConfidence, calibrated.confidence)));
  
  return {
    overall,
    tactical: Math.round(tacticalConf),
    strategic: Math.round(strategicConf),
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
