-- Function to record marketplace economics when a sale completes
CREATE OR REPLACE FUNCTION public.record_marketplace_economics(
  p_listing_id uuid,
  p_visualization_id uuid,
  p_seller_id uuid,
  p_buyer_id uuid,
  p_sale_price_cents integer,
  p_game_id text DEFAULT NULL,
  p_palette_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_marketplace_fee_cents integer;
  v_seller_proceeds_cents integer;
  v_education_fund_share_cents integer;
  v_result jsonb;
BEGIN
  -- Marketplace fee is 5% for paid sales
  v_marketplace_fee_cents := CASE 
    WHEN p_sale_price_cents > 0 THEN ROUND(p_sale_price_cents * 0.05)
    ELSE 0
  END;
  
  -- Seller gets 95% of sale price
  v_seller_proceeds_cents := p_sale_price_cents - v_marketplace_fee_cents;
  
  -- 25% of marketplace fee goes to education fund
  v_education_fund_share_cents := ROUND(v_marketplace_fee_cents * 0.25);
  
  -- Record in order_financials for tracking
  INSERT INTO order_financials (
    order_type,
    order_reference,
    visualization_id,
    user_id,
    game_id,
    palette_id,
    gross_revenue_cents,
    fulfillment_costs_cents,
    platform_fees_cents,
    net_revenue_cents,
    creator_royalty_cents,
    education_fund_cents,
    palette_pool_cents,
    gamecard_pool_cents
  ) VALUES (
    'marketplace_sale',
    p_listing_id::text,
    p_visualization_id,
    p_seller_id,
    p_game_id,
    p_palette_id,
    p_sale_price_cents,
    0, -- No fulfillment for digital transfer
    v_marketplace_fee_cents,
    v_seller_proceeds_cents,
    v_seller_proceeds_cents, -- Seller proceeds = their "royalty" from sale
    v_education_fund_share_cents,
    ROUND(v_marketplace_fee_cents * 0.20), -- 20% of fee to palette pool
    ROUND(v_marketplace_fee_cents * 0.15)  -- 15% of fee to gamecard pool
  );
  
  -- Update education fund if there's a contribution
  IF v_education_fund_share_cents > 0 THEN
    INSERT INTO education_fund (
      event_type,
      source_user_id,
      fund_contribution_cents,
      platform_fee_cents,
      notes
    ) VALUES (
      'marketplace_sale',
      p_seller_id,
      v_education_fund_share_cents,
      v_marketplace_fee_cents,
      'Marketplace sale of vision ' || p_visualization_id::text
    );
  END IF;
  
  -- Update palette value pool if palette specified
  IF p_palette_id IS NOT NULL AND v_marketplace_fee_cents > 0 THEN
    INSERT INTO palette_value_pool (palette_id, palette_name, earned_value_cents, total_interactions)
    VALUES (p_palette_id, p_palette_id, ROUND(v_marketplace_fee_cents * 0.20), 1)
    ON CONFLICT (palette_id) DO UPDATE SET
      earned_value_cents = palette_value_pool.earned_value_cents + ROUND(v_marketplace_fee_cents * 0.20),
      total_interactions = palette_value_pool.total_interactions + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;
  
  -- Update gamecard value pool if game specified
  IF p_game_id IS NOT NULL AND v_marketplace_fee_cents > 0 THEN
    INSERT INTO gamecard_value_pool (game_id, game_title, earned_value_cents, total_interactions)
    VALUES (p_game_id, p_game_id, ROUND(v_marketplace_fee_cents * 0.15), 1)
    ON CONFLICT (game_id) DO UPDATE SET
      earned_value_cents = gamecard_value_pool.earned_value_cents + ROUND(v_marketplace_fee_cents * 0.15),
      total_interactions = gamecard_value_pool.total_interactions + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;
  
  -- Update vision score with trade revenue
  UPDATE vision_scores SET
    trade_count = trade_count + 1,
    total_score = total_score + 500, -- Trade is worth 500 points
    updated_at = now()
  WHERE visualization_id = p_visualization_id;
  
  -- If no vision_scores row exists, create one
  IF NOT FOUND THEN
    INSERT INTO vision_scores (visualization_id, trade_count, total_score)
    VALUES (p_visualization_id, 1, 500);
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'marketplace_fee_cents', v_marketplace_fee_cents,
    'seller_proceeds_cents', v_seller_proceeds_cents,
    'education_fund_cents', v_education_fund_share_cents
  );
  
  RETURN v_result;
END;
$$;

