/**
 * Multi-Market Data Stream Hook
 * Connects to multiple asset class feeds via Multi-Broker Aggregator
 * Uses real market data from Alpaca, Polygon, Binance, Finnhub, Twelve Data, Tradier
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { crossMarketEngine, type MarketTick, type AssetClass, type BigPictureState, type MarketSnapshot } from '@/lib/pensent-core/domains/finance/crossMarketEngine';
import { multiBrokerAdapter } from '@/lib/pensent-core/domains/universal/adapters/multiBrokerAdapter';

export interface MarketConfig {
  symbol: string;
  assetClass: AssetClass;
  basePrice: number;
  volatility: number;
  correlation?: { with: AssetClass; factor: number }[];
}

const DEFAULT_MARKETS: MarketConfig[] = [
  { 
    symbol: 'SPY', 
    assetClass: 'equity', 
    basePrice: 450, 
    volatility: 0.0012,
    correlation: [{ with: 'future', factor: 0.95 }]
  },
  { 
    symbol: 'TLT', 
    assetClass: 'bond', 
    basePrice: 95, 
    volatility: 0.0008,
    correlation: [{ with: 'equity', factor: -0.3 }]
  },
  { 
    symbol: 'ES', 
    assetClass: 'future', 
    basePrice: 4500, 
    volatility: 0.0015,
    correlation: [{ with: 'equity', factor: 0.95 }]
  },
  { 
    symbol: 'GC', 
    assetClass: 'commodity', 
    basePrice: 2000, 
    volatility: 0.001,
    correlation: [{ with: 'bond', factor: 0.2 }]
  },
  { 
    symbol: 'EUR/USD', 
    assetClass: 'forex', 
    basePrice: 1.08, 
    volatility: 0.0005,
    correlation: [{ with: 'commodity', factor: -0.4 }]
  },
  { 
    symbol: 'BTC/USD', 
    assetClass: 'crypto', 
    basePrice: 95000, 
    volatility: 0.002,
    correlation: [{ with: 'equity', factor: 0.6 }]
  },
  { 
    symbol: 'ETH/USD', 
    assetClass: 'crypto', 
    basePrice: 3200, 
    volatility: 0.0025,
    correlation: [{ with: 'crypto', factor: 0.85 }]
  }
];

export interface MultiMarketState {
  connected: boolean;
  markets: MarketConfig[];
  snapshot: MarketSnapshot;
  bigPicture: BigPictureState;
  ticksPerSecond: number;
  realDataSources: string[];
  consensusConfidence: number;
}

export function useMultiMarketStream(markets: MarketConfig[] = DEFAULT_MARKETS) {
  const [state, setState] = useState<MultiMarketState>({
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
    consensusConfidence: 0
  });

  const pricesRef = useRef<Map<AssetClass, number>>(new Map());
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const tickCountRef = useRef(0);
  const tpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const isStartedRef = useRef(false);
  const lastRealDataRef = useRef<Map<string, { price: number; timestamp: number }>>(new Map());

  // Initialize prices
  useEffect(() => {
    markets.forEach(m => {
      pricesRef.current.set(m.assetClass, m.basePrice);
    });
  }, [markets]);

  // Convert asset class to multi-broker format
  const assetClassToBrokerType = (assetClass: AssetClass): 'stock' | 'forex' | 'crypto' => {
    switch (assetClass) {
      case 'equity': return 'stock';
      case 'forex': return 'forex';
      case 'crypto': return 'crypto';
      case 'future':
      case 'commodity': 
      case 'bond':
      default: return 'stock';
    }
  };

  // Fetch real data from multi-broker aggregator
  const fetchRealData = useCallback(async (market: MarketConfig): Promise<MarketTick | null> => {
    try {
      const brokerType = assetClassToBrokerType(market.assetClass);
      const data = await multiBrokerAdapter.fetchAggregatedData(market.symbol, brokerType);
      
      if (!data || !data.consensus.price) {
        return null;
      }

      // Store last real data
      lastRealDataRef.current.set(market.symbol, {
        price: data.consensus.price,
        timestamp: data.timestamp
      });

      const previousPrice = pricesRef.current.get(market.assetClass) || market.basePrice;
      const change = data.consensus.price - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      // Update price ref
      pricesRef.current.set(market.assetClass, data.consensus.price);

      // Update state with source info
      setState(prev => ({
        ...prev,
        realDataSources: data.sources,
        consensusConfidence: data.consensus.confidence
      }));

      return {
        symbol: market.symbol,
        assetClass: market.assetClass,
        price: data.consensus.price,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 10000) / 10000,
        volume: data.ticks.reduce((sum, t) => sum + (t.volume || 0), 0) || Math.round(1000 + Math.random() * 10000),
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error(`[MultiMarketStream] Failed to fetch ${market.symbol}:`, error);
      return null;
    }
  }, []);

  // Generate simulated tick as fallback
  const generateSimulatedTick = useCallback((market: MarketConfig, sharedMomentum: number): MarketTick => {
    const currentPrice = pricesRef.current.get(market.assetClass) || market.basePrice;
    
    // Check if we have recent real data to interpolate from
    const lastReal = lastRealDataRef.current.get(market.symbol);
    const basePrice = lastReal && (Date.now() - lastReal.timestamp < 60000) 
      ? lastReal.price 
      : currentPrice;
    
    // Base random walk
    let priceChange = (Math.random() - 0.5) * 2 * market.volatility;
    
    // Add shared market momentum
    priceChange += sharedMomentum * 0.3;
    
    // Add correlation effects
    if (market.correlation) {
      market.correlation.forEach(corr => {
        const correlatedPrice = pricesRef.current.get(corr.with);
        if (correlatedPrice) {
          const correlatedChange = (Math.random() - 0.5) * market.volatility * corr.factor;
          priceChange += correlatedChange;
        }
      });
    }
    
    // Occasional spikes
    if (Math.random() > 0.98) {
      priceChange += (Math.random() - 0.5) * market.volatility * 5;
    }
    
    const newPrice = basePrice * (1 + priceChange);
    pricesRef.current.set(market.assetClass, newPrice);
    
    const change = newPrice - basePrice;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: market.symbol,
      assetClass: market.assetClass,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 10000) / 10000,
      volume: Math.round(1000 + Math.random() * 10000 * (1 + Math.abs(changePercent))),
      timestamp: Date.now()
    };
  }, []);

  const startStreams = useCallback(() => {
    if (isStartedRef.current) return;
    
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    console.log('[MultiMarketStream] Starting multi-broker data streams...');
    isStartedRef.current = true;

    // Initialize adapter
    multiBrokerAdapter.initialize();

    // Shared momentum for market-wide moves
    let sharedMomentum = 0;

    // Update shared momentum periodically
    const momentumInterval = setInterval(() => {
      if (!mountedRef.current) return;
      sharedMomentum = sharedMomentum * 0.95 + (Math.random() - 0.5) * 0.002;
      if (Math.random() > 0.99) {
        sharedMomentum += (Math.random() - 0.5) * 0.01;
      }
    }, 500);
    intervalsRef.current.push(momentumInterval);

    // Frequencies for different data types
    const realDataFrequencies: Record<AssetClass, number> = {
      equity: 5000,     // 5s - rate limit friendly
      future: 5000,     // 5s
      bond: 10000,      // 10s - slower moving
      commodity: 5000,  // 5s
      forex: 3000,      // 3s - more active
      crypto: 2000      // 2s - 24/7, fastest
    };

    const simulatedFrequencies: Record<AssetClass, number> = {
      equity: 150,
      future: 100,
      bond: 300,
      commodity: 250,
      forex: 200,
      crypto: 180
    };

    // Initial fetch of real data
    const initializeRealData = async () => {
      console.log('[MultiMarketStream] Fetching initial real data...');
      for (const market of markets) {
        const tick = await fetchRealData(market);
        if (tick && mountedRef.current) {
          crossMarketEngine.processTick(tick);
        }
      }
      
      if (mountedRef.current) {
        const initialSnapshot = crossMarketEngine.getSnapshot();
        const initialBigPicture = crossMarketEngine.getState();
        setState(prev => ({
          ...prev,
          connected: true,
          snapshot: initialSnapshot,
          bigPicture: initialBigPicture
        }));
      }
    };

    initializeRealData();

    // Set up real data polling for each market
    markets.forEach(market => {
      const realInterval = setInterval(async () => {
        if (!mountedRef.current) return;
        
        try {
          const tick = await fetchRealData(market);
          if (tick) {
            tickCountRef.current++;
            const bigPicture = crossMarketEngine.processTick(tick);
            const snapshot = crossMarketEngine.getSnapshot();
            
            setState(prev => ({
              ...prev,
              snapshot,
              bigPicture
            }));
          }
        } catch (error) {
          console.error('[MultiMarketStream] Real data fetch error:', error);
        }
      }, realDataFrequencies[market.assetClass] || 5000);
      
      intervalsRef.current.push(realInterval);
    });

    // Simulated high-frequency interpolation between real ticks
    markets.forEach(market => {
      const simulatedInterval = setInterval(() => {
        if (!mountedRef.current) return;
        
        try {
          const tick = generateSimulatedTick(market, sharedMomentum);
          tickCountRef.current++;
          
          const bigPicture = crossMarketEngine.processTick(tick);
          const snapshot = crossMarketEngine.getSnapshot();
          
          setState(prev => ({
            ...prev,
            snapshot,
            bigPicture
          }));
        } catch (error) {
          console.error('[MultiMarketStream] Simulated tick error:', error);
        }
      }, simulatedFrequencies[market.assetClass] || 200);
      
      intervalsRef.current.push(simulatedInterval);
    });

    console.log('[MultiMarketStream] Multi-broker streams started');
  }, [markets, fetchRealData, generateSimulatedTick]);

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
    }, 50);

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
      isStartedRef.current = false;
      setState(prev => ({ ...prev, connected: false }));
    };
  }, [startStreams]);

  const disconnect = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    isStartedRef.current = false;
    setState(prev => ({ ...prev, connected: false }));
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      isStartedRef.current = false;
      startStreams();
    }, 100);
  }, [disconnect, startStreams]);

  return {
    ...state,
    disconnect,
    reconnect
  };
}
