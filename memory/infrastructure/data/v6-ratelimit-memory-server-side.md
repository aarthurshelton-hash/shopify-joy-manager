# Memory: infrastructure/data/v6-ratelimit-memory-server-side
Updated: now

The 'v6.67-RATELIMIT-MEMORY' architecture adds server-side rate limit tracking to the 'lichess-games' Edge Function. When Lichess returns a 429, the function now:

1. **Records the cooldown**: Stores `rateLimitedUntil` timestamp in the Edge Function's global state
2. **Pre-emptive blocking**: Subsequent requests check `isRateLimited()` BEFORE making any API calls
3. **Returns early**: If still in cooldown, returns 429 with `resetInMs` telling client how long to wait

**Client-side changes** (multiSourceFetcher.ts):
- Parses `resetInMs` from 429 responses
- Sets `serverRateLimited` flag to prevent further requests in same batch
- Breaks out of player chunk loop when rate limited instead of continuing to spam

This ensures genuine cooldown compliance - the client stops making requests during the penalty period, then auto-resumes when the server's cooldown expires.
