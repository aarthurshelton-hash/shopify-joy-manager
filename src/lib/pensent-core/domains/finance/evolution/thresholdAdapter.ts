/**
 * Threshold Adapter - Dynamically adjusts thresholds based on performance
 */

import { AdaptiveThresholds, EvolutionMetrics } from './types';

export const DEFAULT_THRESHOLDS: AdaptiveThresholds = {
  confidenceMinimum: 0.55,
  correlationSignificance: 0.3,
  volumeSpikeFactor: 1.5,
  volatilityAdjustment: 1.0,
  predictionHorizonMs: 5000
};

export function adaptThresholds(
  thresholds: AdaptiveThresholds,
  metrics: EvolutionMetrics
): AdaptiveThresholds {
  const { currentFitness, learningVelocity } = metrics;
  const newThresholds = { ...thresholds };
  
  // If doing well, be more aggressive
  if (currentFitness > 0.65 && learningVelocity >= 0) {
    newThresholds.confidenceMinimum = Math.max(0.5, thresholds.confidenceMinimum - 0.01);
  }
  
  // If doing poorly, be more conservative
  if (currentFitness < 0.45) {
    newThresholds.confidenceMinimum = Math.min(0.75, thresholds.confidenceMinimum + 0.02);
  }
  
  // Adjust prediction horizon based on success at different timeframes
  if (learningVelocity > 0.1) {
    newThresholds.predictionHorizonMs = Math.max(2000, thresholds.predictionHorizonMs * 0.95);
  } else if (learningVelocity < -0.1) {
    newThresholds.predictionHorizonMs = Math.min(15000, thresholds.predictionHorizonMs * 1.05);
  }
  
  return newThresholds;
}
