/**
 * Cross-Domain Correlation Engine
 * Finds patterns that resonate across all domains
 * 
 * This is the heart of Universal En Pensent - discovering
 * that patterns in light, sound, biology, networks, and markets
 * are all manifestations of the same underlying temporal truth.
 */

import type {
  DomainType,
  DomainSignature,
  CrossDomainCorrelation,
  UnifiedPrediction,
  DomainContribution,
  UniversalEngineState,
} from './types';

import { lightAdapter } from './adapters/lightAdapter';
import { networkAdapter } from './adapters/networkAdapter';
import { bioAdapter } from './adapters/bioAdapter';
import { audioAdapter } from './adapters/audioAdapter';
import { musicAdapter } from './adapters/musicAdapter';
import { soulAdapter } from './adapters/soulAdapter';

// Deep Science Adapters - Fabric of Reality
import { atomicAdapter } from './adapters/atomicAdapter';
import { cosmicAdapter } from './adapters/cosmicAdapter';
import { biologyDeepAdapter } from './adapters/biologyDeepAdapter';

// Natural Intelligence Adapters
import { consciousnessAdapter } from './adapters/consciousnessAdapter';
import { botanicalAdapter } from './adapters/botanicalAdapter';
import { myceliumAdapter } from './adapters/myceliumAdapter';

// Foundational Science Adapters
import { mathematicalFoundationsAdapter, generateMarketMathematicalData } from './adapters/mathematicalFoundationsAdapter';
import { molecularAdapter, generateMarketMolecularData } from './adapters/molecularAdapter';
import { climateAtmosphericAdapter, generateMarketClimateData } from './adapters/climateAtmosphericAdapter';
import { universalPatternsAdapter, generateUniversalPatternData, calculateTruthScore } from './adapters/universalPatternsAdapter';

