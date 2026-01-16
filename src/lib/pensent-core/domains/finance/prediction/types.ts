/**
 * Tick Prediction Engine - Type Definitions
 */

export interface Tick {
  price: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
}

export interface MultiLevelAccuracy {
  direction: number;
  magnitude: number;
  timing: number;
  confidence: number;
  composite: number;
}

export interface TickPrediction {
  id: string;
  timestamp: number;
  predictedDirection: 'up' | 'down' | 'flat';
  confidence: number;
  horizonMs: number;
  priceAtPrediction: number;
  targetPrice?: number;
  predictedMagnitude?: number;
  expiresAt: number;
  resolved?: boolean;
  wasCorrect?: boolean;
  actualDirection?: 'up' | 'down' | 'flat';
  actualPrice?: number;
  accuracyLevels?: MultiLevelAccuracy;
}

export interface MultiLevelPerformance {
  direction: { correct: number; total: number; accuracy: number };
  magnitude: { avgScore: number; samples: number };
  timing: { avgScore: number; samples: number };
  confidenceCalibration: { predicted: number; actual: number; calibrationError: number };
  composite: { avgScore: number; trend: number };
}

export interface LearningState {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  recentAccuracy: number;
  confidenceMultiplier: number;
  adaptiveHorizonMs: number;
  volatilityState: 'low' | 'medium' | 'high' | 'extreme';
  momentumBias: number;
  lastUpdate: number;
  multiLevel: MultiLevelPerformance;
}

export interface EngineConfig {
  minHorizonMs: number;
  maxHorizonMs: number;
  baseConfidence: number;
  learningRate: number;
  volatilityWindow: number;
  momentumWindow: number;
  minTicksForPrediction: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  minHorizonMs: 1000,
  maxHorizonMs: 30000,
  baseConfidence: 50,
  learningRate: 0.15,
  volatilityWindow: 50,
  momentumWindow: 20,
  minTicksForPrediction: 10
};
