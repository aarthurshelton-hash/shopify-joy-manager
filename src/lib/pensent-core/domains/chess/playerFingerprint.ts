/**
 * Player Fingerprint System
 * 
 * Creates unique behavioral signatures WITHOUT storing personal data.
 * We only care about the PATTERN, not the person.
 * 
 * Each fingerprint captures:
 * - Playing style tendencies
 * - Blunder patterns under pressure
 * - Emotional response signatures
 * - Time management habits
 */

import { BlunderAnalysis, EmotionalMarker } from './blunderClassifier';
import { hashString } from '../../signature/fingerprintGenerator';

export interface PlayerFingerprint {
  // Anonymized identifier (hash of username or games)
  fingerprintId: string;
  
  // Style Profile
  styleProfile: {
    aggressiveness: number;      // 0 = defensive, 1 = attacking
    complexity: number;          // 0 = simple, 1 = complex positions
    speedPreference: number;     // 0 = slow, 1 = blitz
    riskTolerance: number;       // 0 = risk-averse, 1 = gambler
    endgameSkill: number;        // Relative to middlegame
  };
  
  // Pressure Response Profile
  pressureProfile: {
    tiltResistance: number;           // How well they handle setbacks
    timePressurePerformance: number;  // Performance under time trouble
    complicatingTendency: number;     // Do they complicate when losing?
    simplifyingTendency: number;      // Do they simplify when winning?
  };
  
  // Blunder Signature
  blunderSignature: {
    dominantBlunderType: 'computational' | 'human' | 'hybrid';
    commonEmotionalTriggers: EmotionalMarker['type'][];
    blunderPhaseDistribution: {
      opening: number;
      middlegame: number;
      endgame: number;
    };
    averageTiltThreshold: number;  // Blunders before performance drops
  };
  
  // Temporal Patterns
  temporalPatterns: {
    bestPerformancePhase: 'opening' | 'middlegame' | 'endgame';
    averageMoveTime: number;
    criticalMomentBehavior: 'calculate' | 'intuition' | 'panic';
    comebackProbability: number;  // Likelihood of recovery from losing
  };
  
  // Games analyzed
  gamesAnalyzed: number;
  confidence: number;
  lastUpdated: number;
}

export interface GameData {
  moves: Array<{
    san: string;
    timeSpent?: number;
    evalBefore?: number;
    evalAfter?: number;
  }>;
  result: 'white' | 'black' | 'draw';
  playerColor: 'white' | 'black';
  timeControl: string;
  opening?: string;
}

/**
 * Build or update a player fingerprint from game data
 */
export function buildFingerprint(
  games: GameData[],
  existingFingerprint?: PlayerFingerprint
): PlayerFingerprint {
  const gamesHash = hashString(games.map(g => g.moves.map(m => m.san).join('')).join('|'));
  
  // Analyze all games
  const analyses = games.map(analyzeGame);
  
  // Build style profile
  const styleProfile = calculateStyleProfile(analyses);
  
  // Build pressure profile
  const pressureProfile = calculatePressureProfile(analyses);
  
  // Build blunder signature
  const blunderSignature = calculateBlunderSignature(analyses);
  
  // Build temporal patterns
  const temporalPatterns = calculateTemporalPatterns(analyses);
  
  const newFingerprint: PlayerFingerprint = {
    fingerprintId: existingFingerprint?.fingerprintId || `FP-${gamesHash}`,
    styleProfile,
    pressureProfile,
    blunderSignature,
    temporalPatterns,
    gamesAnalyzed: (existingFingerprint?.gamesAnalyzed || 0) + games.length,
    confidence: Math.min(0.95, 0.3 + games.length * 0.05),
    lastUpdated: Date.now()
  };
  
  // Merge with existing if available
  if (existingFingerprint && existingFingerprint.gamesAnalyzed > 0) {
    return mergeFingerprints(existingFingerprint, newFingerprint);
  }
  
  return newFingerprint;
}

interface GameAnalysis {
  moveCount: number;
  blunders: number;
  averageMoveTime: number;
  timePressureMoves: number;
  complexMoves: number;
  aggressiveMoves: number;
  won: boolean;
  wasLosing: boolean;
  cameBack: boolean;
  phaseBlunders: { opening: number; middlegame: number; endgame: number };
  emotionalMarkers: EmotionalMarker['type'][];
}

