# Memory: infrastructure/state-management/v6-70-bulletproof-state-machine
Updated: now

The 'v6.70-BULLETPROOF' architecture replaces the fragile while-loop with a clean state machine that prevents game "evaporation."

## Root Cause of Evaporation
The original loop had:
1. Multiple interleaved fetch/process paths with `continue` statements
2. Index checks that could skip games after async fetch operations
3. State mutations during async operations causing stale references

## v6.70 Fix: Two-Phase State Machine

### PHASE 1: FETCH
- Only triggered when `queueAvailable === 0`
- Clear exponential backoff on empty fetches
- Explicit logging of queue state before/after fetch

### PHASE 2: PROCESS
- Pop game from queue ATOMICALLY (gameIndex++ happens immediately)
- All skips are logged with reason
- Consecutive skip safety valve triggers fresh fetch

## Key Architectural Changes
1. **Atomic queue pop**: `gameIndex++` happens BEFORE any `continue`
2. **Explicit phase separation**: No interleaving of fetch/process
3. **Clear logging**: Every game shows processing index and remaining count
4. **Simplified skip logic**: Only 3 valid skip reasons (no ID, failed, already predicted)

## Console Trace Pattern
```
[v6.70] 📥 FETCH PHASE: Queue empty...
[v6.70] 📥 Fetch result: +X games, queue now has Y available
[v6.70] 🎯 PROCESS: Game 1/Y (Y-1 remaining after this)
[v6.70] 🔮 PREDICTING #1/N: li_XXXXXXXX...
[v6.70] ✅ PREDICTION #1/N: li_XXXXXXXX
```

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
