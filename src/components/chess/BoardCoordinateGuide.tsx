import React, { useMemo } from 'react';
import { 
  TemporalSignature, 
  QuadrantProfile, 
  TemporalFlow 
} from '@/lib/pensent-core/types';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype';

interface BoardCoordinateGuideProps {
  size: number;
  show?: boolean;
  position?: 'inside' | 'outside';
}

// Extract temporal signature from coordinate system layout
function extractCoordinateSignature(size: number, position: 'inside' | 'outside'): TemporalSignature {
  const normalizedSize = Math.min(100, (size / 800) * 100);
  
  const quadrantProfile: QuadrantProfile = {
    q1: position === 'outside' ? 75 : 50, // a-d files, ranks 5-8
    q2: position === 'outside' ? 75 : 50, // e-h files, ranks 5-8
    q3: position === 'outside' ? 75 : 50, // a-d files, ranks 1-4
    q4: position === 'outside' ? 75 : 50, // e-h files, ranks 1-4
  };

  const temporalFlow: TemporalFlow = {
    opening: normalizedSize,
    midgame: normalizedSize,
    endgame: normalizedSize,
  };

  return {
    fingerprint: `coord-${position}-${size}`,
    quadrantProfile,
    temporalFlow,
    intensity: position === 'outside' ? 60 : 40,
    dominantForce: 'coordinate_system',
    keywords: ['board_coordinates', position, 'navigation'],
  };
}

/**
 * Board coordinate guide showing a-h (files) and 1-8 (ranks)
 * Can be positioned inside or outside the board area
 */
const BoardCoordinateGuide: React.FC<BoardCoordinateGuideProps> = ({
  size,
  show = true,
  position = 'outside',
}) => {
  // Extract En Pensent signature for coordinate display
  const { archetype } = useMemo(() => {
    const sig = extractCoordinateSignature(size, position);
    const arch = classifyUniversalArchetype(sig);
    return { signature: sig, archetype: arch };
  }, [size, position]);

  if (!show) return null;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  const squareSize = size / 8;
  const fontSize = Math.max(10, squareSize * 0.2);
  const padding = position === 'outside' ? fontSize * 1.5 : 0;

  if (position === 'inside') {
    return (
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ width: size, height: size }}
        data-archetype={archetype}
      >
        {/* File letters along bottom */}
        {files.map((file, i) => (
          <span
            key={`file-${file}`}
            className="absolute text-muted-foreground/60 font-mono font-medium select-none"
            style={{
              left: i * squareSize + squareSize * 0.08,
              bottom: 2,
              fontSize: fontSize * 0.8,
            }}
          >
            {file}
          </span>
        ))}
        
        {/* Rank numbers along right side */}
        {ranks.map((rank, i) => (
          <span
            key={`rank-${rank}`}
            className="absolute text-muted-foreground/60 font-mono font-medium select-none"
            style={{
              right: 4,
              top: i * squareSize + 2,
              fontSize: fontSize * 0.8,
            }}
          >
            {rank}
          </span>
        ))}
      </div>
    );
  }

  // Outside position - render as frame around board
  return (
    <div 
      className="relative"
      style={{ 
        width: size + padding * 2, 
        height: size + padding * 2,
      }}
      data-archetype={archetype}
    >
      {/* Top file letters */}
      <div 
        className="absolute flex justify-around"
        style={{ 
          top: 0,
          left: padding,
          width: size,
          height: padding,
        }}
      >
        {files.map((file) => (
          <span
            key={`file-top-${file}`}
            className="text-muted-foreground font-mono font-medium flex items-center justify-center select-none"
            style={{ 
              width: squareSize, 
              fontSize,
            }}
          >
            {file}
          </span>
        ))}
      </div>

      {/* Bottom file letters */}
      <div 
        className="absolute flex justify-around"
        style={{ 
          bottom: 0,
          left: padding,
          width: size,
          height: padding,
        }}
      >
        {files.map((file) => (
          <span
            key={`file-bottom-${file}`}
            className="text-muted-foreground font-mono font-medium flex items-center justify-center select-none"
            style={{ 
              width: squareSize, 
              fontSize,
            }}
          >
            {file}
          </span>
        ))}
      </div>

      {/* Left rank numbers */}
      <div 
        className="absolute flex flex-col justify-around"
        style={{ 
          left: 0,
          top: padding,
          width: padding,
          height: size,
        }}
      >
        {ranks.map((rank) => (
          <span
            key={`rank-left-${rank}`}
            className="text-muted-foreground font-mono font-medium flex items-center justify-center select-none"
            style={{ 
              height: squareSize, 
              fontSize,
            }}
          >
            {rank}
          </span>
        ))}
      </div>

      {/* Right rank numbers */}
      <div 
        className="absolute flex flex-col justify-around"
        style={{ 
          right: 0,
          top: padding,
          width: padding,
          height: size,
        }}
      >
        {ranks.map((rank) => (
          <span
            key={`rank-right-${rank}`}
            className="text-muted-foreground font-mono font-medium flex items-center justify-center select-none"
            style={{ 
              height: squareSize, 
              fontSize,
            }}
          >
            {rank}
          </span>
        ))}
      </div>

      {/* Board content slot */}
      <div 
        className="absolute"
        style={{ 
          left: padding, 
          top: padding,
          width: size,
          height: size,
        }}
      />
    </div>
  );
};

export default BoardCoordinateGuide;
