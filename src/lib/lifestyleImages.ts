import macro from '@/assets/mockups/canvas-macro-closeup.jpg';

export interface LifestyleImage {
  id: string;
  src: string;
  title: string;
  palette?: string;
}

const KEYS: Record<string, string> = {
  japanese: 'japanese', 'art-deco': 'artdeco', cyberpunk: 'cyberpunk', medieval: 'medieval', greyscale: 'greyscale',
  cosmic: 'cosmic', autumn: 'autumn', tropical: 'tropical', vintage: 'vintage', ocean: 'ocean', nordic: 'nordic',
  egyptian: 'egyptian', roman: 'roman', desert: 'desert', modern: 'modern',
  'stained-glass': 'stainedglass', woodland: 'woodland', 'ink-and-gold': 'inkgold', 'hot-cold': 'hotCold',
  'high-contrast': 'contrast', 'spectral-rank': 'spectral', volcanic: 'volcanic', aurora: 'aurora', clear: 'clear',
};

const files = import.meta.glob('@/assets/lifestyle/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const title = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Curated hero order — the strongest scenes lead every carousel and, because
// palette matching preserves this order, they also surface first inside their
// own palette strips.
const FEATURED: string[] = [
  'kasparov-ocean-submarine-porthole-v2',
  'opera-art-deco-ocean-liner-atrium',
  'game-century-japanese-moonlit-paper-theatre',
  'mwali-desert-caravan-overhead-v2',
  'philidor-greyscale-noir-projection-room-v2',
  'rotlewi-woodland-treehouse-rope-bridge-v2',
  'morphy-anderssen-vintage-clockwork-railway-v2',
  'castellvi-vinyoles-ink-and-gold-calligrapher-court-v2',
  'kasparov-immortal-ocean-beach-house',
  'african-heritage-desert-adobe',
];
const featuredRank = new Map(FEATURED.map((id, i) => [id, i]));
const rank = (i: LifestyleImage) => featuredRank.get(i.id) ?? FEATURED.length;

export const lifestyleImages: LifestyleImage[] = [
  ...Object.entries(files)
    .map(([p, src]) => {
      const id = p.split('/').pop()!.replace(/\.\w+$/, '');
      const k = Object.keys(KEYS).find((x) => id.includes(x));
      return { id, src, title: title(id), palette: k ? KEYS[k] : undefined };
    })
    .sort((a, b) => rank(a) - rank(b)),
  { id: 'canvas-macro-closeup', src: macro, title: 'Museum-Grade Canvas Detail' },
];

export function getLifestyleForPalette(paletteId: string | undefined, count: number): LifestyleImage[] {
  const hit = lifestyleImages.filter((i) => i.palette && i.palette === paletteId);
  const rest = lifestyleImages.filter((i) => !hit.includes(i));
  const rooms = rest.filter((i) => !i.id.includes('characters'));
  const scenes = rest.filter((i) => i.id.includes('characters'));
  return [...hit, ...rooms, ...scenes].slice(0, count);
}
