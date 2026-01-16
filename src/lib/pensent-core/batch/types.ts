/**
 * En Pensent Core SDK - Batch Processing Types
 */

import { TemporalSignature } from '../types';

export interface BatchInput<T> {
  id: string;
  data: T;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface BatchResult<T> {
  id: string;
  success: boolean;
  result?: T;
  error?: Error;
  processingTimeMs: number;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  estimatedRemainingMs: number;
  currentItem?: string;
}

export interface BatchConfig {
  /** Maximum concurrent operations */
  concurrency: number;
  /** Continue processing even if some items fail */
  continueOnError: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: BatchProgress) => void;
  /** Delay between items (for rate limiting) */
  itemDelayMs?: number;
  /** Maximum time for entire batch */
  batchTimeoutMs?: number;
}

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  concurrency: 5,
  continueOnError: true,
  itemDelayMs: 0
};

export interface BatchAggregation {
  totalItems: number;
  successCount: number;
  failureCount: number;
  totalProcessingTimeMs: number;
  averageProcessingTimeMs: number;
  archetypeDistribution: Record<string, number>;
  outcomeDistribution: Record<string, number>;
  averageIntensity: number;
  averageConfidence: number;
}
