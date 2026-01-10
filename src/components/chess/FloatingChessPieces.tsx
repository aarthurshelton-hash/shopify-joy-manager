import React, { useMemo } from 'react';

// Chess piece unicode symbols
const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

interface FloatingPiece {
  id: number;
  piece: string;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  color: 'gold' | 'silver';
  animation: 'drift' | 'float' | 'sway';
}

const FloatingChessPieces: React.FC = () => {
  const pieces = useMemo<FloatingPiece[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
      left: Math.random() * 100,
      top: 10 + Math.random() * 80, // Spread across the vertical space
      delay: Math.random() * 10,
      duration: 20 + Math.random() * 15,
      size: 20 + Math.random() * 32,
      color: Math.random() > 0.5 ? 'gold' : 'silver',
      animation: ['drift', 'float', 'sway'][Math.floor(Math.random() * 3)] as 'drift' | 'float' | 'sway',
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute transition-opacity ${
            piece.animation === 'drift' 
              ? 'animate-drift' 
              : piece.animation === 'float' 
              ? 'animate-float-subtle' 
              : 'animate-sway'
          }`}
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            fontSize: `${piece.size}px`,
            opacity: piece.color === 'gold' ? 0.15 : 0.1,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            color: piece.color === 'gold' 
              ? '#D4AF37' // Classic gold
              : '#C0C0C0', // Silver
            textShadow: piece.color === 'gold'
              ? '0 0 20px rgba(212, 175, 55, 0.3)'
              : '0 0 20px rgba(192, 192, 192, 0.2)',
            filter: `drop-shadow(0 0 8px ${piece.color === 'gold' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(192, 192, 192, 0.3)'})`,
          }}
        >
          {piece.piece}
        </div>
      ))}
    </div>
  );
};

export default FloatingChessPieces;
