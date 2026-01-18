/**
 * Cross-Cultural Arbitrage Engine
 * 
 * Identifies global arbitrage opportunities by modeling discrepancies
 * in how geopolitical entities interpret value and time.
 * 
 * Based on the Cultural Valuation Adapter memory:
 * - Cultural Tick Emphases (Japanese generational patience vs American quarterly aggression)
 * - Linguistic Economic Effects (Sapir-Whorf hypothesis)
 * - Phase misalignments across different cultural valuation systems
 */

// Cultural time perception profiles
export interface CulturalTimeProfile {
  region: string;
  timezone: string;
  tradingHours: { open: number; close: number };
  timePreference: 'long-term' | 'medium-term' | 'short-term';
  riskTolerance: number; // 0-1
  decisionSpeed: number; // ms typical reaction time
  collectivism: number; // 0-1 (individualistic to collective)
  uncertaintyAvoidance: number; // 0-1
  linguisticTimeMarking: 'strong' | 'weak'; // Sapir-Whorf: strong future-time reference languages save less
}

// Define major cultural trading zones
export const CULTURAL_PROFILES: Record<string, CulturalTimeProfile> = {
  // East Asian - Long-term orientation, collective
  'JAPAN': {
    region: 'Asia/Tokyo',
    timezone: 'JST',
    tradingHours: { open: 9, close: 15 },
    timePreference: 'long-term',
    riskTolerance: 0.3,
    decisionSpeed: 800, // Deliberate
    collectivism: 0.85,
    uncertaintyAvoidance: 0.92,
    linguisticTimeMarking: 'weak' // Japanese is weakly future-marked
  },
  'CHINA': {
    region: 'Asia/Shanghai',
    timezone: 'CST',
    tradingHours: { open: 9.5, close: 15 },
    timePreference: 'long-term',
    riskTolerance: 0.45,
    decisionSpeed: 600,
    collectivism: 0.8,
    uncertaintyAvoidance: 0.4,
    linguisticTimeMarking: 'weak' // Mandarin is weakly future-marked
  },
  
  // Western - Short-term orientation, individualistic
  'USA': {
    region: 'America/New_York',
    timezone: 'EST',
    tradingHours: { open: 9.5, close: 16 },
    timePreference: 'short-term',
    riskTolerance: 0.7,
    decisionSpeed: 200, // Fast, aggressive
    collectivism: 0.1,
    uncertaintyAvoidance: 0.46,
    linguisticTimeMarking: 'strong' // English requires future tense marking
  },
  'UK': {
    region: 'Europe/London',
    timezone: 'GMT',
    tradingHours: { open: 8, close: 16.5 },
    timePreference: 'medium-term',
    riskTolerance: 0.55,
    decisionSpeed: 350,
    collectivism: 0.25,
    uncertaintyAvoidance: 0.35,
    linguisticTimeMarking: 'strong'
  },
  
  // European - Mixed, regulatory-conscious
  'GERMANY': {
    region: 'Europe/Berlin',
    timezone: 'CET',
    tradingHours: { open: 9, close: 17.5 },
    timePreference: 'medium-term',
    riskTolerance: 0.35,
    decisionSpeed: 500,
    collectivism: 0.33,
    uncertaintyAvoidance: 0.65,
    linguisticTimeMarking: 'strong'
  },
  'SWITZERLAND': {
    region: 'Europe/Zurich',
    timezone: 'CET',
    tradingHours: { open: 9, close: 17.5 },
    timePreference: 'long-term',
    riskTolerance: 0.4,
    decisionSpeed: 700,
    collectivism: 0.32,
    uncertaintyAvoidance: 0.58,
    linguisticTimeMarking: 'strong' // But German influence
  },
  
  // Emerging Markets - High volatility tolerance
  'BRAZIL': {
    region: 'America/Sao_Paulo',
    timezone: 'BRT',
    tradingHours: { open: 10, close: 17 },
    timePreference: 'short-term',
    riskTolerance: 0.75,
    decisionSpeed: 150,
    collectivism: 0.62,
    uncertaintyAvoidance: 0.76,
    linguisticTimeMarking: 'strong' // Portuguese requires future marking
  },
  'INDIA': {
    region: 'Asia/Kolkata',
    timezone: 'IST',
    tradingHours: { open: 9.25, close: 15.5 },
    timePreference: 'long-term',
    riskTolerance: 0.5,
    decisionSpeed: 400,
    collectivism: 0.77,
    uncertaintyAvoidance: 0.4,
    linguisticTimeMarking: 'weak' // Hindi has weak future marking
  },
  
  // Middle East - Oil-driven, relationship-based
  'UAE': {
    region: 'Asia/Dubai',
    timezone: 'GST',
    tradingHours: { open: 10, close: 14 },
    timePreference: 'long-term',
    riskTolerance: 0.6,
    decisionSpeed: 600,
    collectivism: 0.7,
    uncertaintyAvoidance: 0.8,
    linguisticTimeMarking: 'weak' // Arabic has complex aspect system
  }
};

