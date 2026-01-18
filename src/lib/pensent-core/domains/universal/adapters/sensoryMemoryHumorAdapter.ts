/**
 * Sensory-Memory-Humor Adapter
 * 
 * CEO Insight (Alec Arthur Shelton):
 * "Humans change based on hunger or not... study what humans feel enjoyment from
 * certain smells, tastes, touches, vibes, and how memory is intertwined (nostalgia).
 * Go beyond evolutionary instinct and you'll find sophistication uses the same core
 * principles paired with civility. The humor was always there to begin with - it is
 * just our perception that is variably differing."
 * 
 * This adapter models the deep connection between:
 * - Physiological states (hunger, satiation, arousal)
 * - Sensory preferences and aversions
 * - Memory-nostalgia feedback loops
 * - Humor as pattern recognition with variable perception
 * - Inside jokes as entrainment markers
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

// ============================================================================
// PHYSIOLOGICAL STATE MODULATION
// ============================================================================

/**
 * Hunger State Theory:
 * Human decision-making shifts dramatically based on metabolic state.
 * Markets exhibit similar "hunger" - periods of accumulation (starving)
 * vs distribution (satiated).
 */
const PHYSIOLOGICAL_STATES = {
  STARVING: {
    state: 'starving',
    riskTolerance: 0.9,      // Desperate, will take any opportunity
    timeHorizon: 'immediate',
    decisionQuality: 0.4,    // Impaired judgment
    marketAnalog: 'capitulation_buying',
    description: 'Survival mode - primal drives dominate rational thought'
  },
  HUNGRY: {
    state: 'hungry',
    riskTolerance: 0.7,
    timeHorizon: 'short',
    decisionQuality: 0.6,
    marketAnalog: 'accumulation',
    description: 'Seeking mode - heightened attention to opportunities'
  },
  SATISFIED: {
    state: 'satisfied',
    riskTolerance: 0.5,
    timeHorizon: 'medium',
    decisionQuality: 0.9,    // Optimal decision-making
    marketAnalog: 'consolidation',
    description: 'Balanced state - rational evaluation possible'
  },
  SATIATED: {
    state: 'satiated',
    riskTolerance: 0.3,
    timeHorizon: 'long',
    decisionQuality: 0.7,
    marketAnalog: 'distribution',
    description: 'Comfort mode - tendency toward complacency'
  },
  GLUTTED: {
    state: 'glutted',
    riskTolerance: 0.1,
    timeHorizon: 'none',
    decisionQuality: 0.5,
    marketAnalog: 'euphoria_top',
    description: 'Excess mode - inability to see risk'
  }
} as const;

// ============================================================================
// SENSORY PREFERENCE MATHEMATICS
// ============================================================================

/**
 * Why do humans like/dislike things?
 * 
 * Preference = f(Evolutionary_Fitness, Memory_Association, Social_Context, Current_State)
 * 
 * The same stimulus can produce:
 * - Strong positive (love)
 * - Strong negative (disgust)
 * - Both at once (bittersweet, guilty pleasure)
 * - Variable (depends on context/mood)
 */
const SENSORY_VALENCE_MODEL = {
  // Core sensory channels
  CHANNELS: ['smell', 'taste', 'touch', 'sound', 'sight', 'vibe'] as const,
  
  // Valence calculation factors
  FACTORS: {
    evolutionaryWeight: 0.25,    // Hardwired preferences (sweet = energy)
    memoryWeight: 0.35,          // Nostalgia/trauma associations
    socialWeight: 0.20,          // Peer influence, belonging
    stateWeight: 0.20            // Current physiological/emotional state
  },
  
  // The "lie to yourself" phenomenon
  SELF_DECEPTION_MODES: {
    denial: 'Rejecting true preferences due to shame/fear',
    conformity: 'Adopting preferences to fit in',
    rationalization: 'Inventing logical reasons for emotional choices',
    projection: 'Attributing own preferences to others'
  }
};

