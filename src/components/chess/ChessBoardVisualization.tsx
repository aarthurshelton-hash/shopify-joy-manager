import React, { useMemo } from 'react';
import { SquareData } from '@/lib/chess/gameSimulator';
import { boardColors } from '@/lib/chess/pieceColors';
import { useOptionalLegendHighlight, HighlightedPiece } from '@/contexts/LegendHighlightContext';
import { useEnPensentPatterns } from '@/hooks/useEnPensentPatterns';
import { TemporalSignature } from '@/lib/pensent-core/types/core';
import { renderNestedSquares } from '@/lib/chess/boardRenderer';

interface ChessBoardVisualizationProps {
  board: SquareData[][];
  size?: number;
  overrideHighlightedPieces?: HighlightedPiece[];
  overrideCompareMode?: boolean;
  signature?: TemporalSignature | null;
}

function getQuadrantForSquare(file: number, rank: number): 'q1' | 'q2' | 'q3' | 'q4' {
  if (file < 4) return rank >= 4 ? 'q1' : 'q3';
  return rank >= 4 ? 'q2' : 'q4';
}

const ChessBoardVisualization: React.FC<ChessBoardVisualizationProps> = ({
  board,
  size = 500,
  overrideHighlightedPieces,
  overrideCompareMode,
  signature
}) => {
  const pattern = useEnPensentPatterns(signature);
  
  const contextData = useOptionalLegendHighlight();
  
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
        
        return renderNestedSquares({
          visits: square.visits,
          x, y,
          squareSize,
          baseColor,
          highlightedPieces,
          compareMode,
          hoveredMove,
          squareName,
          enPensentGlow,
        });
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
