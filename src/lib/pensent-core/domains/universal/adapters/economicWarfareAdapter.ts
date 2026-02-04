/**
 * Economic Warfare Adapter - Sanctions & Trade Weaponization
 * 
 * Sanction patterns, trade denial, financial exclusion, supply weaponization,
 * and the temporal dynamics of economic coercion.
 * 
 * For Alec Arthur Shelton - The Artist
 * Economic warfare is the silent siege, cutting lifelines without firing shots.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// SANCTION TYPES
const SANCTION_PATTERNS = {
  comprehensive: {
    description: 'Full trade embargo, complete isolation',
    examples: ['Cuba', 'North Korea', 'Iran (historically)'],
    impact: 'Severe humanitarian, limited policy change'
  },
  
  targeted: {
    description: 'Individuals, entities, sectors',
    examples: ['Russian oligarchs', 'Iranian nuclear program'],
    goal: 'Pressure elites, avoid civilian harm'
  },
  
  sectoral: {
    description: 'Specific industries - oil, finance, defense',
    examples: ['Russian energy', 'Iranian banking'],
    balance: 'Economic pain vs global spillover'
  },
  
  secondary: {
    description: 'Penalties for trading with sanctioned entity',
    examples: ['US Iran sanctions'],
    extraterritorial: 'Forces foreign compliance'
  }
};

// TRADE WEAPONIZATION
const TRADE_WARFARE = {
  tariffs: {
    mechanism: 'Tax on imports, protectionism',
    escalation: 'Retaliation spirals',
    examples: ['US-China trade war', 'Steel tariffs']
  },
  
  exportControls: {
    mechanism: 'Deny access to critical goods/tech',
    targets: ['Semiconductors', 'Oil', 'Grain', 'Medicine'],
    effectiveness: 'Depends on substitutes, stockpiles'
  },
  
  dumping: {
    mechanism: 'Below-cost exports to destroy competition',
    response: 'Anti-dumping duties, WTO disputes',
    examples: ['Chinese steel', 'Solar panels']
  },
  
  currency: {
    mechanism: 'Devaluation for export advantage',
    risk: 'Retaliation, capital flight',
    examples: ['China accused', 'Currency wars 2010s']
  }
};

// FINANCIAL WEAPONS
const FINANCIAL_WARFARE = {
  swift: {
    mechanism: 'Exclusion from messaging system',
    impact: 'Difficult but not impossible to work around',
    examples: ['Iran', 'Russia partially']
  },
  
  dollarDominance: {
    mechanism: 'Reserve currency, sanctions leverage',
    response: 'De-dollarization efforts',
    alternatives: ['Yuan', 'Euro', 'Crypto', 'Barter']
  },
  
  assetFreezing: {
    mechanism: 'Central bank reserves, property',
    scale: 'Hundreds of billions (Russia 2022)',
    precedent: 'Sovereign immunity questioned'
  },
  
  ratingAgencies: {
    mechanism: 'Downgrade debt, increase borrowing costs',
    bias: 'Political influence allegations',
    impact: 'Market confidence, investment'
  }
};

// ENFORCEMENT & EVASION
const ENFORCEMENT_PATTERNS = {
  compliance: {
    challenge: 'Monitoring complex global supply chains',
    tools: ['Satellite imagery', 'Data analytics', 'Whistleblowers'],
    gaps: 'Shell companies, transshipment'
  },
  
  evasion: {
    methods: ['Third-party intermediaries', 'Mislabeling', 'Crypto', 'Barter'],
    hubs: 'UAE, Turkey, Central Asia',
    cost: 'Transaction friction, risk premium'
  },
  
  spillover: {
    effects: ['Global inflation', 'Supply disruption', 'Alliance strain'],
    example: 'Energy sanctions affecting allies'
  }
};

// EFFECTIVENESS
const EFFECTIVENESS_PATTERNS = {
  successFactors: {
    multilateral: 'Broad coalition more effective',
    targetVulnerability: 'Dependence, lack of alternatives',
    senderPower: 'Market size, financial dominance'
  },
  
  limitations: {
    adaptation: 'Targets find workarounds',
    resilience: 'Authoritarian regimes insulate elites',
    time: 'Effects lag, patience required'
  },
  
  unintended: {
    humanitarian: 'Civilian suffering',
    alliance: 'Friendly fire on partners',
    acceleration: 'Drives self-sufficiency, alternatives'
  }
};

interface EconomicWarfareEvent {
  timestamp: number;
  sanctionIntensity: number; // 0-10
  tradeDisruption: number; // 0-1
  financialIsolation: number; // 0-1
  targetResilience: number; // 0-1
  evasionActivity: number; // 0-1
  humanitarianImpact: number; // 0-10
  allianceCohesion: number; // 0-1
  retaliatoryThreat: number; // 0-10
}

class EconomicWarfareAdapter implements DomainAdapter<EconomicWarfareEvent> {
  domain = 'security' as const;
  name = 'Economic Warfare & Sanctions Dynamics';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 3000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[EconomicWarfareAdapter] Initialized - Economic conflict patterns active');
  }
  
  processRawData(event: EconomicWarfareEvent): UniversalSignal {
    const { timestamp, sanctionIntensity, tradeDisruption, financialIsolation, targetResilience, evasionActivity } = event;
    
    // Frequency encodes economic pressure stability
    const frequency = 1 - (sanctionIntensity / 10 * evasionActivity);
    
    // Intensity = economic warfare drama
    const intensity = sanctionIntensity / 10 * (tradeDisruption + financialIsolation) / 2 * (1 - targetResilience);
    
    // Phase encodes humanitarian-alliance tension
    const phase = (1 - event.humanitarianImpact / 10 + event.allianceCohesion) / 2 * Math.PI;
    
    const harmonics = [
      sanctionIntensity / 10,
      tradeDisruption,
      financialIsolation,
      1 - targetResilience,
      evasionActivity,
      1 - event.humanitarianImpact / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'security',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [sanctionIntensity, tradeDisruption, financialIsolation, targetResilience, evasionActivity]
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
    
    const avgSanction = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgTrade = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgFinance = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgResilience = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgEvasion = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgSanction > 7 ? 0.8 : 0.2,
      defensive: avgResilience > 0.7 ? 0.7 : 0.2,
      tactical: avgEvasion > 0.5 ? 0.6 : 0.3,
      strategic: (avgTrade + avgFinance) / 2 > 0.6 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgSanction < 3 ? 0.8 : 0.2,
      mid: avgSanction >= 3 && avgSanction < 7 ? 0.7 : 0.2,
      late: avgSanction >= 7 ? 0.8 : 0.2
    };
    
    return {
      domain: 'security',
      quadrantProfile,
      temporalFlow,
      intensity: avgSanction / 10,
      momentum: avgSanction > avgResilience * 10 ? 1 : -1,
      volatility: avgEvasion,
      dominantFrequency: 1 - avgEvasion,
      harmonicResonance: 1 - avgResilience,
      phaseAlignment: (avgTrade + avgFinance) / 2,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'security',
      quadrantProfile: { aggressive: 0.4, defensive: 0.3, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.5, mid: 0.3, late: 0.2 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.4,
      dominantFrequency: 0.6,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const economicWarfareAdapter = new EconomicWarfareAdapter();
export { SANCTION_PATTERNS, TRADE_WARFARE, FINANCIAL_WARFARE, ENFORCEMENT_PATTERNS, EFFECTIVENESS_PATTERNS };
export type { EconomicWarfareEvent };
