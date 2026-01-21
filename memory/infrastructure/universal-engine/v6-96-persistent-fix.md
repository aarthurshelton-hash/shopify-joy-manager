# Memory: infrastructure/universal-engine/v6-96-persistent-fix
Updated: 2026-01-21

## Problem Identified
Pipeline stopped running overnight because:
1. `startedRef` guard prevented restarts after page refresh
2. `setTimeout` timers don't persist across page reloads
3. No mechanism to detect/restart stalled engine
4. 8-second delay caused missed initialization on fast page loads

## v6.96-PERSISTENT Fixes
1. **Removed `delayMs`** - Immediate start, no delay
2. **Added visibility handler** - Restarts engine when tab becomes visible
3. **Added 5-min heartbeat** - Detects stalled engine and restarts
4. **Fixed `initRef` logic** - Allows restart after page reload while preventing double-init in strict mode
5. **Retry on failure** - If start fails, retries after 30s

## Evidence of Fix
- 9 predictions created in last hour (16:39-16:42 UTC)
- Pipeline actively generating data again
- Most recent prediction: 2026-01-21 16:42:30 UTC

## Files Changed
- `src/providers/AutoEvolutionProvider.tsx` - v6.96 rewrite
- `src/App.tsx` - Removed `delayMs` prop

## Attribution
Inventor: Alec Arthur Shelton
En Pensent™ - Patent Pending
