/**
 * Immunological Adapter
 * 
 * Biological threat detection, antibody learning, immune memory.
 * The body's pattern recognition system applied to universal threats.
 * 
 * For Alec Arthur Shelton - The Artist
 * The immune system is nature's first universal pattern engine.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// IMMUNE SYSTEM ARCHITECTURE
const IMMUNE_COMPONENTS = {
  innate: {
    description: 'First line defense, non-specific, immediate',
    cells: ['macrophages', 'neutrophils', 'NK_cells', 'dendritic_cells'],
    responseTime: 'minutes_to_hours',
    memory: false,
    marketAnalogy: 'Circuit breakers, volatility halts'
  },
  
  adaptive: {
    description: 'Specific, learned, memory-based',
    cells: ['T_cells', 'B_cells'],
    responseTime: 'days_to_weeks',
    memory: true,
    marketAnalogy: 'Pattern learning, historical backtesting'
  },
  
  humoral: {
    description: 'Antibody-mediated, extracellular',
    mechanism: 'B_cells produce antibodies targeting specific antigens',
    memory: 'Long_lived_plasma_cells',
    marketAnalogy: 'Quantitative models with specific triggers'
  },
  
  cellular: {
    description: 'Cell-mediated, intracellular',
    mechanism: 'Cytotoxic T_cells destroy infected cells',
    memory: 'Memory_T_cells',
    marketAnalogy: 'Direct intervention, position liquidation'
  }
};

// ANTIGEN RECOGNITION PATTERNS
const ANTIGEN_PATTERNS = {
  // How antibodies recognize pathogens
  epitopeBinding: {
    description: 'Lock-and-key recognition of molecular patterns',
    specificity: 'Can distinguish single amino acid changes',
    crossReactivity: 'Similar antigens may trigger same antibody',
    marketAnalogy: 'Pattern matching with tolerance for variation'
  },
  
  // Clonal selection theory
  clonalSelection: {
    description: 'Random antibody generation, selective amplification',
    process: [
      'Random_VDJ_recombination_creates_diversity',
      'Antigen_presents_to_matching_B_cell',
      'Selected_clone_proliferates',
      'Differentiation_into_plasma_and_memory_cells'
    ],
    marketAnalogy: 'Genetic algorithms, strategy selection'
  },
  
  // Immune tolerance
  selfTolerance: {
    central: 'Delete self-reactive T_cells in thymus',
    peripheral: 'Suppress auto-reactive cells in circulation',
    failure: 'Autoimmune disease',
    marketAnalogy: 'Overfitting prevention, out-of-sample testing'
  }
};

// EPIDEMIOLOGICAL PATTERNS
const EPIDEMIC_DYNAMICS = {
  // SIR Model (Real epidemiological math)
  sirModel: {
    description: 'Susceptible - Infected - Recovered',
    equations: {
      dS_dt: '-beta * S * I / N',
      dI_dt: 'beta * S * I / N - gamma * I', 
      dR_dt: 'gamma * I'
    },
    r0: 'Basic reproduction number (average infections per case)',
    herdImmunity: '1 - 1/R0',
    marketAnalogy: 'Viral content spread, meme propagation'
  },
  
  // Wave patterns
  epidemicWaves: {
    firstWave: 'Initial susceptible population',
    secondWave: 'New variants or waning immunity', 
    thirdWave: 'Seasonal factors, behavior changes',
    marketAnalogy: 'Market cycles, sentiment waves'
  },
  
  // Vaccine efficacy
  vaccineMetrics: {
    efficacy: 'Risk reduction in controlled trial',
    effectiveness: 'Real-world risk reduction',
    herdThreshold: 'Coverage needed for population protection',
    breakthrough: 'Infection despite vaccination'
  }
};

// CYTOKINE PATTERNS (Immune signaling)
const CYTOKINE_PROFILES = {
  proInflammatory: {
    il1: 'Fever induction, acute phase response',
    il6: 'Liver acute phase proteins, B_cell_activation',
    tnf_alpha: 'Vascular permeability, cachexia',
    marketAnalogy: 'Fear signals, volatility spikes'
  },
  
  antiInflammatory: {
    il10: 'Suppress excessive inflammation',
    tgf_beta: 'Wound healing, fibrosis',
    il4: 'Th2 response, humoral immunity',
    marketAnalogy: 'Risk-off positioning, hedging'
  },
  
  // Cytokine storm
  cytokineStorm: {
    description: 'Excessive inflammatory response',
    causes: ['viral_infection', 'CAR_T_therapy', 'autoimmune_flare'],
    mortality: 'High without intervention',
    marketAnalogy: 'Panic selling, liquidity crisis'
  }
};

// IMMUNOLOGICAL MEMORY
const IMMUNE_MEMORY = {
  // How immunity persists
  memoryBCells: {
    lifespan: 'Decades_to_lifetime',
    function: 'Rapid_antibody_production_on_re_exposure',
    affinityMaturation: 'Antibodies improve over time'
  },
  
  memoryTCells: {
    types: ['central_memory', 'effector_memory', 'tissue_resident'],
    central: 'Patrol lymph nodes, rapid proliferation',
    effector: 'Circulate blood, immediate response',
    marketAnalogy: 'Systematic vs discretionary strategies'
  },
  
  // Vaccine types
  vaccinePlatforms: {
    mRNA: 'Pfizer, Moderna - genetic instructions for spike protein',
    viralVector: 'J&J, AstraZeneca - harmless virus carries code',
    inactivated: 'Sinovac - killed virus particles',
    proteinSubunit: 'Novavax - purified spike fragments',
    liveAttenuated: 'Measles, chickenpox - weakened virus'
  }
};

interface ImmunologicalEvent {
  timestamp: number;
  pathogenLoad: number;
  antibodyTiter: number;
  tCellCount: number;
  cytokineLevel: number; // IL-6 proxy
  fever: number; // Temperature above 37C
  r0: number;
  vaccinationRate: number;
  variantEscape: number; // 0-1 antigenic drift
}

class ImmunologicalAdapter implements DomainAdapter<ImmunologicalEvent> {
  domain = 'bio' as const;
  name = 'Immunological Pattern Recognition';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  // Track pathogen memory
  private pathogenMemory: Map<string, {
    firstEncounter: number;
    antibodyAffinity: number;
    memoryBCellCount: number;
    memoryTCellCount: number;
  }> = new Map();
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[ImmunologicalAdapter] Initialized - Immune surveillance active');
  }
  
  processRawData(event: ImmunologicalEvent): UniversalSignal {
    const { timestamp, pathogenLoad, antibodyTiter, tCellCount, cytokineLevel, r0 } = event;
    
    // Frequency encodes infection rate (R0)
    const frequency = Math.min(r0 / 5, 1); // Cap at R0=5
    
    // Intensity = immune response activation
    const responseStrength = (antibodyTiter + tCellCount + cytokineLevel) / 3;
    const intensity = Math.min(responseStrength / 100, 1);
    
    // Phase encodes balance between pathogen and immune system
    const pathogenImmuneRatio = pathogenLoad / (responseStrength + 1);
    const phase = Math.atan(pathogenImmuneRatio) / (Math.PI / 2);
    
    const harmonics = [
      pathogenLoad / 1000,
      antibodyTiter / 100,
      tCellCount / 1000,
      cytokineLevel / 100,
      event.vaccinationRate,
      1 - event.variantEscape
    ];
    
    const signal: UniversalSignal = {
      domain: 'bio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [pathogenLoad, antibodyTiter, r0, cytokineLevel, event.fever]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.updatePathogenMemory(event);
    this.lastUpdate = timestamp;
    return signal;
  }
  
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }
    
    const recent = signals.slice(-100);
    
    const avgPathogen = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgAntibody = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgR0 = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgCytokine = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgFever = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgPathogen > 100 ? 0.9 : 0.1,
      defensive: avgAntibody > 50 ? 0.8 : 0.2,
      tactical: avgR0 > 2 ? 0.7 : 0.3,
      strategic: avgCytokine < 10 ? 0.6 : 0.2
    };
    
    const temporalFlow = {
      early: avgPathogen < 10 ? 0.8 : 0.2,
      mid: avgPathogen >= 10 && avgPathogen < 100 ? 0.7 : 0.2,
      late: avgPathogen >= 100 ? 0.6 : 0.3
    };
    
    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: avgAntibody / 100,
      momentum: avgR0 > 1 ? 1 : -1,
      volatility: avgCytokine / 100,
      dominantFrequency: avgR0 / 5,
      harmonicResonance: avgAntibody / (avgPathogen + avgAntibody + 1),
      phaseAlignment: avgFever / 10,
      extractedAt: Date.now()
    };
  }
  
  private updatePathogenMemory(event: ImmunologicalEvent): void {
    // Simplified - would use actual pathogen ID in real implementation
    const pathogenId = 'current_pathogen';
    
    const existing = this.pathogenMemory.get(pathogenId);
    if (existing) {
      existing.antibodyAffinity = Math.min(existing.antibodyAffinity + 0.01, 1);
      existing.memoryBCellCount += event.antibodyTiter * 0.1;
      existing.memoryTCellCount += event.tCellCount * 0.1;
    } else {
      this.pathogenMemory.set(pathogenId, {
        firstEncounter: event.timestamp,
        antibodyAffinity: 0.1,
        memoryBCellCount: event.antibodyTiter * 0.5,
        memoryTCellCount: event.tCellCount * 0.5
      });
    }
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.1, defensive: 0.6, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.3,
      momentum: 1,
      volatility: 0.2,
      dominantFrequency: 0.2,
      harmonicResonance: 0.8,
      phaseAlignment: 0.1,
      extractedAt: Date.now()
    };
  }
  
  // Calculate herd immunity threshold
  calculateHerdImmunity(r0: number): number {
    return 1 - 1 / Math.max(r0, 1.01);
  }
  
  // Simulate SIR model
  simulateSIR(S: number, I: number, R: number, beta: number, gamma: number, days: number): {
    susceptible: number[];
    infected: number[];
    recovered: number[];
  } {
    const N = S + I + R;
    const results = { susceptible: [S], infected: [I], recovered: [R] };
    
    for (let day = 0; day < days; day++) {
      const dS = -beta * S * I / N;
      const dI = beta * S * I / N - gamma * I;
      const dR = gamma * I;
      
      S = Math.max(0, S + dS);
      I = Math.max(0, I + dI);
      R = Math.max(0, R + dR);
      
      results.susceptible.push(S);
      results.infected.push(I);
      results.recovered.push(R);
    }
    
    return results;
  }
}

export const immunologicalAdapter = new ImmunologicalAdapter();
export { IMMUNE_COMPONENTS, ANTIGEN_PATTERNS, EPIDEMIC_DYNAMICS, CYTOKINE_PROFILES, IMMUNE_MEMORY };
export type { ImmunologicalEvent };
