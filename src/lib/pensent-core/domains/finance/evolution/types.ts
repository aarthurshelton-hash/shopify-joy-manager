/**
 * Self-Evolving Learning System - Type Definitions
 */

export interface EvolutionMetrics {
  generationNumber: number;
  startedAt: number;
  totalPredictions: number;
  successfulEvolutions: number;
  currentFitness: number;
  peakFitness: number;
  learningVelocity: number;
  adaptationRate: number;
}

export interface LearningGene {
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  mutationRate: number;
  lastMutation: number;
  performanceImpact: number;
}

export interface EvolutionState {
  metrics: EvolutionMetrics;
  genes: LearningGene[];
  correlationMemory: CorrelationMemory[];
  patternLibrary: LearnedPattern[];
  adaptiveThresholds: AdaptiveThresholds;
  recentMutations: Mutation[];
}

export interface CorrelationMemory {
  market1: string;
  market2: string;
  observedCorrelations: number[];
  predictedCorrelation: number;
  actualCorrelation: number;
  accuracy: number;
  lastUpdated: number;
}

export interface LearnedPattern {
  id: string;
  name: string;
  conditions: PatternCondition[];
  predictedOutcome: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  occurrences: number;
  successRate: number;
  discoveredAt: number;
  lastSeen: number;
}

export interface PatternCondition {
  market: string;
  indicator: 'price_change' | 'volume_spike' | 'correlation_shift' | 'volatility';
  operator: '>' | '<' | '=' | 'between';
  value: number | [number, number];
}

export interface AdaptiveThresholds {
  confidenceMinimum: number;
  correlationSignificance: number;
  volumeSpikeFactor: number;
  volatilityAdjustment: number;
  predictionHorizonMs: number;
}

export interface Mutation {
  gene: string;
  previousValue: number;
  newValue: number;
  timestamp: number;
  reason: string;
  resultingFitness: number;
}

export interface MarketConditions {
  correlationStrength: number;
  volatility: number;
  momentum: number;
  leadingSignals: number;
}

export interface PredictionOutcome {
  predicted: 'up' | 'down' | 'neutral';
  actual: 'up' | 'down' | 'neutral';
  confidence: number;
  marketConditions: MarketConditions;
}