function analyzeGame(game: GameData): GameAnalysis {
  const moveCount = game.moves.length;
  let blunders = 0;
  let timePressureMoves = 0;
  let complexMoves = 0;
  let aggressiveMoves = 0;
  let wasLosing = false;
  let cameBack = false;
  const emotionalMarkers: EmotionalMarker['type'][] = [];
  const phaseBlunders = { opening: 0, middlegame: 0, endgame: 0 };
  
  const playerMoves = game.moves.filter((_, i) => 
    game.playerColor === 'white' ? i % 2 === 0 : i % 2 === 1
  );
  
  const totalTime = playerMoves.reduce((sum, m) => sum + (m.timeSpent || 30), 0);
  const averageMoveTime = totalTime / playerMoves.length;
  
  playerMoves.forEach((move, idx) => {
    const evalDrop = (move.evalBefore || 0) - (move.evalAfter || 0);
    const moveNumber = Math.floor(idx / 2) + 1;
    const phase = moveNumber <= 10 ? 'opening' : moveNumber <= 30 ? 'middlegame' : 'endgame';
    
    // Detect blunders
    if (evalDrop > 1) {
      blunders++;
      phaseBlunders[phase]++;
    }
    
    // Time pressure detection
    if (move.timeSpent && move.timeSpent < averageMoveTime * 0.3) {
      timePressureMoves++;
    }
    
    // Complexity (long think times)
    if (move.timeSpent && move.timeSpent > averageMoveTime * 2) {
      complexMoves++;
    }
    
    // Track if player was losing
    if ((move.evalBefore || 0) < -2) {
      wasLosing = true;
    }
    
    // Check for comeback
    if (wasLosing && (move.evalAfter || 0) > 0) {
      cameBack = true;
    }
  });
  
  const won = (game.result === game.playerColor);
  
  return {
    moveCount,
    blunders,
    averageMoveTime,
    timePressureMoves,
    complexMoves,
    aggressiveMoves,
    won,
    wasLosing,
    cameBack,
    phaseBlunders,
    emotionalMarkers
  };
}

function calculateStyleProfile(analyses: GameAnalysis[]): PlayerFingerprint['styleProfile'] {
  const avgComplexMoves = analyses.reduce((sum, a) => sum + a.complexMoves / a.moveCount, 0) / analyses.length;
  const avgBlunders = analyses.reduce((sum, a) => sum + a.blunders, 0) / analyses.length;
  
  return {
    aggressiveness: Math.min(1, avgBlunders * 0.2), // More blunders = more aggressive attempts
    complexity: avgComplexMoves * 2,
    speedPreference: 1 - (analyses.reduce((sum, a) => sum + a.averageMoveTime, 0) / analyses.length / 60),
    riskTolerance: analyses.filter(a => a.wasLosing).length / analyses.length,
    endgameSkill: 1 - (analyses.reduce((sum, a) => sum + a.phaseBlunders.endgame, 0) / 
                       Math.max(1, analyses.reduce((sum, a) => sum + a.blunders, 0)))
  };
}

function calculatePressureProfile(analyses: GameAnalysis[]): PlayerFingerprint['pressureProfile'] {
  const comebacks = analyses.filter(a => a.cameBack).length;
  const losingGames = analyses.filter(a => a.wasLosing).length;
  
  return {
    tiltResistance: comebacks / Math.max(1, losingGames),
    timePressurePerformance: 1 - (analyses.reduce((sum, a) => sum + a.timePressureMoves / a.moveCount, 0) / analyses.length),
    complicatingTendency: 0.5, // Would need deeper analysis
    simplifyingTendency: 0.5
  };
}

function calculateBlunderSignature(analyses: GameAnalysis[]): PlayerFingerprint['blunderSignature'] {
  const totalBlunders = analyses.reduce((sum, a) => sum + a.blunders, 0);
  const opening = analyses.reduce((sum, a) => sum + a.phaseBlunders.opening, 0);
  const middlegame = analyses.reduce((sum, a) => sum + a.phaseBlunders.middlegame, 0);
  const endgame = analyses.reduce((sum, a) => sum + a.phaseBlunders.endgame, 0);
  
  return {
    dominantBlunderType: 'human', // Default, refined with more data
    commonEmotionalTriggers: ['frustration', 'impatience'],
    blunderPhaseDistribution: {
      opening: opening / Math.max(1, totalBlunders),
      middlegame: middlegame / Math.max(1, totalBlunders),
      endgame: endgame / Math.max(1, totalBlunders)
    },
    averageTiltThreshold: 2
  };
}

