/**
 * Multi-Source Game Fetcher v6.87-DYNAMIC-LEADERBOARD
 * VERSION: 6.87-DYNAMIC-LEADERBOARD (2026-01-21)
 * 
 * v6.87 CHANGES (Dynamic Leaderboard Sourcing):
 * - NEW: Fetches live top players from Lichess leaderboards
 * - Pulls from daily/weekly rankings across bullet, blitz, rapid, classical
 * - Combines dynamic leaderboard players with static verified pool
 * - Constantly refreshing source of high-caliber players
 * 
 * v6.86 CHANGES (Rate Limit Patience):
 * - WAIT, DON'T BREAK: When rate limited, WAIT for cooldown then resume
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
 * v6.59-VERIFIED-POOL: Static fallback pool of verified active Lichess accounts
 * Used when leaderboard fetch fails or as supplement
 */
const LICHESS_FALLBACK_PLAYERS = [
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

// Cache for leaderboard players (refreshed every 30 minutes)
let cachedLeaderboardPlayers: string[] = [];
let leaderboardCacheTime = 0;
const LEADERBOARD_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * v6.87-DYNAMIC-LEADERBOARD: Fetch live top players from Lichess leaderboards
 * Returns players across bullet, blitz, rapid, classical rankings
 */
async function fetchLeaderboardPlayers(): Promise<string[]> {
  // Check cache first
  if (cachedLeaderboardPlayers.length > 0 && Date.now() - leaderboardCacheTime < LEADERBOARD_CACHE_TTL) {
    console.log(`[v6.87] Using cached leaderboard: ${cachedLeaderboardPlayers.length} players`);
    return cachedLeaderboardPlayers;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    console.log(`[v6.87] Fetching live leaderboard players...`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/lichess-leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        perfTypes: ['bullet', 'blitz', 'rapid', 'classical'],
        count: 50 // Top 50 from each mode
      })
    });

    if (!response.ok) {
      console.warn(`[v6.87] Leaderboard fetch failed: ${response.status}`);
      return LICHESS_FALLBACK_PLAYERS;
    }

    const data = await response.json();
    
    if (data.players && Array.isArray(data.players)) {
      const players = data.players.map((p: { username: string }) => p.username);
      console.log(`[v6.87] ✓ Leaderboard: ${players.length} live players (${data.perfTypes?.join(', ')})`);
      
      // Update cache
      cachedLeaderboardPlayers = players;
      leaderboardCacheTime = Date.now();
      
      return players;
    }
  } catch (e) {
    console.warn(`[v6.87] Leaderboard error:`, e);
  }

  // Fallback to static pool
  console.log(`[v6.87] Using fallback pool: ${LICHESS_FALLBACK_PLAYERS.length} players`);
  return LICHESS_FALLBACK_PLAYERS;
}

/**
 * v6.87: Get combined player pool - leaderboard + verified fallback
 * Ensures we always have a robust set of players
 */
