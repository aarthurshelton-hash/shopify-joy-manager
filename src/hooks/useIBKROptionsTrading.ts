/**
 * IBKR Options Autonomous Trading Hook
 * 
 * Runs 24/7 automated OPTIONS trading through the local IB Gateway bridge.
 * Uses real IBKR paper account data with FULL En Pensent™ Universal Intelligence:
 * 
 * === INTEGRATED SYSTEMS ===
 * - 27 Domain Adapters (Light, Network, Bio, Audio, Music, Soul, Atomic, Cosmic, etc.)
 * - 9 Advanced Modules (Entropy, Archetype, Quantum, Morphic, Contagion, Fractal, etc.)
 * - Scientific Formulations (Shannon Entropy, Hurst, Lyapunov, Kuramoto, Bayesian)
 * - Speedrun Glitch Detection (Sequence Breaks, Wrong Warps)
 * - Consciousness Resonance (Collective Entrainment)
 * - Cultural Arbitrage (Cross-market asymmetries)
 * 
 * @version 8.0-UNIVERSAL-OPTIONS-IBKR
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ibGatewayClient } from '@/lib/trading/ibGatewayClient';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  optionsPredictionEngine,
  OptionsPrediction,
  StrategyType,
  TimeframeType,
  SCALPING_UNDERLYINGS,
} from '@/lib/pensent-core/domains/options';
import { 
  universalOptionsIntegration,
  UniversalOptionsContext,
  EnhancedOptionsPrediction,
} from '@/lib/pensent-core/domains/options/universalOptionsIntegration';

interface OptionsSession {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  startBalance: number;
  currentBalance: number;
}

interface OptionsAutoPosition {
  id: string;
  underlying: string;
  optionSymbol: string;
  conid: number;
  side: 'long' | 'short';
  optionType: 'call' | 'put';
  strike: number;
  expiration: string;
  entryPrice: number;
  quantity: number;
  entryTime: number;
  stopLoss: number;
  takeProfit: number;
  status: 'open' | 'closed' | 'pending';
  predictionId: string;
  strategy: StrategyType;
}

interface CycleResult {
  tradesExecuted: number;
  positionsManaged: number;
  predictionsGenerated: number;
  pnlChange: number;
  timestamp: string;
}

// Trading configuration for options scalping
const OPTIONS_CONFIG = {
  MIN_CONFIDENCE: 0.65,          // Confidence threshold for options trades
  MAX_RISK_PERCENT: 2,           // 2% max risk per options trade
  POSITION_SIZE_PERCENT: 3,      // 3% position sizing (options are leveraged)
  CYCLE_INTERVAL_MS: 20000,      // Run cycle every 20 seconds
  STOP_LOSS_PERCENT: 25,         // 25% stop loss on option premium
  TAKE_PROFIT_PERCENT: 50,       // 50% take profit (higher R:R for options)
  MAX_OPEN_POSITIONS: 3,         // Max concurrent options positions
  SCALP_HORIZON_MS: 300000,      // 5-minute scalp horizon
};

// Focus on high-liquidity underlyings for options
const OPTIONS_UNDERLYINGS = SCALPING_UNDERLYINGS.map(u => u.symbol);

export function useIBKROptionsTrading(gatewayConnected: boolean, accountId: string | null) {
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState<OptionsSession | null>(null);
  const [positions, setPositions] = useState<OptionsAutoPosition[]>([]);
  const [cycleResults, setCycleResults] = useState<CycleResult[]>([]);
  const [lastCycleTime, setLastCycleTime] = useState<Date | null>(null);
  const [activePredictions, setActivePredictions] = useState<OptionsPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Build option symbol for IBKR format
  const buildOptionSymbol = useCallback((
    underlying: string,
    expiration: string,
    optionType: 'call' | 'put',
    strike: number
  ): string => {
    // IBKR format: SPY   250131C00550000
    const exp = expiration.replace(/-/g, '').slice(2); // YYMMDD
    const type = optionType === 'call' ? 'C' : 'P';
    const strikeStr = (strike * 1000).toString().padStart(8, '0');
    return `${underlying.padEnd(6)}${exp}${type}${strikeStr}`;
  }, []);

  // Search for option contract on IBKR
  const findOptionContract = useCallback(async (
    underlying: string,
    optionType: 'call' | 'put',
    strike: number,
    expiration: string
  ): Promise<{ conid: number; symbol: string } | null> => {
    try {
      // Search for the underlying first
      const underlyingContracts = await ibGatewayClient.searchContract(underlying);
      if (underlyingContracts.length === 0) return null;

      const underlyingConid = underlyingContracts[0].conid;

      // For options, we need to search with specific parameters
      // IBKR API: secType=OPT, right=C/P, strike, expiry
      const optionSymbol = buildOptionSymbol(underlying, expiration, optionType, strike);
      
      // Try searching for the option directly
      const optionContracts = await ibGatewayClient.searchContract(optionSymbol);
      
      if (optionContracts.length > 0) {
        return {
          conid: optionContracts[0].conid,
          symbol: optionSymbol,
        };
      }

      // Fallback: construct a synthetic lookup
      // Note: Real implementation would use IBKR's option chain API
      console.log(`[OptionsTrading] Contract search fallback for ${optionSymbol}`);
      
      return null;
    } catch (err) {
      console.error('[OptionsTrading] Contract search error:', err);
      return null;
    }
  }, [buildOptionSymbol]);

  // Execute a single trading cycle
  const runCycle = useCallback(async () => {
    if (!gatewayConnected || !accountId || !sessionIdRef.current) {
      console.log('[OptionsTrading] Skipping cycle - not ready');
      return;
    }

    console.log('[OptionsTrading] Running options cycle...');
    setLastCycleTime(new Date());

    let tradesExecuted = 0;
    let positionsManaged = 0;
    let predictionsGenerated = 0;
    let pnlChange = 0;

    try {
      // Get current account balance
      const accounts = await ibGatewayClient.getAccounts();
      const account = accounts.find(a => a.accountId === accountId);
      if (!account) {
        console.warn('[OptionsTrading] Account not found');
        return;
      }

      const currentBalance = account.balance;
      const openPositionCount = positions.filter(p => p.status === 'open').length;

      // Generate predictions if we have room for more positions
      if (openPositionCount < OPTIONS_CONFIG.MAX_OPEN_POSITIONS) {
        // Rotate through underlyings
        const underlyingIndex = Math.floor(Date.now() / 60000) % OPTIONS_UNDERLYINGS.length;
        const underlying = OPTIONS_UNDERLYINGS[underlyingIndex];

        // Generate prediction using En Pensent™ engine
        const prediction = await optionsPredictionEngine.generatePrediction(
          underlying,
          undefined, // Auto-select strategy
          undefined  // Auto-select timeframe
        );

        if (prediction) {
          predictionsGenerated++;
          setActivePredictions(prev => [...prev.slice(-19), prediction]);

          // Check confidence threshold
          if (prediction.confidence >= OPTIONS_CONFIG.MIN_CONFIDENCE) {
            console.log(`[OptionsTrading] High-confidence signal: ${prediction.underlying} ${prediction.optionType} $${prediction.strike} | ${(prediction.confidence * 100).toFixed(1)}%`);

            // Find the option contract on IBKR
            const contract = await findOptionContract(
              prediction.underlying,
              prediction.optionType,
              prediction.strike,
              prediction.expiration
            );

            if (contract) {
              // Get current option quote
              const quote = await ibGatewayClient.getQuote(contract.conid);
              
              if (quote && quote.lastPrice && quote.lastPrice > 0.10) {
                // Calculate position size
                const riskAmount = currentBalance * (OPTIONS_CONFIG.MAX_RISK_PERCENT / 100);
                const maxContracts = Math.floor(riskAmount / (quote.lastPrice * 100));
                const contractsToTrade = Math.min(maxContracts, 2); // Max 2 contracts per trade

                if (contractsToTrade >= 1) {
                  // Place order
                  const side = prediction.direction === 'long' ? 'BUY' : 'SELL';
                  
                  const result = await ibGatewayClient.placeOrder({
                    accountId,
                    conid: contract.conid,
                    symbol: contract.symbol,
                    side,
                    quantity: contractsToTrade,
                    orderType: 'MKT',
                  });

                  if (result) {
                    tradesExecuted++;

                    // Track position
                    const newPosition: OptionsAutoPosition = {
                      id: result.orderId,
                      underlying: prediction.underlying,
                      optionSymbol: contract.symbol,
                      conid: contract.conid,
                      side: prediction.direction,
                      optionType: prediction.optionType,
                      strike: prediction.strike,
                      expiration: prediction.expiration,
                      entryPrice: quote.lastPrice,
                      quantity: contractsToTrade,
                      entryTime: Date.now(),
                      stopLoss: quote.lastPrice * (1 - OPTIONS_CONFIG.STOP_LOSS_PERCENT / 100),
                      takeProfit: quote.lastPrice * (1 + OPTIONS_CONFIG.TAKE_PROFIT_PERCENT / 100),
                      status: 'open',
                      predictionId: prediction.id,
                      strategy: prediction.strategy,
                    };

                    setPositions(prev => [...prev, newPosition]);

                    // Log to database
                    await supabase.from('autonomous_trades').insert({
                      symbol: `${prediction.underlying} ${prediction.optionType.toUpperCase()} $${prediction.strike}`,
                      direction: side,
                      entry_price: quote.lastPrice,
                      shares: contractsToTrade,
                      predicted_direction: prediction.direction,
                      predicted_confidence: prediction.confidence,
                      status: 'open',
                    });

                    console.log(`[OptionsTrading] ✓ ${side} ${contractsToTrade}x ${prediction.underlying} ${prediction.optionType} $${prediction.strike} @ $${quote.lastPrice.toFixed(2)}`);
                  }
                }
              }
            } else {
              console.log(`[OptionsTrading] Could not find contract for ${prediction.underlying} ${prediction.optionType} $${prediction.strike}`);
            }
          }
        }
      }

      // Manage open positions
      for (const pos of positions.filter(p => p.status === 'open')) {
        positionsManaged++;

        try {
          const quote = await ibGatewayClient.getQuote(pos.conid);
          if (!quote || !quote.lastPrice) continue;

          const currentPrice = quote.lastPrice;
          const pnl = (currentPrice - pos.entryPrice) * pos.quantity * 100;
          const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

          // Check exit conditions
          const shouldClose = 
            currentPrice <= pos.stopLoss ||
            currentPrice >= pos.takeProfit ||
            (Date.now() - pos.entryTime > OPTIONS_CONFIG.SCALP_HORIZON_MS * 2);

          if (shouldClose) {
            const closeSide = pos.side === 'long' ? 'SELL' : 'BUY';
            
            const closeResult = await ibGatewayClient.placeOrder({
              accountId,
              conid: pos.conid,
              symbol: pos.optionSymbol,
              side: closeSide,
              quantity: pos.quantity,
              orderType: 'MKT',
            });

            if (closeResult) {
              pnlChange += pnl;

              setPositions(prev => prev.map(p =>
                p.id === pos.id ? { ...p, status: 'closed' as const } : p
              ));

              // Update database
              await supabase.from('autonomous_trades')
                .update({
                  exit_price: currentPrice,
                  exit_time: new Date().toISOString(),
                  pnl,
                  pnl_percent: pnlPercent,
                  status: 'closed',
                  actual_direction: pnl > 0 ? 'correct' : 'incorrect',
                })
                .like('symbol', `${pos.underlying}%`)
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(1);

              console.log(`[OptionsTrading] Position closed: ${pos.underlying} ${pos.optionType} $${pos.strike} | PnL: $${pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%)`);
            }
          }
        } catch (err) {
          console.error(`[OptionsTrading] Position management error for ${pos.underlying}:`, err);
        }
      }

      // Update session stats
      setSession(prev => {
        if (!prev) return prev;

        const hasNewPnl = Math.abs(pnlChange) > 0.01;
        return {
          ...prev,
          totalTrades: prev.totalTrades + tradesExecuted,
          winningTrades: hasNewPnl && pnlChange > 0 ? prev.winningTrades + 1 : prev.winningTrades,
          losingTrades: hasNewPnl && pnlChange < 0 ? prev.losingTrades + 1 : prev.losingTrades,
          totalPnl: prev.totalPnl + pnlChange,
          currentBalance,
          lastActivityAt: new Date().toISOString(),
        };
      });

      // Record cycle result
      const result: CycleResult = {
        tradesExecuted,
        positionsManaged,
        predictionsGenerated,
        pnlChange,
        timestamp: new Date().toISOString(),
      };

      setCycleResults(prev => [...prev.slice(-49), result]);

      // Resolve old predictions
      await optionsPredictionEngine.resolvePredictions();

    } catch (err) {
      console.error('[OptionsTrading] Cycle error:', err);
      setError((err as Error).message);
    }
  }, [gatewayConnected, accountId, positions, findOptionContract]);

  // Start autonomous options trading
  const startOptionsTrading = useCallback(async () => {
    if (!gatewayConnected || !accountId) {
      toast({
        title: 'Cannot Start',
        description: 'IB Gateway must be connected first.',
        variant: 'destructive',
      });
      return;
    }

    // Get current balance
    const accounts = await ibGatewayClient.getAccounts();
    const account = accounts.find(a => a.accountId === accountId);
    if (!account) {
      toast({
        title: 'Account Error',
        description: 'Could not find account balance.',
        variant: 'destructive',
      });
      return;
    }

    // Create session
    const sessionId = `options-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    sessionIdRef.current = sessionId;

    const newSession: OptionsSession = {
      id: sessionId,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnl: 0,
      startBalance: account.balance,
      currentBalance: account.balance,
    };

    setSession(newSession);
    setIsRunning(true);
    setError(null);
    setCycleResults([]);
    setPositions([]);
    setActivePredictions([]);

    // Start loop
    runCycle();
    intervalRef.current = setInterval(runCycle, OPTIONS_CONFIG.CYCLE_INTERVAL_MS);

    toast({
      title: '📈 Options Trading Started',
      description: `Trading options on ${OPTIONS_UNDERLYINGS.slice(0, 5).join(', ')}... with $${account.balance.toLocaleString()}`,
    });

    console.log(`[OptionsTrading] Started session ${sessionId} with $${account.balance.toFixed(2)}`);
  }, [gatewayConnected, accountId, toast, runCycle]);

  // Stop autonomous options trading
  const stopOptionsTrading = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRunning(false);
    sessionIdRef.current = null;

    toast({
      title: 'Options Trading Stopped',
      description: session ? `Session ended with ${session.totalTrades} trades, $${session.totalPnl.toFixed(2)} P&L` : 'Session ended',
    });

    console.log('[OptionsTrading] Stopped');
  }, [toast, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Stop if gateway disconnects
  useEffect(() => {
    if (!gatewayConnected && isRunning) {
      stopOptionsTrading();
      setError('Gateway disconnected - options trading stopped');
    }
  }, [gatewayConnected, isRunning, stopOptionsTrading]);

  // Calculate stats
  const stats = {
    winRate: session && session.totalTrades > 0
      ? ((session.winningTrades / session.totalTrades) * 100).toFixed(1) + '%'
      : 'N/A',
    avgCycleTime: `${(OPTIONS_CONFIG.CYCLE_INTERVAL_MS / 1000).toFixed(0)}s`,
    totalPredictions: activePredictions.length,
    openPositions: positions.filter(p => p.status === 'open').length,
    closedPositions: positions.filter(p => p.status === 'closed').length,
  };

  // Engine accuracy from prediction engine
  const engineAccuracy = optionsPredictionEngine.getAccuracy();

  return {
    // State
    isRunning,
    session,
    positions,
    cycleResults,
    lastCycleTime,
    activePredictions,
    error,
    stats,
    engineAccuracy,
    config: OPTIONS_CONFIG,
    underlyings: OPTIONS_UNDERLYINGS,

    // Actions
    startOptionsTrading,
    stopOptionsTrading,
  };
}
