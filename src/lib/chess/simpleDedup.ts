/**
 * Simple Game Deduplication System
 * VERSION: 7.15-SIMPLE-DEDUP
 * 
 * PHILOSOPHY:
 * ===========
 * Fresh ID → Check if in system → Accept or Reject
 * That's it. No multi-layer complexity.
 * 
 * ONE SET. ONE CHECK. DONE.
 */

import { supabase } from '@/integrations/supabase/client';

const VERSION = "7.15-SIMPLE-DEDUP";
console.log(`[${VERSION}] simpleDedup.ts LOADED`);

/**
 * The ONE set of known game IDs in our system.
 * Contains RAW IDs only (no prefixes).
 */
let knownGameIds: Set<string> = new Set();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Extract raw ID from any format
 * "li_ABC123XY" → "ABC123XY"
 * "cc_123456789" → "123456789" 
 * "ABC123XY" → "ABC123XY"
 */
export function toRawId(gameId: string): string {
  return gameId.replace(/^(li_|cc_)/, '');
}

/**
 * Load all known game IDs from database ONCE
 * Subsequent calls return immediately.
 */
export async function initKnownIds(): Promise<void> {
  if (isInitialized) return;
  
  // Prevent multiple parallel init calls
  if (initPromise) {
    await initPromise;
    return;
  }
  
  initPromise = (async () => {
    console.log(`[${VERSION}] Loading known IDs from database...`);
    const startTime = Date.now();
    
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const { data, error } = await supabase
          .from('chess_prediction_attempts')
          .select('game_id')
          .range(from, from + pageSize - 1);
        
        if (error) {
          console.warn(`[${VERSION}] DB error:`, error);
          break;
        }
        
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const row of data) {
          if (row.game_id) {
            knownGameIds.add(toRawId(row.game_id));
          }
        }
        
        from += pageSize;
        hasMore = data.length === pageSize;
        
        // Safety limit: max 50k IDs
        if (knownGameIds.size > 50000) {
          console.log(`[${VERSION}] Hit 50k limit, stopping pagination`);
          break;
        }
      } catch (err) {
        console.warn(`[${VERSION}] Fetch error at page ${from / pageSize}:`, err);
        break;
      }
    }
    
    isInitialized = true;
    console.log(`[${VERSION}] Loaded ${knownGameIds.size} known IDs in ${Date.now() - startTime}ms`);
  })();
  
  await initPromise;
}

/**
 * THE CORE FUNCTION
 * 
 * Is this game ID already in our system?
 * YES → reject (return true)
 * NO → accept (return false)
 */
export function isKnown(gameId: string): boolean {
  const rawId = toRawId(gameId);
  return knownGameIds.has(rawId);
}

/**
 * Mark a game as known (after successful processing)
 */
export function markKnown(gameId: string): void {
  const rawId = toRawId(gameId);
  knownGameIds.add(rawId);
}

/**
 * Get count of known IDs
 */
export function getKnownCount(): number {
  return knownGameIds.size;
}

/**
 * Get the set directly (for passing to fetchers)
 */
export function getKnownIds(): Set<string> {
  return knownGameIds;
}

/**
 * Reset for testing
 */
export function resetKnownIds(): void {
  knownGameIds = new Set();
  isInitialized = false;
  initPromise = null;
  console.log(`[${VERSION}] Known IDs reset`);
}

/**
 * Filter a batch of game IDs, returning only fresh ones
 */
export function filterFreshGames<T extends { gameId?: string; id?: string }>(
  games: T[]
): T[] {
  return games.filter(game => {
    const gameId = game.gameId || game.id;
    if (!gameId) return false;
    return !isKnown(gameId);
  });
}
