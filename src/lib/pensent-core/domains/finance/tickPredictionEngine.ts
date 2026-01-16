/**
 * En Pensent™ Tick Prediction Engine
 * Real-time scalping predictions with adaptive learning
 * 
 * Predicts price direction seconds ahead, validates against outcomes,
 * and auto-adjusts confidence based on accuracy.
 */

export interface Tick {
  price: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
}

export interface TickPrediction {
  id: string;
  timestamp: number;
  predictedDirection: 'up' | 'down' | 'flat';
  confidence: number;
  horizonMs: number;
  priceAtPrediction: number;
  targetPrice?: number;
  predictedMagnitude?: number; // Expected % move
  expiresAt: number;
  resolved?: boolean;
  wasCorrect?: boolean;
  actualDirection?: 'up' | 'down' | 'flat';
  actualPrice?: number;
  // Multi-level accuracy scores (0-100 each)
  accuracyLevels?: MultiLevelAccuracy;
}

/**
 * Multi-level accuracy tracking
 * Each prediction can be right/wrong on multiple dimensions
 */
export interface MultiLevelAccuracy {
  direction: number;      // 0 or 100 - did we get direction right?
  magnitude: number;      // 0-100 - how close was predicted vs actual move size?
  timing: number;         // 0-100 - how well did timing work out?
  confidence: number;     // 0-100 - was our confidence calibrated correctly?
  composite: number;      // Weighted average of all levels
}

/**
 * Aggregate multi-level performance over time
 */
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
  recentAccuracy: number; // Last 20 predictions
  confidenceMultiplier: number;
  adaptiveHorizonMs: number;
  volatilityState: 'low' | 'medium' | 'high' | 'extreme';
  momentumBias: number; // -1 to 1
  lastUpdate: number;
  // Multi-level tracking
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

const DEFAULT_CONFIG: EngineConfig = {
  minHorizonMs: 1000,    // 1 second minimum
  maxHorizonMs: 30000,   // 30 seconds maximum
  baseConfidence: 50,
  learningRate: 0.15,
  volatilityWindow: 50,   // Last 50 ticks for volatility
  momentumWindow: 20,     // Last 20 ticks for momentum
  minTicksForPrediction: 10
};

