/**
 * En Pensent™ Finance Domain - Signature Extraction
 * 
 * Extracts TemporalSignatures from stock market candlestick data.
 */

import { 
  TemporalSignature, 
  QuadrantProfile, 
  TemporalFlow, 
  CriticalMoment 
} from '../../types/core';
import { CandleStick, MarketArchetype, MARKET_ARCHETYPES } from './types';

/**
 * Extract a TemporalSignature from candlestick data
 */
export function extractMarketSignature(
  symbol: string,
  candles: CandleStick[],
  timeHorizon: '1h' | '4h' | '1d' | '1w' = '1d'
): TemporalSignature {
  if (candles.length < 5) {
    return createEmptySignature(symbol);
  }

  const quadrantProfile = calculateQuadrantProfile(candles);
  const temporalFlow = calculateTemporalFlow(candles);
  const criticalMoments = findCriticalMoments(candles);
  const intensity = calculateIntensity(candles);
  const archetype = classifyMarketArchetype(quadrantProfile, temporalFlow, intensity, candles);
  const fingerprint = generateFingerprint(symbol, archetype, quadrantProfile, temporalFlow);

  return {
    fingerprint,
    archetype,
    dominantForce: determineDominantForce(candles),
    flowDirection: determineFlowDirection(candles),
    intensity,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
    domainData: {
      symbol,
      timeHorizon,
      candleCount: candles.length,
      volumeProfile: calculateVolumeProfile(candles),
      volatility: calculateVolatility(candles),
      trendStrength: calculateTrendStrength(candles)
    }
  };
}

/**
 * Map price action to quadrant profile
 * Q1: Price momentum (bullish strength)
 * Q2: Volume activity (conviction)
 * Q3: Volatility (risk/opportunity)
 * Q4: Trend consistency (reliability)
 */
function calculateQuadrantProfile(candles: CandleStick[]): QuadrantProfile {
  const returns = candles.slice(1).map((c, i) => 
    (c.close - candles[i].close) / candles[i].close
  );
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const positiveReturns = returns.filter(r => r > 0).length / returns.length;
  
  // Q1: Price momentum (0-1 scale)
  const q1 = Math.min(1, Math.max(0, 0.5 + avgReturn * 10));
  
  // Q2: Volume activity
  const avgVolume = candles.reduce((a, c) => a + c.volume, 0) / candles.length;
  const recentVolume = candles.slice(-5).reduce((a, c) => a + c.volume, 0) / 5;
  const q2 = Math.min(1, recentVolume / avgVolume);
  
  // Q3: Volatility (higher = more activity)
  const volatility = calculateVolatility(candles);
  const q3 = Math.min(1, volatility * 10);
  
  // Q4: Trend consistency
  const q4 = Math.abs(positiveReturns - 0.5) * 2;
  
  // Center: Overall market health
  const center = (q1 + q2 + q4) / 3;

  return { q1, q2, q3, q4, center };
}

/**
 * Calculate temporal flow from candle sequence
 */
function calculateTemporalFlow(candles: CandleStick[]): TemporalFlow {
  const third = Math.floor(candles.length / 3);
  
  const openingCandles = candles.slice(0, third);
  const middleCandles = candles.slice(third, third * 2);
  const endingCandles = candles.slice(third * 2);
  
  const getPhaseActivity = (phase: CandleStick[]) => {
    if (phase.length === 0) return 0.5;
    const avgRange = phase.reduce((a, c) => a + (c.high - c.low) / c.open, 0) / phase.length;
    return Math.min(1, avgRange * 20);
  };
  
  const opening = getPhaseActivity(openingCandles);
  const middle = getPhaseActivity(middleCandles);
  const ending = getPhaseActivity(endingCandles);
  
  // Determine trend
  let trend: TemporalFlow['trend'];
  if (ending > middle && middle > opening) {
    trend = 'accelerating';
  } else if (ending < middle && middle < opening) {
    trend = 'declining';
  } else if (Math.abs(ending - opening) < 0.1) {
    trend = 'stable';
  } else {
    trend = 'volatile';
  }
  
  // Calculate momentum
  const priceChange = (candles[candles.length - 1].close - candles[0].close) / candles[0].close;
  const momentum = Math.max(-1, Math.min(1, priceChange * 10));

  return { opening, middle, ending, trend, momentum };
}

