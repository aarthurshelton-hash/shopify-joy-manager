/**
 * Victory Card SVG builder — TypeScript port of scripts/promo/victory-card.mjs
 * Generates the same tournament-ready collectible card SVGs in the browser.
 */

import QRCode from 'qrcode';
import { SimulationResult, SquareData } from './gameSimulator';
import { extractEnhancedColorFlowSignature, EnhancedQuadrantProfile } from './colorFlowAnalysis/enhancedSignatureExtractor';

// ── Design tokens (from scripts/promo/tokens.mjs) ─────────────────────

const C = {
  obsidian: '#0B0D12',
  obsidianLift: '#10131B',
  panel: '#12151D',
  panelLift: '#171B25',
  line: '#2A2F3C',
  lineSoft: '#1E2330',
  gold: '#F2B01E',
  goldLight: '#F7C558',
  goldDeep: '#D99A12',
  goldShadow: '#6E521C',
  cream: '#EDE6D6',
  creamDim: '#B9AF98',
  muted: '#8B93A7',
  mutedDeep: '#4A5568',
};

const PIECE_COLORS = {
  bishop: '#3B82F6',
  knight: '#F59E0B',
  rook: '#EF4444',
  queen: '#8B5CF6',
};

const TEMPORAL_COLORS = {
  early: '#10B981',
  mid: '#F59E0B',
  late: '#EF4444',
};

const POLARITY = {
  positive: '#3B82F6',
  negative: '#EF4444',
};

const PAWN_GRADIENT = ['#10B981', '#3B82F6', '#8B5CF6'];

const QUADRANTS = [
  { key: 'q1_kingside_white', short: 'Q1', label: 'KINGSIDE · WHITE', zone: 'files e–h · ranks 1–4' },
  { key: 'q2_queenside_white', short: 'Q2', label: 'QUEENSIDE · WHITE', zone: 'files a–d · ranks 1–4' },
  { key: 'q3_kingside_black', short: 'Q3', label: 'KINGSIDE · BLACK', zone: 'files e–h · ranks 5–8' },
  { key: 'q4_queenside_black', short: 'Q4', label: 'QUEENSIDE · BLACK', zone: 'files a–d · ranks 5–8' },
  { key: 'q5_center_white', short: 'Q5', label: 'CENTER · WHITE', zone: 'files c–f · ranks 1–4' },
  { key: 'q6_center_black', short: 'Q6', label: 'CENTER · BLACK', zone: 'files c–f · ranks 5–8' },
  { key: 'q7_extended_kingside', short: 'Q7', label: 'EXT. KINGSIDE', zone: 'files g–h' },
  { key: 'q8_extended_queenside', short: 'Q8', label: 'EXT. QUEENSIDE', zone: 'files a–b' },
];

const F = {
  display: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
  serif: "'Cormorant Garamond', Cormorant, Georgia, serif",
  sans: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
  mono: "'JetBrains Mono', Menlo, 'SF Mono', monospace",
};

const PRINT = {
  dpi: 300,
  trimW: 1500,
  trimH: 2100,
  bleed: 38,
  safeInset: 75,
  get canvasW() { return this.trimW + this.bleed * 2; },
  get canvasH() { return this.trimH + this.bleed * 2; },
};

const TIERS = {
  champion: { label: 'CHAMPION', stroke: C.gold, fill: C.gold },
  master: { label: 'MASTER', stroke: '#C0C6D4', fill: '#C0C6D4' },
  artisan: { label: 'ARTISAN', stroke: '#C77B3E', fill: '#C77B3E' },
};

const AUDIT = {
  date: '2026-08-09',
  rowsLabel: '13.06M',
  epAccuracy: 69.59,
  sfAccuracy: 64.24,
  edgePp: 5.35,
  sfDepth: 14,
};

// ── SVG primitives (from scripts/promo/parts.mjs) ─────────────────────

const esc = (s: string): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const n = (v: number): string => {
  const r = Math.round(v * 1000) / 1000;
  return Number.isFinite(r) ? String(r) : '0';
};

function svgText(
  str: string,
  opts: { x: number; y: number; size: number; fill: string; family?: string; weight?: number; spacing?: number; anchor?: string; style?: string; opacity?: number }
): string {
  const { x, y, size, fill, family = F.sans, weight, spacing, anchor, style, opacity } = opts;
  const a = [
    `x="${n(x)}"`, `y="${n(y)}"`, `font-family="${family}"`, `font-size="${n(size)}"`, `fill="${fill}"`,
  ];
  if (weight) a.push(`font-weight="${weight}"`);
  if (spacing) a.push(`letter-spacing="${n(spacing)}"`);
  if (anchor) a.push(`text-anchor="${anchor}"`);
  if (style) a.push(`font-style="${style}"`);
  if (opacity != null) a.push(`opacity="${n(opacity)}"`);
  return `<text ${a.join(' ')}>${esc(str)}</text>`;
}

