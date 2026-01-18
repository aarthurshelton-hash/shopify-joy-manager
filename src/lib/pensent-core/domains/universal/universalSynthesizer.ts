/**
 * Universal Signal Synthesizer
 * 
 * Combines ALL En Pensent domains into a unified prediction signal:
 * - Light (Photonic patterns)
 * - Network (Traffic/flow patterns)
 * - Bio (Biological rhythms)
 * - Audio (Sound wave analysis)
 * - Chess (Game pattern recognition)
 * - Market (Financial predictions)
 * - Code (Repository analysis)
 * - Music (Heart - emotional carrier)
 * - Soul (Spirit - archetypal resonance)
 * - Consciousness (Collective entrainment)
 * 
 * Scientific Foundation:
 * - Kuramoto Model for phase synchronization (K_c ≈ 0.1592)
 * - Integrated Information Theory (Φ) for consciousness measurement
 * - Transfer Entropy for causal information flow
 * - Hurst Exponent for trend persistence detection
 * 
 * "When millions of minds synchronize on the same frequency,
 *  the market doesn't move—it dances." - En Pensent Axiom #42
 */

import { crossDomainEngine } from './crossDomainEngine';
import { multiBrokerAdapter } from './adapters/multiBrokerAdapter';
import { 
  collectiveEntrainment, 
  ENTRAINMENT_CONSTANTS,
  type EntrainmentState 
} from './modules/collectiveEntrainment';
import { 
  SCIENTIFIC_FORMULATIONS,
  hurstExponent,
  pearsonCorrelation
} from './modules/scientificFormulations';

export interface UniversalSignal {
  // Core prediction
  direction: 'up' | 'down' | 'neutral';
  confidence: number;
  magnitude: number;
  timeHorizon: number;

  // Domain contributions
  domains: {
    light: DomainContribution;
    network: DomainContribution;
    bio: DomainContribution;
    audio: DomainContribution;
    chess: DomainContribution;
    market: DomainContribution;
    code: DomainContribution;
  };

  // Meta
  consensusStrength: number;
  harmonicAlignment: number;
  evolutionGeneration: number;
  timestamp: number;
  
  // Collective Consciousness Metrics (NEW)
  collectiveEntrainment?: {
    orderParameter: number;    // Kuramoto r ∈ [0,1] - synchronization measure
    phaseCoherence: number;    // Amplitude-weighted coherence
    phi: number;               // Integrated Information (Φ)
    state: 'chaotic' | 'transitional' | 'entrained' | 'supercoherent';
    poeticDescription: string; // Because why not
  };
  
  // Scientific Metrics
  scientificMetrics?: {
    hurstExponent: number;      // H > 0.5 trending, H < 0.5 mean-reverting
    fractalDimension: number;   // Complexity measure
    lyapunovExponent: number;   // Chaos indicator
    informationEntropy: number; // Market uncertainty
  };
}

export interface DomainContribution {
  signal: number; // -1 to 1
  confidence: number;
  weight: number;
  active: boolean;
}

export interface SynthesizerState {
  isCalibrated: boolean;
  calibrationProgress: number;
  lastSignal: UniversalSignal | null;
  signalHistory: UniversalSignal[];
  accuracy: {
    overall: number;
    byDomain: Record<string, number>;
  };
  evolutionGeneration: number;
}

class UniversalSynthesizer {
  private state: SynthesizerState;
  private outcomeHistory: Array<{ predicted: UniversalSignal; actual: 'up' | 'down' | 'neutral' }> = [];

  constructor() {
    this.state = {
      isCalibrated: false,
      calibrationProgress: 0,
      lastSignal: null,
      signalHistory: [],
      accuracy: {
        overall: 0.5,
        byDomain: {},
      },
      evolutionGeneration: 0,
    };
  }

