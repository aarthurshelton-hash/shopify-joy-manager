
-- Fix remaining SECURITY DEFINER views

-- 1. Drop and recreate prediction_accuracy_stats
DROP VIEW IF EXISTS public.prediction_accuracy_stats CASCADE;
CREATE VIEW public.prediction_accuracy_stats 
WITH (security_invoker = true) AS
SELECT 
  archetype,
  time_horizon,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE was_correct = true) as correct_predictions,
  ROUND(
    (COUNT(*) FILTER (WHERE was_correct = true)::numeric / NULLIF(COUNT(*), 0) * 100),
    2
  ) as accuracy_percentage,
  AVG(predicted_confidence) as avg_confidence,
  AVG(accuracy_score) FILTER (WHERE accuracy_score IS NOT NULL) as avg_accuracy_score
FROM stock_predictions
WHERE resolved_at IS NOT NULL
GROUP BY archetype, time_horizon
ORDER BY accuracy_percentage DESC NULLS LAST;

-- 2. Drop and recreate user_prediction_performance  
DROP VIEW IF EXISTS public.user_prediction_performance CASCADE;
CREATE VIEW public.user_prediction_performance
WITH (security_invoker = true) AS
SELECT 
  user_id,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE was_correct = true) as correct_predictions,
  ROUND(
    (COUNT(*) FILTER (WHERE was_correct = true)::numeric / NULLIF(COUNT(*), 0) * 100),
    2
  ) as accuracy_percentage,
  AVG(predicted_confidence) as avg_confidence,
  MIN(created_at) as first_prediction_at,
  MAX(created_at) as last_prediction_at
FROM stock_predictions
WHERE resolved_at IS NOT NULL AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY accuracy_percentage DESC NULLS LAST;

-- Grant access
GRANT SELECT ON public.prediction_accuracy_stats TO authenticated;
GRANT SELECT ON public.user_prediction_performance TO authenticated;
