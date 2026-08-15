/**
 * Reusable SVG component builders.
 *
 * Every builder returns a plain SVG string and takes explicit geometry, so
 * layouts are auditable and collisions are impossible to introduce silently.
 */

import QRCode from 'qrcode';
import { C, F, PIECE_COLORS, TEMPORAL_COLORS, POLARITY, PAWN_GRADIENT, QUADRANTS } from './tokens.mjs';

// ── primitives ────────────────────────────────────────────────────────

export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Round to 3dp and drop trailing zeros — keeps emitted SVG tidy. */
export const n = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return Number.isFinite(r) ? String(r) : '0';
};

export function text(str, { x, y, size, fill, family = F.sans, weight, spacing, anchor, style, opacity }) {
  const a = [
    `x="${n(x)}"`,
    `y="${n(y)}"`,
    `font-family="${family}"`,
    `font-size="${n(size)}"`,
    `fill="${fill}"`,
  ];
  if (weight) a.push(`font-weight="${weight}"`);
  if (spacing) a.push(`letter-spacing="${n(spacing)}"`);
  if (anchor) a.push(`text-anchor="${anchor}"`);
  if (style) a.push(`font-style="${style}"`);
  if (opacity != null) a.push(`opacity="${n(opacity)}"`);
  return `<text ${a.join(' ')}>${esc(str)}</text>`;
}

export function rect({ x, y, w, h, r, fill = 'none', stroke, sw, opacity, dash }) {
  const a = [`x="${n(x)}"`, `y="${n(y)}"`, `width="${n(w)}"`, `height="${n(h)}"`];
  if (r) a.push(`rx="${n(r)}"`);
  a.push(`fill="${fill}"`);
  if (stroke) a.push(`stroke="${stroke}"`);
  if (sw) a.push(`stroke-width="${n(sw)}"`);
  if (dash) a.push(`stroke-dasharray="${dash}"`);
  if (opacity != null) a.push(`opacity="${n(opacity)}"`);
  return `<rect ${a.join(' ')}/>`;
}

export function line({ x1, y1, x2, y2, stroke, sw = 1, opacity, dash, cap }) {
  const a = [`x1="${n(x1)}"`, `y1="${n(y1)}"`, `x2="${n(x2)}"`, `y2="${n(y2)}"`, `stroke="${stroke}"`, `stroke-width="${n(sw)}"`];
  if (opacity != null) a.push(`opacity="${n(opacity)}"`);
  if (dash) a.push(`stroke-dasharray="${dash}"`);
  if (cap) a.push(`stroke-linecap="${cap}"`);
  return `<line ${a.join(' ')}/>`;
}

/** Small uppercase section label with a trailing hairline rule. */
export function sectionLabel(label, { x, y, w, size = 15, color = C.muted }) {
  const textW = label.length * (size * 0.78);
  const ruleX = x + textW + size * 0.9;
  return [
    text(label, { x, y, size, fill: color, family: F.sans, weight: 600, spacing: size * 0.22 }),
    ruleX < x + w ? line({ x1: ruleX, y1: y - size * 0.32, x2: x + w, y2: y - size * 0.32, stroke: C.line, sw: 1 }) : '',
  ].join('\n');
}

// ── shared defs ───────────────────────────────────────────────────────

