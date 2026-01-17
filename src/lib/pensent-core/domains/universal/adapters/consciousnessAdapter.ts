/**
 * Consciousness & Animal Intelligence Adapter
 * Patterns of evolved intelligence across species
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

// Consciousness signature derived from DomainSignature
type ConsciousnessSignature = DomainSignature;

// Evolutionary intelligence classifications
export interface SpeciesIntelligence {
  species: string;
  kingdom: 'animalia' | 'plantae' | 'fungi' | 'protista' | 'bacteria';
  phylum: string;
  class?: string;
  
  // Intelligence metrics
  encephalizationQuotient: number; // Brain-to-body ratio
  neuronCount: number;
  synapticDensity: number;
  
  // Behavioral complexity
  toolUse: boolean;
  selfRecognition: boolean;
  socialComplexity: number; // 0-1 scale
  communicationComplexity: number;
  problemSolving: number;
  
  // Temporal patterns
  lifespan: number; // years
  generationTime: number;
  evolutionaryAge: number; // millions of years
  
  // Visual morphology patterns
  symmetry: 'radial' | 'bilateral' | 'asymmetric' | 'spherical';
  bodySegments: number;
  appendageCount: number;
  sensoryOrgans: string[];
  colorPatterns: string[];
  
  // Consciousness indicators
  sleepCycles: boolean;
  dreamStates: boolean;
  emotionalResponses: boolean;
  playBehavior: boolean;
  mourningBehavior: boolean;
}

// Known species intelligence data (real scientific data)
export const SPECIES_INTELLIGENCE_DATABASE: SpeciesIntelligence[] = [
  {
    species: 'Homo sapiens',
    kingdom: 'animalia',
    phylum: 'Chordata',
    class: 'Mammalia',
    encephalizationQuotient: 7.4,
    neuronCount: 86_000_000_000,
    synapticDensity: 0.95,
    toolUse: true,
    selfRecognition: true,
    socialComplexity: 1.0,
    communicationComplexity: 1.0,
    problemSolving: 1.0,
    lifespan: 79,
    generationTime: 29,
    evolutionaryAge: 0.3,
    symmetry: 'bilateral',
    bodySegments: 3,
    appendageCount: 4,
    sensoryOrgans: ['eyes', 'ears', 'nose', 'tongue', 'skin'],
    colorPatterns: ['melanin-gradient'],
    sleepCycles: true,
    dreamStates: true,
    emotionalResponses: true,
    playBehavior: true,
    mourningBehavior: true
  },
  {
    species: 'Tursiops truncatus', // Bottlenose dolphin
    kingdom: 'animalia',
    phylum: 'Chordata',
    class: 'Mammalia',
    encephalizationQuotient: 5.3,
    neuronCount: 37_000_000_000,
    synapticDensity: 0.88,
    toolUse: true,
    selfRecognition: true,
    socialComplexity: 0.92,
    communicationComplexity: 0.85,
    problemSolving: 0.88,
    lifespan: 45,
    generationTime: 12,
    evolutionaryAge: 35,
    symmetry: 'bilateral',
    bodySegments: 2,
    appendageCount: 4,
    sensoryOrgans: ['eyes', 'echolocation', 'skin'],
    colorPatterns: ['counter-shading'],
    sleepCycles: true,
    dreamStates: true,
    emotionalResponses: true,
    playBehavior: true,
    mourningBehavior: true
  },
  {
    species: 'Elephas maximus', // Asian elephant
    kingdom: 'animalia',
    phylum: 'Chordata',
    class: 'Mammalia',
    encephalizationQuotient: 2.3,
    neuronCount: 257_000_000_000,
    synapticDensity: 0.75,
    toolUse: true,
    selfRecognition: true,
    socialComplexity: 0.95,
    communicationComplexity: 0.78,
    problemSolving: 0.82,
    lifespan: 60,
    generationTime: 22,
    evolutionaryAge: 55,
    symmetry: 'bilateral',
    bodySegments: 3,
    appendageCount: 4,
    sensoryOrgans: ['eyes', 'ears', 'trunk-chemoreception', 'feet-seismic'],
    colorPatterns: ['uniform-gray'],
    sleepCycles: true,
    dreamStates: true,
    emotionalResponses: true,
    playBehavior: true,
    mourningBehavior: true
  },
  {
    species: 'Corvus corax', // Common raven
    kingdom: 'animalia',
    phylum: 'Chordata',
    class: 'Aves',
    encephalizationQuotient: 2.5,
    neuronCount: 2_170_000_000,
    synapticDensity: 0.92,
    toolUse: true,
    selfRecognition: true,
    socialComplexity: 0.85,
    communicationComplexity: 0.75,
    problemSolving: 0.90,
    lifespan: 21,
    generationTime: 4,
    evolutionaryAge: 17,
    symmetry: 'bilateral',
    bodySegments: 3,
    appendageCount: 4,
    sensoryOrgans: ['eyes', 'ears'],
    colorPatterns: ['iridescent-black'],
    sleepCycles: true,
    dreamStates: true,
    emotionalResponses: true,
    playBehavior: true,
    mourningBehavior: true
  },
  {
    species: 'Octopus vulgaris', // Common octopus
    kingdom: 'animalia',
    phylum: 'Mollusca',
    class: 'Cephalopoda',
    encephalizationQuotient: 0.9,
    neuronCount: 500_000_000,
    synapticDensity: 0.85,
    toolUse: true,
    selfRecognition: false, // Debated
    socialComplexity: 0.15,
    communicationComplexity: 0.65,
    problemSolving: 0.88,
    lifespan: 2,
    generationTime: 1,
    evolutionaryAge: 500,
    symmetry: 'bilateral',
    bodySegments: 2,
    appendageCount: 8,
    sensoryOrgans: ['eyes', 'chemoreceptors', 'suckers'],
    colorPatterns: ['chromatophore-dynamic'],
    sleepCycles: true,
    dreamStates: true,
    emotionalResponses: true,
    playBehavior: true,
    mourningBehavior: false
  },
  {
    species: 'Apis mellifera', // Honeybee
    kingdom: 'animalia',
    phylum: 'Arthropoda',
    class: 'Insecta',
    encephalizationQuotient: 0.04,
    neuronCount: 960_000,
    synapticDensity: 0.95,
    toolUse: true,
    selfRecognition: false,
    socialComplexity: 0.98,
    communicationComplexity: 0.72,
    problemSolving: 0.65,
    lifespan: 0.5,
    generationTime: 0.1,
    evolutionaryAge: 130,
    symmetry: 'bilateral',
    bodySegments: 3,
    appendageCount: 6,
    sensoryOrgans: ['compound-eyes', 'antennae', 'polarized-light'],
    colorPatterns: ['warning-stripes'],
    sleepCycles: true,
    dreamStates: false,
    emotionalResponses: true,
    playBehavior: false,
    mourningBehavior: false
  }
];

export class ConsciousnessAdapter {
  readonly domain: DomainType = 'bio'; // Maps to bio domain
  readonly name = 'Consciousness & Animal Intelligence';
  isActive = true;
  lastUpdate = Date.now();

  private speciesDatabase = SPECIES_INTELLIGENCE_DATABASE;

  async initialize(): Promise<void> {
    console.log('[ConsciousnessAdapter] Initializing with', this.speciesDatabase.length, 'species');
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  // Extract consciousness patterns from species data
  processSpeciesData(species: SpeciesIntelligence): UniversalSignal {
    // Normalize intelligence to temporal signal
    const intelligenceScore = (
      species.encephalizationQuotient / 7.4 * 0.25 +
      Math.log10(species.neuronCount) / 11 * 0.25 +
      species.problemSolving * 0.2 +
      species.socialComplexity * 0.15 +
      species.communicationComplexity * 0.15
    );

    // Extract morphological harmonics
    const harmonics = [
      species.bodySegments / 10,
      species.appendageCount / 8,
      species.sensoryOrgans.length / 5,
      species.symmetry === 'bilateral' ? 0.5 : 
        species.symmetry === 'radial' ? 0.25 : 0.1
    ];

    return {
      domain: 'bio',
      timestamp: Date.now(),
      intensity: intelligenceScore,
      frequency: 1 / species.generationTime, // Evolutionary frequency
      phase: species.evolutionaryAge / 500, // Normalized to oldest known
      harmonics,
      rawData: [
        species.encephalizationQuotient,
        Math.log10(species.neuronCount),
        species.synapticDensity,
        species.lifespan,
        species.socialComplexity
      ]
    };
  }

  // Extract cross-species consciousness signature
  extractSignature(signals: UniversalSignal[]): ConsciousnessSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const avgIntensity = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const avgFrequency = signals.reduce((sum, s) => sum + s.frequency, 0) / signals.length;
    const avgPhase = signals.reduce((sum, s) => sum + s.phase, 0) / signals.length;

    // Consciousness quadrant analysis
    // Aggressive = individual problem-solving, predatory intelligence
    // Defensive = social protection, herd consciousness
    // Tactical = tool use, immediate adaptation
    // Strategic = long-term planning, abstract thought
    
    const quadrantProfile = {
      aggressive: signals.filter(s => s.rawData[2] > 0.8).length / signals.length,
      defensive: signals.filter(s => s.rawData[4] > 0.7).length / signals.length,
      tactical: signals.filter(s => s.harmonics[1] > 0.5).length / signals.length,
      strategic: signals.filter(s => s.rawData[0] > 3).length / signals.length
    };

    // Temporal evolution flow
    const temporalFlow = {
      early: signals.filter(s => s.phase > 0.5).length / signals.length, // Ancient species
      mid: signals.filter(s => s.phase > 0.1 && s.phase <= 0.5).length / signals.length,
      late: signals.filter(s => s.phase <= 0.1).length / signals.length // Recent evolution
    };

    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateEvolutionaryMomentum(signals),
      volatility: this.calculateIntelligenceVariance(signals),
      dominantFrequency: avgFrequency,
      harmonicResonance: this.calculateCrossSpeciesResonance(signals),
      phaseAlignment: avgPhase,
      extractedAt: Date.now()
    };
  }

  private calculateEvolutionaryMomentum(signals: UniversalSignal[]): number {
    // Measure acceleration of intelligence over evolutionary time
    const sorted = [...signals].sort((a, b) => a.phase - b.phase);
    if (sorted.length < 2) return 0;
    
    const oldIntelligence = sorted.slice(0, Math.floor(sorted.length / 2))
      .reduce((sum, s) => sum + s.intensity, 0) / Math.floor(sorted.length / 2);
    const newIntelligence = sorted.slice(Math.floor(sorted.length / 2))
      .reduce((sum, s) => sum + s.intensity, 0) / Math.ceil(sorted.length / 2);
    
    return (newIntelligence - oldIntelligence) / oldIntelligence;
  }

  private calculateIntelligenceVariance(signals: UniversalSignal[]): number {
    const mean = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const variance = signals.reduce((sum, s) => sum + Math.pow(s.intensity - mean, 2), 0) / signals.length;
    return Math.sqrt(variance);
  }

  private calculateCrossSpeciesResonance(signals: UniversalSignal[]): number {
    // Find harmonic patterns that appear across multiple species
    if (signals.length < 2) return 0;
    
    let resonanceSum = 0;
    let comparisons = 0;
    
    for (let i = 0; i < signals.length; i++) {
      for (let j = i + 1; j < signals.length; j++) {
        const harmonicSimilarity = signals[i].harmonics.reduce((sum, h, idx) => {
          return sum + (1 - Math.abs(h - (signals[j].harmonics[idx] || 0)));
        }, 0) / signals[i].harmonics.length;
        resonanceSum += harmonicSimilarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? resonanceSum / comparisons : 0;
  }

  private getDefaultSignature(): ConsciousnessSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0,
      dominantFrequency: 1,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }

  // Get all species signals
  getAllSpeciesSignals(): UniversalSignal[] {
    return this.speciesDatabase.map(species => this.processSpeciesData(species));
  }

  // Find species with similar consciousness patterns
  findSimilarConsciousness(targetSpecies: string, threshold = 0.7): SpeciesIntelligence[] {
    const target = this.speciesDatabase.find(s => s.species === targetSpecies);
    if (!target) return [];

    const targetSignal = this.processSpeciesData(target);
    
    return this.speciesDatabase
      .filter(s => s.species !== targetSpecies)
      .filter(s => {
        const signal = this.processSpeciesData(s);
        return this.calculateSignalSimilarity(targetSignal, signal) >= threshold;
      });
  }

  private calculateSignalSimilarity(a: UniversalSignal, b: UniversalSignal): number {
    const intensityDiff = 1 - Math.abs(a.intensity - b.intensity);
    const frequencyDiff = 1 - Math.abs(a.frequency - b.frequency) / Math.max(a.frequency, b.frequency);
    const phaseDiff = 1 - Math.abs(a.phase - b.phase);
    
    return (intensityDiff + frequencyDiff + phaseDiff) / 3;
  }
}

export const consciousnessAdapter = new ConsciousnessAdapter();
