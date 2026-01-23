/**
 * Lichess API Integration for Historical Game Import
 * Routes through Edge Function proxy to avoid CORS and centralize rate limiting
 * 
 * v7.54-FIX: Added Chess.js import for UCI-to-SAN conversion
 */

import { supabase } from "@/integrations/supabase/client";
import { Chess } from 'chess.js';

export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: { user?: { name: string; id: string }; rating?: number };
    black: { user?: { name: string; id: string }; rating?: number };
  };
  winner?: 'white' | 'black';
  moves?: string;
  pgn?: string;
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
}

export interface LichessImportResult {
  games: LichessGame[];
  username: string;
  totalGames: number;
  importedCount: number;
  errors: string[];
}

/**
 * Fetch games from Lichess via Edge Function proxy
 * This avoids CORS issues and centralizes rate limiting
 */
export async function fetchLichessGames(
  username: string,
  options: {
    max?: number;
    since?: number;
    until?: number;
    rated?: boolean;
    perfType?: string;
    opening?: boolean;
    moves?: boolean;
    pgnInJson?: boolean;
  } = {}
): Promise<LichessImportResult> {
  const {
    max = 50,
    since,
    until,
  } = options;

  try {
    // Use Edge Function proxy to avoid CORS and centralize rate limiting
    const { data, error } = await supabase.functions.invoke('lichess-games', {
      body: {
        player: username,
        max,
        since,
        until,
      },
    });

    if (error) {
      console.error('[Lichess API] Edge function error:', error);
      return {
        games: [],
        username,
        totalGames: 0,
        importedCount: 0,
        errors: [error.message || 'Edge function error']
      };
    }

    // Handle rate limit response
    if (data?.error === 'Rate limited') {
      console.warn(`[Lichess API] Rate limited, retry after ${data.retryAfter}s`);
      return {
        games: [],
        username,
        totalGames: 0,
        importedCount: 0,
        errors: [`Rate limited - retry after ${data.retryAfter}s`]
      };
    }

    if (data?.error) {
      return {
        games: [],
        username,
        totalGames: 0,
        importedCount: 0,
        errors: [data.error]
      };
    }

    // Transform edge function response to LichessGame format
    const games: LichessGame[] = (data?.games || []).map((g: Record<string, unknown>) => ({
      id: g.id as string,
      rated: (g.rated as boolean) ?? true,
      variant: (g.variant as string) || 'standard',
      speed: (g.speed as string) || 'blitz',
      perf: (g.perf as string) || (g.speed as string) || 'blitz',
      createdAt: g.createdAt as number,
      lastMoveAt: g.lastMoveAt as number,
      status: g.status as string,
      players: {
        white: { 
          user: { name: g.whiteName as string, id: g.whiteName as string }, 
          rating: g.whiteElo as number 
        },
        black: { 
          user: { name: g.blackName as string, id: g.blackName as string }, 
          rating: g.blackElo as number 
        },
      },
      winner: g.winner as 'white' | 'black' | undefined,
      moves: g.moves as string,
      pgn: g.pgn as string,
      opening: g.openingEco ? {
        eco: g.openingEco as string,
        name: (g.openingName as string) || 'Unknown',
        ply: (g.openingPly as number) || 0,
      } : undefined,
    }));

    return {
      games,
      username,
      totalGames: games.length,
      importedCount: games.length,
      errors: []
    };
  } catch (error) {
    console.error('[Lichess API] Fetch error:', error);
    return {
      games: [],
      username,
      totalGames: 0,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Get user profile info from Lichess (direct API call - profile is public/simple)
 */
export async function getLichessUserProfile(username: string) {
  const response = await fetch(`https://lichess.org/api/user/${username}`);
  if (!response.ok) {
    throw new Error(`User not found: ${username}`);
  }
  return response.json();
}

/**
 * Convert Lichess game to standard PGN format
 * v7.54-FIX: Properly convert UCI moves to SAN notation
 */
export function lichessGameToPgn(game: LichessGame): string {
  // If we already have a proper PGN, use it directly
  if (game.pgn) return game.pgn;
  
  const headers: string[] = [];
  headers.push(`[Event "Lichess ${game.perf}"]`);
  headers.push(`[Site "https://lichess.org/${game.id}"]`);
  headers.push(`[Date "${new Date(game.createdAt).toISOString().split('T')[0].replace(/-/g, '.')}"]`);
  headers.push(`[White "${game.players.white.user?.name || 'Anonymous'}"]`);
  headers.push(`[Black "${game.players.black.user?.name || 'Anonymous'}"]`);
  headers.push(`[Result "${getResult(game)}"]`);
  if (game.players.white.rating) headers.push(`[WhiteElo "${game.players.white.rating}"]`);
  if (game.players.black.rating) headers.push(`[BlackElo "${game.players.black.rating}"]`);
  if (game.opening) {
    headers.push(`[ECO "${game.opening.eco}"]`);
    headers.push(`[Opening "${game.opening.name}"]`);
  }
  
  // v7.54-FIX: Convert UCI moves to SAN notation
  // Lichess API returns moves in UCI format (e2e4, g1f3, etc.) when pgnInJson is false
  // We need to replay the game and extract SAN notation
  let sanMoves = '';
  if (game.moves) {
    try {
      const chess = new Chess();
      const uciMoves = game.moves.split(' ');
      const sanList: string[] = [];
      
      for (const uci of uciMoves) {
        if (!uci || uci.length < 4) continue;
        
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        
        try {
          const move = chess.move({ from, to, promotion });
          if (move) {
            sanList.push(move.san);
          }
        } catch {
          // Skip invalid moves (might be corrupted data)
          console.warn(`[lichessApi] Invalid UCI move: ${uci} in game ${game.id}`);
          break;
        }
      }
      
      // Format as proper PGN move text
      sanMoves = sanList.map((san, i) => 
        i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${san}` : san
      ).join(' ');
    } catch (err) {
      console.warn(`[lichessApi] Failed to convert moves for ${game.id}:`, err);
      sanMoves = '';
    }
  }
  
  return `${headers.join('\n')}\n\n${sanMoves} ${getResult(game)}`;
}

function getResult(game: LichessGame): string {
  // v6.4-TIMEOUT: Handle ALL decisive statuses including timeout
  // Lichess statuses: mate, resign, stalemate, timeout, draw, outoftime, cheat, noStart, unknownFinish, variantEnd
  
  // Draw statuses
  if (game.status === 'draw' || game.status === 'stalemate') return '1/2-1/2';
  
  // Decisive games - check winner field (works for mate, resign, timeout, outoftime, etc.)
  if (game.winner === 'white') return '1-0';
  if (game.winner === 'black') return '0-1';
  
  // Fallback for edge cases: check status directly
  // "timeout" and "outoftime" should have winner set, but handle if not
  if (game.status === 'timeout' || game.status === 'outoftime') {
    // Try to infer from clock data if available, otherwise mark as unresolved
    console.log(`[Lichess] Timeout game ${game.id} without winner field - marking as draw`);
    return '1/2-1/2'; // Conservative: treat as draw rather than skip
  }
  
  return '*';
}
