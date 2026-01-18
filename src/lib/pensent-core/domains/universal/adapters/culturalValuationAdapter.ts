/**
 * Cultural Valuation Discrepancy Adapter
 * 
 * CEO Insight (Alec Arthur Shelton):
 * "Study relationships between countries, states, cities, cultures/languages
 * & their respective metrics used compared to 'tick' emphasis so their
 * interpretations of value throughout time. Valuation systems have
 * discrepancies and personalities against everything we know in our universe."
 * 
 * This adapter models:
 * - How different cultures perceive and measure value
 * - Time horizon differences ("tick" emphasis)
 * - Language-shaped economic perception (Sapir-Whorf for markets)
 * - Cultural "personalities" in trading behavior
 * - Arbitrage opportunities from valuation discrepancies
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

// ============================================================================
// TEMPORAL TICK EMPHASIS BY CULTURE
// ============================================================================

/**
 * Different cultures operate on fundamentally different "tick" rates.
 * A Japanese corporation thinks in 100-year cycles.
 * An American startup thinks in quarters.
 * A day trader thinks in milliseconds.
 * 
 * These create PREDICTABLE phase misalignments in global markets.
 */
const CULTURAL_TICK_EMPHASIS = {
  // East Asian - Long-term orientation
  JAPANESE: {
    primaryTick: 'generational',        // 25-100 years
    secondaryTick: 'annual',
    tradingPersonality: 'patient_accumulator',
    riskTolerance: 0.3,
    timePreference: 0.1,                // Low = future-oriented
    collectivism: 0.9,
    uncertaintyAvoidance: 0.92,
    marketBehavior: 'Slow to enter, slower to exit. Values stability over gains.',
    languageTimeStructure: 'No grammatical future tense - future is uncertain by default'
  },
  CHINESE: {
    primaryTick: 'dynastic',            // Cycles, not linear
    secondaryTick: 'seasonal',
    tradingPersonality: 'strategic_maneuverer',
    riskTolerance: 0.6,
    timePreference: 0.2,
    collectivism: 0.8,
    uncertaintyAvoidance: 0.4,
    marketBehavior: 'Thinks in cycles (I Ching). Sees patterns others miss.',
    languageTimeStructure: 'Context-dependent tense - time is relative'
  },
  KOREAN: {
    primaryTick: 'rapid_generational',  // Compressed development
    secondaryTick: 'quarterly',
    tradingPersonality: 'aggressive_modernizer',
    riskTolerance: 0.7,
    timePreference: 0.4,
    collectivism: 0.75,
    uncertaintyAvoidance: 0.85,
    marketBehavior: 'Fast adoption, group-think amplification. Ppalli-ppalli culture.',
    languageTimeStructure: 'Hierarchical speech levels affect negotiation dynamics'
  },

  // Western European - Medium-term orientation
  GERMAN: {
    primaryTick: 'medium_cycle',        // 5-15 years (Mittelstand)
    secondaryTick: 'monthly',
    tradingPersonality: 'precision_engineer',
    riskTolerance: 0.35,
    timePreference: 0.3,
    collectivism: 0.33,
    uncertaintyAvoidance: 0.65,
    marketBehavior: 'Systematic, rule-based. Values order and predictability.',
    languageTimeStructure: 'Precise tense system - future plans are grammatically firm'
  },
  BRITISH: {
    primaryTick: 'institutional',       // 10-50 years
    secondaryTick: 'seasonal',
    tradingPersonality: 'conservative_opportunist',
    riskTolerance: 0.55,
    timePreference: 0.35,
    collectivism: 0.35,
    uncertaintyAvoidance: 0.35,
    marketBehavior: 'Understatement masks calculation. "Muddling through" is strategy.',
    languageTimeStructure: 'Conditional tenses allow hedging (would, could, might)'
  },
  FRENCH: {
    primaryTick: 'philosophical',       // Ideas transcend time
    secondaryTick: 'electoral',         // 5-7 years
    tradingPersonality: 'intellectual_contrarian',
    riskTolerance: 0.5,
    timePreference: 0.4,
    collectivism: 0.43,
    uncertaintyAvoidance: 0.86,
    marketBehavior: 'Questions premises. High uncertainty avoidance but loves debate.',
    languageTimeStructure: 'Subjunctive mood for uncertainty - built-in doubt'
  },

  // North American - Short-term orientation
  AMERICAN: {
    primaryTick: 'quarterly',           // Earnings cycles
    secondaryTick: 'weekly',
    tradingPersonality: 'aggressive_optimist',
    riskTolerance: 0.75,
    timePreference: 0.7,                // High = present-oriented
    collectivism: 0.09,
    uncertaintyAvoidance: 0.46,
    marketBehavior: 'Action-oriented. "Time is money." Quick entries, quick exits.',
    languageTimeStructure: 'Progressive tenses emphasize ongoing action'
  },
  CANADIAN: {
    primaryTick: 'resource_cycle',      // Commodity-linked
    secondaryTick: 'seasonal',
    tradingPersonality: 'moderate_pragmatist',
    riskTolerance: 0.55,
    timePreference: 0.5,
    collectivism: 0.2,
    uncertaintyAvoidance: 0.48,
    marketBehavior: 'Balanced between US speed and European caution.',
    languageTimeStructure: 'Bilingual effects - English directness + French nuance'
  },

  // Middle Eastern - Honor/relationship-based
  ARAB_GULF: {
    primaryTick: 'relationship',        // Deals take as long as trust-building
    secondaryTick: 'prayer_cycle',      // 5x daily rhythm
    tradingPersonality: 'honor_network',
    riskTolerance: 0.6,
    timePreference: 0.3,
    collectivism: 0.8,
    uncertaintyAvoidance: 0.68,
    marketBehavior: 'Relationships over transactions. Long courtship, sudden commitment.',
    languageTimeStructure: 'Arabic root system - time connected to action/state duality'
  },
  ISRAELI: {
    primaryTick: 'survival',            // Existential urgency
    secondaryTick: 'startup_cycle',     // 2-5 years to exit
    tradingPersonality: 'innovative_pragmatist',
    riskTolerance: 0.85,
    timePreference: 0.6,
    collectivism: 0.54,
    uncertaintyAvoidance: 0.81,
    marketBehavior: 'High uncertainty avoidance + high risk tolerance = calculated bets.',
    languageTimeStructure: 'Hebrew revival = language consciously constructed for future'
  },

  // South American - Polychronic time
  BRAZILIAN: {
    primaryTick: 'relational',          // Time is flexible
    secondaryTick: 'seasonal',
    tradingPersonality: 'optimistic_networker',
    riskTolerance: 0.65,
    timePreference: 0.6,
    collectivism: 0.62,
    uncertaintyAvoidance: 0.76,
    marketBehavior: 'Jeitinho - creative problem solving. Time is approximate.',
    languageTimeStructure: 'Portuguese subjunctive - inherent uncertainty'
  },

  // African - Ubuntu philosophy
  NIGERIAN: {
    primaryTick: 'opportunity',         // When the time is right
    secondaryTick: 'community_cycle',
    tradingPersonality: 'entrepreneurial_hustler',
    riskTolerance: 0.8,
    timePreference: 0.55,
    collectivism: 0.6,
    uncertaintyAvoidance: 0.55,
    marketBehavior: 'Aggressive pursuit of opportunity. "Naija no dey carry last."',
    languageTimeStructure: 'Pidgin flexibility reflects adaptive mindset'
  },

  // South Asian - Dharmic cycles
  INDIAN: {
    primaryTick: 'karmic',              // Actions have long-term consequences
    secondaryTick: 'familial',          // Multi-generational wealth
    tradingPersonality: 'value_seeker',
    riskTolerance: 0.45,
    timePreference: 0.35,
    collectivism: 0.48,
    uncertaintyAvoidance: 0.4,
    marketBehavior: 'Patient accumulation. Sees value in what others ignore.',
    languageTimeStructure: 'Sanskrit-derived aspect system - ongoing vs completed'
  }
} as const;

