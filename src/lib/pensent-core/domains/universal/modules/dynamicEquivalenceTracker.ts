/**
 * Dynamic Equivalence Tracker
 * 
 * Embodies the insight that the relationship between temporal patterns
 * and fundamental data structure is DYNAMIC, not static.
 * 
 * The "=" in "pattern = structure" changes value over time.
 * Sometimes correlation IS causation, sometimes it isn't.
 * This module tracks WHEN that relationship holds true.
 */

interface EquivalenceState {
  correlationStrength: number; // How strongly patterns correlate with outcomes
  causationProbability: number; // Probability that correlation = causation
  relationshipPhase: 'strong_equivalence' | 'weak_equivalence' | 'decorrelated' | 'inverse';
  stability: number; // How stable the relationship is
  transitionProbability: number; // Likelihood of phase change
}

interface EquivalenceWindow {
  startTime: number;
  endTime: number;
  phase: EquivalenceState['relationshipPhase'];
  patternAccuracy: number;
  fundamentalAccuracy: number;
  combinedAccuracy: number;
}

interface DynamicEquivalenceState {
  currentState: EquivalenceState;
  historicalWindows: EquivalenceWindow[];
  optimalStrategy: 'trust_patterns' | 'trust_fundamentals' | 'blend' | 'contrarian';
  blendWeights: { pattern: number; fundamental: number };
  confidenceModifier: number;
  insights: string[];
}

class DynamicEquivalenceTracker {
  private stateHistory: Array<{ timestamp: number; state: EquivalenceState }> = [];
  private windowHistory: EquivalenceWindow[] = [];
  private patternOutcomes: Array<{ timestamp: number; predicted: number; actual: number; source: 'pattern' }> = [];
  private fundamentalOutcomes: Array<{ timestamp: number; predicted: number; actual: number; source: 'fundamental' }> = [];
  
  private readonly windowDurationMs = 3600000; // 1 hour windows
  private readonly maxHistory = 1000;
  private readonly learningRate = 0.1;
  
  // Dynamic blend weights - the core of the system
  private patternWeight = 0.5;
  private fundamentalWeight = 0.5;
  
  /**
   * Record a pattern-based prediction outcome
   */
  recordPatternPrediction(predicted: number, actual: number): void {
    this.patternOutcomes.push({
      timestamp: Date.now(),
      predicted,
      actual,
      source: 'pattern',
    });
    
    if (this.patternOutcomes.length > this.maxHistory) {
      this.patternOutcomes.shift();
    }
    
    this.updateEquivalence();
  }
  
  /**
   * Record a fundamental-based prediction outcome
   */
  recordFundamentalPrediction(predicted: number, actual: number): void {
    this.fundamentalOutcomes.push({
      timestamp: Date.now(),
      predicted,
      actual,
      source: 'fundamental',
    });
    
    if (this.fundamentalOutcomes.length > this.maxHistory) {
      this.fundamentalOutcomes.shift();
    }
    
    this.updateEquivalence();
  }
  
  /**
   * Update the dynamic equivalence state
   */
  private updateEquivalence(): void {
    const now = Date.now();
    const windowStart = now - this.windowDurationMs;
    
    // Get recent outcomes
    const recentPatterns = this.patternOutcomes.filter(o => o.timestamp > windowStart);
    const recentFundamentals = this.fundamentalOutcomes.filter(o => o.timestamp > windowStart);
    
    if (recentPatterns.length < 5 && recentFundamentals.length < 5) return;
    
    // Calculate accuracies
    const patternAccuracy = this.calculateAccuracy(recentPatterns);
    const fundamentalAccuracy = this.calculateAccuracy(recentFundamentals);
    
    // Calculate correlation between pattern predictions and actual outcomes
    const correlationStrength = this.calculateCorrelation(recentPatterns);
    
    // Determine if correlation = causation (patterns actually drive outcomes)
    const causationProbability = this.estimateCausation(patternAccuracy, fundamentalAccuracy, correlationStrength);
    
    // Determine relationship phase
    const relationshipPhase = this.determinePhase(patternAccuracy, fundamentalAccuracy, correlationStrength);
    
    // Calculate stability
    const stability = this.calculateStability();
    
    // Calculate transition probability
    const transitionProbability = this.calculateTransitionProbability(relationshipPhase, stability);
    
    const newState: EquivalenceState = {
      correlationStrength,
      causationProbability,
      relationshipPhase,
      stability,
      transitionProbability,
    };
    
    this.stateHistory.push({ timestamp: now, state: newState });
    if (this.stateHistory.length > this.maxHistory) {
      this.stateHistory.shift();
    }
    
    // Update weights dynamically
    this.updateWeights(patternAccuracy, fundamentalAccuracy, correlationStrength);
    
    // Record window
    this.recordWindow(windowStart, now, relationshipPhase, patternAccuracy, fundamentalAccuracy);
  }
  
  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(outcomes: Array<{ predicted: number; actual: number }>): number {
    if (outcomes.length === 0) return 0.5;
    
    let correct = 0;
    for (const outcome of outcomes) {
      // Directional accuracy
      if (Math.sign(outcome.predicted) === Math.sign(outcome.actual)) {
        correct++;
      }
    }
    
    return correct / outcomes.length;
  }
  
