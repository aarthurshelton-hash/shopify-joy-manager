import type { SquareData } from '@/lib/chess/gameSimulator';
import type { PieceType } from '@/lib/chess/pieceColors';

/**
 * Deterministic vision fingerprinting.
 *
 * A vision is rendered from (moves, palette) by `renderNestedSquares`, so we
 * can reproduce exactly what any vision should look like as a small colour
 * grid and match camera frames / photos against it on-device. Matching uses
 * per-channel correlation, which is invariant to exposure and white balance.
 */

export type RGB = [number, number, number];

export interface PaletteColors {
  white: Record<PieceType, string>;
  black: Record<PieceType, string>;
}

export interface Template {
  key: string;
  group: string;
  coarse: Float32Array;
  fine: Float32Array;
}

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SearchOptions {
  minScale: number;
  maxScale: number;
  scaleStep: number;
  posStep: number;
  rotations: number[];
  topK: number;
}

export interface MatchResult {
  key: string;
  score: number;
  secondScore: number;
  confidence: number;
  accepted: boolean;
  x: number;
  y: number;
  size: number;
  rot: number;
}

export interface IntegralImage {
  w: number;
  h: number;
  sums: Float64Array;
}

export const COARSE_N = 8;
export const FINE_N = 24;
export const ACCEPT_SCORE = 0.7;
export const MIN_MARGIN = 0.04;

export const CAMERA_SEARCH: SearchOptions = {
  minScale: 0.55,
  maxScale: 1.0,
  scaleStep: 0.05,
  posStep: 0.08,
  rotations: [0, 1, 2, 3],
  topK: 5,
};

export const UPLOAD_SEARCH: SearchOptions = {
  minScale: 0.3,
  maxScale: 1.0,
  scaleStep: 0.06,
  posStep: 0.08,
  rotations: [0, 1, 2, 3],
  topK: 6,
};

/** Camera frames check upright every frame and cycle the other orientations. */
export function cameraRotationsForFrame(frame: number): number[] {
  return [0, 1 + (frame % 3)];
}

const BOARD_LIGHT = '#FAFAF9';
const BOARD_DARK = '#2C2C2C';
const SUPERSAMPLE = 3;
const PADDING = 0.08;
const MAX_NESTING = 6;

export function hexToRgb(hex: string): RGB {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (h.length < 6 || Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Layer {
  rgb: RGB;
  size: number;
}

/** Mirrors the layer geometry of `renderNestedSquares` in unit square space. */
function squareLayers(square: SquareData, palette: PaletteColors): Layer[] {
  const unique: string[] = [];
  for (const visit of square.visits) {
    const hex = (visit.color === 'w' ? palette.white : palette.black)[visit.piece];
    if (hex && !unique.includes(hex)) unique.push(hex);
  }
  if (unique.length === 0) return [];
  const maxNesting = Math.min(unique.length, MAX_NESTING);
  let current = 1 - PADDING * 2;
  const reduction = (current * 0.7) / maxNesting;
  const layers: Layer[] = [];
  for (let i = 0; i < maxNesting; i++) {
    layers.push({ rgb: hexToRgb(unique[i]), size: current });
    current -= reduction;
    if (current < 0.1) break;
  }
  return layers;
}

function colorAt(u: number, v: number, base: RGB, layers: Layer[]): RGB {
  for (let i = layers.length - 1; i >= 0; i--) {
    const off = (1 - layers[i].size) / 2;
    const end = off + layers[i].size;
    if (u >= off && u <= end && v >= off && v <= end) return layers[i].rgb;
  }
  return base;
}

/** Render the expected vision (rank 8 at top) as an n×n RGB grid. n must be a multiple of 8. */
export function renderExpected(board: SquareData[][], palette: PaletteColors, n: number = FINE_N): Float32Array {
  const out = new Float32Array(n * n * 3);
  const per = n / 8;
  const light = hexToRgb(BOARD_LIGHT);
  const dark = hexToRgb(BOARD_DARK);
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let row = 0; row < 8; row++) {
    const rank = 7 - row;
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      const base = square.isLight ? light : dark;
      const layers = squareLayers(square, palette);
      for (let cy = 0; cy < per; cy++) {
        for (let cx = 0; cx < per; cx++) {
          let r = 0, g = 0, b = 0;
          for (let sy = 0; sy < SUPERSAMPLE; sy++) {
            const v = (cy + (sy + 0.5) / SUPERSAMPLE) / per;
            for (let sx = 0; sx < SUPERSAMPLE; sx++) {
              const u = (cx + (sx + 0.5) / SUPERSAMPLE) / per;
              const c = colorAt(u, v, base, layers);
              r += c[0]; g += c[1]; b += c[2];
            }
          }
          const idx = ((row * per + cy) * n + (file * per + cx)) * 3;
          out[idx] = r / samples;
          out[idx + 1] = g / samples;
          out[idx + 2] = b / samples;
        }
      }
    }
  }
  return out;
}

