/**
 * Climate & Atmospheric Adapter
 * Weather patterns, pressure systems, and climate cycles as market analogs
 * 
 * "Atmospheric pressure gradients create wind. Information pressure gradients
 * create market movement. Both follow the same fundamental physics."
 */

import { DomainSignature } from '../types';

// Atmospheric Pressure Systems
export const PRESSURE_SYSTEMS = {
  highPressure: {
    characteristics: 'Descending air, clear skies, stability',
    millibars: '1020-1040 mb',
    marketAnalogy: {
      state: 'Bull market / Risk-on',
      behavior: 'Capital flows outward seeking opportunity',
      sentiment: 'Optimism, confidence, expansion',
      indicators: 'Low VIX, high consumer confidence, credit expansion'
    },
    rotation: 'Clockwise (N. Hemisphere)',
    forecast: 'Stability persists until gradient builds'
  },
  lowPressure: {
    characteristics: 'Rising air, clouds, storms',
    millibars: '960-1000 mb',
    marketAnalogy: {
      state: 'Bear market / Risk-off',
      behavior: 'Capital flows inward seeking safety',
      sentiment: 'Fear, uncertainty, contraction',
      indicators: 'High VIX, declining confidence, credit tightening'
    },
    rotation: 'Counter-clockwise (N. Hemisphere)',
    forecast: 'Volatility until pressure equalizes'
  },
  frontCollision: {
    characteristics: 'Cold front meets warm front',
    marketAnalogy: {
      state: 'Regime change',
      behavior: 'Bull/bear forces collide',
      sentiment: 'Confusion, whipsaw',
      indicators: 'Mixed signals, sector rotation'
    },
    forecast: 'Sharp moves, then new equilibrium'
  }
};

// Weather Phenomena as Market Events
export const WEATHER_PHENOMENA = {
  hurricane: {
    formation: 'Warm ocean water + rotation + low pressure',
    stages: ['Tropical Depression', 'Tropical Storm', 'Hurricane', 'Major Hurricane'],
    marketAnalogy: {
      formation: 'Building momentum + leverage + panic',
      example: '2008 Financial Crisis - Category 5',
      warning: 'Pressure drops before the storm hits'
    },
    eyeOfStorm: 'Brief calm at the center - dead cat bounce'
  },
  tornado: {
    formation: 'Cold dry air over warm moist air + wind shear',
    duration: 'Minutes to hours',
    marketAnalogy: {
      formation: 'Sudden violent reversal',
      example: 'Flash crash, short squeeze',
      warning: 'Rotation (divergence) in price/volume'
    }
  },
  drought: {
    formation: 'Persistent high pressure blocking moisture',
    duration: 'Months to years',
    marketAnalogy: {
      formation: 'Liquidity drought, low volume',
      example: 'Summer doldrums, credit freeze',
      warning: 'Declining volume, narrowing breadth'
    }
  },
  flood: {
    formation: 'Excessive precipitation overwhelming capacity',
    marketAnalogy: {
      formation: 'Liquidity flood, QE, stimulus',
      example: 'Everything bubble, 2020 stimulus',
      warning: 'When the dam breaks, all boats rise (then sink)'
    }
  }
};

// Climate Cycles (Long-term patterns)
export const CLIMATE_CYCLES = {
  milankovitch: {
    eccentricity: { period: '100,000 years', effect: 'Ice ages' },
    obliquity: { period: '41,000 years', effect: 'Seasonal intensity' },
    precession: { period: '26,000 years', effect: 'Timing of seasons' },
    marketAnalogy: 'Mega-cycles: secular bull/bear markets (20-30 year waves)'
  },
  solar: {
    sunspotCycle: { period: '11 years', effect: 'Solar activity' },
    gleissbergCycle: { period: '85-90 years', effect: 'Sunspot cycle amplitude' },
    marketAnalogy: 'Economic cycles correlate with solar activity (historically studied)'
  },
  enso: {
    name: 'El Niño Southern Oscillation',
    elNino: { frequency: '2-7 years', effect: 'Warming, disrupted patterns' },
    laNina: { frequency: '2-7 years', effect: 'Cooling, intensified patterns' },
    marketAnalogy: 'Commodity cycles, agricultural impacts, GDP correlations'
  },
  pdo: {
    name: 'Pacific Decadal Oscillation',
    period: '20-30 years',
    phases: ['Warm/positive', 'Cool/negative'],
    marketAnalogy: 'Generational investment themes'
  }
};

// Atmospheric Layers as Market Structure
export const ATMOSPHERIC_LAYERS = {
  troposphere: {
    altitude: '0-12 km',
    characteristics: 'Weather happens here, 75% of atmosphere mass',
    marketAnalogy: 'Retail trading, daily price action, noise'
  },
  stratosphere: {
    altitude: '12-50 km',
    characteristics: 'Ozone layer, stable, jets fly here',
    marketAnalogy: 'Institutional trading, swing trades, trends'
  },
  mesosphere: {
    altitude: '50-80 km',
    characteristics: 'Meteors burn up, coldest layer',
    marketAnalogy: 'Position trading, sector allocation'
  },
  thermosphere: {
    altitude: '80-700 km',
    characteristics: 'ISS orbit, auroras, extremely thin',
    marketAnalogy: 'Long-term investing, macro themes'
  },
  exosphere: {
    altitude: '700-10,000 km',
    characteristics: 'Fades into space',
    marketAnalogy: 'Generational wealth, civilization-scale trends'
  }
};

