import React, { useState, useEffect, useRef } from 'react';

const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
  id: number;
}

interface AnimatedPiece {
  id: number;
  piece: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: 'gold' | 'silver';
  trails: TrailPoint[];
  trailCounter: number;
  directionChangeTimer: number;
}

const FloatingChessPieces: React.FC = () => {
  const [pieces, setPieces] = useState<AnimatedPiece[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initialize pieces
  useEffect(() => {
    const initialPieces: AnimatedPiece[] = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
      x: Math.random() * 100,
      y: 10 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.8, // Lateral velocity
      vy: (Math.random() - 0.5) * 0.15, // Slight vertical drift
      size: 18 + Math.random() * 28,
      color: Math.random() > 0.5 ? 'gold' : 'silver',
      trails: [],
      trailCounter: 0,
      directionChangeTimer: 100 + Math.random() * 200,
    }));
    setPieces(initialPieces);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      
      if (delta > 50) { // ~20fps for smooth trails
        lastTimeRef.current = timestamp;
        
        setPieces(prevPieces => prevPieces.map(piece => {
          // Update position
          let newX = piece.x + piece.vx;
          let newY = piece.y + piece.vy;
          let newVx = piece.vx;
          let newVy = piece.vy;
          
          // Bounce off edges with randomization
          if (newX < -5 || newX > 105) {
            newVx = -newVx * (0.8 + Math.random() * 0.4);
            newX = Math.max(-5, Math.min(105, newX));
          }
          if (newY < 5 || newY > 95) {
            newVy = -newVy * (0.8 + Math.random() * 0.4);
            newY = Math.max(5, Math.min(95, newY));
          }
          
          // Random direction changes
          let newTimer = piece.directionChangeTimer - 1;
          if (newTimer <= 0) {
            newVx = (Math.random() - 0.5) * 1.2;
            newVy = (Math.random() - 0.5) * 0.2;
            newTimer = 80 + Math.random() * 180;
          }
          
          // Add trail point
          const newTrails = [
            { x: piece.x, y: piece.y, opacity: 0.2, id: piece.trailCounter },
            ...piece.trails
          ]
            .map(t => ({ ...t, opacity: t.opacity * 0.88 })) // Fade trails
            .filter(t => t.opacity > 0.01) // Remove faded trails
            .slice(0, 8); // Keep max 8 trail points
          
          return {
            ...piece,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            trails: newTrails,
            trailCounter: piece.trailCounter + 1,
            directionChangeTimer: newTimer,
          };
        }));
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getColor = (color: 'gold' | 'silver', opacity: number) => {
    if (color === 'gold') {
      return `rgba(212, 175, 55, ${opacity})`;
    }
    return `rgba(192, 192, 192, ${opacity})`;
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => (
        <React.Fragment key={piece.id}>
          {/* Trail elements */}
          {piece.trails.map((trail) => (
            <div
              key={`${piece.id}-trail-${trail.id}`}
              className="absolute transition-none"
              style={{
                left: `${trail.x}%`,
                top: `${trail.y}%`,
                fontSize: `${piece.size}px`,
                color: getColor(piece.color, trail.opacity * 0.6),
                textShadow: `0 0 ${12 + trail.opacity * 20}px ${getColor(piece.color, trail.opacity * 0.4)}`,
                filter: `blur(${(1 - trail.opacity) * 2}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {piece.piece}
            </div>
          ))}
          
          {/* Main piece */}
          <div
            className="absolute transition-none"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              fontSize: `${piece.size}px`,
              color: getColor(piece.color, 0.25),
              textShadow: piece.color === 'gold'
                ? '0 0 20px rgba(212, 175, 55, 0.4)'
                : '0 0 20px rgba(192, 192, 192, 0.3)',
              filter: `drop-shadow(0 0 10px ${getColor(piece.color, 0.5)})`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {piece.piece}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FloatingChessPieces;
