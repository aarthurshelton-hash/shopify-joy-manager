/**
 * VisionExportService - Bulletproof Export System
 * 
 * The single source of truth for all Vision exports:
 * - Downloads (preview with watermark, HD without watermark)
 * - GIFs (animated timeline)
 * - Prints (exact WYSIWYG capture)
 * - Share (link with state)
 * 
 * Guarantees: What You See Is What You Get (WYSIWYG)
 */

import html2canvas from 'html2canvas';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { supabase } from '@/integrations/supabase/client';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';

// ============================================================================
// TYPES
// ============================================================================

export interface VisionState {
  // Timeline position
  currentMove: number;
  totalMoves: number;
  
  // Piece display
  showPieces: boolean;
  pieceOpacity: number;
  
  // Theme
  darkMode: boolean;
  
  // Legend highlights
  lockedPieces: Array<{ pieceType: PieceType | string; pieceColor: PieceColor | string }>;
  lockedSquares?: Array<{ square: string; pieces: Array<{ pieceType: PieceType | string; pieceColor: PieceColor | string }> }>;
  compareMode: boolean;
  
  // Analysis layers
  showTerritory?: boolean;
  showHeatmaps?: boolean;
}

export interface ExportOptions {
  format: 'preview' | 'hd' | 'gif' | 'print';
  withWatermark?: boolean;
  scale?: number;
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  filename?: string;
  error?: string;
}

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  shareId?: string;
  error?: string;
}

export interface PrintOrderData {
  title: string;
  gameData: {
    white: string;
    black: string;
    event?: string;
    date?: string;
    result?: string;
  };
  pgn?: string;
  fen?: string;
  visualizationId?: string;
  shareId?: string | null;
  capturedState: VisionState & { capturedAt: Date };
  previewImageBase64?: string;
  returnPath?: string;
}

// ============================================================================
// STATE CAPTURE
// ============================================================================

/**
 * Captures the complete visual state from a Vision display
 * This is the single source of truth for what the user sees
 */
export function captureVisionState(
  element: HTMLElement | null,
  currentMove: number,
  totalMoves: number,
  showPieces: boolean,
  pieceOpacity: number,
  darkMode: boolean,
  lockedPieces: Array<{ pieceType: PieceType | string; pieceColor: PieceColor | string }>,
  compareMode: boolean,
  lockedSquares?: Array<{ square: string; pieces: Array<{ pieceType: PieceType | string; pieceColor: PieceColor | string }> }>,
  showTerritory?: boolean,
  showHeatmaps?: boolean
): VisionState {
  return {
    currentMove,
    totalMoves,
    showPieces,
    pieceOpacity,
    darkMode,
    lockedPieces: lockedPieces.map(p => ({
      pieceType: p.pieceType,
      pieceColor: p.pieceColor,
    })),
    lockedSquares: lockedSquares?.map(sq => ({
      square: sq.square,
      pieces: sq.pieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      })),
    })),
    compareMode,
    showTerritory: showTerritory ?? false,
    showHeatmaps: showHeatmaps ?? false,
  };
}

// ============================================================================
// IMAGE GENERATION
// ============================================================================

/**
 * Generates a high-quality image from the Vision board element
 * Uses html2canvas with optimized settings for print quality
 */
