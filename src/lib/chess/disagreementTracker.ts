/**
 * Prediction Disagreement Tracker
 * 
 * Identifies and analyzes cases where En Pensent's hybrid prediction
 * correctly predicted outcomes that Stockfish's evaluation missed.
 * 
 * These are the most valuable data points - they prove the hybrid
 * approach adds value beyond pure tactical calculation.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Extract game date from PGN [Date] tag
 */
function extractGameDateFromPgn(pgn: string | null): string | null {
  if (!pgn) return null;
  const match = pgn.match(/\[Date\s+"(\d{4}\.\d{2}\.\d{2})"\]/);
  if (match) {
    // Convert YYYY.MM.DD to ISO date format
    return match[1].replace(/\./g, '-');
  }
  return null;
}

/**
 * Format time control for display
 * Handles various formats from Lichess API (speed field)
 * v6.18: Also tries to infer from game context when time_control is null
 */
export function formatTimeControl(tc: string | null | undefined, gameName?: string): { label: string; color: string; icon: string } {
  // v6.18: If tc is null/undefined, try to infer from game name ELO ranges
  // High ELO games (2800+) on Lichess are usually bullet/blitz
  if (!tc && gameName) {
    // Extract ELO from game name like "Player1 (2950) vs Player2 (3100)"
    const eloMatches = gameName.match(/\((\d{3,4})\)/g);
    if (eloMatches && eloMatches.length >= 1) {
      const elos = eloMatches.map(m => parseInt(m.replace(/[()]/g, '')));
      const avgElo = elos.reduce((a, b) => a + b, 0) / elos.length;
      // Very high ELO (2800+) games on Lichess are almost always Bullet/Blitz
      // This is a reasonable inference for GM games
      if (avgElo >= 2800) {
        return { label: 'Bullet/Blitz', color: 'text-orange-400', icon: '⚡' };
      }
      if (avgElo >= 2500) {
        return { label: 'Rated', color: 'text-blue-400', icon: '🎯' };
      }
    }
    // Fallback for games with names but unknown time control
    return { label: 'Rated', color: 'text-muted-foreground', icon: '♟️' };
  }
  
  if (!tc) {
    return { label: 'Unknown', color: 'text-muted-foreground', icon: '🎯' };
  }
  
  const normalized = tc.toLowerCase().trim();
  
  switch (normalized) {
    case 'bullet':
    case 'ultrabullet':
    case 'hyperbullet':
      return { label: 'Bullet', color: 'text-red-400', icon: '⚡' };
    case 'blitz':
      return { label: 'Blitz', color: 'text-orange-400', icon: '🔥' };
    case 'rapid':
      return { label: 'Rapid', color: 'text-blue-400', icon: '⏱️' };
    case 'classical':
    case 'correspondence':
    case 'standard':
      return { label: 'Classical', color: 'text-green-400', icon: '♟️' };
    default:
      // If it looks like a time control string (e.g., "3+0", "10+5")
      if (/^\d+\+?\d*$/.test(normalized)) {
        const baseTime = parseInt(normalized.split('+')[0]);
        if (baseTime <= 2) return { label: 'Bullet', color: 'text-red-400', icon: '⚡' };
        if (baseTime <= 5) return { label: 'Blitz', color: 'text-orange-400', icon: '🔥' };
        if (baseTime <= 15) return { label: 'Rapid', color: 'text-blue-400', icon: '⏱️' };
        return { label: 'Classical', color: 'text-green-400', icon: '♟️' };
      }
      return { label: tc, color: 'text-muted-foreground', icon: '🎯' };
  }
}

export interface DisagreementCase {
  id: string;
  fen: string;
  gameName: string;
  moveNumber: number;
  stockfishEval: number;
  stockfishPrediction: string;
  hybridPrediction: string;
  actualResult: string;
  hybridCorrect: boolean;
  stockfishCorrect: boolean;
  hybridArchetype: string | null;
  hybridConfidence: number | null;
  createdAt: string; // When we analyzed it
  significance: 'breakthrough' | 'notable' | 'minor';
  evalMagnitude: number; // How "confident" Stockfish was in wrong direction
  // Game metadata
  timeControl: string | null; // bullet, blitz, rapid, classical
  whiteElo: number | null;
  blackElo: number | null;
  pgn: string | null; // Contains original game date
  gameDate: string | null; // Extracted from PGN [Date] tag
}

