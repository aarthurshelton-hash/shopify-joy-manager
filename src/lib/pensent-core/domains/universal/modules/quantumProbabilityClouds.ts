/**
 * Quantum Probability Clouds
 * 
 * Instead of single-point predictions, generates probability distributions
 * representing superposition of possible outcomes until "measurement" (actual result).
 * Prevents overconfidence and captures uncertainty properly.
 */

interface ProbabilityPoint {
  value: number;
  probability: number;
}

interface ProbabilityCloud {
  distribution: ProbabilityPoint[];
  mean: number;
  standardDeviation: number;
  skewness: number; // Asymmetry
  kurtosis: number; // Fat tails
  confidenceIntervals: {
    ci50: [number, number];
    ci75: [number, number];
    ci95: [number, number];
  };
  dominantOutcome: 'up' | 'down' | 'neutral';
  outcomeDistribution: {
    up: number;
    down: number;
    neutral: number;
  };
  entropy: number; // Uncertainty measure
}

interface CloudCollapse {
  predictedCloud: ProbabilityCloud;
  actualOutcome: number;
  wasWithinCI50: boolean;
  wasWithinCI75: boolean;
  wasWithinCI95: boolean;
  collapsedAt: number;
}

class QuantumProbabilityCloudGenerator {
  private collapseHistory: CloudCollapse[] = [];
  private readonly maxHistory = 500;
  private readonly uncertaintyFloor = 0.1; // Minimum uncertainty to prevent overconfidence
  
  /**
   * Generate a probability cloud from multiple prediction sources
   */
  generateCloud(
    predictions: Array<{ value: number; confidence: number; source: string }>,
    baseVolatility: number = 0.1
  ): ProbabilityCloud {
    if (predictions.length === 0) {
      return this.generateUniformCloud();
    }
    
    // Weight predictions by confidence
    const totalWeight = predictions.reduce((sum, p) => sum + p.confidence, 0);
    const weightedMean = predictions.reduce(
      (sum, p) => sum + p.value * p.confidence, 0
    ) / totalWeight;
    
    // Calculate weighted variance
    const weightedVariance = predictions.reduce(
      (sum, p) => sum + p.confidence * Math.pow(p.value - weightedMean, 2), 0
    ) / totalWeight;
    
    // Add base volatility to prevent overconfidence
    const adjustedVariance = weightedVariance + Math.pow(baseVolatility, 2) + Math.pow(this.uncertaintyFloor, 2);
    const standardDeviation = Math.sqrt(adjustedVariance);
    
    // Generate distribution points
    const distribution = this.generateGaussianMixture(predictions, standardDeviation);
    
    // Calculate moments
    const skewness = this.calculateSkewness(distribution);
    const kurtosis = this.calculateKurtosis(distribution);
    
    // Calculate confidence intervals
    const sortedPoints = [...distribution].sort((a, b) => a.value - b.value);
    const ci50 = this.calculateConfidenceInterval(sortedPoints, 0.50);
    const ci75 = this.calculateConfidenceInterval(sortedPoints, 0.75);
    const ci95 = this.calculateConfidenceInterval(sortedPoints, 0.95);
    
    // Calculate outcome distribution
    const outcomeDistribution = this.calculateOutcomeDistribution(distribution);
    
    // Determine dominant outcome
    const dominantOutcome = outcomeDistribution.up > outcomeDistribution.down 
      ? (outcomeDistribution.up > outcomeDistribution.neutral ? 'up' : 'neutral')
      : (outcomeDistribution.down > outcomeDistribution.neutral ? 'down' : 'neutral');
    
    // Calculate entropy (uncertainty)
    const entropy = this.calculateEntropy(outcomeDistribution);
    
    return {
      distribution,
      mean: weightedMean,
      standardDeviation,
      skewness,
      kurtosis,
      confidenceIntervals: { ci50, ci75, ci95 },
      dominantOutcome,
      outcomeDistribution,
      entropy,
    };
  }
  
