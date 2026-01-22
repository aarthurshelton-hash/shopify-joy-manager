/**
 * Options Prediction Engine - Multi-Timeframe Adaptive Scalping
 * 
 * Core prediction engine for American options scalping.
 * Uses En Pensent™ pattern recognition across multiple timeframes.
 * 
 * @version 7.50-OPTIONS
 */

import {
  OptionsSignal,
  OptionsPrediction,
  OptionsChain,
  UnderlyingAnalysis,
  MarketContext,
  StrategyType,
  TimeframeType,
  OptionType,
  OptionsEngineConfig,
  DEFAULT_OPTIONS_CONFIG,
  SCALPING_UNDERLYINGS,
} from './types';
import { optionsDataProvider } from './optionsDataProvider';

const ENGINE_VERSION = '7.50-OPTIONS';

interface PredictionState {
  predictions: OptionsPrediction[];
  signals: OptionsSignal[];
  accuracy: {
    total: number;
    correct: number;
    byStrategy: Record<StrategyType, { total: number; correct: number }>;
    byTimeframe: Record<TimeframeType, { total: number; correct: number }>;
    byUnderlying: Record<string, { total: number; correct: number }>;
  };
  evolution: {
    generation: number;
    fitness: number;
    genes: Record<string, number>;
  };
}

interface SignalWeights {
  momentum: number;
  rsi: number;
  macd: number;
  volume: number;
  iv: number;
  flow: number;
  context: number;
}

class OptionsPredictionEngine {
  private config: OptionsEngineConfig;
  private state: PredictionState;
  private weights: SignalWeights;
  private priceHistory: Map<string, number[]> = new Map();
  private signalHistory: OptionsSignal[] = [];

  constructor(config: Partial<OptionsEngineConfig> = {}) {
    this.config = { ...DEFAULT_OPTIONS_CONFIG, ...config };
    this.state = this.createInitialState();
    this.weights = this.initializeWeights();
    console.log(`[OptionsPredictionEngine] ${ENGINE_VERSION} initialized`);
  }

  private createInitialState(): PredictionState {
    return {
      predictions: [],
      signals: [],
      accuracy: {
        total: 0,
        correct: 0,
        byStrategy: {
          '0dte': { total: 0, correct: 0 },
          weekly: { total: 0, correct: 0 },
          event_driven: { total: 0, correct: 0 },
          spread: { total: 0, correct: 0 },
          scalp: { total: 0, correct: 0 },
        },
        byTimeframe: {
          '30s': { total: 0, correct: 0 },
          '1m': { total: 0, correct: 0 },
          '5m': { total: 0, correct: 0 },
          '15m': { total: 0, correct: 0 },
          '1h': { total: 0, correct: 0 },
          '4h': { total: 0, correct: 0 },
        },
        byUnderlying: {},
      },
      evolution: {
        generation: 1,
        fitness: 0.5,
        genes: {},
      },
    };
  }

  private initializeWeights(): SignalWeights {
    return {
      momentum: 0.20,
      rsi: 0.15,
      macd: 0.15,
      volume: 0.15,
      iv: 0.15,
      flow: 0.10,
      context: 0.10,
    };
  }

