import React, { useCallback, useMemo, useState } from 'react';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';

interface InteractiveVisualizationBoardProps {
  board: SquareData[][];
  size?: number;
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
  isHoveredSquare: boolean,
  isHighlightedFromLegend: boolean
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;
  
  const hasHighlight = highlightedPieces.length > 0;
  
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
  const shouldDim = hasHighlight && !hasMatchingVisit && !isHoveredSquare;
  
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
    if (hasHighlight && !isHoveredSquare) {
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
  if ((hasHighlight && hasMatchingVisit) || isHoveredSquare) {
    const glowSize = squareSize * 0.02;
    
    if (isHoveredSquare) {
      // Square is being hovered - show amber glow
      elements.push(
        <rect
          key={`glow-hover-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.8)"
          strokeWidth={glowSize * 2}
          style={{ transition: 'all 0.2s ease-out' }}
        />
      );
    } else if (compareMode && highlightedPieces.length === 2) {
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
    } else if (isHighlightedFromLegend) {
      // Single selection mode from legend: white glow
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
  
  return elements;
};

const InteractiveVisualizationBoard: React.FC<InteractiveVisualizationBoardProps> = ({
  board,
  size = 500,
}) => {
  const [hoveredSquareLocal, setHoveredSquareLocal] = useState<string | null>(null);
  
  // Try to use highlight context if available
  let highlightedPieces: HighlightedPiece[] = [];
  let compareMode = false;
  let setHoveredSquare: ((info: { square: string; pieces: HighlightedPiece[]; moveNumbers: number[] } | null) => void) | null = null;
  let setHighlightedAnnotations: ((annotations: ('white-player' | 'black-player')[]) => void) | null = null;
  let hoveredAnnotation: { type: string; associatedPieces?: HighlightedPiece[] } | null = null;
  let hoveredSquareFromContext: { square: string; pieces: HighlightedPiece[]; moveNumbers: number[] } | null = null;
  
  try {
    const context = useLegendHighlight();
    // Combine locked pieces and hover highlight
    if (context.lockedPieces.length > 0) {
      highlightedPieces = context.lockedPieces;
    } else if (context.highlightedPiece) {
      highlightedPieces = [context.highlightedPiece];
    }
    // If annotation is hovered, use its associated pieces for highlighting
    if (context.hoveredAnnotation?.associatedPieces && context.hoveredAnnotation.associatedPieces.length > 0) {
      highlightedPieces = context.hoveredAnnotation.associatedPieces;
    }
    compareMode = context.compareMode;
    setHoveredSquare = context.setHoveredSquare;
    setHighlightedAnnotations = context.setHighlightedAnnotations;
    hoveredAnnotation = context.hoveredAnnotation;
    hoveredSquareFromContext = context.hoveredSquare;
  } catch {
    // Context not available, no highlighting
  }
  
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;

  // Get unique pieces that visited a square
  const getPiecesForSquare = useCallback((square: SquareData): HighlightedPiece[] => {
    const pieces: HighlightedPiece[] = [];
    const seen = new Set<string>();
    
    for (const visit of square.visits) {
      const key = `${visit.color}-${visit.piece}`;
      if (!seen.has(key)) {
        seen.add(key);
        pieces.push({ pieceType: visit.piece, pieceColor: visit.color });
      }
    }
    
    return pieces;
  }, []);

  // Get all move numbers associated with a square's visits
  const getMoveNumbersForSquare = useCallback((square: SquareData): number[] => {
    const moveNumbers: number[] = [];
    for (const visit of square.visits) {
      if (!moveNumbers.includes(visit.moveNumber)) {
        moveNumbers.push(visit.moveNumber);
      }
    }
    return moveNumbers.sort((a, b) => a - b);
  }, []);

  const handleSquareHover = useCallback((rank: number, file: number) => {
    const square = board[rank][file];
    const squareName = `${String.fromCharCode(97 + file)}${rank + 1}`;
    setHoveredSquareLocal(squareName);
    
    const pieces = getPiecesForSquare(square);
    const moveNumbers = getMoveNumbersForSquare(square);
    
    // Always update hover state - even for empty squares (with empty pieces array)
    if (setHoveredSquare) {
      setHoveredSquare({ square: squareName, pieces, moveNumbers });
    }
    
    // Update annotation highlighting based on pieces on this square
    if (setHighlightedAnnotations && pieces.length > 0) {
      const annotations: ('white-player' | 'black-player')[] = [];
      if (pieces.some(p => p.pieceColor === 'w')) annotations.push('white-player');
      if (pieces.some(p => p.pieceColor === 'b')) annotations.push('black-player');
      setHighlightedAnnotations(annotations);
    } else if (setHighlightedAnnotations) {
      setHighlightedAnnotations([]);
    }
  }, [board, setHoveredSquare, setHighlightedAnnotations, getPiecesForSquare, getMoveNumbersForSquare]);

  const handleSquareLeave = useCallback(() => {
    setHoveredSquareLocal(null);
    if (setHoveredSquare) {
      setHoveredSquare(null);
    }
    if (setHighlightedAnnotations) {
      setHighlightedAnnotations([]);
    }
  }, [setHoveredSquare, setHighlightedAnnotations]);
  
  // Determine effective highlighting pieces - include pieces from hovered square for full board highlighting
  const effectiveHighlightPieces = useMemo(() => {
    // If we have locked pieces or legend hover, use those
    if (highlightedPieces.length > 0) return highlightedPieces;
    // If a square is being hovered, use the pieces from that square to highlight all their visited squares
    if (hoveredSquareFromContext?.pieces && hoveredSquareFromContext.pieces.length > 0) {
      return hoveredSquareFromContext.pieces;
    }
    return [];
  }, [highlightedPieces, hoveredSquareFromContext]);
  
  // Memoize board rendering for performance
  const boardElements = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex; // Flip to show rank 8 at top
      return [...Array(8)].map((_, file) => {
        const square = board[rank][file];
        const baseColor = square.isLight ? boardColors.light : boardColors.dark;
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        const squareName = `${String.fromCharCode(97 + file)}${rank + 1}`;
        const isHovered = hoveredSquareLocal === squareName;
        
        // Check if this square has any of the effective highlighted pieces
        const isHighlightedFromLegend = effectiveHighlightPieces.length > 0 && square.visits.some(
          v => effectiveHighlightPieces.some(h => h.pieceType === v.piece && h.pieceColor === v.color)
        );
        
        return renderNestedSquares(
          square.visits,
          x,
          y,
          squareSize,
          baseColor,
          effectiveHighlightPieces,
          compareMode,
          isHovered,
          isHighlightedFromLegend
        );
      });
    });
  }, [board, borderWidth, squareSize, effectiveHighlightPieces, compareMode, hoveredSquareLocal, hoveredAnnotation]);

  // Create invisible interaction layer for hover detection
  const interactionSquares = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex;
      return [...Array(8)].map((_, file) => {
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        const square = board[rank][file];
        const hasVisits = square.visits.length > 0;
        
        return (
          <rect
            key={`interact-${rank}-${file}`}
            x={x}
            y={y}
            width={squareSize}
            height={squareSize}
            fill="transparent"
            style={{ cursor: hasVisits ? 'pointer' : 'default' }}
            onMouseEnter={() => handleSquareHover(rank, file)}
            onMouseLeave={handleSquareLeave}
            onTouchStart={(e) => {
              if (hasVisits) {
                e.stopPropagation();
                handleSquareHover(rank, file);
                // Auto-clear after 2 seconds for mobile
                setTimeout(handleSquareLeave, 2000);
              }
            }}
          />
        );
      });
    });
  }, [board, borderWidth, squareSize, handleSquareHover, handleSquareLeave]);
  
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
      
      {/* Invisible interaction layer */}
      {interactionSquares}
    </svg>
  );
};

export default InteractiveVisualizationBoard;
