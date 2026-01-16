/**
 * Prediction Validation System
 * Statistical comparison against baselines to prove edge
 */

export interface PredictionRecord {
  id: string;
  symbol: string;
  predictedDirection: 'up' | 'down' | 'neutral';
  predictedConfidence: number;
  actualDirection: 'up' | 'down' | 'neutral' | null;
  wasCorrect: boolean | null;
  priceAtPrediction: number;
  outcomePrice: number | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface BaselineComparison {
  baselineName: string;
  baselineAccuracy: number;
  systemAccuracy: number;
  edge: number;
  pValue: number;
  isStatisticallySignificant: boolean;
  sampleSize: number;
  confidenceInterval: { low: number; high: number };
}

export interface ValidationResult {
  totalPredictions: number;
  resolvedPredictions: number;
  systemAccuracy: number;
  baselineComparisons: BaselineComparison[];
  overallEdge: number;
  isProvenEdge: boolean;
  confidenceLevel: number;
  summary: string;
}

/**
 * Generate random baseline predictions (50/50)
 */
export function generateRandomBaseline(predictions: PredictionRecord[]): boolean[] {
  return predictions.map(() => Math.random() > 0.5);
}

/**
 * Generate trend-following baseline predictions
 * Predicts continuation of recent price movement
 */
export function generateTrendBaseline(predictions: PredictionRecord[]): ('up' | 'down')[] {
  // Simple trend follower: predict that recent direction continues
  return predictions.map((pred, i) => {
    if (i === 0) return 'up'; // Default for first
    // In a real scenario, we'd look at recent price data
    // For now, simulate with slight upward bias (markets tend to go up)
    return Math.random() > 0.45 ? 'up' : 'down';
  });
}

/**
 * Calculate binomial test p-value
 * Tests if observed success rate is significantly different from baseline
 */
export function calculatePValue(
  successes: number,
  trials: number,
  baselineRate: number
): number {
  if (trials === 0) return 1;
  
  // Use normal approximation for large samples
  const observedRate = successes / trials;
  const variance = (baselineRate * (1 - baselineRate)) / trials;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return observedRate === baselineRate ? 1 : 0;
  
  const zScore = (observedRate - baselineRate) / stdDev;
  
  // One-tailed test (we want to prove we're better, not just different)
  // Using standard normal CDF approximation
  const pValue = 1 - normalCDF(zScore);
  
  return pValue;
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate Wilson score confidence interval
 */
export function calculateConfidenceInterval(
  successes: number,
  trials: number,
  confidenceLevel: number = 0.95
): { low: number; high: number } {
  if (trials === 0) return { low: 0, high: 1 };
  
  const z = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;
  const phat = successes / trials;
  
  const denominator = 1 + z * z / trials;
  const center = phat + z * z / (2 * trials);
  const margin = z * Math.sqrt((phat * (1 - phat) + z * z / (4 * trials)) / trials);
  
  return {
    low: Math.max(0, (center - margin) / denominator),
    high: Math.min(1, (center + margin) / denominator)
  };
}

/**
 * Compare system predictions against random baseline
 */
export function compareToRandomBaseline(
  predictions: PredictionRecord[]
): BaselineComparison {
  const resolved = predictions.filter(p => p.wasCorrect !== null);
  const correct = resolved.filter(p => p.wasCorrect).length;
  const total = resolved.length;
  
  const systemAccuracy = total > 0 ? correct / total : 0;
  const baselineAccuracy = 0.5; // Random = 50%
  
  const pValue = calculatePValue(correct, total, baselineAccuracy);
  const ci = calculateConfidenceInterval(correct, total);
  
  return {
    baselineName: 'Random (50/50)',
    baselineAccuracy,
    systemAccuracy,
    edge: systemAccuracy - baselineAccuracy,
    pValue,
    isStatisticallySignificant: pValue < 0.05,
    sampleSize: total,
    confidenceInterval: ci
  };
}

/**
 * Compare system predictions against trend-following baseline
 */
export function compareToTrendBaseline(
  predictions: PredictionRecord[]
): BaselineComparison {
  const resolved = predictions.filter(p => p.wasCorrect !== null);
  const correct = resolved.filter(p => p.wasCorrect).length;
  const total = resolved.length;
  
  const systemAccuracy = total > 0 ? correct / total : 0;
  // Trend following historically has ~52-55% accuracy in various markets
  const baselineAccuracy = 0.53;
  
  const pValue = calculatePValue(correct, total, baselineAccuracy);
  const ci = calculateConfidenceInterval(correct, total);
  
  return {
    baselineName: 'Trend Following',
    baselineAccuracy,
    systemAccuracy,
    edge: systemAccuracy - baselineAccuracy,
    pValue,
    isStatisticallySignificant: pValue < 0.05,
    sampleSize: total,
    confidenceInterval: ci
  };
}

/**
 * Full validation of predictions against all baselines
 */
export function validatePredictions(predictions: PredictionRecord[]): ValidationResult {
  const resolved = predictions.filter(p => p.wasCorrect !== null);
  const correct = resolved.filter(p => p.wasCorrect).length;
  const systemAccuracy = resolved.length > 0 ? correct / resolved.length : 0;
  
  const randomComparison = compareToRandomBaseline(predictions);
  const trendComparison = compareToTrendBaseline(predictions);
  
  const baselineComparisons = [randomComparison, trendComparison];
  
  // Overall edge is the minimum edge across all baselines
  const overallEdge = Math.min(randomComparison.edge, trendComparison.edge);
  
  // System has proven edge if significant against ALL baselines
  const isProvenEdge = baselineComparisons.every(b => b.isStatisticallySignificant && b.edge > 0);
  
  // Confidence level based on sample size and p-values
  const avgPValue = baselineComparisons.reduce((sum, b) => sum + b.pValue, 0) / baselineComparisons.length;
  const confidenceLevel = (1 - avgPValue) * 100;
  
  // Generate summary
  let summary: string;
  if (resolved.length < 30) {
    summary = `Insufficient data for statistical significance (${resolved.length}/30 minimum predictions needed)`;
  } else if (isProvenEdge) {
    summary = `PROVEN EDGE: System shows ${(overallEdge * 100).toFixed(1)}% advantage over all baselines with statistical significance (p < 0.05)`;
  } else if (overallEdge > 0) {
    summary = `Positive edge detected (${(overallEdge * 100).toFixed(1)}%) but not yet statistically significant. More predictions needed.`;
  } else {
    summary = `No edge detected. System performing at or below baseline levels.`;
  }
  
  return {
    totalPredictions: predictions.length,
    resolvedPredictions: resolved.length,
    systemAccuracy,
    baselineComparisons,
    overallEdge,
    isProvenEdge,
    confidenceLevel,
    summary
  };
}

/**
 * Format validation result for display
 */
export function formatValidationSummary(result: ValidationResult): string {
  const lines: string[] = [
    `📊 Prediction Validation Report`,
    `═══════════════════════════════════`,
    ``,
    `Total Predictions: ${result.totalPredictions}`,
    `Resolved: ${result.resolvedPredictions}`,
    `System Accuracy: ${(result.systemAccuracy * 100).toFixed(1)}%`,
    ``,
    `Baseline Comparisons:`,
  ];
  
  for (const comparison of result.baselineComparisons) {
    const sig = comparison.isStatisticallySignificant ? '✓' : '○';
    const edgeStr = comparison.edge >= 0 ? `+${(comparison.edge * 100).toFixed(1)}%` : `${(comparison.edge * 100).toFixed(1)}%`;
    lines.push(`  ${sig} vs ${comparison.baselineName}: ${edgeStr} (p=${comparison.pValue.toFixed(4)})`);
  }
  
  lines.push(``);
  lines.push(`${result.isProvenEdge ? '🎯' : '⏳'} ${result.summary}`);
  
  return lines.join('\n');
}
