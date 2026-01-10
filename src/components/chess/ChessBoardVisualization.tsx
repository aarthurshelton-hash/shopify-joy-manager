import React from 'react';
import { SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, getPieceColor } from '@/lib/chess/pieceColors';

interface ChessBoardVisualizationProps {
  board: SquareData[][];
  size?: number;
}

// Get the current color for a visit using the active palette
function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

// Renders nested squares for a single board square as SVG rects
const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;
  
  // Draw base square
  elements.push(
    <rect
      key={`base-${x}-${y}`}
      x={x}
      y={y}
      width={squareSize}
      height={squareSize}
      fill={baseColor}
    />
  );
  
  if (visits.length === 0) {
    return elements;
  }
  
  // Get unique colors in order of first appearance
  const uniqueColors: string[] = [];
  for (const visit of visits) {
    const color = getVisitColor(visit);
    if (!uniqueColors.includes(color)) {
      uniqueColors.push(color);
    }
  }
  
  // Calculate sizes for nested squares
  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number }[] = [];
  
  let currentSize = squareSize - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;
  
  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i],
      layerSize: currentSize,
    });
    currentSize -= sizeReduction;
    if (currentSize < squareSize * 0.1) break;
  }
  
  // Draw layers from outside in (largest first)
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const offset = (squareSize - layer.layerSize) / 2;
    elements.push(
      <rect
        key={`layer-${x}-${y}-${i}`}
        x={x + offset}
        y={y + offset}
        width={layer.layerSize}
        height={layer.layerSize}
        fill={layer.color}
      />
    );
  }
  
  return elements;
};

const ChessBoardVisualization: React.FC<ChessBoardVisualizationProps> = ({
  board,
  size = 500,
}) => {
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;
  
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
      {[...Array(8)].map((_, rowIndex) => {
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
            baseColor
          );
        });
      })}
    </svg>
  );
};

export default ChessBoardVisualization;
