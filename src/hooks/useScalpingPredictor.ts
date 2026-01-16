/**
 * Scalping Predictor Hook
 * Integrates tick stream with prediction engine and heartbeat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveHeartbeat } from './useLiveHeartbeat';
import { useTickDataStream, type TickStreamConfig } from './useTickDataStream';
import { 
  TickPredictionEngine,
  type Tick,
  type TickPrediction,
  type LearningState
} from '@/lib/pensent-core/domains/finance/tickPredictionEngine';

export interface ScalpingConfig extends TickStreamConfig {
  predictionIntervalMs: number; // How often to generate new predictions
  autoPredict: boolean;
}

export interface ScalpingState {
  // Engine state
  learningState: LearningState;
  
  // Current prediction
  currentPrediction: TickPrediction | null;
  
  // Recent predictions
  pendingPredictions: TickPrediction[];
  recentPredictions: TickPrediction[];
  
  // Stats
  stats: {
    totalPredictions: number;
    accuracy: number;
    recentAccuracy: number;
    currentStreak: number;
    bestStreak: number;
    upPredictions: { total: number; correct: number; accuracy: number };
    downPredictions: { total: number; correct: number; accuracy: number };
    flatPredictions: { total: number; correct: number; accuracy: number };
  };
  
  // Stream info
  tickCount: number;
  latestPrice: number | null;
  priceChange: number;
  priceChangePercent: number;
}

const DEFAULT_LEARNING_STATE: LearningState = {
  totalPredictions: 0,
  correctPredictions: 0,
  accuracy: 0,
  streak: 0,
  bestStreak: 0,
  recentAccuracy: 0,
  confidenceMultiplier: 1.0,
  adaptiveHorizonMs: 5000,
  volatilityState: 'medium',
  momentumBias: 0,
  lastUpdate: Date.now(),
  multiLevel: {
    direction: { correct: 0, total: 0, accuracy: 0 },
    magnitude: { avgScore: 0, samples: 0 },
    timing: { avgScore: 0, samples: 0 },
    confidenceCalibration: { predicted: 0, actual: 0, calibrationError: 0 },
    composite: { avgScore: 0, trend: 0 }
  }
};

export function useScalpingPredictor(config: ScalpingConfig) {
  const engineRef = useRef<TickPredictionEngine>(new TickPredictionEngine());
  const startPriceRef = useRef<number | null>(null);
  
  const [scalpingState, setScalpingState] = useState<ScalpingState>({
    learningState: DEFAULT_LEARNING_STATE,
    currentPrediction: null,
    pendingPredictions: [],
    recentPredictions: [],
    stats: {
      totalPredictions: 0,
      accuracy: 0,
      recentAccuracy: 0,
      currentStreak: 0,
      bestStreak: 0,
      upPredictions: { total: 0, correct: 0, accuracy: 0 },
      downPredictions: { total: 0, correct: 0, accuracy: 0 },
      flatPredictions: { total: 0, correct: 0, accuracy: 0 }
    },
    tickCount: 0,
    latestPrice: null,
    priceChange: 0,
    priceChangePercent: 0
  });
  
  // Connect to tick stream
  const tickStream = useTickDataStream({
    symbol: config.symbol,
    mode: config.mode,
    wsUrl: config.wsUrl,
    apiKey: config.apiKey,
    demoVolatility: config.demoVolatility,
    demoInterval: config.demoInterval
  });
  
  // Process incoming ticks
  useEffect(() => {
    const unsubscribe = tickStream.addTickListener((tick: Tick) => {
      engineRef.current.processTick(tick);
      
      // Track starting price for session stats
      if (startPriceRef.current === null) {
        startPriceRef.current = tick.price;
      }
      
      const priceChange = tick.price - (startPriceRef.current || tick.price);
      const priceChangePercent = startPriceRef.current 
        ? ((tick.price - startPriceRef.current) / startPriceRef.current) * 100 
        : 0;
      
      // Update state with latest engine data
      setScalpingState(prev => ({
        ...prev,
        learningState: engineRef.current.getState(),
        pendingPredictions: engineRef.current.getPendingPredictions(),
        recentPredictions: engineRef.current.getRecentPredictions(20),
        stats: engineRef.current.getStats(),
        tickCount: engineRef.current.getTickCount(),
        latestPrice: tick.price,
        priceChange,
        priceChangePercent
      }));
    });
    
    return unsubscribe;
  }, [tickStream]);
  
  // Generate prediction
  const generatePrediction = useCallback((horizonMs?: number) => {
    const prediction = engineRef.current.generatePrediction(horizonMs);
    if (prediction) {
      setScalpingState(prev => ({
        ...prev,
        currentPrediction: prediction,
        pendingPredictions: engineRef.current.getPendingPredictions()
      }));
    }
    return prediction;
  }, []);
  
  // Heartbeat for auto-predictions
  const { isAlive, pulse, start, stop, restart, pulseCount, nextPulseIn, isProcessing, lastPulse } = useLiveHeartbeat({
    interval: config.predictionIntervalMs,
    autoStart: config.autoPredict,
    enabled: config.autoPredict,
    onPulse: () => {
      if (config.autoPredict && tickStream.connected) {
        generatePrediction();
      }
    }
  });
  
  // Reset engine
  const reset = useCallback(() => {
    engineRef.current.reset();
    startPriceRef.current = null;
    setScalpingState({
      learningState: DEFAULT_LEARNING_STATE,
      currentPrediction: null,
      pendingPredictions: [],
      recentPredictions: [],
      stats: {
        totalPredictions: 0,
        accuracy: 0,
        recentAccuracy: 0,
        currentStreak: 0,
        bestStreak: 0,
        upPredictions: { total: 0, correct: 0, accuracy: 0 },
        downPredictions: { total: 0, correct: 0, accuracy: 0 },
        flatPredictions: { total: 0, correct: 0, accuracy: 0 }
      },
      tickCount: 0,
      latestPrice: null,
      priceChange: 0,
      priceChangePercent: 0
    });
  }, []);
  
  return {
    // State
    ...scalpingState,
    
    // Stream state
    connected: tickStream.connected,
    ticksPerSecond: tickStream.ticksPerSecond,
    streamError: tickStream.error,
    
    // Heartbeat state
    heartbeatAlive: isAlive,
    isProcessing,
    lastPulse,
    pulseCount,
    nextPulseIn,
    
    // Actions
    generatePrediction,
    reset,
    startHeartbeat: start,
    stopHeartbeat: stop,
    restartHeartbeat: restart,
    manualPulse: pulse,
    disconnect: tickStream.disconnect,
    reconnect: tickStream.reconnect
  };
}
