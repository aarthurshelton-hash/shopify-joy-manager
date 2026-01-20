/**
 * Multi-Source Game Fetcher v2.0 - HIGH VOLUME
 * VERSION: 6.60-FETCH-FIX (2026-01-20)
 * 
 * v6.60 CHANGES:
 * - FETCH FIX: Only exclude DB games during fetch, not session predictions
 * - Prevents "starvation" where session predictions block fresh fetches
 * - Maintains processing-loop deduplication for safety
 * 
 * v6.59 CHANGES:
 * - VERIFIED player pool: Removed invalid/inactive usernames causing 404s
 * 
 * v6.58 CHANGES:
 * - Fixed ID validation to support prefixed IDs (li_/cc_)
 * - Removed all content-based filters (length, moves count)
 * - Only ID-based deduplication
 * 
 * SOURCES:
 * - Lichess (via Edge Function proxy) - 5+ billion games
 * - Chess.com (public API) - billions more
 * 
 * TARGET: 100+ unique games per batch
 */

import { supabase } from "@/integrations/supabase/client";
import { fetchChessComGames, ChessComGame, getChessComResult } from "./chesscomApi";

export interface UnifiedGameData {
  pgn: string;
  moves?: string;
  gameId: string;           // Unique ID (prefixed by source)
  source: 'lichess' | 'chesscom';
  // Result fields
  winner?: 'white' | 'black';
  status?: string;
  result?: '1-0' | '0-1' | '1/2-1/2' | '*';
  // Player context
  whiteName?: string;
  blackName?: string;
  whiteElo?: number;
  blackElo?: number;
  // Time control
  timeControl?: string;
  speed?: string;
  rated?: boolean;
  // Temporal
  playedAt?: string;
  gameYear?: number;
  gameMonth?: number;
  // Opening
  openingEco?: string;
  openingName?: string;
  // Termination
  termination?: string;
}

// Chess.com top players (VERIFIED active accounts)
const CHESSCOM_TOP_PLAYERS = [
  "Hikaru", "MagnusCarlsen", "nihalsarin", "FabianoCaruana", "LevonAronian",
  "Firouzja2003", "DanielNaroditsky", "GothamChess", "AnishGiri", "WesleySo",
  "Praggnanandhaa", "DominguezPerez", "Grischuk", "JanNepomniachtchi", "MVL",
  "BogdanDeac", "RichardRapport", "VladimirFedoseev", "AlirezaFirouzja", "Duda",
  "Caruana", "Nepo", "HansNiemann", "EricRosen", "chess24"
];

/**
 * v6.59-VERIFIED-POOL: ONLY include Lichess accounts that are:
 * 1. Confirmed to exist (no 404s)
 * 2. Active in 2022-2025 with games
 * Removed: Hikaru (404), Polish_fighter3000 (404), SSJG_Goku (404), GMWSO (404), 
 *          DanielNaroditsky (rarely on Lichess), lachesisQ (inactive)
 */
const LICHESS_TOP_PLAYERS = [
  // TIER 1: Super GMs with verified high activity
  "DrNykterstein", "nihalsarin2004", "penguingm1", "Msb2", "Fins",
  "TemurKuybokarov", "Zhigalko_Sergei", "DrDrunkenstein", "Firouzja2003",
  "Alireza2003", "BogdanDeac", "RaunakSadhwani2005", "Arjun_Erigaisi",
  
  // TIER 2: Active titled players
  "chessbrah", "opperwezen", "EricRosen", "ChessNetwork", "GM_Srinath",
  "Oleksandr_Bortnyk", "chesswarrior7197", "SethiChess", "duhless",
  "howitzer14", "rajabboy", "Jospem", "lance5500", "Navaraok",
  "Nodirbek2004", "VincentKeymer2004", "WesleyS8", "NeverEnough",
  
  // TIER 3: Known active accounts
  "lovlas", "nepoking", "BakhtiyarIbadov", "Andrej_Esipenko",
  "Naroditsky", "GMSrinathNarayanan", "alexandrpredke", "Fenrisulfur",
  "greennight", "KontraJaKO", "NameTheGame", "SindarovGM", "skif134",
  "Iwasinelectrical", "dimochka_tsoi", "tornike_sanikidze", "S2Pac",
  "wonderfultime", "may6enexttime", "Saintlaurent", "neslansen",
  "defenceboy1", "dalmatinac101", "Erow", "Chesssknock", "Chess4ever"
];

export interface FetchOptions {
  targetCount: number;
  batchNumber: number;
  excludeIds?: Set<string>;
  sources?: ('lichess' | 'chesscom')[];
}

export interface FetchResult {
  games: UnifiedGameData[];
  lichessCount: number;
  chesscomCount: number;
  errors: string[];
}

