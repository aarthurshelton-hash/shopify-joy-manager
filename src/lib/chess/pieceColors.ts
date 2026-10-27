// Color palette for each chess piece type
// Multiple themed palettes with visual distinction between piece types

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type PieceColor = 'w' | 'b';
export type PaletteId = 
  | 'hotCold' | 'medieval' | 'egyptian' | 'roman' | 'modern' | 'greyscale'
  | 'japanese' | 'nordic' | 'artdeco' | 'tropical' | 'cyberpunk' 
  | 'autumn' | 'ocean' | 'desert' | 'cosmic' | 'vintage' | 'custom'
  | 'clear' | 'contrast' | 'stainedglass' | 'aurora' | 'volcanic' | 'woodland' | 'spectral' | 'inkgold';

export interface PieceColorMapping {
  piece: PieceType;
  color: PieceColor;
  hex: string;
  name: string;
  symbol: string;
}

export interface PaletteLegendTheme {
  whiteName: string;
  whiteEmoji: string;
  blackName: string;
  blackEmoji: string;
}

export interface ColorPalette {
  id: PaletteId;
  name: string;
  description: string;
  white: Record<PieceType, string>;
  black: Record<PieceType, string>;
  legendTheme: PaletteLegendTheme;
  backgroundImage?: string;
}

// === HOT vs COLD (Default) ===
const hotColdPalette: ColorPalette = {
  id: 'hotCold',
  name: 'Hot & Cold',
  description: 'Warm reds vs cool blues for maximum contrast',
  backgroundImage: 'hotcold',
  white: {
    k: '#4E4F65',
    q: '#9CC295',
    r: '#6A6CFB',
    b: '#65C7E8',
    n: '#A56796',
    p: '#9F9F9F',
  },
  black: {
    k: '#B62204',
    q: '#7824BA',
    r: '#D46B1D',
    b: '#EFAF37',
    n: '#6D3B3F',
    p: '#7A7057',
  },
  legendTheme: {
    whiteName: 'Cold',
    whiteEmoji: '❄️',
    blackName: 'Hot',
    blackEmoji: '🔥',
  },
};

// === MEDIEVAL ===
const medievalPalette: ColorPalette = {
  id: 'medieval',
  name: 'Medieval',
  description: 'Rich jewel tones of castle halls and royal courts',
  backgroundImage: 'medieval',
  white: {
    k: '#FEAC43',
    q: '#0F1059',
    r: '#6E767C',
    b: '#042901',
    n: '#8F6A50',
    p: '#C8BBAE',
  },
  black: {
    k: '#A42A07',
    q: '#222EEF',
    r: '#070504',
    b: '#8D307D',
    n: '#3E404D',
    p: '#534C36',
  },
  legendTheme: {
    whiteName: 'Kings',
    whiteEmoji: '👑',
    blackName: 'Wizards',
    blackEmoji: '🧙',
  },
};

// === EGYPTIAN ===
const egyptianPalette: ColorPalette = {
  id: 'egyptian',
  name: 'Egyptian',
  description: 'Golden sands and lapis lazuli of ancient temples',
  backgroundImage: 'egyptian',
  white: {
    k: '#E3CC1C',
    q: '#45558C',
    r: '#CC944D',
    b: '#1CBADB',
    n: '#795304',
    p: '#BEBEA4',
  },
  black: {
    k: '#4A4A4A',
    q: '#914EFF',
    r: '#AF644A',
    b: '#648F82',
    n: '#6C1B1C',
    p: '#1F0100',
  },
  legendTheme: {
    whiteName: 'Pharaohs',
    whiteEmoji: '☀️',
    blackName: 'Anubis',
    blackEmoji: '🐺',
  },
};

// === ROMAN ===
const romanPalette: ColorPalette = {
  id: 'roman',
  name: 'Roman',
  description: 'Imperial marble and terracotta of the Empire',
  backgroundImage: 'roman',
  white: {
    k: '#926EFE',
    q: '#F16860',
    r: '#DFD9B8',
    b: '#3A6FA6',
    n: '#9A6810',
    p: '#A0A0A0',
  },
  black: {
    k: '#00033C',
    q: '#9D2439',
    r: '#0F0200',
    b: '#10505B',
    n: '#4C2B01',
    p: '#6A6865',
  },
  legendTheme: {
    whiteName: 'Emperors',
    whiteEmoji: '🏛️',
    blackName: 'Gladiators',
    blackEmoji: '⚔️',
  },
};

