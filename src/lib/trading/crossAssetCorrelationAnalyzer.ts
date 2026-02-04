/**
 * Cross-Asset Correlation Analyzer
 * 
 * Detects lead-lag relationships, cointegration, and regime changes
 * across asset classes for pairs trading and risk management.
 */

import { ASSET_CLASSES } from './multiAssetConfig';

interface CorrelationMatrix {
  timestamp: string;
  correlations: Map<string, Map<string, number>>;
  rollingWindow: number;
}

interface CointegrationPair {
  asset1: string;
  asset2: string;
  beta: number;
  zScore: number;
  halfLife: number;
  pValue: number;
  isCointegrated: boolean;
  signal: 'long_spread' | 'short_spread' | 'none';
  confidence: number;
}

interface LeadLag {
  leader: string;
  lagger: string;
  lagMinutes: number;
  correlation: number;
  grangerPValue: number;
  confidence: number;
}

interface RegimeChange {
  timestamp: string;
  asset: string;
  fromRegime: string;
  toRegime: string;
  confidence: number;
  meanShift: number;
  volShift: number;
}

export class CrossAssetCorrelationAnalyzer {
  private priceHistory: Map<string, number[]> = new Map();
  private returnsHistory: Map<string, number[]> = new Map();
  private correlationMatrix: CorrelationMatrix | null = null;
  private cointegrationPairs: CointegrationPair[] = [];
  private leadLags: LeadLag[] = [];
  private regimeChanges: RegimeChange[] = [];
  
  private readonly MAX_HISTORY = 252; // 1 year of daily data
  private readonly ROLLING_WINDOW = 60; // 60-day rolling correlation
  private readonly COINTEGRATION_THRESHOLD = 0.05;
  
  constructor(private supabase: any) {}
  
  async initialize() {
    console.log('[CorrelationAnalyzer] Initializing...');
    
    // Load historical prices
    await this.loadPriceHistory();
    
    // Start analysis loops
    this.startCorrelationUpdates();
    this.startCointegrationScan();
    this.startLeadLagDetection();
    this.startRegimeMonitoring();
    
    console.log('[CorrelationAnalyzer] Initialized');
  }
  
  async addPricePoint(symbol: string, price: number, timestamp: string) {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(price);
    
    // Trim to max history
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
    
    // Calculate return
    if (history.length > 1) {
      const ret = (price - history[history.length - 2]) / history[history.length - 2];
      
      if (!this.returnsHistory.has(symbol)) {
        this.returnsHistory.set(symbol, []);
      }
      
      const returns = this.returnsHistory.get(symbol)!;
      returns.push(ret);
      
      if (returns.length > this.MAX_HISTORY) {
        returns.shift();
      }
    }
  }
  
  private startCorrelationUpdates() {
    // Update correlations every 5 minutes
    setInterval(() => {
      this.updateCorrelationMatrix();
    }, 300000);
  }
  
  private updateCorrelationMatrix() {
    const symbols = Array.from(this.returnsHistory.keys());
    const correlations = new Map<string, Map<string, number>>();
    
    for (const sym1 of symbols) {
      const row = new Map<string, number>();
      const returns1 = this.returnsHistory.get(sym1)?.slice(-this.ROLLING_WINDOW) || [];
      
      for (const sym2 of symbols) {
        if (sym1 === sym2) {
          row.set(sym2, 1.0);
        } else {
          const returns2 = this.returnsHistory.get(sym2)?.slice(-this.ROLLING_WINDOW) || [];
          const corr = this.calculateCorrelation(returns1, returns2);
          row.set(sym2, corr);
        }
      }
      
      correlations.set(sym1, row);
    }
    
    this.correlationMatrix = {
      timestamp: new Date().toISOString(),
      correlations,
      rollingWindow: this.ROLLING_WINDOW,
    };
  }
  
  private startCointegrationScan() {
    // Scan for cointegration every hour
    setInterval(() => {
      this.scanCointegration();
    }, 3600000);
  }
  