export async function generateVisionImage(
  element: HTMLElement,
  options: {
    scale?: number;
    darkMode?: boolean;
    withWatermark?: boolean;
  } = {}
): Promise<{ dataUrl: string; blob: Blob }> {
  const { scale = 3, darkMode = false, withWatermark = false } = options;
  
  // Wait for any animations to settle
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Capture with html2canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
    logging: false,
    // Ensure fonts are loaded
    onclone: (doc) => {
      // Ensure cloned document has proper font loading
      const style = doc.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Inter:wght@400;500;600&display=swap');
      `;
      doc.head.appendChild(style);
    },
  });
  
  // Apply watermark if needed (for free downloads)
  if (withWatermark) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      applyWatermark(ctx, canvas.width, canvas.height, darkMode);
    }
  }
  
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png', 1.0);
  });
  
  return { dataUrl, blob };
}

/**
 * Applies our trademark watermark to a canvas
 */
function applyWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  darkMode: boolean
): void {
  ctx.save();
  
  // Diagonal watermark across the image
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = darkMode ? '#FFFFFF' : '#000000';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate(-Math.PI / 6); // -30 degrees
  
  ctx.fillText('EN PENSENT', 0, -40);
  ctx.fillText('enpensent.com', 0, 20);
  
  ctx.restore();
  
  // Corner branding
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = darkMode ? '#FFFFFF' : '#000000';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('enpensent.com', width - 20, height - 20);
}

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

/**
 * Downloads a Vision image with proper filename
 */
export async function downloadVisionImage(
  element: HTMLElement,
  options: {
    isHD: boolean;
    darkMode: boolean;
    gameTitle: string;
    visualizationId?: string;
    isPremium?: boolean;
  }
): Promise<ExportResult> {
  const { isHD, darkMode, gameTitle, visualizationId, isPremium = false } = options;
  
  try {
    // Free downloads always get watermark, HD requires premium
    const withWatermark = !isHD || !isPremium;
    const scale = isHD ? 4 : 3;
    
    const { dataUrl, blob } = await generateVisionImage(element, {
      scale,
      darkMode,
      withWatermark,
    });
    
    // Create filename
    const sanitizedTitle = gameTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const suffix = isHD ? 'HD' : 'preview';
    const theme = darkMode ? 'dark' : 'light';
    const filename = `EnPensent-${sanitizedTitle}-${theme}-${suffix}.png`;
    
    // Trigger download using blob URL for reliability
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup blob URL after download starts
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    
    // Track HD download for vision scoring
    if (isHD && visualizationId) {
      recordVisionInteraction(visualizationId, 'download_hd');
    }
    
    return {
      success: true,
      dataUrl,
      blob,
      filename,
    };
  } catch (error) {
    console.error('[VisionExportService] Download failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

// ============================================================================
// SHARE FUNCTIONS
// ============================================================================

/**
 * Creates a shareable link with encoded vision state
 */
export function createShareableLink(
  baseUrl: string,
  state: VisionState
): string {
  const params = new URLSearchParams();
  
  // Only include non-default values to keep URL short
  if (state.currentMove !== state.totalMoves) {
    params.set('m', state.currentMove.toString());
  }
  if (state.darkMode) {
    params.set('d', '1');
  }
  if (state.showPieces) {
    params.set('p', '1');
    if (state.pieceOpacity !== 0.7) {
      params.set('po', Math.round(state.pieceOpacity * 100).toString());
    }
  }
  if (state.compareMode) {
    params.set('c', '1');
  }
  if (state.lockedPieces.length > 0) {
    // Encode locked pieces as compact string: "wk,bq,wp" etc
    const encoded = state.lockedPieces
      .map(p => `${p.pieceColor === 'w' || p.pieceColor === 'white' ? 'w' : 'b'}${p.pieceType}`)
      .join(',');
    params.set('l', encoded);
  }
  if (state.showTerritory) {
    params.set('t', '1');
  }
  if (state.showHeatmaps) {
    params.set('h', '1');
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Parses vision state from URL parameters
 */
export function parseShareableLink(url: string, totalMoves: number): Partial<VisionState> {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    const state: Partial<VisionState> = {
      totalMoves,
    };
    
    if (params.has('m')) {
      state.currentMove = parseInt(params.get('m')!, 10);
    }
    if (params.get('d') === '1') {
      state.darkMode = true;
    }
    if (params.get('p') === '1') {
      state.showPieces = true;
      if (params.has('po')) {
        state.pieceOpacity = parseInt(params.get('po')!, 10) / 100;
      }
    }
    if (params.get('c') === '1') {
      state.compareMode = true;
    }
    if (params.has('l')) {
      const encoded = params.get('l')!;
      state.lockedPieces = encoded.split(',').map(s => ({
        pieceColor: s[0] as 'w' | 'b',
        pieceType: s.slice(1) as PieceType,
      }));
    }
    if (params.get('t') === '1') {
      state.showTerritory = true;
    }
    if (params.get('h') === '1') {
      state.showHeatmaps = true;
    }
    
    return state;
  } catch {
    return { totalMoves };
  }
}

// ============================================================================
// PRINT ORDER FUNCTIONS
// ============================================================================

/**
 * Prepares complete print order data with captured state
 */
export function preparePrintOrderData(
  title: string,
  gameData: {
    white: string;
    black: string;
    event?: string;
    date?: string;
    result?: string;
  },
  state: VisionState,
  options: {
    pgn?: string;
    fen?: string;
    visualizationId?: string;
    shareId?: string | null;
    returnPath?: string;
    previewImageBase64?: string;
  } = {}
): PrintOrderData {
  return {
    title,
    gameData,
    pgn: options.pgn,
    fen: options.fen,
    visualizationId: options.visualizationId,
    shareId: options.shareId,
    capturedState: {
      ...state,
      capturedAt: new Date(),
    },
    previewImageBase64: options.previewImageBase64,
    returnPath: options.returnPath || window.location.pathname,
  };
}

/**
 * Generates a preview image for print order and returns base64
 */
export async function generatePrintPreviewImage(
  element: HTMLElement,
  darkMode: boolean
): Promise<string> {
  const { dataUrl } = await generateVisionImage(element, {
    scale: 3,
    darkMode,
    withWatermark: false, // Print previews don't need watermark
  });
  return dataUrl;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates that the board element is ready for export
 */
export function validateExportElement(element: HTMLElement | null): {
  valid: boolean;
  error?: string;
} {
  if (!element) {
    return { valid: false, error: 'Board element not found' };
  }
  
  // Check if element has content
  if (element.offsetWidth === 0 || element.offsetHeight === 0) {
    return { valid: false, error: 'Board element has no dimensions' };
  }
  
  // Check if board SVG is present
  const svg = element.querySelector('svg');
  if (!svg) {
    // Check for canvas or other board representations
    const canvas = element.querySelector('canvas');
    if (!canvas) {
      console.warn('[VisionExportService] No SVG or canvas found, proceeding anyway');
    }
  }
  
  return { valid: true };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Finds the board element from a container reference
 */
export function findBoardElement(container: HTMLElement | null): HTMLElement | null {
  if (!container) return null;
  
  // Look for data attribute first
  const byDataAttr = container.querySelector('[data-vision-board="true"]');
  if (byDataAttr) return byDataAttr as HTMLElement;
  
  // Look for known class patterns
  const byClass = container.querySelector('.vision-board, .chess-board, .en-pensent-board');
  if (byClass) return byClass as HTMLElement;
  
  // Return container itself if it seems to be the board
  if (container.querySelector('svg') || container.querySelector('canvas')) {
    return container;
  }
  
  return null;
}

/**
 * Generates a unique filename for exports
 */
export function generateExportFilename(
  gameTitle: string,
  format: 'png' | 'gif' | 'pdf',
  variant: 'preview' | 'hd' | 'print' = 'preview',
  darkMode: boolean = false
): string {
  const sanitizedTitle = gameTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  const timestamp = new Date().toISOString().slice(0, 10);
  const theme = darkMode ? 'dark' : 'light';
  return `EnPensent-${sanitizedTitle}-${theme}-${variant}-${timestamp}.${format}`;
}
