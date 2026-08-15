/**
 * Victory Card v2 — tournament-ready collectible.
 *
 * Improvements over v0:
 *   - true print spec: 2.5in x 3.5in trim at 600 DPI, 0.125in bleed, crop marks
 *   - front / back split, so nothing is crowded and the QR can be scannable
 *   - the universal 8-quadrant visualization is a first-class panel
 *   - the board is rendered from real engine visit data, not decoration
 *   - a real, scannable QR (spec quiet zone) instead of a decorative pattern
 *   - explicit edition numbering and engine fingerprint for provenance
 *
 * All geometry is expressed in *trim space* (0,0 - 1500,2100). Bleed is applied
 * by translating the whole content group, so a single layout serves both the
 * digital and print variants.
 */

import { C, F, PRINT, TIERS, QUADRANTS, AUDIT } from './tokens.mjs';
import { archetypeLabel } from './games.mjs';
import {
  text, rect, line, defs, esc, n,
  colorFlowBoard, quadrantBars, temporalRibbon, pieceDominance, pawnAdvancement, qrCode,
} from './parts.mjs';

const T = { x: 75, y: 75, w: 1350, h: 1950 }; // safe area in trim space
const CX = T.x + T.w / 2;                      // 750

const VERIFY_BASE = 'https://enpensent.com/verify/';

// ── chrome ────────────────────────────────────────────────────────────

function cardFrame() {
  const tw = PRINT.trimW;
  const th = PRINT.trimH;
  return [
    rect({ x: 0, y: 0, w: tw, h: th, fill: 'url(#surface)' }),
    rect({ x: 26, y: 26, w: tw - 52, h: th - 52, r: 34, fill: 'none', stroke: 'url(#gold)', sw: 7 }),
    rect({ x: 44, y: 44, w: tw - 88, h: th - 88, r: 24, fill: 'none', stroke: C.goldDeep, sw: 1.5, opacity: 0.55 }),
    cornerPips(),
  ].join('\n');
}

function cornerPips() {
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
        rect({ x: px, y: py, w: s, h: s, fill: 'none', stroke: 'url(#gold)', sw: 3 }),
        rect({ x: px + 9, y: py + 9, w: 10, h: 10, fill: 'url(#gold)' }),
      ].join('')
    )
    .join('\n');
}

/** Registration/crop marks drawn inside the bleed, stopping short of the trim. */
function cropMarks() {
  const b = PRINT.bleed;
  const W = PRINT.canvasW;
  const H = PRINT.canvasH;
  const reach = b - 20; // stop 20px before the trim edge
  const st = { stroke: '#6B7280', sw: 2 };
  const m = [];
  // top-left
  m.push(line({ x1: 0, y1: b, x2: reach, y2: b, ...st }), line({ x1: b, y1: 0, x2: b, y2: reach, ...st }));
  // top-right
  m.push(line({ x1: W, y1: b, x2: W - reach, y2: b, ...st }), line({ x1: W - b, y1: 0, x2: W - b, y2: reach, ...st }));
  // bottom-left
  m.push(line({ x1: 0, y1: H - b, x2: reach, y2: H - b, ...st }), line({ x1: b, y1: H, x2: b, y2: H - reach, ...st }));
  // bottom-right
  m.push(line({ x1: W, y1: H - b, x2: W - reach, y2: H - b, ...st }), line({ x1: W - b, y1: H, x2: W - b, y2: H - reach, ...st }));
  return m.join('\n');
}

function tierBadge({ x, y, w, h, tier }) {
  const t = TIERS[tier] || TIERS.champion;
  return [
    rect({ x, y, w, h, r: h / 2, fill: 'none', stroke: t.stroke, sw: 2.5 }),
    text(t.label, { x: x + w / 2, y: y + h * 0.66, size: 26, fill: t.fill, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }),
  ].join('\n');
}

