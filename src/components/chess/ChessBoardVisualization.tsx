import React, { useMemo } from 'react';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { useLegendHighlight, HighlightedPiece, HoveredMoveInfo } from '@/contexts/LegendHighlightContext';
import { useEnPensentPatterns } from '@/hooks/useEnPensentPatterns';
import { TemporalSignature } from '@/lib/pensent-core/types/core';

interface ChessBoardVisualizationProps {
  board: SquareData[][];
  size?: number;
  overrideHighlightedPieces?: HighlightedPiece[];
  overrideCompareMode?: boolean;
  signature?: TemporalSignature | null;
}

function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

function visitMatchesAnyHighlight(visit: SquareVisit, highlights: HighlightedPiece[]): boolean {
  if (highlights.length === 0) return true;
  return highlights.some(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

function getMatchingHighlightIndex(visit: SquareVisit, highlights: HighlightedPiece[]): number {
  return highlights.findIndex(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

function getQuadrantForSquare(file: number, rank: number): 'q1' | 'q2' | 'q3' | 'q4' {
  if (file < 4) return rank >= 4 ? 'q1' : 'q3';
  return rank >= 4 ? 'q2' : 'q4';
}

const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string,
  highlightedPieces: HighlightedPiece[],
  compareMode: boolean,
  hoveredMove: HoveredMoveInfo | null,
  squareName: string,
  enPensentGlow?: { color: string; intensity: number }
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;
  
  const hasHighlight = highlightedPieces.length > 0;
  const isHoveredMoveTarget = hoveredMove?.targetSquare === squareName;
  const hoveredMoveMatchingVisits = hoveredMove 
    ? visits.filter(v => v.piece === hoveredMove.piece.pieceType && v.color === hoveredMove.piece.pieceColor)
    : [];
  const hasHoveredMoveVisit = hoveredMoveMatchingVisits.length > 0;
  const matchingVisits = hasHighlight 
    ? visits.filter(v => visitMatchesAnyHighlight(v, highlightedPieces))
    : visits;
  const hasMatchingVisit = matchingVisits.length > 0;
  
  const piece1Present = highlightedPieces.length > 0 && visits.some(
    v => v.piece === highlightedPieces[0].pieceType && v.color === highlightedPieces[0].pieceColor
  );
  const piece2Present = highlightedPieces.length > 1 && visits.some(
    v => v.piece === highlightedPieces[1].pieceType && v.color === highlightedPieces[1].pieceColor
  );
  const isOverlap = piece1Present && piece2Present;
  
  const shouldDim = (hasHighlight && !hasMatchingVisit) || (hoveredMove && !hasHoveredMoveVisit && !isHoveredMoveTarget);
  
  // En Pensent quadrant glow effect
  if (enPensentGlow && enPensentGlow.intensity > 0.1) {
    elements.push(
      <rect
        key={`pensent-glow-${x}-${y}`}
        x={x}
        y={y}
        width={squareSize}
        height={squareSize}
        fill={enPensentGlow.color}
        opacity={enPensentGlow.intensity * 0.1}
        style={{ transition: 'opacity 0.3s ease-out' }}
      />
    );
  }
  
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
  
  if (visits.length === 0) return elements;
  
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
      if (highlightIndex !== -1) uniqueColors[existingIndex].highlightIndex = highlightIndex;
    }
  }
  
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
  
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const offset = (squareSize - layer.layerSize) / 2;
    let opacity = hasHighlight ? (layer.matches ? 1 : 0.15) : 1;
    
    elements.push(
      <rect
        key={`layer-${x}-${y}-${i}`}
        x={x + offset}
        y={y + offset}
        width={layer.layerSize}
        height={layer.layerSize}
        fill={layer.color}
        style={{ opacity, transition: 'opacity 0.2s ease-out' }}
      />
    );
  }
  
  // Highlight effects (existing logic preserved)
  if (hasHighlight && hasMatchingVisit) {
    const glowSize = squareSize * 0.02;
    if (compareMode && highlightedPieces.length === 2) {
      if (isOverlap) {
        elements.push(<rect key={`glow-overlap-${x}-${y}`} x={x + glowSize} y={y + glowSize} width={squareSize - glowSize * 2} height={squareSize - glowSize * 2} fill="none" stroke="rgba(168, 85, 247, 0.8)" strokeWidth={glowSize * 2} />);
      } else if (piece1Present) {
        elements.push(<rect key={`glow-p1-${x}-${y}`} x={x + glowSize} y={y + glowSize} width={squareSize - glowSize * 2} height={squareSize - glowSize * 2} fill="none" stroke="rgba(56, 189, 248, 0.6)" strokeWidth={glowSize * 1.5} />);
      } else if (piece2Present) {
        elements.push(<rect key={`glow-p2-${x}-${y}`} x={x + glowSize} y={y + glowSize} width={squareSize - glowSize * 2} height={squareSize - glowSize * 2} fill="none" stroke="rgba(251, 113, 133, 0.6)" strokeWidth={glowSize * 1.5} />);
      }
    } else {
      elements.push(<rect key={`glow-${x}-${y}`} x={x + glowSize} y={y + glowSize} width={squareSize - glowSize * 2} height={squareSize - glowSize * 2} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={glowSize} />);
    }
  }
  
  if (hoveredMove && (isHoveredMoveTarget || hasHoveredMoveVisit)) {
    const glowSize = squareSize * 0.025;
    if (isHoveredMoveTarget) {
      elements.push(<rect key={`glow-move-target-${x}-${y}`} x={x + glowSize} y={y + glowSize} width={squareSize - glowSize * 2} height={squareSize - glowSize * 2} fill="none" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={glowSize * 2} />);
    } else {
      elements.push(<rect key={`glow-move-piece-${x}-${y}`} x={x + glowSize} y={y + glowSize} width={squareSize - glowSize * 2} height={squareSize - glowSize * 2} fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth={glowSize} />);
    }
  }
  
  return elements;
};