export class TickPredictionEngine {
  private ticks: Tick[] = [];
  private predictions: Map<string, TickPrediction> = new Map();
  private learningState: LearningState;
  private config: EngineConfig;
  private recentResults: boolean[] = []; // Last 20 results
  
  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.learningState = this.createInitialState();
  }
  
  private createInitialState(): LearningState {
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      streak: 0,
      bestStreak: 0,
      recentAccuracy: 0,
      confidenceMultiplier: 1.0,
      adaptiveHorizonMs: 5000, // Start at 5 seconds
      volatilityState: 'medium',
      momentumBias: 0,
      lastUpdate: Date.now(),
      multiLevel: {
        direction: { correct: 0, total: 0, accuracy: 0 },
        magnitude: { avgScore: 0, samples: 0 },
        timing: { avgScore: 0, samples: 0 },
        confidenceCalibration: { predicted: 0, actual: 0, calibrationError: 0 },
        composite: { avgScore: 0, trend: 0 }
      }
    };
  }
  
  /**
   * Process incoming tick data
   */
  processTick(tick: Tick): void {
    this.ticks.push(tick);
    
    // Keep last 500 ticks for analysis
    if (this.ticks.length > 500) {
      this.ticks.shift();
    }
    
    // Update volatility and momentum
    this.updateMarketState();
    
    // Check and resolve expired predictions
    this.resolveExpiredPredictions(tick);
  }
  
  /**
   * Generate a prediction for the next N milliseconds
   */
  generatePrediction(horizonMs?: number): TickPrediction | null {
    if (this.ticks.length < this.config.minTicksForPrediction) {
      return null;
    }
    
    const effectiveHorizon = horizonMs || this.learningState.adaptiveHorizonMs;
    const currentTick = this.ticks[this.ticks.length - 1];
    
    // Calculate prediction components
    const momentum = this.calculateMomentum();
    const volatility = this.calculateVolatility();
    const microTrend = this.detectMicroTrend();
    const volumeSignal = this.analyzeVolumePattern();
    
    // Combine signals with learned weights
    let signalSum = 0;
    signalSum += momentum * 0.35;          // Momentum weight
    signalSum += microTrend * 0.30;        // Trend weight
    signalSum += volumeSignal * 0.20;      // Volume weight
    signalSum += this.learningState.momentumBias * 0.15; // Learned bias
    
    // Determine direction
    let direction: 'up' | 'down' | 'flat';
    if (signalSum > 0.15) {
      direction = 'up';
    } else if (signalSum < -0.15) {
      direction = 'down';
    } else {
      direction = 'flat';
    }
    
    // Calculate confidence
    const signalStrength = Math.abs(signalSum);
    let confidence = this.config.baseConfidence + (signalStrength * 40);
    confidence *= this.learningState.confidenceMultiplier;
    
    // Adjust confidence based on volatility
    if (this.learningState.volatilityState === 'extreme') {
      confidence *= 0.7; // Less confident in extreme volatility
    } else if (this.learningState.volatilityState === 'low') {
      confidence *= 1.1; // More confident in low volatility
    }
    
    // Boost confidence if on a streak
    if (this.learningState.streak >= 5) {
      confidence *= 1 + (this.learningState.streak * 0.02);
    }
    
    confidence = Math.min(95, Math.max(25, confidence));
    
    // Calculate target price
    const avgMove = volatility * (effectiveHorizon / 1000);
    const targetPrice = direction === 'up' 
      ? currentTick.price * (1 + avgMove)
      : direction === 'down'
        ? currentTick.price * (1 - avgMove)
        : currentTick.price;
    
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
  
  /**
   * Resolve expired predictions against actual outcomes
   */
  private resolveExpiredPredictions(currentTick: Tick): void {
    const now = Date.now();
    
    for (const [id, pred] of this.predictions) {
      if (pred.resolved) continue;
      if (pred.expiresAt > now) continue;
      
      // Resolve this prediction
      const priceDiff = currentTick.price - pred.priceAtPrediction;
      const percentChange = (priceDiff / pred.priceAtPrediction) * 100;
      const actualMagnitude = Math.abs(percentChange);
      
      // Determine actual direction (with threshold for "flat")
      let actualDirection: 'up' | 'down' | 'flat';
      const flatThreshold = 0.01; // 0.01% threshold for flat
      
      if (percentChange > flatThreshold) {
        actualDirection = 'up';
      } else if (percentChange < -flatThreshold) {
        actualDirection = 'down';
      } else {
        actualDirection = 'flat';
      }
      
      const wasCorrect = pred.predictedDirection === actualDirection;
      
      // Calculate multi-level accuracy scores
      const accuracyLevels = this.calculateMultiLevelAccuracy(pred, actualDirection, actualMagnitude, currentTick);
      
      // Update prediction with results
      pred.resolved = true;
      pred.wasCorrect = wasCorrect;
      pred.actualDirection = actualDirection;
      pred.actualPrice = currentTick.price;
      pred.accuracyLevels = accuracyLevels;
      
      // Update learning state with multi-level data
      this.updateLearningState(wasCorrect, pred, accuracyLevels);
    }
    
    // Clean up old resolved predictions (keep last 100)
    const resolvedPreds = Array.from(this.predictions.values())
      .filter(p => p.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (resolvedPreds.length > 100) {
      for (const old of resolvedPreds.slice(100)) {
        this.predictions.delete(old.id);
      }
    }
  }
  
  /**
   * Calculate multi-level accuracy for a resolved prediction
   */
  private calculateMultiLevelAccuracy(
    prediction: TickPrediction,
    actualDirection: 'up' | 'down' | 'flat',
    actualMagnitude: number,
    currentTick: Tick
  ): MultiLevelAccuracy {
    // Level 1: Direction accuracy (binary)
    const directionScore = prediction.predictedDirection === actualDirection ? 100 : 0;
    
    // Level 2: Magnitude accuracy (how close was our predicted move?)
    const predictedMagnitude = prediction.predictedMagnitude || 
      (prediction.targetPrice 
        ? Math.abs((prediction.targetPrice - prediction.priceAtPrediction) / prediction.priceAtPrediction) * 100
        : 0);
    
    let magnitudeScore = 0;
    if (predictedMagnitude > 0) {
      const magnitudeError = Math.abs(actualMagnitude - predictedMagnitude);
      // Score based on how close we were (100 if exact, decreasing with error)
      magnitudeScore = Math.max(0, 100 - (magnitudeError / predictedMagnitude) * 100);
    } else if (actualMagnitude < 0.01) {
      // Both predicted and actual were essentially flat
      magnitudeScore = 80;
    }
    
    // Level 3: Timing accuracy (did the move happen within our horizon?)
    // Check if we resolved close to when expected
    const timingElapsed = Date.now() - prediction.timestamp;
    const timingError = Math.abs(timingElapsed - prediction.horizonMs);
    const timingTolerance = prediction.horizonMs * 0.3; // 30% tolerance
    const timingScore = Math.max(0, 100 - (timingError / timingTolerance) * 50);
    
    // Level 4: Confidence calibration (when we say X% confident, are we right X% of the time?)
    // This is tracked over multiple predictions, so we score this based on alignment
    const wasCorrect = prediction.predictedDirection === actualDirection;
    const confidenceAligned = wasCorrect ? prediction.confidence : (100 - prediction.confidence);
    const confidenceScore = confidenceAligned;
    
    // Composite score (weighted average)
    const composite = (
      directionScore * 0.40 +  // Direction matters most
      magnitudeScore * 0.25 +  // Magnitude is valuable
      timingScore * 0.15 +     // Timing is helpful
      confidenceScore * 0.20   // Confidence calibration is important
    );
    
    return {
      direction: directionScore,
      magnitude: Math.round(magnitudeScore),
      timing: Math.round(timingScore),
      confidence: Math.round(confidenceScore),
      composite: Math.round(composite)
    };
  }
  
  /**
   * Update learning state based on prediction outcome
   */
  private updateLearningState(
    wasCorrect: boolean, 
    prediction: TickPrediction, 
    accuracyLevels?: MultiLevelAccuracy
  ): void {
    const state = this.learningState;
    
    state.totalPredictions++;
    if (wasCorrect) {
      state.correctPredictions++;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
    } else {
      state.streak = 0;
    }
    
    // Update overall accuracy
    state.accuracy = (state.correctPredictions / state.totalPredictions) * 100;
    
    // Track recent results (last 20)
    this.recentResults.push(wasCorrect);
    if (this.recentResults.length > 20) {
      this.recentResults.shift();
    }
    state.recentAccuracy = (this.recentResults.filter(r => r).length / this.recentResults.length) * 100;
    
    // Update multi-level tracking
    if (accuracyLevels) {
      const ml = state.multiLevel;
      
      // Direction tracking
      ml.direction.total++;
      if (accuracyLevels.direction === 100) ml.direction.correct++;
      ml.direction.accuracy = (ml.direction.correct / ml.direction.total) * 100;
      
      // Magnitude tracking (running average)
      ml.magnitude.samples++;
      ml.magnitude.avgScore = (
        (ml.magnitude.avgScore * (ml.magnitude.samples - 1) + accuracyLevels.magnitude) / 
        ml.magnitude.samples
      );
      
      // Timing tracking (running average)
      ml.timing.samples++;
      ml.timing.avgScore = (
        (ml.timing.avgScore * (ml.timing.samples - 1) + accuracyLevels.timing) / 
        ml.timing.samples
      );
      
      // Confidence calibration (track predicted vs actual)
      ml.confidenceCalibration.predicted = (
        (ml.confidenceCalibration.predicted * (state.totalPredictions - 1) + prediction.confidence) / 
        state.totalPredictions
      );
      ml.confidenceCalibration.actual = (state.correctPredictions / state.totalPredictions) * 100;
      ml.confidenceCalibration.calibrationError = Math.abs(
        ml.confidenceCalibration.predicted - ml.confidenceCalibration.actual
      );
      
      // Composite tracking with trend
      const prevComposite = ml.composite.avgScore;
      ml.composite.avgScore = (
        (ml.composite.avgScore * (state.totalPredictions - 1) + accuracyLevels.composite) / 
        state.totalPredictions
      );
      // Positive trend if improving
      ml.composite.trend = ml.composite.avgScore - prevComposite;
    }
    
    // Adapt confidence multiplier based on recent performance
    if (state.recentAccuracy > 70) {
      state.confidenceMultiplier = Math.min(1.5, state.confidenceMultiplier + this.config.learningRate * 0.1);
    } else if (state.recentAccuracy < 45) {
      state.confidenceMultiplier = Math.max(0.6, state.confidenceMultiplier - this.config.learningRate * 0.1);
    }
    
    // Adapt prediction horizon based on multi-level composite score
    const compositeScore = state.multiLevel.composite.avgScore;
    if (compositeScore > 65 && state.adaptiveHorizonMs > this.config.minHorizonMs) {
      // If multi-level accurate, try shorter horizons for faster trading
      state.adaptiveHorizonMs = Math.max(
        this.config.minHorizonMs,
        state.adaptiveHorizonMs - 500
      );
    } else if (compositeScore < 45 && state.adaptiveHorizonMs < this.config.maxHorizonMs) {
      // If multi-level inaccurate, try longer horizons for stability
      state.adaptiveHorizonMs = Math.min(
        this.config.maxHorizonMs,
        state.adaptiveHorizonMs + 500
      );
    }
    
    // Update momentum bias based on recent correct predictions
    if (wasCorrect && prediction.predictedDirection === 'up') {
      state.momentumBias = Math.min(1, state.momentumBias + this.config.learningRate);
    } else if (wasCorrect && prediction.predictedDirection === 'down') {
      state.momentumBias = Math.max(-1, state.momentumBias - this.config.learningRate);
    } else {
      // Decay bias towards neutral on incorrect predictions
      state.momentumBias *= 0.9;
    }
    
    state.lastUpdate = Date.now();
  }
  
  /**
   * Update market volatility and momentum state
   */
  private updateMarketState(): void {
    const volatility = this.calculateVolatility();
    
    if (volatility < 0.0005) {
      this.learningState.volatilityState = 'low';
    } else if (volatility < 0.002) {
      this.learningState.volatilityState = 'medium';
    } else if (volatility < 0.005) {
      this.learningState.volatilityState = 'high';
    } else {
      this.learningState.volatilityState = 'extreme';
    }
  }
  
  /**
   * Calculate short-term momentum
   */
  private calculateMomentum(): number {
    const window = Math.min(this.config.momentumWindow, this.ticks.length);
    if (window < 2) return 0;
    
    const recentTicks = this.ticks.slice(-window);
    const startPrice = recentTicks[0].price;
    const endPrice = recentTicks[recentTicks.length - 1].price;
    
    // Normalized momentum (-1 to 1)
    const change = (endPrice - startPrice) / startPrice;
    return Math.max(-1, Math.min(1, change * 100));
  }
  
  /**
   * Calculate volatility from recent ticks
   */
  private calculateVolatility(): number {
    const window = Math.min(this.config.volatilityWindow, this.ticks.length);
    if (window < 2) return 0;
    
    const recentTicks = this.ticks.slice(-window);
    const returns: number[] = [];
    
    for (let i = 1; i < recentTicks.length; i++) {
      const ret = (recentTicks[i].price - recentTicks[i-1].price) / recentTicks[i-1].price;
      returns.push(ret);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Detect micro-trend from very recent ticks
   */
  private detectMicroTrend(): number {
    if (this.ticks.length < 5) return 0;
    
    const last5 = this.ticks.slice(-5);
    let upMoves = 0;
    let downMoves = 0;
    
    for (let i = 1; i < last5.length; i++) {
      if (last5[i].price > last5[i-1].price) upMoves++;
      else if (last5[i].price < last5[i-1].price) downMoves++;
    }
    
    // Return -1 to 1 based on trend
    return (upMoves - downMoves) / 4;
  }
  
  /**
   * Analyze volume patterns for signals
   */
  private analyzeVolumePattern(): number {
    if (this.ticks.length < 10) return 0;
    
    const last10 = this.ticks.slice(-10);
    const avgVolume = last10.reduce((a, t) => a + t.volume, 0) / 10;
    const lastVolume = last10[last10.length - 1].volume;
    const lastPriceChange = last10[last10.length - 1].price - last10[last10.length - 2].price;
    
    // High volume with price increase = bullish
    // High volume with price decrease = bearish
    if (lastVolume > avgVolume * 1.5) {
      return lastPriceChange > 0 ? 0.5 : -0.5;
    }
    
    return 0;
  }
  
  /**
   * Get current learning state
   */
  getState(): LearningState {
    return { ...this.learningState };
  }
  
  /**
   * Get all pending (unresolved) predictions
   */
  getPendingPredictions(): TickPrediction[] {
    return Array.from(this.predictions.values())
      .filter(p => !p.resolved)
      .sort((a, b) => a.expiresAt - b.expiresAt);
  }
  
  /**
   * Get recent resolved predictions
   */
  getRecentPredictions(count: number = 20): TickPrediction[] {
    return Array.from(this.predictions.values())
      .filter(p => p.resolved)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get prediction statistics
   */
  getStats(): {
    totalPredictions: number;
    accuracy: number;
    recentAccuracy: number;
    currentStreak: number;
    bestStreak: number;
    upPredictions: { total: number; correct: number; accuracy: number };
    downPredictions: { total: number; correct: number; accuracy: number };
    flatPredictions: { total: number; correct: number; accuracy: number };
  } {
    const resolved = Array.from(this.predictions.values()).filter(p => p.resolved);
    
    const upPreds = resolved.filter(p => p.predictedDirection === 'up');
    const downPreds = resolved.filter(p => p.predictedDirection === 'down');
    const flatPreds = resolved.filter(p => p.predictedDirection === 'flat');
    
    const calcStats = (preds: TickPrediction[]) => ({
      total: preds.length,
      correct: preds.filter(p => p.wasCorrect).length,
      accuracy: preds.length > 0 
        ? (preds.filter(p => p.wasCorrect).length / preds.length) * 100 
        : 0
    });
    
    return {
      totalPredictions: this.learningState.totalPredictions,
      accuracy: this.learningState.accuracy,
      recentAccuracy: this.learningState.recentAccuracy,
      currentStreak: this.learningState.streak,
      bestStreak: this.learningState.bestStreak,
      upPredictions: calcStats(upPreds),
      downPredictions: calcStats(downPreds),
      flatPredictions: calcStats(flatPreds)
    };
  }
  
  /**
   * Reset the engine state
   */
  reset(): void {
    this.ticks = [];
    this.predictions.clear();
    this.recentResults = [];
    this.learningState = this.createInitialState();
  }
  
  /**
   * Get tick count
   */
  getTickCount(): number {
    return this.ticks.length;
  }
  
  /**
   * Get latest tick
   */
  getLatestTick(): Tick | null {
    return this.ticks.length > 0 ? this.ticks[this.ticks.length - 1] : null;
  }
}

// Singleton instance for global access
let engineInstance: TickPredictionEngine | null = null;

export function getTickPredictionEngine(config?: Partial<EngineConfig>): TickPredictionEngine {
  if (!engineInstance) {
    engineInstance = new TickPredictionEngine(config);
  }
  return engineInstance;
}

export function resetTickPredictionEngine(): void {
  if (engineInstance) {
    engineInstance.reset();
  }
  engineInstance = null;
}
