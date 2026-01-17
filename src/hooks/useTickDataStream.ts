/**
 * Tick Data Stream Hook
 * Provides real-time tick data from WebSocket or simulated demo mode
 * BULLETPROOF VERSION - Works in all market conditions
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Tick {
  price: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
}

export interface TickStreamConfig {
  symbol: string;
  mode: 'demo' | 'websocket';
  wsUrl?: string;
  apiKey?: string;
  demoVolatility?: number;
  demoInterval?: number;
}

export interface TickStreamState {
  connected: boolean;
  ticks: Tick[];
  latestTick: Tick | null;
  ticksPerSecond: number;
  error: string | null;
}

const DEFAULT_CONFIG: Partial<TickStreamConfig> = {
  demoVolatility: 0.0012,
  demoInterval: 150
};

type TickListener = (tick: Tick) => void;

export function useTickDataStream(config: TickStreamConfig) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<TickStreamState>({
    connected: false,
    ticks: [],
    latestTick: null,
    ticksPerSecond: 0,
    error: null
  });
  
  const listenersRef = useRef<Set<TickListener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickCountRef = useRef(0);
  const tpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceRef = useRef<number>(100);
  const isStartedRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Add tick listener
  const addTickListener = useCallback((callback: TickListener) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);
  
  // Process a new tick
  const processTick = useCallback((tick: Tick) => {
    if (!mountedRef.current) return;
    
    tickCountRef.current++;
    
    setState(prev => {
      const newTicks = [...prev.ticks, tick].slice(-200);
      return {
        ...prev,
        ticks: newTicks,
        latestTick: tick,
        connected: true,
        error: null
      };
    });
    
    // Notify all listeners
    listenersRef.current.forEach(listener => {
      try {
        listener(tick);
      } catch (e) {
        console.error('[TickStream] Listener error:', e);
      }
    });
  }, []);
  
  // Generate demo tick with realistic price movement
  const generateDemoTick = useCallback((): Tick => {
    const volatility = mergedConfig.demoVolatility || 0.0012;
    
    // Random walk with mean reversion
    const randomMove = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (100 - priceRef.current) * 0.0001; // Pull back to 100
    
    // Occasional larger moves (momentum)
    const momentumFactor = Math.random() > 0.95 ? (Math.random() - 0.5) * volatility * 3 : 0;
    
    priceRef.current = priceRef.current * (1 + randomMove + meanReversion + momentumFactor);
    priceRef.current = Math.max(50, Math.min(200, priceRef.current)); // Keep in reasonable range
    
    return {
      price: Math.round(priceRef.current * 100) / 100,
      volume: Math.round(1000 + Math.random() * 5000),
      timestamp: Date.now(),
      bid: Math.round((priceRef.current - 0.01) * 100) / 100,
      ask: Math.round((priceRef.current + 0.01) * 100) / 100
    };
  }, [mergedConfig.demoVolatility]);
  
  // Start demo mode
  const startDemoMode = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
    
    console.log('[TickStream] Starting demo mode for', mergedConfig.symbol);
    
    // Initialize price based on symbol
    const symbolPrices: Record<string, number> = {
      'SPY': 450, 'QQQ': 380, 'AAPL': 175, 'NVDA': 480,
      'TSLA': 250, 'MSFT': 380, 'AMD': 130, 'GOOGL': 140
    };
    priceRef.current = symbolPrices[mergedConfig.symbol] || 100;
    
    // Generate first tick immediately
    const firstTick = generateDemoTick();
    processTick(firstTick);
    
    // Set connected state
    setState(prev => ({ ...prev, connected: true, error: null }));
    
    // Continue generating ticks
    const interval = mergedConfig.demoInterval || 150;
    demoIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        const tick = generateDemoTick();
        processTick(tick);
      }
    }, interval);
    
    isStartedRef.current = true;
    console.log('[TickStream] Demo mode started with interval:', interval);
  }, [mergedConfig.symbol, mergedConfig.demoInterval, generateDemoTick, processTick]);
  
  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!mergedConfig.wsUrl) {
      console.warn('[TickStream] No WebSocket URL provided, falling back to demo');
      startDemoMode();
      return;
    }
    
    try {
      wsRef.current = new WebSocket(mergedConfig.wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[TickStream] WebSocket connected');
        setState(prev => ({ ...prev, connected: true, error: null }));
        
        // Subscribe to symbol
        if (wsRef.current && mergedConfig.apiKey) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            symbol: mergedConfig.symbol,
            apiKey: mergedConfig.apiKey
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.price) {
            processTick({
              price: data.price,
              volume: data.volume || 1000,
              timestamp: data.timestamp || Date.now(),
              bid: data.bid,
              ask: data.ask
            });
          }
        } catch (e) {
          console.error('[TickStream] Parse error:', e);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[TickStream] WebSocket error, falling back to demo:', error);
        setState(prev => ({ ...prev, error: 'WebSocket error, using demo mode' }));
        startDemoMode();
      };
      
      wsRef.current.onclose = () => {
        console.log('[TickStream] WebSocket closed');
        if (mountedRef.current && !demoIntervalRef.current) {
          // Fallback to demo mode
          startDemoMode();
        }
      };
    } catch (error) {
      console.error('[TickStream] Failed to create WebSocket:', error);
      startDemoMode();
    }
  }, [mergedConfig.wsUrl, mergedConfig.symbol, mergedConfig.apiKey, processTick, startDemoMode]);
  
  // Disconnect
  const disconnect = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isStartedRef.current = false;
    setState(prev => ({ ...prev, connected: false }));
  }, []);
  
  // Reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      if (mergedConfig.mode === 'websocket') {
        connectWebSocket();
      } else {
        startDemoMode();
      }
    }, 100);
  }, [disconnect, mergedConfig.mode, connectWebSocket, startDemoMode]);
  
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
  
  // Start stream on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Small delay to ensure component is fully mounted
    const startTimer = setTimeout(() => {
      if (mergedConfig.mode === 'websocket') {
        connectWebSocket();
      } else {
        startDemoMode();
      }
    }, 50);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      disconnect();
    };
  }, [mergedConfig.mode, connectWebSocket, startDemoMode, disconnect]);
  
  return {
    ...state,
    addTickListener,
    disconnect,
    reconnect
  };
}