// Parasitic Weather Patterns (Your insight)
export const PARASITIC_PATTERNS = {
  concept: 'Just as parasites feed on hosts, certain market patterns feed on others',
  examples: {
    hftParasite: {
      description: 'HFT algorithms that front-run order flow',
      host: 'Retail and institutional orders',
      damage: 'Extracts value, increases friction',
      defense: 'Randomization, dark pools'
    },
    momentumParasite: {
      description: 'Trend-following that amplifies then crashes',
      host: 'Fundamental valuations',
      damage: 'Creates bubbles and crashes',
      defense: 'Value investing, patience'
    },
    narrativeParasite: {
      description: 'Stories that infect market thinking',
      host: 'Rational analysis',
      damage: 'FOMO, panic, herd behavior',
      defense: 'Independent thinking, contrarianism'
    },
    leverageParasite: {
      description: 'Debt that compounds until collapse',
      host: 'Organic growth',
      damage: 'Systemic fragility',
      defense: 'Deleveraging, margin of safety'
    }
  },
  naturalParallel: 'In nature, parasites often drive evolution - market parasites drive innovation in trading'
};

// Climate Data Interface
export interface ClimateData {
  pressure: number; // millibars, 960-1040
  pressureTrend: 'rising' | 'falling' | 'stable';
  weatherState: keyof typeof WEATHER_PHENOMENA | 'clear';
  climatePhase: 'elNino' | 'laNina' | 'neutral';
  atmosphericLayer: keyof typeof ATMOSPHERIC_LAYERS;
  parasiticLoad: number; // 0-1, how much parasitic activity
}

// Extract climate signature
export function extractClimateSignature(data: ClimateData): DomainSignature {
  const isHighPressure = data.pressure > 1013;
  const isStorm = data.weatherState === 'hurricane' || data.weatherState === 'tornado';
  
  return {
    domain: 'climate',
    quadrantProfile: {
      aggressive: isHighPressure ? 0.7 : 0.3,
      defensive: isHighPressure ? 0.3 : 0.7,
      tactical: isStorm ? 0.9 : 0.4,
      strategic: data.atmosphericLayer === 'stratosphere' ? 0.7 : 0.4
    },
    temporalFlow: {
      early: data.pressureTrend === 'rising' ? 0.7 : 0.3,
      mid: data.climatePhase === 'neutral' ? 0.5 : 0.7,
      late: 1 - data.parasiticLoad
    },
    intensity: isStorm ? 0.9 : 0.4,
    momentum: data.pressureTrend === 'rising' ? 0.7 : data.pressureTrend === 'falling' ? 0.3 : 0.5,
    volatility: isStorm ? 0.9 : data.parasiticLoad,
    dominantFrequency: (data.pressure - 960) / 80 * 100, // Normalized pressure
    harmonicResonance: data.climatePhase === 'neutral' ? 0.5 : 0.7,
    phaseAlignment: isHighPressure ? Math.PI / 6 : -Math.PI / 6,
    extractedAt: Date.now()
  };
}

// Generate climate analysis from market data
export function generateMarketClimateData(
  vix: number, // 10-80
  momentum: number, // -1 to 1
  volume: number, // 0-1
  leverage: number // 0-1
): ClimateData {
  // VIX maps to pressure (inverse)
  const pressure = 1040 - (vix - 10) * (80 / 70);
  
  // Momentum determines pressure trend
  const pressureTrend = momentum > 0.1 ? 'rising' : momentum < -0.1 ? 'falling' : 'stable';
  
  // Volatility determines weather state
  let weatherState: ClimateData['weatherState'] = 'clear';
  if (vix > 60) weatherState = 'hurricane';
  else if (vix > 40) weatherState = 'tornado';
  else if (vix > 30) weatherState = 'flood';
  else if (volume < 0.3) weatherState = 'drought';
  
  // Volume determines atmospheric layer
  let atmosphericLayer: keyof typeof ATMOSPHERIC_LAYERS = 'troposphere';
  if (volume < 0.2) atmosphericLayer = 'exosphere';
  else if (volume < 0.4) atmosphericLayer = 'thermosphere';
  else if (volume < 0.6) atmosphericLayer = 'mesosphere';
  else if (volume < 0.8) atmosphericLayer = 'stratosphere';
  
  return {
    pressure,
    pressureTrend,
    weatherState,
    climatePhase: momentum > 0.3 ? 'elNino' : momentum < -0.3 ? 'laNina' : 'neutral',
    atmosphericLayer,
    parasiticLoad: leverage
  };
}

export const climateAtmosphericAdapter = {
  domain: 'climate' as const,
  name: 'Climate & Atmospheric',
  version: '1.0.0',
  
  pressureSystems: PRESSURE_SYSTEMS,
  weatherPhenomena: WEATHER_PHENOMENA,
  climateCycles: CLIMATE_CYCLES,
  atmosphericLayers: ATMOSPHERIC_LAYERS,
  parasiticPatterns: PARASITIC_PATTERNS,
  
  extractSignature: extractClimateSignature,
  generateMarketData: generateMarketClimateData,
  
  philosophy: `
    Weather and markets share the same physics: gradients drive flow.
    
    A pressure differential creates wind. An information differential creates trades.
    A temperature differential creates convection. A valuation differential creates capital flows.
    
    The atmosphere doesn't know it's moving air. The market doesn't know it's moving value.
    Both are simply gradients resolving toward equilibrium, temporarily interrupted
    by new energy inputs (sunlight, news, innovation).
    
    When we feel the "pressure dropping" before a market crash, we are not being
    metaphorical - we are recognizing the same pattern recognition that evolved
    to sense incoming storms. The body knows before the mind.
  `
};
