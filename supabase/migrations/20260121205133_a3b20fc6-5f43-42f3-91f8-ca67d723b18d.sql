
-- Fix the broken system-heartbeat cron job (JSON syntax error with string concatenation)
SELECT cron.unschedule('system-heartbeat-pulse');

-- Re-create with proper JSON (no dynamic timestamp in body to avoid syntax issues)
SELECT cron.schedule(
  'system-heartbeat-pulse',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aufycarwflhsdgszbnop.supabase.co/functions/v1/system-heartbeat',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZnljYXJ3Zmxoc2Rnc3pibm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODUwOTEsImV4cCI6MjA4MzU2MTA5MX0.uNxFLqJ3BGKkAj1pj77fxnCfDGTcdKFuCIF8HMPYiXw"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) AS request_id;
  $$
);
