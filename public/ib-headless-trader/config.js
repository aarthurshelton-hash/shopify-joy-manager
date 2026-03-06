/**
 * EP-Powered Autonomous Trader Configuration
 * v30.3: Reads live predictions from market-worker via DB, trades only proven patterns.
 * 
 * DATA-DRIVEN FILTERS (from 55K+ market predictions):
 *   blunder_free_queen: 93% accuracy (last 6h), 30.1% all-time (improving fast with v30.1+)
 *   trap_queen_sac: 46% accuracy (last 6h), 35.8% all-time
 *   AMD: 45.1% | AMZN: 41.8% | SI=F: 39.9% | CL=F: 26.9%
 *   Best timeframes: 1h (37.2%), 8h (27.0%), 4h (27.4%)
 */

export const CONFIG = {
  // Bridge server URL (running alongside IB Gateway)
  BRIDGE_URL: process.env.BRIDGE_URL || 'http://localhost:4000',
  
  // Database for reading EP predictions (same DB as market-worker)
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Supabase fallback
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
  
  // ─── TRADE FILTERS ─────────────────────────────────────────────────────────
  // Only trade predictions that match ALL of these criteria.
  // Data-driven from 57K+ real predictions (Feb 19, 2026 audit).
  FILTERS: {
    // Archetypes with proven accuracy on specific combos
    // v31: Expanded from 3 → 7 based on live combo-level accuracy data
    ALLOWED_ARCHETYPES: [
      'blunder_free_queen',        // 34.7% all-time, but 100% on BTC-USD/8h (n=21)
      'trap_queen_sac',            // 38.6% all-time, 100% on AMD/1h (n=108), AMZN/1h (n=100)
      'false_breakout',            // 54.9% all-time on 1003 preds — most consistent
      'regime_shift_down',         // 96.8% on AMD/1h (n=158), 90.9% on MSFT/2h (n=132)
      'mean_reversion_down',       // 100% on AMZN/2h (n=75), 88.4% on MSFT/1h (n=146)
      'bearish_momentum',          // 47.0% all-time (n=1860), 100% on specific combos
      'mean_reversion_up',         // 100% on MSFT/1h (n=80), 88.9% on AMZN/1h (n=72)
    ],
    
    // Symbols with proven edge
    // v31: Expanded based on fresh 7-day audit data
    ALLOWED_SYMBOLS: [
      'AMD',      // 52.2% all-time on 2474 preds — best stock
      'AMZN',     // 48.6% on 2075 preds
      'MSFT',     // 40.8% on 2009 preds, 100% on mean_reversion_down/8h
      'QQQ',      // 61.5% on 234 preds — highest accuracy index
      'NVDA',     // 35.1% on 951 preds — above random, good combos
      'SI=F',     // 40.9% on 3779 preds — best commodity
      'SOL-USD',  // 50.2% on 1853 preds — best crypto
    ],
    
    // Timeframes with proven edge
    ALLOWED_TIMEFRAMES: ['1h', '2h', '4h', '8h'],
    
    // Minimum prediction confidence to trade (0-1)
    // v31: Lowered from 0.30 to 0.15 because audit showed LOW confidence = HIGH accuracy
    // (0-20 conf bucket: 42% accuracy vs 70+ conf: 17.4%)
    MIN_CONFIDENCE: 0.15,
    
    // Minimum age of prediction in seconds (don't trade stale signals)
    MAX_PREDICTION_AGE_SEC: 300, // 5 minutes
    
    // Only trade predictions that have photonic coherence > 1.0
    REQUIRE_PHOTONIC_COHERENCE: false, // v31: disabled — too many good signals filtered out
    
    // v31: BLOCKED COMBOS — these pass individual filters but lose money as combos
    // Identified from 7-day backtest on 570 real trades
    BLOCKED_COMBOS: new Set([
      'blunder_free_queen|MSFT|8h',   // 0% on 13 trades, -$114
      'trap_queen_sac|AMZN|8h',       // 0% on 12 trades, -$98
      'trap_queen_sac|SI=F|4h',       // 15% on 66 trades, -$91
      'mean_reversion_down|SI=F|4h',  // 19% on 21 trades, -$63
      'mean_reversion_up|MSFT|8h',    // 0% on 11 trades, -$1
    ]),
  },
  
  // ─── OPTIONS SCALPING ──────────────────────────────────────────────────────
  // For our highest-confidence combos (90%+ accuracy, n>=50), use options for leverage.
  // A 2% stock move = 10-30% option move. At 90%+ accuracy, this is where the real money is.
  OPTIONS: {
    ENABLED: false,  // Start with stocks only, enable after paper trading proves profitable
    
    // Only use options when live accuracy for this combo is >= this threshold
    MIN_COMBO_ACCURACY: 0.85,
    MIN_COMBO_SAMPLES: 50,
    
    // Options parameters
    MAX_OPTION_VALUE: 500,         // Max $ per option trade (high risk, small size)
    PREFER_WEEKLY: true,           // Weekly options for max leverage
    STRIKE_OFFSET: 0,             // ATM options (0 = at the money)
    MAX_DAYS_TO_EXPIRY: 7,        // Only weeklies
    
    // These combos have earned options-level trust (90%+ accuracy, n>=50)
    ELITE_COMBOS: [
      'trap_queen_sac|AMD|1h',        // 100% n=108
      'trap_queen_sac|AMZN|1h',       // 100% n=100
      'mean_reversion_down|AMZN|2h',  // 100% n=75
      'regime_shift_down|AMD|1h',     // 96.8% n=158
      'mean_reversion_down|MSFT|1h',  // 88.4% n=146
      'regime_shift_down|MSFT|2h',    // 90.9% n=132
      'mean_reversion_up|MSFT|1h',    // 100% n=80
      'mean_reversion_up|AMZN|1h',    // 88.9% n=72
      'trap_queen_sac|NVDA|4h',       // 91.8% n=61
    ],
  },
  
  // ─── POSITION SIZING ───────────────────────────────────────────────────────
  TRADING: {
    // Position sizing
    MAX_POSITION_VALUE: 2000,      // Max $ per position (start conservative)
    MAX_TOTAL_POSITIONS: 3,        // Max concurrent positions
    BANKROLL: 10000,               // Starting bankroll for Kelly sizing
    KELLY_FRACTION: 0.25,          // Quarter-Kelly (very conservative)
    
    // Risk management
    STOP_LOSS_PERCENT: 1.5,        // 1.5% stop loss (tight)
    TAKE_PROFIT_PERCENT: 2.5,      // 2.5% take profit
    MAX_DAILY_LOSS: 300,           // Stop trading if daily loss exceeds $300
    MAX_TRADES_PER_DAY: 10,        // Max trades per day
    
    // Timing
    SCAN_INTERVAL_MS: 60000,       // Check for new predictions every 60 seconds
    MARKET_OPEN_HOUR: 9,           // 9:30 AM ET
    MARKET_OPEN_MINUTE: 30,
    MARKET_CLOSE_HOUR: 15,         // 3:45 PM ET (stop 15 min before close)
    MARKET_CLOSE_MINUTE: 45,
    
    // Cooldown: don't re-enter same symbol within N minutes
    SYMBOL_COOLDOWN_MS: 15 * 60 * 1000, // 15 minutes
  },
  
  // ─── IBKR CONTRACT IDS ─────────────────────────────────────────────────────
  // Pre-cached to avoid search latency on order placement
  CONTRACTS: {
    'AMD':  { conId: 4391,      secType: 'STK', exchange: 'SMART', currency: 'USD' },
    'AMZN': { conId: 3691937,   secType: 'STK', exchange: 'SMART', currency: 'USD' },
    'MSFT': { conId: 272093,    secType: 'STK', exchange: 'SMART', currency: 'USD' },
    'NVDA': { conId: 202994,    secType: 'STK', exchange: 'SMART', currency: 'USD' },
    'META': { conId: 107113386, secType: 'STK', exchange: 'SMART', currency: 'USD' },
    // Futures need different handling — start with stocks only
  },
  
  // ─── PAPER vs LIVE ─────────────────────────────────────────────────────────
  // CRITICAL: Start with paper trading. Only switch to live after proving profitability.
  MODE: process.env.TRADING_MODE || 'paper', // 'paper' or 'live'
  IB_PORT: process.env.IB_PORT || '4002',    // 4002=paper, 4001=live
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
