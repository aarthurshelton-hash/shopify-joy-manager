// Color palette for each chess piece type
// Multiple themed palettes with visual distinction between piece types

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type PieceColor = 'w' | 'b';
export type PaletteId = 'hotCold' | 'medieval' | 'egyptian' | 'roman' | 'modern' | 'greyscale';

export interface PieceColorMapping {
  piece: PieceType;
  color: PieceColor;
  hex: string;
  name: string;
  symbol: string;
}

export interface ColorPalette {
  id: PaletteId;
  name: string;
  description: string;
  white: Record<PieceType, string>;
  black: Record<PieceType, string>;
}

// === HOT vs COLD (Default) ===
const hotColdPalette: ColorPalette = {
  id: 'hotCold',
  name: 'Hot & Cold',
  description: 'Warm reds vs cool blues for maximum contrast',
  white: {
    k: '#0EA5E9', // Sky Blue
    q: '#10B981', // Emerald Green
    r: '#1D4ED8', // Royal Blue
    b: '#06B6D4', // Cyan
    n: '#8B5CF6', // Violet
    p: '#94A3B8', // Cool Gray
  },
  black: {
    k: '#DC2626', // Crimson Red
    q: '#5B21B6', // Deep Royal Purple
    r: '#EA580C', // Burnt Orange
    b: '#F59E0B', // Amber Gold
    n: '#7F1D1D', // Dark Maroon
    p: '#57534E', // Warm Gray
  },
};

// === MEDIEVAL ===
const medievalPalette: ColorPalette = {
  id: 'medieval',
  name: 'Medieval',
  description: 'Rich jewel tones of castle halls and royal courts',
  white: {
    k: '#C9A227', // Gold Crown
    q: '#1E3A5F', // Noble Navy
    r: '#4A5568', // Castle Stone
    b: '#2D5016', // Forest Green
    n: '#6B4423', // Saddle Brown
    p: '#A8A29E', // Chain Mail Silver
  },
  black: {
    k: '#7C2D12', // Oxblood
    q: '#4C1D95', // Royal Velvet
    r: '#1C1917', // Iron Black
    b: '#831843', // Burgundy
    n: '#3F3F46', // Dark Steel
    p: '#44403C', // Charcoal
  },
};

// === EGYPTIAN ===
const egyptianPalette: ColorPalette = {
  id: 'egyptian',
  name: 'Egyptian',
  description: 'Golden sands and lapis lazuli of ancient temples',
  white: {
    k: '#FFD700', // Pharaoh Gold
    q: '#1E40AF', // Lapis Lazuli
    r: '#D4A574', // Sandstone
    b: '#06B6D4', // Turquoise
    n: '#854D0E', // Papyrus Brown
    p: '#FEF3C7', // Desert Sand
  },
  black: {
    k: '#1F2937', // Obsidian
    q: '#7C3AED', // Amethyst
    r: '#92400E', // Nile Mud
    b: '#059669', // Malachite
    n: '#78350F', // Copper
    p: '#451A03', // Dark Earth
  },
};

// === ROMAN ===
const romanPalette: ColorPalette = {
  id: 'roman',
  name: 'Roman',
  description: 'Imperial marble and terracotta of the Empire',
  white: {
    k: '#7C3AED', // Imperial Purple
    q: '#DC2626', // Roman Red
    r: '#F5F5F4', // Marble White
    b: '#0369A1', // Mediterranean Blue
    n: '#B45309', // Bronze
    p: '#D6D3D1', // Travertine
  },
  black: {
    k: '#1E1B4B', // Senate Indigo
    q: '#991B1B', // Deep Crimson
    r: '#292524', // Volcanic Black
    b: '#0C4A6E', // Deep Sea
    n: '#713F12', // Dark Bronze
    p: '#44403C', // Ash Grey
  },
};

// === MODERN ===
const modernPalette: ColorPalette = {
  id: 'modern',
  name: 'Modern',
  description: 'Clean, vibrant colors for contemporary aesthetics',
  white: {
    k: '#3B82F6', // Electric Blue
    q: '#EC4899', // Hot Pink
    r: '#14B8A6', // Teal
    b: '#A855F7', // Purple
    n: '#F97316', // Orange
    p: '#64748B', // Slate
  },
  black: {
    k: '#1D4ED8', // Deep Blue
    q: '#BE185D', // Magenta
    r: '#0F766E', // Dark Teal
    b: '#7C3AED', // Violet
    n: '#C2410C', // Burnt Orange
    p: '#334155', // Dark Slate
  },
};

// === GREYSCALE (Warm vs Cold greys) ===
const greyscalePalette: ColorPalette = {
  id: 'greyscale',
  name: 'Greyscale',
  description: 'Warm vs cold greys for elegant monochrome prints',
  white: {
    k: '#94A3B8', // Cool Grey 400
    q: '#CBD5E1', // Cool Grey 300
    r: '#64748B', // Cool Grey 500
    b: '#E2E8F0', // Cool Grey 200
    n: '#475569', // Cool Grey 600
    p: '#F1F5F9', // Cool Grey 100
  },
  black: {
    k: '#78716C', // Warm Grey 500
    q: '#A8A29E', // Warm Grey 400
    r: '#57534E', // Warm Grey 600
    b: '#D6D3D1', // Warm Grey 300
    n: '#44403C', // Warm Grey 700
    p: '#292524', // Warm Grey 800
  },
};

// All available palettes
export const colorPalettes: ColorPalette[] = [
  hotColdPalette,
  medievalPalette,
  egyptianPalette,
  romanPalette,
  modernPalette,
  greyscalePalette,
];

// Current active palette (default to hot/cold)
let activePalette: ColorPalette = hotColdPalette;

export function setActivePalette(paletteId: PaletteId): void {
  const palette = colorPalettes.find(p => p.id === paletteId);
  if (palette) {
    activePalette = palette;
  }
}

export function getActivePalette(): ColorPalette {
  return activePalette;
}

// Legacy exports for backwards compatibility
export const whitePieceColors = hotColdPalette.white;
export const blackPieceColors = hotColdPalette.black;

// Get color for a specific piece using active palette
export function getPieceColor(piece: PieceType, color: PieceColor): string {
  return color === 'w' ? activePalette.white[piece] : activePalette.black[piece];
}

// Board square colors
export const boardColors = {
  light: '#FAFAF9',
  dark: '#2C2C2C',
  border: '#1C1917',
};

// Chess piece symbols
const pieceSymbols: Record<PieceType, { white: string; black: string }> = {
  k: { white: '♔', black: '♚' },
  q: { white: '♕', black: '♛' },
  r: { white: '♖', black: '♜' },
  b: { white: '♗', black: '♝' },
  n: { white: '♘', black: '♞' },
  p: { white: '♙', black: '♟' },
};

// Get all piece color mappings for legend using active palette
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
      hex: activePalette.white[piece],
      name: `White ${names[piece]}`,
      symbol: pieceSymbols[piece].white,
    });
    legend.push({
      piece,
      color: 'b',
      hex: activePalette.black[piece],
      name: `Black ${names[piece]}`,
      symbol: pieceSymbols[piece].black,
    });
  }

  return legend;
}
