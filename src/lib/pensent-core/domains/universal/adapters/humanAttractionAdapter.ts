/**
 * Human Attraction & Behavioral Dynamics Adapter
 * 
 * Studies love, hate, passion, mating, and primal human drives
 * to understand the emotional irrationality that moves markets.
 * 
 * Markets are driven by fear and greed - both are survival instincts.
 * Love and hate are the extremes that cause bubbles and crashes.
 * 
 * Inventor: Alec Arthur Shelton
 */

import { UniversalSignal, DomainSignature, DomainType } from '../types';

// Laws of Attraction - Universal Patterns
const ATTRACTION_LAWS = {
  proximity: { principle: 'Closer things attract more attention', decayRate: 0.7, marketApplication: 'Recent price action weighs heavier than historical' },
  similarity: { principle: 'Like attracts like', clusteringCoefficient: 0.82, marketApplication: 'Correlated assets move together; sectors cluster' },
  reciprocity: { principle: 'Give and take creates bonds', reinforcementRate: 1.4, marketApplication: 'Buyer-seller dynamics; market making reciprocity' },
  scarcity: { principle: 'Rare things are valued more', premiumMultiplier: 2.3, marketApplication: 'Limited supply drives price; FOMO dynamics' },
  mystery: { principle: 'Unknown creates fascination', curiosityFactor: 1.6, marketApplication: 'Uncertainty premium; speculation on unknowns' }
};

// Mating & Reproductive Strategies (mapped to market behavior)
const MATING_DYNAMICS = {
  displayBehavior: { peacocking: 'Conspicuous display to attract', marketEquivalent: 'Companies announcing big moves, flashy PR', signalStrength: 0.75 },
  competitiveMating: { maleCompetition: 'Direct competition for mates', femaleChoice: 'Selective evaluation of options', marketEquivalent: 'Bidding wars; due diligence selection' },
  pairBonding: { shortTerm: { investment: 0.3, commitment: 0.2 }, longTerm: { investment: 0.9, commitment: 0.85 }, marketEquivalent: 'Day trading vs long-term holding psychology' },
  parentalInvestment: { principle: 'Higher investment = more selectivity', marketEquivalent: 'Larger position = more due diligence' }
};

// Love-Hate Spectrum (Emotional Extremes)
const EMOTIONAL_SPECTRUM = {
  love: { characteristics: ['attachment', 'oxytocin', 'loyalty', 'sacrifice'], marketBehavior: 'Diamond hands, refusing to sell', rationalityScore: 0.3, intensity: 1.0 },
  passion: { characteristics: ['excitement', 'dopamine', 'risk-taking', 'obsession'], marketBehavior: 'FOMO buying, meme stock mania', rationalityScore: 0.4, intensity: 0.9 },
  lust: { characteristics: ['immediate_gratification', 'impulsive', 'short_sighted'], marketBehavior: 'Scalping, lottery ticket options', rationalityScore: 0.2, intensity: 0.85 },
  indifference: { characteristics: ['apathy', 'disconnection', 'neutrality'], marketBehavior: 'Sideways consolidation, low volume', rationalityScore: 0.7, intensity: 0.1 },
  dislike: { characteristics: ['avoidance', 'skepticism', 'caution'], marketBehavior: 'Reducing positions, hedging', rationalityScore: 0.6, intensity: 0.4 },
  hatred: { characteristics: ['destruction', 'cortisol', 'revenge', 'spite'], marketBehavior: 'Short selling with vengeance, panic selling', rationalityScore: 0.2, intensity: 1.0 }
};

// Primal Drives (Survival Instincts)
const PRIMAL_DRIVES = {
  survival: { fightOrFlight: { fight: 'Double down, average down', flight: 'Stop loss, panic sell', freeze: 'Do nothing, paralysis' }, thresholds: { flightTrigger: -0.15, fightTrigger: -0.05, freezeZone: [-0.15, -0.05] } },
  reproduction: { drive: 'Create more (wealth, legacy)', riskProfile: 'Accept risk for future security', marketBehavior: 'Growth investing, building portfolio' },
  status: { hierarchyAwareness: 0.95, displayWealth: 'Show gains, hide losses', marketBehavior: 'Social trading, gain porn' },
  belonging: { tribalInstinct: 0.88, inGroupBias: 1.4, marketBehavior: 'Following communities, WSB, crypto tribes' }
};

// Passion Cycles (Emotional Rhythm)
const PASSION_CYCLES = {
  infatuation: { duration: '2-6 months', characteristics: 'Blind optimism, ignoring red flags', marketPhase: 'Early bull market' },
  honeymoon: { duration: '6-18 months', characteristics: 'Peak happiness, everything is perfect', marketPhase: 'Bull market peak' },
  disillusionment: { duration: '1-3 months', characteristics: 'Flaws become visible, doubt creeps in', marketPhase: 'Distribution phase' },
  decision: { duration: 'Variable', characteristics: 'Commit or leave', marketPhase: 'Capitulation or diamond hands' },
  integration: { duration: 'Ongoing', characteristics: 'Realistic acceptance', marketPhase: 'Accumulation, value investing' }
};

interface AttractionData {
  emotionalState: keyof typeof EMOTIONAL_SPECTRUM;
  passionPhase: keyof typeof PASSION_CYCLES;
  primalDrive: keyof typeof PRIMAL_DRIVES;
  fearGreedIndex: number; // 0-100
  socialSentiment: number; // -1 to 1
  attachmentLevel: number; // 0-1
}

class HumanAttractionAdapter {
  private readonly domain: DomainType = 'soul'; // Maps to soul domain (human spirit/psychology)
  private signalBuffer: UniversalSignal[] = [];
  private isActive = false;

