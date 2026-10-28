export interface PremiumPerk {
  title: string;
  text: string;
}

export const PREMIUM_PRICE_MONTHLY = '$6.99';
export const PREMIUM_PRICE_ANNUAL = '$59.99';

// Free accounts: watermarked downloads, print ordering, explore and analytics.
// Premium: everything else. Keep in sync with supabase/functions/_shared/emailTemplates.ts
export const PREMIUM_PERKS: PremiumPerk[] = [
  { title: 'HD downloads, no watermark', text: '4096 x 4096 exports. Free downloads carry the En Pensent watermark' },
  { title: 'Vision Scanner', text: 'Point your camera at any printed vision and the game behind it opens' },
  { title: 'Animated GIFs', text: 'Share the whole journey of a game' },
  { title: 'Personal gallery', text: 'Save every vision. 7-day grace period if you pause' },
  { title: 'Creative Mode', text: 'Paint, save and export your own visions' },
  { title: 'Collector game cards', text: 'Import your Chess.com or Lichess games and get printable card PDFs' },
  { title: 'Digital info cards', text: 'Download the full info card for any vision' },
  { title: 'Marketplace early access', text: 'Founding members get in first when it launches' },
];