/**
 * Extract moves from PGN string
 * v6.53: Critical for Chess.com games which only have PGN
 */
function extractMovesFromPgn(pgn: string): string {
  // Remove headers (lines starting with [)
  const lines = pgn.split('\n');
  const moveLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) continue;
    if (trimmed.length === 0) continue;
    moveLines.push(trimmed);
  }
  
  const movesStr = moveLines.join(' ');
  
  // Remove result at end (1-0, 0-1, 1/2-1/2, *)
  const cleaned = movesStr
    .replace(/1-0\s*$/, '')
    .replace(/0-1\s*$/, '')
    .replace(/1\/2-1\/2\s*$/, '')
    .replace(/\*\s*$/, '')
    .trim();
  
  return cleaned;
}

/**
 * Convert Chess.com game to unified format
 * v6.53: Now extracts moves from PGN for reliable processing
 */
function chesscomToUnified(game: ChessComGame, username: string): UnifiedGameData | null {
  // v6.57-ID-ONLY: Only require a URL/ID exists - absorb everything else
  // Extract game ID from URL: https://www.chess.com/game/live/123456789
  const urlMatch = game.url?.match(/\/(\d+)$/);
  if (!urlMatch) return null; // Must have valid game ID
  const gameId = `cc_${urlMatch[1]}`;
  
  // v6.57: Extract moves - handle empty PGN gracefully
  const moves = game.pgn ? extractMovesFromPgn(game.pgn) : '';
  
  // Determine winner
  let winner: 'white' | 'black' | undefined;
  if (game.white.result === 'win') winner = 'white';
  else if (game.black.result === 'win') winner = 'black';
  
  const result = getChessComResult(game);
  
  // Extract time control category
  let speed = game.time_class || 'unknown';
  
  return {
    pgn: game.pgn || '',  // v6.57: Allow empty PGN
    moves,  // v6.57: May be empty - universal intelligence handles
    gameId,
    source: 'chesscom',
    winner,
    status: game.white.result === 'checkmated' || game.black.result === 'checkmated' ? 'mate' : 
            game.white.result === 'resigned' || game.black.result === 'resigned' ? 'resign' :
            game.white.result === 'timeout' || game.black.result === 'timeout' ? 'timeout' : 
            result === '1/2-1/2' ? 'draw' : 'unknown',
    result,
    whiteName: game.white.username,
    blackName: game.black.username,
    whiteElo: game.white.rating,
    blackElo: game.black.rating,
    timeControl: game.time_control,
    speed,
    rated: game.rated,
    playedAt: new Date(game.end_time * 1000).toISOString(),
    gameYear: new Date(game.end_time * 1000).getFullYear(),
    gameMonth: new Date(game.end_time * 1000).getMonth() + 1,
    termination: game.white.result || game.black.result,
  };
}

/**
 * Fetch games from Chess.com - HIGH VOLUME
 * v6.47: Parallel player fetching + higher limits
 */
