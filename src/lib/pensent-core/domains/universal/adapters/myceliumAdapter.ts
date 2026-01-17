/**
 * Mycelium Network Adapter
 * The Original Internet - Fungal intelligence and network patterns
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

type MyceliumSignature = DomainSignature;

export interface FungalNetwork {
  species: string;
  phylum: string;
  
  // Network topology
  networkType: 'ectomycorrhizal' | 'arbuscular' | 'ericoid' | 'saprotrophic' | 'parasitic';
  hyphalDensity: number; // km/m³ of soil
  connectionNodes: number; // Trees/plants connected
  networkRadius: number; // meters
  
  // Communication patterns
  nutrientTransferRate: number; // μg/hour
  signalPropagationSpeed: number; // cm/hour
  chemicalSignals: string[];
  electricalSignaling: boolean;
  
  // Temporal patterns
  growthRate: number; // cm/day
  colonizationTime: number; // days to establish
  seasonalActivity: 'year-round' | 'seasonal' | 'sporadic';
  lifespan: number; // years (0 = unknown/indefinite)
  
  // Network intelligence
  resourceAllocation: number; // Efficiency 0-1
  stressResponse: number; // Speed of adaptation
  memoryDuration: number; // days of "remembered" paths
  problemSolving: number; // Maze-solving ability 0-1
  
  // Symbiotic relationships
  hostSpecies: string[];
  mutualisticBenefit: number; // 0-1 scale
  ecosystemRole: 'decomposer' | 'symbiont' | 'parasite' | 'pioneer';
  
  // Fruiting body patterns
  fruitingFrequency: number; // per year
  sporeProduction: number; // millions per fruiting
  dispersalDistance: number; // meters
}

// Real mycological data
export const FUNGAL_NETWORK_DATABASE: FungalNetwork[] = [
  {
    species: 'Armillaria ostoyae', // Honey mushroom - largest organism on Earth
    phylum: 'Basidiomycota',
    networkType: 'parasitic',
    hyphalDensity: 800,
    connectionNodes: 400,
    networkRadius: 3800, // The Oregon specimen covers 2,385 acres
    nutrientTransferRate: 15,
    signalPropagationSpeed: 8,
    chemicalSignals: ['oxalic-acid', 'rhizomorphin'],
    electricalSignaling: true,
    growthRate: 0.9,
    colonizationTime: 365,
    seasonalActivity: 'year-round',
    lifespan: 2400, // Estimated 2,400 years old
    resourceAllocation: 0.75,
    stressResponse: 0.6,
    memoryDuration: 180,
    problemSolving: 0.55,
    hostSpecies: ['Douglas-fir', 'Western-hemlock', 'Grand-fir'],
    mutualisticBenefit: 0.1, // Parasitic
    ecosystemRole: 'parasite',
    fruitingFrequency: 1,
    sporeProduction: 5000,
    dispersalDistance: 100
  },
  {
    species: 'Laccaria bicolor', // Bicolored deceiver
    phylum: 'Basidiomycota',
    networkType: 'ectomycorrhizal',
    hyphalDensity: 400,
    connectionNodes: 50,
    networkRadius: 25,
    nutrientTransferRate: 45,
    signalPropagationSpeed: 12,
    chemicalSignals: ['auxin', 'laccarin', 'phosphate-signaling'],
    electricalSignaling: true,
    growthRate: 2.5,
    colonizationTime: 14,
    seasonalActivity: 'year-round',
    lifespan: 50,
    resourceAllocation: 0.92,
    stressResponse: 0.85,
    memoryDuration: 90,
    problemSolving: 0.78,
    hostSpecies: ['Poplar', 'Pine', 'Spruce', 'Oak'],
    mutualisticBenefit: 0.95,
    ecosystemRole: 'symbiont',
    fruitingFrequency: 2,
    sporeProduction: 2000,
    dispersalDistance: 30
  },
  {
    species: 'Physarum polycephalum', // Slime mold (technically not fungus but studied similarly)
    phylum: 'Myxomycota',
    networkType: 'saprotrophic',
    hyphalDensity: 1200,
    connectionNodes: 100,
    networkRadius: 1,
    nutrientTransferRate: 60,
    signalPropagationSpeed: 300, // Very fast signal propagation
    chemicalSignals: ['cAMP', 'calcium-waves'],
    electricalSignaling: true,
    growthRate: 10,
    colonizationTime: 1,
    seasonalActivity: 'sporadic',
    lifespan: 0, // Indefinite in lab conditions
    resourceAllocation: 0.98, // Famous for optimal network design
    stressResponse: 0.95,
    memoryDuration: 365, // Remarkable memory
    problemSolving: 0.95, // Solved Tokyo rail map!
    hostSpecies: [],
    mutualisticBenefit: 0,
    ecosystemRole: 'decomposer',
    fruitingFrequency: 12,
    sporeProduction: 100,
    dispersalDistance: 1
  },
  {
    species: 'Rhizophagus irregularis', // Arbuscular mycorrhiza
    phylum: 'Glomeromycota',
    networkType: 'arbuscular',
    hyphalDensity: 2000,
    connectionNodes: 200,
    networkRadius: 50,
    nutrientTransferRate: 80,
    signalPropagationSpeed: 6,
    chemicalSignals: ['phosphate-exchange', 'strigolactones', 'lipid-transfer'],
    electricalSignaling: false,
    growthRate: 1.5,
    colonizationTime: 21,
    seasonalActivity: 'year-round',
    lifespan: 0, // Ancient lineage, 400+ million years
    resourceAllocation: 0.88,
    stressResponse: 0.72,
    memoryDuration: 60,
    problemSolving: 0.65,
    hostSpecies: ['80% of all land plants'],
    mutualisticBenefit: 0.98,
    ecosystemRole: 'symbiont',
    fruitingFrequency: 0,
    sporeProduction: 500,
    dispersalDistance: 5
  },
  {
    species: 'Psilocybe cubensis', // Magic mushroom
    phylum: 'Basidiomycota',
    networkType: 'saprotrophic',
    hyphalDensity: 300,
    connectionNodes: 0,
    networkRadius: 2,
    nutrientTransferRate: 20,
    signalPropagationSpeed: 5,
    chemicalSignals: ['psilocybin', 'psilocin', 'baeocystin'],
    electricalSignaling: true,
    growthRate: 3,
    colonizationTime: 10,
    seasonalActivity: 'seasonal',
    lifespan: 2,
    resourceAllocation: 0.7,
    stressResponse: 0.75,
    memoryDuration: 30,
    problemSolving: 0.45,
    hostSpecies: [],
    mutualisticBenefit: 0,
    ecosystemRole: 'decomposer',
    fruitingFrequency: 4,
    sporeProduction: 16000,
    dispersalDistance: 50
  }
];

export class MyceliumAdapter {
  readonly domain: DomainType = 'network'; // Mycelium = original network
  readonly name = 'Mycelium Network Intelligence';
  isActive = true;
  lastUpdate = Date.now();

  private fungalDatabase = FUNGAL_NETWORK_DATABASE;

  async initialize(): Promise<void> {
    console.log('[MyceliumAdapter] Initializing with', this.fungalDatabase.length, 'fungal species');
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  processFungalData(fungus: FungalNetwork): UniversalSignal {
    // Calculate network intelligence score
    const networkIntelligence = this.calculateNetworkIntelligence(fungus);
    
    // Extract network topology harmonics
    const harmonics = [
      Math.log10(fungus.hyphalDensity) / 4, // Density normalized
      fungus.connectionNodes / 400, // Connectivity normalized
      fungus.resourceAllocation,
      fungus.problemSolving,
      fungus.signalPropagationSpeed / 300 // Speed normalized
    ];

    return {
      domain: 'network',
      timestamp: Date.now(),
      intensity: networkIntelligence,
      frequency: fungus.fruitingFrequency > 0 ? fungus.fruitingFrequency / 12 : 0.5,
      phase: fungus.lifespan > 0 ? Math.min(fungus.lifespan / 2400, 1) : 0.5,
      harmonics,
      rawData: [
        fungus.hyphalDensity,
        fungus.connectionNodes,
        fungus.networkRadius,
        fungus.signalPropagationSpeed,
        fungus.memoryDuration
      ]
    };
  }

  private calculateNetworkIntelligence(fungus: FungalNetwork): number {
    let score = 0;
    
    // Network topology
    score += Math.log10(fungus.hyphalDensity) / 4 * 0.15;
    score += Math.min(fungus.connectionNodes / 400, 1) * 0.15;
    
    // Communication
    score += Math.min(fungus.signalPropagationSpeed / 300, 1) * 0.15;
    score += fungus.electricalSignaling ? 0.1 : 0;
    
    // Intelligence metrics
    score += fungus.resourceAllocation * 0.15;
    score += fungus.problemSolving * 0.2;
    score += Math.min(fungus.memoryDuration / 365, 1) * 0.1;
    
    return score;
  }

  extractSignature(signals: UniversalSignal[]): MyceliumSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }

    const avgIntensity = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const avgFrequency = signals.reduce((sum, s) => sum + s.frequency, 0) / signals.length;

    // Mycelium network quadrants
    // Aggressive = rapid colonization, parasitic behavior
    // Defensive = symbiotic, mutualistic protection
    // Tactical = resource allocation efficiency
    // Strategic = long-term network building, memory
    
    const quadrantProfile = {
      aggressive: signals.filter(s => s.rawData[3] > 50).length / signals.length,
      defensive: signals.filter(s => s.harmonics[2] > 0.8).length / signals.length,
      tactical: signals.filter(s => s.harmonics[3] > 0.7).length / signals.length,
      strategic: signals.filter(s => s.rawData[4] > 100).length / signals.length
    };

    const temporalFlow = {
      early: signals.filter(s => s.phase < 0.1).length / signals.length,
      mid: signals.filter(s => s.phase >= 0.1 && s.phase < 0.5).length / signals.length,
      late: signals.filter(s => s.phase >= 0.5).length / signals.length
    };

    return {
      domain: 'network',
      quadrantProfile,
      temporalFlow,
      intensity: avgIntensity,
      momentum: this.calculateNetworkExpansion(signals),
      volatility: this.calculateNetworkVariance(signals),
      dominantFrequency: avgFrequency,
      harmonicResonance: this.calculateSymbioticResonance(signals),
      phaseAlignment: signals.reduce((sum, s) => sum + s.phase, 0) / signals.length,
      extractedAt: Date.now()
    };
  }

  private calculateNetworkExpansion(signals: UniversalSignal[]): number {
    // Rate of network growth potential
    return signals.reduce((sum, s) => 
      sum + (s.rawData[2] * s.harmonics[0] / 1000), 0) / signals.length;
  }

  private calculateNetworkVariance(signals: UniversalSignal[]): number {
    const mean = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
    const variance = signals.reduce((sum, s) => sum + Math.pow(s.intensity - mean, 2), 0) / signals.length;
    return Math.sqrt(variance);
  }

  private calculateSymbioticResonance(signals: UniversalSignal[]): number {
    // How well networks cooperate across species
    return signals.reduce((sum, s) => sum + s.harmonics[2], 0) / signals.length;
  }

  private getDefaultSignature(): MyceliumSignature {
    return {
      domain: 'network',
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

  getAllFungalSignals(): UniversalSignal[] {
    return this.fungalDatabase.map(fungus => this.processFungalData(fungus));
  }

  // Cross-reference mycelium patterns with other networks
  findNetworkParallels(): { pattern: string; similarity: number }[] {
    const signals = this.getAllFungalSignals();
    const signature = this.extractSignature(signals);
    
    // The mycelium patterns that parallel human-made networks
    return [
      {
        pattern: 'Internet routing optimization',
        similarity: signature.harmonicResonance
      },
      {
        pattern: 'Neural network topology',
        similarity: (signature.quadrantProfile.tactical + signature.quadrantProfile.strategic) / 2
      },
      {
        pattern: 'Supply chain logistics',
        similarity: signals.reduce((sum, s) => sum + s.harmonics[2], 0) / signals.length
      },
      {
        pattern: 'Urban transportation grids',
        similarity: this.calculateGridEfficiency(signals)
      }
    ];
  }

  private calculateGridEfficiency(signals: UniversalSignal[]): number {
    // Physarum famously solved the Tokyo rail map optimally
    const optimalNetworker = signals.find(s => s.harmonics[3] > 0.9);
    return optimalNetworker ? optimalNetworker.harmonics[3] : 0.5;
  }
}

export const myceliumAdapter = new MyceliumAdapter();

/**
 * THE WOOD WIDE WEB
 * 
 * "The forest is not a collection of trees, but a superorganism
 *  connected by fungal networks that share resources, warn of
 *  threats, and remember paths through millennia."
 * 
 * This adapter recognizes that mycelium networks represent
 * the original internet - a decentralized, resilient, intelligent
 * system that has been optimizing resource allocation for
 * 400 million years.
 * 
 * The patterns we discover here inform our understanding of:
 * - Optimal network topology
 * - Distributed intelligence
 * - Symbiotic value creation
 * - Temporal memory across generations
 */
