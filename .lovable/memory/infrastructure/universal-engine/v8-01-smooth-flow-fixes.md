# Memory: infrastructure/universal-engine/v8-01-smooth-flow-fixes
Updated: now

## v8.01-SMOOTH: Database Race Condition Fixes

### Problem Identified
Postgres logs showed repeated `duplicate key value violates unique constraint "evolution_state_state_type_key"` errors. These were caused by:
1. **autoEvolutionEngine.ts**: `persistEvolutionState()` had a race condition where multiple concurrent calls could both see no existing record and try to insert
2. **benchmarkCoordinator.ts**: `setDatabaseLock()` upsert was failing due to constraint timing issues

### Solution: Mutex + Retry Logic

**autoEvolutionEngine.ts:**
```typescript
// Added mutex to prevent concurrent persistence
let persistenceMutex = false;

async function persistEvolutionState() {
  if (persistenceMutex) return;
  persistenceMutex = true;
  try {
    // Use upsert with onConflict instead of check-then-insert
    await supabase.from('evolution_state')
      .upsert(payload, { onConflict: 'state_type', ignoreDuplicates: false });
  } finally {
    persistenceMutex = false;
  }
}
```

**benchmarkCoordinator.ts:**
```typescript
// Added retry logic with exponential backoff
async function setDatabaseLock(locked: boolean): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    // First check for existing record, update by ID if exists
    // Only insert with upsert if no existing record
    // Retry on duplicate key errors
  }
}
```

### Additional Optimizations
- **breathingPacer.ts**: Reduced base cooldown from 250ms to 200ms for smoother flow
- Version synced to `8.01-SMOOTH` across all files

### Expected Behavior
- No more duplicate key errors in postgres logs
- Smooth, uninterrupted benchmark flow
- Maximum prediction throughput
