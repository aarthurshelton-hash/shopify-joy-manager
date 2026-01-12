-- Add grace period tracking to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_notified_at TIMESTAMP WITH TIME ZONE;

-- Create notifications table for subscription alerts
CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'expiring_soon', 'grace_period_started', 'grace_period_ending', 'visions_released'
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.subscription_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.subscription_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "Service role can insert notifications"
ON public.subscription_notifications
FOR INSERT
WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.subscription_notifications(user_id, read_at) 
WHERE read_at IS NULL;

-- Function to check and handle grace period expiration
CREATE OR REPLACE FUNCTION public.check_grace_period_expiration(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grace_end TIMESTAMP WITH TIME ZONE;
  v_released_count INTEGER;
BEGIN
  -- Get grace period end for user
  SELECT grace_period_end INTO v_grace_end
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND subscription_status IN ('canceled', 'unpaid', 'past_due');
  
  -- If grace period has ended, release visions
  IF v_grace_end IS NOT NULL AND v_grace_end < now() THEN
    -- Release the visions
    SELECT release_user_visions(p_user_id) INTO v_released_count;
    
    -- Clear grace period
    UPDATE user_subscriptions
    SET grace_period_end = NULL, grace_notified_at = now()
    WHERE user_id = p_user_id;
    
    -- Create notification if visions were released
    IF v_released_count > 0 THEN
      INSERT INTO subscription_notifications (user_id, notification_type, message)
      VALUES (p_user_id, 'visions_released', 
        'Your subscription grace period has ended. ' || v_released_count || ' vision(s) have been released to the marketplace.');
    END IF;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;