async function fetchFromChessCom(
  targetCount: number,
  batchNumber: number,
  excludeIds: Set<string>
): Promise<{ games: UnifiedGameData[]; errors: string[] }> {
  const games: UnifiedGameData[] = [];
  const errors: string[] = [];
  const localIds = new Set<string>();
  
  // v6.47: Higher volume - more players, more months
  const startOffset = (batchNumber * 7) % CHESSCOM_TOP_PLAYERS.length;
  const shuffledPlayers = [
    ...CHESSCOM_TOP_PLAYERS.slice(startOffset), 
    ...CHESSCOM_TOP_PLAYERS.slice(0, startOffset)
  ].sort(() => Math.random() - 0.5);
  
  console.log(`[ChessCom] Batch ${batchNumber}: Targeting ${targetCount} games from ${shuffledPlayers.slice(0, 8).join(', ')}...`);
  
  // v6.47: Fetch from more players in PARALLEL
  const maxPlayers = Math.min(20, shuffledPlayers.length);
  const gamesPerPlayer = Math.ceil(targetCount / 4);
  const monthsToFetch = 12 + (batchNumber * 2); // v6.47: More history as batches progress
  
  // v6.47: Parallel fetching - split into chunks of 4
  const playerChunks: string[][] = [];
  for (let i = 0; i < maxPlayers; i += 4) {
    playerChunks.push(shuffledPlayers.slice(i, i + 4));
  }
  
  for (const chunk of playerChunks) {
    if (games.length >= targetCount) break;
    
    // v6.47: Fetch chunk in parallel
    const chunkPromises = chunk.map(async (player) => {
      try {
        const result = await fetchChessComGames(player, { 
          max: gamesPerPlayer,
          months: monthsToFetch
        });
        return { player, result };
      } catch (e) {
        return { player, error: e instanceof Error ? e.message : 'Unknown error' };
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    
    for (const res of chunkResults) {
      if ('error' in res) {
        errors.push(`[ChessCom ${res.player}] ${res.error}`);
        continue;
      }
      
      const { player, result } = res;
      
      if (result.errors.length > 0) {
        errors.push(...result.errors.map(e => `[ChessCom ${player}] ${e}`));
      }
      
      let addedFromPlayer = 0;
      for (const game of result.games) {
        const unified = chesscomToUnified(game, player);
        if (!unified) continue;
        if (excludeIds.has(unified.gameId)) continue;
        if (localIds.has(unified.gameId)) continue;
        
        localIds.add(unified.gameId);
        games.push(unified);
        addedFromPlayer++;
        
        if (games.length >= targetCount) break;
      }
      
      if (addedFromPlayer > 0) {
        console.log(`[ChessCom] ✓ ${player}: +${addedFromPlayer} games`);
      }
    }
    
    // Small delay between chunks to be respectful
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`[ChessCom] Batch complete: ${games.length} games`);
  return { games, errors };
}

/**
 * Fetch games from Lichess (via Edge Function) - HIGH VOLUME
 * v6.59-VERIFIED-POOL: Smart time windows focused on recent high-activity periods
 */
async function fetchFromLichess(
  targetCount: number,
  batchNumber: number,
  excludeIds: Set<string>
): Promise<{ games: UnifiedGameData[]; errors: string[] }> {
  const games: UnifiedGameData[] = [];
  const errors: string[] = [];
  const localIds = new Set<string>();
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  // v6.59: Deterministic rotation to maximize coverage
  const startOffset = (batchNumber * 13) % LICHESS_TOP_PLAYERS.length;
  const shuffledPlayers = [
    ...LICHESS_TOP_PLAYERS.slice(startOffset),
    ...LICHESS_TOP_PLAYERS.slice(0, startOffset)
  ];
  
  console.log(`[Lichess v6.59] Batch ${batchNumber}: Verified pool (${LICHESS_TOP_PLAYERS.length} players)`);
  console.log(`[Lichess v6.59] First 6: ${shuffledPlayers.slice(0, 6).join(', ')}`);
  
  // v6.59: Process more players but with smarter windows
  const maxPlayers = Math.min(30, shuffledPlayers.length);
  const gamesPerPlayer = 20; // Fixed request size
  let rateLimitHits = 0;
  let backoffMs = 800;
  
  // v6.59: Chunks of 3 for better throughput
  const playerChunks: string[][] = [];
  for (let i = 0; i < maxPlayers; i += 3) {
    playerChunks.push(shuffledPlayers.slice(i, i + 3));
  }
  
  for (const chunk of playerChunks) {
    if (games.length >= targetCount) break;
    if (rateLimitHits >= 3) {
      const waitTime = Math.min(backoffMs * Math.pow(1.5, rateLimitHits), 20000);
      console.warn(`[Lichess v6.59] Rate limit backoff: ${waitTime}ms`);
      await new Promise(r => setTimeout(r, waitTime));
      rateLimitHits = 0;
    }
    
    // v6.59-SMART-WINDOWS: Focus on 2022-2025 where activity is highest
    const chunkPromises = chunk.map(async (player, idx) => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      // v6.59: Target recent high-activity windows (last 3 years primarily)
      // Use batch number to explore different time slices
      const yearOffset = batchNumber % 4; // Cycle through 0-3 years back
      const monthOffset = (batchNumber + idx) % 12; // Different months
      const baseDaysBack = yearOffset * 365 + monthOffset * 30 + Math.floor(Math.random() * 30);
      const windowDuration = 60 + Math.floor(Math.random() * 60); // 2-4 months
      const until = now - (baseDaysBack * oneDay);
      const since = until - (windowDuration * oneDay);
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/lichess-games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({ player, since, until, max: gamesPerPlayer })
        });
        
        if (response.status === 429) {
          return { player, rateLimit: true };
        }
        
        if (!response.ok) {
          return { player, error: `HTTP ${response.status}` };
        }
        
        const data = await response.json();
        return { player, games: data.games || [] };
      } catch (e) {
        return { player, error: e instanceof Error ? e.message : 'Unknown error' };
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    
    for (const res of chunkResults) {
      if ('rateLimit' in res && res.rateLimit) {
        rateLimitHits++;
        backoffMs = Math.min(backoffMs * 1.5, 10000); // Increase backoff
        errors.push(`[Lichess ${res.player}] Rate limited (backoff: ${backoffMs}ms)`);
        continue;
      }
      
      if ('error' in res) {
        errors.push(`[Lichess ${res.player}] ${res.error}`);
        continue;
      }
      
      const { player, games: fetchedGames } = res;
      
      let addedFromPlayer = 0;
      for (const game of fetchedGames) {
        const lichessId = game.id;
        // v6.57-ID-ONLY: Only require an ID exists - absorb everything else
        if (!lichessId) continue;
        
        const gameId = `li_${lichessId}`;
        
        // v6.57: Only deduplication filter - no content filters
        if (excludeIds.has(gameId) || excludeIds.has(lichessId)) continue;
        if (localIds.has(gameId)) continue;
        
        const pgn = game.pgn || game.moves || '';
        // v6.57: ABSORB EVERYTHING - universal intelligence handles edge cases
        
        localIds.add(gameId);
        
        games.push({
          pgn,
          moves: game.moves,
          gameId,
          source: 'lichess',
          winner: game.winner,
          status: game.status,
          result: game.result,
          whiteName: game.whiteName,
          blackName: game.blackName,
          whiteElo: game.whiteElo,
          blackElo: game.blackElo,
          timeControl: game.timeControl,
          speed: game.speed,
          rated: game.rated,
          playedAt: game.playedAt,
          gameYear: game.gameYear,
          gameMonth: game.gameMonth,
          openingEco: game.openingEco,
          openingName: game.openingName,
          termination: game.status || game.termination,
        });
        addedFromPlayer++;
        
        if (games.length >= targetCount) break;
      }
      
      if (addedFromPlayer > 0) {
        console.log(`[Lichess] ✓ ${player}: +${addedFromPlayer} games`);
        rateLimitHits = 0;
        backoffMs = Math.max(backoffMs * 0.8, 1000); // Reduce backoff on success
      }
    }
    
    // v6.54: Adaptive delay - longer after rate limits
    const chunkDelay = rateLimitHits > 0 ? 2000 : 1200;
    await new Promise(r => setTimeout(r, chunkDelay));
  }
  
  console.log(`[Lichess] Batch complete: ${games.length} games`);
  return { games, errors };
}

/**
 * Fetch games from multiple sources in parallel
 */
export async function fetchMultiSourceGames(options: FetchOptions): Promise<FetchResult> {
  const { targetCount, batchNumber, excludeIds = new Set(), sources = ['lichess', 'chesscom'] } = options;
  
  console.log(`[MultiSource] ========== BATCH ${batchNumber} ==========`);
  console.log(`[MultiSource] Target: ${targetCount} games from ${sources.join(' + ')}`);
  console.log(`[MultiSource] Excluded IDs: ${excludeIds.size}`);
  
  const halfTarget = Math.ceil(targetCount / 2);
  const results: { games: UnifiedGameData[]; errors: string[] }[] = [];
  
  // Fetch from both sources in parallel
  const fetchPromises: Promise<{ games: UnifiedGameData[]; errors: string[] }>[] = [];
  
  if (sources.includes('lichess')) {
    fetchPromises.push(fetchFromLichess(halfTarget, batchNumber, excludeIds));
  }
  
  if (sources.includes('chesscom')) {
    fetchPromises.push(fetchFromChessCom(halfTarget, batchNumber, excludeIds));
  }
  
  const fetchResults = await Promise.all(fetchPromises);
  
  // Combine results
  let allGames: UnifiedGameData[] = [];
  let allErrors: string[] = [];
  let lichessCount = 0;
  let chesscomCount = 0;
  
  for (const result of fetchResults) {
    allGames = [...allGames, ...result.games];
    allErrors = [...allErrors, ...result.errors];
    
    // Count by source
    for (const game of result.games) {
      if (game.source === 'lichess') lichessCount++;
      if (game.source === 'chesscom') chesscomCount++;
    }
  }
  
  // Shuffle combined games
  allGames = allGames.sort(() => Math.random() - 0.5);
  
  console.log(`[MultiSource] RESULT: ${allGames.length} total (Lichess: ${lichessCount}, Chess.com: ${chesscomCount})`);
  
  return {
    games: allGames,
    lichessCount,
    chesscomCount,
    errors: allErrors
  };
}

/**
 * Get statistics about available game sources
 */
export function getSourceStats() {
  return {
    lichess: {
      playerCount: LICHESS_TOP_PLAYERS.length,
      estimatedGamesPerPlayer: 5000, // Conservative estimate
      totalEstimated: LICHESS_TOP_PLAYERS.length * 5000,
    },
    chesscom: {
      playerCount: CHESSCOM_TOP_PLAYERS.length,
      estimatedGamesPerPlayer: 3000, // Conservative estimate  
      totalEstimated: CHESSCOM_TOP_PLAYERS.length * 3000,
    },
    combined: {
      totalPlayers: LICHESS_TOP_PLAYERS.length + CHESSCOM_TOP_PLAYERS.length,
      totalEstimated: (LICHESS_TOP_PLAYERS.length * 5000) + (CHESSCOM_TOP_PLAYERS.length * 3000),
    }
  };
}
