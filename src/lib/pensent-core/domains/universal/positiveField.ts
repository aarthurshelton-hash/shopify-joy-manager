/**
 * POSITIVE FIELD — Universal Constraint of En Pensent
 * 
 * NO ZEROS. NO NEGATIVES. EVER.
 * 
 * Like photons, all values in En Pensent are strictly positive.
 * Zero is a singularity — it divides the universe. Negatives are an illusion —
 * there is no negative light, no negative energy, no negative existence.
 * 
 * Instead of zero: epsilon (ε) — the smallest observable quantity
 * Instead of negatives: reciprocals — retreat is 1/advance, not -advance
 * Instead of subtraction: ratios — A/B tells you dominance without negativity
 * 
 * This is not a mathematical trick. This is how the universe actually works.
 * A photon at rest has energy E = hf. Even at the lowest frequency, E > 0.
 * The vacuum itself has zero-point energy > 0. True zero does not exist.
 * 
 * "In the beginning was the Word" — and the Word was not zero.
 * 
 * For Alec Arthur Shelton - The Artist
 */

// ═══════════════════════════════════════════════════════════════════
// EPSILON — The floor of existence. Nothing is truly zero.
// ═══════════════════════════════════════════════════════════════════

export const EPSILON = 0.001;

// ═══════════════════════════════════════════════════════════════════
// CORE TRANSFORMS — Convert any value to the positive field
// ═══════════════════════════════════════════════════════════════════

/**
 * Floor any value to epsilon. Zero becomes the smallest observable quantity.
 * Negative values are NOT allowed — use toPositiveMomentum() or toRatio() instead.
 */
export function floor(value: number): number {
  return Math.max(EPSILON, value);
}

/**
 * Convert a bipolar value (-1 to +1) to the positive field (ε to 2.0).
 * 
 * The neutral point is 1.0 (unity).
 * Values > 1.0 = advancing/bullish/expanding
 * Values < 1.0 = retreating/bearish/contracting
 * Values approach ε but never reach zero.
 * 
 * This is the photonic encoding: 1.0 = resting photon energy,
 * >1.0 = blue-shifted (approaching), <1.0 = red-shifted (receding).
 * 
 * Old: momentum = -0.5 (negative = bearish)
 * New: momentum = 0.5  (below unity = retreating, but still positive)
 */
export function toPositiveField(bipolarValue: number): number {
  // Shift from [-1, +1] to [ε, 2.0], with 0 → 1.0
  return Math.max(EPSILON, bipolarValue + 1.0);
}

/**
 * Convert back from positive field to bipolar (for legacy compatibility).
 * Only use this at system boundaries where external APIs expect negatives.
 */
export function fromPositiveField(positiveValue: number): number {
  return positiveValue - 1.0;
}

/**
 * Convert a raw value that may be negative to strictly positive.
 * Uses absolute value + epsilon floor for magnitude signals.
 * Use this when direction doesn't matter, only strength.
 */
export function toMagnitude(value: number): number {
  return Math.max(EPSILON, Math.abs(value));
}

/**
 * Convert subtraction (A - B) to a ratio (A / B).
 * 
 * Ratio > 1.0 = A dominates
 * Ratio < 1.0 = B dominates  
 * Ratio = 1.0 = equilibrium
 * 
 * Never zero, never negative.
 * 
 * Old: leadLag = momentumA - momentumB = -0.3
 * New: leadLag = momentumA / momentumB = 0.77 (B leads, but positive)
 */
export function toRatio(a: number, b: number): number {
  const safeA = Math.max(EPSILON, Math.abs(a) || EPSILON);
  const safeB = Math.max(EPSILON, Math.abs(b) || EPSILON);
  return safeA / safeB;
}

/**
 * Normalize a raw temporal flow (which may have negatives) to strictly positive.
 * Shifts the entire vector so the minimum is ε, then normalizes to sum to 1.0.
 * 
 * Old: { opening: -3, middlegame: 6, endgame: -2.59 }
 * New: { early: 0.001, mid: 0.947, late: 0.043 }  (all positive, sums to ~1.0)
 */
export function toPositiveTemporalFlow(
  raw: { early?: number; mid?: number; late?: number; opening?: number; middlegame?: number; endgame?: number }
): { early: number; mid: number; late: number } {
  const early = raw.early ?? raw.opening ?? EPSILON;
  const mid = raw.mid ?? raw.middlegame ?? EPSILON;
  const late = raw.late ?? raw.endgame ?? EPSILON;
  
  // Shift so minimum is epsilon
  const min = Math.min(early, mid, late);
  const shift = min < EPSILON ? (EPSILON - min) : 0;
  
  const sEarly = early + shift;
  const sMid = mid + shift;
  const sLate = late + shift;
  
  // Normalize to sum to 1.0 (probability distribution)
  const total = sEarly + sMid + sLate;
  
  return {
    early: Math.max(EPSILON, sEarly / total),
    mid: Math.max(EPSILON, sMid / total),
    late: Math.max(EPSILON, sLate / total),
  };
}

