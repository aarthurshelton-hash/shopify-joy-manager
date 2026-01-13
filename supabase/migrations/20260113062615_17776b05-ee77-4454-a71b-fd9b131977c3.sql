-- Enable realtime for additional tables (only if not already added)
DO $$
BEGIN
  -- Try to add order_financials
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_financials;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'order_financials already in publication';
  END;
  
  -- Try to add wallet_transactions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'wallet_transactions already in publication';
  END;
  
  -- Try to add withdrawal_requests
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'withdrawal_requests already in publication';
  END;
END $$;

-- Create a function to trigger CEO alerts when withdrawal requests are created
CREATE OR REPLACE FUNCTION public.notify_ceo_on_high_value_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger for high value withdrawals ($100+)
  IF NEW.amount_cents >= 10000 THEN
    -- Insert notification for all admins
    INSERT INTO subscription_notifications (user_id, notification_type, message)
    SELECT 
      ur.user_id,
      'ceo_withdrawal_alert',
      'New high-value withdrawal request: $' || (NEW.amount_cents / 100.0)::TEXT || ' - Review required'
    FROM user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for immediate CEO alerts on high-value withdrawals
DROP TRIGGER IF EXISTS trigger_ceo_withdrawal_alert ON withdrawal_requests;
CREATE TRIGGER trigger_ceo_withdrawal_alert
  AFTER INSERT ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_ceo_on_high_value_withdrawal();

-- Add index for faster pending withdrawal queries
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status_pending 
  ON withdrawal_requests(status) 
  WHERE status = 'pending';