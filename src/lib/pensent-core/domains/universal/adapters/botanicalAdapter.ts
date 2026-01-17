/**
 * Botanical & Plant Intelligence Adapter
 * Patterns of plant consciousness, growth, and communication
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

type BotanicalSignature = DomainSignature;

export interface PlantIntelligence {
  species: string;
  family: string;
  order: string;
  
  // Growth patterns
  growthRate: number; // cm/year
  maxHeight: number; // meters
  rootDepth: number; // meters
  branchingPattern: 'monopodial' | 'sympodial' | 'dichotomous';
  
  // Temporal patterns
  lifespan: number; // years (0 for annual)
  floweringCycle: 'annual' | 'biennial' | 'perennial' | 'irregular';
  circadianResponse: number; // 0-1 strength
  seasonalDormancy: boolean;
  
  // Communication & sensing
  volatileSignaling: boolean; // Chemical communication
  rootNetworking: boolean; // Mycorrhizal connections
  electricalSignaling: boolean;
  touchResponse: boolean; // Thigmotropism
  
  // Fibonacci patterns in morphology
  leafPhyllotaxis: number; // Angle between leaves (137.5° = golden)
  petalCount: number[];
  seedSpiralCount: number[];
  
  // Adaptation metrics
  droughtTolerance: number;
  photosynthesisEfficiency: number;
  carbonFixation: 'C3' | 'C4' | 'CAM';
  
  // Visual patterns
  symmetry: 'radial' | 'bilateral' | 'spiral' | 'fractal';
  colorSpectrum: string[];
  surfacePatterns: string[];
}

// Real botanical data
export const PLANT_INTELLIGENCE_DATABASE: PlantIntelligence[] = [
  {
    species: 'Sequoia sempervirens', // Coast Redwood
    family: 'Cupressaceae',
    order: 'Pinales',
    growthRate: 150,
    maxHeight: 115,
    rootDepth: 4,
    branchingPattern: 'monopodial',
    lifespan: 2000,
    floweringCycle: 'perennial',
    circadianResponse: 0.7,
    seasonalDormancy: false,
    volatileSignaling: true,
    rootNetworking: true,
    electricalSignaling: true,
    touchResponse: false,
    leafPhyllotaxis: 137.5,
    petalCount: [],
    seedSpiralCount: [8, 13],
    droughtTolerance: 0.4,
    photosynthesisEfficiency: 0.85,
    carbonFixation: 'C3',
    symmetry: 'radial',
    colorSpectrum: ['green', 'brown', 'red-bark'],
    surfacePatterns: ['fibrous-bark', 'needle-clusters']
  },
  {
    species: 'Helianthus annuus', // Sunflower
    family: 'Asteraceae',
    order: 'Asterales',
    growthRate: 300,
    maxHeight: 3,
    rootDepth: 2,
    branchingPattern: 'monopodial',
    lifespan: 0, // Annual
    floweringCycle: 'annual',
    circadianResponse: 0.95, // Strong heliotropism
    seasonalDormancy: false,
    volatileSignaling: true,
    rootNetworking: true,
    electricalSignaling: true,
    touchResponse: true,
    leafPhyllotaxis: 137.5,
    petalCount: [34, 55, 89],
    seedSpiralCount: [34, 55], // Fibonacci!
    droughtTolerance: 0.6,
    photosynthesisEfficiency: 0.92,
    carbonFixation: 'C3',
    symmetry: 'spiral',
    colorSpectrum: ['yellow', 'brown', 'green'],
    surfacePatterns: ['seed-spiral', 'petal-ray']
  },
  {
    species: 'Mimosa pudica', // Sensitive plant
    family: 'Fabaceae',
    order: 'Fabales',
    growthRate: 100,
    maxHeight: 1,
    rootDepth: 0.5,
    branchingPattern: 'sympodial',
    lifespan: 2,
    floweringCycle: 'perennial',
    circadianResponse: 0.9,
    seasonalDormancy: false,
    volatileSignaling: true,
    rootNetworking: true,
    electricalSignaling: true, // Famous for rapid response!
    touchResponse: true, // Most famous touch response
    leafPhyllotaxis: 137.5,
    petalCount: [4],
    seedSpiralCount: [],
    droughtTolerance: 0.3,
    photosynthesisEfficiency: 0.75,
    carbonFixation: 'C3',
    symmetry: 'bilateral',
    colorSpectrum: ['green', 'pink'],
    surfacePatterns: ['compound-leaves', 'folding-motion']
  },
  {
    species: 'Dionaea muscipula', // Venus flytrap
    family: 'Droseraceae',
    order: 'Caryophyllales',
    growthRate: 10,
    maxHeight: 0.15,
    rootDepth: 0.1,
    branchingPattern: 'sympodial',
    lifespan: 20,
    floweringCycle: 'perennial',
    circadianResponse: 0.6,
    seasonalDormancy: true,
    volatileSignaling: true,
    rootNetworking: false,
    electricalSignaling: true, // Action potentials like neurons!
    touchResponse: true, // Rapid trap closure
    leafPhyllotaxis: 144,
    petalCount: [5],
    seedSpiralCount: [],
    droughtTolerance: 0.1,
    photosynthesisEfficiency: 0.65,
    carbonFixation: 'C3',
    symmetry: 'bilateral',
    colorSpectrum: ['green', 'red', 'white'],
    surfacePatterns: ['trap-lobes', 'trigger-hairs', 'digestive-glands']
  },
  {
    species: 'Ficus benghalensis', // Banyan tree
    family: 'Moraceae',
    order: 'Rosales',
    growthRate: 80,
    maxHeight: 25,
    rootDepth: 10,
    branchingPattern: 'sympodial',
    lifespan: 500,
    floweringCycle: 'perennial',
    circadianResponse: 0.5,
    seasonalDormancy: false,
    volatileSignaling: true,
    rootNetworking: true,
    electricalSignaling: true,
    touchResponse: false,
    leafPhyllotaxis: 137.5,
    petalCount: [],
    seedSpiralCount: [],
    droughtTolerance: 0.7,
    photosynthesisEfficiency: 0.88,
    carbonFixation: 'C3',
    symmetry: 'fractal',
    colorSpectrum: ['green', 'brown', 'gray'],
    surfacePatterns: ['aerial-roots', 'strangler-pattern', 'canopy-spread']
  }
];

export class BotanicalAdapter {
  readonly domain: DomainType = 'bio';
  readonly name = 'Botanical Intelligence';
  isActive = true;
  lastUpdate = Date.now();

  private plantDatabase = PLANT_INTELLIGENCE_DATABASE;
  private readonly PHI = 1.618033988749895; // Golden ratio

  async initialize(): Promise<void> {
    console.log('[BotanicalAdapter] Initializing with', this.plantDatabase.length, 'species');
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  processPlantData(plant: PlantIntelligence): UniversalSignal {
    // Calculate plant intelligence score
    const intelligenceScore = this.calculatePlantIntelligence(plant);
    
    // Fibonacci alignment score
    const fibonacciAlignment = this.calculateFibonacciAlignment(plant);
    
    // Extract growth harmonics
    const harmonics = [
      plant.growthRate / 300, // Normalized growth
      plant.circadianResponse,
      plant.photosynthesisEfficiency,
      fibonacciAlignment,
      plant.electricalSignaling ? 0.9 : 0.3
    ];

    return {
      domain: 'bio',
      timestamp: Date.now(),
      intensity: intelligenceScore,
      frequency: this.getGrowthFrequency(plant),
      phase: Math.min(plant.lifespan / 2000, 1), // Normalized to oldest trees
      harmonics,
      rawData: [
        plant.growthRate,
        plant.maxHeight,
        plant.rootDepth,
        plant.circadianResponse,
        plant.droughtTolerance
      ]
    };
  }

  private calculatePlantIntelligence(plant: PlantIntelligence): number {
    let score = 0;
    
    // Sensing capabilities
    score += plant.volatileSignaling ? 0.15 : 0;
    score += plant.rootNetworking ? 0.15 : 0;
    score += plant.electricalSignaling ? 0.2 : 0;
    score += plant.touchResponse ? 0.15 : 0;
    
    // Temporal awareness
    score += plant.circadianResponse * 0.15;
    
    // Adaptation
    score += plant.photosynthesisEfficiency * 0.1;
    score += plant.droughtTolerance * 0.1;
    
    return score;
  }

  private calculateFibonacciAlignment(plant: PlantIntelligence): number {
    const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
    let alignment = 0;
    let checks = 0;
    
    // Check leaf angle (golden angle = 137.5°)
    const goldenAngle = 360 / (this.PHI * this.PHI);
    alignment += 1 - Math.abs(plant.leafPhyllotaxis - goldenAngle) / goldenAngle;
    checks++;
    
    // Check petal counts
    for (const count of plant.petalCount) {
      if (fibSequence.includes(count)) alignment += 1;
      checks++;
    }
    
    // Check seed spirals
    for (const count of plant.seedSpiralCount) {
      if (fibSequence.includes(count)) alignment += 1;
      checks++;
    }
    
    return checks > 0 ? alignment / checks : 0;
  }

  private getGrowthFrequency(plant: PlantIntelligence): number {
    // Convert growth cycle to frequency
    if (plant.lifespan === 0) return 1; // Annual
    return 1 / plant.lifespan;
  }

  extractSignature(signals: UniversalSignal[]): BotanicalSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const avgIntensity = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const avgFrequency = signals.reduce((sum, s) => sum + s.frequency, 0) / signals.length;

    // Plant strategy quadrants
    // Aggressive = rapid growth, competition for light
    // Defensive = drought/pest resistance
    // Tactical = rapid response (touch, electrical)
    // Strategic = long-term growth, root networking
    
    const quadrantProfile = {
      aggressive: signals.filter(s => s.rawData[0] > 100).length / signals.length,
      defensive: signals.filter(s => s.rawData[4] > 0.5).length / signals.length,
      tactical: signals.filter(s => s.harmonics[4] > 0.5).length / signals.length,
      strategic: signals.filter(s => s.phase > 0.1).length / signals.length
    };

    const temporalFlow = {
      early: signals.filter(s => s.phase < 0.01).length / signals.length, // Annuals
      mid: signals.filter(s => s.phase >= 0.01 && s.phase < 0.25).length / signals.length,
      late: signals.filter(s => s.phase >= 0.25).length / signals.length // Ancient trees
    };

    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateGrowthMomentum(signals),
      volatility: this.calculateGrowthVariance(signals),
      dominantFrequency: avgFrequency,
      harmonicResonance: this.calculateFibonacciResonance(signals),
      phaseAlignment: signals.reduce((sum, s) => sum + s.phase, 0) / signals.length,
      extractedAt: Date.now()
    };
  }

  private calculateGrowthMomentum(signals: UniversalSignal[]): number {
    return signals.reduce((sum, s) => sum + s.rawData[0] * s.harmonics[2], 0) / signals.length / 300;
  }

  private calculateGrowthVariance(signals: UniversalSignal[]): number {
    const mean = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const variance = signals.reduce((sum, s) => sum + Math.pow(s.intensity - mean, 2), 0) / signals.length;
    return Math.sqrt(variance);
  }

  private calculateFibonacciResonance(signals: UniversalSignal[]): number {
    // How well do the plants align with Fibonacci/golden patterns?
    return signals.reduce((sum, s) => sum + s.harmonics[3], 0) / signals.length;
  }

  private getDefaultSignature(): BotanicalSignature {
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

  getAllPlantSignals(): UniversalSignal[] {
    return this.plantDatabase.map(plant => this.processPlantData(plant));
  }
}

export const botanicalAdapter = new BotanicalAdapter();
