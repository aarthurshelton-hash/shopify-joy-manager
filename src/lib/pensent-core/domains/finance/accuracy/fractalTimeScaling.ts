/**
 * Fractal Time Scaling - v7.53-ACCURACY
 * 
 * Multi-timeframe confluence analysis.
 * When multiple timeframes agree, prediction reliability increases.
 */

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface TimeframeSignal {
  timeframe: Timeframe;
  direction: 'up' | 'down' | 'neutral';
  strength: number;     // 0-1
  trend: 'trending' | 'ranging' | 'reverting';
  momentum: number;     // -1 to 1
  keyLevels: { support: number; resistance: number };
}

export interface ConfluenceResult {
  overallDirection: 'up' | 'down' | 'neutral';
  confluenceScore: number;      // 0-1, higher = more agreement
  dominantTimeframe: Timeframe;
  alignedTimeframes: Timeframe[];
  conflictingTimeframes: Timeframe[];
  predictionReliability: number;
  fractalPattern: 'aligned' | 'diverging' | 'mixed';
}

/**
 * Timeframe weights - higher timeframes more weight
 */
export const TIMEFRAME_WEIGHTS: Record<Timeframe, number> = {
  '1m': 0.1,
  '5m': 0.15,
  '15m': 0.2,
  '1h': 0.3,
  '4h': 0.5,
  '1d': 0.7,
  '1w': 1.0,
};

/**
 * Calculate confluence across multiple timeframes
 */
export function calculateConfluence(signals: TimeframeSignal[]): ConfluenceResult {
  if (signals.length === 0) {
    return {
      overallDirection: 'neutral',
      confluenceScore: 0,
      dominantTimeframe: '1h',
      alignedTimeframes: [],
      conflictingTimeframes: [],
      predictionReliability: 0,
      fractalPattern: 'mixed',
    };
  }
  
  // Weight signals by timeframe
  let upWeight = 0;
  let downWeight = 0;
  let totalWeight = 0;
  
  for (const signal of signals) {
    const weight = TIMEFRAME_WEIGHTS[signal.timeframe] * signal.strength;
    totalWeight += weight;
    
    if (signal.direction === 'up') {
      upWeight += weight;
    } else if (signal.direction === 'down') {
      downWeight += weight;
    }
  }
  
  // Determine overall direction
  const overallDirection: 'up' | 'down' | 'neutral' = 
    upWeight > downWeight * 1.2 ? 'up' :
    downWeight > upWeight * 1.2 ? 'down' : 'neutral';
  
  // Find dominant timeframe (highest weight signal that matches overall)
  const matchingSignals = signals.filter(s => s.direction === overallDirection);
  const dominantTimeframe = matchingSignals.length > 0 ?
    matchingSignals.reduce((max, s) => 
      TIMEFRAME_WEIGHTS[s.timeframe] > TIMEFRAME_WEIGHTS[max.timeframe] ? s : max
    ).timeframe : signals[0].timeframe;
  
  // Calculate confluence score
  const alignedTimeframes = signals
    .filter(s => s.direction === overallDirection)
    .map(s => s.timeframe);
  
  const conflictingTimeframes = signals
    .filter(s => s.direction !== 'neutral' && s.direction !== overallDirection)
    .map(s => s.timeframe);
  
  const alignmentRatio = alignedTimeframes.length / signals.length;
  const weightedAlignment = alignedTimeframes.reduce((sum, tf) => 
    sum + TIMEFRAME_WEIGHTS[tf], 0
  ) / signals.reduce((sum, s) => sum + TIMEFRAME_WEIGHTS[s.timeframe], 0);
  
  const confluenceScore = (alignmentRatio * 0.4) + (weightedAlignment * 0.6);
  
  // Determine fractal pattern
  const fractalPattern: 'aligned' | 'diverging' | 'mixed' = 
    confluenceScore > 0.7 ? 'aligned' :
    conflictingTimeframes.length >= alignedTimeframes.length ? 'diverging' : 'mixed';
  
  // Prediction reliability based on confluence
  const predictionReliability = confluenceScore * (fractalPattern === 'aligned' ? 1.2 : 
    fractalPattern === 'diverging' ? 0.6 : 0.85);
  
  return {
    overallDirection,
    confluenceScore,
    dominantTimeframe,
    alignedTimeframes,
    conflictingTimeframes,
    predictionReliability: Math.min(1, predictionReliability),
    fractalPattern,
  };
}