/**
 * Find significant price turning points
 */
function findCriticalMoments(candles: CandleStick[]): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  
  if (candles.length < 3) return moments;
  
  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i - 2];
    const curr = candles[i - 1];
    const next = candles[i];
    
    const prevChange = (curr.close - prev.close) / prev.close;
    const nextChange = (next.close - curr.close) / curr.close;
    
    // Detect reversals
    if (prevChange < -0.02 && nextChange > 0.02) {
      moments.push({
        index: i - 1,
        type: 'bullish_reversal',
        severity: Math.min(1, Math.abs(nextChange - prevChange) * 10),
        description: `Bullish reversal at ${new Date(curr.timestamp).toLocaleDateString()}`,
        metadata: { price: curr.close, volume: curr.volume }
      });
    } else if (prevChange > 0.02 && nextChange < -0.02) {
      moments.push({
        index: i - 1,
        type: 'bearish_reversal',
        severity: Math.min(1, Math.abs(nextChange - prevChange) * 10),
        description: `Bearish reversal at ${new Date(curr.timestamp).toLocaleDateString()}`,
        metadata: { price: curr.close, volume: curr.volume }
      });
    }
    
    // Detect volume spikes
    const avgVolume = candles.slice(0, i).reduce((a, c) => a + c.volume, 0) / i;
    if (curr.volume > avgVolume * 2) {
      moments.push({
        index: i - 1,
        type: 'volume_spike',
        severity: Math.min(1, curr.volume / avgVolume / 5),
        description: `Volume spike at ${new Date(curr.timestamp).toLocaleDateString()}`,
        metadata: { volume: curr.volume, avgVolume }
      });
    }
  }
  
  return moments.slice(0, 10); // Top 10 moments
}

/**
 * Calculate overall market intensity
 */
function calculateIntensity(candles: CandleStick[]): number {
  const avgRange = candles.reduce((a, c) => a + (c.high - c.low) / c.open, 0) / candles.length;
  const avgVolume = candles.reduce((a, c) => a + c.volume, 0) / candles.length;
  const recentVolume = candles.slice(-5).reduce((a, c) => a + c.volume, 0) / 5;
  
  const rangeIntensity = Math.min(1, avgRange * 15);
  const volumeIntensity = Math.min(1, recentVolume / avgVolume);
  
  return (rangeIntensity + volumeIntensity) / 2;
}

/**
 * Classify the market archetype based on signature components
 */
function classifyMarketArchetype(
  quadrant: QuadrantProfile,
  temporal: TemporalFlow,
  intensity: number,
  candles: CandleStick[]
): MarketArchetype {
  const { q1, q2, q3, q4 } = quadrant;
  const { trend, momentum } = temporal;
  const volatility = calculateVolatility(candles);
  
  // Strong bullish breakout
  if (q1 > 0.7 && q2 > 0.7 && momentum > 0.3 && trend === 'accelerating') {
    return 'breakout_bullish';
  }
  
  // Strong bearish breakout
  if (q1 < 0.3 && q2 > 0.7 && momentum < -0.3 && trend === 'accelerating') {
    return 'breakout_bearish';
  }
  
  // Accumulation: low volatility, building volume, slight bullish
  if (q3 < 0.4 && q2 > 0.5 && q1 > 0.45 && q1 < 0.6 && trend === 'stable') {
    return 'accumulation';
  }
  
  // Distribution: topping action, volume, slight bearish
  if (q3 < 0.4 && q2 > 0.5 && q1 < 0.55 && q1 > 0.4 && momentum < 0) {
    return 'distribution';
  }
  
  // Clear uptrend
  if (q1 > 0.6 && q4 > 0.6 && momentum > 0.1) {
    return 'uptrend';
  }
  
  // Clear downtrend
  if (q1 < 0.4 && q4 > 0.6 && momentum < -0.1) {
    return 'downtrend';
  }
  
  // Bullish reversal
  if (temporal.opening < 0.4 && temporal.ending > 0.6 && momentum > 0.2) {
    return 'reversal_bullish';
  }
  
  // Bearish reversal
  if (temporal.opening > 0.6 && temporal.ending < 0.4 && momentum < -0.2) {
    return 'reversal_bearish';
  }
  
  // High volatility
  if (q3 > 0.7 || volatility > 0.05) {
    return 'high_volatility';
  }
  
  // Low volatility compression
  if (q3 < 0.2 && volatility < 0.01) {
    return 'low_volatility';
  }
  
  // Momentum surge
  if (intensity > 0.8 && Math.abs(momentum) > 0.4) {
    return 'momentum_surge';
  }
  
  // Consolidation
  if (q4 < 0.3 && Math.abs(momentum) < 0.1) {
    return 'consolidation';
  }
  
  return 'unknown';
}

