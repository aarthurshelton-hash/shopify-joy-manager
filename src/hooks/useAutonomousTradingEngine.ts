/**
 * Universal En Pensent Autonomous Trading Engine Hook
 * 
 * Provides interface to the 24/7 autonomous trading system
 * that integrates all En Pensent domains
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradingSession {
  id: string;
  startBalance: number;
  currentBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  isLive: boolean;
  startedAt: string;
  lastActivityAt: string;
}

interface EngineStatus {
  paperMode: boolean;
  preferredBroker: 'alpaca' | 'ibkr';
  // Alpaca broker status
  alpacaConnected: boolean;
  alpacaBalance: number;
  alpacaPositions: number;
  // IBKR broker status (Canadian-friendly)
  ibkrConnected: boolean;
  ibkrBalance: number;
  ibkrPositions: number;
  // Evolution
  evolutionGeneration: number;
  systemFitness: number;
  overallAccuracy: number;
  // Instruments (expanded with IBKR support)
  instruments: {
    CRYPTO: string[];
    FUTURES: string[];
    STOCKS: string[];
    FOREX: string[];
    TSX: string[];
  };
  topPerformers: Array<{ symbol: string; accuracy: string }>;
  recentSessions: Array<{
    id: string;
    pnl: number;
    trades: number;
    winRate: string;
  }>;
  config: {
    MAX_RISK_PERCENT: number;
    MIN_CONFIDENCE: number;
    MAX_POSITION_SIZE_PERCENT: number;
    SCALP_HORIZON_MS: number;
    PAPER_MODE: boolean;
    PREFERRED_BROKER: 'alpaca' | 'ibkr';
  };
}

interface CycleResult {
  tradesExecuted: number;
  pnlChange: number;
  signalsGenerated: number;
  evolutionUpdated: boolean;
}

export function useAutonomousTradingEngine() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [session, setSession] = useState<TradingSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleResults, setCycleResults] = useState<CycleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch engine status
  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('autonomous-trading-engine', {
        body: { action: 'status' },
      });

      if (error) throw error;
      if (data?.status) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('[AutonomousEngine] Status fetch error:', err);
      setError((err as Error).message);
    }
  }, []);

  // Start new trading session
  const startSession = useCallback(async (initialBalance: number = 10000, isLive: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      const { data, error } = await supabase.functions.invoke('autonomous-trading-engine', {
        body: { 
          action: 'start', 
          sessionId,
          initialBalance,
          isLive,
        },
      });

      if (error) throw error;

      if (data?.session) {
        setSession(data.session);
        toast({
          title: "Trading Session Started",
          description: data.message,
        });
        return data.session;
      }
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast({
        title: "Failed to Start Session",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Run single trading cycle
  const runCycle = useCallback(async () => {
    if (!session?.id) return null;

    try {
      const { data, error } = await supabase.functions.invoke('autonomous-trading-engine', {
        body: { 
          action: 'cycle',
          sessionId: session.id,
        },
      });

      if (error) throw error;

      if (data?.result) {
        setCycleResults(prev => [...prev.slice(-99), data.result]);
        
        // Update session balance from response
        if (data.session) {
          setSession(prev => prev ? {
            ...prev,
            currentBalance: data.session.balance,
            totalPnl: data.session.pnl,
            totalTrades: data.session.trades,
          } : prev);
        }
        
        return data.result;
      }
    } catch (err) {
      console.error('[AutonomousEngine] Cycle error:', err);
    }
    return null;
  }, [session?.id]);

  // Start autonomous loop
  const startAutonomousLoop = useCallback((intervalMs: number = 5000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsRunning(true);
    
    // Run immediately
    runCycle();
    
    // Then run on interval
    intervalRef.current = setInterval(() => {
      runCycle();
    }, intervalMs);

    toast({
      title: "Autonomous Trading Active",
      description: `Running trading cycles every ${intervalMs / 1000}s`,
    });
  }, [runCycle, toast]);

  // Stop autonomous loop
  const stopAutonomousLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    
    toast({
      title: "Autonomous Trading Paused",
      description: "Trading loop has been stopped",
    });
  }, [toast]);

  // Toggle live mode
  const toggleLiveMode = useCallback(async (enable: boolean) => {
    if (enable) {
      // Confirm before enabling live mode
      const brokerName = status?.preferredBroker === 'ibkr' ? 'IBKR' : 'Alpaca';
      const confirmed = window.confirm(
        `⚠️ WARNING: You are about to enable LIVE TRADING.\n\n` +
        `This will use REAL MONEY from your connected ${brokerName} account.\n\n` +
        `Are you absolutely sure you want to proceed?`
      );
      if (!confirmed) return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('autonomous-trading-engine', {
        body: { action: 'toggle-live', enable },
      });

      if (error) throw error;

      toast({
        title: enable ? "⚠️ LIVE MODE ENABLED" : "Paper Mode Active",
        description: data?.message,
        variant: enable ? "destructive" : "default",
      });

      await fetchStatus();
      return true;
    } catch (err) {
      toast({
        title: "Mode Toggle Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchStatus]);

  // Calculate statistics
  const stats = {
    totalSignals: cycleResults.reduce((sum, r) => sum + r.signalsGenerated, 0),
    totalTrades: cycleResults.reduce((sum, r) => sum + r.tradesExecuted, 0),
    totalPnlChange: cycleResults.reduce((sum, r) => sum + r.pnlChange, 0),
    evolutionUpdates: cycleResults.filter(r => r.evolutionUpdated).length,
    winRate: session ? 
      session.totalTrades > 0 
        ? ((session.winningTrades / session.totalTrades) * 100).toFixed(1) + '%'
        : 'N/A'
      : 'N/A',
  };

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    status,
    session,
    isRunning,
    cycleResults,
    stats,
    loading,
    error,

    // Actions
    fetchStatus,
    startSession,
    runCycle,
    startAutonomousLoop,
    stopAutonomousLoop,
    toggleLiveMode,
  };
}