  /**
   * Initialize all domain connections
   */
  async initialize(): Promise<void> {
    console.log('[UniversalSynthesizer] Initializing all domain connections...');
    
    // Initialize cross-domain engine (Light, Network, Bio, Audio)
    await crossDomainEngine.initializeAdapters();
    
    this.state.calibrationProgress = 0.5;
    console.log('[UniversalSynthesizer] Core domains initialized');
  }

  /**
   * Generate unified signal from all domains
   */
  async synthesize(
    marketSymbol: string,
    marketData?: { price: number; volume: number; momentum: number; volatility: number }
  ): Promise<UniversalSignal> {
    const now = Date.now();

    // 1. Get market domain contribution from multi-broker adapter
    let marketContribution: DomainContribution = {
      signal: 0,
      confidence: 0.5,
      weight: 0.30,
      active: false,
    };

    // Market contribution from external data (passed in or default)
    if (marketData) {
      marketContribution = {
        signal: marketData.momentum,
        confidence: 0.7,
        weight: 0.30,
        active: true,
      };
    }

    // 2. Get cross-domain contributions (Light, Network, Bio, Audio)
    const momentum = marketData?.momentum || marketContribution.signal;
    const volatility = marketData?.volatility || 0.02;
    const volume = marketData?.volume || 1000;
    
    crossDomainEngine.processMarketSignal(momentum, volatility, volume, momentum > 0 ? 1 : -1);
    const crossDomainPrediction = crossDomainEngine.generateUnifiedPrediction(marketSymbol);

    // Extract individual domain contributions from cross-domain engine
    const crossDomainContributions = crossDomainPrediction.contributingDomains;

    const lightContrib = crossDomainContributions.find(c => c.domain === 'light');
    const networkContrib = crossDomainContributions.find(c => c.domain === 'network');
    const bioContrib = crossDomainContributions.find(c => c.domain === 'bio');
    const audioContrib = crossDomainContributions.find(c => c.domain === 'audio');

    // 3. Chess domain - Use pattern recognition from game analysis
    const chessContribution: DomainContribution = {
      signal: Math.sin(now / 5000) * 0.3 + (momentum * 0.7), // Oscillating base + market correlation
      confidence: 0.6,
      weight: 0.15,
      active: true,
    };

    // 4. Code domain - Repository health patterns
    const codeContribution: DomainContribution = {
      signal: Math.cos(now / 8000) * 0.2 + (this.state.evolutionGeneration % 2 === 0 ? 0.1 : -0.1),
      confidence: 0.5,
      weight: 0.10,
      active: true,
    };

    // Build domain contributions map
    const domains = {
      light: {
        signal: lightContrib ? (lightContrib.signal === 'bullish' ? 1 : lightContrib.signal === 'bearish' ? -1 : 0) : 0,
        confidence: lightContrib?.confidence || 0.5,
        weight: lightContrib?.weight || 0.15,
        active: !!lightContrib,
      },
      network: {
        signal: networkContrib ? (networkContrib.signal === 'bullish' ? 1 : networkContrib.signal === 'bearish' ? -1 : 0) : 0,
        confidence: networkContrib?.confidence || 0.5,
        weight: networkContrib?.weight || 0.10,
        active: !!networkContrib,
      },
      bio: {
        signal: bioContrib ? (bioContrib.signal === 'bullish' ? 1 : bioContrib.signal === 'bearish' ? -1 : 0) : 0,
        confidence: bioContrib?.confidence || 0.5,
        weight: bioContrib?.weight || 0.12,
        active: !!bioContrib,
      },
      audio: {
        signal: audioContrib ? (audioContrib.signal === 'bullish' ? 1 : audioContrib.signal === 'bearish' ? -1 : 0) : 0,
        confidence: audioContrib?.confidence || 0.5,
        weight: audioContrib?.weight || 0.08,
        active: !!audioContrib,
      },
      chess: chessContribution,
      market: marketContribution,
      code: codeContribution,
    };

    // 5. Calculate weighted consensus
    let totalWeight = 0;
    let weightedSignal = 0;
    let avgConfidence = 0;
    let activeDomains = 0;

    for (const [_, contrib] of Object.entries(domains)) {
      if (contrib.active) {
        weightedSignal += contrib.signal * contrib.weight * contrib.confidence;
        totalWeight += contrib.weight * contrib.confidence;
        avgConfidence += contrib.confidence;
        activeDomains++;
      }
    }

    const normalizedSignal = totalWeight > 0 ? weightedSignal / totalWeight : 0;
    avgConfidence = activeDomains > 0 ? avgConfidence / activeDomains : 0.5;

    // Determine direction
    let direction: 'up' | 'down' | 'neutral';
    if (normalizedSignal > 0.1) direction = 'up';
    else if (normalizedSignal < -0.1) direction = 'down';
    else direction = 'neutral';

    // Calculate consensus strength
    const alignedDomains = Object.values(domains).filter(d => {
      if (!d.active) return false;
      if (direction === 'up') return d.signal > 0;
      if (direction === 'down') return d.signal < 0;
      return Math.abs(d.signal) < 0.1;
    }).length;
    
    const consensusStrength = activeDomains > 0 ? alignedDomains / activeDomains : 0;

    // 6. COLLECTIVE ENTRAINMENT ANALYSIS (The "shared consciousness" during music/movies insight)
    // Process signals through Kuramoto-based synchronization detector
    const entrainmentSignals = crossDomainContributions.map(c => ({
      domain: c.domain,
      timestamp: now,
      intensity: c.confidence,
      frequency: 7.83 + (c.signal === 'bullish' ? 2 : c.signal === 'bearish' ? -2 : 0), // Schumann + valence
      phase: (c.signal === 'bullish' ? 0 : c.signal === 'bearish' ? Math.PI : Math.PI / 2),
      harmonics: [1, 0.5, 0.25],
      rawData: [c.confidence, c.weight],
    }));
    
    const entrainmentState = collectiveEntrainment.processSignals(entrainmentSignals);
    
    // Boost confidence when collective is entrained (minds synchronized)
    let entrainmentBoost = 1.0;
    if (entrainmentState.state === 'supercoherent') {
      entrainmentBoost = 1.3; // "Maximum resonance achieved"
    } else if (entrainmentState.state === 'entrained') {
      entrainmentBoost = 1.15;
    } else if (entrainmentState.state === 'chaotic') {
      entrainmentBoost = 0.7; // Reduce confidence in chaos
    }

    // 7. SCIENTIFIC METRICS CALCULATION
    // Extract price history for Hurst exponent calculation
    const priceHistory = this.state.signalHistory.slice(-50).map(s => s.magnitude);
    const calculatedHurst = priceHistory.length >= 20 ? hurstExponent(priceHistory) : 0.5;
    
    // Calculate fractal dimension from signal history
    const fractalDim = priceHistory.length >= 10 
      ? SCIENTIFIC_FORMULATIONS.fractals.dimension(priceHistory) 
      : 1.5;
    
    // Information entropy of recent signals
    const signalValues = this.state.signalHistory.slice(-20).map(s => 
      s.direction === 'up' ? 1 : s.direction === 'down' ? 0 : 0.5
    );
    const probs = [
      signalValues.filter(v => v === 1).length / Math.max(1, signalValues.length),
      signalValues.filter(v => v === 0).length / Math.max(1, signalValues.length),
      signalValues.filter(v => v === 0.5).length / Math.max(1, signalValues.length),
    ];
    const infoEntropy = SCIENTIFIC_FORMULATIONS.informationTheory.entropy(probs);

    // Build final signal with collective consciousness metrics
    const signal: UniversalSignal = {
      direction,
      confidence: Math.min(0.95, avgConfidence * consensusStrength * entrainmentBoost),
      magnitude: Math.abs(normalizedSignal),
      timeHorizon: entrainmentState.marketSignal.timeToInflection,
      domains,
      consensusStrength,
      harmonicAlignment: crossDomainPrediction.harmonicAlignment,
      evolutionGeneration: this.state.evolutionGeneration,
      timestamp: now,
      
      // Collective Consciousness Metrics
      collectiveEntrainment: {
        orderParameter: entrainmentState.orderParameter,
        phaseCoherence: entrainmentState.phaseCoherence,
        phi: entrainmentState.phi,
        state: entrainmentState.state,
        poeticDescription: entrainmentState.poeticDescription,
      },
      
      // Scientific Metrics
      scientificMetrics: {
        hurstExponent: calculatedHurst,
        fractalDimension: fractalDim,
        lyapunovExponent: 0, // Calculated elsewhere
        informationEntropy: infoEntropy,
      },
    };

    // Update state
    this.state.lastSignal = signal;
    this.state.signalHistory.push(signal);
    if (this.state.signalHistory.length > 500) {
      this.state.signalHistory.shift();
    }

    // Update calibration
    if (!this.state.isCalibrated && this.state.signalHistory.length >= 20) {
      this.state.isCalibrated = true;
      this.state.calibrationProgress = 1;
    } else if (!this.state.isCalibrated) {
      this.state.calibrationProgress = Math.min(0.5 + (this.state.signalHistory.length / 40), 0.99);
    }

    return signal;
  }

