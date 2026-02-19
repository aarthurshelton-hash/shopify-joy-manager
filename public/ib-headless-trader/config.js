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
  // This is the "prove it" gate — only patterns with real edge get through.
  FILTERS: {
    // Archetypes with proven accuracy (data-driven, not guessed)
    ALLOWED_ARCHETYPES: [
      'blunder_free_queen',   // 93% last 6h, 79% on tactical overrides
      'trap_queen_sac',       // 46% last 6h, 38.8% all-time
      'false_breakout',       // 54.9% all-time on 1003 predictions
    ],
    
    // Symbols with proven edge (>35% accuracy on 1000+ predictions)
    ALLOWED_SYMBOLS: [
      'AMD',    // 45.1% on 1989 preds — best stock
      'AMZN',   // 41.8% on 1614 preds
      'SI=F',   // 39.9% on 3663 preds — best commodity
      'CL=F',   // 26.9% on 3984 preds — decent with blunder_free_queen
    ],
    
    // Timeframes with proven edge
    ALLOWED_TIMEFRAMES: ['1h', '2h', '4h', '8h'],
    
    // Minimum prediction confidence to trade (0-1)
    MIN_CONFIDENCE: 0.30,
    
    // Minimum age of prediction in seconds (don't trade stale signals)
    MAX_PREDICTION_AGE_SEC: 300, // 5 minutes
    
    // Only trade predictions that have photonic coherence > 1.0
    REQUIRE_PHOTONIC_COHERENCE: true,
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
