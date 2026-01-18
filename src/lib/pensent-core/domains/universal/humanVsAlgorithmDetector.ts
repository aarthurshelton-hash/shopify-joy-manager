/**
 * Human vs Algorithm Detector
 * 
 * Cross-references chess behavioral patterns with market trading patterns
 * to identify whether trades are likely human-originated or algorithmic.
 * 
 * KEY INSIGHT: The same psychological signatures that cause chess blunders
 * also appear in human trading behavior. Algorithms don't have these tells.
 */

import { PlayerFingerprint } from '../chess/playerFingerprint';
import { BlunderAnalysis, classifyTradeOrigin } from '../chess/blunderClassifier';

export interface MarketParticipantProfile {
  participantId: string;
  classification: 'human' | 'algorithmic' | 'hybrid' | 'unknown';
  confidence: number;
  
  // Behavioral indicators
  behaviorProfile: {
    executionConsistency: number;      // Algos are consistent
    emotionalDeviation: number;        // Humans deviate under pressure
    timingPrecision: number;           // Algos hit precise levels
    newsReactionSpeed: number;         // Algos react instantly
    patternBreaking: number;           // Humans break their own patterns
    tiltIndicators: number;            // Revenge trading, overtrading
  };
  
  // If matched to chess fingerprint
  chessFingerprint?: PlayerFingerprint;
  fingerprintMatch?: {
    similarity: number;
    matchingTraits: string[];
  };
  
  // Strategic implications
  strategicInsights: {
    exploitablePatterns: string[];
    predictability: number;
    optimalCounterStrategy: string;
  };
}

export interface TradeObservation {
  timestamp: number;
  symbol: string;
  direction: 'buy' | 'sell';
  size: number;
  executionTimeMs: number;
  priceDeviation: number;          // From VWAP or mid
  sequenceNumber: number;          // Trade sequence in session
  timeSinceLastTrade: number;
  previousPnL?: number;            // If known
  marketContext: {
    volatility: number;
    trend: 'up' | 'down' | 'sideways';
    newsRecency: number;           // Ms since last news
  };
}

/**
 * Analyze a series of trades to classify the participant
 */
export function classifyMarketParticipant(
  trades: TradeObservation[],
  knownFingerprints?: PlayerFingerprint[]
): MarketParticipantProfile {
  if (trades.length < 5) {
    return createUnknownProfile('Insufficient data');
  }
  
  // Calculate behavior metrics
  const behaviorProfile = analyzeTradingBehavior(trades);
  
  // Determine classification
  const { classification, confidence } = determineClassification(behaviorProfile);
  
  // Look for chess fingerprint matches if human
  let fingerprintMatch: MarketParticipantProfile['fingerprintMatch'];
  let chessFingerprint: PlayerFingerprint | undefined;
  
  if (classification === 'human' && knownFingerprints && knownFingerprints.length > 0) {
    const match = findMatchingFingerprint(behaviorProfile, knownFingerprints);
    if (match) {
      fingerprintMatch = match.match;
      chessFingerprint = match.fingerprint;
    }
  }
  
  // Generate strategic insights
  const strategicInsights = generateStrategicInsights(
    classification,
    behaviorProfile,
    chessFingerprint
  );
  
  return {
    participantId: `MP-${Date.now().toString(36)}`,
    classification,
    confidence,
    behaviorProfile,
    chessFingerprint,
    fingerprintMatch,
    strategicInsights
  };
}

