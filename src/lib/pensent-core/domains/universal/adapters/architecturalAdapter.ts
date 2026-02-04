/**
 * Architectural & Sacred Geometry Adapter
 * 
 * Spatial cognition, building proportions, sacred geometry patterns,
 * urban planning, and the mathematics of beauty in built environments.
 * 
 * For Alec Arthur Shelton - The Artist
 * Buildings are frozen music, cities are symphonies in stone.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// SACRED GEOMETRY CONSTANTS
const SACRED_GEOMETRY = {
  goldenRatio: {
    symbol: 'φ',
    value: 1.618033988749895,
    inverse: 0.618033988749895,
    significance: 'Most irrational number, optimal packing/division',
    appearances: [
      'Parthenon facade proportions',
      'Pyramid of Giza slope angle',
      'Human body proportions',
      'DNA helix geometry',
      'Galaxy spiral arms'
    ],
    marketAnalogy: 'Optimal risk/reward ratio in position sizing'
  },
  
  fibonacciSequence: {
    sequence: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377],
    ratio: 'Converges to φ as n→∞',
    applications: [
      'Architecture: Room dimensions',
      'Music: Timing intervals', 
      'Nature: Petal counts, branching',
      'Markets: Retracement levels'
    ]
  },
  
  platonicSolids: {
    tetrahedron: { faces: 4, element: 'fire', angles: [60, 60, 60] },
    cube: { faces: 6, element: 'earth', angles: [90, 90, 90] },
    octahedron: { faces: 8, element: 'air', angles: [60, 60, 60] },
    dodecahedron: { faces: 12, element: 'ether/universe', angles: [108, 108, 108] },
    icosahedron: { faces: 20, element: 'water', angles: [60, 60, 60] }
  },
  
  flowerOfLife: {
    description: 'Overlapping circles creating flower pattern',
    circles: 19,
    significance: 'Contains all platonic solids, blueprint of universe',
    ancientSites: ['Egyptian temples', 'Chinese temples', 'Turkish sites']
  }
};

// ARCHITECTURAL PROPORTION SYSTEMS
const PROPORTION_SYSTEMS = {
  // Classical Orders
  classicalOrders: {
    doric: {
      origin: 'Greece, mainland',
      proportions: 'Column height = 4-6 base diameters',
      character: 'Masculine, sturdy, gravity',
      entablatureRatio: '2:1 (architrave:frieze)'
    },
    ionic: {
      origin: 'Greece, Asia Minor', 
      proportions: 'Column height = 8-9 base diameters',
      character: 'Feminine, elegant, wisdom',
      volutes: 'Spiral ornament = Fibonacci spiral'
    },
    corinthian: {
      origin: 'Greece, Corinth',
      proportions: 'Column height = 10 base diameters',
      character: 'Youthful, ornate, spirituality',
      capital: 'Acanthus leaves in golden spiral'
    }
  },
  
  // Vitruvian Principles
  vitruvius: {
    firmitas: 'Structural stability',
    utilitas: 'Functional utility', 
    venustas: 'Beauty delight',
    humanProportion: 'Building as body, modules as parts'
  },
  
  // Modular Systems
  leCorbusier: {
    name: 'Modulor',
    basis: 'Human scale + golden ratio',
    series: ['Red series: 183, 113, 70, 43, 27 cm',
             'Blue series: 226, 140, 86, 53, 33 cm'],
    application: 'Unité d\'Habitation, Chandigarh'
  },
  
  japanese: {
    kenzan: 'Standard tatami mat (91cm × 182cm)',
    ken: 'Standard bay width (6 shaku = 1.82m)',
    proportion: '1:2, 2:3, 1:1 ratios',
    flexibility: 'Standardized yet adaptable'
  }
};

// SPATIAL COGNITION PATTERNS
const SPATIAL_COGNITION = {
  prospectRefuge: {
    theory: 'Jay Appleton - Humans prefer spaces with overview (prospect) and protection (refuge)',
    application: 'Window seats, alcoves, elevated porches',
    evolutionary: 'Savanna survival - see threats, hide from them',
    marketAnalogy: 'Options: upside exposure (prospect) with defined risk (refuge)'
  },
  
  defensibleSpace: {
    theory: 'Oscar Newman - Territorial control reduces crime',
    layers: ['private', 'semi_private', 'semi_public', 'public'],
    application: 'Front porches, shared courtyards',
    marketAnalogy: 'Clear ownership boundaries in contracts'
  },
  
  wayfinding: {
    principles: ['Differentiation', 'Visual access', 'Consistency', 'Simplicity'],
    lynchElements: ['Paths', 'Edges', 'Districts', 'Nodes', 'Landmarks'],
    application: 'Airport navigation, hospital layouts',
    marketAnalogy: 'Clear UI/UX, information hierarchy'
  }
};

// URBAN PATTERNS
const URBAN_PATTERNS = {
  fractalCities: {
    description: 'Cities exhibit self-similarity across scales',
    evidence: 'Street networks, building sizes, population density',
    powerLaw: 'Zipf\'s law - city sizes follow power distribution',
    marketAnalogy: 'Self-similarity in price action across timeframes'
  },
  
  centralPlaceTheory: {
    theory: 'Walter Christaller - Hierarchical settlement patterns',
    hexagons: 'Optimal service area geometry',
    levels: ['Hamlet', 'Village', 'Town', 'City', 'Regional capital'],
    marketAnalogy: 'Market centers, exchange locations'
  },
  
  spaceSyntax: {
    description: 'Network analysis of spatial configuration',
    measure: 'Integration - how connected is a space to all others',
    correlation: 'High integration = high pedestrian traffic',
    application: 'Retail location, public safety'
  }
};

// BIOPHILIC DESIGN
const BIOPHILIC_PATTERNS = {
  environmentalFeatures: {
    naturalLight: 'Circadian rhythm regulation',
    airFlow: 'Thermal comfort, freshness',
    water: 'Visual/auditory calm',
    plants: 'Stress reduction, air quality'
  },
  
  naturalShapes: {
    biomorphicForms: 'Organic shapes vs geometric',
    materialConnection: 'Natural materials age gracefully',
    complexityOrder: 'Richness balanced with coherence'
  },
  
  prospectRefuge: {
    cocoonSpaces: 'Partial enclosure with visibility',
    secretPlaces: 'Childhood attachment to hiding spots',
    mystery: 'Partially obscured views entice exploration'
  }
};

interface ArchitecturalEvent {
  timestamp: number;
  buildingId: string;
  goldenRatioAlignment: number; // 0-1 how well building aligns
  fibonacciDimensions: number[];
  spatialIntegration: number; // Space syntax measure
  prospectScore: number; // 0-1 view quality
  refugeScore: number; // 0-1 enclosure comfort
  naturalLightScore: number; // 0-1 daylight access
  biophilicElements: number; // Count of natural features
  humanScaleRatio: number; // Building height to street width
  fractalDimension: number; // Complexity of facade
}

class ArchitecturalAdapter implements DomainAdapter<ArchitecturalEvent> {
  domain = 'soul' as const;
  name = 'Architectural & Sacred Geometry';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[ArchitecturalAdapter] Initialized - Sacred proportions flowing');
  }
  
  processRawData(event: ArchitecturalEvent): UniversalSignal {
    const { timestamp, goldenRatioAlignment, prospectScore, refugeScore, spatialIntegration } = event;
    
    // Frequency encodes human scale (lower = more human)
    const frequency = 1 - Math.min(event.humanScaleRatio / 10, 1);
    
    // Intensity = beauty metric (golden ratio × biophilia × prospect-refuge)
    const biophilicIntensity = event.biophilicElements / 10;
    const intensity = goldenRatioAlignment * 0.4 + biophilicIntensity * 0.3 + 
                     (prospectScore + refugeScore) / 2 * 0.3;
    
    // Phase encodes spatial integration (connectedness)
    const phase = spatialIntegration * Math.PI;
    
    const harmonics = [
      goldenRatioAlignment,
      prospectScore,
      refugeScore,
      event.naturalLightScore,
      biophilicIntensity,
      event.fractalDimension / 3
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [goldenRatioAlignment, prospectScore, refugeScore, spatialIntegration, event.fractalDimension]
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
    
    const avgGolden = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgProspect = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgRefuge = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgIntegration = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgFractal = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgProspect > 0.7 ? 0.8 : 0.2, // High prospect = exposure
      defensive: avgRefuge > 0.7 ? 0.8 : 0.2, // High refuge = protection
      tactical: avgFractal > 2 ? 0.6 : 0.3, // Complex facades
      strategic: avgGolden > 0.8 ? 0.8 : 0.2 // Strong proportions
    };
    
    const temporalFlow = {
      early: avgIntegration < 0.3 ? 0.8 : 0.2, // Isolated spaces
      mid: avgIntegration >= 0.3 && avgIntegration < 0.7 ? 0.7 : 0.2,
      late: avgIntegration >= 0.7 ? 0.8 : 0.2 // Well-integrated
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: (avgGolden + avgProspect + avgRefuge) / 3,
      momentum: avgIntegration > 0.5 ? 1 : -1,
      volatility: 1 - avgRefuge,
      dominantFrequency: 1 - Math.min(recent.reduce((s, sig) => s + sig.frequency, 0) / recent.length, 1),
      harmonicResonance: avgGolden,
      phaseAlignment: avgIntegration,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.6,
      momentum: 0,
      volatility: 0.4,
      dominantFrequency: 0.5,
      harmonicResonance: 0.8,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Calculate golden ratio proportions
  calculateGoldenDimensions(base: number): { width: number; height: number } {
    const phi = SACRED_GEOMETRY.goldenRatio.value;
    return {
      width: base,
      height: base * phi
    };
  }
  
  // Assess building using prospect-refuge theory
  assessProspectRefuge(floor: number, totalFloors: number, windowArea: number, wallArea: number): {
    prospect: number;
    refuge: number;
  } {
    const prospect = (floor / totalFloors) * (windowArea / (windowArea + wallArea));
    const refuge = 1 - prospect + 0.2; // Some refuge even at top
    return { prospect: Math.min(prospect, 1), refuge: Math.min(refuge, 1) };
  }
  
  // Generate Fibonacci room sequence
  generateFibonacciRooms(count: number): number[] {
    const seq = SACRED_GEOMETRY.fibonacciSequence.sequence;
    return seq.slice(0, count).map(n => n * 0.3); // Scale to meters
  }
}

export const architecturalAdapter = new ArchitecturalAdapter();
export { SACRED_GEOMETRY, PROPORTION_SYSTEMS, SPATIAL_COGNITION, URBAN_PATTERNS, BIOPHILIC_PATTERNS };
export type { ArchitecturalEvent };