function headerBlock({ title, event, year }) {
  return [
    text('EN PENSENT', { x: CX, y: 133, size: 30, fill: C.gold, family: F.display, weight: 600, spacing: 14, anchor: 'middle' }),
    text(title, { x: CX, y: 217, size: 62, fill: C.cream, family: F.display, weight: 700, anchor: 'middle' }),
    text(`${event.toUpperCase()} · ${year}`, { x: CX, y: 273, size: 26, fill: C.muted, family: F.sans, weight: 500, spacing: 5, anchor: 'middle' }),
    line({ x1: T.x, y1: 297, x2: T.x + T.w, y2: 297, stroke: 'url(#goldSoft)', sw: 1.5, opacity: 0.6 }),
    `<g transform="translate(${CX},297) rotate(45)">${rect({ x: -6, y: -6, w: 12, h: 12, fill: C.goldDeep })}</g>`,
  ].join('\n');
}

// ── front ─────────────────────────────────────────────────────────────

function frontContent({ game, sim, sig }) {
  const p = sig.enhancedProfile;
  const colL = { x: T.x, w: 640 };
  const colR = { x: 785, w: 640 };
  const out = [];

  out.push(cardFrame());
  out.push(headerBlock(game));

  // The Vision — real color flow board
  out.push(colorFlowBoard({ x: 310, y: 335, size: 880, board: sim.board, maxLayers: 8, coords: true, frame: true }));

  // ── signature band ──
  out.push(sectionRule('8-QUADRANT SIGNATURE', colL.x, 1320, colL.w));
  out.push(quadrantBars({ x: colL.x, y: 1353, w: colL.w, profile: p, rowH: 42, labelSize: 25, valueSize: 25, noteSize: 25 }));

  out.push(sectionRule('TEMPORAL FLOW', colR.x, 1320, colR.w));
  out.push(temporalRibbon({ x: colR.x, y: 1337, w: colR.w, h: 50, flow: p.temporalFlow, pctSize: 25, legendSize: 25 }));

  out.push(sectionRule('PIECE DOMINANCE', colR.x, 1450, colR.w));
  out.push(pieceDominance({ x: colR.x, y: 1480, w: colR.w, profile: p, rowH: 36, labelSize: 25, valueSize: 25 }));

  out.push(sectionRule('PAWN ADVANCEMENT', colR.x, 1640, colR.w));
  out.push(pawnAdvancement({ x: colR.x, y: 1655, w: colR.w, h: 20, value: p.pawn_advancement, labelSize: 25 }));

  // ── result ──
  out.push(text(game.winner.toUpperCase(), {
    x: CX, y: 1733, size: 42, fill: 'url(#gold)', family: F.display, weight: 700, spacing: 5, anchor: 'middle',
  }));
  out.push(text(`${game.white}  ${game.result.replace('-', '–')}  ${game.black}`, {
    x: CX, y: 1773, size: 26, fill: C.muted, family: F.sans, anchor: 'middle',
  }));

  // ── archetype pill ──
  const label = archetypeLabel(sig.archetype).toUpperCase();
  const pillW = Math.min(T.w, label.length * 17.4 + 110);
  out.push(rect({ x: CX - pillW / 2, y: 1797, w: pillW, h: 52, r: 26, fill: C.panel, stroke: C.goldDeep, sw: 1.5 }));
  out.push(text(label, { x: CX, y: 1831, size: 26, fill: C.gold, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }));

  // ── poem ──
  game.poem.slice(0, 2).forEach((l, i) => {
    out.push(text(l, { x: CX, y: 1883 + i * 36, size: 27, fill: C.creamDim, family: F.serif, style: 'italic', anchor: 'middle' }));
  });

  // ── footer ──
  out.push(line({ x1: T.x, y1: 1945, x2: T.x + T.w, y2: 1945, stroke: C.line, sw: 1 }));
  const ed = `${String(game.edition.number).padStart(3, '0')} / ${game.edition.of}`;
  out.push(rect({ x: T.x, y: 1957, w: 250, h: 56, r: 28, fill: 'none', stroke: 'url(#gold)', sw: 2 }));
  out.push(text(ed, { x: T.x + 125, y: 1993, size: 26, fill: C.gold, family: F.mono, weight: 500, anchor: 'middle' }));

  out.push(text('ENPENSENT.COM', { x: CX, y: 1980, size: 26, fill: C.muted, family: F.sans, spacing: 4, anchor: 'middle' }));
  out.push(text(sig.fingerprint, { x: CX, y: 2010, size: 25, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }));

  out.push(tierBadge({ x: T.x + T.w - 250, y: 1957, w: 250, h: 56, tier: game.tier }));

  return out.join('\n');
}

