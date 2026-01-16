/**
 * En Pensent Core SDK - Cache Factory Functions
 */

import { PensentCache } from './PensentCache';
import { SignatureCache, MatchCache, PredictionCache } from './specializedCaches';
import { CacheConfig } from './types';

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
