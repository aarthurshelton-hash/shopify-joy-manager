// Color palette for each chess piece type
// Based on the En Pensent visualization style

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type PieceColor = 'w' | 'b';

export interface PieceColorMapping {
  piece: PieceType;
  color: PieceColor;
  hex: string;
  name: string;
}

// White pieces colors (COLD theme)
export const whitePieceColors: Record<PieceType, string> = {
  k: '#4A90D9', // Cold Blue - King
  q: '#22C55E', // Bright Green - Queen
  r: '#1E3A8A', // Dark Blue - Rook
  b: '#7DD3FC', // Baby Blue - Bishop
  n: '#F9A8D4', // Pastel Pink - Knight
  p: '#D1D5DB', // Light Gray - Pawn
};

// Black pieces colors (HOT theme)
export const blackPieceColors: Record<PieceType, string> = {
  k: '#EF4444', // Bright Red - King
  q: '#A855F7', // Purple - Queen
  r: '#F97316', // Orange - Rook
  b: '#FACC15', // Yellow - Bishop
  n: '#EC4899', // Pink - Knight
  p: '#4B5563', // Dark Gray - Pawn
};

// Get color for a specific piece
export function getPieceColor(piece: PieceType, color: PieceColor): string {
  return color === 'w' ? whitePieceColors[piece] : blackPieceColors[piece];
}

// Board square colors
export const boardColors = {
  light: '#F5F5DC', // Beige/Cream
  dark: '#C9C9C9',  // Light gray (subtle contrast)
  border: '#000000', // Black border
};

// Get all piece color mappings for legend
export function getPieceColorLegend(): PieceColorMapping[] {
  const pieces: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
  const names: Record<PieceType, string> = {
    k: 'King',
    q: 'Queen',
    r: 'Rook',
    b: 'Bishop',
    n: 'Knight',
    p: 'Pawn',
  };

  const legend: PieceColorMapping[] = [];
  
  for (const piece of pieces) {
    legend.push({
      piece,
      color: 'w',
      hex: whitePieceColors[piece],
      name: `White ${names[piece]}`,
    });
    legend.push({
      piece,
      color: 'b',
      hex: blackPieceColors[piece],
      name: `Black ${names[piece]}`,
    });
  }

  return legend;
}
