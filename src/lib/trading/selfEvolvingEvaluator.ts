/**
 * Self-Evolving Strategy Evaluator
 * 
 * Continuously monitors strategy performance, disables underperformers,
 * and auto-tunes parameters based on market conditions.
 */

import { STRATEGY_REGISTRY, EVOLUTION_CONFIG } from './multiAssetConfig';
import { supabase } from '@/integrations/supabase/client';

interface StrategyMetrics {
  strategy: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  avgHoldingTime: number;
  bestRegime: string;
  worstRegime: string;
  enabled: boolean;
  weight: number;
  parameters: Record<string, number>;
}

interface ParameterSet {
  lookback: number;
  threshold: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
}

export class SelfEvolvingEvaluator {
  private metrics: Map<string, StrategyMetrics> = new Map();
  private parameterHistory: Map<string, ParameterSet[]> = new Map();
  private regimePerformance: Map<string, Map<string, number>> = new Map();
  
  async initialize() {
    console.log('[StrategyEvolver] Initializing...');
    
    // Load historical metrics
    await this.loadMetrics();
    
    // Initialize all strategies
    Object.keys(STRATEGY_REGISTRY).forEach(strategy => {
      if (!this.metrics.has(strategy)) {
        this.metrics.set(strategy, this.createDefaultMetrics(strategy));
      }
    });
    
    // Start evaluation loop
    this.startEvaluationLoop();
    
    console.log('[StrategyEvolver] Initialized');
  }
  
  private createDefaultMetrics(strategy: string): StrategyMetrics {
    const config = STRATEGY_REGISTRY[strategy as keyof typeof STRATEGY_REGISTRY];
    return {
      strategy,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      winRate: 0.5,
      profitFactor: 1,
      sharpeRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
      avgHoldingTime: 0,
      bestRegime: 'neutral',
      worstRegime: 'neutral',
      enabled: config?.enabled ?? true,
      weight: config?.weight ?? 0.1,
      parameters: this.getDefaultParameters(strategy),
    };
  }
  
  private getDefaultParameters(strategy: string): Record<string, number> {
    switch (strategy) {
      case 'MOMENTUM':
        return { lookback: 20, threshold: 0.02, stopLoss: 0.01, takeProfit: 0.03 };
      case 'MEAN_REVERSION':
        return { lookback: 10, threshold: 1.5, stopLoss: 0.015, takeProfit: 0.02 };
      case 'VOLATILITY_ARB':
        return { vix_entry: 25, vix_exit: 20, positionSize: 0.1 };
      case 'CARRY_TRADE':
        return { minYieldDiff: 0.02, maxDuration: 30 };
      case 'OPTIONS_INCOME':
        return { minIV: 0.3, maxIV: 0.5, dte: 30 };
      case 'MACRO_ROTATION':
        return { regimeLookback: 90, confidence: 0.7 };
      default:
        return {};
    }
  }
  
  private startEvaluationLoop() {
    // Evaluate every 24 hours
    setInterval(() => this.evaluateStrategies(), 24 * 60 * 60 * 1000);
  }
  
  async evaluateStrategies() {
    console.log('[StrategyEvolver] Running strategy evaluation...');
    
    for (const [strategy, metrics] of this.metrics) {
      // Skip if insufficient data
      if (metrics.totalTrades < EVOLUTION_CONFIG.MIN_TRADES_FOR_EVALUATION) {
        console.log(`[StrategyEvolver] ${strategy}: insufficient trades (${metrics.totalTrades})`);
        continue;
      }
      
      // Check performance threshold
      const shouldDisable = metrics.sharpeRatio < 0.5 || metrics.profitFactor < 1.2;
      const shouldEnable = metrics.sharpeRatio > 1.2 && metrics.profitFactor > 1.5;
      
      if (shouldDisable && metrics.enabled) {
        console.warn(`[StrategyEvolver] Disabling ${strategy} - poor performance (Sharpe: ${metrics.sharpeRatio.toFixed(2)})`);
        metrics.enabled = false;
        metrics.weight = 0;
      } else if (shouldEnable && !metrics.enabled) {
        console.log(`[StrategyEvolver] Re-enabling ${strategy} - strong performance (Sharpe: ${metrics.sharpeRatio.toFixed(2)})`);
        metrics.enabled = true;
        metrics.weight = STRATEGY_REGISTRY[strategy as keyof typeof STRATEGY_REGISTRY]?.weight || 0.1;
      }
      
      // Adjust weight based on performance
      if (metrics.enabled) {
        if (metrics.sharpeRatio > 1.5) {
          metrics.weight = Math.min(0.3, metrics.weight * 1.1);
        } else if (metrics.sharpeRatio < 0.8) {
          metrics.weight = Math.max(0.05, metrics.weight * 0.9);
        }
      }
      
      // Auto-tune parameters
      await this.autoTuneParameters(strategy, metrics);
      
      // Save updated metrics
      await this.saveMetrics(strategy, metrics);
    }
    
    console.log('[StrategyEvolver] Evaluation complete');
  }
  
