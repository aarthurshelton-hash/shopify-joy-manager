/**
 * Real-Time Tick Data Stream Hook
 * Connects to WebSocket market data or simulates ticks for testing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Tick } from '@/lib/pensent-core/domains/finance/tickPredictionEngine';

export interface TickStreamConfig {
  symbol: string;
  mode: 'demo' | 'websocket';
  wsUrl?: string;
  apiKey?: string;
  demoVolatility?: number; // 0.001 = 0.1% per tick
  demoInterval?: number;   // ms between demo ticks
}

export interface TickStreamState {
  connected: boolean;
  ticks: Tick[];
  latestTick: Tick | null;
  ticksPerSecond: number;
  error: string | null;
}

export function useTickDataStream(config: TickStreamConfig) {
  const [state, setState] = useState<TickStreamState>({
    connected: false,
    ticks: [],
    latestTick: null,
    ticksPerSecond: 0,
    error: null
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickCountRef = useRef(0);
  const tpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef(100); // Starting demo price
  const onTickCallbacksRef = useRef<((tick: Tick) => void)[]>([]);
  
  const addTickListener = useCallback((callback: (tick: Tick) => void) => {
    onTickCallbacksRef.current.push(callback);
    return () => {
      onTickCallbacksRef.current = onTickCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);
  
  const processTick = useCallback((tick: Tick) => {
    tickCountRef.current++;
    
    setState(prev => {
      const newTicks = [...prev.ticks, tick].slice(-500);
      return {
        ...prev,
        ticks: newTicks,
        latestTick: tick
      };
    });
    
    // Notify all listeners
    onTickCallbacksRef.current.forEach(cb => cb(tick));
  }, []);
  
  // Demo mode tick generator
  const startDemoMode = useCallback(() => {
    // Clear any existing interval first
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    
    const volatility = config.demoVolatility || 0.0015;
    const interval = config.demoInterval || 200; // 5 ticks per second default
    
    // Initialize with symbol-based pricing
    const basePrices: Record<string, number> = {
      'SPY': 450,
      'AAPL': 175,
      'NVDA': 480,
      'TSLA': 250,
      'GOOGL': 140,
      'MSFT': 400,
      'QQQ': 380,
      'AMD': 130
    };
    lastPriceRef.current = basePrices[config.symbol] || 100;
    
    console.log('[TickStream] Starting demo mode for', config.symbol, 'at interval', interval);
    
    // Generate first tick immediately
    const generateAndProcessTick = () => {
      try {
        // Generate realistic price movement
        const randomWalk = (Math.random() - 0.5) * 2 * volatility;
        const momentum = Math.sin(Date.now() / 10000) * volatility * 0.3; // Slight trend
        const spike = Math.random() > 0.98 ? (Math.random() - 0.5) * volatility * 5 : 0; // Occasional spikes
        
        const priceChange = randomWalk + momentum + spike;
        const newPrice = lastPriceRef.current * (1 + priceChange);
        lastPriceRef.current = newPrice;
        
        // Generate volume (higher on big moves)
        const baseVolume = 1000 + Math.random() * 5000;
        const volumeMultiplier = 1 + Math.abs(priceChange) * 100;
        
        const tick: Tick = {
          price: Math.round(newPrice * 100) / 100,
          volume: Math.round(baseVolume * volumeMultiplier),
          timestamp: Date.now(),
          bid: Math.round((newPrice - 0.01) * 100) / 100,
          ask: Math.round((newPrice + 0.01) * 100) / 100
        };
        
        processTick(tick);
      } catch (error) {
        console.error('[TickStream] Error generating tick:', error);
      }
    };
    
    // Generate first tick immediately
    generateAndProcessTick();
    
    demoIntervalRef.current = setInterval(generateAndProcessTick, interval);
    
    setState(prev => ({ ...prev, connected: true, error: null }));
    console.log('[TickStream] Demo mode started successfully');
  }, [config.symbol, config.demoVolatility, config.demoInterval, processTick]);
  
  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!config.wsUrl) {
      setState(prev => ({ ...prev, error: 'No WebSocket URL provided' }));
      return;
    }
    
    try {
      const ws = new WebSocket(config.wsUrl);
      
      ws.onopen = () => {
        console.log('[TickStream] WebSocket connected');
        setState(prev => ({ ...prev, connected: true, error: null }));
        
        // Send subscription message (format depends on provider)
        ws.send(JSON.stringify({
          action: 'subscribe',
          symbol: config.symbol,
          apiKey: config.apiKey
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different data formats from various providers
          let tick: Tick | null = null;
          
          if (data.price !== undefined) {
            // Direct format
            tick = {
              price: data.price,
              volume: data.volume || data.size || 0,
              timestamp: data.timestamp || Date.now(),
              bid: data.bid,
              ask: data.ask
            };
          } else if (data.p !== undefined) {
            // Compact format (common in some APIs)
            tick = {
              price: data.p,
              volume: data.v || data.s || 0,
              timestamp: data.t || Date.now(),
              bid: data.b,
              ask: data.a
            };
          } else if (data.type === 'trade' && data.data) {
            // Nested format
            tick = {
              price: data.data.price || data.data.p,
              volume: data.data.volume || data.data.v || 0,
              timestamp: data.data.timestamp || data.data.t || Date.now()
            };
          }
          
          if (tick && tick.price) {
            processTick(tick);
          }
        } catch (e) {
          console.warn('[TickStream] Failed to parse message:', e);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[TickStream] WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'WebSocket connection error' }));
      };
      
      ws.onclose = () => {
        console.log('[TickStream] WebSocket closed');
        setState(prev => ({ ...prev, connected: false }));
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (config.mode === 'websocket') {
            connectWebSocket();
          }
        }, 3000);
      };
      
      wsRef.current = ws;
    } catch (e) {
      console.error('[TickStream] Failed to connect:', e);
      setState(prev => ({ ...prev, error: 'Failed to establish connection' }));
    }
  }, [config.wsUrl, config.symbol, config.apiKey, config.mode, processTick]);
  
  // Track ticks per second
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
  
  // Start/stop stream based on mode
  useEffect(() => {
    if (config.mode === 'demo') {
      startDemoMode();
    } else if (config.mode === 'websocket') {
      connectWebSocket();
    }
    
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setState(prev => ({ ...prev, connected: false }));
    };
  }, [config.mode, config.symbol, startDemoMode, connectWebSocket]);
  
  const disconnect = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false }));
  }, []);
  
  const reconnect = useCallback(() => {
    disconnect();
    if (config.mode === 'demo') {
      startDemoMode();
    } else {
      connectWebSocket();
    }
  }, [config.mode, disconnect, startDemoMode, connectWebSocket]);
  
  return {
    ...state,
    addTickListener,
    disconnect,
    reconnect
  };
}
