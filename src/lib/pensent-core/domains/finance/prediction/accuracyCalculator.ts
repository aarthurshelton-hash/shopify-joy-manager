/**
 * Accuracy Calculator - Multi-level accuracy scoring for predictions
 */

import { TickPrediction, MultiLevelAccuracy } from './types';

export function calculateMultiLevelAccuracy(
  prediction: TickPrediction,
  actualDirection: 'up' | 'down' | 'flat',
  actualMagnitude: number
): MultiLevelAccuracy {
  // Level 1: Direction accuracy (binary)
  const directionScore = prediction.predictedDirection === actualDirection ? 100 : 0;
  
  // Level 2: Magnitude accuracy
  const predictedMagnitude = prediction.predictedMagnitude || 
    (prediction.targetPrice 
      ? Math.abs((prediction.targetPrice - prediction.priceAtPrediction) / prediction.priceAtPrediction) * 100
      : 0);
  
  let magnitudeScore = 0;
  if (predictedMagnitude > 0) {
    const magnitudeError = Math.abs(actualMagnitude - predictedMagnitude);
    magnitudeScore = Math.max(0, 100 - (magnitudeError / predictedMagnitude) * 100);
  } else if (actualMagnitude < 0.01) {
    magnitudeScore = 80;
  }
  
  // Level 3: Timing accuracy
  const timingElapsed = Date.now() - prediction.timestamp;
  const timingError = Math.abs(timingElapsed - prediction.horizonMs);
  const timingTolerance = prediction.horizonMs * 0.3;
  const timingScore = Math.max(0, 100 - (timingError / timingTolerance) * 50);
  
  // Level 4: Confidence calibration
  const wasCorrect = prediction.predictedDirection === actualDirection;
  const confidenceAligned = wasCorrect ? prediction.confidence : (100 - prediction.confidence);
  const confidenceScore = confidenceAligned;
  
  // Composite score (weighted average)
  const composite = (
    directionScore * 0.40 +
    magnitudeScore * 0.25 +
    timingScore * 0.15 +
    confidenceScore * 0.20
  );
  
  return {
    direction: directionScore,
    magnitude: Math.round(magnitudeScore),
    timing: Math.round(timingScore),
    confidence: Math.round(confidenceScore),
    composite: Math.round(composite)
  };
}