  private scanCointegration() {
    this.cointegrationPairs = [];
    const symbols = Array.from(this.priceHistory.keys());
    
    // Focus on known relationships
    const pairsToCheck = [
      ['SPY', 'QQQ'],
      ['SPY', 'IWM'],
      ['TLT', 'SPY'],
      ['GLD', 'SLV'],
      ['UUP', 'SPY'],
      ['VIX', 'SPY'],
      ['XLE', 'CL'],
      ['XLF', 'TLT'],
    ];
    
    for (const [sym1, sym2] of pairsToCheck) {
      if (!this.priceHistory.has(sym1) || !this.priceHistory.has(sym2)) continue;
      
      const prices1 = this.priceHistory.get(sym1)!;
      const prices2 = this.priceHistory.get(sym2)!;
      
      if (prices1.length < 60 || prices2.length < 60) continue;
      
      const result = this.testCointegration(prices1, prices2);
      
      if (result.isCointegrated) {
        this.cointegrationPairs.push({
          asset1: sym1,
          asset2: sym2,
          ...result,
        });
      }
    }
    
    // Sort by confidence
    this.cointegrationPairs.sort((a, b) => b.confidence - a.confidence);
  }
  
  private testCointegration(prices1: number[], prices2: number[]): Partial<CointegrationPair> {
    // Simplified Engle-Granger test
    const n = Math.min(prices1.length, prices2.length);
    const p1 = prices1.slice(-n);
    const p2 = prices2.slice(-n);
    
    // OLS regression: p1 = alpha + beta * p2 + epsilon
    const { beta, alpha } = this.olsRegression(p2, p1);
    
    // Calculate spread
    const spread = p1.map((p1i, i) => p1i - alpha - beta * p2[i]);
    
    // Test spread for stationarity (ADF-like)
    const { isStationary, pValue } = this.testStationarity(spread);
    
    // Calculate z-score of current spread
    const mean = spread.reduce((a, b) => a + b, 0) / spread.length;
    const variance = spread.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spread.length;
    const std = Math.sqrt(variance);
    const currentSpread = spread[spread.length - 1];
    const zScore = (currentSpread - mean) / std;
    
    // Calculate half-life (mean reversion speed)
    const halfLife = this.calculateHalfLife(spread);
    
    // Generate signal
    let signal: 'long_spread' | 'short_spread' | 'none' = 'none';
    if (zScore < -2) signal = 'long_spread';
    else if (zScore > 2) signal = 'short_spread';
    
    return {
      beta,
      zScore,
      halfLife,
      pValue,
      isCointegrated: isStationary && pValue < this.COINTEGRATION_THRESHOLD,
      signal,
      confidence: Math.abs(zScore) / 3, // Normalize to 0-1
    };
  }
  
  private startLeadLagDetection() {
    // Detect lead-lag every 2 hours
    setInterval(() => {
      this.detectLeadLag();
    }, 7200000);
  }
  