function calculateVolatility(candles: CandleStick[]): number {
  if (candles.length < 2) return 0;
  const returns = candles.slice(1).map((c, i) => 
    (c.close - candles[i].close) / candles[i].close
  );
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateVolumeProfile(candles: CandleStick[]): { avg: number; trend: string } {
  const avg = candles.reduce((a, c) => a + c.volume, 0) / candles.length;
  const recentAvg = candles.slice(-5).reduce((a, c) => a + c.volume, 0) / 5;
  const trend = recentAvg > avg * 1.2 ? 'increasing' : recentAvg < avg * 0.8 ? 'decreasing' : 'stable';
  return { avg, trend };
}

function calculateTrendStrength(candles: CandleStick[]): number {
  if (candles.length < 2) return 0;
  const returns = candles.slice(1).map((c, i) => 
    c.close > candles[i].close ? 1 : -1
  );
  const consistency = Math.abs(returns.reduce((a, b) => a + b, 0)) / returns.length;
  return consistency;
}

function determineDominantForce(candles: CandleStick[]): 'primary' | 'secondary' | 'balanced' {
  const change = (candles[candles.length - 1].close - candles[0].close) / candles[0].close;
  if (change > 0.02) return 'primary';
  if (change < -0.02) return 'secondary';
  return 'balanced';
}

function determineFlowDirection(candles: CandleStick[]): 'forward' | 'lateral' | 'backward' | 'chaotic' {
  const returns = candles.slice(1).map((c, i) => 
    (c.close - candles[i].close) / candles[i].close
  );
  const positiveCount = returns.filter(r => r > 0).length;
  const ratio = positiveCount / returns.length;
  
  if (ratio > 0.6) return 'forward';
  if (ratio < 0.4) return 'backward';
  
  const volatility = calculateVolatility(candles);
  if (volatility > 0.03) return 'chaotic';
  
  return 'lateral';
}

function generateFingerprint(
  symbol: string,
  archetype: string,
  quadrant: QuadrantProfile,
  temporal: TemporalFlow
): string {
  const components = [
    symbol,
    archetype,
    Math.round(quadrant.q1 * 100),
    Math.round(quadrant.q2 * 100),
    Math.round(quadrant.q3 * 100),
    Math.round(quadrant.q4 * 100),
    temporal.trend,
    Math.round(temporal.momentum * 100)
  ];
  return components.join('-');
}

function createEmptySignature(symbol: string): TemporalSignature {
  return {
    fingerprint: `${symbol}-empty-${Date.now()}`,
    archetype: 'unknown',
    dominantForce: 'balanced',
    flowDirection: 'lateral',
    intensity: 0,
    quadrantProfile: { q1: 0.5, q2: 0.5, q3: 0.5, q4: 0.5 },
    temporalFlow: { opening: 0.5, middle: 0.5, ending: 0.5, trend: 'stable', momentum: 0 },
    criticalMoments: []
  };
}
