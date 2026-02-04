/**
 * Archaeological Adapter - Historical Reconstruction & Cultural Layers
 * 
 * Stratigraphy patterns, artifact dating, site formation processes,
 * cultural diffusion, and the temporal depth of human history.
 * 
 * For Alec Arthur Shelton - The Artist
 * Archaeology is the recovery of lost patterns from the earth's memory.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// EXCAVATION METHODS
const EXCAVATION_PATTERNS = {
  stratigraphy: {
    principle: 'Superposition - deeper = older',
    law: 'Harris matrix for sequence',
    challenge: 'Disturbance, reuse, bioturbation'
  },
  
  grid: {
    method: 'Systematic squares, precise recording',
    scale: 'Arbitrary or natural',
    documentation: 'Photos, plans, section drawings'
  },
  
  openArea: {
    method: 'Expose large horizontal surfaces',
    advantage: 'Context relationships',
    risk: 'Structural integrity'
  },
  
  rescue: {
    context: 'Development threat, limited time',
    priority: 'Data recovery over completeness',
    ethics: 'Preservation vs knowledge'
  }
};

// DATING METHODS
const DATING_TECHNIQUES = {
  relative: {
    stratigraphy: 'Layer sequence',
    typology: 'Artifact style evolution',
    seriation: 'Frequency change over time'
  },
  
  absolute: {
    radiocarbon: 'Organic material, 50k year limit',
    dendrochronology: 'Tree rings, precise',
    thermoluminescence: 'Fired ceramics, flint',
    archaeomagnetism: 'Magnetic field changes',
    potassiumArgon: 'Volcanic rock, millions of years'
  },
  
  calibration: {
    need: 'C14 vs calendar years differ',
    curves: 'IntCal, SHCal',
    precision: 'Ranges not single dates'
  }
};

// CULTURAL PROCESSES
const CULTURAL_PATTERNS = {
  innovation: {
    source: 'Invention, diffusion, migration',
    adoption: 'S-curve, early adopters',
    factors: ['Visibility', 'Advantage', 'Compatibility', 'Complexity']
  },
  
  diffusion: {
    models: ['Relocation', 'Expansion', 'Stimulus'],
    barriers: ['Distance', 'Mountains', 'Hostility'],
    evidence: 'Trade goods, styles, ideas'
  },
  
  collapse: {
    causes: ['Climate', 'Invasion', 'System failure', 'Resource depletion'],
    examples: ['Maya', 'Rome', 'Easter Island'],
    complexity: 'Multiple factors, not monocausal'
  },
  
  continuity: {
    evidence: 'Persistent practices, genetic continuity',
    change: 'Gradual transformation, not replacement'
  }
};

// SITE FORMATION
const FORMATION_PROCESSES = {
  cultural: {
    deposition: 'Discard, loss, burial, ritual',
    disturbance: 'Reuse, looting, rebuilding',
    cTransforms: 'Human behavior effects'
  },
  
  natural: {
    erosion: 'Wind, water, gravity',
    burial: 'Alluvium, volcanic ash, colluvium',
    preservation: ['Arid', 'Waterlogged', 'Frozen', 'Anaerobic']
  },
  
  taphonomy: {
    focus: 'From deposition to discovery',
    bias: 'What survives vs what existed',
    factors: ['Material', 'Environment', 'Time']
  }
};

// INTERPRETIVE PARADIGMS
const ARCHAEOLOGICAL_THEORY = {
  cultureHistory: {
    focus: 'Description, classification, chronology',
    era: 'Early 20th century',
    question: 'When, where, what'
  },
  
  processual: {
    focus: 'Cultural processes, systems',
    era: '1960s-80s',
    method: 'Scientific, hypothesis testing',
    question: 'How, why'
  },
  
  postProcessual: {
    focus: 'Meaning, symbolism, agency',
    era: '1980s-present',
    method: 'Hermeneutics, critical theory',
    question: 'What did it mean'
  },
  
  public: {
    focus: 'Community engagement, ethics',
    concerns: ['Descendant communities', 'Looting', 'Repatriation'],
    practice: 'Collaborative, transparent'
  }
};

interface ArchaeologicalEvent {
  timestamp: number;
  layerDepth: number; // meters
  artifactDensity: number; // per m²
  preservationQuality: number; // 0-1
  datingCertainty: number; // 0-1
  culturalComplexity: number; // 0-10
  evidenceOfTrade: number; // 0-1
  ritualSignificance: number; // 0-1
  environmentalContext: number; // 0-1
}

class ArchaeologicalAdapter implements DomainAdapter<ArchaeologicalEvent> {
  domain = 'soul' as const;
  name = 'Archaeological Reconstruction & Cultural Layers';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[ArchaeologicalAdapter] Initialized - History patterns active');
  }
  
  processRawData(event: ArchaeologicalEvent): UniversalSignal {
    const { timestamp, layerDepth, artifactDensity, preservationQuality, datingCertainty, culturalComplexity } = event;
    
    // Frequency encodes temporal depth
    const frequency = 1 / (layerDepth + 1);
    
    // Intensity = archaeological significance
    const intensity = artifactDensity * preservationQuality * datingCertainty * culturalComplexity / 10;
    
    // Phase encodes ritual-secular balance
    const phase = event.ritualSignificance * Math.PI;
    
    const harmonics = [
      1 / (layerDepth + 1),
      artifactDensity,
      preservationQuality,
      datingCertainty,
      culturalComplexity / 10,
      event.evidenceOfTrade
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [layerDepth, artifactDensity, preservationQuality, datingCertainty, culturalComplexity]
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
    
    const avgDepth = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgDensity = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgPreservation = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgDating = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgComplexity = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgDepth > 5 ? 0.8 : 0.2,
      defensive: avgPreservation > 0.7 ? 0.7 : 0.2,
      tactical: avgDating < 0.5 ? 0.6 : 0.3,
      strategic: avgComplexity > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgDepth > 8 ? 0.9 : 0.1,
      mid: avgDepth > 3 && avgDepth <= 8 ? 0.7 : 0.2,
      late: avgDepth <= 3 ? 0.8 : 0.2
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: avgDensity * avgPreservation,
      momentum: avgDensity > 0.5 ? 1 : -1,
      volatility: 1 - avgDating,
      dominantFrequency: 1 / (avgDepth + 1),
      harmonicResonance: avgPreservation,
      phaseAlignment: avgDating,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.4, defensive: 0.3, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.4,
      dominantFrequency: 0.3,
      harmonicResonance: 0.7,
      phaseAlignment: 0.6,
      extractedAt: Date.now()
    };
  }
}

export const archaeologicalAdapter = new ArchaeologicalAdapter();
export { EXCAVATION_PATTERNS, DATING_TECHNIQUES, CULTURAL_PATTERNS, FORMATION_PROCESSES, ARCHAEOLOGICAL_THEORY };
export type { ArchaeologicalEvent };