/**
 * Nostalgia as Pattern Recognition
 * 
 * Nostalgia = Recognition(CurrentPattern, StoredPattern) × EmotionalIntensity
 * 
 * The smell of grandmother's cookies doesn't just remind you of her -
 * it RECONSTRUCTS the entire emotional state of being with her.
 */
interface NostalgiaSignal {
  triggerSense: typeof SENSORY_VALENCE_MODEL.CHANNELS[number];
  patternMatchStrength: number;     // 0-1: How closely current matches memory
  emotionalIntensity: number;       // 0-1: How strong the original emotion was
  temporalDistance: number;         // Years since original experience
  reconstructionFidelity: number;   // How completely the state is reconstructed
  valence: 'positive' | 'negative' | 'bittersweet' | 'ambivalent';
}

// ============================================================================
// HUMOR AS PATTERN RECOGNITION
// ============================================================================

/**
 * The Mathematics of Funny
 * 
 * CEO Insight: "The humor was always there to begin with - 
 * it is just our perception that is variably differing."
 * 
 * Humor = PatternViolation × PatternRecognition × SafetyContext
 * 
 * Something is funny when:
 * 1. An expected pattern is violated (surprise)
 * 2. We recognize what pattern was violated (understanding)
 * 3. The violation is non-threatening (safety)
 */
const HUMOR_MATHEMATICS = {
  // Core formula components
  COMPONENTS: {
    patternViolation: {
      description: 'Deviation from expected pattern',
      examples: ['punchline subverts setup', 'absurd juxtaposition', 'broken expectation']
    },
    patternRecognition: {
      description: 'Understanding what pattern was violated',
      examples: ['getting the reference', 'seeing the connection', 'understanding context']
    },
    safetyContext: {
      description: 'Non-threatening environment for pattern violation',
      examples: ['among friends', 'clearly fictional', 'socially permitted']
    }
  },
  
  // The Inside Joke Phenomenon
  INSIDE_JOKE_DYNAMICS: {
    layerDepth: 'Number of shared contexts required to understand',
    entrainmentMarker: 'Shared laughter = neural synchronization = group bonding',
    exclusionFunction: 'Not getting it = not in the group',
    fakeInclusionParadox: 'Pretending to get it to belong (but absorption happens anyway)'
  },
  
  // Meme Evolution Theory
  MEME_PROPAGATION: {
    initialHumor: 'Core pattern violation that is universally relatable',
    contextLayers: 'Each iteration adds reference layers',
    absurdistAmplification: 'Deeper understanding = funnier (inverse of explanation)',
    deathByExplanation: 'Explaining removes the pattern violation surprise'
  }
};

/**
 * Calculate humor score for a pattern
 */
function calculateHumorScore(
  patternViolationMagnitude: number,  // How unexpected (0-1)
  recognitionProbability: number,      // % of audience who will "get it" (0-1)
  safetyLevel: number,                 // How non-threatening (0-1)
  contextDepth: number                 // Layers of inside joke (0-10)
): number {
  // Base humor = violation × recognition × safety
  const baseHumor = patternViolationMagnitude * recognitionProbability * safetyLevel;
  
  // Context multiplier: deeper context = funnier (for those who get it)
  // But also reduces recognition probability
  const contextMultiplier = 1 + (contextDepth * 0.1);
  
  // The Absurdist Amplification
  // More absurd = funnier, but only if you recognize the pattern being violated
  const absurdistBonus = patternViolationMagnitude > 0.8 
    ? 0.2 * recognitionProbability 
    : 0;
  
  return Math.min(1, (baseHumor * contextMultiplier) + absurdistBonus);
}

// ============================================================================
// THE PRETENDING PARADOX
// ============================================================================

/**
 * CEO Insight: "Does it even matter if they are [pretending]? 
 * The effect is that one could laugh at an absurd meme even though 
 * they don't understand it at first, but the more they understand 
 * the branch of that meme the funnier and funnier it gets."
 * 
 * This is profound: The ACT of participating creates the understanding.
 * Fake it till you make it isn't deception - it's the learning process.
 */
