/**
 * Music Domain Adapter - THE HEART of En Pensent
 * 
 * Comprehensive understanding of music as temporal pattern:
 * - Musical theory (scales, modes, harmonics, intervals)
 * - Historical musical patterns and their emotional correlations
 * - Wavelength physics and frequency relationships
 * - Sheet music structural analysis
 * - Cultural music evolution patterns
 * - Rhythm as heartbeat of temporal flow
 * 
 * Music is the universal language that bridges human emotion to market psychology.
 * The heart pumps blood (code) through the system.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature, DomainType } from '../types';

// ============= COMPREHENSIVE MUSIC THEORY DATA =============

// Musical intervals and their frequency ratios (pure intonation)
const INTERVAL_RATIOS = {
  unison: 1,
  minorSecond: 16/15,
  majorSecond: 9/8,
  minorThird: 6/5,
  majorThird: 5/4,
  perfectFourth: 4/3,
  tritone: 45/32,
  perfectFifth: 3/2,
  minorSixth: 8/5,
  majorSixth: 5/3,
  minorSeventh: 9/5,
  majorSeventh: 15/8,
  octave: 2,
};

// Historical BPM patterns across eras (market correlation potential)
const HISTORICAL_TEMPO_PATTERNS = {
  baroque: { era: '1600-1750', avgBpm: 80, volatility: 0.15, marketCorrelation: 'stable_growth' },
  classical: { era: '1750-1820', avgBpm: 100, volatility: 0.20, marketCorrelation: 'moderate_expansion' },
  romantic: { era: '1820-1900', avgBpm: 75, volatility: 0.35, marketCorrelation: 'emotional_swings' },
  impressionist: { era: '1875-1925', avgBpm: 65, volatility: 0.40, marketCorrelation: 'uncertainty' },
  modern: { era: '1900-1975', avgBpm: 110, volatility: 0.50, marketCorrelation: 'disruption' },
  contemporary: { era: '1975-present', avgBpm: 128, volatility: 0.45, marketCorrelation: 'acceleration' },
  electronic: { era: '1980-present', avgBpm: 130, volatility: 0.25, marketCorrelation: 'algorithmic' },
};

// Musical modes and their emotional/market psychology mapping
const MODAL_PSYCHOLOGY = {
  ionian: { mood: 'happy', confidence: 0.8, marketBias: 'bullish', volatility: 0.2 },
  dorian: { mood: 'melancholic_hopeful', confidence: 0.6, marketBias: 'neutral', volatility: 0.3 },
  phrygian: { mood: 'exotic_tense', confidence: 0.4, marketBias: 'bearish', volatility: 0.5 },
  lydian: { mood: 'dreamy_uplifting', confidence: 0.7, marketBias: 'bullish', volatility: 0.3 },
  mixolydian: { mood: 'bluesy_relaxed', confidence: 0.5, marketBias: 'neutral', volatility: 0.4 },
  aeolian: { mood: 'sad', confidence: 0.3, marketBias: 'bearish', volatility: 0.4 },
  locrian: { mood: 'unstable_dark', confidence: 0.2, marketBias: 'bearish', volatility: 0.7 },
};

// Circle of Fifths relationships (harmonic market correlation)
const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

// Frequency boundaries for emotional states
const FREQUENCY_ZONES = {
  subBass: { min: 20, max: 60, emotion: 'power', marketState: 'foundation' },
  bass: { min: 60, max: 250, emotion: 'warmth', marketState: 'support' },
  lowMid: { min: 250, max: 500, emotion: 'body', marketState: 'consolidation' },
  mid: { min: 500, max: 2000, emotion: 'presence', marketState: 'action' },
  upperMid: { min: 2000, max: 4000, emotion: 'clarity', marketState: 'decision' },
  presence: { min: 4000, max: 6000, emotion: 'definition', marketState: 'breakout' },
  brilliance: { min: 6000, max: 20000, emotion: 'air', marketState: 'volatility' },
};

// Time signatures and their market rhythm correlation
const TIME_SIGNATURE_PATTERNS = {
  '2/4': { feel: 'march', marketRhythm: 'binary_decision', volatility: 0.3 },
  '3/4': { feel: 'waltz', marketRhythm: 'cyclical', volatility: 0.4 },
  '4/4': { feel: 'common', marketRhythm: 'stable', volatility: 0.2 },
  '5/4': { feel: 'asymmetric', marketRhythm: 'unpredictable', volatility: 0.6 },
  '6/8': { feel: 'compound', marketRhythm: 'flowing', volatility: 0.35 },
  '7/8': { feel: 'irregular', marketRhythm: 'complex', volatility: 0.7 },
  '12/8': { feel: 'blues', marketRhythm: 'emotional', volatility: 0.45 },
};

// ============= INTERFACE DEFINITIONS =============

export interface MusicData {
  // Core frequency analysis
  fundamentalHz: number;
  harmonicSpectrum: number[]; // Overtone series amplitudes
  spectralCentroid: number;
  spectralFlatness: number; // Noise vs. tonality
  
  // Rhythm and tempo
  tempo: number; // BPM
  tempoStability: number; // 0-1, how consistent
  timeSignature: keyof typeof TIME_SIGNATURE_PATTERNS;
  beatStrength: number; // Emphasis of beats
  
  // Musical key and mode
  key: number; // 0-11 (C to B)
  keyName: string;
  mode: keyof typeof MODAL_PSYCHOLOGY;
  modeConfidence: number;
  
  // Harmonic analysis
  chordProgression: string[]; // Current detected chords
  harmonicTension: number; // 0-1, dissonance level
  resolutionExpectation: number; // How much resolution is needed
  
  // Dynamic analysis
  amplitude: number;
  dynamicRange: number;
  compressionRatio: number;
  
  // Structural position
  structuralPhase: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'breakdown' | 'buildup';
  measurePosition: number; // 0-1, position within measure
  phrasePosition: number; // 0-1, position within phrase (typically 4-8 measures)
  
  // Wavelength physics
  wavelengthMeters: number; // Physical wavelength at speed of sound
  energyJoules: number; // Acoustic energy estimate
  
  // Timestamp
  timestamp: number;
}

// ============= MUSIC DOMAIN ADAPTER =============

class MusicDomainAdapter implements DomainAdapter<MusicData> {
  domain: DomainType = 'audio'; // Extends audio domain as the "heart"
  name = 'Music Pattern Analyzer - The Heart';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  // Physical constants
  private readonly SPEED_OF_SOUND = 343; // m/s at 20°C
  private readonly PLANCK = 6.62607e-34; // Planck's constant
  private readonly A4_FREQUENCY = 440; // Hz standard tuning
  
  // Historical pattern memory
  private historicalPatterns: Map<string, number[]> = new Map();
  private chordProgressionHistory: string[][] = [];
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    this.initializeHistoricalPatterns();
    console.log('[MusicAdapter] THE HEART initialized - Comprehensive music pattern recognition active');
  }

  private initializeHistoricalPatterns(): void {
    // Pre-load common chord progressions and their market correlations
    // I-IV-V-I = Classic resolution = Market consolidation
    this.historicalPatterns.set('I-IV-V-I', [0.8, 0.3, 0.2]); // [confidence, volatility, momentum]
    // ii-V-I = Jazz resolution = Smart money movement
    this.historicalPatterns.set('ii-V-I', [0.7, 0.4, 0.5]);
    // I-V-vi-IV = Pop progression = Mass market sentiment
    this.historicalPatterns.set('I-V-vi-IV', [0.6, 0.35, 0.4]);
    // vi-IV-I-V = Emotional = Fear/Greed cycle
    this.historicalPatterns.set('vi-IV-I-V', [0.5, 0.5, 0.3]);
    // i-VII-VI-VII = Epic = Major trend
    this.historicalPatterns.set('i-VII-VI-VII', [0.65, 0.45, 0.7]);
  }

  processRawData(data: MusicData): UniversalSignal {
    const {
      fundamentalHz,
      harmonicSpectrum,
      tempo,
      key,
      mode,
      harmonicTension,
      amplitude,
      structuralPhase,
      wavelengthMeters,
      timestamp,
    } = data;
    
    // Calculate comprehensive signal from music data
    const modeData = MODAL_PSYCHOLOGY[mode] || MODAL_PSYCHOLOGY.ionian;
    
    // Frequency as primary oscillation
    const frequency = fundamentalHz;
    
    // Intensity combines amplitude with harmonic richness
    const harmonicRichness = harmonicSpectrum.reduce((sum, amp) => sum + amp, 0) / (harmonicSpectrum.length || 1);
    const intensity = (amplitude + harmonicRichness) / 2;
    
    // Phase derived from key position on circle of fifths and structural position
    const keyPosition = key / 12; // Normalize to 0-1
    const structuralPhaseValue = this.structuralPhaseToValue(structuralPhase);
    const phase = ((keyPosition + structuralPhaseValue) / 2) * Math.PI * 2;
    
    // Create comprehensive harmonics array
    const harmonics = this.calculateComprehensiveHarmonics(data);
    
    // Raw data includes all key metrics
    const rawData = [
      fundamentalHz,
      tempo,
      modeData.confidence,
      modeData.marketBias === 'bullish' ? 1 : modeData.marketBias === 'bearish' ? -1 : 0,
      harmonicTension,
      amplitude,
      wavelengthMeters,
      harmonicRichness,
    ];
    
    const signal: UniversalSignal = {
      domain: 'audio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData,
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    // Track chord progressions for pattern matching
    if (data.chordProgression.length > 0) {
      this.chordProgressionHistory.push(data.chordProgression);
      if (this.chordProgressionHistory.length > 100) {
        this.chordProgressionHistory.shift();
      }
    }
    
    this.lastUpdate = timestamp;
    return signal;
  }

  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const recentSignals = signals.slice(-200);
    
    // Calculate comprehensive quadrant profile
    const quadrantProfile = this.calculateQuadrantFromMusic(recentSignals);
    
    // Temporal flow from structural phases
    const temporalFlow = this.calculateTemporalFlow(recentSignals);
    
    // Calculate all advanced metrics
    const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
    const momentum = this.calculateMusicMomentum(recentSignals);
    const volatility = this.calculateMusicVolatility(recentSignals);
    const dominantFreq = this.findDominantFrequency(recentSignals);
    const harmonicRes = this.calculateHarmonicResonance(recentSignals);
    const phaseAlignment = this.calculatePhaseAlignment(recentSignals);
    
    return {
      domain: 'audio',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum,
      volatility,
      dominantFrequency: dominantFreq,
      harmonicResonance: harmonicRes,
      phaseAlignment,
      extractedAt: Date.now(),
    };
  }

  private calculateComprehensiveHarmonics(data: MusicData): number[] {
    const modeData = MODAL_PSYCHOLOGY[data.mode] || MODAL_PSYCHOLOGY.ionian;
    const timeData = TIME_SIGNATURE_PATTERNS[data.timeSignature] || TIME_SIGNATURE_PATTERNS['4/4'];
    
    // Find closest historical era based on tempo
    let closestEra = HISTORICAL_TEMPO_PATTERNS.contemporary;
    let minTempoDiff = Infinity;
    Object.values(HISTORICAL_TEMPO_PATTERNS).forEach(era => {
      const diff = Math.abs(era.avgBpm - data.tempo);
      if (diff < minTempoDiff) {
        minTempoDiff = diff;
        closestEra = era;
      }
    });
    
    // Find frequency zone
    let freqZone = FREQUENCY_ZONES.mid;
    Object.values(FREQUENCY_ZONES).forEach(zone => {
      if (data.fundamentalHz >= zone.min && data.fundamentalHz <= zone.max) {
        freqZone = zone;
      }
    });
    
    return [
      // Musical harmonics
      data.fundamentalHz / 1000,
      (data.fundamentalHz * INTERVAL_RATIOS.perfectFifth) / 1000,
      (data.fundamentalHz * INTERVAL_RATIOS.majorThird) / 1000,
      (data.fundamentalHz * INTERVAL_RATIOS.octave) / 1000,
      
      // Rhythm harmonics
      data.tempo / 200,
      data.tempoStability,
      data.beatStrength,
      
      // Modal harmonics
      modeData.confidence,
      modeData.volatility,
      
      // Tension and resolution
      data.harmonicTension,
      data.resolutionExpectation,
      
      // Era correlation
      closestEra.volatility,
      
      // Time signature influence
      timeData.volatility,
      
      // Frequency zone
      (freqZone.min + freqZone.max) / 40000,
      
      // Wavelength physics
      data.wavelengthMeters / 10,
      data.energyJoules * 1e10,
    ];
  }

  private structuralPhaseToValue(phase: MusicData['structuralPhase']): number {
    const phases: Record<MusicData['structuralPhase'], number> = {
      intro: 0.1,
      verse: 0.25,
      chorus: 0.5,
      bridge: 0.4,
      buildup: 0.7,
      breakdown: 0.3,
      outro: 0.9,
    };
    return phases[phase] || 0.5;
  }

  private calculateQuadrantFromMusic(signals: UniversalSignal[]): DomainSignature['quadrantProfile'] {
    // Analyze signal patterns to determine quadrant profile
    const tempos = signals.map(s => s.rawData[1]);
    const tensions = signals.map(s => s.rawData[4]);
    const marketBiases = signals.map(s => s.rawData[3]);
    const intensities = signals.map(s => s.intensity);
    
    const avgTempo = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    const avgTension = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    const avgBias = marketBiases.reduce((a, b) => a + b, 0) / marketBiases.length;
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    
    // Fast tempo + high intensity = Aggressive
    const aggressive = Math.min((avgTempo / 150) * avgIntensity, 1);
    
    // Low tension + low tempo = Defensive
    const defensive = Math.min((1 - avgTension) * (1 - avgTempo / 200), 1);
    
    // High tension + varying intensity = Tactical
    const intensityVariance = this.calculateVariance(intensities);
    const tactical = Math.min(avgTension * (intensityVariance * 4), 1);
    
    // Positive bias + moderate tempo = Strategic
    const strategic = Math.min(((avgBias + 1) / 2) * (1 - Math.abs(avgTempo - 100) / 100), 1);
    
    const total = aggressive + defensive + tactical + strategic || 1;
    
    return {
      aggressive: aggressive / total,
      defensive: defensive / total,
      tactical: tactical / total,
      strategic: strategic / total,
    };
  }

  private calculateTemporalFlow(signals: UniversalSignal[]): DomainSignature['temporalFlow'] {
    const len = signals.length;
    const third = Math.floor(len / 3);
    
    const getPhaseEnergy = (slice: UniversalSignal[]) => 
      slice.reduce((sum, s) => sum + s.intensity * (s.rawData[1] / 100), 0) / (slice.length || 1);
    
    const earlyEnergy = getPhaseEnergy(signals.slice(0, third));
    const midEnergy = getPhaseEnergy(signals.slice(third, 2 * third));
    const lateEnergy = getPhaseEnergy(signals.slice(2 * third));
    
    const total = earlyEnergy + midEnergy + lateEnergy || 1;
    
    return {
      early: earlyEnergy / total,
      mid: midEnergy / total,
      late: lateEnergy / total,
    };
  }

  private calculateMusicMomentum(signals: UniversalSignal[]): number {
    if (signals.length < 20) return 0;
    
    const recent = signals.slice(-20);
    const older = signals.slice(-40, -20);
    
    const getEnergy = (arr: UniversalSignal[]) => 
      arr.reduce((sum, s) => sum + s.intensity * s.frequency * (s.rawData[3] + 1), 0) / arr.length;
    
    const recentEnergy = getEnergy(recent);
    const olderEnergy = older.length > 0 ? getEnergy(older) : recentEnergy;
    
    return (recentEnergy - olderEnergy) / (olderEnergy || 1);
  }

  private calculateMusicVolatility(signals: UniversalSignal[]): number {
    const tensions = signals.map(s => s.rawData[4]);
    const tempoVariance = this.calculateVariance(signals.map(s => s.rawData[1]));
    const tensionVariance = this.calculateVariance(tensions);
    
    return Math.sqrt((tempoVariance / 10000) + (tensionVariance * 4)) / 2;
  }

  private findDominantFrequency(signals: UniversalSignal[]): number {
    const freqs = signals.map(s => s.frequency);
    const avg = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    return avg;
  }

  private calculateHarmonicResonance(signals: UniversalSignal[]): number {
    if (signals.length < 2) return 0.5;
    
    let resonanceSum = 0;
    for (let i = 1; i < signals.length; i++) {
      const h1 = signals[i].harmonics;
      const h2 = signals[i - 1].harmonics;
      
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      for (let j = 0; j < Math.min(h1.length, h2.length); j++) {
        dotProduct += h1[j] * h2[j];
        mag1 += h1[j] * h1[j];
        mag2 += h2[j] * h2[j];
      }
      
      const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
      const cosineSim = denom > 0 ? dotProduct / denom : 0;
      resonanceSum += (cosineSim + 1) / 2;
    }
    
    return resonanceSum / (signals.length - 1);
  }

  private calculatePhaseAlignment(signals: UniversalSignal[]): number {
    if (signals.length < 2) return 0.5;
    
    let alignmentSum = 0;
    for (let i = 1; i < signals.length; i++) {
      const phaseDiff = Math.abs(signals[i].phase - signals[i - 1].phase);
      const normalizedDiff = phaseDiff / Math.PI;
      alignmentSum += 1 - Math.min(normalizedDiff, 1);
    }
    
    return alignmentSum / (signals.length - 1);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'audio',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.2,
      dominantFrequency: 440,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  /**
   * Generate music signal correlated with market conditions
   * This is the heart's response to market nervous system
   */
  generateMarketCorrelatedMusicData(
    marketMomentum: number,
    marketVolatility: number,
    marketVolume: number
  ): MusicData {
    // Determine mode based on market sentiment
    const modeKeys = Object.keys(MODAL_PSYCHOLOGY) as Array<keyof typeof MODAL_PSYCHOLOGY>;
    let selectedMode: keyof typeof MODAL_PSYCHOLOGY = 'ionian';
    
    if (marketMomentum > 0.3) selectedMode = 'ionian'; // Bullish = Major happy
    else if (marketMomentum > 0.1) selectedMode = 'lydian'; // Slightly bullish = Dreamy
    else if (marketMomentum < -0.3) selectedMode = 'aeolian'; // Bearish = Minor sad
    else if (marketMomentum < -0.1) selectedMode = 'phrygian'; // Slightly bearish = Tense
    else if (marketVolatility > 0.5) selectedMode = 'locrian'; // High volatility = Unstable
    else selectedMode = 'mixolydian'; // Neutral = Bluesy relaxed
    
    // Tempo correlates with volatility and volume
    const baseTempo = 90;
    const tempo = baseTempo + (marketVolatility * 60) + (marketVolume * 20);
    
    // Fundamental frequency rises with positive momentum
    const fundamentalHz = 220 + (marketMomentum * 200) + (marketVolatility * 100);
    
    // Create harmonic spectrum based on market conditions
    const harmonicSpectrum: number[] = [];
    for (let i = 1; i <= 8; i++) {
      // Even harmonics increase with stability, odd with volatility
      const isEven = i % 2 === 0;
      const amp = isEven 
        ? (1 - marketVolatility) / i 
        : marketVolatility / i;
      harmonicSpectrum.push(Math.max(0, Math.min(1, amp)));
    }
    
    // Determine structural phase from momentum direction
    let structuralPhase: MusicData['structuralPhase'] = 'verse';
    if (marketMomentum > 0.5) structuralPhase = 'chorus';
    else if (marketMomentum > 0.2) structuralPhase = 'buildup';
    else if (marketMomentum < -0.5) structuralPhase = 'breakdown';
    else if (marketMomentum < -0.2) structuralPhase = 'bridge';
    else if (marketVolatility < 0.2) structuralPhase = 'intro';
    
    // Harmonic tension increases with volatility
    const harmonicTension = marketVolatility * 0.8 + Math.abs(marketMomentum) * 0.2;
    
    // Resolution expectation is inverse of tension
    const resolutionExpectation = 1 - harmonicTension;
    
    // Calculate wavelength from frequency
    const wavelengthMeters = this.SPEED_OF_SOUND / Math.max(20, fundamentalHz);
    
    // Estimate energy (simplified)
    const amplitude = 0.4 + marketVolatility * 0.4 + Math.abs(marketMomentum) * 0.2;
    const energyJoules = amplitude * fundamentalHz * 1e-10;
    
    return {
      fundamentalHz: Math.max(55, Math.min(880, fundamentalHz)),
      harmonicSpectrum,
      spectralCentroid: 2000 + marketVolatility * 2000,
      spectralFlatness: marketVolatility * 0.5,
      tempo: Math.max(40, Math.min(200, tempo)),
      tempoStability: 1 - marketVolatility,
      timeSignature: marketVolatility > 0.6 ? '7/8' : marketVolatility > 0.3 ? '6/8' : '4/4',
      beatStrength: 0.5 + marketVolume * 0.4,
      key: marketMomentum >= 0 ? 0 : 9, // C major or A minor
      keyName: marketMomentum >= 0 ? 'C' : 'Am',
      mode: selectedMode,
      modeConfidence: 0.6 + (1 - marketVolatility) * 0.3,
      chordProgression: this.generateChordProgression(marketMomentum, marketVolatility),
      harmonicTension: Math.max(0, Math.min(1, harmonicTension)),
      resolutionExpectation: Math.max(0, Math.min(1, resolutionExpectation)),
      amplitude: Math.max(0, Math.min(1, amplitude)),
      dynamicRange: marketVolatility * 0.8 + 0.2,
      compressionRatio: 1 + (1 - marketVolatility) * 3,
      structuralPhase,
      measurePosition: (Date.now() % 2000) / 2000,
      phrasePosition: (Date.now() % 16000) / 16000,
      wavelengthMeters,
      energyJoules,
      timestamp: Date.now(),
    };
  }

  private generateChordProgression(momentum: number, volatility: number): string[] {
    if (momentum > 0.3 && volatility < 0.3) return ['I', 'IV', 'V', 'I'];
    if (momentum > 0 && volatility > 0.4) return ['I', 'V', 'vi', 'IV'];
    if (momentum < -0.3) return ['vi', 'IV', 'I', 'V'];
    if (volatility > 0.6) return ['i', 'VII', 'VI', 'VII'];
    return ['ii', 'V', 'I'];
  }

  /**
   * Get the current historical era pattern that best matches the market
   */
  getMarketEraCorrelation(tempo: number, volatility: number): typeof HISTORICAL_TEMPO_PATTERNS[keyof typeof HISTORICAL_TEMPO_PATTERNS] {
    let bestMatch = HISTORICAL_TEMPO_PATTERNS.contemporary;
    let bestScore = Infinity;
    
    Object.values(HISTORICAL_TEMPO_PATTERNS).forEach(era => {
      const tempoDiff = Math.abs(era.avgBpm - tempo);
      const volDiff = Math.abs(era.volatility - volatility) * 100;
      const score = tempoDiff + volDiff;
      
      if (score < bestScore) {
        bestScore = score;
        bestMatch = era;
      }
    });
    
    return bestMatch;
  }
}

export const musicAdapter = new MusicDomainAdapter();
export { MODAL_PSYCHOLOGY, HISTORICAL_TEMPO_PATTERNS, INTERVAL_RATIOS, FREQUENCY_ZONES };
