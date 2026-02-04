
-- Fix the broken system-heartbeat cron job (JSON syntax error with string concatenation)
-- Skip if pg_cron extension is not available
DO $$
BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pg_cron';
  IF NOT FOUND THEN
    RAISE NOTICE 'pg_cron extension not available, skipping cron job setup';
    RETURN;
  END IF;
  
  -- Unschedule if exists
  PERFORM cron.unschedule('system-heartbeat-pulse');
  
  -- Re-create with proper JSON (no dynamic timestamp in body to avoid syntax issues)
  PERFORM cron.schedule(
    'system-heartbeat-pulse',
    '*/5 * * * *',
    $CRON$
    SELECT net.http_post(
      url := 'https://aufycarwflhsdgszbnop.supabase.co/functions/v1/system-heartbeat',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZnljYXJ3Zmxoc2Rnc3pibm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODUwOTEsImV4cCI6MjA4MzU2MTA5MX0.uNxFLqJ3BGKkAj1pj77fxnCfDGTcdKFuCIF8HMPYiXw"}'::jsonb,
      body := '{"trigger": "cron"}'::jsonb
    ) AS request_id;
    $CRON$
  );
END $$;
