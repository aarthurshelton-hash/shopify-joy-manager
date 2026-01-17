/**
 * Universal Prediction Hook
 * 
 * React hook that provides unified access to the complete
 * En Pensent prediction system with real-time synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedSynchronizer, type SynchronizationState } from '@/lib/pensent-core/domains/universal/unifiedSynchronizer';
import { crossDomainEngine } from '@/lib/pensent-core/domains/universal/crossDomainEngine';
import { selfEvolvingSystem } from '@/lib/pensent-core/domains/finance/selfEvolvingSystem';
import type { UnifiedPrediction, DomainType, CrossDomainCorrelation } from '@/lib/pensent-core/domains/universal/types';
import type { MarketConditions } from '@/lib/pensent-core/domains/finance/evolution/types';

export interface UniversalPredictionState {
  isInitialized: boolean;
  isCalibrating: boolean;
  calibrationProgress: number;
  
  // Current prediction
  currentPrediction: UnifiedPrediction | null;
  
  // System health
  syncState: SynchronizationState | null;
  
  // Domain insights
  domainRankings: Array<{ domain: DomainType; accuracy: number; contribution: number }>;
  topCorrelations: CrossDomainCorrelation[];
  
  // Evolution metrics
  generation: number;
  fitness: number;
  velocity: number;
}

export function useUniversalPrediction() {
  const [state, setState] = useState<UniversalPredictionState>({
    isInitialized: false,
    isCalibrating: true,
    calibrationProgress: 0,
    currentPrediction: null,
    syncState: null,
    domainRankings: [],
    topCorrelations: [],
    generation: 1,
    fitness: 0.5,
    velocity: 0,
  });
  
  const predictionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Initialize the universal system
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await unifiedSynchronizer.initialize();
        
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isCalibrating: false,
          calibrationProgress: 1,
        }));
      } catch (err) {
        console.error('[useUniversalPrediction] Initialization failed:', err);
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Subscribe to synchronization updates
  useEffect(() => {
    const unsubscribe = unifiedSynchronizer.subscribe((syncState) => {
      setState(prev => ({
        ...prev,
        syncState,
      }));
    });
    
    return unsubscribe;
  }, []);
  
  // Update rankings and correlations periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const domainRankings = crossDomainEngine.getDomainRankings();
      const topCorrelations = crossDomainEngine.getTopCorrelations(5);
      const evolutionSummary = selfEvolvingSystem.getEvolutionSummary();
      
      setState(prev => ({
        ...prev,
        domainRankings,
        topCorrelations,
        generation: evolutionSummary.generation,
        fitness: evolutionSummary.fitness,
        velocity: evolutionSummary.velocity,
      }));
    }, 2000);
    
    return () => clearInterval(updateInterval);
  }, []);
  
  /**
   * Generate a prediction for market data
   */
  const predict = useCallback((
    symbol: string,
    momentum: number,
    volatility: number,
    volume: number,
    direction: number
  ): UnifiedPrediction | null => {
    if (!state.isInitialized) return null;
    
    const prediction = unifiedSynchronizer.processMarketPrediction(
      symbol,
      momentum,
      volatility,
      volume,
      direction
    );
    
    setState(prev => ({
      ...prev,
      currentPrediction: prediction,
    }));
    
    return prediction;
  }, [state.isInitialized]);
  
  /**
   * Record the outcome of a prediction
   */
  const recordOutcome = useCallback((
    prediction: UnifiedPrediction,
    actualDirection: 'up' | 'down' | 'neutral',
    actualMagnitude: number,
    conditions: MarketConditions
  ): void => {
    unifiedSynchronizer.recordOutcome(
      prediction,
      actualDirection,
      actualMagnitude,
      conditions
    );
  }, []);
  
  /**
   * Start continuous prediction for a symbol
   */
  const startContinuousPrediction = useCallback((
    symbol: string,
    getMarketData: () => { momentum: number; volatility: number; volume: number; direction: number },
    intervalMs = 1000
  ): void => {
    // Clear any existing interval
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
    }
    
    predictionIntervalRef.current = setInterval(() => {
      const data = getMarketData();
      predict(symbol, data.momentum, data.volatility, data.volume, data.direction);
    }, intervalMs);
  }, [predict]);
  
  /**
   * Stop continuous prediction
   */
  const stopContinuousPrediction = useCallback((): void => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = null;
    }
  }, []);
  
  /**
   * Get full system summary
   */
  const getSystemSummary = useCallback(() => {
    return unifiedSynchronizer.getSystemSummary();
  }, []);
  
  /**
   * Record a healing success (for auto-heal integration)
   */
  const recordHealingSuccess = useCallback(() => {
    unifiedSynchronizer.recordHealingSuccess();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousPrediction();
    };
  }, [stopContinuousPrediction]);
  
  return {
    ...state,
    predict,
    recordOutcome,
    startContinuousPrediction,
    stopContinuousPrediction,
    getSystemSummary,
    recordHealingSuccess,
  };
}
