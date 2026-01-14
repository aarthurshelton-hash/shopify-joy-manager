/**
 * Canonical Game Identification System
 * 
 * Each unique game (PGN moves) has ONE universal link.
 * Different palettes of the same game are distinct "visions" within that link.
 * All interactions contribute to the game's value pool.
 */

/**
 * Generate a compact, URL-safe hash of the game moves
 * This creates a canonical identifier for any game regardless of metadata
 */
export function generateGameHash(pgn: string | undefined | null): string {
  if (!pgn) return 'empty';
  
  // Extract only the moves from PGN (strip headers, comments, variations)
  const movesOnly = extractMovesFromPgn(pgn);
  if (!movesOnly) return 'empty';
  
  // Create a compact hash of the moves
  return compactHash(movesOnly);
}

/**
 * Extract just the moves from a PGN string
 * Strips headers [Event "..."], comments {}, variations ()
 */
export function extractMovesFromPgn(pgn: string): string {
  // Remove headers
  let cleaned = pgn.replace(/\[[^\]]*\]/g, '');
  
  // Remove comments
  cleaned = cleaned.replace(/\{[^}]*\}/g, '');
  
  // Remove variations
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // Remove move numbers
  cleaned = cleaned.replace(/\d+\.\s*/g, '');
  
  // Remove result markers
  cleaned = cleaned.replace(/1-0|0-1|1\/2-1\/2|\*/g, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Create a compact URL-safe hash from a string
 * Uses a simple but effective hashing algorithm for short URLs
 */
function compactHash(str: string): string {
  let hash = 0;
  let hash2 = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
    hash2 = ((hash2 << 7) + hash2 + char) | 0;
  }
  
  // Combine both hashes for better distribution
  const combined = Math.abs(hash) ^ Math.abs(hash2);
  
  // Convert to base36 for compact URL-safe representation
  return combined.toString(36);
}

/**
 * Generate the canonical URL for a game
 * This is the ONE universal link for any given set of moves
 */
export function getCanonicalGameUrl(pgn: string | undefined | null, baseUrl?: string): string {
  const hash = generateGameHash(pgn);
  const base = baseUrl || window.location.origin;
  return `${base}/g/${hash}`;
}

/**
 * Check if two PGNs represent the same game (same moves)
 */
export function isSameGame(pgn1: string | undefined | null, pgn2: string | undefined | null): boolean {
  return generateGameHash(pgn1) === generateGameHash(pgn2);
}

/**
 * Vision identification - Game + Palette combination
 */
export interface VisionIdentifier {
  gameHash: string;
  paletteId: string;
}

/**
 * Generate a unique vision identifier (Game + Palette)
 */
export function generateVisionId(pgn: string | undefined | null, paletteId: string): VisionIdentifier {
  return {
    gameHash: generateGameHash(pgn),
    paletteId: paletteId || 'modern',
  };
}

/**
 * Generate a URL-safe string for a specific vision (game + palette)
 */
export function generateVisionHash(pgn: string | undefined | null, paletteId: string): string {
  const gameHash = generateGameHash(pgn);
  const paletteShort = paletteId.slice(0, 3); // First 3 chars of palette
  return `${gameHash}-${paletteShort}`;
}

/**
 * Parse a vision hash back to components
 */
export function parseVisionHash(hash: string): { gameHash: string; paletteHint: string } | null {
  const parts = hash.split('-');
  if (parts.length < 2) return null;
  
  return {
    gameHash: parts.slice(0, -1).join('-'),
    paletteHint: parts[parts.length - 1],
  };
}

/**
 * Build a stateful share URL for a game
 * Includes both the game hash and optional state parameters
 */
export function buildCanonicalShareUrl(
  pgn: string | undefined | null,
  paletteId?: string,
  state?: {
    move?: number;
    dark?: boolean;
    pieces?: boolean;
    opacity?: number;
  }
): string {
  const gameHash = generateGameHash(pgn);
  const url = new URL(`${window.location.origin}/g/${gameHash}`);
  
  // Add palette if specified
  if (paletteId && paletteId !== 'modern') {
    url.searchParams.set('p', paletteId);
  }
  
  // Add state parameters if they differ from defaults
  if (state) {
    if (state.move !== undefined && state.move > 0 && state.move !== Infinity) {
      url.searchParams.set('m', state.move.toString());
    }
    if (state.dark) {
      url.searchParams.set('d', '1');
    }
    if (state.pieces) {
      url.searchParams.set('sp', '1');
    }
    if (state.opacity !== undefined && state.opacity !== 0.7) {
      url.searchParams.set('o', state.opacity.toFixed(1));
    }
  }
  
  return url.toString();
}

/**
 * Parse a canonical game URL to extract parameters
 */
export function parseCanonicalUrl(url: string): {
  gameHash: string;
  paletteId?: string;
  move?: number;
  dark?: boolean;
  pieces?: boolean;
  opacity?: number;
} | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/\/g\/([^\/]+)/);
    
    if (!pathMatch) return null;
    
    return {
      gameHash: pathMatch[1],
      paletteId: parsed.searchParams.get('p') || undefined,
      move: parsed.searchParams.has('m') ? parseInt(parsed.searchParams.get('m')!) : undefined,
      dark: parsed.searchParams.get('d') === '1',
      pieces: parsed.searchParams.get('sp') === '1',
      opacity: parsed.searchParams.has('o') ? parseFloat(parsed.searchParams.get('o')!) : undefined,
    };
  } catch {
    return null;
  }
}
