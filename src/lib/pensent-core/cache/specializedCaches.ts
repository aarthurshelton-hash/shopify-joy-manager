/**
 * En Pensent Core SDK - Specialized Cache Implementations
 */

import { TemporalSignature, PatternMatch, TrajectoryPrediction } from '../types';
import { hashString } from '../signatureExtractor';
import { PensentCache } from './PensentCache';
import { CacheConfig } from './types';

/**
 * Cache for TemporalSignature extraction results
 */
export class SignatureCache extends PensentCache<TemporalSignature> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 500,
      defaultTtl: 10 * 60 * 1000, // 10 minutes
      ...config
    });
  }

  /**
   * Generate cache key from input
   */
  static generateKey(input: string): string {
    return `sig_${hashString(input)}`;
  }
}

/**
 * Cache for pattern matching results
 */
export class MatchCache extends PensentCache<PatternMatch[]> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 200,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      ...config
    });
  }

  static generateKey(fingerprint: string, options?: Record<string, unknown>): string {
    const optionsHash = options ? hashString(JSON.stringify(options)) : '';
    return `match_${fingerprint}_${optionsHash}`;
  }
}

/**
 * Cache for trajectory predictions
 */
export class PredictionCache extends PensentCache<TrajectoryPrediction> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 300,
      defaultTtl: 3 * 60 * 1000, // 3 minutes (predictions may change)
      ...config
    });
  }

  static generateKey(fingerprint: string, position: number): string {
    return `pred_${fingerprint}_${position}`;
  }
}
