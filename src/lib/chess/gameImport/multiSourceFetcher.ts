/**
 * Multi-Source Game Fetcher v1.0
 * Aggregates games from multiple chess platforms for benchmark testing
 * 
 * SOURCES:
 * - Lichess (via Edge Function proxy)
 * - Chess.com (public API - no token needed)
 * 
 * This effectively DOUBLES the available game pool and reduces
 * dependency on any single API's rate limits.
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
 * Convert Chess.com game to unified format
 */
function chesscomToUnified(game: ChessComGame, username: string): UnifiedGameData | null {
  if (!game.pgn || game.pgn.length < 50) return null;
  
  // Extract game ID from URL: https://www.chess.com/game/live/123456789
  const urlMatch = game.url?.match(/\/(\d+)$/);
  const gameId = urlMatch ? `cc_${urlMatch[1]}` : `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Determine winner
  let winner: 'white' | 'black' | undefined;
  if (game.white.result === 'win') winner = 'white';
  else if (game.black.result === 'win') winner = 'black';
  
  const result = getChessComResult(game);
  
  // Extract time control category
  let speed = game.time_class || 'unknown';
  
  return {
    pgn: game.pgn,
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
 * Fetch games from Chess.com
 */
async function fetchFromChessCom(
  targetCount: number,
  batchNumber: number,
  excludeIds: Set<string>
): Promise<{ games: UnifiedGameData[]; errors: string[] }> {
  const games: UnifiedGameData[] = [];
  const errors: string[] = [];
  const localIds = new Set<string>();
  
  // Shuffle players with batch-based offset
  const startOffset = (batchNumber * 7) % CHESSCOM_TOP_PLAYERS.length;
  const shuffledPlayers = [
    ...CHESSCOM_TOP_PLAYERS.slice(startOffset), 
    ...CHESSCOM_TOP_PLAYERS.slice(0, startOffset)
  ].sort(() => Math.random() - 0.5);
  
  console.log(`[ChessCom] Batch ${batchNumber}: Fetching from ${shuffledPlayers.slice(0, 5).join(', ')}...`);
  
  let playersQueried = 0;
  const maxPlayers = Math.min(10, shuffledPlayers.length);
  
  for (const player of shuffledPlayers) {
    if (games.length >= targetCount || playersQueried >= maxPlayers) break;
    playersQueried++;
    
    // Rate limiting - Chess.com is generous but let's be respectful
    await new Promise(r => setTimeout(r, 500));
    
    try {
      const result = await fetchChessComGames(player, { 
        max: Math.ceil(targetCount / 3),
        months: 6 + batchNumber // Vary months based on batch for diversity
      });
      
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`[ChessCom ${player}] ${msg}`);
    }
  }
  
  console.log(`[ChessCom] Batch complete: ${games.length} games from ${playersQueried} players`);
  return { games, errors };
}

/**
 * Fetch games from Lichess (via Edge Function)
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
  
  // Shuffle players
  const startOffset = (batchNumber * 13) % LICHESS_TOP_PLAYERS.length;
  const shuffledPlayers = [
    ...LICHESS_TOP_PLAYERS.slice(startOffset),
    ...LICHESS_TOP_PLAYERS.slice(0, startOffset)
  ].sort(() => Math.random() - 0.5);
  
  console.log(`[Lichess] Batch ${batchNumber}: Fetching from ${shuffledPlayers.slice(0, 5).join(', ')}...`);
  
  let playersQueried = 0;
  let rateLimitCount = 0;
  const maxPlayers = Math.min(15, shuffledPlayers.length);
  const gamesPerPlayer = Math.ceil(targetCount / 3);
  
  for (const player of shuffledPlayers) {
    if (games.length >= targetCount || playersQueried >= maxPlayers) break;
    playersQueried++;
    
    // Rate limit handling
    if (rateLimitCount >= 2) {
      console.warn(`[Lichess] Rate limited, waiting 10s...`);
      await new Promise(r => setTimeout(r, 10000));
      rateLimitCount = 0;
    }
    
    await new Promise(r => setTimeout(r, 1200));
    
    // Random time window
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const daysBack = (batchNumber * 17 + playersQueried * 7 + Math.floor(Math.random() * 50)) * 20;
    const windowDuration = 30 + Math.floor(Math.random() * 60);
    const until = now - (daysBack * oneDay);
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
        rateLimitCount++;
        errors.push(`[Lichess ${player}] Rate limited`);
        continue;
      }
      
      if (!response.ok) {
        errors.push(`[Lichess ${player}] HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const fetchedGames = data.games || [];
      
      let addedFromPlayer = 0;
      for (const game of fetchedGames) {
        const lichessId = game.id;
        if (!lichessId || lichessId.length !== 8) continue;
        
        const gameId = `li_${lichessId}`;
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
        rateLimitCount = 0;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`[Lichess ${player}] ${msg}`);
    }
  }
  
  console.log(`[Lichess] Batch complete: ${games.length} games from ${playersQueried} players`);
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