  private detectLeadLag() {
    this.leadLags = [];
    const symbols = Array.from(this.returnsHistory.keys());
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const sym1 = symbols[i];
        const sym2 = symbols[j];
        
        const returns1 = this.returnsHistory.get(sym1) || [];
        const returns2 = this.returnsHistory.get(sym2) || [];
        
        if (returns1.length < 30 || returns2.length < 30) continue;
        
        // Test both directions
        const test12 = this.testGrangerCausality(returns1, returns2);
        const test21 = this.testGrangerCausality(returns2, returns1);
        
        if (test12.pValue < 0.05 && test12.correlation > 0.5) {
          this.leadLags.push({
            leader: sym1,
            lagger: sym2,
            lagMinutes: test12.optimalLag,
            correlation: test12.correlation,
            grangerPValue: test12.pValue,
            confidence: 1 - test12.pValue,
          });
        }
        
        if (test21.pValue < 0.05 && test21.correlation > 0.5) {
          this.leadLags.push({
            leader: sym2,
            lagger: sym1,
            lagMinutes: test21.optimalLag,
            correlation: test21.correlation,
            grangerPValue: test21.pValue,
            confidence: 1 - test21.pValue,
          });
        }
      }
    }
    
    // Sort by confidence
    this.leadLags.sort((a, b) => b.confidence - a.confidence);
  }
  
  private startRegimeMonitoring() {
    // Monitor for regime changes every 30 minutes
    setInterval(() => {
      this.detectRegimeChanges();
    }, 1800000);
  }
  
  private detectRegimeChanges() {
    for (const [symbol, prices] of this.priceHistory) {
      if (prices.length < 60) continue;
      
      // Split into two regimes
      const midpoint = Math.floor(prices.length / 2);
      const regime1 = prices.slice(0, midpoint);
      const regime2 = prices.slice(midpoint);
      
      const mean1 = regime1.reduce((a, b) => a + b, 0) / regime1.length;
      const mean2 = regime2.reduce((a, b) => a + b, 0) / regime2.length;
      const vol1 = Math.sqrt(regime1.reduce((sum, p) => sum + Math.pow(p - mean1, 2), 0) / regime1.length);
      const vol2 = Math.sqrt(regime2.reduce((sum, p) => sum + Math.pow(p - mean2, 2), 0) / regime2.length);
      
      // Check for significant shift
      const meanShift = Math.abs(mean2 - mean1) / mean1;
      const volShift = Math.abs(vol2 - vol1) / vol1;
      
      if (meanShift > 0.05 || volShift > 0.2) {
        const fromRegime = vol1 > 0.2 ? 'high_vol' : 'low_vol';
        const toRegime = vol2 > 0.2 ? 'high_vol' : 'low_vol';
        
        if (fromRegime !== toRegime) {
          this.regimeChanges.push({
            timestamp: new Date().toISOString(),
            asset: symbol,
            fromRegime,
            toRegime,
            confidence: Math.max(meanShift, volShift),
            meanShift,
            volShift,
          });
          
          // Keep only last 100 changes
          if (this.regimeChanges.length > 100) {
            this.regimeChanges.shift();
          }
        }
      }
    }
  }
  
  // Helper methods
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  private olsRegression(x: number[], y: number[]): { beta: number; alpha: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const beta = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const alpha = (sumY - beta * sumX) / n;
    
    return { beta, alpha };
  }
  
  private testStationarity(series: number[]): { isStationary: boolean; pValue: number } {
    // Simplified ADF test proxy
    const returns = series.slice(1).map((v, i) => v - series[i]);
    const autocorr = this.calculateCorrelation(returns.slice(0, -1), returns.slice(1));
    
    return {
      isStationary: Math.abs(autocorr) < 0.9,
      pValue: 1 - Math.abs(autocorr),
    };
  }
  
  private calculateHalfLife(spread: number[]): number {
    // Ornstein-Uhlenbeck half-life
    const lagSpread = spread.slice(0, -1);
    const deltaSpread = spread.slice(1).map((s, i) => s - lagSpread[i]);
    
    const { beta } = this.olsRegression(lagSpread, deltaSpread);
    const theta = -Math.log(2) / beta;
    
    return Math.max(1, theta);
  }
  
  private testGrangerCausality(cause: number[], effect: number[]): { pValue: number; correlation: number; optimalLag: number } {
    // Simplified Granger causality test
    let bestCorr = 0;
    let bestLag = 1;
    
    for (let lag = 1; lag <= 5; lag++) {
      const causeLagged = cause.slice(0, -lag);
      const effectCurrent = effect.slice(lag);
      
      if (causeLagged.length < 10) continue;
      
      const corr = Math.abs(this.calculateCorrelation(causeLagged, effectCurrent));
      
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
    
    return {
      pValue: 1 - bestCorr,
      correlation: bestCorr,
      optimalLag: bestLag * 5, // Convert to minutes (assuming 5-min bars)
    };
  }
  
  private async loadPriceHistory() {
    try {
      const { data } = await this.supabase
        .from('price_history')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(10000);
      
      if (data) {
        for (const row of data) {
          this.addPricePoint(row.symbol, row.price, row.timestamp);
        }
      }
    } catch (err) {
      console.warn('[CorrelationAnalyzer] Failed to load price history:', err);
    }
  }
  
  // Public getters
  getCorrelation(sym1: string, sym2: string): number {
    return this.correlationMatrix?.correlations.get(sym1)?.get(sym2) || 0;
  }
  
  getCorrelationMatrix(): CorrelationMatrix | null {
    return this.correlationMatrix;
  }
  
  getCointegrationPairs(): CointegrationPair[] {
    return this.cointegrationPairs;
  }
  
  getLeadLags(): LeadLag[] {
    return this.leadLags;
  }
  
  getRecentRegimeChanges(): RegimeChange[] {
    return this.regimeChanges.slice(-10);
  }
  
  getDiversificationScore(symbol: string): number {
    // Calculate diversification based on average correlation
    let totalCorr = 0;
    let count = 0;
    
    for (const [other, corr] of this.correlationMatrix?.correlations.get(symbol) || []) {
      if (other !== symbol) {
        totalCorr += Math.abs(corr);
        count++;
      }
    }
    
    return count > 0 ? 1 - (totalCorr / count) : 1;
  }
}
