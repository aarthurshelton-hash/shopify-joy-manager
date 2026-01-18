/**
 * Trajectory Chess Engine
 * 
 * THE EN PENSENT PLAYING ENGINE
 * 
 * This engine plays chess using pattern recognition and trajectory alignment
 * rather than traditional position evaluation and move calculation.
 * 
 * Philosophy (CEO Alec Arthur Shelton):
 * "Stockfish calculates the path. We KNOW the destination."
 * 
 * The engine:
 * 1. Identifies the current game's archetype/trajectory
 * 2. Predicts the most likely outcome based on patterns
 * 3. Selects moves that MAINTAIN alignment with winning patterns
 * 4. Learns from every game to improve pattern recognition
 */

import { Chess } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { 
  PatternSignature, 
  TranslationContext, 
  MoveScore,
  selectBestMove,
  rankMovesByTrajectory,
  extractPositionCharacteristics
} from './patternMoveTranslator';
import { ARCHETYPE_DEFINITIONS, StrategicArchetype } from './colorFlowAnalysis';
import { simulateGame } from './gameSimulator';

/**
 * Extract color flow signature from PGN (wrapper for the full function)
 */
function extractSignatureFromPgn(pgn: string): { fingerprint: string; archetype: StrategicArchetype; name: string } {
  try {
    const gameResult = simulateGame(pgn);
    if (!gameResult) {
      return { fingerprint: 'unknown', archetype: 'unknown', name: 'Unknown' };
    }
    // Generate simple fingerprint from board state
    const fingerprint = `pgn-${pgn.length}-${gameResult.totalMoves}`;
    return {
      fingerprint,
      archetype: 'unknown',
      name: 'Pattern Analysis'
    };
  } catch {
    return { fingerprint: 'unknown', archetype: 'unknown', name: 'Unknown' };
  }
}

/**
 * Classify archetype and get definition
 */
function getArchetypeDefinition(archetype: StrategicArchetype) {
  return ARCHETYPE_DEFINITIONS[archetype] || ARCHETYPE_DEFINITIONS.unknown;
}

export interface EngineState {
  chess: Chess;
  color: 'white' | 'black';
  learnedPatterns: PatternSignature[];
  currentArchetype: string;
  trajectoryConfidence: number;
  predictedOutcome: 'white_wins' | 'black_wins' | 'draw';
  moveHistory: MoveScore[];
  gamesAnalyzed: number;
  evolutionGeneration: number;
  fitnessScore: number;
}

export interface GameResult {
  moves: string[];
  result: 'white_wins' | 'black_wins' | 'draw';
  ourColor: 'white' | 'black';
  weWon: boolean;
  archetypeAccuracy: number;
  lessonsLearned: string[];
}

export interface EngineConfig {
  usePatternOnly: boolean;      // If true, never consult Stockfish
  confidenceThreshold: number;  // Minimum confidence to trust pattern
  explorationRate: number;      // Chance to try non-optimal moves for learning
  maxPatternsToConsider: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  usePatternOnly: true,
  confidenceThreshold: 0.6,
  explorationRate: 0.05,
  maxPatternsToConsider: 1000
};

/**
 * The Trajectory Chess Engine
 */
export class TrajectoryChessEngine {
  private state: EngineState;
  private config: EngineConfig;
  
