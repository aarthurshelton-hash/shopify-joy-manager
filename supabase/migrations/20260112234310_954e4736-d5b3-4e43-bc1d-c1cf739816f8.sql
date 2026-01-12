-- Create user_wallets table for platform credits
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_deposited_cents INTEGER NOT NULL DEFAULT 0,
  total_withdrawn_cents INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create wallet_transactions table for transaction history
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'sale', 'purchase', 'platform_fee'
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  related_listing_id UUID REFERENCES public.visualization_listings(id),
  counterparty_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create marketplace_offers table for counter-offer negotiation
CREATE TABLE public.marketplace_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.visualization_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  offer_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'countered', 'expired', 'withdrawn'
  parent_offer_id UUID REFERENCES public.marketplace_offers(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;

-- Buyers and sellers can view offers on their listings
CREATE POLICY "Users can view offers they're involved in" 
ON public.marketplace_offers 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyers can create offers
CREATE POLICY "Buyers can create offers" 
ON public.marketplace_offers 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Participants can update offers (accept/decline/counter)
CREATE POLICY "Participants can update offers" 
ON public.marketplace_offers 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyers can withdraw their own pending offers
CREATE POLICY "Buyers can delete their pending offers" 
ON public.marketplace_offers 
FOR DELETE 
USING (auth.uid() = buyer_id AND status = 'pending');

-- Create function to get or create user wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id UUID)
RETURNS public.user_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.user_wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_wallets (user_id, balance_cents)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN v_wallet;
END;
$$;

-- Create function to process marketplace sale with platform fee
CREATE OR REPLACE FUNCTION public.process_marketplace_sale(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_sale_price_cents INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.visualization_listings;
  v_seller_id UUID;
  v_visualization_id UUID;
  v_platform_fee_cents INTEGER;
  v_seller_receives_cents INTEGER;
  v_buyer_wallet public.user_wallets;
  v_seller_wallet public.user_wallets;
BEGIN
  -- Get listing details
  SELECT * INTO v_listing 
  FROM public.visualization_listings 
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or not active';
  END IF;
  
  v_seller_id := v_listing.seller_id;
  v_visualization_id := v_listing.visualization_id;
  
  -- Can't buy your own listing
  IF v_seller_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot purchase your own listing';
  END IF;
  
  -- Check transfer limits
  IF NOT can_transfer_visualization(v_visualization_id) THEN
    RAISE EXCEPTION 'Transfer limit reached for this vision (max 3 per 24 hours)';
  END IF;
  
  -- Calculate fees (5% platform fee)
  v_platform_fee_cents := FLOOR(p_sale_price_cents * 0.05);
  v_seller_receives_cents := p_sale_price_cents - v_platform_fee_cents;
  
  -- Get/create wallets
  SELECT * INTO v_buyer_wallet FROM get_or_create_wallet(p_buyer_id);
  SELECT * INTO v_seller_wallet FROM get_or_create_wallet(v_seller_id);
  
  -- Check buyer has sufficient balance
  IF v_buyer_wallet.balance_cents < p_sale_price_cents THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Deduct from buyer
  UPDATE public.user_wallets 
  SET balance_cents = balance_cents - p_sale_price_cents,
      total_spent_cents = total_spent_cents + p_sale_price_cents,
      updated_at = now()
  WHERE user_id = p_buyer_id;
  
  -- Credit seller (minus platform fee)
  UPDATE public.user_wallets 
  SET balance_cents = balance_cents + v_seller_receives_cents,
      total_earned_cents = total_earned_cents + v_seller_receives_cents,
      updated_at = now()
  WHERE user_id = v_seller_id;
  
  -- Record buyer transaction
  INSERT INTO public.wallet_transactions 
  (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, counterparty_id, description)
  VALUES (
    p_buyer_id, 
    'purchase', 
    -p_sale_price_cents,
    v_buyer_wallet.balance_cents - p_sale_price_cents,
    p_listing_id,
    v_seller_id,
    'Purchased vision from marketplace'
  );
  
  -- Record seller transaction
  INSERT INTO public.wallet_transactions 
  (user_id, transaction_type, amount_cents, balance_after_cents, related_listing_id, counterparty_id, description)
  VALUES (
    v_seller_id, 
    'sale', 
    v_seller_receives_cents,
    v_seller_wallet.balance_cents + v_seller_receives_cents,
    p_listing_id,
    p_buyer_id,
    'Sold vision on marketplace (95% after 5% platform fee)'
  );
  
  -- Record platform fee for education fund
  INSERT INTO public.education_fund 
  (event_type, platform_fee_cents, notes)
  VALUES (
    'marketplace_sale',
    v_platform_fee_cents,
    'Platform fee from marketplace sale'
  );
  
  -- Transfer visualization ownership
  UPDATE public.saved_visualizations 
  SET user_id = p_buyer_id, updated_at = now()
  WHERE id = v_visualization_id;
  
  -- Mark listing as sold
  UPDATE public.visualization_listings 
  SET status = 'sold', 
      buyer_id = p_buyer_id, 
      sold_at = now(),
      updated_at = now()
  WHERE id = p_listing_id;
  
  -- Record transfer
  INSERT INTO public.visualization_transfers 
  (visualization_id, from_user_id, to_user_id, transfer_type)
  VALUES (v_visualization_id, v_seller_id, p_buyer_id, 'marketplace_sale');
  
  -- Record trade interaction for scoring
  PERFORM record_vision_interaction(v_visualization_id, p_buyer_id, 'trade', p_sale_price_cents);
  
  RETURN TRUE;
END;
$$;

-- Create trigger for updated_at on user_wallets
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on marketplace_offers
CREATE TRIGGER update_marketplace_offers_updated_at
BEFORE UPDATE ON public.marketplace_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();