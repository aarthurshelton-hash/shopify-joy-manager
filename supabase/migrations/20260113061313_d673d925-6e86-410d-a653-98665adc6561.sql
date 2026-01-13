-- Seed palette value pools with all En Pensent trademarked palettes
INSERT INTO palette_value_pool (palette_id, palette_name, base_value_cents, earned_value_cents, total_visions_using, total_interactions) VALUES
  ('hotCold', 'Hot & Cold', 50000, 0, 0, 0),
  ('medieval', 'Medieval', 25000, 0, 0, 0),
  ('egyptian', 'Egyptian', 25000, 0, 0, 0),
  ('roman', 'Roman Empire', 25000, 0, 0, 0),
  ('modern', 'Modern', 15000, 0, 0, 0),
  ('greyscale', 'Greyscale', 15000, 0, 0, 0),
  ('japanese', 'Japanese', 35000, 0, 0, 0),
  ('nordic', 'Nordic', 35000, 0, 0, 0),
  ('artdeco', 'Art Deco', 35000, 0, 0, 0),
  ('tropical', 'Tropical', 30000, 0, 0, 0),
  ('cyberpunk', 'Cyberpunk', 40000, 0, 0, 0),
  ('autumn', 'Autumn', 30000, 0, 0, 0),
  ('ocean', 'Ocean', 30000, 0, 0, 0),
  ('desert', 'Desert', 30000, 0, 0, 0),
  ('cosmic', 'Cosmic', 40000, 0, 0, 0),
  ('vintage', 'Vintage', 35000, 0, 0, 0)
ON CONFLICT (palette_id) DO UPDATE SET 
  palette_name = EXCLUDED.palette_name,
  base_value_cents = EXCLUDED.base_value_cents;

-- Seed gamecard value pools with legendary games (rarity tiers: legendary > epic > rare > common)
INSERT INTO gamecard_value_pool (game_id, game_title, rarity_tier, base_value_cents, earned_value_cents, total_visions, total_interactions) VALUES
  -- Legendary Tier ($200+ base value) - The most iconic games ever
  ('kasparov-topalov-1999', 'Kasparov''s Immortal', 'legendary', 25000, 0, 0, 0),
  ('byrne-fischer-1956', 'The Game of the Century', 'legendary', 30000, 0, 0, 0),
  ('anderssen-kieseritzky-1851', 'The Immortal Game', 'legendary', 35000, 0, 0, 0),
  ('morphy-opera-1858', 'The Opera Game', 'legendary', 28000, 0, 0, 0),
  ('oldest-recorded-1475', 'The Oldest Recorded Game', 'legendary', 50000, 0, 0, 0),
  
  -- Epic Tier ($100-199 base value) - World Championship games
  ('deep-blue-kasparov-1997', 'Deep Blue''s Final Blow', 'epic', 20000, 0, 0, 0),
  ('spassky-fischer-1972', 'Fischer Strikes Back', 'epic', 18000, 0, 0, 0),
  ('lasker-thomas-1912', 'The King Hunt', 'epic', 15000, 0, 0, 0),
  ('carlsen-anand-2013', 'Carlsen Becomes Champion', 'epic', 16000, 0, 0, 0),
  ('botvinnik-capablanca-1938', 'Botvinnik Brilliance', 'epic', 14000, 0, 0, 0),
  ('alekhine-capablanca-1927', 'The Marathon Match', 'epic', 15000, 0, 0, 0),
  ('karpov-kasparov-1985', 'The Octopus Knight', 'epic', 17000, 0, 0, 0),
  ('fischer-spassky-1972-g6', 'Fischer''s Masterpiece', 'epic', 19000, 0, 0, 0),
  
  -- Rare Tier ($50-99 base value) - Famous brilliancies
  ('anderssen-dufresne-1852', 'The Evergreen Game', 'rare', 10000, 0, 0, 0),
  ('marshall-capablanca-1909', 'Capablanca''s Debut', 'rare', 8000, 0, 0, 0),
  ('short-timman-1991', 'Short''s King Walk', 'rare', 7000, 0, 0, 0),
  ('polgar-kasparov-2002', 'Polgar Beats the King', 'rare', 9000, 0, 0, 0),
  ('tal-miller-1988', 'Tal''s Last Brilliancy', 'rare', 8500, 0, 0, 0),
  ('steinitz-bardeleben-1895', 'The Brilliancy Prize', 'rare', 7500, 0, 0, 0),
  
  -- Common Tier ($25-49 base value) - Notable games
  ('nezhmetdinov-chernikov-1962', 'The Soviet Immortal', 'common', 5000, 0, 0, 0),
  ('rotlewi-rubinstein-1907', 'Rubinstein''s Immortal', 'common', 5000, 0, 0, 0),
  ('gukesh-ding-2024', 'The Youngest Champion', 'common', 6000, 0, 0, 0)
ON CONFLICT (game_id) DO UPDATE SET 
  game_title = EXCLUDED.game_title,
  rarity_tier = EXCLUDED.rarity_tier,
  base_value_cents = EXCLUDED.base_value_cents;

