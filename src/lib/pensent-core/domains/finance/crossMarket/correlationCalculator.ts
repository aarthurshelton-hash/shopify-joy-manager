/**
 * Correlation Calculator Module
 */

import { MarketTick, MarketCorrelation, AssetClass, KNOWN_CORRELATIONS } from './types';

export function calculateCorrelation(history1: MarketTick[], history2: MarketTick[]): number {
  const len = Math.min(history1.length, history2.length, 50);
  if (len < 5) return 0;

  const changes1 = history1.slice(-len).map(t => t.changePercent);
  const changes2 = history2.slice(-len).map(t => t.changePercent);

  const mean1 = changes1.reduce((a, b) => a + b, 0) / len;
  const mean2 = changes2.reduce((a, b) => a + b, 0) / len;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < len; i++) {
    const d1 = changes1[i] - mean1;
    const d2 = changes2[i] - mean2;
    numerator += d1 * d2;
    denom1 += d1 * d1;
    denom2 += d2 * d2;
  }

  const denom = Math.sqrt(denom1 * denom2);
  return denom === 0 ? 0 : numerator / denom;
}

export function calculateLaggedCorrelation(h1: MarketTick[], h2: MarketTick[], lag: number): number {
  const len = Math.min(h1.length, h2.length) - Math.abs(lag) - 1;
  if (len < 5) return 0;

  const c1 = lag >= 0 
    ? h1.slice(lag, lag + len).map(t => t.changePercent)
    : h1.slice(0, len).map(t => t.changePercent);
  const c2 = lag >= 0
    ? h2.slice(0, len).map(t => t.changePercent)
    : h2.slice(-lag, -lag + len).map(t => t.changePercent);

  if (c1.length !== c2.length || c1.length === 0) return 0;

  const mean1 = c1.reduce((a, b) => a + b, 0) / c1.length;
  const mean2 = c2.reduce((a, b) => a + b, 0) / c2.length;

  let num = 0, d1 = 0, d2 = 0;
  for (let i = 0; i < c1.length; i++) {
    const diff1 = c1[i] - mean1;
    const diff2 = c2[i] - mean2;
    num += diff1 * diff2;
    d1 += diff1 * diff1;
    d2 += diff2 * diff2;
  }

  const denom = Math.sqrt(d1 * d2);
  return denom === 0 ? 0 : num / denom;
}

export function detectLag(history1: MarketTick[], history2: MarketTick[]): number {
  const len = Math.min(history1.length, history2.length, 20);
  if (len < 10) return 0;

  let maxCorr = 0;
  let bestLag = 0;

  for (let lag = -5; lag <= 5; lag++) {
    const corr = calculateLaggedCorrelation(history1, history2, lag);
    if (Math.abs(corr) > Math.abs(maxCorr)) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  return bestLag;
}

export function updateCorrelations(tickHistory: Map<AssetClass, MarketTick[]>): MarketCorrelation[] {
  const correlations: MarketCorrelation[] = [];

  KNOWN_CORRELATIONS.forEach(({ markets, typicalCorrelation }) => {
    const [m1, m2] = markets;
    const history1 = tickHistory.get(m1) || [];
    const history2 = tickHistory.get(m2) || [];

    if (history1.length > 10 && history2.length > 10) {
      const actualCorrelation = calculateCorrelation(history1, history2);
      const deviation = Math.abs(actualCorrelation - typicalCorrelation);
      
      correlations.push({
        market1: m1,
        market2: m2,
        correlation: actualCorrelation,
        lag: detectLag(history1, history2),
        strength: 1 - Math.min(deviation, 1),
        isInverted: actualCorrelation < 0
      });
    }
  });

  return correlations;
}
