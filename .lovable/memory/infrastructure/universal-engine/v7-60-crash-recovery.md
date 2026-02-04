# Memory: infrastructure/universal-engine/v7-60-crash-recovery
Updated: now

## v7.60 WASM Crash Recovery

### Issue Identified:
Manual benchmarks failing to start due to Stockfish WASM engine crashes. Runtime errors ("Out of bounds call_indirect", "Unreachable code should not be executed") leave the engine in a zombie state.

### Root Cause:
- Stockfish 17.1 WASM occasionally crashes with runtime errors
- The `onerror` handler only set `isReady = false` but didn't terminate the crashed worker
- Subsequent `waitReady()` calls hung indefinitely waiting for a dead worker
- No auto-recovery mechanism existed

### Fix Applied:
Updated `src/lib/chess/stockfishEngine.ts`:

1. **Crash Detection**: Added `crashCount`, `lastCrashTime`, `isRecovering` state
2. **Worker Termination**: New `terminateWorker()` method properly cleans up crashed workers
3. **Auto-Recovery**: `handleCrash()` automatically reinitializes engine after 500ms delay
4. **Crash Loop Prevention**: Max 3 crashes per 30 seconds before giving up
5. **Force Recovery**: New `forceRecovery()` method for manual benchmark start

Updated `src/hooks/useHybridBenchmark.ts`:
- Checks `engine.available` before starting
- Calls `engine.forceRecovery()` if engine crashed

### Key Logic:
```typescript
private handleCrash(reason: string): void {
  this.crashCount++;
  this.isReady = false;
  
  if (this.crashCount >= 3) {
    console.error('[Stockfish] Too many crashes, giving up');
    return;
  }
  
  // Auto-recover after 500ms
  setTimeout(() => this.initWorker(), 500);
}
```

### Result:
Manual benchmarks now properly recover from WASM crashes and can start even after engine errors.