/**
 * Detect fractal pattern repetition
 */
export function detectFractalRepetition(
  shortTermSignals: TimeframeSignal[],
  longTermSignals: TimeframeSignal[]
): { isRepeating: boolean; similarity: number; scaleFactor: number } {
  if (shortTermSignals.length === 0 || longTermSignals.length === 0) {
    return { isRepeating: false, similarity: 0, scaleFactor: 1 };
  }
  
  // Compare direction patterns
  const shortDirections = shortTermSignals.map(s => s.direction);
  const longDirections = longTermSignals.map(s => s.direction);
  
  let matches = 0;
  const compareLength = Math.min(shortDirections.length, longDirections.length);
  
  for (let i = 0; i < compareLength; i++) {
    if (shortDirections[i] === longDirections[i]) matches++;
  }
  
  const similarity = matches / compareLength;
  
  // Calculate scale factor (how timeframes relate)
  const shortAvgWeight = shortTermSignals.reduce((sum, s) => 
    sum + TIMEFRAME_WEIGHTS[s.timeframe], 0) / shortTermSignals.length;
  const longAvgWeight = longTermSignals.reduce((sum, s) => 
    sum + TIMEFRAME_WEIGHTS[s.timeframe], 0) / longTermSignals.length;
  
  const scaleFactor = longAvgWeight / shortAvgWeight;
  
  return {
    isRepeating: similarity > 0.7,
    similarity,
    scaleFactor,
  };
}

/**
 * Get optimal timeframe for prediction
 */
export function getOptimalTimeframe(
  signals: TimeframeSignal[],
  tradingStyle: 'scalp' | 'swing' | 'position' = 'swing'
): { timeframe: Timeframe; confidence: number; reason: string } {
  const styleTimeframes: Record<typeof tradingStyle, Timeframe[]> = {
    scalp: ['1m', '5m', '15m'],
    swing: ['1h', '4h', '1d'],
    position: ['1d', '1w'],
  };
  
  const relevantSignals = signals.filter(s => 
    styleTimeframes[tradingStyle].includes(s.timeframe)
  );
  
  if (relevantSignals.length === 0) {
    return {
      timeframe: styleTimeframes[tradingStyle][1] || '1h',
      confidence: 0.3,
      reason: 'No signals for trading style, using default',
    };
  }
  
  // Find strongest aligned signal
  const confluence = calculateConfluence(relevantSignals);
  const aligned = relevantSignals.filter(s => s.direction === confluence.overallDirection);
  
  if (aligned.length === 0) {
    return {
      timeframe: relevantSignals[0].timeframe,
      confidence: 0.4,
      reason: 'No aligned signals, using first available',
    };
  }
  
  const strongest = aligned.reduce((max, s) => 
    s.strength > max.strength ? s : max
  );
  
  return {
    timeframe: strongest.timeframe,
    confidence: strongest.strength * confluence.confluenceScore,
    reason: `${strongest.timeframe} shows strongest ${confluence.overallDirection} signal with ${(confluence.confluenceScore * 100).toFixed(0)}% confluence`,
  };
}

/**
 * Integrate multi-timeframe analysis into prediction
 */
export function integrateMultiTimeframePrediction(
  basePrediction: { direction: 'up' | 'down' | 'neutral'; confidence: number },
  confluence: ConfluenceResult
): { direction: 'up' | 'down' | 'neutral'; confidence: number; mtfAdjustment: number } {
  let { direction, confidence } = basePrediction;
  
  // Confluence boost or penalty
  const mtfAdjustment = confluence.fractalPattern === 'aligned' ? 0.3 :
    confluence.fractalPattern === 'diverging' ? -0.3 : 0;
  
  // If MTF strongly disagrees, respect it
  if (confluence.overallDirection !== direction && confluence.confluenceScore > 0.7) {
    direction = confluence.overallDirection;
    confidence = confluence.predictionReliability * 0.8;
  } else if (confluence.overallDirection === direction) {
    // Agreement boosts confidence
    confidence = Math.min(1, confidence * (1 + confluence.confluenceScore * 0.4));
  } else {
    // Mild disagreement reduces confidence
    confidence *= (1 - confluence.confluenceScore * 0.2);
  }
  
  return { direction, confidence, mtfAdjustment };
}
