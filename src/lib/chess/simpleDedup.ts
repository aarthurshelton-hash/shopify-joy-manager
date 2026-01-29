/**
 * Simple Game Deduplication System
 * VERSION: 7.16-FAST-INIT
 * 
 * PHILOSOPHY:
 * ===========
 * Fresh ID → Check if in system → Accept or Reject
 * That's it. No multi-layer complexity.
 * 
 * v7.16 FIXES:
 * - Hard 5s timeout on init to prevent startup hangs
 * - Max 3 pages (3000 IDs) - good enough coverage
 * - Per-page timeout to prevent individual query hangs
 * 
 * ONE SET. ONE CHECK. DONE.
 */

import { supabase } from '@/integrations/supabase/client';

const VERSION = "8.03-AGGRESSIVE";
console.log(`[${VERSION}] simpleDedup.ts LOADED`);

// v8.03: More aggressive loading to ensure full coverage
const INIT_TIMEOUT_MS = 15000; // Max 15s for entire init (was 10s)
const PAGE_TIMEOUT_MS = 4000;  // Max 4s per page (was 3s)
const MAX_PAGES = 30;          // Load up to 30,000 IDs (was 20)
const PAGE_SIZE = 1000;

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
 * Load known game IDs from database ONCE with hard timeout
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
    console.log(`[${VERSION}] Loading known IDs (max ${MAX_PAGES * PAGE_SIZE})...`);
    const startTime = Date.now();
    
    // v7.16: Hard timeout on entire init
    const timeoutId = setTimeout(() => {
      isInitialized = true;
      console.log(`[${VERSION}] Init timeout, loaded ${knownGameIds.size} IDs`);
    }, INIT_TIMEOUT_MS);
    
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        if (isInitialized) break; // Timeout triggered
        
        const from = page * PAGE_SIZE;
        
        try {
          // v7.16: Per-page timeout using AbortController pattern
          const controller = new AbortController();
          const pageTimeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
          
          const { data, error } = await supabase
            .from('chess_prediction_attempts')
            .select('game_id')
            .range(from, from + PAGE_SIZE - 1);
          
          clearTimeout(pageTimeout);
          
          if (error || !data || data.length === 0) break;
          
          for (const row of data) {
            if (row.game_id) {
              knownGameIds.add(toRawId(row.game_id));
            }
          }
          
          // If less than full page, we're done
          if (data.length < PAGE_SIZE) break;
          
        } catch (err) {
          console.warn(`[${VERSION}] Page ${page} error:`, err);
          break;
        }
      }
    } finally {
      clearTimeout(timeoutId);
      isInitialized = true;
    }
    
    console.log(`[${VERSION}] Loaded ${knownGameIds.size} IDs in ${Date.now() - startTime}ms`);
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