// Arbitrage opportunity types
export interface CulturalArbitrageOpportunity {
  id: string;
  type: 'TIME_ZONE_LAG' | 'RISK_PERCEPTION_GAP' | 'LINGUISTIC_BIAS' | 'COLLECTIVISM_DIVERGENCE' | 'DECISION_SPEED_MISMATCH';
  cultures: [string, string];
  asset: string;
  expectedSpread: number;
  confidence: number;
  timeWindow: number; // ms
  reasoning: string;
  actionableAt: Date;
  expiresAt: Date;
}

// Phase alignment between cultures
export interface CulturalPhaseState {
  culture: string;
  currentPhase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
  phaseProgress: number; // 0-1
  dominantSentiment: 'FEAR' | 'GREED' | 'NEUTRAL';
  alignmentWithGlobal: number; // -1 to 1
}

class CulturalArbitrageEngine {
  private phaseStates: Map<string, CulturalPhaseState> = new Map();
  private opportunities: CulturalArbitrageOpportunity[] = [];
  private lastAnalysis: Date = new Date();
  
  constructor() {
    // Initialize phase states
    Object.keys(CULTURAL_PROFILES).forEach(culture => {
      this.phaseStates.set(culture, {
        culture,
        currentPhase: 'NEUTRAL' as any,
        phaseProgress: 0.5,
        dominantSentiment: 'NEUTRAL',
        alignmentWithGlobal: 0
      });
    });
  }

  /**
   * Analyze cultural phase misalignments for arbitrage
   */
  analyzeArbitrageOpportunities(
    marketData: Record<string, { price: number; volume: number; sentiment: number }>
  ): CulturalArbitrageOpportunity[] {
    this.opportunities = [];
    const now = new Date();
    
    // Get active trading cultures based on current UTC time
    const activeCultures = this.getActiveTradingCultures(now);
    
    // Analyze each pair of active cultures
    for (let i = 0; i < activeCultures.length; i++) {
      for (let j = i + 1; j < activeCultures.length; j++) {
        const cultureA = activeCultures[i];
        const cultureB = activeCultures[j];
        
        const opportunities = this.findPairwiseOpportunities(cultureA, cultureB, marketData, now);
        this.opportunities.push(...opportunities);
      }
    }
    
    // Sort by confidence
    this.opportunities.sort((a, b) => b.confidence - a.confidence);
    
    this.lastAnalysis = now;
    return this.opportunities;
  }

  private getActiveTradingCultures(now: Date): string[] {
    const utcHour = now.getUTCHours();
    
    return Object.entries(CULTURAL_PROFILES).filter(([, profile]) => {
      // Simplified check - in production would use proper timezone conversion
      const offset = this.getTimezoneOffset(profile.timezone);
      const localHour = (utcHour + offset + 24) % 24;
      return localHour >= profile.tradingHours.open && localHour < profile.tradingHours.close;
    }).map(([name]) => name);
  }

  private getTimezoneOffset(tz: string): number {
    const offsets: Record<string, number> = {
      'JST': 9, 'CST': 8, 'EST': -5, 'GMT': 0, 'CET': 1,
      'BRT': -3, 'IST': 5.5, 'GST': 4
    };
    return offsets[tz] || 0;
  }

  private findPairwiseOpportunities(
    cultureA: string,
    cultureB: string,
    marketData: Record<string, { price: number; volume: number; sentiment: number }>,
    now: Date
  ): CulturalArbitrageOpportunity[] {
    const opportunities: CulturalArbitrageOpportunity[] = [];
    const profileA = CULTURAL_PROFILES[cultureA];
    const profileB = CULTURAL_PROFILES[cultureB];
    
    // 1. RISK_PERCEPTION_GAP: Different risk tolerances create price discrepancies
    const riskGap = Math.abs(profileA.riskTolerance - profileB.riskTolerance);
    if (riskGap > 0.25) {
      const higherRisk = profileA.riskTolerance > profileB.riskTolerance ? cultureA : cultureB;
      const lowerRisk = profileA.riskTolerance > profileB.riskTolerance ? cultureB : cultureA;
      
      opportunities.push({
        id: `RISK_${cultureA}_${cultureB}_${now.getTime()}`,
        type: 'RISK_PERCEPTION_GAP',
        cultures: [cultureA, cultureB],
        asset: 'VOLATILITY_INDEX',
        expectedSpread: riskGap * 0.05, // 5% max spread per risk unit gap
        confidence: 0.5 + riskGap * 0.3,
        timeWindow: 4 * 60 * 60 * 1000, // 4 hours
        reasoning: `${higherRisk} prices risk assets higher than ${lowerRisk}. Buy in ${lowerRisk} session, sell in ${higherRisk} session.`,
        actionableAt: now,
        expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000)
      });
    }
    
