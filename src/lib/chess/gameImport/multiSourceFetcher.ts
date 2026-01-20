/**
 * Multi-Source Game Fetcher v2.0 - HIGH VOLUME
 * VERSION: 6.53-BULLETPROOF (2026-01-20)
 * 
 * v6.53 CHANGES:
 * - Extract moves from Chess.com PGN for reliable parsing
 * - Better validation to ensure games have usable content
 * - Improved logging for debugging fetch issues
 * 
 * v6.52 CHANGES:
 * - Improved ID validation to handle both prefixed and raw IDs
 * - Better error logging for filtered games
 * - Ensures valid games aren't filtered incorrectly
 * 
 * v6.47 CHANGES:
 * - PARALLEL FETCHING: Fetch from 3-4 players simultaneously per chunk
 * - DEEPER HISTORY: Go back years (not weeks) for fresh games
 * - HIGHER LIMITS: 20+ players per source, 12+ months of archives
 * - FASTER BATCHES: Reduced inter-request delays
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

// Chess.com top players (active, high-rated)
const CHESSCOM_TOP_PLAYERS = [
  "Hikaru", "MagnusCarlsen", "nihalsarin", "FabianoCaruana", "LevonAronian",
  "Firouzja2003", "DanielNaroditsky", "GothamChess", "AnishGiri", "WesleySo",
  "Praggnanandhaa", "DominguezPerez", "Grischuk", "JanNepomniachtchi", "MVL",
  "BogdanDeac", "RichardRapport", "VladimirFedoseev", "AlirezaFirouzja", "Duda",
  "Caruana", "Nepo", "VladKramnik", "SergeyKarjakin", "IanNepomniachtchi",
  "chess24", "DrNykterstein", "HansNiemann", "EricRosen", "BotezLive"
];

// Lichess top players (from existing system)
const LICHESS_TOP_PLAYERS = [
  "DrNykterstein", "Hikaru", "nihalsarin2004", "GMWSO", "LyonBeast",
  "Polish_fighter3000", "Msb2", "penguingm1", "DanielNaroditsky", 
  "EricRosen", "Fins", "chessbrah", "opperwezen", "BogdanDeac",
  "Arjun_Erigaisi", "RaunakSadhwani2005", "TemurKuybokarov",
  "Zhigalko_Sergei", "ChessNetwork", "DrDrunkenstein", "Firouzja2003",
  "GM_Srinath", "Oleksandr_Bortnyk", "FabianoCaruana", "LevonAronian",
  "chesswarrior7197", "MagnusCarlsen", "AnishGiri", "VladimirKramnik",
  "SethiChess", "duhless", "howitzer14", "rajabboy", "Jospem", "Alireza2003",
  "lance5500", "Navaraok", "Nodirbek2004", "VincentKeymer2004", "WesleyS8",
  "DrMikeLikesChess", "gmrobinsonelwog", "NeverEnough", "pengcheng2004",
  "Svidler", "lovlas", "alireza2006", "taniasachdev", "JW_Praggnanandhaa",
  "nepoking", "BakhtiyarIbadov", "RockingGuyMD", "Vladimiro_Kramnik",
  "Judit_Polgar", "VisualDennis", "GMVallejo", "Andrej_Esipenko", "DanielFridman",
  "kirthibhat", "Naroditsky", "GMSrinathNarayanan", "alexandrpredke",
  "Vladimirovich9000", "der_kaufmann", "Fenrisulfur", "greennight",
  "KontraJaKO", "NameTheGame", "chessm1105", "Esssquire", "SindarovGM",
  "skif134", "Iwasinelectrical", "dimochka_tsoi", "tornike_sanikidze", "S2Pac",
  "wonderfultime", "may6enexttime", "AidenCohen", "Saintlaurent",
  "neslansen", "AZETADINE", "WONDERBOY1776", "wonderfultime2",
  "lachesisQ", "GenghisConn", "SuperGM_Ruslan", "DrTancredi", "Chess4ever"
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
  if (!game.pgn || game.pgn.length < 50) return null;
  
  // Extract game ID from URL: https://www.chess.com/game/live/123456789
  const urlMatch = game.url?.match(/\/(\d+)$/);
  const gameId = urlMatch ? `cc_${urlMatch[1]}` : `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // v6.53: Extract moves from PGN for reliable parsing
  const moves = extractMovesFromPgn(game.pgn);
  
  // Determine winner
  let winner: 'white' | 'black' | undefined;
  if (game.white.result === 'win') winner = 'white';
  else if (game.black.result === 'win') winner = 'black';
  
  const result = getChessComResult(game);
  
  // Extract time control category
  let speed = game.time_class || 'unknown';
  
  return {
    pgn: game.pgn,
    moves,  // v6.53: Now includes extracted moves
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
 * v6.47: Parallel player fetching + aggressive time windows
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
  
  // v6.47: More aggressive rotation with larger pool
  const startOffset = (batchNumber * 17) % LICHESS_TOP_PLAYERS.length;
  const shuffledPlayers = [
    ...LICHESS_TOP_PLAYERS.slice(startOffset),
    ...LICHESS_TOP_PLAYERS.slice(0, startOffset)
  ].sort(() => Math.random() - 0.5);
  
  console.log(`[Lichess] Batch ${batchNumber}: Targeting ${targetCount} games from ${shuffledPlayers.slice(0, 8).join(', ')}...`);
  
  // v6.47: Higher limits
  const maxPlayers = Math.min(25, shuffledPlayers.length);
  const gamesPerPlayer = Math.ceil(targetCount / 3);
  let rateLimitHits = 0;
  
  // v6.47: Parallel fetching in chunks of 3 (Lichess is more rate-limited)
  const playerChunks: string[][] = [];
  for (let i = 0; i < maxPlayers; i += 3) {
    playerChunks.push(shuffledPlayers.slice(i, i + 3));
  }
  
  for (const chunk of playerChunks) {
    if (games.length >= targetCount) break;
    if (rateLimitHits >= 3) {
      console.warn(`[Lichess] Too many rate limits, waiting 15s...`);
      await new Promise(r => setTimeout(r, 15000));
      rateLimitHits = 0;
    }
    
    // v6.47: Calculate unique time windows for each player in chunk
    const chunkPromises = chunk.map(async (player, idx) => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      // v6.47: Much deeper history - go back years, not just weeks
      const baseDaysBack = batchNumber * 60 + idx * 30 + Math.floor(Math.random() * 100);
      const windowDuration = 90 + Math.floor(Math.random() * 180); // 3-9 months
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
        errors.push(`[Lichess ${res.player}] Rate limited`);
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
        // v6.52: Validate Lichess IDs are 8 chars (standard format)
        if (!lichessId || lichessId.length !== 8) {
          continue;
        }
        
        const gameId = `li_${lichessId}`;
        
        // v6.52: Check both prefixed AND raw ID against excludeIds
        if (excludeIds.has(gameId) || excludeIds.has(lichessId)) continue;
        if (localIds.has(gameId)) continue;
        
        const pgn = game.pgn || game.moves;
        if (!pgn || pgn.length < 50) continue;
        
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
      }
    }
    
    // v6.47: Shorter delay between parallel chunks
    await new Promise(r => setTimeout(r, 800));
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