function analyzeTradingBehavior(trades: TradeObservation[]): MarketParticipantProfile['behaviorProfile'] {
  // Execution consistency (std dev of execution times)
  const execTimes = trades.map(t => t.executionTimeMs);
  const avgExecTime = execTimes.reduce((a, b) => a + b, 0) / execTimes.length;
  const execStdDev = Math.sqrt(
    execTimes.reduce((sum, t) => sum + Math.pow(t - avgExecTime, 2), 0) / execTimes.length
  );
  const executionConsistency = 1 / (1 + execStdDev / 100);
  
  // Size consistency
  const sizes = trades.map(t => t.size);
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const sizeStdDev = Math.sqrt(
    sizes.reduce((sum, s) => sum + Math.pow(s - avgSize, 2), 0) / sizes.length
  );
  const sizeConsistency = 1 / (1 + sizeStdDev / avgSize);
  
  // Emotional deviation (erratic sizing/timing after losses)
  let emotionalDeviation = 0;
  trades.forEach((trade, i) => {
    if (i > 0 && trade.previousPnL !== undefined && trade.previousPnL < 0) {
      const prevTrade = trades[i - 1];
      const sizeChange = Math.abs(trade.size - prevTrade.size) / avgSize;
      const timeChange = Math.abs(trade.timeSinceLastTrade - 
        (trades.slice(0, i).reduce((sum, t) => sum + t.timeSinceLastTrade, 0) / i));
      emotionalDeviation += sizeChange + timeChange / 10000;
    }
  });
  emotionalDeviation = Math.min(1, emotionalDeviation / trades.length);
  
  // Timing precision (how close to round numbers/levels)
  const timingPrecision = trades.reduce((sum, t) => {
    const deviation = t.priceDeviation;
    return sum + (Math.abs(deviation) < 0.001 ? 1 : 0);
  }, 0) / trades.length;
  
  // News reaction speed
  const newsReactions = trades.filter(t => t.marketContext.newsRecency < 1000);
  const newsReactionSpeed = newsReactions.length > 0 ?
    newsReactions.reduce((sum, t) => sum + t.executionTimeMs, 0) / newsReactions.length : 1000;
  const normalizedNewsReaction = 1 / (1 + newsReactionSpeed / 100);
  
  // Pattern breaking (deviation from own established patterns)
  let patternBreaking = 0;
  const recentTrend = trades.slice(-10);
  const earlyTrend = trades.slice(0, 10);
  if (recentTrend.length >= 5 && earlyTrend.length >= 5) {
    const recentAvgSize = recentTrend.reduce((sum, t) => sum + t.size, 0) / recentTrend.length;
    const earlyAvgSize = earlyTrend.reduce((sum, t) => sum + t.size, 0) / earlyTrend.length;
    patternBreaking = Math.abs(recentAvgSize - earlyAvgSize) / Math.max(recentAvgSize, earlyAvgSize);
  }
  
  // Tilt indicators
  let tiltIndicators = 0;
  let consecutiveLosses = 0;
  trades.forEach(trade => {
    if (trade.previousPnL !== undefined && trade.previousPnL < 0) {
      consecutiveLosses++;
      if (consecutiveLosses >= 3) {
        tiltIndicators += 0.1;
      }
    } else {
      consecutiveLosses = 0;
    }
  });
  tiltIndicators = Math.min(1, tiltIndicators + emotionalDeviation * 0.5);
  
  return {
    executionConsistency,
    emotionalDeviation,
    timingPrecision,
    newsReactionSpeed: normalizedNewsReaction,
    patternBreaking,
    tiltIndicators
  };
}

function determineClassification(
  behavior: MarketParticipantProfile['behaviorProfile']
): { classification: MarketParticipantProfile['classification']; confidence: number } {
  
  // Score for algorithmic
  const algoScore = 
    behavior.executionConsistency * 0.25 +
    (1 - behavior.emotionalDeviation) * 0.25 +
    behavior.timingPrecision * 0.2 +
    behavior.newsReactionSpeed * 0.15 +
    (1 - behavior.patternBreaking) * 0.1 +
    (1 - behavior.tiltIndicators) * 0.05;
  
  // Score for human
  const humanScore =
    (1 - behavior.executionConsistency) * 0.15 +
    behavior.emotionalDeviation * 0.25 +
    (1 - behavior.timingPrecision) * 0.15 +
    (1 - behavior.newsReactionSpeed) * 0.15 +
    behavior.patternBreaking * 0.15 +
    behavior.tiltIndicators * 0.15;
  
  if (algoScore > humanScore * 1.5) {
    return { classification: 'algorithmic', confidence: Math.min(0.95, algoScore) };
  } else if (humanScore > algoScore * 1.5) {
    return { classification: 'human', confidence: Math.min(0.95, humanScore) };
  } else if (algoScore > 0.6 && humanScore > 0.4) {
    return { classification: 'hybrid', confidence: 0.7 };
  }
  
  return { classification: 'unknown', confidence: 0.5 };
}

function findMatchingFingerprint(
  behavior: MarketParticipantProfile['behaviorProfile'],
  fingerprints: PlayerFingerprint[]
): { fingerprint: PlayerFingerprint; match: { similarity: number; matchingTraits: string[] } } | null {
  
  let bestMatch: { fingerprint: PlayerFingerprint; match: { similarity: number; matchingTraits: string[] } } | null = null;
  let bestSimilarity = 0;
  
  for (const fp of fingerprints) {
    const matchingTraits: string[] = [];
    let similarity = 0;
    
    // Map trading behavior to chess fingerprint traits
    
    // Tilt resistance vs emotional deviation
    const tiltMatch = Math.abs(fp.pressureProfile.tiltResistance - (1 - behavior.tiltIndicators));
    if (tiltMatch < 0.2) {
      matchingTraits.push('tilt_pattern_match');
      similarity += 0.3;
    }
    
    // Risk tolerance vs pattern breaking
    const riskMatch = Math.abs(fp.styleProfile.riskTolerance - behavior.patternBreaking);
    if (riskMatch < 0.2) {
      matchingTraits.push('risk_profile_match');
      similarity += 0.25;
    }
    
    // Speed preference vs execution timing
    const speedMatch = Math.abs(fp.styleProfile.speedPreference - behavior.executionConsistency);
    if (speedMatch < 0.3) {
      matchingTraits.push('speed_style_match');
      similarity += 0.2;
    }
    
    // Comeback probability vs emotional recovery
    const recoveryMatch = Math.abs(fp.temporalPatterns.comebackProbability - (1 - behavior.emotionalDeviation));
    if (recoveryMatch < 0.2) {
      matchingTraits.push('recovery_pattern_match');
      similarity += 0.25;
    }
    
    if (similarity > bestSimilarity && similarity > 0.5) {
      bestSimilarity = similarity;
      bestMatch = { fingerprint: fp, match: { similarity, matchingTraits } };
    }
  }
  
  return bestMatch;
}