function downsample(src: Float32Array, n: number, m: number): Float32Array {
  const f = n / m;
  const out = new Float32Array(m * m * 3);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const s = (y * n + x) * 3;
      const d = (Math.floor(y / f) * m + Math.floor(x / f)) * 3;
      out[d] += src[s];
      out[d + 1] += src[s + 1];
      out[d + 2] += src[s + 2];
    }
  }
  const area = f * f;
  for (let i = 0; i < out.length; i++) out[i] /= area;
  return out;
}

function channelStats(g: Float32Array): { mean: number[]; std: number[] } {
  const count = g.length / 3;
  const mean = [0, 0, 0];
  const std = [0, 0, 0];
  for (let i = 0; i < g.length; i += 3) {
    mean[0] += g[i]; mean[1] += g[i + 1]; mean[2] += g[i + 2];
  }
  for (let c = 0; c < 3; c++) mean[c] /= count;
  for (let i = 0; i < g.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      const d = g[i + c] - mean[c];
      std[c] += d * d;
    }
  }
  for (let c = 0; c < 3; c++) std[c] = Math.sqrt(std[c] / count);
  return { mean, std };
}

/** Template vector: dot(template, imageVector) = Σ_c w_c · corr_c, with w_c ∝ template channel std. */
function templateVector(g: Float32Array): Float32Array {
  const count = g.length / 3;
  const { mean, std } = channelStats(g);
  const total = std[0] + std[1] + std[2];
  const out = new Float32Array(g.length);
  if (total < 1e-6) return out;
  for (let i = 0; i < g.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      out[i + c] = std[c] > 1e-6 ? ((g[i + c] - mean[c]) / std[c]) * (std[c] / total) / count : 0;
    }
  }
  return out;
}

/** Per-channel z-score. Returns false if the grid is flat (nothing to match). */
function imageVector(g: Float32Array, out: Float32Array): boolean {
  const { mean, std } = channelStats(g);
  if (std[0] + std[1] + std[2] < 2) return false;
  for (let i = 0; i < g.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      out[i + c] = std[c] > 1e-6 ? (g[i + c] - mean[c]) / std[c] : 0;
    }
  }
  return true;
}

export function buildTemplate(key: string, board: SquareData[][], palette: PaletteColors, group: string = key): Template {
  const fineGrid = renderExpected(board, palette, FINE_N);
  return {
    key,
    group,
    coarse: templateVector(downsample(fineGrid, FINE_N, COARSE_N)),
    fine: templateVector(fineGrid),
  };
}

export function buildIntegral(rgba: ArrayLike<number>, w: number, h: number): IntegralImage {
  const W = w + 1;
  const sums = new Float64Array(W * (h + 1) * 3);
  for (let y = 0; y < h; y++) {
    let r = 0, g = 0, b = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2];
      const o = ((y + 1) * W + x + 1) * 3;
      const p = (y * W + x + 1) * 3;
      sums[o] = sums[p] + r;
      sums[o + 1] = sums[p + 1] + g;
      sums[o + 2] = sums[p + 2] + b;
    }
  }
  return { w, h, sums };
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/** Average colour of each cell of an n×n grid laid over the square crop. */
function sampleGrid(ii: IntegralImage, x: number, y: number, size: number, n: number, out: Float32Array): void {
  const W = ii.w + 1;
  const s = ii.sums;
  const cell = size / n;
  for (let cy = 0; cy < n; cy++) {
    const y0 = clampInt(y + cy * cell, 0, ii.h - 1);
    const y1 = Math.max(y0 + 1, clampInt(y + (cy + 1) * cell, 0, ii.h));
    for (let cx = 0; cx < n; cx++) {
      const x0 = clampInt(x + cx * cell, 0, ii.w - 1);
      const x1 = Math.max(x0 + 1, clampInt(x + (cx + 1) * cell, 0, ii.w));
      const area = (x1 - x0) * (y1 - y0);
      const a = (y0 * W + x0) * 3;
      const b = (y0 * W + x1) * 3;
      const c = (y1 * W + x0) * 3;
      const d = (y1 * W + x1) * 3;
      const o = (cy * n + cx) * 3;
      out[o] = (s[d] - s[b] - s[c] + s[a]) / area;
      out[o + 1] = (s[d + 1] - s[b + 1] - s[c + 1] + s[a + 1]) / area;
      out[o + 2] = (s[d + 2] - s[b + 2] - s[c + 2] + s[a + 2]) / area;
    }
  }
}

function rotateGrid(src: Float32Array, n: number, rot: number, out: Float32Array): void {
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let sr = r, sc = c;
      if (rot === 1) { sr = n - 1 - c; sc = r; }
      else if (rot === 2) { sr = n - 1 - r; sc = n - 1 - c; }
      else if (rot === 3) { sr = c; sc = n - 1 - r; }
      const s = (sr * n + sc) * 3;
      const d = (r * n + c) * 3;
      out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2];
    }
  }
}

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

