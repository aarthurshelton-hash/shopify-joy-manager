import React, { useMemo } from 'react';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight } from '@/contexts/LegendHighlightContext';

interface ChessBoardVisualizationProps {
  board: SquareData[][];
  size?: number;
}

interface HighlightedPiece {
  pieceType: PieceType;
  pieceColor: PieceColor;
}

// Get the current color for a visit using the active palette
function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

// Check if a visit matches the highlighted piece
function visitMatchesHighlight(visit: SquareVisit, highlight: HighlightedPiece | null): boolean {
  if (!highlight) return true;
  return visit.piece === highlight.pieceType && visit.color === highlight.pieceColor;
}

// Renders nested squares for a single board square as SVG rects
const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string,
  highlightedPiece: HighlightedPiece | null
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;
  
  // Determine if this square has any matching visits
  const hasMatchingVisit = highlightedPiece 
    ? visits.some(v => visitMatchesHighlight(v, highlightedPiece))
    : false;
  
  // Base dimming when highlight is active but this square doesn't match
  const shouldDim = highlightedPiece && !hasMatchingVisit;
  
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
  const uniqueColors: { color: string; matches: boolean }[] = [];
  for (const visit of visits) {
    const color = getVisitColor(visit);
    const matches = visitMatchesHighlight(visit, highlightedPiece);
    const existingIndex = uniqueColors.findIndex(uc => uc.color === color);
    if (existingIndex === -1) {
      uniqueColors.push({ color, matches });
    } else if (matches) {
      // If any visit with this color matches, mark it as matching
      uniqueColors[existingIndex].matches = true;
    }
  }
  
  // Calculate sizes for nested squares
  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number; matches: boolean }[] = [];
  
  let currentSize = squareSize - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;
  
  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i].color,
      layerSize: currentSize,
      matches: uniqueColors[i].matches,
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
    if (highlightedPiece) {
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
  
  // Add a subtle glow effect for highlighted squares
  if (highlightedPiece && hasMatchingVisit) {
    const glowSize = squareSize * 0.02;
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
        style={{
          transition: 'all 0.2s ease-out',
        }}
      />
    );
  }
  
  return elements;
};

const ChessBoardVisualization: React.FC<ChessBoardVisualizationProps> = ({
  board,
  size = 500,
}) => {
  // Try to use highlight context if available
  let highlightedPiece: HighlightedPiece | null = null;
  try {
    const context = useLegendHighlight();
    highlightedPiece = context.highlightedPiece;
  } catch {
    // Context not available, no highlighting
  }
  
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;
  
  // Memoize board rendering for performance
  const boardElements = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex; // Flip to show rank 8 at top
      return [...Array(8)].map((_, file) => {
        const square = board[rank][file];
        const baseColor = square.isLight ? boardColors.light : boardColors.dark;
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        
        return renderNestedSquares(
          square.visits,
          x,
          y,
          squareSize,
          baseColor,
          highlightedPiece
        );
      });
    });
  }, [board, borderWidth, squareSize, highlightedPiece]);
  
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
