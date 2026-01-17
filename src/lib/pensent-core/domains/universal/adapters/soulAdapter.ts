/**
 * Soul Domain Adapter - THE SPIRIT of En Pensent
 * 
 * Comprehensive understanding of the human spirit as temporal pattern:
 * - Language patterns and sentiment analysis
 * - Cultural evolution and collective consciousness
 * - Religious and spiritual cycles
 * - Human connection and social dynamics
 * - Archetypal narratives across civilizations
 * - Emotional resonance and mass psychology
 * 
 * The Soul is the universal connector - it bridges all domains through
 * the lens of human meaning, purpose, and collective experience.
 * 
 * "For what shall it profit a man, if he shall gain the whole world, 
 *  and lose his own soul?" - Mark 8:36
 */

import type { DomainAdapter, UniversalSignal, DomainSignature, DomainType } from '../types';

// ============= CULTURAL AND SPIRITUAL DATA =============

// Universal archetypes (Carl Jung inspired, market applicable)
const UNIVERSAL_ARCHETYPES = {
  hero: { 
    energy: 0.9, 
    direction: 'expansion', 
    marketBias: 'strong_bull',
    description: 'Courage, transformation, overcoming obstacles'
  },
  sage: { 
    energy: 0.6, 
    direction: 'contemplation', 
    marketBias: 'cautious',
    description: 'Wisdom, analysis, understanding deeper patterns'
  },
  explorer: { 
    energy: 0.8, 
    direction: 'discovery', 
    marketBias: 'moderate_bull',
    description: 'Seeking new frontiers, innovation, risk-taking'
  },
  creator: { 
    energy: 0.7, 
    direction: 'building', 
    marketBias: 'growth',
    description: 'Innovation, building value, artistic expression'
  },
  ruler: { 
    energy: 0.5, 
    direction: 'control', 
    marketBias: 'consolidation',
    description: 'Order, stability, maintaining power'
  },
  caregiver: { 
    energy: 0.4, 
    direction: 'protection', 
    marketBias: 'defensive',
    description: 'Nurturing, protecting assets, risk-averse'
  },
  rebel: { 
    energy: 0.95, 
    direction: 'disruption', 
    marketBias: 'volatile',
    description: 'Breaking patterns, disruption, revolution'
  },
  magician: { 
    energy: 0.85, 
    direction: 'transformation', 
    marketBias: 'breakout',
    description: 'Transformation, turning vision into reality'
  },
  jester: { 
    energy: 0.75, 
    direction: 'chaos', 
    marketBias: 'unpredictable',
    description: 'Playfulness, randomness, breaking tension'
  },
  everyman: { 
    energy: 0.5, 
    direction: 'stability', 
    marketBias: 'sideways',
    description: 'Belonging, normalcy, following the crowd'
  },
  lover: { 
    energy: 0.65, 
    direction: 'connection', 
    marketBias: 'sentiment_driven',
    description: 'Passion, emotion, relationship-driven decisions'
  },
  innocent: { 
    energy: 0.3, 
    direction: 'faith', 
    marketBias: 'hopeful_bull',
    description: 'Optimism, trust, belief in good outcomes'
  },
  shadow: { 
    energy: 0.2, 
    direction: 'fear', 
    marketBias: 'panic_bear',
    description: 'Fear, hidden dangers, worst-case scenarios'
  },
};

// Cultural cycles and their market correlations
const CULTURAL_CYCLES = {
  spring: { phase: 0.0, energy: 0.7, sentiment: 'renewal', marketPhase: 'accumulation' },
  summer: { phase: 0.25, energy: 0.9, sentiment: 'abundance', marketPhase: 'markup' },
  autumn: { phase: 0.5, energy: 0.6, sentiment: 'harvest', marketPhase: 'distribution' },
  winter: { phase: 0.75, energy: 0.3, sentiment: 'dormancy', marketPhase: 'markdown' },
};

// Emotional resonance frequencies (Solfeggio-inspired)
const SPIRITUAL_FREQUENCIES = {
  liberation: 396, // Liberating guilt and fear
  change: 417, // Facilitating change
  transformation: 528, // Transformation and miracles (Love frequency)
  connection: 639, // Connecting relationships
  expression: 741, // Awakening intuition
  awakening: 852, // Returning to spiritual order
  unity: 963, // Divine consciousness
};

