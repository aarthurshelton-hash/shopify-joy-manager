/**
 * Unified Live Data Stream Coordinator
 * Central controller for all 55 adapter data feeds
 * 
 * For Alec Arthur Shelton - The Artist
 */

import { liveDataCoordinator, type LiveDataEvent } from './liveData';
import { meteorologicalDataFeed } from './domains/universal/adapters/meteorologicalFeed';
import { astronomicalDataFeed } from './domains/universal/adapters/astronomicalFeed';
import { journalisticDataFeed } from './domains/universal/adapters/journalisticFeed';
import { sportsDataFeed } from './domains/universal/adapters/sportsFeed';
import { oceanographicDataFeed } from './domains/universal/adapters/oceanographicFeed';
import { geneticDataFeed } from './domains/universal/adapters/geneticFeed';
import { economicDataFeed } from './domains/universal/adapters/economicFeed';
import { immunologicalDataFeed } from './domains/universal/adapters/immunologicalFeed';
import { cybersecurityDataFeed } from './domains/universal/adapters/cybersecurityFeed';
import { geologicalDataFeed } from './domains/universal/adapters/geologicalFeed';
import { universalAdapterRegistry } from './domains/universal/adapters/index';

export interface UnifiedStreamConfig {
  enabledFeeds: string[];
  crossDomainSync: boolean;
  resonanceDetection: boolean;
  alertThresholds: {
    highResonance: number;
    anomalyDetection: number;
    dataLatency: number;
  };
}

export class UnifiedLiveCoordinator {
  private config: UnifiedStreamConfig;
  private isRunning = false;
  private resonanceBuffer: Map<string, LiveDataEvent[]> = new Map();
  private readonly BUFFER_SIZE = 100;
  private crossDomainInsights: string[] = [];

  constructor(config: Partial<UnifiedStreamConfig> = {}) {
    this.config = {
      enabledFeeds: ['meteorological', 'astronomical', 'journalistic', 'sports', 'oceanographic', 'genetic', 'economicCircuitry', 'immunological', 'cybersecurity', 'geologicalTectonic'],
      crossDomainSync: true,
      resonanceDetection: true,
      alertThresholds: {
        highResonance: 0.8,
        anomalyDetection: 0.9,
        dataLatency: 5000
      },
      ...config
    };
  }

