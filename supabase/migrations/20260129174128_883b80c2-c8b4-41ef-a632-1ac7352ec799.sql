-- Create options trades table for tracking autonomous options trading
CREATE TABLE public.options_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  underlying VARCHAR(10) NOT NULL,
  option_symbol VARCHAR(50) NOT NULL,
  option_type VARCHAR(4) NOT NULL CHECK (option_type IN ('call', 'put')),
  strike DECIMAL(10,2) NOT NULL,
  expiration DATE NOT NULL,
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(10,4) NOT NULL,
  exit_price DECIMAL(10,4),
  quantity INTEGER NOT NULL DEFAULT 1,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_time TIMESTAMP WITH TIME ZONE,
  pnl DECIMAL(12,2),
  pnl_percent DECIMAL(8,4),
  predicted_confidence DECIMAL(5,4) NOT NULL,
  strategy VARCHAR(20) NOT NULL,
  prediction_id VARCHAR(100),
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired', 'stopped')),
  was_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_options_trades_status ON public.options_trades(status);
CREATE INDEX idx_options_trades_underlying ON public.options_trades(underlying);
CREATE INDEX idx_options_trades_created_at ON public.options_trades(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.options_trades ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin-only access controlled at app level)
CREATE POLICY "Authenticated users can manage options trades"
ON public.options_trades
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.options_trades IS 'Tracks autonomous options trading activity with IBKR paper account';