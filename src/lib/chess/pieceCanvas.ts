/**
 * Canvas twin of PremiumPiece.tsx — same geometry, tones, outline-behind-fill,
 * engraving and highlight, with deterministic grain (seeded, no Math.random).
 */
import { PieceType, PieceColor } from './pieceColors';
import { PIECE_PATHS, PIECE_DETAILS, PIECE_OUTLINE_WIDTH, getPieceTones } from './piecePaths';
import { getOfficialPieceImage, preloadOfficialPieces } from './officialPieces';

preloadOfficialPieces();

const grainTiles = new Map<string, HTMLCanvasElement>();

function rgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${alpha})`;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

function getGrainTile(speck: string): HTMLCanvasElement {
  const cached = grainTiles.get(speck);
  if (cached) return cached;
  const size = 128;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const g = tile.getContext('2d')!;
  const img = g.createImageData(size, size);
  let s = 0x9e3779b1;
  const next = () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
  const m = /^#?([0-9a-f]{6})$/i.exec(speck);
  const [r, gr, b] = m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : [0, 0, 0];
  for (let i = 0; i < size * size; i++) {
    const n = next();
    const a = n > 0.55 ? (n - 0.55) * 2.2 * 255 : 0;
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = gr;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  grainTiles.set(speck, tile);
  return tile;
}

/**
 * Draw a premium piece centred at (cx, cy), `size` px square (viewBox 100).
 * Caller owns globalAlpha.
 */
export function drawPremiumPiece(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  color: PieceColor,
  cx: number,
  cy: number,
  size: number,
  hexColor?: string,
  strokeColor?: string,
): void {
  if (ctx.globalAlpha < 0.999) {
    const dim = Math.ceil(size * 1.2);
    const tmp = document.createElement('canvas');
    tmp.width = dim;
    tmp.height = dim;
    const tctx = tmp.getContext('2d');
    if (tctx) {
      drawPremiumPiece(tctx, type, color, dim / 2, dim / 2, size, hexColor, strokeColor);
      ctx.drawImage(tmp, cx - dim / 2, cy - dim / 2);
      return;
    }
  }

  if (!hexColor && !strokeColor) {
    const img = getOfficialPieceImage(type, color);
    if (img) {
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
      return;
    }
  }

  const t = getPieceTones(color, hexColor, strokeColor);
  const body = new Path2D(PIECE_PATHS[type]);
  const det = PIECE_DETAILS[type];

  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const k = size / 100;
  ctx.scale(k, k);

  const contact = ctx.createRadialGradient(50, 90, 0, 50, 90, 31);
  contact.addColorStop(0, 'rgba(0,0,0,0.4)');
  contact.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.translate(50, 90);
  ctx.scale(1, 3.4 / 31);
  ctx.translate(-50, -90);
  ctx.fillStyle = contact;
  ctx.beginPath();
  ctx.arc(50, 90, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = t.outline;
  ctx.lineWidth = PIECE_OUTLINE_WIDTH;
  ctx.stroke(body);

  const grad = ctx.createLinearGradient(10, 0, 90, 100);
  grad.addColorStop(0, t.light);
  grad.addColorStop(0.5, t.mid);
  grad.addColorStop(1, t.dark);
  ctx.fillStyle = grad;
  ctx.fill(body);

  ctx.save();
  ctx.clip(body);
  const tile = getGrainTile(t.speck);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern) {
    pattern.setTransform(new DOMMatrix().scale(0.5));
    ctx.globalAlpha *= 0.3;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, 100, 100);
    ctx.globalAlpha /= 0.3;
  }
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = t.speck;
  ctx.globalAlpha *= 0.05;
  for (let y = 4; y < 92; y += 2.4) {
    ctx.beginPath();
    ctx.moveTo(15, y);
    ctx.lineTo(85, y);
    ctx.stroke();
  }
  ctx.globalAlpha /= 0.05;
  const spec = ctx.createRadialGradient(32, 20, 0, 32, 20, 60);
  spec.addColorStop(0, rgba(t.highlight, 0.4));
  spec.addColorStop(1, rgba(t.highlight, 0));
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = t.engrave;
  ctx.globalAlpha *= 0.55;
  ctx.stroke(new Path2D(det.engrave));
  ctx.globalAlpha /= 0.55;

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = t.highlight;
  ctx.globalAlpha *= 0.5;
  ctx.stroke(new Path2D(det.highlight));
  ctx.globalAlpha /= 0.5;

  ctx.fillStyle = t.engrave;
  for (const [x, y] of det.dots) {
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
