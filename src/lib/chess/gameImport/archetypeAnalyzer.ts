/**
 * Archetype Analysis for Imported Games
 * Matches historical games to En Pensent pattern library
 */

import { Chess } from 'chess.js';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype/universalClassifier';
import type { TemporalSignature, QuadrantProfile, TemporalFlow, CriticalMoment } from '@/lib/pensent-core/types/core';
import type { LichessGame } from './lichessApi';
import type { ChessComGame } from './chesscomApi';

export interface AnalyzedGame {
  id: string;
  source: 'lichess' | 'chesscom';
  pgn: string;
  white: string;
  black: string;
  result: string;
  opening?: { eco: string; name: string };
  playedAt: Date;
  signature: TemporalSignature;
  archetype: string;
  moveCount: number;
}

export interface ArchetypeDistribution {
  archetype: string;
  count: number;
  percentage: number;
  winRate: number;
  avgIntensity: number;
}

export interface GameAnalysisResult {
  games: AnalyzedGame[];
  totalAnalyzed: number;
  archetypeDistribution: ArchetypeDistribution[];
  dominantArchetype: string;
  avgIntensity: number;
  winRateByArchetype: Record<string, number>;
}

/**
 * Convert a square string (e.g., "e4") to quadrant region
 */
function squareToQuadrant(square: string): 'q1' | 'q2' | 'q3' | 'q4' {
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
 * Extract temporal signature from chess move history
 */
function extractChessSignature(
  moveHistory: Array<{ from: string; to: string; san: string }>,
  finalFen: string
): TemporalSignature {
  const totalMoves = moveHistory.length;
  
  // Calculate quadrant profile from move destinations
  const quadrantCounts = { q1: 0, q2: 0, q3: 0, q4: 0 };
  for (const move of moveHistory) {
    const quad = squareToQuadrant(move.to);
    quadrantCounts[quad]++;
  }
  const total = Math.max(1, Object.values(quadrantCounts).reduce((a, b) => a + b, 0));
  
  const quadrantProfile: QuadrantProfile = {
    q1: quadrantCounts.q1 / total,
    q2: quadrantCounts.q2 / total,
    q3: quadrantCounts.q3 / total,
    q4: quadrantCounts.q4 / total
  };
  
  // Calculate temporal flow based on game phases
  const openingMoves = moveHistory.slice(0, Math.min(10, totalMoves));
  const middleMoves = moveHistory.slice(10, Math.min(30, totalMoves));
  const endMoves = moveHistory.slice(30);
  
  const temporalFlow: TemporalFlow = {
    opening: openingMoves.length / 10,
    middle: middleMoves.length / 20,
    ending: endMoves.length / Math.max(1, totalMoves - 30),
    trend: totalMoves > 40 ? 'stable' : totalMoves > 25 ? 'accelerating' : 'volatile',
    momentum: (endMoves.length - openingMoves.length) / Math.max(1, totalMoves) * 2
  };
  
  // Detect critical moments (captures, checks, etc.)
  const criticalMoments: CriticalMoment[] = [];
  for (let i = 0; i < moveHistory.length; i++) {
    const move = moveHistory[i];
    if (move.san.includes('x') || move.san.includes('+') || move.san.includes('#')) {
      criticalMoments.push({
        index: i,
        type: move.san.includes('#') ? 'checkmate' : move.san.includes('+') ? 'check' : 'capture',
        severity: move.san.includes('#') ? 1 : move.san.includes('+') ? 0.7 : 0.4,
        description: `Move ${i + 1}: ${move.san}`
      });
    }
  }
  
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
  
  // Generate fingerprint
  const fingerprintData = `${totalMoves}-${intensity.toFixed(2)}-${Object.values(quadrantProfile).map(v => v.toFixed(2)).join('')}`;
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    hash = ((hash << 5) - hash) + fingerprintData.charCodeAt(i);
    hash = hash & hash;
  }
  const fingerprint = `ep-${Math.abs(hash).toString(36)}`;
  
  return {
    fingerprint,
    archetype: '', // Will be set by classifier
    dominantForce,
    flowDirection,
    intensity,
    quadrantProfile,
    temporalFlow,
    criticalMoments: criticalMoments.slice(0, 10)
  };
}

/**
 * Extract moves from PGN string
 */
