/**
 * Tick Data Stream Hook
 * v7.51-REAL: REAL DATA ONLY - No simulation fallbacks
 * Connects to multi-broker aggregator for authentic market data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Tick {
  price: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  source?: string; // Track data source for authenticity
  isReal: boolean; // v7.51: Must be true for valid data
}

export interface TickStreamConfig {
  symbol: string;
  mode: 'real' | 'websocket'; // v7.51: Removed 'demo' mode
  wsUrl?: string;
  apiKey?: string;
  pollInterval?: number; // How often to fetch real data (ms)
}

export interface TickStreamState {
  connected: boolean;
  ticks: Tick[];
  latestTick: Tick | null;
  ticksPerSecond: number;
  error: string | null;
  dataQuality: 'real' | 'stale' | 'disconnected';
  lastRealUpdate: number;
  sources: string[];
}

const DEFAULT_CONFIG: Partial<TickStreamConfig> = {
  pollInterval: 1500, // 1.5s default poll interval
  mode: 'real'
};

type TickListener = (tick: Tick) => void;

export function useTickDataStream(config: TickStreamConfig) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<TickStreamState>({
    connected: false,
    ticks: [],
    latestTick: null,
    ticksPerSecond: 0,
    error: null,
    dataQuality: 'disconnected',
    lastRealUpdate: 0,
    sources: []
  });
  
  const listenersRef = useRef<Set<TickListener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
  
  // Fetch real data from multi-broker edge function
  const fetchRealData = useCallback(async (): Promise<Tick | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-broker-data', {
        body: { 
          symbol: mergedConfig.symbol, 
          assetType: 'stock',
          action: 'aggregate' 
        },
      });

      if (error) {
        console.error('[TickStream] Edge function error:', error);
        setState(prev => ({ ...prev, error: error.message }));
        return null;
      }

      if (data?.success && data.data) {
        const aggregated = data.data;
        
        if (!aggregated.consensus?.price || aggregated.sources?.length === 0) {
          console.warn('[TickStream] No real data available for', mergedConfig.symbol);
          return null;
        }

        priceRef.current = aggregated.consensus.price;

        const tick: Tick = {
          price: aggregated.consensus.price,
          volume: aggregated.ticks?.reduce((sum: number, t: any) => sum + (t.volume || 0), 0) || 0,
          timestamp: aggregated.timestamp || Date.now(),
          bid: aggregated.ticks?.[0]?.bid,
          ask: aggregated.ticks?.[0]?.ask,
          source: aggregated.sources?.join(',') || 'unknown',
          isReal: true
        };

        setState(prev => ({
          ...prev,
          sources: aggregated.sources || [],
          dataQuality: 'real',
          lastRealUpdate: Date.now()
        }));

        return tick;
      }

      return null;
    } catch (err) {
      console.error('[TickStream] Fetch error:', err);
      setState(prev => ({ ...prev, error: String(err) }));
      return null;
    }
  }, [mergedConfig.symbol]);
  
  // Start real data polling mode
  const startRealMode = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    console.log('[TickStream] Starting REAL data mode for', mergedConfig.symbol);
    
    // Initialize price based on symbol
    const symbolPrices: Record<string, number> = {
      'SPY': 580, 'QQQ': 500, 'AAPL': 230, 'NVDA': 140,
      'TSLA': 380, 'MSFT': 450, 'AMD': 125, 'GOOGL': 195
    };
    priceRef.current = symbolPrices[mergedConfig.symbol] || 100;
    
    // Fetch first tick immediately
    const fetchFirst = async () => {
      const tick = await fetchRealData();
      if (tick && mountedRef.current) {
        processTick(tick);
        setState(prev => ({ ...prev, connected: true, error: null }));
      }
    };
    fetchFirst();
    
    // Continue polling for real data
    const interval = mergedConfig.pollInterval || 1500;
    pollIntervalRef.current = setInterval(async () => {
      if (mountedRef.current) {
        const tick = await fetchRealData();
        if (tick) {
          processTick(tick);
        }
      }
    }, interval);
    
    isStartedRef.current = true;
    console.log('[TickStream] Real data mode started with poll interval:', interval, 'ms');
  }, [mergedConfig.symbol, mergedConfig.pollInterval, fetchRealData, processTick]);
  
  // Connect WebSocket (with real data fallback, not demo)
  const connectWebSocket = useCallback(() => {
    if (!mergedConfig.wsUrl) {
      console.warn('[TickStream] No WebSocket URL provided, using real data polling');
      startRealMode();
      return;
    }
    
    try {
      wsRef.current = new WebSocket(mergedConfig.wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[TickStream] WebSocket connected');
        setState(prev => ({ ...prev, connected: true, error: null, dataQuality: 'real' }));
        
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
              ask: data.ask,
              source: 'websocket',
              isReal: true
            });
          }
        } catch (e) {
          console.error('[TickStream] Parse error:', e);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[TickStream] WebSocket error, falling back to real data polling:', error);
        setState(prev => ({ ...prev, error: 'WebSocket error, using real data polling' }));
        startRealMode();
      };
      
      wsRef.current.onclose = () => {
        console.log('[TickStream] WebSocket closed');
        if (mountedRef.current && !pollIntervalRef.current) {
          // Fallback to real data polling (not demo)
          startRealMode();
        }
      };
    } catch (error) {
      console.error('[TickStream] Failed to create WebSocket:', error);
      startRealMode();
    }
  }, [mergedConfig.wsUrl, mergedConfig.symbol, mergedConfig.apiKey, processTick, startRealMode]);
  
  // Disconnect
  const disconnect = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isStartedRef.current = false;
    setState(prev => ({ ...prev, connected: false, dataQuality: 'disconnected' }));
  }, []);
  
  // Reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      if (mergedConfig.mode === 'websocket') {
        connectWebSocket();
      } else {
        startRealMode();
      }
    }, 100);
  }, [disconnect, mergedConfig.mode, connectWebSocket, startRealMode]);
  
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
        startRealMode(); // v7.51: Always real data, never demo
      }
    }, 50);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      disconnect();
    };
  }, [mergedConfig.mode, connectWebSocket, startRealMode, disconnect]);
  
  return {
    ...state,
    addTickListener,
    disconnect,
    reconnect,
    isRealData: state.dataQuality === 'real' && state.sources.length > 0
  };
}
