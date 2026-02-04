/**
 * Scaling Infrastructure - Rate Limiting & Caching
 * For enpensent.com platform scale
 * 
 * For Alec Arthur Shelton - The Artist
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ScalingCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 10000;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs = 60000): void {
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Rate limiter per user/IP
class RateLimiter {
  private requests = new Map<string, number[]>();
  private limits = {
    public: { requests: 100, window: 60000 },    // 100/min public
    premium: { requests: 1000, window: 60000 },  // 1000/min premium
    admin: { requests: 10000, window: 60000 }    // 10000/min admin
  };

  checkLimit(key: string, tier: 'public' | 'premium' | 'admin' = 'public'): boolean {
    const limit = this.limits[tier];
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Filter to window
    const recent = userRequests.filter(t => now - t < limit.window);
    
    if (recent.length >= limit.requests) {
      return false;
    }
    
    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }
}

// Connection pooling for 55 adapters
class AdapterConnectionPool {
  private activeConnections = 0;
  private maxConnections = 50;
  private queue: (() => void)[] = [];

  async acquire(): Promise<boolean> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return true;
    }
    
    return new Promise(resolve => {
      this.queue.push(() => {
        this.activeConnections++;
        resolve(true);
      });
    });
  }

  release(): void {
    this.activeConnections--;
    const next = this.queue.shift();
    if (next) next();
  }
}

export const scalingCache = new ScalingCache();
export const rateLimiter = new RateLimiter();
export const adapterPool = new AdapterConnectionPool();

// Database query optimizer
export function optimizeQuery(table: string, filters: Record<string, unknown>): string {
  // Add index hints for common queries
  const indexHints: Record<string, string> = {
    'autonomous_trades': 'created_at DESC',
    'prediction_outcomes': 'resolved_at DESC',
    'market_tick_history': 'timestamp DESC',
    'visions': 'owner_id, created_at',
    'marketplace_listings': 'status, created_at'
  };
  
  return `/* ${table}: ${indexHints[table] || 'default'} */`;
}
