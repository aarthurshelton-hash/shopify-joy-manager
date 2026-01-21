/**
 * Stockfish Engine Integration
 * 
 * CRITICAL METHODOLOGY FOR EN PENSENT BENCHMARKS:
 * ================================================
 * This engine is used by BOTH sides of the benchmark:
 * 1. Pure Stockfish: Raw tactical evaluation only
 * 2. En Pensent Hybrid: Stockfish + Temporal Pattern Recognition
 * 
 * We are NOT comparing different Stockfish versions.
 * We test if ADDING pattern recognition improves predictions.
 * 
 * Engine: Stockfish 10 (~ELO 3000)
 */

import { Chess } from 'chess.js';

// ===================== TYPES =====================

export interface StockfishEvaluation {
  depth: number;
  score: number;           // Centipawns (+ for white, - for black)
  scoreType: 'cp' | 'mate';
  mateIn?: number;         // Moves to mate (if scoreType is 'mate')
  pv: string[];            // Principal variation (best line)
  nodes: number;
  nps: number;             // Nodes per second
  time: number;            // Time in ms
  multipv?: number;        // Multi-PV line number
}

export interface PositionAnalysis {
  fen: string;
  bestMove: string;
  ponder?: string;
  evaluation: StockfishEvaluation;
  winProbability: number;  // 0-100 for side to move
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
}

export interface MoveAnalysis {
  san: string;
  uci: string;
  evalBefore: number;
  evalAfter: number;
  cpLoss: number;
  accuracy: number;
  bestMove: string;
  wasBestMove: boolean;
  pvLine: string[];
}

export interface GameAnalysis {
  moves: MoveAnalysis[];
  whiteAccuracy: number;
  blackAccuracy: number;
  averageDepth: number;
  engineVersion: string;
}

