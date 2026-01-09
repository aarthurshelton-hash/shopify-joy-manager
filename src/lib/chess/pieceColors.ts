// Color palette for each chess piece type
// HOT vs COLD opposition: Black pieces are warm/hot, White pieces are cool/cold
// This creates instant visual distinction between the two armies

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type PieceColor = 'w' | 'b';

export interface PieceColorMapping {
  piece: PieceType;
  color: PieceColor;
  hex: string;
  name: string;
  symbol: string;
}

// White pieces colors (COLD theme - Blues, Greens, Cool tones)
// Pure cold spectrum - no warm undertones for maximum distinction
export const whitePieceColors: Record<PieceType, string> = {
  k: '#0EA5E9', // Sky Blue - King (bright, commanding)
  q: '#10B981', // Emerald Green - Queen (powerful, vibrant)
  r: '#1D4ED8', // Royal Blue - Rook (deep, stable)
  b: '#06B6D4', // Cyan - Bishop (diagonal energy)
  n: '#8B5CF6', // Violet - Knight (unique movement)
  p: '#94A3B8', // Cool Gray - Pawn (subtle, numerous)
};

// Black pieces colors (HOT theme - Reds, Oranges, Warm tones)
// Pure warm spectrum - no cool undertones for maximum distinction
export const blackPieceColors: Record<PieceType, string> = {
  k: '#DC2626', // Crimson Red - King (intense, vital)
  q: '#9333EA', // Deep Purple - Queen (regal, warm-leaning)
  r: '#EA580C', // Burnt Orange - Rook (fiery, solid)
  b: '#F59E0B', // Amber Gold - Bishop (warm, angular)
  n: '#E11D48', // Rose Red - Knight (dynamic, warm pink)
  p: '#57534E', // Warm Gray - Pawn (earthy, grounded)
};

// Get color for a specific piece
export function getPieceColor(piece: PieceType, color: PieceColor): string {
  return color === 'w' ? whitePieceColors[piece] : blackPieceColors[piece];
}

// Board square colors - off-white and gunmetal grey for premium look
export const boardColors = {
  light: '#FAFAF9', // Off-white
  dark: '#2C2C2C',  // Gunmetal dark grey (almost black)
  border: '#1C1917', // Near-black border
};

// Chess piece symbols for display
const pieceSymbols: Record<PieceType, { white: string; black: string }> = {
  k: { white: '♔', black: '♚' },
  q: { white: '♕', black: '♛' },
  r: { white: '♖', black: '♜' },
  b: { white: '♗', black: '♝' },
  n: { white: '♘', black: '♞' },
  p: { white: '♙', black: '♟' },
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
      symbol: pieceSymbols[piece].white,
    });
    legend.push({
      piece,
      color: 'b',
      hex: blackPieceColors[piece],
      name: `Black ${names[piece]}`,
      symbol: pieceSymbols[piece].black,
    });
  }

  return legend;
}
