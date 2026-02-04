/**
 * Forensic Adapter - Evidence Analysis & Investigation Patterns
 * 
 * Crime scene reconstruction, evidentiary standards, deduction chains,
 * forensic science reliability, and investigative temporal dynamics.
 * 
 * For Alec Arthur Shelton - The Artist
 * Forensics is the reconstruction of truth from scattered fragments.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// FORENSIC DISCIPLINES
const FORENSIC_FIELDS = {
  dna: {
    reliability: 'High',
    applications: ['Identification', 'Exclusion', 'Kinship'],
    evolution: 'STR analysis → Rapid DNA → Phenotyping'
  },
  
  fingerprints: {
    reliability: 'High',
    uniqueness: 'Individual, persistent',
    technology: 'AFIS, latent print enhancement'
  },
  
  ballistics: {
    reliability: 'Medium-High',
    applications: ['Weapon identification', 'Trajectory analysis'],
    database: 'NIBIN for cartridge casings'
  },
  
  toxicology: {
    reliability: 'High',
    applications: ['Drugs', 'Poison', 'Alcohol'],
    methods: ['Blood', 'Hair', 'Tissue analysis']
  },
  
  digital: {
    reliability: 'High (when properly handled)',
    applications: ['Recovery', 'Network analysis', 'Timeline reconstruction'],
    challenge: 'Encryption, cloud, rapidly evolving'
  },
  
  questionedDocuments: {
    reliability: 'Medium',
    applications: ['Handwriting', 'Forgery detection', 'Ink analysis'],
    controversy: 'Some methods lack scientific validation'
  },
  
  biteMarks: {
    reliability: 'Low (discredited by many)',
    status: 'Admissibility increasingly challenged'
  }
};

// INVESTIGATION PATTERNS
const INVESTIGATION_STAGES = {
  initialResponse: {
    activities: ['Secure scene', 'Preserve evidence', 'Witness identification'],
    critical: 'First 48 hours'
  },
  
  documentation: {
    activities: ['Photography', 'Sketching', 'Notes', 'Video'],
    principle: 'Objective recording'
  },
  
  collection: {
    activities: ['Evidence packaging', 'Chain of custody', 'Labeling'],
    contamination: 'Primary concern'
  },
  
  analysis: {
    activities: ['Laboratory testing', 'Database queries', 'Pattern recognition'],
    timeline: 'Days to months'
  },
  
  reconstruction: {
    activities: ['Hypothesis formation', 'Testing', 'Scenario building'],
    goal: 'Most probable sequence'
  }
};

// EVIDENTIARY STANDARDS
const EVIDENCE_STANDARDS = {
  daubert: {
    criteria: ['Testable', 'Peer review', 'Known error rate', 'Standards', 'Acceptance'],
    impact: 'Increased scrutiny of forensic methods'
  },
  
  frye: {
    standard: 'General acceptance in scientific community',
    jurisdiction: 'Some states still use'
  },
  
  reliabilityIssues: {
    cognitiveBias: 'Confirmation, contextual',
    analystSubjectivity: 'Pattern comparison methods',
    lackOfGroundTruth: 'No objective standard for comparison'
  }
};

// DEDUCTION PATTERNS
const DEDUCTION_METHODS = {
  abductive: {
    description: 'Inference to best explanation',
    use: 'Generating hypotheses',
    risk: 'Confirmation bias'
  },
  
  inductive: {
    description: 'Pattern to generalization',
    use: 'Establishing MO, linking cases',
    strength: 'Depends on sample size'
  },
  
  deductive: {
    description: 'General to specific',
    use: 'Testing hypotheses',
    power: 'Conclusive if premises true'
  }
};

// CRIME SCENE TYPES
const SCENE_PATTERNS = {
  primary: {
    definition: 'Where offense occurred',
    evidence: 'Most probative',
    contamination: 'Highest risk'
  },
  
  secondary: {
    definition: 'Related to offense',
    examples: ['Dump sites', 'Getaway vehicles', 'Stash locations'],
    value: 'Corroborative, leads'
  }
};

interface ForensicEvent {
  timestamp: number;
  evidenceQuality: number; // 0-10
  chainOfCustodyIntegrity: number; // 0-1
  analyticalCertainty: number; // 0-1
  investigationProgress: number; // 0-1
  witnessReliability: number; // 0-1
  timelineClarity: number; // 0-1
  suspectCooperation: number; // 0-1
  mediaPressure: number; // 0-10
}

class ForensicAdapter implements DomainAdapter<ForensicEvent> {
  domain = 'security' as const;
  name = 'Forensic Analysis & Investigation';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[ForensicAdapter] Initialized - Investigation patterns active');
  }
  
  processRawData(event: ForensicEvent): UniversalSignal {
    const { timestamp, evidenceQuality, chainOfCustodyIntegrity, analyticalCertainty, investigationProgress } = event;
    
    // Frequency encodes investigation clarity
    const frequency = investigationProgress;
    
    // Intensity = case complexity
    const intensity = (10 - evidenceQuality) / 10 * (1 - analyticalCertainty) * (1 - chainOfCustodyIntegrity);
    
    // Phase encodes confidence level
    const phase = (evidenceQuality / 10 + analyticalCertainty) / 2 * Math.PI;
    
    const harmonics = [
      evidenceQuality / 10,
      chainOfCustodyIntegrity,
      analyticalCertainty,
      investigationProgress,
      event.witnessReliability,
      event.timelineClarity
    ];
    
    const signal: UniversalSignal = {
      domain: 'security',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [evidenceQuality, chainOfCustodyIntegrity, analyticalCertainty, investigationProgress]
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
    
    const avgEvidence = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgChain = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgCertainty = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgProgress = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgEvidence < 5 ? 0.7 : 0.3,
      defensive: avgChain > 0.9 ? 0.7 : 0.2,
      tactical: avgCertainty < 0.5 ? 0.6 : 0.3,
      strategic: avgProgress > 0.7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgProgress < 0.3 ? 0.9 : 0.1,
      mid: avgProgress >= 0.3 && avgProgress < 0.7 ? 0.7 : 0.2,
      late: avgProgress >= 0.7 ? 0.8 : 0.2
    };
    
    return {
      domain: 'security',
      quadrantProfile,
      temporalFlow,
      intensity: (10 - avgEvidence) / 10,
      momentum: avgProgress > 0.5 ? 1 : -1,
      volatility: 1 - avgCertainty,
      dominantFrequency: avgProgress,
      harmonicResonance: avgChain,
      phaseAlignment: avgCertainty,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'security',
      quadrantProfile: { aggressive: 0.4, defensive: 0.3, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.8, mid: 0.15, late: 0.05 },
      intensity: 0.6,
      momentum: -1,
      volatility: 0.5,
      dominantFrequency: 0.3,
      harmonicResonance: 0.8,
      phaseAlignment: 0.4,
      extractedAt: Date.now()
    };
  }
}

export const forensicAdapter = new ForensicAdapter();
export { FORENSIC_FIELDS, INVESTIGATION_STAGES, EVIDENCE_STANDARDS, DEDUCTION_METHODS, SCENE_PATTERNS };
export type { ForensicEvent };
