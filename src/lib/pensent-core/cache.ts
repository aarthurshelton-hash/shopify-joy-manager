/**
 * En Pensent Core SDK - Caching Layer
 * 
 * High-performance caching for expensive computations like
 * signature extraction and pattern matching.
 */

import { TemporalSignature, PatternMatch, TrajectoryPrediction } from './types';
import { hashString } from './signatureExtractor';

// ===================== CACHE TYPES =====================

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
  sizeBytes?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
  evictions: number;
}

export interface CacheConfig {
  /** Maximum number of entries */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTtl: number;
  /** Eviction strategy */
  evictionStrategy: 'lru' | 'lfu' | 'fifo';
  /** Enable compression for large entries */
  compressLargeEntries?: boolean;
  /** Size threshold for compression (bytes) */
  compressionThreshold?: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  evictionStrategy: 'lru'
};

// ===================== LRU CACHE IMPLEMENTATION =====================

/**
 * High-performance LRU cache with TTL support
 */
export class PensentCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: this.config.maxSize,
      hitRate: 0,
      evictions: 0
    };
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }
    
    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    
    // Move to end for LRU
    if (this.config.evictionStrategy === 'lru') {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    
    this.stats.hits++;
    this.updateHitRate();
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + (ttl ?? this.config.defaultTtl),
      accessCount: 1,
      lastAccessedAt: now
    };
    
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet(key: string, factory: () => T | Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Evict entries based on strategy
   */
  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string | null = null;
    
    switch (this.config.evictionStrategy) {
      case 'lru': {
        // First key in map is least recently used
        keyToEvict = this.cache.keys().next().value ?? null;
        break;
      }
      case 'lfu': {
        // Find least frequently used
        let minCount = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.accessCount < minCount) {
            minCount = entry.accessCount;
            keyToEvict = key;
          }
        }
        break;
      }
      case 'fifo': {
        // Find oldest entry
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.createdAt < oldestTime) {
            oldestTime = entry.createdAt;
            keyToEvict = key;
          }
        }
        break;
      }
    }
    
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.stats.size = this.cache.size;
    return cleaned;
  }
}

// ===================== SPECIALIZED CACHES =====================

/**
 * Cache for TemporalSignature extraction results
 */
export class SignatureCache extends PensentCache<TemporalSignature> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 500,
      defaultTtl: 10 * 60 * 1000, // 10 minutes
      ...config
    });
  }

  /**
   * Generate cache key from input
   */
  static generateKey(input: string): string {
    return `sig_${hashString(input)}`;
  }
}

/**
 * Cache for pattern matching results
 */
export class MatchCache extends PensentCache<PatternMatch[]> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 200,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      ...config
    });
  }

  static generateKey(fingerprint: string, options?: Record<string, unknown>): string {
    const optionsHash = options ? hashString(JSON.stringify(options)) : '';
    return `match_${fingerprint}_${optionsHash}`;
  }
}

/**
 * Cache for trajectory predictions
 */
export class PredictionCache extends PensentCache<TrajectoryPrediction> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 300,
      defaultTtl: 3 * 60 * 1000, // 3 minutes (predictions may change)
      ...config
    });
  }

  static generateKey(fingerprint: string, position: number): string {
    return `pred_${fingerprint}_${position}`;
  }
}

// ===================== FACTORY FUNCTIONS =====================

/**
 * Create a new generic cache
 */
export function createCache<T>(config?: Partial<CacheConfig>): PensentCache<T> {
  return new PensentCache<T>(config);
}

/**
 * Create a complete cache bundle for the SDK
 */
export function createCacheBundle(config?: Partial<CacheConfig>) {
  return {
    signatures: new SignatureCache(config),
    matches: new MatchCache(config),
    predictions: new PredictionCache(config),
    
    clearAll(): void {
      this.signatures.clear();
      this.matches.clear();
      this.predictions.clear();
    },
    
    getStats() {
      return {
        signatures: this.signatures.getStats(),
        matches: this.matches.getStats(),
        predictions: this.predictions.getStats()
      };
    }
  };
}
