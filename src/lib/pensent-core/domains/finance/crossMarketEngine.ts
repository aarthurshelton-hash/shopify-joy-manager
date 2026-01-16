/**
 * Cross-Market Correlation Engine
 * Tracks relationships between stocks, bonds, futures, and commodities
 * to build a unified prediction enhancement system
 */

export type AssetClass = 'equity' | 'bond' | 'future' | 'commodity' | 'forex' | 'crypto';

export interface MarketTick {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface CrossMarketSignal {
  type: 'divergence' | 'convergence' | 'leading' | 'lagging' | 'breakout' | 'reversal';
  strength: number; // 0-1
  sourceMarkets: AssetClass[];
  description: string;
  predictiveValue: number; // How much this signal historically predicts moves
  timestamp: number;
}

export interface MarketCorrelation {
  market1: AssetClass;
  market2: AssetClass;
  correlation: number; // -1 to 1
  lag: number; // Which leads by how many ticks
  strength: number;
  isInverted: boolean;
}

export interface BigPictureState {
  correlations: MarketCorrelation[];
  activeSignals: CrossMarketSignal[];
  marketSentiment: number; // -1 (fear) to 1 (greed)
  volatilityIndex: number; // 0-100
  riskAppetite: number; // -1 (risk-off) to 1 (risk-on)
  trendAlignment: number; // 0-1, how aligned all markets are
  predictionBoost: number; // Multiplier for prediction confidence
}

export interface MarketSnapshot {
  equity: MarketTick | null;
  bond: MarketTick | null;
  future: MarketTick | null;
  commodity: MarketTick | null;
  forex: MarketTick | null;
  crypto: MarketTick | null;
}

// Historical correlation patterns
const KNOWN_CORRELATIONS: Array<{
  markets: [AssetClass, AssetClass];
  typicalCorrelation: number;
  description: string;
}> = [
  { markets: ['equity', 'bond'], typicalCorrelation: -0.3, description: 'Flight to safety inverse' },
  { markets: ['equity', 'commodity'], typicalCorrelation: 0.4, description: 'Risk-on alignment' },
  { markets: ['bond', 'commodity'], typicalCorrelation: -0.2, description: 'Inflation hedge dynamic' },
  { markets: ['future', 'equity'], typicalCorrelation: 0.95, description: 'Futures lead cash' },
  { markets: ['commodity', 'forex'], typicalCorrelation: -0.3, description: 'Dollar strength inverse' },
  { markets: ['crypto', 'equity'], typicalCorrelation: 0.6, description: 'Risk appetite correlation' },
];

class CrossMarketEngine {
  private tickHistory: Map<AssetClass, MarketTick[]> = new Map();
  private maxHistory = 500;
  private state: BigPictureState;

  constructor() {
    this.state = this.createInitialState();
    
    // Initialize history for each asset class
    const assetClasses: AssetClass[] = ['equity', 'bond', 'future', 'commodity', 'forex', 'crypto'];
    assetClasses.forEach(ac => this.tickHistory.set(ac, []));
  }

  private createInitialState(): BigPictureState {
    return {
      correlations: [],
      activeSignals: [],
      marketSentiment: 0,
      volatilityIndex: 20,
      riskAppetite: 0,
      trendAlignment: 0.5,
      predictionBoost: 1.0
    };
  }

  processTick(tick: MarketTick): BigPictureState {
    // Store tick
    const history = this.tickHistory.get(tick.assetClass) || [];
    history.push(tick);
    if (history.length > this.maxHistory) {
      history.shift();
    }
    this.tickHistory.set(tick.assetClass, history);

    // Update correlations
    this.updateCorrelations();

    // Detect cross-market signals
    this.detectSignals(tick);

    // Calculate big picture metrics
    this.calculateMetrics();

    // Calculate prediction boost
    this.calculatePredictionBoost();

    return this.state;
  }

  private updateCorrelations(): void {
    const correlations: MarketCorrelation[] = [];

    KNOWN_CORRELATIONS.forEach(({ markets, typicalCorrelation }) => {
      const [m1, m2] = markets;
      const history1 = this.tickHistory.get(m1) || [];
      const history2 = this.tickHistory.get(m2) || [];

      if (history1.length > 10 && history2.length > 10) {
        const actualCorrelation = this.calculateCorrelation(history1, history2);
        const deviation = Math.abs(actualCorrelation - typicalCorrelation);
        
        correlations.push({
          market1: m1,
          market2: m2,
          correlation: actualCorrelation,
          lag: this.detectLag(history1, history2),
          strength: 1 - Math.min(deviation, 1),
          isInverted: actualCorrelation < 0
        });
      }
    });

    this.state.correlations = correlations;
  }

