# Memory: infrastructure/universal-engine/v7-93-smooth-flow-rate-limiting
Updated: now

## v7.93-SMOOTH-FLOW: Adaptive Rate Limiting for Even Benchmark Flow

### Problem Identified
Benchmark was stopping intermittently due to:
1. Aggressive 100ms breathing pacer causing API bursts
2. Insufficient delays between player fetches (300-500ms)
3. Fast engine recovery (300ms) not giving enough stabilization time

### Solution: Adaptive Breathing Pacer

The `breathingPacer.ts` now implements **burst detection** with dynamic cooldowns:

```typescript
// Burst detection: max 10 operations per 5 seconds
const BURST_WINDOW_MS = 5000;
const MAX_OPS_PER_WINDOW = 10;

// Progressive backoff: 300ms -> 500ms -> 800ms -> 1200ms max
if (detectBurst()) {
  burstCounter++;
  adaptiveCooldown = Math.min(300 * (1 + burstCounter * 0.5), 1200);
}
```

### Key Changes

**breathingPacer.ts:**
- Base cooldown: 100ms → 300ms (adaptive up to 1200ms)
- Burst detection: Tracks operations per 5-second window
- Gradual cooldown decay when activity is low
- New `resetPacer()` function for manual reset

**dualPoolPipeline.ts:**
- Volume pool delay: 100ms → 400ms between games
- Deep pool delay: 200ms → 600ms between games
- Lichess fetch delay: 300ms → 500ms between players
- Chess.com fetch delay: 500ms → 700ms between players
- Error recovery delay: Added 1000ms after fetch failures
- Engine recovery delay: 300ms → 500ms with extra 1000ms on failure
- Targets: 200/hr → 120/hr (volume), 20/hr → 15/hr (deep) for sustainability

### Expected Behavior
- Smooth, continuous benchmark flow without interruptions
- Automatic backoff when detecting bursts
- Gradual recovery after cooldown periods
- No API rate limit errors from Lichess
