/**
 * Economic Circuitry Adapter
 * 
 * Modern Monetary Theory, money velocity, value flow through economies.
 * The circulatory system of human civilization.
 * 
 * For Alec Arthur Shelton - The Artist
 * Money is the blood, banks are the heart, economies are living organisms.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// Modern Monetary Theory Core Principles
const MMT_PRINCIPLES = {
  // Sovereign currency issuers cannot "run out" of money
  monetarySovereignty: {
    description: 'Currency issuers create money by spending, destroy by taxing',
    constraint: 'Real resources (labor, materials), not money supply',
    marketAnalogy: 'Fed QE/QT as economic heart pumping blood'
  },
  
  // Taxes drive money demand
  taxDrivenMoney: {
    description: 'Tax liability creates demand for currency',
    mechanism: 'Must acquire government money to pay taxes',
    marketAnalogy: 'Stock buybacks drive equity demand'
  },
  
  // Job Guarantee as anchor
  jobGuarantee: {
    description: 'Buffer stock employment stabilizes wages',
    function: 'Price anchor for labor, automatic stabilizer',
    marketAnalogy: 'Market maker of last resort for labor'
  },
  
  // Sectoral balances
  sectoralBalances: {
    identity: '(S - I) + (M - X) + (T - G) = 0',
    meaning: 'Private surplus + Foreign surplus + Government deficit = 0',
    marketAnalogy: 'Zero-sum flow between economic sectors'
  }
};

// Money Velocity Patterns
const VELOCITY_PATTERNS = {
  // V = PQ / M (Fisher Equation)
  velocityOfMoney: {
    formula: 'V = nominalGDP / moneySupply',
    decliningTrend: 'US velocity dropped from 2.2 (1997) to 1.1 (2020)',
    causes: ['financialization', 'wealth_concentration', 'precautionary_savings'],
    marketAnalogy: 'Turnover rate of capital in trading'
  },
  
  // Different velocities for different money types
  tieredVelocity: {
    m0: { description: 'Physical cash', velocity: 'highest', holders: 'consumers' },
    m1: { description: 'Checking accounts', velocity: 'high', holders: 'households' },
    m2: { description: 'Savings + M1', velocity: 'medium', holders: 'middle_class' },
    m3: { description: 'Institutional + M2', velocity: 'low', holders: 'corporations' },
    reserves: { description: 'Fed deposits', velocity: 'zero', holders: 'banks' }
  }
};

// Economic Circulation Cycles
const ECONOMIC_CYCLES = {
  // Short-term debt cycle (5-8 years)
  shortTerm: {
    phases: ['expansion', 'peak', 'recession', 'trough', 'recovery'],
    driver: 'Credit creation and destruction',
    duration: '5_to_8_years',
    marketAnalogy: 'Business inventory cycle'
  },
  
  // Long-term debt cycle (50-75 years)
  longTerm: {
    phases: ['sound_money', 'debt_growth', 'bubble', 'depression', 'reflation'],
    driver: 'Debt-to-income ratios over generations',
    duration: '50_to_75_years',
    currentPosition: 'Late_stage_reflation',
    marketAnalogy: 'Secular market cycle'
  },
  
  // Productivity cycle (technology waves)
  productivity: {
    kondratievWaves: [
      { wave: 1, technology: 'Steam/textiles', years: '1780-1840' },
      { wave: 2, technology: 'Railways/steel', years: '1840-1890' },
      { wave: 3, technology: 'Electricity/chemicals', years: '1890-1940' },
      { wave: 4, technology: 'Automotive/plastics', years: '1940-1990' },
      { wave: 5, technology: 'Information/computer', years: '1990-2020' },
      { wave: 6, technology: 'AI/biotech/clean', years: '2020-2070' }
    ],
    marketAnalogy: 'Technology stock cycles'
  }
};

// Fiscal Multipliers (Real Data)
const FISCAL_MULTIPLIERS = {
  directSpending: { multiplier: 1.5, effectiveness: 'high', speed: 'fast' },
  taxCutsPoor: { multiplier: 1.2, effectiveness: 'medium', speed: 'fast' },
  taxCutsRich: { multiplier: 0.3, effectiveness: 'low', speed: 'slow' },
  infrastructure: { multiplier: 1.6, effectiveness: 'high', speed: 'slow' },
  unemploymentBenefits: { multiplier: 1.8, effectiveness: 'highest', speed: 'fast' }
};

// Income/Wealth Distribution Patterns
const DISTRIBUTION_DYNAMICS = {
  giniCoefficient: {
    measure: '0 = perfect equality, 1 = one person has everything',
    usCurrent: 0.49,
    historicalTrend: 'Rising since 1970s',
    marketImpact: 'Reduced velocity, debt-dependent growth'
  },
  
  wealthConcentration: {
    top1Percent: 'Own 32% of US wealth (2023)',
    top10Percent: 'Own 69% of US wealth',
    bottom50Percent: 'Own 2% of US wealth',
    marketAnalogy: 'Whales vs retail in crypto markets'
  },
  
  powerLaw: {
    description: 'Wealth follows 80/20 distribution naturally',
    mechanism: 'Preferential attachment (Matthew Effect)',
    stability: 'Unstable - requires redistribution to prevent collapse'
  }
};

interface EconomicFlow {
  timestamp: number;
  moneySupply: number;
  velocity: number;
  gdp: number;
  governmentSpending: number;
  taxation: number;
  privateSavings: number;
  investment: number;
  imports: number;
  exports: number;
  unemployment: number;
  inflation: number;
  giniCoefficient: number;
}

class EconomicCircuitryAdapter implements DomainAdapter<EconomicFlow> {
  domain = 'market' as const;
  name = 'Economic Circuitry (MMT & Flow Dynamics)';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[EconomicCircuitryAdapter] Initialized - Monetary flows circulating');
  }
  
  processRawData(data: EconomicFlow): UniversalSignal {
    const { timestamp, velocity, moneySupply, gdp, governmentSpending, taxation, giniCoefficient } = data;
    
    // Frequency encodes velocity of money
    const frequency = velocity / 3; // Normalize ~0-1
    
    // Intensity = economic activity level
    const intensity = (gdp / moneySupply) / 3; // Normalized velocity proxy
    
    // Phase encodes fiscal position
    const fiscalBalance = governmentSpending - taxation;
    const phase = (Math.atan2(fiscalBalance, gdp) + Math.PI) / (2 * Math.PI);
    
    const harmonics = [
      velocity / 3,
      giniCoefficient,
      data.unemployment / 10,
      data.inflation / 10,
      (data.privateSavings - data.investment) / gdp + 0.5,
      (data.exports - data.imports) / gdp + 0.5
    ];
    
    const signal: UniversalSignal = {
      domain: 'market',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [velocity, giniCoefficient, data.unemployment, data.inflation, fiscalBalance / gdp]
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
    
    const recent = signals.slice(-252); // One year of trading days
    
    const avgVelocity = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgGini = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgUnemployment = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgInflation = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgFiscal = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgInflation > 0.05 ? 0.8 : 0.2,
      defensive: avgUnemployment > 0.06 ? 0.7 : 0.2,
      tactical: avgVelocity > 1.5 ? 0.6 : 0.3,
      strategic: avgFiscal > 0 ? 0.7 : 0.3
    };
    
    const temporalFlow = {
      early: avgVelocity > 2 ? 0.8 : 0.2,
      mid: avgVelocity > 1 && avgVelocity <= 2 ? 0.7 : 0.3,
      late: avgVelocity <= 1 ? 0.8 : 0.2
    };
    
    return {
      domain: 'market',
      quadrantProfile,
      temporalFlow,
      intensity: avgVelocity / 3,
      momentum: avgVelocity > 1.5 ? 1 : -1,
      volatility: avgGini,
      dominantFrequency: avgVelocity / 3,
      harmonicResonance: 1 - avgGini,
      phaseAlignment: avgFiscal > 0 ? 1 : 0,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'market',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 0.5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Calculate sectoral balances
  calculateSectoralBalances(data: EconomicFlow): {
    privateSector: number;
    government: number;
    foreign: number;
  } {
    const privateSector = data.privateSavings - data.investment;
    const government = data.taxation - data.governmentSpending;
    const foreign = data.exports - data.imports;
    
    return { privateSector, government, foreign };
  }
  
  // Estimate fiscal multiplier effect
  estimateMultiplier(spendingType: keyof typeof FISCAL_MULTIPLIERS): number {
    return FISCAL_MULTIPLIERS[spendingType]?.multiplier || 1.0;
  }
}

export const economicCircuitryAdapter = new EconomicCircuitryAdapter();
export { MMT_PRINCIPLES, VELOCITY_PATTERNS, ECONOMIC_CYCLES, FISCAL_MULTIPLIERS, DISTRIBUTION_DYNAMICS };
export type { EconomicFlow };