const ChessBoardVisualization: React.FC<ChessBoardVisualizationProps> = ({
  board,
  size = 500,
  overrideHighlightedPieces,
  overrideCompareMode,
  signature
}) => {
  const pattern = useEnPensentPatterns(signature);
  
  // Try to get context - this is safe as hooks are always called
  let contextData: { highlightedPiece: HighlightedPiece | null; lockedPieces: HighlightedPiece[]; compareMode: boolean; hoveredMove: HoveredMoveInfo | null } | null = null;
  try {
    contextData = useLegendHighlight();
  } catch { /* Context not available */ }
  
  const highlightedPieces: HighlightedPiece[] = overrideHighlightedPieces || 
    (contextData?.lockedPieces.length ? contextData.lockedPieces : 
     contextData?.highlightedPiece ? [contextData.highlightedPiece] : []);
  const compareMode = overrideCompareMode ?? contextData?.compareMode ?? false;
  const hoveredMove = contextData?.hoveredMove ?? null;
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;
  
  const getSquareName = (file: number, rank: number): string => {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}`;
  };
  
  const boardElements = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex;
      return [...Array(8)].map((_, file) => {
        const square = board[rank][file];
        const baseColor = square.isLight ? boardColors.light : boardColors.dark;
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;
        const squareName = getSquareName(file, rank);
        
        // En Pensent quadrant-based glow
        const quadrant = getQuadrantForSquare(file, rank);
        const quadrantIntensity = signature ? (pattern.quadrantWeights[quadrant] || 0) : 0;
        const enPensentGlow = signature ? {
          color: pattern.dominantColor,
          intensity: quadrantIntensity * pattern.intensity
        } : undefined;
        
        return renderNestedSquares(
          square.visits,
          x, y,
          squareSize,
          baseColor,
          highlightedPieces,
          compareMode,
          hoveredMove,
          squareName,
          enPensentGlow
        );
      });
    });
  }, [board, borderWidth, squareSize, highlightedPieces, compareMode, hoveredMove, signature, pattern]);
  
  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Border with En Pensent accent */}
      <rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        fill={signature ? pattern.dominantColor : boardColors.border}
        opacity={signature ? 0.9 : 1}
      />
      
      {/* Inner border */}
      <rect
        x={borderWidth * 0.5}
        y={borderWidth * 0.5}
        width={totalSize - borderWidth}
        height={totalSize - borderWidth}
        fill={boardColors.border}
      />
      
      {boardElements}
      
      {/* En Pensent archetype watermark */}
      {signature && (
        <text
          x={totalSize - borderWidth}
          y={totalSize - 4}
          textAnchor="end"
          fontSize={8}
          fill={pattern.dominantColor}
          opacity={0.3}
          fontFamily="monospace"
        >
          {pattern.archetype}
        </text>
      )}
    </svg>
  );
};

export default ChessBoardVisualization;
