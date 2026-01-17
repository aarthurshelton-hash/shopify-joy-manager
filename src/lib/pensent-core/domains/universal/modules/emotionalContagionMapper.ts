/**
 * Emotional Contagion Mapper
 * 
 * Models the viral spread of emotions (fear, greed, euphoria, panic)
 * through markets using epidemiological concepts (R0, infection curves).
 * Emotions are treated as "contagious" information patterns.
 */

type EmotionalState = 'fear' | 'greed' | 'euphoria' | 'panic' | 'neutral' | 'despair' | 'hope';

interface EmotionMetrics {
  state: EmotionalState;
  intensity: number; // 0-1
  r0: number; // Reproduction number (how contagious)
  infectedPercent: number; // What % of market is "infected"
  peakPredicted: boolean;
  daysSincePeak: number;
}

interface ContagionEvent {
  emotion: EmotionalState;
  startedAt: number;
  peakedAt: number | null;
  currentIntensity: number;
  maxIntensity: number;
  spreadRate: number;
  isActive: boolean;
}

interface ContagionState {
  dominantEmotion: EmotionalState;
  emotionMix: Record<EmotionalState, number>;
  contagionR0: number;
  isViral: boolean;
  peakPhase: 'pre_peak' | 'at_peak' | 'post_peak' | 'dormant';
  herdImmunity: number; // How resistant the market is to this emotion
  predictedFlip: EmotionalState | null;
  flipConfidence: number;
}

class EmotionalContagionMapper {
  private activeContagions: Map<EmotionalState, ContagionEvent> = new Map();
  private emotionHistory: Array<{ timestamp: number; state: EmotionalState; intensity: number }> = [];
  private outcomeHistory: Array<{ emotion: EmotionalState; predictedDirection: string; wasCorrect: boolean }> = [];
  private readonly maxHistory = 1000;
  private readonly regularization = 0.85; // Prevent overfitting
  
  // Emotion transition probabilities (what typically follows what)
  private readonly transitionMatrix: Record<EmotionalState, Partial<Record<EmotionalState, number>>> = {
    fear: { panic: 0.3, despair: 0.25, neutral: 0.3, hope: 0.15 },
    greed: { euphoria: 0.35, fear: 0.25, neutral: 0.3, despair: 0.1 },
    euphoria: { greed: 0.2, fear: 0.35, panic: 0.25, neutral: 0.2 },
    panic: { despair: 0.3, fear: 0.25, hope: 0.2, neutral: 0.25 },
    neutral: { greed: 0.25, fear: 0.25, hope: 0.25, despair: 0.25 },
    despair: { hope: 0.35, neutral: 0.3, panic: 0.2, fear: 0.15 },
    hope: { greed: 0.35, neutral: 0.3, fear: 0.2, euphoria: 0.15 },
  };
  
  /**
   * Detect current emotional state from market signals
   */
  detectEmotion(
    priceChange: number,
    volatility: number,
    volume: number,
    sentiment: number
  ): EmotionMetrics {
    const state = this.classifyEmotion(priceChange, volatility, volume, sentiment);
    const intensity = this.calculateIntensity(priceChange, volatility, sentiment);
    
    // Track in history
    this.emotionHistory.push({ timestamp: Date.now(), state, intensity });
    if (this.emotionHistory.length > this.maxHistory) {
      this.emotionHistory.shift();
    }
    
    // Update or create contagion event
    this.updateContagion(state, intensity);
    
    const contagion = this.activeContagions.get(state);
    const r0 = this.calculateR0(state);
    const infectedPercent = this.calculateInfectedPercent(state);
    
    return {
      state,
      intensity,
      r0,
      infectedPercent,
      peakPredicted: contagion?.peakedAt != null || infectedPercent > 0.7,
      daysSincePeak: contagion?.peakedAt 
        ? (Date.now() - contagion.peakedAt) / 86400000 
        : 0,
    };
  }
  
  /**
   * Classify emotion from market signals
   */
  private classifyEmotion(
    priceChange: number,
    volatility: number,
    volume: number,
    sentiment: number
  ): EmotionalState {
    // High volatility + negative change = fear/panic
    if (volatility > 0.3 && priceChange < -0.05) {
      return priceChange < -0.1 ? 'panic' : 'fear';
    }
    
    // High volatility + positive change = euphoria/greed
    if (volatility > 0.3 && priceChange > 0.05) {
      return priceChange > 0.1 ? 'euphoria' : 'greed';
    }
    
    // Low volatility, very negative sentiment = despair
    if (volatility < 0.1 && sentiment < -0.5) {
      return 'despair';
    }
    
    // Low volatility, positive sentiment = hope
    if (volatility < 0.15 && sentiment > 0.3) {
      return 'hope';
    }
    
    // Strong sentiment without volatility
    if (sentiment > 0.5) return 'greed';
    if (sentiment < -0.5) return 'fear';
    
    return 'neutral';
  }
  