// ============================================================================
// VALUATION SYSTEM DISCREPANCIES
// ============================================================================

/**
 * Different cultures literally measure value differently.
 * These aren't just preferences - they're fundamentally different metrics.
 */
const VALUATION_SYSTEMS = {
  // Western metrics
  GDP_GROWTH: {
    originCultures: ['AMERICAN', 'BRITISH'],
    emphasis: 'production_throughput',
    blindSpots: ['sustainability', 'well-being', 'inequality'],
    tradingImplication: 'Overvalues growth stocks, undervalues stability'
  },
  SHAREHOLDER_VALUE: {
    originCultures: ['AMERICAN'],
    emphasis: 'stock_price_maximization',
    blindSpots: ['stakeholder_welfare', 'long_term_health', 'community_impact'],
    tradingImplication: 'Quarterly earnings dominate, long-term underpriced'
  },
  
  // East Asian metrics
  SOCIAL_HARMONY: {
    originCultures: ['JAPANESE', 'CHINESE', 'KOREAN'],
    emphasis: 'collective_stability',
    blindSpots: ['individual_innovation', 'disruptive_change'],
    tradingImplication: 'Consensus-driven moves, sudden cascades when harmony breaks'
  },
  FACE_VALUE: {
    originCultures: ['CHINESE', 'JAPANESE', 'KOREAN', 'ARAB_GULF'],
    emphasis: 'reputation_preservation',
    blindSpots: ['transparent_failure', 'honest_accounting'],
    tradingImplication: 'Problems hidden until catastrophic. Watch for "face-saving" signals.'
  },
  
  // European metrics
  STAKEHOLDER_BALANCE: {
    originCultures: ['GERMAN', 'FRENCH'],
    emphasis: 'multi_party_optimization',
    blindSpots: ['rapid_pivots', 'aggressive_competition'],
    tradingImplication: 'Slower moves but more sustainable. Value in patience.'
  },
  QUALITY_OVER_QUANTITY: {
    originCultures: ['GERMAN', 'JAPANESE'],
    emphasis: 'craftsmanship_excellence',
    blindSpots: ['speed_to_market', 'minimum_viable_products'],
    tradingImplication: 'Premium valuations justified. Discount mass-market competitors.'
  },
  
  // Alternative metrics (emerging)
  GROSS_NATIONAL_HAPPINESS: {
    originCultures: ['BHUTANESE'],
    emphasis: 'well_being_optimization',
    blindSpots: ['material_progress', 'industrialization'],
    tradingImplication: 'Early indicator of post-growth economic models'
  },
  UBUNTU_VALUE: {
    originCultures: ['NIGERIAN', 'South African'],
    emphasis: 'community_uplift',
    blindSpots: ['individual_accumulation'],
    tradingImplication: 'Network effects underpriced by Western models'
  },
  DHARMIC_RETURN: {
    originCultures: ['INDIAN'],
    emphasis: 'karmic_balance',
    blindSpots: ['short_term_profits'],
    tradingImplication: 'Multi-generational plays, patience rewarded'
  }
} as const;

