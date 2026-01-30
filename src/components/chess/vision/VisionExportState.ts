/**
 * Vision Export State
 * 
 * Unified state management for ensuring exports match exactly what the user sees.
 * This is the single source of truth for all Vision rendering.
 */

import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { MoveHistoryEntry } from '../EnPensentOverlay';

export interface VisionExportSettings {
  // Board state
  currentMove: number;
  totalMoves: number;
  
  // Piece display
  showPieces: boolean;
  pieceOpacity: number;
  
  // Color scheme
  darkMode: boolean;
  
  // Legend highlights
  lockedPieces: Array<{ pieceType: PieceType; pieceColor: PieceColor }>;
  compareMode: boolean;
  
  // Analysis layers
  showHeatmap: boolean;
  showTerritory: boolean;
  showTrajectory: boolean;
  
  // Benchmark integration
  linkedBenchmarkId?: string;
  linkedPredictions?: BenchmarkPredictionLink[];
}

export interface BenchmarkPredictionLink {
  gameId: string;
  gameName: string;
  moveNumber: number;
  hybridPrediction: string;
  stockfishPrediction: string;
  actualResult: string;
  hybridCorrect: boolean;
  stockfishCorrect: boolean;
  archetype?: string;
  confidence?: number;
}

export interface VisionGameContext {
  // Game metadata
  white: string;
  black: string;
  event?: string;
  date?: string;
  result?: string;
  pgn: string;
  
  // Move history for visualization
  moveHistory: MoveHistoryEntry[];
  
  // Palettes
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
  
  // Analysis data
  archetype?: string;
  archetypeConfidence?: number;
  fingerprint?: string;
  
  // Benchmark link (if this game was analyzed)
  benchmarkPrediction?: BenchmarkPredictionLink;
}

/**
 * Create default export settings
 */
export function createDefaultExportSettings(totalMoves: number): VisionExportSettings {
  return {
    currentMove: totalMoves,
    totalMoves,
    showPieces: false,
    pieceOpacity: 0.7,
    darkMode: false,
    lockedPieces: [],
    compareMode: false,
    showHeatmap: false,
    showTerritory: false,
    showTrajectory: false,
  };
}

/**
 * Capture current visualization state for export
 */
export function captureVisionState(
  settings: Partial<VisionExportSettings>,
  context: VisionGameContext
): VisionExportSettings & { context: VisionGameContext } {
  const defaults = createDefaultExportSettings(context.moveHistory.length);
  return {
    ...defaults,
    ...settings,
    context,
  };
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  context: VisionGameContext,
  format: 'png' | 'jpg' | 'pdf',
  variant: 'preview' | 'hd' | 'print' = 'preview'
): string {
  const white = context.white.replace(/[^a-zA-Z0-9]/g, '');
  const black = context.black.replace(/[^a-zA-Z0-9]/g, '');
  const timestamp = new Date().toISOString().slice(0, 10);
  return `EnPensent-${white}-vs-${black}-${variant}-${timestamp}.${format}`;
}
