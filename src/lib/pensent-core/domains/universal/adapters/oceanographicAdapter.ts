/**
 * Oceanographic Adapter - Sea Currents & Marine Ecosystem Dynamics
 * 
 * Tidal patterns, current systems, marine food webs, ocean acidification,
 * and the temporal rhythms of the world ocean.
 * 
 * For Alec Arthur Shelton - The Artist
 * The ocean is the planets memory, storing heat and carbon across centuries.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// CURRENT SYSTEMS
const CURRENT_SYSTEMS = {
  gulfStream: {
    type: 'Western boundary current',
    function: 'Heat transport, climate moderation',
    speed: 'Fast, narrow, deep',
    impact: 'NW Europe warmth'
  },
  
  thermohaline: {
    name: 'Great Ocean Conveyor',
    driver: 'Temperature and salinity gradients',
    timescale: 'Centuries to millennia',
    importance: 'Global heat distribution, nutrient cycling'
  },
  
  equatorial: {
    systems: ['Equatorial Counter', 'Cromwell', 'Lomonosov'],
    dynamics: 'Trade wind driven, upwelling',
    productivity: 'High biological activity'
  },
  
  upwelling: {
    mechanism: 'Wind-driven, diverging currents',
    locations: ['Peru', 'California', 'Namibia', 'Somalia'],
    productivity: 'Rich fisheries'
  }
};

// TIDAL PATTERNS
const TIDAL_DYNAMICS = {
  semidiurnal: {
    pattern: 'Two high, two low per day',
    examples: ['US East Coast', 'Europe'],
    range: 'Moderate'
  },
  
  diurnal: {
    pattern: 'One high, one low per day',
    examples: ['Gulf of Mexico', 'SE Asia'],
    range: 'Variable'
  },
  
  mixed: {
    pattern: 'Two unequal highs/lows',
    examples: ['US West Coast', 'Pacific islands'],
    range: 'Variable'
  },
  
  springNeap: {
    spring: 'Sun and moon aligned, higher tides',
    neap: 'Sun and moon perpendicular, lower tides',
    cycle: '14 days'
  }
};

// MARINE ECOSYSTEMS
const MARINE_ECOSYSTEMS = {
  photic: {
    zone: 'Sunlight penetrates (0-200m)',
    production: 'Photosynthesis dominant',
    ecosystems: ['Coral reefs', 'Kelp forests', 'Open ocean']
  },
  
  aphotic: {
    zone: 'No sunlight (>1000m)',
    production: 'Chemosynthesis, detritus',
    ecosystems: ['Deep sea', 'Hydrothermal vents', 'Whale falls']
  },
  
  benthic: {
    zone: 'Sea floor',
    types: ['Coastal', 'Continental shelf', 'Abyssal plain', 'Trench'],
    diversity: 'High in shallow, endemic in deep'
  },
  
  pelagic: {
    zone: 'Open water',
    divisions: ['Neritic (coastal)', 'Oceanic (deep)'],
    migration: 'Diel vertical, seasonal'
  }
};

// OCEAN STRESSORS
const OCEAN_STRESS = {
  warming: {
    impact: 'Sea level rise, stratification, species shift',
    absorption: '90% of excess heat',
    acidification: 'CO2 dissolution, pH decline'
  },
  
  deoxygenation: {
    cause: 'Warming, stratification, eutrophication',
    zones: 'Expanding dead zones',
    impact: 'Habitat loss, species mortality'
  },
  
  pollution: {
    plastics: 'Microplastics throughout water column',
    chemicals: 'Persistent organic pollutants',
    noise: 'Shipping, seismic, military sonar'
  },
  
  overfishing: {
    status: '34% of stocks overfished',
    impact: 'Trophic cascade, ecosystem collapse',
    management: 'Quotas, MPAs, aquaculture'
  }
};

// CIRCULATION PATTERNS
const CIRCULATION_CYCLES = {
  ensoOcean: {
    elNino: 'Warm pool east, reduced upwelling',
    laNina: 'Enhanced upwelling, cool eastern Pacific',
    impacts: 'Global weather, fisheries, hurricanes'
  },
  
  pdo: {
    warmPhase: 'Coastal warming, salmon decline',
    coolPhase: 'Enhanced upwelling, salmon increase',
    period: 'Decades'
  },
  
  amo: {
    warmPhase: 'Enhanced Atlantic hurricanes, Sahel drought',
    coolPhase: 'Reduced hurricanes, Sahel wetter',
    period: '60-80 years'
  }
};

interface OceanographicEvent {
  timestamp: number;
  seaSurfaceTemperature: number; // °C anomaly
  salinityLevel: number; // PSU
  currentVelocity: number; // m/s
  pHLevel: number; // 7.5-8.5
  oxygenConcentration: number; // mg/L
  chlorophyllDensity: number; // proxy for productivity
  tidalRange: number; // meters
  upwellingIndex: number; // 0-1
}

class OceanographicAdapter implements DomainAdapter<OceanographicEvent> {
  domain = 'climate' as const;
  name = 'Oceanographic Systems & Marine Dynamics';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[OceanographicAdapter] Initialized - Ocean patterns flowing');
  }
  
  processRawData(event: OceanographicEvent): UniversalSignal {
    const { timestamp, seaSurfaceTemperature, pHLevel, oxygenConcentration, chlorophyllDensity, upwellingIndex } = event;
    
    // Frequency encodes productivity cycles
    const frequency = chlorophyllDensity;
    
    // Intensity = ocean stress level
    const intensity = Math.abs(seaSurfaceTemperature) / 3 * (8.5 - pHLevel) / 1 * (1 - oxygenConcentration / 10);
    
    // Phase encodes tidal/upwelling alignment
    const phase = upwellingIndex * Math.PI;
    
    const harmonics = [
      1 - Math.abs(seaSurfaceTemperature) / 5,
      (pHLevel - 7.5) / 1,
      oxygenConcentration / 10,
      chlorophyllDensity,
      upwellingIndex,
      1 - event.salinityLevel / 40
    ];
    
    const signal: UniversalSignal = {
      domain: 'climate',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [seaSurfaceTemperature, pHLevel, oxygenConcentration, chlorophyllDensity, upwellingIndex]
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
    
    const avgTemp = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgPH = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgOxygen = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgChloro = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgUpwelling = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: Math.abs(avgTemp) > 2 ? 0.8 : 0.2,
      defensive: avgOxygen > 6 ? 0.7 : 0.2,
      tactical: avgUpwelling > 0.5 ? 0.7 : 0.3,
      strategic: avgChloro > 0.5 ? 0.7 : 0.3
    };
    
    const temporalFlow = {
      early: avgUpwelling < 0.3 ? 0.7 : 0.3,
      mid: avgUpwelling >= 0.3 && avgUpwelling < 0.7 ? 0.8 : 0.1,
      late: avgUpwelling >= 0.7 ? 0.7 : 0.3
    };
    
    return {
      domain: 'climate',
      quadrantProfile,
      temporalFlow,
      intensity: Math.abs(avgTemp) / 5,
      momentum: avgTemp > 0 ? 1 : -1,
      volatility: Math.abs(avgTemp) / 3,
      dominantFrequency: avgChloro,
      harmonicResonance: avgOxygen / 10,
      phaseAlignment: avgUpwelling,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'climate',
      quadrantProfile: { aggressive: 0.3, defensive: 0.4, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.4, mid: 0.4, late: 0.2 },
      intensity: 0.4,
      momentum: 1,
      volatility: 0.3,
      dominantFrequency: 0.6,
      harmonicResonance: 0.7,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const oceanographicAdapter = new OceanographicAdapter();
export { CURRENT_SYSTEMS, TIDAL_DYNAMICS, MARINE_ECOSYSTEMS, OCEAN_STRESS, CIRCULATION_CYCLES };
export type { OceanographicEvent };
