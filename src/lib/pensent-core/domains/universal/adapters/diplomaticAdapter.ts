/**
 * Diplomatic Adapter - International Relations & Treaty Dynamics
 * 
 * Alliance formations, conflict resolution, negotiation patterns,
 * soft power, and geopolitical temporal cycles.
 * 
 * For Alec Arthur Shelton - The Artist
 * Diplomacy is war continued by other means, war is diplomacy failed.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// DIPLOMATIC RELATIONSHIP TYPES
const RELATIONSHIP_TYPES = {
  alliance: {
    characteristics: ['Mutual defense', 'Shared values', 'Institutional ties'],
    examples: ['NATO', 'Five Eyes', 'EU'],
    lifecycle: 'Formation → Integration → Stress → Renewal/Dissolution'
  },
  
  rivalry: {
    characteristics: ['Competition', 'Mistrust', 'Zero-sum perception'],
    examples: ['US-China', 'India-Pakistan', 'Iran-Saudi'],
    management: 'Competition without catastrophe'
  },
  
  clientState: {
    characteristics: ['Dependency', 'Patron protection', 'Limited autonomy'],
    examples: ['Cold War proxies', 'Modern authoritarian alignments'],
    fragility: 'Patron weakness → client crisis'
  },
  
  neutral: {
    characteristics: ['Non-alignment', 'Sovereignty emphasis', 'Opportunity seeking'],
    examples: ['Switzerland', 'Singapore', 'Vietnam'],
    strategy: 'Benefit from all sides'
  }
};

// NEGOTIATION DYNAMICS
const NEGOTIATION_PATTERNS = {
  positional: {
    approach: 'Fixed positions, concession trading',
    weakness: 'Rigid, suboptimal outcomes',
    use: 'Simple distributive issues'
  },
  
  principled: {
    approach: 'Interests, options, criteria',
    strength: 'Creative solutions, relationships',
    use: 'Complex, integrative issues'
  },
  
  powerAsymmetry: {
    dynamic: 'Stronger party dictates',
    risks: ['Resentment', 'Non-compliance', 'Sabotage'],
    management: 'Face-saving, incremental'
  },
  
  deadlines: {
    effect: 'Force concessions',
    risk: 'Bad deals under pressure',
    examples: ['Treaty expirations', 'Elections', 'Military action']
  }
};

// CONFLICT RESOLUTION
const CONFLICT_PATTERNS = {
  escalation: {
    stages: ['Dispute', 'Conflict', 'Crisis', 'War'],
    drivers: ['Security dilemma', 'Misperception', 'Commitment traps'],
    prevention: 'Early intervention'
  },
  
  deescalation: {
    mechanisms: ['Confidence building', 'Graduated reciprocation', 'Face-saving exits'],
    role: 'Third parties, back channels'
  },
  
  peaceAgreements: {
    types: ['Ceasefire', 'Settlement', 'Transformation'],
    durability: 'Implementation, reconciliation, guarantees',
    failure: 'Spoilers, broken promises, power shifts'
  }
};

// SOFT POWER
const SOFT_POWER_DYNAMICS = {
  sources: {
    culture: 'Arts, media, values',
    values: 'Political ideals, human rights',
    policies: 'Domestic and foreign legitimacy'
  },
  
  projection: {
    education: 'International students',
    media: 'Global content',
    aid: 'Development assistance',
    diplomacy: 'Public diplomacy, exchanges'
  },
  
  conversion: {
    challenge: 'Soft power → hard outcomes',
    examples: ['Sanctions compliance', 'Alliance formation', 'Norm adoption']
  }
};

// TREATY ARCHITECTURE
const TREATY_PATTERNS = {
  bilateral: {
    advantages: 'Specific, manageable, reciprocal',
    examples: ['US-Canada', 'Trade deals', 'Security pacts'],
    depth: 'Can be deep but narrow'
  },
  
  multilateral: {
    advantages: 'Broad legitimacy, economies of scale',
    challenges: 'Lowest common denominator, free riders',
    examples: ['UN', 'WTO', 'Paris Agreement']
  },
  
  minilateral: {
    advantages: 'Like-minded, efficient, substantive',
    examples: ['Quad', 'TTC', 'Climate clubs'],
    trend: 'Increasing preference'
  }
};

interface DiplomaticEvent {
  timestamp: number;
  tensionLevel: number; // 0-10
  negotiationProgress: number; // 0-1
  allianceStrength: number; // 0-1
  softPowerInfluence: number; // 0-10
  economicInterdependence: number; // 0-1
  militaryPosturing: number; // 0-10
  culturalExchange: number; // 0-10
  thirdPartyMediation: number; // 0-1
  domesticPoliticalPressure: number; // 0-10
}

class DiplomaticAdapter implements DomainAdapter<DiplomaticEvent> {
  domain = 'security' as const;
  name = 'Diplomatic Relations & International Affairs';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 3000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[DiplomaticAdapter] Initialized - Diplomatic channels open');
  }
  
  processRawData(event: DiplomaticEvent): UniversalSignal {
    const { timestamp, tensionLevel, negotiationProgress, allianceStrength, softPowerInfluence, economicInterdependence } = event;
    
    // Frequency encodes diplomatic stability
    const frequency = 1 - tensionLevel / 10;
    
    // Intensity = geopolitical drama
    const intensity = tensionLevel / 10 * (1 - negotiationProgress) * (1 - allianceStrength);
    
    // Phase encodes hard vs soft power balance
    const phase = (softPowerInfluence / 10 + economicInterdependence) / 2 * Math.PI;
    
    const harmonics = [
      1 - tensionLevel / 10,
      negotiationProgress,
      allianceStrength,
      softPowerInfluence / 10,
      economicInterdependence,
      1 - event.militaryPosturing / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'security',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [tensionLevel, negotiationProgress, allianceStrength, softPowerInfluence, economicInterdependence]
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
    
    const recent = signals.slice(-150);
    
    const avgTension = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgNegotiation = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgAlliance = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgSoftPower = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgEconomic = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgTension > 7 ? 0.8 : 0.2,
      defensive: avgAlliance > 0.7 ? 0.7 : 0.2,
      tactical: avgNegotiation > 0.5 ? 0.6 : 0.3,
      strategic: avgSoftPower > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgTension > 7 ? 0.8 : 0.2,
      mid: avgNegotiation > 0.3 && avgNegotiation < 0.7 ? 0.7 : 0.2,
      late: avgTension < 3 ? 0.8 : 0.2
    };
    
    return {
      domain: 'security',
      quadrantProfile,
      temporalFlow,
      intensity: avgTension / 10,
      momentum: avgNegotiation > avgTension / 10 ? 1 : -1,
      volatility: avgTension / 10,
      dominantFrequency: 1 - avgTension / 10,
      harmonicResonance: avgAlliance,
      phaseAlignment: avgSoftPower / 10,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'security',
      quadrantProfile: { aggressive: 0.3, defensive: 0.3, tactical: 0.2, strategic: 0.2 },
      temporalFlow: { early: 0.4, mid: 0.3, late: 0.3 },
      intensity: 0.4,
      momentum: 0,
      volatility: 0.4,
      dominantFrequency: 0.6,
      harmonicResonance: 0.6,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const diplomaticAdapter = new DiplomaticAdapter();
export { RELATIONSHIP_TYPES, NEGOTIATION_PATTERNS, CONFLICT_PATTERNS, SOFT_POWER_DYNAMICS, TREATY_PATTERNS };
export type { DiplomaticEvent };
