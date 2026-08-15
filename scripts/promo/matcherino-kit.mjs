/**
 * En Pensent x Matcherino — promo asset kit (refined).
 *
 * Changes from the first pass:
 *   - every published statistic is a real audited figure, not a vague claim
 *   - the hero board is the actual color flow of a real game, and the input
 *     panel shows that same game's real PGN, so input and output correspond
 *   - the logo mark ships crisp by default; blur is a separate large-format file
 *   - added light-background and monochrome lockups, a brand spec sheet, and a
 *     dedicated 8-quadrant signature card
 */

import { C, F, AUDIT, PIECE_COLORS, TEMPORAL_COLORS } from './tokens.mjs';
import { archetypeLabel } from './games.mjs';
import {
  text, rect, line, defs, logoMark, colorFlowBoard, quadrantBars, temporalRibbon, svgDoc, n,
} from './parts.mjs';

const SITE = 'ENPENSENT.COM';

// ── logo lockups ──────────────────────────────────────────────────────

export function logoMarkAsset({ glow = false, mono = null, bg = C.obsidian, ring = true } = {}) {
  const body = [
    rect({ x: 0, y: 0, w: 512, h: 512, r: 72, fill: bg }),
    ring ? rect({ x: 10, y: 10, w: 492, h: 492, r: 64, fill: 'none', stroke: mono ? mono : 'url(#goldSoft)', sw: 2, opacity: mono ? 0.35 : 1 }) : '',
    logoMark({ x: 116, y: 116, size: 280, glow, mono }),
  ].join('\n');
  return svgDoc({
    w: 512, h: 512, body,
    title: 'En Pensent mark',
    desc: 'Nested squares: each layer is one piece passing through the same square.',
  });
}

export function wordmarkAsset({ light = false } = {}) {
  const bg = light ? C.cream : C.obsidian;
  const word = light ? C.obsidian : 'url(#gold)';
  const tag = light ? C.mutedDeep : C.cream;
  const rule = light ? C.mutedDeep : 'url(#goldSoft)';
  const body = [
    rect({ x: 0, y: 0, w: 1200, h: 280, r: 24, fill: bg }),
    logoMark({ x: 58, y: 58, size: 164, mono: light ? C.obsidian : null }),
    text('EN PENSENT', { x: 286, y: 150, size: 88, fill: word, family: F.display, weight: 700, spacing: 6 }),
    line({ x1: 288, y1: 172, x2: 1136, y2: 172, stroke: rule, sw: 1.5, opacity: 0.65 }),
    text('EVERY GAME IS A WORK OF ART', { x: 290, y: 208, size: 25, fill: tag, family: F.sans, weight: 500, spacing: 9.5, opacity: light ? 0.75 : 0.85 }),
  ].join('\n');
  return svgDoc({ w: 1200, h: 280, body, title: 'En Pensent wordmark' });
}

// ── hero ──────────────────────────────────────────────────────────────

