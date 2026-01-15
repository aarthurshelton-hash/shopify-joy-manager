import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlatformStatsData {
  totalVisions: number;
  totalUsers: number;
  totalListings: number;
  totalGames: number;
  engineElo: number;
  historicGames: number;
  colorPalettes: number;
  yearsOfHistory: number;
}

// Hook to fetch live platform statistics
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async (): Promise<PlatformStatsData> => {
      // Fetch counts in parallel
      const [visionsResult, listingsResult, gamesResult] = await Promise.all([
        supabase.from('saved_visualizations').select('id', { count: 'exact', head: true }),
        supabase.from('visualization_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('chess_games').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalVisions: visionsResult.count || 0,
        totalUsers: 0, // Can't query auth.users, estimate from profiles
        totalListings: listingsResult.count || 0,
        totalGames: gamesResult.count || 0,
        // Static platform capabilities
        engineElo: 3200,
        historicGames: 75,
        colorPalettes: 16,
        yearsOfHistory: 500,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}

// Platform capability constants - single source of truth
export const PLATFORM_CAPABILITIES = {
  engine: {
    name: 'Stockfish 17 NNUE',
    elo: 3200,
    description: 'Grandmaster-strength analysis with centipawn accuracy',
  },
  analysis: {
    depth: 20,
    features: ['Win probability', 'Centipawn evaluation', 'Move classification', 'Opening detection'],
  },
  visualizations: {
    formats: ['HD PNG', 'Animated GIF', 'Print-ready'],
    palettes: 16,
    customPalettes: true,
  },
  marketplace: {
    platformFee: 5, // percent
    royaltyRate: 20, // percent to creator
    walletDeposits: { min: 500, max: 50000 }, // cents
    withdrawalMin: 1000, // cents
  },
  scanning: {
    name: 'Natural Vision™',
    description: 'Pattern recognition for physical-to-digital bridge',
    qrFallback: true,
  },
  prints: {
    frames: ['Natural Oak', 'Matte Black', 'White', 'Walnut', 'Gold Gilded'],
    sizes: ['8x10', '11x14', '16x20', '18x24', '24x30'],
    quality: 'Museum-grade giclée',
  },
  books: {
    title: 'Carlsen in Color',
    games: 100,
    features: ['AI haiku poetry', 'Stockfish annotations', 'Limited edition'],
  },
  premium: {
    name: 'Visionary Membership',
    price: 999, // cents/month
    features: [
      'Unlimited HD downloads',
      'Animated GIF exports',
      'Priority printing',
      'Exclusive palettes',
      'Marketplace ownership',
      'Stockfish analysis',
    ],
  },
  rateLimits: {
    auth: { maxRequests: 5, windowSeconds: 60 },
    payment: { maxRequests: 10, windowSeconds: 60 },
    download: { maxRequests: 20, windowSeconds: 60 },
    search: { maxRequests: 60, windowSeconds: 60 },
    upload: { maxRequests: 10, windowSeconds: 60 },
  },
} as const;

// Marketing copy - single source of truth
export const MARKETING_COPY = {
  tagline: 'Transform Chess Into Art',
  headline: 'Your Masterpieces, Forever Immortalized',
  description: 'Upload any chess game and transform it into a stunning visualization — where every piece tells its story through color and movement.',
  conceptDescription: '"En Pensent" — a play on the French chess term en passant — means "in thought." Every visualization captures the thinking behind the moves.',
  naturalVision: 'Every En Pensent visualization is more than art — it\'s a scannable digital fingerprint that can be recognized and linked back to its complete game data.',
  creatorEconomics: 'We believe in sustainable creator rewards. When others order prints of your visions, you earn royalties automatically.',
  educationFund: 'A portion of every sale contributes to chess education programs in underserved communities worldwide.',
} as const;

// Feature list for marketing pages
export const FEATURE_LIST = [
  {
    title: 'Stockfish 17 NNUE Integration',
    description: `Real grandmaster-strength analysis with ~${PLATFORM_CAPABILITIES.engine.elo} ELO engine. Centipawn accuracy, win probability, depth ${PLATFORM_CAPABILITIES.analysis.depth}+ evaluation.`,
    category: 'analysis',
  },
  {
    title: 'Natural Vision™ Recognition',
    description: MARKETING_COPY.naturalVision,
    category: 'technology',
  },
  {
    title: 'Vision Marketplace',
    description: `Trade and collect unique chess visualizations. ${PLATFORM_CAPABILITIES.marketplace.platformFee}% platform fee, ${PLATFORM_CAPABILITIES.marketplace.royaltyRate}% creator royalties.`,
    category: 'marketplace',
  },
  {
    title: `${PLATFORM_CAPABILITIES.visualizations.palettes} Curated Color Palettes`,
    description: 'From Japanese minimalism to Art Deco grandeur — each palette transforms your games into distinct visual experiences.',
    category: 'art',
  },
  {
    title: 'Premium Framing Options',
    description: `Museum-quality frames: ${PLATFORM_CAPABILITIES.prints.frames.join(', ')}. Ships worldwide with white-glove service.`,
    category: 'prints',
  },
  {
    title: `${PLATFORM_CAPABILITIES.engine.elo} ELO Historic Games Library`,
    description: `Explore ${PLATFORM_CAPABILITIES.engine.elo}+ legendary games spanning ${PLATFORM_CAPABILITIES.engine.elo}+ years of chess history.`,
    category: 'content',
  },
] as const;
