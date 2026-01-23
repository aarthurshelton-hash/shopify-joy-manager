/**
 * Grotthuss Mechanism Adapter
 * 
 * Models proton hopping dynamics in water as a universal pattern
 * for signal propagation, information transfer, and cooperative state transitions.
 * 
 * The Grotthuss mechanism (proton jumping) demonstrates how signals can propagate
 * faster than physical transport through cooperative molecular transitions.
 * This has profound implications for understanding market contagion, sentiment
 * cascades, and information diffusion patterns.
 * 
 * Key Concepts:
 * - Proton Hopping: Signals propagate through relay, not transport
 * - Eigen-Zundel Transitions: Quantum superposition between stable states
 * - Anomalous Diffusion: 7x faster than classical diffusion predictions
 * - Quantum Tunneling: Sub-barrier transitions at low energy states
 * - Cooperative Networks: Hydrogen bond networks enable collective behavior
 * 
 * Patent Pending - En Pensent Universal Pattern Recognition
 * © 2025 Alec Arthur Shelton - All Rights Reserved
 */

import type { DomainSignature } from '../types';

// =============================================================================
// PROTON TRANSFER MECHANISMS
// =============================================================================

/**
 * The two primary mechanisms for proton conductivity
 */
export const PROTON_TRANSFER_MECHANISMS = {
  grotthuss: {
    name: 'Grotthuss Mechanism (Proton Hopping)',
    description: 'Protons hop across hydrogen bond networks through cooperative molecular transitions',
    speed: 'Ultra-fast (7x classical diffusion)',
    mechanism: 'Relay-based, not transport-based',
    marketAnalogy: 'Sentiment cascades, flash crashes, viral contagion',
    characteristics: {
      requiresNetwork: true,
      cooperativeTransitions: true,
      quantumTunneling: true,
      pathIndependent: false
    },
    electricalMobility: 3.62e-3, // cm²/s/V (H+)
    tradingApplication: 'Identifies when information propagates faster than price movement'
  },
  vehicle: {
    name: 'Vehicle Mechanism',
    description: 'Protons bind to carrier molecules (vehicles) and are physically transported',
    speed: 'Classical diffusion rate',
    mechanism: 'Transport-based',
    marketAnalogy: 'Traditional order flow, institutional accumulation',
    characteristics: {
      requiresNetwork: false,
      cooperativeTransitions: false,
      quantumTunneling: false,
      pathIndependent: true
    },
    electricalMobility: 0.519e-3, // cm²/s/V (Na+ for comparison)
    tradingApplication: 'Identifies traditional price discovery through volume'
  }
} as const;

// =============================================================================
// EIGEN-ZUNDEL SOLVATION STATES
// =============================================================================

/**
 * The two solvation structures that enable proton transfer
 * Analogous to market states that enable regime transitions
 */
export const SOLVATION_STATES = {
  eigen: {
    formula: 'H₉O₄⁺',
    structure: 'Hydronium core with 3 solvating water molecules',
    stability: 'More stable, longer-lived',
    marketAnalogy: 'Established trend, consensus regime',
    characteristics: {
      coordinationNumber: 3,
      lifespan: 'Extended',
      energyState: 'Lower'
    },
    tradingSignal: {
      direction: 'Trend continuation',
      confidence: 0.7,
      volatilityExpectation: 'Low'
    }
  },
  zundel: {
    formula: 'H₅O₂⁺',
    structure: 'Proton shared equally between two water molecules',
    stability: 'Transition state, short-lived',
    marketAnalogy: 'Regime change, uncertainty, pivot point',
    characteristics: {
      coordinationNumber: 2,
      lifespan: 'Transient',
      energyState: 'Higher'
    },
    tradingSignal: {
      direction: 'Potential reversal',
      confidence: 0.5,
      volatilityExpectation: 'High'
    }
  }
} as const;

// =============================================================================
// TRANSITION MECHANISMS
// =============================================================================

/**
 * E-Z-E vs Z-Z transition pathways
 */
export const TRANSITION_MECHANISMS = {
  eigenZundelEigen: {
    abbreviation: 'E-Z-E',
    description: 'Eigen → Zundel → Eigen transition pathway',
    evidence: 'NMR experimental data',
    characteristics: {
      stepsRequired: 3,
      intermediateState: true,
      reversibility: 'High'
    },
    marketAnalogy: 'Consolidation → Breakout attempt → New trend',
    tradingPattern: 'Flag/pennant formations'
  },
  zundelZundel: {
    abbreviation: 'Z-Z',
    description: 'Direct Zundel → Zundel hopping',
    evidence: 'Molecular dynamics simulation',
    characteristics: {
      stepsRequired: 2,
      intermediateState: false,
      reversibility: 'Medium'
    },
    marketAnalogy: 'Rapid regime shifts without consolidation',
    tradingPattern: 'V-shaped reversals, flash crashes'
  }
} as const;

