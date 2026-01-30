/**
 * Game Analyzer Module
 * 
 * Analyzes individual chess games for fingerprint extraction.
 */

import { EmotionalMarker } from '../blunderClassifier';
import { GameData, GameAnalysis } from './types';

/**
 * Analyze a single game for fingerprint data extraction
 */
export function analyzeGame(game: GameData): GameAnalysis {
  const moveCount = game.moves.length;
  let blunders = 0;
  let timePressureMoves = 0;
  let complexMoves = 0;
  const aggressiveMoves = 0;
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
    const phase = getGamePhase(moveNumber);
    
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

/**
 * Determine game phase from move number
 */
function getGamePhase(moveNumber: number): 'opening' | 'middlegame' | 'endgame' {
  if (moveNumber <= 10) return 'opening';
  if (moveNumber <= 30) return 'middlegame';
  return 'endgame';
}
