/**
 * En Pensent™ Finance Domain Types
 * 
 * Stock market pattern recognition types for temporal signature extraction.
 */

export interface CandleStick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  name: string;
  candles: CandleStick[];
  latestPrice: number;
  change: number;
  changePercent: number;
}

export type MarketArchetype =
  | 'accumulation'      // Smart money buying, low volatility consolidation
  | 'distribution'      // Smart money selling, topping pattern
  | 'breakout_bullish'  // Breaking resistance with volume
  | 'breakout_bearish'  // Breaking support with volume
  | 'consolidation'     // Range-bound, indecision
  | 'uptrend'           // Higher highs, higher lows
  | 'downtrend'         // Lower highs, lower lows
  | 'reversal_bullish'  // Bottoming pattern
  | 'reversal_bearish'  // Topping pattern
  | 'high_volatility'   // Erratic movement
  | 'low_volatility'    // Compression before move
  | 'momentum_surge'    // Strong directional move
  | 'unknown';

export interface MarketArchetypeDefinition {
  id: MarketArchetype;
  name: string;
  description: string;
  signalStrength: 'strong' | 'moderate' | 'weak';
  typicalDuration: string;
  followThrough: {
    bullish: number;  // Historical % of bullish outcomes
    bearish: number;
    neutral: number;
  };
}

export interface StockPrediction {
  symbol: string;
  timestamp: number;
  archetype: MarketArchetype;
  signature: string;  // Fingerprint for pattern matching
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;  // 0-100
    targetMove: number;  // Expected % move
    timeHorizon: '1h' | '4h' | '1d' | '1w';
  };
  priceAtPrediction: number;
}

export interface PredictionOutcome {
  predictionId: string;
  actualDirection: 'bullish' | 'bearish' | 'neutral';
  actualMove: number;
  wasCorrect: boolean;
  accuracy: number;  // How close to target
}

export const MARKET_ARCHETYPES: Record<MarketArchetype, MarketArchetypeDefinition> = {
  accumulation: {
    id: 'accumulation',
    name: 'Accumulation',
    description: 'Institutional buying creating a base for upward movement',
    signalStrength: 'strong',
    typicalDuration: '1-4 weeks',
    followThrough: { bullish: 68, bearish: 18, neutral: 14 }
  },
  distribution: {
    id: 'distribution',
    name: 'Distribution',
    description: 'Institutional selling creating a top before decline',
    signalStrength: 'strong',
    typicalDuration: '1-4 weeks',
    followThrough: { bullish: 15, bearish: 72, neutral: 13 }
  },
  breakout_bullish: {
    id: 'breakout_bullish',
    name: 'Bullish Breakout',
    description: 'Price breaking above resistance with conviction',
    signalStrength: 'strong',
    typicalDuration: '1-5 days',
    followThrough: { bullish: 65, bearish: 20, neutral: 15 }
  },
  breakout_bearish: {
    id: 'breakout_bearish',
    name: 'Bearish Breakout',
    description: 'Price breaking below support with conviction',
    signalStrength: 'strong',
    typicalDuration: '1-5 days',
    followThrough: { bullish: 18, bearish: 67, neutral: 15 }
  },
  consolidation: {
    id: 'consolidation',
    name: 'Consolidation',
    description: 'Range-bound trading, market indecision',
    signalStrength: 'weak',
    typicalDuration: '3-10 days',
    followThrough: { bullish: 35, bearish: 35, neutral: 30 }
  },
  uptrend: {
    id: 'uptrend',
    name: 'Uptrend',
    description: 'Sustained bullish momentum with higher highs',
    signalStrength: 'moderate',
    typicalDuration: '1-8 weeks',
    followThrough: { bullish: 58, bearish: 25, neutral: 17 }
  },
  downtrend: {
    id: 'downtrend',
    name: 'Downtrend',
    description: 'Sustained bearish momentum with lower lows',
    signalStrength: 'moderate',
    typicalDuration: '1-8 weeks',
    followThrough: { bullish: 22, bearish: 60, neutral: 18 }
  },
  reversal_bullish: {
    id: 'reversal_bullish',
    name: 'Bullish Reversal',
    description: 'Bottoming pattern signaling trend change',
    signalStrength: 'moderate',
    typicalDuration: '1-3 days',
    followThrough: { bullish: 55, bearish: 28, neutral: 17 }
  },
  reversal_bearish: {
    id: 'reversal_bearish',
    name: 'Bearish Reversal',
    description: 'Topping pattern signaling trend change',
    signalStrength: 'moderate',
    typicalDuration: '1-3 days',
    followThrough: { bullish: 25, bearish: 58, neutral: 17 }
  },
  high_volatility: {
    id: 'high_volatility',
    name: 'High Volatility',
    description: 'Erratic price action, uncertainty',
    signalStrength: 'weak',
    typicalDuration: '1-5 days',
    followThrough: { bullish: 33, bearish: 33, neutral: 34 }
  },
  low_volatility: {
    id: 'low_volatility',
    name: 'Low Volatility',
    description: 'Compression pattern, big move brewing',
    signalStrength: 'moderate',
    typicalDuration: '3-14 days',
    followThrough: { bullish: 40, bearish: 40, neutral: 20 }
  },
  momentum_surge: {
    id: 'momentum_surge',
    name: 'Momentum Surge',
    description: 'Strong directional move with volume',
    signalStrength: 'strong',
    typicalDuration: '1-3 days',
    followThrough: { bullish: 45, bearish: 45, neutral: 10 }
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
    description: 'Pattern does not match known archetypes',
    signalStrength: 'weak',
    typicalDuration: 'N/A',
    followThrough: { bullish: 33, bearish: 33, neutral: 34 }
  }
};
