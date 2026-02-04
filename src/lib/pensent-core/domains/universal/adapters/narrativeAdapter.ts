/**
 * Narrative & Mythic Structure Adapter
 * 
 * Human meaning-making through story. Plot archetypes, hero's journey,
 * narrative tension, and mythic patterns as temporal sequences.
 * 
 * For Alec Arthur Shelton - The Artist
 * Stories are how humans understand time itself.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// JOSEPH CAMPBELL'S HERO'S JOURNEY (Real Mythic Structure)
// ═══════════════════════════════════════════════════════════════════════════════

const HEROS_JOURNEY = {
  // Act I: Departure
  ordinaryWorld: {
    stage: 1,
    narrativeFunction: 'Establish baseline, show hero in normal context',
    temporalPosition: 0.0, // 0-1 through story
    emotionalValence: 1, // 1-10 scale
    marketAnalogy: 'Market in equilibrium, no trend established'
  },
  callToAdventure: {
    stage: 2,
    narrativeFunction: 'Disruption enters, hero receives challenge',
    temporalPosition: 0.08,
    emotionalValence: 4,
    marketAnalogy: 'First breakout, trend emergence'
  },
  refusalOfCall: {
    stage: 3,
    narrativeFunction: 'Hero hesitates, fear of change',
    temporalPosition: 0.12,
    emotionalValence: 2,
    marketAnalogy: 'False breakout, pullback, trader hesitation'
  },
  meetingMentor: {
    stage: 4,
    narrativeFunction: 'Guidance received, preparation begins',
    temporalPosition: 0.15,
    emotionalValence: 3,
    marketAnalogy: 'Institutional accumulation, smart money entry'
  },
  crossingThreshold: {
    stage: 5,
    narrativeFunction: 'Point of no return, commitment made',
    temporalPosition: 0.20,
    emotionalValence: 6,
    marketAnalogy: 'Break of structure, trend confirmed'
  },
  
  // Act II: Initiation
  testsAlliesEnemies: {
    stage: 6,
    narrativeFunction: 'Challenges faced, alliances formed',
    temporalPosition: 0.35,
    emotionalValence: 5,
    marketAnalogy: 'Trend continuation with pullbacks, support tests'
  },
  approachInmostCave: {
    stage: 7,
    narrativeFunction: 'Preparation for supreme ordeal',
    temporalPosition: 0.50,
    emotionalValence: 4,
    marketAnalogy: 'Consolidation before major move, volatility compression'
  },
  ordeal: {
    stage: 8,
    narrativeFunction: 'Death and rebirth, central crisis',
    temporalPosition: 0.65,
    emotionalValence: 9,
    marketAnalogy: 'Maximum volatility, stop hunts, liquidation cascade'
  },
  reward: {
    stage: 9,
    narrativeFunction: 'Seizing the sword, victory achieved',
    temporalPosition: 0.75,
    emotionalValence: 8,
    marketAnalogy: 'Breakout to new highs, profit taking zone'
  },
  
  // Act III: Return
  roadBack: {
    stage: 10,
    narrativeFunction: 'Journey home begins, consequences faced',
    temporalPosition: 0.85,
    emotionalValence: 5,
    marketAnalogy: 'Trend exhaustion, distribution begins'
  },
  resurrection: {
    stage: 11,
    narrativeFunction: 'Final test, transformation complete',
    temporalPosition: 0.92,
    emotionalValence: 7,
    marketAnalogy: 'Final push, bull trap or bear rally'
  },
  returnWithElixir: {
    stage: 12,
    narrativeFunction: 'Return to ordinary world, changed',
    temporalPosition: 1.0,
    emotionalValence: 6,
    marketAnalogy: 'New equilibrium established, cycle complete'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// KURT VONNEGUT'S SHAPES OF STORIES (Real Narrative Archetypes)
// ═══════════════════════════════════════════════════════════════════════════════

const STORY_SHAPES = {
  // Man in Hole: Fall then rise (Cinderella)
  manInHole: {
    curve: 'valley_then_peak',
    emotionalTrajectory: [5, 4, 3, 2, 3, 4, 5, 6, 7],
    examples: ['Cinderella', 'Wall-E', 'The Godfather'],
    marketAnalogy: 'Market crash and recovery'
  },
  
  // Boy Meets Girl: Rise, fall, rise (romance arc)
  boyMeetsGirl: {
    curve: 'rise_fall_rise',
    emotionalTrajectory: [5, 6, 7, 8, 4, 3, 4, 7, 8],
    examples: ['Pride and Prejudice', 'When Harry Met Sally'],
    marketAnalogy: 'M&A announcement, regulatory denial, eventual approval'
  },
  
  // From Bad to Worse: Steady decline (tragedy)
  fromBadToWorse: {
    curve: 'monotonic_decline',
    emotionalTrajectory: [5, 4, 3, 2, 1, 0],
    examples: ['1984', 'Breaking Bad', 'Madame Bovary'],
    marketAnalogy: 'Death spiral, company bankruptcy'
  },
  
  // Which Way Is Up?: Chaos/no clear arc (postmodern)
  whichWayIsUp: {
    curve: 'stochastic_walk',
    emotionalTrajectory: 'random',
    examples: ['Catch-22', 'Alice in Wonderland'],
    marketAnalogy: 'Choppy sideways market, no trend'
  },
  
  // Creation Story: Rise from nothing
  creationStory: {
    curve: 'monotonic_rise',
    emotionalTrajectory: [1, 2, 3, 4, 5, 6, 7, 8],
    examples: ['The Social Network', 'Startup narratives'],
    marketAnalogy: 'IPO trajectory, unicorn growth'
  },
  
  // Old Testament: High then fall (hubris)
  oldTestament: {
    curve: 'peak_then_valley',
    emotionalTrajectory: [5, 6, 7, 8, 7, 5, 3, 2],
    examples: ['Adam and Eve', 'Icarus', 'Macbeth'],
    marketAnalogy: 'Pump and dump, hype cycle crash'
  },
  
  // New Testament: Sacrifice and redemption
  newTestament: {
    curve: 'sacrificial_resurrection',
    emotionalTrajectory: [5, 6, 7, 8, 9, 0, 1, 10],
    examples: ['Life of Christ', 'Les Miserables'],
    marketAnalogy: 'Company turnaround, bankruptcy to profitability'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NARRATIVE TENSION MECHANICS
// ═══════════════════════════════════════════════════════════════════════════════

const NARRATIVE_MECHANICS = {
  dramaticIrony: {
    definition: 'Audience knows more than characters',
    temporalEffect: 'Creates suspense through information asymmetry',
    marketAnalogy: 'Insider knowledge vs public information'
  },
  
  foreshadowing: {
    definition: 'Early hints of later events',
    temporalEffect: 'Creates coherence in temporal sequence',
    marketAnalogy: 'Technical analysis, leading indicators'
  },
  
  flashback: {
    definition: 'Non-linear temporal presentation',
    temporalEffect: 'Reveals causality backwards',
    marketAnalogy: 'Historical pattern recognition'
  },
  
  cliffhanger: {
    definition: 'Suspense at chapter/scene end',
    temporalEffect: 'Forces continued attention',
    marketAnalogy: 'Options expiration, earnings announcements'
  },
  
  tickingClock: {
    definition: 'Time pressure narrative device',
    temporalEffect: 'Accelerates perceived tempo',
    marketAnalogy: 'Expiration dates, margin calls'
  },
  
  dramaticQuestion: {
    definition: 'Central unresolved query',
    temporalEffect: 'Drives narrative momentum',
    marketAnalogy: 'Will Fed hike? Will merger close?'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MYTHIC ARCHETYPES (Carl Jung + Joseph Campbell)
// ═══════════════════════════════════════════════════════════════════════════════

const ARCHETYPES = {
  hero: {
    narrativeRole: 'Central protagonist facing challenge',
    temporalPattern: 'growth_through_adversity',
    marketRepresentation: 'Breakout stock defying market'
  },
  mentor: {
    narrativeRole: 'Wise guide providing knowledge',
    temporalPattern: 'intermittent_appearance',
    marketRepresentation: 'Institutional smart money'
  },
  thresholdGuardian: {
    narrativeRole: 'Tests hero before advancement',
    temporalPattern: 'appears_at_transitions',
    marketRepresentation: 'Resistance levels, technical barriers'
  },
  herald: {
    narrativeRole: 'Announces coming change',
    temporalPattern: 'precursor_signal',
    marketRepresentation: 'Leading indicators, early warnings'
  },
  shapeshifter: {
    narrativeRole: 'Uncertainty, ally or enemy unclear',
    temporalPattern: 'ambiguous_alignment',
    marketRepresentation: 'Volatile stocks, uncertain trends'
  },
  shadow: {
    narrativeRole: 'Antagonist, hero\'s dark mirror',
    temporalPattern: 'opposition_and_conflict',
    marketRepresentation: 'Short sellers, market crash'
  },
  trickster: {
    narrativeRole: 'Chaos, comic relief, change agent',
    temporalPattern: 'disruptive_interruption',
    marketRepresentation: 'Meme stocks, retail traders'
  }
};

interface StoryEvent {
  timestamp: number;
  storyPosition: number; // 0-1 through narrative
  herosJourneyStage: keyof typeof HEROS_JOURNEY;
  storyShape: keyof typeof STORY_SHAPES;
  emotionalIntensity: number; // 0-10
  tension: number; // 0-10
  activeArchetype: keyof typeof ARCHETYPES;
  dramaticQuestion: string;
  foreshadowingElements: string[];
  hasTickingClock: boolean;
}

class NarrativeAdapter implements DomainAdapter<StoryEvent> {
  domain = 'soul' as const;
  name = 'Narrative & Mythic Structure';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[NarrativeAdapter] Initialized - Story patterns flowing');
  }
  
  processRawData(event: StoryEvent): UniversalSignal {
    const { timestamp, storyPosition, emotionalIntensity, tension } = event;
    
    // Frequency encodes narrative position (beginning = higher, end = lower)
    const frequency = 1 - storyPosition;
    
    // Intensity = emotional intensity × tension
    const intensity = (emotionalIntensity / 10) * (tension / 10);
    
    // Phase encodes hero's journey stage progress
    const journeyStage = HEROS_JOURNEY[event.herosJourneyStage].stage;
    const phase = (journeyStage / 12) * Math.PI * 2;
    
    const harmonics = [
      emotionalIntensity / 10,
      tension / 10,
      storyPosition,
      event.hasTickingClock ? 0.9 : 0.1,
      journeyStage / 12,
      Object.keys(ARCHETYPES).indexOf(event.activeArchetype) / 7
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [emotionalIntensity, tension, storyPosition, journeyStage]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.lastUpdate = timestamp;
    return signal;
  }
  
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }
    
    const recent = signals.slice(-100);
    
    const avgEmotion = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgTension = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgPosition = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgStage = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    
    // Quadrant = narrative dynamics
    const quadrantProfile = {
      aggressive: avgTension > 7 ? 0.8 : 0.2, // High tension = conflict
      defensive: avgEmotion < 4 ? 0.7 : 0.1, // Low emotion = exposition
      tactical: avgPosition > 0.3 && avgPosition < 0.7 ? 0.6 : 0.2, // Middle = development
      strategic: avgStage > 8 ? 0.8 : 0.3 // Late stages = resolution
    };
    
    // Temporal flow through hero's journey
    const temporalFlow = {
      early: avgStage < 5 ? 1 - (avgStage / 5) : 0.1,
      mid: avgStage >= 5 && avgStage <= 9 ? 0.7 : 0.2,
      late: avgStage > 9 ? (avgStage - 9) / 3 : 0.1
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: (avgEmotion / 10) * (avgTension / 10),
      momentum: avgPosition > 0.5 ? 1 : -1,
      volatility: avgTension / 10,
      dominantFrequency: 1 - avgPosition,
      harmonicResonance: 1 - (avgTension / 10),
      phaseAlignment: avgStage / 12,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.4, mid: 0.3, late: 0.3 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 0.5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Identify which story shape matches a series of events
  identifyStoryShape(emotionalTrajectory: number[]): keyof typeof STORY_SHAPES | 'unknown' {
    const shapes = Object.entries(STORY_SHAPES);
    let bestMatch: keyof typeof STORY_SHAPES | 'unknown' = 'unknown';
    let bestScore = -1;
    
    for (const [shapeName, shape] of shapes) {
      if (shape.emotionalTrajectory === 'random') continue;
      
      const shapeArr = shape.emotionalTrajectory as number[];
      if (shapeArr.length !== emotionalTrajectory.length) continue;
      
      const correlation = this.calculateCorrelation(emotionalTrajectory, shapeArr);
      if (correlation > bestScore) {
        bestScore = correlation;
        bestMatch = shapeName as keyof typeof STORY_SHAPES;
      }
    }
    
    return bestScore > 0.7 ? bestMatch : 'unknown';
  }
  
  private calculateCorrelation(a: number[], b: number[]): number {
    const n = a.length;
    const sumA = a.reduce((s, v) => s + v, 0);
    const sumB = b.reduce((s, v) => s + v, 0);
    const sumAB = a.reduce((s, v, i) => s + v * b[i], 0);
    const sumA2 = a.reduce((s, v) => s + v * v, 0);
    const sumB2 = b.reduce((s, v) => s + v * v, 0);
    
    const numerator = n * sumAB - sumA * sumB;
    const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  // Map market price action to narrative structure
  mapMarketToNarrative(prices: number[]): {
    shape: keyof typeof STORY_SHAPES | 'unknown';
    journeyStage: keyof typeof HEROS_JOURNEY;
    dramaticQuestion: string;
  } {
    // Normalize prices to 0-10 emotional scale
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const normalized = prices.map(p => ((p - min) / (max - min || 1)) * 10);
    
    const shape = this.identifyStoryShape(normalized);
    
    // Determine journey stage based on position in series
    const position = 0.5; // Simplified - would need full series analysis
    const stageIndex = Math.floor(position * 12);
    const stageNames = Object.keys(HEROS_JOURNEY) as (keyof typeof HEROS_JOURNEY)[];
    const journeyStage = stageNames[Math.min(stageIndex, 11)];
    
    const dramaticQuestion = normalized[normalized.length - 1] > normalized[0] 
      ? 'Will the uptrend continue?'
      : 'Will the downtrend reverse?';
    
    return { shape: shape || 'whichWayIsUp', journeyStage, dramaticQuestion };
  }
}

export const narrativeAdapter = new NarrativeAdapter();
export { HEROS_JOURNEY, STORY_SHAPES, NARRATIVE_MECHANICS, ARCHETYPES };
export type { StoryEvent };
