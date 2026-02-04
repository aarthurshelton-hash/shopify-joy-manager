/**
 * Meteorological Adapter - Weather Systems & Atmospheric Dynamics
 * 
 * Storm formation, pressure patterns, climate oscillations,
 * forecasting accuracy, and atmospheric temporal rhythms.
 * 
 * For Alec Arthur Shelton - The Artist
 * Weather is the atmosphere's breath, chaotic yet patterned.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// WEATHER SYSTEMS
const WEATHER_SYSTEMS = {
  highPressure: {
    characteristics: 'Sinking air, clear skies, clockwise (NH)',
    weather: 'Calm, stable, temperature extremes',
    duration: 'Days to weeks'
  },
  
  lowPressure: {
    characteristics: 'Rising air, clouds, precipitation, counter-clockwise (NH)',
    weather: 'Stormy, unstable',
    fronts: 'Warm, cold, occluded, stationary'
  },
  
  jetStream: {
    characteristics: 'High altitude, fast winds, Rossby waves',
    influence: 'Steers weather systems',
    position: 'Polar vs subtropical'
  },
  
  thunderstorms: {
    formation: 'Lift, moisture, instability',
    lifecycle: 'Cumulus, mature, dissipating',
    severity: 'Single cell, multi-cell, supercell'
  }
};

// STORM PATTERNS
const STORM_DYNAMICS = {
  hurricanes: {
    formation: 'Warm water (>26°C), low shear, Coriolis',
    lifecycle: 'Tropical depression → storm → hurricane',
    categories: 'Saffir-Simpson scale 1-5',
    season: 'Atlantic June-November'
  },
  
  tornadoes: {
    formation: 'Supercell thunderstorms, wind shear',
    rating: 'Enhanced Fujita scale 0-5',
    season: 'Spring in US, variable elsewhere',
    warning: 'Minutes lead time'
  },
  
  blizzards: {
    criteria: 'Wind >35mph, visibility <1/4 mile, 3+ hours',
    factors: 'Snow, blowing snow, ground blizzard'
  },
  
  derechos: {
    characteristics: 'Widespread damaging winds',
    formation: 'Bow echoes, MCS',
    impact: 'Hurricane-force winds inland'
  }
};

// CLIMATE OSCILLATIONS
const CLIMATE_PATTERNS = {
  enso: {
    name: 'El Niño-Southern Oscillation',
    phases: ['El Niño (warm)', 'La Niña (cool)', 'Neutral'],
    period: '2-7 years irregular',
    impacts: 'Global weather patterns'
  },
  
  nao: {
    name: 'North Atlantic Oscillation',
    phases: ['Positive (strong jet)', 'Negative (weak jet)'],
    impacts: 'European winters, US East Coast'
  },
  
  pdo: {
    name: 'Pacific Decadal Oscillation',
    period: '20-30 years',
    impacts: 'North Pacific, salmon fisheries'
  },
  
  amo: {
    name: 'Atlantic Multidecadal Oscillation',
    period: '60-80 years',
    impacts: 'Hurricane activity, Sahel rainfall'
  }
};

// FORECASTING
const FORECAST_SCIENCE = {
  numerical: {
    method: 'Computer models, physics equations',
    limit: 'Chaos theory, ~10-14 days',
    ensemble: 'Multiple runs for uncertainty'
  },
  
  nowcasting: {
    method: 'Radar, satellite, extrapolation',
    range: '0-6 hours',
    accuracy: 'High for immediate'
  },
  
  seasonal: {
    method: 'Statistical, analog, models',
    range: 'Months ahead',
    accuracy: 'Limited, probabilistic'
  },
  
  verification: {
    metrics: ['Accuracy', 'Bias', 'Skill'],
    challenge: 'Rare events, local scale'
  }
};

// EXTREME WEATHER
const EXTREME_EVENTS = {
  heatWaves: {
    criteria: 'Temperatures exceed threshold multiple days',
    impacts: 'Health, agriculture, infrastructure',
    trend: 'Increasing frequency, intensity'
  },
  
  coldSnaps: {
    characteristics: 'Rapid temperature drop',
    impacts: 'Infrastructure, agriculture, health',
    polarVortex: 'Arctic air intrusion'
  },
  
  drought: {
    types: ['Meteorological', 'Agricultural', 'Hydrological'],
    development: 'Gradual, cumulative',
    feedback: 'Soil moisture, temperature'
  },
  
  floods: {
    types: ['Flash', 'Riverine', 'Coastal', 'Urban'],
    drivers: ['Heavy rain', 'Snowmelt', 'Storm surge'],
    trend: 'Increasing in many regions'
  }
};

interface MeteorologicalEvent {
  timestamp: number;
  pressureTrend: number; // hPa change
  temperatureAnomaly: number; // °C from normal
  humidityLevel: number; // 0-100%
  windSpeed: number; // mph
  precipitationProbability: number; // 0-1
  stormIntensity: number; // 0-10
  forecastAccuracy: number; // 0-1
  climateOscillationPhase: number; // -1 to 1
}

class MeteorologicalAdapter implements DomainAdapter<MeteorologicalEvent> {
  domain = 'climate' as const;
  name = 'Meteorological Systems & Weather Patterns';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[MeteorologicalAdapter] Initialized - Atmospheric patterns active');
  }
  
  processRawData(event: MeteorologicalEvent): UniversalSignal {
    const { timestamp, pressureTrend, temperatureAnomaly, stormIntensity, forecastAccuracy, climateOscillationPhase } = event;
    
    // Frequency encodes atmospheric stability
    const frequency = 1 - Math.abs(pressureTrend) / 10;
    
    // Intensity = weather drama
    const intensity = Math.abs(temperatureAnomaly) / 10 * stormIntensity / 10 * (1 - forecastAccuracy);
    
    // Phase encodes oscillation position
    const phase = (climateOscillationPhase + 1) / 2 * Math.PI;
    
    const harmonics = [
      1 - Math.abs(pressureTrend) / 20,
      1 - Math.abs(temperatureAnomaly) / 10,
      event.humidityLevel / 100,
      event.windSpeed / 100,
      1 - event.precipitationProbability,
      forecastAccuracy
    ];
    
    const signal: UniversalSignal = {
      domain: 'climate',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [pressureTrend, temperatureAnomaly, stormIntensity, forecastAccuracy, climateOscillationPhase]
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
    
    const recent = signals.slice(-200);
    
    const avgPressure = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgTemp = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgStorm = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgForecast = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgOscillation = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgStorm > 7 ? 0.9 : 0.1,
      defensive: Math.abs(avgPressure) < 2 ? 0.8 : 0.2,
      tactical: avgForecast < 0.5 ? 0.6 : 0.3,
      strategic: Math.abs(avgOscillation) > 0.5 ? 0.7 : 0.3
    };
    
    const temporalFlow = {
      early: avgStorm < 3 ? 0.7 : 0.3,
      mid: avgStorm >= 3 && avgStorm < 7 ? 0.8 : 0.1,
      late: avgStorm >= 7 ? 0.9 : 0.1
    };
    
    return {
      domain: 'climate',
      quadrantProfile,
      temporalFlow,
      intensity: avgStorm / 10,
      momentum: avgTemp > 0 ? 1 : -1,
      volatility: Math.abs(avgPressure) / 10,
      dominantFrequency: 1 - avgStorm / 10,
      harmonicResonance: avgForecast,
      phaseAlignment: (avgOscillation + 1) / 2,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'climate',
      quadrantProfile: { aggressive: 0.2, defensive: 0.6, tactical: 0.1, strategic: 0.1 },
      temporalFlow: { early: 0.6, mid: 0.3, late: 0.1 },
      intensity: 0.3,
      momentum: 0,
      volatility: 0.4,
      dominantFrequency: 0.7,
      harmonicResonance: 0.8,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const meteorologicalAdapter = new MeteorologicalAdapter();
export { WEATHER_SYSTEMS, STORM_DYNAMICS, CLIMATE_PATTERNS, FORECAST_SCIENCE, EXTREME_EVENTS };
export type { MeteorologicalEvent };
