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
        historicGames: 100,
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
    depth: 20,
    features: [
      'Real-time position evaluation',
      'Best move suggestions',
      'Win probability calculations',
      'Centipawn loss tracking',
    ],
  },
  analysis: {
    depth: 20,
    features: ['Win probability', 'Centipawn evaluation', 'Move classification', 'Opening detection'],
    moveClassifications: ['Book', 'Brilliant', 'Great', 'Good', 'Inaccuracy', 'Mistake', 'Blunder'],
  },
  visualizations: {
    formats: ['HD PNG', 'Animated GIF', 'Print-ready'],
    palettes: 16,
    customPalettes: true,
    exportResolutions: ['Standard', 'HD 4K', 'Print-ready 300 DPI'],
    features: [
      'Move-by-move timeline',
      'Piece movement trails',
      'Square locking & highlighting',
      'Comparative analysis mode',
      'Dark/light board modes',
    ],
  },
  marketplace: {
    platformFee: 5, // percent
    royaltyRate: 17, // percent of PROFIT to creator
    walletDeposits: { min: 500, max: 50000 }, // cents
    withdrawalMin: 1000, // cents
    features: [
      'Zero listing fees',
      'Peer-to-peer trading',
      'Offer negotiation system',
      'Real-time price updates',
      'Vision Score tracking',
    ],
  },
  scanning: {
    name: 'Natural Vision™',
    description: 'AI-powered pattern recognition for physical-to-digital bridge',
    qrFallback: true,
    features: [
      'Camera-based game recognition',
      'Physical print verification',
      'Instant game data retrieval',
      'Cross-reference pattern matching',
    ],
  },
  prints: {
    frames: ['Natural Oak', 'Matte Black', 'White', 'Walnut', 'Gold Gilded'],
    sizes: ['8x10', '11x14', '16x20', '18x24', '24x30'],
    quality: 'Museum-grade giclée on archival canvas',
    features: [
      'Archival-quality materials',
      'Handcrafted premium frames',
      'Free worldwide shipping',
      'Certificate of authenticity',
      'Embedded QR verification',
    ],
    margins: {
      gross: 40, // percent after fulfillment
      net: 17, // percent net margin
    },
  },
  books: {
    title: 'Carlsen in Color',
    subtitle: '100 Games of Chess Mastery',
    games: 100,
    features: [
      'AI-generated haiku poetry for each game',
      'Stockfish 17 annotations',
      'Limited edition hardcover',
      'Premium paper stock',
      'Collector numbering',
    ],
    price: 4999, // cents
  },
  premium: {
    name: 'Visionary Membership',
    price: 999, // cents/month
    features: [
      'Unlimited HD downloads',
      'Animated GIF exports',
      'Priority printing',
      'Exclusive palettes',
      'Marketplace ownership rights',
      'Full Stockfish analysis',
      'Zero watermarks',
      'Gallery storage',
    ],
  },
  economics: {
    creatorRoyalty: 17, // percent of profit
    educationFund: 5, // percent of forfeited value
    palettePool: 20, // percent of appreciation
    gamecardPool: 15, // percent of appreciation
    digitalMargin: 95, // percent
    printMargin: 17, // percent net
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
  tagline: 'The Future of Chess Intelligence',
  headline: 'Your Masterpieces, Forever Immortalized',
  description: 'Upload any chess game and transform it into a stunning visualization — where every piece tells its story through color and movement.',
  conceptDescription: '"En Pensent" — a play on the French chess term en passant — means "in thought." Every visualization captures the thinking behind the moves.',
  naturalVision: 'Every En Pensent visualization is more than art — it\'s a scannable digital fingerprint powering the world\'s most advanced chess pattern recognition system. Our visual encryption combined with Stockfish 17 creates an unmatched analytical foundation.',
  creatorEconomics: 'We believe in sustainable creator rewards. Creators earn 17% of PROFIT (not revenue) when others order prints — ensuring platform sustainability while maximizing creator earnings.',
  educationFund: 'A portion of every sale contributes to chess education programs in underserved communities worldwide. The Chess Education Fund has already supported youth programs across three continents.',
  futureVision: 'Through millions of cross-referenced visions and grandmaster-strength analysis, En Pensent is building the most comprehensive chess pattern recognition system ever created — where visual art meets predictive intelligence.',
  competitiveEdge: 'Our unique combination of Stockfish 17 NNUE (~3200 ELO), Natural Vision™ pattern recognition, and comprehensive vision data creates an analytical foundation that will evolve to suggest optimal moves with unprecedented accuracy.',
  haikuPoetry: 'Each visualization is paired with a unique haiku — a seventeen-syllable poem capturing the essence of the game. This ancient Japanese art form mirrors the precision and elegance of chess itself.',
  marketplaceValue: 'The Vision Score system tracks real engagement: views, downloads, scans, trades, and print orders. Value appreciates based on genuine community interest, not speculation.',
  hustlenomics: 'Our "Hustlenomics" system calculates market value based on real-time engagement accrual. Every interaction contributes to a vision\'s score and potential value appreciation.',
} as const;

