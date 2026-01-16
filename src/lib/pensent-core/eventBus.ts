/**
 * En Pensent Core SDK - Event Bus
 * 
 * Reactive event system for signature extraction, pattern matching,
 * and prediction events. Enables loose coupling between SDK components.
 */

import { TemporalSignature, PatternMatch, TrajectoryPrediction } from './types';

// ===================== EVENT TYPES =====================

export type PensentEventType = 
  | 'signature:extracted'
  | 'signature:cached'
  | 'pattern:matched'
  | 'pattern:notfound'
  | 'prediction:generated'
  | 'prediction:lowconfidence'
  | 'archetype:classified'
  | 'milestone:reached'
  | 'error:extraction'
  | 'error:matching'
  | 'error:prediction'
  | 'batch:started'
  | 'batch:progress'
  | 'batch:completed';

export interface PensentEvent<T = unknown> {
  type: PensentEventType;
  timestamp: number;
  domain: string;
  payload: T;
  metadata?: Record<string, unknown>;
}

export interface SignatureExtractedPayload {
  signature: TemporalSignature;
  inputHash: string;
  extractionTimeMs: number;
}

export interface PatternMatchedPayload {
  matches: PatternMatch[];
  targetFingerprint: string;
  searchTimeMs: number;
}

export interface PredictionGeneratedPayload {
  prediction: TrajectoryPrediction;
  signature: TemporalSignature;
  predictionTimeMs: number;
}

export interface BatchProgressPayload {
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
}

export interface ErrorPayload {
  error: Error;
  context: string;
  recoverable: boolean;
}

// ===================== EVENT HANDLER TYPES =====================

export type PensentEventHandler<T = unknown> = (event: PensentEvent<T>) => void | Promise<void>;

export type PensentEventFilter = (event: PensentEvent) => boolean;

export interface EventSubscription {
  id: string;
  unsubscribe: () => void;
}

// ===================== EVENT BUS IMPLEMENTATION =====================

/**
 * Central event bus for En Pensent SDK
 * Provides pub/sub capabilities for reactive event handling
 */
export class PensentEventBus {
  private handlers: Map<PensentEventType | '*', Set<{ 
    id: string; 
    handler: PensentEventHandler; 
    filter?: PensentEventFilter;
  }>> = new Map();
  
  private eventHistory: PensentEvent[] = [];
  private maxHistorySize = 100;
  private domain: string;

  constructor(domain: string = 'default') {
    this.domain = domain;
  }

  /**
   * Subscribe to a specific event type
   */
  on<T>(
    eventType: PensentEventType | '*',
    handler: PensentEventHandler<T>,
    filter?: PensentEventFilter
  ): EventSubscription {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    const subscription = { id, handler: handler as PensentEventHandler, filter };
    this.handlers.get(eventType)!.add(subscription);
    
    return {
      id,
      unsubscribe: () => {
        this.handlers.get(eventType)?.delete(subscription);
      }
    };
  }

  /**
   * Subscribe to an event type and automatically unsubscribe after first event
   */
  once<T>(
    eventType: PensentEventType,
    handler: PensentEventHandler<T>
  ): EventSubscription {
    const subscription = this.on<T>(eventType, (event) => {
      subscription.unsubscribe();
      handler(event);
    });
    return subscription;
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T>(
    type: PensentEventType,
    payload: T,
    metadata?: Record<string, unknown>
  ): void {
    const event: PensentEvent<T> = {
      type,
      timestamp: Date.now(),
      domain: this.domain,
      payload,
      metadata
    };
    
    // Store in history
    this.eventHistory.push(event as PensentEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Notify type-specific handlers
    this.notifyHandlers(type, event as PensentEvent);
    
    // Notify wildcard handlers
    this.notifyHandlers('*', event as PensentEvent);
  }

  private notifyHandlers(eventType: PensentEventType | '*', event: PensentEvent): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;
    
    for (const { handler, filter } of handlers) {
      // Apply filter if present
      if (filter && !filter(event)) continue;
      
      try {
        handler(event);
      } catch (error) {
        console.error(`Event handler error for ${eventType}:`, error);
      }
    }
  }

  /**
   * Get event history (optionally filtered by type)
   */
  getHistory(eventType?: PensentEventType): PensentEvent[] {
    if (!eventType) return [...this.eventHistory];
    return this.eventHistory.filter(e => e.type === eventType);
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.handlers.clear();
    this.eventHistory = [];
  }

  /**
   * Get the number of active subscriptions
   */
  get subscriptionCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    return count;
  }
}

/**
 * Create a new event bus for a domain
 */
export function createEventBus(domain: string): PensentEventBus {
  return new PensentEventBus(domain);
}

/**
 * Global event bus instance for cross-domain events
 */
export const globalEventBus = new PensentEventBus('global');