function svgRect(opts: { x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string; sw?: number; opacity?: number; dash?: string }): string {
  const { x, y, w, h, r, fill = 'none', stroke, sw, opacity, dash } = opts;
  const a = [`x="${n(x)}"`, `y="${n(y)}"`, `width="${n(w)}"`, `height="${n(h)}"`];
  if (r) a.push(`rx="${n(r)}"`);
  a.push(`fill="${fill}"`);
  if (stroke) a.push(`stroke="${stroke}"`);
  if (sw) a.push(`stroke-width="${n(sw)}"`);
  if (dash) a.push(`stroke-dasharray="${dash}"`);
  if (opacity != null) a.push(`opacity="${n(opacity)}"`);
  return `<rect ${a.join(' ')}/>`;
}

function svgLine(opts: { x1: number; y1: number; x2: number; y2: number; stroke: string; sw?: number; opacity?: number }): string {
  const { x1, y1, x2, y2, stroke, sw = 1, opacity } = opts;
  const a = [`x1="${n(x1)}"`, `y1="${n(y1)}"`, `x2="${n(x2)}"`, `y2="${n(y2)}"`, `stroke="${stroke}"`, `stroke-width="${n(sw)}"`];
  if (opacity != null) a.push(`opacity="${n(opacity)}"`);
  return `<line ${a.join(' ')}/>`;
}

