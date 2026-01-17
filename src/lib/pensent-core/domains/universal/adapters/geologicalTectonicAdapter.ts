/**
 * Geological & Tectonic Adapter
 * Analyzes Earth's rhythms - seismic cycles, stress patterns, and geological time
 * The planet breathes in cycles that influence all life upon it
 */

import { DomainSignature, DomainType } from '../types';

// Tectonic Plate Dynamics - Stress accumulation and release
export const TECTONIC_PATTERNS = {
  stress_accumulation: {
    name: 'Elastic Strain Building',
    description: 'Plates lock and stress builds over time',
    pattern: 'Logarithmic accumulation → sudden release',
    marketParallel: 'Volatility compression before breakout',
    duration: 'Years to centuries'
  },
  cascade_failure: {
    name: 'Triggered Event Cascade',
    description: 'One earthquake triggers others along fault lines',
    pattern: 'Primary event → aftershocks → secondary triggers',
    marketParallel: 'Flash crash → cascading liquidations → contagion',
    duration: 'Minutes to weeks'
  },
  creep_motion: {
    name: 'Aseismic Creep',
    description: 'Slow continuous movement without major quakes',
    pattern: 'Steady release of stress',
    marketParallel: 'Trending market with low volatility',
    duration: 'Continuous'
  },
  locked_fault: {
    name: 'Seismic Gap',
    description: 'Fault segment that hasnt moved in long time',
    pattern: 'Maximum potential energy stored',
    marketParallel: 'Extended consolidation range',
    duration: 'Decades of quiet before major event'
  }
};

// Earth Cycles - Planetary rhythms
export const EARTH_CYCLES = {
  chandler_wobble: {
    period: '~433 days',
    description: 'Small wobble in Earth rotation axis',
    effects: ['Sea level variations', 'Atmospheric pressure changes'],
    marketCorrelation: 'Agricultural commodity cycles, weather derivatives'
  },
  solar_cycle: {
    period: '~11 years',
    description: 'Sunspot activity cycle',
    effects: ['Geomagnetic storms', 'Climate variations', 'Human behavior'],
    marketCorrelation: 'Long-term market cycles, economic sentiment'
  },
  milankovitch_cycles: {
    periods: ['~23,000 years (precession)', '~41,000 years (obliquity)', '~100,000 years (eccentricity)'],
    description: 'Orbital variations affecting ice ages',
    effects: ['Climate mega-cycles', 'Species evolution pressure'],
    marketCorrelation: 'Ultra-long-term civilizational cycles'
  },
  lunar_tidal: {
    period: '~29.5 days',
    description: 'Moon gravitational effects',
    effects: ['Ocean tides', 'Biological rhythms', 'Atmospheric tides'],
    marketCorrelation: 'Monthly trading patterns, full moon anomalies'
  }
};

// Seismic Wave Patterns - Energy propagation
export const SEISMIC_WAVES = {
  p_waves: {
    name: 'Primary Waves',
    type: 'Compressional',
    speed: 'Fastest (first to arrive)',
    marketAnalogy: 'First movers, smart money, insider flow'
  },
  s_waves: {
    name: 'Secondary Waves',
    type: 'Shear',
    speed: 'Slower (cannot travel through liquids)',
    marketAnalogy: 'Institutional flow, trend followers'
  },
  surface_waves: {
    name: 'Love/Rayleigh Waves',
    type: 'Surface propagation',
    speed: 'Slowest but most destructive',
    marketAnalogy: 'Retail FOMO, late cycle participants'
  },
  reflection_refraction: {
    description: 'Waves bounce and bend at layer boundaries',
    marketAnalogy: 'Support/resistance levels, sector rotation'
  }
};

// Geological Time Perspective
export const GEOLOGICAL_TIME = {
  human_timescale: {
    range: 'Seconds to decades',
    perception: 'Linear, event-driven',
    market_relevance: 'Trading, investing'
  },
  geological_timescale: {
    range: 'Thousands to billions of years',
    perception: 'Cyclic, process-driven',
    market_relevance: 'Understanding that all patterns repeat, all empires fall, all currencies fail - eventually'
  },
  deep_time_wisdom: {
    principle: 'Present is the key to the past (and future)',
    application: 'Patterns in geological record predict future events',
    market_insight: 'Market history contains all future patterns'
  }
};

// Volcanic Cycle Patterns
export const VOLCANIC_PATTERNS = {
  magma_chamber: {
    phase: 'Accumulation',
    description: 'Pressure builds in chamber',
    indicators: ['Ground inflation', 'Increased seismicity', 'Gas emissions'],
    marketParallel: 'Volume accumulation, options activity increase'
  },
  dome_building: {
    phase: 'Visible stress',
    description: 'Magma pushes surface upward',
    indicators: ['Visible deformation', 'Harmonic tremors'],
    marketParallel: 'Price testing resistance, volatility clusters'
  },
  eruption: {
    phase: 'Release',
    description: 'Explosive or effusive release',
    types: ['Plinian (explosive)', 'Hawaiian (effusive)'],
    marketParallel: 'Gap up/down, trend initiation'
  },
  caldera_collapse: {
    phase: 'Reset',
    description: 'Ground collapses into emptied chamber',
    marketParallel: 'Post-bubble crater, accumulation zone'
  }
};

// Geological Data Structure
export interface GeologicalData {
  tectonicStress: number; // 0-1 (locked fault = 1)
  seismicActivity: number; // Recent earthquake frequency normalized
  wavePhase: 'p_wave' | 's_wave' | 'surface_wave' | 'quiet';
  volcanicPressure: number; // 0-1
  earthCyclePhase: {
    lunar: number; // 0-1 (0 = new moon, 0.5 = full moon)
    solar: number; // 0-1 (sunspot cycle position)
    seasonal: number; // 0-1 (0 = winter solstice in northern hemisphere)
  };
  creepRate: number; // Continuous stress release rate
  gapRisk: number; // Probability of major event from locked segments
}