// ============================================================================
// LANGUAGE-SHAPED MARKET PERCEPTION
// ============================================================================

/**
 * Sapir-Whorf Hypothesis for Markets:
 * The language you speak shapes how you perceive economic reality.
 * 
 * This creates SYSTEMATIC biases that are culturally persistent.
 */
const LINGUISTIC_ECONOMIC_EFFECTS = {
  FUTURE_TENSE_STRUCTURE: {
    // Languages with grammatically distinct future tense
    STRONG_FUTURE: {
      languages: ['English', 'French', 'Spanish', 'Portuguese'],
      effect: 'Future is separate from present - easier to discount future value',
      savingsRate: 'lower',
      riskAppetite: 'higher',
      tradingBias: 'Present-biased. Underprices long-term assets.'
    },
    // Languages where future is contextual
    WEAK_FUTURE: {
      languages: ['Chinese', 'Japanese', 'German', 'Finnish'],
      effect: 'Future feels connected to present - harder to ignore',
      savingsRate: 'higher',
      riskAppetite: 'lower',
      tradingBias: 'Future-oriented. Overprices stability.'
    }
  },
  
  NUMBER_SYSTEMS: {
    // How languages structure numbers affects calculation speed
    REGULAR_COUNTING: {
      languages: ['Chinese', 'Japanese', 'Korean'],
      effect: 'Faster mental math, earlier numerical literacy',
      tradingBias: 'Better at quick calculations, more confident in quant analysis'
    },
    IRREGULAR_COUNTING: {
      languages: ['French', 'Danish', 'Welsh'],
      effect: 'More cognitive load for numbers',
      tradingBias: 'May rely more on heuristics than calculations'
    }
  },
  
  EVIDENTIALITY_MARKERS: {
    // Some languages require you to mark how you know something
    REQUIRED_EVIDENCE: {
      languages: ['Turkish', 'Bulgarian', 'Tibetan', 'Quechua'],
      effect: 'Must grammatically indicate source of information',
      tradingBias: 'More skeptical of unverified claims. Values due diligence.'
    },
    OPTIONAL_EVIDENCE: {
      languages: ['English', 'Chinese'],
      effect: 'Can state things without source indication',
      tradingBias: 'More susceptible to rumor-driven trading'
    }
  }
};

