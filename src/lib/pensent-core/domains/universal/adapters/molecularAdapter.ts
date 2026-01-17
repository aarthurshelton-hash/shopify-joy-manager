/**
 * Molecular & Chemical Bonds Adapter
 * The chemistry of markets - bonds, reactions, and energy states
 * 
 * "Financial 'bonds' share more than a name with chemical bonds -
 * both represent stored energy, stability contracts, and the potential
 * for transformation under the right conditions."
 */

import { DomainSignature } from '../types';

// Chemical Bond Types mapped to Market Dynamics
export const BOND_TYPES = {
  covalent: {
    description: 'Shared electrons - mutual investment',
    strength: 'Strong (100-400 kJ/mol)',
    marketAnalogy: {
      type: 'Partnership/Joint Venture',
      behavior: 'Shared risk, shared reward, difficult to break',
      examples: 'Merger synergies, long-term contracts, equity stakes'
    },
    breakingConditions: 'High energy input (market crash, hostile takeover)',
    stability: 0.85
  },
  ionic: {
    description: 'Electron transfer - one gives, one takes',
    strength: 'Strong in solid state, weak in solution',
    marketAnalogy: {
      type: 'Debt/Bond instruments',
      behavior: 'Clear obligation, predictable returns, dissolves in liquidity',
      examples: 'Corporate bonds, loans, fixed income'
    },
    breakingConditions: 'Liquidity crisis dissolves the bond',
    stability: 0.70
  },
  metallic: {
    description: 'Sea of shared electrons - collective pool',
    strength: 'Variable, highly conductive',
    marketAnalogy: {
      type: 'Index funds, ETFs, market-wide exposure',
      behavior: 'Individual components fungible, collective strength',
      examples: 'S&P 500, sector ETFs, commodity pools'
    },
    breakingConditions: 'Systemic collapse affects all',
    stability: 0.60
  },
  hydrogen: {
    description: 'Weak attraction between polar molecules',
    strength: 'Weak individually (5-30 kJ/mol), strong collectively',
    marketAnalogy: {
      type: 'Network effects, social trading, sentiment',
      behavior: 'Individual connection weak, collective creates structure',
      examples: 'Social media influence, market sentiment, FOMO/FUD'
    },
    breakingConditions: 'Easily broken, easily reformed',
    stability: 0.30
  },
  vanDerWaals: {
    description: 'Temporary dipole attractions',
    strength: 'Very weak (0.4-4 kJ/mol)',
    marketAnalogy: {
      type: 'Momentary correlations, flash trades',
      behavior: 'Fleeting connections that aggregate to real effects',
      examples: 'HFT correlations, arbitrage, momentum echoes'
    },
    breakingConditions: 'Constant formation and breaking',
    stability: 0.15
  }
};

// Chemical Reactions as Market Events
export const REACTION_TYPES = {
  synthesis: {
    formula: 'A + B → AB',
    marketEvent: 'Merger, acquisition, portfolio combination',
    energetics: 'Usually releases energy (synergy value)',
    indicator: 'Consolidation phase'
  },
  decomposition: {
    formula: 'AB → A + B',
    marketEvent: 'Spin-off, divestiture, position liquidation',
    energetics: 'Requires energy input',
    indicator: 'Breaking apart phase'
  },
  singleReplacement: {
    formula: 'A + BC → AC + B',
    marketEvent: 'New player displaces incumbent',
    energetics: 'Depends on relative reactivities',
    indicator: 'Competitive disruption'
  },
  doubleReplacement: {
    formula: 'AB + CD → AD + CB',
    marketEvent: 'Asset swap, currency exchange, sector rotation',
    energetics: 'Often neutral',
    indicator: 'Rebalancing phase'
  },
  combustion: {
    formula: 'Fuel + O₂ → CO₂ + H₂O + Energy',
    marketEvent: 'Rapid value destruction, crash, bubble pop',
    energetics: 'Massive energy release (volatility spike)',
    indicator: 'Crisis/capitulation'
  },
  catalysis: {
    formula: 'A + B + catalyst → AB + catalyst',
    marketEvent: 'News event, regulatory change, Fed announcement',
    energetics: 'Lowers activation energy without being consumed',
    indicator: 'Catalyst-driven move'
  }
};

