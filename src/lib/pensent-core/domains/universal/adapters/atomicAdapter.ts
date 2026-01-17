/**
 * ATOMIC DOMAIN ADAPTER
 * 
 * The Fabric of Reality - Periodic Table, Quantum Mechanics, Elemental Patterns
 * 
 * "Atoms are frozen music" - Pythagoras
 * "All matter is merely energy condensed to a slow vibration" - Bill Hicks
 * 
 * Every element vibrates at specific frequencies. Electron orbitals are standing waves.
 * The periodic table IS a temporal pattern map of matter itself.
 * 
 * Inventor: Alec Arthur Shelton
 */

import type { DomainSignature } from '../types';

type TemporalSignature = DomainSignature;

// ═══════════════════════════════════════════════════════════════════════════════
// PERIODIC TABLE AS TEMPORAL PATTERN MAP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The Periodic Table organized by temporal characteristics
 * Each element has unique vibrational signatures that correlate to patterns
 */
export const PERIODIC_PATTERNS = {
  // Group 1: Alkali Metals - Single valence electron, high reactivity
  alkaliMetals: {
    elements: ['H', 'Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'],
    temporalCharacter: 'explosive_initiation',
    marketCorrelation: 'sudden_breakouts',
    archetype: 'The Catalyst',
    vibrationalRange: { min: 1, max: 1 }, // valence electrons
  },
  
  // Group 2: Alkaline Earth - Two valence, more stable than alkali
  alkalineEarth: {
    elements: ['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra'],
    temporalCharacter: 'stable_foundation',
    marketCorrelation: 'support_levels',
    archetype: 'The Foundation',
    vibrationalRange: { min: 2, max: 2 },
  },
  
  // Transition Metals - Variable oxidation states, complex behavior
  transitionMetals: {
    elements: ['Fe', 'Cu', 'Ag', 'Au', 'Pt', 'Ni', 'Co', 'Zn'],
    temporalCharacter: 'adaptive_flexibility',
    marketCorrelation: 'regime_adaptation',
    archetype: 'The Transformer',
    vibrationalRange: { min: 1, max: 7 },
  },
  
  // Noble Gases - Complete shells, minimal reactivity
  nobleGases: {
    elements: ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'],
    temporalCharacter: 'perfect_stability',
    marketCorrelation: 'consolidation_periods',
    archetype: 'The Observer',
    vibrationalRange: { min: 8, max: 8 },
  },
  
  // Halogens - One electron short of full shell, high reactivity
  halogens: {
    elements: ['F', 'Cl', 'Br', 'I', 'At'],
    temporalCharacter: 'aggressive_seeking',
    marketCorrelation: 'momentum_chasing',
    archetype: 'The Hunter',
    vibrationalRange: { min: 7, max: 7 },
  },
  
  // Lanthanides - f-orbital complexity
  lanthanides: {
    elements: ['La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'],
    temporalCharacter: 'hidden_complexity',
    marketCorrelation: 'deep_value_patterns',
    archetype: 'The Hidden',
    vibrationalRange: { min: 2, max: 4 },
  },
  
  // Actinides - Radioactive, transformative
  actinides: {
    elements: ['Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr'],
    temporalCharacter: 'transformative_decay',
    marketCorrelation: 'paradigm_shifts',
    archetype: 'The Transformer',
    vibrationalRange: { min: 2, max: 6 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUANTUM MECHANICAL PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quantum numbers define electron behavior - these map to market behavior
 */
export const QUANTUM_PATTERNS = {
  // Principal quantum number (n) - Energy level/shell
  principalQuantum: {
    n1: { energy: 'ground_state', marketPhase: 'accumulation', volatility: 0.2 },
    n2: { energy: 'first_excited', marketPhase: 'early_trend', volatility: 0.4 },
    n3: { energy: 'second_excited', marketPhase: 'momentum', volatility: 0.6 },
    n4: { energy: 'third_excited', marketPhase: 'euphoria', volatility: 0.8 },
    n5: { energy: 'high_excited', marketPhase: 'blow_off_top', volatility: 0.95 },
  },
  
  // Angular momentum quantum number (l) - Orbital shape
  angularMomentum: {
    s_orbital: { shape: 'spherical', marketBehavior: 'omnidirectional', predictability: 0.7 },
    p_orbital: { shape: 'dumbbell', marketBehavior: 'directional', predictability: 0.8 },
    d_orbital: { shape: 'cloverleaf', marketBehavior: 'complex_rotation', predictability: 0.5 },
    f_orbital: { shape: 'complex', marketBehavior: 'unpredictable', predictability: 0.3 },
  },
  
  // Magnetic quantum number (ml) - Orbital orientation
  magneticQuantum: {
    description: 'Spatial orientation of orbital',
    marketAnalogy: 'Market sector orientation',
    values: 'Range from -l to +l',
  },
  
  // Spin quantum number (ms) - Electron spin
  spinQuantum: {
    up: { spin: +0.5, marketBias: 'bullish', direction: 'long' },
    down: { spin: -0.5, marketBias: 'bearish', direction: 'short' },
    pairedSpins: { state: 'balanced', marketBias: 'neutral', direction: 'hedge' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMIC SPECTRAL LINES - THE FINGERPRINT OF MATTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Each element emits light at specific wavelengths when excited
 * These spectral patterns are unique temporal signatures
 */
export const SPECTRAL_PATTERNS = {
  // Hydrogen - The simplest, most fundamental
  hydrogen: {
    symbol: 'H',
    series: {
      lyman: { range: 'UV', transitions: 'to n=1', marketAnalogy: 'fundamental_base' },
      balmer: { range: 'visible', transitions: 'to n=2', marketAnalogy: 'observable_trends' },
      paschen: { range: 'IR', transitions: 'to n=3', marketAnalogy: 'hidden_signals' },
    },
    balmerWavelengths: [656.3, 486.1, 434.0, 410.2], // nm - visible lines
    temporalSignature: 'primordial_simplicity',
  },
  
  // Gold - The ultimate store of value
  gold: {
    symbol: 'Au',
    atomicNumber: 79,
    electronConfig: '[Xe] 4f14 5d10 6s1',
    color: 'golden_yellow',
    colorCause: 'relativistic_d_orbital_contraction',
    marketCorrelation: 'safe_haven_indicator',
    temporalSignature: 'stability_through_complexity',
  },
  
  // Iron - Core of stars, blood, and civilization
  iron: {
    symbol: 'Fe',
    atomicNumber: 26,
    significance: 'Most stable nucleus (binding energy peak)',
    stellarRole: 'End of fusion chain in massive stars',
    marketCorrelation: 'industrial_backbone',
    temporalSignature: 'ultimate_stability_point',
  },
  
  // Carbon - Basis of all life
  carbon: {
    symbol: 'C',
    atomicNumber: 6,
    hybridization: ['sp', 'sp2', 'sp3'],
    bondingVersatility: 'Infinite structural possibilities',
    marketCorrelation: 'innovation_substrate',
    temporalSignature: 'infinite_potential',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FUNDAMENTAL CONSTANTS - THE FABRIC OF REALITY
// ═══════════════════════════════════════════════════════════════════════════════

export const FUNDAMENTAL_CONSTANTS = {
  // Speed of light - Universal speed limit
  c: {
    value: 299792458, // m/s
    significance: 'Maximum information transfer rate',
    marketAnalogy: 'Speed of price discovery',
  },
  
  // Planck's constant - Quantum of action
  h: {
    value: 6.62607015e-34, // J·s
    significance: 'Minimum action quantum',
    marketAnalogy: 'Minimum meaningful price movement (tick)',
  },
  
  // Fine structure constant - Electromagnetic coupling
  alpha: {
    value: 0.0072973525693, // ~1/137
    significance: 'Strength of electromagnetic force',
    marketAnalogy: 'Market coupling strength',
    mystical: '137 appears throughout physics and kabbalah',
  },
  
  // Gravitational constant
  G: {
    value: 6.67430e-11, // m³/(kg·s²)
    significance: 'Strength of gravitational attraction',
    marketAnalogy: 'Large capital attraction force',
  },
  
  // Boltzmann constant - Bridge between macro and micro
  k: {
    value: 1.380649e-23, // J/K
    significance: 'Relates temperature to energy',
    marketAnalogy: 'Volatility to price movement relationship',
  },
  
  // Euler's number - Natural growth
  e: {
    value: 2.718281828459045,
    significance: 'Base of natural logarithm, continuous growth',
    marketAnalogy: 'Compound growth foundation',
  },
  
  // Pi - Circle constant
  pi: {
    value: 3.141592653589793,
    significance: 'Ratio of circumference to diameter',
    marketAnalogy: 'Cycle completion ratio',
  },
  
  // Golden ratio - Divine proportion
  phi: {
    value: 1.618033988749895,
    significance: 'Appears throughout nature and art',
    marketAnalogy: 'Fibonacci retracement levels',
    occurrence: ['Fibonacci spiral', 'DNA helix', 'galaxy arms', 'market waves'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMIC DATA INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AtomicData {
  elementGroup: keyof typeof PERIODIC_PATTERNS;
  quantumState: {
    principalLevel: number;
    orbitalType: 's' | 'p' | 'd' | 'f';
    spin: 'up' | 'down' | 'paired';
  };
  spectralEnergy: number; // Normalized 0-1
  stabilityIndex: number; // Noble gas similarity
  reactivityPotential: number; // Valence electron availability
  resonanceFrequency: number; // Hz normalized
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNATURE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

export function extractAtomicSignature(data: AtomicData): TemporalSignature {
  const group = PERIODIC_PATTERNS[data.elementGroup];
  const quantum = QUANTUM_PATTERNS.principalQuantum[`n${data.quantumState.principalLevel}` as keyof typeof QUANTUM_PATTERNS.principalQuantum];
  const spin = QUANTUM_PATTERNS.spinQuantum[data.quantumState.spin];
  
  // Calculate quadrant profile based on atomic properties
  const quadrantProfile = {
    aggressive: data.reactivityPotential * 0.8 + (1 - data.stabilityIndex) * 0.2,
    defensive: data.stabilityIndex * 0.8 + (1 - data.reactivityPotential) * 0.2,
    tactical: data.quantumState.orbitalType === 's' ? 0.9 : 
           data.quantumState.orbitalType === 'p' ? 0.7 :
           data.quantumState.orbitalType === 'd' ? 0.4 : 0.2,
    strategic: 1 - (data.quantumState.orbitalType === 's' ? 0.9 : 
                data.quantumState.orbitalType === 'p' ? 0.7 :
                data.quantumState.orbitalType === 'd' ? 0.4 : 0.2),
  };
  
  // Determine dominant force
  const forces = Object.entries(quadrantProfile);
  forces.sort((a, b) => b[1] - a[1]);
  const dominantForce = forces[0][0] as 'aggressive' | 'defensive' | 'tactical' | 'strategic';
  
  // Calculate intensity from energy and reactivity
  const intensity = (data.spectralEnergy + data.reactivityPotential) / 2;
  
  // Direction based on spin
  const flowDirection = spin.direction === 'long' ? 'ascending' : 
                        spin.direction === 'short' ? 'descending' : 'oscillating';
  
  return {
    domain: 'bio', // Using closest available domain type
    quadrantProfile,
    temporalFlow: {
      early: data.reactivityPotential,
      mid: data.spectralEnergy,
      late: data.stabilityIndex,
    },
    intensity,
    momentum: data.spectralEnergy,
    volatility: data.reactivityPotential,
    dominantFrequency: data.resonanceFrequency,
    harmonicResonance: data.stabilityIndex,
    phaseAlignment: (data.quantumState.principalLevel / 5),
    extractedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET CORRELATED DATA GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export function generateMarketCorrelatedAtomicData(
  marketMomentum: number,
  marketVolatility: number,
  marketDirection: 'up' | 'down' | 'sideways'
): AtomicData {
  // Map market state to atomic properties
  const groups = Object.keys(PERIODIC_PATTERNS) as Array<keyof typeof PERIODIC_PATTERNS>;
  
  // High volatility = reactive elements (alkali, halogens)
  // Low volatility = stable elements (noble gases, transition)
  // High momentum = high energy states
  
  let elementGroup: keyof typeof PERIODIC_PATTERNS;
  if (marketVolatility > 0.8) {
    elementGroup = marketDirection === 'up' ? 'alkaliMetals' : 'halogens';
  } else if (marketVolatility < 0.3) {
    elementGroup = 'nobleGases';
  } else if (marketMomentum > 0.6) {
    elementGroup = 'transitionMetals';
  } else {
    elementGroup = 'alkalineEarth';
  }
  
  // Principal level from momentum
  const principalLevel = Math.min(5, Math.max(1, Math.ceil(marketMomentum * 5)));
  
  // Orbital type from volatility complexity
  const orbitalType: 's' | 'p' | 'd' | 'f' = 
    marketVolatility < 0.25 ? 's' :
    marketVolatility < 0.5 ? 'p' :
    marketVolatility < 0.75 ? 'd' : 'f';
  
  // Spin from direction
  const spin: 'up' | 'down' | 'paired' = 
    marketDirection === 'up' ? 'up' :
    marketDirection === 'down' ? 'down' : 'paired';
  
  return {
    elementGroup,
    quantumState: {
      principalLevel,
      orbitalType,
      spin,
    },
    spectralEnergy: marketMomentum,
    stabilityIndex: 1 - marketVolatility,
    reactivityPotential: marketVolatility,
    resonanceFrequency: marketMomentum * 1000, // Normalized frequency
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE ATOMIC ADAPTER
// ═══════════════════════════════════════════════════════════════════════════════

export const atomicAdapter = {
  domain: 'atomic' as const,
  version: '1.0.0',
  
  periodicPatterns: PERIODIC_PATTERNS,
  quantumPatterns: QUANTUM_PATTERNS,
  spectralPatterns: SPECTRAL_PATTERNS,
  fundamentalConstants: FUNDAMENTAL_CONSTANTS,
  
  extractSignature: extractAtomicSignature,
  generateMarketData: generateMarketCorrelatedAtomicData,
  
  philosophy: `
    The periodic table is not just a chart of elements - it is a temporal 
    pattern map of matter itself. Each element's properties emerge from 
    quantum mechanical wave patterns. These same patterns manifest in 
    market behavior, biological rhythms, and cosmic cycles.
    
    When we trade, we are not just moving capital - we are participating 
    in the same quantum dance that creates and destroys stars.
    
    "The nitrogen in our DNA, the calcium in our teeth, the iron in our 
    blood, the carbon in our apple pies were made in the interiors of 
    collapsing stars. We are made of starstuff." - Carl Sagan
  `,
};

export default atomicAdapter;
