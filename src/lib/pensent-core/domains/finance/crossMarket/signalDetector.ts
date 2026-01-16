/**
 * Cross-Market Signal Detection Module
 */

import { MarketTick, CrossMarketSignal, AssetClass } from './types';

export function calculateTrend(history: MarketTick[]): number {
  if (history.length < 2) return 0;
  const changes = history.map(t => t.changePercent);
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  return Math.max(-1, Math.min(1, avg * 10));
}

export function calculateVolatility(history: MarketTick[]): number {
  if (history.length < 2) return 0;
  const changes = history.map(t => Math.abs(t.changePercent));
  return changes.reduce((a, b) => a + b, 0) / changes.length;
}

export function detectSignals(
  tickHistory: Map<AssetClass, MarketTick[]>,
  existingSignals: CrossMarketSignal[]
): CrossMarketSignal[] {
  const signals: CrossMarketSignal[] = [];

  const equityHistory = tickHistory.get('equity') || [];
  const bondHistory = tickHistory.get('bond') || [];
  const futureHistory = tickHistory.get('future') || [];
  const commodityHistory = tickHistory.get('commodity') || [];

  // Check for equity-bond divergences
  if (equityHistory.length > 5 && bondHistory.length > 5) {
    const equityTrend = calculateTrend(equityHistory.slice(-10));
    const bondTrend = calculateTrend(bondHistory.slice(-10));

    if (equityTrend > 0.3 && bondTrend > 0.3) {
      signals.push({
        type: 'divergence',
        strength: Math.min(equityTrend, bondTrend),
        sourceMarkets: ['equity', 'bond'],
        description: 'Unusual equity-bond convergence - potential regime change',
        predictiveValue: 0.7,
        timestamp: Date.now()
      });
    }

    if (equityTrend < -0.3 && bondTrend > 0.3) {
      signals.push({
        type: 'convergence',
        strength: Math.abs(equityTrend - bondTrend) / 2,
        sourceMarkets: ['equity', 'bond'],
        description: 'Flight to safety - risk-off rotation',
        predictiveValue: 0.8,
        timestamp: Date.now()
      });
    }
  }

  // Check futures leading
  if (futureHistory.length > 5 && equityHistory.length > 5) {
    const futureTrend = calculateTrend(futureHistory.slice(-5));
    const equityTrend = calculateTrend(equityHistory.slice(-5));

    if (Math.abs(futureTrend) > 0.2 && Math.sign(futureTrend) !== Math.sign(equityTrend)) {
      signals.push({
        type: 'leading',
        strength: Math.abs(futureTrend),
        sourceMarkets: ['future', 'equity'],
        description: `Futures signaling ${futureTrend > 0 ? 'bullish' : 'bearish'} move`,
        predictiveValue: 0.75,
        timestamp: Date.now()
      });
    }
  }

  // Commodity breakout detection
  if (commodityHistory.length > 20) {
    const recentVol = calculateVolatility(commodityHistory.slice(-10));
    const baseVol = calculateVolatility(commodityHistory.slice(-20, -10));

    if (recentVol > baseVol * 1.5) {
      signals.push({
        type: 'breakout',
        strength: Math.min((recentVol / baseVol - 1), 1),
        sourceMarkets: ['commodity'],
        description: 'Commodity volatility spike - inflation signal',
        predictiveValue: 0.65,
        timestamp: Date.now()
      });
    }
  }

  // Keep only recent signals
  return [...signals, ...existingSignals]
    .filter(s => Date.now() - s.timestamp < 60000)
    .slice(0, 10);
}