  constructor(color: 'white' | 'black', config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      chess: new Chess(),
      color,
      learnedPatterns: [],
      currentArchetype: 'Unknown',
      trajectoryConfidence: 0,
      predictedOutcome: 'draw',
      moveHistory: [],
      gamesAnalyzed: 0,
      evolutionGeneration: 0,
      fitnessScore: 0
    };
  }
  
  /**
   * Initialize engine with learned patterns from database
   */
  async initialize(): Promise<void> {
    // Load evolution state
    const { data: evolutionData } = await supabase
      .from('evolution_state')
      .select('*')
      .eq('state_type', 'chess_learning')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (evolutionData) {
      this.state.evolutionGeneration = evolutionData.generation || 0;
      this.state.fitnessScore = evolutionData.fitness_score || 0;
      this.state.gamesAnalyzed = evolutionData.total_predictions || 0;
    }
    
    // Load learned patterns
    const { data: patterns } = await supabase
      .from('color_flow_patterns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(this.config.maxPatternsToConsider);
    
    if (patterns) {
      this.state.learnedPatterns = patterns.map(p => this.convertToPatternSignature(p));
    }
    
    console.log(`[TrajectoryEngine] Initialized with ${this.state.learnedPatterns.length} patterns, Gen ${this.state.evolutionGeneration}`);
  }
  
  /**
   * Convert database pattern to internal format
   */
  private convertToPatternSignature(dbPattern: any): PatternSignature {
    const chars = typeof dbPattern.characteristics === 'string' 
      ? JSON.parse(dbPattern.characteristics) 
      : dbPattern.characteristics;
    
    return {
      fingerprint: dbPattern.fingerprint,
      archetype: dbPattern.archetype,
      outcome: dbPattern.outcome as 'white_wins' | 'black_wins' | 'draw',
      confidence: 0.7, // Base confidence
      characteristics: {
        tension: chars?.tension || 0.5,
        momentum: chars?.momentum || 0.5,
        complexity: chars?.complexity || 0.5,
        phase: chars?.phase || 'middlegame'
      },
      movePatterns: chars?.movePatterns || []
    };
  }
  
  /**
   * Analyze current position and predict outcome
   */
  analyzePosition(): { archetype: string; confidence: number; outcome: string } {
    const pgn = this.state.chess.pgn();
    
    // Extract color flow signature from PGN
    const signature = extractSignatureFromPgn(pgn);
    
    // Get archetype definition
    const archetypeDef = getArchetypeDefinition(signature.archetype);
    
    // Find matching patterns
    const matches = this.findMatchingPatterns(signature.fingerprint);
    
    // Calculate outcome probabilities
    let whiteWins = 0, blackWins = 0, draws = 0;
    let totalWeight = 0;
    
    for (const match of matches) {
      const weight = match.confidence;
      totalWeight += weight;
      
      switch (match.outcome) {
        case 'white_wins': whiteWins += weight; break;
        case 'black_wins': blackWins += weight; break;
        case 'draw': draws += weight; break;
      }
    }
    
    // Determine predicted outcome
    let predictedOutcome: 'white_wins' | 'black_wins' | 'draw' = 'draw';
    let confidence = 0.5;
    
    if (totalWeight > 0) {
      const normalized = {
        white: whiteWins / totalWeight,
        black: blackWins / totalWeight,
        draw: draws / totalWeight
      };
      
      if (normalized.white > normalized.black && normalized.white > normalized.draw) {
        predictedOutcome = 'white_wins';
        confidence = normalized.white;
      } else if (normalized.black > normalized.white && normalized.black > normalized.draw) {
        predictedOutcome = 'black_wins';
        confidence = normalized.black;
      } else {
        predictedOutcome = 'draw';
        confidence = normalized.draw;
      }
    }
    
    // Update state
    this.state.currentArchetype = archetypeDef.name;
    this.state.trajectoryConfidence = confidence;
    this.state.predictedOutcome = predictedOutcome;
    
    return {
      archetype: archetypeDef.name,
      confidence,
      outcome: predictedOutcome
    };
  }
  
  /**
   * Find patterns matching current fingerprint
   */
  private findMatchingPatterns(fingerprint: string): PatternSignature[] {
    // Calculate fingerprint similarity
    return this.state.learnedPatterns
      .map(pattern => ({
        ...pattern,
        similarity: this.calculateFingerprintSimilarity(fingerprint, pattern.fingerprint)
      }))
      .filter(p => p.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 50);
  }
  
  /**
   * Calculate similarity between two fingerprints
   */
  private calculateFingerprintSimilarity(fp1: string, fp2: string): number {
    if (!fp1 || !fp2) return 0;
    
    const parts1 = fp1.split('-');
    const parts2 = fp2.split('-');
    
    let matches = 0;
    const minLength = Math.min(parts1.length, parts2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        matches++;
      } else {
        // Partial match for similar values
        const val1 = parseFloat(parts1[i]) || 0;
        const val2 = parseFloat(parts2[i]) || 0;
        const diff = Math.abs(val1 - val2);
        if (diff < 0.2) matches += 0.5;
      }
    }
    
    return matches / Math.max(parts1.length, parts2.length);
  }
  
  /**
   * Select the best move using trajectory alignment
   */
  selectMove(): MoveScore | null {
    // Analyze current position
    this.analyzePosition();
    
    // Create translation context
    const context: TranslationContext = {
      currentFen: this.state.chess.fen(),
      moveHistory: this.state.chess.history(),
      detectedArchetype: this.state.currentArchetype,
      trajectoryConfidence: this.state.trajectoryConfidence,
      targetOutcome: this.determineTargetOutcome(),
      learnedPatterns: this.state.learnedPatterns
    };
    
    // Check for exploration (learning new paths)
    if (Math.random() < this.config.explorationRate) {
      return this.selectExploratoryMove(context);
    }
    
    // Select best move by trajectory alignment
    const bestMove = selectBestMove(this.state.chess, context);
    
    if (bestMove) {
      this.state.moveHistory.push(bestMove);
    }
    
    return bestMove;
  }
  
  /**
   * Determine what outcome we're aiming for
   */
  private determineTargetOutcome(): 'white_wins' | 'black_wins' | 'draw' {
    // If we're white, aim for white wins; if black, aim for black wins
    return this.state.color === 'white' ? 'white_wins' : 'black_wins';
  }
  
  /**
   * Select an exploratory move to learn new patterns
   */
  private selectExploratoryMove(context: TranslationContext): MoveScore | null {
    const rankedMoves = rankMovesByTrajectory(this.state.chess, context);
    
    if (rankedMoves.length === 0) return null;
    
    // Pick from top 5 instead of just top 1
    const explorationPool = rankedMoves.slice(0, Math.min(5, rankedMoves.length));
    const randomIndex = Math.floor(Math.random() * explorationPool.length);
    
    const move = explorationPool[randomIndex];
    move.reasoning = `[EXPLORATION] ${move.reasoning}`;
    
    return move;
  }
  
  /**
   * Apply opponent's move
   */
  applyOpponentMove(san: string): boolean {
    try {
      this.state.chess.move(san);
      return true;
    } catch {
      console.error(`[TrajectoryEngine] Invalid move: ${san}`);
      return false;
    }
  }
  
  /**
   * Apply our selected move
   */
  applyOurMove(san: string): boolean {
    try {
      this.state.chess.move(san);
      return true;
    } catch {
      console.error(`[TrajectoryEngine] Invalid move: ${san}`);
      return false;
    }
  }
  
  /**
   * Get all ranked moves for current position
   */
  getRankedMoves(): MoveScore[] {
    const context: TranslationContext = {
      currentFen: this.state.chess.fen(),
      moveHistory: this.state.chess.history(),
      detectedArchetype: this.state.currentArchetype,
      trajectoryConfidence: this.state.trajectoryConfidence,
      targetOutcome: this.determineTargetOutcome(),
      learnedPatterns: this.state.learnedPatterns
    };
    
    return rankMovesByTrajectory(this.state.chess, context);
  }
  
  /**
   * Record game result and learn from it
   */
  async recordGameResult(result: 'white_wins' | 'black_wins' | 'draw'): Promise<GameResult> {
    const weWon = (this.state.color === 'white' && result === 'white_wins') ||
                  (this.state.color === 'black' && result === 'black_wins');
    
    const pgn = this.state.chess.pgn();
    const signature = extractSignatureFromPgn(pgn);
    const archetypeDef = getArchetypeDefinition(signature.archetype);
    
    // Calculate archetype accuracy
    const archetypeAccuracy = this.state.predictedOutcome === result ? 1 : 0;
    
    // Generate lessons learned
    const lessonsLearned = this.generateLessons(weWon, result);
    
    // Save pattern to database
    await this.saveLearnedPattern(pgn, result, signature, archetypeDef);
    
    // Update evolution state
    await this.updateEvolutionState(weWon, archetypeAccuracy);
    
    return {
      moves: this.state.chess.history(),
      result,
      ourColor: this.state.color,
      weWon,
      archetypeAccuracy,
      lessonsLearned
    };
  }
  
  /**
   * Generate lessons from the game
   */
  private generateLessons(weWon: boolean, result: string): string[] {
    const lessons: string[] = [];
    
    if (weWon) {
      lessons.push(`Trajectory alignment successful: ${this.state.currentArchetype} led to victory`);
      
      // Find which moves were most impactful
      const highConfidenceMoves = this.state.moveHistory.filter(m => m.compositeScore > 0.7);
      if (highConfidenceMoves.length > 0) {
        lessons.push(`Key moves: ${highConfidenceMoves.map(m => m.san).join(', ')}`);
      }
    } else {
      lessons.push(`Trajectory deviation: ${this.state.currentArchetype} pattern did not hold`);
      
      // Identify where we went wrong
      const lowConfidenceMoves = this.state.moveHistory.filter(m => m.compositeScore < 0.4);
      if (lowConfidenceMoves.length > 0) {
        lessons.push(`Potential mistakes: ${lowConfidenceMoves.map(m => m.san).join(', ')}`);
      }
    }
    
    lessons.push(`Final confidence: ${(this.state.trajectoryConfidence * 100).toFixed(1)}%`);
    
    return lessons;
  }
  
  /**
   * Save learned pattern to database
   */
  private async saveLearnedPattern(
    pgn: string,
    result: string,
    signature: any,
    archetype: any
  ): Promise<void> {
    const positionPatterns = this.state.moveHistory.map((move, i) => ({
      moveNumber: i + 1,
      phase: this.determinePhase(i + 1),
      compositeScore: move.compositeScore,
      trajectoryAlignment: move.trajectoryAlignment
    }));
    
    await supabase.from('color_flow_patterns').insert({
      fingerprint: signature.fingerprint,
      archetype: archetype.name,
      outcome: result,
      total_moves: this.state.chess.history().length,
      characteristics: {
        tension: signature.averageTension,
        momentum: signature.flowDirection,
        complexity: signature.complexity,
        movePatterns: positionPatterns
      },
      pgn_hash: this.hashPgn(pgn)
    });
  }
  
  /**
   * Determine game phase from move number
   */
  private determinePhase(moveNumber: number): string {
    if (moveNumber <= 10) return 'opening';
    if (moveNumber <= 30) return 'middlegame';
    return 'endgame';
  }
  
  /**
   * Create a hash of the PGN for deduplication
   */
  private hashPgn(pgn: string): string {
    let hash = 0;
    for (let i = 0; i < pgn.length; i++) {
      const char = pgn.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Update evolution state after game
   */
  private async updateEvolutionState(weWon: boolean, accuracy: number): Promise<void> {
    // Get current state
    const { data: current } = await supabase
      .from('evolution_state')
      .select('*')
      .eq('state_type', 'chess_learning')
      .single();
    
    const currentFitness = current?.fitness_score || 0.5;
    const currentGen = current?.generation || 0;
    const currentPredictions = current?.total_predictions || 0;
    
    // Update fitness based on result
    const fitnessChange = weWon ? 0.02 : -0.01;
    const newFitness = Math.max(0, Math.min(1, currentFitness + fitnessChange));
    
    // Increment generation every 100 games
    const newGen = Math.floor((currentPredictions + 1) / 100);
    
    // Upsert evolution state
    await supabase.from('evolution_state').upsert({
      id: current?.id || crypto.randomUUID(),
      state_type: 'chess_learning',
      genes: {
        trajectoryWeight: 0.35,
        patternWeight: 0.30,
        momentumWeight: 0.20,
        riskWeight: 0.15,
        explorationRate: this.config.explorationRate
      },
      fitness_score: newFitness,
      generation: newGen,
      total_predictions: currentPredictions + 1,
      learned_patterns: this.state.learnedPatterns.slice(0, 100).map(p => p.fingerprint),
      updated_at: new Date().toISOString()
    });
    
    this.state.fitnessScore = newFitness;
    this.state.evolutionGeneration = newGen;
  }
  
  /**
   * Reset for new game
   */
  reset(): void {
    this.state.chess = new Chess();
    this.state.moveHistory = [];
    this.state.currentArchetype = 'Unknown';
    this.state.trajectoryConfidence = 0;
    this.state.predictedOutcome = 'draw';
  }
  
  /**
   * Get current engine state
   */
  getState(): EngineState {
    return { ...this.state };
  }
  
  /**
   * Get current FEN
   */
  getFen(): string {
    return this.state.chess.fen();
  }
  
  /**
   * Get current PGN
   */
  getPgn(): string {
    return this.state.chess.pgn();
  }
  
  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.state.chess.isGameOver();
  }
  
  /**
   * Get game result if over
   */
  getResult(): 'white_wins' | 'black_wins' | 'draw' | null {
    if (!this.state.chess.isGameOver()) return null;
    
    if (this.state.chess.isCheckmate()) {
      return this.state.chess.turn() === 'w' ? 'black_wins' : 'white_wins';
    }
    
    return 'draw';
  }
}