function sectionRule(label, x, y, w) {
  const size = 25;
  const textW = label.length * size * 0.82;
  const ruleX = x + textW + 14;
  return [
    text(label, { x, y, size, fill: C.muted, family: F.sans, weight: 600, spacing: 3.4 }),
    ruleX < x + w ? line({ x1: ruleX, y1: y - 5, x2: x + w, y2: y - 5, stroke: C.line, sw: 1 }) : '',
  ].join('\n');
}

// ── back ──────────────────────────────────────────────────────────────

function wrapMono(str, maxChars) {
  const words = str.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur.length) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

function backContent({ game, sim, sig }) {
  const p = sig.enhancedProfile;
  const out = [];
  out.push(cardFrame());

  out.push(text('EN PENSENT', { x: CX, y: 133, size: 30, fill: C.gold, family: F.display, weight: 600, spacing: 14, anchor: 'middle' }));
  out.push(text('Verification & Provenance', { x: CX, y: 205, size: 44, fill: C.cream, family: F.display, weight: 700, anchor: 'middle' }));
  out.push(line({ x1: T.x, y1: 238, x2: T.x + T.w, y2: 238, stroke: 'url(#goldSoft)', sw: 1.5, opacity: 0.6 }));

  // Real, scannable QR — 300px at 600 DPI = 12.7mm, comfortably above the
  // practical print minimum.
  const qrSize = 300;
  const url = VERIFY_BASE + game.id;
  const qr = qrCode({ x: CX - qrSize / 2, y: 278, size: qrSize, data: url, level: 'M', dark: C.cream });
  out.push(rect({ x: CX - qrSize / 2 - 18, y: 260, w: qrSize + 36, h: qrSize + 36, r: 12, fill: C.panel, stroke: C.line, sw: 1.5 }));
  out.push(qr.svg);
  out.push(text('SCAN TO VERIFY THIS CARD', { x: CX, y: 636, size: 26, fill: C.muted, family: F.sans, weight: 600, spacing: 4, anchor: 'middle' }));
  out.push(text(url, { x: CX, y: 666, size: 25, fill: C.mutedDeep, family: F.mono, anchor: 'middle' }));

  let cy = 726;

  // Engine identity
  out.push(sectionRule('ENGINE SIGNATURE', T.x, cy, T.w));
  cy += 34;
  out.push(text(sig.fingerprint, { x: T.x, y: cy, size: 28, fill: C.gold, family: F.mono, weight: 500 }));
  out.push(text(`${archetypeLabel(sig.archetype)}`, { x: T.x + T.w, y: cy, size: 26, fill: C.creamDim, family: F.sans, weight: 500, anchor: 'end' }));
  cy += 28;
  out.push(text(
    `complexity ${sig.complexity.toFixed(3)}  ·  color richness ${sig.colorRichness.toFixed(2)}  ·  ${sim.totalMoves} plies  ·  Stockfish depth ${AUDIT.sfDepth}`,
    { x: T.x, y: cy, size: 25, fill: C.mutedDeep, family: F.mono }
  ));
  cy += 56;

  // Game record
  out.push(sectionRule('GAME RECORD', T.x, cy, T.w));
  cy += 32;
  out.push(text(`${game.white} vs ${game.black} · ${game.event}, ${game.year} · ${game.result}`, {
    x: T.x, y: cy, size: 26, fill: C.creamDim, family: F.sans,
  }));
  cy += 36;
  const pgnSize = 25;
  const pgnLines = wrapMono(game.pgn, Math.floor(T.w / (pgnSize * 0.6)));
  pgnLines.forEach((l, i) => {
    out.push(text(l, { x: T.x, y: cy + i * (pgnSize + 6), size: pgnSize, fill: C.muted, family: F.mono }));
  });
  cy += pgnLines.length * (pgnSize + 6) + 34;

  // Quadrant legend — makes the front panel self-explanatory
  out.push(sectionRule('QUADRANT DEFINITIONS', T.x, cy, T.w));
  cy += 30;
  const rowH = 42;
  QUADRANTS.forEach((q, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const qx = T.x + col * (T.w / 2);
    const qy = cy + row * rowH;
    const v = p[q.key] ?? 0;
    out.push(text(`${q.short}`, { x: qx, y: qy, size: 25, fill: C.gold, family: F.mono, weight: 500 }));
    out.push(text(`${q.label}`, { x: qx + 56, y: qy, size: 25, fill: C.creamDim, family: F.sans, weight: 500 }));
    out.push(text(`${q.zone}`, { x: qx + 56, y: qy + 28, size: 25, fill: C.mutedDeep, family: F.sans }));
    out.push(text(`${v >= 0 ? '+' : ''}${v.toFixed(1)}`, { x: qx + T.w / 2 - 30, y: qy, size: 25, fill: v >= 0 ? '#7FB0F5' : '#F5908C', family: F.mono, anchor: 'end' }));
  });
  cy += 4 * rowH + 30;

  // Provenance
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
    out.push(text(l, { x: T.x, y: cy + i * 31, size: 25, fill: C.muted, family: F.sans }));
  });

  // Footer
  out.push(line({ x1: T.x, y1: 1945, x2: T.x + T.w, y2: 1945, stroke: C.line, sw: 1 }));
  const ed = `${String(game.edition.number).padStart(3, '0')} / ${game.edition.of}`;
  out.push(rect({ x: T.x, y: 1957, w: 250, h: 56, r: 28, fill: 'none', stroke: 'url(#gold)', sw: 2 }));
  out.push(text(ed, { x: T.x + 125, y: 1993, size: 26, fill: C.gold, family: F.mono, weight: 500, anchor: 'middle' }));
  out.push(text('LIMITED PRE-BETA RUN', { x: CX, y: 1993, size: 26, fill: C.muted, family: F.sans, spacing: 4, anchor: 'middle' }));
  out.push(tierBadge({ x: T.x + T.w - 250, y: 1957, w: 250, h: 56, tier: game.tier }));

  return out.join('\n');
}

