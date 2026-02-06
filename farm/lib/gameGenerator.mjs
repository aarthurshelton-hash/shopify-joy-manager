/**
 * Game Generator - REAL GAMES ONLY
 * 
 * Per user rules: NO simulation allowed. Only real games from Lichess/Chess.com.
 * This module is deprecated - use direct API fetching instead.
 */

/**
 * @deprecated Real games only - no test generation allowed
 * Returns empty array to enforce real game fetching
 */
export function generateTestGames(count) {
  console.error('[FARM] generateTestGames is DISABLED - use real Lichess/Chess.com games only');
  return [];
}

/**
 * @deprecated Real games only - no test generation allowed  
 * Returns null to enforce real game fetching
 */
export function generateTestGame(index) {
  console.error('[FARM] generateTestGame is DISABLED - use real Lichess/Chess.com games only');
  return null;
}

/**
 * @deprecated Use direct API fetching with retry logic instead
 */
export async function fetchGamesWithFallback(count = 5, perfType = 'blitz', useTestData = false) {
  console.error('[FARM] fetchGamesWithFallback is DISABLED - use real API fetching only');
  return [];
}
