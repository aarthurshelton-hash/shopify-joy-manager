/**
 * Live Data Infrastructure - Universal Adapter Data Feed System
 * 
 * Provides real-time data connections for all 55 domain adapters
 * from external APIs, WebSockets, and streaming sources.
 * 
 * For Alec Arthur Shelton - The Artist
 */

export interface DataFeedConfig {
  adapter: string;
  source: string;
  endpoint: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  updateInterval: number; // milliseconds
  retryAttempts: number;
  timeout: number;
}

export interface LiveDataEvent {
  adapter: string;
  timestamp: number;
  data: unknown;
  source: string;
  latency: number; // ms
  confidence: number; // 0-1
}

export interface FeedStatus {
  adapter: string;
  connected: boolean;
  lastUpdate: number;
  eventsReceived: number;
  errors: number;
  averageLatency: number;
}

export class LiveDataCoordinator {
  private feeds: Map<string, DataFeedConfig> = new Map();
  private statuses: Map<string, FeedStatus> = new Map();
  private eventHandlers: Map<string, ((event: LiveDataEvent) => void)[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // API Configuration Registry
  static API_CONFIGS: Record<string, Partial<DataFeedConfig>> = {
    // Weather & Climate
    openWeatherMap: {
      source: 'OpenWeatherMap',
      endpoint: 'https://api.openweathermap.org/data/2.5',
      rateLimit: 60,
      updateInterval: 600000, // 10 minutes
      retryAttempts: 3,
      timeout: 10000
    },
    noaa: {
      source: 'NOAA',
      endpoint: 'https://api.weather.gov',
      rateLimit: 120,
      updateInterval: 300000, // 5 minutes
      retryAttempts: 3,
      timeout: 15000
    },
    
    // Space & Astronomy
    nasaAPOD: {
      source: 'NASA APOD',
      endpoint: 'https://api.nasa.gov/planetary/apod',
      rateLimit: 60,
      updateInterval: 86400000, // 24 hours
      retryAttempts: 3,
      timeout: 10000
    },
    nasaNeoWS: {
      source: 'NASA NEO',
      endpoint: 'https://api.nasa.gov/neo/rest/v1',
      rateLimit: 60,
      updateInterval: 3600000, // 1 hour
      retryAttempts: 3,
      timeout: 10000
    },
    
    // News & Media
    newsAPI: {
      source: 'NewsAPI',
      endpoint: 'https://newsapi.org/v2',
      rateLimit: 100,
      updateInterval: 900000, // 15 minutes
      retryAttempts: 3,
      timeout: 10000
    },
    gnews: {
      source: 'GNews',
      endpoint: 'https://gnews.io/api/v4',
      rateLimit: 100,
      updateInterval: 900000,
      retryAttempts: 3,
      timeout: 10000
    },
    
    // Sports
    espn: {
      source: 'ESPN',
      endpoint: 'https://site.api.espn.com/apis/site/v2/sports',
      rateLimit: 120,
      updateInterval: 300000, // 5 minutes
      retryAttempts: 3,
      timeout: 10000
    },
    apiFootball: {
      source: 'API-Football',
      endpoint: 'https://v3.football.api-sports.io',
      rateLimit: 100,
      updateInterval: 600000,
      retryAttempts: 3,
      timeout: 10000
    }
  };

  constructor() {
    console.log('[LiveDataCoordinator] Initialized');
  }

  registerFeed(config: DataFeedConfig): void {
    this.feeds.set(config.adapter, config);
    this.statuses.set(config.adapter, {
      adapter: config.adapter,
      connected: false,
      lastUpdate: 0,
      eventsReceived: 0,
      errors: 0,
      averageLatency: 0
    });
    console.log(`[LiveDataCoordinator] Registered feed for ${config.adapter}`);
  }

  async startFeed(adapterName: string): Promise<void> {
    const config = this.feeds.get(adapterName);
    if (!config) {
      throw new Error(`No feed configuration found for ${adapterName}`);
    }

    // Start polling interval
    const interval = setInterval(async () => {
      await this.fetchData(adapterName);
    }, config.updateInterval);

    this.intervals.set(adapterName, interval);
    
    // Immediate first fetch
    await this.fetchData(adapterName);
    
    console.log(`[LiveDataCoordinator] Started feed for ${adapterName}`);
  }

  private async fetchData(adapterName: string): Promise<void> {
    const config = this.feeds.get(adapterName);
    const status = this.statuses.get(adapterName);
    if (!config || !status) return;

    const startTime = Date.now();
    
    try {
      const response = await fetch(config.endpoint, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {},
        signal: AbortSignal.timeout(config.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      const event: LiveDataEvent = {
        adapter: adapterName,
        timestamp: Date.now(),
        data,
        source: config.source,
        latency,
        confidence: 0.9 // Base confidence for successful API calls
      };

      // Update status
      status.connected = true;
      status.lastUpdate = Date.now();
      status.eventsReceived++;
      status.averageLatency = (status.averageLatency * (status.eventsReceived - 1) + latency) / status.eventsReceived;

      // Notify handlers
      this.notifyHandlers(event);

    } catch (error) {
      status.errors++;
      console.error(`[LiveDataCoordinator] Fetch error for ${adapterName}:`, error);
    }
  }

  onData(adapter: string, handler: (event: LiveDataEvent) => void): void {
    if (!this.eventHandlers.has(adapter)) {
      this.eventHandlers.set(adapter, []);
    }
    this.eventHandlers.get(adapter)!.push(handler);
  }

  private notifyHandlers(event: LiveDataEvent): void {
    const handlers = this.eventHandlers.get(event.adapter) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`[LiveDataCoordinator] Handler error:`, error);
      }
    });
  }

  getStatus(adapter: string): FeedStatus | undefined {
    return this.statuses.get(adapter);
  }

  getAllStatuses(): FeedStatus[] {
    return Array.from(this.statuses.values());
  }

  stopFeed(adapter: string): void {
    const interval = this.intervals.get(adapter);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(adapter);
      console.log(`[LiveDataCoordinator] Stopped feed for ${adapter}`);
    }
  }

  stopAll(): void {
    this.intervals.forEach((interval, adapter) => {
      clearInterval(interval);
      console.log(`[LiveDataCoordinator] Stopped feed for ${adapter}`);
    });
    this.intervals.clear();
  }
}

// Export singleton
export const liveDataCoordinator = new LiveDataCoordinator();

// Environment variable helper
export function getAPIKey(service: string): string | undefined {
  const keyMap: Record<string, string> = {
    openWeatherMap: 'VITE_OPENWEATHER_API_KEY',
    nasa: 'VITE_NASA_API_KEY',
    newsAPI: 'VITE_NEWSAPI_KEY',
    gnews: 'VITE_GNEWS_API_KEY',
    espn: 'VITE_ESPN_API_KEY',
    apiFootball: 'VITE_API_FOOTBALL_KEY'
  };
  
  const envVar = keyMap[service];
  return envVar ? (import.meta.env[envVar] as string) : undefined;
}

console.log('[LiveData] Universal data feed system ready');
