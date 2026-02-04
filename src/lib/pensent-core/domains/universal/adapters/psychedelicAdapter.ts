/**
 * Psychedelic Adapter - Altered States & Therapeutic Integration
 * 
 * Trip phases, set and setting, integration patterns, mystical experiences,
 * and the temporal architecture of consciousness expansion.
 * 
 * For Alec Arthur Shelton - The Artist
 * Psychedelics reveal the mind's capacity to restructure reality itself.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// SUBSTANCE PROFILES
const PSYCHEDELIC_SUBSTANCES = {
  psilocybin: {
    source: 'Magic mushrooms',
    duration: '4-6 hours',
    character: 'Organic, earth-connected, emotional',
    therapeutic: 'Depression, end-of-life anxiety'
  },
  
  lsd: {
    source: 'Synthesized (ergot derivative)',
    duration: '8-12 hours',
    character: 'Electric, cognitive, analytical',
    therapeutic: 'Less research, creativity studies'
  },
  
  dmt: {
    source: 'Plants, synthesized, toad venom',
    duration: '5-20 minutes (smoked)',
    character: 'Cosmic, other-dimensional, overwhelming',
    therapeutic: 'Emerging research'
  },
  
  mdma: {
    classification: 'Entactogen/empathogen',
    duration: '3-6 hours',
    character: 'Pro-social, heart-opening, traumatic release',
    therapeutic: 'PTSD (FDA breakthrough therapy)'
  },
  
  ayahuasca: {
    source: 'Amazonian brew (DMT + MAOI)',
    duration: '4-8 hours',
    character: 'Purging, ancestral, spiritual',
    therapeutic: 'Addiction, trauma, meaning'
  }
};

// TRIP PHASES
const EXPERIENCE_PHASES = {
  onset: {
    timing: '20-60 minutes',
    sensations: ['Body load', 'Anxiety', 'Anticipation', 'Sensory changes'],
    management: 'Surrender, grounding, breath'
  },
  
  comeUp: {
    timing: 'Peak approaching',
    sensations: ['Intensification', 'Thought acceleration', 'Visual changes'],
    challenge: 'Letting go of control'
  },
  
  peak: {
    timing: 'Maximum effects',
    experiences: ['Ego dissolution', 'Mystical states', 'Time distortion', 'Insight'],
    potential: 'Breakthrough, catharsis, terror'
  },
  
  plateau: {
    timing: 'Sustained effects',
    experiences: ['Exploration', 'Integration attempts', 'Creative flow'],
    activity: 'Therapeutic work, artistic expression'
  },
  
  comeDown: {
    timing: 'Return to baseline',
    experiences: ['Reflection', 'Exhaustion', 'Afterglow', 'Vulnerability'],
    importance: 'Integration begins'
  }
};

// SET AND SETTING
const CONTEXT_FACTORS = {
  set: {
    definition: 'Internal state - mindset, intention, preparation',
    factors: ['Mental health', 'Expectations', 'Intention', 'Surrender capacity'],
    preparation: 'Therapeutic screening, intention setting'
  },
  
  setting: {
    definition: 'External environment - physical, social',
    ideal: ['Safe', 'Comfortable', 'Controlled', 'Support present'],
    clinical: 'Medical monitoring, eyeshades, music'
  },
  
  guide: {
    role: 'Sitter, therapist, shaman',
    functions: ['Safety', 'Reassurance', 'Minimal intervention', 'Integration support'],
    training: 'Psychedelic therapy certification emerging'
  }
};

// MYSTICAL EXPERIENCE
const MYSTICAL_DIMENSIONS = {
  unity: {
    description: 'Sense of oneness with universe',
    quality: 'Noetic - feels more real than ordinary reality',
    persistence: 'Often most recalled aspect'
  },
  
  transcendence: {
    description: 'Beyond time and space',
    experience: 'Eternal now, infinite vastness',
    impact: 'Perspective shift on daily concerns'
  },
  
  sacredness: {
    description: 'Reverence, awe, holy quality',
    quality: 'Not tied to specific religion',
    effect: 'Increased wellbeing, meaning'
  },
  
  paradoxicality: {
    description: 'Contradictory truths coexisting',
    examples: ['Life/death', 'Self/no-self', 'One/many'],
    challenge: 'Difficult to articulate'
  }
};

// INTEGRATION
const INTEGRATION_PATTERNS = {
  immediate: {
    timing: '24-48 hours post',
    activities: ['Rest', 'Journaling', 'Nature', 'Limited stimulation'],
    vulnerability: 'Open window, protect insights'
  },
  
  shortTerm: {
    timing: 'Days to weeks',
    activities: ['Therapy', 'Discussion', 'Art', 'Behavioral experiments'],
    goal: 'Embody insights'
  },
  
  longTerm: {
    timing: 'Months to years',
    process: 'Sustained change, ongoing meaning-making',
    challenges: ['Afterglow fading', 'Old patterns returning', 'Multiple sessions needed']
  },
  
  risks: {
    challenging: 'Difficult experiences can be traumatic if unsupported',
    psychosis: 'Rare, contraindications essential',
    integrationFailure: 'Insights not applied, spiritual bypassing'
  }
};

interface PsychedelicEvent {
  timestamp: number;
  substancePotency: number; // 0-10
  phaseProgression: number; // 0-1
  egoDissolution: number; // 0-1
  mysticalIntensity: number; // 0-10
  emotionalValence: number; // -1 to 1
  physiologicalSafety: number; // 0-1
  therapeuticAlliance: number; // 0-10
  integrationReadiness: number; // 0-1
  setQuality: number; // 0-10
  settingSafety: number; // 0-10
}

class PsychedelicAdapter implements DomainAdapter<PsychedelicEvent> {
  domain = 'bio' as const;
  name = 'Psychedelic States & Therapeutic Integration';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[PsychedelicAdapter] Initialized - Consciousness patterns active');
  }
  
  processRawData(event: PsychedelicEvent): UniversalSignal {
    const { timestamp, phaseProgression, egoDissolution, mysticalIntensity, physiologicalSafety, therapeuticAlliance } = event;
    
    // Frequency encodes experience intensity
    const frequency = mysticalIntensity / 10;
    
    // Intensity = altered state depth
    const intensity = egoDissolution * mysticalIntensity / 10 * (physiologicalSafety + therapeuticAlliance / 10) / 2;
    
    // Phase encodes trip timeline position
    const phase = phaseProgression * Math.PI;
    
    const harmonics = [
      phaseProgression,
      egoDissolution,
      mysticalIntensity / 10,
      Math.abs(event.emotionalValence),
      physiologicalSafety,
      therapeuticAlliance / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'bio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [phaseProgression, egoDissolution, mysticalIntensity, physiologicalSafety, therapeuticAlliance]
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
    
    const avgPhase = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgEgo = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgMystical = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgSafety = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgAlliance = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgEgo > 0.8 ? 0.8 : 0.2,
      defensive: avgSafety > 0.9 ? 0.7 : 0.2,
      tactical: avgPhase < 0.3 ? 0.5 : 0.3,
      strategic: avgMystical > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgPhase < 0.2 ? 0.8 : 0.2,
      mid: avgPhase >= 0.2 && avgPhase < 0.7 ? 0.7 : 0.2,
      late: avgPhase >= 0.7 ? 0.8 : 0.2
    };
    
    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: avgMystical / 10,
      momentum: avgEgo > 0.5 ? 1 : -1,
      volatility: avgEgo,
      dominantFrequency: avgMystical / 10,
      harmonicResonance: avgAlliance / 10,
      phaseAlignment: avgPhase,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.3, defensive: 0.3, tactical: 0.2, strategic: 0.2 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.4,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 0.6,
      harmonicResonance: 0.7,
      phaseAlignment: 0.2,
      extractedAt: Date.now()
    };
  }
}

export const psychedelicAdapter = new PsychedelicAdapter();
export { PSYCHEDELIC_SUBSTANCES, EXPERIENCE_PHASES, CONTEXT_FACTORS, MYSTICAL_DIMENSIONS, INTEGRATION_PATTERNS };
export type { PsychedelicEvent };
