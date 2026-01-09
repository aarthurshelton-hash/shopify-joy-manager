import React, { useEffect, useState, useMemo } from 'react';
import { whitePieceColors, blackPieceColors, PieceType } from '@/lib/chess/pieceColors';

interface ChessLoadingAnimationProps {
  onComplete?: () => void;
  totalMoves?: number;
}

// Simulated move sequence for the animation
const ANIMATION_SEQUENCE: Array<{ square: string; piece: PieceType; isWhite: boolean }> = [
  { square: 'e2', piece: 'p', isWhite: true },
  { square: 'e4', piece: 'p', isWhite: true },
  { square: 'e7', piece: 'p', isWhite: false },
  { square: 'e5', piece: 'p', isWhite: false },
  { square: 'g1', piece: 'n', isWhite: true },
  { square: 'f3', piece: 'n', isWhite: true },
  { square: 'b8', piece: 'n', isWhite: false },
  { square: 'c6', piece: 'n', isWhite: false },
  { square: 'f1', piece: 'b', isWhite: true },
  { square: 'b5', piece: 'b', isWhite: true },
  { square: 'a7', piece: 'p', isWhite: false },
  { square: 'a6', piece: 'p', isWhite: false },
  { square: 'b5', piece: 'b', isWhite: true },
  { square: 'a4', piece: 'b', isWhite: true },
  { square: 'g8', piece: 'n', isWhite: false },
  { square: 'f6', piece: 'n', isWhite: false },
  { square: 'e1', piece: 'k', isWhite: true },
  { square: 'g1', piece: 'k', isWhite: true },
  { square: 'f1', piece: 'r', isWhite: true },
  { square: 'd8', piece: 'q', isWhite: false },
  { square: 'e7', piece: 'q', isWhite: false },
  { square: 'd2', piece: 'p', isWhite: true },
  { square: 'd4', piece: 'p', isWhite: true },
  { square: 'c8', piece: 'b', isWhite: false },
  { square: 'g4', piece: 'b', isWhite: false },
  { square: 'c1', piece: 'b', isWhite: true },
  { square: 'e3', piece: 'b', isWhite: true },
  { square: 'h7', piece: 'p', isWhite: false },
  { square: 'h6', piece: 'p', isWhite: false },
  { square: 'd1', piece: 'q', isWhite: true },
  { square: 'd3', piece: 'q', isWhite: true },
];

const ChessLoadingAnimation: React.FC<ChessLoadingAnimationProps> = ({ 
  onComplete,
  totalMoves = ANIMATION_SEQUENCE.length
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSquares, setVisitedSquares] = useState<Map<string, Array<{ color: string; piece: PieceType }>>>(new Map());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < ANIMATION_SEQUENCE.length) {
        const move = ANIMATION_SEQUENCE[currentStep];
        const { piece, isWhite } = move;
        const color = isWhite ? whitePieceColors[piece] : blackPieceColors[piece];
        
        setVisitedSquares(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(move.square) || [];
          newMap.set(move.square, [...existing, { color, piece }]);
          return newMap;
        });
        
        setCurrentStep(prev => prev + 1);
      } else {
        setIsComplete(true);
        clearInterval(interval);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [currentStep, onComplete]);

  // Render the 8x8 grid
  const renderBoard = () => {
    const squares = [];
    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const squareName = String.fromCharCode(97 + file) + (rank + 1);
        const visits = visitedSquares.get(squareName) || [];
        const isLight = (file + rank) % 2 === 1;
        
        squares.push(
          <div
            key={squareName}
            className="relative aspect-square"
            style={{
              backgroundColor: isLight ? '#FAFAF9' : '#2C2C2C',
            }}
          >
            {visits.map((visit, index) => (
              <div
                key={`${squareName}-${index}`}
                className="absolute inset-0 animate-scale-in"
                style={{
                  backgroundColor: visit.color,
                  opacity: 0.85,
                  transform: `scale(${1 - index * 0.15})`,
                  zIndex: index,
                }}
              />
            ))}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 animate-fade-in">
      {/* Animated board */}
      <div className="relative">
        <div 
          className="grid grid-cols-8 gap-0 shadow-2xl rounded-sm overflow-hidden"
          style={{ width: 280, height: 280 }}
        >
          {renderBoard()}
        </div>
        
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 rounded-sm pointer-events-none animate-pulse"
          style={{
            boxShadow: '0 0 30px rgba(180, 140, 100, 0.3)',
          }}
        />
      </div>

      {/* Progress indicator */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            {isComplete ? 'Finalizing...' : 'Replaying game'}
          </span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
        
        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${(currentStep / ANIMATION_SEQUENCE.length) * 100}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground font-serif">
          Move {Math.min(currentStep, ANIMATION_SEQUENCE.length)} of {totalMoves}
        </p>
      </div>
    </div>
  );
};

export default ChessLoadingAnimation;
