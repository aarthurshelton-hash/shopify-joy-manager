/**
 * Lichess API Integration for Historical Game Import
 * Free, open API - no token required for public data
 */

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

const LICHESS_API_BASE = 'https://lichess.org/api';

/**
 * Fetch games from Lichess for a specific user
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
    rated,
    perfType,
    opening = true,
    moves = true,
    pgnInJson = true
  } = options;

  const params = new URLSearchParams();
  params.set('max', String(max));
  if (since) params.set('since', String(since));
  if (until) params.set('until', String(until));
  if (rated !== undefined) params.set('rated', String(rated));
  if (perfType) params.set('perfType', perfType);
  if (opening) params.set('opening', 'true');
  if (moves) params.set('moves', 'true');
  if (pgnInJson) params.set('pgnInJson', 'true');

  const url = `${LICHESS_API_BASE}/games/user/${username}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/x-ndjson'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User "${username}" not found on Lichess`);
      }
      throw new Error(`Lichess API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n').filter(line => line.length > 0);
    const games: LichessGame[] = lines.map(line => JSON.parse(line));

    return {
      games,
      username,
      totalGames: games.length,
      importedCount: games.length,
      errors: []
    };
  } catch (error) {
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
 * Get user profile info from Lichess
 */
export async function getLichessUserProfile(username: string) {
  const response = await fetch(`${LICHESS_API_BASE}/user/${username}`);
  if (!response.ok) {
    throw new Error(`User not found: ${username}`);
  }
  return response.json();
}

/**
 * Convert Lichess game to standard PGN format
 */
export function lichessGameToPgn(game: LichessGame): string {
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
  
  return `${headers.join('\n')}\n\n${game.moves || ''} ${getResult(game)}`;
}

function getResult(game: LichessGame): string {
  if (game.status === 'draw' || game.status === 'stalemate') return '1/2-1/2';
  if (game.winner === 'white') return '1-0';
  if (game.winner === 'black') return '0-1';
  return '*';
}
