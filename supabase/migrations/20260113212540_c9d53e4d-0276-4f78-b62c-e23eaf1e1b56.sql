-- Drop the existing check constraint and recreate with all valid event types
ALTER TABLE public.membership_funnel_events 
DROP CONSTRAINT IF EXISTS membership_funnel_events_event_type_check;

ALTER TABLE public.membership_funnel_events
ADD CONSTRAINT membership_funnel_events_event_type_check 
CHECK (event_type IN (
  'modal_view',
  'modal_dismiss', 
  'cta_click',
  'signup_started',
  'signup_completed',
  'free_account_created',
  'checkout_started',
  'subscription_active',
  'free_to_premium',
  'feature_hover'
));