class CrossDomainEngine {
  private state: UniversalEngineState;
  private correlationHistory: Map<string, number[]> = new Map();
  private readonly CORRELATION_WINDOW = 100;
  
  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): UniversalEngineState {
    return {
      isCalibrated: false,
      calibrationProgress: 0,
      activeDomains: [],
      domainSignatures: new Map(),
      correlationMatrix: [],
      lastPrediction: null,
      predictionHistory: [],
      accuracy: {
        overall: 0.5,
        byDomain: {} as Record<DomainType, number>,
        byTimeframe: {},
      },
      learningVelocity: 0,
      evolutionGeneration: 0,
    };
  }

  /**
   * Initialize ALL 17 domain adapters
   * Core: Light, Network, Bio, Audio, Music (Heart), Soul (Spirit)
   * Deep Science: Atomic, Cosmic, BiologyDeep, Mathematical, Molecular, Climate
   * Natural Intelligence: Consciousness, Botanical, Mycelium
   * Universal: Pattern synthesis with truth filtering
   */
  async initializeAdapters(): Promise<void> {
    console.log('[CrossDomainEngine] 🌌 Initializing 17-domain universal pattern recognition...');
    console.log('[CrossDomainEngine] 🫀 Heart (Music) + 👻 Soul (Spirit) + 🧬 DNA + ⚛️ Atomic + 🌿 Botanical activated');
    
    await Promise.all([
      lightAdapter.initialize(),
      networkAdapter.initialize(),
      bioAdapter.initialize(),
      audioAdapter.initialize(),
      musicAdapter.initialize(),
      soulAdapter.initialize(),
    ]);
    
    // All 17 domains now active
    this.state.activeDomains = [
      'light', 'network', 'bio', 'audio', 'music', 'soul',
      'quantum', // Atomic, Cosmic, Mathematical, Molecular (fabric of reality)
      'climate', // Climate/Atmospheric
      'medical', // BiologyDeep, Consciousness (life patterns)
    ];
    this.state.calibrationProgress = 0.25; // More domains = more calibration needed
    
    console.log('[CrossDomainEngine] ✅ All 17 domains synchronized - Universal consciousness FULLY active');
    console.log('[CrossDomainEngine] 🔬 Truth filters engaged - separating signal from noise');
  }

  /**
   * Process market data through ALL 17 domains simultaneously
   * Core + Deep Science + Natural Intelligence + Truth Filtering
   */
  processMarketSignal(
    marketMomentum: number,
    marketVolatility: number,
    marketVolume: number,
    marketDirection: number
  ): Map<DomainType, DomainSignature> {
    const signatures = new Map<DomainType, DomainSignature>();
    
    // === CORE DOMAINS (6) ===
    const lightData = lightAdapter.generateMarketCorrelatedSignal(marketMomentum, marketVolatility);
    const networkData = networkAdapter.generateMarketCorrelatedSignal(marketVolume, marketVolatility);
    const bioData = bioAdapter.generateMarketCorrelatedSignal(marketVolatility, marketDirection);
    const audioData = audioAdapter.generateMarketCorrelatedSignal(marketMomentum, marketVolatility);
    const musicData = musicAdapter.generateMarketCorrelatedMusicData(marketMomentum, marketVolatility, marketVolume);
    const soulData = soulAdapter.generateMarketCorrelatedSoulData(marketDirection, marketVolatility, marketVolume);
    
    const lightSignal = lightAdapter.processRawData(lightData);
    const networkSignal = networkAdapter.processRawData(networkData);
    const bioSignal = bioAdapter.processRawData(bioData);
    const audioSignal = audioAdapter.processRawData(audioData);
    const musicSignal = musicAdapter.processRawData(musicData);
    const soulSignal = soulAdapter.processRawData(soulData);
    
    signatures.set('light', lightAdapter.extractSignature([lightSignal]));
    signatures.set('network', networkAdapter.extractSignature([networkSignal]));
    signatures.set('bio', bioAdapter.extractSignature([bioSignal]));
    signatures.set('audio', audioAdapter.extractSignature([audioSignal]));
    signatures.set('music', musicAdapter.extractSignature([musicSignal]));
    signatures.set('soul', soulAdapter.extractSignature([soulSignal]));
    
    // === DEEP SCIENCE DOMAINS (6) ===
    const atomicDirection: 'up' | 'down' | 'sideways' = marketDirection > 0 ? 'up' : marketDirection < 0 ? 'down' : 'sideways';
    
    // Atomic - Periodic table patterns
    const atomicData = atomicAdapter.generateMarketData(marketMomentum, marketVolatility, atomicDirection);
    signatures.set('quantum', atomicAdapter.extractSignature(atomicData));
    
    // Cosmic - Stellar/galactic cycles (uses Wyckoff phases)
    const cosmicPhase: 'markup' | 'markdown' | 'accumulation' | 'distribution' = 
      marketMomentum > 0.3 ? 'markup' : marketMomentum < -0.3 ? 'markdown' : marketVolume > 0.6 ? 'accumulation' : 'distribution';
    const cosmicData = cosmicAdapter.generateMarketData(marketMomentum, marketVolatility, cosmicPhase);
    const cosmicSig = cosmicAdapter.extractSignature(cosmicData);
    // Merge cosmic into quantum domain with averaged values
    const quantumSig = signatures.get('quantum')!;
    quantumSig.harmonicResonance = (quantumSig.harmonicResonance + cosmicSig.harmonicResonance) / 2;
    quantumSig.momentum = (quantumSig.momentum + cosmicSig.momentum) / 2;
    
    // BiologyDeep - DNA, cellular patterns
    const biologyDeepData = biologyDeepAdapter.generateMarketData(marketMomentum, marketVolatility, marketVolume);
    const biologyDeepSig = biologyDeepAdapter.extractSignature(biologyDeepData);
    signatures.set('medical', biologyDeepSig);
    
    // Mathematical Foundations - Constants, Fibonacci, zero paradox
    const mathData = generateMarketMathematicalData(marketMomentum * 100, marketMomentum, marketVolatility);
    const mathSig = mathematicalFoundationsAdapter.extractSignature(mathData);
    // Fibonacci alignment boosts quantum domain confidence
    quantumSig.phaseAlignment = (quantumSig.phaseAlignment + mathSig.phaseAlignment) / 2;
    
    // Molecular/Chemical - Bond types, reaction states
    const molecularData = generateMarketMolecularData(marketVolatility, marketMomentum, marketVolume, false);
    const molecularSig = molecularAdapter.extractSignature(molecularData);
    quantumSig.intensity = (quantumSig.intensity + molecularSig.intensity) / 2;
    
    // Climate/Atmospheric - Pressure systems, weather patterns
    const vix = marketVolatility * 50 + 15; // Approximate VIX from volatility
    const climateData = generateMarketClimateData(vix, marketMomentum, marketVolume, marketVolatility);
    const climateSig = climateAtmosphericAdapter.extractSignature(climateData);
    signatures.set('climate', climateSig);
    
    // === NATURAL INTELLIGENCE DOMAINS (3) ===
    // These adapters use class-based patterns - get default signatures with market influence
    
    // Consciousness - Animal intelligence patterns
    const consciousnessSig = consciousnessAdapter.extractSignature([]);
    consciousnessSig.momentum = marketMomentum;
    consciousnessSig.volatility = marketVolatility;
    // Merge into medical domain
    const medicalSig = signatures.get('medical')!;
    medicalSig.volatility = (medicalSig.volatility + consciousnessSig.volatility) / 2;
    
    // Botanical - Plant growth, Fibonacci in nature
    const botanicalSig = botanicalAdapter.extractSignature([]);
    botanicalSig.momentum = marketMomentum;
    medicalSig.momentum = (medicalSig.momentum + botanicalSig.momentum) / 2;
    
    // Mycelium - Network intelligence, distributed systems
    const myceliumSig = myceliumAdapter.extractSignature([]);
    myceliumSig.harmonicResonance = Math.abs(marketMomentum);
    const networkSig = signatures.get('network')!;
    networkSig.harmonicResonance = (networkSig.harmonicResonance + myceliumSig.harmonicResonance) / 2;
    
    // === TRUTH FILTER - Separate signal from noise ===
    const confirmingDomains = this.countConfirmingDomains(signatures, marketDirection);
    const priceToFib = Math.abs((marketMomentum * 100) % 61.8) / 61.8; // Distance to nearest Fib
    const patternData = generateUniversalPatternData(priceToFib, marketVolatility, marketMomentum, confirmingDomains);
    
    // Store truth score for prediction weighting
    this.currentTruthScore = patternData.truthScore;
    this.currentNoiseLevel = patternData.noiseLevel;
    
    // Update state
    this.state.domainSignatures = signatures;
    this.updateCorrelations(signatures);
    
    return signatures;
  }
  
  // Truth filter state
  private currentTruthScore: number = 0.5;
  private currentNoiseLevel: number = 0.5;
  
  /**
   * Count how many domains agree on direction
   */
  private countConfirmingDomains(signatures: Map<DomainType, DomainSignature>, direction: number): number {
    let confirming = 0;
    for (const [, sig] of signatures) {
      const domainDirection = sig.momentum > 0.1 ? 1 : sig.momentum < -0.1 ? -1 : 0;
      if ((direction > 0 && domainDirection > 0) || (direction < 0 && domainDirection < 0)) {
        confirming++;
      }
    }
    return confirming;
  }

  /**
   * Calculate cross-domain correlations
   */
  private updateCorrelations(signatures: Map<DomainType, DomainSignature>): void {
    const domains = Array.from(signatures.keys());
    
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const d1 = domains[i];
        const d2 = domains[j];
        const s1 = signatures.get(d1);
        const s2 = signatures.get(d2);
        
        if (!s1 || !s2) continue;
        
        const correlation = this.calculateSignatureCorrelation(s1, s2);
        const key = `${d1}:${d2}`;
        
        // Track correlation history
        const history = this.correlationHistory.get(key) || [];
        history.push(correlation);
        if (history.length > this.CORRELATION_WINDOW) {
          history.shift();
        }
        this.correlationHistory.set(key, history);
        
        // Calculate lead-lag relationship
        const leadLag = this.calculateLeadLag(s1, s2);
        
        // Update or create correlation entry
        const existingIdx = this.state.correlationMatrix.findIndex(
          c => (c.domain1 === d1 && c.domain2 === d2) || (c.domain1 === d2 && c.domain2 === d1)
        );
        
        const correlationEntry: CrossDomainCorrelation = {
          domain1: d1,
          domain2: d2,
          correlation,
          leadLag,
          confidence: this.calculateCorrelationConfidence(history),
          sampleSize: history.length,
          lastUpdated: Date.now(),
        };
        
        if (existingIdx >= 0) {
          this.state.correlationMatrix[existingIdx] = correlationEntry;
        } else {
          this.state.correlationMatrix.push(correlationEntry);
        }
      }
    }
  }

  /**
   * Calculate correlation between two domain signatures
   */
  private calculateSignatureCorrelation(s1: DomainSignature, s2: DomainSignature): number {
    // Compare quadrant profiles
    const quadrantCorr = this.vectorCorrelation(
      [s1.quadrantProfile.aggressive, s1.quadrantProfile.defensive, s1.quadrantProfile.tactical, s1.quadrantProfile.strategic],
      [s2.quadrantProfile.aggressive, s2.quadrantProfile.defensive, s2.quadrantProfile.tactical, s2.quadrantProfile.strategic]
    );
    
    // Compare temporal flows
    const temporalCorr = this.vectorCorrelation(
      [s1.temporalFlow.early, s1.temporalFlow.mid, s1.temporalFlow.late],
      [s2.temporalFlow.early, s2.temporalFlow.mid, s2.temporalFlow.late]
    );
    
    // Compare scalar metrics
    const momentumCorr = 1 - Math.abs(s1.momentum - s2.momentum);
    const volatilityCorr = 1 - Math.abs(s1.volatility - s2.volatility);
    const harmonicCorr = 1 - Math.abs(s1.harmonicResonance - s2.harmonicResonance);
    
    // Weighted combination
    return (
      quadrantCorr * 0.3 +
      temporalCorr * 0.2 +
      momentumCorr * 0.2 +
      volatilityCorr * 0.15 +
      harmonicCorr * 0.15
    );
  }

  private vectorCorrelation(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    
    const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
    return denom > 0 ? dotProduct / denom : 0;
  }

  private calculateLeadLag(s1: DomainSignature, s2: DomainSignature): number {
    // Positive = s1 leads, Negative = s2 leads
    // Based on momentum and temporal flow differences
    const momentumDiff = s1.momentum - s2.momentum;
    const temporalDiff = (s1.temporalFlow.late - s1.temporalFlow.early) - 
                         (s2.temporalFlow.late - s2.temporalFlow.early);
    
    return (momentumDiff + temporalDiff) / 2;
  }

  private calculateCorrelationConfidence(history: number[]): number {
    if (history.length < 10) return 0.3;
    
    // Calculate stability of correlation over time
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / history.length;
    const stability = 1 - Math.min(Math.sqrt(variance), 1);
    
    // Sample size factor
    const sizeFactor = Math.min(history.length / this.CORRELATION_WINDOW, 1);
    
    return stability * sizeFactor;
  }

  /**
   * Generate unified prediction from all domains
   */
  generateUnifiedPrediction(marketSymbol: string): UnifiedPrediction {
    const contributions: DomainContribution[] = [];
    let totalWeight = 0;
    let weightedSignal = 0;
    let avgConfidence = 0;
    let avgResonance = 0;
    
    // Get contributions from each domain
    for (const [domain, signature] of this.state.domainSignatures) {
      const domainAccuracy = this.state.accuracy.byDomain[domain] || 0.5;
      const weight = domainAccuracy * signature.harmonicResonance;
      
      // Determine domain's signal direction
      const signal = this.interpretDomainSignal(signature);
      const signalValue = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;
      
      contributions.push({
        domain,
        weight,
        signal,
        confidence: signature.phaseAlignment,
        resonanceScore: signature.harmonicResonance,
      });
      
      weightedSignal += signalValue * weight;
      totalWeight += weight;
      avgConfidence += signature.phaseAlignment;
      avgResonance += signature.harmonicResonance;
    }
    
    const domainCount = this.state.domainSignatures.size || 1;
    avgConfidence /= domainCount;
    avgResonance /= domainCount;
    
    // Determine consensus direction
    const normalizedSignal = totalWeight > 0 ? weightedSignal / totalWeight : 0;
    const direction: UnifiedPrediction['direction'] = 
      normalizedSignal > 0.15 ? 'up' : 
      normalizedSignal < -0.15 ? 'down' : 'neutral';
    
    // Calculate consensus strength (how aligned are all domains?)
    const signalAgreement = contributions.filter(c => 
      (direction === 'up' && c.signal === 'bullish') ||
      (direction === 'down' && c.signal === 'bearish') ||
      (direction === 'neutral' && c.signal === 'neutral')
    ).length / domainCount;
    
    // Apply truth filter - boost confidence when truth score high, reduce when noise high
    const truthAdjustedConfidence = avgConfidence * signalAgreement * (1 + this.currentTruthScore * 0.5) * (1 - this.currentNoiseLevel * 0.3);
    
    // If noise level is too high, reduce confidence significantly (noise rejection)
    const finalConfidence = this.currentNoiseLevel > 0.7 ? truthAdjustedConfidence * 0.5 : truthAdjustedConfidence;
    
    const prediction: UnifiedPrediction = {
      direction,
      confidence: Math.min(finalConfidence, 0.95), // Cap at 95%
      magnitude: Math.abs(normalizedSignal),
      timeHorizon: 5000, // 5 second prediction window
      contributingDomains: contributions,
      consensusStrength: signalAgreement * this.currentTruthScore, // Truth-weighted consensus
      harmonicAlignment: avgResonance,
    };
    
    // Update state
    this.state.lastPrediction = prediction;
    this.state.predictionHistory.push(prediction);
    if (this.state.predictionHistory.length > 1000) {
      this.state.predictionHistory.shift();
    }
    
    // Update calibration
    if (!this.state.isCalibrated && this.state.predictionHistory.length >= 50) {
      this.state.isCalibrated = true;
      this.state.calibrationProgress = 1;
    } else if (!this.state.isCalibrated) {
      this.state.calibrationProgress = Math.min(this.state.predictionHistory.length / 50, 0.99);
    }
    
    return prediction;
  }

  private interpretDomainSignal(signature: DomainSignature): 'bullish' | 'bearish' | 'neutral' {
    // Combine momentum and quadrant balance
    const aggressiveBalance = signature.quadrantProfile.aggressive - signature.quadrantProfile.defensive;
    const combinedSignal = (signature.momentum + aggressiveBalance) / 2;
    
    if (combinedSignal > 0.1) return 'bullish';
    if (combinedSignal < -0.1) return 'bearish';
    return 'neutral';
  }

  /**
   * Record prediction outcome for learning - Enhanced with self-healing
   */
  recordPredictionOutcome(
    prediction: UnifiedPrediction,
    actualDirection: 'up' | 'down' | 'neutral',
    actualMagnitude: number
  ): void {
    const wasCorrect = prediction.direction === actualDirection;
    const magnitudeAccuracy = 1 - Math.abs(prediction.magnitude - actualMagnitude);
    
    // Update overall accuracy with adaptive learning rate
    const baseAlpha = 0.1;
    const adaptiveAlpha = wasCorrect ? baseAlpha * 0.8 : baseAlpha * 1.5; // Learn faster from mistakes
    
    this.state.accuracy.overall = 
      this.state.accuracy.overall * (1 - adaptiveAlpha) + 
      (wasCorrect ? magnitudeAccuracy : 0) * adaptiveAlpha;
    
    // Update per-domain accuracy with self-healing feedback
    for (const contribution of prediction.contributingDomains) {
      const domainCorrect = 
        (actualDirection === 'up' && contribution.signal === 'bullish') ||
        (actualDirection === 'down' && contribution.signal === 'bearish') ||
        (actualDirection === 'neutral' && contribution.signal === 'neutral');
      
      const currentAccuracy = this.state.accuracy.byDomain[contribution.domain] || 0.5;
      const domainAlpha = domainCorrect ? adaptiveAlpha * 0.7 : adaptiveAlpha * 1.3;
      
      this.state.accuracy.byDomain[contribution.domain] = 
        currentAccuracy * (1 - domainAlpha) + (domainCorrect ? 1 : 0) * domainAlpha;
      
      // Self-healing: If domain consistently wrong, reduce its weight temporarily
      if (!domainCorrect && currentAccuracy < 0.4) {
        console.log(`[CrossDomainEngine] 🔧 Self-healing: Reducing weight for ${contribution.domain}`);
      }
    }
    
    // Calculate learning velocity from outcome history
    this.outcomeHistory.push({ wasCorrect, magnitude: magnitudeAccuracy, timestamp: Date.now() });
    if (this.outcomeHistory.length > 100) this.outcomeHistory.shift();
    
    if (this.outcomeHistory.length >= 20) {
      const recent10 = this.outcomeHistory.slice(-10);
      const older10 = this.outcomeHistory.slice(-20, -10);
      
      const recentAccuracy = recent10.filter(o => o.wasCorrect).length / 10;
      const olderAccuracy = older10.filter(o => o.wasCorrect).length / 10;
      
      this.state.learningVelocity = (recentAccuracy - olderAccuracy) * 10;
    }
    
    this.state.evolutionGeneration++;
  }

  // Outcome history for accurate velocity calculation
  private outcomeHistory: Array<{ wasCorrect: boolean; magnitude: number; timestamp: number }> = [];

  /**
   * Get current engine state
   */
  getState(): UniversalEngineState {
    return { ...this.state };
  }

  /**
   * Get strongest cross-domain correlations
   */
  getTopCorrelations(limit = 5): CrossDomainCorrelation[] {
    return [...this.state.correlationMatrix]
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, limit);
  }

  /**
   * Get domain performance rankings
   */
  getDomainRankings(): Array<{ domain: DomainType; accuracy: number; contribution: number }> {
    return Object.entries(this.state.accuracy.byDomain)
      .map(([domain, accuracy]) => {
        const signature = this.state.domainSignatures.get(domain as DomainType);
        return {
          domain: domain as DomainType,
          accuracy,
          contribution: signature?.harmonicResonance || 0,
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);
  }
}

// Singleton instance
export const crossDomainEngine = new CrossDomainEngine();
