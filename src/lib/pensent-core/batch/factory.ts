/**
 * En Pensent Core SDK - Batch Factory Functions
 */

import { TemporalSignature, DomainAdapter } from '../types';
import { BatchConfig, BatchResult } from './types';
import { BatchProcessor } from './BatchProcessor';
import { StreamProcessor } from './StreamProcessor';

/**
 * Create a new batch processor
 */
export function createBatchProcessor<TInput, TState>(
  adapter: DomainAdapter<TInput, TState>,
  config?: Partial<BatchConfig>
): BatchProcessor<TInput, TState> {
  return new BatchProcessor(adapter, config);
}

/**
 * Create a new stream processor
 */
export function createStreamProcessor<TInput, TState>(
  adapter: DomainAdapter<TInput, TState>,
  options?: {
    bufferSize?: number;
    flushIntervalMs?: number;
    onFlush?: (results: BatchResult<TemporalSignature>[]) => void;
  }
): StreamProcessor<TInput, TState> {
  return new StreamProcessor(adapter, options);
}
