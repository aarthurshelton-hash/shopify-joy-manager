import React, { useMemo } from 'react';

// Chess piece unicode symbols
const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

interface Particle {
  id: number;
  piece: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

const ChessParticles: React.FC = () => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 15 + Math.random() * 10,
      size: 16 + Math.random() * 24,
      opacity: 0.03 + Math.random() * 0.07,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-primary animate-float-up"
          style={{
            left: `${particle.left}%`,
            fontSize: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          {particle.piece}
        </div>
      ))}
    </div>
  );
};

export default ChessParticles;
