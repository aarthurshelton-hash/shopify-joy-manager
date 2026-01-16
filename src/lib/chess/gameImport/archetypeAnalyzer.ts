/**
 * Archetype Analysis for Imported Games
 * Matches historical games to En Pensent pattern library
 * Refactored to use modular signature extraction
 */

import { Chess } from 'chess.js';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype/universalClassifier';
import type { TemporalSignature } from '@/lib/pensent-core/types/core';
import type { LichessGame } from './lichessApi';
import type { ChessComGame } from './chesscomApi';
import { extractChessSignature, extractMovesFromPgn } from './signatureExtractor';

// ===================== TYPES =====================

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

// ===================== GAME ANALYSIS =====================

/**
 * Parse moves from a game and extract move history
 */
function parseMoves(moves: string[]): Array<{ from: string; to: string; san: string }> | null {
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

  return moveHistory.length >= 10 ? moveHistory : null;
}

/**
 * Analyze a Lichess game and extract signature
 */
export function analyzeLichessGame(game: LichessGame): AnalyzedGame | null {
  try {
    const moves = game.moves ? game.moves.split(' ') : [];
    const moveHistory = parseMoves(moves);
    if (!moveHistory) return null;

    const chess = new Chess();
    moves.forEach(m => { try { chess.move(m); } catch {} });

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
    const moveHistory = parseMoves(moves);
    if (!moveHistory) return null;

    const chess = new Chess();
    moves.forEach(m => { try { chess.move(m); } catch {} });

    const signature = extractChessSignature(moveHistory, chess.fen());
    const archetype = classifyUniversalArchetype(signature);
    signature.archetype = archetype;

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

// ===================== BATCH ANALYSIS =====================

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
