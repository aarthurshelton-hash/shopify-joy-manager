-- Add interval and session_flags columns to market_candle_cache
-- for multi-timeframe 24/7 candle storage (daily + intraday)

ALTER TABLE market_candle_cache
  ADD COLUMN IF NOT EXISTS interval VARCHAR(10) NOT NULL DEFAULT '1d';

ALTER TABLE market_candle_cache
  ADD COLUMN IF NOT EXISTS session_flags JSONB DEFAULT '[]'::jsonb;

-- Drop old single-column unique constraint (symbol only)
ALTER TABLE market_candle_cache
  DROP CONSTRAINT IF EXISTS market_candle_cache_symbol_key;

-- Drop old primary key if it exists on id only (keep it)
-- The id PK stays, we add a composite unique index for (symbol, interval)
CREATE UNIQUE INDEX IF NOT EXISTS market_candle_cache_symbol_interval_key
  ON market_candle_cache (symbol, interval);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'market_candle_cache'
ORDER BY ordinal_position;