function generateStrategicInsights(
  classification: MarketParticipantProfile['classification'],
  behavior: MarketParticipantProfile['behaviorProfile'],
  chessFingerprint?: PlayerFingerprint
): MarketParticipantProfile['strategicInsights'] {
  
  const exploitablePatterns: string[] = [];
  let optimalCounterStrategy = '';
  let predictability = 0.5;
  
  if (classification === 'algorithmic') {
    // Algos are predictable but hard to beat on speed
    predictability = 0.8;
    exploitablePatterns.push('front_run_on_known_levels');
    exploitablePatterns.push('exploit_rebalancing_schedules');
    optimalCounterStrategy = 'Anticipate algorithmic patterns, avoid competing on speed';
  } else if (classification === 'human') {
    predictability = 0.4 + behavior.emotionalDeviation * 0.3;
    
    if (behavior.tiltIndicators > 0.5) {
      exploitablePatterns.push('tilt_after_losses');
      optimalCounterStrategy = 'Wait for emotional mistakes after drawdowns';
    }
    
    if (behavior.patternBreaking > 0.3) {
      exploitablePatterns.push('pattern_deviation_under_pressure');
      optimalCounterStrategy = 'Apply pressure to force deviations from strategy';
    }
    
    if (chessFingerprint) {
      // Use chess insights
      if (chessFingerprint.blunderSignature.dominantBlunderType === 'human') {
        exploitablePatterns.push('emotional_blunder_tendency');
      }
      
      if (chessFingerprint.pressureProfile.tiltResistance < 0.4) {
        exploitablePatterns.push('low_tilt_resistance');
        optimalCounterStrategy = 'Grind them out - they crack under sustained pressure';
      }
    }
  } else if (classification === 'hybrid') {
    predictability = 0.6;
    exploitablePatterns.push('human_override_moments');
    optimalCounterStrategy = 'Identify when human takes over from algorithm';
  }
  
  if (!optimalCounterStrategy) {
    optimalCounterStrategy = 'Insufficient data for strategy recommendation';
  }
  
  return {
    exploitablePatterns,
    predictability,
    optimalCounterStrategy
  };
}

function createUnknownProfile(reason: string): MarketParticipantProfile {
  return {
    participantId: 'unknown',
    classification: 'unknown',
    confidence: 0,
    behaviorProfile: {
      executionConsistency: 0.5,
      emotionalDeviation: 0.5,
      timingPrecision: 0.5,
      newsReactionSpeed: 0.5,
      patternBreaking: 0.5,
      tiltIndicators: 0.5
    },
    strategicInsights: {
      exploitablePatterns: [],
      predictability: 0.5,
      optimalCounterStrategy: reason
    }
  };
}

/**
 * The ultimate insight: Use chess behavioral patterns to predict market behavior
 */
export function predictMarketBehaviorFromChess(
  fingerprint: PlayerFingerprint,
  currentMarketConditions: {
    volatility: number;
    trend: 'up' | 'down' | 'sideways';
    sessionLength: number;
    recentPnL: number;
  }
): {
  likelyBehavior: string;
  blunderProbability: number;
  optimalTiming: string;
} {
  let blunderProbability = 0.1; // Base rate
  
  // Time in session (fatigue)
  if (currentMarketConditions.sessionLength > 4 * 60 * 60 * 1000) {
    blunderProbability += 0.1;
  }
  
  // Recent losses (tilt)
  if (currentMarketConditions.recentPnL < 0) {
    blunderProbability += (1 - fingerprint.pressureProfile.tiltResistance) * 0.2;
  }
  
  // Volatility (pressure)
  if (currentMarketConditions.volatility > 0.5) {
    blunderProbability += (1 - fingerprint.pressureProfile.timePressurePerformance) * 0.15;
  }
  
  // Determine likely behavior
  let likelyBehavior = '';
  if (blunderProbability > 0.4) {
    likelyBehavior = 'Likely to make emotional decisions, may overtrade or revenge trade';
  } else if (blunderProbability > 0.25) {
    likelyBehavior = 'Under some pressure, may deviate from strategy';
  } else {
    likelyBehavior = 'Operating within normal parameters';
  }
  
  // Optimal timing to exploit
  let optimalTiming = '';
  if (fingerprint.blunderSignature.blunderPhaseDistribution.endgame > 0.4) {
    optimalTiming = 'Late session - they tend to make more mistakes toward close';
  } else if (fingerprint.blunderSignature.blunderPhaseDistribution.opening > 0.4) {
    optimalTiming = 'Early session - impulsive entries';
  } else {
    optimalTiming = 'Mid-session under high volatility';
  }
  
  return {
    likelyBehavior,
    blunderProbability: Math.min(0.8, blunderProbability),
    optimalTiming
  };
}
