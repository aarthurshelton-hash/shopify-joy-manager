-- Platform Financial Tracking
CREATE TABLE public.platform_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Revenue Streams
  subscription_revenue_cents INTEGER NOT NULL DEFAULT 0,
  print_order_revenue_cents INTEGER NOT NULL DEFAULT 0,
  book_order_revenue_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_revenue_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Costs & Fees
  stripe_fees_cents INTEGER NOT NULL DEFAULT 0,
  shopify_fees_cents INTEGER NOT NULL DEFAULT 0,
  printify_costs_cents INTEGER NOT NULL DEFAULT 0,
  lulu_costs_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Distributions
  creator_royalties_cents INTEGER NOT NULL DEFAULT 0,
  education_fund_cents INTEGER NOT NULL DEFAULT 0,
  palette_pool_cents INTEGER NOT NULL DEFAULT 0,
  gamecard_pool_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Net
  net_profit_cents INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Palette Value Pool - tracks value distributed to trademarked palettes
CREATE TABLE public.palette_value_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  palette_id TEXT NOT NULL UNIQUE,
  palette_name TEXT NOT NULL,
  base_value_cents INTEGER NOT NULL DEFAULT 0,
  earned_value_cents INTEGER NOT NULL DEFAULT 0,
  total_visions_using INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  total_print_orders INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Game Card Value Pool - tracks value distributed to legendary game cards
CREATE TABLE public.gamecard_value_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL UNIQUE,
  game_title TEXT NOT NULL,
  base_value_cents INTEGER NOT NULL DEFAULT 0,
  earned_value_cents INTEGER NOT NULL DEFAULT 0,
  total_visions INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  total_print_orders INTEGER NOT NULL DEFAULT 0,
  rarity_tier TEXT NOT NULL DEFAULT 'common',
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order tracking for detailed cost analysis
CREATE TABLE public.order_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_type TEXT NOT NULL, -- 'print', 'book', 'marketplace'
  order_reference TEXT,
  
  -- Amounts
  gross_revenue_cents INTEGER NOT NULL DEFAULT 0,
  platform_fees_cents INTEGER NOT NULL DEFAULT 0, -- Stripe/Shopify
  fulfillment_costs_cents INTEGER NOT NULL DEFAULT 0, -- Printify/Lulu
  creator_royalty_cents INTEGER NOT NULL DEFAULT 0,
  education_fund_cents INTEGER NOT NULL DEFAULT 0,
  palette_pool_cents INTEGER NOT NULL DEFAULT 0,
  gamecard_pool_cents INTEGER NOT NULL DEFAULT 0,
  net_revenue_cents INTEGER NOT NULL DEFAULT 0,
  
  -- References
  visualization_id UUID REFERENCES saved_visualizations(id),
  palette_id TEXT,
  game_id TEXT,
  user_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palette_value_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamecard_value_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_financials ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin can view platform financials"
ON public.platform_financials FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage platform financials"
ON public.platform_financials FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view palette value pool"
ON public.palette_value_pool FOR SELECT
USING (true);

CREATE POLICY "Admin can manage palette value pool"
ON public.palette_value_pool FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view gamecard value pool"
ON public.gamecard_value_pool FOR SELECT
USING (true);

CREATE POLICY "Admin can manage gamecard value pool"
ON public.gamecard_value_pool FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can view order financials"
ON public.order_financials FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage order financials"
ON public.order_financials FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to record order financials and distribute value
CREATE OR REPLACE FUNCTION public.record_order_with_distribution(
  p_order_type TEXT,
  p_order_reference TEXT,
  p_gross_revenue_cents INTEGER,
  p_platform_fees_cents INTEGER,
  p_fulfillment_costs_cents INTEGER,
  p_visualization_id UUID DEFAULT NULL,
  p_palette_id TEXT DEFAULT NULL,
  p_game_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_net_after_costs INTEGER;
  v_creator_royalty INTEGER;
  v_education_fund INTEGER;
  v_palette_pool INTEGER;
  v_gamecard_pool INTEGER;
  v_net_revenue INTEGER;
BEGIN
  -- Calculate net after costs
  v_net_after_costs := p_gross_revenue_cents - p_platform_fees_cents - p_fulfillment_costs_cents;
  
  -- 80/20 split: 20% goes to value appreciation
  -- Of the 20%: 40% creator, 25% education, 20% palette, 15% gamecard
  v_creator_royalty := FLOOR(v_net_after_costs * 0.20 * 0.40);
  v_education_fund := FLOOR(v_net_after_costs * 0.20 * 0.25);
  v_palette_pool := FLOOR(v_net_after_costs * 0.20 * 0.20);
  v_gamecard_pool := FLOOR(v_net_after_costs * 0.20 * 0.15);
  v_net_revenue := v_net_after_costs - v_creator_royalty - v_education_fund - v_palette_pool - v_gamecard_pool;
  
  -- Record order
  INSERT INTO order_financials (
    order_type, order_reference, gross_revenue_cents, platform_fees_cents,
    fulfillment_costs_cents, creator_royalty_cents, education_fund_cents,
    palette_pool_cents, gamecard_pool_cents, net_revenue_cents,
    visualization_id, palette_id, game_id, user_id
  )
  VALUES (
    p_order_type, p_order_reference, p_gross_revenue_cents, p_platform_fees_cents,
    p_fulfillment_costs_cents, v_creator_royalty, v_education_fund,
    v_palette_pool, v_gamecard_pool, v_net_revenue,
    p_visualization_id, p_palette_id, p_game_id, p_user_id
  )
  RETURNING id INTO v_order_id;
  
  -- Update palette pool if palette specified
  IF p_palette_id IS NOT NULL THEN
    INSERT INTO palette_value_pool (palette_id, palette_name, earned_value_cents, total_print_orders, last_interaction_at)
    VALUES (p_palette_id, p_palette_id, v_palette_pool, 1, now())
    ON CONFLICT (palette_id) DO UPDATE SET
      earned_value_cents = palette_value_pool.earned_value_cents + v_palette_pool,
      total_print_orders = palette_value_pool.total_print_orders + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;
  
  -- Update gamecard pool if game specified
  IF p_game_id IS NOT NULL THEN
    INSERT INTO gamecard_value_pool (game_id, game_title, earned_value_cents, total_print_orders, last_interaction_at)
    VALUES (p_game_id, p_game_id, v_gamecard_pool, 1, now())
    ON CONFLICT (game_id) DO UPDATE SET
      earned_value_cents = gamecard_value_pool.earned_value_cents + v_gamecard_pool,
      total_print_orders = gamecard_value_pool.total_print_orders + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;
  
  -- Record to education fund
  INSERT INTO education_fund (event_type, platform_fee_cents, fund_contribution_cents, notes)
  VALUES ('order_distribution', 0, v_education_fund, 'Auto-distribution from ' || p_order_type || ' order');
  
  RETURN v_order_id;
END;
$$;

-- Create indexes
CREATE INDEX idx_platform_financials_period ON platform_financials(period_start, period_end);
CREATE INDEX idx_order_financials_type ON order_financials(order_type, created_at);
CREATE INDEX idx_order_financials_viz ON order_financials(visualization_id);
CREATE INDEX idx_palette_pool_value ON palette_value_pool(earned_value_cents DESC);
CREATE INDEX idx_gamecard_pool_value ON gamecard_value_pool(earned_value_cents DESC);