-- Fix function search paths
ALTER FUNCTION public.validate_wallet_balance() SET search_path TO 'public';
ALTER FUNCTION public.auto_expire_offers() SET search_path TO 'public';

-- The RLS policy warnings are for intentional public access (error reporting) - these are expected for this use case