  async initialize(): Promise<void> {
    this.isActive = true;
    console.log('[HumanAttractionAdapter] Emotional intelligence activated');
  }

  processAttractionData(data: AttractionData): UniversalSignal {
    const emotionalProfile = EMOTIONAL_SPECTRUM[data.emotionalState];
    const emotionalIntensity = emotionalProfile.intensity;
    const irrationalityFactor = 1 - emotionalProfile.rationalityScore;
    const fearGreedNormalized = (data.fearGreedIndex - 50) / 50;
    const attachmentInertia = data.attachmentLevel * 0.5;
    const passionPhasePosition = this.getPassionPhasePosition(data.passionPhase);
    
    const frequency = 0.4 + (emotionalIntensity * 0.4);
    const intensity = (emotionalIntensity + irrationalityFactor + Math.abs(fearGreedNormalized)) / 3;
    
    const signal: UniversalSignal = {
      domain: this.domain,
      timestamp: Date.now(),
      frequency,
      intensity: Math.min(intensity, 1),
      phase: passionPhasePosition,
      harmonics: [emotionalIntensity, irrationalityFactor, fearGreedNormalized, data.socialSentiment, attachmentInertia],
      rawData: [emotionalIntensity, irrationalityFactor, fearGreedNormalized, data.socialSentiment, attachmentInertia, data.fearGreedIndex / 100]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > 100) this.signalBuffer.shift();
    
    return signal;
  }

  private getPassionPhasePosition(phase: keyof typeof PASSION_CYCLES): number {
    const phaseOrder = ['integration', 'infatuation', 'honeymoon', 'disillusionment', 'decision'];
    const index = phaseOrder.indexOf(phase);
    return (index / phaseOrder.length) * 2 * Math.PI;
  }

  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) return this.getDefaultSignature();
    
    const avgIntensity = signals.reduce((s, sig) => s + sig.intensity, 0) / signals.length;
    const emotionalDirection = signals.slice(-10).reduce((s, sig) => s + (sig.harmonics[2] || 0), 0) / 10;
    const irrationalityLevel = signals.slice(-10).reduce((s, sig) => s + (sig.harmonics[1] || 0), 0) / 10;
    
    return {
      domain: this.domain,
      quadrantProfile: {
        aggressive: emotionalDirection > 0.3 ? 0.7 : 0.2, // Greed
        defensive: emotionalDirection < -0.3 ? 0.7 : 0.2, // Fear
        tactical: irrationalityLevel > 0.5 ? 0.6 : 0.3, // Emotional
        strategic: irrationalityLevel < 0.3 ? 0.6 : 0.2 // Rational
      },
      temporalFlow: { early: 0.4, mid: 0.5, late: 0.6 },
      intensity: avgIntensity,
      momentum: emotionalDirection,
      volatility: irrationalityLevel,
      dominantFrequency: 0.5,
      harmonicResonance: 1 - irrationalityLevel * 0.3, // Reduce resonance when irrational
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

  generateAttractionData(momentum: number, volatility: number, volume: number, fearGreedIndex: number): AttractionData {
    let emotionalState: keyof typeof EMOTIONAL_SPECTRUM;
    if (fearGreedIndex > 80) emotionalState = 'love';
    else if (fearGreedIndex > 60) emotionalState = 'passion';
    else if (fearGreedIndex > 40) emotionalState = 'indifference';
    else if (fearGreedIndex > 20) emotionalState = 'dislike';
    else emotionalState = 'hatred';
    
    let passionPhase: keyof typeof PASSION_CYCLES;
    if (momentum > 0.5 && volatility < 0.3) passionPhase = 'honeymoon';
    else if (momentum > 0.2) passionPhase = 'infatuation';
    else if (momentum < -0.3) passionPhase = 'disillusionment';
    else if (volatility > 0.6) passionPhase = 'decision';
    else passionPhase = 'integration';
    
    let primalDrive: keyof typeof PRIMAL_DRIVES;
    if (volume > 0.7 && momentum > 0) primalDrive = 'reproduction';
    else if (volatility > 0.6) primalDrive = 'survival';
    else if (Math.abs(momentum) < 0.2) primalDrive = 'belonging';
    else primalDrive = 'status';
    
    return { emotionalState, passionPhase, primalDrive, fearGreedIndex, socialSentiment: momentum, attachmentLevel: 1 - volatility };
  }

  detectEmotionalExtremes(recentSignals: UniversalSignal[]): { isExtreme: boolean; type: 'euphoria' | 'panic' | 'neutral'; reversalProbability: number } {
    if (recentSignals.length < 5) return { isExtreme: false, type: 'neutral', reversalProbability: 0 };
    
    const avgIrrationality = recentSignals.reduce((s, sig) => s + (sig.harmonics[1] || 0), 0) / recentSignals.length;
    const avgFearGreed = recentSignals.reduce((s, sig) => s + (sig.harmonics[2] || 0), 0) / recentSignals.length;
    
    if (avgIrrationality > 0.7 && avgFearGreed > 0.6) return { isExtreme: true, type: 'euphoria', reversalProbability: 0.73 };
    if (avgIrrationality > 0.7 && avgFearGreed < -0.6) return { isExtreme: true, type: 'panic', reversalProbability: 0.68 };
    return { isExtreme: false, type: 'neutral', reversalProbability: 0.1 };
  }
}

export const humanAttractionAdapter = new HumanAttractionAdapter();
export { ATTRACTION_LAWS, MATING_DYNAMICS, EMOTIONAL_SPECTRUM, PRIMAL_DRIVES, PASSION_CYCLES };
