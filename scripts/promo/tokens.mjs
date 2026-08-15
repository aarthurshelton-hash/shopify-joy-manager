/**
 * En Pensent — Brand & Asset Design Tokens
 *
 * Single source of truth for the promo kit and victory card generators.
 * Engine-derived palettes are copied verbatim from the live analysis code so
 * printed assets and the running product never drift apart:
 *   - piece dominance colors  → src/components/chess/EightQuadrantDashboard.tsx
 *   - temporal flow colors    → src/components/chess/EightQuadrantDashboard.tsx
 *   - quadrant polarity       → positive = white-favoring, negative = black-favoring
 */

// ── Core brand surface ────────────────────────────────────────────────
export const C = {
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

// ── Engine-derived palettes (do not restyle: these mirror the product) ──
export const PIECE_COLORS = {
  bishop: '#3B82F6',
  knight: '#F59E0B',
  rook: '#EF4444',
  queen: '#8B5CF6',
};

export const TEMPORAL_COLORS = {
  early: '#10B981',
  mid: '#F59E0B',
  late: '#EF4444',
};

/** Quadrant bar polarity — matches the dashboard's blue/red divergence. */
export const POLARITY = {
  positive: '#3B82F6', // white-favoring
  negative: '#EF4444', // black-favoring
};

export const PAWN_GRADIENT = ['#10B981', '#3B82F6', '#8B5CF6'];

/**
 * The eight quadrants, in engine order, with the exact spatial definitions
 * used by calculateEnhancedQuadrantProfile().
 */
export const QUADRANTS = [
  { key: 'q1_kingside_white', short: 'Q1', label: 'KINGSIDE · WHITE', zone: 'files e–h · ranks 1–4' },
  { key: 'q2_queenside_white', short: 'Q2', label: 'QUEENSIDE · WHITE', zone: 'files a–d · ranks 1–4' },
  { key: 'q3_kingside_black', short: 'Q3', label: 'KINGSIDE · BLACK', zone: 'files e–h · ranks 5–8' },
  { key: 'q4_queenside_black', short: 'Q4', label: 'QUEENSIDE · BLACK', zone: 'files a–d · ranks 5–8' },
  { key: 'q5_center_white', short: 'Q5', label: 'CENTER · WHITE', zone: 'files c–f · ranks 1–4' },
  { key: 'q6_center_black', short: 'Q6', label: 'CENTER · BLACK', zone: 'files c–f · ranks 5–8' },
  { key: 'q7_extended_kingside', short: 'Q7', label: 'EXT. KINGSIDE', zone: 'files g–h' },
  { key: 'q8_extended_queenside', short: 'Q8', label: 'EXT. QUEENSIDE', zone: 'files a–b' },
];

// ── Typography ────────────────────────────────────────────────────────
export const F = {
  display: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
  serif: "'Cormorant Garamond', Cormorant, Georgia, serif",
  sans: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
  mono: "'JetBrains Mono', Menlo, 'SF Mono', monospace",
};

export const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2' +
  '?family=Cinzel:wght@400;600;700' +
  '&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600' +
  '&family=Inter:wght@400;500;600;700' +
  '&family=JetBrains+Mono:wght@400;500' +
  '&display=swap';

// ── Verified metrics ──────────────────────────────────────────────────
/**
 * Every published number traces to the full-database audit.
 * Source: ~/Downloads/EnPensent_Full_Database_Audit.md
 * Never edit these by hand — re-run the audit and update together.
 */
export const AUDIT = {
  date: '2026-08-09',
  rows: 13062994,
  rowsLabel: '13.06M',
  epAccuracy: 69.59,
  sfAccuracy: 64.24,
  edgePp: 5.35,
  sfDepth: 14,
  // Strongest measured segments (all from the same audit).
  bestSegment: { label: 'Chess960 / Freestyle', epAcc: 52.73, sfAcc: 33.66, edgePp: 19.07 },
  quadrants: 8,
  archetypes: 24,
};

// ── Print specification (victory cards) ───────────────────────────────
/**
 * Oversized collectible art card: 5in × 7in trim at 300 DPI, 0.125in bleed,
 * 0.25in safe inset.
 *
 * The 5×7 format is deliberate. At a 2.5×3.5in trading-card trim the same
 * layout would push the data panels below ~3pt, which will not survive print.
 * At 5×7 every label clears the 6pt floor below.
 */
export const PRINT = {
  dpi: 300,
  trimW: 1500,
  trimH: 2100,
  bleed: 38,
  safeInset: 75,
  get canvasW() { return this.trimW + this.bleed * 2; },
  get canvasH() { return this.trimH + this.bleed * 2; },
  get trimX() { return this.bleed; },
  get trimY() { return this.bleed; },
  get safeX() { return this.bleed + this.safeInset; },
  get safeY() { return this.bleed + this.safeInset; },
  get safeW() { return this.trimW - this.safeInset * 2; },
  get safeH() { return this.trimH - this.safeInset * 2; },
};

/**
 * Smallest type permitted on a printed card. 6pt at 300 DPI = 25px.
 * `npm run` build asserts every card label against this.
 */
export const MIN_PT = 6;
export const MIN_PX = Math.ceil((MIN_PT / 72) * PRINT.dpi);
export const pxToPt = (px) => (px / PRINT.dpi) * 72;

/** Rarity tiers for the limited run. */
export const TIERS = {
  champion: { label: 'CHAMPION', stroke: C.gold, fill: C.gold },
  master: { label: 'MASTER', stroke: '#C0C6D4', fill: '#C0C6D4' },
  artisan: { label: 'ARTISAN', stroke: '#C77B3E', fill: '#C77B3E' },
};
