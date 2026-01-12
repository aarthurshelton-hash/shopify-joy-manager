import React from 'react';

interface BoardCoordinateGuideProps {
  size: number;
  show?: boolean;
  position?: 'inside' | 'outside';
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
  if (!show) return null;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  const squareSize = size / 8;
  const fontSize = Math.max(10, squareSize * 0.2);
  const padding = position === 'outside' ? fontSize * 1.5 : 0;

  if (position === 'inside') {
    // Render coordinates inside the board corners
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ width: size, height: size }}>
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

      {/* Board content slot - positioned in center */}
      <div 
        className="absolute"
        style={{ 
          left: padding, 
          top: padding,
          width: size,
          height: size,
        }}
      >
        {/* Children would be rendered here via a slot pattern */}
      </div>
    </div>
  );
};

export default BoardCoordinateGuide;
