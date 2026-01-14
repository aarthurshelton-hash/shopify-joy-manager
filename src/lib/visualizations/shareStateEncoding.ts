// Encode visualization state into a compact URL parameter for sharing
// State is encoded as base64 to keep URLs relatively short

export interface ShareableState {
  // Timeline position
  move?: number;
  // Visual options
  dark?: boolean;
  pieces?: boolean;
  opacity?: number;
  // Locked pieces for highlighting
  locked?: Array<{ type: string; color: string }>;
}

/**
 * Encode visualization state into a compact URL-safe string
 */
export function encodeShareState(state: ShareableState): string {
  // Only include non-default values to keep URL short
  const compact: Record<string, unknown> = {};
  
  if (state.move !== undefined && state.move > 0) {
    compact.m = state.move;
  }
  if (state.dark) {
    compact.d = 1;
  }
  if (state.pieces) {
    compact.p = 1;
  }
  if (state.opacity !== undefined && state.opacity !== 0.7) {
    compact.o = Math.round(state.opacity * 100);
  }
  if (state.locked && state.locked.length > 0) {
    // Encode locked pieces as compact string: "wK,bQ" for white King, black Queen
    compact.l = state.locked.map(p => `${p.color}${p.type}`).join(',');
  }
  
  // Return empty string if no state to encode
  if (Object.keys(compact).length === 0) {
    return '';
  }
  
  try {
    const json = JSON.stringify(compact);
    // Use base64 encoding for URL safety
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch {
    return '';
  }
}

/**
 * Decode visualization state from URL parameter
 */
export function decodeShareState(encoded: string | null): ShareableState {
  if (!encoded) return {};
  
  try {
    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const json = atob(base64);
    const compact = JSON.parse(json);
    
    const state: ShareableState = {};
    
    if (compact.m !== undefined) {
      state.move = compact.m;
    }
    if (compact.d) {
      state.dark = true;
    }
    if (compact.p) {
      state.pieces = true;
    }
    if (compact.o !== undefined) {
      state.opacity = compact.o / 100;
    }
    if (compact.l) {
      state.locked = compact.l.split(',').map((s: string) => ({
        color: s[0],
        type: s.slice(1),
      }));
    }
    
    return state;
  } catch {
    return {};
  }
}

/**
 * Build a shareable URL with encoded state
 */
export function buildShareUrl(baseUrl: string, state: ShareableState): string {
  const encoded = encodeShareState(state);
  if (!encoded) return baseUrl;
  
  const url = new URL(baseUrl);
  url.searchParams.set('s', encoded);
  return url.toString();
}

/**
 * Extract state from current URL
 */
export function getStateFromUrl(): ShareableState {
  if (typeof window === 'undefined') return {};
  
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('s');
  return decodeShareState(encoded);
}
