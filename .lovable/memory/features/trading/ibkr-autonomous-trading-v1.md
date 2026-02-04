# Memory: features/trading/ibkr-autonomous-trading-v1
Updated: 2026-01-29

## IBKR Autonomous Trading Integration

### Architecture
The autonomous trading system runs **client-side** through the local IB Gateway bridge (port 4000), because edge functions cannot reach localhost. Key components:

1. **`useIBKRAutonomousTrading.ts`** - Client-side hook that:
   - Runs 15-second trading cycles when gateway is connected
   - Uses En Pensent pattern recognition for trade signals
   - Executes real orders via `ibGatewayClient`
   - Tracks all trades in `autonomous_trades` table
   - No balance reset - uses real IBKR paper account data

2. **`IBKRTradingDashboard.tsx`** - Added "Auto" tab with:
   - Start/Stop autonomous trading controls
   - Live session stats (balance, P&L, win rate)
   - Configuration display (min confidence, risk %, etc.)
   - Recent cycle activity log
   - Active auto-trading positions table

### Trading Configuration
```typescript
const AUTO_CONFIG = {
  MIN_CONFIDENCE: 0.70,        // Higher threshold for auto-trades
  MAX_RISK_PERCENT: 3,         // Conservative 3% max risk per trade
  POSITION_SIZE_PERCENT: 5,    // 5% position sizing
  SCALP_HORIZON_MS: 60000,     // 60-second scalps
  CYCLE_INTERVAL_MS: 15000,    // Run cycle every 15 seconds
  STOP_LOSS_PERCENT: 1.0,      // 1% stop loss
  TAKE_PROFIT_PERCENT: 1.5,    // 1.5% take profit (1.5:1 R:R)
};
```

### Symbols Traded
`SPY`, `QQQ`, `AAPL`, `NVDA`, `TSLA`, `AMD`

### Data Persistence
- All trades logged to `autonomous_trades` table
- Session stats updated in real-time
- No simulation - all data comes from real IBKR paper account
- Balance persists across sessions (no reset)

### Requirements
- IB Gateway desktop app running with API enabled (port 4002 for paper)
- Local bridge server running (`public/ib-gateway-bridge/`)
- Application running locally (`npm run dev`)
