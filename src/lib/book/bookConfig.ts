import { carlsenTop100, CarlsenGame } from './carlsenGames';
import { fischerTop100, FischerGame } from './fischerGames';
import { Crown, Flame, LucideIcon } from 'lucide-react';
import carlsenCover from '@/assets/book/carlsen-cover.jpg';

export type BookType = 'carlsen' | 'fischer';
export type GameType = CarlsenGame | FischerGame;
export type EditionType = 'standard' | 'limited' | 'special' | 'collector';
export type PaperType = 'standard' | 'premium' | 'museum';
export type CoverType = 'hardcover' | 'leather' | 'cloth';

export interface CollectorFeatures {
  edition: EditionType;
  maxCopies?: number;
  signedBy?: string;
  numbered?: boolean;
  coaIncluded?: boolean;
  specialFeatures?: string[];
}

export interface ProductionOptions {
  paperType: PaperType;
  coverType: CoverType;
  foilStamping?: boolean;
  ribbonMarker?: boolean;
  slipcase?: boolean;
}

export interface BookConfig {
  id: BookType;
  title: string;
  subtitle: string;
  games: GameType[];
  palette: string;
  paletteDisplayName: string;
  cover: string;
  icon: LucideIcon;
  color: string;
  spineTitle: string;
  kingSymbol: string;
  badgeText: string;
  description: string;
  // Pricing tiers
  standardPrice: string;
  largePrice: string;
  collectorPrice?: string;
  // Colors for UI
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  // Default production options
  defaultProduction: ProductionOptions;
}

export const BOOK_CONFIGS: Record<BookType, BookConfig> = {
  carlsen: {
    id: 'carlsen',
    title: 'Carlsen in Color',
    subtitle: '100 Masterpieces of Magnus Carlsen',
    games: carlsenTop100 as GameType[],
    palette: 'hotCold',
    paletteDisplayName: 'Hot & Cold',
    cover: carlsenCover,
    icon: Crown,
    color: 'amber',
    spineTitle: 'CARLSEN',
    kingSymbol: '♔',
    badgeText: 'Gold Gilded Pages',
    description: "A visual celebration of Magnus Carlsen's greatest chess games, rendered through the En Pensent visualization system with unique haiku poetry.",
    standardPrice: '$79.99',
    largePrice: '$99.99',
    collectorPrice: '$299.99',
    primaryColor: '#f59e0b', // amber-500
    accentColor: '#d97706', // amber-600
    bgGradient: 'from-amber-50 to-orange-50',
    defaultProduction: {
      paperType: 'premium',
      coverType: 'hardcover',
      foilStamping: true,
      ribbonMarker: true,
      slipcase: false
    }
  },
  fischer: {
    id: 'fischer',
    title: 'Fischer in Color',
    subtitle: "Bobby Fischer's 100 Greatest Games",
    games: fischerTop100 as GameType[],
    palette: 'egyptian',
    paletteDisplayName: 'Egyptian',
    cover: carlsenCover, // Placeholder - will be replaced with Fischer cover
    icon: Flame,
    color: 'amber',
    spineTitle: 'FISCHER',
    kingSymbol: '♚',
    badgeText: 'Egyptian Gold Pages',
    description: "The legendary Bobby Fischer's most brilliant games, visualized with the mystical Egyptian palette and accompanied by AI-crafted haiku poetry.",
    standardPrice: '$79.99',
    largePrice: '$99.99',
    collectorPrice: '$349.99',
    primaryColor: '#c9a227', // Egyptian gold
    accentColor: '#a68b1f', // Darker Egyptian gold
    bgGradient: 'from-amber-100 to-yellow-50',
    defaultProduction: {
      paperType: 'museum',
      coverType: 'leather',
      foilStamping: true,
      ribbonMarker: true,
      slipcase: true
    }
  },
};

// Collector editions with enhanced features
export const COLLECTOR_EDITIONS: Record<string, CollectorFeatures> = {
  'carlsen-signed': {
    edition: 'collector',
    maxCopies: 100,
    signedBy: 'Magnus Carlsen',
    numbered: true,
    coaIncluded: true,
    specialFeatures: ['Magnus Carlsen Signature', 'Limited Edition Numbering', 'Certificate of Authenticity', 'Leather Slipcase']
  },
  'carlsen-limited': {
    edition: 'limited',
    maxCopies: 500,
    signedBy: 'En Pensent Studios',
    numbered: true,
    coaIncluded: true,
    specialFeatures: ['Studio Signature', 'Limited Edition Numbering', 'Gold Foil Stamping']
  },
  'fischer-anniversary': {
    edition: 'special',
    maxCopies: 500,
    signedBy: 'En Pensent Studios',
    numbered: true,
    coaIncluded: true,
    specialFeatures: ['50th Anniversary Edition', 'Egyptian Gold Gilding', 'Historical Timeline', 'Museum-Grade Paper']
  },
  'fischer-legend': {
    edition: 'collector',
    maxCopies: 100,
    signedBy: 'Chess Grandmasters',
    numbered: true,
    coaIncluded: true,
    specialFeatures: ['Grandmaster Signatures', 'Handbound Leather', 'Archival Quality', 'Display Case Included']
  }
};

export const getBookConfig = (bookType: BookType): BookConfig => {
  return BOOK_CONFIGS[bookType];
};

export const getAllBookTypes = (): BookType[] => {
  return Object.keys(BOOK_CONFIGS) as BookType[];
};

export const getCollectorEditions = (bookType: BookType): CollectorFeatures[] => {
  return Object.entries(COLLECTOR_EDITIONS)
    .filter(([key]) => key.startsWith(bookType))
    .map(([, features]) => features);
};

export const getEditionPrice = (bookType: BookType, edition: EditionType): string => {
  const config = BOOK_CONFIGS[bookType];
  switch (edition) {
    case 'collector':
      return config.collectorPrice || config.largePrice;
    case 'special':
    case 'limited':
      return config.largePrice;
    default:
      return config.standardPrice;
  }
};
