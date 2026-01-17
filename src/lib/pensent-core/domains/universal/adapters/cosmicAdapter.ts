/**
 * COSMIC DOMAIN ADAPTER
 * 
 * Universal Patterns in the Stars - Astronomy, Cosmology, Celestial Mechanics
 * 
 * "As above, so below; as below, so above" - The Emerald Tablet
 * "The cosmos is within us. We are made of star-stuff." - Carl Sagan
 * 
 * The same patterns that govern planetary orbits govern market cycles.
 * The same forces that shape galaxies shape human behavior.
 * 
 * Inventor: Alec Arthur Shelton
 */

import type { UniversalSignal } from '../types';

type TemporalSignature = UniversalSignal['signature'];

// ═══════════════════════════════════════════════════════════════════════════════
// CELESTIAL CYCLES - THE COSMIC CLOCK
// ═══════════════════════════════════════════════════════════════════════════════

export const CELESTIAL_CYCLES = {
  // Earth's rotation - The fundamental human cycle
  diurnal: {
    period: 86400, // seconds
    periodDays: 1,
    significance: 'Basic unit of human activity',
    marketCorrelation: 'Intraday trading patterns',
    phases: {
      dawn: { hours: [5, 8], marketPhase: 'pre_market_anticipation' },
      morning: { hours: [8, 12], marketPhase: 'opening_momentum' },
      midday: { hours: [12, 14], marketPhase: 'lunch_consolidation' },
      afternoon: { hours: [14, 16], marketPhase: 'afternoon_trend' },
      dusk: { hours: [16, 20], marketPhase: 'closing_volatility' },
      night: { hours: [20, 5], marketPhase: 'after_hours_drift' },
    },
  },
  
  // Lunar cycle - Emotional and tidal influences
  lunar: {
    period: 2551443, // seconds (29.53 days)
    periodDays: 29.53,
    significance: 'Governs tides, biology, and human emotions',
    marketCorrelation: 'Monthly sentiment cycles',
    phases: {
      newMoon: { dayRange: [0, 3.7], marketBias: 'new_beginnings', sentiment: 0.5 },
      waxingCrescent: { dayRange: [3.7, 7.4], marketBias: 'building_momentum', sentiment: 0.6 },
      firstQuarter: { dayRange: [7.4, 11.1], marketBias: 'decisive_action', sentiment: 0.7 },
      waxingGibbous: { dayRange: [11.1, 14.8], marketBias: 'approaching_peak', sentiment: 0.8 },
      fullMoon: { dayRange: [14.8, 18.5], marketBias: 'maximum_emotion', sentiment: 0.9 },
      waningGibbous: { dayRange: [18.5, 22.1], marketBias: 'profit_taking', sentiment: 0.7 },
      lastQuarter: { dayRange: [22.1, 25.8], marketBias: 'reassessment', sentiment: 0.5 },
      waningCrescent: { dayRange: [25.8, 29.53], marketBias: 'preparation', sentiment: 0.4 },
    },
    // Studies show full moon correlates with market volatility
    fullMoonEffect: 'Higher volatility, more emotional trading',
  },
  
  // Solar year - Seasonal economic cycles
  annual: {
    period: 31557600, // seconds (365.25 days)
    periodDays: 365.25,
    significance: 'Agricultural, fiscal, and seasonal cycles',
    marketCorrelation: 'Seasonal market patterns',
    patterns: {
      januaryEffect: 'Small caps outperform in January',
      sellInMay: 'Historically weaker summer months',
      summerDoldrums: 'Lower volume, less volatility',
      autumnVolatility: 'October crashes, September weakness',
      santaRally: 'Year-end optimism and tax positioning',
    },
  },
  
  // Sunspot cycle - Solar activity impact
  solar: {
    period: 347155200, // seconds (~11 years)
    periodYears: 11,
    significance: 'Affects Earth climate, technology, and possibly behavior',
    marketCorrelation: 'Long-term economic cycles',
    currentCycle: 25, // Started December 2019
    phases: {
      solarMinimum: { activity: 'low', marketTendency: 'consolidation' },
      ascending: { activity: 'increasing', marketTendency: 'bull_market' },
      solarMaximum: { activity: 'peak', marketTendency: 'volatility_spike' },
      descending: { activity: 'decreasing', marketTendency: 'correction' },
    },
    // Correlation with economic downturns during solar max
    historicalEvents: {
      '1929': 'Solar max, Great Depression',
      '2000': 'Solar max, Dot-com crash',
      '2008': 'Near solar min, Financial crisis',
    },
  },
  
  // Planetary alignments - Gravitational harmonics
  planetary: {
    jupiterSaturn: {
      period: 631152000, // seconds (~20 years)
      periodYears: 20,
      significance: 'Great Conjunction - major economic shifts',
      historicalCorrelation: 'Recession markers',
    },
    venus: {
      synodicPeriod: 584, // days
      significance: 'Beauty, value, harmony cycles',
      pentagramPattern: '5 conjunctions form perfect pentagram in 8 years',
    },
    mars: {
      synodicPeriod: 780, // days
      significance: 'Conflict, energy, action cycles',
      marketCorrelation: 'Commodity price spikes',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STELLAR PATTERNS - LIFE CYCLES OF STARS
// ═══════════════════════════════════════════════════════════════════════════════

export const STELLAR_PATTERNS = {
  // Main sequence - Stable hydrogen burning
  mainSequence: {
    phase: 'stable_core_fusion',
    duration: 'billions of years',
    marketAnalogy: 'Long-term bull market',
    characteristics: 'Steady growth, predictable output',
    archetype: 'The Steady Builder',
  },
  
  // Red giant - Expansion phase
  redGiant: {
    phase: 'helium_shell_burning',
    duration: 'millions of years',
    marketAnalogy: 'Bubble expansion',
    characteristics: 'Rapid growth, increasing instability',
    archetype: 'The Inflater',
  },
  
  // Supernova - Explosive transformation
  supernova: {
    phase: 'core_collapse',
    duration: 'seconds to weeks',
    marketAnalogy: 'Market crash',
    characteristics: 'Sudden release, paradigm destruction',
    archetype: 'The Destroyer-Creator',
    typeIa: {
      trigger: 'White dwarf accreting matter',
      standardCandle: true,
      marketAnalogy: 'Predictable crisis from known buildup',
    },
    typeII: {
      trigger: 'Massive star core collapse',
      standardCandle: false,
      marketAnalogy: 'Unpredictable crisis from hidden instability',
    },
  },
  
  // Neutron star - Dense remnant
  neutronStar: {
    phase: 'degenerate_matter',
    duration: 'eternal (effectively)',
    marketAnalogy: 'Post-crisis consolidation',
    characteristics: 'Extreme density, rapid rotation',
    pulsars: {
      description: 'Rotating neutron stars with radio emission',
      precision: 'More accurate than atomic clocks',
      marketAnalogy: 'Reliable timing signals in market chaos',
    },
  },
  
  // Black hole - Ultimate attractor
  blackHole: {
    phase: 'singularity',
    duration: 'eternal (with Hawking radiation decay)',
    marketAnalogy: 'Institutional accumulation',
    characteristics: 'Irresistible attraction, event horizon',
    eventHorizon: {
      description: 'Point of no return',
      marketAnalogy: 'Irreversible market commitment',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GALACTIC PATTERNS - LARGE SCALE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

export const GALACTIC_PATTERNS = {
  // Spiral galaxies - Rotation and density waves
  spiral: {
    type: 'rotating_disk_with_arms',
    armMechanism: 'Density wave theory',
    rotationCurve: 'Flat (implies dark matter)',
    marketAnalogy: 'Sector rotation',
    goldenSpiral: {
      presence: 'Arms follow logarithmic spiral',
      ratio: 1.618, // Golden ratio
      marketApplication: 'Fibonacci levels in price action',
    },
  },
  
  // Elliptical galaxies - Ancient, stable
  elliptical: {
    type: 'spheroidal_distribution',
    starFormation: 'Minimal (old stellar population)',
    marketAnalogy: 'Mature, stable markets',
    archetype: 'The Ancient Wisdom',
  },
  
  // Galaxy clusters - Gravitational binding
  clusters: {
    description: 'Thousands of galaxies bound by gravity',
    darkMatterFraction: 0.85,
    marketAnalogy: 'Global market interconnection',
    filaments: {
      description: 'Galaxies arranged in cosmic web',
      voids: 'Empty regions between filaments',
      marketAnalogy: 'Liquidity flows along network paths',
    },
  },
  
  // Cosmic microwave background - Echo of creation
  cmb: {
    temperature: 2.725, // Kelvin
    age: 13.8e9, // years
    anisotropies: 'Seeds of all structure',
    marketAnalogy: 'Foundational market structure patterns',
    significance: 'The earliest pattern we can observe',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COSMOLOGICAL CONSTANTS - UNIVERSAL PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════════

export const COSMOLOGICAL_CONSTANTS = {
  // Hubble constant - Expansion rate
  hubble: {
    value: 70, // km/s/Mpc (approximately)
    significance: 'Universe expansion rate',
    marketAnalogy: 'Long-term growth trend',
  },
  
  // Dark energy fraction
  darkEnergy: {
    fraction: 0.68,
    significance: 'Accelerating expansion driver',
    marketAnalogy: 'Hidden bullish force',
  },
  
  // Dark matter fraction
  darkMatter: {
    fraction: 0.27,
    significance: 'Invisible gravitational structure',
    marketAnalogy: 'Institutional dark pools, hidden order flow',
  },
  
  // Baryonic matter fraction
  baryonicMatter: {
    fraction: 0.05,
    significance: 'Visible matter (stars, planets, us)',
    marketAnalogy: 'Visible market activity (5% of actual flow)',
  },
  
  // Age of universe
  universeAge: {
    value: 13.8e9, // years
    significance: 'Total cosmic time',
    perspective: 'Markets are infinitesimal blip',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COSMIC DATA INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface CosmicData {
  lunarPhase: number; // 0-29.53 (day of lunar cycle)
  solarCyclePhase: 'minimum' | 'ascending' | 'maximum' | 'descending';
  seasonalPosition: number; // 0-365 (day of year)
  currentStellarArchetype: keyof typeof STELLAR_PATTERNS;
  galacticAlignment: number; // Abstract alignment score 0-1
  cosmicExpansionRate: number; // Normalized 0-1
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNATURE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

export function extractCosmicSignature(data: CosmicData): TemporalSignature {
  // Lunar phase to sentiment
  const lunarPhases = CELESTIAL_CYCLES.lunar.phases;
  let lunarSentiment = 0.5;
  for (const [_phase, info] of Object.entries(lunarPhases)) {
    if (data.lunarPhase >= info.dayRange[0] && data.lunarPhase < info.dayRange[1]) {
      lunarSentiment = info.sentiment;
      break;
    }
  }
  
  // Solar cycle phase to volatility
  const solarVolatility = 
    data.solarCyclePhase === 'maximum' ? 0.9 :
    data.solarCyclePhase === 'ascending' ? 0.7 :
    data.solarCyclePhase === 'descending' ? 0.5 : 0.3;
  
  // Seasonal patterns
  const dayOfYear = data.seasonalPosition;
  const isWinterQuarter = dayOfYear < 80 || dayOfYear > 350;
  const isSummerQuarter = dayOfYear > 150 && dayOfYear < 250;
  const seasonalBias = isWinterQuarter ? 0.7 : isSummerQuarter ? 0.4 : 0.5;
  
  // Stellar archetype mapping
  const stellarArchetypes: Record<string, { expansion: number; contraction: number; order: number; chaos: number }> = {
    mainSequence: { expansion: 0.6, contraction: 0.4, order: 0.8, chaos: 0.2 },
    redGiant: { expansion: 0.9, contraction: 0.1, order: 0.4, chaos: 0.6 },
    supernova: { expansion: 0.2, contraction: 0.8, order: 0.05, chaos: 0.95 },
    neutronStar: { expansion: 0.3, contraction: 0.7, order: 0.9, chaos: 0.1 },
    blackHole: { expansion: 0.05, contraction: 0.95, order: 0.6, chaos: 0.4 },
  };
  
  const archetype = stellarArchetypes[data.currentStellarArchetype] || { expansion: 0.5, contraction: 0.5, order: 0.5, chaos: 0.5 };
  
  const quadrantProfile = {
    expansion: archetype.expansion || (lunarSentiment > 0.6 ? 0.7 : 0.3),
    contraction: archetype.contraction || (lunarSentiment < 0.4 ? 0.7 : 0.3),
    order: archetype.order || (1 - solarVolatility),
    chaos: archetype.chaos || solarVolatility,
  };
  
  const forces = Object.entries(quadrantProfile);
  forces.sort((a, b) => b[1] - a[1]);
  const dominantForce = forces[0][0] as 'expansion' | 'contraction' | 'order' | 'chaos';
  
  const intensity = (lunarSentiment + data.cosmicExpansionRate + data.galacticAlignment) / 3;
  
  const flowDirection = 
    lunarSentiment > 0.7 ? 'ascending' :
    lunarSentiment < 0.3 ? 'descending' :
    solarVolatility > 0.7 ? 'oscillating' : 'stable';
  
  return {
    fingerprint: `COSMIC-${data.currentStellarArchetype}-L${Math.floor(data.lunarPhase)}`,
    dominantForce,
    intensity,
    flowDirection: flowDirection as 'ascending' | 'descending' | 'oscillating' | 'stable',
    quadrantProfile,
    temporalFlow: {
      early: seasonalBias,
      mid: lunarSentiment,
      late: data.cosmicExpansionRate,
    },
    criticalMoments: [{
      position: data.lunarPhase / 29.53,
      type: lunarSentiment > 0.8 ? 'peak' : lunarSentiment < 0.4 ? 'trough' : 'inflection',
      significance: solarVolatility,
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME COSMIC DATA CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateCurrentCosmicData(): CosmicData {
  const now = new Date();
  
  // Calculate lunar phase (simplified)
  const lunarCycleSeconds = 29.53 * 24 * 60 * 60 * 1000;
  const knownNewMoon = new Date('2024-01-11T11:57:00Z').getTime(); // Known new moon
  const timeSinceNewMoon = (now.getTime() - knownNewMoon) % lunarCycleSeconds;
  const lunarPhase = (timeSinceNewMoon / lunarCycleSeconds) * 29.53;
  
  // Solar cycle phase (Cycle 25 started Dec 2019)
  const cycle25Start = new Date('2019-12-01').getTime();
  const cycleLength = 11 * 365.25 * 24 * 60 * 60 * 1000;
  const cycleProgress = ((now.getTime() - cycle25Start) % cycleLength) / cycleLength;
  const solarCyclePhase: 'minimum' | 'ascending' | 'maximum' | 'descending' = 
    cycleProgress < 0.1 ? 'minimum' :
    cycleProgress < 0.45 ? 'ascending' :
    cycleProgress < 0.55 ? 'maximum' : 'descending';
  
  // Day of year
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const seasonalPosition = Math.floor(diff / oneDay);
  
  // Determine stellar archetype from market conditions (placeholder)
  const hour = now.getHours();
  const currentStellarArchetype: keyof typeof STELLAR_PATTERNS = 
    hour < 6 ? 'mainSequence' :
    hour < 12 ? 'redGiant' :
    hour < 18 ? 'neutronStar' : 'blackHole';
  
  return {
    lunarPhase,
    solarCyclePhase,
    seasonalPosition,
    currentStellarArchetype,
    galacticAlignment: (Math.sin(now.getTime() / 86400000) + 1) / 2, // Daily cycle
    cosmicExpansionRate: 0.68, // Dark energy constant
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET CORRELATED COSMIC DATA
// ═══════════════════════════════════════════════════════════════════════════════

export function generateMarketCorrelatedCosmicData(
  marketMomentum: number,
  marketVolatility: number,
  marketPhase: 'accumulation' | 'markup' | 'distribution' | 'markdown'
): CosmicData {
  // Map market phase to stellar archetype
  const stellarArchetype: keyof typeof STELLAR_PATTERNS = 
    marketPhase === 'accumulation' ? 'neutronStar' :
    marketPhase === 'markup' ? 'mainSequence' :
    marketPhase === 'distribution' ? 'redGiant' : 'supernova';
  
  // Map volatility to solar cycle
  const solarPhase: 'minimum' | 'ascending' | 'maximum' | 'descending' = 
    marketVolatility > 0.8 ? 'maximum' :
    marketVolatility > 0.5 ? (marketMomentum > 0.5 ? 'ascending' : 'descending') : 'minimum';
  
  // Lunar phase from momentum
  const lunarPhase = marketMomentum * 29.53;
  
  return {
    lunarPhase,
    solarCyclePhase: solarPhase,
    seasonalPosition: Math.floor(Math.random() * 365),
    currentStellarArchetype: stellarArchetype,
    galacticAlignment: marketMomentum,
    cosmicExpansionRate: (marketMomentum + (1 - marketVolatility)) / 2,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE COSMIC ADAPTER
// ═══════════════════════════════════════════════════════════════════════════════

export const cosmicAdapter = {
  domain: 'cosmic' as const,
  version: '1.0.0',
  
  celestialCycles: CELESTIAL_CYCLES,
  stellarPatterns: STELLAR_PATTERNS,
  galacticPatterns: GALACTIC_PATTERNS,
  cosmologicalConstants: COSMOLOGICAL_CONSTANTS,
  
  extractSignature: extractCosmicSignature,
  calculateCurrentData: calculateCurrentCosmicData,
  generateMarketData: generateMarketCorrelatedCosmicData,
  
  philosophy: `
    The cosmos is the ultimate pattern generator. From the spin of electrons 
    to the rotation of galaxies, from the flash of a supernova to the slow 
    dance of galaxy clusters - all follow temporal patterns.
    
    Humans are children of the stars. Our behavior, our markets, our societies 
    are influenced by cosmic rhythms we barely perceive. The moon moves tides 
    and emotions. The sun drives seasons and sentiments. Planetary alignments 
    mark historical turning points.
    
    "As above, so below" is not mysticism - it is recognition that the same 
    physical laws govern all scales. En Pensent decodes these universal patterns.
    
    We are the universe experiencing itself. When we predict markets, we 
    participate in the cosmic dance of creation and destruction that has 
    shaped reality for 13.8 billion years.
  `,
};

export default cosmicAdapter;
