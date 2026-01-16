/**
 * En Pensent Core SDK - Pipeline & Middleware
 * 
 * Composable pipeline architecture for processing patterns.
 * Supports middleware for extending SDK functionality.
 */

import { 
  TemporalSignature, 
  PatternMatch, 
  TrajectoryPrediction,
  DomainAdapter 
} from './types';
import { PensentEventBus, createEventBus } from './eventBus';
import { createCacheBundle } from './cache';

// ===================== PIPELINE TYPES =====================

/**
 * Context passed through the pipeline
 */
export interface PipelineContext<TInput = unknown> {
  /** Original input */
  input: TInput;
  /** Extracted signature (populated after extraction step) */
  signature?: TemporalSignature;
  /** Pattern matches (populated after matching step) */
  matches?: PatternMatch[];
  /** Trajectory prediction (populated after prediction step) */
  prediction?: TrajectoryPrediction;
  /** Custom metadata added by middleware */
  metadata: Record<string, unknown>;
  /** Timing information */
  timing: {
    startTime: number;
    extractionTime?: number;
    matchingTime?: number;
    predictionTime?: number;
    totalTime?: number;
  };
  /** Error information if any step failed */
  error?: Error;
  /** Whether to skip remaining steps */
  skipRemaining?: boolean;
}

/**
 * Middleware function signature
 */
export type PipelineMiddleware<TInput = unknown> = (
  context: PipelineContext<TInput>,
  next: () => Promise<void>
) => Promise<void>;

/**
 * Pipeline step definition
 */
export interface PipelineStep<TInput = unknown> {
  name: string;
  execute: (context: PipelineContext<TInput>) => Promise<void>;
  condition?: (context: PipelineContext<TInput>) => boolean;
}

// ===================== PIPELINE IMPLEMENTATION =====================

/**
 * Composable analysis pipeline
 */
export class AnalysisPipeline<TInput, TState> {
  private steps: PipelineStep<TInput>[] = [];
  private middleware: PipelineMiddleware<TInput>[] = [];
  private adapter: DomainAdapter<TInput, TState>;
  private eventBus: PensentEventBus;
  private cache = createCacheBundle();

  constructor(adapter: DomainAdapter<TInput, TState>) {
    this.adapter = adapter;
    this.eventBus = createEventBus(adapter.domain);
    this.initializeDefaultSteps();
  }

  /**
   * Initialize default pipeline steps
   */
  private initializeDefaultSteps(): void {
    // Step 1: Extract signature
    this.addStep({
      name: 'extract',
      execute: async (ctx) => {
        const start = performance.now();
        const states = this.adapter.parseInput(ctx.input);
        ctx.signature = this.adapter.extractSignature(states);
        ctx.timing.extractionTime = performance.now() - start;
        
        this.eventBus.emit('signature:extracted', {
          signature: ctx.signature,
          inputHash: ctx.signature.fingerprint,
          extractionTimeMs: ctx.timing.extractionTime
        });
      }
    });

    // Step 2: Classify archetype
    this.addStep({
      name: 'classify',
      execute: async (ctx) => {
        if (!ctx.signature) return;
        
        const archetype = this.adapter.classifyArchetype(ctx.signature);
        ctx.signature = { ...ctx.signature, archetype };
        
        this.eventBus.emit('archetype:classified', {
          archetype,
          fingerprint: ctx.signature.fingerprint
        });
      }
    });
  }

  /**
   * Add a step to the pipeline
   */
  addStep(step: PipelineStep<TInput>): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Insert a step at a specific position
   */
  insertStep(index: number, step: PipelineStep<TInput>): this {
    this.steps.splice(index, 0, step);
    return this;
  }

  /**
   * Add middleware to the pipeline
   */
  use(middleware: PipelineMiddleware<TInput>): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Execute the pipeline
   */
  async execute(input: TInput): Promise<PipelineContext<TInput>> {
    const context: PipelineContext<TInput> = {
      input,
      metadata: {},
      timing: { startTime: performance.now() }
    };

    try {
      // Build middleware chain
      const chain = this.buildMiddlewareChain(context);
      await chain();
      
      context.timing.totalTime = performance.now() - context.timing.startTime;
    } catch (error) {
      context.error = error instanceof Error ? error : new Error(String(error));
      this.eventBus.emit('error:extraction', {
        error: context.error,
        context: 'pipeline',
        recoverable: false
      });
    }

    return context;
  }