export function defs({ glowStd = 6, softStd = 2.5 } = {}) {
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
      <feGaussianBlur stdDeviation="${n(glowStd)}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${n(softStd)}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

// ── logo mark ─────────────────────────────────────────────────────────

/**
 * The nested-squares mark. `glow` is off by default: the mark must stay crisp
 * at favicon scale, and blur is applied only for large hero placements.
 */
export function logoMark({ x = 0, y = 0, size = 168, glow = false, mono = null }) {
  const s = size / 168;
  const ring = (inset, sw, stroke) =>
    rect({ x: inset * s, y: inset * s, w: (168 - inset * 2) * s, h: (168 - inset * 2) * s, r: Math.max(2, 10 * s * (1 - inset / 84)), stroke, sw: sw * s });
  const layers = mono
    ? [ring(0, 10, mono), ring(26, 9, mono), ring(48, 8, mono), ring(68, 7, mono), rect({ x: 78 * s, y: 78 * s, w: 12 * s, h: 12 * s, r: 2 * s, fill: mono })]
    : [
        ring(0, 10, 'url(#gold)'),
        ring(26, 9, PIECE_COLORS.bishop),
        ring(48, 8, PIECE_COLORS.rook),
        ring(68, 7, '#06B6D4'),
        rect({ x: 78 * s, y: 78 * s, w: 12 * s, h: 12 * s, r: 2 * s, fill: C.gold }),
      ];
  return `<g transform="translate(${n(x)},${n(y)})"${glow ? ' filter="url(#glow)"' : ''}>
    ${layers.join('\n    ')}
  </g>`;
}

// ── the color flow board (real engine data) ───────────────────────────

/**
 * Renders the trademark "squares in squares" motif directly from engine output.
 *
 * Each visited square draws one nested rectangle per piece that passed through
 * it, outermost = earliest visit, using the engine's own `hexColor`. When a
 * square has more visits than `maxLayers`, visits are sampled evenly while
 * always keeping the first and last so the arc of the game is preserved.
 */
export function colorFlowBoard({ x, y, size, board, maxLayers = 8, coords = true, frame = true, coordSize = null }) {
  const cell = size / 8;
  const out = [];

  if (frame) {
    const fPad = cell * 0.16;
    out.push(rect({ x: x - fPad, y: y - fPad, w: size + fPad * 2, h: size + fPad * 2, r: cell * 0.12, fill: '#0F1218', stroke: 'url(#gold)', sw: Math.max(2, size * 0.005) }));
  }

  // Base checker
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const px = x + file * cell;
      const py = y + (7 - rank) * cell;
      const dark = (rank + file) % 2 === 0;
      out.push(rect({ x: px, y: py, w: cell, h: cell, fill: dark ? '#121620' : '#191D26' }));
    }
  }

  // Real color flow layers
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
        out.push(rect({
          x: px + off,
          y: py + off,
          w: side,
          h: side,
          fill: v.hexColor || C.muted,
          opacity: i === 0 ? 0.95 : 1,
        }));
      });
    }
  }

  if (coords) {
    const fs = coordSize ?? cell * 0.30;
    const files = 'abcdefgh';
    for (let i = 0; i < 8; i++) {
      out.push(text(files[i], {
        x: x + i * cell + cell / 2,
        y: y + size + fs * 1.55,
        size: fs, fill: C.mutedDeep, family: F.mono, anchor: 'middle',
      }));
      out.push(text(String(i + 1), {
        x: x - fs * 0.85,
        y: y + size - i * cell - cell / 2 + fs * 0.36,
        size: fs, fill: C.mutedDeep, family: F.mono, anchor: 'middle',
      }));
    }
  }

  return out.join('\n');
}

// ── 8-quadrant signature (diverging bars) ─────────────────────────────

/**
 * The universal visualization: eight diverging bars on a shared zero axis.
 * Positive (blue) = white-favoring pressure, negative (red) = black-favoring,
 * matching the live 8-quadrant dashboard.
 */