// === MODERN ===
const modernPalette: ColorPalette = {
  id: 'modern',
  name: 'Modern',
  description: 'Clean, vibrant colors for contemporary aesthetics',
  backgroundImage: 'modern',
  white: {
    k: '#90A7FD',
    q: '#FC2A79',
    r: '#12D3AE',
    b: '#9C72B1',
    n: '#FB9360',
    p: '#888888',
  },
  black: {
    k: '#2C5289',
    q: '#823251',
    r: '#2F8151',
    b: '#4301FE',
    n: '#B01208',
    p: '#242424',
  },
  legendTheme: {
    whiteName: 'Digital',
    whiteEmoji: '💎',
    blackName: 'Neon',
    blackEmoji: '⚡',
  },
};

// === GREYSCALE (Warm vs Cold greys) ===
const greyscalePalette: ColorPalette = {
  id: 'greyscale',
  name: 'Greyscale',
  description: 'Warm vs cold greys for elegant monochrome prints',
  backgroundImage: 'greyscale',
  white: {
    k: '#6987FA',
    q: '#93B5BA',
    r: '#685D80',
    b: '#CDD0FE',
    n: '#0354CE',
    p: '#FFF1EC',
  },
  black: {
    k: '#818181',
    q: '#B78E76',
    r: '#765F3C',
    b: '#C6C5A2',
    n: '#414141',
    p: '#1C0200',
  },
  legendTheme: {
    whiteName: 'Cool',
    whiteEmoji: '🌙',
    blackName: 'Warm',
    blackEmoji: '🌅',
  },
};

// === JAPANESE ===
const japanesePalette: ColorPalette = {
  id: 'japanese',
  name: 'Japanese',
  description: 'Sakura blossoms and zen garden tranquility',
  backgroundImage: 'japanese',
  white: {
    k: '#B55F92',
    q: '#4FD67E',
    r: '#D8ADD1',
    b: '#CBF02A',
    n: '#EC8C05',
    p: '#CCCAC0',
  },
  black: {
    k: '#E6444B',
    q: '#1F6058',
    r: '#6B2B27',
    b: '#599477',
    n: '#A74000',
    p: '#161616',
  },
  legendTheme: {
    whiteName: 'Sakura',
    whiteEmoji: '🌸',
    blackName: 'Samurai',
    blackEmoji: '⚔️',
  },
};

// === NORDIC ===
const nordicPalette: ColorPalette = {
  id: 'nordic',
  name: 'Nordic',
  description: 'Aurora borealis over frozen Scandinavian nights',
  backgroundImage: 'nordic',
  white: {
    k: '#59BAF6',
    q: '#9A68FD',
    r: '#87B19F',
    b: '#44F5FF',
    n: '#B8D67D',
    p: '#E4E0D7',
  },
  black: {
    k: '#11879A',
    q: '#56316B',
    r: '#607261',
    b: '#1F51CB',
    n: '#0A6005',
    p: '#060606',
  },
  legendTheme: {
    whiteName: 'Aurora',
    whiteEmoji: '✨',
    blackName: 'Frost',
    blackEmoji: '❄️',
  },
};

// === ART DECO ===
const artdecoPalette: ColorPalette = {
  id: 'artdeco',
  name: 'Art Deco',
  description: '1920s glamour with gold and geometric elegance',
  backgroundImage: 'artdeco',
  white: {
    k: '#EFF80E',
    q: '#BFBFBF',
    r: '#FFD6A2',
    b: '#CA8F01',
    n: '#BAB46F',
    p: '#DEFFE9',
  },
  black: {
    k: '#060606',
    q: '#36190A',
    r: '#444444',
    b: '#685134',
    n: '#787876',
    p: '#414485',
  },
  legendTheme: {
    whiteName: 'Gold',
    whiteEmoji: '✨',
    blackName: 'Noir',
    blackEmoji: '🎭',
  },
};