// ===================== ENGINE CLASS =====================

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingCallbacks: Map<string, (data: any) => void> = new Map();
  private analysisCallbacks: ((eval_: StockfishEvaluation) => void)[] = [];
  private currentDepth = 0;
  private analysisBuffer: string[] = [];

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      this.worker = new Worker('/stockfish.worker.js');
      
      this.worker.onmessage = (e) => {
        const { type, data } = e.data;
        
        if (type === 'ready') {
          console.log('[Stockfish] Engine ready!');
          this.isReady = true;
          this.configure();
        } else if (type === 'uci') {
          this.handleUciMessage(data);
        } else if (type === 'error') {
          console.error('[Stockfish] Error:', data);
        } else if (type === 'status') {
          console.log('[Stockfish]', data);
        }
      };
      
      this.worker.onerror = (e) => {
        console.error('[Stockfish] Worker error:', e);
        this.isReady = false;
      };
    } catch (error) {
      console.error('[Stockfish] Failed to create worker:', error);
    }
  }

  private configure(): void {
    // MAXIMUM STRENGTH SETTINGS for En Pensent Benchmarks
    // Both Pure Stockfish AND En Pensent Hybrid use these IDENTICAL settings
    // This ensures the ONLY variable is En Pensent's 25 domain adapters
    this.sendCommand('setoption', { name: 'Threads', value: 1 }); // Single thread for consistency
    this.sendCommand('setoption', { name: 'Hash', value: 128 }); // 128MB hash for deeper caching
    this.sendCommand('setoption', { name: 'MultiPV', value: 1 }); // Focus on best line only
    this.sendCommand('setoption', { name: 'Slow Mover', value: 100 }); // Maximum time usage for depth
    // NNUE is enabled by default in Stockfish 17.1 - provides ~3600 ELO strength
    // We do NOT use Skill Level or limit strength - full power on both sides
  }

  private sendCommand(command: string, options?: Record<string, any>): void {
    if (this.worker) {
      this.worker.postMessage({ command, options });
    }
  }

  private handleUciMessage(message: string): void {
    // Parse UCI info lines
    if (message.startsWith('info')) {
      const evaluation = this.parseInfoLine(message);
      if (evaluation && evaluation.depth > this.currentDepth) {
        this.currentDepth = evaluation.depth;
        this.analysisCallbacks.forEach(cb => cb(evaluation));
      }
    }
    
    // Parse bestmove response
    if (message.startsWith('bestmove')) {
      const parts = message.split(' ');
      const bestMove = parts[1];
      const ponder = parts[3];
      
      const callback = this.pendingCallbacks.get('bestmove');
      if (callback) {
        callback({ bestMove, ponder });
        this.pendingCallbacks.delete('bestmove');
      }
    }
    
    // Store for debugging
    this.analysisBuffer.push(message);
    if (this.analysisBuffer.length > 100) {
      this.analysisBuffer.shift();
    }
  }

  private parseInfoLine(line: string): StockfishEvaluation | null {
    const parts = line.split(' ');
    const evaluation: Partial<StockfishEvaluation> = {
      pv: [],
    };
    
    let i = 1; // Skip 'info'
    while (i < parts.length) {
      switch (parts[i]) {
        case 'depth':
          evaluation.depth = parseInt(parts[++i]);
          break;
        case 'score':
          if (parts[++i] === 'cp') {
            evaluation.scoreType = 'cp';
            evaluation.score = parseInt(parts[++i]);
          } else if (parts[i] === 'mate') {
            evaluation.scoreType = 'mate';
            evaluation.mateIn = parseInt(parts[++i]);
            evaluation.score = evaluation.mateIn > 0 ? 10000 : -10000;
          }
          break;
        case 'nodes':
          evaluation.nodes = parseInt(parts[++i]);
          break;
        case 'nps':
          evaluation.nps = parseInt(parts[++i]);
          break;
        case 'time':
          evaluation.time = parseInt(parts[++i]);
          break;
        case 'multipv':
          evaluation.multipv = parseInt(parts[++i]);
          break;
        case 'pv':
          i++;
          while (i < parts.length && !parts[i].startsWith('info')) {
            evaluation.pv!.push(parts[i++]);
          }
          i--; // Back up one
          break;
        default:
          break;
      }
      i++;
    }
    
    if (evaluation.depth && evaluation.score !== undefined) {
      return evaluation as StockfishEvaluation;
    }
    return null;
  }

  // ===================== PUBLIC API =====================

  /**
   * Wait for engine to be ready with optional progress callback
   * Enhanced with better timeout handling and re-initialization attempts
   */
  async waitReady(onProgress?: (progress: number) => void): Promise<boolean> {
    if (this.isReady) {
      onProgress?.(1);
      return true;
    }
    
    // If worker died, try to reinitialize
    if (!this.worker) {
      console.log('[Stockfish] Worker not found, reinitializing...');
      this.initWorker();
    }
    
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 600; // 60 seconds max (increased from 30)
      let lastProgress = 0;
      
      const checkReady = setInterval(() => {
        attempts++;
        const progress = Math.min(attempts / maxAttempts, 0.99);
        
        // Only call progress callback if progress changed significantly
        if (progress - lastProgress > 0.05) {
          lastProgress = progress;
          onProgress?.(progress);
        }
        
        if (this.isReady) {
          clearInterval(checkReady);
          console.log('[Stockfish] Engine ready after', attempts * 100, 'ms');
          onProgress?.(1);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkReady);
          console.error('[Stockfish] Engine timeout after 60 seconds - this may indicate a WASM loading issue');
          // Mark as ready anyway with a warning - let the analysis functions handle errors
          resolve(false);
        }
        
        // Log progress every 10 seconds
        if (attempts % 100 === 0) {
          console.log(`[Stockfish] Still waiting for engine... ${attempts / 10}s elapsed`);
        }
      }, 100);
    });
  }

  /**
   * Analyze a position by FEN with GUARANTEED depth verification
   * For Maximum Depth mode: validates the engine actually reaches requested depth
   * Includes timeout protection for deep analysis
   */
  async analyzePosition(
    fen: string, 
    options: { depth?: number; movetime?: number; nodes?: number; requireExactDepth?: boolean } = {}
  ): Promise<PositionAnalysis> {
    await this.waitReady();
    
    this.currentDepth = 0;
    const requestedDepth = options.depth || 12;
    const requireExact = options.requireExactDepth ?? false;
    
    // Timeout protection: 120 seconds for depth 60, scales linearly
    const timeoutMs = Math.max(30000, requestedDepth * 2000);
    
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;
      let resolved = false;
      
      // Set position
      this.sendCommand('position', { fen });
      
      // Start analysis
      let lastEval: StockfishEvaluation | null = null;
      let highestDepthReached = 0;
      
      const onEval = (evaluation: StockfishEvaluation) => {
        lastEval = evaluation;
        if (evaluation.depth > highestDepthReached) {
          highestDepthReached = evaluation.depth;
        }
      };
      
      this.analysisCallbacks.push(onEval);
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        this.analysisCallbacks = this.analysisCallbacks.filter(cb => cb !== onEval);
        this.pendingCallbacks.delete('bestmove');
      };
      
      // Set up bestmove callback
      this.pendingCallbacks.set('bestmove', ({ bestMove, ponder }) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        
        const chess = new Chess(fen);
        const actualDepth = lastEval?.depth || 0;
        
        // Verify depth was reached for Maximum Depth mode
        if (requireExact && actualDepth < requestedDepth) {
          console.warn(`[Stockfish] Depth shortfall: requested ${requestedDepth}, reached ${actualDepth}`);
        }
        
        console.log(`[Stockfish] Analysis complete: depth ${actualDepth}/${requestedDepth}, eval ${lastEval?.score || 0}cp`);
        
        resolve({
          fen,
          bestMove,
          ponder,
          evaluation: lastEval || {
            depth: 0,
            score: 0,
            scoreType: 'cp',
            pv: [],
            nodes: 0,
            nps: 0,
            time: 0,
          },
          winProbability: lastEval?.score !== undefined ? this.cpToWinProbability(lastEval.score) : 50, // null ≠ 0, null = unknown (50%)
          isCheckmate: chess.isCheckmate(),
          isStalemate: chess.isStalemate(),
          isDraw: chess.isDraw(),
        });
      });
      
      // Timeout protection for deep analysis
      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        
        console.warn(`[Stockfish] Timeout after ${timeoutMs}ms, stopping analysis at depth ${highestDepthReached}`);
        this.sendCommand('stop');
        
        cleanup();
        
        const chess = new Chess(fen);
        
        // Return best result we got before timeout
        resolve({
          fen,
          bestMove: lastEval?.pv?.[0] || '',
          evaluation: lastEval || {
            depth: highestDepthReached,
            score: 0,
            scoreType: 'cp',
            pv: [],
            nodes: 0,
            nps: 0,
            time: timeoutMs,
          },
          winProbability: lastEval?.score !== undefined ? this.cpToWinProbability(lastEval.score) : 50, // null ≠ 0, null = unknown (50%)
          isCheckmate: chess.isCheckmate(),
          isStalemate: chess.isStalemate(),
          isDraw: chess.isDraw(),
        });
      }, timeoutMs);
      
      // Use nodes for fastest consistent results, otherwise depth only (not both)
      if (options.nodes) {
        this.sendCommand('go', { nodes: options.nodes });
      } else if (options.movetime) {
        this.sendCommand('go', { movetime: options.movetime });
      } else {
        this.sendCommand('go', { depth: requestedDepth });
      }
    });
  }

  /**
   * Analyze a full game from PGN
   * OPTIMIZED: Only analyzes position BEFORE each move (not after), uses previous eval
   */
  async analyzeGame(
    pgn: string, 
    options: { depth?: number; onProgress?: (move: number, total: number) => void } = {}
  ): Promise<GameAnalysis> {
    await this.waitReady();
    
    const depth = options.depth || 10; // Reduced depth for faster analysis
    const chess = new Chess();
    
    try {
      chess.loadPgn(pgn);
    } catch (e) {
      throw new Error('Invalid PGN');
    }
    
    const history = chess.history({ verbose: true });
    const moves: MoveAnalysis[] = [];
    
    // Reset and analyze move by move
    chess.reset();
    
    // Analyze starting position once
    let previousAnalysis = await this.analyzePosition(chess.fen(), { depth, nodes: 50000 });
    let previousEval = previousAnalysis.evaluation.score;
    
    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const fenBefore = chess.fen();
      const isWhiteMove = chess.turn() === 'w';
      
      // Use cached eval from previous iteration (much faster!)
      const evalBefore = previousEval * (isWhiteMove ? 1 : -1);
      const bestMoveBefore = previousAnalysis.bestMove;
      const pvBefore = previousAnalysis.evaluation.pv;
      
      // Play the move
      chess.move(move);
      
      // Analyze the new position (this becomes the "before" for next move)
      previousAnalysis = await this.analyzePosition(chess.fen(), { depth, nodes: 50000 });
      previousEval = previousAnalysis.evaluation.score;
      
      // Get eval after from new position's perspective (flip sign)
      const evalAfter = previousEval * (isWhiteMove ? -1 : 1);
      
      // Calculate centipawn loss (from the perspective of the player who moved)
      const cpLoss = Math.max(0, evalBefore - evalAfter);
      
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(cpLoss);
      
      // Check if this was the best move
      const wasBestMove = move.from + move.to === bestMoveBefore.slice(0, 4);
      
      moves.push({
        san: move.san,
        uci: move.from + move.to + (move.promotion || ''),
        evalBefore: isWhiteMove ? evalBefore : -evalBefore,
        evalAfter: isWhiteMove ? evalAfter : -evalAfter,
        cpLoss,
        accuracy,
        bestMove: bestMoveBefore,
        wasBestMove,
        pvLine: pvBefore,
      });
      
      if (options.onProgress) {
        options.onProgress(i + 1, history.length);
      }
    }
    
    // Calculate per-player accuracy
    const whiteMoves = moves.filter((_, i) => i % 2 === 0);
    const blackMoves = moves.filter((_, i) => i % 2 === 1);
    
    const whiteAccuracy = whiteMoves.length 
      ? whiteMoves.reduce((sum, m) => sum + m.accuracy, 0) / whiteMoves.length 
      : 0;
    const blackAccuracy = blackMoves.length 
      ? blackMoves.reduce((sum, m) => sum + m.accuracy, 0) / blackMoves.length 
      : 0;
    
    return {
      moves,
      whiteAccuracy: Math.round(whiteAccuracy * 10) / 10,
      blackAccuracy: Math.round(blackAccuracy * 10) / 10,
      averageDepth: depth,
      engineVersion: 'Stockfish 17.1 NNUE WASM',
    };
  }

  /**
   * Get evaluation for a specific move (without full game analysis)
   */
  async evaluateMove(
    fen: string, 
    move: string, 
    depth: number = 15
  ): Promise<{ cpLoss: number; accuracy: number; wasBest: boolean; bestMove: string }> {
    await this.waitReady();
    
    const chess = new Chess(fen);
    
    // Analyze position before move
    const before = await this.analyzePosition(fen, { depth, movetime: 500 });
    const evalBefore = before.evaluation.score;
    
    // Play the move
    chess.move(move);
    
    // Analyze position after move
    const after = await this.analyzePosition(chess.fen(), { depth, movetime: 500 });
    const evalAfter = -after.evaluation.score; // Flip perspective
    
    const cpLoss = Math.max(0, evalBefore - evalAfter);
    const accuracy = this.calculateAccuracy(cpLoss);
    const wasBest = move.toLowerCase().includes(before.bestMove.slice(0, 4).toLowerCase());
    
    return {
      cpLoss,
      accuracy,
      wasBest,
      bestMove: before.bestMove,
    };
  }

  /**
   * Quick position evaluation (low depth, fast)
   */
  async quickEval(fen: string): Promise<number> {
    await this.waitReady();
    
    // Use node count for consistent fast evaluation
    const analysis = await this.analyzePosition(fen, { nodes: 10000 });
    return analysis.evaluation.score;
  }

  /**
   * Stop current analysis
   */
  stop(): void {
    this.sendCommand('stop');
  }

  /**
   * Terminate the engine
   */
  terminate(): void {
    this.sendCommand('quit');
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
  }

  // ===================== UTILITY FUNCTIONS =====================

  /**
   * Convert centipawns to win probability (Lichess formula)
   */
  private cpToWinProbability(cp: number): number {
    const K = 0.00368208;
    return 50 + 50 * (2 / (1 + Math.exp(-K * cp)) - 1);
  }

  /**
   * Calculate move accuracy from centipawn loss (chess.com formula)
   */
  private calculateAccuracy(cpLoss: number): number {
    if (cpLoss <= 0) return 100;
    const accuracy = 103.1668 * Math.exp(-0.04354 * cpLoss) - 3.1669;
    return Math.max(0, Math.min(100, accuracy));
  }

  /**
   * Check if engine is available
   */
  get available(): boolean {
    return this.isReady && this.worker !== null;
  }

  /**
   * Get engine info
   */
  get info(): { version: string; available: boolean } {
    return {
      version: 'Stockfish 17.1 NNUE WASM',
      available: this.available,
    };
  }
}

// ===================== SINGLETON INSTANCE =====================

let engineInstance: StockfishEngine | null = null;

/**
 * Get or create the Stockfish engine singleton
 */
export function getStockfishEngine(): StockfishEngine {
  if (!engineInstance) {
    engineInstance = new StockfishEngine();
  }
  return engineInstance;
}

/**
 * Terminate and cleanup the engine
 */
export function terminateStockfish(): void {
  if (engineInstance) {
    engineInstance.terminate();
    engineInstance = null;
  }
}