export interface DisagreementStats {
  totalDisagreements: number;
  hybridWinsDisagreements: number;
  stockfishWinsDisagreements: number;
  breakthroughCases: number;
  averageStockfishConfidenceWhenWrong: number;
  topArchetypesInDisagreements: { archetype: string; count: number; winRate: number }[];
}

/**
 * Fetch cases where hybrid and Stockfish disagreed
 */
export async function getDisagreementCases(limit = 50): Promise<DisagreementCase[]> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('*')
    .neq('hybrid_prediction', 'stockfish_prediction') // They disagreed
    .neq('stockfish_prediction', 'unknown') // Exclude corrupted legacy data
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching disagreement cases:', error);
    return [];
  }

  return (data || []).map(row => {
    const stockfishEval = row.stockfish_eval || 0;
    const evalMagnitude = Math.abs(stockfishEval);
    
    // Significance based on how wrong Stockfish was
    let significance: 'breakthrough' | 'notable' | 'minor' = 'minor';
    if (evalMagnitude > 200 && row.hybrid_correct && !row.stockfish_correct) {
      significance = 'breakthrough'; // Stockfish was very confident but wrong
    } else if (evalMagnitude > 100 && row.hybrid_correct && !row.stockfish_correct) {
      significance = 'notable';
    }

    // Extract game date from PGN [Date] tag
    const gameDate = extractGameDateFromPgn(row.pgn);

    return {
      id: row.id,
      fen: row.fen,
      gameName: row.game_name,
      moveNumber: row.move_number,
      stockfishEval: stockfishEval,
      stockfishPrediction: row.stockfish_prediction,
      hybridPrediction: row.hybrid_prediction,
      actualResult: row.actual_result,
      hybridCorrect: row.hybrid_correct,
      stockfishCorrect: row.stockfish_correct,
      hybridArchetype: row.hybrid_archetype,
      hybridConfidence: row.hybrid_confidence,
      createdAt: row.created_at,
      significance,
      evalMagnitude,
      timeControl: row.time_control,
      whiteElo: row.white_elo,
      blackElo: row.black_elo,
      pgn: row.pgn,
      gameDate,
    };
  });
}

/**
 * Get cases where hybrid was RIGHT and Stockfish was WRONG
 */
export async function getHybridBreakthroughs(limit = 20): Promise<DisagreementCase[]> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('*')
    .eq('hybrid_correct', true)
    .eq('stockfish_correct', false)
    .neq('stockfish_prediction', 'unknown') // Exclude corrupted legacy data
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching breakthroughs:', error);
    return [];
  }

  return (data || []).map(row => {
    const gameDate = extractGameDateFromPgn(row.pgn);
    return {
      id: row.id,
      fen: row.fen,
      gameName: row.game_name,
      moveNumber: row.move_number,
      stockfishEval: row.stockfish_eval || 0,
      stockfishPrediction: row.stockfish_prediction,
      hybridPrediction: row.hybrid_prediction,
      actualResult: row.actual_result,
      hybridCorrect: row.hybrid_correct,
      stockfishCorrect: row.stockfish_correct,
      hybridArchetype: row.hybrid_archetype,
      hybridConfidence: row.hybrid_confidence,
      createdAt: row.created_at,
      significance: Math.abs(row.stockfish_eval || 0) > 200 ? 'breakthrough' as const : 'notable' as const,
      evalMagnitude: Math.abs(row.stockfish_eval || 0),
      timeControl: row.time_control,
      whiteElo: row.white_elo,
      blackElo: row.black_elo,
      pgn: row.pgn,
      gameDate,
    };
  });
}

/**
 * Calculate disagreement statistics
 * v7.26-AUDIT-FIX: Uses count queries to bypass 1000-row limit
 */
