/**
 * Consciousness Resonance Detector
 * 
 * Detects collective market synchronization patterns.
 * 
 * CEO INSIGHT: When millions of market participants unconsciously synchronize
 * their decision-making rhythms, powerful trend waves emerge.
 * 
 * Based on Kuramoto synchronization model adapted for financial markets.
 */

import type { BigPictureState, MarketTick, CrossMarketSignal } from './crossMarket/types';

// ============================================================================
// CONSCIOUSNESS RESONANCE TYPES
// ============================================================================

export interface ResonanceState {
  globalSynchronization: number;   // 0-1: How synchronized market participants are
  dominantFrequency: number;       // Hz: Main oscillation frequency
  phaseAlignment: number;          // 0-1: How aligned the phases are
  resonanceType: ResonanceType;
  collectiveMood: CollectiveMood;
  entrainmentStrength: number;     // How strongly participants are being pulled into sync
  breakoutProbability: number;     // Probability of breaking current resonance
  signals: ResonanceSignal[];
  lastUpdated: Date;
}

export type ResonanceType = 
  | 'COHERENT_BULL'      // Synchronized bullish behavior
  | 'COHERENT_BEAR'      // Synchronized bearish behavior
  | 'CHAOTIC_SCATTER'    // No synchronization - random walk
  | 'BIFURCATION'        // About to split into two camps
  | 'PHASE_TRANSITION'   // Shifting from one state to another
  | 'STABLE_OSCILLATION' // Regular back-and-forth
  | 'CRYSTALLIZING';     // Rapidly approaching full sync

export type CollectiveMood =
  | 'EUPHORIA'           // Extreme greed, near top
  | 'OPTIMISM'           // Healthy bullishness
  | 'UNCERTAINTY'        // Neither bull nor bear
  | 'ANXIETY'            // Growing fear
  | 'CAPITULATION'       // Extreme fear, near bottom
  | 'DEPRESSION'         // Post-crash apathy
  | 'DISBELIEF';         // Early rally skepticism

export interface ResonanceSignal {
  type: string;
  strength: number;
  description: string;
  timestamp: Date;
}

// ============================================================================
// KURAMOTO SYNCHRONIZATION PARAMETERS
// ============================================================================

/**
 * Kuramoto model: dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)
 * 
 * In market terms:
 * - θᵢ = individual trader's "phase" (bullish to bearish position)
 * - ωᵢ = natural trading frequency (scalper to investor)
 * - K = coupling strength (how much traders influence each other)
 * - N = number of market participants
 */
const KURAMOTO_PARAMS = {
  criticalCoupling: 0.4,    // K_c - below this, no sync; above, spontaneous sync
  phaseNoise: 0.1,          // Random fluctuations in individual behavior
  couplingDecay: 0.01,      // How fast coupling weakens without reinforcement
  syncThreshold: 0.7,       // r > 0.7 = coherent synchronization
  bifurcationThreshold: 0.4 // Multiple attractors emerge
};

// ============================================================================
// DETECTOR CLASS
// ============================================================================

class ConsciousnessResonanceDetector {
  private state: ResonanceState;
  private oscillatorPhases: number[] = [];
  private priceHistory: number[] = [];
  private volumeHistory: number[] = [];
  private sentimentHistory: number[] = [];
  private maxHistory = 200;

  constructor() {
    this.state = this.createInitialState();
    // Initialize 100 virtual "oscillators" representing market participants
    this.oscillatorPhases = Array.from({ length: 100 }, () => Math.random() * 2 * Math.PI);
  }

