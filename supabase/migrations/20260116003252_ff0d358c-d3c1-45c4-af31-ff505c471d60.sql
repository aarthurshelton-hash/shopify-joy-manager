-- ============================================================
-- COMPLETE MARKETPLACE ECONOMICS RECALIBRATION
-- Live tracking of all profit pools with proper fee distribution
-- ============================================================

-- Create required tables first
CREATE TABLE IF NOT EXISTS public.company_profit_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_revenue_cents BIGINT NOT NULL DEFAULT 0,
  stripe_fees_cents BIGINT NOT NULL DEFAULT 0,
  tax_collected_cents BIGINT NOT NULL DEFAULT 0,
  net_profit_cents BIGINT NOT NULL DEFAULT 0,
  extractable_profit_cents BIGINT NOT NULL DEFAULT 0,
  reinvested_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (source_type, period_date)
);

CREATE TABLE IF NOT EXISTS public.revenue_stream_summary (
  stream_type TEXT NOT NULL PRIMARY KEY,
  total_gross_revenue_cents BIGINT NOT NULL DEFAULT 0,
  total_stripe_fees_cents BIGINT NOT NULL DEFAULT 0,
  total_tax_collected_cents BIGINT NOT NULL DEFAULT 0,
  total_net_profit_cents BIGINT NOT NULL DEFAULT 0,
  total_extractable_cents BIGINT NOT NULL DEFAULT 0,
  total_reinvested_cents BIGINT NOT NULL DEFAULT 0,
  reinvestment_rate NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gamecard_value_pool (
  game_id TEXT NOT NULL PRIMARY KEY,
  game_title TEXT NOT NULL,
  base_value_cents BIGINT NOT NULL DEFAULT 0,
  earned_value_cents BIGINT NOT NULL DEFAULT 0,
  total_interactions BIGINT NOT NULL DEFAULT 0,
  total_print_orders BIGINT NOT NULL DEFAULT 0,
  total_marketplace_trades BIGINT NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.palette_value_pool (
  palette_id TEXT NOT NULL PRIMARY KEY,
  palette_name TEXT NOT NULL,
  base_value_cents BIGINT NOT NULL DEFAULT 0,
  earned_value_cents BIGINT NOT NULL DEFAULT 0,
  total_interactions BIGINT NOT NULL DEFAULT 0,
  total_print_orders BIGINT NOT NULL DEFAULT 0,
  total_marketplace_trades BIGINT NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opening_value_pool (
  opening_eco TEXT NOT NULL PRIMARY KEY,
  opening_name TEXT NOT NULL,
  base_value_cents BIGINT NOT NULL DEFAULT 0,
  earned_value_cents BIGINT NOT NULL DEFAULT 0,
  total_interactions BIGINT NOT NULL DEFAULT 0,
  total_print_orders BIGINT NOT NULL DEFAULT 0,
  total_marketplace_trades BIGINT NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  visualization_id UUID REFERENCES public.saved_visualizations(id),
  gross_revenue_cents BIGINT NOT NULL DEFAULT 0,
  fulfillment_costs_cents BIGINT NOT NULL DEFAULT 0,
  platform_fees_cents BIGINT NOT NULL DEFAULT 0,
  net_revenue_cents BIGINT NOT NULL DEFAULT 0,
  creator_royalty_cents BIGINT NOT NULL DEFAULT 0,
  gamecard_pool_cents BIGINT NOT NULL DEFAULT 0,
  palette_pool_cents BIGINT NOT NULL DEFAULT 0,
  game_id TEXT,
  palette_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 1. Create or replace the process_marketplace_sale function
-- This handles wallet-based purchases with proper 5% fee distribution
CREATE OR REPLACE FUNCTION public.process_marketplace_sale(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_sale_price_cents integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing RECORD;
  v_seller_wallet_id uuid;
  v_buyer_wallet_id uuid;
  v_fee_cents integer;
  v_seller_receives_cents integer;
  v_company_profit_cents integer;
  v_gamecard_pool_cents integer;
  v_palette_pool_cents integer;
  v_opening_pool_cents integer;
  v_platform_ops_cents integer;
  v_game_id text;
  v_palette_id text;
  v_opening_eco text;
  v_viz_data jsonb;
BEGIN
  -- Get listing with validation
  SELECT * INTO v_listing
  FROM visualization_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or not active';
  END IF;

  -- Verify buyer has enough balance
  SELECT id INTO v_buyer_wallet_id
  FROM user_wallets
  WHERE user_id = p_buyer_id AND balance_cents >= p_sale_price_cents
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Calculate 5% marketplace fee and distribution
  -- Fee breakdown: 25% company profit, 25% gamecard, 25% palette, 15% opening, 10% platform ops
  v_fee_cents := ROUND(p_sale_price_cents * 0.05);
  v_seller_receives_cents := p_sale_price_cents - v_fee_cents;
  
  v_company_profit_cents := ROUND(v_fee_cents * 0.25);
  v_gamecard_pool_cents := ROUND(v_fee_cents * 0.25);
  v_palette_pool_cents := ROUND(v_fee_cents * 0.25);
  v_opening_pool_cents := ROUND(v_fee_cents * 0.15);
  v_platform_ops_cents := v_fee_cents - v_company_profit_cents - v_gamecard_pool_cents - v_palette_pool_cents - v_opening_pool_cents;

  -- Get or create seller wallet
  SELECT id INTO v_seller_wallet_id
  FROM user_wallets
  WHERE user_id = v_listing.seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_wallets (user_id, balance_cents)
    VALUES (v_listing.seller_id, 0)
    RETURNING id INTO v_seller_wallet_id;
  END IF;

  -- Deduct from buyer wallet
  UPDATE user_wallets
  SET 
    balance_cents = balance_cents - p_sale_price_cents,
    total_spent_cents = total_spent_cents + p_sale_price_cents,
    updated_at = now()
  WHERE id = v_buyer_wallet_id;

  -- Credit seller wallet (95% of sale price)
  UPDATE user_wallets
  SET 
    balance_cents = balance_cents + v_seller_receives_cents,
    total_earned_cents = total_earned_cents + v_seller_receives_cents,
    updated_at = now()
  WHERE id = v_seller_wallet_id;

  -- Record buyer transaction
  INSERT INTO wallet_transactions (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, counterparty_id, description)
  SELECT 
    p_buyer_id, 
    'purchase', 
    -p_sale_price_cents,
    balance_cents,
    p_listing_id,
    v_listing.seller_id,
    'Vision purchase'
  FROM user_wallets WHERE id = v_buyer_wallet_id;

  -- Record seller transaction (showing 95%)
  INSERT INTO wallet_transactions (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, counterparty_id, description)
  SELECT 
    v_listing.seller_id, 
    'sale', 
    v_seller_receives_cents,
    balance_cents,
    p_listing_id,
    p_buyer_id,
    'Vision sale (95% after 5% platform fee)'
  FROM user_wallets WHERE id = v_seller_wallet_id;

  -- Record platform fee transaction
  INSERT INTO wallet_transactions (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, description)
  VALUES (
    v_listing.seller_id,
    'platform_fee',
    -v_fee_cents,
    0,
    p_listing_id,
    FORMAT('5%% marketplace fee: %s company, %s pools', 
      (v_company_profit_cents::float / 100)::text, 
      ((v_fee_cents - v_company_profit_cents)::float / 100)::text)
  );

  -- Transfer visualization ownership
  UPDATE saved_visualizations
  SET user_id = p_buyer_id
  WHERE id = v_listing.visualization_id;

  -- Get visualization data for attribution
  SELECT game_data INTO v_viz_data
  FROM saved_visualizations
  WHERE id = v_listing.visualization_id;

  v_game_id := v_viz_data->>'id';
  v_palette_id := v_viz_data->'palette'->>'id';
  
  -- Try to extract opening ECO from game data
  v_opening_eco := v_viz_data->>'eco';
  IF v_opening_eco IS NULL THEN
    v_opening_eco := v_viz_data->'opening'->>'eco';
  END IF;

  -- Update listing status
  UPDATE visualization_listings
  SET 
    status = 'sold',
    buyer_id = p_buyer_id,
    sold_at = now()
  WHERE id = p_listing_id;

  -- Record transfer
  INSERT INTO visualization_transfers (visualization_id, from_user_id, to_user_id, transfer_type)
  VALUES (v_listing.visualization_id, v_listing.seller_id, p_buyer_id, 'purchase');

  -- Record company profit (25% of 5% fee - extractable cash reserve)
  INSERT INTO company_profit_pool (source_type, gross_revenue_cents, net_profit_cents, extractable_profit_cents, reinvested_cents)
  VALUES (
    'marketplace',
    p_sale_price_cents,
    v_fee_cents,
    v_company_profit_cents,
    v_fee_cents - v_company_profit_cents
  )
  ON CONFLICT (source_type, period_date)
  DO UPDATE SET
    gross_revenue_cents = company_profit_pool.gross_revenue_cents + EXCLUDED.gross_revenue_cents,
    net_profit_cents = company_profit_pool.net_profit_cents + EXCLUDED.net_profit_cents,
    extractable_profit_cents = company_profit_pool.extractable_profit_cents + EXCLUDED.extractable_profit_cents,
    reinvested_cents = company_profit_pool.reinvested_cents + EXCLUDED.reinvested_cents,
    updated_at = now();

  -- Update revenue stream summary
  INSERT INTO revenue_stream_summary (stream_type, total_gross_revenue_cents, total_net_profit_cents, total_extractable_cents, total_reinvested_cents)
  VALUES (
    'marketplace',
    p_sale_price_cents,
    v_fee_cents,
    v_company_profit_cents,
    v_fee_cents - v_company_profit_cents
  )
  ON CONFLICT (stream_type)
  DO UPDATE SET
    total_gross_revenue_cents = revenue_stream_summary.total_gross_revenue_cents + EXCLUDED.total_gross_revenue_cents,
    total_net_profit_cents = revenue_stream_summary.total_net_profit_cents + EXCLUDED.total_net_profit_cents,
    total_extractable_cents = revenue_stream_summary.total_extractable_cents + EXCLUDED.total_extractable_cents,
    total_reinvested_cents = revenue_stream_summary.total_reinvested_cents + EXCLUDED.total_reinvested_cents,
    last_updated_at = now();

  -- Update gamecard value pool if game_id exists
  IF v_game_id IS NOT NULL AND v_game_id != '' THEN
    INSERT INTO gamecard_value_pool (game_id, game_title, earned_value_cents, total_interactions)
    VALUES (v_game_id, COALESCE(v_viz_data->>'event', v_game_id), v_gamecard_pool_cents, 1)
    ON CONFLICT (game_id)
    DO UPDATE SET
      earned_value_cents = gamecard_value_pool.earned_value_cents + EXCLUDED.earned_value_cents,
      total_interactions = gamecard_value_pool.total_interactions + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;

  -- Update palette value pool if palette_id exists
  IF v_palette_id IS NOT NULL AND v_palette_id != '' THEN
    INSERT INTO palette_value_pool (palette_id, palette_name, earned_value_cents, total_interactions)
    VALUES (v_palette_id, COALESCE(v_viz_data->'palette'->>'name', v_palette_id), v_palette_pool_cents, 1)
    ON CONFLICT (palette_id)
    DO UPDATE SET
      earned_value_cents = palette_value_pool.earned_value_cents + EXCLUDED.earned_value_cents,
      total_interactions = palette_value_pool.total_interactions + 1,
      total_marketplace_trades = palette_value_pool.total_marketplace_trades + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;

  -- Update opening value pool if opening_eco exists
  IF v_opening_eco IS NOT NULL AND v_opening_eco != '' THEN
    INSERT INTO opening_value_pool (opening_eco, opening_name, earned_value_cents, total_interactions, total_marketplace_trades)
    VALUES (v_opening_eco, COALESCE(v_viz_data->'opening'->>'name', v_opening_eco), v_opening_pool_cents, 1, 1)
    ON CONFLICT (opening_eco)
    DO UPDATE SET
      earned_value_cents = opening_value_pool.earned_value_cents + EXCLUDED.earned_value_cents,
      total_interactions = opening_value_pool.total_interactions + 1,
      total_marketplace_trades = opening_value_pool.total_marketplace_trades + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;

  -- Record vision interaction (trade)
  PERFORM record_vision_interaction(v_listing.visualization_id, p_buyer_id, 'trade', p_sale_price_cents, NULL);

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Marketplace sale failed: %', SQLERRM;
END;
$$;

-- 2. Create function to record subscription revenue with proper pool distribution
CREATE OR REPLACE FUNCTION public.record_subscription_revenue(
  p_user_id uuid,
  p_amount_cents integer,
  p_stripe_fee_cents integer DEFAULT 0,
  p_tax_cents integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_net_cents integer;
  v_reinvest_cents integer;
  v_extractable_cents integer;
BEGIN
  -- Net = amount - stripe fees - tax
  v_net_cents := p_amount_cents - p_stripe_fee_cents - p_tax_cents;
  
  -- 20% reinvested into market, 80% extractable profit
  v_reinvest_cents := ROUND(v_net_cents * 0.20);
  v_extractable_cents := v_net_cents - v_reinvest_cents;

  -- Record to company profit pool
  INSERT INTO company_profit_pool (source_type, gross_revenue_cents, stripe_fees_cents, tax_collected_cents, net_profit_cents, extractable_profit_cents, reinvested_cents)
  VALUES ('subscription', p_amount_cents, p_stripe_fee_cents, p_tax_cents, v_net_cents, v_extractable_cents, v_reinvest_cents)
  ON CONFLICT (source_type, period_date)
  DO UPDATE SET
    gross_revenue_cents = company_profit_pool.gross_revenue_cents + EXCLUDED.gross_revenue_cents,
    stripe_fees_cents = company_profit_pool.stripe_fees_cents + EXCLUDED.stripe_fees_cents,
    tax_collected_cents = company_profit_pool.tax_collected_cents + EXCLUDED.tax_collected_cents,
    net_profit_cents = company_profit_pool.net_profit_cents + EXCLUDED.net_profit_cents,
    extractable_profit_cents = company_profit_pool.extractable_profit_cents + EXCLUDED.extractable_profit_cents,
    reinvested_cents = company_profit_pool.reinvested_cents + EXCLUDED.reinvested_cents,
    updated_at = now();

  -- Update revenue stream summary
  INSERT INTO revenue_stream_summary (stream_type, total_gross_revenue_cents, total_stripe_fees_cents, total_tax_collected_cents, total_net_profit_cents, total_extractable_cents, total_reinvested_cents, reinvestment_rate)
  VALUES ('subscription', p_amount_cents, p_stripe_fee_cents, p_tax_cents, v_net_cents, v_extractable_cents, v_reinvest_cents, 0.20)
  ON CONFLICT (stream_type)
  DO UPDATE SET
    total_gross_revenue_cents = revenue_stream_summary.total_gross_revenue_cents + EXCLUDED.total_gross_revenue_cents,
    total_stripe_fees_cents = revenue_stream_summary.total_stripe_fees_cents + EXCLUDED.total_stripe_fees_cents,
    total_tax_collected_cents = revenue_stream_summary.total_tax_collected_cents + EXCLUDED.total_tax_collected_cents,
    total_net_profit_cents = revenue_stream_summary.total_net_profit_cents + EXCLUDED.total_net_profit_cents,
    total_extractable_cents = revenue_stream_summary.total_extractable_cents + EXCLUDED.total_extractable_cents,
    total_reinvested_cents = revenue_stream_summary.total_reinvested_cents + EXCLUDED.total_reinvested_cents,
    last_updated_at = now();
END;
$$;

-- 3. Create function to record print/book revenue with 17% reinvestment
CREATE OR REPLACE FUNCTION public.record_product_revenue(
  p_order_type text,  -- 'print' or 'book'
  p_user_id uuid,
  p_visualization_id uuid,
  p_gross_cents integer,
  p_fulfillment_cents integer,
  p_stripe_fee_cents integer DEFAULT 0,
  p_game_id text DEFAULT NULL,
  p_palette_id text DEFAULT NULL,
  p_opening_eco text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profit_cents integer;
  v_reinvest_cents integer;
  v_extractable_cents integer;
  v_gamecard_cents integer;
  v_palette_cents integer;
  v_opening_cents integer;
  v_creator_royalty_cents integer;
BEGIN
  -- Profit = gross - fulfillment - stripe fees
  v_profit_cents := p_gross_cents - p_fulfillment_cents - p_stripe_fee_cents;
  
  -- 17% of profit reinvested into value pools
  v_reinvest_cents := ROUND(v_profit_cents * 0.17);
  v_extractable_cents := v_profit_cents - v_reinvest_cents;
  
  -- Split reinvestment: 40% gamecard, 35% palette, 20% opening, 5% creator royalty
  v_gamecard_cents := ROUND(v_reinvest_cents * 0.40);
  v_palette_cents := ROUND(v_reinvest_cents * 0.35);
  v_opening_cents := ROUND(v_reinvest_cents * 0.20);
  v_creator_royalty_cents := v_reinvest_cents - v_gamecard_cents - v_palette_cents - v_opening_cents;

  -- Record to company profit pool
  INSERT INTO company_profit_pool (source_type, gross_revenue_cents, stripe_fees_cents, net_profit_cents, extractable_profit_cents, reinvested_cents)
  VALUES (p_order_type, p_gross_cents, p_stripe_fee_cents, v_profit_cents, v_extractable_cents, v_reinvest_cents)
  ON CONFLICT (source_type, period_date)
  DO UPDATE SET
    gross_revenue_cents = company_profit_pool.gross_revenue_cents + EXCLUDED.gross_revenue_cents,
    stripe_fees_cents = company_profit_pool.stripe_fees_cents + EXCLUDED.stripe_fees_cents,
    net_profit_cents = company_profit_pool.net_profit_cents + EXCLUDED.net_profit_cents,
    extractable_profit_cents = company_profit_pool.extractable_profit_cents + EXCLUDED.extractable_profit_cents,
    reinvested_cents = company_profit_pool.reinvested_cents + EXCLUDED.reinvested_cents,
    updated_at = now();

  -- Update revenue stream summary
  INSERT INTO revenue_stream_summary (stream_type, total_gross_revenue_cents, total_stripe_fees_cents, total_net_profit_cents, total_extractable_cents, total_reinvested_cents, reinvestment_rate)
  VALUES (p_order_type, p_gross_cents, p_stripe_fee_cents, v_profit_cents, v_extractable_cents, v_reinvest_cents, 0.17)
  ON CONFLICT (stream_type)
  DO UPDATE SET
    total_gross_revenue_cents = revenue_stream_summary.total_gross_revenue_cents + EXCLUDED.total_gross_revenue_cents,
    total_stripe_fees_cents = revenue_stream_summary.total_stripe_fees_cents + EXCLUDED.total_stripe_fees_cents,
    total_net_profit_cents = revenue_stream_summary.total_net_profit_cents + EXCLUDED.total_net_profit_cents,
    total_extractable_cents = revenue_stream_summary.total_extractable_cents + EXCLUDED.total_extractable_cents,
    total_reinvested_cents = revenue_stream_summary.total_reinvested_cents + EXCLUDED.total_reinvested_cents,
    last_updated_at = now();

  -- Record order financials
  INSERT INTO order_financials (order_type, user_id, visualization_id, gross_revenue_cents, fulfillment_costs_cents, platform_fees_cents, net_revenue_cents, creator_royalty_cents, gamecard_pool_cents, palette_pool_cents, game_id, palette_id)
  VALUES (p_order_type, p_user_id, p_visualization_id, p_gross_cents, p_fulfillment_cents, p_stripe_fee_cents, v_profit_cents, v_creator_royalty_cents, v_gamecard_cents, v_palette_cents, p_game_id, p_palette_id);

  -- Update value pools
  IF p_game_id IS NOT NULL AND p_game_id != '' THEN
    INSERT INTO gamecard_value_pool (game_id, game_title, earned_value_cents, total_print_orders)
    VALUES (p_game_id, p_game_id, v_gamecard_cents, 1)
    ON CONFLICT (game_id)
    DO UPDATE SET
      earned_value_cents = gamecard_value_pool.earned_value_cents + EXCLUDED.earned_value_cents,
      total_print_orders = gamecard_value_pool.total_print_orders + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;

  IF p_palette_id IS NOT NULL AND p_palette_id != '' THEN
    INSERT INTO palette_value_pool (palette_id, palette_name, earned_value_cents, total_print_orders)
    VALUES (p_palette_id, p_palette_id, v_palette_cents, 1)
    ON CONFLICT (palette_id)
    DO UPDATE SET
      earned_value_cents = palette_value_pool.earned_value_cents + EXCLUDED.earned_value_cents,
      total_print_orders = palette_value_pool.total_print_orders + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;

  IF p_opening_eco IS NOT NULL AND p_opening_eco != '' THEN
    INSERT INTO opening_value_pool (opening_eco, opening_name, earned_value_cents, total_print_orders)
    VALUES (p_opening_eco, p_opening_eco, v_opening_cents, 1)
    ON CONFLICT (opening_eco)
    DO UPDATE SET
      earned_value_cents = opening_value_pool.earned_value_cents + EXCLUDED.earned_value_cents,
      total_print_orders = opening_value_pool.total_print_orders + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;

  -- Record vision print interaction
  IF p_visualization_id IS NOT NULL THEN
    PERFORM record_vision_interaction(p_visualization_id, p_user_id, 'print_order', p_gross_cents, NULL);
  END IF;
END;
$$;

-- 4. Create view for live economics dashboard
CREATE OR REPLACE VIEW public.live_economics_summary AS
SELECT
  -- Company Profit Pool totals
  (SELECT COALESCE(SUM(extractable_profit_cents), 0) FROM company_profit_pool) as total_extractable_cents,
  (SELECT COALESCE(SUM(reinvested_cents), 0) FROM company_profit_pool) as total_reinvested_cents,
  (SELECT COALESCE(SUM(stripe_fees_cents), 0) FROM company_profit_pool) as total_stripe_fees_cents,
  (SELECT COALESCE(SUM(tax_collected_cents), 0) FROM company_profit_pool) as total_tax_collected_cents,
  (SELECT COALESCE(SUM(gross_revenue_cents), 0) FROM company_profit_pool) as total_gross_revenue_cents,
  (SELECT COALESCE(SUM(net_profit_cents), 0) FROM company_profit_pool) as total_net_profit_cents,
  
  -- Value Pool totals
  (SELECT COALESCE(SUM(earned_value_cents), 0) FROM gamecard_value_pool) as gamecard_pool_total_cents,
  (SELECT COALESCE(SUM(earned_value_cents), 0) FROM palette_value_pool) as palette_pool_total_cents,
  (SELECT COALESCE(SUM(earned_value_cents), 0) FROM opening_value_pool) as opening_pool_total_cents,
  
  -- Counts
  (SELECT COUNT(*) FROM gamecard_value_pool WHERE earned_value_cents > 0) as active_gamecards,
  (SELECT COUNT(*) FROM palette_value_pool WHERE earned_value_cents > 0) as active_palettes,
  (SELECT COUNT(*) FROM opening_value_pool WHERE earned_value_cents > 0) as active_openings,
  
  -- User stats
  (SELECT COUNT(*) FROM user_wallets WHERE balance_cents > 0) as wallets_with_balance,
  (SELECT COALESCE(SUM(balance_cents), 0) FROM user_wallets) as total_wallet_balance_cents,
  (SELECT COALESCE(SUM(total_earned_cents), 0) FROM user_wallets) as total_user_earnings_cents;

-- Grant access to the view
GRANT SELECT ON public.live_economics_summary TO authenticated;

-- 5. Add unique constraint on palette_value_pool if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'palette_value_pool_palette_id_key'
  ) THEN
    ALTER TABLE public.palette_value_pool ADD CONSTRAINT palette_value_pool_palette_id_key UNIQUE (palette_id);
  END IF;
END $$;

-- 6. Add total_marketplace_trades column to palette_value_pool if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'palette_value_pool' 
    AND column_name = 'total_marketplace_trades'
  ) THEN
    ALTER TABLE public.palette_value_pool ADD COLUMN total_marketplace_trades integer NOT NULL DEFAULT 0;
  END IF;
END $$;