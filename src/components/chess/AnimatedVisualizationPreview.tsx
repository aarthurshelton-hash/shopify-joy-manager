import React, { useMemo, useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { boardColors, getPieceColor, PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { 
  TemporalSignature, 
  QuadrantProfile, 
  TemporalFlow 
} from '@/lib/pensent-core/types';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype';

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
  animationSpeed?: number;
}

function squareToIndices(square: Square): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

function getPathSquares(from: Square, to: Square, pieceType: string): Square[] {
  const squares: Square[] = [];
  const fromIndices = squareToIndices(from);
  const toIndices = squareToIndices(to);

  const fileDir = Math.sign(toIndices.file - fromIndices.file);
  const rankDir = Math.sign(toIndices.rank - fromIndices.rank);

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

function parseMovesFromPgn(pgn: string): Move[] {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
    return chess.history({ verbose: true });
  } catch {
    return [];
  }
}

// Extract temporal signature from animation state
function extractAnimationSignature(
  board: SquareData[][],
  currentMoveIndex: number,
  totalMoves: number
): TemporalSignature {
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
  let totalVisits = 0;

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const visits = board[rank][file].visits.length;
      totalVisits += visits;
      
      if (file < 4 && rank >= 4) q1 += visits;
      else if (file >= 4 && rank >= 4) q2 += visits;
      else if (file < 4 && rank < 4) q3 += visits;
      else q4 += visits;
    }
  }

  const normalize = (v: number) => Math.min(100, (v / Math.max(totalVisits, 1)) * 400);

  const quadrantProfile: QuadrantProfile = {
    q1: normalize(q1),
    q2: normalize(q2),
    q3: normalize(q3),
    q4: normalize(q4),
  };

  const progress = totalMoves > 0 ? currentMoveIndex / totalMoves : 0;
  const temporalFlow: TemporalFlow = {
    opening: progress < 0.3 ? 0.8 : 0.3,
    middle: progress >= 0.3 && progress < 0.7 ? 0.8 : 0.3,
    ending: progress >= 0.7 ? 0.8 : 0.3,
    trend: progress < 0.5 ? 'accelerating' : 'stable',
    momentum: progress < 0.5 ? 0.5 : 0,
  };

  return {
    fingerprint: `anim-${currentMoveIndex}-${totalMoves}`,
    archetype: 'animated_preview',
    quadrantProfile,
    temporalFlow,
    intensity: Math.min(1, (totalVisits / 64) * 0.5),
    dominantForce: q1 + q2 > q3 + q4 ? 'primary' : 'secondary',
    flowDirection: 'forward',
    criticalMoments: [],
  };
}

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

  useEffect(() => {
    if (moves.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        if (prev >= moves.length) {
          return 0;
        }
        return prev + 1;
      });
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [moves.length, animationSpeed]);

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

  // Extract En Pensent signature for current animation state
  const { archetype } = useMemo(() => {
    const sig = extractAnimationSignature(board, currentMoveIndex, moves.length);
    const arch = classifyUniversalArchetype(sig);
    return { signature: sig, archetype: arch };
  }, [board, currentMoveIndex, moves.length]);

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
      data-archetype={archetype}
      data-move={currentMoveIndex}
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