    // 2. DECISION_SPEED_MISMATCH: Fast vs slow reaction creates momentum opportunities
    const speedRatio = Math.max(profileA.decisionSpeed, profileB.decisionSpeed) / 
                       Math.min(profileA.decisionSpeed, profileB.decisionSpeed);
    if (speedRatio > 2) {
      const fastCulture = profileA.decisionSpeed < profileB.decisionSpeed ? cultureA : cultureB;
      const slowCulture = profileA.decisionSpeed < profileB.decisionSpeed ? cultureB : cultureA;
      
      opportunities.push({
        id: `SPEED_${cultureA}_${cultureB}_${now.getTime()}`,
        type: 'DECISION_SPEED_MISMATCH',
        cultures: [cultureA, cultureB],
        asset: 'NEWS_SENSITIVE',
        expectedSpread: (speedRatio - 1) * 0.02,
        confidence: 0.6,
        timeWindow: 30 * 60 * 1000, // 30 minutes
        reasoning: `${fastCulture} reacts ${speedRatio.toFixed(1)}x faster than ${slowCulture}. Front-run ${slowCulture} reaction to news.`,
        actionableAt: now,
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000)
      });
    }
    
    // 3. LINGUISTIC_BIAS: Weak vs strong future-time reference affects savings/investment behavior
    if (profileA.linguisticTimeMarking !== profileB.linguisticTimeMarking) {
      const weakFTR = profileA.linguisticTimeMarking === 'weak' ? cultureA : cultureB;
      const strongFTR = profileA.linguisticTimeMarking === 'weak' ? cultureB : cultureA;
      
      opportunities.push({
        id: `LING_${cultureA}_${cultureB}_${now.getTime()}`,
        type: 'LINGUISTIC_BIAS',
        cultures: [cultureA, cultureB],
        asset: 'LONG_TERM_BONDS',
        expectedSpread: 0.015, // 1.5% structural premium
        confidence: 0.55,
        timeWindow: 24 * 60 * 60 * 1000, // 1 day
        reasoning: `Sapir-Whorf: ${weakFTR} (weak FTR) systematically overvalues long-term assets vs ${strongFTR} (strong FTR).`,
        actionableAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      });
    }
    
    // 4. COLLECTIVISM_DIVERGENCE: Individual vs collective decision-making creates herding patterns
    const collectivismGap = Math.abs(profileA.collectivism - profileB.collectivism);
    if (collectivismGap > 0.4) {
      const collectiveCulture = profileA.collectivism > profileB.collectivism ? cultureA : cultureB;
      const individualCulture = profileA.collectivism > profileB.collectivism ? cultureB : cultureA;
      
      opportunities.push({
        id: `COLL_${cultureA}_${cultureB}_${now.getTime()}`,
        type: 'COLLECTIVISM_DIVERGENCE',
        cultures: [cultureA, cultureB],
        asset: 'TRENDING_STOCKS',
        expectedSpread: collectivismGap * 0.03,
        confidence: 0.5 + collectivismGap * 0.25,
        timeWindow: 2 * 60 * 60 * 1000, // 2 hours
        reasoning: `${collectiveCulture} exhibits stronger herding behavior. Momentum signals more reliable in ${collectiveCulture}, contrarian in ${individualCulture}.`,
        actionableAt: now,
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000)
      });
    }
    
    // 5. TIME_ZONE_LAG: Information propagation delay between markets
    const timeDiff = Math.abs(this.getTimezoneOffset(profileA.timezone) - this.getTimezoneOffset(profileB.timezone));
    if (timeDiff >= 6) {
      opportunities.push({
        id: `TZ_${cultureA}_${cultureB}_${now.getTime()}`,
        type: 'TIME_ZONE_LAG',
        cultures: [cultureA, cultureB],
        asset: 'ADR_GDR',
        expectedSpread: 0.008, // 0.8% typical ADR spread
        confidence: 0.7,
        timeWindow: timeDiff * 60 * 60 * 1000,
        reasoning: `${timeDiff}h time zone gap creates ADR/GDR arbitrage between ${cultureA} and ${cultureB} sessions.`,
        actionableAt: now,
        expiresAt: new Date(now.getTime() + timeDiff * 60 * 60 * 1000)
      });
    }
    
    return opportunities;
  }

  /**
   * Update cultural phase based on market data
   */
  updateCulturalPhase(
    culture: string,
    marketData: { price: number; volume: number; sentiment: number; priceChange24h: number }
  ): CulturalPhaseState {
    const profile = CULTURAL_PROFILES[culture];
    if (!profile) return this.phaseStates.get(culture)!;
    
    // Determine phase based on price action and sentiment
    let phase: CulturalPhaseState['currentPhase'];
    let sentiment: CulturalPhaseState['dominantSentiment'];
    
    if (marketData.priceChange24h > 0.02 && marketData.volume > 1.2) {
      phase = marketData.sentiment > 0.3 ? 'MARKUP' : 'DISTRIBUTION';
      sentiment = 'GREED';
    } else if (marketData.priceChange24h < -0.02 && marketData.volume > 1.2) {
      phase = marketData.sentiment < -0.3 ? 'MARKDOWN' : 'ACCUMULATION';
      sentiment = 'FEAR';
    } else {
      phase = marketData.sentiment > 0 ? 'ACCUMULATION' : 'DISTRIBUTION';
      sentiment = 'NEUTRAL';
    }
    
    // Adjust for cultural factors
    // High uncertainty avoidance cultures enter phases more gradually
    const phaseSpeed = 1 - (profile.uncertaintyAvoidance * 0.5);
    
    const currentState = this.phaseStates.get(culture)!;
    const newProgress = currentState.currentPhase === phase 
      ? Math.min(1, currentState.phaseProgress + 0.1 * phaseSpeed)
      : 0.1;
    
    const newState: CulturalPhaseState = {
      culture,
      currentPhase: phase,
      phaseProgress: newProgress,
      dominantSentiment: sentiment,
      alignmentWithGlobal: marketData.sentiment
    };
    
    this.phaseStates.set(culture, newState);
    return newState;
  }

  /**
   * Get current opportunities filtered by confidence threshold
   */
  getOpportunities(minConfidence: number = 0.5): CulturalArbitrageOpportunity[] {
    const now = new Date();
    return this.opportunities.filter(o => 
      o.confidence >= minConfidence && 
      o.expiresAt > now
    );
  }

  /**
   * Get trading recommendation based on cultural arbitrage
   */
  getTradingRecommendation(): {
    action: 'LONG' | 'SHORT' | 'ARBITRAGE' | 'WAIT';
    confidence: number;
    opportunity: CulturalArbitrageOpportunity | null;
    reasoning: string;
  } {
    const highConfOpps = this.getOpportunities(0.6);
    
    if (highConfOpps.length === 0) {
      return {
        action: 'WAIT',
        confidence: 0.3,
        opportunity: null,
        reasoning: 'No high-confidence cultural arbitrage opportunities detected.'
      };
    }
    
    const bestOpp = highConfOpps[0];
    
    // Determine action based on opportunity type
    let action: 'LONG' | 'SHORT' | 'ARBITRAGE' | 'WAIT' = 'WAIT';
    
    switch (bestOpp.type) {
      case 'TIME_ZONE_LAG':
      case 'RISK_PERCEPTION_GAP':
        action = 'ARBITRAGE';
        break;
      case 'DECISION_SPEED_MISMATCH':
        action = 'LONG'; // Front-run the slow reaction
        break;
      case 'LINGUISTIC_BIAS':
        action = 'LONG'; // Long in weak-FTR markets
        break;
      case 'COLLECTIVISM_DIVERGENCE':
        action = 'LONG'; // Follow the herd in collective cultures
        break;
    }
    
    return {
      action,
      confidence: bestOpp.confidence,
      opportunity: bestOpp,
      reasoning: bestOpp.reasoning
    };
  }

  /**
   * Get phase misalignment score between two cultures
   * Higher score = more divergent phases = more opportunity
   */
  getPhaseMisalignment(cultureA: string, cultureB: string): number {
    const stateA = this.phaseStates.get(cultureA);
    const stateB = this.phaseStates.get(cultureB);
    
    if (!stateA || !stateB) return 0;
    
    const phaseOrder = ['ACCUMULATION', 'MARKUP', 'DISTRIBUTION', 'MARKDOWN'];
    const phaseA = phaseOrder.indexOf(stateA.currentPhase);
    const phaseB = phaseOrder.indexOf(stateB.currentPhase);
    
    // Calculate phase distance (circular)
    const phaseDiff = Math.min(
      Math.abs(phaseA - phaseB),
      4 - Math.abs(phaseA - phaseB)
    );
    
    // Normalize to 0-1
    return phaseDiff / 2;
  }
}

export const culturalArbitrageEngine = new CulturalArbitrageEngine();
