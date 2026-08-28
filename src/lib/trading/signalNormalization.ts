/**
 * Market signal normalization
 * ============================================================================
 *
 * WHY THIS EXISTS
 *   The `market_prediction_attempts` table has accumulated two different
 *   encodings for the same two concepts, and components disagreed on which one
 *   they expected. That produced silent, wrong renders rather than errors.
 *
 *   1. CONFIDENCE SCALE
 *      Confidence was historically written as an integer percentage (0-100)
 *      into a column typed for a decimal probability. It is now written as a
 *      0.0-1.0 decimal, and 35,709 legacy rows were migrated by dividing by
 *      100. Components that assumed 0-100 rendered `0.72` as "0.72%" and their
 *      `>= 70` / `>= 85` thresholds silently never matched.
 *
 *   2. DIRECTION ENCODING
 *      The live worker writes 'bullish' | 'bearish' | 'neutral'. The historical
 *      replay path wrote 'up' | 'down' | 'flat'. Components that only checked
 *      'bullish'/'bearish' silently rendered replay rows as FLAT/neutral.
 *
 *   Rather than patch each call site (which is how the drift happened), read
 *   every signal through these helpers.
 *
 * INVARIANT
 *   After normalization: confidence is always 0.0-1.0, direction is always
 *   'bullish' | 'bearish' | 'neutral'. Multiply by 100 only at render time.
 */

export type SignalDirection = 'bullish' | 'bearish' | 'neutral';

/**
 * Coerce a confidence value to the canonical 0.0-1.0 decimal scale.
 *
 * Any value greater than 1 is treated as a legacy 0-100 percentage. This is
 * safe because a probability can never legitimately exceed 1.0, so there is no
 * ambiguous overlap between the two encodings.
 */
export function normalizeConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const decimal = n > 1 ? n / 100 : n;
  // Clamp — corrupted rows have been observed above 1.0 even after migration.
  return Math.min(1, Math.max(0, decimal));
}

/**
 * Coerce a direction value to the canonical 'bullish' | 'bearish' | 'neutral'.
 * Accepts the legacy replay encoding ('up' | 'down' | 'flat') and is
 * case-insensitive.
 */
export function normalizeDirection(value: unknown): SignalDirection {
  const d = String(value ?? '').toLowerCase().trim();
  if (d === 'bullish' || d === 'up' || d === 'long' || d === 'buy') return 'bullish';
  if (d === 'bearish' || d === 'down' || d === 'short' || d === 'sell') return 'bearish';
  return 'neutral';
}

/** Render a normalized 0.0-1.0 confidence as an integer percentage string. */
export function formatConfidencePct(value: unknown, digits = 0): string {
  return `${(normalizeConfidence(value) * 100).toFixed(digits)}%`;
}

/**
 * True when a signal is old enough that presenting it as "live" is misleading.
 * The public view already limits to 48h; this drives the staleness badge.
 */
export function isSignalStale(createdAt: string | number | Date | null | undefined, maxAgeMs = 6 * 60 * 60 * 1000): boolean {
  if (!createdAt) return true;
  const ts = new Date(createdAt).getTime();
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts > maxAgeMs;
}

/** Normalize a raw DB signal row into canonical shape. */
export function normalizeSignalRow<T extends Record<string, unknown>>(row: T): T & {
  confidence: number;
  predicted_direction: SignalDirection;
} {
  return {
    ...row,
    confidence: normalizeConfidence(row.confidence),
    predicted_direction: normalizeDirection(row.predicted_direction),
  };
}
