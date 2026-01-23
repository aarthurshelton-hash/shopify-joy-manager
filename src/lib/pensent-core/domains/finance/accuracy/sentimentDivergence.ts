/**
 * Sentiment Divergence - v7.53-ACCURACY
 * 
 * Detects divergences between price action and sentiment.
 * Divergences often precede reversals.
 */

export interface SentimentData {
  timestamp: number;
  source: 'social' | 'news' | 'options' | 'positioning';
  value: number;      // -1 to 1 (bearish to bullish)
  confidence: number; // 0-1
  volume: number;     // Sample size or volume
}

export interface PriceData {
  timestamp: number;
  price: number;
  change: number;     // Percent change
  volume: number;
}

export interface DivergenceSignal {
  type: 'bullish_divergence' | 'bearish_divergence' | 'confirmation' | 'none';
  strength: number;   // 0-1
  confidence: number; // 0-1
  description: string;
  expectedReversal: boolean;
  timeframe: 'immediate' | 'short_term' | 'medium_term';
}

/**
 * Calculate sentiment from multiple sources
 */
export function aggregateSentiment(sources: SentimentData[]): {
  composite: number;
  confidence: number;
  dominantSource: string;
} {
  if (sources.length === 0) {
    return { composite: 0, confidence: 0, dominantSource: 'none' };
  }
  
  // Volume-weighted average
  const totalVolume = sources.reduce((sum, s) => sum + s.volume, 0);
  const weightedSum = sources.reduce((sum, s) => 
    sum + (s.value * s.volume * s.confidence), 0
  );
  
  const composite = totalVolume > 0 ? weightedSum / totalVolume : 0;
  const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
  
  // Find dominant source
  const bySource = sources.reduce((acc, s) => {
    acc[s.source] = (acc[s.source] || 0) + s.volume;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantSource = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
  
  return { composite, confidence: avgConfidence, dominantSource };
}

/**
 * Detect divergence between price and sentiment
 */
export function detectDivergence(
  priceData: PriceData[],
  sentimentData: SentimentData[]
): DivergenceSignal {
  if (priceData.length < 3 || sentimentData.length < 3) {
    return {
      type: 'none',
      strength: 0,
      confidence: 0,
      description: 'Insufficient data',
      expectedReversal: false,
      timeframe: 'short_term',
    };
  }
  
  // Calculate price trend
  const recentPrices = priceData.slice(-5);
  const priceChange = recentPrices[recentPrices.length - 1].price / recentPrices[0].price - 1;
  const priceTrend: 'up' | 'down' | 'flat' = 
    priceChange > 0.02 ? 'up' : priceChange < -0.02 ? 'down' : 'flat';
  
  // Calculate sentiment trend
  const recentSentiment = sentimentData.slice(-5);
  const avgSentiment = recentSentiment.reduce((sum, s) => sum + s.value, 0) / recentSentiment.length;
  const sentimentTrend: 'bullish' | 'bearish' | 'neutral' =
    avgSentiment > 0.2 ? 'bullish' : avgSentiment < -0.2 ? 'bearish' : 'neutral';
  
  // Calculate divergence strength
  const divergenceStrength = Math.abs(priceChange - avgSentiment);
  
  // Bullish divergence: Price down but sentiment improving
  if (priceTrend === 'down' && sentimentTrend === 'bullish') {
    return {
      type: 'bullish_divergence',
      strength: divergenceStrength,
      confidence: Math.min(1, divergenceStrength * 2),
      description: 'Price falling while sentiment remains bullish - potential reversal',
      expectedReversal: true,
      timeframe: divergenceStrength > 0.3 ? 'immediate' : 'short_term',
    };
  }
  
  // Bearish divergence: Price up but sentiment deteriorating
  if (priceTrend === 'up' && sentimentTrend === 'bearish') {
    return {
      type: 'bearish_divergence',
      strength: divergenceStrength,
      confidence: Math.min(1, divergenceStrength * 2),
      description: 'Price rising while sentiment turns bearish - potential reversal',
      expectedReversal: true,
      timeframe: divergenceStrength > 0.3 ? 'immediate' : 'short_term',
    };
  }
  
  // Confirmation: Price and sentiment aligned
  if ((priceTrend === 'up' && sentimentTrend === 'bullish') ||
      (priceTrend === 'down' && sentimentTrend === 'bearish')) {
    return {
      type: 'confirmation',
      strength: Math.abs(avgSentiment),
      confidence: 0.7,
      description: 'Price and sentiment aligned - trend continuation likely',
      expectedReversal: false,
      timeframe: 'medium_term',
    };
  }
  
  return {
    type: 'none',
    strength: 0,
    confidence: 0.5,
    description: 'No clear divergence or confirmation',
    expectedReversal: false,
    timeframe: 'short_term',
  };
}

/**
 * Extreme sentiment detection (contrarian signals)
 */
export function detectExtremeSentiment(
  sentimentData: SentimentData[],
  extremeThreshold: number = 0.7
): {
  isExtreme: boolean;
  direction: 'extremely_bullish' | 'extremely_bearish' | 'normal';
  contrarianSignal: 'buy' | 'sell' | 'none';
  confidence: number;
} {
  const { composite, confidence } = aggregateSentiment(sentimentData);
  
  if (Math.abs(composite) < extremeThreshold) {
    return {
      isExtreme: false,
      direction: 'normal',
      contrarianSignal: 'none',
      confidence: 0,
    };
  }
  
  const isExtremeBullish = composite >= extremeThreshold;
  const isExtremeBearish = composite <= -extremeThreshold;
  
  return {
    isExtreme: true,
    direction: isExtremeBullish ? 'extremely_bullish' : 'extremely_bearish',
    // Contrarian: extreme bullish = sell, extreme bearish = buy
    contrarianSignal: isExtremeBullish ? 'sell' : 'buy',
    confidence: confidence * (Math.abs(composite) - extremeThreshold) / (1 - extremeThreshold),
  };
}

/**
 * Integrate divergence into prediction
 */
export function integrateDivergencePrediction(
  basePrediction: { direction: 'up' | 'down' | 'neutral'; confidence: number },
  divergence: DivergenceSignal
): { direction: 'up' | 'down' | 'neutral'; confidence: number; divergenceAdjustment: string } {
  let { direction, confidence } = basePrediction;
  let divergenceAdjustment = 'none';
  
  if (divergence.type === 'none') {
    return { direction, confidence, divergenceAdjustment };
  }
  
  if (divergence.type === 'confirmation') {
    // Confirmation boosts confidence
    confidence = Math.min(1, confidence * (1 + divergence.strength * 0.3));
    divergenceAdjustment = 'confirmation_boost';
  } else if (divergence.expectedReversal) {
    // Divergence suggests reversal
    if (divergence.type === 'bullish_divergence' && direction === 'down') {
      if (divergence.strength > 0.5) {
        direction = 'up';
        confidence = divergence.confidence * 0.7;
        divergenceAdjustment = 'reversal_to_bullish';
      } else {
        confidence *= (1 - divergence.strength);
        divergenceAdjustment = 'reduced_bearish_confidence';
      }
    } else if (divergence.type === 'bearish_divergence' && direction === 'up') {
      if (divergence.strength > 0.5) {
        direction = 'down';
        confidence = divergence.confidence * 0.7;
        divergenceAdjustment = 'reversal_to_bearish';
      } else {
        confidence *= (1 - divergence.strength);
        divergenceAdjustment = 'reduced_bullish_confidence';
      }
    }
  }
  
  return { direction, confidence, divergenceAdjustment };
}
