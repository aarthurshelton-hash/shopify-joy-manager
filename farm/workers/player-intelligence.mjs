/**
 * Player Intelligence Module v1.0
 * 
 * Learns player-specific patterns from game metadata to improve predictions.
 * 
 * DIMENSIONS TRACKED:
 * 1. Per-player archetype tendencies (what patterns they play)
 * 2. Per-player EP accuracy (which players EP predicts well)
 * 3. Per-player platform behavior (Lichess vs Chess.com vs OTB)
 * 4. Per-player time control tendencies (bullet vs blitz vs rapid vs classical)
 * 5. Matchup dynamics (player A vs player B)
 * 6. Opening repertoire (ECO codes per player)
 * 7. Time-of-day patterns
 * 
 * DESIGN: Same multiplicative modifier pattern as fusion-intelligence.mjs.
 * At worst neutral (1.0), at best a meaningful boost/reduction.
 * 
 * Imported by: fusion-intelligence.mjs
 * Data fed by: ep-enhanced-worker, chess-db-ingest-worker
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_FILE = join(__dirname, '..', 'data', 'player-intelligence.json');
const MIN_GAMES_FOR_SIGNAL = 30;   // Need 30+ games to trust player-specific data
const MIN_GAMES_FOR_MATCHUP = 10;  // Need 10+ games for matchup data
const TOP_PLAYERS_LIMIT = 500;     // Track top 500 players by volume

// ═══════════════════════════════════════════════════════════
// IN-MEMORY PLAYER PROFILES
// ═══════════════════════════════════════════════════════════

let playerProfiles = {};  // { playerName: PlayerProfile }
let matchupData = {};     // { "white|black": MatchupProfile }
let platformStats = {};   // { platform: { accuracy, n } }
let lastRefresh = null;
let totalPlayersTracked = 0;

/**
 * @typedef {Object} PlayerProfile
 * @property {string} name
 * @property {number} totalGames
 * @property {number} hybridAccuracy - EP hybrid accuracy for this player's games
 * @property {number} sfAccuracy - Stockfish accuracy for this player's games
 * @property {Object} archetypes - { archetype: { n, correct, accuracy } }
 * @property {Object} platforms - { platform: { n, correct, accuracy } }
 * @property {Object} timeControls - { tc: { n, correct, accuracy } }
 * @property {Object} openings - { eco: { n, correct, accuracy } }
 * @property {Object} timeOfDay - { hour_bucket: { n, correct, accuracy } }
 * @property {string|null} title - GM, IM, FM, etc.
 * @property {number} avgElo
 */

// ═══════════════════════════════════════════════════════════
// LOAD/SAVE CACHE
// ═══════════════════════════════════════════════════════════

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      playerProfiles = data.playerProfiles || {};
      matchupData = data.matchupData || {};
      platformStats = data.platformStats || {};
      lastRefresh = data.lastRefresh || null;
      totalPlayersTracked = Object.keys(playerProfiles).length;
      return true;
    }
  } catch (e) { /* fresh start */ }
  return false;
}