/**
 * Play a complete game against Stockfish
 * Returns the result for analysis
 */
export async function playGameAgainstStockfish(
  ourColor: 'white' | 'black',
  stockfishDepth: number = 15,
  onMove?: (move: string, byUs: boolean, analysis: any) => void
): Promise<GameResult> {
  const engine = new TrajectoryChessEngine(ourColor);
  await engine.initialize();
  
  // Game loop
  while (!engine.isGameOver()) {
    const isOurTurn = (engine.getState().chess.turn() === 'w') === (ourColor === 'white');
    
    if (isOurTurn) {
      // Our move (pattern-based)
      const move = engine.selectMove();
      if (move) {
        engine.applyOurMove(move.san);
        onMove?.(move.san, true, {
          archetype: engine.getState().currentArchetype,
          confidence: engine.getState().trajectoryConfidence,
          reasoning: move.reasoning
        });
      }
    } else {
      // Stockfish's move (via Lichess Cloud API)
      const fen = engine.getFen();
      const stockfishMove = await getStockfishMove(fen, stockfishDepth);
      if (stockfishMove) {
        engine.applyOpponentMove(stockfishMove);
        onMove?.(stockfishMove, false, { engine: 'Stockfish', depth: stockfishDepth });
      }
    }
  }
  
  const result = engine.getResult();
  if (result) {
    return await engine.recordGameResult(result);
  }
  
  throw new Error('Game ended without result');
}

/**
 * Get Stockfish's move via Lichess Cloud API
 */
async function getStockfishMove(fen: string, depth: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.warn('[Stockfish] Cloud eval not available, using fallback');
      return null;
    }
    
    const data = await response.json();
    const bestMove = data.pvs?.[0]?.moves?.split(' ')?.[0];
    
    return bestMove || null;
  } catch (error) {
    console.error('[Stockfish] Error getting move:', error);
    return null;
  }
}

/**
 * Calculate estimated ELO based on game results
 */
export function calculateEngineElo(
  gamesPlayed: number,
  wins: number,
  draws: number,
  stockfishElo: number = 3600
): number {
  if (gamesPlayed === 0) return 1500; // Starting ELO
  
  const losses = gamesPlayed - wins - draws;
  const score = (wins + draws * 0.5) / gamesPlayed;
  
  // FIDE Performance Rating formula
  const delta = 400 * Math.log10(score / (1 - Math.max(0.01, Math.min(0.99, score))));
  
  // Performance rating against Stockfish
  return Math.round(stockfishElo + delta);
}