  /**
   * Build the middleware chain
   */
  private buildMiddlewareChain(context: PipelineContext<TInput>): () => Promise<void> {
    let index = 0;
    const middlewareList = [...this.middleware];
    
    const runNext = async (): Promise<void> => {
      if (context.skipRemaining) return;
      
      if (index < middlewareList.length) {
        const middleware = middlewareList[index++];
        await middleware(context, runNext);
      } else {
        // Run pipeline steps after all middleware
        await this.executeSteps(context);
      }
    };
    
    return runNext;
  }

  /**
   * Execute all pipeline steps
   */
  private async executeSteps(context: PipelineContext<TInput>): Promise<void> {
    for (const step of this.steps) {
      if (context.skipRemaining) break;
      
      // Check condition if present
      if (step.condition && !step.condition(context)) {
        continue;
      }
      
      await step.execute(context);
    }
  }

  /**
   * Get the event bus for subscribing to events
   */
  getEventBus(): PensentEventBus {
    return this.eventBus;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clearAll();
  }
}

// ===================== BUILT-IN MIDDLEWARE =====================

/**
 * Logging middleware - logs each step execution
 */
export function loggingMiddleware<TInput>(): PipelineMiddleware<TInput> {
  return async (ctx, next) => {
    console.log(`[Pipeline] Starting analysis for input`);
    const start = performance.now();
    
    await next();
    
    const duration = performance.now() - start;
    console.log(`[Pipeline] Analysis complete in ${duration.toFixed(2)}ms`);
    if (ctx.signature) {
      console.log(`[Pipeline] Archetype: ${ctx.signature.archetype}`);
    }
    if (ctx.error) {
      console.error(`[Pipeline] Error:`, ctx.error);
    }
  };
}

/**
 * Validation middleware - validates input before processing
 */
export function validationMiddleware<TInput>(
  validator: (input: TInput) => boolean | string
): PipelineMiddleware<TInput> {
  return async (ctx, next) => {
    const result = validator(ctx.input);
    
    if (result === false) {
      ctx.error = new Error('Input validation failed');
      ctx.skipRemaining = true;
      return;
    }
    
    if (typeof result === 'string') {
      ctx.error = new Error(result);
      ctx.skipRemaining = true;
      return;
    }
    
    await next();
  };
}

/**
 * Caching middleware - caches results for repeated inputs
 */
export function cachingMiddleware<TInput>(
  keyGenerator: (input: TInput) => string
): PipelineMiddleware<TInput> {
  const cache = new Map<string, TemporalSignature>();
  
  return async (ctx, next) => {
    const key = keyGenerator(ctx.input);
    
    if (cache.has(key)) {
      ctx.signature = cache.get(key);
      ctx.metadata.fromCache = true;
      return; // Skip remaining steps
    }
    
    await next();
    
    if (ctx.signature) {
      cache.set(key, ctx.signature);
    }
  };
}

/**
 * Retry middleware - retries failed steps
 */
export function retryMiddleware<TInput>(
  maxRetries: number = 3,
  delayMs: number = 100
): PipelineMiddleware<TInput> {
  return async (ctx, next) => {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await next();
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    
    ctx.error = lastError;
    ctx.skipRemaining = true;
  };
}

/**
 * Timeout middleware - fails if processing takes too long
 */
export function timeoutMiddleware<TInput>(
  timeoutMs: number
): PipelineMiddleware<TInput> {
  return async (ctx, next) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Pipeline timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    try {
      await Promise.race([next(), timeoutPromise]);
    } catch (error) {
      ctx.error = error instanceof Error ? error : new Error(String(error));
      ctx.skipRemaining = true;
    }
  };
}

// ===================== FACTORY FUNCTIONS =====================

/**
 * Create a new analysis pipeline
 */
export function createPipeline<TInput, TState>(
  adapter: DomainAdapter<TInput, TState>
): AnalysisPipeline<TInput, TState> {
  return new AnalysisPipeline(adapter);
}
