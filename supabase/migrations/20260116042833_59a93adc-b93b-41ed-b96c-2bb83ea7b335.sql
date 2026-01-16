-- Add admin policy to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.user_wallets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));