  /**
   * Calculate emotional intensity
   */
  private calculateIntensity(priceChange: number, volatility: number, sentiment: number): number {
    const priceComponent = Math.min(1, Math.abs(priceChange) * 5);
    const volatilityComponent = Math.min(1, volatility * 3);
    const sentimentComponent = Math.abs(sentiment);
    
    return Math.min(1, (priceComponent * 0.4 + volatilityComponent * 0.3 + sentimentComponent * 0.3));
  }
  
  /**
   * Update or create contagion tracking for an emotion
   */
  private updateContagion(state: EmotionalState, intensity: number): void {
    const existing = this.activeContagions.get(state);
    
    if (existing && existing.isActive) {
      existing.currentIntensity = intensity;
      if (intensity > existing.maxIntensity) {
        existing.maxIntensity = intensity;
      } else if (intensity < existing.maxIntensity * 0.7 && !existing.peakedAt) {
        existing.peakedAt = Date.now();
      }
      existing.spreadRate = this.calculateSpreadRate(state);
    } else if (intensity > 0.3) {
      // New contagion starting
      this.activeContagions.set(state, {
        emotion: state,
        startedAt: Date.now(),
        peakedAt: null,
        currentIntensity: intensity,
        maxIntensity: intensity,
        spreadRate: 0,
        isActive: true,
      });
    }
    
    // Deactivate old contagions
    for (const [emotionState, contagion] of this.activeContagions) {
      if (emotionState !== state && contagion.currentIntensity < 0.1) {
        contagion.isActive = false;
      }
    }
  }
  
  /**
   * Calculate R0 (basic reproduction number) for an emotion
   */
  private calculateR0(state: EmotionalState): number {
    const recent = this.emotionHistory.slice(-50);
    const stateCount = recent.filter(e => e.state === state).length;
    
    if (recent.length < 10) return 1.0;
    
    // R0 > 1 means spreading, < 1 means dying out
    const prevalence = stateCount / recent.length;
    const previousPrevalence = this.emotionHistory.slice(-100, -50)
      .filter(e => e.state === state).length / 50;
    
    if (previousPrevalence === 0) return prevalence > 0.1 ? 2.0 : 1.0;
    
    return Math.min(4, Math.max(0.1, prevalence / previousPrevalence));
  }
  
  /**
   * Calculate what % of market is "infected" with this emotion
   */
  private calculateInfectedPercent(state: EmotionalState): number {
    const recent = this.emotionHistory.slice(-100);
    if (recent.length === 0) return 0;
    
    const stateEntries = recent.filter(e => e.state === state);
    const avgIntensity = stateEntries.length > 0
      ? stateEntries.reduce((sum, e) => sum + e.intensity, 0) / stateEntries.length
      : 0;
    
    return (stateEntries.length / recent.length) * avgIntensity;
  }
  
  /**
   * Calculate how fast the emotion is spreading
   */
  private calculateSpreadRate(state: EmotionalState): number {
    const firstHalf = this.emotionHistory.slice(-100, -50);
    const secondHalf = this.emotionHistory.slice(-50);
    
    const firstCount = firstHalf.filter(e => e.state === state).length;
    const secondCount = secondHalf.filter(e => e.state === state).length;
    
    if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
    
    return (secondCount / secondHalf.length) - (firstCount / firstHalf.length);
  }
  
