/**
 * Electoral Adapter - Democratic Processes & Voting Patterns
 * 
 * Polling dynamics, voter turnout, swing states, electoral college mathematics,
 * campaign momentum, and democratic legitimacy patterns.
 * 
 * For Alec Arthur Shelton - The Artist
 * Democracy is the heartbeat of collective will.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// ELECTORAL SYSTEMS
const ELECTORAL_SYSTEMS = {
  firstPastThePost: {
    description: 'Single winner, plurality voting',
    effects: ['Two party dominance', 'Strategic voting', 'Wasted votes'],
    examples: ['US House', 'UK Parliament'],
    marketAnalogy: 'Winner-take-all markets'
  },
  
  proportional: {
    description: 'Seats allocated by vote share',
    effects: ['Multi-party systems', 'Coalition governments', 'Policy compromise'],
    examples: ['Germany', 'Netherlands', 'Israel'],
    marketAnalogy: 'Diversified portfolios'
  },
  
  rankedChoice: {
    description: 'Instant runoff, preference ranking',
    effects: ['Reduced spoiler effect', 'Majority winners', 'Complex ballots'],
    examples: ['Australia', 'Maine (US)', 'NYC'],
    marketAnalogy: 'Preference-based allocation'
  },
  
  electoralCollege: {
    description: 'Indirect election via state delegates',
    effects: ['Swing state focus', 'Popular vote mismatch', 'Small state advantage'],
    examples: ['US Presidential'],
    marketAnalogy: 'Weighted voting rights'
  }
};

// POLLING DYNAMICS
const POLLING_PATTERNS = {
  // Types of polls
  trackingPoll: {
    frequency: 'Daily rolling average',
    volatility: 'High',
    use: 'Momentum detection'
  },
  
  likelyVoter: {
    screen: 'Filters by turnout probability',
    accuracy: 'Higher near election',
    bias: 'May miss surge voters'
  },
  
  exitPoll: {
    timing: 'Election day',
    value: 'Demographic breakdown',
    risk: 'Early release affects turnout'
  },
  
  // Polling errors
  shyToryFactor: {
    description: 'Social desirability bias',
    effect: 'Underestimate controversial candidates',
    examples: ['2016 US', '2019 UK']
  },
  
  marginOfError: {
    formula: '±1.96 × sqrt(p(1-p)/n)',
    typical: '±3% for 1000 sample',
    compound: 'Error grows for subgroups'
  }
};

// CAMPAIGN DYNAMICS
const CAMPAIGN_CYCLES = {
  primary: {
    phase: 'Party nomination',
    dynamics: 'Base mobilization, ideological positioning',
    volatility: 'High, multi-candidate'
  },
  
  convention: {
    phase: 'Post-primary bounce',
    dynamics: 'Unity display, VP selection',
    effect: 'Temporary 5-10 point boost'
  },
  
  general: {
    phase: 'Head-to-head campaign',
    dynamics: 'Persuasion vs mobilization',
    critical: 'Undecided voters, turnout'
  },
  
  debate: {
    phase: 'Direct confrontation',
    dynamics: 'Expectations game, gaffes',
    lastingImpact: 'Usually minimal'
  },
  
  finalPush: {
    phase: 'Get out the vote',
    dynamics: 'Ground game, advertising saturation',
    effect: 'Turnout determines outcome'
  }
};

// SWING STATE MATHEMATICS
const SWING_ANALYSIS = {
  tippingPoint: {
    definition: 'State that puts winner over 270',
    calculation: 'Sort states by margin, find median',
    importance: 'Campaign resource allocation'
  },
  
  battleground: {
    criteria: 'Polling within margin of error',
    typical: '5-10 states per cycle',
    focus: '90%+ of campaign spending'
  },
  
  lean: {
    safe: '>10 point advantage',
    likely: '5-10 points',
    lean: '3-5 points',
    tossup: '<3 points'
  }
};

// VOTER TURNOUT
const TURNOUT_DYNAMICS = {
  presidential: {
    usAverage: '60% of VAP, 70% of VEP',
    drivers: ['Competitiveness', 'Education', 'Age', 'Race']
  },
  
  midterm: {
    pattern: 'Presidential - 15-20 points',
    electorate: 'Older, whiter, more educated'
  },
  
  special: {
    pattern: 'Lower still',
    volatility: 'Extreme, unpredictable'
  },
  
  registration: {
    automatic: 'Increases turnout 3-5%',
    sameDay: 'Increases turnout 5-7%',
    strictID: 'Decreases turnout 1-3%'
  }
};

interface ElectoralEvent {
  timestamp: number;
  pollMargin: number; // Positive = leading, negative = trailing
  pollVolume: number; // Number of polls in field
  voterEnthusiasm: number; // 0-10
  turnoutModel: number; // Expected turnout %
  undecided: number; // % undecided
  swingStateStatus: number; // 0-1 competitiveness
  campaignSpending: number; // Relative to opponent
  mediaCoverage: number; // Sentiment-weighted volume
  debatePerformance: number; // 0-10
}

class ElectoralAdapter implements DomainAdapter<ElectoralEvent> {
  domain = 'soul' as const;
  name = 'Electoral Dynamics & Democratic Processes';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 1000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[ElectoralAdapter] Initialized - Democracy pulse active');
  }
  
  processRawData(event: ElectoralEvent): UniversalSignal {
    const { timestamp, pollMargin, voterEnthusiasm, turnoutModel, undecided, swingStateStatus } = event;
    
    // Frequency encodes polling velocity
    const frequency = Math.min(event.pollVolume / 10, 1);
    
    // Intensity = electoral volatility
    const intensity = (1 - undecided / 50) * swingStateStatus * Math.abs(pollMargin) / 10;
    
    // Phase encodes enthusiasm vs turnout alignment
    const phase = (voterEnthusiasm / 10 + turnoutModel / 100) / 2 * Math.PI;
    
    const harmonics = [
      Math.abs(pollMargin) / 10,
      voterEnthusiasm / 10,
      turnoutModel / 100,
      1 - undecided / 50,
      swingStateStatus,
      event.debatePerformance / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [pollMargin, voterEnthusiasm, turnoutModel, undecided, swingStateStatus]
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
    
    const recent = signals.slice(-50);
    
    const avgMargin = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgEnthusiasm = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgTurnout = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgUndecided = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgSwing = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgMargin > 5 ? 0.7 : 0.3,
      defensive: avgUndecided > 15 ? 0.7 : 0.2,
      tactical: avgSwing > 0.7 ? 0.8 : 0.3,
      strategic: avgTurnout > 65 ? 0.6 : 0.4
    };
    
    const temporalFlow = {
      early: avgUndecided > 20 ? 0.8 : 0.2,
      mid: avgUndecided > 10 && avgUndecided <= 20 ? 0.7 : 0.2,
      late: avgUndecided <= 10 ? 0.8 : 0.2
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: Math.abs(avgMargin) / 10,
      momentum: avgMargin > 0 ? 1 : -1,
      volatility: avgSwing,
      dominantFrequency: 1 - avgUndecided / 50,
      harmonicResonance: avgEnthusiasm / 10,
      phaseAlignment: avgTurnout / 100,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
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
  
  // Calculate win probability from polling
  calculateWinProbability(pollMargin: number, undecided: number, daysToElection: number): number {
    // Simplified model - margin divided by uncertainty
    const uncertainty = 3 + undecided * 0.1 + daysToElection * 0.05;
    const zScore = pollMargin / uncertainty;
    // Convert to probability using normal CDF approximation
    return 1 / (1 + Math.exp(-0.64 * zScore));
  }
  
  // Estimate electoral votes from state polls
  projectElectoralVotes(stateMargins: Record<string, number>): { dem: number; gop: number } {
    const evMap: Record<string, number> = {
      CA: 54, TX: 40, FL: 30, NY: 28, PA: 19, // ... full map would be here
    };
    
    let dem = 0;
    let gop = 0;
    
    for (const [state, margin] of Object.entries(stateMargins)) {
      const ev = evMap[state] || 0;
      if (margin > 0) dem += ev;
      else gop += ev;
    }
    
    return { dem, gop };
  }
}

export const electoralAdapter = new ElectoralAdapter();
export { ELECTORAL_SYSTEMS, POLLING_PATTERNS, CAMPAIGN_CYCLES, SWING_ANALYSIS, TURNOUT_DYNAMICS };
export type { ElectoralEvent };