const PRETENDING_PARADOX = {
  phases: [
    {
      stage: 'exposure',
      understanding: 0.0,
      participation: 0.5,  // Laughing along without getting it
      realEffect: 'Neural pathways beginning to form'
    },
    {
      stage: 'pattern_absorption',
      understanding: 0.3,
      participation: 0.7,
      realEffect: 'Context accumulating through repetition'
    },
    {
      stage: 'recognition',
      understanding: 0.7,
      participation: 0.9,
      realEffect: 'Pattern clicks - now genuinely funny'
    },
    {
      stage: 'mastery',
      understanding: 1.0,
      participation: 1.0,
      realEffect: 'Can create new instances of the pattern'
    }
  ],
  
  /**
   * The belonging drive is so strong that "fake" participation
   * becomes real through sheer repetition and social reinforcement.
   * Markets work the same way - people buy because others buy,
   * until they actually believe in the asset.
   */
  marketAnalog: 'momentum_creates_conviction'
};

// ============================================================================
// SOPHISTICATION = INSTINCT + CIVILITY
// ============================================================================

/**
 * CEO Insight: "Go beyond evolutionary instinct and you'll find 
 * sophistication uses the same core principles paired with civility."
 * 
 * The wine snob and the thirsty animal want the same thing:
 * - Animal: Water/energy now
 * - Sophisticate: The "right" water/energy, properly presented
 * 
 * Same drive, different expression.
 */
const SOPHISTICATION_LAYERS = {
  PRIMAL_CORE: {
    drive: 'Survival, reproduction, status',
    expression: 'Direct, immediate, physical',
    marketBehavior: 'Panic selling, FOMO buying, herd following'
  },
  CIVILIZED_WRAPPER: {
    drive: 'Same drives, socially acceptable expression',
    expression: 'Delayed gratification, symbolic status',
    marketBehavior: 'Value investing, portfolio theory, risk management'
  },
  SOPHISTICATED_REFINEMENT: {
    drive: 'Same drives, elevated through knowledge',
    expression: 'Curated experiences, connoisseurship',
    marketBehavior: 'Pattern recognition, contrarian plays, first principles'
  },
  
  // The key insight: sophistication doesn't replace instinct, it channels it
  synthesis: 'The refined investor still feels fear and greed - they just recognize the feeling'
};

// ============================================================================
// ADAPTER CLASS
// ============================================================================

interface SensoryMemoryData {
  physiologicalState: keyof typeof PHYSIOLOGICAL_STATES;
  sensoryTriggers: Array<{
    channel: typeof SENSORY_VALENCE_MODEL.CHANNELS[number];
    intensity: number;
    valence: 'positive' | 'negative' | 'mixed';
  }>;
  nostalgiaLevel: number;
  humorDetected: boolean;
  contextDepth: number;
  authenticityScore: number;  // vs pretending
}

// Extended signal type for internal use with metadata
interface ExperienceSignal extends UniversalSignal {
  experienceMetadata: {
    physiologicalState: string;
    sensoryChannelsActive: number;
    nostalgiaResonance: number;
    humorPatternDetected: boolean;
    insideJokeDepth: number;
    pretendingVsReal: number;
  };
}

class SensoryMemoryHumorAdapter {
  private domain: DomainType = 'soul';  // Human experience maps to soul domain
  private signalBuffer: ExperienceSignal[] = [];
  private isActive = false;

  initialize(): void {
    this.isActive = true;
    console.log('[SensoryMemoryHumorAdapter] Initialized - modeling human experiential patterns');
  }