export function quadrantBars({
  x, y, w, profile, rowH = 30, showZone = false,
  labelSize = null, valueSize = null, noteSize = null, barFrac = 0.44,
}) {
  const values = QUADRANTS.map((q) => profile[q.key] ?? 0);
  const peak = Math.max(60, ...values.map((v) => Math.abs(v)));
  // Explicit gutters: value labels are drawn inside `valueGutter`, so a long
  // reading can never collide with the neighbouring column.
  const labelW = w * 0.40;
  const valueGutter = w * 0.11;
  const halfW = (w - labelW - valueGutter * 2) / 2;
  const axisX = x + labelW + valueGutter + halfW;
  const barH = rowH * barFrac;
  const lSize = labelSize ?? rowH * 0.36;
  const vSize = valueSize ?? rowH * 0.34;
  const nSize = noteSize ?? rowH * 0.3;
  const out = [];

  // Zero axis
  out.push(line({ x1: axisX, y1: y - rowH * 0.3, x2: axisX, y2: y + rowH * QUADRANTS.length - rowH * 0.5, stroke: C.line, sw: 1.5 }));

  QUADRANTS.forEach((q, i) => {
    const v = values[i];
    const cy = y + i * rowH;
    const len = (Math.abs(v) / peak) * halfW;
    const pos = v >= 0;
    const color = pos ? POLARITY.positive : POLARITY.negative;

    out.push(text(q.label, {
      x, y: cy + lSize * 0.36,
      size: lSize, fill: C.muted, family: F.sans, weight: 500, spacing: lSize * 0.08,
    }));

    if (len > 0.5) {
      out.push(rect({
        x: pos ? axisX : axisX - len,
        y: cy - barH / 2 + barH * 0.08,
        w: len, h: barH, r: 2, fill: color, opacity: 0.9,
      }));
    }

    out.push(text((v >= 0 ? '+' : '') + v.toFixed(1), {
      x: pos ? axisX + len + vSize * 0.5 : axisX - len - vSize * 0.5,
      y: cy + vSize * 0.36,
      size: vSize, fill: pos ? '#7FB0F5' : '#F5908C',
      family: F.mono, anchor: pos ? 'start' : 'end',
    }));

    if (showZone) {
      out.push(text(q.zone, { x, y: cy + lSize * 1.24, size: lSize * 0.8, fill: C.mutedDeep, family: F.sans }));
    }
  });

  // Axis scale note
  out.push(text(`± ${peak.toFixed(0)} piece-weighted units`, {
    x: axisX, y: y + rowH * QUADRANTS.length + nSize * 0.2,
    size: nSize, fill: C.mutedDeep, family: F.mono, anchor: 'middle',
  }));

  return out.join('\n');
}

// ── temporal flow ribbon ──────────────────────────────────────────────

export function temporalRibbon({ x, y, w, h, flow, pctSize = null, legendSize = null }) {
  const phases = [
    { key: 'early', label: 'OPENING', color: TEMPORAL_COLORS.early },
    { key: 'mid', label: 'MIDDLEGAME', color: TEMPORAL_COLORS.mid },
    { key: 'late', label: 'ENDGAME', color: TEMPORAL_COLORS.late },
  ];
  const total = phases.reduce((s, p) => s + (flow[p.key] || 0), 0) || 1;
  const out = [];
  let cx = x;

  phases.forEach((p, i) => {
    const frac = (flow[p.key] || 0) / total;
    const pw = frac * w;
    if (pw > 0.4) {
      out.push(rect({
        x: cx, y, w: pw, h, r: 0, fill: p.color, opacity: 0.88,
      }));
      const ps = pctSize ?? h * 0.46;
      if (pw > ps * 2.6) {
        out.push(text(`${Math.round(frac * 100)}%`, {
          x: cx + pw / 2, y: y + h / 2 + ps * 0.36,
          size: ps, fill: '#0B0D12', family: F.sans, weight: 700, anchor: 'middle',
        }));
      }
    }
    cx += pw;
  });

  // Rounded mask edges via overlay stroke
  out.push(rect({ x, y, w, h, r: h * 0.18, fill: 'none', stroke: C.lineSoft, sw: 1 }));

  // Legend
  const ls = legendSize ?? h * 0.36;
  const legY = y + h + ls * 1.5;
  let lx = x;
  phases.forEach((p) => {
    out.push(rect({ x: lx, y: legY - ls * 0.78, w: ls * 0.78, h: ls * 0.78, r: 1.5, fill: p.color }));
    out.push(text(p.label, { x: lx + ls * 1.2, y: legY, size: ls, fill: C.muted, family: F.sans, weight: 500, spacing: ls * 0.07 }));
    lx += ls * 1.2 + p.label.length * ls * 0.66 + ls * 1.2;
  });

  return out.join('\n');
}

// ── piece dominance bars ──────────────────────────────────────────────