function svgDefs(): string {
  return `<defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0.45">
      <stop offset="0" stop-color="${C.gold}"/>
      <stop offset="0.5" stop-color="${C.goldLight}"/>
      <stop offset="1" stop-color="${C.goldDeep}"/>
    </linearGradient>
    <linearGradient id="goldSoft" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#A87F2C"/>
      <stop offset="1" stop-color="${C.goldShadow}"/>
    </linearGradient>
    <linearGradient id="surface" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${C.obsidian}"/>
      <stop offset="0.55" stop-color="${C.obsidianLift}"/>
      <stop offset="1" stop-color="${C.obsidian}"/>
    </linearGradient>
    <linearGradient id="pawnGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${PAWN_GRADIENT[0]}"/>
      <stop offset="0.5" stop-color="${PAWN_GRADIENT[1]}"/>
      <stop offset="1" stop-color="${PAWN_GRADIENT[2]}"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

// ── Color flow board (from parts.mjs) ─────────────────────────────────

function colorFlowBoard(opts: { x: number; y: number; size: number; board: SquareData[][]; maxLayers?: number; coords?: boolean; frame?: boolean }): string {
  const { x, y, size, board, maxLayers = 8, coords = true, frame = true } = opts;
  const cell = size / 8;
  const out: string[] = [];

  if (frame) {
    const fPad = cell * 0.16;
    out.push(svgRect({ x: x - fPad, y: y - fPad, w: size + fPad * 2, h: size + fPad * 2, r: cell * 0.12, fill: '#0F1218', stroke: 'url(#gold)', sw: Math.max(2, size * 0.005) }));
  }

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const px = x + file * cell;
      const py = y + (7 - rank) * cell;
      const dark = (rank + file) % 2 === 0;
      out.push(svgRect({ x: px, y: py, w: cell, h: cell, fill: dark ? '#121620' : '#191D26' }));
    }
  }

  const pad = cell * 0.07;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const sq = board?.[rank]?.[file];
      const visits = sq?.visits ?? [];
      if (!visits.length) continue;

      let sample = visits;
      if (visits.length > maxLayers) {
        sample = [];
        for (let i = 0; i < maxLayers; i++) {
          const idx = Math.round((i * (visits.length - 1)) / (maxLayers - 1));
          sample.push(visits[idx]);
        }
      }

      const px = x + file * cell;
      const py = y + (7 - rank) * cell;
      const innerMax = cell - pad * 2;
      const L = sample.length;
      const step = (innerMax * 0.66) / L;

      sample.forEach((v, i) => {
        const side = innerMax - i * step;
        const off = (cell - side) / 2;
        out.push(svgRect({
          x: px + off, y: py + off, w: side, h: side,
          fill: v.hexColor || C.muted, opacity: i === 0 ? 0.95 : 1,
        }));
      });
    }
  }

  if (coords) {
    const fs = cell * 0.30;
    const files = 'abcdefgh';
    for (let i = 0; i < 8; i++) {
      out.push(svgText(files[i], { x: x + i * cell + cell / 2, y: y + size + fs * 1.55, size: fs, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }));
      out.push(svgText(String(i + 1), { x: x - fs * 0.85, y: y + size - i * cell - cell / 2 + fs * 0.36, size: fs, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }));
    }
  }

  return out.join('\n');
}

// ── Quadrant bars (from parts.mjs) ────────────────────────────────────

function quadrantBars(opts: { x: number; y: number; w: number; profile: EnhancedQuadrantProfile; rowH?: number; labelSize?: number; valueSize?: number; noteSize?: number }): string {
  const { x, y, w, profile, rowH = 42, labelSize = 25, valueSize = 25, noteSize = 25 } = opts;
  const values = QUADRANTS.map((q) => (profile as unknown as Record<string, number>)[q.key] ?? 0);
  const peak = Math.max(60, ...values.map((v) => Math.abs(v)));
  const labelW = w * 0.40;
  const valueGutter = w * 0.11;
  const halfW = (w - labelW - valueGutter * 2) / 2;
  const axisX = x + labelW + valueGutter + halfW;
  const barH = rowH * 0.44;
  const out: string[] = [];

  out.push(svgLine({ x1: axisX, y1: y - rowH * 0.3, x2: axisX, y2: y + rowH * QUADRANTS.length - rowH * 0.5, stroke: C.line, sw: 1.5 }));

  QUADRANTS.forEach((q, i) => {
    const v = values[i];
    const cy = y + i * rowH;
    const len = (Math.abs(v) / peak) * halfW;
    const pos = v >= 0;
    const color = pos ? POLARITY.positive : POLARITY.negative;

    out.push(svgText(q.label, { x, y: cy + labelSize * 0.36, size: labelSize, fill: C.muted, family: F.sans, weight: 500, spacing: labelSize * 0.08 }));

    if (len > 0.5) {
      out.push(svgRect({ x: pos ? axisX : axisX - len, y: cy - barH / 2 + barH * 0.08, w: len, h: barH, r: 2, fill: color, opacity: 0.9 }));
    }

    out.push(svgText((v >= 0 ? '+' : '') + v.toFixed(1), {
      x: pos ? axisX + len + valueSize * 0.5 : axisX - len - valueSize * 0.5,
      y: cy + valueSize * 0.36, size: valueSize, fill: pos ? '#7FB0F5' : '#F5908C',
      family: F.mono, anchor: pos ? 'start' : 'end',
    }));
  });

  out.push(svgText(`± ${peak.toFixed(0)} piece-weighted units`, {
    x: axisX, y: y + rowH * QUADRANTS.length + noteSize * 0.2, size: noteSize, fill: C.mutedDeep, family: F.mono, anchor: 'middle',
  }));

  return out.join('\n');
}

// ── Temporal flow ribbon ──────────────────────────────────────────────

function temporalRibbon(opts: { x: number; y: number; w: number; h: number; flow: { early: number; mid: number; late: number }; pctSize?: number; legendSize?: number }): string {
  const { x, y, w, h, flow, pctSize = 25, legendSize = 25 } = opts;
  const phases = [
    { key: 'early' as const, label: 'OPENING', color: TEMPORAL_COLORS.early },
    { key: 'mid' as const, label: 'MIDDLEGAME', color: TEMPORAL_COLORS.mid },
    { key: 'late' as const, label: 'ENDGAME', color: TEMPORAL_COLORS.late },
  ];
  const total = phases.reduce((s, p) => s + (flow[p.key] || 0), 0) || 1;
  const out: string[] = [];
  let cx = x;

  phases.forEach((p) => {
    const frac = (flow[p.key] || 0) / total;
    const pw = frac * w;
    if (pw > 0.4) {
      out.push(svgRect({ x: cx, y, w: pw, h, fill: p.color, opacity: 0.88 }));
      if (pw > pctSize * 2.6) {
        out.push(svgText(`${Math.round(frac * 100)}%`, { x: cx + pw / 2, y: y + h / 2 + pctSize * 0.36, size: pctSize, fill: '#0B0D12', family: F.sans, weight: 700, anchor: 'middle' }));
      }
    }
    cx += pw;
  });

  out.push(svgRect({ x, y, w, h, r: h * 0.18, fill: 'none', stroke: C.lineSoft, sw: 1 }));

  const legY = y + h + legendSize * 1.5;
  let lx = x;
  phases.forEach((p) => {
    out.push(svgRect({ x: lx, y: legY - legendSize * 0.78, w: legendSize * 0.78, h: legendSize * 0.78, r: 1.5, fill: p.color }));
    out.push(svgText(p.label, { x: lx + legendSize * 1.2, y: legY, size: legendSize, fill: C.muted, family: F.sans, weight: 500, spacing: legendSize * 0.07 }));
    lx += legendSize * 1.2 + p.label.length * legendSize * 0.66 + legendSize * 1.2;
  });

  return out.join('\n');
}

// ── Piece dominance bars ──────────────────────────────────────────────

function pieceDominance(opts: { x: number; y: number; w: number; profile: EnhancedQuadrantProfile; rowH?: number; labelSize?: number; valueSize?: number }): string {
  const { x, y, w, profile, rowH = 36, labelSize = 25, valueSize = 25 } = opts;
  const rows = [
    { label: 'BISHOP', v: profile.bishop_dominance, color: PIECE_COLORS.bishop },
    { label: 'KNIGHT', v: profile.knight_dominance, color: PIECE_COLORS.knight },
    { label: 'ROOK', v: profile.rook_dominance, color: PIECE_COLORS.rook },
    { label: 'QUEEN', v: profile.queen_dominance, color: PIECE_COLORS.queen },
  ];
  const labelW = w * 0.3;
  const valW = w * 0.14;
  const trackW = w - labelW - valW;
  const barH = rowH * 0.4;
  const peak = Math.max(0.25, ...rows.map((r) => r.v || 0));
  const out: string[] = [];

  rows.forEach((r, i) => {
    const cy = y + i * rowH;
    out.push(svgText(r.label, { x, y: cy + labelSize * 0.36, size: labelSize, fill: C.muted, family: F.sans, weight: 500, spacing: labelSize * 0.08 }));
    out.push(svgRect({ x: x + labelW, y: cy - barH / 2 + barH * 0.1, w: trackW, h: barH, r: barH / 2, fill: C.panelLift }));
    const len = ((r.v || 0) / peak) * trackW;
    if (len > 0.5) {
      out.push(svgRect({ x: x + labelW, y: cy - barH / 2 + barH * 0.1, w: len, h: barH, r: barH / 2, fill: r.color, opacity: 0.92 }));
    }
    out.push(svgText(`${Math.round((r.v || 0) * 100)}%`, { x: x + w, y: cy + valueSize * 0.36, size: valueSize, fill: C.creamDim, family: F.mono, anchor: 'end' }));
  });

  return out.join('\n');
}

// ── Pawn advancement ──────────────────────────────────────────────────

function pawnAdvancement(opts: { x: number; y: number; w: number; h: number; value: number; labelSize?: number }): string {
  const { x, y, w, h, value, labelSize = 25 } = opts;
  const clamped = Math.max(0, Math.min(1, value || 0));
  const mx = x + clamped * w;
  const baseY = y + h + labelSize * 1.5;
  return [
    svgRect({ x, y, w, h, r: h / 2, fill: 'url(#pawnGrad)', opacity: 0.55 }),
    svgRect({ x, y, w, h, r: h / 2, fill: 'none', stroke: C.lineSoft, sw: 1 }),
    `<circle cx="${n(mx)}" cy="${n(y + h / 2)}" r="${n(h * 0.62)}" fill="${C.cream}" stroke="${C.obsidian}" stroke-width="${n(h * 0.16)}"/>`,
    svgText('BACK RANK', { x, y: baseY, size: labelSize, fill: C.mutedDeep, family: F.sans }),
    svgText(`${Math.round(clamped * 100)}% ADVANCED`, { x: x + w / 2, y: baseY, size: labelSize * 1.06, fill: C.creamDim, family: F.sans, weight: 600, anchor: 'middle' }),
    svgText('PROMOTION', { x: x + w, y: baseY, size: labelSize, fill: C.mutedDeep, family: F.sans, anchor: 'end' }),
  ].join('\n');
}

// ── QR code ───────────────────────────────────────────────────────────

async function qrCode(opts: { x: number; y: number; size: number; data: string; level?: 'L' | 'M' | 'Q' | 'H'; dark?: string }): Promise<string> {
  const { x, y, size, data, level = 'M', dark = C.cream } = opts;
  const qr = QRCode.create(data, { errorCorrectionLevel: level });
  const mods = qr.modules;
  const quiet = 4;
  const span = mods.size + quiet * 2;
  const m = size / span;
  const out: string[] = [];

  for (let r = 0; r < mods.size; r++) {
    let runStart = -1;
    for (let c = 0; c <= mods.size; c++) {
      const on = c < mods.size && mods.data[r * mods.size + c];
      if (on && runStart === -1) runStart = c;
      if (!on && runStart !== -1) {
        out.push(svgRect({ x: x + (runStart + quiet) * m, y: y + (r + quiet) * m, w: (c - runStart) * m, h: m, fill: dark }));
        runStart = -1;
      }
    }
  }

  return out.join('\n');
}

// ── Card chrome ───────────────────────────────────────────────────────

const T = { x: 75, y: 75, w: 1350, h: 1950 };
const CX = T.x + T.w / 2;

function cornerPips(): string {
  const tw = PRINT.trimW;
  const th = PRINT.trimH;
  const s = 28;
  const inset = 62;
  const spots = [
    [inset, inset],
    [tw - inset - s, inset],
    [inset, th - inset - s],
    [tw - inset - s, th - inset - s],
  ];
  return spots
    .map(([px, py]) =>
      [
        svgRect({ x: px, y: py, w: s, h: s, fill: 'none', stroke: 'url(#gold)', sw: 3 }),
        svgRect({ x: px + 9, y: py + 9, w: 10, h: 10, fill: 'url(#gold)' }),
      ].join('')
    )
    .join('\n');
}

function cardFrame(): string {
  const tw = PRINT.trimW;
  const th = PRINT.trimH;
  return [
    svgRect({ x: 0, y: 0, w: tw, h: th, fill: 'url(#surface)' }),
    svgRect({ x: 26, y: 26, w: tw - 52, h: th - 52, r: 34, fill: 'none', stroke: 'url(#gold)', sw: 7 }),
    svgRect({ x: 44, y: 44, w: tw - 88, h: th - 88, r: 24, fill: 'none', stroke: C.goldDeep, sw: 1.5, opacity: 0.55 }),
    cornerPips(),
  ].join('\n');
}

function tierBadge(opts: { x: number; y: number; w: number; h: number; tier: string }): string {
  const t = (TIERS as Record<string, { label: string; stroke: string; fill: string }>)[opts.tier] || TIERS.champion;
  return [
    svgRect({ x: opts.x, y: opts.y, w: opts.w, h: opts.h, r: opts.h / 2, fill: 'none', stroke: t.stroke, sw: 2.5 }),
    svgText(t.label, { x: opts.x + opts.w / 2, y: opts.y + opts.h * 0.66, size: 26, fill: t.fill, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }),
  ].join('\n');
}

function sectionRule(label: string, x: number, y: number, w: number): string {
  const size = 25;
  const textW = label.length * size * 0.82;
  const ruleX = x + textW + 14;
  return [
    svgText(label, { x, y, size, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    ruleX < x + w ? svgLine({ x1: ruleX, y1: y - 5, x2: x + w, y2: y - 5, stroke: C.line, sw: 1 }) : '',
  ].join('\n');
}

function headerBlock(game: VictoryCardGame): string {
  return [
    svgText('EN PENSENT', { x: CX, y: 133, size: 30, fill: C.gold, family: F.display, weight: 600, spacing: 14, anchor: 'middle' }),
    svgText(game.title, { x: CX, y: 217, size: 62, fill: C.cream, family: F.display, weight: 700, anchor: 'middle' }),
    svgText(`${game.event.toUpperCase()} · ${game.year}`, { x: CX, y: 273, size: 26, fill: C.muted, family: F.sans, weight: 500, spacing: 5, anchor: 'middle' }),
    svgLine({ x1: T.x, y1: 297, x2: T.x + T.w, y2: 297, stroke: 'url(#goldSoft)', sw: 1.5, opacity: 0.6 }),
    `<g transform="translate(${CX},297) rotate(45)">${svgRect({ x: -6, y: -6, w: 12, h: 12, fill: C.goldDeep })}</g>`,
  ].join('\n');
}

// ── Types ─────────────────────────────────────────────────────────────

export interface VictoryCardGame {
  id: string;
  title: string;
  event: string;
  year: string;
  white: string;
  black: string;
  result: string;
  winner: string;
  tier: string;
  edition: { number: number; of: number };
  pgn: string;
  poem?: string[];
}

// ── Front content ─────────────────────────────────────────────────────

function frontContent(game: VictoryCardGame, sim: SimulationResult, sig: ReturnType<typeof extractEnhancedColorFlowSignature>): string {
  const p = sig.enhancedProfile;
  const colL = { x: T.x, w: 640 };
  const colR = { x: 785, w: 640 };
  const out: string[] = [];

  out.push(cardFrame());
  out.push(headerBlock(game));

  out.push(colorFlowBoard({ x: 310, y: 335, size: 880, board: sim.board, maxLayers: 8, coords: true, frame: true }));

  out.push(sectionRule('8-QUADRANT SIGNATURE', colL.x, 1320, colL.w));
  out.push(quadrantBars({ x: colL.x, y: 1353, w: colL.w, profile: p }));

  out.push(sectionRule('TEMPORAL FLOW', colR.x, 1320, colR.w));
  out.push(temporalRibbon({ x: colR.x, y: 1337, w: colR.w, h: 50, flow: p.temporalFlow }));

  out.push(sectionRule('PIECE DOMINANCE', colR.x, 1450, colR.w));
  out.push(pieceDominance({ x: colR.x, y: 1480, w: colR.w, profile: p }));

  out.push(sectionRule('PAWN ADVANCEMENT', colR.x, 1640, colR.w));
  out.push(pawnAdvancement({ x: colR.x, y: 1655, w: colR.w, h: 20, value: p.pawn_advancement }));

  out.push(svgText(game.winner.toUpperCase(), { x: CX, y: 1733, size: 42, fill: 'url(#gold)', family: F.display, weight: 700, spacing: 5, anchor: 'middle' }));
  out.push(svgText(`${game.white}  ${game.result.replace('-', '–')}  ${game.black}`, { x: CX, y: 1773, size: 26, fill: C.muted, family: F.sans, anchor: 'middle' }));

  const archetypeLabel = labelFromArchetype(sig.archetype).toUpperCase();
  const pillW = Math.min(T.w, archetypeLabel.length * 17.4 + 110);
  out.push(svgRect({ x: CX - pillW / 2, y: 1797, w: pillW, h: 52, r: 26, fill: C.panel, stroke: C.goldDeep, sw: 1.5 }));
  out.push(svgText(archetypeLabel, { x: CX, y: 1831, size: 26, fill: C.gold, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }));

  if (game.poem) {
    game.poem.slice(0, 2).forEach((l, i) => {
      out.push(svgText(l, { x: CX, y: 1883 + i * 36, size: 27, fill: C.creamDim, family: F.serif, style: 'italic', anchor: 'middle' }));
    });
  }

  out.push(svgLine({ x1: T.x, y1: 1945, x2: T.x + T.w, y2: 1945, stroke: C.line, sw: 1 }));
  const ed = `${String(game.edition.number).padStart(3, '0')} / ${game.edition.of}`;
  out.push(svgRect({ x: T.x, y: 1957, w: 250, h: 56, r: 28, fill: 'none', stroke: 'url(#gold)', sw: 2 }));
  out.push(svgText(ed, { x: T.x + 125, y: 1993, size: 26, fill: C.gold, family: F.mono, weight: 500, anchor: 'middle' }));
  out.push(svgText('ENPENSENT.COM', { x: CX, y: 1980, size: 26, fill: C.muted, family: F.sans, spacing: 4, anchor: 'middle' }));
  out.push(svgText(sig.fingerprint, { x: CX, y: 2010, size: 25, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }));
  out.push(tierBadge({ x: T.x + T.w - 250, y: 1957, w: 250, h: 56, tier: game.tier }));

  return out.join('\n');
}

// ── Back content ──────────────────────────────────────────────────────

function wrapMono(str: string, maxChars: number): string[] {
  const words = str.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur.length) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

async function backContent(game: VictoryCardGame, sim: SimulationResult, sig: ReturnType<typeof extractEnhancedColorFlowSignature>): Promise<string> {
  const p = sig.enhancedProfile;
  const out: string[] = [];
  out.push(cardFrame());

  out.push(svgText('EN PENSENT', { x: CX, y: 133, size: 30, fill: C.gold, family: F.display, weight: 600, spacing: 14, anchor: 'middle' }));
  out.push(svgText('Verification & Provenance', { x: CX, y: 205, size: 44, fill: C.cream, family: F.display, weight: 700, anchor: 'middle' }));
  out.push(svgLine({ x1: T.x, y1: 238, x2: T.x + T.w, y2: 238, stroke: 'url(#goldSoft)', sw: 1.5, opacity: 0.6 }));

  const qrSize = 300;
  const url = `https://enpensent.com/verify/${game.id}`;
  const qrSvg = await qrCode({ x: CX - qrSize / 2, y: 278, size: qrSize, data: url, level: 'M', dark: C.cream });
  out.push(svgRect({ x: CX - qrSize / 2 - 18, y: 260, w: qrSize + 36, h: qrSize + 36, r: 12, fill: C.panel, stroke: C.line, sw: 1.5 }));
  out.push(qrSvg);
  out.push(svgText('SCAN TO VERIFY THIS CARD', { x: CX, y: 636, size: 26, fill: C.muted, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }));
  out.push(svgText(url, { x: CX, y: 666, size: 25, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }));

  let cy = 726;

  out.push(sectionRule('ENGINE SIGNATURE', T.x, cy, T.w));
  cy += 34;
  out.push(svgText(sig.fingerprint, { x: T.x, y: cy, size: 28, fill: C.gold, family: F.mono, weight: 500 }));
  out.push(svgText(labelFromArchetype(sig.archetype), { x: T.x + T.w, y: cy, size: 26, fill: C.creamDim, family: F.sans, weight: 500, anchor: 'end' }));
  cy += 28;
  out.push(svgText(
    `complexity ${sig.complexity.toFixed(3)}  ·  color richness ${sig.colorRichness.toFixed(2)}  ·  ${sim.totalMoves} plies  ·  Stockfish depth ${AUDIT.sfDepth}`,
    { x: T.x, y: cy, size: 25, fill: C.mutedDeep, family: F.mono }
  ));
  cy += 56;

  out.push(sectionRule('GAME RECORD', T.x, cy, T.w));
  cy += 32;
  out.push(svgText(`${game.white} vs ${game.black} · ${game.event}, ${game.year} · ${game.result}`, { x: T.x, y: cy, size: 26, fill: C.creamDim, family: F.sans }));
  cy += 36;
  const pgnSize = 25;
  const pgnLines = wrapMono(game.pgn, Math.floor(T.w / (pgnSize * 0.6)));
  pgnLines.forEach((l, i) => {
    out.push(svgText(l, { x: T.x, y: cy + i * (pgnSize + 6), size: pgnSize, fill: C.muted, family: F.mono }));
  });
  cy += pgnLines.length * (pgnSize + 6) + 34;

  out.push(sectionRule('QUADRANT DEFINITIONS', T.x, cy, T.w));
  cy += 30;
  const rowH = 42;
  QUADRANTS.forEach((q, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const qx = T.x + col * (T.w / 2);
    const qy = cy + row * rowH;
    const v = (p as unknown as Record<string, number>)[q.key] ?? 0;
    out.push(svgText(q.short, { x: qx, y: qy, size: 25, fill: C.gold, family: F.mono, weight: 500 }));
    out.push(svgText(q.label, { x: qx + 56, y: qy, size: 25, fill: C.creamDim, family: F.sans, weight: 500 }));
    out.push(svgText(q.zone, { x: qx + 56, y: qy + 28, size: 25, fill: C.mutedDeep, family: F.sans }));
    out.push(svgText(`${v >= 0 ? '+' : ''}${v.toFixed(1)}`, { x: qx + T.w / 2 - 30, y: qy, size: 25, fill: v >= 0 ? '#7FB0F5' : '#F5908C', family: F.mono, anchor: 'end' }));
  });
  cy += 4 * rowH + 30;

  out.push(sectionRule('METHOD & PROVENANCE', T.x, cy, T.w));
  cy += 32;
  const prov = [
    'Every value on this card is computed by the En Pensent engine directly from the',
    'game record above — no estimates and no synthetic data. The 8-quadrant signature',
    'is piece-weighted cumulative square occupancy; positive readings favour White.',
    `Prediction benchmark: ${AUDIT.rowsLabel} scored positions, En Pensent ${AUDIT.epAccuracy}% vs`,
    `Stockfish depth ${AUDIT.sfDepth} ${AUDIT.sfAccuracy}% (+${AUDIT.edgePp}pp). Full-database audit ${AUDIT.date}.`,
  ];
  prov.forEach((l, i) => {
    out.push(svgText(l, { x: T.x, y: cy + i * 31, size: 25, fill: C.muted, family: F.sans }));
  });

  out.push(svgLine({ x1: T.x, y1: 1945, x2: T.x + T.w, y2: 1945, stroke: C.line, sw: 1 }));
  const ed = `${String(game.edition.number).padStart(3, '0')} / ${game.edition.of}`;
  out.push(svgRect({ x: T.x, y: 1957, w: 250, h: 56, r: 28, fill: 'none', stroke: 'url(#gold)', sw: 2 }));
  out.push(svgText(ed, { x: T.x + 125, y: 1993, size: 26, fill: C.gold, family: F.mono, weight: 500, anchor: 'middle' }));
  out.push(svgText('LIMITED PRE-BETA RUN', { x: CX, y: 1993, size: 26, fill: C.muted, family: F.sans, spacing: 4, anchor: 'middle' }));
  out.push(tierBadge({ x: T.x + T.w - 250, y: 1957, w: 250, h: 56, tier: game.tier }));

  return out.join('\n');
}