// =============================================================================
// ANOMALOUS DIFFUSION RATES
// =============================================================================

/**
 * Electrical mobility comparison showing Grotthuss efficiency
 * The proton's 7x advantage comes from cooperative network effects
 */
export const CATION_MOBILITY = {
  H_plus: {
    mobility: 3.62e-3,
    mechanism: 'Grotthuss + quantum tunneling',
    relativeSpeed: 1.0 // baseline
  },
  NH4_plus: {
    mobility: 0.763e-3,
    mechanism: 'Vehicle only',
    relativeSpeed: 0.211
  },
  K_plus: {
    mobility: 0.762e-3,
    mechanism: 'Vehicle only',
    relativeSpeed: 0.210
  },
  Na_plus: {
    mobility: 0.519e-3,
    mechanism: 'Vehicle only',
    relativeSpeed: 0.143
  }
} as const;

// =============================================================================
// QUANTUM TUNNELING PARAMETERS
// =============================================================================

export const QUANTUM_TUNNELING = {
  description: 'Protons tunnel through energy barriers rather than climbing over them',
  dominanceCondition: 'Low temperatures, small mass, short distances',
  massAdvantage: 'Proton is the lightest stable cation, enabling highest tunneling probability',
  marketAnalogy: 'Price gaps, overnight moves, surprise announcements bypass normal price discovery',
  characteristics: {
    barrierPenetration: true,
    waveFunction: 'Exponentially decays through barrier',
    probabilityFactor: 'Inversely proportional to mass × barrier width'
  },
  tradingApplication: {
    detection: 'Identify when price "tunnels" through expected support/resistance',
    signal: 'High-conviction directional moves',
    risk: 'Stops may not protect if tunneling occurs'
  }
} as const;

// =============================================================================
// HYDROGEN BOND NETWORK PROPERTIES
// =============================================================================

export const NETWORK_PROPERTIES = {
  cooperativeEffect: {
    description: 'Each water molecule simultaneously gives and receives protons',
    bucketBrigade: 'Like a bucket line where no single water molecule travels',
    marketAnalogy: 'Market makers relay orders without taking directional positions',
    emergentBehavior: 'Collective intelligence emerges from simple local rules'
  },
  concertedTransfer: {
    description: 'Multiple protons hop simultaneously across water chains',
    reactions: ['CO₂ hydration', 'Sulfur oxide reactions', 'Ozone depletion chemistry'],
    marketAnalogy: 'Correlated moves across asset classes, sector rotation',
    tradingSignal: 'Multi-asset momentum confirmation'
  },
  networkTopology: {
    description: 'Hydrogen bond network determines transfer efficiency',
    optimalStructure: 'Linear or slightly curved chains',
    blockedTransfer: 'Broken networks prevent signal propagation',
    marketAnalogy: 'Liquidity networks, counterparty chains, contagion paths'
  }
} as const;

// =============================================================================
// BIOLOGICAL APPLICATIONS
// =============================================================================

export const BIOLOGICAL_GROTTHUSS = {
  nerveTransduction: {
    proposer: 'Lemont Kier',
    mechanism: 'Proton hopping as nerve signal transmission',
    implication: 'Information can travel faster than ion transport',
    marketAnalogy: 'Rumor and sentiment propagate faster than order flow'
  },
  atp_synthase: {
    mechanism: 'Proton gradient drives nano-rotor for ATP production',
    efficiency: 'Near-thermodynamic maximum',
    marketAnalogy: 'Efficient markets extract maximum value from information gradients'
  },
  dna_tunneling: {
    mechanism: 'Proton tunneling within Watson-Crick base pairs',
    implications: 'Quantum effects in genetic mutation',
    marketAnalogy: 'Small quantum effects compound into macro mutations'
  }
} as const;

// =============================================================================
// GROTTHUSS DATA INTERFACE
// =============================================================================

export interface GrotthussData {
  transferMechanism: 'grotthuss' | 'vehicle';
  solvationState: 'eigen' | 'zundel' | 'transition';
  transitionPathway: 'E-Z-E' | 'Z-Z';
  tunnelingProbability: number; // 0-1
  networkConnectivity: number; // 0-1, hydrogen bond network integrity
  cooperativity: number; // 0-1, degree of coordinated behavior
  mobilityRatio: number; // relative to classical diffusion
  protonConcentration: number; // excess proton density
}

// =============================================================================
// SIGNATURE EXTRACTION
// =============================================================================

