import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { whitePieceColors, blackPieceColors, PieceType } from '@/lib/chess/pieceColors';
import { useEnPensentPatterns } from '@/hooks/useEnPensentPatterns';
import { TemporalSignature, TemporalFlow, QuadrantProfile } from '@/lib/pensent-core/types/core';

interface ChessLoadingAnimationProps {
  onComplete?: () => void;
  totalMoves?: number;
  signature?: TemporalSignature | null;
}

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
  totalMoves = ANIMATION_SEQUENCE.length,
  signature
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSquares, setVisitedSquares] = useState<Map<string, Array<{ color: string; piece: PieceType }>>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  
  const pattern = useEnPensentPatterns(signature);
  
  // Calculate temporal flow phase based on progress
  const temporalPhase = useMemo(() => {
    const progress = currentStep / ANIMATION_SEQUENCE.length;
    if (progress < 0.33) return 'opening';
    if (progress < 0.66) return 'middle';
    return 'ending';
  }, [currentStep]);

  useEffect(() => {
    const baseSpeed = 80;
    const intensityVal = pattern.intensity ?? 0.5;
    const speedMultiplier = intensityVal > 0.7 ? 0.7 : intensityVal < 0.3 ? 1.3 : 1;
    
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
        setTimeout(() => onComplete?.(), 500);
      }
    }, baseSpeed * speedMultiplier);

    return () => clearInterval(interval);
  }, [currentStep, onComplete, pattern.intensity]);

  const renderBoard = () => {
    const squares = [];
    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const squareName = String.fromCharCode(97 + file) + (rank + 1);
        const visits = visitedSquares.get(squareName) || [];
        const isLight = (file + rank) % 2 === 1;
        
        // Quadrant-based intensity from En Pensent
        const quadrant = file < 4 ? (rank < 4 ? 'q3' : 'q1') : (rank < 4 ? 'q4' : 'q2');
        const quadrantWeight = pattern.quadrantWeights[quadrant as keyof typeof pattern.quadrantWeights] || 0.25;
        
        squares.push(
          <motion.div
            key={squareName}
            className="relative aspect-square"
            style={{
              backgroundColor: isLight ? '#FAFAF9' : '#2C2C2C',
            }}
            animate={{
              boxShadow: visits.length > 0 && signature 
                ? `inset 0 0 ${quadrantWeight * 20}px ${pattern.dominantColor}30`
                : 'none'
            }}
          >
            {visits.map((visit, index) => (
              <motion.div
                key={`${squareName}-${index}`}
                className="absolute inset-0"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1 - index * 0.15, opacity: 0.85 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  backgroundColor: visit.color,
                  zIndex: index,
                }}
              />
            ))}
          </motion.div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 animate-fade-in">
      <div className="relative">
        <motion.div 
          className="grid grid-cols-8 gap-0 shadow-2xl rounded-sm overflow-hidden"
          style={{ width: 280, height: 280 }}
          animate={{
            boxShadow: signature 
              ? `0 0 ${30 * pattern.intensity}px ${pattern.dominantColor}40`
              : '0 0 30px rgba(180, 140, 100, 0.3)'
          }}
        >
          {renderBoard()}
        </motion.div>
        
        {/* En Pensent temporal flow indicator */}
        {signature && (
          <motion.div
            className="absolute -bottom-6 left-0 right-0 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: `${pattern.secondaryColor}30` }}
          >
            <motion.div
              className="h-full"
              style={{ backgroundColor: pattern.dominantColor }}
              animate={{ width: `${(currentStep / ANIMATION_SEQUENCE.length) * 100}%` }}
            />
          </motion.div>
        )}
      </div>

      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: pattern.dominantColor }}
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {isComplete ? 'Finalizing...' : `Replaying ${temporalPhase} phase`}
          </span>
          <motion.div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: pattern.secondaryColor }}
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </div>
        
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full transition-all duration-100 ease-out"
            style={{ 
              width: `${(currentStep / ANIMATION_SEQUENCE.length) * 100}%`,
              background: `linear-gradient(90deg, ${pattern.dominantColor}, ${pattern.secondaryColor})`
            }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground font-serif">
          Move {Math.min(currentStep, ANIMATION_SEQUENCE.length)} of {totalMoves}
          {signature && <span className="ml-2 opacity-50">• {pattern.archetype}</span>}
        </p>
      </div>
    </div>
  );
};

export default ChessLoadingAnimation;