  private createInitialState(): ResonanceState {
    return {
      globalSynchronization: 0.5,
      dominantFrequency: 0.1,
      phaseAlignment: 0.5,
      resonanceType: 'CHAOTIC_SCATTER',
      collectiveMood: 'UNCERTAINTY',
      entrainmentStrength: 0,
      breakoutProbability: 0.5,
      signals: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Process market data and detect collective synchronization
   */
  processTick(tick: MarketTick, bigPictureState: BigPictureState): ResonanceState {
    // Update histories
    this.priceHistory.push(tick.price);
    this.volumeHistory.push(tick.volume || 0);
    this.sentimentHistory.push(bigPictureState.marketSentiment);

    if (this.priceHistory.length > this.maxHistory) {
      this.priceHistory.shift();
      this.volumeHistory.shift();
      this.sentimentHistory.shift();
    }

    // Update oscillator simulation with market influence
    this.updateOscillators(tick, bigPictureState);

    // Calculate order parameter (global synchronization)
    const { r, psi } = this.calculateOrderParameter();

    // Detect dominant frequency via simple autocorrelation
    const dominantFrequency = this.detectDominantFrequency();

    // Determine resonance type
    const resonanceType = this.determineResonanceType(r, bigPictureState);

    // Determine collective mood
    const collectiveMood = this.determineCollectiveMood(bigPictureState, r);

    // Calculate entrainment strength
    const entrainmentStrength = this.calculateEntrainmentStrength(r, bigPictureState);

    // Calculate breakout probability
    const breakoutProbability = this.calculateBreakoutProbability(r, resonanceType);

    // Generate signals
    const signals = this.generateSignals(r, resonanceType, collectiveMood, bigPictureState);

    this.state = {
      globalSynchronization: r,
      dominantFrequency,
      phaseAlignment: (Math.cos(psi) + 1) / 2, // Normalize to 0-1
      resonanceType,
      collectiveMood,
      entrainmentStrength,
      breakoutProbability,
      signals,
      lastUpdated: new Date()
    };

    return this.state;
  }

  /**
   * Update oscillator phases using Kuramoto model
   */
  private updateOscillators(tick: MarketTick, bigPicture: BigPictureState): void {
    const N = this.oscillatorPhases.length;
    const K = 0.3 + bigPicture.volatilityIndex / 100; // Coupling increases with volatility
    
    // Calculate mean field
    let sumSin = 0;
    let sumCos = 0;
    for (const phase of this.oscillatorPhases) {
      sumSin += Math.sin(phase);
      sumCos += Math.cos(phase);
    }
    const meanPhase = Math.atan2(sumSin, sumCos);
    
    // Market sentiment acts as external force
    const externalForce = bigPicture.marketSentiment * 0.1;
    
    // Update each oscillator
    for (let i = 0; i < N; i++) {
      // Natural frequency (different traders have different rhythms)
      const omega = 0.01 + (i / N) * 0.1;
      
      // Kuramoto coupling term
      const coupling = (K / N) * Math.sin(meanPhase - this.oscillatorPhases[i]);
      
      // Update phase
      const noise = (Math.random() - 0.5) * KURAMOTO_PARAMS.phaseNoise;
      this.oscillatorPhases[i] += omega + coupling + externalForce + noise;
      
      // Keep phase in [0, 2π]
      this.oscillatorPhases[i] = this.oscillatorPhases[i] % (2 * Math.PI);
      if (this.oscillatorPhases[i] < 0) this.oscillatorPhases[i] += 2 * Math.PI;
    }
  }

  /**
   * Calculate Kuramoto order parameter (r, ψ)
   * r = magnitude of synchronization (0 = random, 1 = perfect sync)
   * ψ = collective phase
   */
  private calculateOrderParameter(): { r: number; psi: number } {
    const N = this.oscillatorPhases.length;
    let sumSin = 0;
    let sumCos = 0;
    
    for (const phase of this.oscillatorPhases) {
      sumSin += Math.sin(phase);
      sumCos += Math.cos(phase);
    }
    
    const r = Math.sqrt(sumSin * sumSin + sumCos * sumCos) / N;
    const psi = Math.atan2(sumSin, sumCos);
    
    return { r, psi };
  }

  private detectDominantFrequency(): number {
    if (this.priceHistory.length < 20) return 0.1;
    
    // Simple autocorrelation to find periodicity
    const prices = this.priceHistory.slice(-50);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    let maxCorr = 0;
    let bestLag = 1;
    
    for (let lag = 1; lag < prices.length / 2; lag++) {
      let corr = 0;
      let count = 0;
      for (let i = lag; i < prices.length; i++) {
        corr += (prices[i] - mean) * (prices[i - lag] - mean);
        count++;
      }
      corr /= count;
      
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }
    
    // Convert lag to frequency (assuming ~1 tick per second)
    return 1 / bestLag;
  }

  private determineResonanceType(r: number, bigPicture: BigPictureState): ResonanceType {
    const momentum = bigPicture.marketSentiment;
    const volatility = bigPicture.volatilityIndex / 100;
    
    if (r > KURAMOTO_PARAMS.syncThreshold) {
      if (momentum > 0.3) return 'COHERENT_BULL';
      if (momentum < -0.3) return 'COHERENT_BEAR';
      return 'STABLE_OSCILLATION';
    }
    
    if (r > KURAMOTO_PARAMS.bifurcationThreshold && r < KURAMOTO_PARAMS.syncThreshold) {
      if (volatility > 0.5) return 'BIFURCATION';
      return 'CRYSTALLIZING';
    }
    
    if (volatility > 0.7) {
      return 'PHASE_TRANSITION';
    }
    
    return 'CHAOTIC_SCATTER';
  }

  private determineCollectiveMood(bigPicture: BigPictureState, r: number): CollectiveMood {
    const sentiment = bigPicture.marketSentiment;
    const volatility = bigPicture.volatilityIndex / 100;
    const risk = bigPicture.riskAppetite;
    
    // Extreme synchronized states
    if (r > 0.8 && sentiment > 0.7 && risk > 0.7) return 'EUPHORIA';
    if (r > 0.8 && sentiment < -0.7 && volatility > 0.6) return 'CAPITULATION';
    
    // Moderate states
    if (sentiment > 0.4) return 'OPTIMISM';
    if (sentiment < -0.4 && volatility > 0.4) return 'ANXIETY';
    if (sentiment < -0.6 && volatility < 0.3) return 'DEPRESSION';
    
    // Transition states
    if (r < 0.4 && sentiment > 0.2 && volatility < 0.3) return 'DISBELIEF';
    
    return 'UNCERTAINTY';
  }

  private calculateEntrainmentStrength(r: number, bigPicture: BigPictureState): number {
    // Entrainment = how strongly the collective is pulling individuals into sync
    const baseEntrainment = r * 0.5;
    const volatilityBoost = bigPicture.volatilityIndex / 100 * 0.3;
    const signalBoost = Math.min(bigPicture.activeSignals.length * 0.05, 0.2);
    
    return Math.min(1, baseEntrainment + volatilityBoost + signalBoost);
  }

  private calculateBreakoutProbability(r: number, type: ResonanceType): number {
    // High sync + crystallizing = high breakout probability
    if (type === 'CRYSTALLIZING') return 0.7 + r * 0.2;
    if (type === 'BIFURCATION') return 0.6;
    if (type === 'PHASE_TRANSITION') return 0.8;
    if (type === 'COHERENT_BULL' || type === 'COHERENT_BEAR') {
      // Extremes tend to reverse
      return r > 0.9 ? 0.6 : 0.3;
    }
    return 0.4;
  }

  private generateSignals(
    r: number,
    resonanceType: ResonanceType,
    mood: CollectiveMood,
    bigPicture: BigPictureState
  ): ResonanceSignal[] {
    const signals: ResonanceSignal[] = [];
    const now = new Date();

    // Synchronization signal
    if (r > 0.8) {
      signals.push({
        type: 'HIGH_SYNC',
        strength: r,
        description: `Extreme collective synchronization (${(r * 100).toFixed(0)}%) - reversal likely`,
        timestamp: now
      });
    }

    // Mood transitions
    if (mood === 'EUPHORIA') {
      signals.push({
        type: 'EUPHORIA_WARNING',
        strength: 0.9,
        description: 'Maximum greed detected - classic top signal',
        timestamp: now
      });
    }
    
    if (mood === 'CAPITULATION') {
      signals.push({
        type: 'CAPITULATION_ALERT',
        strength: 0.9,
        description: 'Maximum fear detected - classic bottom signal',
        timestamp: now
      });
    }

    // Resonance type signals
    if (resonanceType === 'CRYSTALLIZING') {
      signals.push({
        type: 'CRYSTALLIZATION',
        strength: 0.75,
        description: 'Market participants rapidly synchronizing - breakout imminent',
        timestamp: now
      });
    }

    if (resonanceType === 'BIFURCATION') {
      signals.push({
        type: 'BIFURCATION',
        strength: 0.6,
        description: 'Market splitting into two camps - expect volatility',
        timestamp: now
      });
    }

    return signals;
  }

  getState(): ResonanceState {
    return { ...this.state };
  }

  /**
   * Get trading recommendation based on consciousness resonance
   */
  getTradingRecommendation(): {
    action: 'BUY' | 'SELL' | 'WAIT' | 'HEDGE';
    confidence: number;
    reasoning: string;
    mood: CollectiveMood;
    synchronization: number;
  } {
    const { globalSynchronization, resonanceType, collectiveMood, breakoutProbability } = this.state;

    let action: 'BUY' | 'SELL' | 'WAIT' | 'HEDGE';
    let reasoning: string;
    let confidence = 0.5;

    // Contrarian signals on extreme moods
    if (collectiveMood === 'EUPHORIA') {
      action = 'SELL';
      confidence = 0.85;
      reasoning = 'EUPHORIA detected - crowd at maximum greed. Fade the crowd.';
    } else if (collectiveMood === 'CAPITULATION') {
      action = 'BUY';
      confidence = 0.85;
      reasoning = 'CAPITULATION detected - crowd at maximum fear. Buy the blood.';
    } else if (collectiveMood === 'DISBELIEF' && globalSynchronization < 0.4) {
      action = 'BUY';
      confidence = 0.7;
      reasoning = 'DISBELIEF phase - early rally not believed. Join quietly.';
    } else if (resonanceType === 'CRYSTALLIZING') {
      action = 'WAIT';
      confidence = 0.6;
      reasoning = 'CRYSTALLIZING - wait for breakout direction before entry.';
    } else if (resonanceType === 'BIFURCATION') {
      action = 'HEDGE';
      confidence = 0.65;
      reasoning = 'BIFURCATION - market splitting. Hedge both directions.';
    } else if (globalSynchronization > 0.85 && resonanceType === 'COHERENT_BULL') {
      action = 'SELL';
      confidence = 0.7;
      reasoning = 'Extreme bullish sync (>85%) - mean reversion likely.';
    } else if (globalSynchronization > 0.85 && resonanceType === 'COHERENT_BEAR') {
      action = 'BUY';
      confidence = 0.7;
      reasoning = 'Extreme bearish sync (>85%) - mean reversion likely.';
    } else {
      action = 'WAIT';
      confidence = 0.4;
      reasoning = `Normal resonance state (${(globalSynchronization * 100).toFixed(0)}% sync). No strong signal.`;
    }

    return {
      action,
      confidence,
      reasoning,
      mood: collectiveMood,
      synchronization: globalSynchronization
    };
  }
}

// Export singleton
export const consciousnessResonanceDetector = new ConsciousnessResonanceDetector();
// Types already exported above via interfaces
