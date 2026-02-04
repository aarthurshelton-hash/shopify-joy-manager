/**
 * Judicial Adapter - Legal Precedent & Case Law Evolution
 * 
 * Court decisions, precedent drift, statutory interpretation,
 * judicial philosophy patterns, and legal system dynamics.
 * 
 * For Alec Arthur Shelton - The Artist
 * Law is the codified memory of civilization.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// JUDICIAL PHILOSOPHIES
const JUDICIAL_PHILOSOPHIES = {
  originalism: {
    description: 'Interpret constitution by original public meaning',
    variants: ['Original intent (framers)', 'Original meaning (ratifiers)', 'Original methods'],
    advocates: ['Scalia', 'Thomas', 'Gorsuch'],
    marketAnalogy: 'Value investing - original meaning as intrinsic value'
  },
  
  livingConstitution: {
    description: 'Law evolves with society',
    mechanisms: ['Precedent', 'Social norms', 'Changed circumstances'],
    advocates: ['Breyer', 'Kagan', 'Sotomayor'],
    marketAnalogy: 'Growth investing - adapting to changing environment'
  },
  
  textualism: {
    description: 'Plain meaning of statutory text',
    limits: 'Avoid legislative history, purpose',
    relation: 'Often overlaps with originalism'
  },
  
  pragmatism: {
    description: 'Focus on consequences and practical outcomes',
    approach: 'Balancing tests, cost-benefit analysis',
    example: 'Posner economic analysis of law'
  },
  
  naturalLaw: {
    description: 'Higher law principles',
    tension: 'With positive law and democracy',
    historical: 'Aquinas, Blackstone, Declaration'
  }
};

// PRECEDENT DYNAMICS
const PRECEDENT_PATTERNS = {
  stareDecisis: {
    doctrine: 'Let the decision stand',
    weight: ['Mandatory (same court)', 'Persuasive (other courts)', 'Distinguishable (different facts)'],
    factors: ['Age', 'Reliance', 'Workability', 'Changed facts']
  },
  
  overruling: {
    triggers: ['Unworkable', 'Egregiously wrong', 'Facts changed', 'Deep inconsistency'],
    examples: ['Brown overruling Plessy', 'Lawrence overruling Bowers'],
    frequency: 'Rare, but accelerating'
  },
  
  distinguishing: {
    technique: 'Find factual differences to avoid following',
    use: 'Lower courts avoiding higher court precedent',
    signaling: 'May indicate future overruling'
  },
  
  precedentDrift: {
    description: 'Gradual shift in application over time',
    mechanism: 'Distinguishing, narrowing, expanding',
    detection: 'Compare early vs late applications'
  }
};

// COURT DYNAMICS
const COURT_DYNAMICS = {
  // Decision-making patterns
  consensusBuilding: {
    description: 'Chief Justice seeks majority',
    strategy: 'Narrow opinions, compromise language',
    failure: 'Concurring opinions, fractured decisions'
  },
  
  opinionAssignment: {
    rule: 'Most senior justice in majority assigns',
    strategy: 'Assign to justice near margin',
    power: 'Controls opinion content'
  },
  
  swingJustice: {
    current: 'Often decisive in 5-4 cases',
    effect: 'Controls direction of court',
    examples: ['Kennedy (retired)', 'Roberts', 'Barrett?']
  },
  
  // Case selection
  certiorari: {
    threshold: '4 votes to hear',
    criteria: ['Circuit split', 'Important question', 'Lower court error'],
    denial: 'Not endorsement of lower court (sometimes)'
  }
};

// LEGAL DOCTRINE CYCLES
const DOCTRINE_CYCLES = {
  expansion: {
    phase: 'Rights broadening',
    examples: ['Warren Court civil liberties', 'Lochner era economic rights'],
    driver: 'Social movements, crisis response'
  },
  
  contraction: {
    phase: 'Rights narrowing',
    examples: ['Post-Lochner retrenchment', 'Criminal procedure rollback'],
    driver: 'Backlash, changed composition'
  },
  
  formalism: {
    phase: 'Rigid categories',
    features: ['Bright line rules', 'Originalism', 'Textualism'],
    cycle: 'Reaction to perceived judicial activism'
  },
  
  realism: {
    phase: 'Context-sensitive',
    features: ['Balancing tests', 'Pragmatism', 'Policy analysis'],
    cycle: 'Reaction to perceived formalism'
  }
};

// CIRCUIT COURTS
const CIRCUIT_PATTERNS = {
  circuitSplits: {
    description: 'Different circuits rule differently',
    consequence: 'Supreme Court often grants cert',
    areas: ['Religious liberty', 'Second Amendment', 'Immigration']
  },
  
  ideological: {
    pattern: 'Some circuits trend liberal/conservative',
    causes: ['En banc procedures', 'New appointments'],
    effect: 'Forum shopping for favorable circuits'
  }
};

interface JudicialEvent {
  timestamp: number;
  caseId: string;
  ideologicalDirection: number; // -1 (liberal) to 1 (conservative)
  precedentStrength: number; // 0-1
  unanimity: number; // 0 (9 opinions) to 1 (unanimous)
  citationCount: number; // Subsequent citations
  overturnRisk: number; // 0-1
  publicAttention: number; // Media coverage
  enforcementEase: number; // 0-1
  lowerCourtCompliance: number; // 0-1
}

class JudicialAdapter implements DomainAdapter<JudicialEvent> {
  domain = 'soul' as const;
  name = 'Judicial Precedent & Legal Evolution';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[JudicialAdapter] Initialized - Legal precedent tracking');
  }
  
  processRawData(event: JudicialEvent): UniversalSignal {
    const { timestamp, ideologicalDirection, precedentStrength, unanimity, overturnRisk } = event;
    
    // Frequency encodes stability (low frequency = stable precedent)
    const frequency = 1 - overturnRisk;
    
    // Intensity = judicial activism
    const intensity = Math.abs(ideologicalDirection) * (1 - unanimity);
    
    // Phase encodes ideological position
    const phase = (ideologicalDirection + 1) / 2 * Math.PI;
    
    const harmonics = [
      Math.abs(ideologicalDirection),
      precedentStrength,
      unanimity,
      1 - overturnRisk,
      event.publicAttention / 10,
      event.lowerCourtCompliance
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [ideologicalDirection, precedentStrength, unanimity, overturnRisk, event.citationCount]
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
    
    const avgIdeology = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgPrecedent = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgUnanimity = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgOverturn = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgCitations = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: Math.abs(avgIdeology) > 0.5 ? 0.7 : 0.3,
      defensive: avgPrecedent > 0.7 ? 0.7 : 0.2,
      tactical: avgUnanimity < 0.5 ? 0.6 : 0.3,
      strategic: avgCitations > 50 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgPrecedent < 0.3 ? 0.8 : 0.2,
      mid: avgPrecedent >= 0.3 && avgPrecedent < 0.7 ? 0.7 : 0.2,
      late: avgPrecedent >= 0.7 ? 0.8 : 0.2
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: Math.abs(avgIdeology),
      momentum: avgIdeology > 0 ? 1 : -1,
      volatility: 1 - avgUnanimity,
      dominantFrequency: 1 - avgOverturn,
      harmonicResonance: avgPrecedent,
      phaseAlignment: (avgIdeology + 1) / 2,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 0.5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Predict overturn probability
  predictOverturn(precedentAge: number, citationTrend: number, courtComposition: number): number {
    // Age increases risk, citations decrease risk, composition shift increases risk
    const ageRisk = Math.min(precedentAge / 50, 0.5);
    const citationProtection = Math.min(citationTrend / 100, 0.3);
    const compositionRisk = Math.abs(courtComposition) * 0.3;
    
    return Math.min(ageRisk - citationProtection + compositionRisk, 1);
  }
}

export const judicialAdapter = new JudicialAdapter();
export { JUDICIAL_PHILOSOPHIES, PRECEDENT_PATTERNS, COURT_DYNAMICS, DOCTRINE_CYCLES, CIRCUIT_PATTERNS };
export type { JudicialEvent };
