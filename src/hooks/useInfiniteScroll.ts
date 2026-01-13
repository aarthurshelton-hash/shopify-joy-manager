import { useState, useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, limit: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total: number;
    error: Error | null;
  }>;
  limit?: number;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  limit = 20,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Initial load
  const loadInitial = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    const result = await fetchFn(1, limit);
    
    if (result.error) {
      setError(result.error);
    } else {
      setItems(result.data);
      setHasMore(result.hasMore);
      setTotal(result.total);
    }
    
    setPage(1);
    setIsLoading(false);
  }, [fetchFn, limit, enabled]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoadingMore(true);
    
    const nextPage = page + 1;
    const result = await fetchFn(nextPage, limit);
    
    if (result.error) {
      setError(result.error);
    } else {
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(nextPage);
    }
    
    setIsLoadingMore(false);
    loadingRef.current = false;
  }, [fetchFn, page, limit, hasMore, enabled]);

  // Refresh
  const refresh = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  // Initial load on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Sentinel ref for intersection observer
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { 
        rootMargin: '200px',
        threshold: 0.1 
      }
    );

    observerRef.current.observe(node);
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    error,
    loadMore,
    refresh,
    sentinelRef,
  };
}