-- Function to record print order economics (called from webhooks)
CREATE OR REPLACE FUNCTION public.record_print_order_economics(
  p_visualization_id uuid,
  p_user_id uuid,
  p_order_reference text,
  p_gross_revenue_cents integer,
  p_fulfillment_costs_cents integer,
  p_platform_fees_cents integer,
  p_shipping_costs_cents integer DEFAULT 0,
  p_game_id text DEFAULT NULL,
  p_palette_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_costs_cents integer;
  v_gross_profit_cents integer;
  v_value_appreciation_pool_cents integer;
  v_creator_royalty_cents integer;
  v_education_fund_cents integer;
  v_palette_pool_cents integer;
  v_gamecard_pool_cents integer;
  v_result jsonb;
BEGIN
  -- Calculate costs and profit
  v_total_costs_cents := p_fulfillment_costs_cents + p_platform_fees_cents + p_shipping_costs_cents;
  v_gross_profit_cents := GREATEST(0, p_gross_revenue_cents - v_total_costs_cents);
  
  -- 20% of profit goes to value appreciation pool
  v_value_appreciation_pool_cents := ROUND(v_gross_profit_cents * 0.20);
  
  -- Pool distribution: 40% creator, 25% education, 20% palette, 15% gamecard
  v_creator_royalty_cents := ROUND(v_value_appreciation_pool_cents * 0.40);
  v_education_fund_cents := ROUND(v_value_appreciation_pool_cents * 0.25);
  v_palette_pool_cents := ROUND(v_value_appreciation_pool_cents * 0.20);
  v_gamecard_pool_cents := ROUND(v_value_appreciation_pool_cents * 0.15);
  
  -- Record in order_financials
  INSERT INTO order_financials (
    order_type,
    order_reference,
    visualization_id,
    user_id,
    game_id,
    palette_id,
    gross_revenue_cents,
    fulfillment_costs_cents,
    platform_fees_cents,
    net_revenue_cents,
    creator_royalty_cents,
    education_fund_cents,
    palette_pool_cents,
    gamecard_pool_cents
  ) VALUES (
    'print_order',
    p_order_reference,
    p_visualization_id,
    p_user_id,
    p_game_id,
    p_palette_id,
    p_gross_revenue_cents,
    p_fulfillment_costs_cents + p_shipping_costs_cents,
    p_platform_fees_cents,
    v_gross_profit_cents,
    v_creator_royalty_cents,
    v_education_fund_cents,
    v_palette_pool_cents,
    v_gamecard_pool_cents
  );
  
  -- Update education fund
  IF v_education_fund_cents > 0 THEN
    INSERT INTO education_fund (
      event_type,
      source_user_id,
      fund_contribution_cents,
      notes
    ) VALUES (
      'print_order',
      p_user_id,
      v_education_fund_cents,
      'Print order ' || p_order_reference
    );
  END IF;
  
  -- Update palette value pool
  IF p_palette_id IS NOT NULL AND v_palette_pool_cents > 0 THEN
    INSERT INTO palette_value_pool (palette_id, palette_name, earned_value_cents, total_print_orders, total_interactions)
    VALUES (p_palette_id, p_palette_id, v_palette_pool_cents, 1, 1)
    ON CONFLICT (palette_id) DO UPDATE SET
      earned_value_cents = palette_value_pool.earned_value_cents + v_palette_pool_cents,
      total_print_orders = palette_value_pool.total_print_orders + 1,
      total_interactions = palette_value_pool.total_interactions + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;
  
  -- Update gamecard value pool
  IF p_game_id IS NOT NULL AND v_gamecard_pool_cents > 0 THEN
    INSERT INTO gamecard_value_pool (game_id, game_title, earned_value_cents, total_print_orders, total_interactions)
    VALUES (p_game_id, p_game_id, v_gamecard_pool_cents, 1, 1)
    ON CONFLICT (game_id) DO UPDATE SET
      earned_value_cents = gamecard_value_pool.earned_value_cents + v_gamecard_pool_cents,
      total_print_orders = gamecard_value_pool.total_print_orders + 1,
      total_interactions = gamecard_value_pool.total_interactions + 1,
      last_interaction_at = now(),
      updated_at = now();
  END IF;
  
  -- Update vision score
  UPDATE vision_scores SET
    print_order_count = print_order_count + 1,
    print_revenue_cents = print_revenue_cents + p_gross_revenue_cents,
    royalty_cents_earned = royalty_cents_earned + v_creator_royalty_cents,
    royalty_orders_count = royalty_orders_count + 1,
    total_score = total_score + 1000, -- Print order is worth 1000 points
    updated_at = now()
  WHERE visualization_id = p_visualization_id;
  
  IF NOT FOUND THEN
    INSERT INTO vision_scores (
      visualization_id, 
      print_order_count, 
      print_revenue_cents, 
      royalty_cents_earned, 
      royalty_orders_count,
      total_score
    )
    VALUES (p_visualization_id, 1, p_gross_revenue_cents, v_creator_royalty_cents, 1, 1000);
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'gross_profit_cents', v_gross_profit_cents,
    'value_appreciation_pool_cents', v_value_appreciation_pool_cents,
    'creator_royalty_cents', v_creator_royalty_cents,
    'education_fund_cents', v_education_fund_cents,
    'palette_pool_cents', v_palette_pool_cents,
    'gamecard_pool_cents', v_gamecard_pool_cents
  );
  
  RETURN v_result;