// === TROPICAL ===
const tropicalPalette: ColorPalette = {
  id: 'tropical',
  name: 'Tropical',
  description: 'Vibrant jungle paradise with exotic colors',
  backgroundImage: 'tropical',
  white: {
    k: '#7AB18C',
    q: '#F46C55',
    r: '#C5FF1E',
    b: '#E3D58F',
    n: '#F0A306',
    p: '#56FED4',
  },
  black: {
    k: '#247E6B',
    q: '#A01B06',
    r: '#56583E',
    b: '#A66904',
    n: '#3E1800',
    p: '#024541',
  },
  legendTheme: {
    whiteName: 'Paradise',
    whiteEmoji: '🌴',
    blackName: 'Jungle',
    blackEmoji: '🦜',
  },
};

// === CYBERPUNK ===
const cyberpunkPalette: ColorPalette = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon-lit dystopian future cityscapes',
  backgroundImage: 'cyberpunk',
  white: {
    k: '#FC6E80',
    q: '#7FAEB2',
    r: '#CC6EFD',
    b: '#7C7FA7',
    n: '#69F1DB',
    p: '#C5BDFB',
  },
  black: {
    k: '#BF313A',
    q: '#3B595B',
    r: '#844195',
    b: '#120D85',
    n: '#0644FE',
    p: '#0B0016',
  },
  legendTheme: {
    whiteName: 'Neon',
    whiteEmoji: '💜',
    blackName: 'Shadow',
    blackEmoji: '🌆',
  },
};

// === AUTUMN ===
const autumnPalette: ColorPalette = {
  id: 'autumn',
  name: 'Autumn',
  description: 'Golden harvest and falling maple leaves',
  backgroundImage: 'autumn',
  white: {
    k: '#FDB213',
    q: '#D13A5D',
    r: '#F6E38E',
    b: '#D57F6A',
    n: '#F76D02',
    p: '#C8CEC1',
  },
  black: {
    k: '#A16104',
    q: '#6D2A35',
    r: '#412600',
    b: '#9A2604',
    n: '#745E4B',
    p: '#1E0402',
  },
  legendTheme: {
    whiteName: 'Harvest',
    whiteEmoji: '🍂',
    blackName: 'Forest',
    blackEmoji: '🍁',
  },
};

// === OCEAN ===
const oceanPalette: ColorPalette = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Deep sea mysteries and coral reef wonders',
  backgroundImage: 'ocean',
  white: {
    k: '#1481F4',
    q: '#8BA7AB',
    r: '#04F4FF',
    b: '#A1DAAE',
    n: '#24B8FC',
    p: '#F6F5F0',
  },
  black: {
    k: '#2246DA',
    q: '#147B82',
    r: '#4C4F52',
    b: '#2E5B36',
    n: '#000F3D',
    p: '#130000',
  },
  legendTheme: {
    whiteName: 'Surface',
    whiteEmoji: '🌊',
    blackName: 'Depths',
    blackEmoji: '🐋',
  },
};

// === DESERT ===
const desertPalette: ColorPalette = {
  id: 'desert',
  name: 'Desert',
  description: 'Sunset canyons and red rock formations',
  backgroundImage: 'desert',
  white: {
    k: '#ED0D59',
    q: '#FC9872',
    r: '#AD988E',
    b: '#FCD712',
    n: '#C56F04',
    p: '#CCD2C6',
  },
  black: {
    k: '#5E0000',
    q: '#B02A00',
    r: '#5D482E',
    b: '#936252',
    n: '#220103',
    p: '#363636',
  },
  legendTheme: {
    whiteName: 'Dawn',
    whiteEmoji: '🌅',
    blackName: 'Dusk',
    blackEmoji: '🏜️',
  },
};

