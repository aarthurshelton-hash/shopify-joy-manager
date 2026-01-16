/**
 * Signature Extraction for Chess Games
 * Extracted from archetypeAnalyzer.ts for modularity
 */

import type { TemporalSignature, QuadrantProfile, TemporalFlow, CriticalMoment } from '@/lib/pensent-core/types/core';

/**
 * Convert a square string (e.g., "e4") to quadrant region
 */
export function squareToQuadrant(square: string): 'q1' | 'q2' | 'q3' | 'q4' {
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(square[1]) - 1; // 1=0, 8=7
  
  const isKingside = file >= 4;
  const isWhiteSide = rank < 4;
  
  if (isKingside && !isWhiteSide) return 'q1'; // Top-right
  if (!isKingside && !isWhiteSide) return 'q2'; // Top-left
  if (!isKingside && isWhiteSide) return 'q3'; // Bottom-left
  return 'q4'; // Bottom-right (kingside white)
}

/**
 * Calculate quadrant profile from move destinations
 */
export function calculateQuadrantProfile(
  moveHistory: Array<{ to: string }>
): QuadrantProfile {
  const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
  
  for (const move of moveHistory) {
    const quad = squareToQuadrant(move.to);
    counts[quad]++;
  }
  
  const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
  
  return {
    q1: counts.q1 / total,
    q2: counts.q2 / total,
    q3: counts.q3 / total,
    q4: counts.q4 / total
  };
}

/**
 * Calculate temporal flow based on game phases
 */
export function calculateTemporalFlow(
  moveHistory: Array<{ san: string }>,
  totalMoves: number
): TemporalFlow {
  const openingMoves = moveHistory.slice(0, Math.min(10, totalMoves));
  const middleMoves = moveHistory.slice(10, Math.min(30, totalMoves));
  const endMoves = moveHistory.slice(30);
  
  return {
    opening: openingMoves.length / 10,
    middle: middleMoves.length / 20,
    ending: endMoves.length / Math.max(1, totalMoves - 30),
    trend: totalMoves > 40 ? 'stable' : totalMoves > 25 ? 'accelerating' : 'volatile',
    momentum: (endMoves.length - openingMoves.length) / Math.max(1, totalMoves) * 2
  };
}

/**
 * Detect critical moments (captures, checks, etc.)
 */
export function detectCriticalMoments(
  moveHistory: Array<{ san: string }>
): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  
  for (let i = 0; i < moveHistory.length; i++) {
    const move = moveHistory[i];
    if (move.san.includes('x') || move.san.includes('+') || move.san.includes('#')) {
      moments.push({
        index: i,
        type: move.san.includes('#') ? 'checkmate' : move.san.includes('+') ? 'check' : 'capture',
        severity: move.san.includes('#') ? 1 : move.san.includes('+') ? 0.7 : 0.4,
        description: `Move ${i + 1}: ${move.san}`
      });
    }
  }
  
  return moments.slice(0, 10);
}

/**
 * Generate a unique fingerprint for a signature
 */
export function generateFingerprint(
  totalMoves: number,
  intensity: number,
  quadrantProfile: QuadrantProfile
): string {
  const fingerprintData = `${totalMoves}-${intensity.toFixed(2)}-${Object.values(quadrantProfile).map(v => v.toFixed(2)).join('')}`;
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    hash = ((hash << 5) - hash) + fingerprintData.charCodeAt(i);
    hash = hash & hash;
  }
  return `ep-${Math.abs(hash).toString(36)}`;
}

/**
 * Extract temporal signature from chess move history
 */
export function extractChessSignature(
  moveHistory: Array<{ from: string; to: string; san: string }>,
  _finalFen: string
): TemporalSignature {
  const totalMoves = moveHistory.length;
  
  const quadrantProfile = calculateQuadrantProfile(moveHistory);
  const temporalFlow = calculateTemporalFlow(moveHistory, totalMoves);
  const criticalMoments = detectCriticalMoments(moveHistory);
  
  // Calculate intensity based on captures and checks
  const intensity = Math.min(1, criticalMoments.length / (totalMoves * 0.3));
  
  // Determine dominant force
  const whiteActivity = moveHistory.filter((_, i) => i % 2 === 0).length;
  const blackActivity = moveHistory.filter((_, i) => i % 2 === 1).length;
  const dominantForce = whiteActivity > blackActivity * 1.1 ? 'primary' : 
                        blackActivity > whiteActivity * 1.1 ? 'secondary' : 'balanced';
  
  // Determine flow direction
  const forwardness = (quadrantProfile.q1 + quadrantProfile.q2) - (quadrantProfile.q3 + quadrantProfile.q4);
  const flowDirection = Math.abs(forwardness) < 0.15 ? 'chaotic' : 
                        forwardness > 0 ? 'forward' : 'backward';
  
  const fingerprint = generateFingerprint(totalMoves, intensity, quadrantProfile);
  
  return {
    fingerprint,
    archetype: '', // Will be set by classifier
    dominantForce,
    flowDirection,
    intensity,
    quadrantProfile,
    temporalFlow,
    criticalMoments
  };
}

/**
 * Extract moves from PGN string
 */
export function extractMovesFromPgn(pgn: string): string[] {
  // Remove comments and variations
  let cleanPgn = pgn.replace(/\{[^}]*\}/g, '');
  cleanPgn = cleanPgn.replace(/\([^)]*\)/g, '');
  
  // Extract moves section (after headers)
  const movesMatch = cleanPgn.match(/\n\n(.+)$/s) || cleanPgn.match(/\n(.+)$/s);
  const movesSection = movesMatch ? movesMatch[1] : cleanPgn;
  
  // Parse moves
  const moves = movesSection
    .replace(/\d+\.\s*/g, '')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
    .trim()
    .split(/\s+/)
    .filter(m => m.length > 0 && !m.includes('.'));
  
  return moves;
}
