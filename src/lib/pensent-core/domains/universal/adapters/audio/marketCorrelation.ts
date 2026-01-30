/**
 * Market Correlation Generator
 * 
 * Generate audio signals correlated with market conditions
 */

import type { AudioData } from './types';

/**
 * Generate audio signal correlated with market mood
 */
export function generateMarketCorrelatedSignal(
  marketMomentum: number, 
  marketVolatility: number
): AudioData {
  // Market momentum affects musical mode and tempo
  const mode: 'major' | 'minor' | 'neutral' = 
    marketMomentum > 0.2 ? 'major' : 
    marketMomentum < -0.2 ? 'minor' : 'neutral';
  
  // Volatility affects tempo (higher volatility = faster tempo)
  const tempo = 80 + (marketVolatility * 80);
  
  // Momentum affects fundamental frequency (bullish = higher pitch)
  const fundamentalHz = 220 + (marketMomentum * 220);
  
  // Volatility affects amplitude (uncertainty = louder)
  const amplitude = 0.4 + (marketVolatility * 0.5);
  
  // Spectral centroid rises with excitement
  const spectralCentroid = 2000 + (marketVolatility * 2000) + (Math.abs(marketMomentum) * 500);
  
  // Key selection based on momentum direction
  // C major (0) for positive, A minor (9) for negative
  const key = marketMomentum >= 0 ? 0 : 9;
  
  return {
    fundamentalHz: Math.max(55, Math.min(880, fundamentalHz)),
    amplitude: Math.max(0, Math.min(1, amplitude)),
    spectralCentroid: Math.max(500, Math.min(8000, spectralCentroid)),
    tempo: Math.max(40, Math.min(200, tempo)),
    key,
    mode,
    timestamp: Date.now(),
  };
}
