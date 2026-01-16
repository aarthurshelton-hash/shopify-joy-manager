/**
 * Learning State Manager - Manages prediction learning state updates
 */

import { LearningState, MultiLevelAccuracy, TickPrediction, EngineConfig, MultiLevelPerformance } from './types';

export function createInitialLearningState(): LearningState {
  return {
    totalPredictions: 0,
    correctPredictions: 0,
    accuracy: 0,
    streak: 0,
    bestStreak: 0,
    recentAccuracy: 0,
    confidenceMultiplier: 1.0,
    adaptiveHorizonMs: 5000,
    volatilityState: 'medium',
    momentumBias: 0,
    lastUpdate: Date.now(),
    multiLevel: createInitialMultiLevel()
  };
}

function createInitialMultiLevel(): MultiLevelPerformance {
  return {
    direction: { correct: 0, total: 0, accuracy: 0 },
    magnitude: { avgScore: 0, samples: 0 },
    timing: { avgScore: 0, samples: 0 },
    confidenceCalibration: { predicted: 0, actual: 0, calibrationError: 0 },
    composite: { avgScore: 0, trend: 0 }
  };
}

export function updateLearningState(
  state: LearningState,
  wasCorrect: boolean,
  prediction: TickPrediction,
  accuracyLevels: MultiLevelAccuracy | undefined,
  recentResults: boolean[],
  config: EngineConfig
): LearningState {
  const newState = { ...state };
  
  newState.totalPredictions++;
  if (wasCorrect) {
    newState.correctPredictions++;
    newState.streak++;
    newState.bestStreak = Math.max(newState.bestStreak, newState.streak);
  } else {
    newState.streak = 0;
  }
  
  newState.accuracy = (newState.correctPredictions / newState.totalPredictions) * 100;
  newState.recentAccuracy = (recentResults.filter(r => r).length / Math.max(recentResults.length, 1)) * 100;
  
  if (accuracyLevels) {
    updateMultiLevel(newState, accuracyLevels, prediction);
  }
  
  // Adapt confidence multiplier
  if (newState.recentAccuracy > 70) {
    newState.confidenceMultiplier = Math.min(1.5, newState.confidenceMultiplier + config.learningRate * 0.1);
  } else if (newState.recentAccuracy < 45) {
    newState.confidenceMultiplier = Math.max(0.6, newState.confidenceMultiplier - config.learningRate * 0.1);
  }
  
  // Adapt prediction horizon
  const compositeScore = newState.multiLevel.composite.avgScore;
  if (compositeScore > 65 && newState.adaptiveHorizonMs > config.minHorizonMs) {
    newState.adaptiveHorizonMs = Math.max(config.minHorizonMs, newState.adaptiveHorizonMs - 500);
  } else if (compositeScore < 45 && newState.adaptiveHorizonMs < config.maxHorizonMs) {
    newState.adaptiveHorizonMs = Math.min(config.maxHorizonMs, newState.adaptiveHorizonMs + 500);
  }
  
  // Update momentum bias
  if (wasCorrect && prediction.predictedDirection === 'up') {
    newState.momentumBias = Math.min(1, newState.momentumBias + config.learningRate);
  } else if (wasCorrect && prediction.predictedDirection === 'down') {
    newState.momentumBias = Math.max(-1, newState.momentumBias - config.learningRate);
  } else {
    newState.momentumBias *= 0.9;
  }
  
  newState.lastUpdate = Date.now();
  return newState;
}

function updateMultiLevel(state: LearningState, accuracyLevels: MultiLevelAccuracy, prediction: TickPrediction): void {
  const ml = state.multiLevel;
  
  // Direction tracking
  ml.direction.total++;
  if (accuracyLevels.direction === 100) ml.direction.correct++;
  ml.direction.accuracy = (ml.direction.correct / ml.direction.total) * 100;
  
  // Magnitude tracking
  ml.magnitude.samples++;
  ml.magnitude.avgScore = (
    (ml.magnitude.avgScore * (ml.magnitude.samples - 1) + accuracyLevels.magnitude) / ml.magnitude.samples
  );
  
  // Timing tracking
  ml.timing.samples++;
  ml.timing.avgScore = (
    (ml.timing.avgScore * (ml.timing.samples - 1) + accuracyLevels.timing) / ml.timing.samples
  );
  
  // Confidence calibration
  ml.confidenceCalibration.predicted = (
    (ml.confidenceCalibration.predicted * (state.totalPredictions - 1) + prediction.confidence) / state.totalPredictions
  );
  ml.confidenceCalibration.actual = (state.correctPredictions / state.totalPredictions) * 100;
  ml.confidenceCalibration.calibrationError = Math.abs(
    ml.confidenceCalibration.predicted - ml.confidenceCalibration.actual
  );
  
  // Composite tracking
  const prevComposite = ml.composite.avgScore;
  ml.composite.avgScore = (
    (ml.composite.avgScore * (state.totalPredictions - 1) + accuracyLevels.composite) / state.totalPredictions
  );
  ml.composite.trend = ml.composite.avgScore - prevComposite;
}
