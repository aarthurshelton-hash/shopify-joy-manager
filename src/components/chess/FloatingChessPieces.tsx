import React, { useState, useEffect, useMemo } from 'react';

const chessPieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

// Trail colors for variety
const trailColors = {
  gold: [
    'rgba(212, 175, 55,', // Classic gold
    'rgba(255, 215, 0,',  // Bright gold
    'rgba(218, 165, 32,', // Goldenrod
    'rgba(184, 134, 11,', // Dark gold
  ],
  silver: [
    'rgba(192, 192, 192,', // Silver
    'rgba(169, 169, 169,', // Dark silver
    'rgba(211, 211, 211,', // Light silver
    'rgba(220, 220, 220,', // Gainsboro
  ]
};

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
  colorIdx: number;
}

interface AnimatedPiece {
  id: number;
  piece: string;
  x: number;
  y: number;
  depth: number; // 0-1, higher = closer/larger/faster
  size: number;
  color: 'gold' | 'silver';
  trails: TrailPoint[];
  phase: number;
  speed: number;
}

const FloatingChessPieces: React.FC = () => {
  const initialPieces = useMemo<AnimatedPiece[]>(() => 
    Array.from({ length: 12 }, (_, i) => {
      const depth = Math.random(); // 0 = far, 1 = close
      return {
        id: i,
        piece: chessPieces[Math.floor(Math.random() * chessPieces.length)],
        x: Math.random() * 120 - 10,
        y: 15 + Math.random() * 70,
        depth,
        size: 14 + depth * 22, // Far: 14px, Close: 36px
        color: Math.random() > 0.5 ? 'gold' : 'silver',
        trails: [],
        phase: Math.random() * Math.PI * 2,
        speed: 0.08 + depth * 0.18, // Far: slow, Close: faster
      };
    }), []
  );

  const [pieces, setPieces] = useState(initialPieces);

  useEffect(() => {
    let frameId: number;
    let lastTime = 0;
    const targetInterval = 80; // ~12fps for smooth, low-CPU animation
    
    const animate = (time: number) => {
      if (time - lastTime >= targetInterval) {
        lastTime = time;
        
        setPieces(prev => prev.map(piece => {
          const newPhase = piece.phase + 0.015 * (0.5 + piece.depth);
          const wave = Math.sin(newPhase) * (0.15 + piece.depth * 0.1);
          const vertWave = Math.cos(newPhase * 0.5) * 0.04;
          
          let newX = piece.x + piece.speed + wave;
          let newY = piece.y + vertWave;
          
          // Wrap horizontally
          if (newX > 115) newX = -15;
          
          // Clamp vertical
          newY = Math.max(12, Math.min(88, newY));
          
          // Add trail with random color variation
          const newTrails: TrailPoint[] = [
            { 
              x: piece.x, 
              y: piece.y, 
              opacity: 0.15 + piece.depth * 0.05,
              colorIdx: Math.floor(Math.random() * 4)
            },
            ...piece.trails.map(t => ({ ...t, opacity: t.opacity * 0.78 }))
          ].filter(t => t.opacity > 0.01).slice(0, 5);
          
          return { ...piece, x: newX, y: newY, phase: newPhase, trails: newTrails };
        }));
      }
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => {
        const colors = trailColors[piece.color];
        const baseOpacity = 0.12 + piece.depth * 0.12;
        
        return (
          <React.Fragment key={piece.id}>
            {/* Color trails */}
            {piece.trails.map((trail, idx) => (
              <span
                key={`t-${piece.id}-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${trail.x}%`,
                  top: `${trail.y}%`,
                  fontSize: piece.size,
                  color: `${colors[trail.colorIdx]}${trail.opacity * 0.4})`,
                  textShadow: `0 0 ${6 + piece.depth * 8}px ${colors[trail.colorIdx]}${trail.opacity * 0.25})`,
                  transform: 'translate(-50%, -50%)',
                  filter: `blur(${1.2 - trail.opacity * 3}px)`,
                  zIndex: Math.floor(piece.depth * 10),
                }}
              >
                {piece.piece}
              </span>
            ))}
            
            {/* Main piece - using GPU-accelerated transform */}
            <span
              style={{
                position: 'absolute',
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                fontSize: piece.size,
                color: `${colors[0]}${baseOpacity})`,
                textShadow: `0 0 ${10 + piece.depth * 10}px ${colors[0]}${baseOpacity * 0.6})`,
                transform: 'translate3d(-50%, -50%, 0)',
                filter: `drop-shadow(0 0 ${4 + piece.depth * 6}px ${colors[0]}0.3))`,
                zIndex: Math.floor(piece.depth * 10) + 1,
                willChange: 'left, top',
                backfaceVisibility: 'hidden',
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