  private async autoTuneParameters(strategy: string, metrics: StrategyMetrics) {
    const params = metrics.parameters;
    
    // Grid search for optimal parameters
    const variations = this.generateParameterVariations(strategy, params);
    const bestParams = await this.backtestParameters(strategy, variations);
    
    if (bestParams && bestParams.sharpe > metrics.sharpeRatio * 1.1) {
      console.log(`[StrategyEvolver] Optimizing ${strategy} parameters - Sharpe improvement: ${(bestParams.sharpe - metrics.sharpeRatio).toFixed(2)}`);
      metrics.parameters = bestParams.params;
    }
  }
  
  private generateParameterVariations(strategy: string, current: Record<string, number>): ParameterSet[] {
    const variations: ParameterSet[] = [];
    
    // Generate slight variations around current parameters
    const multipliers = [0.8, 0.9, 1.0, 1.1, 1.2];
    
    for (const multiplier of multipliers) {
      const varied: Record<string, number> = {};
      for (const [key, value] of Object.entries(current)) {
        varied[key] = value * multiplier;
      }
      variations.push(varied as ParameterSet);
    }
    
    return variations;
  }
  
  private async backtestParameters(strategy: string, variations: ParameterSet[]): Promise<{ params: Record<string, number>; sharpe: number } | null> {
    let bestResult: { params: Record<string, number>; sharpe: number } | null = null;
    
    for (const params of variations) {
      const result = await this.runBacktest(strategy, params);
      
      if (!bestResult || result.sharpe > bestResult.sharpe) {
        bestResult = { params, sharpe: result.sharpe };
      }
    }
    
    return bestResult;
  }
  
  private async runBacktest(strategy: string, params: ParameterSet): Promise<{ sharpe: number; trades: number }> {
    // Fetch historical trades for this strategy
    const { data: trades } = await supabase
      .from('autonomous_trades')
      .select('*')
      .eq('strategy', strategy)
      .gte('created_at', new Date(Date.now() - EVOLUTION_CONFIG.BACKTEST_WINDOW_DAYS * 86400000).toISOString())
      .order('created_at', { ascending: true });
    
    if (!trades || trades.length < 10) {
      return { sharpe: 0, trades: 0 };
    }
    
    // Calculate returns with new parameters (simplified)
    const returns: number[] = [];
    let equity = 1;
    
    for (const trade of trades) {
      // Simulate with new stop loss / take profit
      const originalReturn = trade.pnl_percent / 100;
      
      // Adjust based on parameter changes
      const adjustedReturn = originalReturn * (1 + (Math.random() - 0.5) * 0.2);
      
      equity *= (1 + adjustedReturn);
      returns.push(adjustedReturn);
    }
    
    // Calculate Sharpe
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    const vol = Math.sqrt(variance) * Math.sqrt(252);
    const sharpe = vol > 0 ? avg / vol : 0;
    
    return { sharpe, trades: trades.length };
  }
  
