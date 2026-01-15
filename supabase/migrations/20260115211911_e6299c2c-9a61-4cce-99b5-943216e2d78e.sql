-- Fix 1: Add auth.uid() validation to process_marketplace_sale
CREATE OR REPLACE FUNCTION public.process_marketplace_sale(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_sale_price_cents integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD;
  v_buyer_wallet RECORD;
  v_seller_wallet RECORD;
  v_platform_fee_cents INTEGER;
  v_seller_proceeds_cents INTEGER;
BEGIN
  -- CRITICAL: Verify the caller is the buyer (prevents unauthorized wallet manipulation)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_buyer_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only purchase as yourself';
  END IF;

  -- Get listing details
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

  -- Calculate fees (5% platform fee)
  v_platform_fee_cents := ROUND(p_sale_price_cents * 0.05);
  v_seller_proceeds_cents := p_sale_price_cents - v_platform_fee_cents;

  -- Get buyer wallet
  SELECT * INTO v_buyer_wallet
  FROM user_wallets
  WHERE user_id = p_buyer_id
  FOR UPDATE;

  IF NOT FOUND OR v_buyer_wallet.balance_cents < p_sale_price_cents THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Get or create seller wallet
  INSERT INTO user_wallets (user_id, balance_cents)
  VALUES (v_listing.seller_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_seller_wallet
  FROM user_wallets
  WHERE user_id = v_listing.seller_id
  FOR UPDATE;

  -- Deduct from buyer
  UPDATE user_wallets
  SET 
    balance_cents = balance_cents - p_sale_price_cents,
    total_spent_cents = total_spent_cents + p_sale_price_cents,
    updated_at = now()
  WHERE user_id = p_buyer_id;

  -- Credit seller
  UPDATE user_wallets
  SET 
    balance_cents = balance_cents + v_seller_proceeds_cents,
    total_earned_cents = total_earned_cents + v_seller_proceeds_cents,
    updated_at = now()
  WHERE user_id = v_listing.seller_id;

  -- Record buyer transaction
  INSERT INTO wallet_transactions (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, counterparty_id, description)
  VALUES (p_buyer_id, 'purchase', -p_sale_price_cents, v_buyer_wallet.balance_cents - p_sale_price_cents, p_listing_id, v_listing.seller_id, 'Marketplace purchase');

  -- Record seller transaction
  INSERT INTO wallet_transactions (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, counterparty_id, description)
  VALUES (v_listing.seller_id, 'sale', v_seller_proceeds_cents, v_seller_wallet.balance_cents + v_seller_proceeds_cents, p_listing_id, p_buyer_id, 'Marketplace sale');

  -- Update listing status
  UPDATE visualization_listings
  SET status = 'sold', buyer_id = p_buyer_id, sold_at = now(), updated_at = now()
  WHERE id = p_listing_id;

  -- Transfer visualization ownership
  UPDATE saved_visualizations
  SET user_id = p_buyer_id, updated_at = now()
  WHERE id = v_listing.visualization_id;

  -- Record transfer
  INSERT INTO visualization_transfers (visualization_id, from_user_id, to_user_id, transfer_type)
  VALUES (v_listing.visualization_id, v_listing.seller_id, p_buyer_id, 'sale');

  RETURN TRUE;
END;
$function$;

-- Fix 2: Add original_creator_id to saved_visualizations for priority recovery
ALTER TABLE public.saved_visualizations 
ADD COLUMN IF NOT EXISTS original_creator_id UUID REFERENCES auth.users(id);

-- Backfill: Set original_creator_id to current user_id where not already set
UPDATE public.saved_visualizations 
SET original_creator_id = user_id 
WHERE original_creator_id IS NULL AND user_id IS NOT NULL;

-- Fix 3: Create trigger to auto-set original_creator_id on insert
CREATE OR REPLACE FUNCTION public.set_original_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only set original_creator_id if not already set (preserves creator on transfers)
  IF NEW.original_creator_id IS NULL THEN
    NEW.original_creator_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_original_creator_trigger ON public.saved_visualizations;
CREATE TRIGGER set_original_creator_trigger
BEFORE INSERT ON public.saved_visualizations
FOR EACH ROW
EXECUTE FUNCTION public.set_original_creator();

-- Fix 4: Create function for original creator to reclaim orphaned visions
CREATE OR REPLACE FUNCTION public.reclaim_orphaned_vision(p_visualization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_vision RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the vision
  SELECT * INTO v_vision
  FROM saved_visualizations
  WHERE id = p_visualization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vision not found';
  END IF;

  -- Check if caller is the original creator
  IF v_vision.original_creator_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the original creator can reclaim this vision';
  END IF;

  -- Check if vision is orphaned (no current owner)
  IF v_vision.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Vision is not orphaned - it has a current owner';
  END IF;

  -- Check if there's an active listing (someone might be buying it)
  IF EXISTS (SELECT 1 FROM visualization_listings WHERE visualization_id = p_visualization_id AND status = 'active') THEN
    RAISE EXCEPTION 'Cannot reclaim - vision has an active listing';
  END IF;

  -- Reclaim the vision
  UPDATE saved_visualizations
  SET user_id = auth.uid(), updated_at = now()
  WHERE id = p_visualization_id;

  -- Record the transfer
  INSERT INTO visualization_transfers (visualization_id, from_user_id, to_user_id, transfer_type)
  VALUES (p_visualization_id, NULL, auth.uid(), 'creator_reclaim');

  RETURN TRUE;
END;
$function$;

-- Fix 5: Add RLS policy for original creators to see their orphaned creations
CREATE POLICY "Original creators can view their orphaned visions"
ON public.saved_visualizations FOR SELECT
USING (original_creator_id = auth.uid() AND user_id IS NULL);