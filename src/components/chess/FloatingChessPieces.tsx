import React, { useState, useEffect, useCallback } from 'react';

const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

interface AnimatedPiece {
  id: number;
  piece: string;
  x: number;
  y: number;
  baseVx: number;
  size: number;
  color: 'gold' | 'silver';
  trails: TrailPoint[];
  phase: number;
}

const FloatingChessPieces: React.FC = () => {
  const [pieces, setPieces] = useState<AnimatedPiece[]>(() => 
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
      x: Math.random() * 100,
      y: 15 + Math.random() * 70,
      baseVx: 0.15 + Math.random() * 0.25, // Consistent lateral speed
      size: 20 + Math.random() * 24,
      color: Math.random() > 0.5 ? 'gold' : 'silver',
      trails: [],
      phase: Math.random() * Math.PI * 2, // For sine wave movement
    }))
  );

  const updatePieces = useCallback(() => {
    setPieces(prev => prev.map(piece => {
      // Smooth sinusoidal lateral movement
      const newPhase = piece.phase + 0.02;
      const lateralOffset = Math.sin(newPhase) * 0.3;
      const verticalOffset = Math.cos(newPhase * 0.7) * 0.08;
      
      let newX = piece.x + piece.baseVx + lateralOffset;
      let newY = piece.y + verticalOffset;
      let newBaseVx = piece.baseVx;
      
      // Wrap around horizontally
      if (newX > 110) {
        newX = -10;
      } else if (newX < -10) {
        newX = 110;
      }
      
      // Soft bounce vertically
      if (newY < 10) newY = 10;
      if (newY > 90) newY = 90;
      
      // Update trails - add current position, fade existing
      const newTrails: TrailPoint[] = [
        { x: piece.x, y: piece.y, opacity: 0.18 },
        ...piece.trails.map(t => ({ ...t, opacity: t.opacity * 0.82 }))
      ].filter(t => t.opacity > 0.015).slice(0, 6);
      
      return {
        ...piece,
        x: newX,
        y: newY,
        phase: newPhase,
        trails: newTrails,
      };
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(updatePieces, 60); // Consistent 60ms intervals
    return () => clearInterval(interval);
  }, [updatePieces]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => {
        const goldColor = 'rgba(212, 175, 55,';
        const silverColor = 'rgba(192, 192, 192,';
        const baseColor = piece.color === 'gold' ? goldColor : silverColor;
        
        return (
          <React.Fragment key={piece.id}>
            {/* Trails */}
            {piece.trails.map((trail, idx) => (
              <span
                key={`${piece.id}-t-${idx}`}
                className="absolute will-change-transform"
                style={{
                  left: `${trail.x}%`,
                  top: `${trail.y}%`,
                  fontSize: piece.size,
                  color: `${baseColor}${trail.opacity * 0.5})`,
                  textShadow: `0 0 ${8 + trail.opacity * 12}px ${baseColor}${trail.opacity * 0.3})`,
                  transform: 'translate(-50%, -50%)',
                  filter: `blur(${1.5 - trail.opacity * 4}px)`,
                }}
              >
                {piece.piece}
              </span>
            ))}
            
            {/* Main piece */}
            <span
              className="absolute will-change-transform"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                fontSize: piece.size,
                color: `${baseColor}0.22)`,
                textShadow: `0 0 16px ${baseColor}0.35)`,
                transform: 'translate(-50%, -50%)',
                filter: `drop-shadow(0 0 8px ${baseColor}0.4))`,
              }}
            >
              {piece.piece}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FloatingChessPieces;
