/**
 * En Pensent™ vs Stockfish 17 Benchmark (Lichess Cloud Edition)
 * 
 * Uses Lichess Cloud Evaluation API which runs Stockfish 17 NNUE
 * Reliable, no WASM issues, high-quality analysis
 */

import { Chess } from 'chess.js';
import { evaluatePosition, type PositionEvaluation } from './lichessCloudEval';
import { generateHybridPrediction } from './hybridPrediction';
import { extractColorFlowSignature } from './colorFlowAnalysis';

export interface PredictionAttempt {
  gameId: string;
  gameName: string;
  moveNumber: number;
  fen: string;
  pgn: string;
  
  // Stockfish's prediction (from Lichess Cloud API)
  stockfishEval: number;
  stockfishDepth: number;
  stockfishPrediction: 'white_wins' | 'black_wins' | 'draw';
  stockfishConfidence: number;
  
  // Hybrid system prediction
  hybridPrediction: 'white_wins' | 'black_wins' | 'draw';
  hybridConfidence: number;
  hybridArchetype: string;
  
  // Actual result
  actualResult: 'white_wins' | 'black_wins' | 'draw';
  
  // Scoring
  stockfishCorrect: boolean;
  hybridCorrect: boolean;
}

export interface BenchmarkResult {
  totalGames: number;
  completedGames: number;
  predictionPoints: PredictionAttempt[];
  
  stockfishAccuracy: number;
  hybridAccuracy: number;
  
  stockfishWins: number;
  hybridWins: number;
  bothCorrect: number;
  bothWrong: number;
  
  archetypePerformance: Record<string, { correct: number; total: number }>;
  
  confidence: number;
  pValue: number;
  
  startedAt: Date;
  completedAt?: Date;
}

// Convert Stockfish evaluation to prediction
function evalToPrediction(cp: number): {
  prediction: 'white_wins' | 'black_wins' | 'draw';
  confidence: number;
} {
  const winProbability = 1 / (1 + Math.exp(-cp / 200));
  const confidence = Math.abs(winProbability - 0.5) * 200;
  
  if (cp > 150) {
    return { prediction: 'white_wins', confidence: Math.min(100, confidence) };
  } else if (cp < -150) {
    return { prediction: 'black_wins', confidence: Math.min(100, confidence) };
  } else {
    return { prediction: 'draw', confidence: Math.max(20, 100 - confidence) };
  }
}

// Famous games for testing
export const FAMOUS_GAMES = [
  {
    name: 'Kasparov vs Topalov 1999',
    pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0',
    result: 'white_wins' as const,
  },
  {
    name: 'Morphy vs Duke of Brunswick 1858',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
    result: 'white_wins' as const,
  },
  {
    name: 'Deep Blue vs Kasparov G6 1997',
    pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4 1-0',
    result: 'white_wins' as const,
  },
  {
    name: 'Byrne vs Fischer 1956',
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Ra1# 0-1',
    result: 'black_wins' as const,
  },
  {
    name: 'Anderssen vs Kieseritzky 1851',
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0',
    result: 'white_wins' as const,
  },
  {
    name: 'Carlsen vs Anand WCC G6 2013',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. c3 O-O 6. O-O Re8 7. Re1 a6 8. Ba4 b5 9. Bb3 d6 10. Bg5 Be6 11. Nbd2 h6 12. Bh4 Bxb3 13. axb3 Nb8 14. h3 Nbd7 15. Nh2 Qe7 16. Ndf1 Bb6 17. Ne3 Qe6 18. b4 a5 19. bxa5 Bxa5 20. Nhg4 Bb6 21. Bxf6 Nxf6 22. Nxf6+ Qxf6 23. Qg4 Bxe3 24. fxe3 Qe6 25. Qxe6 Rxe6 26. Kf2 c5 27. Ke2 d5 28. Kd2 Ra3 29. exd5 Rd6 30. Kc2 Rxd5 31. Re2 Rd6 32. Ree1 Rc6 33. Ra5 Rb6 34. Ra7 f6 35. Re2 Rba6 36. Rxa6 Rxa6 37. Kd2 Ra4 38. Kc2 Ra1 39. Re1 Ra2+ 40. Kd1 Rxb2 41. Re2 Rb1+ 42. Kd2 b4 43. cxb4 cxb4 44. Re4 Rb2+ 45. Kc1 Rg2 46. d4 Rxg3 47. Rxe5 Kf7 48. d5 Rh3 49. Re3 Rh1+ 50. Kd2 Rh5 51. Rd3 g6 52. e4 Ke7 53. Ke3 f5 54. exf5 Rxf5 55. Kd4 Kd6 56. Rg3 h5 57. Ke4 Rf1 58. Rg5 Re1+ 59. Kd4 Re7 60. Rxh5 Rd7 61. Rg5 b3 62. Kc3 Kxd5 63. Rxg6 Kc5 64. Rg5+ Kc6 65. Kxb3 1-0',
    result: 'white_wins' as const,
  },
  {
    name: 'Capablanca vs Marshall 1918',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 Nf6 12. Re1 Bd6 13. h3 Ng4 14. Qf3 Qh4 15. d4 Nxf2 16. Re2 Bg4 17. hxg4 Bh2+ 18. Kf1 Bg3 19. Rxf2 Qh1+ 20. Ke2 Bxf2 21. Bd2 Bh4 22. Qh3 Rae8+ 23. Kd3 Qf1+ 24. Kc2 Bf2 25. Qf3 Qg1 26. Bd5 c5 27. dxc5 Bxc5 28. b4 Bd6 29. a4 a5 30. axb5 axb4 31. Ra6 bxc3 32. Nxc3 Bb4 33. b6 Bxc3 34. Bxc3 h6 35. b7 Re3 36. Bxf7+ 1-0',
    result: 'white_wins' as const,
  },
  {
    name: 'Karpov vs Kasparov WCC G16 1985',
    pgn: '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+ 0-1',
    result: 'black_wins' as const,
  },
];

