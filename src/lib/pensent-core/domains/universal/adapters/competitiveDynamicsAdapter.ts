/**
 * Competitive Dynamics Adapter
 * 
 * Studies combat, war, sports, and competitive behavior patterns
 * to understand human aggression, strategy, and victory/defeat cycles.
 * 
 * Markets are battlefields. Every trade is a contest.
 * 
 * Inventor: Alec Arthur Shelton
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

// Combat and War Strategies - timeless patterns
const COMBAT_STRATEGIES = {
  sunTzu: {
    deception: 'All warfare is based on deception',
    timing: 'Attack when the enemy is unprepared',
    terrain: 'Know the ground, know victory',
    marketApplication: 'Market makers deceive; smart money moves when retail sleeps'
  },
  romanFormations: {
    testudo: { pattern: 'defensive_consolidation', marketPhase: 'accumulation' },
    wedge: { pattern: 'aggressive_penetration', marketPhase: 'breakout' },
    orb: { pattern: 'surrounded_defense', marketPhase: 'capitulation' }
  },
  gladiatorPrinciples: {
    patience: 'Wait for the opening',
    commitment: 'Strike with full force when committed',
    adaptability: 'Read opponent continuously',
    crowdAwareness: 'The crowd influences the fight'
  }
};

// Sports Competition Patterns
const SPORTS_DYNAMICS = {
  momentum: {
    swingFactor: 0.73, // Probability momentum continues once established
    breakingPoint: 0.15, // Threshold where momentum reverses
    psychologicalWeight: 0.85
  },
  homeAdvantage: {
    averageBoost: 0.03, // 3% performance increase
    crowdInfluence: 0.6,
    familiarityFactor: 0.4,
    marketEquivalent: 'institutional_home_turf'
  },
  clutchPerformance: {
    pressureResponse: {
      elite: 1.15, // Perform 15% better under pressure
      average: 0.92, // Perform 8% worse
      choking: 0.65 // Significant degradation
    }
  },
  underdog: {
    historicalUpsetRate: 0.28,
    motivationalBoost: 1.25,
    nothingToLose: 'asymmetric risk-reward psychology'
  }
};

// Animal Competition Patterns
const ANIMAL_COMPETITION = {
  territorial: {
    display: 'Most conflicts resolved through display, not combat',
    escalation: 'Physical combat is last resort - costly',
    marketParallel: 'Volume spikes are displays; actual moves are commitments'
  },
  packHunting: {
    coordination: 0.89, // Success rate with coordination
    isolation: 'Separate target from herd',
    exhaustion: 'Wear down over time',
    marketParallel: 'Institutions coordinate to move markets'
  },
  alphaContest: {
    frequencyOfChallenge: 'Peaks during resource scarcity',
    outcomePredictor: 'Size + experience + current condition',
    marketParallel: 'Bull/bear regime changes'
  },
  predatorPrey: {
    vigilanceCost: 'Constant alertness reduces other activities',
    groupProtection: 'Larger groups = individual safety',
    marketParallel: 'Retail scattered = vulnerable; coordinated = protection'
  }
};

// War Cycles and Market Correlation
const WAR_CYCLES = {
  kondratiev: {
    period: 50, // years
    phases: ['spring_growth', 'summer_inflation', 'autumn_plateau', 'winter_depression'],
    warCorrelation: 'Major wars cluster at cycle transitions'
  },
  conflictEscalation: {
    stages: [
      { name: 'tension', intensity: 0.2, marketImpact: 'uncertainty_premium' },
      { name: 'provocation', intensity: 0.4, marketImpact: 'volatility_spike' },
      { name: 'mobilization', intensity: 0.6, marketImpact: 'sector_rotation' },
      { name: 'engagement', intensity: 0.8, marketImpact: 'flight_to_safety' },
      { name: 'resolution', intensity: 1.0, marketImpact: 'reconstruction_rally' }
    ]
  }
};

// Victory and Defeat Psychology
const VICTORY_DEFEAT_CYCLES = {
  winnerEffect: {
    testosteroneSpike: 1.20, // 20% increase after victory
    riskToleranceIncrease: 0.35,
    overconfidenceDanger: 'Winner expects to keep winning',
    marketParallel: 'Winning traders increase position size dangerously'
  },
  loserEffect: {
    cortisolSpike: 1.45,
    riskAversionIncrease: 0.40,
    learned_helplessness: 'Stops trying after repeated losses',
    marketParallel: 'Retail capitulation at bottoms'
  },
  comebackPsychology: {
    desperationPhase: { riskTaking: 'maximum', rationality: 'minimum' },
    acceptancePhase: { riskTaking: 'calculated', rationality: 'returning' },
    resurgencePhase: { riskTaking: 'controlled', rationality: 'high' }
  }
};

interface CompetitiveData {
  marketPhase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  dominantStrategy: keyof typeof COMBAT_STRATEGIES;
  momentumState: number; // -1 to 1
  crowdSentiment: number; // fear to greed
  institutionalPosition: 'hunting' | 'defending' | 'neutral';
  volatilityRegime: 'low' | 'medium' | 'high' | 'extreme';
}

class CompetitiveDynamicsAdapter {
  private readonly domain: DomainType = 'bio'; // Maps to bio domain (survival/competition)
  private signalBuffer: UniversalSignal[] = [];
  private isActive = false;
  private currentBattlePhase: string = 'reconnaissance';

  async initialize(): Promise<void> {
    this.isActive = true;
    console.log('[CompetitiveDynamicsAdapter] Combat intelligence activated');
  }

  processCompetitiveData(data: CompetitiveData): UniversalSignal {
    const battleIntensity = this.calculateBattleIntensity(data);
    const dominantForce = this.determineDominantForce(data);
    const strategyScore = this.evaluateStrategyAlignment(data);
    const momentumPersistence = data.momentumState > 0 
      ? SPORTS_DYNAMICS.momentum.swingFactor 
      : 1 - SPORTS_DYNAMICS.momentum.swingFactor;
    const underdogSignal = Math.abs(data.crowdSentiment) > 0.8 
      ? SPORTS_DYNAMICS.underdog.historicalUpsetRate 
      : 0;
    
    const frequency = 0.5 + (battleIntensity * 0.3);
    const intensity = Math.abs(data.momentumState) * (1 + strategyScore);
    
    const signal: UniversalSignal = {
      domain: this.domain,
      timestamp: Date.now(),
      frequency,
      intensity: Math.min(intensity, 1),
      phase: this.getPhaseFromBattle(data.marketPhase),
      harmonics: [battleIntensity, dominantForce, momentumPersistence, underdogSignal, strategyScore],
      rawData: [battleIntensity, dominantForce, momentumPersistence, underdogSignal, strategyScore, data.crowdSentiment]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > 100) this.signalBuffer.shift();
    
    return signal;
  }

  private calculateBattleIntensity(data: CompetitiveData): number {
    const volatilityWeight = { low: 0.2, medium: 0.5, high: 0.8, extreme: 1.0 }[data.volatilityRegime];
    return (volatilityWeight + Math.abs(data.crowdSentiment)) / 2;
  }

  private determineDominantForce(data: CompetitiveData): number {
    const phaseForce = { accumulation: 0.3, markup: 0.8, distribution: -0.3, markdown: -0.8 }[data.marketPhase];
    return (data.momentumState + phaseForce) / 2;
  }

  private evaluateStrategyAlignment(data: CompetitiveData): number {
    const timingScore = data.marketPhase === 'accumulation' || data.marketPhase === 'distribution' ? 0.8 : 0.5;
    return (0.6 + timingScore) / 2;
  }

  private getPhaseFromBattle(marketPhase: string): number {
    const phaseMap: Record<string, number> = {
      accumulation: 0, markup: Math.PI / 2, distribution: Math.PI, markdown: 3 * Math.PI / 2
    };
    return phaseMap[marketPhase] || 0;
  }

  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) return this.getDefaultSignature();
    
    const avgIntensity = signals.reduce((s, sig) => s + sig.intensity, 0) / signals.length;
    const recentBattles = signals.slice(-10);
    const battleTrend = recentBattles.reduce((s, sig) => s + (sig.harmonics[1] || 0), 0) / recentBattles.length;
    
    return {
      domain: this.domain,
      quadrantProfile: {
        aggressive: battleTrend > 0.3 ? 0.8 : 0.3,
        defensive: battleTrend < -0.3 ? 0.8 : 0.3,
        tactical: Math.abs(battleTrend) < 0.3 ? 0.6 : 0.3,
        strategic: 0.5
      },
      temporalFlow: { early: 0.4, mid: 0.5, late: 0.6 },
      intensity: avgIntensity,
      momentum: battleTrend,
      volatility: Math.abs(battleTrend),
      dominantFrequency: 0.5,
      harmonicResonance: 0.6,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }

  private getDefaultSignature(): DomainSignature {
    return {
      domain: this.domain,
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.33, mid: 0.34, late: 0.33 },
      intensity: 0.5, momentum: 0, volatility: 0.5,
      dominantFrequency: 0.5, harmonicResonance: 0.5, phaseAlignment: 0.5, extractedAt: Date.now()
    };
  }

  generateCompetitiveData(momentum: number, volatility: number, volume: number, direction: number): CompetitiveData {
    const marketPhase = direction > 0.3 ? 'markup' : direction < -0.3 ? 'markdown' : momentum > 0 ? 'accumulation' : 'distribution';
    const volatilityRegime = volatility > 0.8 ? 'extreme' : volatility > 0.5 ? 'high' : volatility > 0.2 ? 'medium' : 'low';
    
    return {
      marketPhase,
      dominantStrategy: 'sunTzu',
      momentumState: momentum,
      crowdSentiment: direction,
      institutionalPosition: volume > 0.7 ? 'hunting' : volume < 0.3 ? 'neutral' : 'defending',
      volatilityRegime
    };
  }
}

export const competitiveDynamicsAdapter = new CompetitiveDynamicsAdapter();
export { COMBAT_STRATEGIES, SPORTS_DYNAMICS, ANIMAL_COMPETITION, WAR_CYCLES, VICTORY_DEFEAT_CYCLES };
