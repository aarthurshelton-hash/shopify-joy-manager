/**
 * En Pensent™ Finance Domain - Prediction Engine
 * 
 * Generates market predictions from temporal signatures.
 */

import { TemporalSignature } from '../../types/core';
import { 
  MarketArchetype, 
  StockPrediction, 
  MARKET_ARCHETYPES,
  CandleStick 
} from './types';
import { extractMarketSignature } from './signatureExtractor';

export interface PredictionConfig {
  timeHorizon: '1h' | '4h' | '1d' | '1w';
  confidenceThreshold: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

const DEFAULT_CONFIG: PredictionConfig = {
  timeHorizon: '1d',
  confidenceThreshold: 55,
  riskTolerance: 'moderate'
};

/**
 * Generate a prediction from candlestick data
 */
export function generatePrediction(
  symbol: string,
  candles: CandleStick[],
  config: Partial<PredictionConfig> = {}
): StockPrediction {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const signature = extractMarketSignature(symbol, candles, fullConfig.timeHorizon);
  const archetype = signature.archetype as MarketArchetype;
  const archetypeDef = MARKET_ARCHETYPES[archetype];
  
  // Calculate prediction based on archetype and signature
  const prediction = calculatePrediction(signature, archetypeDef, fullConfig);
  
  return {
    symbol,
    timestamp: Date.now(),
    archetype,
    signature: signature.fingerprint,
    prediction,
    priceAtPrediction: candles[candles.length - 1]?.close || 0
  };
}

/**
 * Calculate prediction details from signature and archetype
 */
function calculatePrediction(
  signature: TemporalSignature,
  archetypeDef: typeof MARKET_ARCHETYPES[MarketArchetype],
  config: PredictionConfig
): StockPrediction['prediction'] {
  const { followThrough, signalStrength } = archetypeDef;
  const { temporalFlow, quadrantProfile, intensity } = signature;
  
  // Base direction from archetype probabilities
  let direction: 'bullish' | 'bearish' | 'neutral';
  if (followThrough.bullish > followThrough.bearish + 10) {
    direction = 'bullish';
  } else if (followThrough.bearish > followThrough.bullish + 10) {
    direction = 'bearish';
  } else {
    direction = 'neutral';
  }
  
  // Confidence calculation
  const baseConfidence = Math.max(followThrough.bullish, followThrough.bearish);
  
  // Adjust for signal strength
  const strengthMultiplier = {
    strong: 1.15,
    moderate: 1.0,
    weak: 0.8
  }[signalStrength];
  
  // Adjust for signature quality
  const momentumBonus = Math.abs(temporalFlow.momentum) * 10;
  const intensityBonus = intensity * 10;
  const consistencyBonus = quadrantProfile.q4 ? quadrantProfile.q4 * 10 : 0;
  
  let confidence = baseConfidence * strengthMultiplier + momentumBonus + intensityBonus + consistencyBonus;
  
  // Apply risk tolerance adjustment
  const riskMultiplier = {
    conservative: 0.85,
    moderate: 1.0,
    aggressive: 1.15
  }[config.riskTolerance];
  
  confidence = Math.min(95, Math.max(25, confidence * riskMultiplier));
  
  // Estimate target move based on intensity and volatility
  const volatility = (signature.domainData?.volatility as number) || 0.02;
  const baseMove = volatility * 100; // Convert to percentage
  const targetMove = baseMove * (1 + intensity) * (direction === 'neutral' ? 0.5 : 1);
  
  return {
    direction,
    confidence: Math.round(confidence),
    targetMove: Math.round(targetMove * 10) / 10,
    timeHorizon: config.timeHorizon
  };
}

/**
 * Compare prediction to simple moving average baseline
 */
export function generateBaselinePrediction(
  candles: CandleStick[]
): { direction: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
  if (candles.length < 20) {
    return { direction: 'neutral', confidence: 50 };
  }
  
  const sma20 = candles.slice(-20).reduce((a, c) => a + c.close, 0) / 20;
  const sma5 = candles.slice(-5).reduce((a, c) => a + c.close, 0) / 5;
  const currentPrice = candles[candles.length - 1].close;
  
  // Simple SMA crossover strategy
  if (sma5 > sma20 && currentPrice > sma5) {
    return { direction: 'bullish', confidence: 55 };
  } else if (sma5 < sma20 && currentPrice < sma5) {
    return { direction: 'bearish', confidence: 55 };
  }
  
  return { direction: 'neutral', confidence: 50 };
}

/**
 * Calculate accuracy score comparing prediction to outcome
 */
export function calculatePredictionAccuracy(
  prediction: StockPrediction,
  outcomePrice: number
): {
  actualDirection: 'bullish' | 'bearish' | 'neutral';
  actualMove: number;
  wasCorrect: boolean;
  accuracyScore: number;
} {
  const { priceAtPrediction, prediction: pred } = prediction;
  const priceChange = (outcomePrice - priceAtPrediction) / priceAtPrediction;
  const actualMove = Math.abs(priceChange * 100);
  
  let actualDirection: 'bullish' | 'bearish' | 'neutral';
  if (priceChange > 0.005) {
    actualDirection = 'bullish';
  } else if (priceChange < -0.005) {
    actualDirection = 'bearish';
  } else {
    actualDirection = 'neutral';
  }
  
  const wasCorrect = pred.direction === actualDirection || 
    (pred.direction === 'neutral' && actualDirection === 'neutral');
  
  // Calculate accuracy based on:
  // 1. Direction correctness (50%)
  // 2. Target move accuracy (50%)
  const directionScore = wasCorrect ? 50 : 0;
  const moveAccuracy = Math.max(0, 50 - Math.abs(actualMove - pred.targetMove) * 5);
  const accuracyScore = directionScore + moveAccuracy;
  
  return {
    actualDirection,
    actualMove: Math.round(actualMove * 10) / 10,
    wasCorrect,
    accuracyScore: Math.round(accuracyScore)
  };
}

/**
 * Generate multi-timeframe analysis
 */
export function generateMultiTimeframePrediction(
  symbol: string,
  candles: CandleStick[]
): {
  shortTerm: StockPrediction;
  mediumTerm: StockPrediction;
  longTerm: StockPrediction;
  consensus: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  overallConfidence: number;
} {
  const shortTerm = generatePrediction(symbol, candles.slice(-24), { timeHorizon: '1h' });
  const mediumTerm = generatePrediction(symbol, candles.slice(-96), { timeHorizon: '4h' });
  const longTerm = generatePrediction(symbol, candles, { timeHorizon: '1d' });
  
  // Determine consensus
  const directions = [
    shortTerm.prediction.direction,
    mediumTerm.prediction.direction,
    longTerm.prediction.direction
  ];
  
  const bullishCount = directions.filter(d => d === 'bullish').length;
  const bearishCount = directions.filter(d => d === 'bearish').length;
  
  let consensus: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  if (bullishCount >= 2) {
    consensus = 'bullish';
  } else if (bearishCount >= 2) {
    consensus = 'bearish';
  } else if (bullishCount === 1 && bearishCount === 1) {
    consensus = 'mixed';
  } else {
    consensus = 'neutral';
  }
  
  // Weight confidences (long-term has more weight)
  const overallConfidence = Math.round(
    (shortTerm.prediction.confidence * 0.2) +
    (mediumTerm.prediction.confidence * 0.3) +
    (longTerm.prediction.confidence * 0.5)
  );
  
  return {
    shortTerm,
    mediumTerm,
    longTerm,
    consensus,
    overallConfidence
  };
}