// Language sentiment patterns
const SENTIMENT_WEIGHTS = {
  fear: { weight: -0.8, volatility: 0.9 },
  greed: { weight: 0.7, volatility: 0.8 },
  hope: { weight: 0.5, volatility: 0.4 },
  despair: { weight: -0.9, volatility: 0.7 },
  confidence: { weight: 0.6, volatility: 0.3 },
  uncertainty: { weight: 0.0, volatility: 0.9 },
  euphoria: { weight: 0.9, volatility: 0.95 },
  panic: { weight: -0.95, volatility: 1.0 },
  patience: { weight: 0.2, volatility: 0.2 },
  impatience: { weight: 0.4, volatility: 0.6 },
  gratitude: { weight: 0.3, volatility: 0.1 },
  envy: { weight: 0.5, volatility: 0.7 },
};

// Religious/spiritual cycles (universal patterns across traditions)
const SPIRITUAL_CYCLES = {
  sabbath: { frequency: 7, meaning: 'rest_reset', marketEffect: 'consolidation' },
  lunar: { frequency: 28, meaning: 'emotional_tide', marketEffect: 'cycle_peak' },
  jubilee: { frequency: 7 * 7, meaning: 'major_reset', marketEffect: 'trend_change' },
  generational: { frequency: 365 * 40, meaning: 'paradigm_shift', marketEffect: 'secular_trend' },
};

// ============= INTERFACE DEFINITIONS =============

export interface SoulData {
  // Archetypal analysis
  dominantArchetype: keyof typeof UNIVERSAL_ARCHETYPES;
  archetypeStrength: number;
  secondaryArchetypes: Array<{ type: keyof typeof UNIVERSAL_ARCHETYPES; strength: number }>;
  
  // Sentiment and emotion
  sentiment: number; // -1 to 1 (fear to greed spectrum)
  emotionalIntensity: number; // 0 to 1
  emotionalStability: number; // 0 to 1
  dominantEmotion: keyof typeof SENTIMENT_WEIGHTS;
  
  // Cultural context
  culturalCyclePhase: keyof typeof CULTURAL_CYCLES;
  collectiveConsciousness: number; // 0 to 1, herd vs. individual
  narrativeStrength: number; // How strong is the current narrative
  
  // Spiritual resonance
  spiritualFrequency: number; // Hz (mapped to solfeggio)
  faithLevel: number; // 0 to 1
  fearLevel: number; // 0 to 1
  
  // Language patterns
  communicationClarity: number; // 0 to 1
  persuasionIntensity: number; // 0 to 1
  truthResonance: number; // 0 to 1 (authenticity measure)
  
  // Connection metrics
  socialCohesion: number; // 0 to 1
  polarization: number; // 0 to 1
  collaborationIndex: number; // 0 to 1
  
  // Temporal position
  cyclePosition: number; // 0 to 1 within current major cycle
  generationalMoment: 'crisis' | 'high' | 'awakening' | 'unraveling';
  
  timestamp: number;
}

// ============= SOUL DOMAIN ADAPTER =============