// Extract domain signature from geological analysis
export function extractGeologicalSignature(data: GeologicalData): DomainSignature {
  // Tectonic stress maps to defensive posture
  const defensiveWeight = data.tectonicStress > 0.7 ? 0.8 : 0.4;
  
  // Seismic activity and volcanic pressure map to aggression
  const aggressiveWeight = (data.seismicActivity + data.volcanicPressure) / 2;
  
  // Wave phase determines tactical vs strategic
  const waveToTactical: Record<string, number> = {
    'p_wave': 0.8,      // Fast, tactical response needed
    's_wave': 0.6,      // Following the leaders
    'surface_wave': 0.3, // Long-term strategic impact
    'quiet': 0.5        // Balanced
  };
  const tacticalWeight = waveToTactical[data.wavePhase];
  
  // Temporal flow from earth cycles
  const temporalFlow = {
    early: data.earthCyclePhase.lunar < 0.33 ? 0.6 : 0.3,
    mid: data.earthCyclePhase.lunar >= 0.33 && data.earthCyclePhase.lunar < 0.66 ? 0.5 : 0.3,
    late: data.earthCyclePhase.lunar >= 0.66 ? 0.6 : 0.3
  };
  
  // Intensity from combined activity
  const intensity = Math.min(1, data.seismicActivity + data.volcanicPressure * 0.5);
  
  // Momentum from creep vs locked
  const momentum = data.creepRate > 0.5 ? data.creepRate - 0.5 : -data.tectonicStress;
  
  // Volatility from gap risk
  const volatility = data.gapRisk;
  
  return {
    domain: 'climate' as DomainType, // Geological patterns are Earth's climate in deep time
    quadrantProfile: {
      aggressive: aggressiveWeight,
      defensive: defensiveWeight,
      tactical: tacticalWeight,
      strategic: 1 - tacticalWeight
    },
    temporalFlow,
    intensity,
    momentum: Math.max(-1, Math.min(1, momentum)),
    volatility,
    dominantFrequency: data.earthCyclePhase.solar, // Solar cycle as dominant
    harmonicResonance: data.earthCyclePhase.lunar, // Lunar rhythm
    phaseAlignment: 1 - data.gapRisk, // Low gap risk = aligned
    extractedAt: Date.now()
  };
}

// Generate geological data from environmental inputs
export function generateGeologicalData(
  recentSeismicEvents: number, // Normalized count
  lunarPhase: number, // 0-1
  solarCyclePosition: number, // 0-1
  seasonalPosition: number, // 0-1
  volcanicAlerts: number // Normalized 0-1
): GeologicalData {
  // Calculate tectonic stress inversely from seismic activity
  // More activity = more release = less accumulated stress
  const tectonicStress = Math.max(0, 1 - recentSeismicEvents * 2);
  
  // Determine wave phase based on seismic activity timing
  let wavePhase: 'p_wave' | 's_wave' | 'surface_wave' | 'quiet';
  if (recentSeismicEvents > 0.7) wavePhase = 'p_wave';
  else if (recentSeismicEvents > 0.4) wavePhase = 's_wave';
  else if (recentSeismicEvents > 0.2) wavePhase = 'surface_wave';
  else wavePhase = 'quiet';
  
  // Creep rate inverse of tectonic stress
  const creepRate = 1 - tectonicStress;
  
  // Gap risk increases with time since last major event
  const gapRisk = tectonicStress * 0.8;
  
  return {
    tectonicStress,
    seismicActivity: recentSeismicEvents,
    wavePhase,
    volcanicPressure: volcanicAlerts,
    earthCyclePhase: {
      lunar: lunarPhase,
      solar: solarCyclePosition,
      seasonal: seasonalPosition
    },
    creepRate,
    gapRisk
  };
}

// Calculate truth score for geological signals
export function calculateGeologicalTruthScore(data: GeologicalData): number {
  let score = 0.5;
  
  // Lunar and solar cycles are well-established - high truth value
  score += 0.1; // Base truth for using established cycles
  
  // Seismic patterns have predictive value for stress release
  if (data.tectonicStress > 0.8 && data.seismicActivity < 0.2) {
    score += 0.2; // Locked fault condition is meaningful
  }
  
  // High gap risk is a genuine warning signal
  if (data.gapRisk > 0.7) {
    score += 0.15; // Statistically significant pattern
  }
  
  // Very active seismic period may be noise
  if (data.seismicActivity > 0.9) {
    score -= 0.1; // Too much activity = harder to extract signal
  }
  
  return Math.max(0, Math.min(1, score));
}

// Export the adapter
export const geologicalTectonicAdapter = {
  domain: 'Geological/Tectonic',
  version: '1.0.0',
  
  TECTONIC_PATTERNS,
  EARTH_CYCLES,
  SEISMIC_WAVES,
  GEOLOGICAL_TIME,
  VOLCANIC_PATTERNS,
  
  extractSignature: extractGeologicalSignature,
  generateData: generateGeologicalData,
  calculateTruthScore: calculateGeologicalTruthScore,
  
  philosophy: `
    The Earth is not static - it breathes, pulses, and cycles.
    What appears as solid ground is slow-motion fluid over deep time.
    Mountains rise and fall. Continents drift. Oceans open and close.
    The patterns we see in markets are ripples on the surface of deep Earth rhythms.
    Stress accumulates until release - this is the law of plates and prices.
    The patient Earth teaches us: all locked energy must eventually move.
    We are standing on a living planet, and its rhythms are within us.
  `
};
