/**
 * IBKR Autonomous Trading Hook
 * 
 * Runs 24/7 automated trading through the local IB Gateway bridge.
 * Uses real IBKR paper account data with persistent DB tracking.
 * No simulation - all trades execute against actual IBKR paper account.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ibGatewayClient } from '@/lib/trading/ibGatewayClient';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoTradeSession {
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

interface AutoPosition {
  id: string;
  symbol: string;
  conid: number;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  entryTime: number;
  stopLoss: number;
  takeProfit: number;
  status: 'open' | 'closed' | 'pending';
}

interface CycleResult {
  tradesExecuted: number;
  positionsManaged: number;
  signalsGenerated: number;
  pnlChange: number;
  timestamp: string;
}

// Trading configuration - tuned for pattern recognition advantage
const AUTO_CONFIG = {
  MIN_CONFIDENCE: 0.70,        // Higher threshold for auto-trades
  MAX_RISK_PERCENT: 3,         // Conservative 3% max risk per trade
  POSITION_SIZE_PERCENT: 5,    // 5% position sizing
  SCALP_HORIZON_MS: 60000,     // 60-second scalps
  CYCLE_INTERVAL_MS: 15000,    // Run cycle every 15 seconds
  STOP_LOSS_PERCENT: 1.0,      // 1% stop loss
  TAKE_PROFIT_PERCENT: 1.5,    // 1.5% take profit (1.5:1 R:R)
};

// Symbols to trade - focus on high liquidity
const AUTO_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'AMD'];

export function useIBKRAutonomousTrading(gatewayConnected: boolean, accountId: string | null) {
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState<AutoTradeSession | null>(null);
  const [positions, setPositions] = useState<AutoPosition[]>([]);
  const [cycleResults, setCycleResults] = useState<CycleResult[]>([]);
  const [lastCycleTime, setLastCycleTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Get prediction signal from our pattern recognition system
  const getPatternSignal = useCallback(async (symbol: string): Promise<{
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    archetype: string;
  } | null> => {
    try {
      // Fetch recent predictions for this symbol
      const { data: predictions } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .eq('symbol', symbol)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!predictions || predictions.length === 0) {
        // Generate new signal via edge function
        const { data, error } = await supabase.functions.invoke('stock-data', {
          body: { action: 'prediction', symbol }
        });

        if (error || !data) return null;

        return {
          direction: data.direction || 'neutral',
          confidence: data.confidence || 0.5,
          archetype: data.archetype || 'unknown',
        };
      }

      // Aggregate recent predictions for consensus
      const upVotes = predictions.filter(p => p.predicted_direction === 'up').length;
      const downVotes = predictions.filter(p => p.predicted_direction === 'down').length;
      const avgConfidence = predictions.reduce((sum, p) => sum + (p.predicted_confidence || 0), 0) / predictions.length;

      let direction: 'up' | 'down' | 'neutral' = 'neutral';
      if (upVotes > downVotes && upVotes >= 3) direction = 'up';
      else if (downVotes > upVotes && downVotes >= 3) direction = 'down';

      // Extract archetype from market_conditions if available
      const marketConditions = predictions[0]?.market_conditions as Record<string, unknown> | null;
      const archetype = (marketConditions?.archetype as string) || 'consensus';

      return {
        direction,
        confidence: avgConfidence,
        archetype,
      };
    } catch (err) {
      console.error('[AutoTrade] Signal error:', err);
      return null;
    }
  }, []);

  // Execute a single trading cycle
  const runCycle = useCallback(async () => {
    if (!gatewayConnected || !accountId || !sessionIdRef.current) {
      console.log('[AutoTrade] Skipping cycle - not ready');
      return;
    }

    console.log('[AutoTrade] Running cycle...');
    setLastCycleTime(new Date());

    let tradesExecuted = 0;
    let positionsManaged = 0;
    let signalsGenerated = 0;
    let pnlChange = 0;

    try {
      // Get current account balance
      const accounts = await ibGatewayClient.getAccounts();
      const account = accounts.find(a => a.accountId === accountId);
      if (!account) {
        console.warn('[AutoTrade] Account not found');
        return;
      }

      const currentBalance = account.balance;

      // Get current positions from IBKR
      const ibkrPositions = await ibGatewayClient.getPositions(accountId);

      // Scan symbols for trading opportunities
      for (const symbol of AUTO_SYMBOLS) {
        // Skip if we already have a position in this symbol
        const hasPosition = ibkrPositions.some(p => p.symbol === symbol && p.position !== 0);
        const hasAutoPosition = positions.some(p => p.symbol === symbol && p.status === 'open');
        
        if (hasPosition || hasAutoPosition) {
          positionsManaged++;
          continue;
        }

        // Get pattern recognition signal
        const signal = await getPatternSignal(symbol);
        signalsGenerated++;

        if (!signal || signal.direction === 'neutral' || signal.confidence < AUTO_CONFIG.MIN_CONFIDENCE) {
          continue;
        }

        // Search for contract
        const contracts = await ibGatewayClient.searchContract(symbol);
        if (contracts.length === 0) continue;

        const contract = contracts[0];

        // Get current price
        const quote = await ibGatewayClient.getQuote(contract.conid);
        if (!quote || !quote.lastPrice) continue;

        const price = quote.lastPrice;

        // Calculate position size
        const riskAmount = currentBalance * (AUTO_CONFIG.MAX_RISK_PERCENT / 100);
        const stopLossAmount = price * (AUTO_CONFIG.STOP_LOSS_PERCENT / 100);
        const maxShares = Math.floor(riskAmount / stopLossAmount);
        const positionSizeShares = Math.min(maxShares, Math.floor((currentBalance * AUTO_CONFIG.POSITION_SIZE_PERCENT / 100) / price));

        if (positionSizeShares < 1) continue;

        // Execute order
        const side = signal.direction === 'up' ? 'BUY' : 'SELL';
        const result = await ibGatewayClient.placeOrder({
          accountId,
          conid: contract.conid,
          symbol,
          side,
          quantity: positionSizeShares,
          orderType: 'MKT',
        });

        if (result) {
          tradesExecuted++;

          // Track position locally
          const newPosition: AutoPosition = {
            id: result.orderId,
            symbol,
            conid: contract.conid,
            side: signal.direction === 'up' ? 'long' : 'short',
            entryPrice: price,
            quantity: positionSizeShares,
            entryTime: Date.now(),
            stopLoss: signal.direction === 'up' 
              ? price * (1 - AUTO_CONFIG.STOP_LOSS_PERCENT / 100)
              : price * (1 + AUTO_CONFIG.STOP_LOSS_PERCENT / 100),
            takeProfit: signal.direction === 'up'
              ? price * (1 + AUTO_CONFIG.TAKE_PROFIT_PERCENT / 100)
              : price * (1 - AUTO_CONFIG.TAKE_PROFIT_PERCENT / 100),
            status: 'open',
          };

          setPositions(prev => [...prev, newPosition]);

          // Log trade to database
          await supabase.from('autonomous_trades').insert({
            symbol,
            direction: side,
            entry_price: price,
            shares: positionSizeShares,
            predicted_direction: signal.direction,
            predicted_confidence: signal.confidence,
            status: 'open',
          });

          console.log(`[AutoTrade] ✓ ${side} ${positionSizeShares} ${symbol} @ $${price.toFixed(2)} | Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
        }
      }

      // Manage open positions - check for stop loss or take profit
      for (const pos of positions.filter(p => p.status === 'open')) {
        const quote = await ibGatewayClient.getQuote(pos.conid);
        if (!quote || !quote.lastPrice) continue;

        const currentPrice = quote.lastPrice;
        const pnl = pos.side === 'long'
          ? (currentPrice - pos.entryPrice) * pos.quantity
          : (pos.entryPrice - currentPrice) * pos.quantity;

        // Check exit conditions
        const shouldClose = 
          (pos.side === 'long' && currentPrice <= pos.stopLoss) ||
          (pos.side === 'long' && currentPrice >= pos.takeProfit) ||
          (pos.side === 'short' && currentPrice >= pos.stopLoss) ||
          (pos.side === 'short' && currentPrice <= pos.takeProfit) ||
          (Date.now() - pos.entryTime > AUTO_CONFIG.SCALP_HORIZON_MS * 3);

        if (shouldClose) {
          const closeSide = pos.side === 'long' ? 'SELL' : 'BUY';
          const closeResult = await ibGatewayClient.placeOrder({
            accountId,
            conid: pos.conid,
            symbol: pos.symbol,
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
                pnl_percent: (pnl / (pos.entryPrice * pos.quantity)) * 100,
                status: 'closed',
                actual_direction: pnl > 0 ? 'correct' : 'incorrect',
              })
              .eq('symbol', pos.symbol)
              .eq('status', 'open')
              .order('created_at', { ascending: false })
              .limit(1);

            console.log(`[AutoTrade] Position closed: ${pos.symbol} | PnL: $${pnl.toFixed(2)}`);
          }
        }
      }

      // Update session stats
      setSession(prev => {
        if (!prev) return prev;
        
        const newWins = pnlChange > 0 ? prev.winningTrades + 1 : prev.winningTrades;
        const newLosses = pnlChange < 0 ? prev.losingTrades + 1 : prev.losingTrades;
        
        return {
          ...prev,
          totalTrades: prev.totalTrades + tradesExecuted,
          winningTrades: newWins,
          losingTrades: newLosses,
          totalPnl: prev.totalPnl + pnlChange,
          currentBalance,
          lastActivityAt: new Date().toISOString(),
        };
      });

      // Record cycle result
      const result: CycleResult = {
        tradesExecuted,
        positionsManaged,
        signalsGenerated,
        pnlChange,
        timestamp: new Date().toISOString(),
      };

      setCycleResults(prev => [...prev.slice(-49), result]);

    } catch (err) {
      console.error('[AutoTrade] Cycle error:', err);
      setError((err as Error).message);
    }
  }, [gatewayConnected, accountId, positions, getPatternSignal]);

  // Start autonomous trading
  const startAutonomous = useCallback(async () => {
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
    const sessionId = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    sessionIdRef.current = sessionId;

    const newSession: AutoTradeSession = {
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

    // Start loop
    runCycle();
    intervalRef.current = setInterval(runCycle, AUTO_CONFIG.CYCLE_INTERVAL_MS);

    toast({
      title: '🤖 Autonomous Trading Started',
      description: `Trading ${AUTO_SYMBOLS.join(', ')} with $${account.balance.toLocaleString()} balance`,
    });

    console.log(`[AutoTrade] Started session ${sessionId} with $${account.balance.toFixed(2)}`);
  }, [gatewayConnected, accountId, toast, runCycle]);

  // Stop autonomous trading
  const stopAutonomous = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRunning(false);
    sessionIdRef.current = null;

    toast({
      title: 'Autonomous Trading Stopped',
      description: session ? `Session ended with ${session.totalTrades} trades, $${session.totalPnl.toFixed(2)} P&L` : 'Session ended',
    });

    console.log('[AutoTrade] Stopped');
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
      stopAutonomous();
      setError('Gateway disconnected - autonomous trading stopped');
    }
  }, [gatewayConnected, isRunning, stopAutonomous]);

  // Calculate stats
  const stats = {
    winRate: session && session.totalTrades > 0 
      ? ((session.winningTrades / session.totalTrades) * 100).toFixed(1) + '%'
      : 'N/A',
    avgCycleTime: cycleResults.length > 0
      ? `${(AUTO_CONFIG.CYCLE_INTERVAL_MS / 1000).toFixed(0)}s`
      : 'N/A',
    totalSignals: cycleResults.reduce((sum, r) => sum + r.signalsGenerated, 0),
    openPositions: positions.filter(p => p.status === 'open').length,
  };

  return {
    // State
    isRunning,
    session,
    positions,
    cycleResults,
    lastCycleTime,
    error,
    stats,
    config: AUTO_CONFIG,
    symbols: AUTO_SYMBOLS,
    
    // Actions
    startAutonomous,
    stopAutonomous,
  };
}
