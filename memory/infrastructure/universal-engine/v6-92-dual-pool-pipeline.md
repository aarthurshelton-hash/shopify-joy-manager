# Memory: infrastructure/universal-engine/v6-92-dual-pool-pipeline

The benchmark pipeline (v6.92-DUAL-POOL) implements a dual-pool architecture for maximized throughput and data diversity:

## CLOUD-VOLUME Pool (100+ games/hour)
- Uses Lichess Cloud API for Stockfish evaluations
- Depth ~25-40 from cached cloud analysis
- Fast throughput: ~2 games/minute
- Best for: Volume, statistical significance

## LOCAL-DEEP Pool (5 games/hour)
- Uses local Stockfish 17 NNUE at maximum depth
- Depth 30+ with 100M+ nodes
- Slow but precise: ~12 minutes/game
- Best for: Edge cases, pattern discovery

## Key Features
- Cross-validates predictions across two Stockfish configurations
- Tracks `stockfish_mode` (cloud/local) in database for analysis
- Uses batch-based window isolation with prime offsets
- Fetches from both Lichess and Chess.com
- Automatic engine recovery on timeout/failure
- Saves predictions to `chess_prediction_attempts` with pool metadata

## Files
- `src/lib/chess/dualPoolPipeline.ts` - Core pipeline logic
- `src/hooks/useDualPoolPipeline.ts` - React hook for UI integration
- `src/lib/chess/cloudBenchmark.ts` - Updated to v6.92
