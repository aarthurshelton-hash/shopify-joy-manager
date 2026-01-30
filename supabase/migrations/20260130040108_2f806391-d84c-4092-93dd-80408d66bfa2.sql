-- EMERGENCY HOTFIX: Restore authentication to process_marketplace_sale function
-- This fixes the critical security regression from migration 20260116003252

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
  v_marketplace_fee_cents integer;
  v_seller_proceeds_cents integer;
  v_buyer_balance_after integer;
  v_seller_balance_after integer;
  v_visualization_id uuid;
BEGIN
  -- CRITICAL: Verify authenticated user matches buyer (MUST be first)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Unauthorized: buyer_id must match authenticated user';
  END IF;

  -- Calculate marketplace fee (5%)
  v_marketplace_fee_cents := CEIL(p_sale_price_cents * 0.05);
  v_seller_proceeds_cents := p_sale_price_cents - v_marketplace_fee_cents;

  -- Get listing with validation
  SELECT * INTO v_listing
  FROM visualization_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or not active';
  END IF;

  -- Prevent self-purchase
  IF v_listing.seller_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot purchase your own listing';
  END IF;

  -- Verify price matches (allow exact match only for security)
  IF v_listing.price_cents != p_sale_price_cents THEN
    RAISE EXCEPTION 'Price mismatch: expected %, got %', v_listing.price_cents, p_sale_price_cents;
  END IF;

  v_visualization_id := v_listing.visualization_id;

  -- Get and lock buyer wallet, verify sufficient balance
  SELECT id INTO v_buyer_wallet_id
  FROM user_wallets
  WHERE user_id = p_buyer_id AND balance_cents >= p_sale_price_cents
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Get or create seller wallet
  INSERT INTO user_wallets (user_id, balance_cents)
  VALUES (v_listing.seller_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_seller_wallet_id
  FROM user_wallets
  WHERE user_id = v_listing.seller_id
  FOR UPDATE;

  -- Debit buyer
  UPDATE user_wallets
  SET 
    balance_cents = balance_cents - p_sale_price_cents,
    total_spent_cents = total_spent_cents + p_sale_price_cents,
    updated_at = now()
  WHERE id = v_buyer_wallet_id
  RETURNING balance_cents INTO v_buyer_balance_after;

  -- Credit seller (minus marketplace fee)
  UPDATE user_wallets
  SET 
    balance_cents = balance_cents + v_seller_proceeds_cents,
    total_earned_cents = total_earned_cents + v_seller_proceeds_cents,
    updated_at = now()
  WHERE id = v_seller_wallet_id
  RETURNING balance_cents INTO v_seller_balance_after;

  -- Record buyer transaction
  INSERT INTO wallet_transactions (
    user_id, transaction_type, amount_cents, balance_after_cents,
    related_listing_id, counterparty_id, description
  ) VALUES (
    p_buyer_id, 'purchase', -p_sale_price_cents, v_buyer_balance_after,
    p_listing_id, v_listing.seller_id, 'Marketplace purchase'
  );

  -- Record seller transaction
  INSERT INTO wallet_transactions (
    user_id, transaction_type, amount_cents, balance_after_cents,
    related_listing_id, counterparty_id, description
  ) VALUES (
    v_listing.seller_id, 'sale', v_seller_proceeds_cents, v_seller_balance_after,
    p_listing_id, p_buyer_id, 'Marketplace sale (5% fee deducted)'
  );

  -- Record platform fee transaction
  INSERT INTO wallet_transactions (
    user_id, transaction_type, amount_cents, balance_after_cents,
    related_listing_id, description
  ) VALUES (
    v_listing.seller_id, 'platform_fee', -v_marketplace_fee_cents, v_seller_balance_after,
    p_listing_id, 'Marketplace platform fee (5%)'
  );

  -- Transfer visualization ownership
  UPDATE saved_visualizations
  SET user_id = p_buyer_id, updated_at = now()
  WHERE id = v_visualization_id;

  -- Update listing status
  UPDATE visualization_listings
  SET 
    status = 'sold',
    buyer_id = p_buyer_id,
    sold_at = now(),
    updated_at = now()
  WHERE id = p_listing_id;

  -- Record visualization transfer
  INSERT INTO visualization_transfers (
    visualization_id, from_user_id, to_user_id, transfer_type
  ) VALUES (
    v_visualization_id, v_listing.seller_id, p_buyer_id, 'wallet_purchase'
  );

  -- Record trade interaction for vision scoring
  PERFORM record_vision_interaction(
    v_visualization_id,
    p_buyer_id,
    'trade',
    p_sale_price_cents,
    NULL
  );

  RETURN true;
END;
$$;