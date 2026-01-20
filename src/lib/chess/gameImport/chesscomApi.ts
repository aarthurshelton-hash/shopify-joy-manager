/**
 * Chess.com API Integration for Historical Game Import
 * Public API - no token required for public game data
 */

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  fen?: string;
  time_class: string;
  rules: string;
  white: {
    rating: number;
    result: string;
    username: string;
    uuid: string;
  };
  black: {
    rating: number;
    result: string;
    username: string;
    uuid: string;
  };
}

export interface ChessComArchive {
  games: ChessComGame[];
}

export interface ChessComImportResult {
  games: ChessComGame[];
  username: string;
  totalGames: number;
  importedCount: number;
  archives: string[];
  errors: string[];
}

const CHESSCOM_API_BASE = 'https://api.chess.com/pub';

/**
 * Get list of archive URLs for a player
 */
export async function getChessComArchives(username: string): Promise<string[]> {
  const response = await fetch(`${CHESSCOM_API_BASE}/player/${username}/games/archives`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`User "${username}" not found on Chess.com`);
    }
    throw new Error(`Chess.com API error: ${response.status}`);
  }
  const data = await response.json();
  return data.archives || [];
}

/**
 * Fetch games from a specific archive month
 */
export async function fetchChessComArchive(archiveUrl: string): Promise<ChessComGame[]> {
  const response = await fetch(archiveUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch archive: ${response.status}`);
  }
  const data: ChessComArchive = await response.json();
  return data.games || [];
}

/**
 * Fetch games from Chess.com for a specific user
 */
export async function fetchChessComGames(
  username: string,
  options: {
    max?: number;
    months?: number; // How many months of history to fetch
    monthOffset?: number; // v6.73: Skip this many recent months (window isolation)
  } = {}
): Promise<ChessComImportResult> {
  const { max = 100, months = 12, monthOffset = 0 } = options;
  const errors: string[] = [];
  
  try {
    const archives = await getChessComArchives(username);
    
    if (archives.length === 0) {
      return {
        games: [],
        username,
        totalGames: 0,
        importedCount: 0,
        archives: [],
        errors: ['No game archives found for this user']
      };
    }

    // v6.73-WINDOW-ISOLATION: Skip recent months and take a specific window
    // monthOffset = 0 → most recent months
    // monthOffset = 3 → skip 3 most recent, get next N months
    const allArchivesSorted = archives.slice().reverse(); // Most recent first
    const windowStart = Math.min(monthOffset, allArchivesSorted.length);
    const windowEnd = Math.min(windowStart + months, allArchivesSorted.length);
    const targetArchives = allArchivesSorted.slice(windowStart, windowEnd);
    
    console.log(`[ChessCom v6.73] ${username}: Archives ${windowStart}-${windowEnd} of ${archives.length} (offset: ${monthOffset})`);
    
    let allGames: ChessComGame[] = [];
    
    for (const archiveUrl of targetArchives) {
      if (allGames.length >= max) break;
      
      try {
        const games = await fetchChessComArchive(archiveUrl);
        allGames = allGames.concat(games);
      } catch (err) {
        errors.push(`Failed to fetch archive: ${archiveUrl}`);
      }
    }

    // Sort by end_time descending and limit
    allGames.sort((a, b) => b.end_time - a.end_time);
    const limitedGames = allGames.slice(0, max);

    return {
      games: limitedGames,
      username,
      totalGames: allGames.length,
      importedCount: limitedGames.length,
      archives: targetArchives,
      errors
    };
  } catch (error) {
    return {
      games: [],
      username,
      totalGames: 0,
      importedCount: 0,
      archives: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Get user profile info from Chess.com
 */
export async function getChessComUserProfile(username: string) {
  const response = await fetch(`${CHESSCOM_API_BASE}/player/${username}`);
  if (!response.ok) {
    throw new Error(`User not found: ${username}`);
  }
  return response.json();
}

/**
 * Get user stats from Chess.com
 */
export async function getChessComUserStats(username: string) {
  const response = await fetch(`${CHESSCOM_API_BASE}/player/${username}/stats`);
  if (!response.ok) {
    throw new Error(`Stats not found for: ${username}`);
  }
  return response.json();
}

/**
 * Extract result from Chess.com game
 */
export function getChessComResult(game: ChessComGame): '1-0' | '0-1' | '1/2-1/2' | '*' {
  if (game.white.result === 'win') return '1-0';
  if (game.black.result === 'win') return '0-1';
  if (game.white.result === 'agreed' || game.white.result === 'stalemate' || 
      game.white.result === 'repetition' || game.white.result === 'insufficient') {
    return '1/2-1/2';
  }
  return '*';
}