// ============================================================================
// CULTURAL PERSONALITY ARBITRAGE
// ============================================================================

/**
 * When two cultures with different "personalities" meet in a market,
 * predictable friction and arbitrage opportunities arise.
 */
interface CulturalArbitrage {
  culture1: keyof typeof CULTURAL_TICK_EMPHASIS;
  culture2: keyof typeof CULTURAL_TICK_EMPHASIS;
  frictionPoints: string[];
  arbitrageOpportunity: string;
  temporalMisalignment: number;  // 0-1: how out of phase their ticks are
}

function calculateCulturalArbitrage(
  c1: keyof typeof CULTURAL_TICK_EMPHASIS,
  c2: keyof typeof CULTURAL_TICK_EMPHASIS
): CulturalArbitrage {
  const culture1 = CULTURAL_TICK_EMPHASIS[c1];
  const culture2 = CULTURAL_TICK_EMPHASIS[c2];
  
  const frictionPoints: string[] = [];
  
  // Time preference friction
  const timeGap = Math.abs(culture1.timePreference - culture2.timePreference);
  if (timeGap > 0.3) {
    frictionPoints.push('time_horizon_mismatch');
  }
  
  // Risk tolerance friction
  const riskGap = Math.abs(culture1.riskTolerance - culture2.riskTolerance);
  if (riskGap > 0.3) {
    frictionPoints.push('risk_appetite_conflict');
  }
  
  // Collectivism friction
  const collectivismGap = Math.abs(culture1.collectivism - culture2.collectivism);
  if (collectivismGap > 0.4) {
    frictionPoints.push('individual_vs_collective_tension');
  }
  
  // Uncertainty avoidance friction
  const uncertaintyGap = Math.abs(culture1.uncertaintyAvoidance - culture2.uncertaintyAvoidance);
  if (uncertaintyGap > 0.3) {
    frictionPoints.push('certainty_requirement_mismatch');
  }
  
  // Calculate temporal misalignment
  const temporalMisalignment = (timeGap + riskGap + collectivismGap + uncertaintyGap) / 4;
  
  // Generate arbitrage opportunity
  let arbitrageOpportunity: string;
  if (culture1.timePreference > culture2.timePreference) {
    arbitrageOpportunity = `${c1} will sell what ${c2} wants to hold. Buy from ${c1}, hold for ${c2} timeline.`;
  } else {
    arbitrageOpportunity = `${c2} will sell what ${c1} wants to hold. Buy from ${c2}, hold for ${c1} timeline.`;
  }
  
  return {
    culture1: c1,
    culture2: c2,
    frictionPoints,
    arbitrageOpportunity,
    temporalMisalignment
  };
}

// ============================================================================
// ADAPTER CLASS
// ============================================================================

interface CulturalValuationData {
  primaryCulture: keyof typeof CULTURAL_TICK_EMPHASIS;
  secondaryCultures: Array<keyof typeof CULTURAL_TICK_EMPHASIS>;
  valuationSystem: keyof typeof VALUATION_SYSTEMS;
  marketPhase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  crossBorderFlow: 'inbound' | 'outbound' | 'balanced';
  linguisticZone: 'strong_future' | 'weak_future';
}

interface CulturalSignal extends UniversalSignal {
  culturalMetadata: {
    dominantCulture: string;
    tickEmphasis: string;
    valuationBias: string;
    arbitrageOpportunities: number;
    temporalMisalignment: number;
  };
}

class CulturalValuationAdapter {
  private domain: DomainType = 'soul';
  private signalBuffer: CulturalSignal[] = [];
  private isActive = false;

  initialize(): void {
    this.isActive = true;
    console.log('[CulturalValuationAdapter] Initialized - mapping cultural value discrepancies');
  }