// === COSMIC ===
const cosmicPalette: ColorPalette = {
  id: 'cosmic',
  name: 'Cosmic',
  description: 'Nebulae and stardust across the galaxy',
  backgroundImage: 'cosmic',
  white: {
    k: '#FF7BFF',
    q: '#9F63FF',
    r: '#CAA3BC',
    b: '#C5DEFD',
    n: '#7C83A3',
    p: '#FAE5EA',
  },
  black: {
    k: '#481BFF',
    q: '#96389A',
    r: '#060391',
    b: '#460D4B',
    n: '#435162',
    p: '#000418',
  },
  legendTheme: {
    whiteName: 'Stars',
    whiteEmoji: '⭐',
    blackName: 'Void',
    blackEmoji: '🌌',
  },
};

// === VINTAGE ===
const vintagePalette: ColorPalette = {
  id: 'vintage',
  name: 'Vintage',
  description: 'Sepia-toned nostalgia and timeless elegance',
  backgroundImage: 'vintage',
  white: {
    k: '#A7A7A7',
    q: '#F5F5F5',
    r: '#DDA186',
    b: '#B0A801',
    n: '#A47305',
    p: '#F6E59F',
  },
  black: {
    k: '#5B5B5B',
    q: '#828262',
    r: '#523502',
    b: '#8F493B',
    n: '#1C2012',
    p: '#180217',
  },
  legendTheme: {
    whiteName: 'Light',
    whiteEmoji: '📜',
    blackName: 'Shadow',
    blackEmoji: '🕰️',
  },
};

// === CUSTOM (User-defined) ===
const customPalette: ColorPalette = {
  id: 'custom',
  name: 'Custom',
  description: 'Create your own color palette',
  white: {
    k: '#3B82F6',
    q: '#10B981',
    r: '#6366F1',
    b: '#06B6D4',
    n: '#EC4899',
    p: '#94A3B8',
  },
  black: {
    k: '#DC2626',
    q: '#9333EA',
    r: '#EA580C',
    b: '#F59E0B',
    n: '#BE185D',
    p: '#57534E',
  },
  legendTheme: {
    whiteName: 'Light',
    whiteEmoji: '✨',
    blackName: 'Dark',
    blackEmoji: '🌑',
  },
};

// === CLEAR ===
const clearPalette: ColorPalette = {
  id: 'clear',
  name: 'Clear',
  description: 'Colour-blind friendly: distinct hues with lightness separating the sides',
  white: {
    k: '#D3CA03', // King
    q: '#497DFC', // Queen
    r: '#BE891B', // Rook
    b: '#9CC48E', // Bishop
    n: '#B9B6BB', // Knight
    p: '#33C4FE', // Pawn
  },
  black: {
    k: '#7B8360', // King
    q: '#554D9D', // Queen
    r: '#8D4700', // Rook
    b: '#2F7571', // Bishop
    n: '#9978A6', // Knight
    p: '#5A5242', // Pawn
  },
  legendTheme: {
    whiteName: 'Bright',
    whiteEmoji: '☀️',
    blackName: 'Deep',
    blackEmoji: '🌑',
  },
};

// === HIGH CONTRAST ===
const contrastPalette: ColorPalette = {
  id: 'contrast',
  name: 'High Contrast',
  description: 'Maximum separation for low vision and small screens',
  white: {
    k: '#D0C503', // King
    q: '#42CCDF', // Queen
    r: '#BD8D47', // Rook
    b: '#A1C797', // Bishop
    n: '#AE66EC', // Knight
    p: '#A4A4A4', // Pawn
  },
  black: {
    k: '#980751', // King
    q: '#2E34E5', // Queen
    r: '#895D3D', // Rook
    b: '#3A8D70', // Bishop
    n: '#6D5F80', // Knight
    p: '#000000', // Pawn
  },
  legendTheme: {
    whiteName: 'Light',
    whiteEmoji: '⬜',
    blackName: 'Dark',
    blackEmoji: '⬛',
  },
};

// === STAINED GLASS ===
const stainedglassPalette: ColorPalette = {
  id: 'stainedglass',
  name: 'Stained Glass',
  description: 'Backlit cathedral jewel tones: ruby, sapphire, emerald, amber',
  white: {
    k: '#FCBA01', // King
    q: '#8A90FA', // Queen
    r: '#8AC58A', // Rook
    b: '#E07936', // Bishop
    n: '#AE7897', // Knight
    p: '#B6B6B6', // Pawn
  },
  black: {
    k: '#792B2A', // King
    q: '#403BFA', // Queen
    r: '#558669', // Rook
    b: '#8C6029', // Bishop
    n: '#6A467D', // Knight
    p: '#5A5A5A', // Pawn
  },
  legendTheme: {
    whiteName: 'Glass',
    whiteEmoji: '🔷',
    blackName: 'Lead',
    blackEmoji: '⚜️',
  },
};