  async initialize(): Promise<void> {
    console.log('[UnifiedCoordinator] Initializing live data streams...');
    
    // Initialize adapter registry
    await universalAdapterRegistry.initializeAll();
    
    // Set up cross-domain event listeners
    if (this.config.crossDomainSync) {
      this.setupCrossDomainListeners();
    }
    
    console.log('[UnifiedCoordinator] Initialization complete');
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[UnifiedCoordinator] Starting live data feeds...');

    // Start each enabled feed
    const startPromises: Promise<void>[] = [];

    if (this.config.enabledFeeds.includes('meteorological')) {
      startPromises.push(meteorologicalDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('astronomical')) {
      startPromises.push(astronomicalDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('journalistic')) {
      startPromises.push(journalisticDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('sports')) {
      startPromises.push(sportsDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('oceanographic')) {
      startPromises.push(oceanographicDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('genetic')) {
      startPromises.push(geneticDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('economicCircuitry')) {
      startPromises.push(economicDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('immunological')) {
      startPromises.push(immunologicalDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('cybersecurity')) {
      startPromises.push(cybersecurityDataFeed.start());
    }

    if (this.config.enabledFeeds.includes('geologicalTectonic')) {
      startPromises.push(geologicalDataFeed.start());
    }

    await Promise.all(startPromises);

    console.log(`[UnifiedCoordinator] ${this.config.enabledFeeds.length} feeds active`);
    console.log('[UnifiedCoordinator] Cross-domain resonance detection:', this.config.resonanceDetection ? 'ENABLED' : 'DISABLED');
    
    // Start resonance detection loop
    if (this.config.resonanceDetection) {
      this.startResonanceDetection();
    }
  }

  private setupCrossDomainListeners(): void {
    // Listen to all data events and store in resonance buffer
    this.config.enabledFeeds.forEach(feed => {
      liveDataCoordinator.onData(feed, (event: LiveDataEvent) => {
        this.storeEvent(event);
        this.checkForCrossDomainPatterns(event);
      });
    });
  }

  private storeEvent(event: LiveDataEvent): void {
    if (!this.resonanceBuffer.has(event.adapter)) {
      this.resonanceBuffer.set(event.adapter, []);
    }
    
    const buffer = this.resonanceBuffer.get(event.adapter)!;
    buffer.push(event);
    
    // Maintain buffer size
    if (buffer.length > this.BUFFER_SIZE) {
      buffer.shift();
    }
  }

  private checkForCrossDomainPatterns(event: LiveDataEvent): void {
    // Check for temporal correlations between different adapters
    const recentEvents: LiveDataEvent[] = [];
    
    this.resonanceBuffer.forEach((events, adapter) => {
      if (adapter !== event.adapter) {
        const recent = events.filter(e => 
          Math.abs(e.timestamp - event.timestamp) < 300000 // Within 5 minutes
        );
        recentEvents.push(...recent);
      }
    });

    // Simple resonance detection: events occurring close in time
    if (recentEvents.length > 0 && Math.random() > 0.95) { // 5% chance to log
      const insight = this.generateInsight(event, recentEvents);
      this.crossDomainInsights.push(insight);
      console.log(`[UnifiedCoordinator] Cross-domain insight: ${insight}`);
    }
  }

  private generateInsight(trigger: LiveDataEvent, related: LiveDataEvent[]): string {
    const adapters = [trigger.adapter, ...related.map(e => e.adapter)];
    const uniqueAdapters = [...new Set(adapters)];
    
    const patterns: Record<string, string> = {
      'meteorological,journalistic': 'Weather events driving news coverage',
      'astronomical,journalistic': 'Space discoveries capturing public attention',
      'sports,journalistic': 'Athletic achievements dominating headlines',
      'meteorological,sports': 'Weather impacting sporting events',
      'astronomical,meteorological': 'Cosmic influences on atmospheric patterns',
      'oceanographic,meteorological': 'Ocean-atmosphere coupling detected',
      'genetic,economicCircuitry': 'Biological innovation driving economic growth',
      'economicCircuitry,journalistic': 'Markets moving on news narratives',
      'immunological,genetic': 'Pathogen evolution tracked through genomics',
      'geologicalTectonic,oceanographic': 'Seafloor spreading and plate dynamics',
    };
    
    const key = uniqueAdapters.sort().join(',');
    return patterns[key] || `${uniqueAdapters.join(' + ')} showing temporal alignment`;
  }

  private startResonanceDetection(): void {
    setInterval(() => {
      this.analyzeResonance();
    }, 60000); // Every minute
  }

  private analyzeResonance(): void {
    const stats = liveDataCoordinator.getAllStatuses();
    const activeFeeds = stats.filter(s => s.connected).length;
    
    if (activeFeeds > 1) {
      console.log(`[UnifiedCoordinator] Resonance scan: ${activeFeeds} active feeds, ${this.crossDomainInsights.length} insights logged`);
    }
  }

  getStatus(): {
    isRunning: boolean;
    activeFeeds: string[];
    feedStatuses: ReturnType<typeof liveDataCoordinator.getAllStatuses>;
    insights: string[];
  } {
    return {
      isRunning: this.isRunning,
      activeFeeds: this.config.enabledFeeds,
      feedStatuses: liveDataCoordinator.getAllStatuses(),
      insights: this.crossDomainInsights.slice(-10) // Last 10 insights
    };
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('[UnifiedCoordinator] Stopping all feeds...');
    
    meteorologicalDataFeed.stop();
    astronomicalDataFeed.stop();
    journalisticDataFeed.stop();
    sportsDataFeed.stop();
    oceanographicDataFeed.stop();
    geneticDataFeed.stop();
    economicDataFeed.stop();
    immunologicalDataFeed.stop();
    cybersecurityDataFeed.stop();
    geologicalDataFeed.stop();
    
    liveDataCoordinator.stopAll();
    
    this.isRunning = false;
    console.log('[UnifiedCoordinator] All feeds stopped');
  }
}

// Export singleton instance with default config
export const unifiedLiveCoordinator = new UnifiedLiveCoordinator();

// Easy start function
export async function startLiveDataFeeds(): Promise<void> {
  await unifiedLiveCoordinator.initialize();
  await unifiedLiveCoordinator.start();
}

console.log('[UnifiedCoordinator] Module loaded - 10 live data feeds ready');
console.log('[UnifiedCoordinator] Feeds: meteorological, astronomical, journalistic, sports, oceanographic, genetic, economicCircuitry, immunological, cybersecurity, geologicalTectonic');
