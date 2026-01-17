/**
 * Prediction Calibration Curve Module
 * Tracks predicted confidence vs actual accuracy
 * "When we say 70% confident, are we right 70% of the time?"
 */

export interface CalibrationBucket {
  rangeStart: number;  // e.g., 0.60
  rangeEnd: number;    // e.g., 0.70
  predictions: number; // Count of predictions in this range
  correct: number;     // Count of correct predictions
  expectedAccuracy: number; // Mid-point of range (what we claimed)
  actualAccuracy: number;   // correct / predictions
  calibrationError: number; // |expected - actual|
}

export interface CalibrationRecord {
  id: string;
  timestamp: number;
  predictedConfidence: number;
  predictedDirection: 'up' | 'down' | 'neutral';
  actualDirection?: 'up' | 'down' | 'neutral';
  wasCorrect?: boolean;
  resolvedAt?: number;
  symbol?: string;
  timeHorizon?: number;
}

export interface CalibrationMetrics {
  totalPredictions: number;
  resolvedPredictions: number;
  overallAccuracy: number;
  expectedCalibrationError: number; // Average |expected - actual| across buckets
  brierScore: number;               // Mean squared probability error
  reliability: number;              // How well calibrated (0 = perfectly calibrated)
  resolution: number;               // How much predictions vary from base rate
  calibrationCurve: CalibrationBucket[];
  overconfidenceBias: number;       // Positive = overconfident, Negative = underconfident
}

// Calibration Curve Tracker Class
export class CalibrationCurveTracker {
  private records: CalibrationRecord[] = [];
  private bucketWidth: number = 0.10; // 10% buckets

  constructor(bucketWidth: number = 0.10) {
    this.bucketWidth = bucketWidth;
  }

  // Record a new prediction
  recordPrediction(
    predictedConfidence: number,
    predictedDirection: 'up' | 'down' | 'neutral',
    symbol?: string,
    timeHorizon?: number
  ): string {
    const id = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.records.push({
      id,
      timestamp: Date.now(),
      predictedConfidence: Math.max(0, Math.min(1, predictedConfidence)),
      predictedDirection,
      symbol,
      timeHorizon
    });

    this.pruneOldRecords();
    return id;
  }

  // Resolve a prediction with actual outcome
  resolvePrediction(
    id: string,
    actualDirection: 'up' | 'down' | 'neutral'
  ): boolean {
    const record = this.records.find(r => r.id === id);
    if (!record) return false;

    record.actualDirection = actualDirection;
    record.wasCorrect = record.predictedDirection === actualDirection;
    record.resolvedAt = Date.now();
    
    return true;
  }

  // Get calibration metrics
  getCalibrationMetrics(): CalibrationMetrics {
    const resolved = this.records.filter(r => r.wasCorrect !== undefined);
    
    if (resolved.length === 0) {
      return this.getEmptyMetrics();
    }

    // Build calibration buckets
    const buckets = this.buildCalibrationBuckets(resolved);
    
    // Calculate overall accuracy
    const correct = resolved.filter(r => r.wasCorrect).length;
    const overallAccuracy = correct / resolved.length;
    
    // Calculate Expected Calibration Error (ECE)
    const expectedCalibrationError = this.calculateECE(buckets, resolved.length);
    
    // Calculate Brier Score
    const brierScore = this.calculateBrierScore(resolved);
    
    // Calculate reliability and resolution
    const { reliability, resolution } = this.calculateReliabilityResolution(buckets, overallAccuracy, resolved.length);
    
    // Calculate overconfidence bias
    const overconfidenceBias = this.calculateOverconfidenceBias(buckets);

    return {
      totalPredictions: this.records.length,
      resolvedPredictions: resolved.length,
      overallAccuracy,
      expectedCalibrationError,
      brierScore,
      reliability,
      resolution,
      calibrationCurve: buckets,
      overconfidenceBias
    };
  }

  // Build calibration buckets
  private buildCalibrationBuckets(resolved: CalibrationRecord[]): CalibrationBucket[] {
    const buckets: CalibrationBucket[] = [];
    
    for (let start = 0; start < 1; start += this.bucketWidth) {
      const end = start + this.bucketWidth;
      const inBucket = resolved.filter(r => 
        r.predictedConfidence >= start && r.predictedConfidence < end
      );
      
      const correctInBucket = inBucket.filter(r => r.wasCorrect).length;
      const expectedAccuracy = (start + end) / 2;
      const actualAccuracy = inBucket.length > 0 ? correctInBucket / inBucket.length : 0;
      
      buckets.push({
        rangeStart: start,
        rangeEnd: end,
        predictions: inBucket.length,
        correct: correctInBucket,
        expectedAccuracy,
        actualAccuracy,
        calibrationError: Math.abs(expectedAccuracy - actualAccuracy)
      });
    }
    
    return buckets;
  }

