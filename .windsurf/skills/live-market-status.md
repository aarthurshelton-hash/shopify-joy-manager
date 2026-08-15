---
description: Get a quick live market ingestion and accuracy snapshot
tags: [market, status, supabase, metrics]
---

# Skill: Check Live Market Status

## Goal
Provide live-ingestion proof and a recent-window accuracy snapshot when markets reopen.

## Procedure

1. **Confirm live ingestion**
   - Query `market_prediction_attempts` for rows inserted in the last hour.
   - Report the count and the most recent `created_at` timestamp.

2. **Recent-window accuracy snapshot**
   - Full-table aggregates time out on Supabase. Use a **recent-window sample** instead.
   - Example filter: `created_at` within the last 7 days, `resolved_at` not null, limit to 5000 rows ordered by recency.
   - Compute `ep_accuracy` from `ep_correct` and `baseline_accuracy` from `baseline_correct` (or comparable columns).
   - Break down by `horizon` if sample size permits, but avoid over-segmenting small samples.

3. **What to report**
   - Count of new predictions in the last hour.
   - EP accuracy, baseline accuracy, and the improvement in percentage points.
   - Caveat that this is a recent-window sample, not a full-table aggregation.

## Code pattern
```js
const { data, error } = await supabase
  .from('market_prediction_attempts')
  .select('ep_correct, baseline_correct, horizon')
  .not('resolved_at', 'is', null)
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('created_at', { ascending: false })
  .limit(5000);
```

## Note
- `market_prediction_attempts` is the canonical table name (not `market_predictions`).
- If `ep_correct` is null for neutral rows, exclude or count them separately; do not treat null as wrong.
