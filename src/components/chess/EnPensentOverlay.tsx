import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareVisit } from '@/lib/chess/gameSimulator';
import { boardColors, PieceType, PieceColor } from '@/lib/chess/pieceColors';

interface MoveHistoryEntry {
  square: string;
  piece: PieceType;
  color: PieceColor;
  moveNumber: number;
}

interface EnPensentOverlayProps {
  moveHistory: MoveHistoryEntry[];
  whitePalette: Record<string, string>;
  blackPalette: Record<string, string>;
  opacity: number;
  isEnabled: boolean;
  flipped?: boolean;
}

// Parse square notation to grid position
const squareToPosition = (square: string, flipped: boolean): { row: number; col: number } => {
  const col = square.charCodeAt(0) - 97; // 'a' = 0, 'h' = 7
  const row = 8 - parseInt(square[1]); // '8' = 0, '1' = 7
  
  if (flipped) {
    return { row: 7 - row, col: 7 - col };
  }
  return { row, col };
};

// Group moves by square and get color layers
const buildSquareColorLayers = (
  moveHistory: MoveHistoryEntry[],
  whitePalette: Record<string, string>,
  blackPalette: Record<string, string>
): Map<string, string[]> => {
  const squareLayers = new Map<string, string[]>();
  
  for (const move of moveHistory) {
    const palette = move.color === 'w' ? whitePalette : blackPalette;
    const color = palette[move.piece] || '#888888';
    
    if (!squareLayers.has(move.square)) {
      squareLayers.set(move.square, []);
    }
    
    const layers = squareLayers.get(move.square)!;
    // Add color if not already the last one (avoid duplicates)
    if (layers[layers.length - 1] !== color) {
      layers.push(color);
    }
  }
  
  return squareLayers;
};

export const EnPensentOverlay: React.FC<EnPensentOverlayProps> = ({
  moveHistory,
  whitePalette,
  blackPalette,
  opacity,
  isEnabled,
  flipped = false,
}) => {
  // Build color layers for each square
  const squareColorLayers = useMemo(() => 
    buildSquareColorLayers(moveHistory, whitePalette, blackPalette),
    [moveHistory, whitePalette, blackPalette]
  );

  if (!isEnabled || opacity === 0) {
    return null;
  }

  // Render nested rectangles for a single square
  const renderSquareVisualization = (square: string, colors: string[]) => {
    const { row, col } = squareToPosition(square, flipped);
    const maxLayers = Math.min(colors.length, 6);
    
    return (
      <div
        key={square}
        className="absolute"
        style={{
          top: `${row * 12.5}%`,
          left: `${col * 12.5}%`,
          width: '12.5%',
          height: '12.5%',
          opacity,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence mode="sync">
          {colors.slice(0, maxLayers).map((color, layerIndex) => {
            // Calculate nested sizing (outermost = largest)
            const padding = 8; // percentage padding
            const layerSize = 100 - padding - (layerIndex * (70 / maxLayers));
            const offset = (100 - layerSize) / 2;
            
            return (
              <motion.div
                key={`${square}-layer-${layerIndex}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: layerIndex * 0.05,
                }}
                className="absolute"
                style={{
                  backgroundColor: color,
                  top: `${offset}%`,
                  left: `${offset}%`,
                  width: `${layerSize}%`,
                  height: `${layerSize}%`,
                  borderRadius: '2px',
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-[5]"
      style={{
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      {Array.from(squareColorLayers.entries()).map(([square, colors]) =>
        renderSquareVisualization(square, colors)
      )}
    </div>
  );
};

export type { MoveHistoryEntry };
