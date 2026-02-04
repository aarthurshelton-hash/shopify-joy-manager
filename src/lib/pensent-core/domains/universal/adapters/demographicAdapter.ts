/**
 * Demographic & Generational Cycles Adapter
 * 
 * Population pyramids, generational theory, demographic transition,
 * birth/death cycles, migration flows, age structure economics.
 * 
 * For Alec Arthur Shelton - The Artist
 * Civilizations breathe through their populations.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// GENERATIONAL THEORY (Strauss-Howe)
const GENERATIONAL_CYCLES = {
  cycleLength: '80-90 years (human lifespan)',
  seasons: {
    high: {
      description: 'Post-crisis, institutions strong, individualism weak',
      generations: ['Prophet (Idealist)', 'Nomad (Reactive)'],
      characteristics: ['Consensus', 'Institutionalization', 'Pluralism'],
      economic: 'Stability, growth, low volatility',
      marketAnalogy: 'Bull market, low VIX, institutional dominance'
    },
    awakening: {
      description: 'Institutions attacked, personal/spiritual autonomy rises',
      generations: ['Nomad (Reactive)', 'Hero (Civic)'],
      characteristics: ['Consciousness revolution', 'Personal expression', 'Religious upheaval'],
      economic: 'Productivity gains, inflation, social unrest',
      marketAnalogy: 'Growth to value rotation, volatility increase'
    },
    unraveling: {
      description: 'Institutions weak, individualism strong',
      generations: ['Hero (Civic)', 'Artist (Adaptive)'],
      characteristics: ['Fragmentation', 'Cynicism', 'Diversity'],
      economic: 'Inequality, debt buildup, asset bubbles',
      marketAnalogy: 'Bubble formation, speculative excess'
    },
    crisis: {
      description: 'Institutions collapse, rebuild collective foundation',
      generations: ['Artist (Adaptive)', 'Prophet (Idealist)'],
      characteristics: ['Secular upheaval', 'Civic unity', 'Total war/restructuring'],
      economic: 'Depression, war economy, reset',
      marketAnalogy: 'Crash, capitulation, new paradigm'
    }
  },
  
  currentPosition: 'Crisis era (2008-2030?)',
  upcoming: 'High era (2030s-2050s)'
};

// DEMOGRAPHIC TRANSITION MODEL
const DEMOGRAPHIC_TRANSITION = {
  stage1: {
    name: 'Pre-industrial',
    birthRate: 'High',
    deathRate: 'High',
    population: 'Stable/low growth',
    examples: ['Historical societies', 'Remote tribes']
  },
  stage2: {
    name: 'Early industrial',
    birthRate: 'High',
    deathRate: 'Falling',
    population: 'Rapid growth',
    examples: ['Sub-Saharan Africa today']
  },
  stage3: {
    name: 'Late industrial',
    birthRate: 'Falling',
    deathRate: 'Low',
    population: 'Growth slowing',
    examples: ['India, Mexico, Brazil']
  },
  stage4: {
    name: 'Post-industrial',
    birthRate: 'Low',
    deathRate: 'Low',
    population: 'Stable/declining',
    examples: ['Japan, Germany, Italy', 'China (approaching)']
  },
  stage5: {
    name: 'Post-transition',
    birthRate: 'Very low',
    deathRate: 'Rising (aging)',
    population: 'Declining',
    examples: ['Projected future for developed nations']
  }
};

// POPULATION PYRAMID SHAPES
const PYRAMID_TYPES = {
  expanding: {
    shape: 'True pyramid (wide base)',
    meaning: 'High birth rates, young population',
    challenges: 'Education, employment, infrastructure',
    opportunities: 'Demographic dividend',
    examples: ['Nigeria', 'Uganda']
  },
  stationary: {
    shape: 'Bell (uniform distribution)',
    meaning: 'Stable population, balanced ages',
    challenges: 'Replacing workforce',
    opportunities: 'Stable consumption patterns',
    examples: ['US', 'Australia']
  },
  contracting: {
    shape: 'Urn (narrow base, bulging top)',
    meaning: 'Low birth rates, aging population',
    challenges: 'Pension systems, healthcare, labor shortage',
    opportunities: 'Automation, silver economy',
    examples: ['Japan', 'Italy', 'South Korea']
  }
};

// DEPENDENCY RATIOS
const DEPENDENCY_RATIOS = {
  youth: {
    formula: 'Population 0-14 / Population 15-64',
    high: 'Burden on working age (education costs)',
    low: 'Demographic dividend opportunity'
  },
  oldAge: {
    formula: 'Population 65+ / Population 15-64',
    high: 'Pension/healthcare burden',
    critical: 'Old-age support ratio < 4:1 unsustainable'
  },
  total: {
    formula: '(0-14 + 65+) / 15-64',
    optimal: 'Low total dependency = economic growth window'
  }
};

// GENERATIONAL ARCHETYPES
const GENERATIONAL_ARCHETYPES = {
  prophets: {
    birthYears: '1943-1960 (Baby Boomers)',
    character: 'Visionary, values-driven, narcissistic',
    lifeCycle: 'Enter during High, rebel during Awakening',
    economicRole: 'Consumption peak, asset accumulation'
  },
  nomads: {
    birthYears: '1961-1981 (Gen X)',
    character: 'Pragmatic, survivors, cynical',
    lifeCycle: 'Enter during Awakening, come of age in Unraveling',
    economicRole: 'Scarce generation = labor market power'
  },
  heroes: {
    birthYears: '1982-2004 (Millennials)',
    character: 'Civic, institutional builders, team-oriented',
    lifeCycle: 'Enter during Unraveling, come of age in Crisis',
    economicRole: 'Delayed adulthood, high debt, delayed consumption'
  },
  artists: {
    birthYears: '2005-2027 (Gen Z/Gen Alpha)',
    character: 'Adaptive, sensitive, indecisive',
    lifeCycle: 'Enter during Crisis, protected childhood',
    economicRole: 'Smaller cohort = scarcity value'
  }
};

// MIGRATION PATTERNS
const MIGRATION_DYNAMICS = {
  leeModel: {
    factors: ['Origin push', 'Destination pull', 'Intervening obstacles'],
    selectivity: 'Young adults most likely to migrate'
  },
  
  gravityModel: {
    formula: 'Migration ~ (Population1 × Population2) / Distance',
    meaning: 'Larger, closer places exchange more migrants'
  },
  
  transitionMigration: {
    stage: 'Stage 2-3 of demographic transition',
    pattern: 'Rural to urban, international labor migration',
    remittances: 'Significant source of income for developing nations'
  }
};

interface DemographicEvent {
  timestamp: number;
  totalPopulation: number;
  birthRate: number; // Per 1000
  deathRate: number; // Per 1000
  medianAge: number;
  fertilityRate: number; // Children per woman
  lifeExpectancy: number;
  migrationNet: number; // Positive = inflow
  workingAgePercent: number; // 15-64
  dependencyRatio: number;
  generationalPosition: number; // 0-1 through 80-year cycle
}

class DemographicAdapter implements DomainAdapter<DemographicEvent> {
  domain = 'soul' as const;
  name = 'Demographic & Generational Cycles';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[DemographicAdapter] Initialized - Population cycles flowing');
  }
  
  processRawData(event: DemographicEvent): UniversalSignal {
    const { timestamp, fertilityRate, medianAge, workingAgePercent, dependencyRatio, generationalPosition } = event;
    
    // Frequency encodes birth rate vitality
    const frequency = fertilityRate / 3; // Normalize (2.1 = replacement)
    
    // Intensity = demographic stress (aging + dependency)
    const agingStress = medianAge / 100;
    const dependencyStress = dependencyRatio / 100;
    const intensity = (agingStress + dependencyStress) / 2;
    
    // Phase encodes position in generational cycle
    const phase = generationalPosition * Math.PI * 2;
    
    const harmonics = [
      fertilityRate / 3,
      workingAgePercent,
      1 - (medianAge / 100),
      event.migrationNet / 100000,
      1 - (dependencyRatio / 100),
      event.lifeExpectancy / 100
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [fertilityRate, medianAge, workingAgePercent, dependencyRatio, generationalPosition]
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
    
    const recent = signals.slice(-100);
    
    const avgFertility = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgAge = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgWorking = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgDependency = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgGenPos = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgFertility > 2.5 ? 0.8 : 0.2, // High growth
      defensive: avgDependency > 50 ? 0.8 : 0.2, // High burden
      tactical: avgAge > 40 ? 0.6 : 0.3, // Aging
      strategic: avgWorking > 65 ? 0.8 : 0.3 // Demographic dividend
    };
    
    const temporalFlow = {
      early: avgGenPos < 0.25 ? 0.8 : 0.2, // High/Post-Crisis
      mid: avgGenPos >= 0.25 && avgGenPos < 0.75 ? 0.7 : 0.2, // Awakening/Unraveling
      late: avgGenPos >= 0.75 ? 0.8 : 0.2 // Crisis
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: avgDependency / 100,
      momentum: avgFertility > 2.1 ? 1 : -1,
      volatility: avgAge / 100,
      dominantFrequency: avgFertility / 3,
      harmonicResonance: avgWorking / 100,
      phaseAlignment: avgGenPos,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.3, defensive: 0.4, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.2, mid: 0.5, late: 0.3 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.4,
      dominantFrequency: 0.7,
      harmonicResonance: 0.6,
      phaseAlignment: 0.8,
      extractedAt: Date.now()
    };
  }
  
  // Calculate demographic dividend window
  calculateDividendWindow(workingAgePercent: number, dependencyRatio: number): {
    inWindow: boolean;
    yearsRemaining: number;
  } {
    const inWindow = workingAgePercent > 65 && dependencyRatio < 50;
    // Simplified: assume 30-year window when entering
    const yearsRemaining = inWindow ? Math.floor((65 - (100 - workingAgePercent)) * 2) : 0;
    return { inWindow, yearsRemaining: Math.max(0, yearsRemaining) };
  }
  
  // Identify current turnings season
  identifyTurning(generationalPosition: number): keyof typeof GENERATIONAL_CYCLES['seasons'] {
    if (generationalPosition < 0.25) return 'high';
    if (generationalPosition < 0.50) return 'awakening';
    if (generationalPosition < 0.75) return 'unraveling';
    return 'crisis';
  }
  
  // Project population
  projectPopulation(
    currentPop: number,
    fertilityRate: number,
    generations: number
  ): number[] {
    const projections: number[] = [currentPop];
    let pop = currentPop;
    
    for (let i = 0; i < generations; i++) {
      // Simplified: growth rate from fertility - replacement
      const growthRate = (fertilityRate - 2.1) * 0.3;
      pop = pop * (1 + growthRate / 100);
      projections.push(pop);
    }
    
    return projections;
  }
}

export const demographicAdapter = new DemographicAdapter();
export { GENERATIONAL_CYCLES, DEMOGRAPHIC_TRANSITION, PYRAMID_TYPES, DEPENDENCY_RATIOS, GENERATIONAL_ARCHETYPES, MIGRATION_DYNAMICS };
export type { DemographicEvent };