  /**
   * Process human experiential data into universal signals
   */
  processExperienceData(data: SensoryMemoryData): ExperienceSignal {
    const physState = PHYSIOLOGICAL_STATES[data.physiologicalState];
    
    // Calculate composite frequency based on arousal level
    const sensoryArousal = data.sensoryTriggers.reduce(
      (sum, t) => sum + t.intensity, 0
    ) / Math.max(1, data.sensoryTriggers.length);
    
    // Nostalgia creates temporal echoes
    const temporalResonance = data.nostalgiaLevel * 0.8;
    
    // Humor indicates pattern recognition success
    const patternClarity = data.humorDetected ? 0.9 : 0.5;
    
    const signal: ExperienceSignal = {
      domain: this.domain,
      timestamp: Date.now(),
      frequency: sensoryArousal * physState.riskTolerance,
      intensity: data.nostalgiaLevel * physState.decisionQuality,
      phase: this.mapStateToPhase(data.physiologicalState),
      harmonics: [sensoryArousal, temporalResonance, patternClarity],
      rawData: [data.nostalgiaLevel, data.contextDepth, data.authenticityScore],
      experienceMetadata: {
        physiologicalState: data.physiologicalState,
        sensoryChannelsActive: data.sensoryTriggers.length,
        nostalgiaResonance: temporalResonance,
        humorPatternDetected: data.humorDetected,
        insideJokeDepth: data.contextDepth,
        pretendingVsReal: data.authenticityScore
      }
    };

    this.signalBuffer.push(signal);
    return signal;
  }

  private mapStateToPhase(state: keyof typeof PHYSIOLOGICAL_STATES): number {
    const phases: Record<string, number> = {
      STARVING: 0,
      HUNGRY: Math.PI / 4,
      SATISFIED: Math.PI / 2,
      SATIATED: (3 * Math.PI) / 4,
      GLUTTED: Math.PI
    };
    return phases[state] || Math.PI / 2;
  }

