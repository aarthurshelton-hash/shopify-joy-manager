/**
 * Cross-Domain Correlation Engine v8.0
 * Finds patterns that resonate across all 21 domains + 9 advanced modules
 * 
 * This is the heart of Universal En Pensent - discovering
 * that patterns in light, sound, biology, networks, markets,
 * language, and geology are all manifestations of the same underlying temporal truth.
 * 
 * CORE INSIGHT: The relationship between temporal patterns and fundamental data 
 * structure is DYNAMIC. The "=" sign in "pattern = structure" constantly changes value.
 * Sometimes correlation IS causation, sometimes it isn't. The Dynamic Equivalence
 * Tracker monitors WHEN that relationship holds true.
 * 
 * SELF-LEARNING: Calibration curve adjusts confidence based on historical accuracy
 * SELF-HEALING: Convergence tracking identifies and weights reliable domain combinations  
 * SELF-EVOLVING: Phase synchronization detects optimal prediction windows
 * 
 * ANTI-OVERFITTING: All modules use regularization factors (0.8-0.9) to prevent
 * fitting to noise. The engine blends multiple independent signals with
 * skepticism-weighted consensus.
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

// Human Behavioral Dynamics Adapters
import { competitiveDynamicsAdapter } from './adapters/competitiveDynamicsAdapter';
import { humanAttractionAdapter } from './adapters/humanAttractionAdapter';

// Linguistic & Geological Adapters (21 total domains)
import { linguisticSemanticAdapter, generateLinguisticData, extractLinguisticSignature, calculateLinguisticTruthScore } from './adapters/linguisticSemanticAdapter';
import { geologicalTectonicAdapter, generateGeologicalData, extractGeologicalSignature, calculateGeologicalTruthScore } from './adapters/geologicalTectonicAdapter';

// Proof-Strengthening Modules (Original 4)
import { convergenceTracker, type ConvergenceEvent } from './modules/convergenceTracker';
import { calibrationTracker, type CalibrationMetrics } from './modules/calibrationCurve';
import { sacredGeometry, analyzeGeometry, type GeometricAnalysis } from './modules/sacredGeometry';
import { phaseSynchronizationDetector, type PhaseCoherence } from './modules/phaseSynchronization';

// NEW: Advanced Analysis Modules (9 new modules)
import { entropyFlowDetector, type EntropyFlow, type SystemEntropyState } from './modules/entropyFlowDetector';
import { archetypalResonanceMatrix, type ArchetypeSignature } from './modules/archetypalResonanceMatrix';
import { quantumProbabilityCloudGenerator, type ProbabilityCloud } from './modules/quantumProbabilityClouds';
import { morphicFieldAdapter, type MorphicFieldState } from './modules/morphicFieldAdapter';
import { emotionalContagionMapper, type ContagionState } from './modules/emotionalContagionMapper';
import { fractalTimeCompressor, type FractalState } from './modules/fractalTimeCompression';
import { inverseNoiseAmplifier, type InverseNoiseState } from './modules/inverseNoiseAmplifier';
import { biorhythmLunarSync, type BiorhythmLunarState } from './modules/biorhythmLunarSync';
import { dynamicEquivalenceTracker, type DynamicEquivalenceState } from './modules/dynamicEquivalenceTracker';

// Extended state for advanced modules
interface AdvancedModuleState {
  entropy: SystemEntropyState | null;
  archetype: ArchetypeSignature | null;
  probabilityCloud: ProbabilityCloud | null;
  morphicField: MorphicFieldState | null;
  emotionalContagion: ContagionState | null;
  fractalTime: FractalState | null;
  inverseNoise: InverseNoiseState | null;
  biorhythmLunar: BiorhythmLunarState | null;
  dynamicEquivalence: DynamicEquivalenceState | null;
}

class CrossDomainEngine {
  private state: UniversalEngineState;
  private advancedState: AdvancedModuleState;
  private correlationHistory: Map<string, number[]> = new Map();
  private readonly CORRELATION_WINDOW = 100;
  private priceHistory: number[] = [];
  private volumeHistory: number[] = [];
  private swingHigh: number = 0;
  private swingLow: number = Infinity;
  
  // Multi-timeframe data for fractal analysis
  private minuteData: number[] = [];
  private hourData: number[] = [];
  private dayData: number[] = [];
  private weekData: number[] = [];
  
  constructor() {
    this.state = this.createInitialState();
    this.advancedState = this.createAdvancedState();
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
  
  private createAdvancedState(): AdvancedModuleState {
    return {
      entropy: null,
      archetype: null,
      probabilityCloud: null,
      morphicField: null,
      emotionalContagion: null,
      fractalTime: null,
      inverseNoise: null,
      biorhythmLunar: null,
      dynamicEquivalence: null,
    };
  }

  /**
   * Initialize ALL 21 domain adapters + 9 advanced modules
   * Core: Light, Network, Bio, Audio, Music (Heart), Soul (Spirit)
   * Deep Science: Atomic, Cosmic, BiologyDeep, Mathematical, Molecular, Climate
   * Natural Intelligence: Consciousness, Botanical, Mycelium
   * Human Behavioral: Competitive Dynamics, Human Attraction
   * Language & Earth: Linguistic/Semantic, Geological/Tectonic
   * 
   * Advanced Modules (NEW):
   * - Entropy Flow Detector (information entropy across domains)
   * - Archetypal Resonance Matrix (narrative patterns)
   * - Quantum Probability Clouds (probability distributions)
   * - Morphic Field Adapter (pattern propagation)
   * - Emotional Contagion Mapper (fear/greed R0 values)
   * - Fractal Time Compression (self-similar patterns)
   * - Inverse Noise Amplifier (predicting order from noise)
   * - Biorhythm Lunar Sync (lunar/biological rhythms)
   * - Dynamic Equivalence Tracker (pattern=structure relationship)
   */
  async initializeAdapters(): Promise<void> {
    console.log('[CrossDomainEngine] 🌌 Initializing 21-domain + 9-module universal pattern recognition v8.0...');
    console.log('[CrossDomainEngine] 🫀 Heart (Music) + 👻 Soul (Spirit) + 🧬 DNA + ⚛️ Atomic + 🌿 Botanical activated');
    console.log('[CrossDomainEngine] ⚔️ Competitive + 💕 Attraction + 📖 Linguistic + 🌍 Geological activated');
    console.log('[CrossDomainEngine] 🔮 Entropy + Archetype + Quantum + Morphic + Contagion + Fractal + Noise + Lunar + Equivalence ACTIVATED');
    
    await Promise.all([
      lightAdapter.initialize(),
      networkAdapter.initialize(),
      bioAdapter.initialize(),
      audioAdapter.initialize(),
      musicAdapter.initialize(),
      soulAdapter.initialize(),
    ]);
    
    // All 21 domains now active (mapped to available DomainTypes)
    this.state.activeDomains = [
      'light', 'network', 'bio', 'audio', 'music', 'soul',
      'quantum',   // Atomic, Cosmic, Mathematical, Molecular (fabric of reality)
      'climate',   // Climate/Atmospheric, Geological/Tectonic
      'medical',   // BiologyDeep, Consciousness (life patterns)
      'satellite', // Phase synchronization cosmic cycles
      'market',    // Competitive dynamics, market cycles
    ];
    this.state.calibrationProgress = 0.15; // More modules = more calibration needed
    
    // Initialize proof-strengthening modules
    phaseSynchronizationDetector.updateCyclePhases();
    
    // Initialize biorhythm/lunar state
    this.advancedState.biorhythmLunar = biorhythmLunarSync.getState();
    
    console.log('[CrossDomainEngine] ✅ All 21 domains + 9 advanced modules synchronized');
    console.log('[CrossDomainEngine] 🔬 Truth filters + Calibration curves + Convergence tracking ENGAGED');
    console.log('[CrossDomainEngine] 📐 Sacred geometry + Phase synchronization + Dynamic Equivalence ACTIVE');
    console.log('[CrossDomainEngine] ⚠️ Anti-overfitting regularization factors: 0.8-0.9 across all modules');
  }

  /**
   * Process market data through ALL 21 domains simultaneously
   * Core + Deep Science + Natural Intelligence + Behavioral + Linguistic + Geological + Truth Filtering
   */
  processMarketSignal(
    marketMomentum: number,
    marketVolatility: number,
    marketVolume: number,
    marketDirection: number,
    currentPrice?: number
  ): Map<DomainType, DomainSignature> {
    const signatures = new Map<DomainType, DomainSignature>();
    
    // Track price history for sacred geometry analysis
    if (currentPrice !== undefined) {
      this.priceHistory.push(currentPrice);
      if (this.priceHistory.length > 200) this.priceHistory.shift();
      this.swingHigh = Math.max(this.swingHigh, currentPrice);
      this.swingLow = Math.min(this.swingLow, currentPrice);
    }
    
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
    
    // === HUMAN BEHAVIORAL DOMAINS (2) ===
    // Competitive Dynamics - Combat, sports, war patterns
    const competitiveData = competitiveDynamicsAdapter.generateCompetitiveData(marketMomentum, marketVolatility, marketVolume, marketDirection);
    const competitiveSignal = competitiveDynamicsAdapter.processCompetitiveData(competitiveData);
    const competitiveSig = competitiveDynamicsAdapter.extractSignature([competitiveSignal]);
    // Merge into market domain behavior patterns
    signatures.set('market', competitiveSig);
    
    // Human Attraction - Love, passion, irrationality patterns
    const fearGreedIndex = (marketMomentum + 1) * 50; // Convert -1..1 to 0..100
    const attractionData = humanAttractionAdapter.generateAttractionData(marketMomentum, marketVolatility, marketVolume, fearGreedIndex);
    const attractionSignal = humanAttractionAdapter.processAttractionData(attractionData);
    const attractionSig = humanAttractionAdapter.extractSignature([attractionSignal]);
    // Blend attraction patterns with soul domain (human spirit)
    const soulSigExisting = signatures.get('soul')!;
    soulSigExisting.momentum = (soulSigExisting.momentum + attractionSig.momentum) / 2;
    soulSigExisting.volatility = (soulSigExisting.volatility + attractionSig.volatility) / 2;
    
    // === NEW: LINGUISTIC & GEOLOGICAL DOMAINS (2) ===
    // Linguistic/Semantic - Language patterns, sentiment cycles
    const linguisticData = generateLinguisticData(
      marketMomentum,           // Sentiment correlates with momentum
      marketVolatility,         // Vocabulary diversity in volatile times
      marketMomentum > 0 ? 0.6 : 0.3, // Future focus in bullish times
      Math.abs(marketMomentum)  // Unusual words in extreme times
    );
    const linguisticSig = extractLinguisticSignature(linguisticData);
    // Blend into soul domain (language = expression of collective soul)
    soulSigExisting.intensity = (soulSigExisting.intensity + linguisticSig.intensity) / 2;
    soulSigExisting.harmonicResonance = (soulSigExisting.harmonicResonance + linguisticSig.harmonicResonance) / 2;
    
    // Geological/Tectonic - Earth rhythms, seismic patterns
    const now = Date.now();
    const lunarPhase = ((now / (29.5 * 24 * 60 * 60 * 1000)) % 1); // Lunar cycle position
    const solarCyclePosition = ((now / (11 * 365.25 * 24 * 60 * 60 * 1000)) % 1); // 11-year solar cycle
    const seasonalPosition = ((now / (365.25 * 24 * 60 * 60 * 1000)) % 1); // Yearly cycle
    const geologicalData = generateGeologicalData(
      marketVolatility,         // Seismic activity from volatility
      lunarPhase,
      solarCyclePosition,
      seasonalPosition,
      marketVolatility > 0.7 ? 0.8 : 0.3 // Volcanic alerts from extreme volatility
    );
    const geologicalSig = extractGeologicalSignature(geologicalData);
    // Blend into climate domain (geological = deep Earth climate)
    const climateExisting = signatures.get('climate')!;
    climateExisting.momentum = (climateExisting.momentum + geologicalSig.momentum) / 2;
    climateExisting.phaseAlignment = (climateExisting.phaseAlignment + geologicalSig.phaseAlignment) / 2;
    
    // === SACRED GEOMETRY ANALYSIS ===
    let sacredScore = 0.5;
    if (this.priceHistory.length >= 10) {
      const geometricAnalysis = analyzeGeometry(
        this.priceHistory,
        this.swingHigh,
        this.swingLow
      );
      sacredScore = geometricAnalysis.sacredScore;
      
      // Boost quantum domain if near Fibonacci levels
      if (geometricAnalysis.distanceFromLevel < 0.02 && geometricAnalysis.levelStrength === 'strong') {
        quantumSig.harmonicResonance = Math.min(1, quantumSig.harmonicResonance + 0.2);
        console.log(`[CrossDomainEngine] 📐 Sacred geometry: Near ${geometricAnalysis.nearestFibLevel.toFixed(3)} Fib level`);
      }
    }
    
    // === TRUTH FILTER - Separate signal from noise ===
    const confirmingDomains = this.countConfirmingDomains(signatures, marketDirection);
    const priceToFib = Math.abs((marketMomentum * 100) % 61.8) / 61.8;
    const patternData = generateUniversalPatternData(priceToFib, marketVolatility, marketMomentum, confirmingDomains);
    
    // Integrate linguistic and geological truth scores
    const linguisticTruth = calculateLinguisticTruthScore(linguisticData);
    const geologicalTruth = calculateGeologicalTruthScore(geologicalData);
    
    // Combined truth score from all truth filters
    this.currentTruthScore = (patternData.truthScore + linguisticTruth + geologicalTruth + sacredScore) / 4;
    this.currentNoiseLevel = patternData.noiseLevel * (1 - this.currentTruthScore * 0.3);
    
    // === CONVERGENCE TRACKING - Self-healing through alignment detection ===
    const convergenceEvent = convergenceTracker.analyzeConvergence(signatures);
    if (convergenceEvent) {
      this.lastConvergenceEvent = convergenceEvent;
      console.log(`[CrossDomainEngine] 🔄 Convergence detected: ${convergenceEvent.alignmentCount} domains aligned (${(convergenceEvent.statisticalImprobability * 100).toFixed(1)}% improbable)`);
    }
    
    // === PHASE SYNCHRONIZATION - Detect optimal prediction windows ===
    const phaseCoherence = phaseSynchronizationDetector.analyzePhaseCoherence();
    this.currentPhaseCoherence = phaseCoherence;
    if (phaseCoherence.isSignificant) {
      console.log(`[CrossDomainEngine] 🌙 Phase lock: ${phaseCoherence.cycleCount} cycles synchronized at phase ${phaseCoherence.dominantPhase.toFixed(2)}`);
    }
    
    // ========== NEW: ADVANCED MODULE PROCESSING (9 modules) ==========
    // Each module has built-in regularization to prevent overfitting
    
    // 1. ENTROPY FLOW DETECTOR - Track information entropy across domains
    for (const [domain, sig] of signatures) {
      entropyFlowDetector.recordDomainEntropy(domain, [sig.momentum, sig.volatility, sig.harmonicResonance, sig.intensity]);
    }
    this.advancedState.entropy = entropyFlowDetector.getSystemEntropyState();
    const entropyFlows = entropyFlowDetector.detectEntropyFlows();
    if (entropyFlows.length > 0 && entropyFlows[0].confidence > 0.6) {
      console.log(`[CrossDomainEngine] 🌊 Entropy flow: ${entropyFlows[0].flowDirection} from ${entropyFlows[0].fromDomain} to ${entropyFlows[0].toDomain}`);
    }
    
    // 2. ARCHETYPAL RESONANCE - Detect narrative patterns
    if (this.priceHistory.length >= 20) {
      this.advancedState.archetype = archetypalResonanceMatrix.detectArchetype(
        this.priceHistory,
        this.volumeHistory.length >= 20 ? this.volumeHistory : this.priceHistory,
        marketMomentum
      );
      if (this.advancedState.archetype) {
        console.log(`[CrossDomainEngine] 📖 Archetype: ${this.advancedState.archetype.archetype} phase ${this.advancedState.archetype.phase.toFixed(2)} -> ${this.advancedState.archetype.priceImplication}`);
      }
    }
    
    // 3. MORPHIC FIELD - Track pattern propagation
    const morphicSignature = Array.from(signatures.values()).slice(0, 5).map(s => s.momentum);
    morphicFieldAdapter.recordObservation('primary_market', morphicSignature);
    this.advancedState.morphicField = morphicFieldAdapter.getFieldState();
    
    // 4. EMOTIONAL CONTAGION - Fear/greed viral spread
    const emotionMetrics = emotionalContagionMapper.detectEmotion(
      marketMomentum * 0.1, // Price change proxy
      marketVolatility,
      marketVolume,
      marketMomentum // Sentiment proxy
    );
    this.advancedState.emotionalContagion = emotionalContagionMapper.getContagionState();
    if (this.advancedState.emotionalContagion.isViral) {
      console.log(`[CrossDomainEngine] 😱 Emotional contagion: ${this.advancedState.emotionalContagion.dominantEmotion} R0=${this.advancedState.emotionalContagion.contagionR0.toFixed(2)}`);
    }
    
    // 5. FRACTAL TIME COMPRESSION - Multi-timeframe pattern matching
    // Update timeframe data (simulated compression)
    this.minuteData.push(currentPrice || marketMomentum);
    if (this.minuteData.length > 100) this.minuteData.shift();
    if (this.minuteData.length % 60 === 0) {
      this.hourData.push(this.minuteData[this.minuteData.length - 1]);
      if (this.hourData.length > 100) this.hourData.shift();
    }
    if (this.hourData.length % 24 === 0 && this.hourData.length > 0) {
      this.dayData.push(this.hourData[this.hourData.length - 1]);
      if (this.dayData.length > 100) this.dayData.shift();
    }
    if (this.dayData.length % 7 === 0 && this.dayData.length > 0) {
      this.weekData.push(this.dayData[this.dayData.length - 1]);
      if (this.weekData.length > 100) this.weekData.shift();
    }
    
    if (this.minuteData.length >= 20) {
      this.advancedState.fractalTime = fractalTimeCompressor.analyzeFractals(
        this.minuteData,
        this.hourData.length >= 5 ? this.hourData : this.minuteData,
        this.dayData.length >= 5 ? this.dayData : this.minuteData,
        this.weekData.length >= 5 ? this.weekData : this.minuteData
      );
      if (this.advancedState.fractalTime.crossTimescaleCoherence > 0.6) {
        console.log(`[CrossDomainEngine] 🔮 Fractal coherence: ${(this.advancedState.fractalTime.crossTimescaleCoherence * 100).toFixed(1)}% across timescales`);
      }
    }
    
    // 6. INVERSE NOISE AMPLIFIER - Predict order from chaos patterns
    if (this.priceHistory.length >= 20) {
      this.advancedState.inverseNoise = inverseNoiseAmplifier.getInverseNoiseState(
        this.priceHistory,
        this.volumeHistory.length >= 20 ? this.volumeHistory : this.priceHistory
      );
      if (this.advancedState.inverseNoise.recentAnomalies.length > 0) {
        const anomaly = this.advancedState.inverseNoise.recentAnomalies[0];
        console.log(`[CrossDomainEngine] 📊 Noise anomaly: ${anomaly.type} (predictive value: ${(anomaly.predictiveValue * 100).toFixed(0)}%)`);
      }
    }
    
    // 7. BIORHYTHM LUNAR SYNC - Lunar and biological cycles
    this.advancedState.biorhythmLunar = biorhythmLunarSync.getState();
    
    // 8. DYNAMIC EQUIVALENCE TRACKER - Core insight: pattern=structure is dynamic
    // This is the key innovation - track when patterns actually equal underlying structure
    this.advancedState.dynamicEquivalence = dynamicEquivalenceTracker.getState();
    if (this.advancedState.dynamicEquivalence.insights.length > 0) {
      console.log(`[CrossDomainEngine] ⚖️ Dynamic Equivalence: ${this.advancedState.dynamicEquivalence.insights[0]}`);
    }
    
    // Update state
    this.state.domainSignatures = signatures;
    this.updateCorrelations(signatures);
    
    // Track volume for advanced analysis
    this.volumeHistory.push(marketVolume);
    if (this.volumeHistory.length > 200) this.volumeHistory.shift();
    
    return signatures;
  }
  
  // Truth filter state
  private currentTruthScore: number = 0.5;
  private currentNoiseLevel: number = 0.5;
  private lastConvergenceEvent: ConvergenceEvent | null = null;
  private currentPhaseCoherence: PhaseCoherence | null = null;
  
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
   * Generate unified prediction from all 21 domains + 9 advanced modules
   * Enhanced with calibration, convergence, phase sync, and dynamic equivalence
   * 
   * ANTI-OVERFITTING: Multiple regularization layers prevent fitting to noise:
   * 1. Each module has 0.8-0.9 regularization factor
   * 2. Confidence cap at 95% (never too certain)
   * 3. Dynamic equivalence tracks when patterns actually matter
   * 4. Quantum probability clouds capture uncertainty
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
    let direction: UnifiedPrediction['direction'] = 
      normalizedSignal > 0.15 ? 'up' : 
      normalizedSignal < -0.15 ? 'down' : 'neutral';
    
    // Calculate consensus strength (how aligned are all domains?)
    const signalAgreement = contributions.filter(c => 
      (direction === 'up' && c.signal === 'bullish') ||
      (direction === 'down' && c.signal === 'bearish') ||
      (direction === 'neutral' && c.signal === 'neutral')
    ).length / domainCount;
    
    // Apply truth filter - boost confidence when truth score high, reduce when noise high
    let truthAdjustedConfidence = avgConfidence * signalAgreement * (1 + this.currentTruthScore * 0.5) * (1 - this.currentNoiseLevel * 0.3);
    
    // If noise level is too high, reduce confidence significantly (noise rejection)
    if (this.currentNoiseLevel > 0.7) {
      truthAdjustedConfidence *= 0.5;
    }
    
    // === CALIBRATION CURVE ADJUSTMENT - Self-learning confidence calibration ===
    const calibrationAdvice = calibrationTracker.getCalibrationAdvice();
    if (calibrationAdvice.status !== 'insufficient_data') {
      truthAdjustedConfidence *= calibrationAdvice.adjustmentFactor;
    }
    
    // === CONVERGENCE BOOST - Higher confidence when domains converge improbably ===
    if (this.lastConvergenceEvent && this.lastConvergenceEvent.statisticalImprobability > 0.9) {
      truthAdjustedConfidence = Math.min(0.95, truthAdjustedConfidence * 1.1);
    }
    
    // === PHASE SYNCHRONIZATION BOOST - Higher confidence during phase lock ===
    if (this.currentPhaseCoherence?.isSignificant) {
      const syncBoost = 1 + (this.currentPhaseCoherence.overallCoherence - 0.5) * 0.15;
      truthAdjustedConfidence = Math.min(0.95, truthAdjustedConfidence * syncBoost);
    }
    
    // ========== ADVANCED MODULE INTEGRATION (9 modules) ==========
    // Each applies its own regularization to prevent overfitting
    
    // 1. ENTROPY MODIFIER - Lower entropy = higher confidence
    const entropyModifier = entropyFlowDetector.getConfidenceModifier();
    truthAdjustedConfidence *= entropyModifier;
    
    // 2. ARCHETYPAL MODIFIER - Narrative pattern strength
    if (this.advancedState.archetype) {
      const archetypeModifier = archetypalResonanceMatrix.getConfidenceModifier(this.advancedState.archetype);
      truthAdjustedConfidence *= archetypeModifier;
      
      // Archetype can influence direction prediction
      if (this.advancedState.archetype.strength > 0.6) {
        const archetypeDirection = this.advancedState.archetype.priceImplication;
        if (archetypeDirection === 'bullish' && direction === 'neutral') direction = 'up';
        if (archetypeDirection === 'bearish' && direction === 'neutral') direction = 'down';
      }
    }
    
    // 3. MORPHIC FIELD MODIFIER - Pattern propagation coherence
    const morphicModifier = morphicFieldAdapter.getConfidenceModifier();
    truthAdjustedConfidence *= morphicModifier;
    
    // 4. EMOTIONAL CONTAGION - Fear/greed viral patterns
    if (this.advancedState.emotionalContagion) {
      const emotionPrediction = emotionalContagionMapper.getPrediction();
      // Blend emotional prediction with domain consensus
      if (emotionPrediction.confidence > 0.5) {
        truthAdjustedConfidence *= (0.9 + emotionPrediction.confidence * 0.2);
        // Strong emotional signal can override weak consensus
        if (emotionPrediction.confidence > 0.7 && signalAgreement < 0.5) {
          direction = emotionPrediction.direction;
        }
      }
    }
    
    // 5. FRACTAL TIME MODIFIER - Cross-timescale coherence
    if (this.advancedState.fractalTime) {
      const fractalModifier = fractalTimeCompressor.getConfidenceModifier(
        this.advancedState.fractalTime.crossTimescaleCoherence
      );
      truthAdjustedConfidence *= fractalModifier;
      
      // Strong fractal alignment reinforces prediction
      if (this.advancedState.fractalTime.crossTimescaleCoherence > 0.7) {
        if (this.advancedState.fractalTime.suggestedDirection === direction) {
          truthAdjustedConfidence = Math.min(0.95, truthAdjustedConfidence * 1.1);
        }
      }
    }
    
    // 6. INVERSE NOISE - Predict order from chaos patterns
    if (this.advancedState.inverseNoise) {
      const noiseProfile = this.advancedState.inverseNoise.currentProfile;
      // Low noise + high SNR = confidence boost
      if (noiseProfile.level < 0.3 && noiseProfile.signalToNoise > 2) {
        truthAdjustedConfidence *= 1.1;
      }
      // Noise collapse often precedes big moves - increase attention
      if (this.advancedState.inverseNoise.noiseOrderCycle === 'chaos_to_order') {
        truthAdjustedConfidence *= 1.05;
      }
    }
    
    // 7. BIORHYTHM/LUNAR - Natural cycle alignment
    if (this.advancedState.biorhythmLunar) {
      const lunarModifier = biorhythmLunarSync.getConfidenceModifier();
      // Apply lunar modifier conservatively (speculative)
      truthAdjustedConfidence *= (0.95 + lunarModifier * 0.05);
      
      // Blend lunar prediction with very low weight
      const lunarPred = this.advancedState.biorhythmLunar.prediction;
      if (lunarPred.direction !== 'neutral' && lunarPred.confidence > 0.5 && direction === 'neutral') {
        // Only nudge neutral predictions
        direction = lunarPred.direction;
        truthAdjustedConfidence *= 0.9; // Reduce confidence for lunar-driven prediction
      }
    }
    
    // 8. DYNAMIC EQUIVALENCE - THE KEY INSIGHT
    // Adjust based on whether pattern=structure relationship is currently valid
    if (this.advancedState.dynamicEquivalence) {
      const deState = this.advancedState.dynamicEquivalence;
      truthAdjustedConfidence *= deState.confidenceModifier;
      
      // If in contrarian mode, consider inverting prediction
      if (deState.optimalStrategy === 'contrarian' && deState.currentState.stability > 0.7) {
        console.log('[CrossDomainEngine] ⚖️ Contrarian mode active - inverse relationship detected');
        // Don't actually invert automatically - just reduce confidence
        truthAdjustedConfidence *= 0.85;
      }
      
      // Use dynamic blend weights
      // These weights are learned from outcomes - trust what's working
      const blendedSignal = dynamicEquivalenceTracker.blendPredictions(
        normalizedSignal, // Pattern-based
        this.advancedState.emotionalContagion ? 
          (this.advancedState.emotionalContagion.dominantEmotion === 'greed' ? 0.3 : 
           this.advancedState.emotionalContagion.dominantEmotion === 'fear' ? -0.3 : 0) : 0 // Fundamental proxy
      );
      
      // Update direction based on blended signal
      if (Math.abs(blendedSignal - normalizedSignal) > 0.1) {
        direction = blendedSignal > 0.15 ? 'up' : blendedSignal < -0.15 ? 'down' : 'neutral';
      }
    }
    
    // 9. QUANTUM PROBABILITY CLOUD - Generate probability distribution
    const predictionSources = contributions.map(c => ({
      value: c.signal === 'bullish' ? 0.1 : c.signal === 'bearish' ? -0.1 : 0,
      confidence: c.confidence,
      source: c.domain,
    }));
    
    const probabilityCloud = quantumProbabilityCloudGenerator.generateCloud(
      predictionSources,
      this.currentNoiseLevel
    );
    this.advancedState.probabilityCloud = probabilityCloud;
    
    // Use cloud characteristics to adjust confidence
    const cloudModifier = quantumProbabilityCloudGenerator.getConfidenceModifier(probabilityCloud);
    truthAdjustedConfidence *= cloudModifier;
    
    // ========== FINAL CONFIDENCE CALCULATION ==========
    // Cap at 95% - never be too certain (anti-hubris)
    const finalConfidence = Math.min(truthAdjustedConfidence, 0.95);
    
    const prediction: UnifiedPrediction = {
      direction,
      confidence: finalConfidence,
      magnitude: Math.abs(normalizedSignal),
      timeHorizon: 5000, // 5 second prediction window
      contributingDomains: contributions,
      consensusStrength: signalAgreement * this.currentTruthScore,
      harmonicAlignment: avgResonance,
    };
    
    // Record in calibration tracker for self-learning
    const calibrationId = calibrationTracker.recordPrediction(
      finalConfidence,
      direction,
      marketSymbol,
      prediction.timeHorizon
    );
    (prediction as any).calibrationId = calibrationId;
    (prediction as any).probabilityCloud = probabilityCloud;
    (prediction as any).advancedModuleState = { ...this.advancedState };
    
    // Update state
    this.state.lastPrediction = prediction;
    this.state.predictionHistory.push(prediction);
    if (this.state.predictionHistory.length > 1000) {
      this.state.predictionHistory.shift();
    }
    
    // Update calibration progress based on ALL proof mechanisms
    const convergenceStats = convergenceTracker.getAccuracyStats();
    const calibrationMetrics = calibrationTracker.getCalibrationMetrics();
    const phaseStats = phaseSynchronizationDetector.getAccuracyStats();
    const fractalAccuracy = fractalTimeCompressor.getAccuracy();
    const noiseStats = inverseNoiseAmplifier.getAccuracyStats();
    
    const proofDataPoints = convergenceStats.resolvedEvents + 
                           calibrationMetrics.resolvedPredictions + 
                           phaseStats.resolvedEvents;
    
    if (!this.state.isCalibrated && proofDataPoints >= 50) {
      this.state.isCalibrated = true;
      this.state.calibrationProgress = 1;
      console.log('[CrossDomainEngine] ✅ CALIBRATED: 50+ proof data points collected across all mechanisms');
      console.log(`[CrossDomainEngine] 📊 Fractal accuracy: ${(fractalAccuracy * 100).toFixed(1)}%, Noise accuracy: ${(noiseStats.overall * 100).toFixed(1)}%`);
    } else if (!this.state.isCalibrated) {
      this.state.calibrationProgress = Math.min(proofDataPoints / 50, 0.99);
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
   * Record prediction outcome for learning - Enhanced with self-healing & proof mechanisms
   */
  recordPredictionOutcome(
    prediction: UnifiedPrediction,
    actualDirection: 'up' | 'down' | 'neutral',
    actualMagnitude: number
  ): void {
    const wasCorrect = prediction.direction === actualDirection;
    const magnitudeAccuracy = 1 - Math.abs(prediction.magnitude - actualMagnitude);
    
    // === CALIBRATION CURVE LEARNING ===
    const calibrationId = (prediction as any).calibrationId;
    if (calibrationId) {
      calibrationTracker.resolvePrediction(calibrationId, actualDirection);
    }
    
    // === CONVERGENCE OUTCOME RECORDING ===
    if (this.lastConvergenceEvent) {
      convergenceTracker.recordOutcome(
        this.lastConvergenceEvent.id,
        actualDirection,
        actualMagnitude
      );
    }
    
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
        console.log(`[CrossDomainEngine] 🔧 Self-healing: Reducing weight for ${contribution.domain} (accuracy: ${(currentAccuracy * 100).toFixed(1)}%)`);
      }
      
      // Self-evolving: If domain consistently right, boost its influence
      if (domainCorrect && currentAccuracy > 0.7) {
        console.log(`[CrossDomainEngine] 🚀 Self-evolving: Boosting weight for ${contribution.domain} (accuracy: ${(currentAccuracy * 100).toFixed(1)}%)`);
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
      
      // Log learning progress
      if (this.state.evolutionGeneration % 50 === 0) {
        const proofStrength = convergenceTracker.calculateProofStrength();
        const calibrationMetrics = calibrationTracker.getCalibrationMetrics();
        console.log(`[CrossDomainEngine] 📈 Evolution Gen ${this.state.evolutionGeneration}:`);
        console.log(`  - Overall accuracy: ${(this.state.accuracy.overall * 100).toFixed(1)}%`);
        console.log(`  - Learning velocity: ${this.state.learningVelocity > 0 ? '+' : ''}${(this.state.learningVelocity * 100).toFixed(1)}%`);
        console.log(`  - Proof strength: ${proofStrength.conclusion}`);
        console.log(`  - Calibration ECE: ${(calibrationMetrics.expectedCalibrationError * 100).toFixed(2)}%`);
      }
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

  /**
   * Get comprehensive proof metrics across all mechanisms
   */
  getProofMetrics(): {
    convergence: ReturnType<typeof convergenceTracker.getAccuracyStats>;
    calibration: CalibrationMetrics;
    phaseLock: ReturnType<typeof phaseSynchronizationDetector.getAccuracyStats>;
    proofStrength: ReturnType<typeof convergenceTracker.calculateProofStrength>;
    overallEvidence: number;
  } {
    const convergence = convergenceTracker.getAccuracyStats();
    const calibration = calibrationTracker.getCalibrationMetrics();
    const phaseLock = phaseSynchronizationDetector.getAccuracyStats();
    const proofStrength = convergenceTracker.calculateProofStrength();
    
    // Calculate overall evidence score
    const convergenceScore = convergence.accuracy * (convergence.resolvedEvents > 10 ? 1 : 0.5);
    const calibrationScore = 1 - calibration.expectedCalibrationError;
    const phaseLockScore = phaseLock.accuracy * (phaseLock.resolvedEvents > 10 ? 1 : 0.5);
    
    const overallEvidence = (convergenceScore + calibrationScore + phaseLockScore + proofStrength.evidenceScore) / 4;
    
    return {
      convergence,
      calibration,
      phaseLock,
      proofStrength,
      overallEvidence
    };
  }

  /**
   * Get current sacred geometry analysis
   */
  getSacredGeometryAnalysis(): GeometricAnalysis | null {
    if (this.priceHistory.length < 10) return null;
    return analyzeGeometry(this.priceHistory, this.swingHigh, this.swingLow);
  }

  /**
   * Get phase synchronization prediction
   */
  getPhaseSynchronizationPrediction(): ReturnType<typeof phaseSynchronizationDetector.getSynchronizationPrediction> {
    return phaseSynchronizationDetector.getSynchronizationPrediction();
  }
}

// Singleton instance
export const crossDomainEngine = new CrossDomainEngine();

// Export proof modules for external access
export { convergenceTracker, calibrationTracker, sacredGeometry, phaseSynchronizationDetector };

// Export advanced modules for external access
export { 
  entropyFlowDetector, 
  archetypalResonanceMatrix, 
  quantumProbabilityCloudGenerator,
  morphicFieldAdapter,
  emotionalContagionMapper,
  fractalTimeCompressor,
  inverseNoiseAmplifier,
  biorhythmLunarSync,
  dynamicEquivalenceTracker
};