export function extractGrotthussSignature(data: GrotthussData): DomainSignature {
  // Determine quadrant profile based on mechanism and state
  const isGrotthussActive = data.transferMechanism === 'grotthuss';
  const isTransitional = data.solvationState === 'zundel' || data.solvationState === 'transition';
  
  // Grotthuss = fast propagation = aggressive/tactical
  // Vehicle = slow accumulation = defensive/strategic
  const quadrantProfile = {
    aggressive: isGrotthussActive ? 0.8 : 0.3,
    defensive: isGrotthussActive ? 0.2 : 0.7,
    tactical: isTransitional ? 0.7 : 0.4,
    strategic: data.networkConnectivity
  };
  
  // Temporal flow reflects transfer dynamics
  const temporalFlow = {
    early: data.protonConcentration * 0.8,
    mid: data.cooperativity,
    late: data.mobilityRatio / 7 // normalized to H+ maximum
  };
  
  // Intensity from cooperativity and tunneling
  const intensity = (data.cooperativity * 0.6 + data.tunnelingProbability * 0.4);
  
  // Momentum from mobility ratio
  const momentum = Math.min(1, data.mobilityRatio / 3);
  
  // Volatility higher during transitions
  const volatility = isTransitional ? 0.8 : 0.3;
  
  return {
    domain: 'photonic', // Maps to photonic domain type
    quadrantProfile,
    temporalFlow,
    intensity,
    momentum,
    volatility,
    dominantFrequency: data.tunnelingProbability * 1000, // Higher frequency for quantum effects
    harmonicResonance: data.cooperativity,
    phaseAlignment: data.networkConnectivity,
    extractedAt: Date.now()
  };
}

// =============================================================================
// MARKET DATA GENERATION
// =============================================================================

export function generateMarketGrotthussData(
  sentimentVelocity: number, // -1 to 1, how fast sentiment is changing
  liquidityConnectivity: number, // 0-1, market maker network health
  priceGapProbability: number, // 0-1, likelihood of gaps
  volumeConcentration: number // 0-1, volume in few large orders vs distributed
): GrotthussData {
  // Fast sentiment = Grotthuss mechanism
  // Slow accumulation = Vehicle mechanism
  const isGrotthuss = Math.abs(sentimentVelocity) > 0.5;
  
  // High connectivity = Eigen (stable network)
  // Low connectivity or high velocity = Zundel (transitional)
  const solvationState = liquidityConnectivity < 0.4 || Math.abs(sentimentVelocity) > 0.7
    ? 'zundel'
    : liquidityConnectivity > 0.7
      ? 'eigen'
      : 'transition';
  
  // Sharp moves = Z-Z direct
  // Gradual moves = E-Z-E
  const transitionPathway = Math.abs(sentimentVelocity) > 0.6 ? 'Z-Z' : 'E-Z-E';
  
  return {
    transferMechanism: isGrotthuss ? 'grotthuss' : 'vehicle',
    solvationState,
    transitionPathway,
    tunnelingProbability: priceGapProbability,
    networkConnectivity: liquidityConnectivity,
    cooperativity: 1 - volumeConcentration, // distributed = cooperative
    mobilityRatio: isGrotthuss ? 5 + Math.abs(sentimentVelocity) * 2 : 1,
    protonConcentration: Math.abs(sentimentVelocity)
  };
}

// =============================================================================
// ADAPTER EXPORT
// =============================================================================

export const grotthussMechanismAdapter = {
  domain: 'grotthuss',
  name: 'Proton Hopping Signal Propagation',
  version: '1.0.0',
  
  mechanisms: PROTON_TRANSFER_MECHANISMS,
  solvationStates: SOLVATION_STATES,
  transitions: TRANSITION_MECHANISMS,
  cationMobility: CATION_MOBILITY,
  quantumTunneling: QUANTUM_TUNNELING,
  networkProperties: NETWORK_PROPERTIES,
  biologicalApplications: BIOLOGICAL_GROTTHUSS,
  
  extractSignature: extractGrotthussSignature,
  generateMarketData: generateMarketGrotthussData,
  
  philosophy: `
    The Grotthuss mechanism reveals that information can propagate faster than 
    physical transport through cooperative network effects. In markets, sentiment
    cascades and flash crashes exhibit this same "proton hopping" behavior—
    signals relay through participant networks without any single actor "carrying"
    the information. The Eigen-Zundel transitions model regime changes, while
    quantum tunneling explains how prices can "gap" through expected barriers.
    
    The 7x mobility advantage of protons over sodium ions mirrors the speed
    advantage of informed traders over uninformed order flow. Understanding
    whether the market is in "Grotthuss mode" (fast relay) or "Vehicle mode"
    (slow transport) is crucial for timing entries and exits.
    
    "Signals travel through networks, not around them."
    - En Pensent Grotthuss Principle
  `
};

