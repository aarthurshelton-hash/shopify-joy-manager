# Memory: infrastructure/state-management/v6-81-retry-engine-timeouts-logic
Updated: now

The 'v6.81-RETRY' architecture treats engine timeouts as **resource issues** rather than game problems. Instead of permanently failing a game after a single timeout, the system retries up to 3 times with increasing patience (2s, 4s, 6s waits between retries). Analysis timeouts are extended to 40-50s per attempt. Only after ALL retry attempts are exhausted is a game marked as failed and added to `failedGameIds`. This dramatically reduces skipped games caused by transient Stockfish WASM stalls.

## Retry Logic
```typescript
const MAX_ENGINE_RETRIES = 3;
let engineRetries = 0;
let engineSucceeded = false;

while (engineRetries < MAX_ENGINE_RETRIES && !engineSucceeded) {
  const ANALYSIS_TIMEOUT = depth >= 40 ? 50000 : 40000;
  
  if (engineRetries > 0) {
    const retryWait = 2000 * engineRetries; // 2s, 4s, 6s
    await new Promise(r => setTimeout(r, retryWait));
    engine.stop();
    await engine.waitReady();
  }
  
  analysis = await Promise.race([
    engine.analyzePosition(fen, { depth }),
    new Promise<null>(r => setTimeout(() => r(null), ANALYSIS_TIMEOUT))
  ]);
  
  if (analysis) engineSucceeded = true;
  else engineRetries++;
}

// Only add to failedGameIds AFTER all retries exhausted
if (!engineSucceeded) {
  failedGameIds.add(rawGameId);
}
```

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
