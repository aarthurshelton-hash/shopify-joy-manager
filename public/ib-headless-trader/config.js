/**
 * Headless Trader Configuration
 */

export const CONFIG = {
  // Bridge server URL (running alongside IB Gateway)
  BRIDGE_URL: process.env.BRIDGE_URL || 'http://localhost:4000',
  
  // Supabase for logging trades (optional but recommended)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  
  // Trading parameters
  TRADING: {
    // Symbols to trade
    SYMBOLS: ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMD'],
    
    // Position sizing
    MAX_POSITION_SIZE: 100,        // Max shares per position
    MAX_POSITION_VALUE: 5000,      // Max $ per position
    MAX_TOTAL_POSITIONS: 5,        // Max concurrent positions
    
    // Risk management
    STOP_LOSS_PERCENT: 2,          // 2% stop loss
    TAKE_PROFIT_PERCENT: 3,        // 3% take profit
    MAX_DAILY_LOSS: 500,           // Stop trading if daily loss exceeds this
    
    // Signal thresholds
    MIN_CONFIDENCE: 0.70,          // Minimum confidence to enter trade
    
    // Timing
    SCAN_INTERVAL_MS: 30000,       // Scan for opportunities every 30 seconds
    MARKET_OPEN_HOUR: 9,           // 9:30 AM ET
    MARKET_OPEN_MINUTE: 30,
    MARKET_CLOSE_HOUR: 16,         // 4:00 PM ET
    MARKET_CLOSE_MINUTE: 0,
  },
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
};