// === AURORA ===
const auroraPalette: ColorPalette = {
  id: 'aurora',
  name: 'Aurora',
  description: 'Northern-lights greens, teals and violets against polar blues',
  white: {
    k: '#57A67A', // King
    q: '#24CEE3', // Queen
    r: '#8A87F2', // Rook
    b: '#F5AB20', // Bishop
    n: '#AC859D', // Knight
    p: '#BDBDBA', // Pawn
  },
  black: {
    k: '#0B642A', // King
    q: '#606689', // Queen
    r: '#8239EC', // Rook
    b: '#788016', // Bishop
    n: '#8A2C56', // Knight
    p: '#0D0300', // Pawn
  },
  legendTheme: {
    whiteName: 'Aurora',
    whiteEmoji: '🌌',
    blackName: 'Polar',
    blackEmoji: '🧊',
  },
};

// === VOLCANIC ===
const volcanicPalette: ColorPalette = {
  id: 'volcanic',
  name: 'Volcanic',
  description: 'Molten lava and ember against basalt and ash',
  white: {
    k: '#D2CE0E', // King
    q: '#DF7414', // Queen
    r: '#CD1701', // Rook
    b: '#EDAE98', // Bishop
    n: '#A06D62', // Knight
    p: '#D4D4D4', // Pawn
  },
  black: {
    k: '#8E8E8E', // King
    q: '#424E5E', // Queen
    r: '#8F4BEC', // Rook
    b: '#5E4A39', // Bishop
    n: '#307D91', // Knight
    p: '#130001', // Pawn
  },
  legendTheme: {
    whiteName: 'Ember',
    whiteEmoji: '🔥',
    blackName: 'Basalt',
    blackEmoji: '🪨',
  },
};

// === WOODLAND ===
const woodlandPalette: ColorPalette = {
  id: 'woodland',
  name: 'Woodland',
  description: 'Moss, fern, bark and berry for calm, low-glare study',
  white: {
    k: '#AAE195', // King
    q: '#2BA5A2', // Queen
    r: '#93760E', // Rook
    b: '#E6B30B', // Bishop
    n: '#EF6C68', // Knight
    p: '#CAC7BE', // Pawn
  },
  black: {
    k: '#445701', // King
    q: '#135F84', // Queen
    r: '#401901', // Rook
    b: '#737373', // Bishop
    n: '#7D3C47', // Knight
    p: '#060606', // Pawn
  },
  legendTheme: {
    whiteName: 'Canopy',
    whiteEmoji: '🌿',
    blackName: 'Roots',
    blackEmoji: '🍂',
  },
};

// === SPECTRAL RANK ===
const spectralPalette: ColorPalette = {
  id: 'spectral',
  name: 'Spectral Rank',
  description: 'Hue follows piece value, pawn to king, so the board teaches the hierarchy',
  white: {
    k: '#FE8CFE', // King
    q: '#28A3B5', // Queen
    r: '#ABC3B8', // Rook
    b: '#D5DD15', // Bishop
    n: '#C7AC7F', // Knight
    p: '#D75D83', // Pawn
  },
  black: {
    k: '#9839B8', // King
    q: '#50516A', // Queen
    r: '#0A7F69', // Rook
    b: '#7B9F10', // Bishop
    n: '#A74A00', // Knight
    p: '#6F413C', // Pawn
  },
  legendTheme: {
    whiteName: 'Bright',
    whiteEmoji: '🌈',
    blackName: 'Deep',
    blackEmoji: '🌑',
  },
};

