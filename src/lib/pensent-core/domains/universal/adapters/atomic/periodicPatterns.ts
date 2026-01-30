/**
 * Periodic Patterns Module
 * 
 * The Periodic Table organized by temporal characteristics.
 * Each element has unique vibrational signatures that correlate to patterns.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PERIODIC TABLE AS TEMPORAL PATTERN MAP
// ═══════════════════════════════════════════════════════════════════════════════

export const PERIODIC_PATTERNS = {
  // Group 1: Alkali Metals - Single valence electron, high reactivity
  alkaliMetals: {
    elements: ['H', 'Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'],
    temporalCharacter: 'explosive_initiation',
    marketCorrelation: 'sudden_breakouts',
    archetype: 'The Catalyst',
    vibrationalRange: { min: 1, max: 1 },
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

export type PeriodicGroup = keyof typeof PERIODIC_PATTERNS;