function calculateTemporalPatterns(analyses: GameAnalysis[]): PlayerFingerprint['temporalPatterns'] {
  const avgMoveTime = analyses.reduce((sum, a) => sum + a.averageMoveTime, 0) / analyses.length;
  const comebackRate = analyses.filter(a => a.cameBack && a.won).length / 
                       Math.max(1, analyses.filter(a => a.wasLosing).length);
  
  // Find best phase (lowest blunder rate)
  const phaseRates = {
    opening: analyses.reduce((sum, a) => sum + a.phaseBlunders.opening, 0),
    middlegame: analyses.reduce((sum, a) => sum + a.phaseBlunders.middlegame, 0),
    endgame: analyses.reduce((sum, a) => sum + a.phaseBlunders.endgame, 0)
  };
  
  const bestPhase = Object.entries(phaseRates)
    .sort((a, b) => a[1] - b[1])[0][0] as 'opening' | 'middlegame' | 'endgame';
  
  return {
    bestPerformancePhase: bestPhase,
    averageMoveTime: avgMoveTime,
    criticalMomentBehavior: avgMoveTime > 30 ? 'calculate' : 'intuition',
    comebackProbability: comebackRate
  };
}

function mergeFingerprints(
  existing: PlayerFingerprint,
  newData: PlayerFingerprint
): PlayerFingerprint {
  const totalGames = existing.gamesAnalyzed + newData.gamesAnalyzed;
  const existingWeight = existing.gamesAnalyzed / totalGames;
  const newWeight = newData.gamesAnalyzed / totalGames;
  
  const mergeValue = (a: number, b: number) => a * existingWeight + b * newWeight;
  
  return {
    fingerprintId: existing.fingerprintId,
    styleProfile: {
      aggressiveness: mergeValue(existing.styleProfile.aggressiveness, newData.styleProfile.aggressiveness),
      complexity: mergeValue(existing.styleProfile.complexity, newData.styleProfile.complexity),
      speedPreference: mergeValue(existing.styleProfile.speedPreference, newData.styleProfile.speedPreference),
      riskTolerance: mergeValue(existing.styleProfile.riskTolerance, newData.styleProfile.riskTolerance),
      endgameSkill: mergeValue(existing.styleProfile.endgameSkill, newData.styleProfile.endgameSkill)
    },
    pressureProfile: {
      tiltResistance: mergeValue(existing.pressureProfile.tiltResistance, newData.pressureProfile.tiltResistance),
      timePressurePerformance: mergeValue(existing.pressureProfile.timePressurePerformance, newData.pressureProfile.timePressurePerformance),
      complicatingTendency: mergeValue(existing.pressureProfile.complicatingTendency, newData.pressureProfile.complicatingTendency),
      simplifyingTendency: mergeValue(existing.pressureProfile.simplifyingTendency, newData.pressureProfile.simplifyingTendency)
    },
    blunderSignature: existing.blunderSignature, // Keep more established signature
    temporalPatterns: {
      ...existing.temporalPatterns,
      averageMoveTime: mergeValue(existing.temporalPatterns.averageMoveTime, newData.temporalPatterns.averageMoveTime),
      comebackProbability: mergeValue(existing.temporalPatterns.comebackProbability, newData.temporalPatterns.comebackProbability)
    },
    gamesAnalyzed: totalGames,
    confidence: Math.min(0.95, 0.3 + totalGames * 0.01),
    lastUpdated: Date.now()
  };
}

/**
 * Compare two fingerprints for similarity
 * Used to detect if two accounts might be the same player
 * or if market behavior matches a chess player profile
 */
export function compareFingerprintSimilarity(
  fp1: PlayerFingerprint,
  fp2: PlayerFingerprint
): { similarity: number; matchingTraits: string[] } {
  const matchingTraits: string[] = [];
  let totalSimilarity = 0;
  
  // Style comparison
  const styleDiff = Math.abs(fp1.styleProfile.aggressiveness - fp2.styleProfile.aggressiveness) +
                   Math.abs(fp1.styleProfile.riskTolerance - fp2.styleProfile.riskTolerance);
  if (styleDiff < 0.3) {
    matchingTraits.push('similar_risk_style');
    totalSimilarity += 0.25;
  }
  
  // Pressure response comparison
  const pressureDiff = Math.abs(fp1.pressureProfile.tiltResistance - fp2.pressureProfile.tiltResistance);
  if (pressureDiff < 0.2) {
    matchingTraits.push('similar_pressure_response');
    totalSimilarity += 0.25;
  }
  
  // Blunder pattern comparison
  if (fp1.blunderSignature.dominantBlunderType === fp2.blunderSignature.dominantBlunderType) {
    matchingTraits.push('same_blunder_type');
    totalSimilarity += 0.25;
  }
  
  // Temporal behavior comparison
  const timeDiff = Math.abs(fp1.temporalPatterns.averageMoveTime - fp2.temporalPatterns.averageMoveTime);
  if (timeDiff < 5) {
    matchingTraits.push('similar_time_management');
    totalSimilarity += 0.25;
  }
  
  return {
    similarity: Math.min(1, totalSimilarity),
    matchingTraits
  };
}
