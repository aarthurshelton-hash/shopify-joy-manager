/**
 * Multi-Asset Trading Configuration
 * 
 * Diversified universe across equities, options, bonds, forex, commodities
 * Target allocation: self-adjusting based on market regime
 */

export const ASSET_CLASSES = {
  EQUITIES: {
    allocation: 0.40,
    symbols: {
      US: ['SPY', 'QQQ', 'IWM', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'NFLX', 'CRM', 'BABA', 'TSM', 'ASML'],
      INTL: ['VGK', 'EWJ', 'EEM', 'FXI', 'INDA'],
      SECTORS: ['XLF', 'XLE', 'XLK', 'XBI', 'XRT', 'ITA', 'LIT', 'URA', 'BOTZ'],
    }
  },
  OPTIONS: {
    allocation: 0.30,
    underlying: ['SPY', 'QQQ', 'IWM', 'AAPL', 'TSLA', 'NVDA'],
    strategies: ['put_credit_spread', 'call_credit_spread', 'iron_condor', 'strangle'],
    minIV: 0.20,
    maxIV: 0.80,
    DTE: [7, 14, 30, 45],
  },
  BONDS: {
    allocation: 0.15,
    symbols: ['TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'EMLC', 'TMF'],
    yieldCurve: ['2Y', '5Y', '10Y', '30Y'],
  },
  FOREX: {
    allocation: 0.10,
    pairs: ['EUR.USD', 'GBP.USD', 'USD.JPY', 'USD.CAD', 'AUD.USD', 'USD.CHF'],
    carry: ['AUD.JPY', 'NZD.JPY'],
    hedging: ['DXY', 'UUP'],
  },
  COMMODITIES: {
    allocation: 0.05,
    symbols: ['GC', 'SI', 'CL', 'NG', 'GLD', 'SLV', 'USO', 'UNG', 'DBA', 'CORN', 'WEAT'],
  },
  CRYPTO: {
    allocation: 0.00, // Disabled until IBKR crypto available in your region
    symbols: ['BTC', 'ETH'],
  }
};

export const DATA_SOURCES = {
  PRICES: ['ibkr', 'polygon'],
  OPTIONS_FLOW: ['unusual_whales', 'market_chameleon', ' cheddar_flow'],
  NEWS: ['bloomberg', 'twitter_sentiment', 'reddit_wsb', 'seeking_alpha'],
  MACRO: ['fred', 'treasury_yields', 'vix_term_structure', 'credit_spreads'],
  FUNDAMENTAL: ['finnhub', 'alpha_vantage'],
};

export const RISK_CONFIG = {
  MAX_PORTFOLIO_RISK: 0.03,      // 3% max daily portfolio risk
  MAX_SINGLE_TRADE_RISK: 0.01,   // 1% max per trade
  MAX_SECTOR_EXPOSURE: 0.25,     // 25% max in one sector
  MAX_CORRELATED_EXPOSURE: 0.15, // 15% max correlated positions
  KELLY_FRACTION: 0.25,          // Quarter Kelly for position sizing
  VOL_TARGET: 0.10,              // 10% annualized vol target
  DRAWDOWN_CIRCUIT: 0.05,        // Pause trading at 5% daily drawdown
};

export const STRATEGY_REGISTRY = {
  MOMENTUM: { enabled: true, weight: 0.20, lookback: [20, 50, 200] },
  MEAN_REVERSION: { enabled: true, weight: 0.20, lookback: [5, 10, 20] },
  VOLATILITY_ARB: { enabled: true, weight: 0.15, vix_thresholds: [15, 25, 35] },
  CARRY_TRADE: { enabled: true, weight: 0.10, min_yield_diff: 0.02 },
  OPTIONS_INCOME: { enabled: true, weight: 0.20, min_premium: 0.01 },
  MACRO_ROTATION: { enabled: true, weight: 0.15, regime_detection: true },
};

export const EVOLUTION_CONFIG = {
  BACKTEST_WINDOW_DAYS: 90,
  REBALANCE_FREQUENCY_HOURS: 24,
  STRATEGY_EVALUATION_DAYS: 30,
  MIN_TRADES_FOR_EVALUATION: 50,
  PERFORMANCE_THRESHOLD: 0.0,    // Disable if Sharpe < 1.0
  ADAPTATION_RATE: 0.10,         // 10% weight shift per rebalance
};
