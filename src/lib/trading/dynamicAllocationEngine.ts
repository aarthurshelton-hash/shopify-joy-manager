/**
 * Dynamic Allocation Engine
 * 
 * Self-adjusting portfolio allocation based on:
 * - Market regime detection
 * - Strategy performance tracking
 * - Risk metrics (volatility, drawdown, correlation)
 * - Kelly criterion for position sizing
 */

import { ASSET_CLASSES, RISK_CONFIG, STRATEGY_REGISTRY, EVOLUTION_CONFIG } from './multiAssetConfig';
import { UnifiedDataPipeline } from './unifiedDataPipeline';

interface Allocation {
  assetClass: string;
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  strategy: string;
  expectedReturn: number;
  volatility: number;
  sharpe: number;
}

interface StrategyPerformance {
  strategy: string;
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  trades: number;
  lastUpdated: string;
}

export class DynamicAllocationEngine {
  private allocations: Allocation[] = [];
  private strategyPerformance: Map<string, StrategyPerformance> = new Map();
  private currentRegime: string = 'neutral';
  private lastRebalance: Date = new Date();
  
  constructor(
    private pipeline: UnifiedDataPipeline,
    private supabase: any,
    private accountBalance: number
  ) {}
  
  async initialize() {
    console.log('[AllocationEngine] Initializing...');
    
    // Load historical performance
    await this.loadStrategyPerformance();
    
    // Set initial allocations
    this.setBaseAllocations();
    
    // Start rebalancing loop
    this.startRebalancingLoop();
    
    console.log('[AllocationEngine] Initialized');
  }
  
  private setBaseAllocations() {
    // Start with base weights from config
    this.allocations = [];
    
    // Equities
    ASSET_CLASSES.EQUITIES.symbols.US.forEach(symbol => {
      this.allocations.push({
        assetClass: 'EQUITIES_US',
        symbol,
        targetWeight: ASSET_CLASSES.EQUITIES.allocation / 
          (ASSET_CLASSES.EQUITIES.symbols.US.length + ASSET_CLASSES.EQUITIES.symbols.INTL.length + ASSET_CLASSES.EQUITIES.symbols.SECTORS.length),
        currentWeight: 0,
        strategy: 'MOMENTUM',
        expectedReturn: 0.10,
        volatility: 0.20,
        sharpe: 0.5,
      });
    });
    
    // Bonds
    ASSET_CLASSES.BONDS.symbols.forEach(symbol => {
      this.allocations.push({
        assetClass: 'BONDS',
        symbol,
        targetWeight: ASSET_CLASSES.BONDS.allocation / ASSET_CLASSES.BONDS.symbols.length,
        currentWeight: 0,
        strategy: 'CARRY_TRADE',
        expectedReturn: 0.04,
        volatility: 0.08,
        sharpe: 0.5,
      });
    });
    
    // Forex
    ASSET_CLASSES.FOREX.pairs.forEach(symbol => {
      this.allocations.push({
        assetClass: 'FOREX',
        symbol,
        targetWeight: ASSET_CLASSES.FOREX.allocation / ASSET_CLASSES.FOREX.pairs.length,
        currentWeight: 0,
        strategy: 'CARRY_TRADE',
        expectedReturn: 0.03,
        volatility: 0.10,
        sharpe: 0.3,
      });
    });
    
    // Commodities
    ASSET_CLASSES.COMMODITIES.symbols.forEach(symbol => {
      this.allocations.push({
        assetClass: 'COMMODITIES',
        symbol,
        targetWeight: ASSET_CLASSES.COMMODITIES.allocation / ASSET_CLASSES.COMMODITIES.symbols.length,
        currentWeight: 0,
        strategy: 'MEAN_REVERSION',
        expectedReturn: 0.06,
        volatility: 0.25,
        sharpe: 0.24,
      });
    });
  }
  
  private startRebalancingLoop() {
    setInterval(async () => {
      await this.rebalance();
    }, EVOLUTION_CONFIG.REBALANCE_FREQUENCY_HOURS * 60 * 60 * 1000);
  }
  