-- Create financial_trends table for historical tracking
CREATE TABLE IF NOT EXISTS public.financial_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Revenue metrics
  daily_subscription_revenue_cents INTEGER DEFAULT 0,
  daily_print_revenue_cents INTEGER DEFAULT 0,
  daily_book_revenue_cents INTEGER DEFAULT 0,
  daily_marketplace_fee_cents INTEGER DEFAULT 0,
  -- Cost metrics
  daily_stripe_fees_cents INTEGER DEFAULT 0,
  daily_shopify_fees_cents INTEGER DEFAULT 0,
  daily_printify_costs_cents INTEGER DEFAULT 0,
  daily_lulu_costs_cents INTEGER DEFAULT 0,
  -- Distribution metrics
  daily_creator_royalties_cents INTEGER DEFAULT 0,
  daily_education_fund_cents INTEGER DEFAULT 0,
  daily_palette_pool_cents INTEGER DEFAULT 0,
  daily_gamecard_pool_cents INTEGER DEFAULT 0,
  -- Activity metrics
  daily_new_users INTEGER DEFAULT 0,
  daily_new_subscribers INTEGER DEFAULT 0,
  daily_churned_subscribers INTEGER DEFAULT 0,
  daily_visions_created INTEGER DEFAULT 0,
  daily_marketplace_sales INTEGER DEFAULT 0,
  daily_print_orders INTEGER DEFAULT 0,
  -- Engagement metrics
  daily_views INTEGER DEFAULT 0,
  daily_downloads INTEGER DEFAULT 0,
  daily_trades INTEGER DEFAULT 0,
  -- Value pool snapshots
  total_palette_pool_value_cents INTEGER DEFAULT 0,
  total_gamecard_pool_value_cents INTEGER DEFAULT 0,
  total_market_cap_cents INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.financial_trends ENABLE ROW LEVEL SECURITY;

-- Admin read access
CREATE POLICY "Admins can view financial trends" 
  ON public.financial_trends 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- System insert/update access (no auth required for automated jobs)
CREATE POLICY "System can insert financial trends" 
  ON public.financial_trends 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update financial trends" 
  ON public.financial_trends 
  FOR UPDATE 
  USING (true);

-- Create premium_analytics table for sellable data access
CREATE TABLE IF NOT EXISTS public.premium_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analytics_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view their own premium analytics" 
  ON public.premium_analytics 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Premium users can have analytics generated for them
CREATE POLICY "System can insert premium analytics" 
  ON public.premium_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to snapshot daily financial trends
CREATE OR REPLACE FUNCTION public.snapshot_daily_financials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
BEGIN
  -- Insert or update today's snapshot
  INSERT INTO financial_trends (
    date,
    daily_subscription_revenue_cents,
    daily_print_revenue_cents,
    daily_marketplace_fee_cents,
    daily_creator_royalties_cents,
    daily_education_fund_cents,
    daily_palette_pool_cents,
    daily_gamecard_pool_cents,
    daily_new_subscribers,
    daily_visions_created,
    daily_marketplace_sales,
    daily_views,
    daily_downloads,
    daily_trades,
    total_palette_pool_value_cents,
    total_gamecard_pool_value_cents
  )
  SELECT
    v_today,
    -- Revenue from order_financials
    COALESCE((SELECT SUM(gross_revenue_cents) FROM order_financials WHERE order_type = 'subscription' AND created_at::date = v_today), 0),
    COALESCE((SELECT SUM(gross_revenue_cents) FROM order_financials WHERE order_type = 'print' AND created_at::date = v_today), 0),
    COALESCE((SELECT SUM(platform_fee_cents) FROM education_fund WHERE event_type = 'marketplace_sale' AND created_at::date = v_today), 0),
    -- Distributions
    COALESCE((SELECT SUM(creator_royalty_cents) FROM order_financials WHERE created_at::date = v_today), 0),
    COALESCE((SELECT SUM(education_fund_cents) FROM order_financials WHERE created_at::date = v_today), 0),
    COALESCE((SELECT SUM(palette_pool_cents) FROM order_financials WHERE created_at::date = v_today), 0),
    COALESCE((SELECT SUM(gamecard_pool_cents) FROM order_financials WHERE created_at::date = v_today), 0),
    -- Activity
    COALESCE((SELECT COUNT(*) FROM user_subscriptions WHERE created_at::date = v_today AND subscription_status = 'active'), 0),
    COALESCE((SELECT COUNT(*) FROM saved_visualizations WHERE created_at::date = v_today), 0),
    COALESCE((SELECT COUNT(*) FROM visualization_listings WHERE status = 'sold' AND sold_at::date = v_today), 0),
    -- Engagement from vision_interactions
    COALESCE((SELECT COUNT(*) FROM vision_interactions WHERE interaction_type = 'view' AND created_at::date = v_today), 0),
    COALESCE((SELECT COUNT(*) FROM vision_interactions WHERE interaction_type IN ('download_hd', 'download_gif') AND created_at::date = v_today), 0),
    COALESCE((SELECT COUNT(*) FROM vision_interactions WHERE interaction_type = 'trade' AND created_at::date = v_today), 0),
    -- Pool totals
    COALESCE((SELECT SUM(base_value_cents + earned_value_cents) FROM palette_value_pool), 0),
    COALESCE((SELECT SUM(base_value_cents + earned_value_cents) FROM gamecard_value_pool), 0)
  ON CONFLICT (date) DO UPDATE SET
    daily_subscription_revenue_cents = EXCLUDED.daily_subscription_revenue_cents,
    daily_print_revenue_cents = EXCLUDED.daily_print_revenue_cents,
    daily_marketplace_fee_cents = EXCLUDED.daily_marketplace_fee_cents,
    daily_creator_royalties_cents = EXCLUDED.daily_creator_royalties_cents,
    daily_education_fund_cents = EXCLUDED.daily_education_fund_cents,
    daily_palette_pool_cents = EXCLUDED.daily_palette_pool_cents,
    daily_gamecard_pool_cents = EXCLUDED.daily_gamecard_pool_cents,
    daily_new_subscribers = EXCLUDED.daily_new_subscribers,
    daily_visions_created = EXCLUDED.daily_visions_created,
    daily_marketplace_sales = EXCLUDED.daily_marketplace_sales,
    daily_views = EXCLUDED.daily_views,
    daily_downloads = EXCLUDED.daily_downloads,
    daily_trades = EXCLUDED.daily_trades,
    total_palette_pool_value_cents = EXCLUDED.total_palette_pool_value_cents,
    total_gamecard_pool_value_cents = EXCLUDED.total_gamecard_pool_value_cents;