  /**
   * Generate a uniform (maximum uncertainty) cloud
   */
  private generateUniformCloud(): ProbabilityCloud {
    const distribution: ProbabilityPoint[] = [];
    for (let i = -1; i <= 1; i += 0.1) {
      distribution.push({ value: i, probability: 1 / 21 });
    }
    
    return {
      distribution,
      mean: 0,
      standardDeviation: 0.5,
      skewness: 0,
      kurtosis: 0,
      confidenceIntervals: {
        ci50: [-0.25, 0.25],
        ci75: [-0.5, 0.5],
        ci95: [-0.9, 0.9],
      },
      dominantOutcome: 'neutral',
      outcomeDistribution: { up: 0.33, down: 0.33, neutral: 0.34 },
      entropy: 1.0,
    };
  }
  
  /**
   * Generate a Gaussian mixture from multiple predictions
   */
  private generateGaussianMixture(
    predictions: Array<{ value: number; confidence: number }>,
    globalSd: number
  ): ProbabilityPoint[] {
    const points: Map<number, number> = new Map();
    const step = 0.02;
    
    for (let x = -1; x <= 1; x += step) {
      let totalProbability = 0;
      let totalWeight = 0;
      
      for (const pred of predictions) {
        const localSd = globalSd / Math.sqrt(pred.confidence + 0.1);
        const probability = this.gaussianPDF(x, pred.value, localSd);
        totalProbability += probability * pred.confidence;
        totalWeight += pred.confidence;
      }
      
      points.set(Math.round(x * 100) / 100, totalWeight > 0 ? totalProbability / totalWeight : 0);
    }
    
    // Normalize
    const sum = Array.from(points.values()).reduce((a, b) => a + b, 0);
    const distribution: ProbabilityPoint[] = [];
    
    for (const [value, prob] of points) {
      distribution.push({ value, probability: sum > 0 ? prob / sum : 0 });
    }
    
    return distribution;
  }
  
  /**
   * Gaussian probability density function
   */
  private gaussianPDF(x: number, mean: number, sd: number): number {
    const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
    return coefficient * Math.exp(exponent);
  }
  
  /**
   * Calculate skewness (asymmetry)
   */
  private calculateSkewness(distribution: ProbabilityPoint[]): number {
    const mean = distribution.reduce((sum, p) => sum + p.value * p.probability, 0);
    const variance = distribution.reduce((sum, p) => sum + Math.pow(p.value - mean, 2) * p.probability, 0);
    const sd = Math.sqrt(variance);
    
    if (sd === 0) return 0;
    
    const m3 = distribution.reduce((sum, p) => sum + Math.pow((p.value - mean) / sd, 3) * p.probability, 0);
    return m3;
  }
  
  /**
   * Calculate kurtosis (fat tails)
   */
  private calculateKurtosis(distribution: ProbabilityPoint[]): number {
    const mean = distribution.reduce((sum, p) => sum + p.value * p.probability, 0);
    const variance = distribution.reduce((sum, p) => sum + Math.pow(p.value - mean, 2) * p.probability, 0);
    const sd = Math.sqrt(variance);
    
    if (sd === 0) return 0;
    
    const m4 = distribution.reduce((sum, p) => sum + Math.pow((p.value - mean) / sd, 4) * p.probability, 0);
    return m4 - 3; // Excess kurtosis (0 for normal distribution)
  }
  
  /**
   * Calculate confidence interval from sorted distribution
   */
  private calculateConfidenceInterval(
    sortedPoints: ProbabilityPoint[],
    confidenceLevel: number
  ): [number, number] {
    const tail = (1 - confidenceLevel) / 2;
    
    let cumulative = 0;
    let lowerBound = sortedPoints[0].value;
    let upperBound = sortedPoints[sortedPoints.length - 1].value;
    
    for (const point of sortedPoints) {
      cumulative += point.probability;
      if (cumulative >= tail && lowerBound === sortedPoints[0].value) {
        lowerBound = point.value;
      }
      if (cumulative >= 1 - tail) {
        upperBound = point.value;
        break;
      }
    }
    
    return [lowerBound, upperBound];
  }
  
