/**
 * Romantic Adapter - Mating Strategies & Relationship Dynamics
 * 
 * Attraction patterns, attachment styles, courtship rituals,
 * relationship lifecycle, and love as temporal pattern.
 * 
 * For Alec Arthur Shelton - The Artist
 * Love is the universe's pattern recognizing itself in another.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// MATING STRATEGIES
const MATING_STRATEGIES = {
  shortTerm: {
    characteristics: ['High quantity', 'Low investment', 'Physical attraction priority'],
    tactics: ['Display', 'Competition', 'Deception'],
    risks: ['Disease', 'Reputation', 'Conflict'],
    marketAnalogy: 'High-frequency trading, quick turnover'
  },
  
  longTerm: {
    characteristics: ['High investment', 'Commitment', 'Compatibility priority'],
    criteria: ['Resources', 'Parenting ability', 'Character', 'Compatibility'],
    benefits: ['Cooperation', 'Shared parenting', 'Emotional support'],
    marketAnalogy: 'Value investing, buy and hold'
  },
  
  mixed: {
    description: 'Context-dependent strategy',
    factors: ['Own mate value', 'Market conditions', 'Life stage', 'Opportunity'],
    flexibility: 'Adaptive to circumstances'
  }
};

// ATTACHMENT THEORY
const ATTACHMENT_PATTERNS = {
  secure: {
    childhood: 'Responsive, consistent caregiving',
    adult: 'Comfortable with intimacy and independence',
    relationship: 'Stable, satisfying, resilient',
    prevalence: '~50-60% of population'
  },
  
  anxious: {
    childhood: 'Inconsistent caregiving',
    adult: 'Fear of abandonment, seeks reassurance',
    relationship: 'Clingy, jealous, emotional highs/lows',
    prevalence: '~20% of population'
  },
  
  avoidant: {
    childhood: 'Emotionally distant caregiving',
    adult: 'Discomfort with closeness, self-reliant',
    relationship: 'Distant, suppresses needs, fears engulfment',
    prevalence: '~25% of population'
  },
  
  disorganized: {
    childhood: 'Frightening or traumatized caregivers',
    adult: 'Unresolved trauma, contradictory behaviors',
    relationship: 'Chaotic, approach-avoidance conflicts',
    prevalence: '~5% of population'
  }
};

// LOVE PHASES
const LOVE_CYCLES = {
  lust: {
    duration: 'Weeks to months',
    hormones: 'Testosterone, estrogen',
    function: 'Sexual motivation',
    characteristics: 'Physical attraction, fantasy'
  },
  
  attraction: {
    duration: 'Months to 2 years',
    hormones: 'Dopamine, norepinephrine, serotonin',
    function: 'Mate selection, focus',
    characteristics: 'Euphoria, obsession, decreased appetite/sleep'
  },
  
  attachment: {
    duration: 'Years to decades',
    hormones: 'Oxytocin, vasopressin',
    function: 'Pair bonding, parenting',
    characteristics: 'Calm, security, deep friendship'
  }
};

// COURTSHIP RITUALS
const COURTSHIP_PATTERNS = {
  signaling: {
    displays: ['Physical appearance', 'Resources', 'Intelligence', 'Humor'],
    honesty: 'Costly signals (hard to fake)',
    examples: ['Peacock tail', 'Human altruism', 'Creative achievement']
  },
  
  dating: {
    phases: ['Initial contact', 'Getting acquainted', 'Exclusivity', 'Commitment'],
    filters: ['Dealbreakers', 'Value alignment', 'Chemistry'],
    technology: 'Apps accelerating search, reducing friction'
  },
  
  commitment: {
    markers: ['DTR (Define The Relationship)', 'Moving in', 'Engagement', 'Marriage'],
    timing: 'Variable by culture, age, individual',
    factors: ['Sunk cost', 'Alternatives', 'Social pressure', 'Love intensity']
  }
};

// RELATIONSHIP LIFECYCLE
const RELATIONSHIP_STAGES = {
  honeymoon: {
    duration: '6 months - 2 years',
    characteristics: 'Idealization, passion high, conflict low',
    challenge: 'Transition to stability'
  },
  
  powerStruggle: {
    duration: 'Years 2-5',
    characteristics: 'Reality sets in, negotiate differences',
    outcome: ['Breakup', 'Stagnation', 'Mature love']
  },
  
  stability: {
    duration: 'Years 5-15',
    characteristics: 'Partnership, routine, cooperation',
    risk: 'Boredom, taking for granted'
  },
  
  commitment: {
    duration: 'Years 15+',
    characteristics: 'Deep bond, shared history, acceptance',
    challenge: 'Keeping connection alive'
  }
};

// BREAKUP PATTERNS
const BREAKUP_DYNAMICS = {
  predictors: {
    fourHorsemen: ['Criticism', 'Contempt', 'Defensiveness', 'Stonewalling'],
    withdrawal: 'Emotional disengagement',
    negativeSentiment: 'Seeing partner negatively'
  },
  
  process: {
    precontemplation: 'Unhappy but not considering',
    contemplation: 'Considering ending',
    preparation: 'Planning exit',
    action: 'Initiating breakup',
    maintenance: 'Moving on'
  },
  
  recovery: {
    grief: 'Similar to death - denial, anger, bargaining, depression, acceptance',
    duration: 'Months to years',
    growth: 'Post-traumatic growth possible'
  }
};

interface RomanticEvent {
  timestamp: number;
  relationshipSatisfaction: number; // 0-10
  passionLevel: number; // 0-10
  commitmentLevel: number; // 0-10
  intimacyLevel: number; // 0-10
  conflictFrequency: number; // 0-10
  attachmentSecurity: number; // 0-1
  breakupRisk: number; // 0-1
  relationshipDuration: number; // Days
  courtshipInvestment: number; // Time/resources invested
}

class RomanticAdapter implements DomainAdapter<RomanticEvent> {
  domain = 'soul' as const;
  name = 'Romantic Dynamics & Mating Patterns';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[RomanticAdapter] Initialized - Love patterns flowing');
  }
  
  processRawData(event: RomanticEvent): UniversalSignal {
    const { timestamp, relationshipSatisfaction, passionLevel, commitmentLevel, intimacyLevel, breakupRisk } = event;
    
    // Frequency encodes relationship stability
    const frequency = 1 - breakupRisk;
    
    // Intensity = love strength
    const intensity = (passionLevel + commitmentLevel + intimacyLevel) / 30;
    
    // Phase encodes satisfaction-security balance
    const phase = (relationshipSatisfaction / 10 + event.attachmentSecurity) / 2 * Math.PI;
    
    const harmonics = [
      relationshipSatisfaction / 10,
      passionLevel / 10,
      commitmentLevel / 10,
      intimacyLevel / 10,
      1 - event.conflictFrequency / 10,
      event.attachmentSecurity
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [relationshipSatisfaction, passionLevel, commitmentLevel, intimacyLevel, breakupRisk]
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
    
    const avgSatisfaction = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgPassion = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgCommitment = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgIntimacy = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgBreakupRisk = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgPassion > 8 ? 0.8 : 0.2,
      defensive: avgBreakupRisk > 0.5 ? 0.7 : 0.2,
      tactical: avgSatisfaction < 5 ? 0.6 : 0.3,
      strategic: avgCommitment > 8 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgPassion > avgCommitment ? 0.8 : 0.2,
      mid: avgSatisfaction > 6 && avgPassion < 8 ? 0.7 : 0.2,
      late: avgCommitment > avgPassion ? 0.8 : 0.2
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: (avgPassion + avgIntimacy) / 20,
      momentum: avgSatisfaction > 7 ? 1 : -1,
      volatility: avgBreakupRisk,
      dominantFrequency: 1 - avgBreakupRisk,
      harmonicResonance: avgCommitment / 10,
      phaseAlignment: avgSatisfaction / 10,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.5, defensive: 0.2, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.7,
      momentum: 1,
      volatility: 0.4,
      dominantFrequency: 0.8,
      harmonicResonance: 0.6,
      phaseAlignment: 0.7,
      extractedAt: Date.now()
    };
  }
  
  // Predict relationship survival
  predictSurvival(satisfaction: number, commitment: number, conflict: number, investment: number): number {
    // Investment model of commitment
    const satisfactionWeight = 0.3;
    const investmentWeight = 0.3;
    const alternativesWeight = 0.2;
    const barriersWeight = 0.2;
    
    const alternatives = 5 - satisfaction; // Infer alternatives from dissatisfaction
    const barriers = commitment * 10;
    
    const commitmentScore = satisfaction * satisfactionWeight + 
                          investment * investmentWeight -
                          alternatives * alternativesWeight +
                          barriers * barriersWeight;
    
    // Survival probability
    return 1 / (1 + Math.exp(-(commitmentScore - 5)));
  }
  
  // Calculate love triangle
  calculatePassionIntimacyCommitment(passion: number, intimacy: number, commitment: number): string {
    const total = passion + intimacy + commitment;
    const pRatio = passion / total;
    const iRatio = intimacy / total;
    const cRatio = commitment / total;
    
    if (pRatio > 0.5) return 'Infatuation';
    if (iRatio > 0.5) return 'Friendship';
    if (cRatio > 0.5) return 'Empty love';
    if (pRatio > 0.3 && iRatio > 0.3 && cRatio > 0.3) return 'Consummate love';
    return 'Romantic love';
  }
}

export const romanticAdapter = new RomanticAdapter();
export { MATING_STRATEGIES, ATTACHMENT_PATTERNS, LOVE_CYCLES, COURTSHIP_PATTERNS, RELATIONSHIP_STAGES, BREAKUP_DYNAMICS };
export type { RomanticEvent };
