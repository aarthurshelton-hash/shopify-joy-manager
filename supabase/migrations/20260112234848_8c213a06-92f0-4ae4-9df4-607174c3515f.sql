-- Create withdrawal requests table with anti-fraud measures
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  payout_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payout_details JSONB,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their pending requests
CREATE POLICY "Users can cancel pending requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Admins can manage all requests
CREATE POLICY "Admins can manage withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate withdrawal request (anti-fraud)
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request(
  p_user_id UUID,
  p_amount_cents INTEGER
) RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT,
  max_withdrawable_cents INTEGER
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_wallet public.user_wallets;
  v_earned_cents INTEGER;
  v_already_withdrawn INTEGER;
  v_pending_withdrawals INTEGER;
  v_wallet_age_days INTEGER;
  v_recent_deposits INTEGER;
  v_max_withdrawable INTEGER;
BEGIN
  -- Get wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Wallet not found'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check wallet age (must be at least 7 days old)
  v_wallet_age_days := EXTRACT(DAY FROM (now() - v_wallet.created_at));
  IF v_wallet_age_days < 7 THEN
    RETURN QUERY SELECT FALSE, 
      ('Wallet must be at least 7 days old. ' || (7 - v_wallet_age_days) || ' days remaining.')::TEXT, 
      0;
    RETURN;
  END IF;
  
  -- Calculate max withdrawable (only earned funds, not deposited)
  -- Earned = sales revenue, NOT deposits
  v_earned_cents := v_wallet.total_earned_cents;
  v_already_withdrawn := v_wallet.total_withdrawn_cents;
  
  -- Check pending withdrawals
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_pending_withdrawals
  FROM public.withdrawal_requests
  WHERE user_id = p_user_id AND status IN ('pending', 'approved');
  
  -- Max withdrawable = earned - already withdrawn - pending
  v_max_withdrawable := GREATEST(0, v_earned_cents - v_already_withdrawn - v_pending_withdrawals);
  
  -- Check if amount exceeds max withdrawable
  IF p_amount_cents > v_max_withdrawable THEN
    RETURN QUERY SELECT FALSE, 
      ('Cannot withdraw more than earned balance. Max withdrawable: $' || (v_max_withdrawable / 100.0)::TEXT)::TEXT,
      v_max_withdrawable;
    RETURN;
  END IF;
  
  -- Minimum withdrawal $10
  IF p_amount_cents < 1000 THEN
    RETURN QUERY SELECT FALSE, 'Minimum withdrawal is $10.00'::TEXT, v_max_withdrawable;
    RETURN;
  END IF;
  
  -- Check for suspicious activity: large deposits followed by withdrawal attempts
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_recent_deposits
  FROM public.wallet_transactions
  WHERE user_id = p_user_id 
    AND transaction_type = 'deposit'
    AND created_at > (now() - INTERVAL '24 hours');
  
  IF v_recent_deposits > 0 AND p_amount_cents > v_earned_cents * 0.5 THEN
    RETURN QUERY SELECT FALSE, 
      'Withdrawal temporarily restricted. Please wait 24 hours after deposits before withdrawing large amounts.'::TEXT,
      v_max_withdrawable;
    RETURN;
  END IF;
  
  -- Check rate limit: max 1 pending request at a time
  IF v_pending_withdrawals > 0 THEN
    RETURN QUERY SELECT FALSE, 
      'You already have a pending withdrawal request. Please wait for it to be processed.'::TEXT,
      v_max_withdrawable;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_max_withdrawable;
END;
$$;

-- Function to create validated withdrawal request
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_payout_details JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_validation RECORD;
  v_request_id UUID;
BEGIN
  -- Validate
  SELECT * INTO v_validation FROM validate_withdrawal_request(p_user_id, p_amount_cents);
  
  IF NOT v_validation.is_valid THEN
    RAISE EXCEPTION '%', v_validation.error_message;
  END IF;
  
  -- Create request
  INSERT INTO public.withdrawal_requests (user_id, amount_cents, payout_details)
  VALUES (p_user_id, p_amount_cents, p_payout_details)
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;

-- Function to get withdrawable balance
CREATE OR REPLACE FUNCTION public.get_withdrawable_balance(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_earned_cents INTEGER;
  v_withdrawn_cents INTEGER;
  v_pending_cents INTEGER;
BEGIN
  SELECT COALESCE(total_earned_cents, 0), COALESCE(total_withdrawn_cents, 0)
  INTO v_earned_cents, v_withdrawn_cents
  FROM public.user_wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_pending_cents
  FROM public.withdrawal_requests
  WHERE user_id = p_user_id AND status IN ('pending', 'approved');
  
  RETURN GREATEST(0, v_earned_cents - v_withdrawn_cents - v_pending_cents);
END;
$$;