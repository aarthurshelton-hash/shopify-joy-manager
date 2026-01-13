import { useCallback, useRef, useEffect } from 'react';
import { MarketplaceListing } from '@/lib/marketplace/marketplaceApi';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface MarketplaceCache {
  listings: Map<string, CacheEntry<MarketplaceListing>>;
  listingsPage: Map<number, CacheEntry<MarketplaceListing[]>>;
  totalCount: number | null;
  lastUpdated: number | null;
}

// Cache TTL in milliseconds
const CACHE_TTL = 60000; // 1 minute for listings
const STALE_TTL = 300000; // 5 minutes before completely stale

// Global cache instance (persists across component mounts)
const globalCache: MarketplaceCache = {
  listings: new Map(),
  listingsPage: new Map(),
  totalCount: null,
  lastUpdated: null,
};

export function useMarketplaceCache() {
  const cacheRef = useRef(globalCache);

  // Get a single listing from cache
  const getCachedListing = useCallback((id: string): MarketplaceListing | null => {
    const entry = cacheRef.current.listings.get(id);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      cacheRef.current.listings.delete(id);
      return null;
    }
    
    return entry.data;
  }, []);

  // Cache a single listing
  const cacheListing = useCallback((listing: MarketplaceListing) => {
    const now = Date.now();
    cacheRef.current.listings.set(listing.id, {
      data: listing,
      timestamp: now,
      expiresAt: now + CACHE_TTL,
    });
  }, []);

  // Cache multiple listings from a page
  const cacheListingsPage = useCallback((page: number, listings: MarketplaceListing[]) => {
    const now = Date.now();
    
    // Cache the page
    cacheRef.current.listingsPage.set(page, {
      data: listings,
      timestamp: now,
      expiresAt: now + CACHE_TTL,
    });
    
    // Also cache individual listings
    listings.forEach(listing => {
      cacheRef.current.listings.set(listing.id, {
        data: listing,
        timestamp: now,
        expiresAt: now + CACHE_TTL,
      });
    });
    
    cacheRef.current.lastUpdated = now;
  }, []);

  // Get cached page
  const getCachedPage = useCallback((page: number): MarketplaceListing[] | null => {
    const entry = cacheRef.current.listingsPage.get(page);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      cacheRef.current.listingsPage.delete(page);
      return null;
    }
    
    return entry.data;
  }, []);

  // Check if cache is fresh (within TTL)
  const isCacheFresh = useCallback((): boolean => {
    if (!cacheRef.current.lastUpdated) return false;
    return Date.now() - cacheRef.current.lastUpdated < CACHE_TTL;
  }, []);

  // Check if cache is stale but usable (for stale-while-revalidate)
  const isCacheStale = useCallback((): boolean => {
    if (!cacheRef.current.lastUpdated) return true;
    const age = Date.now() - cacheRef.current.lastUpdated;
    return age >= CACHE_TTL && age < STALE_TTL;
  }, []);

  // Get all cached listings as array
  const getAllCachedListings = useCallback((): MarketplaceListing[] => {
    const allListings: MarketplaceListing[] = [];
    const now = Date.now();
    
    // Collect from all pages in order
    const pages = Array.from(cacheRef.current.listingsPage.entries())
      .filter(([_, entry]) => now <= entry.expiresAt)
      .sort(([a], [b]) => a - b);
    
    for (const [_, entry] of pages) {
      allListings.push(...entry.data);
    }
    
    return allListings;
  }, []);

  // Cache total count
  const cacheTotalCount = useCallback((count: number) => {
    cacheRef.current.totalCount = count;
  }, []);

  // Get cached total count
  const getCachedTotalCount = useCallback((): number | null => {
    return cacheRef.current.totalCount;
  }, []);

  // Invalidate cache for a specific listing
  const invalidateListing = useCallback((id: string) => {
    cacheRef.current.listings.delete(id);
    
    // Also remove from any cached pages
    for (const [page, entry] of cacheRef.current.listingsPage.entries()) {
      const filtered = entry.data.filter(l => l.id !== id);
      if (filtered.length !== entry.data.length) {
        cacheRef.current.listingsPage.set(page, {
          ...entry,
          data: filtered,
        });
      }
    }
  }, []);

  // Clear all cache
  const clearCache = useCallback(() => {
    cacheRef.current.listings.clear();
    cacheRef.current.listingsPage.clear();
    cacheRef.current.totalCount = null;
    cacheRef.current.lastUpdated = null;
  }, []);

  // Update a listing in cache (for real-time updates)
  const updateCachedListing = useCallback((id: string, updates: Partial<MarketplaceListing>) => {
    const entry = cacheRef.current.listings.get(id);
    if (entry) {
      const now = Date.now();
      cacheRef.current.listings.set(id, {
        data: { ...entry.data, ...updates },
        timestamp: now,
        expiresAt: now + CACHE_TTL,
      });
    }
    
    // Update in pages too
    for (const [page, pageEntry] of cacheRef.current.listingsPage.entries()) {
      const idx = pageEntry.data.findIndex(l => l.id === id);
      if (idx !== -1) {
        const updated = [...pageEntry.data];
        updated[idx] = { ...updated[idx], ...updates };
        cacheRef.current.listingsPage.set(page, {
          ...pageEntry,
          data: updated,
        });
      }
    }
  }, []);

  // Cleanup expired entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      
      // Cleanup expired listings
      for (const [id, entry] of cacheRef.current.listings.entries()) {
        if (now > entry.expiresAt + STALE_TTL) {
          cacheRef.current.listings.delete(id);
        }
      }
      
      // Cleanup expired pages
      for (const [page, entry] of cacheRef.current.listingsPage.entries()) {
        if (now > entry.expiresAt + STALE_TTL) {
          cacheRef.current.listingsPage.delete(page);
        }
      }
    };

    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, []);

  return {
    getCachedListing,
    cacheListing,
    cacheListingsPage,
    getCachedPage,
    isCacheFresh,
    isCacheStale,
    getAllCachedListings,
    cacheTotalCount,
    getCachedTotalCount,
    invalidateListing,
    clearCache,
    updateCachedListing,
  };
}