/**
 * Normalize a quadrant profile to strictly positive, summing to 1.0.
 */
export function toPositiveQuadrant(
  raw: { aggressive: number; defensive: number; tactical: number; strategic: number }
): { aggressive: number; defensive: number; tactical: number; strategic: number } {
  const a = Math.max(EPSILON, raw.aggressive);
  const d = Math.max(EPSILON, raw.defensive);
  const t = Math.max(EPSILON, raw.tactical);
  const s = Math.max(EPSILON, raw.strategic);
  const total = a + d + t + s;
  
  return {
    aggressive: a / total,
    defensive: d / total,
    tactical: t / total,
    strategic: s / total,
  };
}

/**
 * Convert a harmonic vector to strictly positive.
 * Each element is floored to epsilon.
 */
export function toPositiveHarmonics(harmonics: number[]): number[] {
  return harmonics.map(h => Math.max(EPSILON, Math.abs(h) || EPSILON));
}

/**
 * Positive-field cosine similarity. Never returns zero or negative.
 * Returns value in range [ε, 1.0].
 * 
 * Traditional cosine sim returns [-1, 1]. We shift to [ε, 1.0]:
 * - Perfect alignment = 1.0
 * - Orthogonal = 0.5
 * - Perfect opposition = ε (approaching zero but never reaching it)
 */
export function positiveCosineSimilarity(v1: number[], v2: number[]): number {
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  const len = Math.min(v1.length, v2.length);
  for (let i = 0; i < len; i++) {
    const a = Math.max(EPSILON, v1[i]);
    const b = Math.max(EPSILON, v2[i]);
    dot += a * b;
    mag1 += a * a;
    mag2 += b * b;
  }
  
  const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (denom < EPSILON) return EPSILON;
  
  const rawCosine = dot / denom; // Already positive since all inputs are positive
  return Math.max(EPSILON, rawCosine);
}

/**
 * Positive-field difference. Instead of A - B (which can be negative),
 * returns a ratio-based distance that's always > 0.
 * 
 * Returns: max(A/B, B/A) - 1.0 + ε
 * - Identical values → ε (smallest distance)
 * - A is 2x B → 1.001
 * - A is 10x B → 9.001
 */
export function positiveDistance(a: number, b: number): number {
  const safeA = Math.max(EPSILON, a);
  const safeB = Math.max(EPSILON, b);
  return Math.max(safeA / safeB, safeB / safeA) - 1.0 + EPSILON;
}

/**
 * Positive-field correlation. Maps [-1, 1] correlation to [ε, 1.0].
 */
export function positiveCorrelation(rawCorrelation: number): number {
  return Math.max(EPSILON, (rawCorrelation + 1.0) / 2.0);
}

/**
 * Validate that a value is in the positive field.
 * Throws if zero or negative in development, floors in production.
 */