  /**
   * Process cultural valuation data into universal signals
   */
  processCulturalData(data: CulturalValuationData): CulturalSignal {
    const primaryCulture = CULTURAL_TICK_EMPHASIS[data.primaryCulture];
    
    // Calculate cross-cultural arbitrage opportunities
    const arbitrages = data.secondaryCultures.map(c => 
      calculateCulturalArbitrage(data.primaryCulture, c)
    );
    
    const avgMisalignment = arbitrages.reduce((sum, a) => sum + a.temporalMisalignment, 0) 
      / Math.max(1, arbitrages.length);
    
    // Linguistic bias affects frequency perception
    const linguisticBias = data.linguisticZone === 'strong_future' ? 0.7 : 0.4;
    
    const signal: CulturalSignal = {
      domain: this.domain,
      timestamp: Date.now(),
      frequency: primaryCulture.timePreference * 10,
      intensity: primaryCulture.riskTolerance,
      phase: this.mapTickToPhase(primaryCulture.primaryTick),
      harmonics: [
        primaryCulture.collectivism,
        primaryCulture.uncertaintyAvoidance,
        linguisticBias
      ],
      rawData: [
        primaryCulture.timePreference,
        primaryCulture.riskTolerance,
        avgMisalignment
      ],
      culturalMetadata: {
        dominantCulture: data.primaryCulture,
        tickEmphasis: primaryCulture.primaryTick,
        valuationBias: VALUATION_SYSTEMS[data.valuationSystem].emphasis,
        arbitrageOpportunities: arbitrages.filter(a => a.temporalMisalignment > 0.3).length,
        temporalMisalignment: avgMisalignment
      }
    };

    this.signalBuffer.push(signal);
    return signal;
  }

  private mapTickToPhase(tick: string): number {
    const tickPhases: Record<string, number> = {
      'generational': 0,
      'dynastic': Math.PI / 8,
      'institutional': Math.PI / 4,
      'medium_cycle': Math.PI / 3,
      'quarterly': Math.PI / 2,
      'relationship': (2 * Math.PI) / 3,
      'survival': (3 * Math.PI) / 4,
      'opportunity': Math.PI
    };
    return tickPhases[tick] || Math.PI / 2;
  }