// ── Assembly ──────────────────────────────────────────────────────────

function assemble(content: string, title: string, desc: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PRINT.trimW} ${PRINT.trimH}" width="${PRINT.trimW}" height="${PRINT.trimH}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <desc>${esc(desc)}</desc>
${svgDefs()}
  ${svgRect({ x: 0, y: 0, w: PRINT.trimW, h: PRINT.trimH, fill: C.obsidian })}
  <g>
${content}
  </g>
</svg>`;
}

// ── Archetype label helper ────────────────────────────────────────────

const ARCHETYPE_LABELS: Record<string, string> = {
  sacrificial_kingside_assault: 'Sacrificial Kingside Assault',
  sacrificial_queenside_break: 'Sacrificial Queenside Break',
  kingside_attack: 'Kingside Attack',
  queenside_expansion: 'Queenside Expansion',
  central_domination: 'Central Domination',
  prophylactic_defense: 'Prophylactic Defense',
  pawn_storm: 'Pawn Storm',
  piece_harmony: 'Piece Harmony',
  opposite_castling: 'Opposite Castling',
  closed_maneuvering: 'Closed Maneuvering',
  open_tactical: 'Open Tactical',
  endgame_technique: 'Endgame Technique',
  sacrificial_attack: 'Sacrificial Attack',
  positional_squeeze: 'Positional Squeeze',
  king_hunt: 'King Hunt',
  tactical_melee: 'Tactical Melee',
  middlegame_complexity: 'Middlegame Complexity',
  unknown: 'Unclassified',
};

function labelFromArchetype(id: string): string {
  return ARCHETYPE_LABELS[id] || String(id).split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Public API ────────────────────────────────────────────────────────

export async function renderVictoryCardFront(
  simulation: SimulationResult,
  game: VictoryCardGame
): Promise<string> {
  const sig = extractEnhancedColorFlowSignature(simulation);
  const content = frontContent(game, simulation, sig);
  const title = `En Pensent Victory Card — ${game.title} (front)`;
  const desc = `${game.white} vs ${game.black}, ${game.event} ${game.year}, ${game.result}. Archetype ${labelFromArchetype(sig.archetype)}, fingerprint ${sig.fingerprint}.`;
  return assemble(content, title, desc);
}

export async function renderVictoryCardBack(
  simulation: SimulationResult,
  game: VictoryCardGame
): Promise<string> {
  const sig = extractEnhancedColorFlowSignature(simulation);
  const content = await backContent(game, simulation, sig);
  const title = `En Pensent Victory Card — ${game.title} (back)`;
  const desc = `Verification & provenance for ${game.white} vs ${game.black}. Fingerprint ${sig.fingerprint}.`;
  return assemble(content, title, desc);
}

/**
 * Render an SVG string to a PNG data URL at the given scale.
 */
export async function svgToPngDataUrl(svg: string, scale: number = 1): Promise<string> {
  const img = new Image();
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const w = PRINT.trimW * scale;
      const h = PRINT.trimH * scale;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}

/**
 * Build a VictoryCardGame object from a SimulationResult and optional metadata.
 */
export function buildGameFromSimulation(
  simulation: SimulationResult,
  opts: { pgn?: string; source?: string; editionNumber?: number }
): VictoryCardGame {
  const gd = simulation.gameData;
  const white = gd.white || 'Unknown';
  const black = gd.black || 'Unknown';
  const result = gd.result || '*';
  const winner = result === '1-0' ? white : result === '0-1' ? black : 'Draw';
  const event = gd.event || opts.source || 'Online Game';
  const date = gd.date || '';
  const year = date ? String(date).split('.')[0] : new Date().getFullYear().toString();

  const id = `${white.replace(/[^a-zA-Z0-9]/g, '')}_${year}`.toLowerCase();

  return {
    id,
    title: `${white} vs ${black}`,
    event,
    year,
    white,
    black,
    result,
    winner,
    tier: 'champion',
    edition: { number: opts.editionNumber || 1, of: 250 },
    pgn: opts.pgn || '',
  };
}
