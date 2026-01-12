-- Create user_subscriptions table for caching Stripe subscription state
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired', 'paused')),
  product_id TEXT,
  price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update (via webhook)
-- No INSERT/UPDATE policies for regular users - handled by edge functions with service role

-- Create helper function to check if user is premium (for RLS and edge functions)
CREATE OR REPLACE FUNCTION public.is_premium_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND subscription_status = 'active'
    AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(subscription_status);