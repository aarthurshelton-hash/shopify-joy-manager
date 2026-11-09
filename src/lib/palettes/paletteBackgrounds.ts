const full = import.meta.glob('/src/assets/palettes/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const thumbs = import.meta.glob('/src/assets/palettes/thumbs/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const idFromPath = (p: string) => (p.split('/').pop() || '').replace(/\.jpg$/, '');

// File names are lowercase; palette ids are not always (hotCold).
const FILE_TO_PALETTE_ID: Record<string, string> = { hotcold: 'hotCold' };

function toMap(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(files)) {
    const file = idFromPath(path);
    if (file.startsWith('_')) continue;
    out[FILE_TO_PALETTE_ID[file] || file] = url;
  }
  return out;
}

/** Full-size (1280w) scene per palette id, for hero and detail surfaces. */
export const paletteBackgrounds: Record<string, string> = toMap(full);

/** Light (480w) scene per palette id, for cards, grids and selectors. */
export const paletteThumbs: Record<string, string> = toMap(thumbs);

const variants = import.meta.glob('/src/assets/palettes/variants/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

/** All themed scenes per palette id: the default scene first, then variants. */
export const paletteScenes: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const [id, url] of Object.entries(paletteThumbs)) out[id] = [url];
  const entries = Object.entries(variants).sort(([a], [b]) => a.localeCompare(b));
  for (const [path, url] of entries) {
    const base = idFromPath(path).replace(/-\d+$/, '');
    const id = FILE_TO_PALETTE_ID[base] || base;
    (out[id] ||= []).push(url);
  }
  return out;
})();

/** Deterministic scene for a palette, so different games can show different scenes. */
export function getPaletteScene(paletteId: string | undefined, seed = ''): string | undefined {
  if (!paletteId) return undefined;
  const scenes = paletteScenes[paletteId];
  if (!scenes?.length) return undefined;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return scenes[h % scenes.length];
}

/** Contact sheet of all 24 palettes (also at /palettes/all-24-preview.jpg). */
export const ALL_PALETTES_PREVIEW_URL = '/palettes/all-24-preview.jpg';