  async rebalance() {
    console.log('[AllocationEngine] Starting rebalancing...');
    
    const macro = this.pipeline.getMacroRegime();
    if (!macro) {
      console.warn('[AllocationEngine] No macro data, skipping rebalance');
      return;
    }
    
    this.currentRegime = macro.marketRegime;
    
    // Step 1: Adjust allocations based on regime
    await this.adjustForRegime(macro);
    
    // Step 2: Adjust for strategy performance
    await this.adjustForStrategyPerformance();
    
    // Step 3: Apply risk constraints
    this.applyRiskConstraints();
    
    // Step 4: Normalize to 100%
    this.normalizeWeights();
    
    // Step 5: Save to database
    await this.saveAllocations();
    
    this.lastRebalance = new Date();
    console.log('[AllocationEngine] Rebalancing complete');
  }
  
  private async adjustForRegime(macro: any) {
    // Risk-on: Increase equities, decrease bonds
    // Risk-off: Increase bonds, decrease equities
    // Crisis: Cash/short positions
    
    switch (macro.marketRegime) {
      case 'risk_on':
        this.shiftWeight('EQUITIES_US', 0.10);
        this.shiftWeight('BONDS', -0.05);
        this.shiftWeight('COMMODITIES', 0.05);
        break;
        
      case 'risk_off':
        this.shiftWeight('EQUITIES_US', -0.10);
        this.shiftWeight('BONDS', 0.10);
        this.shiftWeight('FOREX', 0.05);
        break;
        
      case 'crisis':
        // Move to defensive: TLT, GLD, USD
        this.allocations.forEach(a => {
          if (a.assetClass === 'EQUITIES_US') a.targetWeight *= 0.3;
          if (a.symbol === 'TLT') a.targetWeight *= 2;
          if (a.symbol === 'GC' || a.symbol === 'GLD') a.targetWeight *= 1.5;
        });
        break;
    }
    
    // Yield curve adjustments
    if (macro.yieldCurve.slope < 0) {
      // Inverted curve - defensive positioning
      this.shiftWeight('BONDS', 0.05);
      this.shiftWeight('EQUITIES_US', -0.05);
    }
  }
  
  private async adjustForStrategyPerformance() {
    // Calculate weight adjustments based on strategy Sharpe ratios
    const totalWeight = this.allocations.reduce((sum, a) => sum + a.targetWeight, 0);
    
    for (const allocation of this.allocations) {
      const perf = this.strategyPerformance.get(allocation.strategy);
      
      if (perf && perf.trades >= EVOLUTION_CONFIG.MIN_TRADES_FOR_EVALUATION) {
        if (perf.sharpeRatio < 1.0) {
          // Underperforming - reduce allocation
          allocation.targetWeight *= (1 - EVOLUTION_CONFIG.ADAPTATION_RATE);
          allocation.strategy = this.findBetterStrategy(allocation.assetClass);
        } else if (perf.sharpeRatio > 1.5) {
          // Outperforming - increase allocation
          allocation.targetWeight *= (1 + EVOLUTION_CONFIG.ADAPTATION_RATE);
        }
      }
    }
  }
  
  private applyRiskConstraints() {
    // Max sector exposure
    const sectorWeights = new Map<string, number>();
    
    for (const allocation of this.allocations) {
      const current = sectorWeights.get(allocation.assetClass) || 0;
      sectorWeights.set(allocation.assetClass, current + allocation.targetWeight);
    }
    
    // Cap sector exposure
    for (const allocation of this.allocations) {
      const sectorWeight = sectorWeights.get(allocation.assetClass) || 0;
      if (sectorWeight > RISK_CONFIG.MAX_SECTOR_EXPOSURE) {
        const scale = RISK_CONFIG.MAX_SECTOR_EXPOSURE / sectorWeight;
        allocation.targetWeight *= scale;
      }
    }
    
    // Correlation constraint - reduce correlated positions
    this.reduceCorrelatedExposure();
  }
  
  private reduceCorrelatedExposure() {
    // Find highly correlated pairs and reduce combined exposure
    const threshold = 0.8;
    
    for (let i = 0; i < this.allocations.length; i++) {
      for (let j = i + 1; j < this.allocations.length; j++) {
        const corr = this.pipeline.getCorrelation(
          this.allocations[i].symbol,
          this.allocations[j].symbol
        );
        
        if (Math.abs(corr) > threshold) {
          const combined = this.allocations[i].targetWeight + this.allocations[j].targetWeight;
          
          if (combined > RISK_CONFIG.MAX_CORRELATED_EXPOSURE) {
            const scale = RISK_CONFIG.MAX_CORRELATED_EXPOSURE / combined;
            this.allocations[i].targetWeight *= scale;
            this.allocations[j].targetWeight *= scale;
          }
        }
      }
    }
  }
  
