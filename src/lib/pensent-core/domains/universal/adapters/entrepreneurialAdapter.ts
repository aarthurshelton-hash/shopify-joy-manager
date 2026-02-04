/**
 * Entrepreneurial Adapter - Startup Lifecycles & VC Flow Dynamics
 * 
 * Company formation patterns, funding rounds, market timing,
 * founder dynamics, and the temporal rhythms of venture building.
 * 
 * For Alec Arthur Shelton - The Artist
 * Entrepreneurship is the art of creating value from vision and risk.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// STARTUP LIFECYCLE
const STARTUP_PHASES = {
  idea: {
    activities: ['Problem identification', 'Solution hypothesis', 'Market sizing'],
    funding: 'Bootstrap, friends and family, grants',
    mortality: 'Highest failure rate'
  },
  
  mvp: {
    activities: ['Build minimum viable product', 'First customers', 'Iteration'],
    funding: 'Pre-seed, angels',
    milestone: 'Product-market fit signals'
  },
  
  growth: {
    activities: ['Scale team', 'Expand market', 'Optimize unit economics'],
    funding: 'Seed, Series A',
    focus: 'Proven model, execution speed'
  },
  
  scale: {
    activities: ['Geographic expansion', 'Product lines', 'M&A'],
    funding: 'Series B, C, D+',
    challenge: 'Maintain culture, avoid bureaucracy'
  },
  
  maturity: {
    paths: ['IPO', 'Acquisition', 'Stay private', 'Merger'],
    transformation: 'From startup to corporation'
  }
};

// FUNDING DYNAMICS
const FUNDING_PATTERNS = {
  seed: {
    typical: '$500K - $2M',
    purpose: 'Product development, initial traction',
    investors: 'Angels, micro-VCs, accelerators'
  },
  
  seriesA: {
    typical: '$2M - $15M',
    purpose: 'Scale go-to-market',
    metrics: 'Revenue growth, customer acquisition'
  },
  
  seriesB: {
    typical: '$15M - $60M',
    purpose: 'Market expansion, team growth',
    focus: 'Unit economics, market leadership'
  },
  
  lateStage: {
    typical: '$50M+',
    purpose: 'Pre-IPO positioning, acquisitions',
    investors: 'Growth equity, crossover funds'
  },
  
  downRound: {
    cause: 'Missed milestones, market shifts, high burn',
    impact: 'Dilution, morale, investor relations'
  }
};

// MARKET TIMING
const TIMING_PATTERNS = {
  bullMarkets: {
    characteristics: 'High valuations, abundant capital, risk appetite',
    behavior: 'FOMO investing, growth over profit',
    examples: '2020-2021 tech boom'
  },
  
  bearMarkets: {
    characteristics: 'Valuation compression, scarce capital, focus on fundamentals',
    behavior: 'Efficiency, runway extension, down rounds',
    examples: '2022-2023 correction'
  },
  
  cycles: {
    pattern: '7-10 year boom-bust',
    driver: 'Interest rates, liquidity, sentiment',
    survival: 'Capital efficiency, strong fundamentals'
  },
  
  firstMover: {
    advantage: 'Brand, learning curve, network effects',
    risk: 'Education costs, technology shifts',
    optimal: 'Fast follower often wins'
  }
};

// FOUNDER DYNAMICS
const FOUNDER_PATTERNS = {
  soloVsTeam: {
    solo: 'Speed, vision clarity, burnout risk',
    team: 'Complementary skills, conflict potential',
    ideal: '2-3 co-founders with diverse skills'
  },
  
  equity: {
    splits: 'Equal vs contribution-based',
    vesting: '4-year standard, cliff common',
    pools: '10-20% for employees'
  },
  
  conflict: {
    sources: ['Vision divergence', 'Role clarity', 'Performance', 'Life events'],
    resolution: 'Clear agreements, mediation, buy-sell'
  },
  
  succession: {
    triggers: 'Skills mismatch, burnout, new phase',
    approaches: 'Hire above, move to board, exit'
  }
};

// FAILURE PATTERNS
const FAILURE_DYNAMICS = {
  cashBurn: {
    cause: 'Overhiring, expensive customer acquisition, lack of focus',
    warning: 'Runway < 6 months',
    response: 'Layoffs, down round, shutdown'
  },
  
  product: {
    cause: 'No market need, too early, too complex',
    indicator: 'Low engagement, high churn',
    pivot: 'Customer discovery, feature减法'
  },
  
  team: {
    cause: 'Co-founder split, key departures, culture failure',
    prevention: 'Vetting, vesting, alignment'
  },
  
  competition: {
    cause: 'Incumbent response, well-funded rival, platform risk',
    response: 'Differentiation, niche focus, speed'
  }
};

interface EntrepreneurialEvent {
  timestamp: number;
  runwayMonths: number; // 0-36
  revenueGrowth: number; // % monthly
  burnRate: number; // $K/month
  valuation: number; // relative index
  teamRetention: number; // 0-1
  productMarketFit: number; // 0-1
  competitivePressure: number; // 0-10
  fundingAccess: number; // 0-1
  marketSentiment: number; // 0-10
}

class EntrepreneurialAdapter implements DomainAdapter<EntrepreneurialEvent> {
  domain = 'market' as const;
  name = 'Entrepreneurial Venture & Startup Dynamics';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 3000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[EntrepreneurialAdapter] Initialized - Startup patterns active');
  }
  
  processRawData(event: EntrepreneurialEvent): UniversalSignal {
    const { timestamp, runwayMonths, revenueGrowth, burnRate, productMarketFit, fundingAccess, marketSentiment } = event;
    
    // Frequency encodes stability
    const frequency = Math.min(runwayMonths / 12, 1);
    
    // Intensity = startup drama (high burn + low runway + high growth)
    const intensity = (burnRate / 100) * (1 - Math.min(runwayMonths / 12, 1)) * (revenueGrowth / 100);
    
    // Phase encodes market sentiment-product fit alignment
    const phase = (productMarketFit + marketSentiment / 10) / 2 * Math.PI;
    
    const harmonics = [
      Math.min(runwayMonths / 18, 1),
      revenueGrowth / 50,
      1 - Math.min(burnRate / 200, 1),
      productMarketFit,
      fundingAccess,
      marketSentiment / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'market',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [runwayMonths, revenueGrowth, burnRate, productMarketFit, fundingAccess]
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
    
    const recent = signals.slice(-150);
    
    const avgRunway = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgGrowth = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgBurn = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgPMF = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgFunding = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgRunway < 6 ? 0.8 : 0.2,
      defensive: avgGrowth > 20 ? 0.7 : 0.2,
      tactical: avgBurn > 100 ? 0.6 : 0.3,
      strategic: avgPMF > 0.7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgRunway > 18 ? 0.8 : 0.2,
      mid: avgRunway > 6 && avgRunway <= 18 ? 0.7 : 0.2,
      late: avgRunway <= 6 ? 0.9 : 0.1
    };
    
    return {
      domain: 'market',
      quadrantProfile,
      temporalFlow,
      intensity: avgGrowth / 50,
      momentum: avgGrowth > 10 ? 1 : -1,
      volatility: avgBurn / 100,
      dominantFrequency: Math.min(avgRunway / 12, 1),
      harmonicResonance: avgPMF,
      phaseAlignment: avgFunding,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'market',
      quadrantProfile: { aggressive: 0.4, defensive: 0.2, tactical: 0.3, strategic: 0.1 },
      temporalFlow: { early: 0.6, mid: 0.3, late: 0.1 },
      intensity: 0.6,
      momentum: 1,
      volatility: 0.7,
      dominantFrequency: 0.5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.6,
      extractedAt: Date.now()
    };
  }
}

export const entrepreneurialAdapter = new EntrepreneurialAdapter();
export { STARTUP_PHASES, FUNDING_PATTERNS, TIMING_PATTERNS, FOUNDER_PATTERNS, FAILURE_DYNAMICS };
export type { EntrepreneurialEvent };
