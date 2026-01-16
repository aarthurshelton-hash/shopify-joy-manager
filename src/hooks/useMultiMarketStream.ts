/**
 * Multi-Market Data Stream Hook
 * Connects to multiple asset class feeds simultaneously
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { crossMarketEngine, type MarketTick, type AssetClass, type BigPictureState, type MarketSnapshot } from '@/lib/pensent-core/domains/finance/crossMarketEngine';

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
    symbol: 'DXY', 
    assetClass: 'forex', 
    basePrice: 104, 
    volatility: 0.0005,
    correlation: [{ with: 'commodity', factor: -0.4 }]
  },
  { 
    symbol: 'BTC', 
    assetClass: 'crypto', 
    basePrice: 42000, 
    volatility: 0.002,
    correlation: [{ with: 'equity', factor: 0.6 }]
  }
];

export interface MultiMarketState {
  connected: boolean;
  markets: MarketConfig[];
  snapshot: MarketSnapshot;
  bigPicture: BigPictureState;
  ticksPerSecond: number;
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
    ticksPerSecond: 0
  });

  const pricesRef = useRef<Map<AssetClass, number>>(new Map());
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const tickCountRef = useRef(0);
  const tpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize prices
  useEffect(() => {
    markets.forEach(m => {
      pricesRef.current.set(m.assetClass, m.basePrice);
    });
  }, [markets]);

  const generateTick = useCallback((market: MarketConfig, sharedMomentum: number): MarketTick => {
    const currentPrice = pricesRef.current.get(market.assetClass) || market.basePrice;
    
    // Base random walk
    let priceChange = (Math.random() - 0.5) * 2 * market.volatility;
    
    // Add shared market momentum (all markets somewhat correlated during big moves)
    priceChange += sharedMomentum * 0.3;
    
    // Add correlation effects
    if (market.correlation) {
      market.correlation.forEach(corr => {
        const correlatedPrice = pricesRef.current.get(corr.with);
        if (correlatedPrice) {
          // Add correlated movement
          const correlatedChange = (Math.random() - 0.5) * market.volatility * corr.factor;
          priceChange += correlatedChange;
        }
      });
    }
    
    // Occasional spikes
    if (Math.random() > 0.98) {
      priceChange += (Math.random() - 0.5) * market.volatility * 5;
    }
    
    const newPrice = currentPrice * (1 + priceChange);
    pricesRef.current.set(market.assetClass, newPrice);
    
    const change = newPrice - currentPrice;
    const changePercent = (change / currentPrice) * 100;
    
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
    // Clear any existing intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Shared momentum for market-wide moves
    let sharedMomentum = 0;

    // Update shared momentum periodically
    const momentumInterval = setInterval(() => {
      // Momentum mean-reverts but can spike
      sharedMomentum = sharedMomentum * 0.95 + (Math.random() - 0.5) * 0.002;
      if (Math.random() > 0.99) {
        sharedMomentum += (Math.random() - 0.5) * 0.01; // Occasional market-wide shock
      }
    }, 500);
    intervalsRef.current.push(momentumInterval);

    // Create intervals for each market with different frequencies
    const frequencies: Record<AssetClass, number> = {
      equity: 150,    // Fast - main focus
      future: 100,    // Fastest - leads
      bond: 300,      // Slower
      commodity: 250, // Medium
      forex: 200,     // Medium
      crypto: 180     // Fast
    };

    markets.forEach(market => {
      const interval = setInterval(() => {
        const tick = generateTick(market, sharedMomentum);
        tickCountRef.current++;
        
        // Process through cross-market engine
        const bigPicture = crossMarketEngine.processTick(tick);
        const snapshot = crossMarketEngine.getSnapshot();
        
        setState(prev => ({
          ...prev,
          snapshot,
          bigPicture
        }));
      }, frequencies[market.assetClass] || 200);
      
      intervalsRef.current.push(interval);
    });

    setState(prev => ({ ...prev, connected: true }));
  }, [markets, generateTick]);

  // Track TPS
  useEffect(() => {
    tpsIntervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        ticksPerSecond: tickCountRef.current
      }));
      tickCountRef.current = 0;
    }, 1000);

    return () => {
      if (tpsIntervalRef.current) {
        clearInterval(tpsIntervalRef.current);
      }
    };
  }, []);

  // Start streams on mount
  useEffect(() => {
    startStreams();

    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
      setState(prev => ({ ...prev, connected: false }));
    };
  }, [startStreams]);

  const disconnect = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    setState(prev => ({ ...prev, connected: false }));
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    startStreams();
  }, [disconnect, startStreams]);

  return {
    ...state,
    disconnect,
    reconnect
  };
}
