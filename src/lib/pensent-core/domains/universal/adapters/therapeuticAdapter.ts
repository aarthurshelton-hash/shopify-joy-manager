/**
 * Therapeutic Adapter - Healing Patterns & Wellness Optimization
 * 
 * Treatment efficacy, therapy modalities, recovery trajectories,
 * placebo effects, and healing as temporal process.
 * 
 * For Alec Arthur Shelton - The Artist
 * Healing is the body's pattern reasserting its natural harmony.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// THERAPY MODALITIES
const THERAPY_MODALITIES = {
  cbt: {
    name: 'Cognitive Behavioral Therapy',
    approach: 'Thoughts → Feelings → Behaviors',
    efficacy: 'Strong evidence for depression, anxiety',
    duration: '12-20 sessions typical'
  },
  
  psychodynamic: {
    name: 'Psychodynamic/Psychoanalytic',
    approach: 'Unconscious patterns, early experiences',
    efficacy: 'Long-term personality change',
    duration: 'Months to years'
  },
  
  humanistic: {
    name: 'Person-Centered, Existential',
    approach: 'Self-actualization, meaning',
    efficacy: 'Relationship quality key',
    duration: 'Variable'
  },
  
  somatic: {
    name: 'Somatic Experiencing, Body-based',
    approach: 'Trauma stored in body',
    efficacy: 'PTSD, chronic stress',
    duration: 'Trauma-dependent'
  },
  
  mindfulness: {
    name: 'MBSR, ACT, DBT',
    approach: 'Present moment, acceptance',
    efficacy: 'Anxiety, depression, stress',
    duration: '8-week programs typical'
  }
};

// HEALING PHASES
const HEALING_CYCLES = {
  crisis: {
    phase: 'Acute distress',
    needs: ['Safety', 'Stabilization', 'Support'],
    duration: 'Days to weeks'
  },
  
  stabilization: {
    phase: 'Establish baseline',
    needs: ['Routine', 'Coping skills', 'Support system'],
    duration: 'Weeks to months'
  },
  
  processing: {
    phase: 'Deep therapeutic work',
    needs: ['Insight', 'Emotional processing', 'Pattern recognition'],
    duration: 'Months'
  },
  
  integration: {
    phase: 'Consolidate gains',
    needs: ['Practice', 'Relapse prevention', 'Meaning-making'],
    duration: 'Months to years'
  },
  
  maintenance: {
    phase: 'Sustained wellness',
    needs: ['Ongoing support', 'Growth', 'Resilience'],
    duration: 'Lifelong'
  }
};

// PLACEBO DYNAMICS
const PLACEBO_PATTERNS = {
  mechanisms: {
    expectation: 'Belief shapes experience',
    conditioning: 'Learned association',
    social: 'Relationship with healer',
    meaning: 'Ritual and context'
  },
  
  magnitude: {
    pain: '30-50% improvement typical',
    depression: '30%',
    parkinsons: 'Measurable objective improvement',
    factors: ['Color of pill', 'Injection > pill', 'Brand name', 'Doctor demeanor']
  },
  
  nocebo: {
    description: 'Negative expectation causes harm',
    examples: ['Side effects from placebo', 'Voodoo death'],
    ethics: 'Informed consent dilemma'
  }
};

// TREATMENT RESISTANCE
const RESISTANCE_PATTERNS = {
  types: {
    denial: 'Not acknowledging problem',
    avoidance: 'Missing sessions, changing topics',
    intellectualization: 'Analyzing not feeling',
    projection: 'Blaming others',
    actingOut: 'Behavior between sessions'
  },
  
  management: {
    approach: 'Explore collaboratively',
    technique: 'Motivational interviewing',
    goal: 'Reduce defensiveness, increase insight'
  }
};

// WELLNESS DIMENSIONS
const WELLNESS_DIMENSIONS = {
  physical: 'Exercise, nutrition, sleep',
  emotional: 'Emotion regulation, expression',
  social: 'Connection, community',
  occupational: 'Purpose, meaning in work',
  spiritual: 'Values, transcendence',
  intellectual: 'Learning, curiosity',
  environmental: 'Safe, stimulating space'
};

interface TherapeuticEvent {
  timestamp: number;
  symptomSeverity: number; // 0-10
  therapeuticAlliance: number; // 0-10
  insightLevel: number; // 0-10
  copingEfficacy: number; // 0-10
  treatmentAdherence: number; // 0-1
  placeboResponse: number; // 0-1
  resistanceLevel: number; // 0-1
  supportSystemStrength: number; // 0-10
  healingPhase: number; // 0-4
}

class TherapeuticAdapter implements DomainAdapter<TherapeuticEvent> {
  domain = 'bio' as const;
  name = 'Therapeutic Healing & Wellness';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[TherapeuticAdapter] Initialized - Healing patterns active');
  }
  
  processRawData(event: TherapeuticEvent): UniversalSignal {
    const { timestamp, symptomSeverity, therapeuticAlliance, insightLevel, copingEfficacy, healingPhase } = event;
    
    // Frequency encodes healing velocity
    const frequency = 1 - symptomSeverity / 10;
    
    // Intensity = therapeutic work depth
    const intensity = (insightLevel / 10 + copingEfficacy / 10) / 2 * therapeuticAlliance / 10;
    
    // Phase encodes healing journey position
    const phase = healingPhase / 4 * Math.PI;
    
    const harmonics = [
      1 - symptomSeverity / 10,
      therapeuticAlliance / 10,
      insightLevel / 10,
      copingEfficacy / 10,
      event.treatmentAdherence,
      event.supportSystemStrength / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'bio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [symptomSeverity, therapeuticAlliance, insightLevel, copingEfficacy, healingPhase]
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
    
    const avgSymptoms = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgAlliance = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgInsight = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgCoping = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgPhase = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgSymptoms > 7 ? 0.8 : 0.2,
      defensive: avgCoping > 7 ? 0.7 : 0.2,
      tactical: avgAlliance > 7 ? 0.7 : 0.3,
      strategic: avgInsight > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgPhase < 1 ? 0.9 : 0.1,
      mid: avgPhase >= 1 && avgPhase < 3 ? 0.7 : 0.2,
      late: avgPhase >= 3 ? 0.8 : 0.2
    };
    
    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: (avgAlliance + avgInsight) / 20,
      momentum: avgSymptoms < 5 ? 1 : -1,
      volatility: avgSymptoms / 10,
      dominantFrequency: 1 - avgSymptoms / 10,
      harmonicResonance: avgCoping / 10,
      phaseAlignment: avgPhase / 4,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.5, defensive: 0.2, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.5,
      momentum: -1,
      volatility: 0.6,
      dominantFrequency: 0.4,
      harmonicResonance: 0.5,
      phaseAlignment: 0.2,
      extractedAt: Date.now()
    };
  }
}

export const therapeuticAdapter = new TherapeuticAdapter();
export { THERAPY_MODALITIES, HEALING_CYCLES, PLACEBO_PATTERNS, RESISTANCE_PATTERNS, WELLNESS_DIMENSIONS };
export type { TherapeuticEvent };