// Normal CDF for p-value
function normalCdf(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1 / (1 + p * z);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1 + sign * y);
}

/**
 * Run benchmark using Lichess Cloud API
 */
export async function runCloudBenchmark(
  games: typeof FAMOUS_GAMES = FAMOUS_GAMES,
  predictionMoveNumber: number = 20,
  onProgress?: (status: string, progress: number, attempt?: PredictionAttempt) => void
): Promise<BenchmarkResult> {
  const result: BenchmarkResult = {
    totalGames: games.length,
    completedGames: 0,
    predictionPoints: [],
    stockfishAccuracy: 0,
    hybridAccuracy: 0,
    stockfishWins: 0,
    hybridWins: 0,
    bothCorrect: 0,
    bothWrong: 0,
    archetypePerformance: {},
    confidence: 0,
    pValue: 1,
    startedAt: new Date(),
  };

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const gameId = `cloud-${i}`;
    
    onProgress?.(`Analyzing: ${game.name}`, (i / games.length) * 100);
    
    try {
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      
      const history = chess.history();
      const movesToPlay = Math.min(predictionMoveNumber, history.length);
      
      chess.reset();
      for (let j = 0; j < movesToPlay; j++) {
        chess.move(history[j]);
      }
      
      const fen = chess.fen();
      const truncatedPgn = chess.pgn();
      
      // Get Stockfish 17 evaluation from Lichess
      onProgress?.(`[Stockfish 17] Evaluating ${game.name}...`, ((i + 0.3) / games.length) * 100);
      const cloudEval = await evaluatePosition(fen);
      
      let stockfishEval = 0;
      let stockfishDepth = 0;
      let stockfishResult = evalToPrediction(0);
      
      if (cloudEval) {
        stockfishEval = cloudEval.evaluation;
        stockfishDepth = cloudEval.depth;
        stockfishResult = evalToPrediction(stockfishEval);
      } else {
        // Position not in cloud database - use default
        console.log(`[CloudBenchmark] Position not in Lichess database for ${game.name}`);
      }
      
      // Get Hybrid prediction
      onProgress?.(`[En Pensent] Analyzing ${game.name}...`, ((i + 0.7) / games.length) * 100);
      const hybridResult = await generateHybridPrediction(truncatedPgn, { depth: 10 });
      
      const probs = hybridResult.trajectoryPrediction.outcomeProbabilities;
      const hybridPrediction = 
        probs.whiteWin > probs.blackWin && probs.whiteWin > probs.draw ? 'white_wins' :
        probs.blackWin > probs.draw ? 'black_wins' : 'draw';
      
      const attempt: PredictionAttempt = {
        gameId,
        gameName: game.name,
        moveNumber: movesToPlay,
        fen,
        pgn: truncatedPgn,
        stockfishEval,
        stockfishDepth,
        stockfishPrediction: stockfishResult.prediction,
        stockfishConfidence: stockfishResult.confidence,
        hybridPrediction: hybridPrediction as any,
        hybridConfidence: hybridResult.confidence.overall,
        hybridArchetype: hybridResult.strategicAnalysis.archetype,
        actualResult: game.result,
        stockfishCorrect: stockfishResult.prediction === game.result,
        hybridCorrect: hybridPrediction === game.result,
      };
      
      result.predictionPoints.push(attempt);
      result.completedGames++;
      
      // Update archetype stats
      if (!result.archetypePerformance[attempt.hybridArchetype]) {
        result.archetypePerformance[attempt.hybridArchetype] = { correct: 0, total: 0 };
      }
      result.archetypePerformance[attempt.hybridArchetype].total++;
      if (attempt.hybridCorrect) {
        result.archetypePerformance[attempt.hybridArchetype].correct++;
      }
      
      // Update comparison counts
      if (attempt.stockfishCorrect && attempt.hybridCorrect) {
        result.bothCorrect++;
      } else if (!attempt.stockfishCorrect && !attempt.hybridCorrect) {
        result.bothWrong++;
      } else if (attempt.hybridCorrect) {
        result.hybridWins++;
      } else {
        result.stockfishWins++;
      }
      
      // Report attempt
      onProgress?.(`Completed: ${game.name}`, ((i + 1) / games.length) * 100, attempt);
      
    } catch (error) {
      console.error(`Error analyzing ${game.name}:`, error);
    }
  }
  
  // Calculate final stats
  const sfCorrect = result.predictionPoints.filter(p => p.stockfishCorrect).length;
  const hybridCorrect = result.predictionPoints.filter(p => p.hybridCorrect).length;
  
  result.stockfishAccuracy = result.completedGames > 0 ? (sfCorrect / result.completedGames) * 100 : 0;
  result.hybridAccuracy = result.completedGames > 0 ? (hybridCorrect / result.completedGames) * 100 : 0;
  
  if (result.completedGames > 0) {
    const diff = Math.abs(hybridCorrect - sfCorrect);
    const n = result.completedGames;
    const variance = n * 0.5 * 0.5;
    const zScore = diff / Math.sqrt(variance);
    result.pValue = 2 * (1 - normalCdf(zScore));
    result.confidence = 100 * (1 - result.pValue);
  }
  
  result.completedAt = new Date();
  
  return result;
}

export default runCloudBenchmark;
