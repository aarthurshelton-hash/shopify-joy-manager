/**
 * En Pensent Core SDK - Stream Processor
 */

import { TemporalSignature, DomainAdapter } from '../types';
import { BatchInput, BatchResult } from './types';
import { BatchProcessor } from './BatchProcessor';

/**
 * Stream processor for processing items as they arrive
 */
export class StreamProcessor<TInput, TState> {
  private adapter: DomainAdapter<TInput, TState>;
  private buffer: BatchInput<TInput>[] = [];
  private bufferSize: number;
  private flushInterval: number;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private onFlush?: (results: BatchResult<TemporalSignature>[]) => void;

  constructor(
    adapter: DomainAdapter<TInput, TState>,
    options: {
      bufferSize?: number;
      flushIntervalMs?: number;
      onFlush?: (results: BatchResult<TemporalSignature>[]) => void;
    } = {}
  ) {
    this.adapter = adapter;
    this.bufferSize = options.bufferSize ?? 10;
    this.flushInterval = options.flushIntervalMs ?? 1000;
    this.onFlush = options.onFlush;
  }

  /**
   * Add an item to the stream
   */
  push(input: BatchInput<TInput>): void {
    this.buffer.push(input);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Schedule a flush after the interval
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Flush the buffer
   */
  async flush(): Promise<BatchResult<TemporalSignature>[]> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.buffer.length === 0) {
      return [];
    }

    const items = [...this.buffer];
    this.buffer = [];

    const processor = new BatchProcessor(this.adapter, { concurrency: 3 });
    const results = await processor.processBatch(items);

    this.onFlush?.(results);
    return results;
  }

  /**
   * Close the stream and flush remaining items
   */
  async close(): Promise<BatchResult<TemporalSignature>[]> {
    return this.flush();
  }
}
