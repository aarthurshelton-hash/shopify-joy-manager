/**
 * En Pensent Core SDK - Cache Types
 */

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