// States of Matter as Market Phases
export const STATES_OF_MATTER = {
  solid: {
    properties: 'Fixed shape, fixed volume, particles locked',
    marketPhase: 'Low volatility consolidation',
    characteristics: 'Range-bound, predictable, accumulation/distribution',
    transitionTo: 'Melting (breakout) requires energy (volume)'
  },
  liquid: {
    properties: 'Variable shape, fixed volume, particles flow',
    marketPhase: 'Trending market',
    characteristics: 'Directional flow, adapts to container (support/resistance)',
    transitionTo: 'Evaporation (parabolic) or Freezing (consolidation)'
  },
  gas: {
    properties: 'Variable shape, variable volume, particles free',
    marketPhase: 'High volatility, euphoria/panic',
    characteristics: 'Expands to fill space, compressible, fast-moving',
    transitionTo: 'Condensation (reversal) when energy removed'
  },
  plasma: {
    properties: 'Ionized gas, conducts electricity, extreme energy',
    marketPhase: 'Black swan event, market break',
    characteristics: 'Normal rules suspended, contagion, circuit breakers',
    transitionTo: 'Rare, returns to gas when energy dissipates'
  }
};

// Molecular Geometry and Market Structure
export const MOLECULAR_GEOMETRY = {
  linear: {
    bondAngle: 180,
    example: 'CO₂, BeF₂',
    marketPattern: 'Clear trend, no deviation'
  },
  trigonalPlanar: {
    bondAngle: 120,
    example: 'BF₃, NO₃⁻',
    marketPattern: 'Three-way competition (bulls, bears, neutral)'
  },
  tetrahedral: {
    bondAngle: 109.5,
    example: 'CH₄, NH₄⁺',
    marketPattern: 'Balanced four-factor analysis'
  },
  octahedral: {
    bondAngle: 90,
    example: 'SF₆, [Fe(CN)₆]⁴⁻',
    marketPattern: 'Complex multi-factor equilibrium'
  }
};

// Energy Concepts
export const THERMODYNAMICS = {
  enthalpy: {
    symbol: 'ΔH',
    meaning: 'Heat content change',
    marketAnalogy: 'Net value created/destroyed in transaction'
  },
  entropy: {
    symbol: 'ΔS',
    meaning: 'Disorder/randomness change',
    marketAnalogy: 'Information dispersal, market efficiency increase'
  },
  gibbsFreeEnergy: {
    symbol: 'ΔG = ΔH - TΔS',
    meaning: 'Spontaneity predictor',
    marketAnalogy: 'Will this trade happen naturally? ΔG < 0 = yes'
  },
  activationEnergy: {
    symbol: 'Ea',
    meaning: 'Energy barrier to reaction',
    marketAnalogy: 'Resistance/support levels, momentum needed for breakout'
  }
};

// Periodic Table Insights (condensed)
export const ELEMENT_WISDOM = {
  hydrogen: { lesson: 'Simplest, yet powers stars - small moves compound' },
  carbon: { lesson: 'Forms 4 bonds, basis of all life - connectivity is everything' },
  gold: { lesson: 'Inert, rare, valuable - store of value through ages' },
  iron: { lesson: 'Strong but rusts - strength needs protection' },
  uranium: { lesson: 'Massive potential energy - handle with extreme care' },
  helium: { lesson: 'Doesn\'t bond, rises above - sometimes non-participation wins' }
};

