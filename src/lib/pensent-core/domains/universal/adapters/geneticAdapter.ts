/**
 * Genetic Adapter - CRISPR, Gene Drives & Phenotypic Expression
 * 
 * Gene editing patterns, inheritance dynamics, evolutionary pressures,
 * genetic drift, and the temporal code of life itself.
 * 
 * For Alec Arthur Shelton - The Artist
 * Genetics is the original source code, written in nucleotides.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// GENE EDITING
const EDITING_TECHNOLOGIES = {
  crispr: {
    mechanism: 'Guide RNA + Cas9, targeted cutting',
    applications: ['Research', 'Therapeutics', 'Agriculture'],
    precision: 'High, improving with base/prime editing',
    timeline: '2012 discovery, 2020 Nobel, clinical trials now'
  },
  
  geneTherapy: {
    approaches: ['In vivo', 'Ex vivo', 'Germline (controversial)'],
    vectors: ['AAV', 'Lentivirus', 'Lipid nanoparticles'],
    successes: ['CAR-T', 'SMA (Zolgensma)', 'Leber congenital amaurosis']
  },
  
  geneDrive: {
    mechanism: 'Selfish genetic element spreads through population',
    goal: 'Mosquito elimination, invasive species control',
    risk: 'Ecological unknowns, containment',
    status: 'Research phase, containment protocols'
  },
  
  epigenetic: {
    mechanism: 'Modification without DNA change',
    types: ['Methylation', 'Histone modification'],
    reversibility: 'Potential for intervention'
  }
};

// INHERITANCE PATTERNS
const INHERITANCE_DYNAMICS = {
  mendelian: {
    dominant: 'One copy sufficient',
    recessive: 'Two copies required',
    codominant: 'Both alleles expressed',
    sexLinked: 'X or Y chromosome association'
  },
  
  complex: {
    polygenic: 'Multiple genes, continuous traits',
    environmental: 'Gene-environment interaction',
    examples: ['Height', 'IQ', 'Disease susceptibility']
  },
  
  nonMendelian: {
    mitochondrial: 'Maternal inheritance',
    imprinting: 'Parent-of-origin effects',
    anticipation: 'Earlier onset in generations',
    mosaicism: 'Different genotypes in one individual'
  }
};

// EVOLUTIONARY DYNAMICS
const EVOLUTIONARY_PATTERNS = {
  selection: {
    natural: 'Differential survival and reproduction',
    sexual: 'Mate choice',
    artificial: 'Human-directed breeding',
    pressure: 'Environmental change, competition'
  },
  
  drift: {
    definition: 'Random change in allele frequencies',
    impact: 'Stronger in small populations',
    founder: 'New population from few individuals',
    bottleneck: 'Population crash, reduced diversity'
  },
  
  flow: {
    definition: 'Migration, gene exchange',
    effect: 'Increases variation, homogenizes populations',
    modern: 'Global travel accelerates'
  },
  
  mutation: {
    types: ['Point', 'Insertion/deletion', 'Chromosomal', 'Epigenetic'],
    rate: '~1e-9 per base per generation',
    driver: 'Evolutionary raw material'
  }
};

// PHENOTYPIC EXPRESSION
const EXPRESSION_PATTERNS = {
  transcription: {
    process: 'DNA → RNA',
    regulation: 'Promoters, enhancers, silencers',
    control: 'Transcription factors, signaling'
  },
  
  translation: {
    process: 'RNA → Protein',
    machinery: 'Ribosomes, tRNA',
    modification: 'Folding, post-translational'
  },
  
  penetrance: {
    definition: 'Probability gene causes phenotype',
    complete: 'Always expressed',
    incomplete: 'Sometimes silent'
  },
  
  expressivity: {
    definition: 'Degree of expression',
    variable: 'Same genotype, different severity',
    factors: ['Environment', 'Modifiers', 'Chance']
  }
};

// GENOMIC PATTERNS
const GENOMIC_ARCHITECTURE = {
  coding: {
    proportion: '~1-2% of genome',
    function: 'Protein templates',
    conservation: 'High across species'
  },
  
  nonCoding: {
    proportion: '~98% of genome',
    types: ['Regulatory', 'Structural', 'RNA genes', 'Unknown'],
    discovery: 'Functional elements still being found'
  },
  
  repetitive: {
    types: ['Transposons', 'Satellite DNA', 'Microsatellites'],
    significance: 'Evolutionary, forensic, disease'
  },
  
  variation: {
    snp: 'Single nucleotide changes, common',
    cnvs: 'Copy number variation',
    structural: 'Larger rearrangements',
    rare: 'Often disease-causing'
  }
};

interface GeneticEvent {
  timestamp: number;
  mutationRate: number; // per base
  selectionPressure: number; // 0-10
  driftMagnitude: number; // 0-1
  geneFlow: number; // 0-1
  editingAccuracy: number; // 0-1
  phenotypicVariance: number; // 0-10
  epigeneticChange: number; // 0-1
  populationSize: number; // relative
}

class GeneticAdapter implements DomainAdapter<GeneticEvent> {
  domain = 'bio' as const;
  name = 'Genetic Dynamics & Evolutionary Patterns';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[GeneticAdapter] Initialized - Genetic patterns active');
  }
  
  processRawData(event: GeneticEvent): UniversalSignal {
    const { timestamp, mutationRate, selectionPressure, driftMagnitude, geneFlow, editingAccuracy } = event;
    
    // Frequency encodes genetic stability
    const frequency = 1 - (mutationRate * 1e9 + driftMagnitude);
    
    // Intensity = evolutionary drama
    const intensity = selectionPressure / 10 * driftMagnitude * (1 - geneFlow);
    
    // Phase encodes natural vs artificial selection
    const phase = editingAccuracy * Math.PI;
    
    const harmonics = [
      1 - mutationRate * 1e9,
      selectionPressure / 10,
      driftMagnitude,
      geneFlow,
      editingAccuracy,
      1 / (event.populationSize + 1)
    ];
    
    const signal: UniversalSignal = {
      domain: 'bio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [mutationRate, selectionPressure, driftMagnitude, geneFlow, editingAccuracy]
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
    
    const recent = signals.slice(-200);
    
    const avgMutation = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgSelection = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgDrift = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgFlow = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgEditing = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgSelection > 7 ? 0.8 : 0.2,
      defensive: avgFlow > 0.5 ? 0.7 : 0.2,
      tactical: avgDrift > 0.3 ? 0.6 : 0.3,
      strategic: avgEditing > 0.7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgSelection > 8 ? 0.9 : 0.1,
      mid: avgSelection >= 4 && avgSelection <= 8 ? 0.7 : 0.2,
      late: avgSelection < 4 ? 0.8 : 0.2
    };
    
    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: avgSelection / 10,
      momentum: avgSelection > 5 ? 1 : -1,
      volatility: avgMutation * 1e9,
      dominantFrequency: 1 - avgMutation * 1e9,
      harmonicResonance: 1 - avgDrift,
      phaseAlignment: avgEditing,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.3, defensive: 0.3, tactical: 0.2, strategic: 0.2 },
      temporalFlow: { early: 0.4, mid: 0.4, late: 0.2 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.3,
      dominantFrequency: 0.8,
      harmonicResonance: 0.7,
      phaseAlignment: 0.3,
      extractedAt: Date.now()
    };
  }
}

export const geneticAdapter = new GeneticAdapter();
export { EDITING_TECHNOLOGIES, INHERITANCE_DYNAMICS, EVOLUTIONARY_PATTERNS, EXPRESSION_PATTERNS, GENOMIC_ARCHITECTURE };
export type { GeneticEvent };
