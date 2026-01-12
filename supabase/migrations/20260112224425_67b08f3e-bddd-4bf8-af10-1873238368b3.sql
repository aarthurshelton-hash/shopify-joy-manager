-- Create table to track visualization transfers
CREATE TABLE public.visualization_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visualization_id UUID NOT NULL REFERENCES public.saved_visualizations(id) ON DELETE CASCADE,
  from_user_id UUID,
  to_user_id UUID NOT NULL,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('purchase', 'free_claim', 'gift')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visualization_transfers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view transfers (for transparency)
CREATE POLICY "Authenticated users can view transfers"
ON public.visualization_transfers
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert transfers (via edge functions)
CREATE POLICY "Service role can insert transfers"
ON public.visualization_transfers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for efficient 24-hour lookups
CREATE INDEX idx_visualization_transfers_recent 
ON public.visualization_transfers (visualization_id, created_at DESC);

-- Function to check if a visualization can be transferred (max 3 per 24h)
CREATE OR REPLACE FUNCTION public.can_transfer_visualization(p_visualization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  transfer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO transfer_count
  FROM visualization_transfers
  WHERE visualization_id = p_visualization_id
    AND created_at > (now() - INTERVAL '24 hours');
  
  RETURN transfer_count < 3;
END;
$$;

-- Function to get remaining transfers for a visualization
CREATE OR REPLACE FUNCTION public.get_remaining_transfers(p_visualization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  transfer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO transfer_count
  FROM visualization_transfers
  WHERE visualization_id = p_visualization_id
    AND created_at > (now() - INTERVAL '24 hours');
  
  RETURN GREATEST(0, 3 - transfer_count);
END;
$$;

-- Function to release all visions when subscription expires
CREATE OR REPLACE FUNCTION public.release_user_visions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  released_count INTEGER;
BEGIN
  -- Cancel any active listings for this user's visions
  UPDATE visualization_listings
  SET status = 'cancelled', updated_at = now()
  WHERE seller_id = p_user_id AND status = 'active';
  
  -- Set visualizations to have NULL user_id (orphaned/claimable)
  UPDATE saved_visualizations
  SET user_id = NULL, updated_at = now()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  
  RETURN released_count;
END;
$$;

-- Make user_id nullable in saved_visualizations for orphaned visions
ALTER TABLE public.saved_visualizations 
ALTER COLUMN user_id DROP NOT NULL;

-- Policy for premium users to claim orphaned visions
CREATE POLICY "Premium users can claim orphaned visions"
ON public.saved_visualizations
FOR UPDATE
TO authenticated
USING (user_id IS NULL AND is_premium_user(auth.uid()))
WITH CHECK (user_id = auth.uid() AND is_premium_user(auth.uid()));