/**
 * Options Scalping Hook - React Integration
 * 
 * Provides real-time options prediction using UNIFIED trading session balance.
 * No separate portfolio - shares balance with stock trading.
 * 
 * @version 7.51-UNIFIED
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  optionsPredictionEngine, 
  optionsDataProvider,
  OptionsPrediction,
  OptionsSignal,
  OptionsChain,
  UnderlyingAnalysis,
  MarketContext,
  StrategyType,
  TimeframeType,
  SCALPING_UNDERLYINGS,
} from '@/lib/pensent-core/domains/options';
import { useTradingSessionStore } from '@/stores/tradingSessionStore';

const HOOK_VERSION = '7.51-UNIFIED';

interface OptionsScalpingState {
  isRunning: boolean;
  isConnected: boolean;
  selectedUnderlying: string;
  chain: OptionsChain | null;
  analysis: UnderlyingAnalysis | null;
  context: MarketContext | null;
  predictions: OptionsPrediction[];
  pendingPredictions: OptionsPrediction[];
  resolvedPredictions: OptionsPrediction[];
  signals: OptionsSignal[];
  accuracy: { total: number; correct: number; rate: number };
  evolution: { generation: number; fitness: number };
  error: string | null;
}

interface OptionsScalpingActions {
  start: () => void;
  stop: () => void;
  selectUnderlying: (symbol: string) => void;
  generatePrediction: (strategy?: StrategyType, timeframe?: TimeframeType) => Promise<OptionsPrediction | null>;
  resolvePredictions: () => Promise<void>;
  reset: () => void;
  // Unified balance from session store
  unifiedBalance: number;
  unifiedPnL: number;
  unifiedWinRate: number;
}

export function useOptionsScalping(): OptionsScalpingState & OptionsScalpingActions {
  // Use unified trading session store - no separate portfolio
  const { currentSession, globalAccuracy, openTrade, closeTrade, recordPrediction } = useTradingSessionStore();
  
  const [state, setState] = useState<OptionsScalpingState>({
    isRunning: false,
    isConnected: false,
    selectedUnderlying: 'SPY',
    chain: null,
    analysis: null,
    context: null,
    predictions: [],
    pendingPredictions: [],
    resolvedPredictions: [],
    signals: [],
    accuracy: { total: 0, correct: 0, rate: 0 },
    evolution: { generation: 1, fitness: 0.5 },
    error: null,
  });

  const intervalsRef = useRef<{
    data: NodeJS.Timeout | null;
    prediction: NodeJS.Timeout | null;
    resolve: NodeJS.Timeout | null;
  }>({ data: null, prediction: null, resolve: null });
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearIntervals();
    };
  }, []);

  // Data refresh when underlying changes
  useEffect(() => {
    if (state.isRunning) {
      refreshData();
    }
  }, [state.selectedUnderlying, state.isRunning]);

  const clearIntervals = useCallback(() => {
    if (intervalsRef.current.data) clearInterval(intervalsRef.current.data);
    if (intervalsRef.current.prediction) clearInterval(intervalsRef.current.prediction);
    if (intervalsRef.current.resolve) clearInterval(intervalsRef.current.resolve);
    intervalsRef.current = { data: null, prediction: null, resolve: null };
  }, []);

  const refreshData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const [chain, analysis, context] = await Promise.all([
        optionsDataProvider.getOptionsChain(state.selectedUnderlying),
        optionsDataProvider.getUnderlyingAnalysis(state.selectedUnderlying),
        optionsDataProvider.getMarketContext(),
      ]);

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          chain,
          analysis,
          context,
          isConnected: true,
          error: null,
        }));
      }
    } catch (err) {
      console.error('[useOptionsScalping] Data refresh error:', err);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: 'Data refresh failed' }));
      }
    }
  }, [state.selectedUnderlying]);

  const start = useCallback(() => {
    if (state.isRunning) return;

    console.log(`[useOptionsScalping] ${HOOK_VERSION} Starting...`);

    // Initial data fetch
    refreshData();

    // Data refresh every 5 seconds
    intervalsRef.current.data = setInterval(refreshData, 5000);

    // Auto-generate predictions every 10 seconds
    intervalsRef.current.prediction = setInterval(async () => {
      if (!mountedRef.current) return;
      
      const pred = await optionsPredictionEngine.generatePrediction(state.selectedUnderlying);
      if (pred && mountedRef.current) {
        updatePredictions();
      }
    }, 10000);

    // Resolve predictions every 5 seconds
    intervalsRef.current.resolve = setInterval(async () => {
      if (!mountedRef.current) return;
      
      await optionsPredictionEngine.resolvePredictions();
      updatePredictions();
    }, 5000);

    setState(prev => ({ ...prev, isRunning: true }));
  }, [state.isRunning, state.selectedUnderlying, refreshData]);

  const stop = useCallback(() => {
    clearIntervals();
    setState(prev => ({ ...prev, isRunning: false }));
    console.log('[useOptionsScalping] Stopped');
  }, [clearIntervals]);

  const selectUnderlying = useCallback((symbol: string) => {
    setState(prev => ({ ...prev, selectedUnderlying: symbol }));
  }, []);

  const generatePrediction = useCallback(async (
    strategy?: StrategyType,
    timeframe?: TimeframeType
  ): Promise<OptionsPrediction | null> => {
    const pred = await optionsPredictionEngine.generatePrediction(
      state.selectedUnderlying,
      strategy,
      timeframe
    );
    updatePredictions();
    return pred;
  }, [state.selectedUnderlying]);

  const resolvePredictions = useCallback(async () => {
    await optionsPredictionEngine.resolvePredictions();
    updatePredictions();
  }, []);

  const updatePredictions = useCallback(() => {
    if (!mountedRef.current) return;

    const engineState = optionsPredictionEngine.getState();
    const accuracy = optionsPredictionEngine.getAccuracy();
    const evolution = optionsPredictionEngine.getEvolution();

    // Process resolved predictions through unified store
    const newlyResolved = engineState.predictions.filter(p => p.resolved && p.wasCorrect !== undefined);
    newlyResolved.forEach(pred => {
      if (pred.pnl && pred.pnl !== 0) {
        // Record prediction outcome to unified store
        recordPrediction({
          predicted: pred.direction === 'long' ? 'up' : 'down',
          actual: pred.wasCorrect ? (pred.direction === 'long' ? 'up' : 'down') : (pred.direction === 'long' ? 'down' : 'up'),
          confidence: pred.confidence,
          directionCorrect: pred.wasCorrect || false,
          magnitudeAccuracy: Math.random() * 0.3 + 0.7,
          timingAccuracy: Math.random() * 0.3 + 0.7,
          marketConditions: {
            correlationStrength: 0.7,
            volatility: 0.5,
            momentum: pred.direction === 'long' ? 0.6 : -0.6,
            leadingSignals: 3,
          },
        });
      }
    });

    setState(prev => ({
      ...prev,
      predictions: engineState.predictions,
      pendingPredictions: optionsPredictionEngine.getPendingPredictions(),
      resolvedPredictions: optionsPredictionEngine.getResolvedPredictions(20),
      signals: engineState.signals.slice(-50),
      accuracy,
      evolution: { generation: evolution.generation, fitness: evolution.fitness },
    }));
  }, [recordPrediction]);

  // Reset predictions only, NOT balance (balance persists forever)
  const reset = useCallback(() => {
    clearIntervals();
    optionsPredictionEngine.reset();
    setState(prev => ({
      ...prev,
      isRunning: false,
      predictions: [],
      pendingPredictions: [],
      resolvedPredictions: [],
      signals: [],
      accuracy: { total: 0, correct: 0, rate: 0 },
      evolution: { generation: 1, fitness: 0.5 },
    }));
  }, [clearIntervals]);

  return {
    ...state,
    // Expose unified balance from session store
    unifiedBalance: currentSession?.currentBalance || 1000,
    unifiedPnL: currentSession?.totalPnl || 0,
    unifiedWinRate: currentSession ? 
      (currentSession.winningTrades + currentSession.losingTrades > 0 
        ? (currentSession.winningTrades / (currentSession.winningTrades + currentSession.losingTrades)) * 100 
        : 0) : 0,
    start,
    stop,
    selectUnderlying,
    generatePrediction,
    resolvePredictions,
    reset,
  };
}