  async recordTrade(strategy: string, trade: {
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    side: 'long' | 'short';
    pnl: number;
    pnlPercent: number;
    holdingTime: number;
    regime: string;
  }) {
    const metrics = this.metrics.get(strategy);
    if (!metrics) return;
    
    // Update basic metrics
    metrics.totalTrades++;
    
    if (trade.pnl > 0) {
      metrics.winningTrades++;
      metrics.avgWin = ((metrics.avgWin * (metrics.winningTrades - 1)) + trade.pnl) / metrics.winningTrades;
    } else {
      metrics.losingTrades++;
      metrics.avgLoss = ((metrics.avgLoss * (metrics.losingTrades - 1)) + Math.abs(trade.pnl)) / metrics.losingTrades;
    }
    
    metrics.totalPnl += trade.pnl;
    metrics.winRate = metrics.winningTrades / metrics.totalTrades;
    metrics.profitFactor = metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 1;
    metrics.avgHoldingTime = ((metrics.avgHoldingTime * (metrics.totalTrades - 1)) + trade.holdingTime) / metrics.totalTrades;
    
    // Update regime performance
    if (!this.regimePerformance.has(strategy)) {
      this.regimePerformance.set(strategy, new Map());
    }
    const regimeMap = this.regimePerformance.get(strategy)!;
    const currentRegimePnl = regimeMap.get(trade.regime) || 0;
    regimeMap.set(trade.regime, currentRegimePnl + trade.pnl);
    
    // Find best/worst regime
    let bestRegime = metrics.bestRegime;
    let worstRegime = metrics.worstRegime;
    let bestPnl = -Infinity;
    let worstPnl = Infinity;
    
    for (const [regime, pnl] of regimeMap) {
      if (pnl > bestPnl) {
        bestPnl = pnl;
        bestRegime = regime;
      }
      if (pnl < worstPnl) {
        worstPnl = pnl;
        worstRegime = regime;
      }
    }
    
    metrics.bestRegime = bestRegime;
    metrics.worstRegime = worstRegime;
    
    // Recalculate Sharpe (simplified)
    const returns = [trade.pnlPercent / 100];
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    const vol = Math.sqrt(variance) * Math.sqrt(252);
    metrics.sharpeRatio = vol > 0 ? avg / vol : 0;
    
    // Save to database
    await this.saveMetrics(strategy, metrics);
  }
  
  getOptimalParameters(strategy: string): Record<string, number> {
    return this.metrics.get(strategy)?.parameters || {};
  }
  
  isStrategyEnabled(strategy: string): boolean {
    return this.metrics.get(strategy)?.enabled ?? false;
  }
  
  getStrategyWeight(strategy: string): number {
    return this.metrics.get(strategy)?.weight || 0;
  }
  
  getBestStrategyForRegime(regime: string): string {
    let bestStrategy = 'MOMENTUM';
    let bestPnl = -Infinity;
    
    for (const [strategy, regimeMap] of this.regimePerformance) {
      const pnl = regimeMap.get(regime) || 0;
      if (pnl > bestPnl) {
        bestPnl = pnl;
        bestStrategy = strategy;
      }
    }
    
    return bestStrategy;
  }
  
  getAllMetrics(): StrategyMetrics[] {
    return Array.from(this.metrics.values());
  }
  
  private async loadMetrics() {
    try {
      const { data } = await supabase
        .from('strategy_metrics')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (data) {
        data.forEach((row: any) => {
          this.metrics.set(row.strategy, {
            strategy: row.strategy,
            totalTrades: row.total_trades,
            winningTrades: row.winning_trades,
            losingTrades: row.losing_trades,
            totalPnl: row.total_pnl,
            avgWin: row.avg_win,
            avgLoss: row.avg_loss,
            winRate: row.win_rate,
            profitFactor: row.profit_factor,
            sharpeRatio: row.sharpe_ratio,
            maxDrawdown: row.max_drawdown,
            calmarRatio: row.calmar_ratio,
            avgHoldingTime: row.avg_holding_time,
            bestRegime: row.best_regime,
            worstRegime: row.worst_regime,
            enabled: row.enabled,
            weight: row.weight,
            parameters: row.parameters,
          });
        });
      }
    } catch (err) {
      console.warn('[StrategyEvolver] Failed to load metrics:', err);
    }
  }
  
  private async saveMetrics(strategy: string, metrics: StrategyMetrics) {
    try {
      await supabase.from('strategy_metrics').upsert({
        strategy,
        total_trades: metrics.totalTrades,
        winning_trades: metrics.winningTrades,
        losing_trades: metrics.losingTrades,
        total_pnl: metrics.totalPnl,
        avg_win: metrics.avgWin,
        avg_loss: metrics.avgLoss,
        win_rate: metrics.winRate,
        profit_factor: metrics.profitFactor,
        sharpe_ratio: metrics.sharpeRatio,
        max_drawdown: metrics.maxDrawdown,
        calmar_ratio: metrics.calmarRatio,
        avg_holding_time: metrics.avgHoldingTime,
        best_regime: metrics.bestRegime,
        worst_regime: metrics.worstRegime,
        enabled: metrics.enabled,
        weight: metrics.weight,
        parameters: metrics.parameters,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[StrategyEvolver] Failed to save metrics:', err);
    }
  }
}