// Molecular Data Interface
export interface MolecularData {
  dominantBondType: keyof typeof BOND_TYPES;
  reactionPhase: keyof typeof REACTION_TYPES;
  stateOfMatter: keyof typeof STATES_OF_MATTER;
  activationEnergy: number; // 0-1, how much energy needed for change
  entropy: number; // 0-1, disorder level
  catalystPresent: boolean;
}

// Extract molecular signature
export function extractMolecularSignature(data: MolecularData): DomainSignature {
  const bond = BOND_TYPES[data.dominantBondType];
  const state = data.stateOfMatter;
  
  const isStable = bond.stability > 0.5;
  const isVolatile = state === 'gas' || state === 'plasma';
  const isFlowing = state === 'liquid';
  
  return {
    domain: 'quantum',
    quadrantProfile: {
      aggressive: isVolatile ? 0.8 : 0.3,
      defensive: isStable ? 0.7 : 0.3,
      tactical: data.catalystPresent ? 0.8 : 0.4,
      strategic: bond.stability
    },
    temporalFlow: {
      early: data.activationEnergy,
      mid: isFlowing ? 0.7 : 0.4,
      late: 1 - data.entropy
    },
    intensity: isVolatile ? 0.9 : 0.4,
    momentum: isFlowing ? 0.7 : 0.3,
    volatility: data.entropy,
    dominantFrequency: bond.stability * 100,
    harmonicResonance: 1 - data.activationEnergy,
    phaseAlignment: isStable ? Math.PI / 4 : Math.PI / 2,
    extractedAt: Date.now()
  };
}

// Generate molecular analysis from market data
export function generateMarketMolecularData(
  volatility: number,
  momentum: number,
  volume: number,
  hasNews: boolean
): MolecularData {
  // Determine bond type from market characteristics
  let dominantBondType: keyof typeof BOND_TYPES = 'covalent';
  if (volatility > 0.7) dominantBondType = 'vanDerWaals';
  else if (volatility > 0.5) dominantBondType = 'hydrogen';
  else if (Math.abs(momentum) < 0.2) dominantBondType = 'ionic';
  
  // Determine state of matter
  let stateOfMatter: keyof typeof STATES_OF_MATTER = 'solid';
  if (volatility > 0.8) stateOfMatter = 'plasma';
  else if (volatility > 0.5) stateOfMatter = 'gas';
  else if (Math.abs(momentum) > 0.3) stateOfMatter = 'liquid';
  
  // Determine reaction phase
  let reactionPhase: keyof typeof REACTION_TYPES = 'synthesis';
  if (momentum < -0.5) reactionPhase = 'combustion';
  else if (momentum < 0) reactionPhase = 'decomposition';
  else if (Math.abs(momentum) < 0.1) reactionPhase = 'doubleReplacement';
  
  return {
    dominantBondType,
    reactionPhase,
    stateOfMatter,
    activationEnergy: 1 - volume,
    entropy: volatility,
    catalystPresent: hasNews
  };
}

export const molecularAdapter = {
  domain: 'quantum' as const,
  name: 'Molecular Chemistry',
  version: '1.0.0',
  
  bondTypes: BOND_TYPES,
  reactionTypes: REACTION_TYPES,
  statesOfMatter: STATES_OF_MATTER,
  molecularGeometry: MOLECULAR_GEOMETRY,
  thermodynamics: THERMODYNAMICS,
  elementWisdom: ELEMENT_WISDOM,
  
  extractSignature: extractMolecularSignature,
  generateMarketData: generateMarketMolecularData,
  
  philosophy: `
    The word "bond" in finance is no accident. Chemical bonds and financial bonds
    both represent stored potential energy, contractual stability, and the capacity
    for transformation under sufficient force.
    
    When a chemical bond breaks, energy is released or absorbed. When a financial
    bond defaults, value is released or absorbed. The mathematics are the same.
    
    Understanding molecular chemistry gives us insight into market phase transitions -
    why consolidation (solid) suddenly becomes trend (liquid) becomes mania (gas).
    The answer is always: energy input and entropy change.
  `
};