  /**
   * Calculate correlation between predictions and actuals
   */
  private calculateCorrelation(outcomes: Array<{ predicted: number; actual: number }>): number {
    if (outcomes.length < 3) return 0;
    
    const predictions = outcomes.map(o => o.predicted);
    const actuals = outcomes.map(o => o.actual);
    
    const n = predictions.length;
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumXY += predictions[i] * actuals[i];
      sumX += predictions[i];
      sumY += actuals[i];
      sumX2 += predictions[i] * predictions[i];
      sumY2 += actuals[i] * actuals[i];
    }
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
  }
  
  /**
   * Estimate probability that correlation = causation
   */
  private estimateCausation(
    patternAccuracy: number,
    fundamentalAccuracy: number,
    correlation: number
  ): number {
    // High pattern accuracy + high correlation + low fundamental accuracy
    // suggests patterns ARE causal
    if (patternAccuracy > 0.6 && correlation > 0.5 && fundamentalAccuracy < 0.5) {
      return Math.min(0.8, patternAccuracy * correlation);
    }
    
    // Both accurate suggests shared underlying cause
    if (patternAccuracy > 0.6 && fundamentalAccuracy > 0.6) {
      return 0.5; // Equal probability
    }
    
    // Low pattern accuracy despite high correlation = spurious
    if (patternAccuracy < 0.5 && correlation > 0.3) {
      return 0.2;
    }
    
    return correlation * 0.5; // Conservative default
  }
  
  /**
   * Determine the current relationship phase
   */
  private determinePhase(
    patternAccuracy: number,
    fundamentalAccuracy: number,
    correlation: number
  ): EquivalenceState['relationshipPhase'] {
    if (correlation > 0.6 && patternAccuracy > 0.6) {
      return 'strong_equivalence';
    }
    
    if (correlation > 0.3 && patternAccuracy > 0.5) {
      return 'weak_equivalence';
    }
    
    if (correlation < -0.3) {
      return 'inverse';
    }
    
    return 'decorrelated';
  }
  
  /**
   * Calculate stability of current phase
   */
  private calculateStability(): number {
    if (this.stateHistory.length < 10) return 0.5;
    
    const recent = this.stateHistory.slice(-20);
    const currentPhase = recent[recent.length - 1]?.state.relationshipPhase;
    
    if (!currentPhase) return 0.5;
    
    const samePhaseCount = recent.filter(s => s.state.relationshipPhase === currentPhase).length;
    return samePhaseCount / recent.length;
  }
  
  /**
   * Calculate probability of phase transition
   */
  private calculateTransitionProbability(
    currentPhase: EquivalenceState['relationshipPhase'],
    stability: number
  ): number {
    // Low stability = high transition probability
    const baseProb = 1 - stability;
    
    // Some phases are inherently unstable
    const phaseModifier: Record<EquivalenceState['relationshipPhase'], number> = {
      strong_equivalence: 0.8, // Stable
      weak_equivalence: 1.0,
      decorrelated: 1.2, // Unstable
      inverse: 1.3, // Very unstable
    };
    
    return Math.min(0.9, baseProb * phaseModifier[currentPhase]);
  }
  
  /**
   * Dynamically update weights based on performance
   */
  private updateWeights(
    patternAccuracy: number,
    fundamentalAccuracy: number,
    correlation: number
  ): void {
    const totalAccuracy = patternAccuracy + fundamentalAccuracy;
    if (totalAccuracy === 0) return;
    
    // Calculate ideal weights based on relative accuracy
    const idealPatternWeight = patternAccuracy / totalAccuracy;
    const idealFundamentalWeight = fundamentalAccuracy / totalAccuracy;
    
    // Smooth update with learning rate
    this.patternWeight += this.learningRate * (idealPatternWeight - this.patternWeight);
    this.fundamentalWeight += this.learningRate * (idealFundamentalWeight - this.fundamentalWeight);
    
    // Normalize
    const sum = this.patternWeight + this.fundamentalWeight;
    this.patternWeight /= sum;
    this.fundamentalWeight /= sum;
    
    // Apply correlation modifier - if decorrelated, trust both less equally
    if (Math.abs(correlation) < 0.2) {
      this.patternWeight = 0.5;
      this.fundamentalWeight = 0.5;
    }
  }
  
  /**
   * Record a historical window
   */
  private recordWindow(
    startTime: number,
    endTime: number,
    phase: EquivalenceState['relationshipPhase'],
    patternAccuracy: number,
    fundamentalAccuracy: number
  ): void {
    this.windowHistory.push({
      startTime,
      endTime,
      phase,
      patternAccuracy,
      fundamentalAccuracy,
      combinedAccuracy: patternAccuracy * this.patternWeight + fundamentalAccuracy * this.fundamentalWeight,
    });
    
    if (this.windowHistory.length > 100) {
      this.windowHistory.shift();
    }
  }
  
  /**
   * Get full dynamic equivalence state
   */
  getState(): DynamicEquivalenceState {
    const currentState = this.stateHistory[this.stateHistory.length - 1]?.state || {
      correlationStrength: 0,
      causationProbability: 0.5,
      relationshipPhase: 'decorrelated' as const,
      stability: 0.5,
      transitionProbability: 0.5,
    };
    
    // Determine optimal strategy
    let optimalStrategy: DynamicEquivalenceState['optimalStrategy'];
    if (currentState.relationshipPhase === 'strong_equivalence') {
      optimalStrategy = 'trust_patterns';
    } else if (currentState.relationshipPhase === 'inverse') {
      optimalStrategy = 'contrarian';
    } else if (currentState.causationProbability < 0.3) {
      optimalStrategy = 'trust_fundamentals';
    } else {
      optimalStrategy = 'blend';
    }
    
    // Generate insights
    const insights = this.generateInsights(currentState);
    
    // Calculate confidence modifier
    const confidenceModifier = this.calculateConfidenceModifier(currentState);
    
    return {
      currentState,
      historicalWindows: this.windowHistory.slice(-20),
      optimalStrategy,
      blendWeights: { pattern: this.patternWeight, fundamental: this.fundamentalWeight },
      confidenceModifier,
      insights,
    };
  }
  
  /**
   * Generate human-readable insights
   */
  private generateInsights(state: EquivalenceState): string[] {
    const insights: string[] = [];
    
    if (state.relationshipPhase === 'strong_equivalence') {
      insights.push('Pattern-structure equivalence is strong - temporal patterns are reliable');
    } else if (state.relationshipPhase === 'decorrelated') {
      insights.push('Pattern-structure relationship is weak - fundamentals may dominate');
    } else if (state.relationshipPhase === 'inverse') {
      insights.push('Inverse relationship detected - consider contrarian signals');
    }
    
    if (state.transitionProbability > 0.6) {
      insights.push('High transition probability - relationship may shift soon');
    }
    
    if (state.causationProbability > 0.7) {
      insights.push('Patterns appear to be CAUSING outcomes, not just correlating');
    }
    
    if (this.patternWeight > 0.65) {
      insights.push(`Pattern signals weighted ${(this.patternWeight * 100).toFixed(0)}% - proven more reliable`);
    } else if (this.fundamentalWeight > 0.65) {
      insights.push(`Fundamental signals weighted ${(this.fundamentalWeight * 100).toFixed(0)}% - patterns less reliable now`);
    }
    
    return insights;
  }
  
  /**
   * Calculate confidence modifier based on equivalence state
   */
  private calculateConfidenceModifier(state: EquivalenceState): number {
    // Strong equivalence = higher confidence
    const phaseModifier: Record<EquivalenceState['relationshipPhase'], number> = {
      strong_equivalence: 1.15,
      weak_equivalence: 1.0,
      decorrelated: 0.85,
      inverse: 0.9, // Still useful if we know to invert
    };
    
    const stabilityModifier = 0.9 + state.stability * 0.2;
    const causationModifier = 0.9 + state.causationProbability * 0.2;
    
    return phaseModifier[state.relationshipPhase] * stabilityModifier * causationModifier;
  }
  
  /**
   * Get blended prediction from pattern and fundamental sources
   */
  blendPredictions(patternPrediction: number, fundamentalPrediction: number): number {
    const state = this.getState();
    
    if (state.optimalStrategy === 'contrarian') {
      // Invert pattern prediction
      return -patternPrediction * this.patternWeight + fundamentalPrediction * this.fundamentalWeight;
    }
    
    return patternPrediction * this.patternWeight + fundamentalPrediction * this.fundamentalWeight;
  }
}

export const dynamicEquivalenceTracker = new DynamicEquivalenceTracker();
export type { EquivalenceState, EquivalenceWindow, DynamicEquivalenceState };
