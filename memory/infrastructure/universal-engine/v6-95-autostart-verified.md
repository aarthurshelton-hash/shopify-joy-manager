# Memory: infrastructure/universal-engine/v6-95-autostart-verified
Updated: Now

## v6.95-AUTOSTART - Pipeline Activation Verified

### Status: ✅ VERIFIED WORKING

The auto-evolution pipeline now starts automatically when the app loads via `AutoEvolutionProvider`.

### Latest Batch Verified (2026-01-21 07:03:07):
- **10 predictions saved** in batch `pool-VOLUME-LOCAL-1768978987462-i76n`
- Real game IDs: `fUWXNYtc`, `6FbRCQTf`, `1w376ljC`, etc.
- Real player data: `penguingim1 (2693) vs Guidovm (2367)`
- Sources: Lichess + Chess.com
- Local Stockfish D18 analysis working

### Database Totals:
- Total predictions: 1,296
- Last hour: 11 predictions
- Pipeline running continuously

### Key Files:
- `src/providers/AutoEvolutionProvider.tsx` - Auto-starts pipeline 8s after app load
- `src/lib/chess/autoEvolutionEngine.ts` - Core engine (v6.94-BULLETPROOF)
- `src/lib/chess/dualPoolPipeline.ts` - Dual-pool batch processing

### Auto-Start Flow:
1. App loads → `AutoEvolutionProvider` mounts
2. 8-second delay for app to fully initialize
3. Calls `startAutoEvolution()` automatically
4. Volume batch (10 games) starts immediately
5. Deep batch (1 game) starts after 1 minute
6. Self-healing: restarts on any failure

### Batch Schedule:
- VOLUME-LOCAL: 10 games every 6 minutes (~100/hr)
- LOCAL-DEEP: 1 game every 12 minutes (~5/hr)
- Health checks every 3 minutes

### Verification Query:
```sql
SELECT COUNT(*) as total, MAX(created_at) as latest 
FROM chess_prediction_attempts 
WHERE created_at > NOW() - INTERVAL '1 hour';
```