  /**
   * Extract domain signature from cultural signals
   */
  extractSignature(signals: CulturalSignal[]): DomainSignature {
    if (signals.length === 0) return this.getDefaultSignature();

    const avgMisalignment = signals.reduce(
      (sum, s) => sum + (s.culturalMetadata?.temporalMisalignment || 0), 0
    ) / signals.length;

    const avgArbitrageOps = signals.reduce(
      (sum, s) => sum + (s.culturalMetadata?.arbitrageOpportunities || 0), 0
    ) / signals.length;

    const avgIntensity = signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;

    return {
      domain: this.domain,
      quadrantProfile: {
        aggressive: avgArbitrageOps / 5,      // More opportunities = more aggressive
        defensive: 1 - avgMisalignment,       // Less misalignment = more defensive
        tactical: avgMisalignment,            // Misalignment = tactical opportunity
        strategic: 1 - (avgArbitrageOps / 5)  // Fewer opportunities = strategic patience
      },
      temporalFlow: {
        early: avgMisalignment,               // Misalignment creates early opportunities
        mid: 0.5,
        late: 1 - avgMisalignment             // Convergence happens late
      },
      intensity: avgIntensity,
      momentum: avgArbitrageOps / 5 - 0.5,
      volatility: avgMisalignment,
      dominantFrequency: avgIntensity * 10,
      harmonicResonance: 1 - avgMisalignment,
      phaseAlignment: 1 - avgMisalignment,
      extractedAt: Date.now()
    };
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: this.domain,
      quadrantProfile: { aggressive: 0.5, defensive: 0.5, tactical: 0.5, strategic: 0.5 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.3,
      dominantFrequency: 5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }

  /**
   * Detect cultural valuation discrepancy opportunities
   */
  detectValuationDiscrepancy(
    buyerCulture: keyof typeof CULTURAL_TICK_EMPHASIS,
    sellerCulture: keyof typeof CULTURAL_TICK_EMPHASIS,
    assetType: 'equity' | 'bond' | 'commodity' | 'real_estate' | 'crypto'
  ): {
    discrepancyScore: number;
    buyerBias: string;
    sellerBias: string;
    arbitrageWindow: string;
    confidenceLevel: number;
  } {
    const buyer = CULTURAL_TICK_EMPHASIS[buyerCulture];
    const seller = CULTURAL_TICK_EMPHASIS[sellerCulture];
    
    // Different time preferences create different valuations
    const timeDiscrepancy = Math.abs(buyer.timePreference - seller.timePreference);
    
    // Different risk tolerances affect pricing
    const riskDiscrepancy = Math.abs(buyer.riskTolerance - seller.riskTolerance);
    
    // Asset type amplifies certain cultural biases
    const assetMultiplier: Record<string, number> = {
      equity: 1.2,       // Stocks amplify cultural differences
      bond: 0.8,         // Bonds dampen differences
      commodity: 1.0,    // Neutral
      real_estate: 1.4,  // Real estate highly cultural
      crypto: 1.5        // Crypto maximally cultural
    };
    
    const discrepancyScore = (timeDiscrepancy + riskDiscrepancy) * assetMultiplier[assetType];
    
    return {
      discrepancyScore,
      buyerBias: buyer.marketBehavior,
      sellerBias: seller.marketBehavior,
      arbitrageWindow: buyer.timePreference > seller.timePreference
        ? 'Seller will exit before buyer sees full value'
        : 'Buyer will enter before seller realizes opportunity',
      confidenceLevel: Math.min(1, discrepancyScore)
    };
  }

  /**
   * Generate cultural valuation data from market indicators
   */
  generateCulturalData(
    volatility: number,
    crossBorderVolume: number,
    sentiment: number,
    dominantTimezone: 'asia' | 'europe' | 'americas' | 'mixed'
  ): CulturalValuationData {
    // Map timezone to primary culture
    const timezoneMap: Record<string, keyof typeof CULTURAL_TICK_EMPHASIS> = {
      asia: 'JAPANESE',
      europe: 'GERMAN',
      americas: 'AMERICAN',
      mixed: 'BRITISH'
    };

    // High cross-border volume suggests multiple cultures interacting
    const secondaryCultures: Array<keyof typeof CULTURAL_TICK_EMPHASIS> = [];
    if (crossBorderVolume > 0.5) {
      if (dominantTimezone !== 'asia') secondaryCultures.push('CHINESE');
      if (dominantTimezone !== 'americas') secondaryCultures.push('AMERICAN');
      if (dominantTimezone !== 'europe') secondaryCultures.push('GERMAN');
    }

    // Map sentiment to market phase
    let marketPhase: CulturalValuationData['marketPhase'];
    if (sentiment < -0.3) marketPhase = 'markdown';
    else if (sentiment < 0.1) marketPhase = 'accumulation';
    else if (sentiment < 0.5) marketPhase = 'markup';
    else marketPhase = 'distribution';

    return {
      primaryCulture: timezoneMap[dominantTimezone],
      secondaryCultures,
      valuationSystem: volatility > 0.5 ? 'SHAREHOLDER_VALUE' : 'STAKEHOLDER_BALANCE',
      marketPhase,
      crossBorderFlow: crossBorderVolume > 0.6 ? 'inbound' : crossBorderVolume < 0.4 ? 'outbound' : 'balanced',
      linguisticZone: ['asia', 'europe'].includes(dominantTimezone) ? 'weak_future' : 'strong_future'
    };
  }

  /**
   * Get all cultural arbitrage opportunities
   */
  getAllArbitrageOpportunities(): CulturalArbitrage[] {
    const cultures = Object.keys(CULTURAL_TICK_EMPHASIS) as Array<keyof typeof CULTURAL_TICK_EMPHASIS>;
    const opportunities: CulturalArbitrage[] = [];
    
    for (let i = 0; i < cultures.length; i++) {
      for (let j = i + 1; j < cultures.length; j++) {
        const arb = calculateCulturalArbitrage(cultures[i], cultures[j]);
        if (arb.temporalMisalignment > 0.25) {
          opportunities.push(arb);
        }
      }
    }
    
    return opportunities.sort((a, b) => b.temporalMisalignment - a.temporalMisalignment);
  }
}

// Singleton export
export const culturalValuationAdapter = new CulturalValuationAdapter();

// Export types and constants
export type { CulturalValuationData, CulturalSignal, CulturalArbitrage };
export {
  CULTURAL_TICK_EMPHASIS,
  VALUATION_SYSTEMS,
  LINGUISTIC_ECONOMIC_EFFECTS,
  calculateCulturalArbitrage
};