function saveCache() {
  try {
    const dir = dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      playerProfiles,
      matchupData,
      platformStats,
      lastRefresh: new Date().toISOString(),
      totalPlayersTracked: Object.keys(playerProfiles).length,
    }, null, 0)); // No pretty-print to save space
  } catch (e) {
    console.log(`[PLAYER-INTEL] Cache save failed: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
// REFRESH FROM DATABASE
// ═══════════════════════════════════════════════════════════

/**
 * Refresh player intelligence from the database.
 * Aggregates player-specific accuracy data using efficient SQL.
 * 
 * @param {Function} queryFn - resilientQuery function from the worker
 */
export async function refreshPlayerIntelligence(queryFn) {
  const startTime = Date.now();
  console.log('[PLAYER-INTEL] Refreshing player intelligence from DB...');

  try {
    // 1. Per-player accuracy (top players by volume)
    const playerResult = await queryFn(`
      WITH player_games AS (
        SELECT 
          lesson_learned->>'white_player' as player,
          lesson_learned->>'white_title' as title,
          hybrid_archetype,
          hybrid_correct,
          stockfish_correct,
          enhanced_correct,
          time_control,
          lesson_learned->>'source' as platform,
          lesson_learned->>'eco' as eco,
          lesson_learned->>'time_of_day' as tod,
          white_elo as elo
        FROM chess_prediction_attempts
        WHERE lesson_learned->>'white_player' IS NOT NULL
          AND hybrid_correct IS NOT NULL
        UNION ALL
        SELECT 
          lesson_learned->>'black_player' as player,
          lesson_learned->>'black_title' as title,
          hybrid_archetype,
          hybrid_correct,
          stockfish_correct,
          enhanced_correct,
          time_control,
          lesson_learned->>'source' as platform,
          lesson_learned->>'eco' as eco,
          lesson_learned->>'time_of_day' as tod,
          black_elo as elo
        FROM chess_prediction_attempts
        WHERE lesson_learned->>'black_player' IS NOT NULL
          AND hybrid_correct IS NOT NULL
      )
      SELECT player, 
             max(title) as title,
             count(*) as n,
             round(avg(elo)) as avg_elo,
             round(100.0 * sum(case when hybrid_correct then 1 else 0 end) / count(*), 1) as hybrid_acc,
             round(100.0 * sum(case when stockfish_correct then 1 else 0 end) / count(*), 1) as sf_acc,
             round(100.0 * sum(case when enhanced_correct then 1 else 0 end) / count(*), 1) as enh_acc
      FROM player_games
      WHERE player IS NOT NULL AND player != ''
      GROUP BY player
      HAVING count(*) >= ${MIN_GAMES_FOR_SIGNAL}
      ORDER BY count(*) DESC
      LIMIT ${TOP_PLAYERS_LIMIT}
    `);

    // Build player profiles
    const newProfiles = {};
    for (const row of playerResult.rows) {
      newProfiles[row.player] = {
        name: row.player,
        totalGames: parseInt(row.n),
        hybridAccuracy: parseFloat(row.hybrid_acc) / 100,
        sfAccuracy: parseFloat(row.sf_acc) / 100,
        enhancedAccuracy: parseFloat(row.enh_acc) / 100,
        title: row.title || null,
        avgElo: parseInt(row.avg_elo) || 0,
        archetypes: {},
        platforms: {},
        timeControls: {},
        openings: {},
        timeOfDay: {},
      };
    }

    // 2. Per-player archetype breakdown (for top players only)
    const topPlayerNames = Object.keys(newProfiles).slice(0, 100); // Top 100 for detailed breakdown
    if (topPlayerNames.length > 0) {
      const archResult = await queryFn(`
        WITH player_arch AS (
          SELECT lesson_learned->>'white_player' as player, hybrid_archetype as arch,
                 hybrid_correct FROM chess_prediction_attempts
          WHERE lesson_learned->>'white_player' = ANY($1) AND hybrid_correct IS NOT NULL
          UNION ALL
          SELECT lesson_learned->>'black_player', hybrid_archetype, hybrid_correct
          FROM chess_prediction_attempts
          WHERE lesson_learned->>'black_player' = ANY($1) AND hybrid_correct IS NOT NULL
        )
        SELECT player, arch, count(*) as n,
               sum(case when hybrid_correct then 1 else 0 end) as correct
        FROM player_arch
        WHERE arch IS NOT NULL
        GROUP BY player, arch
        HAVING count(*) >= 5
      `, [topPlayerNames]);

      for (const row of archResult.rows) {
        if (newProfiles[row.player]) {
          newProfiles[row.player].archetypes[row.arch] = {
            n: parseInt(row.n),
            correct: parseInt(row.correct),
            accuracy: parseInt(row.correct) / parseInt(row.n),
          };
        }
      }
    }

    // 3. Per-player platform breakdown
    if (topPlayerNames.length > 0) {
      const platResult = await queryFn(`
        WITH player_plat AS (
          SELECT lesson_learned->>'white_player' as player,
                 COALESCE(lesson_learned->>'source', data_source, 'unknown') as platform,
                 hybrid_correct FROM chess_prediction_attempts
          WHERE lesson_learned->>'white_player' = ANY($1) AND hybrid_correct IS NOT NULL
          UNION ALL
          SELECT lesson_learned->>'black_player',
                 COALESCE(lesson_learned->>'source', data_source, 'unknown'),
                 hybrid_correct FROM chess_prediction_attempts
          WHERE lesson_learned->>'black_player' = ANY($1) AND hybrid_correct IS NOT NULL
        )
        SELECT player, platform, count(*) as n,
               sum(case when hybrid_correct then 1 else 0 end) as correct
        FROM player_plat
        GROUP BY player, platform
        HAVING count(*) >= 5
      `, [topPlayerNames]);

      for (const row of platResult.rows) {
        if (newProfiles[row.player]) {
          newProfiles[row.player].platforms[row.platform] = {
            n: parseInt(row.n),
            correct: parseInt(row.correct),
            accuracy: parseInt(row.correct) / parseInt(row.n),
          };
        }
      }
    }

    // 4. Per-player time control breakdown
    if (topPlayerNames.length > 0) {
      const tcResult = await queryFn(`
        WITH player_tc AS (
          SELECT lesson_learned->>'white_player' as player, time_control as tc,
                 hybrid_correct FROM chess_prediction_attempts
          WHERE lesson_learned->>'white_player' = ANY($1) AND hybrid_correct IS NOT NULL
          UNION ALL
          SELECT lesson_learned->>'black_player', time_control, hybrid_correct
          FROM chess_prediction_attempts
          WHERE lesson_learned->>'black_player' = ANY($1) AND hybrid_correct IS NOT NULL
        )
        SELECT player, tc, count(*) as n,
               sum(case when hybrid_correct then 1 else 0 end) as correct
        FROM player_tc
        WHERE tc IS NOT NULL
        GROUP BY player, tc
        HAVING count(*) >= 5
      `, [topPlayerNames]);

      for (const row of tcResult.rows) {
        if (newProfiles[row.player]) {
          newProfiles[row.player].timeControls[row.tc] = {
            n: parseInt(row.n),
            correct: parseInt(row.correct),
            accuracy: parseInt(row.correct) / parseInt(row.n),
          };
        }
      }
    }

    // 5. Matchup data (top player pairs)
    const newMatchups = {};
    const matchResult = await queryFn(`
      SELECT 
        lesson_learned->>'white_player' as white,
        lesson_learned->>'black_player' as black,
        count(*) as n,
        sum(case when hybrid_correct then 1 else 0 end) as correct,
        round(100.0 * sum(case when hybrid_correct then 1 else 0 end) / count(*), 1) as acc
      FROM chess_prediction_attempts
      WHERE lesson_learned->>'white_player' IS NOT NULL
        AND lesson_learned->>'black_player' IS NOT NULL
        AND hybrid_correct IS NOT NULL
      GROUP BY lesson_learned->>'white_player', lesson_learned->>'black_player'
      HAVING count(*) >= ${MIN_GAMES_FOR_MATCHUP}
      ORDER BY count(*) DESC
      LIMIT 2000
    `);

    for (const row of matchResult.rows) {
      const key = `${row.white}|${row.black}`;
      newMatchups[key] = {
        white: row.white,
        black: row.black,
        n: parseInt(row.n),
        correct: parseInt(row.correct),
        accuracy: parseFloat(row.acc) / 100,
      };
    }

    // 6. Platform-wide stats
    const newPlatformStats = {};
    const pStatResult = await queryFn(`
      SELECT COALESCE(lesson_learned->>'source', data_source, 'unknown') as platform,
             count(*) as n,
             round(100.0 * sum(case when hybrid_correct then 1 else 0 end) / count(*), 1) as acc
      FROM chess_prediction_attempts
      WHERE hybrid_correct IS NOT NULL
      GROUP BY COALESCE(lesson_learned->>'source', data_source, 'unknown')
      ORDER BY n DESC
    `);
    for (const row of pStatResult.rows) {
      newPlatformStats[row.platform] = {
        n: parseInt(row.n),
        accuracy: parseFloat(row.acc) / 100,
      };
    }

    // Apply updates
    playerProfiles = newProfiles;
    matchupData = newMatchups;
    platformStats = newPlatformStats;
    totalPlayersTracked = Object.keys(playerProfiles).length;
    lastRefresh = new Date().toISOString();

    // Save cache
    saveCache();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[PLAYER-INTEL] ✓ Refreshed in ${elapsed}s: ${totalPlayersTracked} players, ${Object.keys(matchupData).length} matchups, ${Object.keys(platformStats).length} platforms`);

    // Log top insights
    const sorted = Object.values(playerProfiles).sort((a, b) => b.totalGames - a.totalGames);
    console.log('[PLAYER-INTEL] Top players:');
    for (const p of sorted.slice(0, 10)) {
      const title = p.title ? `${p.title} ` : '';
      console.log(`  ${title}${p.name}: ${(p.hybridAccuracy * 100).toFixed(1)}% hybrid, ${(p.sfAccuracy * 100).toFixed(1)}% SF (n=${p.totalGames}, ELO ~${p.avgElo})`);
    }

    return { players: totalPlayersTracked, matchups: Object.keys(matchupData).length };
  } catch (err) {
    console.log(`[PLAYER-INTEL] Refresh failed: ${err.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// QUERY FUNCTIONS — used by fusion-intelligence.mjs
// ═══════════════════════════════════════════════════════════

/**
 * Get a fusion weight multiplier based on player-specific intelligence.
 * 
 * Factors in:
 * - Player's historical EP accuracy (some players EP predicts better)
 * - Platform behavior (Lichess vs Chess.com vs OTB)
 * - Matchup dynamics (if we know both players)
 * - Time control tendency for this player
 * 
 * @param {string|null} whiteName - White player name
 * @param {string|null} blackName - Black player name
 * @param {string|null} platform - Data source/platform
 * @param {string|null} timeControl - Time control string
 * @returns {{ boost: number, reason: string }} Multiplicative modifier + explanation
 */
export function getPlayerBoost(whiteName, blackName, platform, timeControl) {
  if (!whiteName && !blackName) return { boost: 1.0, reason: 'no player data' };

  let boostFactors = [];
  let reasons = [];

  // 1. Player-specific EP accuracy
  const whiteProfile = whiteName ? playerProfiles[whiteName] : null;
  const blackProfile = blackName ? playerProfiles[blackName] : null;

  if (whiteProfile && whiteProfile.totalGames >= MIN_GAMES_FOR_SIGNAL) {
    // How well does EP predict this player's games vs overall baseline?
    const baselineAcc = 0.604; // Overall hybrid accuracy
    const ratio = whiteProfile.hybridAccuracy / baselineAcc;
    // Dampen: sqrt to prevent wild swings
    const dampened = 1.0 + (ratio - 1.0) * 0.5;
    boostFactors.push(dampened);
    reasons.push(`W:${whiteName.substring(0, 15)}=${(whiteProfile.hybridAccuracy * 100).toFixed(0)}%`);
  }

  if (blackProfile && blackProfile.totalGames >= MIN_GAMES_FOR_SIGNAL) {
    const baselineAcc = 0.604;
    const ratio = blackProfile.hybridAccuracy / baselineAcc;
    const dampened = 1.0 + (ratio - 1.0) * 0.5;
    boostFactors.push(dampened);
    reasons.push(`B:${blackName.substring(0, 15)}=${(blackProfile.hybridAccuracy * 100).toFixed(0)}%`);
  }

  // 2. Matchup-specific accuracy
  if (whiteName && blackName) {
    const matchup = matchupData[`${whiteName}|${blackName}`];
    if (matchup && matchup.n >= MIN_GAMES_FOR_MATCHUP) {
      const baselineAcc = 0.604;
      const ratio = matchup.accuracy / baselineAcc;
      const dampened = 1.0 + (ratio - 1.0) * 0.3; // Extra damping for matchups (smaller n)
      boostFactors.push(dampened);
      reasons.push(`matchup=${(matchup.accuracy * 100).toFixed(0)}%(n=${matchup.n})`);
    }
  }

  // 3. Platform-specific accuracy
  if (platform && platformStats[platform]) {
    const pStat = platformStats[platform];
    if (pStat.n >= 100) {
      const baselineAcc = 0.604;
      const ratio = pStat.accuracy / baselineAcc;
      const dampened = 1.0 + (ratio - 1.0) * 0.3;
      boostFactors.push(dampened);
      reasons.push(`platform:${platform.substring(0, 12)}=${(pStat.accuracy * 100).toFixed(0)}%`);
    }
  }

  // 4. Player + time control specific
  if (whiteProfile && timeControl) {
    const tcBucket = classifyTimeControl(timeControl);
    const tcStat = whiteProfile.timeControls[tcBucket];
    if (tcStat && tcStat.n >= 20) {
      const ratio = tcStat.accuracy / whiteProfile.hybridAccuracy;
      const dampened = 1.0 + (ratio - 1.0) * 0.3;
      boostFactors.push(dampened);
      reasons.push(`W+tc:${tcBucket}=${(tcStat.accuracy * 100).toFixed(0)}%`);
    }
  }

  if (boostFactors.length === 0) return { boost: 1.0, reason: 'no player signal' };

  // Geometric mean of all factors (independent signals)
  const combined = boostFactors.reduce((a, b) => a * b, 1.0);
  const nthRoot = Math.pow(combined, 1 / boostFactors.length);

  // Clamp to [0.85, 1.20] — conservative range, player data adds nuance not chaos
  const clamped = Math.max(0.85, Math.min(1.20, nthRoot));

  return {
    boost: clamped,
    reason: reasons.join(' | '),
  };
}

/**
 * Get player archetype tendency — what archetype this player tends to produce.
 * Useful for pre-game prediction priors.
 * 
 * @param {string} playerName
 * @returns {{ topArchetype: string, distribution: Object } | null}
 */
export function getPlayerArchetypeTendency(playerName) {
  const profile = playerProfiles[playerName];
  if (!profile || Object.keys(profile.archetypes).length === 0) return null;

  const sorted = Object.entries(profile.archetypes)
    .sort((a, b) => b[1].n - a[1].n);

  return {
    topArchetype: sorted[0][0],
    distribution: Object.fromEntries(
      sorted.map(([arch, stat]) => [arch, {
        frequency: stat.n / profile.totalGames,
        accuracy: stat.accuracy,
        n: stat.n,
      }])
    ),
  };
}

/**
 * Get matchup insight for two players.
 */
export function getMatchupInsight(whiteName, blackName) {
  const key = `${whiteName}|${blackName}`;
  const matchup = matchupData[key];
  if (!matchup) return null;

  return {
    n: matchup.n,
    accuracy: matchup.accuracy,
    white: whiteName,
    black: blackName,
  };
}

/**
 * Get summary stats for logging.
 */
export function getPlayerIntelSummary() {
  return {
    playersTracked: totalPlayersTracked,
    matchups: Object.keys(matchupData).length,
    platforms: Object.keys(platformStats).length,
    lastRefresh,
    cacheLoaded: !!lastRefresh,
  };
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function classifyTimeControl(tc) {
  if (!tc) return 'unknown';
  const parts = tc.split('+');
  const base = parseInt(parts[0]) || 0;
  const inc = parseInt(parts[1]) || 0;
  const total = base + inc * 40;
  if (total >= 1500) return 'classical';
  if (total >= 600) return 'rapid';
  if (total >= 180) return 'blitz';
  if (total >= 60) return 'bullet';
  return 'ultrabullet';
}

// Load cache on import
const cacheLoaded = loadCache();
if (cacheLoaded) {
  console.log(`[PLAYER-INTEL] Loaded cache: ${totalPlayersTracked} players, ${Object.keys(matchupData).length} matchups (age: ${lastRefresh ? ((Date.now() - new Date(lastRefresh).getTime()) / 3600000).toFixed(1) + 'h' : 'unknown'})`);
} else {
  console.log('[PLAYER-INTEL] No cache — will refresh from DB on first cycle');
}