interface Placement {
  x: number;
  y: number;
  size: number;
  rot: number;
}

function makeFineScorer(ii: IntegralImage, region: Region) {
  const g = new Float32Array(FINE_N * FINE_N * 3);
  const r = new Float32Array(g.length);
  const z = new Float32Array(g.length);
  return (t: Template, p: Placement): number => {
    if (p.size < 16 || p.x < region.x - 1 || p.y < region.y - 1 ||
        p.x + p.size > region.x + region.w + 1 || p.y + p.size > region.y + region.h + 1) {
      return -Infinity;
    }
    sampleGrid(ii, p.x, p.y, p.size, FINE_N, g);
    rotateGrid(g, FINE_N, p.rot, r);
    if (!imageVector(r, z)) return -Infinity;
    return dot(t.fine, z);
  };
}

/** Hill-climb position and scale around a coarse hit using the fine grid. */
function refine(score: (t: Template, p: Placement) => number, t: Template, start: Placement, base: number, opts: SearchOptions) {
  let best = { ...start };
  let bestScore = score(t, best);
  for (const frac of [0.5, 0.25, 0.12]) {
    const dp = Math.max(1, opts.posStep * start.size * frac);
    const ds = Math.max(1, opts.scaleStep * base * frac);
    for (let iter = 0; iter < 12; iter++) {
      const moves: Placement[] = [
        { ...best, x: best.x + dp }, { ...best, x: best.x - dp },
        { ...best, y: best.y + dp }, { ...best, y: best.y - dp },
        { ...best, x: best.x - ds / 2, y: best.y - ds / 2, size: best.size + ds },
        { ...best, x: best.x + ds / 2, y: best.y + ds / 2, size: best.size - ds },
      ];
      let improved = false;
      for (const m of moves) {
        const s = score(t, m);
        if (s > bestScore + 1e-5) { bestScore = s; best = m; improved = true; }
      }
      if (!improved) break;
    }
  }
  return { placement: best, score: bestScore };
}

export function confidenceFromScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(((score - 0.3) / 0.6) * 100)));
}

/** Find the best-matching vision template inside `region` of the image. */
export function matchVision(
  ii: IntegralImage,
  templates: Template[],
  region: Region,
  opts: SearchOptions,
): MatchResult | null {
  if (templates.length === 0) return null;
  const base = Math.min(region.w, region.h);
  const nT = templates.length;
  const bestScore = new Float64Array(nT).fill(-Infinity);
  const bestPlace: Placement[] = new Array(nT);

  const g = new Float32Array(COARSE_N * COARSE_N * 3);
  const r = new Float32Array(g.length);
  const z = new Float32Array(g.length);

  for (let s = opts.maxScale; s >= opts.minScale - 1e-9; s -= opts.scaleStep) {
    const size = s * base;
    const step = Math.max(1, opts.posStep * size);
    for (let y = region.y; y <= region.y + region.h - size + 1e-6; y += step) {
      for (let x = region.x; x <= region.x + region.w - size + 1e-6; x += step) {
        sampleGrid(ii, x, y, size, COARSE_N, g);
        for (const rot of opts.rotations) {
          rotateGrid(g, COARSE_N, rot, r);
          if (!imageVector(r, z)) break;
          for (let t = 0; t < nT; t++) {
            const sc = dot(templates[t].coarse, z);
            if (sc > bestScore[t]) {
              bestScore[t] = sc;
              bestPlace[t] = { x, y, size, rot };
            }
          }
        }
      }
    }
  }

  const sorted = Array.from({ length: nT }, (_, i) => i)
    .filter((i) => Number.isFinite(bestScore[i]))
    .sort((a, b) => bestScore[b] - bestScore[a]);
  if (sorted.length === 0) return null;
  const ranked = sorted.slice(0, opts.topK);
  const topGroup = templates[sorted[0]].group;
  if (ranked.every((i) => templates[i].group === topGroup)) {
    const rival = sorted.find((i) => templates[i].group !== topGroup);
    if (rival !== undefined) ranked.push(rival);
  }

  const scorer = makeFineScorer(ii, region);
  const refined = ranked
    .map((i) => ({ i, ...refine(scorer, templates[i], bestPlace[i], base, opts) }))
    .sort((a, b) => b.score - a.score);

  const top = refined[0];
  const rival = refined.find((c) => templates[c.i].group !== templates[top.i].group);
  const secondScore = rival ? Math.max(0, rival.score) : 0;
  return {
    key: templates[top.i].key,
    score: top.score,
    secondScore,
    confidence: confidenceFromScore(top.score),
    accepted: top.score >= ACCEPT_SCORE && top.score - secondScore >= MIN_MARGIN,
    ...top.placement,
  };
}