// ── assembly ──────────────────────────────────────────────────────────

function assemble({ content, bleed, title, desc }) {
  const off = bleed ? PRINT.bleed : 0;
  const W = PRINT.trimW + off * 2;
  const H = PRINT.trimH + off * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <desc>${esc(desc)}</desc>
${defs({ glowStd: 5, softStd: 2.5 })}
  ${rect({ x: 0, y: 0, w: W, h: H, fill: C.obsidian })}
  <g transform="translate(${off},${off})">
${content}
  </g>
${bleed ? cropMarks() : ''}
</svg>
`;
}

export function renderCard({ game, sim, sig, side = 'front', bleed = false }) {
  const content = side === 'front' ? frontContent({ game, sim, sig }) : backContent({ game, sim, sig });
  const title = `En Pensent Victory Card — ${game.title} (${side})`;
  const desc =
    `${game.white} vs ${game.black}, ${game.event} ${game.year}, ${game.result}. ` +
    `Archetype ${archetypeLabel(sig.archetype)}, fingerprint ${sig.fingerprint}. ` +
    `Edition ${game.edition.number} of ${game.edition.of}.`;
  return assemble({ content, bleed, title, desc });
}

export const CARD_SPEC = {
  trim: `${PRINT.trimW}x${PRINT.trimH}`,
  canvas: `${PRINT.canvasW}x${PRINT.canvasH}`,
  dpi: PRINT.dpi,
  inches: '5 x 7',
  bleedIn: (PRINT.bleed / PRINT.dpi).toFixed(3),
};
