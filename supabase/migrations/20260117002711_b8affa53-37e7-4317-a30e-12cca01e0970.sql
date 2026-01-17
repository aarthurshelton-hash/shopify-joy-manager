-- Update the is_premium_user function to include Visionary email bypass
-- This ensures CEO and Visionary members get premium access everywhere

CREATE OR REPLACE FUNCTION public.is_premium_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  has_active_sub BOOLEAN;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = p_user_id;
  
  -- Check if user is a Visionary member (permanent premium)
  IF user_email IS NOT NULL AND lower(user_email) IN (
    'a.arthur.shelton@gmail.com',  -- CEO Alec Arthur Shelton
    'info@mawuli.xyz',              -- Marketplace tester
    'opecoreug@gmail.com'           -- Product Specialist Analyst
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check for active subscription in user_subscriptions table
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
      AND subscription_status = 'active'
      AND (current_period_end IS NULL OR current_period_end > NOW())
  ) INTO has_active_sub;
  
  RETURN COALESCE(has_active_sub, FALSE);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_premium_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium_user(UUID) TO anon;