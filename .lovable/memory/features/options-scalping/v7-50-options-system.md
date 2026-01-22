# Memory: features/options-scalping/v7-50-options-system

The **v7.50-OPTIONS** system introduces a complete 24/7 American options scalping terminal with multi-timeframe prediction capabilities.

## Architecture

### Core Components
1. **optionsDataProvider.ts** - Multi-broker data aggregation (Tradier, Polygon.io, Finnhub) via `options-data` edge function
2. **optionsPredictionEngine.ts** - Self-evolving prediction engine with signal fusion and fitness tracking
3. **types.ts** - Complete type definitions for strategies, contracts, Greeks, and portfolios
4. **useOptionsScalping.ts** - React hook for terminal state management
5. **OptionsScalpingTerminal.tsx** - Main dashboard UI component

### Strategies Supported
- `0dte` - Same-day expiration high-frequency scalps
- `weekly` - 1-5 day swing scalps
- `event_driven` - Earnings/volatility plays
- `spread` - Delta-neutral spreads
- `scalp` - Ultra-short momentum captures

### Timeframes
- 30s, 1m, 5m, 15m, 1h, 4h (balanced adaptive selection)

### Target Underlyings
SPY, QQQ, TSLA, NVDA, AAPL, AMZN, AMD, META, GOOGL, MSFT

## Integration
- Route: `/options` (admin-protected)
- Edge Function: `options-data` in `supabase/config.toml`
- Synchronized with chess engine at v7.50 for unified versioning

## Key Logic
```typescript
// Signal weights for prediction fusion
weights = { momentum: 0.20, rsi: 0.15, macd: 0.15, volume: 0.15, iv: 0.15, flow: 0.10, context: 0.10 }
```
