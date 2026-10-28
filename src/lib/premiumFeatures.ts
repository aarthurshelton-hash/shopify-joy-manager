export interface PremiumPerk {
  title: string;
  text: string;
}

export const PREMIUM_PRICE_MONTHLY = '$6.99';
export const PREMIUM_PRICE_ANNUAL = '$59.99';

export const PREMIUM_PERKS: PremiumPerk[] = [
  { title: 'HD downloads', text: '4096 x 4096 exports, sharp enough for large-format prints' },
  { title: 'No watermarks', text: 'Clean artwork for presentation and resale' },
  { title: 'Animated GIFs', text: 'Share the whole journey of a game' },
  { title: 'Personal gallery', text: 'Your visions stay safe, with a 7-day grace period if you pause' },
  { title: 'Premium analytics', text: 'Territory heatmaps, piece activity and valuation metrics' },
  { title: 'Opponent history export', text: 'Up to 250 games per player, as CSV' },
];
