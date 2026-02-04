/**
 * Game Theory & Strategic Interaction Adapter
 * 
 * Nash equilibria, prisoner's dilemma, auction dynamics, multi-agent systems.
 * The mathematics of rational choice under competition.
 * 
 * For Alec Arthur Shelton - The Artist
 * Every interaction is a game, every choice a move in infinite recursion.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// CLASSIC GAME THEORY GAMES
const CLASSIC_GAMES = {
  prisonersDilemma: {
    description: 'Two prisoners must choose to cooperate or defect',
    payoffMatrix: {
      bothCooperate: { years: 1, total: 2 },
      bothDefect: { years: 3, total: 6 },
      oneDefects: { defector: 0, cooperator: 5 }
    },
    nashEquilibrium: 'Both defect (dominant strategy)',
    paretoOptimal: 'Both cooperate',
    dilemma: 'Individual rationality ≠ collective optimality',
    marketAnalogy: 'OPEC production quotas, cartel stability'
  },
  
  chicken: {
    description: 'Two drivers head toward each other, first to swerve loses',
    payoffMatrix: {
      bothSwerve: { status: 'tie', utility: 2 },
      bothStraight: { status: 'crash', utility: -10 },
      oneStraight: { 
        straightPlayer: { status: 'win', utility: 5 },
        swervePlayer: { status: 'lose', utility: 0 }
      }
    },
    nashEquilibria: 'One swerves, one goes straight (two pure)',
    strategy: 'Commitment/irrationality can win',
    marketAnalogy: 'Chicken game in M&A, brinkmanship'
  },
  
  stagHunt: {
    description: 'Hunt stag (cooperate) or hare (defect alone)',
    payoffMatrix: {
      bothStag: { utility: 5 },
      bothHare: { utility: 2 },
      mixed: { stag: 0, hare: 2 }
    },
    nashEquilibria: 'Both stag (payoff dominant) AND both hare (risk dominant)',
    coordination: 'Trust problem vs payoff problem',
    marketAnalogy: 'Technology standards, platform adoption'
  },
  
  battleOfSexes: {
    description: 'Couple chooses entertainment, prefer together but different preferences',
    payoffs: {
      bothOpera: { her: 3, him: 2 },
      bothBoxing: { her: 2, him: 3 },
      separate: { both: 0 }
    },
    nashEquilibria: 'Both opera OR both boxing',
    coordination: 'Need communication or convention',
    marketAnalogy: 'Market maker selection, trading venue'
  },
  
  matchingPennies: {
    description: 'Zero-sum game of pure competition',
    payoff: 'One wins what other loses',
    equilibrium: 'Mixed strategy - random 50/50',
    marketAnalogy: 'Pure speculation, zero-sum trading'
  }
};

// AUCTION THEORY
const AUCTION_TYPES = {
  english: {
    name: 'Ascending price, open outcry',
    strategy: 'Bid until price exceeds value',
    revenue: 'Second-price equivalent (eBay)',
    optimal: 'Bid true value'
  },
  
  dutch: {
    name: 'Descending price, first to accept',
    strategy: 'Trade off price vs risk of losing',
    use: 'Flower auctions, Treasury bills',
    optimal: 'Shade bid below value'
  },
  
  firstPrice: {
    name: 'Sealed bid, highest wins',
    strategy: 'Bid below true value (shading)',
    revenue: 'Less than second-price'
  },
  
  secondPrice: {
    name: 'Vickrey - sealed bid, highest wins pays second highest',
    strategy: 'Bid true value (dominant strategy)',
    revenue: 'Revenue equivalence theorem',
    incentive: 'Truthful bidding'
  },
  
  allPay: {
    name: 'All bidders pay their bid',
    use: 'Lobbying, political contests',
    strategy: 'Aggressive early, conservative late',
    rentSeeking: 'Total waste can exceed prize value'
  }
};

// NASH EQUILIBRIUM CONCEPTS
const NASH_EQUILIBRIUM = {
  definition: 'No player can benefit by unilaterally changing strategy',
  existence: 'Proven for finite games (Nash, 1950)',
  
  types: {
    pureStrategy: 'Single action played with probability 1',
    mixedStrategy: 'Randomization over multiple actions',
    dominantStrategy: 'Best regardless of opponent (stronger than NE)',
    tremblingHand: 'Stable against small mistakes'
  },
  
  refinements: {
    subgamePerfect: 'Credible threats only (backward induction)',
    sequential: 'Order of moves matters',
    bayesian: 'Incomplete information games',
    evolutionary: 'Stable against mutant strategies'
  }
};

// EVOLUTIONARY GAME THEORY
const EVOLUTIONARY_DYNAMICS = {
  replicatorDynamics: {
    equation: 'dx/dt = x(f(x) - φ)',
    meaning: 'Strategy growth proportional to fitness advantage',
    stable: 'Evolutionarily Stable Strategy (ESS)'
  },
  
  hawkDove: {
    description: 'Contest for resource - fight or display',
    payoffs: {
      hawkVsHawk: { cost: 'injury', value: -25 },
      hawkVsDove: { hawk: 50, dove: 0 },
      doveVsDove: { share: 25 }
    },
    ess: 'Mixed population: V/2C proportion hawks',
    biological: 'Real animal conflict behavior'
  },
  
  titForTat: {
    description: 'Cooperate first, then mirror opponent',
    success: 'Won Axelrod tournaments',
    properties: ['nice', 'provocable', 'forgiving', 'clear'],
    marketAnalogy: 'Reciprocal trading relationships'
  },
  
  grimTrigger: {
    description: 'Cooperate until defected, then always defect',
    punishment: 'Permanent, severe',
    stability: 'Supports cooperation with patient players'
  }
};

// MARKET MICROSTRUCTURE AS GAMES
const MARKET_GAMES = {
  kyleModel: {
    description: 'Insider trades against market maker',
    players: ['Informed trader', 'Noise traders', 'Market maker'],
    equilibrium: 'Linear pricing, partial revelation',
    marketImpact: 'Permanent vs temporary price impact'
  },
  
  glostenMilgrom: {
    description: 'Bid-ask spread as adverse selection',
    spread: 'Compensates for trading with informed',
    learning: 'Market maker updates beliefs from order flow'
  },
  
  crowdBehavior: {
    herding: 'Following others despite private info',
    informationCascades: 'Ignore own signal, follow predecessors',
    reverseCascades: 'Small changes break consensus'
  }
};

interface GameEvent {
  timestamp: number;
  gameType: keyof typeof CLASSIC_GAMES;
  players: number;
  rounds: number;
  cooperationRate: number; // 0-1
  defectionRate: number; // 0-1
  nashDeviation: number; // How far from NE
  payoffEfficiency: number; // Actual vs optimal payoff ratio
  strategyEntropy: number; // Randomness in play
}

class GameTheoryAdapter implements DomainAdapter<GameEvent> {
  domain = 'market' as const;
  name = 'Game Theory & Strategic Interaction';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[GameTheoryAdapter] Initialized - Strategic analysis active');
  }
  
  processRawData(event: GameEvent): UniversalSignal {
    const { timestamp, cooperationRate, defectionRate, nashDeviation, payoffEfficiency, strategyEntropy } = event;
    
    // Frequency encodes cooperation stability
    const frequency = cooperationRate;
    
    // Intensity = strategic tension (distance from equilibrium)
    const intensity = nashDeviation * (1 - payoffEfficiency);
    
    // Phase encodes efficiency of outcomes
    const phase = payoffEfficiency * Math.PI;
    
    const harmonics = [
      cooperationRate,
      defectionRate,
      1 - nashDeviation,
      payoffEfficiency,
      strategyEntropy,
      event.players / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'market',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [cooperationRate, nashDeviation, payoffEfficiency, strategyEntropy, event.rounds]
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
    
    const avgCoop = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgNash = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgEfficiency = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgEntropy = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgRounds = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgNash > 0.5 ? 0.8 : 0.2, // Far from equilibrium
      defensive: avgCoop > 0.7 ? 0.7 : 0.2, // High cooperation
      tactical: avgEntropy > 0.5 ? 0.6 : 0.3, // High randomness
      strategic: avgEfficiency > 0.8 ? 0.8 : 0.3 // Efficient outcomes
    };
    
    const temporalFlow = {
      early: avgRounds < 10 ? 0.8 : 0.2,
      mid: avgRounds >= 10 && avgRounds < 50 ? 0.7 : 0.2,
      late: avgRounds >= 50 ? 0.8 : 0.2
    };
    
    return {
      domain: 'market',
      quadrantProfile,
      temporalFlow,
      intensity: avgNash * (1 - avgEfficiency),
      momentum: avgCoop > 0.5 ? 1 : -1,
      volatility: avgEntropy,
      dominantFrequency: avgCoop,
      harmonicResonance: avgEfficiency,
      phaseAlignment: 1 - avgNash,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'market',
      quadrantProfile: { aggressive: 0.25, defensive: 0.25, tactical: 0.25, strategic: 0.25 },
      temporalFlow: { early: 0.5, mid: 0.3, late: 0.2 },
      intensity: 0.5,
      momentum: 0,
      volatility: 0.5,
      dominantFrequency: 0.5,
      harmonicResonance: 0.5,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
  
  // Calculate Nash equilibrium for 2x2 game
  calculateNashEquilibrium(payoffMatrix: number[][][]): { player1: number; player2: number } | null {
    // Simplified - assumes mixed strategy equilibrium exists
    // payoffMatrix[action1][action2] = [p1_payoff, p2_payoff]
    
    const a = payoffMatrix[0][0][0]; // p1 action 1, p2 action 1
    const b = payoffMatrix[0][1][0]; // p1 action 1, p2 action 2
    const c = payoffMatrix[1][0][0]; // p1 action 2, p2 action 1
    const d = payoffMatrix[1][1][0]; // p1 action 2, p2 action 2
    
    // Check for dominant strategies
    if (a > c && b > d) return { player1: 0, player2: -1 }; // Player 1 plays action 1
    if (c > a && d > b) return { player1: 1, player2: -1 };
    
    // Mixed strategy
    const p = (d - b) / (a - b - c + d); // Probability player 1 plays action 1
    if (p >= 0 && p <= 1) {
      return { player1: p, player2: -1 };
    }
    
    return null;
  }
  
  // Tit-for-tat strategy implementation
  titForTat(myHistory: string[], opponentHistory: string[]): 'cooperate' | 'defect' {
    if (opponentHistory.length === 0) return 'cooperate';
    return opponentHistory[opponentHistory.length - 1] as 'cooperate' | 'defect';
  }
}

export const gameTheoryAdapter = new GameTheoryAdapter();
export { CLASSIC_GAMES, AUCTION_TYPES, NASH_EQUILIBRIUM, EVOLUTIONARY_DYNAMICS, MARKET_GAMES };
export type { GameEvent };