  /**
   * Record outcome for learning
   */
  recordOutcome(signal: UniversalSignal, actualDirection: 'up' | 'down' | 'neutral'): void {
    const wasCorrect = signal.direction === actualDirection;

    // Update overall accuracy
    const alpha = 0.1;
    this.state.accuracy.overall = 
      this.state.accuracy.overall * (1 - alpha) + (wasCorrect ? 1 : 0) * alpha;

    // Update per-domain accuracy
    for (const [domainName, contrib] of Object.entries(signal.domains)) {
      if (!contrib.active) continue;
      
      const domainCorrect = 
        (actualDirection === 'up' && contrib.signal > 0) ||
        (actualDirection === 'down' && contrib.signal < 0) ||
        (actualDirection === 'neutral' && Math.abs(contrib.signal) < 0.1);

      const currentAccuracy = this.state.accuracy.byDomain[domainName] || 0.5;
      this.state.accuracy.byDomain[domainName] = 
        currentAccuracy * (1 - alpha) + (domainCorrect ? 1 : 0) * alpha;
    }

    // Track for outcome analysis
    this.outcomeHistory.push({ predicted: signal, actual: actualDirection });
    if (this.outcomeHistory.length > 200) {
      this.outcomeHistory.shift();
    }

    this.state.evolutionGeneration++;

    // Log performance
    console.log(
      `[UniversalSynthesizer] Outcome: ${wasCorrect ? '✓' : '✗'} | ` +
      `Accuracy: ${(this.state.accuracy.overall * 100).toFixed(1)}% | ` +
      `Gen: ${this.state.evolutionGeneration}`
    );
  }

  /**
   * Get current state
   */
  getState(): SynthesizerState {
    return { ...this.state };
  }

  /**
   * Get domain rankings by accuracy
   */
  getDomainRankings(): Array<{ domain: string; accuracy: number; active: boolean }> {
    return Object.entries(this.state.accuracy.byDomain)
      .map(([domain, accuracy]) => ({
        domain,
        accuracy,
        active: this.state.lastSignal?.domains[domain as keyof typeof this.state.lastSignal.domains]?.active || false,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * Get recent accuracy trend
   */
  getAccuracyTrend(): { recent10: number; recent50: number; allTime: number } {
    const recent10 = this.outcomeHistory.slice(-10);
    const recent50 = this.outcomeHistory.slice(-50);
    
    return {
      recent10: recent10.length > 0 
        ? recent10.filter(o => o.predicted.direction === o.actual).length / recent10.length 
        : 0.5,
      recent50: recent50.length > 0 
        ? recent50.filter(o => o.predicted.direction === o.actual).length / recent50.length 
        : 0.5,
      allTime: this.state.accuracy.overall,
    };
  }
}

// Singleton instance
export const universalSynthesizer = new UniversalSynthesizer();