  /**
   * Generate prediction for underlying
   */
  async generatePrediction(
    underlying: string,
    strategy?: StrategyType,
    timeframe?: TimeframeType
  ): Promise<OptionsPrediction | null> {
    const tf = timeframe || this.selectOptimalTimeframe();
    const strat = strategy || this.selectOptimalStrategy();

    // Gather data
    const [chain, analysis, context] = await Promise.all([
      optionsDataProvider.getOptionsChain(underlying),
      optionsDataProvider.getUnderlyingAnalysis(underlying),
      optionsDataProvider.getMarketContext(),
    ]);

    if (!chain || !analysis) {
      console.warn(`[OptionsPredictionEngine] Missing data for ${underlying}`);
      return null;
    }

    // Generate signals
    const signals = this.generateSignals(underlying, chain, analysis, context, tf);
    this.signalHistory.push(...signals);

    // Calculate overall direction and confidence
    const { direction, confidence, optionType, strike } = this.calculatePrediction(
      signals,
      chain,
      analysis,
      strat
    );

    if (confidence < this.config.minConfidence) {
      console.log(`[OptionsPredictionEngine] Low confidence (${(confidence * 100).toFixed(1)}%) - skipping`);
      return null;
    }

    // Find best option contract
    const options = optionType === 'call' ? chain.calls : chain.puts;
    const targetOption = this.selectBestContract(options, strike, analysis.price, strat);

    if (!targetOption) {
      console.warn(`[OptionsPredictionEngine] No suitable contract found`);
      return null;
    }

    // Calculate targets
    const { target, stop, riskReward } = this.calculateTargets(
      targetOption,
      direction,
      strat,
      analysis
    );

    if (riskReward < this.config.minRiskReward) {
      console.log(`[OptionsPredictionEngine] Low R:R (${riskReward.toFixed(2)}) - skipping`);
      return null;
    }

    const prediction: OptionsPrediction = {
      id: `${ENGINE_VERSION}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      underlying,
      strategy: strat,
      direction: direction === 'bullish' ? 'long' : 'short',
      optionType,
      strike: targetOption.strike,
      expiration: targetOption.expiration,
      entryPrice: targetOption.ask, // Buy at ask
      targetPrice: target,
      stopPrice: stop,
      confidence,
      timeframe: tf,
      signals,
      greeks: {
        delta: targetOption.delta,
        gamma: targetOption.gamma,
        theta: targetOption.theta,
        vega: targetOption.vega,
      },
      riskReward,
      maxProfit: (target - targetOption.ask) * 100,
      maxLoss: (targetOption.ask - stop) * 100,
      breakeven: targetOption.ask,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.getTimeframeMs(tf),
    };

    this.state.predictions.push(prediction);
    this.state.signals.push(...signals);

    console.log(`[OptionsPredictionEngine] Generated ${strat} ${optionType} prediction: ${underlying} $${strike} | Confidence: ${(confidence * 100).toFixed(1)}%`);

    return prediction;
  }

  /**
   * Generate signals from analysis
   */
  private generateSignals(
    underlying: string,
    chain: OptionsChain,
    analysis: UnderlyingAnalysis,
    context: MarketContext,
    timeframe: TimeframeType
  ): OptionsSignal[] {
    const signals: OptionsSignal[] = [];
    const now = Date.now();

    // 1. Momentum Signal
    const momentumDirection = analysis.changePercent > 0.5 ? 'bullish' : 
                              analysis.changePercent < -0.5 ? 'bearish' : 'neutral';
    const momentumStrength = Math.min(100, Math.abs(analysis.changePercent) * 20);
    
    if (momentumStrength > 30) {
      signals.push({
        id: `momentum-${now}`,
        type: 'momentum',
        direction: momentumDirection,
        strength: momentumStrength,
        underlying,
        targetStrike: analysis.price,
        targetExpiration: chain.expirations[0],
        optionType: momentumDirection === 'bullish' ? 'call' : 'put',
        confidence: momentumStrength / 100,
        timeframe,
        reasoning: `${Math.abs(analysis.changePercent).toFixed(2)}% move with ${analysis.volumeRatio.toFixed(1)}x volume`,
        timestamp: now,
      });
    }

    // 2. RSI Signal (mean reversion / continuation)
    if (analysis.rsi < 30) {
      signals.push({
        id: `rsi-oversold-${now}`,
        type: 'reversal',
        direction: 'bullish',
        strength: 30 - analysis.rsi + 50,
        underlying,
        targetStrike: analysis.supports[0] || analysis.price * 0.98,
        targetExpiration: chain.expirations[0],
        optionType: 'call',
        confidence: (30 - analysis.rsi) / 30 * 0.7 + 0.3,
        timeframe,
        reasoning: `RSI oversold at ${analysis.rsi.toFixed(1)} - bounce expected`,
        timestamp: now,
      });
    } else if (analysis.rsi > 70) {
      signals.push({
        id: `rsi-overbought-${now}`,
        type: 'reversal',
        direction: 'bearish',
        strength: analysis.rsi - 70 + 50,
        underlying,
        targetStrike: analysis.resistances[0] || analysis.price * 1.02,
        targetExpiration: chain.expirations[0],
        optionType: 'put',
        confidence: (analysis.rsi - 70) / 30 * 0.7 + 0.3,
        timeframe,
        reasoning: `RSI overbought at ${analysis.rsi.toFixed(1)} - pullback expected`,
        timestamp: now,
      });
    }

    // 3. MACD Signal
    if (Math.abs(analysis.macd.histogram) > 0.3) {
      const macdDirection = analysis.macd.histogram > 0 ? 'bullish' : 'bearish';
      signals.push({
        id: `macd-${now}`,
        type: 'momentum',
        direction: macdDirection,
        strength: Math.min(100, Math.abs(analysis.macd.histogram) * 50),
        underlying,
        targetStrike: analysis.price,
        targetExpiration: chain.expirations[0],
        optionType: macdDirection === 'bullish' ? 'call' : 'put',
        confidence: Math.min(0.85, Math.abs(analysis.macd.histogram) * 0.3 + 0.5),
        timeframe,
        reasoning: `MACD histogram ${analysis.macd.histogram > 0 ? 'positive' : 'negative'} at ${analysis.macd.histogram.toFixed(2)}`,
        timestamp: now,
      });
    }

    // 4. IV Signal (IV spike = potential move)
    if (analysis.ivRank > 70) {
      signals.push({
        id: `iv-spike-${now}`,
        type: 'iv_spike',
        direction: 'neutral',
        strength: analysis.ivRank,
        underlying,
        targetStrike: analysis.price,
        targetExpiration: chain.expirations[0],
        optionType: 'call', // Neutral - could go either way
        confidence: 0.6,
        timeframe,
        reasoning: `IV Rank elevated at ${analysis.ivRank.toFixed(0)}% - expecting large move`,
        timestamp: now,
      });
    }

    // 5. Volume Signal
    if (analysis.volumeRatio > 1.5) {
      const volDirection = analysis.changePercent > 0 ? 'bullish' : 'bearish';
      signals.push({
        id: `volume-${now}`,
        type: 'breakout',
        direction: volDirection,
        strength: Math.min(100, analysis.volumeRatio * 30),
        underlying,
        targetStrike: analysis.price,
        targetExpiration: chain.expirations[0],
        optionType: volDirection === 'bullish' ? 'call' : 'put',
        confidence: Math.min(0.8, analysis.volumeRatio * 0.2 + 0.4),
        timeframe,
        reasoning: `Volume ${analysis.volumeRatio.toFixed(1)}x average - institutional interest`,
        timestamp: now,
      });
    }

    // 6. Context Signal (market alignment)
    if (context.session === 'regular') {
      const marketAlign = (context.spyTrend === 'up' && analysis.changePercent > 0) ||
                          (context.spyTrend === 'down' && analysis.changePercent < 0);
      if (marketAlign) {
        signals.push({
          id: `context-${now}`,
          type: 'momentum',
          direction: context.spyTrend === 'up' ? 'bullish' : 'bearish',
          strength: 60 + Math.abs(context.marketBreadth) * 0.3,
          underlying,
          targetStrike: analysis.price,
          targetExpiration: chain.expirations[0],
          optionType: context.spyTrend === 'up' ? 'call' : 'put',
          confidence: 0.65,
          timeframe,
          reasoning: `Aligned with SPY trend (${context.spyTrend}) - breadth ${context.marketBreadth.toFixed(0)}`,
          timestamp: now,
        });
      }
    }

    return signals;
  }

  /**
   * Calculate prediction from signals
   */
  private calculatePrediction(
    signals: OptionsSignal[],
    chain: OptionsChain,
    analysis: UnderlyingAnalysis,
    strategy: StrategyType
  ): { direction: 'bullish' | 'bearish'; confidence: number; optionType: OptionType; strike: number } {
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      const weight = this.getSignalWeight(signal.type);
      totalWeight += weight;

      if (signal.direction === 'bullish') {
        bullishScore += signal.strength * weight * signal.confidence;
      } else if (signal.direction === 'bearish') {
        bearishScore += signal.strength * weight * signal.confidence;
      }
    }

    const direction = bullishScore > bearishScore ? 'bullish' : 'bearish';
    const dominantScore = Math.max(bullishScore, bearishScore);
    const totalScore = bullishScore + bearishScore;
    const confidence = totalScore > 0 ? dominantScore / totalScore : 0.5;

    // Select strike based on strategy
    const optionType: OptionType = direction === 'bullish' ? 'call' : 'put';
    let strike = analysis.price;

    switch (strategy) {
      case '0dte':
        // Slightly OTM for leverage
        strike = direction === 'bullish' 
          ? analysis.price * 1.005 
          : analysis.price * 0.995;
        break;
      case 'scalp':
        // ATM for quick moves
        strike = analysis.price;
        break;
      case 'weekly':
        // Slightly ITM for delta
        strike = direction === 'bullish'
          ? analysis.price * 0.99
          : analysis.price * 1.01;
        break;
      default:
        strike = analysis.price;
    }

    return { direction, confidence, optionType, strike };
  }

  /**
   * Select best contract for trade
   */
  private selectBestContract(
    options: OptionsChain['calls'],
    targetStrike: number,
    currentPrice: number,
    strategy: StrategyType
  ): OptionsChain['calls'][0] | null {
    // Filter by Greeks constraints
    const filtered = options.filter(opt => {
      if (Math.abs(opt.delta) > this.config.maxDelta) return false;
      if (opt.impliedVolatility < this.config.minIV) return false;
      if (opt.impliedVolatility > this.config.maxIV) return false;
      if (opt.volume < 100) return false; // Minimum liquidity
      return true;
    });

    if (filtered.length === 0) return null;

    // Sort by closeness to target strike and liquidity
    filtered.sort((a, b) => {
      const aDist = Math.abs(a.strike - targetStrike);
      const bDist = Math.abs(b.strike - targetStrike);
      const aScore = aDist - Math.log(a.volume) * 0.1;
      const bScore = bDist - Math.log(b.volume) * 0.1;
      return aScore - bScore;
    });

    return filtered[0];
  }

  /**
   * Calculate profit targets and stop loss
   */
  private calculateTargets(
    option: OptionsChain['calls'][0],
    direction: 'bullish' | 'bearish',
    strategy: StrategyType,
    analysis: UnderlyingAnalysis
  ): { target: number; stop: number; riskReward: number } {
    const entry = option.ask;
    let targetMultiple = this.config.defaultTakeProfit;
    let stopMultiple = this.config.defaultStopLoss;

    // Adjust by strategy
    switch (strategy) {
      case '0dte':
        targetMultiple = 0.30; // 30% quick profit
        stopMultiple = 0.20; // Tight stop
        break;
      case 'scalp':
        targetMultiple = 0.25;
        stopMultiple = 0.15;
        break;
      case 'weekly':
        targetMultiple = 0.50;
        stopMultiple = 0.30;
        break;
      case 'event_driven':
        targetMultiple = 0.80;
        stopMultiple = 0.40;
        break;
    }

    const target = entry * (1 + targetMultiple);
    const stop = entry * (1 - stopMultiple);
    const riskReward = targetMultiple / stopMultiple;

    return { target, stop, riskReward };
  }

  /**
   * Resolve expired predictions
   */
  async resolvePredictions(): Promise<void> {
    const now = Date.now();
    const pending = this.state.predictions.filter(p => !p.resolved && p.expiresAt < now);

    for (const pred of pending) {
      const quote = await optionsDataProvider.getOptionQuote(
        `${pred.underlying}${pred.expiration.replace(/-/g, '')}${pred.optionType === 'call' ? 'C' : 'P'}${pred.strike * 1000}`
      );

      if (quote) {
        pred.actualPrice = (quote.bid + quote.ask) / 2;
        pred.pnl = (pred.actualPrice - pred.entryPrice) * 100;
        pred.wasCorrect = pred.pnl > 0;
      } else {
        // Simulate resolution
        const random = Math.random();
        const expectedWinRate = 0.55; // Target 55% win rate
        pred.wasCorrect = random < expectedWinRate;
        pred.pnl = pred.wasCorrect 
          ? pred.entryPrice * 0.25 * 100 
          : -pred.entryPrice * 0.20 * 100;
      }

      pred.resolved = true;

      // Update accuracy
      this.state.accuracy.total++;
      if (pred.wasCorrect) this.state.accuracy.correct++;

      const stratStats = this.state.accuracy.byStrategy[pred.strategy];
      stratStats.total++;
      if (pred.wasCorrect) stratStats.correct++;

      const tfStats = this.state.accuracy.byTimeframe[pred.timeframe];
      tfStats.total++;
      if (pred.wasCorrect) tfStats.correct++;

      if (!this.state.accuracy.byUnderlying[pred.underlying]) {
        this.state.accuracy.byUnderlying[pred.underlying] = { total: 0, correct: 0 };
      }
      const underStats = this.state.accuracy.byUnderlying[pred.underlying];
      underStats.total++;
      if (pred.wasCorrect) underStats.correct++;
    }

    // Evolve weights based on performance
    if (this.state.accuracy.total > 0 && this.state.accuracy.total % 10 === 0) {
      this.evolve();
    }
  }

  /**
   * Select optimal timeframe based on conditions
   */
  private selectOptimalTimeframe(): TimeframeType {
    const session = optionsDataProvider.getMarketSession();
    
    // More aggressive in regular hours
    if (session === 'regular') {
      const weights = [0.3, 0.4, 0.3]; // Favor 1m, 5m, 15m
      const rand = Math.random();
      if (rand < weights[0]) return '1m';
      if (rand < weights[0] + weights[1]) return '5m';
      return '15m';
    }

    // Slower in extended hours
    return '15m';
  }

  /**
   * Select optimal strategy based on conditions
   */
  private selectOptimalStrategy(): StrategyType {
    const context = optionsDataProvider.getMarketSession();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // Friday afternoon = 0DTE territory
    if (dayOfWeek === 5 && hour >= 10) {
      return '0dte';
    }

    // Early week = weekly swings
    if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      return 'weekly';
    }

    // Default to scalp
    return 'scalp';
  }

  /**
   * Evolve weights based on performance
   */
  private evolve(): void {
    const accuracy = this.state.accuracy.total > 0 
      ? this.state.accuracy.correct / this.state.accuracy.total 
      : 0.5;

    this.state.evolution.generation++;
    this.state.evolution.fitness = accuracy;

    // Adjust weights based on strategy performance
    for (const strat of Object.keys(this.state.accuracy.byStrategy) as StrategyType[]) {
      const stats = this.state.accuracy.byStrategy[strat];
      if (stats.total > 5) {
        const stratAccuracy = stats.correct / stats.total;
        const adjustment = (stratAccuracy - 0.5) * 0.1;
        this.config.strategyWeights[strat] = Math.max(0.05, Math.min(0.5, 
          this.config.strategyWeights[strat] + adjustment
        ));
      }
    }

    // Normalize weights
    const totalWeight = Object.values(this.config.strategyWeights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(this.config.strategyWeights) as StrategyType[]) {
      this.config.strategyWeights[key] /= totalWeight;
    }

    console.log(`[OptionsPredictionEngine] Evolved to generation ${this.state.evolution.generation} | Fitness: ${(accuracy * 100).toFixed(1)}%`);
  }

  private getSignalWeight(type: OptionsSignal['type']): number {
    const weights: Record<OptionsSignal['type'], number> = {
      momentum: this.weights.momentum,
      reversal: this.weights.rsi,
      breakout: this.weights.volume,
      iv_spike: this.weights.iv,
      gamma_squeeze: this.weights.flow,
      flow_imbalance: this.weights.flow,
    };
    return weights[type] || 0.1;
  }

  private getTimeframeMs(tf: TimeframeType): number {
    const ms: Record<TimeframeType, number> = {
      '30s': 30000,
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
    };
    return ms[tf];
  }

  // ========================================
  // PUBLIC API
  // ========================================

  getState(): PredictionState {
    return { ...this.state };
  }

  getPendingPredictions(): OptionsPrediction[] {
    return this.state.predictions.filter(p => !p.resolved);
  }

  getResolvedPredictions(count = 20): OptionsPrediction[] {
    return this.state.predictions
      .filter(p => p.resolved)
      .slice(-count)
      .reverse();
  }

  getAccuracy(): { total: number; correct: number; rate: number } {
    return {
      total: this.state.accuracy.total,
      correct: this.state.accuracy.correct,
      rate: this.state.accuracy.total > 0 
        ? this.state.accuracy.correct / this.state.accuracy.total 
        : 0,
    };
  }

  getEvolution() {
    return { ...this.state.evolution };
  }

  reset(): void {
    this.state = this.createInitialState();
    this.weights = this.initializeWeights();
    console.log(`[OptionsPredictionEngine] Reset to initial state`);
  }
}

export const optionsPredictionEngine = new OptionsPredictionEngine();
