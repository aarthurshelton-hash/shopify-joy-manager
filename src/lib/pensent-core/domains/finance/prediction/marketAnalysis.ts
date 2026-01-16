/**
 * Market Analysis - Technical analysis utilities for tick data
 */

import { Tick } from './types';

export function calculateMomentum(ticks: Tick[], window: number): number {
  const effectiveWindow = Math.min(window, ticks.length);
  if (effectiveWindow < 2) return 0;
  
  const recentTicks = ticks.slice(-effectiveWindow);
  const startPrice = recentTicks[0].price;
  const endPrice = recentTicks[recentTicks.length - 1].price;
  
  const change = (endPrice - startPrice) / startPrice;
  return Math.max(-1, Math.min(1, change * 100));
}

export function calculateVolatility(ticks: Tick[], window: number): number {
  const effectiveWindow = Math.min(window, ticks.length);
  if (effectiveWindow < 2) return 0;
  
  const recentTicks = ticks.slice(-effectiveWindow);
  const returns: number[] = [];
  
  for (let i = 1; i < recentTicks.length; i++) {
    const ret = (recentTicks[i].price - recentTicks[i-1].price) / recentTicks[i-1].price;
    returns.push(ret);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

export function detectMicroTrend(ticks: Tick[]): number {
  if (ticks.length < 5) return 0;
  
  const last5 = ticks.slice(-5);
  let upMoves = 0;
  let downMoves = 0;
  
  for (let i = 1; i < last5.length; i++) {
    if (last5[i].price > last5[i-1].price) upMoves++;
    else if (last5[i].price < last5[i-1].price) downMoves++;
  }
  
  return (upMoves - downMoves) / 4;
}

export function analyzeVolumePattern(ticks: Tick[]): number {
  if (ticks.length < 10) return 0;
  
  const last10 = ticks.slice(-10);
  const avgVolume = last10.reduce((a, t) => a + t.volume, 0) / 10;
  const lastVolume = last10[last10.length - 1].volume;
  const lastPriceChange = last10[last10.length - 1].price - last10[last10.length - 2].price;
  
  if (lastVolume > avgVolume * 1.5) {
    return lastPriceChange > 0 ? 0.5 : -0.5;
  }
  
  return 0;
}

export function getVolatilityState(volatility: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (volatility < 0.0005) return 'low';
  if (volatility < 0.002) return 'medium';
  if (volatility < 0.005) return 'high';
  return 'extreme';
}