async function getLichessPlayerPool(): Promise<string[]> {
  const leaderboardPlayers = await fetchLeaderboardPlayers();
  
  // Combine leaderboard with fallback, removing duplicates
  const combined = new Set<string>();
  
  // Add leaderboard players first (prioritized)
  for (const p of leaderboardPlayers) {
    combined.add(p);
  }
  
  // Add fallback players
  for (const p of LICHESS_FALLBACK_PLAYERS) {
    combined.add(p);
  }
  
  const pool = Array.from(combined);
  console.log(`[v6.87] Combined pool: ${pool.length} players (${leaderboardPlayers.length} from leaderboard)`);
  return pool;
}

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
  
  // v6.73-WINDOW-ISOLATION: Prime-based rotation for player coverage
  // But sequential window isolation for time periods
  const startOffset = (batchNumber * 11) % CHESSCOM_TOP_PLAYERS.length;
  const shuffledPlayers = [
    ...CHESSCOM_TOP_PLAYERS.slice(startOffset), 
    ...CHESSCOM_TOP_PLAYERS.slice(0, startOffset)
  ];
  
  console.log(`[ChessCom v6.73] Batch ${batchNumber}: Targeting ${targetCount} games from ${shuffledPlayers.slice(0, 8).join(', ')}...`);
  
  // v6.73-WINDOW-ISOLATION: Sequential non-overlapping month windows
  // Each batch explores different historical period
  const maxPlayers = Math.min(20, shuffledPlayers.length);
  const gamesPerPlayer = Math.ceil(targetCount / 4);
  // v6.73: Sequential months - batch 1 = last 3 months, batch 2 = 3-6 months ago, etc.
  const monthsStart = (batchNumber - 1) * 3;
  const monthsToFetch = 3; // 3-month windows
  
  // v6.47: Parallel fetching - split into chunks of 4
  const playerChunks: string[][] = [];
  for (let i = 0; i < maxPlayers; i += 4) {
    playerChunks.push(shuffledPlayers.slice(i, i + 4));
  }
  
  for (const chunk of playerChunks) {
    if (games.length >= targetCount) break;
    
    // v6.73: Fetch chunk in parallel with window offset
    const chunkPromises = chunk.map(async (player) => {
      try {
        // v6.73-WINDOW-ISOLATION: Pass month offset to explore sequential periods
        const result = await fetchChessComGames(player, { 
          max: gamesPerPlayer,
          months: monthsToFetch,
          monthOffset: monthsStart // Skip first N months to get different window
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
        // v6.84-ABSORB-ALL: Accept ANY game with a valid ID
        // Opponents can be anyone - we want their games too!
        const unified = chesscomToUnified(game, player);
        if (!unified) continue; // Only fails if no game ID extractable
        if (excludeIds.has(unified.gameId)) continue;
        if (localIds.has(unified.gameId)) continue;
        
        // v6.84: Zero player/rating/content filtering - absorb everything
        localIds.add(unified.gameId);
        games.push(unified);
        addedFromPlayer++;
        
        if (games.length >= targetCount) break;
      }
      
      if (addedFromPlayer > 0) {
        console.log(`[ChessCom] ✓ ${player}: +${addedFromPlayer} games`);
      }
    }
    
    // v6.80-PATIENT: Respectful delay between chunks
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`[ChessCom] Batch complete: ${games.length} games`);
  return { games, errors };
}

/**
 * Fetch games from Lichess (via Edge Function) - HIGH VOLUME
 * v6.67-RATELIMIT-MEMORY: Respects server-side rate limit memory
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
  
  // v6.67: Client-side rate limit tracking to avoid spamming during cooldown
  let serverRateLimited = false;
  let serverResetMs = 0;
  
  // v6.87-DYNAMIC-LEADERBOARD: Get combined pool from live leaderboard + fallback
  const playerPool = await getLichessPlayerPool();
  
  // v6.62: Prime-based rotation to maximize player coverage
  const startOffset = (batchNumber * 17) % playerPool.length;
  const shuffledPlayers = [
    ...playerPool.slice(startOffset),
    ...playerPool.slice(0, startOffset)
  ];
  
  console.log(`[Lichess v6.87] Batch ${batchNumber}: Dynamic pool (${playerPool.length} players)`);
  console.log(`[Lichess v6.87] First 6: ${shuffledPlayers.slice(0, 6).join(', ')}`);
  console.log(`[Lichess v6.87] Window: ${(batchNumber - 1) * 60}-${batchNumber * 60} days ago (isolated)`);
  
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
    
    // v6.86-PATIENT-WAIT: If server is rate limited, WAIT for cooldown then continue
    // Previously this would BREAK, losing all remaining player fetches
    // Now we patiently wait and resume - every game matters!
    if (serverRateLimited && serverResetMs > 0) {
      const waitSec = Math.ceil(serverResetMs / 1000);
      console.warn(`[Lichess v6.86] Rate limited - WAITING ${waitSec}s then resuming (not breaking!)`);
      errors.push(`[Lichess] Rate limit pause: ${waitSec}s (will resume)`);
      
      // WAIT for the full cooldown period
      await new Promise(r => setTimeout(r, serverResetMs + 2000)); // +2s safety margin
      
      // Reset rate limit state after waiting
      serverRateLimited = false;
      serverResetMs = 0;
      rateLimitHits = 0;
      backoffMs = 3000; // Reset to conservative backoff
      console.log(`[Lichess v6.86] Cooldown complete - resuming fetches`);
    }
    
    if (rateLimitHits >= 3) {
      const waitTime = Math.min(backoffMs * Math.pow(1.5, rateLimitHits), 30000);
      console.warn(`[Lichess v6.86] Backoff wait: ${Math.ceil(waitTime/1000)}s`);
      await new Promise(r => setTimeout(r, waitTime));
      rateLimitHits = 0;
    }
    
    // v6.73-WINDOW-ISOLATION: Strictly non-overlapping windows per batch
    const chunkPromises = chunk.map(async (player) => {
      // v6.86: Don't skip - we've already waited if needed
      
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      // v6.73-WINDOW-ISOLATION: Sequential non-overlapping windows
      // Window duration is fixed - each batch advances by this amount
      // This guarantees no overlap between batches, maximizing unique game yield
      const windowDuration = 60; // 60-day fixed windows
      const playerOffset = (player.charCodeAt(0) % 10); // 0-9 days per-player offset
      
      // CRITICAL: batchNumber directly controls window position
      // Batch 1: 0-60 days ago, Batch 2: 60-120 days ago, etc.
      const baseDaysBack = (batchNumber - 1) * windowDuration + playerOffset;
      const until = now - (baseDaysBack * oneDay);
      const since = until - (windowDuration * oneDay);
      
      console.log(`[v6.73] ${player}: Window ${batchNumber} → ${Math.round(baseDaysBack)}-${Math.round(baseDaysBack + windowDuration)} days ago`);
      
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
          // v6.67: Parse the server's rate limit response
          try {
            const data = await response.json();
            if (data.resetInMs) {
              serverRateLimited = true;
              serverResetMs = data.resetInMs;
            }
          } catch { /* ignore parse errors */ }
          return { player, rateLimit: true, resetMs: serverResetMs };
        }
        
        if (!response.ok) {
          return { player, error: `HTTP ${response.status}` };
        }
        
        const data = await response.json();
        
        // v6.67: Check if response indicates rate limiting even with 200 status
        if (data.rateLimited && data.resetInMs) {
          serverRateLimited = true;
          serverResetMs = data.resetInMs;
          return { player, rateLimit: true, resetMs: serverResetMs };
        }
        
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
        const resetInfo = 'resetMs' in res ? ` (server cooldown: ${Math.ceil((res.resetMs || 0) / 1000)}s)` : '';
        errors.push(`[Lichess ${res.player}] Rate limited${resetInfo}`);
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
        // v6.84-ABSORB-ALL: ONLY requirement is a valid game ID
        // Accept ALL games regardless of player names/ratings/etc.
        // The opponent could be anyone - we want their games too!
        if (!lichessId) continue;
        
        const gameId = `li_${lichessId}`;
        
        // v6.84: ONLY deduplication - no player/rating/content filtering
        // Fresh ID = fresh game, period.
        if (excludeIds.has(gameId) || excludeIds.has(lichessId)) continue;
        if (localIds.has(gameId)) continue;
        
        const pgn = game.pgn || game.moves || '';
        // v6.84-ABSORB-ALL: Zero content filters - universal intelligence handles everything
        
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
        console.log(`[Lichess v6.86] ✓ ${player}: +${addedFromPlayer} games`);
        rateLimitHits = 0;
        backoffMs = Math.max(backoffMs * 0.9, 2000); // Reduce backoff on success
      }
    }
    
    // v6.86-PATIENT: Generous delay between chunks to avoid rate limits
    const chunkDelay = rateLimitHits > 0 ? 10000 : 4000; // 10s after issues, 4s normally
    console.log(`[v6.86-PATIENT] Waiting ${chunkDelay/1000}s before next chunk...`);
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
 * v6.87: Now includes dynamic leaderboard info
 */