function extractMovesFromPgn(pgn: string): string[] {
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

/**
 * Analyze a Lichess game and extract signature
 */
export function analyzeLichessGame(game: LichessGame): AnalyzedGame | null {
  try {
    const moves = game.moves ? game.moves.split(' ') : [];
    if (moves.length < 10) return null;

    const chess = new Chess();
    const moveHistory: Array<{ from: string; to: string; san: string }> = [];
    
    for (const move of moves) {
      try {
        const result = chess.move(move);
        if (result) {
          moveHistory.push({ from: result.from, to: result.to, san: result.san });
        }
      } catch {
        break;
      }
    }

    if (moveHistory.length < 10) return null;

    const signature = extractChessSignature(moveHistory, chess.fen());
    const archetype = classifyUniversalArchetype(signature);
    signature.archetype = archetype;

    return {
      id: game.id,
      source: 'lichess',
      pgn: game.pgn || '',
      white: game.players.white.user?.name || 'Anonymous',
      black: game.players.black.user?.name || 'Anonymous',
      result: game.winner === 'white' ? '1-0' : game.winner === 'black' ? '0-1' : '1/2-1/2',
      opening: game.opening ? { eco: game.opening.eco, name: game.opening.name } : undefined,
      playedAt: new Date(game.createdAt),
      signature,
      archetype,
      moveCount: moveHistory.length
    };
  } catch (error) {
    console.error('Failed to analyze Lichess game:', game.id, error);
    return null;
  }
}

/**
 * Analyze a Chess.com game and extract signature
 */
export function analyzeChessComGame(game: ChessComGame): AnalyzedGame | null {
  try {
    const moves = extractMovesFromPgn(game.pgn);
    if (moves.length < 10) return null;

    const chess = new Chess();
    const moveHistory: Array<{ from: string; to: string; san: string }> = [];
    
    for (const move of moves) {
      try {
        const result = chess.move(move);
        if (result) {
          moveHistory.push({ from: result.from, to: result.to, san: result.san });
        }
      } catch {
        break;
      }
    }

    if (moveHistory.length < 10) return null;

    const signature = extractChessSignature(moveHistory, chess.fen());
    const archetype = classifyUniversalArchetype(signature);
    signature.archetype = archetype;

    // Extract opening from PGN if available
    const ecoMatch = game.pgn.match(/\[ECO "([^"]+)"\]/);
    const openingMatch = game.pgn.match(/\[Opening "([^"]+)"\]/);

    return {
      id: game.url,
      source: 'chesscom',
      pgn: game.pgn,
      white: game.white.username,
      black: game.black.username,
      result: game.white.result === 'win' ? '1-0' : game.black.result === 'win' ? '0-1' : '1/2-1/2',
      opening: ecoMatch ? { eco: ecoMatch[1], name: openingMatch?.[1] || 'Unknown' } : undefined,
      playedAt: new Date(game.end_time * 1000),
      signature,
      archetype,
      moveCount: moveHistory.length
    };
  } catch (error) {
    console.error('Failed to analyze Chess.com game:', game.url, error);
    return null;
  }
}

/**
 * Analyze multiple games and compute distributions
 */
export function analyzeGameBatch(games: AnalyzedGame[]): GameAnalysisResult {
  const archetypeCounts: Record<string, { count: number; wins: number; intensitySum: number }> = {};
  
  for (const game of games) {
    if (!archetypeCounts[game.archetype]) {
      archetypeCounts[game.archetype] = { count: 0, wins: 0, intensitySum: 0 };
    }
    archetypeCounts[game.archetype].count++;
    archetypeCounts[game.archetype].intensitySum += game.signature.intensity;
    
    // Count wins (if white won and it's a white archetype, etc.)
    if (game.result === '1-0' || game.result === '0-1') {
      archetypeCounts[game.archetype].wins++;
    }
  }

  const total = games.length;
  const archetypeDistribution: ArchetypeDistribution[] = Object.entries(archetypeCounts)
    .map(([archetype, data]) => ({
      archetype,
      count: data.count,
      percentage: (data.count / total) * 100,
      winRate: (data.wins / data.count) * 100,
      avgIntensity: data.intensitySum / data.count
    }))
    .sort((a, b) => b.count - a.count);

  const dominantArchetype = archetypeDistribution[0]?.archetype || 'unknown';
  const avgIntensity = games.reduce((sum, g) => sum + g.signature.intensity, 0) / total;

  const winRateByArchetype: Record<string, number> = {};
  for (const dist of archetypeDistribution) {
    winRateByArchetype[dist.archetype] = dist.winRate;
  }

  return {
    games,
    totalAnalyzed: total,
    archetypeDistribution,
    dominantArchetype,
    avgIntensity,
    winRateByArchetype
  };
}
