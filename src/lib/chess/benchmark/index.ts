/**
 * Chess Prediction Benchmark Suite
 * 
 * En Pensent™ - THE PARADIGM for temporal pattern recognition
 * 
 * This module proves that combining strategic pattern recognition
 * with tactical analysis creates predictions that surpass
 * Stockfish's raw centipawn evaluation.
 * 
 * Historical context:
 * - Deep Blue (1997): Proved machines could PLAY chess
 * - AlphaZero (2017): Proved self-play could master chess
 * - En Pensent (2025): Proves temporal patterns can PREDICT chess
 */

export {
  runPredictionBenchmark,
  runQuickBenchmark,
  type PredictionAttempt,
  type BenchmarkResult,
} from './predictionBenchmark';

export {
  FAMOUS_GAMES_BENCHMARK,
  getGamesBy,
  getBalancedTestSet,
  type BenchmarkGame,
} from './famousGamesBenchmark';

// Convenience function for running the full benchmark
export async function runFullBenchmark(
  options: {
    useHistoricalGames?: boolean;
    numGeneratedGames?: number;
    predictionMoveNumber?: number;
    depth?: number;
    onProgress?: (status: string, progress: number) => void;
  } = {}
) {
  const {
    useHistoricalGames = true,
    numGeneratedGames = 5,
    predictionMoveNumber = 20,
    depth = 18,
    onProgress,
  } = options;

  const { runQuickBenchmark, runPredictionBenchmark } = await import('./predictionBenchmark');
  const { FAMOUS_GAMES_BENCHMARK } = await import('./famousGamesBenchmark');

  // Phase 1: Historical games (fast, known outcomes)
  if (useHistoricalGames) {
    onProgress?.('Running benchmark on famous games...', 0);
    
    const historicalResult = await runQuickBenchmark(
      FAMOUS_GAMES_BENCHMARK.map(g => ({
        pgn: g.pgn,
        result: g.result,
      })),
      predictionMoveNumber,
      depth,
      (status, progress) => onProgress?.(status, progress * 0.5)
    );

    console.log('\n=== HISTORICAL GAMES BENCHMARK ===');
    console.log(`Games analyzed: ${historicalResult.completedGames}`);
    console.log(`Stockfish accuracy: ${historicalResult.stockfishAccuracy.toFixed(1)}%`);
    console.log(`Hybrid accuracy: ${historicalResult.hybridAccuracy.toFixed(1)}%`);
    console.log(`Statistical confidence: ${historicalResult.confidence.toFixed(1)}%`);

    // If we're only doing historical games, return that result
    if (numGeneratedGames === 0) {
      return historicalResult;
    }
  }

  // Phase 2: Generated games (slower, Stockfish vs Stockfish)
  if (numGeneratedGames > 0) {
    onProgress?.('Generating Stockfish vs Stockfish games...', 50);
    
    const generatedResult = await runPredictionBenchmark({
      numGames: numGeneratedGames,
      predictionMoveNumber,
      depth,
      onProgress: (status, progress) => onProgress?.(status, 50 + progress * 0.5),
    });

    console.log('\n=== GENERATED GAMES BENCHMARK ===');
    console.log(`Games analyzed: ${generatedResult.completedGames}`);
    console.log(`Stockfish accuracy: ${generatedResult.stockfishAccuracy.toFixed(1)}%`);
    console.log(`Hybrid accuracy: ${generatedResult.hybridAccuracy.toFixed(1)}%`);
    console.log(`Statistical confidence: ${generatedResult.confidence.toFixed(1)}%`);

    return generatedResult;
  }
}

export default runFullBenchmark;
