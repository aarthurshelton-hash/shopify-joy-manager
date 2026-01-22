/**
 * Options Scalping Hook - React Integration
 * 
 * Provides real-time options prediction and portfolio management.
 * 
 * @version 7.50-OPTIONS
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
  OptionsPortfolio,
  StrategyType,
  TimeframeType,
  SCALPING_UNDERLYINGS,
} from '@/lib/pensent-core/domains/options';
import { supabase } from '@/integrations/supabase/client';

const HOOK_VERSION = '7.50-OPTIONS';

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
  portfolio: OptionsPortfolio;
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
}

export function useOptionsScalping(): OptionsScalpingState & OptionsScalpingActions {
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
    portfolio: createInitialPortfolio(),
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

  // Load portfolio from database
  useEffect(() => {
    loadPortfolioFromDB();
    
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

  const loadPortfolioFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_balance')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setState(prev => ({
          ...prev,
          portfolio: {
            ...prev.portfolio,
            balance: data.balance || 1000,
            totalPnL: (data.balance || 1000) - 1000,
          },
          isConnected: true,
        }));
      }
    } catch (err) {
      console.error('[useOptionsScalping] Portfolio load error:', err);
    }
  };

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

    setState(prev => ({
      ...prev,
      predictions: engineState.predictions,
      pendingPredictions: optionsPredictionEngine.getPendingPredictions(),
      resolvedPredictions: optionsPredictionEngine.getResolvedPredictions(20),
      signals: engineState.signals.slice(-50),
      accuracy,
      evolution: { generation: evolution.generation, fitness: evolution.fitness },
      portfolio: updatePortfolioFromPredictions(prev.portfolio, engineState.predictions),
    }));
  }, []);

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
      portfolio: createInitialPortfolio(),
      accuracy: { total: 0, correct: 0, rate: 0 },
      evolution: { generation: 1, fitness: 0.5 },
    }));
  }, [clearIntervals]);

  return {
    ...state,
    start,
    stop,
    selectUnderlying,
    generatePrediction,
    resolvePredictions,
    reset,
  };
}

function createInitialPortfolio(): OptionsPortfolio {
  return {
    id: 'options-portfolio',
    balance: 1000,
    startingBalance: 1000,
    dayPnL: 0,
    weekPnL: 0,
    monthPnL: 0,
    totalPnL: 0,
    openPositions: [],
    closedPositions: [],
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    currentStreak: 0,
    bestStreak: 0,
    worstStreak: 0,
    totalTrades: 0,
    updatedAt: Date.now(),
  };
}

function updatePortfolioFromPredictions(
  portfolio: OptionsPortfolio,
  predictions: OptionsPrediction[]
): OptionsPortfolio {
  const resolved = predictions.filter(p => p.resolved);
  if (resolved.length === 0) return portfolio;

  const wins = resolved.filter(p => p.wasCorrect);
  const losses = resolved.filter(p => !p.wasCorrect);
  const totalPnL = resolved.reduce((sum, p) => sum + (p.pnl || 0), 0);

  return {
    ...portfolio,
    balance: portfolio.startingBalance + totalPnL,
    totalPnL,
    totalTrades: resolved.length,
    winRate: resolved.length > 0 ? wins.length / resolved.length : 0,
    avgWin: wins.length > 0 ? wins.reduce((s, p) => s + (p.pnl || 0), 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? Math.abs(losses.reduce((s, p) => s + (p.pnl || 0), 0)) / losses.length : 0,
    updatedAt: Date.now(),
  };
}
