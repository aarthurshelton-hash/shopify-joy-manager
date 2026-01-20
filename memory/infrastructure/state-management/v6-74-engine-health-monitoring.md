# Memory: infrastructure/state-management/v6-74-engine-health-monitoring
Updated: now

The 'v6.74-ENGINE-HEALTH' architecture adds engine health monitoring and auto-recovery to solve batch evaporation caused by a stalled Stockfish engine.

## Root Cause of Evaporation
After 3+ games fail with Stockfish timeouts or errors:
1. The engine may be in a bad state (WASM crashed, worker stalled)
2. ALL subsequent games will also fail analysis
3. `failedGameIds` grows rapidly, exhausting the queue
4. Next batch gets 0 valid games (all IDs already in failed set)

## v6.74 Fix: Engine Health Monitoring

### Consecutive Engine Failure Tracking
- New `consecutiveEngineFailures` counter (separate from `consecutiveSkips`)
- Incremented on Stockfish timeout OR Stockfish error
- Reset to 0 on successful analysis

### Auto-Recovery Logic
When `consecutiveEngineFailures >= 3`:
1. Log warning about engine reinitializing
2. Wait 2s for pending operations to clear
3. Call `engine.waitReady()` to reinitialize
4. If reinit succeeds: reset counter, continue processing
5. If reinit fails: save partial results, abort benchmark

## Key Code Pattern
```typescript
if (engineFailed) {
  consecutiveEngineFailures++;
  
  if (consecutiveEngineFailures >= 3) {
    console.warn(`[v6.74] ⚠️ Reinitializing engine...`);
    await new Promise(r => setTimeout(r, 2000));
    
    const reready = await engine.waitReady();
    if (reready) {
      consecutiveEngineFailures = 0;
    } else {
      break; // Abort if can't recover
    }
  }
  continue;
}

// Reset on success
consecutiveEngineFailures = 0;
```

## Console Trace Pattern
```
[v6.74] ⚠️ Stockfish timeout for li_XXXXXXXX
[v6.74] ⚠️ Stockfish timeout for li_YYYYYYYY
[v6.74] ⚠️ Stockfish timeout for li_ZZZZZZZZ
[v6.74] ⚠️ 3 consecutive engine failures - REINITIALIZING ENGINE
[v6.74] ✅ Engine re-initialized successfully
[v6.74] 🔮 PREDICTING #4/100: li_AAAAAAAA...
```

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
