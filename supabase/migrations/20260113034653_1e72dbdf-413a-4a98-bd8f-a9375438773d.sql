-- Fix security definer view by using security_invoker
DROP VIEW IF EXISTS public.scan_leaderboard;

CREATE VIEW public.scan_leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  sh.user_id,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT sh.visualization_id) FILTER (WHERE sh.matched = true) as unique_visions_scanned,
  COUNT(*) FILTER (WHERE sh.matched = true) as total_successful_scans,
  COUNT(*) as total_scans,
  MAX(sh.scanned_at) as last_scan_at
FROM public.scan_history sh
JOIN public.profiles p ON p.user_id = sh.user_id
WHERE sh.user_id IS NOT NULL
GROUP BY sh.user_id, p.display_name, p.avatar_url
ORDER BY unique_visions_scanned DESC, total_successful_scans DESC;