import React, { useMemo } from 'react';
import { simulateGame, SquareData, SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, colorPalettes, PaletteId } from '@/lib/chess/pieceColors';

interface PaletteVisualizationPreviewProps {
  pgn: string;
  paletteId: PaletteId;
  size?: number;
  className?: string;
}

// Get color for a piece using a specific palette
function getPieceColorForPalette(
  piece: 'p' | 'n' | 'b' | 'r' | 'q' | 'k',
  color: 'w' | 'b',
  paletteId: PaletteId
): string {
  const palette = colorPalettes.find(p => p.id === paletteId) || colorPalettes[0];
  const colorMap = color === 'w' ? palette.white : palette.black;
  return colorMap[piece];
}

// Render nested squares for a single board square
const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string,
  paletteId: PaletteId
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

  // Get unique colors in order using the specified palette
  const uniqueColors: string[] = [];
  for (const visit of visits) {
    const color = getPieceColorForPalette(visit.piece, visit.color, paletteId);
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

  // Draw layers from outside in
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

const PaletteVisualizationPreview: React.FC<PaletteVisualizationPreviewProps> = ({
  pgn,
  paletteId,
  size = 200,
  className = '',
}) => {
  const { board, boardElements } = useMemo(() => {
    const result = simulateGame(pgn);
    const squareSize = size / 8;
    const borderWidth = size * 0.02;

    const elements = [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex;
      return [...Array(8)].map((_, file) => {
        const square = result.board[rank][file];
        const baseColor = square.isLight ? boardColors.light : boardColors.dark;
        const x = borderWidth + file * squareSize;
        const y = borderWidth + rowIndex * squareSize;

        return renderNestedSquares(
          square.visits,
          x,
          y,
          squareSize,
          baseColor,
          paletteId
        );
      });
    });

    return { board: result.board, boardElements: elements };
  }, [pgn, paletteId, size]);

  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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

export default PaletteVisualizationPreview;