  private normalizeWeights() {
    const total = this.allocations.reduce((sum, a) => sum + a.targetWeight, 0);
    
    if (total > 0) {
      this.allocations.forEach(a => {
        a.targetWeight = a.targetWeight / total;
      });
    }
  }
  
  private shiftWeight(assetClass: string, delta: number) {
    const allocations = this.allocations.filter(a => a.assetClass === assetClass);
    if (allocations.length === 0) return;
    
    const perAllocation = delta / allocations.length;
    allocations.forEach(a => a.targetWeight += perAllocation);
  }
  
  private findBetterStrategy(assetClass: string): string {
    // Find best performing strategy for this asset class
    let bestStrategy = 'MOMENTUM';
    let bestSharpe = -Infinity;
    
    for (const [name, perf] of this.strategyPerformance) {
      if (perf.sharpeRatio > bestSharpe && perf.trades > 20) {
        bestSharpe = perf.sharpeRatio;
        bestStrategy = name;
      }
    }
    
    return bestSharpe > 1.0 ? bestStrategy : 'MOMENTUM';
  }
  
  calculatePositionSize(symbol: string, signalConfidence: number, stopLossPercent: number): number {
    const allocation = this.allocations.find(a => a.symbol === symbol);
    if (!allocation) return 0;
    
    // Kelly criterion sizing
    const winRate = this.strategyPerformance.get(allocation.strategy)?.winRate || 0.5;
    const avgWin = 1.5; // Take profit %
    const avgLoss = stopLossPercent;
    
    // Kelly fraction: (p*b - q) / b where p=win rate, b=avg win/avg loss, q=loss rate
    const b = avgWin / avgLoss;
    const q = 1 - winRate;
    const kelly = (winRate * b - q) / b;
    
    // Apply Kelly fraction and confidence
    const positionPercent = allocation.targetWeight * Math.max(0, kelly) * RISK_CONFIG.KELLY_FRACTION * signalConfidence;
    
    // Convert to dollar amount
    return this.accountBalance * positionPercent;
  }
  
  async updateStrategyPerformance(strategy: string, tradeResult: { pnl: number; winning: boolean }) {
    let perf = this.strategyPerformance.get(strategy);
    
    if (!perf) {
      perf = {
        strategy,
        totalReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0.5,
        profitFactor: 1,
        trades: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    
    perf.trades++;
    perf.totalReturn += tradeResult.pnl;
    perf.winRate = ((perf.winRate * (perf.trades - 1)) + (tradeResult.winning ? 1 : 0)) / perf.trades;
    perf.lastUpdated = new Date().toISOString();
    
    // Recalculate Sharpe (simplified)
    const returns = [tradeResult.pnl / this.accountBalance];
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    const vol = Math.sqrt(variance) * Math.sqrt(252); // Annualize
    perf.volatility = vol;
    perf.sharpeRatio = vol > 0 ? avg / vol : 0;
    
    this.strategyPerformance.set(strategy, perf);
    
    // Persist to database
    await this.supabase.from('strategy_performance').upsert({
      strategy,
      ...perf,
      updated_at: new Date().toISOString(),
    });
  }
  
  private async loadStrategyPerformance() {
    try {
      const { data } = await this.supabase
        .from('strategy_performance')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (data) {
        data.forEach((row: any) => {
          this.strategyPerformance.set(row.strategy, row);
        });
      }
    } catch (err) {
      console.warn('[AllocationEngine] Failed to load strategy performance:', err);
    }
  }
  
  private async saveAllocations() {
    try {
      await this.supabase.from('portfolio_allocations').upsert(
        this.allocations.map(a => ({
          symbol: a.symbol,
          asset_class: a.assetClass,
          target_weight: a.targetWeight,
          current_weight: a.currentWeight,
          strategy: a.strategy,
          expected_return: a.expectedReturn,
          volatility: a.volatility,
          sharpe: a.sharpe,
          regime: this.currentRegime,
          updated_at: new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error('[AllocationEngine] Failed to save allocations:', err);
    }
  }
  
  getAllocations(): Allocation[] {
    return this.allocations;
  }
  
  getCurrentRegime(): string {
    return this.currentRegime;
  }
  
  getLastRebalance(): Date {
    return this.lastRebalance;
  }
}
