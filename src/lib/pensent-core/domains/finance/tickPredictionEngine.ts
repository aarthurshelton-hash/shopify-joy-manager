/**
 * En Pensent™ Tick Prediction Engine
 * Real-time scalping predictions with adaptive learning
 * 
 * Refactored: Modular architecture with separated concerns
 */

import {
  Tick,
  TickPrediction,
  LearningState,
  EngineConfig,
  DEFAULT_ENGINE_CONFIG
} from './prediction/types';
import {
  calculateMomentum,
  calculateVolatility,
  detectMicroTrend,
  analyzeVolumePattern,
  getVolatilityState
} from './prediction/marketAnalysis';
import { calculateMultiLevelAccuracy } from './prediction/accuracyCalculator';
import { createInitialLearningState, updateLearningState } from './prediction/learningStateManager';

// Re-export types for backwards compatibility
export * from './prediction/types';

export class TickPredictionEngine {
  private ticks: Tick[] = [];
  private predictions: Map<string, TickPrediction> = new Map();
  private learningState: LearningState;
  private config: EngineConfig;
  private recentResults: boolean[] = [];
  
  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.learningState = createInitialLearningState();
  }
  
  processTick(tick: Tick): void {
    this.ticks.push(tick);
    if (this.ticks.length > 500) {
      this.ticks.shift();
    }
    this.updateMarketState();
    this.resolveExpiredPredictions(tick);
  }
  
  generatePrediction(horizonMs?: number): TickPrediction | null {
    if (this.ticks.length < this.config.minTicksForPrediction) {
      return null;
    }
    
    const effectiveHorizon = horizonMs || this.learningState.adaptiveHorizonMs;
    const currentTick = this.ticks[this.ticks.length - 1];
    
    const momentum = calculateMomentum(this.ticks, this.config.momentumWindow);
    const volatility = calculateVolatility(this.ticks, this.config.volatilityWindow);
    const microTrend = detectMicroTrend(this.ticks);
    const volumeSignal = analyzeVolumePattern(this.ticks);
    
    let signalSum = momentum * 0.35 + microTrend * 0.30 + volumeSignal * 0.20 + this.learningState.momentumBias * 0.15;
    
    let direction: 'up' | 'down' | 'flat';
    if (signalSum > 0.15) direction = 'up';
    else if (signalSum < -0.15) direction = 'down';
    else direction = 'flat';
    
    let confidence = this.calculateConfidence(signalSum, volatility);
    
    const avgMove = volatility * (effectiveHorizon / 1000);
    const targetPrice = direction === 'up' 
      ? currentTick.price * (1 + avgMove)
      : direction === 'down' ? currentTick.price * (1 - avgMove) : currentTick.price;
    
    const prediction: TickPrediction = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      predictedDirection: direction,
      confidence: Math.round(confidence),
      horizonMs: effectiveHorizon,
      priceAtPrediction: currentTick.price,
      targetPrice,
      expiresAt: Date.now() + effectiveHorizon
    };
    
    this.predictions.set(prediction.id, prediction);
    return prediction;
  }
  
  private calculateConfidence(signalStrength: number, volatility: number): number {
    const absSignal = Math.abs(signalStrength);
    let confidence = this.config.baseConfidence + (absSignal * 40);
    confidence *= this.learningState.confidenceMultiplier;
    
    if (this.learningState.volatilityState === 'extreme') confidence *= 0.7;
    else if (this.learningState.volatilityState === 'low') confidence *= 1.1;
    
    if (this.learningState.streak >= 5) {
      confidence *= 1 + (this.learningState.streak * 0.02);
    }
    
    return Math.min(95, Math.max(25, confidence));
  }
  
  private resolveExpiredPredictions(currentTick: Tick): void {
    const now = Date.now();
    
    for (const [id, pred] of this.predictions) {
      if (pred.resolved || pred.expiresAt > now) continue;
      
      const priceDiff = currentTick.price - pred.priceAtPrediction;
      const percentChange = (priceDiff / pred.priceAtPrediction) * 100;
      const actualMagnitude = Math.abs(percentChange);
      
      let actualDirection: 'up' | 'down' | 'flat';
      const flatThreshold = 0.01;
      
      if (percentChange > flatThreshold) actualDirection = 'up';
      else if (percentChange < -flatThreshold) actualDirection = 'down';
      else actualDirection = 'flat';
      
      const wasCorrect = pred.predictedDirection === actualDirection;
      const accuracyLevels = calculateMultiLevelAccuracy(pred, actualDirection, actualMagnitude);
      
      pred.resolved = true;
      pred.wasCorrect = wasCorrect;
      pred.actualDirection = actualDirection;
      pred.actualPrice = currentTick.price;
      pred.accuracyLevels = accuracyLevels;
      
      this.recentResults.push(wasCorrect);
      if (this.recentResults.length > 20) this.recentResults.shift();
      
      this.learningState = updateLearningState(
        this.learningState,
        wasCorrect,
        pred,
        accuracyLevels,
        this.recentResults,
        this.config
      );
    }
    
    this.cleanupOldPredictions();
  }
  
  private cleanupOldPredictions(): void {
    const resolved = Array.from(this.predictions.values())
      .filter(p => p.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (resolved.length > 100) {
      for (const old of resolved.slice(100)) {
        this.predictions.delete(old.id);
      }
    }
  }
  
  private updateMarketState(): void {
    const volatility = calculateVolatility(this.ticks, this.config.volatilityWindow);
    this.learningState.volatilityState = getVolatilityState(volatility);
  }
  
  getState(): LearningState { return { ...this.learningState }; }
  getPendingPredictions(): TickPrediction[] {
    return Array.from(this.predictions.values()).filter(p => !p.resolved).sort((a, b) => a.expiresAt - b.expiresAt);
  }
  getRecentPredictions(count: number = 20): TickPrediction[] {
    return Array.from(this.predictions.values()).filter(p => p.resolved).sort((a, b) => b.timestamp - a.timestamp).slice(0, count);
  }
  getStats() {
    const resolved = Array.from(this.predictions.values()).filter(p => p.resolved);
    const calcStats = (preds: TickPrediction[]) => ({
      total: preds.length,
      correct: preds.filter(p => p.wasCorrect).length,
      accuracy: preds.length > 0 ? (preds.filter(p => p.wasCorrect).length / preds.length) * 100 : 0
    });
    return {
      totalPredictions: this.learningState.totalPredictions,
      accuracy: this.learningState.accuracy,
      recentAccuracy: this.learningState.recentAccuracy,
      currentStreak: this.learningState.streak,
      bestStreak: this.learningState.bestStreak,
      upPredictions: calcStats(resolved.filter(p => p.predictedDirection === 'up')),
      downPredictions: calcStats(resolved.filter(p => p.predictedDirection === 'down')),
      flatPredictions: calcStats(resolved.filter(p => p.predictedDirection === 'flat'))
    };
  }
  reset(): void {
    this.ticks = [];
    this.predictions.clear();
    this.recentResults = [];
    this.learningState = createInitialLearningState();
  }
  getTickCount(): number { return this.ticks.length; }
  getLatestTick(): Tick | null { return this.ticks.length > 0 ? this.ticks[this.ticks.length - 1] : null; }
}

let engineInstance: TickPredictionEngine | null = null;

export function getTickPredictionEngine(config?: Partial<EngineConfig>): TickPredictionEngine {
  if (!engineInstance) engineInstance = new TickPredictionEngine(config);
  return engineInstance;
}

export function resetTickPredictionEngine(): void {
  if (engineInstance) engineInstance.reset();
  engineInstance = null;
}
