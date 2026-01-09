import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { whitePieceColors, blackPieceColors, PieceType } from '@/lib/chess/pieceColors';

interface ChessLoadingAnimationProps {
  onComplete?: () => void;
}

// Simulated move sequence for the animation - using correct PieceType values
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
];

const ChessLoadingAnimation: React.FC<ChessLoadingAnimationProps> = ({ 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSquares, setVisitedSquares] = useState<Map<string, Array<{ color: string; piece: PieceType }>>>(new Map());
  const [isComplete, setIsComplete] = useState(false);

  // Generate a longer animation sequence by repeating and varying the base sequence
  const animationSequence = useMemo(() => {
    const extended = [...ANIMATION_SEQUENCE];
    // Add more moves to make it feel like a real game
    const additionalMoves: Array<{ square: string; piece: PieceType; isWhite: boolean }> = [
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
    return [...extended, ...additionalMoves];
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < animationSequence.length) {
        const move = animationSequence[currentStep];
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
    }, 80); // Fast animation - 80ms per move

    return () => clearInterval(interval);
  }, [currentStep, animationSequence, onComplete]);

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
              backgroundColor: isLight ? '#f0d9b5' : '#b58863',
            }}
          >
            <AnimatePresence>
              {visits.map((visit, index) => (
                <motion.div
                  key={`${squareName}-${index}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.85 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                    duration: 0.2 
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: visit.color,
                    transform: `scale(${1 - index * 0.15})`,
                    zIndex: index,
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Animated board */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="grid grid-cols-8 gap-0 shadow-2xl rounded-sm overflow-hidden"
          style={{ width: 280, height: 280 }}
        >
          {renderBoard()}
        </div>
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-sm pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 20px rgba(180, 140, 100, 0.2)',
              '0 0 40px rgba(180, 140, 100, 0.4)',
              '0 0 20px rgba(180, 140, 100, 0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Progress indicator */}
      <div className="text-center space-y-3">
        <motion.div 
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {isComplete ? 'Finalizing...' : 'Replaying game'}
          </span>
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>
        
        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / animationSequence.length) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground font-serif">
          Move {Math.min(currentStep, animationSequence.length)} of {animationSequence.length}
        </p>
      </div>
    </div>
  );
};

export default ChessLoadingAnimation;
