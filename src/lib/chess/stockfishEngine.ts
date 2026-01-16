/**
 * Stockfish WASM Engine Integration
 * 
 * Provides real Stockfish analysis via WebAssembly running in a Web Worker.
 * Compatible with Stockfish 16 NNUE for grandmaster-level evaluation.
 * 
 * Features:
 * - Non-blocking analysis via Web Worker
 * - Real centipawn evaluation
 * - Principal Variation (PV) lines
 * - Multi-depth analysis
 * - Mate detection
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
          this.isReady = true;
          this.configure();
        } else if (type === 'uci') {
          this.handleUciMessage(data);
        } else if (type === 'error') {
          console.error('Stockfish error:', data);
        }
      };
      
      this.worker.onerror = (e) => {
        console.error('Stockfish worker error:', e);
        this.isReady = false;
      };
    } catch (error) {
      console.error('Failed to create Stockfish worker:', error);
    }
  }

  private configure(): void {
    // Optimized settings for faster web performance
    this.sendCommand('setoption', { name: 'Threads', value: 1 });
    this.sendCommand('setoption', { name: 'Hash', value: 64 }); // 64MB hash for better caching
    this.sendCommand('setoption', { name: 'MultiPV', value: 1 });
    this.sendCommand('setoption', { name: 'Slow Mover', value: 10 }); // Faster time management
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
   * Wait for engine to be ready
   */
  async waitReady(): Promise<boolean> {
    if (this.isReady) return true;
    
    return new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkReady);
          resolve(true);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        resolve(this.isReady);
      }, 10000);
    });
  }

  /**
   * Analyze a position by FEN
   * Optimized: uses EITHER depth OR movetime (not both) for faster analysis
   */
  async analyzePosition(
    fen: string, 
    options: { depth?: number; movetime?: number; nodes?: number } = {}
  ): Promise<PositionAnalysis> {
    await this.waitReady();
    
    this.currentDepth = 0;
    
    return new Promise((resolve) => {
      // Set position
      this.sendCommand('position', { fen });
      
      // Start analysis
      let lastEval: StockfishEvaluation | null = null;
      
      const onEval = (evaluation: StockfishEvaluation) => {
        lastEval = evaluation;
      };
      
      this.analysisCallbacks.push(onEval);
      
      // Set up bestmove callback
      this.pendingCallbacks.set('bestmove', ({ bestMove, ponder }) => {
        // Remove evaluation callback
        this.analysisCallbacks = this.analysisCallbacks.filter(cb => cb !== onEval);
        
        const chess = new Chess(fen);
        
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
          winProbability: this.cpToWinProbability(lastEval?.score || 0),
          isCheckmate: chess.isCheckmate(),
          isStalemate: chess.isStalemate(),
          isDraw: chess.isDraw(),
        });
      });
      
      // Use nodes for fastest consistent results, otherwise depth only (not both)
      if (options.nodes) {
        this.sendCommand('go', { nodes: options.nodes });
      } else if (options.movetime) {
        this.sendCommand('go', { movetime: options.movetime });
      } else {
        this.sendCommand('go', { depth: options.depth || 12 }); // Reduced default depth
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
      engineVersion: 'Stockfish 17 NNUE WASM',
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
      version: 'Stockfish 16 NNUE WASM',
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
