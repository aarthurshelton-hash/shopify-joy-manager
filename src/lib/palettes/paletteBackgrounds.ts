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

/** Contact sheet of all 24 palettes (also at /palettes/all-24-preview.jpg). */
export const ALL_PALETTES_PREVIEW_URL = '/palettes/all-24-preview.jpg';
