/**
 * Official En Pensent piece artwork (gold-edged ivory and obsidian).
 * Used wherever a piece is drawn without a palette tint.
 */
import type { PieceType, PieceColor } from './pieceColors';

const raw = import.meta.glob('../../assets/pieces/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const bySymbol = new Map<string, string>();
for (const [path, svg] of Object.entries(raw)) {
  const name = path.split('/').pop()!.replace('.svg', '');
  bySymbol.set(name, svg);
}

const key = (type: PieceType, color: PieceColor) => `${color}${type.toUpperCase()}`;

export function hasOfficialPiece(type: PieceType, color: PieceColor): boolean {
  return bySymbol.has(key(type, color));
}

/**
 * Inner markup of the official SVG (viewBox 0 0 100 100) with its CSS
 * classes scoped to a per-piece wrapper class so many pieces can share a page.
 */
const innerCache = new Map<string, string>();
export function getOfficialPieceInner(type: PieceType, color: PieceColor): string | null {
  const k = key(type, color);
  const cached = innerCache.get(k);
  if (cached) return cached;
  const svg = bySymbol.get(k);
  if (!svg) return null;
  const scope = `ep-${k}`;
  const inner = svg
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<style>([\s\S]*?)<\/style>/, (_m, css: string) =>
      `<style>${css.replace(/(^|\})\s*\.([\w-]+)\s*\{/g, (_x, p, c) => `${p}.${scope} .${c}{`)}</style>`,
    );
  const out = `<g class="${scope}">${inner}</g>`;
  innerCache.set(k, out);
  return out;
}

const images = new Map<string, HTMLImageElement>();

/** Preloaded raster source for canvas drawing; null until decoded. */
export function getOfficialPieceImage(type: PieceType, color: PieceColor): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  const k = key(type, color);
  let img = images.get(k);
  if (!img) {
    const svg = bySymbol.get(k);
    if (!svg) return null;
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    images.set(k, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function preloadOfficialPieces(): void {
  (['k', 'q', 'r', 'b', 'n', 'p'] as PieceType[]).forEach((t) =>
    (['w', 'b'] as PieceColor[]).forEach((c) => getOfficialPieceImage(t, c)),
  );
}