export function getSourceStats() {
  const lichessPoolSize = cachedLeaderboardPlayers.length > 0 
    ? cachedLeaderboardPlayers.length + LICHESS_FALLBACK_PLAYERS.length 
    : LICHESS_FALLBACK_PLAYERS.length;
    
  return {
    lichess: {
      playerCount: lichessPoolSize,
      leaderboardPlayers: cachedLeaderboardPlayers.length,
      fallbackPlayers: LICHESS_FALLBACK_PLAYERS.length,
      estimatedGamesPerPlayer: 5000,
      totalEstimated: lichessPoolSize * 5000,
    },
    chesscom: {
      playerCount: CHESSCOM_TOP_PLAYERS.length,
      estimatedGamesPerPlayer: 3000,
      totalEstimated: CHESSCOM_TOP_PLAYERS.length * 3000,
    },
    combined: {
      totalPlayers: lichessPoolSize + CHESSCOM_TOP_PLAYERS.length,
      totalEstimated: (lichessPoolSize * 5000) + (CHESSCOM_TOP_PLAYERS.length * 3000),
    }
  };
}

/**
 * Force refresh the leaderboard cache
 */
export async function refreshLeaderboardCache(): Promise<number> {
  leaderboardCacheTime = 0; // Force cache invalidation
  const players = await fetchLeaderboardPlayers();
  return players.length;
}
