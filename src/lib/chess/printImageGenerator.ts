import { SimulationResult, SquareData } from './gameSimulator';
import { generateQRDataUrl } from '@/lib/qr/generateVisualizationQR';
import { PieceType, PieceColor } from './pieceColors';

// Use string-based type for CapturedState to match the store's generic type
interface LockedPiece {
  pieceType: string;
  pieceColor: string;
}

interface LockedSquare {
  square: string;
  pieces: LockedPiece[];
}

interface CapturedState {
  currentMove: number;
  selectedPhase: string;
  lockedPieces: LockedPiece[];
  lockedSquares?: LockedSquare[];
  compareMode: boolean;
  displayMode: string;
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  showPieces?: boolean;
  pieceOpacity?: number;
  capturedAt: Date;
}

interface HighlightState {
  lockedPieces: { pieceType: PieceType; pieceColor: PieceColor }[];
  lockedSquares?: { square: string; pieces: { pieceType: PieceType; pieceColor: PieceColor }[] }[];
  compareMode: boolean;
}

interface PrintOptions {
  darkMode?: boolean;
  includeQR?: boolean;
  shareId?: string;
  capturedState?: CapturedState;
  withWatermark?: boolean;
  highlightState?: HighlightState;
}

/**
 * Filter board data to match a specific move in the timeline
 */
function filterBoardToMove(board: SquareData[][], currentMove: number): SquareData[][] {
  if (currentMove === Infinity || currentMove <= 0) return board;
  
  return board.map(row => 
    row.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
    }))
  );
}

/**
 * Generates a clean (no watermark) base64 image from a chess visualization
 * This is used for Printify print orders - identical to the preview
 * Uses the PrintReadyVisualization component for consistent "trademark look"
 */
interface PrintOptionsExtended extends PrintOptions {
  pgn?: string; // Explicit PGN override for piece rendering
}

export async function generateCleanPrintImage(
  simulation: SimulationResult,
  options: PrintOptionsExtended = {}
): Promise<string> {
  const { darkMode = false, includeQR = false, shareId, capturedState, withWatermark = false, highlightState: providedHighlightState, pgn: explicitPgn } = options;
  const html2canvas = (await import('html2canvas')).default;
  
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  try {
    // Import React and ReactDOM for rendering
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const { default: PrintReadyVisualization } = await import('@/components/chess/PrintReadyVisualization');
    
    // Apply captured state filtering if available - this ensures the print matches exactly what the user sees
    const filteredBoard = capturedState && capturedState.currentMove !== Infinity && capturedState.currentMove > 0
      ? filterBoardToMove(simulation.board, capturedState.currentMove)
      : simulation.board;
    
    // Use captured dark mode if available, otherwise fall back to passed option
    const effectiveDarkMode = capturedState?.darkMode ?? darkMode;
    
    // Generate QR code if needed
    let qrDataUrl: string | undefined;
    if (includeQR && shareId) {
      try {
        qrDataUrl = await generateQRDataUrl(shareId, 96);
      } catch (qrError) {
        console.warn('Failed to generate QR code for print:', qrError);
      }
    }
    
    // Create the print content element
    const printContent = document.createElement('div');
    container.appendChild(printContent);
    
    // Prepare highlight state for rendering - use provided or from captured state
    // This ensures locked pieces, locked squares, and compare mode are captured exactly as displayed
    // Map pieceColor from 'white'/'black' strings to 'w'/'b' types if needed
    const hasLockedPieces = capturedState?.lockedPieces?.length ?? 0;
    const hasLockedSquares = capturedState?.lockedSquares?.length ?? 0;
    
    const highlightState = providedHighlightState || ((hasLockedPieces > 0 || hasLockedSquares > 0) && capturedState ? {
      lockedPieces: (capturedState.lockedPieces || []).map(p => ({
        pieceType: p.pieceType as PieceType,
        pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as PieceColor,
      })),
      lockedSquares: (capturedState.lockedSquares || []).map(sq => ({
        square: sq.square,
        pieces: sq.pieces.map(p => ({
          pieceType: p.pieceType as PieceType,
          pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as PieceColor,
        })),
      })),
      compareMode: capturedState.compareMode,
    } : undefined);
    
    // Prepare pieces state for overlay if captured - include currentMoveNumber for accurate position
    const piecesState = capturedState?.showPieces ? {
      showPieces: capturedState.showPieces,
      pieceOpacity: capturedState.pieceOpacity ?? 0.7,
      currentMoveNumber: capturedState.currentMove !== Infinity ? capturedState.currentMove : undefined,
    } : undefined;
    
    // Render the unified PrintReadyVisualization component
    const root = ReactDOM.createRoot(printContent);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(PrintReadyVisualization, {
          board: filteredBoard,
          gameData: simulation.gameData,
          size: 440, // High-res for print (400 board + padding)
          darkMode: effectiveDarkMode,
          showQR: includeQR && !!qrDataUrl,
          qrDataUrl,
          compact: false,
          highlightState,
          piecesState,
          pgn: explicitPgn || simulation.gameData.pgn,
          withWatermark, // Pass watermark flag to component
        })
      );
      // Give React time to render
      setTimeout(resolve, 150);
    });
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capture with html2canvas
    const canvas = await html2canvas(printContent, {
      scale: 3, // High resolution for print quality
      backgroundColor: effectiveDarkMode ? '#0A0A0A' : '#FDFCFB',
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    // Convert to base64
    const base64 = canvas.toDataURL('image/png', 1.0);
    
    // Cleanup React root
    root.unmount();
    
    return base64;
  } finally {
    // Always cleanup the container
    document.body.removeChild(container);
  }
}

/**
 * Legacy signature for backward compatibility
 */
export async function generateCleanPrintImageLegacy(
  simulation: SimulationResult,
  darkMode: boolean = false
): Promise<string> {
  return generateCleanPrintImage(simulation, { darkMode });
}
