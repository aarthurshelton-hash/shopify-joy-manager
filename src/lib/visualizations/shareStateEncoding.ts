// Encode visualization state into a compact URL parameter for sharing
// State is encoded as base64 to keep URLs relatively short

import { GamePhase } from '@/contexts/TimelineContext';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';

export interface ShareableState {
  // Timeline position
  move?: number;
  phase?: GamePhase;
  // Visual options
  dark?: boolean;
  pieces?: boolean;
  opacity?: number;
  // Locked pieces for highlighting
  locked?: Array<{ type: string; color: string }>;
  // Compare mode
  compare?: boolean;
  // Territory/heatmap modes
  territory?: boolean;
  heatmaps?: boolean;
}

/**
 * Full visualization state for session storage
 */
export interface FullShareableState extends ShareableState {
  displayMode?: 'art' | 'analysis' | 'minimal';
  highlightedPiece?: { type: string; color: string } | null;
  isPlaying?: boolean;
}

/**
 * Encode visualization state into a compact URL-safe string
 */
export function encodeShareState(state: ShareableState): string {
  // Only include non-default values to keep URL short
  const compact: Record<string, unknown> = {};
  
  if (state.move !== undefined && state.move > 0 && state.move !== Infinity) {
    compact.m = state.move;
  }
  if (state.phase && state.phase !== 'all') {
    compact.ph = state.phase;
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
  if (state.compare) {
    compact.c = 1;
  }
  if (state.territory) {
    compact.t = 1;
  }
  if (state.heatmaps) {
    compact.h = 1;
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
    if (compact.ph) {
      state.phase = compact.ph as GamePhase;
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
    if (compact.c) {
      state.compare = true;
    }
    if (compact.t) {
      state.territory = true;
    }
    if (compact.h) {
      state.heatmaps = true;
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

/**
 * Convert ShareableState to FullVisualizationState format for session storage
 */
export function shareableToFullState(
  state: ShareableState,
  sourceRoute: string,
  extras?: {
    visualizationId?: string;
    pgn?: string;
    displayMode?: 'art' | 'analysis' | 'minimal';
  }
): {
  currentMove: number;
  selectedPhase: GamePhase;
  isPlaying: boolean;
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
  highlightedPiece: null;
  displayMode: 'art' | 'analysis' | 'minimal';
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  showPieces: boolean;
  pieceOpacity: number;
  capturedAt: number;
  sourceRoute: string;
  visualizationId?: string;
  pgn?: string;
} {
  return {
    currentMove: state.move ?? Infinity,
    selectedPhase: state.phase ?? 'all',
    isPlaying: false,
    lockedPieces: (state.locked ?? []).map(p => ({
      pieceType: p.type as PieceType,
      pieceColor: p.color as PieceColor,
    })),
    compareMode: state.compare ?? false,
    highlightedPiece: null,
    displayMode: extras?.displayMode ?? 'art',
    darkMode: state.dark ?? false,
    showTerritory: state.territory ?? false,
    showHeatmaps: state.heatmaps ?? false,
    showPieces: state.pieces ?? false,
    pieceOpacity: state.opacity ?? 0.7,
    capturedAt: Date.now(),
    sourceRoute,
    visualizationId: extras?.visualizationId,
    pgn: extras?.pgn,
  };
}

/**
 * Convert FullVisualizationState to ShareableState for URL encoding
 */
export function fullStateToShareable(state: {
  currentMove?: number;
  selectedPhase?: GamePhase;
  lockedPieces?: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode?: boolean;
  darkMode?: boolean;
  showTerritory?: boolean;
  showHeatmaps?: boolean;
  showPieces?: boolean;
  pieceOpacity?: number;
}): ShareableState {
  return {
    move: state.currentMove !== Infinity ? state.currentMove : undefined,
    phase: state.selectedPhase !== 'all' ? state.selectedPhase : undefined,
    dark: state.darkMode || undefined,
    pieces: state.showPieces || undefined,
    opacity: state.pieceOpacity !== 0.7 ? state.pieceOpacity : undefined,
    locked: state.lockedPieces?.length ? state.lockedPieces.map(p => ({
      type: p.pieceType,
      color: p.pieceColor,
    })) : undefined,
    compare: state.compareMode || undefined,
    territory: state.showTerritory || undefined,
    heatmaps: state.showHeatmaps || undefined,
  };
}