/**
 * Cross-Domain Correlation Logger
 * 
 * Tracks and persists correlations between chess patterns,
 * code health events, and market movements.
 */

import { supabase } from '@/integrations/supabase/client';
import { photonicEngine } from '@/lib/pensent-core/architecture/photonicComputing';

export interface CorrelationEvent {
  id: string;
  timestamp: Date;
  domainA: string;
  domainB: string;
  metricA: { name: string; value: number };
  metricB: { name: string; value: number };
  correlation: number;
  significance: 'strong' | 'moderate' | 'weak';
  context?: string;
}

class CrossDomainCorrelationLogger {
  private events: CorrelationEvent[] = [];
  private readonly maxMemoryEvents = 100;

  /**
   * Log a correlation event between two domains
   */
  log(event: Omit<CorrelationEvent, 'id' | 'timestamp' | 'significance'>): CorrelationEvent {
    const fullEvent: CorrelationEvent = {
      ...event,
      id: `corr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      significance: event.correlation > 0.7 ? 'strong' : 
        event.correlation > 0.4 ? 'moderate' : 'weak'
    };

    this.events.unshift(fullEvent);
    
    // Trim memory
    if (this.events.length > this.maxMemoryEvents) {
      this.events = this.events.slice(0, this.maxMemoryEvents);
    }

    // Inject into photonic engine for coherence tracking
    this.updatePhotonicState(event.domainA, event.metricA.value);
    this.updatePhotonicState(event.domainB, event.metricB.value);

    return fullEvent;
  }

  /**
   * Log chess pattern event
   */
  logChessEvent(metric: string, value: number, context?: string): void {
    this.updatePhotonicState('chess', value);
    console.log(`[CrossDomain] Chess: ${metric} = ${value}`, context || '');
  }

  /**
   * Log code health event
   */
  logCodeEvent(metric: string, value: number, context?: string): void {
    this.updatePhotonicState('code', value);
    console.log(`[CrossDomain] Code: ${metric} = ${value}`, context || '');
  }

  /**
   * Log market event
   */
  logMarketEvent(metric: string, value: number, context?: string): void {
    this.updatePhotonicState('market', value);
    console.log(`[CrossDomain] Market: ${metric} = ${value}`, context || '');
  }

  /**
   * Update photonic engine with domain signal
   */
  private updatePhotonicState(domain: string, value: number): void {
    const photonicDomain = domain.toLowerCase() as any;
    try {
      photonicEngine.injectSignal(photonicDomain, {
        amplitude: Math.max(0.1, Math.min(1, value)),
        phase: (Date.now() % 6283) / 1000, // Cycle phase
        coherence: 0.5 + value * 0.5
      });
    } catch (e) {
      // Domain may not exist in photonic engine
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 20): CorrelationEvent[] {
    return this.events.slice(0, limit);
  }

  /**
   * Get correlation summary
   */
  getSummary(): {
    totalEvents: number;
    strongCorrelations: number;
    topDomainPairs: Array<{ pair: string; count: number; avgCorrelation: number }>;
  } {
    const pairStats: Record<string, { count: number; totalCorr: number }> = {};

    this.events.forEach(event => {
      const pair = [event.domainA, event.domainB].sort().join('-');
      if (!pairStats[pair]) {
        pairStats[pair] = { count: 0, totalCorr: 0 };
      }
      pairStats[pair].count++;
      pairStats[pair].totalCorr += event.correlation;
    });

    const topPairs = Object.entries(pairStats)
      .map(([pair, stats]) => ({
        pair,
        count: stats.count,
        avgCorrelation: stats.totalCorr / stats.count
      }))
      .sort((a, b) => b.avgCorrelation - a.avgCorrelation)
      .slice(0, 5);

    return {
      totalEvents: this.events.length,
      strongCorrelations: this.events.filter(e => e.significance === 'strong').length,
      topDomainPairs: topPairs
    };
  }

  /**
   * Check for glitch (synchronized domains)
   */
  checkForGlitch(): {
    detected: boolean;
    type: string | null;
    confidence: number;
    description: string;
  } {
    return photonicEngine.detectGlitchInMatrix();
  }
}

export const correlationLogger = new CrossDomainCorrelationLogger();

// Hook into existing systems
export function setupCorrelationLogging(): void {
  // This will be called from the main app initialization
  console.log('[CrossDomain] Correlation logging initialized');
  
  // Log initial state
  correlationLogger.logChessEvent('init', 1, 'System startup');
  correlationLogger.logCodeEvent('init', 1, 'System startup');
  correlationLogger.logMarketEvent('init', 1, 'System startup');
}
