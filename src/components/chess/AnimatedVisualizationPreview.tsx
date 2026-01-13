import React, { useMemo, useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface SquareVisit {
  piece: PieceType;
  color: PieceColor;
  moveNumber: number;
  hexColor: string;
}

interface SquareData {
  file: number;
  rank: number;
  visits: SquareVisit[];
  isLight: boolean;
}

interface AnimatedVisualizationPreviewProps {
  pgn: string;
  size?: number;
  className?: string;
  animationSpeed?: number; // ms per move
}

// Convert algebraic notation to file/rank indices
function squareToIndices(square: Square): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

// Get all squares a piece passes through during a move
function getPathSquares(from: Square, to: Square, pieceType: string): Square[] {
  const squares: Square[] = [];
  const fromIndices = squareToIndices(from);
  const toIndices = squareToIndices(to);

  const fileDir = Math.sign(toIndices.file - fromIndices.file);
  const rankDir = Math.sign(toIndices.rank - fromIndices.rank);

  // Knights jump
  if (pieceType.toLowerCase() === 'n') {
    squares.push(to);
    return squares;
  }

  let currentFile = fromIndices.file + fileDir;
  let currentRank = fromIndices.rank + rankDir;

  while (currentFile !== toIndices.file || currentRank !== toIndices.rank) {
    const file = String.fromCharCode('a'.charCodeAt(0) + currentFile);
    const rank = (currentRank + 1).toString();
    squares.push((file + rank) as Square);
    currentFile += fileDir;
    currentRank += rankDir;
  }

  squares.push(to);
  return squares;
}

// Parse moves from PGN
function parseMovesFromPgn(pgn: string): Move[] {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
    return chess.history({ verbose: true });
  } catch {
    return [];
  }
}

// Render nested squares
const renderNestedSquares = (
  visits: SquareVisit[],
  x: number,
  y: number,
  squareSize: number,
  baseColor: string
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;

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

  if (visits.length === 0) return elements;

  const uniqueColors: string[] = [];
  for (const visit of visits) {
    if (!uniqueColors.includes(visit.hexColor)) {
      uniqueColors.push(visit.hexColor);
    }
  }

  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number }[] = [];

  let currentSize = squareSize - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;

  for (let i = 0; i < maxNesting; i++) {
    layers.push({ color: uniqueColors[i], layerSize: currentSize });
    currentSize -= sizeReduction;
    if (currentSize < squareSize * 0.1) break;
  }

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
        style={{
          transition: 'all 0.15s ease-out',
        }}
      />
    );
  }

  return elements;
};

const AnimatedVisualizationPreview: React.FC<AnimatedVisualizationPreviewProps> = ({
  pgn,
  size = 300,
  className = '',
  animationSpeed = 150,
}) => {
  const moves = useMemo(() => parseMovesFromPgn(pgn), [pgn]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  // Animate through moves continuously
  useEffect(() => {
    if (moves.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        // Loop back to start after a pause at the end
        if (prev >= moves.length) {
          return 0;
        }
        return prev + 1;
      });
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [moves.length, animationSpeed]);

  // Build the board state up to current move
  const board = useMemo(() => {
    const boardState: SquareData[][] = [];
    for (let rank = 0; rank < 8; rank++) {
      boardState[rank] = [];
      for (let file = 0; file < 8; file++) {
        const isLight = (rank + file) % 2 === 1;
        boardState[rank][file] = {
          file,
          rank,
          visits: [],
          isLight,
        };
      }
    }

    // Apply moves up to current index
    for (let i = 0; i < Math.min(currentMoveIndex, moves.length); i++) {
      const move = moves[i];
      const pieceType = move.piece as PieceType;
      const pieceColor = move.color as PieceColor;
      const hexColor = getPieceColor(pieceType, pieceColor);

      const pathSquares = getPathSquares(move.from, move.to, move.piece);

      for (const square of pathSquares) {
        const { file, rank } = squareToIndices(square);
        boardState[rank][file].visits.push({
          piece: pieceType,
          color: pieceColor,
          moveNumber: i + 1,
          hexColor,
        });
      }
    }

    return boardState;
  }, [currentMoveIndex, moves]);

  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;

  const boardElements = useMemo(() => {
    return [...Array(8)].map((_, rowIndex) => {
      const rank = 7 - rowIndex;
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
    });
  }, [board, borderWidth, squareSize]);

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        fill={boardColors.border}
      />
      {boardElements}
    </svg>
  );
};

export default AnimatedVisualizationPreview;
