/**
 * Move Order Sensitivity - v7.53-ACCURACY
 * 
 * Analyzes move sequences for cascade effects (Grotthuss-style).
 * The order of moves matters as much as the moves themselves.
 */

export interface MoveSequence {
  moves: string[];
  timestamps?: number[];
  evaluations?: number[];
}

export interface SequencePattern {
  id: string;
  name: string;
  signature: string[];  // Move type sequence
  predictiveValue: number;
  typicalOutcome: 'white_advantage' | 'black_advantage' | 'dynamic_equality';
}

/**
 * Common strategic sequences that predict outcomes
 */
export const STRATEGIC_SEQUENCES: SequencePattern[] = [
  {
    id: 'cascade_attack',
    name: 'Cascade Attack',
    signature: ['check', 'capture', 'threat', 'capture'],
    predictiveValue: 0.85,
    typicalOutcome: 'white_advantage',
  },
  {
    id: 'prophylactic_chain',
    name: 'Prophylactic Chain',
    signature: ['quiet', 'quiet', 'quiet', 'threat'],
    predictiveValue: 0.75,
    typicalOutcome: 'dynamic_equality',
  },
  {
    id: 'pawn_storm',
    name: 'Pawn Storm Cascade',
    signature: ['pawn', 'pawn', 'pawn', 'piece'],
    predictiveValue: 0.7,
    typicalOutcome: 'white_advantage',
  },
  {
    id: 'exchange_sequence',
    name: 'Simplification Cascade',
    signature: ['capture', 'capture', 'capture', 'quiet'],
    predictiveValue: 0.65,
    typicalOutcome: 'dynamic_equality',
  },
  {
    id: 'pressure_buildup',
    name: 'Pressure Buildup',
    signature: ['piece', 'piece', 'threat', 'threat'],
    predictiveValue: 0.8,
    typicalOutcome: 'white_advantage',
  },
];

/**
 * Classify a move into a type for sequence analysis
 */
export function classifyMove(move: string, isCapture: boolean, isCheck: boolean): string {
  if (isCheck) return 'check';
  if (isCapture) return 'capture';
  
  // Pawn moves
  if (move.match(/^[a-h]/)) return 'pawn';
  
  // Check for threat indicators (simplified)
  if (move.includes('+') || move.includes('#')) return 'threat';
  
  // Piece development
  if (move.match(/^[NBRQK]/)) return 'piece';
  
  return 'quiet';
}

/**
 * Extract move type sequence from a list of moves
 */
export function extractMoveTypeSequence(
  moves: string[],
  captureFlags: boolean[],
  checkFlags: boolean[]
): string[] {
  return moves.map((move, i) => 
    classifyMove(move, captureFlags[i] || false, checkFlags[i] || false)
  );
}

/**
 * Calculate similarity between two sequences
 */
export function sequenceSimilarity(seq1: string[], seq2: string[]): number {
  const minLen = Math.min(seq1.length, seq2.length);
  if (minLen === 0) return 0;
  
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (seq1[i] === seq2[i]) matches++;
  }
  
  return matches / minLen;
}

/**
 * Find matching strategic sequences
 */
export function findMatchingSequences(
  moveSequence: string[],
  windowSize: number = 4
): { pattern: SequencePattern; similarity: number; position: number }[] {
  const matches: { pattern: SequencePattern; similarity: number; position: number }[] = [];
  
  // Slide window through the move sequence
  for (let i = 0; i <= moveSequence.length - windowSize; i++) {
    const window = moveSequence.slice(i, i + windowSize);
    
    for (const pattern of STRATEGIC_SEQUENCES) {
      const similarity = sequenceSimilarity(window, pattern.signature);
      if (similarity >= 0.5) {
        matches.push({ pattern, similarity, position: i });
      }
    }
  }
  
  // Sort by similarity
  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate momentum from move sequence
 * Captures vs quiet moves ratio indicates attacking intent
 */
export function calculateSequenceMomentum(moveTypes: string[]): number {
  if (moveTypes.length === 0) return 0;
  
  const weights: Record<string, number> = {
    check: 1.0,
    capture: 0.7,
    threat: 0.6,
    pawn: 0.3,
    piece: 0.2,
    quiet: -0.1,
  };
  
  let momentum = 0;
  let decayFactor = 1;
  
  // Recent moves weighted more heavily
  for (let i = moveTypes.length - 1; i >= 0; i--) {
    const moveType = moveTypes[i];
    momentum += (weights[moveType] || 0) * decayFactor;
    decayFactor *= 0.85; // Decay for older moves
  }
  
  // Normalize to -1 to 1
  return Math.max(-1, Math.min(1, momentum / moveTypes.length));
}

/**
 * Detect cascade patterns (Grotthuss-style propagation)
 */
export function detectCascade(
  evaluations: number[],
  threshold: number = 50
): { hasCascade: boolean; direction: 'positive' | 'negative' | 'none'; magnitude: number } {
  if (evaluations.length < 3) {
    return { hasCascade: false, direction: 'none', magnitude: 0 };
  }
  
  // Calculate consecutive changes
  const changes: number[] = [];
  for (let i = 1; i < evaluations.length; i++) {
    changes.push(evaluations[i] - evaluations[i - 1]);
  }
  
  // Look for consistent direction with increasing magnitude
  let positiveStreak = 0;
  let negativeStreak = 0;
  let maxMagnitude = 0;
  
  for (const change of changes) {
    if (change > threshold) {
      positiveStreak++;
      negativeStreak = 0;
      maxMagnitude = Math.max(maxMagnitude, change);
    } else if (change < -threshold) {
      negativeStreak++;
      positiveStreak = 0;
      maxMagnitude = Math.max(maxMagnitude, Math.abs(change));
    } else {
      positiveStreak = 0;
      negativeStreak = 0;
    }
  }
  
  if (positiveStreak >= 2) {
    return { hasCascade: true, direction: 'positive', magnitude: maxMagnitude };
  }
  if (negativeStreak >= 2) {
    return { hasCascade: true, direction: 'negative', magnitude: maxMagnitude };
  }
  
  return { hasCascade: false, direction: 'none', magnitude: 0 };
}
