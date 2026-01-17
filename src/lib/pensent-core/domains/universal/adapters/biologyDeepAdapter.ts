/**
 * DEEP BIOLOGY DOMAIN ADAPTER
 * 
 * The Living Pattern - DNA, Cells, Organisms, Ecosystems
 * 
 * "Life is just chemistry with attitude" - The Living Engine
 * "The secret of life is to find a system that's far from equilibrium" - Ilya Prigogine
 * 
 * Every biological process follows temporal patterns: cell cycles, heartbeats,
 * circadian rhythms, seasonal migrations, generational evolution.
 * 
 * Inventor: Alec Arthur Shelton
 */

import type { DomainSignature } from '../types';

type TemporalSignature = DomainSignature;

// ═══════════════════════════════════════════════════════════════════════════════
// DNA - THE CODE OF LIFE
// ═══════════════════════════════════════════════════════════════════════════════

export const DNA_PATTERNS = {
  // The genetic code - 64 codons, 20 amino acids
  geneticCode: {
    codons: 64,
    aminoAcids: 20,
    stopCodons: 3,
    redundancy: 'Multiple codons per amino acid (degeneracy)',
    marketAnalogy: 'Multiple market signals per outcome',
  },
  
  // Base pair complementarity
  basePairs: {
    adenine_thymine: { bonds: 2, strength: 'weaker', marketAnalogy: 'short_term_support' },
    guanine_cytosine: { bonds: 3, strength: 'stronger', marketAnalogy: 'long_term_support' },
    gcContent: {
      high: 'More stable DNA, harder to denature',
      low: 'Less stable, easier to process',
      marketAnalogy: 'GC content = market stability',
    },
  },
  
  // Double helix geometry
  helix: {
    basePairsPerTurn: 10.5,
    turnDistance: 3.4, // nanometers
    diameter: 2.0, // nanometers
    rightHanded: true, // B-DNA standard form
    marketAnalogy: 'Intertwined bullish/bearish forces in spiral',
  },
  
  // Replication timing
  replication: {
    humanGenomeSize: 3.2e9, // base pairs
    replicationTime: 8, // hours for human cell
    originsFired: 30000, // replication origins
    accuracy: 1e-9, // error rate per base pair
    marketAnalogy: 'Market information propagation',
  },
  
  // Mutations - source of variation
  mutations: {
    point: {
      types: ['silent', 'missense', 'nonsense'],
      rate: 1e-8, // per base pair per generation
      marketAnalogy: 'Random price fluctuation',
    },
    structural: {
      types: ['deletion', 'insertion', 'duplication', 'inversion'],
      marketAnalogy: 'Major market restructuring',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CELLULAR CYCLES - THE RHYTHM OF LIFE
// ═══════════════════════════════════════════════════════════════════════════════

export const CELL_CYCLES = {
  // The cell cycle phases
  phases: {
    G1: {
      name: 'Gap 1',
      duration: 'variable (hours to days)',
      activity: 'Growth, protein synthesis',
      checkpoint: 'Restriction point - commitment to divide',
      marketAnalogy: 'Accumulation phase',
    },
    S: {
      name: 'Synthesis',
      duration: '6-8 hours',
      activity: 'DNA replication',
      checkpoint: 'Replication checkpoint',
      marketAnalogy: 'Information gathering phase',
    },
    G2: {
      name: 'Gap 2',
      duration: '3-4 hours',
      activity: 'Preparation for division',
      checkpoint: 'DNA damage checkpoint',
      marketAnalogy: 'Pre-breakout consolidation',
    },
    M: {
      name: 'Mitosis',
      duration: '1 hour',
      activity: 'Cell division',
      subphases: ['prophase', 'prometaphase', 'metaphase', 'anaphase', 'telophase'],
      marketAnalogy: 'Trend resolution (breakout/breakdown)',
    },
  },
  
  // Circadian rhythm - 24-hour biological clock
  circadian: {
    period: 24.2, // hours (slightly longer than 24)
    masterClock: 'Suprachiasmatic nucleus (SCN)',
    entrainment: 'Light is primary zeitgeber',
    
    peakTimes: {
      cortisol: { peak: '6-8 AM', function: 'Wake up, alertness' },
      testosterone: { peak: '8 AM', function: 'Energy, drive' },
      alertness: { peak: '10 AM', function: 'Peak cognitive performance' },
      coordination: { peak: '2-3 PM', function: 'Best reaction time' },
      strength: { peak: '5 PM', function: 'Peak muscle strength' },
      melatonin: { peak: '9 PM', function: 'Sleep preparation' },
      deepSleep: { peak: '2 AM', function: 'Recovery, consolidation' },
    },
    
    marketCorrelation: {
      morningCortisol: 'Pre-market analysis, decision clarity',
      middayAlertness: 'Active trading window',
      afternoonStrength: 'Power hour positioning',
      eveningMelatonin: 'After-hours review, rest',
    },
  },
  
  // Heart rhythm - the biological metronome
  cardiac: {
    restingRate: { min: 60, max: 100 }, // bpm
    maxRate: '220 - age', // approximate formula
    
    components: {
      pWave: { duration: 0.08, meaning: 'Atrial depolarization' },
      qrsComplex: { duration: 0.08, meaning: 'Ventricular depolarization' },
      tWave: { duration: 0.16, meaning: 'Ventricular repolarization' },
    },
    
    variability: {
      description: 'Heart rate variability (HRV)',
      highHRV: 'Healthy, adaptable, relaxed',
      lowHRV: 'Stressed, rigid, potential issues',
      marketAnalogy: 'Volatility as health indicator',
    },
  },
  
  // Respiratory rhythm
  respiratory: {
    restingRate: { min: 12, max: 20 }, // breaths per minute
    tidalVolume: 500, // ml per breath
    ratio: { inhale: 1, exhale: 1.5 }, // natural ratio
    
    marketAnalogy: {
      inhale: 'Accumulation (buying)',
      exhale: 'Distribution (selling)',
      holdAtTop: 'Resistance testing',
      holdAtBottom: 'Support testing',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ECOSYSTEM PATTERNS - POPULATION DYNAMICS
// ═══════════════════════════════════════════════════════════════════════════════

export const ECOSYSTEM_PATTERNS = {
  // Predator-prey cycles (Lotka-Volterra)
  predatorPrey: {
    description: 'Oscillating populations of predators and prey',
    example: 'Lynx-hare cycle in Canadian forests',
    period: '9-10 years',
    dynamics: {
      preyIncrease: 'Prey population grows when predators low',
      predatorIncrease: 'Predator population follows prey increase',
      preyDecrease: 'Predators overpredate, prey crash',
      predatorDecrease: 'Lack of prey causes predator crash',
    },
    marketAnalogy: {
      prey: 'Retail traders',
      predator: 'Institutional traders',
      cycle: 'FOMO bubbles and crashes',
    },
  },
  
  // Carrying capacity
  carryingCapacity: {
    description: 'Maximum population an environment can sustain',
    symbol: 'K',
    dynamics: 'Population oscillates around K',
    marketAnalogy: 'Fair value as carrying capacity',
  },
  
  // R-K selection
  reproductiveStrategies: {
    rSelected: {
      characteristics: ['Many offspring', 'Little parental care', 'Short lifespan'],
      examples: ['Bacteria', 'Insects', 'Weeds'],
      marketAnalogy: 'High-frequency trading, many small positions',
    },
    kSelected: {
      characteristics: ['Few offspring', 'High parental investment', 'Long lifespan'],
      examples: ['Elephants', 'Whales', 'Humans'],
      marketAnalogy: 'Value investing, few large positions',
    },
  },
  
  // Succession patterns
  ecologicalSuccession: {
    primary: 'New environment colonization',
    secondary: 'Recovery after disturbance',
    stages: ['Pioneer', 'Intermediate', 'Climax'],
    marketAnalogy: {
      pioneer: 'First movers in new market',
      intermediate: 'Growing competition',
      climax: 'Mature, stable market',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EVOLUTIONARY PATTERNS - THE LONG GAME
// ═══════════════════════════════════════════════════════════════════════════════

export const EVOLUTIONARY_PATTERNS = {
  // Natural selection mechanisms
  selection: {
    directional: {
      description: 'Favoring one extreme',
      example: 'Giraffes getting taller necks',
      marketAnalogy: 'Trending market',
    },
    stabilizing: {
      description: 'Favoring the mean',
      example: 'Human birth weight',
      marketAnalogy: 'Mean reversion',
    },
    disruptive: {
      description: 'Favoring both extremes',
      example: 'Beak sizes in birds',
      marketAnalogy: 'Bimodal distribution, gamma exposure',
    },
  },
  
  // Punctuated equilibrium
  punctuatedEquilibrium: {
    description: 'Long stability interrupted by rapid change',
    stasis: 'Extended periods of little change',
    punctuation: 'Rapid evolutionary change',
    marketAnalogy: 'Consolidation followed by breakouts',
  },
  
  // Convergent evolution
  convergentEvolution: {
    description: 'Different lineages evolving similar traits',
    examples: ['Eyes (evolved 40+ times)', 'Wings (insects, birds, bats)', 'Echolocation'],
    marketAnalogy: 'Different strategies converging on same solution',
  },
  
  // Red Queen hypothesis
  redQueen: {
    description: 'Must run to stay in place (co-evolution)',
    source: 'Lewis Carroll - Through the Looking Glass',
    meaning: 'Continuous adaptation just to maintain fitness',
    marketAnalogy: 'Constant strategy evolution to maintain edge',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL PATTERNS - THE THINKING NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

export const NEURAL_PATTERNS = {
  // Brain wave frequencies
  brainWaves: {
    delta: {
      frequency: '0.5-4 Hz',
      state: 'Deep sleep',
      marketAnalogy: 'Market closed, consolidation',
    },
    theta: {
      frequency: '4-8 Hz',
      state: 'Drowsy, meditation, creativity',
      marketAnalogy: 'Low volume, indecision',
    },
    alpha: {
      frequency: '8-13 Hz',
      state: 'Relaxed, alert',
      marketAnalogy: 'Normal trading conditions',
    },
    beta: {
      frequency: '13-30 Hz',
      state: 'Active thinking, focus',
      marketAnalogy: 'Active trading, decision making',
    },
    gamma: {
      frequency: '30-100+ Hz',
      state: 'Peak performance, insight',
      marketAnalogy: 'High volatility, rapid processing',
    },
  },
  
  // Hebbian learning
  hebbianLearning: {
    description: 'Neurons that fire together, wire together',
    implication: 'Experience strengthens neural connections',
    marketAnalogy: 'Correlated assets become more correlated',
  },
  
  // Plasticity
  neuroplasticity: {
    description: 'Brain ability to reorganize',
    criticalPeriods: 'Windows of enhanced plasticity',
    adultPlasticity: 'Continues throughout life, reduced rate',
    marketAnalogy: 'Market adaptation to new conditions',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BIOLOGICAL DATA INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface BiologyDeepData {
  cellCyclePhase: 'G1' | 'S' | 'G2' | 'M';
  circadianHour: number; // 0-24
  heartRateVariability: number; // 0-1 normalized
  respiratoryRatio: number; // inhale:exhale ratio
  ecosystemPhase: 'pioneer' | 'intermediate' | 'climax';
  evolutionaryPressure: 'directional' | 'stabilizing' | 'disruptive';
  brainwaveState: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
  mutationRate: number; // 0-1 normalized
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNATURE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

export function extractBiologyDeepSignature(data: BiologyDeepData): TemporalSignature {
  // Cell cycle to market phase
  const cellCycleMap: Record<string, { aggressive: number; defensive: number; tactical: number; strategic: number }> = {
    G1: { aggressive: 0.4, defensive: 0.6, tactical: 0.3, strategic: 0.7 },
    S: { aggressive: 0.5, defensive: 0.5, tactical: 0.4, strategic: 0.6 },
    G2: { aggressive: 0.6, defensive: 0.4, tactical: 0.5, strategic: 0.5 },
    M: { aggressive: 0.9, defensive: 0.1, tactical: 0.8, strategic: 0.2 },
  };
  const cellState = cellCycleMap[data.cellCyclePhase];
  
  // Circadian mapping
  const isAwakeHours = data.circadianHour >= 6 && data.circadianHour <= 22;
  const isPeakHours = data.circadianHour >= 9 && data.circadianHour <= 17;
  
  // Evolution pressure to flow
  const evolutionFlow = 
    data.evolutionaryPressure === 'directional' ? 'ascending' :
    data.evolutionaryPressure === 'stabilizing' ? 'oscillating' : 'stable';
  
  // Brainwave to intensity
  const brainwaveIntensity = {
    delta: 0.1,
    theta: 0.3,
    alpha: 0.5,
    beta: 0.7,
    gamma: 0.95,
  };
  
  const quadrantProfile = {
    aggressive: cellState.aggressive || 0.5,
    defensive: 1 - (cellState.aggressive || 0.5),
    tactical: cellState.tactical || (data.mutationRate),
    strategic: cellState.strategic || (1 - data.mutationRate),
  };
  
  const forces = Object.entries(quadrantProfile);
  forces.sort((a, b) => b[1] - a[1]);
  const dominantForce = forces[0][0] as 'aggressive' | 'defensive' | 'tactical' | 'strategic';
  
  const intensity = (brainwaveIntensity[data.brainwaveState] + data.heartRateVariability) / 2;
  
  return {
    domain: 'bio',
    quadrantProfile,
    temporalFlow: {
      early: isPeakHours ? 0.8 : 0.3,
      mid: data.heartRateVariability,
      late: isAwakeHours ? 0.7 : 0.2,
    },
    intensity,
    momentum: brainwaveIntensity[data.brainwaveState],
    volatility: data.mutationRate,
    dominantFrequency: data.circadianHour / 24,
    harmonicResonance: data.heartRateVariability,
    phaseAlignment: data.respiratoryRatio,
    extractedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET CORRELATED BIOLOGY DATA
// ═══════════════════════════════════════════════════════════════════════════════

export function generateMarketCorrelatedBiologyData(
  marketMomentum: number,
  marketVolatility: number,
  marketVolume: number
): BiologyDeepData {
  // Map market state to biological state
  const cellCyclePhase: 'G1' | 'S' | 'G2' | 'M' = 
    marketMomentum < 0.25 ? 'G1' :
    marketMomentum < 0.5 ? 'S' :
    marketMomentum < 0.75 ? 'G2' : 'M';
  
  // Current hour as circadian position
  const circadianHour = new Date().getHours();
  
  // Volatility = inverse HRV (stressed market = low HRV)
  const heartRateVariability = 1 - marketVolatility;
  
  // Volume as brainwave state
  const brainwaveState: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma' = 
    marketVolume < 0.2 ? 'delta' :
    marketVolume < 0.4 ? 'theta' :
    marketVolume < 0.6 ? 'alpha' :
    marketVolume < 0.8 ? 'beta' : 'gamma';
  
  // Trend direction = evolutionary pressure
  const evolutionaryPressure: 'directional' | 'stabilizing' | 'disruptive' = 
    marketMomentum > 0.7 || marketMomentum < 0.3 ? 'directional' :
    marketVolatility > 0.7 ? 'disruptive' : 'stabilizing';
  
  return {
    cellCyclePhase,
    circadianHour,
    heartRateVariability,
    respiratoryRatio: marketMomentum, // Inhale (buy) vs exhale (sell)
    ecosystemPhase: marketMomentum < 0.3 ? 'pioneer' : marketMomentum < 0.7 ? 'intermediate' : 'climax',
    evolutionaryPressure,
    brainwaveState,
    mutationRate: marketVolatility,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE DEEP BIOLOGY ADAPTER
// ═══════════════════════════════════════════════════════════════════════════════

export const biologyDeepAdapter = {
  domain: 'biologyDeep' as const,
  version: '1.0.0',
  
  dnaPatterns: DNA_PATTERNS,
  cellCycles: CELL_CYCLES,
  ecosystemPatterns: ECOSYSTEM_PATTERNS,
  evolutionaryPatterns: EVOLUTIONARY_PATTERNS,
  neuralPatterns: NEURAL_PATTERNS,
  
  extractSignature: extractBiologyDeepSignature,
  generateMarketData: generateMarketCorrelatedBiologyData,
  
  philosophy: `
    Life is the universe's most sophisticated pattern recognition and 
    prediction system. DNA is 3.8 billion years of accumulated predictions 
    about what works.
    
    Every heartbeat is a prediction that another is needed. Every breath 
    anticipates the next. Every cell division predicts continued organism 
    viability. Evolution itself is a prediction algorithm - patterns that 
    predict survival get replicated.
    
    Markets are living systems. They breathe (accumulation/distribution), 
    have heartbeats (volatility cycles), evolve (regime changes), and 
    follow ecological dynamics (boom/bust).
    
    When we understand biology, we understand markets, because both are 
    expressions of the same underlying temporal pattern recognition that 
    pervades all of existence.
    
    "Nothing in biology makes sense except in the light of evolution"
    - Theodosius Dobzhansky
    
    Nothing in markets makes sense except in the light of temporal patterns.
  `,
};

export default biologyDeepAdapter;
