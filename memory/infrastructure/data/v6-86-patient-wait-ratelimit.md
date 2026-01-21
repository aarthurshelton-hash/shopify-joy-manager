# Memory: infrastructure/data/v6-86-patient-wait-ratelimit
Updated: now

The 'v6.86-PATIENT-WAIT' architecture fixes a critical issue where rate limits caused the fetcher to abandon all remaining players in a batch.

## Bug Identified
When hitting a Lichess API rate limit, the previous code would:
1. Set `serverRateLimited = true`
2. **BREAK** out of the player chunk loop
3. Return with only partial results
4. Lose all games from remaining players

This meant a single 429 response could waste 80% of a batch's potential yield.

## Fix Applied
Rate limits now trigger a **WAIT then RESUME** pattern:

```typescript
// BEFORE (BUG): Break and lose remaining fetches
if (serverRateLimited) {
  break; // ← All remaining players abandoned!
}

// AFTER (v6.86): Wait patiently, then continue
if (serverRateLimited && serverResetMs > 0) {
  console.warn(`[v6.86] Rate limited - WAITING ${waitSec}s then resuming`);
  await new Promise(r => setTimeout(r, serverResetMs + 2000)); // Wait + safety margin
  serverRateLimited = false; // Reset and continue
  serverResetMs = 0;
}
```

## Timing Adjustments
- Normal chunk delay: 4s (was 3s)
- Post-rate-limit chunk delay: 10s (was 8s)
- Backoff decay: 0.9x on success (was 0.8x)
- Minimum backoff: 2000ms (was 1000ms)

## Philosophy
Every game matters. Rate limits are temporary obstacles, not reasons to abandon work. Wait patiently, then resume - the pipeline should never voluntarily drop potential data.