export function heroAsset({ game, sim, sig }) {
  const pgnLines = chunkPgn(game.pgn, 3, 42);
  const body = [
    rect({ x: 0, y: 0, w: 1600, h: 900, fill: 'url(#surface)' }),
    `<circle cx="1140" cy="420" r="360" fill="${C.gold}" opacity="0.045"/>`,
    `<circle cx="1140" cy="420" r="240" fill="${C.gold}" opacity="0.035"/>`,

    // Left: the claim
    text('EN PENSENT', { x: 90, y: 150, size: 27, fill: C.gold, family: F.display, weight: 600, spacing: 8.5 }),
    text('Every Game Is', { x: 88, y: 232, size: 54, fill: C.cream, family: F.display, weight: 700 }),
    text('A Work of Art', { x: 88, y: 292, size: 54, fill: 'url(#gold)', family: F.display, weight: 700 }),
    text('Paste any game or position — watch it paint itself.', { x: 90, y: 344, size: 22, fill: C.muted, family: F.serif, style: 'italic' }),

    // Input panel — real PGN of the game rendered on the right
    rect({ x: 90, y: 386, w: 600, h: 200, r: 14, fill: C.panel, stroke: C.line, sw: 1.5 }),
    `<circle cx="122" cy="418" r="6" fill="#DC2626"/>`,
    `<circle cx="144" cy="418" r="6" fill="#F59E0B"/>`,
    `<circle cx="166" cy="418" r="6" fill="#10B981"/>`,
    text(`PGN · ${game.title.toUpperCase()}, ${game.year}`, { x: 118, y: 462, size: 15, fill: C.mutedDeep, family: F.sans, weight: 600, spacing: 2.4 }),
    ...pgnLines.map((l, i) =>
      text(l, { x: 118, y: 496 + i * 26, size: 17, fill: i === pgnLines.length - 1 ? C.cream : C.muted, family: F.mono })
    ),

    // Verified stat row
    ...statTrio([
      { v: AUDIT.rowsLabel, l: 'POSITIONS SCORED' },
      { v: `${AUDIT.epAccuracy}%`, l: 'EN PENSENT' },
      { v: `+${AUDIT.edgePp}pp`, l: `VS STOCKFISH D${AUDIT.sfDepth}` },
    ], { x: 90, y: 648, gap: 200, valueSize: 34, labelSize: 14 }),

    // Transform arrow
    `<g filter="url(#glow)">
      ${line({ x1: 730, y1: 420, x2: 812, y2: 420, stroke: 'url(#gold)', sw: 5, cap: 'round' })}
      <path d="M 798 402 L 820 420 L 798 438" fill="none" stroke="url(#gold)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,

    // Right: the real vision
    colorFlowBoard({ x: 900, y: 180, size: 480, board: sim.board, maxLayers: 7, coords: true, frame: true }),
    text(archetypeLabel(sig.archetype).toUpperCase(), { x: 1140, y: 716, size: 21, fill: C.gold, family: F.sans, weight: 600, spacing: 3.4, anchor: 'middle' }),
    text(`signature ${sig.fingerprint} · ${sim.totalMoves} plies`, { x: 1140, y: 746, size: 17, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }),

    // Footer
    line({ x1: 90, y1: 800, x2: 1510, y2: 800, stroke: C.line, sw: 1 }),
    text(`${SITE} — CHESS VISUALIZATION & PREDICTION INTELLIGENCE`, { x: 90, y: 842, size: 18, fill: C.muted, family: F.sans, spacing: 2.2 }),
    text(`AUDITED ${AUDIT.date}`, { x: 1510, y: 842, size: 18, fill: C.gold, family: F.sans, spacing: 2.2, anchor: 'end' }),
  ].join('\n');

  return svgDoc({
    w: 1600, h: 900, body,
    title: 'En Pensent — any game becomes a color flow visualization',
    desc: `${game.title} rendered as an 8-quadrant color flow signature (${sig.fingerprint}).`,
  });
}

function chunkPgn(pgn, maxLines, perLine) {
  const tokens = pgn.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const t of tokens) {
    if (lines.length >= maxLines) break;
    if (!cur.length) cur = t;
    else if ((cur + ' ' + t).length <= perLine) cur += ' ' + t;
    else { lines.push(cur); cur = t; }
  }
  if (cur.length && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, ' …');
  return lines;
}

function statTrio(items, { x, y, gap, valueSize, labelSize }) {
  return items.flatMap((it, i) => [
    text(it.v, { x: x + i * gap, y, size: valueSize, fill: C.gold, family: F.sans, weight: 700 }),
    text(it.l, { x: x + i * gap, y: y + labelSize + 12, size: labelSize, fill: C.muted, family: F.sans, weight: 500, spacing: 1.8 }),
  ]);
}

// ── sponsor banner ────────────────────────────────────────────────────

export function bannerAsset() {
  const body = [
    rect({ x: 0, y: 0, w: 1600, h: 400, fill: 'url(#surface)' }),
    line({ x1: 0, y1: 4, x2: 1600, y2: 4, stroke: 'url(#gold)', sw: 3, opacity: 0.85 }),
    line({ x1: 0, y1: 396, x2: 1600, y2: 396, stroke: 'url(#gold)', sw: 3, opacity: 0.85 }),
    logoMark({ x: 120, y: 116, size: 168 }),
    text('EN PENSENT', { x: 360, y: 172, size: 68, fill: 'url(#gold)', family: F.display, weight: 700, spacing: 4 }),
    text('TURN ANY CHESS GAME INTO COLLECTIBLE ART', { x: 364, y: 226, size: 25, fill: C.cream, family: F.sans, weight: 500, spacing: 6.5, opacity: 0.85 }),
    `<g transform="translate(1090,200)" stroke="url(#gold)" stroke-width="6" stroke-linecap="round">
      <line x1="-22" y1="-22" x2="22" y2="22"/>
      <line x1="-22" y1="22" x2="22" y2="-22"/>
    </g>`,
    rect({ x: 1170, y: 120, w: 330, h: 160, r: 16, fill: C.panel, stroke: C.line, sw: 2, dash: '8 8' }),
    text('SPONSOR LOGO', { x: 1335, y: 194, size: 21, fill: C.muted, family: F.sans, weight: 500, spacing: 3, anchor: 'middle' }),
    text('CLEAR SPACE 24PX MIN', { x: 1335, y: 226, size: 15, fill: C.mutedDeep, family: F.sans, spacing: 1.6, anchor: 'middle' }),
    text(`${SITE} — EVERY GAME IS A WORK OF ART`, { x: 800, y: 356, size: 17, fill: C.muted, family: F.sans, spacing: 3.6, anchor: 'middle' }),
  ].join('\n');
  return svgDoc({ w: 1600, h: 400, body, title: 'En Pensent x Matcherino sponsor lockup' });
}

// ── square card: the measured edge ────────────────────────────────────

export function predictionCardAsset() {
  const pill = (x, v, l, accent) => [
    rect({ x, y: 640, w: 288, h: 150, r: 18, fill: C.panel, stroke: accent ? 'url(#gold)' : C.line, sw: accent ? 2 : 1 }),
    text(v, { x: x + 144, y: 712, size: 46, fill: accent ? C.gold : C.cream, family: F.sans, weight: 700, anchor: 'middle' }),
    text(l, { x: x + 144, y: 752, size: 17, fill: C.muted, family: F.sans, weight: 500, spacing: 1.8, anchor: 'middle' }),
  ];

  const body = [
    rect({ x: 0, y: 0, w: 1080, h: 1080, fill: 'url(#surface)' }),
    rect({ x: 24, y: 24, w: 1032, h: 1032, r: 28, fill: 'none', stroke: C.line, sw: 2 }),
    logoMark({ x: 456, y: 80, size: 168, glow: true }),
    text('EN PENSENT', { x: 540, y: 316, size: 38, fill: C.gold, family: F.display, weight: 600, spacing: 10, anchor: 'middle' }),
    text('The Engine That Sees', { x: 540, y: 408, size: 56, fill: C.cream, family: F.display, weight: 700, anchor: 'middle' }),
    text('Games As Color', { x: 540, y: 470, size: 56, fill: 'url(#gold)', family: F.display, weight: 700, anchor: 'middle' }),
    text('Pattern recognition, not brute-force search.', { x: 540, y: 534, size: 28, fill: C.muted, family: F.serif, style: 'italic', anchor: 'middle' }),
    text('Measured head-to-head against Stockfish on real games.', { x: 540, y: 574, size: 28, fill: C.muted, family: F.serif, style: 'italic', anchor: 'middle' }),
    ...pill(96, `${AUDIT.epAccuracy}%`, 'EN PENSENT', true),
    ...pill(396, `${AUDIT.sfAccuracy}%`, `STOCKFISH D${AUDIT.sfDepth}`, false),
    ...pill(696, `+${AUDIT.edgePp}pp`, 'MEASURED EDGE', true),
    text(`Full-database audit ${AUDIT.date} · ${AUDIT.rows.toLocaleString('en-US')} scored positions`, {
      x: 540, y: 856, size: 20, fill: C.creamDim, family: F.sans, anchor: 'middle',
    }),
    text('Outcome-prediction accuracy. Same games, same scoring, no synthetic data.', {
      x: 540, y: 890, size: 18, fill: C.mutedDeep, family: F.sans, anchor: 'middle',
    }),
    text(SITE, { x: 540, y: 1000, size: 21, fill: C.muted, family: F.sans, spacing: 5, anchor: 'middle' }),
  ].join('\n');

  return svgDoc({
    w: 1080, h: 1080, body,
    title: 'En Pensent measured prediction edge',
    desc: `En Pensent ${AUDIT.epAccuracy}% vs Stockfish depth ${AUDIT.sfDepth} ${AUDIT.sfAccuracy}% across ${AUDIT.rows} scored positions, audited ${AUDIT.date}.`,
  });
}

// ── square card: the universal visualization ──────────────────────────

export function signatureCardAsset({ game, sim, sig }) {
  const p = sig.enhancedProfile;
  const label = archetypeLabel(sig.archetype).toUpperCase();
  const pillW = Math.min(900, label.length * 14 + 100);

  const body = [
    rect({ x: 0, y: 0, w: 1080, h: 1080, fill: 'url(#surface)' }),
    rect({ x: 24, y: 24, w: 1032, h: 1032, r: 28, fill: 'none', stroke: C.line, sw: 2 }),
    text('UNIVERSAL VISUALIZATION', { x: 540, y: 112, size: 22, fill: C.gold, family: F.sans, weight: 600, spacing: 6, anchor: 'middle' }),
    text('The 8-Quadrant Signature', { x: 540, y: 180, size: 48, fill: C.cream, family: F.display, weight: 700, anchor: 'middle' }),
    text(`${game.title} · ${game.year}`, { x: 540, y: 218, size: 21, fill: C.muted, family: F.sans, spacing: 2.4, anchor: 'middle' }),

    quadrantBars({ x: 90, y: 296, w: 900, profile: p, rowH: 46 }),

    text('TEMPORAL FLOW', { x: 90, y: 690, size: 16, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    temporalRibbon({ x: 90, y: 708, w: 900, h: 44, flow: p.temporalFlow }),

    rect({ x: 540 - pillW / 2, y: 828, w: pillW, h: 52, r: 26, fill: C.panel, stroke: C.goldDeep, sw: 1.5 }),
    text(label, { x: 540, y: 862, size: 21, fill: C.gold, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }),

    text('Positive readings favour White, negative favour Black.', { x: 540, y: 928, size: 20, fill: C.muted, family: F.serif, style: 'italic', anchor: 'middle' }),
    text(`Computed live from the game record · signature ${sig.fingerprint}`, { x: 540, y: 960, size: 18, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }),
    text(SITE, { x: 540, y: 1010, size: 20, fill: C.muted, family: F.sans, spacing: 5, anchor: 'middle' }),
  ].join('\n');

  return svgDoc({
    w: 1080, h: 1080, body,
    title: `8-quadrant signature — ${game.title}`,
    desc: `Real engine output for ${game.title}: archetype ${archetypeLabel(sig.archetype)}, fingerprint ${sig.fingerprint}.`,
  });
}

// ── icon set ──────────────────────────────────────────────────────────

export function iconsAsset() {
  const tile = (i) => `translate(${32 + i * 256},32)`;
  const shell = rect({ x: 0, y: 0, w: 192, h: 192, r: 36, fill: C.obsidian, stroke: C.line, sw: 1 });
  const SW = 6;

  const body = [
    rect({ x: 0, y: 0, w: 1280, h: 256, fill: 'none' }),

    // 1 — game record becomes art
    `<g transform="${tile(0)}">${shell}
      ${text('1.e4', { x: 30, y: 84, size: 30, fill: C.muted, family: F.mono })}
      <path d="M 36 116 H 92 M 80 102 L 96 116 L 80 130" stroke="url(#gold)" stroke-width="${SW}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      ${rect({ x: 112, y: 94, w: 46, h: 46, fill: PIECE_COLORS.bishop })}
      ${rect({ x: 121, y: 103, w: 28, h: 28, fill: PIECE_COLORS.rook })}
      ${rect({ x: 130, y: 112, w: 10, h: 10, fill: C.gold })}
    </g>`,

    // 2 — eight quadrants
    `<g transform="${tile(1)}">${shell}
      ${rect({ x: 36, y: 36, w: 120, h: 120, fill: 'none', stroke: C.line, sw: 2 })}
      ${rect({ x: 36, y: 36, w: 60, h: 60, fill: PIECE_COLORS.bishop, opacity: 0.85 })}
      ${rect({ x: 96, y: 36, w: 60, h: 60, fill: PIECE_COLORS.queen, opacity: 0.7 })}
      ${rect({ x: 36, y: 96, w: 60, h: 60, fill: PIECE_COLORS.knight, opacity: 0.75 })}
      ${rect({ x: 96, y: 96, w: 60, h: 60, fill: PIECE_COLORS.rook, opacity: 0.8 })}
      ${line({ x1: 96, y1: 30, x2: 96, y2: 162, stroke: C.obsidian, sw: 4 })}
      ${line({ x1: 30, y1: 96, x2: 162, y2: 96, stroke: C.obsidian, sw: 4 })}
      ${rect({ x: 84, y: 84, w: 24, h: 24, fill: C.gold })}
    </g>`,

    // 3 — measured edge
    `<g transform="${tile(2)}">${shell}
      <polyline points="36,140 76,108 104,124 156,58" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 156 58 l -4 26 M 156 58 l -26 4" stroke="url(#gold)" stroke-width="8" stroke-linecap="round" fill="none"/>
      <polyline points="36,152 84,136 120,148 156,120" fill="none" stroke="${C.mutedDeep}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12"/>
    </g>`,

    // 4 — archetype poetry
    `<g transform="${tile(3)}">${shell}
      <path d="M 138 44 C 108 58 84 86 72 122 L 66 140 L 84 134 C 120 122 146 96 156 62 C 158 54 152 48 144 46 Z" fill="none" stroke="url(#gold)" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M 74 120 C 96 96 118 76 138 62" stroke="url(#gold)" stroke-width="3.5" fill="none"/>
      ${line({ x1: 44, y1: 152, x2: 112, y2: 152, stroke: C.muted, sw: 4, cap: 'round' })}
      ${line({ x1: 44, y1: 166, x2: 88, y2: 166, stroke: C.mutedDeep, sw: 4, cap: 'round' })}
    </g>`,

    // 5 — verified collectible
    `<g transform="${tile(4)}">${shell}
      ${rect({ x: 42, y: 30, w: 108, h: 132, r: 8, fill: C.panel, stroke: 'url(#gold)', sw: 4 })}
      ${rect({ x: 56, y: 44, w: 34, h: 34, fill: PIECE_COLORS.rook })}
      ${rect({ x: 63, y: 51, w: 20, h: 20, fill: PIECE_COLORS.bishop })}
      ${rect({ x: 69, y: 57, w: 8, h: 8, fill: C.gold })}
      ${rect({ x: 100, y: 44, w: 16, h: 16, fill: TEMPORAL_COLORS.early })}
      ${rect({ x: 122, y: 44, w: 16, h: 16, fill: TEMPORAL_COLORS.mid })}
      ${rect({ x: 100, y: 66, w: 16, h: 16, fill: PIECE_COLORS.queen })}
      <g fill="${C.cream}">
        ${rect({ x: 56, y: 106, w: 12, h: 12 })}${rect({ x: 72, y: 106, w: 12, h: 12 })}${rect({ x: 100, y: 106, w: 12, h: 12 })}
        ${rect({ x: 56, y: 122, w: 12, h: 12 })}${rect({ x: 86, y: 122, w: 12, h: 12 })}${rect({ x: 114, y: 122, w: 12, h: 12 })}
        ${rect({ x: 72, y: 138, w: 12, h: 12 })}${rect({ x: 100, y: 138, w: 12, h: 12 })}${rect({ x: 128, y: 138, w: 12, h: 12 })}
      </g>
    </g>`,
  ].join('\n');

  return svgDoc({ w: 1280, h: 256, body, title: 'En Pensent icon set' });
}

// ── brand specification sheet ─────────────────────────────────────────

export function brandSpecAsset() {
  const swatch = (x, y, hex, name, onLight = false) => [
    rect({ x, y, w: 110, h: 86, r: 8, fill: hex, stroke: C.line, sw: 1 }),
    text(hex.toUpperCase(), { x, y: y + 108, size: 15, fill: C.creamDim, family: F.mono }),
    text(name, { x, y: y + 128, size: 14, fill: C.mutedDeep, family: F.sans, spacing: 0.8 }),
  ];

  const brandRow = [
    [C.obsidian, 'OBSIDIAN'], [C.panel, 'PANEL'], [C.line, 'LINE'],
    [C.gold, 'GOLD'], [C.goldLight, 'GOLD LIGHT'], [C.goldDeep, 'GOLD DEEP'],
    [C.cream, 'CREAM'], [C.muted, 'MUTED'],
  ];
  const engineRow = [
    [PIECE_COLORS.bishop, 'BISHOP'], [PIECE_COLORS.knight, 'KNIGHT'],
    [PIECE_COLORS.rook, 'ROOK'], [PIECE_COLORS.queen, 'QUEEN'],
    [TEMPORAL_COLORS.early, 'OPENING'], [TEMPORAL_COLORS.mid, 'MIDDLEGAME'],
    [TEMPORAL_COLORS.late, 'ENDGAME'],
  ];

  const markSize = 140;
  const clear = markSize * 0.25;

  const body = [
    rect({ x: 0, y: 0, w: 1600, h: 1000, fill: 'url(#surface)' }),
    text('EN PENSENT', { x: 90, y: 88, size: 26, fill: C.gold, family: F.display, weight: 600, spacing: 8 }),
    text('Brand Specification', { x: 90, y: 148, size: 44, fill: C.cream, family: F.display, weight: 700 }),
    text('Asset kit reference — colors, clear space, minimum sizes, type.', { x: 90, y: 184, size: 20, fill: C.muted, family: F.serif, style: 'italic' }),
    line({ x1: 90, y1: 208, x2: 1510, y2: 208, stroke: C.line, sw: 1 }),

    text('BRAND PALETTE', { x: 90, y: 254, size: 16, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    ...brandRow.flatMap(([hex, name], i) => swatch(90 + i * 126, 276, hex, name)),

    text('ENGINE PALETTE — MIRRORS THE LIVE PRODUCT, DO NOT RESTYLE', { x: 90, y: 470, size: 16, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    ...engineRow.flatMap(([hex, name], i) => swatch(90 + i * 126, 492, hex, name)),

    line({ x1: 90, y1: 668, x2: 1510, y2: 668, stroke: C.line, sw: 1 }),

    text('CLEAR SPACE', { x: 90, y: 712, size: 16, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    rect({ x: 90 - clear, y: 736 - clear, w: markSize + clear * 2, h: markSize + clear * 2, r: 6, fill: 'none', stroke: C.goldDeep, sw: 1.5, dash: '7 7', opacity: 0.8 }),
    logoMark({ x: 90, y: 736, size: markSize }),
    text('Minimum clear space on all sides equals 25% of the mark width.', { x: 90, y: 936, size: 17, fill: C.mutedDeep, family: F.sans }),

    text('MINIMUM SIZES', { x: 560, y: 712, size: 16, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    logoMark({ x: 560, y: 736, size: 96 }),
    text('96PX', { x: 560, y: 856, size: 15, fill: C.mutedDeep, family: F.mono }),
    logoMark({ x: 684, y: 784, size: 48 }),
    text('48PX', { x: 684, y: 856, size: 15, fill: C.mutedDeep, family: F.mono }),
    logoMark({ x: 764, y: 800, size: 32 }),
    text('32PX', { x: 764, y: 856, size: 15, fill: C.mutedDeep, family: F.mono }),
    text('Do not apply glow below 96px — use the flat mark.', { x: 560, y: 936, size: 17, fill: C.mutedDeep, family: F.sans }),

    text('TYPOGRAPHY', { x: 1000, y: 712, size: 16, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    text('Cinzel — Display', { x: 1000, y: 758, size: 30, fill: C.cream, family: F.display, weight: 700 }),
    text('Cormorant Garamond — Editorial', { x: 1000, y: 800, size: 24, fill: C.creamDim, family: F.serif, style: 'italic' }),
    text('Inter — Interface & Labels', { x: 1000, y: 842, size: 22, fill: C.cream, family: F.sans, weight: 500 }),
    text('JetBrains Mono — Data', { x: 1000, y: 884, size: 20, fill: C.gold, family: F.mono }),
    text('Fallbacks: serif / Georgia / system-ui / Menlo.', { x: 1000, y: 936, size: 17, fill: C.mutedDeep, family: F.sans }),
  ].join('\n');

  return svgDoc({ w: 1600, h: 1000, body, title: 'En Pensent brand specification' });
}
