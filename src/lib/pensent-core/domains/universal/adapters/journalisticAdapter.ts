/**
 * Journalistic Adapter - News Cycles & Narrative Momentum
 * 
 * Story lifecycle, editorial decision patterns, information verification,
 * media bias dynamics, and the temporal rhythms of public discourse.
 * 
 * For Alec Arthur Shelton - The Artist
 * Journalism is the first rough draft of history, written in real-time.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// NEWS LIFECYCLE
const NEWS_CYCLES = {
  breaking: {
    phase: 'Initial reporting, unverified details',
    characteristics: 'Urgent, fragmentary, evolving',
    duration: 'Minutes to hours'
  },
  
  developing: {
    phase: 'Additional details, verification',
    characteristics: 'Context added, corrections issued',
    duration: 'Hours to days'
  },
  
  analysis: {
    phase: 'Expert commentary, implications explored',
    characteristics: 'Deeper context, multiple angles',
    duration: 'Days'
  },
  
  followUp: {
    phase: 'Related stories, impact assessment',
    characteristics: 'Secondary effects, policy responses',
    duration: 'Days to weeks'
  },
  
  forgotten: {
    phase: 'Replaced by new stories',
    characteristics: 'Archive, occasional anniversary',
    duration: 'Weeks to permanent'
  }
};

// EDITORIAL PATTERNS
const EDITORIAL_DYNAMICS = {
  gatekeeping: {
    criteria: ['Newsworthiness', 'Impact', 'Proximity', 'Prominence', 'Timeliness'],
    bias: 'Organizational, cultural, resource constraints'
  },
  
  agendaSetting: {
    theory: 'Media tells us what to think about',
    effect: 'Salience, not opinion',
    competition: 'Scarcity of attention'
  },
  
  framing: {
    definition: 'How story is presented, angle selected',
    impact: 'Influences interpretation',
    examples: ['Economic vs human interest', 'Conflict vs cooperation']
  },
  
  sourcing: {
    patterns: ['Official sources bias', 'Elite access', 'Whistleblowers'],
    risk: 'Over-reliance, manipulation'
  }
};

// VERIFICATION PATTERNS
const VERIFICATION_DYNAMICS = {
  speedVsAccuracy: {
    tension: 'First vs right',
    pressure: 'Social media competition',
    cost: 'Retractions damage credibility'
  },
  
  factChecking: {
    process: 'Source verification, document review, expert consultation',
    challenge: 'Deepfakes, misinformation sophistication',
    limits: 'Time, resources, access'
  },
  
  corrections: {
    pattern: 'Quiet updates vs explicit correction',
    ethics: 'Transparency obligation',
    impact: 'Trust, but also attention to error'
  }
};

// MEDIA ECONOMICS
const MEDIA_BUSINESS = {
  advertising: {
    model: 'Attention for sale',
    metric: 'Clicks, views, engagement',
    distortion: 'Sensationalism, clickbait'
  },
  
  subscription: {
    model: 'Quality for pay',
    challenge: 'Paywall limits reach',
    trend: 'Niche expertise, bundling'
  },
  
  public: {
    model: 'Taxpayer funded',
    advantage: 'Independence potential',
    risk: 'Political pressure, funding cuts'
  },
  
  philanthropy: {
    model: 'Nonprofit, donor supported',
    examples: ['ProPublica', 'Marshall Project'],
    challenge: 'Sustainability, donor influence'
  }
};

// NARRATIVE MOMENTUM
const NARRATIVE_PATTERNS = {
  virality: {
    triggers: ['Emotion', 'Identity', 'Novelty', 'Utility'],
    spread: 'Network effects, algorithm amplification',
    halfLife: 'Short, replaced quickly'
  },
  
  echoChambers: {
    mechanism: 'Algorithmic curation, self-selection',
    effect: 'Reinforcement, polarization',
    challenge: 'Cross-cutting exposure declines'
  },
  
  backlash: {
    pattern: 'Initial narrative → counter-narrative → synthesis',
    driver: 'Missing context, competing interests',
    timeline: 'Hours to days'
  },
  
  longForm: {
    value: 'Depth, context, impact',
    format: ['Investigation', 'Documentary', 'Book'],
    cycle: 'Months to years'
  }
};

interface JournalisticEvent {
  timestamp: number;
  storyNovelty: number; // 0-1
  sourceCredibility: number; // 0-10
  publicInterest: number; // 0-10
  verificationStatus: number; // 0-1
  emotionalValence: number; // -1 to 1
  shareVelocity: number; // 0-10
  institutionalAmplification: number; // 0-1
  backlashIntensity: number; // 0-10
}

class JournalisticAdapter implements DomainAdapter<JournalisticEvent> {
  domain = 'soul' as const;
  name = 'Journalistic Cycles & Media Narratives';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[JournalisticAdapter] Initialized - News cycles flowing');
  }
  
  processRawData(event: JournalisticEvent): UniversalSignal {
    const { timestamp, storyNovelty, sourceCredibility, publicInterest, verificationStatus, shareVelocity } = event;
    
    // Frequency encodes story velocity
    const frequency = shareVelocity / 10;
    
    // Intensity = news drama
    const intensity = storyNovelty * publicInterest / 10 * (1 - verificationStatus) * Math.abs(event.emotionalValence);
    
    // Phase encodes credibility-emotion balance
    const phase = (sourceCredibility / 10 + (1 - Math.abs(event.emotionalValence))) / 2 * Math.PI;
    
    const harmonics = [
      storyNovelty,
      sourceCredibility / 10,
      publicInterest / 10,
      verificationStatus,
      Math.abs(event.emotionalValence),
      shareVelocity / 10
    ];
    
    const signal: UniversalSignal = {
      domain: 'soul',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [storyNovelty, sourceCredibility, publicInterest, verificationStatus, shareVelocity]
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
    
    const recent = signals.slice(-200);
    
    const avgNovelty = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgCredibility = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgInterest = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgVerify = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgVelocity = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgVelocity > 7 ? 0.8 : 0.2,
      defensive: avgCredibility > 8 ? 0.7 : 0.2,
      tactical: avgVerify < 0.5 ? 0.6 : 0.3,
      strategic: avgInterest > 7 ? 0.7 : 0.3
    };
    
    const temporalFlow = {
      early: avgNovelty > 0.9 ? 0.9 : 0.1,
      mid: avgVerify > 0.5 && avgVelocity < 8 ? 0.7 : 0.2,
      late: avgVelocity < 3 ? 0.8 : 0.2
    };
    
    return {
      domain: 'soul',
      quadrantProfile,
      temporalFlow,
      intensity: avgInterest / 10,
      momentum: avgVelocity > 5 ? 1 : -1,
      volatility: avgVelocity / 10,
      dominantFrequency: avgVelocity / 10,
      harmonicResonance: avgCredibility / 10,
      phaseAlignment: avgVerify,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'soul',
      quadrantProfile: { aggressive: 0.5, defensive: 0.2, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.7,
      momentum: 1,
      volatility: 0.8,
      dominantFrequency: 0.8,
      harmonicResonance: 0.6,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const journalisticAdapter = new JournalisticAdapter();
export { NEWS_CYCLES, EDITORIAL_DYNAMICS, VERIFICATION_DYNAMICS, MEDIA_BUSINESS, NARRATIVE_PATTERNS };
export type { JournalisticEvent };