END;
$$;

-- Function to get vision economics summary
CREATE OR REPLACE FUNCTION public.get_vision_economics(p_visualization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_print_revenue_cents bigint;
  v_total_royalties_cents bigint;
  v_total_trades integer;
  v_trade_volume_cents bigint;
  v_score integer;
  v_result jsonb;
BEGIN
  -- Get totals from order_financials
  SELECT 
    COALESCE(SUM(CASE WHEN order_type = 'print_order' THEN gross_revenue_cents ELSE 0 END), 0),
    COALESCE(SUM(creator_royalty_cents), 0)
  INTO v_total_print_revenue_cents, v_total_royalties_cents
  FROM order_financials
  WHERE visualization_id = p_visualization_id;
  
  -- Get trade stats
  SELECT 
    COALESCE(SUM(CASE WHEN order_type = 'marketplace_sale' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN order_type = 'marketplace_sale' THEN gross_revenue_cents ELSE 0 END), 0)
  INTO v_total_trades, v_trade_volume_cents
  FROM order_financials
  WHERE visualization_id = p_visualization_id;
  
  -- Get vision score
  SELECT total_score INTO v_score
  FROM vision_scores
  WHERE visualization_id = p_visualization_id;
  
  v_result := jsonb_build_object(
    'visualization_id', p_visualization_id,
    'total_print_revenue_cents', v_total_print_revenue_cents,
    'total_royalties_earned_cents', v_total_royalties_cents,
    'total_trades', v_total_trades,
    'trade_volume_cents', v_trade_volume_cents,
    'vision_score', COALESCE(v_score, 0)
  );
  
  RETURN v_result;
END;
$$;

-- Function to get user portfolio economics
CREATE OR REPLACE FUNCTION public.get_user_portfolio_economics(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_visions integer;
  v_total_royalties_cents bigint;
  v_total_print_orders integer;
  v_total_trades_as_seller integer;
  v_total_sale_proceeds_cents bigint;
  v_total_score bigint;
  v_result jsonb;
BEGIN
  -- Count owned visions
  SELECT COUNT(*) INTO v_total_visions
  FROM saved_visualizations
  WHERE user_id = p_user_id;
  
  -- Get royalties from print orders on user's visions
  SELECT 
    COALESCE(SUM(creator_royalty_cents), 0),
    COUNT(CASE WHEN order_type = 'print_order' THEN 1 END)
  INTO v_total_royalties_cents, v_total_print_orders
  FROM order_financials
  WHERE visualization_id IN (SELECT id FROM saved_visualizations WHERE user_id = p_user_id);
  
  -- Get marketplace sales stats where user was seller
  SELECT 
    COUNT(*),
    COALESCE(SUM(net_revenue_cents), 0)
  INTO v_total_trades_as_seller, v_total_sale_proceeds_cents
  FROM order_financials
  WHERE user_id = p_user_id AND order_type = 'marketplace_sale';
  
  -- Get total vision score
  SELECT COALESCE(SUM(total_score), 0) INTO v_total_score
  FROM vision_scores vs
  JOIN saved_visualizations sv ON sv.id = vs.visualization_id
  WHERE sv.user_id = p_user_id;
  
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'total_visions_owned', v_total_visions,
    'total_royalties_earned_cents', v_total_royalties_cents,
    'total_print_orders', v_total_print_orders,
    'total_marketplace_sales', v_total_trades_as_seller,
    'total_sale_proceeds_cents', v_total_sale_proceeds_cents,
    'total_portfolio_score', v_total_score
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_marketplace_economics TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_print_order_economics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vision_economics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_portfolio_economics TO authenticated;