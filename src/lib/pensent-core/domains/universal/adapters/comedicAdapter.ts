/**
 * Comedic Adapter - Humor Patterns & Laughter Mechanisms
 * 
 * Joke structures, comedy cycles, timing patterns, cultural sensitivity,
 * and humor as temporal tension release.
 * 
 * For Alec Arthur Shelton - The Artist
 * Comedy is truth told with rhythm.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// COMEDY THEORIES
const COMEDY_THEORIES = {
  superiority: {
    theory: 'Humor from feeling superior',
    examples: ['Slapstick', 'Satire', 'Put-down humor'],
    critique: 'Cruelty potential'
  },
  
  relief: {
    theory: 'Tension release through laughter',
    mechanism: 'Build tension, release safely',
    examples: ['Suspense', 'Taboo subjects', 'Anxiety']
  },
  
  incongruity: {
    theory: 'Mismatched expectations create surprise',
    pattern: 'Setup → Expectation → Subversion',
    examples: ['Puns', 'Absurdism', 'Surrealism']
  },
  
  benignViolation: {
    theory: 'Threat that turns out safe',
    balance: 'Wrong but okay',
    examples: ['Playful aggression', 'Mild embarrassment']
  }
};

// JOKE STRUCTURES
const JOKE_PATTERNS = {
  setupPunchline: {
    structure: 'Context → Twist',
    timing: 'Beat between for processing',
    variants: ['One-liners', 'Stories', 'Call-backs']
  },
  
  ruleOfThree: {
    structure: 'Two normal, one absurd',
    rhythm: 'Building pattern',
    examples: ['Lists', 'Escalation']
  },
  
  misdirection: {
    technique: 'Lead audience one way, go another',
    types: ['Ambiguity', 'Wordplay', 'Visual deception']
  },
  
  callback: {
    technique: 'Reference earlier joke',
    effect: 'Reward attention, build cohesion',
    timing: 'Later in set'
  }
};

// COMEDY GENRES
const COMEDY_GENRES = {
  standup: {
    format: 'Solo performer, direct audience',
    styles: ['Observational', 'Storytelling', 'Political', 'Alternative'],
    evolution: 'From vaudeville to Netflix specials'
  },
  
  improv: {
    format: 'Unscripted, spontaneous',
    rules: ['Yes and', 'Support partners', 'No blocking'],
    training: 'Classes, jams, teams'
  },
  
  sketch: {
    format: 'Short scenes, recurring characters',
    examples: ['SNL', 'Monty Python', 'Key & Peele'],
    cycle: 'Current events → timeless'
  },
  
  sitcom: {
    format: 'Situation comedy, ensemble',
    structures: ['A-plot/B-plot', 'Three-act', 'Running gags'],
    laughTrack: 'Declining use'
  }
};

// HUMOR CYCLES
const HUMOR_TRENDS = {
  edgy: {
    pattern: 'Push boundaries, then mainstream',
    examples: ['Lenny Bruce', 'South Park', 'Taboo comedy'],
    backlash: 'Oversaturation, sensitivity'
  },
  
  nostalgic: {
    pattern: 'Retro appreciation',
    examples: ['80s nostalgia', 'Vintage memes'],
    cycle: '20-30 year cycles'
  },
  
  absurdist: {
    pattern: 'Random, non-sequitur',
    era: 'Post-internet, millennial/gen z',
    examples: ['Memes', 'Tim and Eric', 'Anti-humor']
  },
  
  political: {
    pattern: 'Satire of power',
    risk: 'Preaching, audience division',
    balance: 'Punching up vs punching down'
  }
};

// TIMING PATTERNS
const TIMING_DYNAMICS = {
  pause: {
    function: 'Let audience process, build anticipation',
    duration: 'Beat, two beats',
    risk: 'Too long = awkward, too short = rushed'
  },
  
  rhythm: {
    pattern: 'Staccato for energy, legato for stories',
    variation: 'Monotony kills',
    music: 'Comedy as percussive instrument'
  },
  
  pacing: {
    early: 'Fast, establish energy',
    middle: 'Varied, mix styles',
    late: 'Strong closer, callbacks'
  }
};

interface ComedicEvent {
  timestamp: number;
  laughterIntensity: number; // 0-10
  surpriseFactor: number; // 0-1
  tensionRelease: number; // 0-1
  culturalResonance: number; // 0-1
  tabooLevel: number; // 0-10
  originality: number; // 0-1
  timingPrecision: number; // 0-1
  callbackDensity: number; // 0-1
  audienceEngagement: number; // 0-10
}

class ComedicAdapter implements DomainAdapter<ComedicEvent> {
  domain = 'soul' as const;
  name = 'Comedic Timing & Humor Patterns';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[ComedicAdapter] Initialized - Laughter patterns active');
  }
  
  processRawData(event: ComedicEvent): UniversalSignal {
    const { timestamp, laughterIntensity, surpriseFactor, tensionRelease, culturalResonance } = event;
    
    // Frequency encodes joke density
    const frequency = event.callbackDensity;
    
    // Intensity = comedic impact
    const intensity = laughterIntensity / 10 * surpriseFactor * tensionRelease;
    
    // Phase encodes cultural-taboo balance
    const phase = (culturalResonance + (10 - event.tabooLevel) / 10) / 2 * Math.PI;
    
    const harmonics = [
      laughterIntensity / 10,
      surpriseFactor,
      tensionRelease,
      culturalResonance,
      1 - event.tabooLevel / 10,
      event.originality
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [laughterIntensity, surpriseFactor, tensionRelease, culturalResonance, event.tabooLevel]
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
    
    const avgLaugh = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgSurprise = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgTension = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgCulture = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgTaboo = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgTaboo > 6 ? 0.7 : 0.3,
      defensive: avgCulture > 0.7 ? 0.7 : 0.2,
      tactical: avgSurprise > 0.7 ? 0.7 : 0.3,
      strategic: avgLaugh > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgTension < 0.3 ? 0.8 : 0.2,
      mid: avgTension >= 0.3 && avgTension < 0.7 ? 0.7 : 0.2,
      late: avgTension >= 0.7 ? 0.9 : 0.1
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: avgLaugh / 10,
      momentum: avgLaugh > 7 ? 1 : -1,
      volatility: avgSurprise,
      dominantFrequency: avgLaugh / 10,
      harmonicResonance: avgCulture,
      phaseAlignment: 1 - avgTaboo / 10,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.3, defensive: 0.3, tactical: 0.3, strategic: 0.1 },
      temporalFlow: { early: 0.3, mid: 0.4, late: 0.3 },
      intensity: 0.6,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 0.7,
      harmonicResonance: 0.6,
      phaseAlignment: 0.7,
      extractedAt: Date.now()
    };
  }
}

export const comedicAdapter = new ComedicAdapter();
export { COMEDY_THEORIES, JOKE_PATTERNS, COMEDY_GENRES, HUMOR_TRENDS, TIMING_DYNAMICS };
export type { ComedicEvent };