class SoulDomainAdapter implements DomainAdapter<SoulData> {
  domain: DomainType = 'bio'; // Soul extends the bio domain as spiritual dimension
  name = 'Soul Pattern Analyzer - The Spirit';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  // Memory of narrative patterns
  private narrativeHistory: string[] = [];
  private archetypeHistory: Array<keyof typeof UNIVERSAL_ARCHETYPES> = [];
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[SoulAdapter] THE SPIRIT initialized - Universal consciousness pattern recognition active');
    console.log('[SoulAdapter] "The LORD is my shepherd; I shall not want." - Psalm 23:1');
  }

  processRawData(data: SoulData): UniversalSignal {
    const {
      dominantArchetype,
      archetypeStrength,
      sentiment,
      emotionalIntensity,
      spiritualFrequency,
      socialCohesion,
      cyclePosition,
      timestamp,
    } = data;
    
    const archetypeData = UNIVERSAL_ARCHETYPES[dominantArchetype] || UNIVERSAL_ARCHETYPES.everyman;
    
    // Frequency based on spiritual resonance and archetype energy
    const frequency = spiritualFrequency * archetypeData.energy;
    
    // Intensity combines emotional and archetypal energies
    const intensity = (emotionalIntensity + archetypeStrength) / 2;
    
    // Phase from cycle position and sentiment
    const phase = ((cyclePosition + (sentiment + 1) / 2) / 2) * Math.PI * 2;
    
    // Create comprehensive harmonics
    const harmonics = this.calculateSoulHarmonics(data);
    
    // Raw data for signature extraction
    const rawData = [
      archetypeData.energy,
      sentiment,
      emotionalIntensity,
      data.fearLevel,
      data.faithLevel,
      socialCohesion,
      data.polarization,
      data.narrativeStrength,
      cyclePosition,
      data.collectiveConsciousness,
    ];
    
    const signal: UniversalSignal = {
      domain: 'bio', // Soul signals flow through bio domain
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
    
    // Track archetype history for pattern recognition
    this.archetypeHistory.push(dominantArchetype);
    if (this.archetypeHistory.length > 100) {
      this.archetypeHistory.shift();
    }
    
    this.lastUpdate = timestamp;
    return signal;
  }

  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const recentSignals = signals.slice(-200);
    
    // Calculate quadrant profile from soul metrics
    const quadrantProfile = this.calculateQuadrantFromSoul(recentSignals);
    
    // Temporal flow from narrative progression
    const temporalFlow = this.calculateTemporalFlow(recentSignals);
    
    // Calculate all advanced metrics
    const avgIntensity = recentSignals.reduce((sum, s) => sum + s.intensity, 0) / recentSignals.length;
    const momentum = this.calculateSoulMomentum(recentSignals);
    const volatility = this.calculateSoulVolatility(recentSignals);
    const dominantFreq = this.findDominantFrequency(recentSignals);
    const harmonicRes = this.calculateHarmonicResonance(recentSignals);
    const phaseAlignment = this.calculatePhaseAlignment(recentSignals);
    
    return {
      domain: 'bio',
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

  private calculateSoulHarmonics(data: SoulData): number[] {
    const archetype = UNIVERSAL_ARCHETYPES[data.dominantArchetype] || UNIVERSAL_ARCHETYPES.everyman;
    const cycle = CULTURAL_CYCLES[data.culturalCyclePhase] || CULTURAL_CYCLES.spring;
    const emotion = SENTIMENT_WEIGHTS[data.dominantEmotion] || SENTIMENT_WEIGHTS.uncertainty;
    
    // Find closest solfeggio frequency
    let closestSolfeggio = SPIRITUAL_FREQUENCIES.transformation;
    let minDiff = Infinity;
    Object.values(SPIRITUAL_FREQUENCIES).forEach(freq => {
      const diff = Math.abs(freq - data.spiritualFrequency);
      if (diff < minDiff) {
        minDiff = diff;
        closestSolfeggio = freq;
      }
    });
    
    return [
      // Archetypal harmonics
      archetype.energy,
      archetype.direction === 'expansion' ? 1 : archetype.direction === 'fear' ? -1 : 0.5,
      
      // Emotional harmonics
      emotion.weight,
      emotion.volatility,
      data.emotionalStability,
      
      // Cultural harmonics
      cycle.energy,
      cycle.phase,
      
      // Spiritual harmonics
      closestSolfeggio / 1000,
      data.faithLevel,
      1 - data.fearLevel,
      
      // Social harmonics
      data.socialCohesion,
      1 - data.polarization,
      data.collaborationIndex,
      
      // Narrative harmonics
      data.narrativeStrength,
      data.truthResonance,
      data.communicationClarity,
    ];
  }

  private calculateQuadrantFromSoul(signals: UniversalSignal[]): DomainSignature['quadrantProfile'] {
    const energies = signals.map(s => s.rawData[0]);
    const sentiments = signals.map(s => s.rawData[1]);
    const fears = signals.map(s => s.rawData[3]);
    const faiths = signals.map(s => s.rawData[4]);
    
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    const avgFear = fears.reduce((a, b) => a + b, 0) / fears.length;
    const avgFaith = faiths.reduce((a, b) => a + b, 0) / faiths.length;
    
    // High energy + positive sentiment = Aggressive
    const aggressive = Math.max(0, avgEnergy * ((avgSentiment + 1) / 2));
    
    // Low energy + high fear = Defensive
    const defensive = Math.max(0, (1 - avgEnergy) * avgFear);
    
    // Variable sentiment + high energy = Tactical
    const sentimentVariance = this.calculateVariance(sentiments);
    const tactical = Math.max(0, avgEnergy * sentimentVariance * 4);
    
    // High faith + stable = Strategic
    const strategic = Math.max(0, avgFaith * (1 - avgFear));
    
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
      slice.reduce((sum, s) => sum + s.intensity * s.rawData[0], 0) / (slice.length || 1);
    
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

  private calculateSoulMomentum(signals: UniversalSignal[]): number {
    if (signals.length < 20) return 0;
    
    const recent = signals.slice(-20);
    const older = signals.slice(-40, -20);
    
    const getEnergy = (arr: UniversalSignal[]) => 
      arr.reduce((sum, s) => sum + s.intensity * (s.rawData[1] + 1), 0) / arr.length;
    
    const recentEnergy = getEnergy(recent);
    const olderEnergy = older.length > 0 ? getEnergy(older) : recentEnergy;
    
    return (recentEnergy - olderEnergy) / (olderEnergy || 1);
  }

  private calculateSoulVolatility(signals: UniversalSignal[]): number {
    const sentiments = signals.map(s => s.rawData[1]);
    const emotions = signals.map(s => s.rawData[2]);
    
    const sentimentVar = this.calculateVariance(sentiments);
    const emotionVar = this.calculateVariance(emotions);
    
    return Math.sqrt((sentimentVar + emotionVar) / 2);
  }

  private findDominantFrequency(signals: UniversalSignal[]): number {
    const freqs = signals.map(s => s.frequency);
    return freqs.reduce((a, b) => a + b, 0) / freqs.length;
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
      domain: 'bio',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.2,
      dominantFrequency: SPIRITUAL_FREQUENCIES.transformation,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now(),
    };
  }

  /**
   * Generate soul signal correlated with market conditions
   * This is the spirit's response to the collective market consciousness
   */
  generateMarketCorrelatedSoulData(
    marketMomentum: number,
    marketVolatility: number,
    marketVolume: number,
    fearGreedIndex: number = 50 // 0-100, 50 is neutral
  ): SoulData {
    // Determine dominant archetype from market conditions
    let dominantArchetype: keyof typeof UNIVERSAL_ARCHETYPES = 'everyman';
    
    if (marketMomentum > 0.5 && marketVolatility < 0.3) dominantArchetype = 'hero';
    else if (marketMomentum > 0.3 && marketVolatility > 0.5) dominantArchetype = 'rebel';
    else if (marketMomentum > 0.2) dominantArchetype = 'explorer';
    else if (marketMomentum < -0.5) dominantArchetype = 'shadow';
    else if (marketMomentum < -0.2 && marketVolatility > 0.5) dominantArchetype = 'jester';
    else if (marketMomentum < -0.2) dominantArchetype = 'caregiver';
    else if (marketVolatility > 0.7) dominantArchetype = 'magician';
    else if (marketVolatility < 0.2) dominantArchetype = 'sage';
    else dominantArchetype = 'everyman';
    
    // Normalize fear/greed to sentiment
    const sentiment = (fearGreedIndex - 50) / 50; // -1 to 1
    
    // Determine dominant emotion
    let dominantEmotion: keyof typeof SENTIMENT_WEIGHTS = 'uncertainty';
    if (fearGreedIndex < 20) dominantEmotion = 'panic';
    else if (fearGreedIndex < 35) dominantEmotion = 'fear';
    else if (fearGreedIndex < 45) dominantEmotion = 'uncertainty';
    else if (fearGreedIndex < 55) dominantEmotion = 'patience';
    else if (fearGreedIndex < 70) dominantEmotion = 'confidence';
    else if (fearGreedIndex < 85) dominantEmotion = 'greed';
    else dominantEmotion = 'euphoria';
    
    // Cultural cycle from market phase
    let culturalCyclePhase: keyof typeof CULTURAL_CYCLES = 'spring';
    if (marketMomentum > 0.2 && marketVolatility < 0.4) culturalCyclePhase = 'summer';
    else if (marketMomentum > 0 && marketVolatility > 0.3) culturalCyclePhase = 'autumn';
    else if (marketMomentum < 0) culturalCyclePhase = 'winter';
    else culturalCyclePhase = 'spring';
    
    // Determine generational moment
    let generationalMoment: SoulData['generationalMoment'] = 'high';
    if (marketVolatility > 0.7 && marketMomentum < -0.3) generationalMoment = 'crisis';
    else if (marketVolatility < 0.3 && marketMomentum > 0.3) generationalMoment = 'high';
    else if (marketVolatility > 0.5 && marketMomentum > 0) generationalMoment = 'awakening';
    else generationalMoment = 'unraveling';
    
    // Spiritual frequency based on market state
    let spiritualFrequency = SPIRITUAL_FREQUENCIES.transformation;
    if (marketMomentum > 0.3) spiritualFrequency = SPIRITUAL_FREQUENCIES.awakening;
    else if (marketMomentum < -0.3) spiritualFrequency = SPIRITUAL_FREQUENCIES.liberation;
    else if (marketVolatility > 0.5) spiritualFrequency = SPIRITUAL_FREQUENCIES.change;
    else if (marketVolume > 0.7) spiritualFrequency = SPIRITUAL_FREQUENCIES.expression;
    
    return {
      dominantArchetype,
      archetypeStrength: 0.6 + (1 - marketVolatility) * 0.3,
      secondaryArchetypes: this.generateSecondaryArchetypes(marketMomentum, marketVolatility),
      sentiment,
      emotionalIntensity: marketVolatility * 0.6 + Math.abs(marketMomentum) * 0.4,
      emotionalStability: 1 - marketVolatility,
      dominantEmotion,
      culturalCyclePhase,
      collectiveConsciousness: 0.3 + marketVolume * 0.5,
      narrativeStrength: 0.4 + Math.abs(marketMomentum) * 0.5,
      spiritualFrequency,
      faithLevel: Math.max(0, Math.min(1, 0.5 + marketMomentum * 0.4)),
      fearLevel: Math.max(0, Math.min(1, 0.5 - marketMomentum * 0.3 + marketVolatility * 0.3)),
      communicationClarity: 1 - marketVolatility * 0.5,
      persuasionIntensity: Math.abs(marketMomentum) * 0.7 + 0.3,
      truthResonance: 1 - marketVolatility * 0.4,
      socialCohesion: 0.5 - Math.abs(marketMomentum - 0.2) * 0.3,
      polarization: marketVolatility * 0.6 + Math.abs(marketMomentum) * 0.3,
      collaborationIndex: 0.5 + (1 - marketVolatility) * 0.3,
      cyclePosition: (Date.now() % (7 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000),
      generationalMoment,
      timestamp: Date.now(),
    };
  }

  private generateSecondaryArchetypes(
    momentum: number, 
    volatility: number
  ): Array<{ type: keyof typeof UNIVERSAL_ARCHETYPES; strength: number }> {
    const result: Array<{ type: keyof typeof UNIVERSAL_ARCHETYPES; strength: number }> = [];
    
    if (momentum > 0) {
      result.push({ type: 'creator', strength: 0.5 });
      result.push({ type: 'innocent', strength: 0.3 });
    } else {
      result.push({ type: 'sage', strength: 0.5 });
      result.push({ type: 'caregiver', strength: 0.4 });
    }
    
    if (volatility > 0.5) {
      result.push({ type: 'rebel', strength: 0.4 });
    }
    
    return result;
  }

  /**
   * Get archetype market correlation
   */
  getArchetypeMarketBias(archetype: keyof typeof UNIVERSAL_ARCHETYPES): string {
    return UNIVERSAL_ARCHETYPES[archetype]?.marketBias || 'neutral';
  }

  /**
   * Get current spiritual cycle position
   */
  getSpiritualCycleInfo(): { sabbath: number; lunar: number; jubilee: number } {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    return {
      sabbath: (now % (SPIRITUAL_CYCLES.sabbath.frequency * dayMs)) / (SPIRITUAL_CYCLES.sabbath.frequency * dayMs),
      lunar: (now % (SPIRITUAL_CYCLES.lunar.frequency * dayMs)) / (SPIRITUAL_CYCLES.lunar.frequency * dayMs),
      jubilee: (now % (SPIRITUAL_CYCLES.jubilee.frequency * dayMs)) / (SPIRITUAL_CYCLES.jubilee.frequency * dayMs),
    };
  }
}

export const soulAdapter = new SoulDomainAdapter();
export { UNIVERSAL_ARCHETYPES, CULTURAL_CYCLES, SPIRITUAL_FREQUENCIES, SENTIMENT_WEIGHTS };