// === INK & GOLD ===
const inkgoldPalette: ColorPalette = {
  id: 'inkgold',
  name: 'Ink & Gold',
  description: 'Champagne and gold against ink, wine and midnight',
  white: {
    k: '#D2CE10', // King
    q: '#CF810E', // Queen
    r: '#B1B1B1', // Rook
    b: '#868764', // Bishop
    n: '#F7B092', // Knight
    p: '#CCF0D9', // Pawn
  },
  black: {
    k: '#772F24', // King
    q: '#03004A', // Queen
    r: '#545C56', // Rook
    b: '#7252A0', // Bishop
    n: '#836105', // Knight
    p: '#0A0500', // Pawn
  },
  legendTheme: {
    whiteName: 'Gold',
    whiteEmoji: '✨',
    blackName: 'Ink',
    blackEmoji: '🖋️',
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
  japanesePalette,
  nordicPalette,
  artdecoPalette,
  tropicalPalette,
  cyberpunkPalette,
  autumnPalette,
  oceanPalette,
  desertPalette,
  cosmicPalette,
  vintagePalette,
  clearPalette,
  contrastPalette,
  stainedglassPalette,
  auroraPalette,
  volcanicPalette,
  woodlandPalette,
  spectralPalette,
  inkgoldPalette,
  customPalette,
];

// Current active palette — restored from localStorage on module load
const PALETTE_STORAGE_KEY = 'enpensent:activePalette';
const CUSTOM_PALETTE_STORAGE_KEY = 'enpensent:customPalette';

function restorePaletteFromStorage(): ColorPalette {
  if (typeof window === 'undefined') return hotColdPalette;
  try {
    const savedId = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (savedId) {
      // Restore custom palette colors first if applicable
      if (savedId === 'custom') {
        const savedCustom = localStorage.getItem(CUSTOM_PALETTE_STORAGE_KEY);
        if (savedCustom) {
          const custom = JSON.parse(savedCustom);
          const customIdx = colorPalettes.findIndex(p => p.id === 'custom');
          if (customIdx !== -1) {
            colorPalettes[customIdx] = { ...colorPalettes[customIdx], white: custom.white, black: custom.black };
            return colorPalettes[customIdx];
          }
        }
      }
      const palette = colorPalettes.find(p => p.id === savedId);
      if (palette) return palette;
    }
  } catch { /* localStorage unavailable */ }
  return hotColdPalette;
}

let activePalette: ColorPalette = restorePaletteFromStorage();

export function setActivePalette(paletteId: PaletteId): void {
  const palette = colorPalettes.find(p => p.id === paletteId);
  if (palette) {
    activePalette = palette;
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
      } catch { /* localStorage write failed */ }
    }
  }
}

export function getActivePalette(): ColorPalette {
  return activePalette;
}

// Update custom palette colors
export function setCustomColor(pieceColor: PieceColor, pieceType: PieceType, hexColor: string): void {
  const customIdx = colorPalettes.findIndex(p => p.id === 'custom');
  if (customIdx !== -1) {
    if (pieceColor === 'w') {
      colorPalettes[customIdx].white[pieceType] = hexColor;
    } else {
      colorPalettes[customIdx].black[pieceType] = hexColor;
    }
    // If custom is active, update the active palette reference
    if (activePalette.id === 'custom') {
      activePalette = colorPalettes[customIdx];
    }
    // Persist custom palette colors to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CUSTOM_PALETTE_STORAGE_KEY, JSON.stringify({
          white: colorPalettes[customIdx].white,
          black: colorPalettes[customIdx].black,
        }));
      } catch { /* localStorage write failed */ }
    }
  }
}

export function getCustomPalette(): ColorPalette {
  return colorPalettes.find(p => p.id === 'custom') || customPalette;
}

// Get current palette colors (useful for transferring state)
export function getCurrentPalette(): { white: Record<PieceType, string>; black: Record<PieceType, string> } {
  return {
    white: { ...activePalette.white },
    black: { ...activePalette.black },
  };
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

// Chess piece symbols (reversed for visual contrast)
const pieceSymbols: Record<PieceType, { white: string; black: string }> = {
  k: { white: '♚', black: '♔' },
  q: { white: '♛', black: '♕' },
  r: { white: '♜', black: '♖' },
  b: { white: '♝', black: '♗' },
  n: { white: '♞', black: '♘' },
  p: { white: '♟', black: '♙' },
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
