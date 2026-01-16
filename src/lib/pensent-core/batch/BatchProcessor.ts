/**
 * En Pensent Core SDK - Batch Processor
 */

import { TemporalSignature, DomainAdapter } from '../types';
import { AnalysisPipeline, createPipeline } from '../pipeline';
import { PensentEventBus, createEventBus } from '../eventBus';
import {
  BatchInput,
  BatchResult,
  BatchProgress,
  BatchConfig,
  BatchAggregation,
  DEFAULT_BATCH_CONFIG
} from './types';

/**
 * Batch processor for analyzing multiple inputs
 */
export class BatchProcessor<TInput, TState> {
  private adapter: DomainAdapter<TInput, TState>;
  private pipeline: AnalysisPipeline<TInput, TState>;
  private eventBus: PensentEventBus;
  private config: BatchConfig;

  constructor(
    adapter: DomainAdapter<TInput, TState>,
    config: Partial<BatchConfig> = {}
  ) {
    this.adapter = adapter;
    this.pipeline = createPipeline(adapter);
    this.eventBus = createEventBus(`${adapter.domain}_batch`);
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
  }

  /**
   * Process a batch of inputs
   */
  async processBatch(
    inputs: BatchInput<TInput>[]
  ): Promise<BatchResult<TemporalSignature>[]> {
    const results: BatchResult<TemporalSignature>[] = [];
    const startTime = performance.now();
    let completedCount = 0;
    let failedCount = 0;
    const processingTimes: number[] = [];

    // Sort by priority if specified
    const sortedInputs = [...inputs].sort((a, b) => 
      (b.priority ?? 0) - (a.priority ?? 0)
    );

    this.eventBus.emit('batch:started', {
      total: inputs.length,
      concurrency: this.config.concurrency
    });

    // Process in chunks based on concurrency
    for (let i = 0; i < sortedInputs.length; i += this.config.concurrency) {
      const chunk = sortedInputs.slice(i, i + this.config.concurrency);
      
      const chunkResults = await Promise.all(
        chunk.map(input => this.processItem(input))
      );

      for (const result of chunkResults) {
        results.push(result);
        processingTimes.push(result.processingTimeMs);
        
        if (result.success) {
          completedCount++;
        } else {
          failedCount++;
          if (!this.config.continueOnError) {
            throw result.error ?? new Error('Batch processing failed');
          }
        }
      }

      // Report progress
      const progress = this.calculateProgress(
        sortedInputs.length,
        completedCount,
        failedCount,
        processingTimes,
        startTime,
        chunk[chunk.length - 1]?.id
      );

      this.eventBus.emit('batch:progress', progress);
      this.config.onProgress?.(progress);

      // Apply delay between chunks if configured
      if (this.config.itemDelayMs && i + this.config.concurrency < sortedInputs.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.itemDelayMs));
      }
    }

    this.eventBus.emit('batch:completed', {
      total: inputs.length,
      succeeded: completedCount,
      failed: failedCount,
      totalTimeMs: performance.now() - startTime
    });

    return results;
  }

  /**
   * Process a single item
   */
  private async processItem(
    input: BatchInput<TInput>
  ): Promise<BatchResult<TemporalSignature>> {
    const startTime = performance.now();

    try {
      const context = await this.pipeline.execute(input.data);
      
      if (context.error) {
        throw context.error;
      }

      return {
        id: input.id,
        success: true,
        result: context.signature,
        processingTimeMs: performance.now() - startTime
      };
    } catch (error) {
      return {
        id: input.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        processingTimeMs: performance.now() - startTime
      };
    }
  }

  /**
   * Calculate progress metrics
   */
  private calculateProgress(
    total: number,
    completed: number,
    failed: number,
    processingTimes: number[],
    startTime: number,
    currentItem?: string
  ): BatchProgress {
    const avgTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;
    
    const remaining = total - completed - failed;
    const estimatedRemainingMs = remaining * avgTime;

    return {
      total,
      completed,
      failed,
      percentage: ((completed + failed) / total) * 100,
      estimatedRemainingMs,
      currentItem
    };
  }

  /**
   * Aggregate results for analysis
   */
  aggregateResults(
    results: BatchResult<TemporalSignature>[]
  ): BatchAggregation {
    const successfulResults = results.filter(r => r.success && r.result);
    const signatures = successfulResults.map(r => r.result!);

    const archetypeDistribution: Record<string, number> = {};
    let totalIntensity = 0;

    for (const sig of signatures) {
      archetypeDistribution[sig.archetype] = 
        (archetypeDistribution[sig.archetype] ?? 0) + 1;
      totalIntensity += sig.intensity;
    }

    const totalTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0);

    return {
      totalItems: results.length,
      successCount: successfulResults.length,
      failureCount: results.length - successfulResults.length,
      totalProcessingTimeMs: totalTime,
      averageProcessingTimeMs: totalTime / results.length,
      archetypeDistribution,
      outcomeDistribution: {},
      averageIntensity: signatures.length > 0 ? totalIntensity / signatures.length : 0,
      averageConfidence: 0
    };
  }

  /**
   * Get the event bus for subscribing to batch events
   */
  getEventBus(): PensentEventBus {
    return this.eventBus;
  }

  /**
   * Configure the underlying pipeline
   */
  configurePipeline(): AnalysisPipeline<TInput, TState> {
    return this.pipeline;
  }
}