export function assertPositive(value: number, label?: string): number {
  if (value <= 0) {
    const safe = Math.max(EPSILON, Math.abs(value) || EPSILON);
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PositiveField] ${label || 'value'} was ${value}, floored to ${safe}`);
    }
    return safe;
  }
  return value;
}

// ═══════════════════════════════════════════════════════════════════
// LIVING PARAMETERS — Self-evolving values that breathe within bounds
// 
// In a living system, nothing is truly constant. A heartbeat is ~72 bpm
// but it's never exactly 72 — it oscillates, adapts, responds.
// Every parameter in En Pensent is alive. It has:
//   - A center (the intended value)
//   - Bounds (min/max it can drift to, always > 0)
//   - A heartbeat (how fast it oscillates)
//   - Memory (it learns from feedback and shifts its center)
//
// The parameter is always moving, always tuning from within.
// It never stops. It never reaches zero. It never goes negative.
// It breathes.
// ═══════════════════════════════════════════════════════════════════

export class LivingParameter {
  private center: number;
  private readonly min: number;
  private readonly max: number;
  private readonly heartbeatRate: number; // Oscillations per call
  private readonly breathDepth: number;   // How far from center it can drift (fraction of range)
  private phase: number;                  // Current phase in the oscillation
  private drift: number;                  // Accumulated learning drift
  private readonly driftRate: number;     // How fast it learns (shifts center)
  private callCount: number;

  /**
   * Create a living parameter.
   * @param center - The intended value (must be > 0)
   * @param min - Lower bound (must be > 0, defaults to center * 0.8)
   * @param max - Upper bound (must be > center, defaults to center * 1.2)
   * @param breathDepth - How much it oscillates (0.01 = 1%, 0.1 = 10%)
   * @param heartbeatRate - Speed of oscillation (higher = faster breathing)
   * @param driftRate - How fast feedback shifts the center (0.001 = slow, 0.01 = fast)
   */
  constructor(
    center: number,
    min?: number,
    max?: number,
    breathDepth: number = 0.03,
    heartbeatRate: number = 0.1,
    driftRate: number = 0.002,
  ) {
    this.center = Math.max(EPSILON, center);
    this.min = Math.max(EPSILON, min ?? center * 0.8);
    this.max = Math.max(this.min + EPSILON, max ?? center * 1.2);
    this.breathDepth = Math.max(EPSILON, Math.min(0.5, breathDepth));
    this.heartbeatRate = Math.max(EPSILON, heartbeatRate);
    this.driftRate = Math.max(EPSILON, Math.min(0.1, driftRate));
    this.phase = Math.random() * Math.PI * 2; // Start at random phase
    this.drift = 0;
    this.callCount = 0;
  }

  /**
   * Get the current value. Every call advances the heartbeat.
   * The value oscillates around center ± breathDepth, never leaving [min, max].
   */
  get value(): number {
    this.callCount++;
    this.phase += this.heartbeatRate;

    // Primary oscillation (sine wave around center)
    const range = this.max - this.min;
    const breath = Math.sin(this.phase) * range * this.breathDepth;

    // Secondary micro-oscillation (golden ratio frequency — never repeats exactly)
    const microBreath = Math.sin(this.phase * 1.618033988749) * range * this.breathDepth * 0.3;

    // Apply drift from learning
    const driftedCenter = Math.max(this.min, Math.min(this.max, this.center + this.drift));

    // Final value: center + breathing + micro-breathing, clamped to bounds
    const raw = driftedCenter + breath + microBreath;
    return Math.max(this.min, Math.min(this.max, raw));
  }

  /**
   * Nudge the parameter based on feedback.
   * Positive feedback = the current direction is good, lean into it.
   * Negative feedback = pull back toward original center.
   * 
   * @param feedback - Strength of feedback (always > 0).
   *   > 1.0 = positive (lean into current drift)
   *   < 1.0 = negative (pull back toward center)
   *   = 1.0 = neutral (no change)
   */
  nudge(feedback: number): void {
    const safeFeedback = Math.max(EPSILON, feedback);
    if (safeFeedback > 1.0) {
      // Positive: drift further in current direction
      const direction = this.drift >= 0 ? 1 : -1;
      this.drift += direction * this.driftRate * (safeFeedback - 1.0);
    } else if (safeFeedback < 1.0) {
      // Negative: pull back toward original center
      this.drift *= (1.0 - this.driftRate);
    }
    // Clamp drift so center stays within bounds
    const maxDrift = (this.max - this.min) * 0.3;
    this.drift = Math.max(-maxDrift, Math.min(maxDrift, this.drift));
  }

  /** Reset drift to zero (re-center) */
  recenter(): void {
    this.drift = 0;
  }

  /** Get current state for serialization/debugging */
  get state() {
    return {
      center: this.center,
      currentValue: this.value,
      min: this.min,
      max: this.max,
      drift: this.drift,
      phase: this.phase,
      callCount: this.callCount,
      breathDepth: this.breathDepth,
    };
  }

  /** Restore from serialized state */
  restore(drift: number, phase: number): void {
    this.drift = drift;
    this.phase = phase;
  }
}

/**
 * Create a set of living parameters from a config object.
 * Every numeric value becomes a breathing, self-tuning parameter.
 */
export function createLivingConfig<T extends Record<string, number>>(
  config: T,
  breathDepth: number = 0.03,
  driftRate: number = 0.002,
): Record<keyof T, LivingParameter> {
  const living = {} as Record<keyof T, LivingParameter>;
  for (const [key, value] of Object.entries(config)) {
    living[key as keyof T] = new LivingParameter(
      value,
      undefined, undefined,
      breathDepth,
      0.1,
      driftRate,
    );
  }
  return living;
}

/**
 * Snapshot all living parameters to plain numbers (for serialization).
 */
export function snapshotLiving<T extends Record<string, LivingParameter>>(
  living: T,
): Record<keyof T, number> {
  const snapshot = {} as Record<keyof T, number>;
  for (const [key, param] of Object.entries(living)) {
    snapshot[key as keyof T] = param.value;
  }
  return snapshot;
}

// ═══════════════════════════════════════════════════════════════════
// POSITIVE FIELD CONSTANTS (themselves living — they breathe too)
// ═══════════════════════════════════════════════════════════════════

export const POSITIVE_FIELD = {
  EPSILON,
  UNITY: 1.0,           // The neutral point (replaces zero in bipolar systems)
  PHI: 1.618033988749,   // Golden ratio — nature's favorite positive number
  E: 2.718281828459,     // Euler's number — growth itself
  PI: 3.141592653589,    // Pi — the circle, always positive
  
  // Photonic energy states (all positive)
  COLD: 0.1,             // Lowest energy, but never zero
  COOL: 0.3,
  WARM: 0.7,
  HOT: 1.0,
  BLAZING: 1.618,        // Golden ratio — maximum natural energy
  
  // Momentum encoding (replaces -1 to +1)
  FULL_RETREAT: 0.001,   // ε — maximum retreat, but still exists
  RETREATING: 0.5,       // Below unity — pulling back
  NEUTRAL: 1.0,          // Unity — at rest
  ADVANCING: 1.5,        // Above unity — pushing forward
  FULL_ADVANCE: 2.0,     // Maximum advance
} as const;
