# Memory: features/trading/ibkr-options-autonomous-trading-v1
Updated: 2026-01-29

## IBKR Autonomous Options Trading

### Architecture
The options trading system extends the existing IBKR integration with dedicated options scalping:

1. **useIBKROptionsTrading.ts** - Client-side hook for autonomous options trading
2. **optionsPredictionEngine.ts** - En Pensent™ multi-timeframe prediction engine (already existed)
3. **options_trades table** - Dedicated database table for options trade tracking

### Key Components

#### Hook: useIBKROptionsTrading
- Connects optionsPredictionEngine signals to real IBKR paper account execution
- Cycles every 20 seconds scanning for high-confidence options opportunities
- Builds IBKR-compatible option symbols for contract lookup
- Manages positions with 25% stop-loss and 50% take-profit targets
- Maximum 3 concurrent options positions

#### Configuration
```typescript
const OPTIONS_CONFIG = {
  MIN_CONFIDENCE: 0.65,          // Confidence threshold
  MAX_RISK_PERCENT: 2,           // 2% max risk per trade
  POSITION_SIZE_PERCENT: 3,      // 3% position sizing
  CYCLE_INTERVAL_MS: 20000,      // 20-second cycles
  STOP_LOSS_PERCENT: 25,         // 25% stop loss on premium
  TAKE_PROFIT_PERCENT: 50,       // 50% take profit
  MAX_OPEN_POSITIONS: 3,
  SCALP_HORIZON_MS: 300000,      // 5-minute scalp horizon
};
```

#### Supported Underlyings
SPY, QQQ, IWM, AAPL, TSLA, NVDA, AMD, AMZN, META, GOOGL

### UI Integration
- New "Options" tab in IBKRTradingDashboard.tsx
- Shows live predictions, trading activity, and open positions
- Separate start/stop controls from stock trading

### Database Schema
```sql
CREATE TABLE public.options_trades (
  id UUID PRIMARY KEY,
  underlying VARCHAR(10),
  option_symbol VARCHAR(50),
  option_type VARCHAR(4),  -- 'call' or 'put'
  strike DECIMAL(10,2),
  expiration DATE,
  direction VARCHAR(5),     -- 'long' or 'short'
  entry_price, exit_price,
  quantity, pnl, pnl_percent,
  predicted_confidence,
  strategy VARCHAR(20),
  status VARCHAR(10),       -- 'open', 'closed', 'expired', 'stopped'
  was_correct BOOLEAN
);
```

### Requirements
- IB Gateway must be running locally with API enabled
- Paper trading account (DU prefix) recommended
- Run locally via `npm run dev` (remote preview cannot reach localhost gateway)
