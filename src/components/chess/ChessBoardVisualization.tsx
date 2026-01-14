import React, { useMemo } from 'react';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece, HoveredMoveInfo } from '@/contexts/LegendHighlightContext';

interface ChessBoardVisualizationProps {
  board: SquareData[][];
  size?: number;
  // Optional: override highlight state for export rendering when context isn't available
  overrideHighlightedPieces?: HighlightedPiece[];
  overrideCompareMode?: boolean;
}

// Get the current color for a visit using the active palette
function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

// Check if a visit matches any of the highlighted pieces
function visitMatchesAnyHighlight(visit: SquareVisit, highlights: HighlightedPiece[]): boolean {
  if (highlights.length === 0) return true;
  return highlights.some(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

// Check which highlight index a visit matches (for compare mode coloring)
function getMatchingHighlightIndex(visit: SquareVisit, highlights: HighlightedPiece[]): number {
  return highlights.findIndex(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

// Renders nested squares for a single board square as SVG rects
const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string,
  highlightedPieces: HighlightedPiece[],
  compareMode: boolean,
  hoveredMove: HoveredMoveInfo | null,
  squareName: string // e.g., "e4"
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;
  
  const hasHighlight = highlightedPieces.length > 0;
  
  // Check if this square is targeted by the hovered move
  const isHoveredMoveTarget = hoveredMove?.targetSquare === squareName;
  
  // Check if this square has visits from the hovered move's piece
  const hoveredMoveMatchingVisits = hoveredMove 
    ? visits.filter(v => v.piece === hoveredMove.piece.pieceType && v.color === hoveredMove.piece.pieceColor)
    : [];
  const hasHoveredMoveVisit = hoveredMoveMatchingVisits.length > 0;
  
  // Determine if this square has any matching visits
  const matchingVisits = hasHighlight 
    ? visits.filter(v => visitMatchesAnyHighlight(v, highlightedPieces))
    : visits;
  
  const hasMatchingVisit = matchingVisits.length > 0;
  
  // In compare mode, check which pieces are present
  const piece1Present = highlightedPieces.length > 0 && visits.some(
    v => v.piece === highlightedPieces[0].pieceType && v.color === highlightedPieces[0].pieceColor
  );
  const piece2Present = highlightedPieces.length > 1 && visits.some(
    v => v.piece === highlightedPieces[1].pieceType && v.color === highlightedPieces[1].pieceColor
  );
  const isOverlap = piece1Present && piece2Present;
  
  // Base dimming when highlight is active but this square doesn't match
  // Also dim when hovering a move and this square doesn't match
  const shouldDim = (hasHighlight && !hasMatchingVisit) || (hoveredMove && !hasHoveredMoveVisit && !isHoveredMoveTarget);
  
  // Draw base square
  elements.push(
    <rect
      key={`base-${x}-${y}`}
      x={x}
      y={y}
      width={squareSize}
      height={squareSize}
      fill={baseColor}
      style={{
        opacity: shouldDim ? 0.3 : 1,
        transition: 'opacity 0.2s ease-out',
      }}
    />
  );
  
  if (visits.length === 0) {
    return elements;
  }
  
  // Get unique colors in order of first appearance
  const uniqueColors: { color: string; matches: boolean; highlightIndex: number }[] = [];
  for (const visit of visits) {
    const color = getVisitColor(visit);
    const highlightIndex = getMatchingHighlightIndex(visit, highlightedPieces);
    const matches = !hasHighlight || highlightIndex !== -1;
    const existingIndex = uniqueColors.findIndex(uc => uc.color === color);
    if (existingIndex === -1) {
      uniqueColors.push({ color, matches, highlightIndex });
    } else if (matches) {
      uniqueColors[existingIndex].matches = true;
      if (highlightIndex !== -1) {
        uniqueColors[existingIndex].highlightIndex = highlightIndex;
      }
    }
  }
  
  // Calculate sizes for nested squares
  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number; matches: boolean; highlightIndex: number }[] = [];
  
  let currentSize = squareSize - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;
  
  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i].color,
      layerSize: currentSize,
      matches: uniqueColors[i].matches,
      highlightIndex: uniqueColors[i].highlightIndex,
    });
    currentSize -= sizeReduction;
    if (currentSize < squareSize * 0.1) break;
  }
  
  // Draw layers from outside in (largest first)
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const offset = (squareSize - layer.layerSize) / 2;
    
    // Determine opacity based on highlight state
    let opacity = 1;
    if (hasHighlight) {
      opacity = layer.matches ? 1 : 0.15;
    }
    
    elements.push(
      <rect
        key={`layer-${x}-${y}-${i}`}
        x={x + offset}
        y={y + offset}
        width={layer.layerSize}
        height={layer.layerSize}
        fill={layer.color}
        style={{
          opacity,
          transition: 'opacity 0.2s ease-out',
        }}
      />
    );
  }
  
  // Add visual effects for highlighted squares
  if (hasHighlight && hasMatchingVisit) {
    const glowSize = squareSize * 0.02;
    
    if (compareMode && highlightedPieces.length === 2) {
      // In compare mode, show different effects based on overlap
      if (isOverlap) {
        // Overlap: purple glow
        elements.push(
          <rect
            key={`glow-overlap-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(168, 85, 247, 0.8)"
            strokeWidth={glowSize * 2}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      } else if (piece1Present) {
        // Only piece 1: sky blue glow
        elements.push(
          <rect
            key={`glow-p1-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth={glowSize * 1.5}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      } else if (piece2Present) {
        // Only piece 2: rose glow
        elements.push(
          <rect
            key={`glow-p2-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(251, 113, 133, 0.6)"
            strokeWidth={glowSize * 1.5}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      }
    } else {
      // Single selection mode: white glow
      elements.push(
        <rect
          key={`glow-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={glowSize}
          style={{ transition: 'all 0.2s ease-out' }}
        />
      );
    }
  }
  
  // Add visual effect for hovered move - highlight target square and piece visits
  if (hoveredMove && (isHoveredMoveTarget || hasHoveredMoveVisit)) {
    const glowSize = squareSize * 0.025;
    
    if (isHoveredMoveTarget) {
      // Target square gets a strong amber glow
      elements.push(
        <rect
          key={`glow-move-target-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.9)"
          strokeWidth={glowSize * 2}
          style={{ transition: 'all 0.15s ease-out' }}
        />
      );
    } else if (hasHoveredMoveVisit) {
      // Other squares with the same piece get a softer glow
      elements.push(
        <rect
          key={`glow-move-piece-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.4)"
          strokeWidth={glowSize}
          style={{ transition: 'all 0.15s ease-out' }}
        />
      );
    }
  }
  
  return elements;
};

const ChessBoardVisualization: React.FC<ChessBoardVisualizationProps> = ({
  board,
  size = 500,
  overrideHighlightedPieces,
  overrideCompareMode,
}) => {
  // Use override props if provided, otherwise try context
  let highlightedPieces: HighlightedPiece[] = overrideHighlightedPieces || [];
  let compareMode = overrideCompareMode || false;
  let hoveredMove: HoveredMoveInfo | null = null;
  
  // Only try context if no override provided
  if (!overrideHighlightedPieces) {
    try {
      const context = useLegendHighlight();
      // Combine locked pieces and hover highlight
      if (context.lockedPieces.length > 0) {
        highlightedPieces = context.lockedPieces;
      } else if (context.highlightedPiece) {
        highlightedPieces = [context.highlightedPiece];
      }
      compareMode = context.compareMode;
      hoveredMove = context.hoveredMove;
    } catch {
      // Context not available, no highlighting
    }
  }
  
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;
  
  // Helper to convert file/rank indices to square name
  const getSquareName = (file: number, rank: number): string => {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}`;
  };
  
  // Memoize board rendering for performance
  const boardElements = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex; // Flip to show rank 8 at top
      return [...Array(8)].map((_, file) => {
        const square = board[rank][file];
        const baseColor = square.isLight ? boardColors.light : boardColors.dark;
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        const squareName = getSquareName(file, rank);
        
        return renderNestedSquares(
          square.visits,
          x,
          y,
          squareSize,
          baseColor,
          highlightedPieces,
          compareMode,
          hoveredMove,
          squareName
        );
      });
    });
  }, [board, borderWidth, squareSize, highlightedPieces, compareMode, hoveredMove]);
  
  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Border */}
      <rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        fill={boardColors.border}
      />
      
      {/* Board squares */}
      {boardElements}
    </svg>
  );
};

export default ChessBoardVisualization;
