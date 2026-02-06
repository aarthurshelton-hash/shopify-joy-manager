import fs from 'fs';
import path from 'path';

/**
 * Statistical significance calculations for A/B testing
 */

export function calculatePValue(baselineWins, enhancedWins, total) {
  const p1 = baselineWins / total;
  const p2 = enhancedWins / total;
  const p = (baselineWins + enhancedWins) / (2 * total);
  const se = Math.sqrt(2 * p * (1 - p) / total);
  const z = Math.abs(p2 - p1) / se;
  
  // Approximate two-tailed p-value
  const pValue = 2 * (1 - normalCDF(z));
  return { z, pValue, significant: pValue < 0.05 };
}

function normalCDF(x) {
  // Approximation of standard normal CDF
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export function calculateConfidenceInterval(successes, total, confidence = 0.95) {
  const p = successes / total;
  const z = confidence === 0.95 ? 1.96 : 2.576;
  const se = Math.sqrt(p * (1 - p) / total);
  const margin = z * se;
  
  return {
    point: p,
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
    margin,
  };
}

export function calculateCohensD(baselineAcc, enhancedAcc, baselineVar, enhancedVar) {
  const pooledSD = Math.sqrt((baselineVar + enhancedVar) / 2);
  return (enhancedAcc - baselineAcc) / pooledSD;
}