  // Calculate Expected Calibration Error
  private calculateECE(buckets: CalibrationBucket[], totalPredictions: number): number {
    let ece = 0;
    
    for (const bucket of buckets) {
      if (bucket.predictions > 0) {
        const weight = bucket.predictions / totalPredictions;
        ece += weight * bucket.calibrationError;
      }
    }
    
    return ece;
  }

  // Calculate Brier Score (lower is better)
  private calculateBrierScore(resolved: CalibrationRecord[]): number {
    let sum = 0;
    
    for (const record of resolved) {
      const outcome = record.wasCorrect ? 1 : 0;
      const confidence = record.predictedConfidence;
      sum += Math.pow(confidence - outcome, 2);
    }
    
    return sum / resolved.length;
  }

  // Calculate reliability and resolution components
  private calculateReliabilityResolution(
    buckets: CalibrationBucket[], 
    overallAccuracy: number,
    totalPredictions: number
  ): { reliability: number; resolution: number } {
    let reliability = 0;
    let resolution = 0;
    
    for (const bucket of buckets) {
      if (bucket.predictions > 0) {
        const weight = bucket.predictions / totalPredictions;
        
        // Reliability: how close actual is to predicted confidence
        reliability += weight * Math.pow(bucket.actualAccuracy - bucket.expectedAccuracy, 2);
        
        // Resolution: how much actual varies from base rate
        resolution += weight * Math.pow(bucket.actualAccuracy - overallAccuracy, 2);
      }
    }
    
    return { reliability, resolution };
  }

  // Calculate overconfidence bias
  private calculateOverconfidenceBias(buckets: CalibrationBucket[]): number {
    let totalBias = 0;
    let totalWeight = 0;
    
    for (const bucket of buckets) {
      if (bucket.predictions > 0) {
        // Positive bias = overconfident (expected > actual)
        const bias = bucket.expectedAccuracy - bucket.actualAccuracy;
        totalBias += bias * bucket.predictions;
        totalWeight += bucket.predictions;
      }
    }
    
    return totalWeight > 0 ? totalBias / totalWeight : 0;
  }

  // Get empty metrics for when no data available
  private getEmptyMetrics(): CalibrationMetrics {
    return {
      totalPredictions: this.records.length,
      resolvedPredictions: 0,
      overallAccuracy: 0,
      expectedCalibrationError: 0,
      brierScore: 0,
      reliability: 0,
      resolution: 0,
      calibrationCurve: [],
      overconfidenceBias: 0
    };
  }

  // Get calibration advice based on metrics
  getCalibrationAdvice(): {
    status: 'well_calibrated' | 'overconfident' | 'underconfident' | 'insufficient_data';
    advice: string;
    adjustmentFactor: number;
  } {
    const metrics = this.getCalibrationMetrics();
    
    if (metrics.resolvedPredictions < 30) {
      return {
        status: 'insufficient_data',
        advice: 'Need at least 30 resolved predictions for reliable calibration analysis',
        adjustmentFactor: 1.0
      };
    }
    
    if (Math.abs(metrics.overconfidenceBias) < 0.05) {
      return {
        status: 'well_calibrated',
        advice: 'Predictions are well-calibrated. Confidence levels match actual accuracy.',
        adjustmentFactor: 1.0
      };
    }
    
    if (metrics.overconfidenceBias > 0.05) {
      const adjustment = 1 - (metrics.overconfidenceBias * 0.5);
      return {
        status: 'overconfident',
        advice: `Predictions are overconfident by ${(metrics.overconfidenceBias * 100).toFixed(1)}%. Consider reducing confidence levels.`,
        adjustmentFactor: adjustment
      };
    }
    
    const adjustment = 1 + (Math.abs(metrics.overconfidenceBias) * 0.5);
    return {
      status: 'underconfident',
      advice: `Predictions are underconfident by ${(Math.abs(metrics.overconfidenceBias) * 100).toFixed(1)}%. Can increase confidence levels.`,
      adjustmentFactor: adjustment
    };
  }

  // Prune records older than 90 days
  private pruneOldRecords(): void {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    this.records = this.records.filter(r => r.timestamp > ninetyDaysAgo);
  }

  // Export records for persistence
  exportRecords(): CalibrationRecord[] {
    return [...this.records];
  }

  // Import records from persistence
  importRecords(records: CalibrationRecord[]): void {
    this.records = records;
  }

  // Get reliability score (0-1, higher is better calibrated)
  getReliabilityScore(): number {
    const metrics = this.getCalibrationMetrics();
    // Convert reliability (error metric) to score (higher = better)
    return Math.max(0, 1 - metrics.reliability * 5);
  }
}

// Singleton instance
export const calibrationTracker = new CalibrationCurveTracker(0.10);

export default calibrationTracker;