  private calculateCorrelation(history1: MarketTick[], history2: MarketTick[]): number {
    const len = Math.min(history1.length, history2.length, 50);
    if (len < 5) return 0;

    const changes1 = history1.slice(-len).map(t => t.changePercent);
    const changes2 = history2.slice(-len).map(t => t.changePercent);

    const mean1 = changes1.reduce((a, b) => a + b, 0) / len;
    const mean2 = changes2.reduce((a, b) => a + b, 0) / len;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < len; i++) {
      const d1 = changes1[i] - mean1;
      const d2 = changes2[i] - mean2;
      numerator += d1 * d2;
      denom1 += d1 * d1;
      denom2 += d2 * d2;
    }

    const denom = Math.sqrt(denom1 * denom2);
    return denom === 0 ? 0 : numerator / denom;
  }

  private detectLag(history1: MarketTick[], history2: MarketTick[]): number {
    // Simplified lag detection - check if one market leads
    const len = Math.min(history1.length, history2.length, 20);
    if (len < 10) return 0;

    // Check correlation with offset
    let maxCorr = 0;
    let bestLag = 0;

    for (let lag = -5; lag <= 5; lag++) {
      const corr = this.calculateLaggedCorrelation(history1, history2, lag);
      if (Math.abs(corr) > Math.abs(maxCorr)) {
        maxCorr = corr;
        bestLag = lag;
      }
    }

    return bestLag;
  }

  private calculateLaggedCorrelation(h1: MarketTick[], h2: MarketTick[], lag: number): number {
    const len = Math.min(h1.length, h2.length) - Math.abs(lag) - 1;
    if (len < 5) return 0;

    const c1 = lag >= 0 
      ? h1.slice(lag, lag + len).map(t => t.changePercent)
      : h1.slice(0, len).map(t => t.changePercent);
    const c2 = lag >= 0
      ? h2.slice(0, len).map(t => t.changePercent)
      : h2.slice(-lag, -lag + len).map(t => t.changePercent);

    if (c1.length !== c2.length || c1.length === 0) return 0;

    const mean1 = c1.reduce((a, b) => a + b, 0) / c1.length;
    const mean2 = c2.reduce((a, b) => a + b, 0) / c2.length;

    let num = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < c1.length; i++) {
      const diff1 = c1[i] - mean1;
      const diff2 = c2[i] - mean2;
      num += diff1 * diff2;
      d1 += diff1 * diff1;
      d2 += diff2 * diff2;
    }