export function pieceDominance({ x, y, w, profile, rowH = 26, labelSize = null, valueSize = null }) {
  const rows = [
    { label: 'BISHOP', v: profile.bishop_dominance, color: PIECE_COLORS.bishop },
    { label: 'KNIGHT', v: profile.knight_dominance, color: PIECE_COLORS.knight },
    { label: 'ROOK', v: profile.rook_dominance, color: PIECE_COLORS.rook },
    { label: 'QUEEN', v: profile.queen_dominance, color: PIECE_COLORS.queen },
  ];
  const lSize = labelSize ?? rowH * 0.4;
  const vSize = valueSize ?? rowH * 0.4;
  const labelW = w * 0.3;
  const valW = w * 0.14;
  const trackW = w - labelW - valW;
  const barH = rowH * 0.4;
  const peak = Math.max(0.25, ...rows.map((r) => r.v || 0));
  const out = [];

  rows.forEach((r, i) => {
    const cy = y + i * rowH;
    out.push(text(r.label, { x, y: cy + lSize * 0.36, size: lSize, fill: C.muted, family: F.sans, weight: 500, spacing: lSize * 0.08 }));
    out.push(rect({ x: x + labelW, y: cy - barH / 2 + barH * 0.1, w: trackW, h: barH, r: barH / 2, fill: C.panelLift }));
    const len = ((r.v || 0) / peak) * trackW;
    if (len > 0.5) {
      out.push(rect({ x: x + labelW, y: cy - barH / 2 + barH * 0.1, w: len, h: barH, r: barH / 2, fill: r.color, opacity: 0.92 }));
    }
    out.push(text(`${Math.round((r.v || 0) * 100)}%`, {
      x: x + w, y: cy + vSize * 0.36, size: vSize, fill: C.creamDim, family: F.mono, anchor: 'end',
    }));
  });

  return out.join('\n');
}

// ── pawn advancement ──────────────────────────────────────────────────

export function pawnAdvancement({ x, y, w, h, value, labelSize = null }) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  const mx = x + clamped * w;
  const ls = labelSize ?? h * 0.62;
  const baseY = y + h + ls * 1.5;
  return [
    rect({ x, y, w, h, r: h / 2, fill: 'url(#pawnGrad)', opacity: 0.55 }),
    rect({ x, y, w, h, r: h / 2, fill: 'none', stroke: C.lineSoft, sw: 1 }),
    `<circle cx="${n(mx)}" cy="${n(y + h / 2)}" r="${n(h * 0.62)}" fill="${C.cream}" stroke="${C.obsidian}" stroke-width="${n(h * 0.16)}"/>`,
    text('BACK RANK', { x, y: baseY, size: ls, fill: C.mutedDeep, family: F.sans }),
    text(`${Math.round(clamped * 100)}% ADVANCED`, { x: x + w / 2, y: baseY, size: ls * 1.06, fill: C.creamDim, family: F.sans, weight: 600, anchor: 'middle' }),
    text('PROMOTION', { x: x + w, y: baseY, size: ls, fill: C.mutedDeep, family: F.sans, anchor: 'end' }),
  ].join('\n');
}

// ── real QR code ──────────────────────────────────────────────────────

/**
 * Emits a spec-valid QR (4-module quiet zone, horizontal run merging).
 * Uses the real `qrcode` encoder — never a decorative stand-in.
 */
export function qrCode({ x, y, size, data, level = 'M', dark = C.cream, light = null }) {
  const qr = QRCode.create(data, { errorCorrectionLevel: level });
  const mods = qr.modules;
  const quiet = 4;
  const span = mods.size + quiet * 2;
  const m = size / span;
  const out = [];

  if (light) out.push(rect({ x, y, w: size, h: size, fill: light }));

  for (let r = 0; r < mods.size; r++) {
    let runStart = -1;
    for (let c = 0; c <= mods.size; c++) {
      const on = c < mods.size && mods.data[r * mods.size + c];
      if (on && runStart === -1) runStart = c;
      if (!on && runStart !== -1) {
        out.push(rect({
          x: x + (runStart + quiet) * m,
          y: y + (r + quiet) * m,
          w: (c - runStart) * m,
          h: m,
          fill: dark,
        }));
        runStart = -1;
      }
    }
  }

  return { svg: out.join('\n'), modules: mods.size, version: qr.version };
}

// ── document wrapper ──────────────────────────────────────────────────

export function svgDoc({ w, h, body, title, desc, background = null }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ''}>
${title ? `  <title>${esc(title)}</title>` : ''}
${desc ? `  <desc>${esc(desc)}</desc>` : ''}
${defs()}
${background ? `  ${rect({ x: 0, y: 0, w, h, fill: background })}` : ''}
${body}
</svg>
`;
}