END;
$$;

-- Create function to generate premium analytics for a user
CREATE OR REPLACE FUNCTION public.generate_premium_analytics(p_user_id UUID, p_analytics_type TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_analytics_id UUID;
  v_data JSONB;
BEGIN
  -- Check if user is premium
  IF NOT is_premium_user(p_user_id) THEN
    RAISE EXCEPTION 'Premium subscription required for analytics access';
  END IF;

  -- Generate analytics based on type
  CASE p_analytics_type
    WHEN 'market_trends' THEN
      SELECT jsonb_build_object(
        'palette_performance', (SELECT jsonb_agg(jsonb_build_object(
          'palette_id', palette_id,
          'palette_name', palette_name,
          'total_value_cents', base_value_cents + earned_value_cents,
          'usage_count', total_visions_using,
          'interaction_count', total_interactions
        )) FROM palette_value_pool ORDER BY earned_value_cents DESC LIMIT 10),
        'gamecard_performance', (SELECT jsonb_agg(jsonb_build_object(
          'game_id', game_id,
          'game_title', game_title,
          'rarity_tier', rarity_tier,
          'total_value_cents', base_value_cents + earned_value_cents,
          'vision_count', total_visions
        )) FROM gamecard_value_pool ORDER BY earned_value_cents DESC LIMIT 10),
        'trend_data', (SELECT jsonb_agg(jsonb_build_object(
          'date', date,
          'views', daily_views,
          'downloads', daily_downloads,
          'trades', daily_trades,
          'market_cap_cents', total_market_cap_cents
        )) FROM financial_trends ORDER BY date DESC LIMIT 30),
        'generated_at', now()
      ) INTO v_data;
      
    WHEN 'engagement_insights' THEN
      SELECT jsonb_build_object(
        'top_visions', (SELECT jsonb_agg(jsonb_build_object(
          'visualization_id', vs.visualization_id,
          'total_score', vs.total_score,
          'view_count', vs.view_count,
          'download_count', vs.download_hd_count + vs.download_gif_count,
          'trade_count', vs.trade_count
        )) FROM vision_scores vs ORDER BY vs.total_score DESC LIMIT 20),
        'hourly_activity', (SELECT jsonb_agg(jsonb_build_object(
          'hour', EXTRACT(HOUR FROM created_at),
          'count', COUNT(*)
        )) FROM vision_interactions WHERE created_at > now() - interval '7 days' GROUP BY EXTRACT(HOUR FROM created_at)),
        'generated_at', now()
      ) INTO v_data;
      
    WHEN 'portfolio_analysis' THEN
      SELECT jsonb_build_object(
        'portfolio_visions', (SELECT jsonb_agg(jsonb_build_object(
          'visualization_id', sv.id,
          'title', sv.title,
          'score', COALESCE(vs.total_score, 0),
          'royalty_earned_cents', COALESCE(vs.royalty_cents_earned, 0)
        )) FROM saved_visualizations sv LEFT JOIN vision_scores vs ON vs.visualization_id = sv.id WHERE sv.user_id = p_user_id),
        'total_portfolio_value_cents', calculate_portfolio_value(p_user_id),
        'generated_at', now()
      ) INTO v_data;
      
    ELSE
      RAISE EXCEPTION 'Unknown analytics type: %', p_analytics_type;
  END CASE;

  -- Store the analytics
  INSERT INTO premium_analytics (user_id, analytics_type, data)
  VALUES (p_user_id, p_analytics_type, v_data)
  RETURNING id INTO v_analytics_id;

  RETURN v_analytics_id;
END;
$$;