/**
 * Information Virality Adapter - Meme Mechanics & Misinformation Spread
 * 
 * Viral content patterns, misinformation dynamics, attention economics,
 * platform algorithms, and the temporal spread of ideas.
 * 
 * For Alec Arthur Shelton - The Artist
 * Information is the new life form, evolving through human minds.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// VIRAL MECHANICS
const VIRAL_PATTERNS = {
  reproduction: {
    r0: 'Basic reproduction number',
    threshold: 'R0 > 1 for spread',
    factors: ['Shareability', 'Platform', 'Network structure']
  },
  
  'super spreaders': {
    role: 'Few nodes drive most spread',
    types: ['Celebrities', 'Influencers', 'Media', 'Bots'],
    targeting: 'Key for viral marketing'
  },
  
  tippingPoint: {
    concept: 'Critical mass for exponential spread',
    factors: ['Network effects', 'Social proof', 'Timing'],
    unpredictability: 'Hard to engineer'
  },
  
  decay: {
    pattern: 'Exponential half-life',
    factors: ['Saturation', 'Novelty loss', 'Competition'],
    exception: 'Evergreen content'
  }
};

// MEME DYNAMICS
const MEME_PATTERNS = {
  evolution: {
    mechanism: 'Mutation, selection, transmission',
    variation: 'Remixing, adaptation',
    fitness: 'Replication success'
  },
  
  formats: {
    imageMacros: 'Template + text',
    video: 'TikTok, YouTube Shorts',
    text: 'Copypasta, tweets',
    audio: 'Sound memes, remixes'
  },
  
  lifespan: {
    fast: 'Days, hours',
    slow: 'Months, years',
    cyclical: 'Nostalgic revival'
  },
  
  crossover: {
    pattern: 'Migration between platforms',
    path: '4chan → Reddit → Twitter → Mainstream',
    transformation: 'Context changes meaning'
  }
};

// MISINFORMATION
const MISINFORMATION_PATTERNS = {
  types: {
    fabricated: 'Completely false',
    manipulated: 'Real content, false context',
    imposter: 'False source attribution',
    misleading: 'True but deceptive framing'
  },
  
  spreadAdvantage: {
    novelty: 'Surprising claims travel farther',
    emotion: 'Anger, fear, disgust amplify',
    identity: 'Confirms worldview',
    simplicity: 'Easy to understand'
  },
  
    correction: {
    effectiveness: 'Limited, often backfires',
    timing: 'Early intervention better',
    approach: 'Prebunking > debunking'
  },
  
  deepfakes: {
    technology: 'GANs, diffusion models',
    detection: 'Arms race with generation',
    threat: 'Democratic integrity, personal harm'
  }
};

// PLATFORM DYNAMICS
const ALGORITHM_PATTERNS = {
  optimization: {
    metric: 'Engagement (time, interactions)',
    effect: 'Amplifies divisive, emotional content',
    incentive: 'Creates arms race for attention'
  },
  
  filterBubbles: {
    mechanism: 'Personalization, recommendation',
    effect: 'Reduced cross-cutting exposure',
    consequence: 'Polarization, radicalization'
  },
  
  manipulation: {
    astroturfing: 'Fake grassroots',
    botnets: 'Automated amplification',
    clickFarms: 'Artificial engagement'
  },
  
  moderation: {
    challenge: 'Scale, speed, nuance',
    approaches: ['AI detection', 'Human review', 'Community notes', 'Source labeling'],
    limits: 'Speech concerns, evasion'
  }
};

// ATTENTION ECONOMY
const ATTENTION_DYNAMICS = {
  scarcity: {
    reality: 'Finite human attention',
    competition: 'Infinite content supply',
    value: 'Attention as currency'
  },
  
  engagement: {
    metrics: ['Views', 'Likes', 'Shares', 'Comments', 'Time'],
    optimization: 'Designed to maximize',
    cost: 'Mental health, productivity'
  },
  
  monetization: {
    models: ['Ads', 'Subscriptions', 'Creator funds', 'Merch'],
    creatorEconomy: 'Individual brands',
    sustainability: 'Platform dependency'
  }
};

interface InformationViralityEvent {
  timestamp: number;
  shareRate: number; // per hour
  engagementDepth: number; // 0-10
  emotionalCharge: number; // 0-10
  noveltyFactor: number; // 0-1
  sourceCredibility: number; // 0-10
  algorithmBoost: number; // 0-1
  misinformationRisk: number; // 0-1
  networkConnectivity: number; // 0-1
}

class InformationViralityAdapter implements DomainAdapter<InformationViralityEvent> {
  domain = 'network' as const;
  name = 'Information Virality & Meme Spread';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[InformationViralityAdapter] Initialized - Viral patterns active');
  }
  
  processRawData(event: InformationViralityEvent): UniversalSignal {
    const { timestamp, shareRate, engagementDepth, emotionalCharge, noveltyFactor, algorithmBoost } = event;
    
    // Frequency encodes spread velocity
    const frequency = Math.min(shareRate / 100, 1);
    
    // Intensity = viral potential
    const intensity = engagementDepth / 10 * emotionalCharge / 10 * noveltyFactor * algorithmBoost;
    
    // Phase encodes credibility-emotion alignment
    const phase = (event.sourceCredibility / 10 + emotionalCharge / 10) / 2 * Math.PI;
    
    const harmonics = [
      Math.min(shareRate / 100, 1),
      engagementDepth / 10,
      emotionalCharge / 10,
      noveltyFactor,
      event.sourceCredibility / 10,
      algorithmBoost
    ];
    
    const signal: UniversalSignal = {
      domain: 'network',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [shareRate, engagementDepth, emotionalCharge, noveltyFactor, algorithmBoost]
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
    
    const avgShare = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgEngage = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgEmotion = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgNovelty = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgAlgo = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgEmotion > 7 ? 0.8 : 0.2,
      defensive: avgNovelty < 0.3 ? 0.6 : 0.3,
      tactical: avgAlgo > 0.7 ? 0.7 : 0.3,
      strategic: avgEngage > 7 ? 0.8 : 0.3
    };
    
    const temporalFlow = {
      early: avgShare < 10 ? 0.8 : 0.2,
      mid: avgShare >= 10 && avgShare < 100 ? 0.8 : 0.1,
      late: avgShare >= 100 ? 0.7 : 0.3
    };
    
    return {
      domain: 'network',
      quadrantProfile,
      temporalFlow,
      intensity: avgEngage / 10,
      momentum: avgShare > 50 ? 1 : -1,
      volatility: avgEmotion / 10,
      dominantFrequency: Math.min(avgShare / 100, 1),
      harmonicResonance: avgNovelty,
      phaseAlignment: avgAlgo,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'network',
      quadrantProfile: { aggressive: 0.5, defensive: 0.2, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.7, mid: 0.2, late: 0.1 },
      intensity: 0.6,
      momentum: 0,
      volatility: 0.7,
      dominantFrequency: 0.5,
      harmonicResonance: 0.6,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const informationViralityAdapter = new InformationViralityAdapter();
export { VIRAL_PATTERNS, MEME_PATTERNS, MISINFORMATION_PATTERNS, ALGORITHM_PATTERNS, ATTENTION_DYNAMICS };
export type { InformationViralityEvent };
