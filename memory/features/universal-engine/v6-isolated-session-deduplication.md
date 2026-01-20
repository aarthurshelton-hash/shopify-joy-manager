# Memory: features/universal-engine/v6-session-fix-and-random-windows
Updated: now

The 'v6.24-SESSFIX' benchmark fixes a critical bug where ALL fetched games were being filtered as "session duplicates":

**Bug in v6.23**: Every game was added to `sessionSeenIds` at fetch time, then the duplicate check on line 548 would ALWAYS find them in the set!

**v6.24-SESSFIX Solution**:
1. **Renamed to `predictedIds`**: Tracks games we've SUCCESSFULLY PREDICTED this session (not just fetched)
2. **Tracking after prediction**: Games are only added to `predictedIds` AFTER the prediction is made (line 710)
3. **Truly random time windows**: Removed deterministic seeding - each window uses pure `Math.random()`
4. **Clean dedup logic**: Session check now only prevents re-predicting same game twice in one run

**Data Flow**:
- Fetch games → Add to queue (no session tracking here)
- Process each game: Skip if DB duplicate OR already predicted this session
- After successful prediction: `predictedIds.add(lichessId)`

This ensures maximum game absorption from each batch while preventing duplicate predictions.