export async function getDisagreementStats(): Promise<DisagreementStats> {
  // v7.26: Use count queries based on exclusive wins (hybrid correct + SF wrong, or vice versa)
  // This is the actual definition of "disagreement where one was right and one was wrong"
  const [
    { count: hybridWinsCount },
    { count: stockfishWinsCount },
  ] = await Promise.all([
    // Hybrid wins (hybrid correct AND stockfish wrong)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('hybrid_correct', true)
      .eq('stockfish_correct', false),
    // Stockfish wins (stockfish correct AND hybrid wrong)
    supabase
      .from('chess_prediction_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('stockfish_correct', true)
      .eq('hybrid_correct', false),
  ]);

  // Get archetype data from a limited sample (for top archetypes)
  const { data: archetypeSample } = await supabase
    .from('chess_prediction_attempts')
    .select('hybrid_archetype, hybrid_correct, stockfish_correct')
    .neq('hybrid_prediction', 'stockfish_prediction')
    .limit(1000);

  // Get average stockfish confidence when hybrid wins
  const { data: evalData } = await supabase
    .from('chess_prediction_attempts')
    .select('stockfish_eval')
    .eq('hybrid_correct', true)
    .eq('stockfish_correct', false)
    .not('stockfish_eval', 'is', null)
    .limit(1000);

  const stockfishWrongEvals = (evalData || [])
    .map(d => Math.abs(d.stockfish_eval || 0))
    .filter(e => e > 0);
  
  const avgConfidence = stockfishWrongEvals.length > 0
    ? stockfishWrongEvals.reduce((a, b) => a + b, 0) / stockfishWrongEvals.length
    : 0;

  // Archetype analysis from sample
  const archetypeCounts: Record<string, { total: number; wins: number }> = {};
  (archetypeSample || []).forEach(d => {
    const arch = d.hybrid_archetype || 'unknown';
    if (!archetypeCounts[arch]) {
      archetypeCounts[arch] = { total: 0, wins: 0 };
    }
    archetypeCounts[arch].total++;
    if (d.hybrid_correct) {
      archetypeCounts[arch].wins++;
    }
  });

  const topArchetypes = Object.entries(archetypeCounts)
    .map(([archetype, stats]) => ({
      archetype,
      count: stats.total,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // v7.26: Calculate actual disagreement count from exclusive wins
  const actualDisagreements = (hybridWinsCount || 0) + (stockfishWinsCount || 0);
  
  console.log('[v7.26-DISAGREEMENT] Stats:', {
    totalDisagreements: actualDisagreements,
    hybridWins: hybridWinsCount,
    sfWins: stockfishWinsCount,
    winRate: actualDisagreements > 0 ? ((hybridWinsCount || 0) / actualDisagreements * 100).toFixed(1) : 0
  });

  return {
    totalDisagreements: actualDisagreements,
    hybridWinsDisagreements: hybridWinsCount || 0,
    stockfishWinsDisagreements: stockfishWinsCount || 0,
    breakthroughCases: hybridWinsCount || 0, // All hybrid exclusive wins are breakthroughs
    averageStockfishConfidenceWhenWrong: avgConfidence,
    topArchetypesInDisagreements: topArchetypes,
  };
}

/**
 * Format eval for display (centipawns to pawns)
 */
export function formatEval(cp: number): string {
  if (Math.abs(cp) > 10000) {
    return cp > 0 ? 'M+' : 'M-';
  }
  const pawns = cp / 100;
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
}

/**
 * Get insight text for a disagreement case
 */
export function getDisagreementInsight(case_: DisagreementCase): string {
  if (case_.hybridCorrect && !case_.stockfishCorrect) {
    if (case_.evalMagnitude > 200) {
      return `BREAKTHROUGH: Stockfish saw ${formatEval(case_.stockfishEval)} but the ${case_.hybridArchetype || 'pattern'} trajectory correctly predicted ${case_.actualResult}`;
    }
    return `Hybrid's ${case_.hybridArchetype || 'pattern'} analysis correctly overrode Stockfish's ${formatEval(case_.stockfishEval)} evaluation`;
  }
  if (case_.stockfishCorrect && !case_.hybridCorrect) {
    return `Stockfish's tactical precision was correct here; hybrid pattern was misleading`;
  }
  return 'Both systems made the same prediction';
}