// Feature list for marketing pages
export const FEATURE_LIST = [
  {
    title: 'World\'s Most Advanced Pattern Recognition',
    description: 'Our visual encryption system combined with Stockfish 17 NNUE creates an unprecedented chess intelligence platform — cross-referencing millions of patterns to deliver insights no other engine can match.',
    category: 'technology',
  },
  {
    title: 'Stockfish 17 NNUE Integration',
    description: `Real grandmaster-strength analysis with ~${PLATFORM_CAPABILITIES.engine.elo} ELO engine. Centipawn accuracy, win probability, depth ${PLATFORM_CAPABILITIES.analysis.depth}+ evaluation — the foundation of our predictive intelligence.`,
    category: 'analysis',
  },
  {
    title: 'Natural Vision™ Recognition',
    description: 'Every visualization is a scannable digital fingerprint. Our AI-powered pattern recognition identifies games from images, building the largest visual chess database ever created.',
    category: 'technology',
  },
  {
    title: 'Vision Marketplace',
    description: `Trade and collect unique chess visualizations. ${PLATFORM_CAPABILITIES.marketplace.platformFee}% platform fee, ${PLATFORM_CAPABILITIES.economics.creatorRoyalty}% creator royalties on profit. Real ownership, real value.`,
    category: 'marketplace',
  },
  {
    title: `${PLATFORM_CAPABILITIES.visualizations.palettes} Curated Color Palettes`,
    description: 'From Japanese minimalism to Art Deco grandeur — each palette transforms your games into distinct visual experiences. Create custom palettes with Premium membership.',
    category: 'art',
  },
  {
    title: 'Premium Framing Options',
    description: `Museum-quality frames: ${PLATFORM_CAPABILITIES.prints.frames.join(', ')}. Ships worldwide with white-glove service. Certificate of authenticity included.`,
    category: 'prints',
  },
  {
    title: 'Haiku Poetry Integration',
    description: 'Each visualization is paired with an AI-generated haiku capturing the essence of the game — transforming chess analysis into a complete artistic experience.',
    category: 'art',
  },
  {
    title: 'Profit-Based Creator Royalties',
    description: `Sustainable economics: creators earn ${PLATFORM_CAPABILITIES.economics.creatorRoyalty}% of PROFIT, not revenue. Platform costs are covered first, ensuring long-term viability and fair creator compensation.`,
    category: 'economics',
  },
  {
    title: 'Chess Education Fund',
    description: `${PLATFORM_CAPABILITIES.economics.educationFund}% of forfeited vision value goes to the Chess Education Fund — supporting youth chess programs and scholarships in underserved communities.`,
    category: 'community',
  },
  {
    title: 'Vision Score System',
    description: 'Real-time engagement tracking: views, downloads, scans, trades, and print orders. Transparent metrics that determine marketplace value based on genuine interest.',
    category: 'marketplace',
  },
  {
    title: 'Evolving Chess Intelligence',
    description: 'As our vision database grows, so does our analytical power. Each visualization contributes to a system that will eventually suggest optimal moves with accuracy surpassing traditional engines.',
    category: 'innovation',
  },
] as const;

// Investment highlights for investor materials
export const INVESTMENT_HIGHLIGHTS = {
  market: {
    tam: '$12.5B',
    tamDescription: 'Global Chess + Art Collectibles Market',
    sam: '$2.1B', 
    samDescription: 'Digital Chess Merchandise & Collectibles',
    som: '$180M',
    somDescription: 'Achievable Market Share (5-Year Projection)',
    chessPlayers: '800M+',
    growthSince2020: '45%',
  },
  traction: {
    curatedGames: '100+',
    signaturePalettes: '16',
    possibleVisions: '∞',
    marketplaceStatus: 'Live',
  },
  businessModel: {
    premiumPrice: '$9.99/month',
    printPriceRange: '$29-$299',
    marketplaceFee: '10%',
    bookPrice: '$49.99',
    digitalMargin: '95%',
    printMargin: '17%',
  },
  roadmap: [
    { quarter: 'Q1 2026', milestone: 'Carlsen Book Launch + 1,000 subscribers' },
    { quarter: 'Q2 2026', milestone: 'Mobile app + Tournament partnerships' },
    { quarter: 'Q3 2026', milestone: 'Enterprise API + Educational licensing' },
    { quarter: 'Q4 2026', milestone: 'International expansion + 10K subscribers' },
  ],
  ask: {
    amount: '$500K',
    type: 'Seed Round',
    useOfFunds: [
      { category: 'Product Development', percentage: 40, description: 'Mobile apps, API, advanced features' },
      { category: 'Marketing & Growth', percentage: 30, description: 'Chess influencers, tournament sponsorships' },
      { category: 'Content & Partnerships', percentage: 20, description: 'Game licensing, artist collaborations' },
      { category: 'Operations', percentage: 10, description: 'Legal, infrastructure, team' },
    ],
  },
} as const;

// Company information
export const COMPANY_INFO = {
  name: 'En Pensent',
  legal: 'En Pensent LLC',
  founded: '2024',
  headquarters: 'United States',
  website: 'enpensent.com',
  email: {
    general: 'hello@enpensent.com',
    investors: 'investors@enpensent.com',
    support: 'support@enpensent.com',
    legal: 'legal@enpensent.com',
  },
  social: {
    twitter: '@enpensent',
    instagram: '@enpensent',
    discord: 'discord.gg/enpensent',
  },
  mission: 'To build the world\'s most advanced chess pattern recognition system while making chess history accessible, beautiful, and collectible.',
  vision: 'Where visual art meets predictive intelligence — transforming how the world understands and plays chess.',
  values: [
    { name: 'Passion', description: 'Chess lovers first, technologists second. Every feature is crafted with deep respect for the game.' },
    { name: 'Artistry', description: 'Museum-quality aesthetics in everything we create — from palettes to prints to poetry.' },
    { name: 'Community', description: 'Built by players, for players. We celebrate and support the global chess community.' },
    { name: 'Innovation', description: 'First-mover in chess visualization and pattern recognition technology.' },
    { name: 'Transparency', description: 'Honest economics, clear metrics, and sustainable creator rewards.' },
  ],
} as const;
