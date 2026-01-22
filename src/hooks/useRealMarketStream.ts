/**
 * Real Market Data Stream Hook
 * v7.51-REAL: 100% real data from Multi-Broker Aggregator
 * NO SIMULATED DATA - Only authentic market feeds
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { crossMarketEngine, type MarketTick, type AssetClass, type BigPictureState, type MarketSnapshot } from '@/lib/pensent-core/domains/finance/crossMarketEngine';
import { multiBrokerAdapter } from '@/lib/pensent-core/domains/universal/adapters/multiBrokerAdapter';

export interface RealMarketConfig {
  symbol: string;
  assetClass: AssetClass;
  pollInterval: number; // How often to fetch real data (ms)
}

const DEFAULT_REAL_MARKETS: RealMarketConfig[] = [
  { symbol: 'SPY', assetClass: 'equity', pollInterval: 2000 },
  { symbol: 'QQQ', assetClass: 'equity', pollInterval: 2000 },
  { symbol: 'TLT', assetClass: 'bond', pollInterval: 5000 },
  { symbol: 'GLD', assetClass: 'commodity', pollInterval: 3000 },
  { symbol: 'BTCUSD', assetClass: 'crypto', pollInterval: 1000 },
  { symbol: 'ETHUSD', assetClass: 'crypto', pollInterval: 1000 },
];

export interface RealMarketState {
  connected: boolean;
  markets: RealMarketConfig[];
  snapshot: MarketSnapshot;
  bigPicture: BigPictureState;
  ticksPerSecond: number;
  realDataSources: string[];
  consensusConfidence: number;
  dataQuality: 'real' | 'stale' | 'disconnected';
  lastRealTick: number;
  failedFetches: number;
  successfulFetches: number;
}

export function useRealMarketStream(markets: RealMarketConfig[] = DEFAULT_REAL_MARKETS) {
  const [state, setState] = useState<RealMarketState>({
    connected: false,
    markets,
    snapshot: {
      equity: null,
      bond: null,
      future: null,
      commodity: null,
      forex: null,
      crypto: null
    },
    bigPicture: crossMarketEngine.getState(),
    ticksPerSecond: 0,
    realDataSources: [],
    consensusConfidence: 0,
    dataQuality: 'disconnected',
    lastRealTick: 0,
    failedFetches: 0,
    successfulFetches: 0
  });

  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const tickCountRef = useRef(0);
  const tpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const isStartedRef = useRef(false);
  const pricesRef = useRef<Map<string, number>>(new Map());

  // Convert asset class to multi-broker format
  const assetClassToBrokerType = (assetClass: AssetClass): 'stock' | 'forex' | 'crypto' => {
    switch (assetClass) {
      case 'crypto': return 'crypto';
      case 'forex': return 'forex';
      default: return 'stock';
    }
  };

  // Fetch ONLY real data - no fallbacks
  const fetchRealData = useCallback(async (market: RealMarketConfig): Promise<MarketTick | null> => {
    try {
      const brokerType = assetClassToBrokerType(market.assetClass);
      const data = await multiBrokerAdapter.fetchAggregatedData(market.symbol, brokerType);
      
      if (!data || !data.consensus.price || data.sources.length === 0) {
        console.warn(`[RealMarketStream] No real data for ${market.symbol}`);
        setState(prev => ({
          ...prev,
          failedFetches: prev.failedFetches + 1,
          dataQuality: Date.now() - prev.lastRealTick > 30000 ? 'stale' : prev.dataQuality
        }));
        return null;
      }

      const previousPrice = pricesRef.current.get(market.symbol) || data.consensus.price;
      const change = data.consensus.price - previousPrice;
      const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

      pricesRef.current.set(market.symbol, data.consensus.price);

      const tick: MarketTick = {
        symbol: market.symbol,
        assetClass: market.assetClass,
        price: data.consensus.price,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 10000) / 10000,
        volume: data.ticks.reduce((sum, t) => sum + (t.volume || 0), 0),
        timestamp: data.timestamp
      };

      // Update state with real data confirmation
      setState(prev => ({
        ...prev,
        realDataSources: data.sources,
        consensusConfidence: data.consensus.confidence,
        dataQuality: 'real',
        lastRealTick: Date.now(),
        successfulFetches: prev.successfulFetches + 1
      }));

      return tick;
    } catch (error) {
      console.error(`[RealMarketStream] Failed to fetch ${market.symbol}:`, error);
      setState(prev => ({
        ...prev,
        failedFetches: prev.failedFetches + 1
      }));
      return null;
    }
  }, []);

  const startStreams = useCallback(() => {
    if (isStartedRef.current) return;
    
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    console.log('[RealMarketStream] Starting REAL-ONLY data streams (no simulation)...');
    isStartedRef.current = true;

    // Initialize multi-broker adapter
    multiBrokerAdapter.initialize();

    // Initial fetch for all markets
    const initializeRealData = async () => {
      console.log('[RealMarketStream] Fetching initial real data...');
      let hasData = false;
      
      for (const market of markets) {
        const tick = await fetchRealData(market);
        if (tick && mountedRef.current) {
          hasData = true;
          tickCountRef.current++;
          crossMarketEngine.processTick(tick);
        }
      }
      
      if (mountedRef.current) {
        const initialSnapshot = crossMarketEngine.getSnapshot();
        const initialBigPicture = crossMarketEngine.getState();
        setState(prev => ({
          ...prev,
          connected: hasData,
          snapshot: initialSnapshot,
          bigPicture: initialBigPicture
        }));
      }
    };

    initializeRealData();

    // Set up polling for each market at their specific intervals
    markets.forEach(market => {
      const interval = setInterval(async () => {
        if (!mountedRef.current) return;
        
        const tick = await fetchRealData(market);
        if (tick) {
          tickCountRef.current++;
          const bigPicture = crossMarketEngine.processTick(tick);
          const snapshot = crossMarketEngine.getSnapshot();
          
          setState(prev => ({
            ...prev,
            connected: true,
            snapshot,
            bigPicture
          }));
        }
      }, market.pollInterval);
      
      intervalsRef.current.push(interval);
    });

    console.log('[RealMarketStream] Real-only streams started');
  }, [markets, fetchRealData]);

  // Track TPS
  useEffect(() => {
    tpsIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          ticksPerSecond: tickCountRef.current
        }));
        tickCountRef.current = 0;
      }
    }, 1000);

    return () => {
      if (tpsIntervalRef.current) {
        clearInterval(tpsIntervalRef.current);
      }
    };
  }, []);

  // Start streams on mount
  useEffect(() => {
    mountedRef.current = true;
    
    const startTimer = setTimeout(() => {
      startStreams();
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
      isStartedRef.current = false;
      setState(prev => ({ ...prev, connected: false, dataQuality: 'disconnected' }));
    };
  }, [startStreams]);

  const disconnect = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    isStartedRef.current = false;
    setState(prev => ({ ...prev, connected: false, dataQuality: 'disconnected' }));
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      isStartedRef.current = false;
      startStreams();
    }, 100);
  }, [disconnect, startStreams]);

  const getDataIntegrityScore = useCallback(() => {
    const { successfulFetches, failedFetches, lastRealTick } = state;
    const totalFetches = successfulFetches + failedFetches;
    if (totalFetches === 0) return 0;
    
    const successRate = successfulFetches / totalFetches;
    const freshnessScore = Math.max(0, 1 - (Date.now() - lastRealTick) / 60000);
    
    return Math.round((successRate * 0.7 + freshnessScore * 0.3) * 100);
  }, [state]);

  return {
    ...state,
    disconnect,
    reconnect,
    getDataIntegrityScore,
    isRealData: state.dataQuality === 'real' && state.realDataSources.length > 0
  };
}