    const denom = Math.sqrt(d1 * d2);
    return denom === 0 ? 0 : num / denom;
  }

  private detectSignals(latestTick: MarketTick): void {
    const signals: CrossMarketSignal[] = [];

    // Check for divergences
    const equityHistory = this.tickHistory.get('equity') || [];
    const bondHistory = this.tickHistory.get('bond') || [];

    if (equityHistory.length > 5 && bondHistory.length > 5) {
      const equityTrend = this.calculateTrend(equityHistory.slice(-10));
      const bondTrend = this.calculateTrend(bondHistory.slice(-10));

      // Divergence: both going same direction (unusual)
      if (equityTrend > 0.3 && bondTrend > 0.3) {
        signals.push({
          type: 'divergence',
          strength: Math.min(equityTrend, bondTrend),
          sourceMarkets: ['equity', 'bond'],
          description: 'Unusual equity-bond convergence - potential regime change',
          predictiveValue: 0.7,
          timestamp: Date.now()
        });
      }

      // Flight to safety
      if (equityTrend < -0.3 && bondTrend > 0.3) {
        signals.push({
          type: 'convergence',
          strength: Math.abs(equityTrend - bondTrend) / 2,
          sourceMarkets: ['equity', 'bond'],
          description: 'Flight to safety - risk-off rotation',
          predictiveValue: 0.8,
          timestamp: Date.now()
        });
      }
    }

    // Check futures leading
    const futureHistory = this.tickHistory.get('future') || [];
    if (futureHistory.length > 5 && equityHistory.length > 5) {
      const futureTrend = this.calculateTrend(futureHistory.slice(-5));
      const equityTrend = this.calculateTrend(equityHistory.slice(-5));

      if (Math.abs(futureTrend) > 0.2 && Math.sign(futureTrend) !== Math.sign(equityTrend)) {
        signals.push({
          type: 'leading',
          strength: Math.abs(futureTrend),
          sourceMarkets: ['future', 'equity'],
          description: `Futures signaling ${futureTrend > 0 ? 'bullish' : 'bearish'} move`,
          predictiveValue: 0.75,
          timestamp: Date.now()
        });
      }
    }

    // Commodity breakout detection
    const commodityHistory = this.tickHistory.get('commodity') || [];
    if (commodityHistory.length > 20) {
      const recentVol = this.calculateVolatility(commodityHistory.slice(-10));
      const baseVol = this.calculateVolatility(commodityHistory.slice(-20, -10));

      if (recentVol > baseVol * 1.5) {
        signals.push({
          type: 'breakout',
          strength: Math.min((recentVol / baseVol - 1), 1),
          sourceMarkets: ['commodity'],
          description: 'Commodity volatility spike - inflation signal',
          predictiveValue: 0.65,
          timestamp: Date.now()
        });
      }
    }

    // Keep only recent signals
    this.state.activeSignals = [...signals, ...this.state.activeSignals]
      .filter(s => Date.now() - s.timestamp < 60000)
      .slice(0, 10);
  }

  private calculateTrend(history: MarketTick[]): number {
    if (history.length < 2) return 0;
    const changes = history.map(t => t.changePercent);
    const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
    return Math.max(-1, Math.min(1, avg * 10)); // Normalize
  }

  private calculateVolatility(history: MarketTick[]): number {
    if (history.length < 2) return 0;
    const changes = history.map(t => Math.abs(t.changePercent));
    return changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  private calculateMetrics(): void {
    const equity = this.tickHistory.get('equity') || [];
    const bond = this.tickHistory.get('bond') || [];
    const commodity = this.tickHistory.get('commodity') || [];
    const crypto = this.tickHistory.get('crypto') || [];

    // Market sentiment: weighted average of trends
    const trends = [
      { weight: 0.4, trend: this.calculateTrend(equity.slice(-20)) },
      { weight: 0.2, trend: this.calculateTrend(commodity.slice(-20)) },
      { weight: 0.2, trend: this.calculateTrend(crypto.slice(-20)) },
      { weight: 0.2, trend: -this.calculateTrend(bond.slice(-20)) } // Inverse for risk
    ];

    this.state.marketSentiment = trends.reduce((sum, t) => sum + t.weight * t.trend, 0);

    // Volatility index
    const vols = [
      this.calculateVolatility(equity.slice(-20)),
      this.calculateVolatility(bond.slice(-20)),
      this.calculateVolatility(commodity.slice(-20))
    ].filter(v => v > 0);

    this.state.volatilityIndex = vols.length > 0 
      ? Math.min(100, vols.reduce((a, b) => a + b, 0) / vols.length * 500)
      : 20;

    // Risk appetite
    this.state.riskAppetite = this.calculateTrend(equity.slice(-10)) - this.calculateTrend(bond.slice(-10));

    // Trend alignment - how correlated all markets are moving
    const allTrends = [
      this.calculateTrend(equity.slice(-10)),
      this.calculateTrend(commodity.slice(-10)),
      this.calculateTrend(crypto.slice(-10))
    ].filter(t => !isNaN(t));

    if (allTrends.length >= 2) {
      const avgTrend = allTrends.reduce((a, b) => a + b, 0) / allTrends.length;
      const variance = allTrends.reduce((sum, t) => sum + Math.pow(t - avgTrend, 2), 0) / allTrends.length;
      this.state.trendAlignment = Math.max(0, 1 - variance);
    }
  }

  private calculatePredictionBoost(): void {
    let boost = 1.0;

    // High alignment increases confidence
    boost += this.state.trendAlignment * 0.2;

    // Strong signals increase confidence
    const strongSignals = this.state.activeSignals.filter(s => s.strength > 0.5);
    boost += strongSignals.length * 0.05;

    // High correlation strength increases confidence
    const avgCorrelationStrength = this.state.correlations.length > 0
      ? this.state.correlations.reduce((sum, c) => sum + c.strength, 0) / this.state.correlations.length
      : 0;
    boost += avgCorrelationStrength * 0.15;

    // Extreme volatility reduces confidence
    if (this.state.volatilityIndex > 50) {
      boost -= (this.state.volatilityIndex - 50) / 100;
    }

    this.state.predictionBoost = Math.max(0.5, Math.min(1.5, boost));
  }

  getState(): BigPictureState {
    return { ...this.state };
  }

  getSnapshot(): MarketSnapshot {
    const getLatest = (ac: AssetClass): MarketTick | null => {
      const history = this.tickHistory.get(ac) || [];
      return history.length > 0 ? history[history.length - 1] : null;
    };

    return {
      equity: getLatest('equity'),
      bond: getLatest('bond'),
      future: getLatest('future'),
      commodity: getLatest('commodity'),
      forex: getLatest('forex'),
      crypto: getLatest('crypto')
    };
  }
}

export const crossMarketEngine = new CrossMarketEngine();
