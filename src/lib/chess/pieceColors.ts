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

// White pieces colors
export const whitePieceColors: Record<PieceType, string> = {
  k: '#C9A227', // Gold - King
  q: '#8B0000', // Dark Red - Queen
  r: '#1E3A5F', // Navy Blue - Rook
  b: '#4A5D23', // Olive Green - Bishop
  n: '#FF6B35', // Orange - Knight
  p: '#8B8B8B', // Gray - Pawn
};

// Black pieces colors
export const blackPieceColors: Record<PieceType, string> = {
  k: '#2D2D2D', // Charcoal - King
  q: '#800020', // Burgundy - Queen
  r: '#000080', // Dark Blue - Rook
  b: '#355E3B', // Hunter Green - Bishop
  n: '#CC5500', // Burnt Orange - Knight
  p: '#4A4A4A', // Dark Gray - Pawn
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
