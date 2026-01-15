import { carlsenTop100, CarlsenGame } from './carlsenGames';
import { fischerTop100, FischerGame } from './fischerGames';
import { Crown, Flame, LucideIcon } from 'lucide-react';
import carlsenCover from '@/assets/book/carlsen-cover.jpg';

export type BookType = 'carlsen' | 'fischer';
export type GameType = CarlsenGame | FischerGame;

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
  // Pricing
  standardPrice: string;
  largePrice: string;
  // Colors for UI
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
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
    primaryColor: '#f59e0b', // amber-500
    accentColor: '#d97706', // amber-600
    bgGradient: 'from-amber-50 to-orange-50',
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
    primaryColor: '#c9a227', // Egyptian gold
    accentColor: '#a68b1f', // Darker Egyptian gold
    bgGradient: 'from-amber-100 to-yellow-50',
  },
};

export const getBookConfig = (bookType: BookType): BookConfig => {
  return BOOK_CONFIGS[bookType];
};

export const getAllBookTypes = (): BookType[] => {
  return Object.keys(BOOK_CONFIGS) as BookType[];
};