  /**
   * Extract domain signature from experience signals
   */
  extractSignature(signals: ExperienceSignal[]): DomainSignature {
    if (signals.length === 0) return this.getDefaultSignature();

    const avgNostalgia = signals.reduce(
      (sum, s) => sum + (s.experienceMetadata?.nostalgiaResonance || 0), 0
    ) / signals.length;

    const humorPresence = signals.filter(
      s => s.experienceMetadata?.humorPatternDetected
    ).length / signals.length;

    const avgAuthenticity = signals.reduce(
      (sum, s) => sum + (s.experienceMetadata?.pretendingVsReal || 0.5), 0
    ) / signals.length;

    // Map to existing DomainSignature quadrant profile
    return {
      domain: this.domain,
      quadrantProfile: {
        aggressive: humorPresence,        // Humor = creative aggression
        defensive: avgAuthenticity,       // Authenticity = defense against deception
        tactical: avgNostalgia,           // Nostalgia = tactical memory use
        strategic: 1 - avgNostalgia       // Present-focus = strategic clarity
      },
      temporalFlow: {
        early: avgNostalgia,              // Past-focused
        mid: 1 - avgNostalgia * 0.5,      // Present-focused
        late: humorPresence * 0.5         // Future anticipation
      },
      intensity: (avgNostalgia + humorPresence + avgAuthenticity) / 3,
      momentum: humorPresence - 0.5,      // Positive = building understanding
      volatility: 1 - avgAuthenticity,    // Pretending = unstable state
      dominantFrequency: avgNostalgia * 10,
      harmonicResonance: humorPresence,
      phaseAlignment: avgAuthenticity,
      extractedAt: Date.now()
    };
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: this.domain,
      quadrantProfile: { aggressive: 0.5, defensive: 0.5, tactical: 0.5, strategic: 0.5 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.3,
      dominantFrequency: 5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }

  /**
   * Detect "Inside Joke" market patterns
   * Where understanding grows the deeper you go
   */
  detectInsideJokePattern(
    priceHistory: number[],
    volumeHistory: number[]
  ): {
    isInsideJoke: boolean;
    depthLevel: number;
    participationRate: number;
    genuineVsFake: number;
  } {
    // Look for patterns that reward deeper analysis
    const surfacePattern = this.calculateSurfacePattern(priceHistory);
    const deepPattern = this.calculateDeepPattern(priceHistory, volumeHistory);
    
    // If deep pattern is more predictive than surface, it's an "inside joke"
    const depthAdvantage = deepPattern.clarity - surfacePattern.clarity;
    
    // Volume without price movement = participation without understanding
    const volumePriceDivergence = this.calculateDivergence(priceHistory, volumeHistory);
    
    return {
      isInsideJoke: depthAdvantage > 0.2,
      depthLevel: Math.max(0, depthAdvantage * 10),
      participationRate: volumePriceDivergence,
      genuineVsFake: 1 - volumePriceDivergence  // Less divergence = more genuine
    };
  }

  private calculateSurfacePattern(prices: number[]): { clarity: number } {
    if (prices.length < 3) return { clarity: 0.5 };
    const trend = (prices[prices.length - 1] - prices[0]) / prices[0];
    return { clarity: Math.abs(trend) };
  }

  private calculateDeepPattern(prices: number[], volumes: number[]): { clarity: number } {
    if (prices.length < 3) return { clarity: 0.5 };
    // Volume-weighted price analysis reveals hidden patterns
    const vwap = prices.reduce((sum, p, i) => sum + p * (volumes[i] || 1), 0) /
                 volumes.reduce((sum, v) => sum + (v || 1), 0);
    const deviation = Math.abs(prices[prices.length - 1] - vwap) / vwap;
    return { clarity: 1 - deviation };  // Less deviation = clearer pattern
  }

  private calculateDivergence(a: number[], b: number[]): number {
    if (a.length < 2 || b.length < 2) return 0.5;
    const aChange = (a[a.length - 1] - a[0]) / Math.max(1, Math.abs(a[0]));
    const bChange = (b[b.length - 1] - b[0]) / Math.max(1, Math.abs(b[0]));
    return Math.abs(aChange - bChange);
  }

  /**
   * Generate market data based on human experiential patterns
   */
  generateExperienceData(
    momentum: number,
    volatility: number,
    volume: number,
    sentiment: number
  ): SensoryMemoryData {
    // Map market conditions to physiological states
    let physiologicalState: keyof typeof PHYSIOLOGICAL_STATES;
    if (sentiment < -0.6) physiologicalState = 'STARVING';
    else if (sentiment < -0.2) physiologicalState = 'HUNGRY';
    else if (sentiment < 0.2) physiologicalState = 'SATISFIED';
    else if (sentiment < 0.6) physiologicalState = 'SATIATED';
    else physiologicalState = 'GLUTTED';

    // High volatility triggers more sensory channels
    const channelCount = Math.min(6, Math.max(1, Math.floor(volatility * 6)));
    const channels = SENSORY_VALENCE_MODEL.CHANNELS.slice(0, channelCount);

    return {
      physiologicalState,
      sensoryTriggers: channels.map(channel => ({
        channel,
        intensity: Math.random() * volatility,
        valence: momentum > 0 ? 'positive' : momentum < 0 ? 'negative' : 'mixed'
      })),
      nostalgiaLevel: Math.abs(sentiment) * 0.5,  // Strong feelings trigger nostalgia
      humorDetected: Math.random() < 0.2,         // Occasional humor/absurdity detection
      contextDepth: Math.floor(volume * 10),      // Volume = participation depth
      authenticityScore: 1 - volatility * 0.5    // High volatility = more pretending
    };
  }
}

// Singleton export
export const sensoryMemoryHumorAdapter = new SensoryMemoryHumorAdapter();

// Export types and constants
export type { SensoryMemoryData, NostalgiaSignal, ExperienceSignal };
export {
  PHYSIOLOGICAL_STATES,
  SENSORY_VALENCE_MODEL,
  HUMOR_MATHEMATICS,
  PRETENDING_PARADOX,
  SOPHISTICATION_LAYERS,
  calculateHumorScore
};
