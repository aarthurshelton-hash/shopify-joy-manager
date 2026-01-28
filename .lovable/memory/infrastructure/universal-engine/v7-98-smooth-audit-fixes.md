# Memory: infrastructure/universal-engine/v7-98-smooth-audit-fixes
Updated: now

The v7.98-SMOOTH-AUDIT update resolved critical benchmarking pipeline issues:

1. **Unique Constraint Fix**: Added `chess_prediction_attempts_game_id_unique` UNIQUE constraint on `game_id` column to support proper upsert operations. This fixes postgres errors `there is no unique or exclusion constraint matching the ON CONFLICT specification`.

2. **Version Sync**: Aligned version constants across all files to `7.98-SMOOTH-AUDIT` (dualPoolPipeline.ts, breathingPacer.ts).

3. **Time Window Randomization**: Changed from deterministic prime-based offsets to true randomization (`Math.random()`) for time window selection. This ensures batches don't repeatedly hit the same already-processed windows, maximizing fresh game yield.

4. **Breathing Pacer Optimization**: Reduced base cooldown from 300ms to 250ms for slightly faster throughput while maintaining rate limit safety.

These fixes ensure the benchmark pipeline:
- No longer throws duplicate key errors
- Finds fresh games consistently
- Processes predictions for both white and black wins without bias