  /**
   * Get full contagion state analysis
   */
  getContagionState(): ContagionState {
    const recentEmotions = this.emotionHistory.slice(-100);
    const emotionMix: Record<EmotionalState, number> = {
      fear: 0, greed: 0, euphoria: 0, panic: 0, neutral: 0, despair: 0, hope: 0
    };
    
    for (const entry of recentEmotions) {
      emotionMix[entry.state] += entry.intensity;
    }
    
    // Normalize
    const total = Object.values(emotionMix).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const key of Object.keys(emotionMix) as EmotionalState[]) {
        emotionMix[key] /= total;
      }
    }
    
    // Find dominant emotion
    const dominantEmotion = (Object.entries(emotionMix) as [EmotionalState, number][])
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    const activeContagion = this.activeContagions.get(dominantEmotion);
    const r0 = this.calculateR0(dominantEmotion);
    
    // Determine peak phase
    let peakPhase: 'pre_peak' | 'at_peak' | 'post_peak' | 'dormant' = 'dormant';
    if (activeContagion?.isActive) {
      if (!activeContagion.peakedAt) {
        peakPhase = r0 > 1.5 ? 'pre_peak' : 'at_peak';
      } else {
        peakPhase = 'post_peak';
      }
    }
    
    // Predict emotional flip based on transition matrix
    const transitions = this.transitionMatrix[dominantEmotion];
    let predictedFlip: EmotionalState | null = null;
    let maxProb = 0;
    
    for (const [nextEmotion, prob] of Object.entries(transitions) as [EmotionalState, number][]) {
      if (prob > maxProb) {
        maxProb = prob;
        predictedFlip = nextEmotion;
      }
    }
    
    // Herd immunity: how "tired" the market is of this emotion
    const herdImmunity = peakPhase === 'post_peak' ? 0.7 :
                         peakPhase === 'at_peak' ? 0.3 : 0.1;
    
    return {
      dominantEmotion,
      emotionMix,
      contagionR0: r0,
      isViral: r0 > 1.5,
      peakPhase,
      herdImmunity,
      predictedFlip: peakPhase !== 'pre_peak' ? predictedFlip : null,
      flipConfidence: maxProb * this.regularization * (peakPhase === 'post_peak' ? 1.2 : 0.8),
    };
  }
  
  /**
   * Get direction prediction based on emotional contagion
   */
  getPrediction(): { direction: 'up' | 'down' | 'neutral'; confidence: number } {
    const state = this.getContagionState();
    
    const bullishEmotions: EmotionalState[] = ['greed', 'euphoria', 'hope'];
    const bearishEmotions: EmotionalState[] = ['fear', 'panic', 'despair'];
    
    let bullishScore = 0;
    let bearishScore = 0;
    
    for (const emotion of bullishEmotions) {
      bullishScore += state.emotionMix[emotion];
    }
    for (const emotion of bearishEmotions) {
      bearishScore += state.emotionMix[emotion];
    }
    
    // Factor in peak phase (post-peak often means reversal)
    if (state.peakPhase === 'post_peak') {
      if (bullishEmotions.includes(state.dominantEmotion)) {
        bearishScore *= 1.3;
      } else if (bearishEmotions.includes(state.dominantEmotion)) {
        bullishScore *= 1.3;
      }
    }
    
    const diff = Math.abs(bullishScore - bearishScore);
    const confidence = Math.min(0.85, diff * this.regularization);
    
    if (diff < 0.1) {
      return { direction: 'neutral', confidence: 0.3 };
    }
    
    return {
      direction: bullishScore > bearishScore ? 'up' : 'down',
      confidence,
    };
  }
  
  /**
   * Record outcome for learning
   */
  recordOutcome(emotion: EmotionalState, predictedDirection: string, actualDirection: string): void {
    this.outcomeHistory.push({
      emotion,
      predictedDirection,
      wasCorrect: predictedDirection === actualDirection,
    });
    
    if (this.outcomeHistory.length > this.maxHistory) {
      this.outcomeHistory.shift();
    }
  }
  
  /**
   * Get accuracy by emotion type
   */
  getAccuracyByEmotion(): Record<EmotionalState, number> {
    const accuracy: Record<EmotionalState, { correct: number; total: number }> = {
      fear: { correct: 0, total: 0 },
      greed: { correct: 0, total: 0 },
      euphoria: { correct: 0, total: 0 },
      panic: { correct: 0, total: 0 },
      neutral: { correct: 0, total: 0 },
      despair: { correct: 0, total: 0 },
      hope: { correct: 0, total: 0 },
    };
    
    for (const outcome of this.outcomeHistory) {
      accuracy[outcome.emotion].total++;
      if (outcome.wasCorrect) accuracy[outcome.emotion].correct++;
    }
    
    const result: Record<EmotionalState, number> = {} as Record<EmotionalState, number>;
    for (const [emotion, stats] of Object.entries(accuracy)) {
      result[emotion as EmotionalState] = stats.total > 5 ? stats.correct / stats.total : 0.5;
    }
    
    return result;
  }
}

export const emotionalContagionMapper = new EmotionalContagionMapper();
export type { EmotionalState, EmotionMetrics, ContagionState };
