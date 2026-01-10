import React from 'react';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor } from '@/lib/chess/pieceColors';

interface ChessBoardVisualizationProps {
  board: SquareData[][];
  size?: number;
}

interface NestedSquareProps {
  visits: SquareVisit[];
  baseColor: string;
  size: number;
}

// Get the current color for a visit using the active palette
function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

// Renders nested squares for a single board square
const NestedSquare: React.FC<NestedSquareProps> = ({ visits, baseColor, size }) => {
  const padding = size * 0.08; // Padding between nested squares
  
  // If no visits, just render the base square
  if (visits.length === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: baseColor,
          boxSizing: 'border-box',
        }}
      />
    );
  }
  
  // Get unique colors in order of first appearance (using current palette)
  const uniqueColors: string[] = [];
  for (const visit of visits) {
    const color = getVisitColor(visit);
    if (!uniqueColors.includes(color)) {
      uniqueColors.push(color);
    }
  }
  
  // Calculate sizes for nested squares
  const maxNesting = Math.min(uniqueColors.length, 6); // Limit nesting depth
  const layers: { color: string; size: number }[] = [];
  
  let currentSize = size - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;
  
  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i],
      size: currentSize,
    });
    currentSize -= sizeReduction;
    if (currentSize < size * 0.1) break; // Stop if too small
  }
  
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: baseColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {layers.map((layer, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            width: layer.size,
            height: layer.size,
            backgroundColor: layer.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      ))}
    </div>
  );
};

const ChessBoardVisualization: React.FC<ChessBoardVisualizationProps> = ({
  board,
  size = 500,
}) => {
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  
  return (
    <div
      style={{
        display: 'inline-block',
        padding: borderWidth,
        backgroundColor: boardColors.border,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(8, ${squareSize}px)`,
          gridTemplateRows: `repeat(8, ${squareSize}px)`,
          width: squareSize * 8,
          height: squareSize * 8,
          gap: 0,
        }}
      >
        {/* Render from rank 8 (top) to rank 1 (bottom) */}
        {[...Array(8)].map((_, rowIndex) => {
          const rank = 7 - rowIndex; // Flip to show rank 8 at top
          return [...Array(8)].map((_, file) => {
            const square = board[rank][file];
            const baseColor = square.isLight ? boardColors.light : boardColors.dark;
            
            return (
              <NestedSquare
                key={`${file}-${rank}`}
                visits={square.visits}
                baseColor={baseColor}
                size={squareSize}
              />
            );
          });
        })}
      </div>
    </div>
  );
};

export default ChessBoardVisualization;