  /**
   * Calculate outcome distribution (up/down/neutral)
   */
  private calculateOutcomeDistribution(distribution: ProbabilityPoint[]): { up: number; down: number; neutral: number } {
    const neutralThreshold = 0.02; // ±2% is considered neutral
    
    let up = 0, down = 0, neutral = 0;
    
    for (const point of distribution) {
      if (point.value > neutralThreshold) {
        up += point.probability;
      } else if (point.value < -neutralThreshold) {
        down += point.probability;
      } else {
        neutral += point.probability;
      }
    }
    
    return { up, down, neutral };
  }
  
  /**
   * Calculate entropy (uncertainty measure)
   */
  private calculateEntropy(outcomeDistribution: { up: number; down: number; neutral: number }): number {
    const values = [outcomeDistribution.up, outcomeDistribution.down, outcomeDistribution.neutral];
    let entropy = 0;
    
    for (const p of values) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    // Normalize to 0-1 (max entropy for 3 outcomes is log2(3) ≈ 1.58)
    return entropy / Math.log2(3);
  }
  
  /**
   * Record a "wave function collapse" when actual outcome is known
   */
  recordCollapse(cloud: ProbabilityCloud, actualOutcome: number): void {
    const collapse: CloudCollapse = {
      predictedCloud: cloud,
      actualOutcome,
      wasWithinCI50: actualOutcome >= cloud.confidenceIntervals.ci50[0] && 
                     actualOutcome <= cloud.confidenceIntervals.ci50[1],
      wasWithinCI75: actualOutcome >= cloud.confidenceIntervals.ci75[0] && 
                     actualOutcome <= cloud.confidenceIntervals.ci75[1],
      wasWithinCI95: actualOutcome >= cloud.confidenceIntervals.ci95[0] && 
                     actualOutcome <= cloud.confidenceIntervals.ci95[1],
      collapsedAt: Date.now(),
    };
    
    this.collapseHistory.push(collapse);
    
    if (this.collapseHistory.length > this.maxHistory) {
      this.collapseHistory.shift();
    }
  }
  
  /**
   * Get calibration statistics
   */
  getCalibrationStats(): {
    ci50Coverage: number;
    ci75Coverage: number;
    ci95Coverage: number;
    isWellCalibrated: boolean;
  } {
    if (this.collapseHistory.length < 10) {
      return { ci50Coverage: 0.5, ci75Coverage: 0.75, ci95Coverage: 0.95, isWellCalibrated: true };
    }
    
    const ci50Coverage = this.collapseHistory.filter(c => c.wasWithinCI50).length / this.collapseHistory.length;
    const ci75Coverage = this.collapseHistory.filter(c => c.wasWithinCI75).length / this.collapseHistory.length;
    const ci95Coverage = this.collapseHistory.filter(c => c.wasWithinCI95).length / this.collapseHistory.length;
    
    // Well-calibrated if actual coverage is close to expected
    const isWellCalibrated = 
      Math.abs(ci50Coverage - 0.50) < 0.15 &&
      Math.abs(ci75Coverage - 0.75) < 0.10 &&
      Math.abs(ci95Coverage - 0.95) < 0.05;
    
    return { ci50Coverage, ci75Coverage, ci95Coverage, isWellCalibrated };
  }
  
  /**
   * Get confidence modifier based on cloud characteristics
   */
  getConfidenceModifier(cloud: ProbabilityCloud): number {
    // Lower entropy = more confident
    const entropyModifier = 1 - (cloud.entropy * 0.3);
    
    // Higher kurtosis (fat tails) = more uncertainty
    const kurtosisModifier = 1 - Math.min(0.2, Math.abs(cloud.kurtosis) * 0.05);
    
    // Check calibration
    const calibration = this.getCalibrationStats();
    const calibrationModifier = calibration.isWellCalibrated ? 1.05 : 0.95;
    
    return entropyModifier * kurtosisModifier * calibrationModifier;
  }
}

export const quantumProbabilityCloudGenerator = new QuantumProbabilityCloudGenerator();
export type { ProbabilityCloud, ProbabilityPoint, CloudCollapse };
