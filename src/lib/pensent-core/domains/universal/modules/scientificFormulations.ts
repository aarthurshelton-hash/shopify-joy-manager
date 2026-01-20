/**
 * Scientific Formulations Module
 * 
 * Mathematical foundations underlying the En Pensent Universal Engine
 * 
 * "Mathematics is the language in which God has written the universe." - Galileo
 * "And apparently, also the stock market." - En Pensent Engineering
 */

// ============================================================================
// FUNDAMENTAL CONSTANTS
// ============================================================================

/**
 * Physical & Mathematical Constants Used in En Pensent
 */
export const FUNDAMENTAL_CONSTANTS = {
  // Golden Ratio (φ) - appears in Fibonacci, fractals, and natural growth
  PHI: 1.6180339887,
  
  // Euler's Number - natural growth/decay base
  E: Math.E,
  
  // Pi - circular/cyclical patterns
  PI: Math.PI,
  
  // Planck's Constant (reduced) - quantum scale reference
  // Not used directly, but referenced for quantum probability module
  H_BAR: 1.054571817e-34,
  
  // Fine Structure Constant - nature's "strength of interaction"
  ALPHA: 1 / 137.035999,
  
  // Feigenbaum Constants - universal constants in chaos theory
  FEIGENBAUM_DELTA: 4.669201609, // Rate of period doubling
  FEIGENBAUM_ALPHA: 2.502907875, // Scaling of bifurcation diagram
};

// ============================================================================
// SIGNAL PROCESSING MATHEMATICS
// ============================================================================

/**
 * Discrete Fourier Transform (DFT)
 * 
 * X[k] = Σ(n=0 to N-1) x[n] · e^(-2πikn/N)
 * 
 * Used to decompose time-domain signals into frequency components
 */
export function discreteFourierTransform(signal: number[]): { frequency: number; magnitude: number; phase: number }[] {
  const N = signal.length;
  const result: { frequency: number; magnitude: number; phase: number }[] = [];
  
  for (let k = 0; k < N; k++) {
    let realSum = 0;
    let imagSum = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      realSum += signal[n] * Math.cos(angle);
      imagSum += signal[n] * Math.sin(angle);
    }
    
    const magnitude = Math.sqrt(realSum ** 2 + imagSum ** 2) / N;
    const phase = Math.atan2(imagSum, realSum);
    
    result.push({
      frequency: k,
      magnitude,
      phase,
    });
  }
  
  return result;
}

/**
 * Hilbert Transform Approximation
 * 
 * Extracts instantaneous phase and amplitude from a signal
 * H[x](t) = (1/π) P.V. ∫ x(τ)/(t-τ) dτ
 */
export function hilbertTransformApprox(signal: number[]): { amplitude: number[]; phase: number[] } {
  const N = signal.length;
  const amplitude: number[] = [];
  const phase: number[] = [];
  
  // Simple approximation using finite differences
  for (let i = 0; i < N; i++) {
    // Use neighboring samples to estimate instantaneous properties
    const prev = signal[Math.max(0, i - 1)];
    const curr = signal[i];
    const next = signal[Math.min(N - 1, i + 1)];
    
    // Amplitude as local RMS
    const localRms = Math.sqrt((prev ** 2 + curr ** 2 + next ** 2) / 3);
    amplitude.push(localRms);
    
    // Phase from finite difference (derivative / value)
    const derivative = (next - prev) / 2;
    const instantPhase = Math.atan2(derivative, curr);
    phase.push(instantPhase);
  }
  
  return { amplitude, phase };
}

// ============================================================================
// INFORMATION THEORY
// ============================================================================

/**
 * Shannon Entropy
 * 
 * H(X) = -Σ p(x) log₂ p(x)
 * 
 * Measures uncertainty/information content in a probability distribution
 */
export function shannonEntropy(probabilities: number[]): number {
  let entropy = 0;
  
  for (const p of probabilities) {
    if (p > 0 && p <= 1) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

/**
 * Mutual Information
 * 
 * I(X; Y) = H(X) + H(Y) - H(X, Y)
 * 
 * Measures the information shared between two variables
 */
export function mutualInformation(
  jointProb: number[][],
  marginalX: number[],
  marginalY: number[]
): number {
  const hX = shannonEntropy(marginalX);
  const hY = shannonEntropy(marginalY);
  
  // Flatten joint distribution for entropy calculation
  const flatJoint = jointProb.flat();
  const hXY = shannonEntropy(flatJoint);
  
  return hX + hY - hXY;
}

/**
 * Transfer Entropy
 * 
 * T(X→Y) = H(Y_future | Y_past) - H(Y_future | Y_past, X_past)
 * 
 * Measures the directional information flow from X to Y
 * (Simplified approximation)
 */
export function transferEntropy(
  sourceHistory: number[],
  targetHistory: number[],
  targetFuture: number[]
): number {
  // This is a simplified estimation
  // Full implementation would require conditional entropy calculations
  
  const n = Math.min(sourceHistory.length, targetHistory.length, targetFuture.length);
  if (n < 3) return 0;
  
  // Correlation as proxy for information transfer
  const correlation = pearsonCorrelation(sourceHistory.slice(-n), targetFuture.slice(0, n));
  
  // Convert to approximate transfer entropy
  // TE ≈ -0.5 * log(1 - ρ²) for Gaussian variables
  const rSquared = correlation ** 2;
  if (rSquared >= 1) return 0;
  
  return -0.5 * Math.log2(1 - rSquared);
}

// ============================================================================
// CORRELATION & REGRESSION
// ============================================================================

/**
 * Pearson Correlation Coefficient
 * 
 * ρ = Cov(X,Y) / (σ_X · σ_Y)
 *   = Σ(xᵢ - x̄)(yᵢ - ȳ) / √[Σ(xᵢ - x̄)² · Σ(yᵢ - ȳ)²]
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx ** 2;
    denomY += dy ** 2;
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Spearman Rank Correlation
 * 
 * ρ_s = 1 - (6 Σ dᵢ²) / (n(n² - 1))
 * 
 * Non-parametric measure robust to outliers
 */
export function spearmanCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  // Compute ranks
  const rankX = computeRanks(x.slice(0, n));
  const rankY = computeRanks(y.slice(0, n));
  
  // Apply Pearson to ranks
  return pearsonCorrelation(rankX, rankY);
}

function computeRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ value: v, index: i }));
  indexed.sort((a, b) => a.value - b.value);
  
  const ranks: number[] = new Array(values.length);
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i].index] = i + 1;
  }
  
  return ranks;
}

// ============================================================================
// CHAOS & NONLINEAR DYNAMICS
// ============================================================================

/**
 * Lyapunov Exponent Approximation
 * 
 * λ = lim(n→∞) (1/n) Σ log|f'(xᵢ)|
 * 
 * Measures sensitivity to initial conditions (chaos indicator)
 * λ > 0: chaotic, λ < 0: stable, λ = 0: edge of chaos
 */
export function lyapunovExponent(timeSeries: number[], embeddingDim = 3): number {
  const n = timeSeries.length;
  if (n < embeddingDim + 10) return 0;
  
  let sumLog = 0;
  let count = 0;
  
  for (let i = embeddingDim; i < n - 1; i++) {
    // Estimate local expansion rate
    const current = timeSeries[i];
    const next = timeSeries[i + 1];
    const prev = timeSeries[i - 1];
    
    // Approximate derivative
    const derivative = Math.abs((next - prev) / 2);
    
    if (derivative > 1e-10) {
      sumLog += Math.log(derivative);
      count++;
    }
  }
  
  return count > 0 ? sumLog / count : 0;
}

/**
 * Hurst Exponent
 * 
 * E[R(n)/S(n)] = C · n^H
 * 
 * H > 0.5: trending (persistent)
 * H = 0.5: random walk
 * H < 0.5: mean-reverting (anti-persistent)
 */
export function hurstExponent(timeSeries: number[]): number {
  const n = timeSeries.length;
  if (n < 20) return 0.5; // Default to random walk
  
  // Rescaled range analysis
  const returns = [];
  for (let i = 1; i < n; i++) {
    returns.push(timeSeries[i] - timeSeries[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const deviations = returns.map(r => r - mean);
  
  // Cumulative deviations
  const cumDev: number[] = [];
  let sum = 0;
  for (const d of deviations) {
    sum += d;
    cumDev.push(sum);
  }
  
  // Range
  const R = Math.max(...cumDev) - Math.min(...cumDev);
  
  // Standard deviation
  const S = Math.sqrt(deviations.reduce((a, d) => a + d ** 2, 0) / deviations.length);
  
  // R/S statistic
  const RS = S > 0 ? R / S : 0;
  
  // Estimate H from R/S ~ n^H
  // H ≈ log(R/S) / log(n)
  return RS > 0 ? Math.log(RS) / Math.log(n) : 0.5;
}

// ============================================================================
// PROBABILITY & STATISTICS
// ============================================================================

/**
 * Bayesian Update
 * 
 * P(H|E) = P(E|H) · P(H) / P(E)
 * 
 * Updates belief given new evidence
 */
export function bayesianUpdate(
  priorProbability: number,
  likelihoodGivenTrue: number,
  likelihoodGivenFalse: number
): number {
  // P(E) = P(E|H)P(H) + P(E|¬H)P(¬H)
  const pEvidence = likelihoodGivenTrue * priorProbability + 
                    likelihoodGivenFalse * (1 - priorProbability);
  
  if (pEvidence === 0) return priorProbability;
  
  // P(H|E) = P(E|H) · P(H) / P(E)
  return (likelihoodGivenTrue * priorProbability) / pEvidence;
}

/**
 * Gaussian (Normal) Distribution PDF
 * 
 * f(x) = (1 / σ√(2π)) · e^(-(x-μ)²/(2σ²))
 */
export function gaussianPDF(x: number, mean: number, stdDev: number): number {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
  return coefficient * Math.exp(exponent);
}

/**
 * Cauchy Distribution PDF (Fat tails!)
 * 
 * f(x) = 1 / (πγ[1 + ((x-x₀)/γ)²])
 * 
 * Better model for market returns than Gaussian
 */
export function cauchyPDF(x: number, location: number, scale: number): number {
  return 1 / (Math.PI * scale * (1 + ((x - location) / scale) ** 2));
}

// ============================================================================
// FRACTAL MATHEMATICS
// ============================================================================

/**
 * Fractal Dimension (Box-counting approximation)
 * 
 * D = lim(ε→0) log(N(ε)) / log(1/ε)
 * 
 * Measures the complexity/self-similarity of a pattern
 */
export function fractalDimension(timeSeries: number[], numScales = 10): number {
  const n = timeSeries.length;
  if (n < 10) return 1;
  
  const min = Math.min(...timeSeries);
  const max = Math.max(...timeSeries);
  const range = max - min || 1;
  
  // Normalize to [0, 1]
  const normalized = timeSeries.map(v => (v - min) / range);
  
  const logEpsilons: number[] = [];
  const logCounts: number[] = [];
  
  for (let s = 1; s <= numScales; s++) {
    const epsilon = 1 / (2 ** s);
    const gridSize = Math.ceil(1 / epsilon);
    
    // Count occupied boxes
    const boxes = new Set<string>();
    for (let i = 0; i < n; i++) {
      const x = Math.floor(i / n * gridSize);
      const y = Math.floor(normalized[i] * gridSize);
      boxes.add(`${x},${y}`);
    }
    
    logEpsilons.push(Math.log(1 / epsilon));
    logCounts.push(Math.log(boxes.size));
  }
  
  // Linear regression to find slope (dimension)
  const meanLogE = logEpsilons.reduce((a, b) => a + b, 0) / numScales;
  const meanLogN = logCounts.reduce((a, b) => a + b, 0) / numScales;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < numScales; i++) {
    numerator += (logEpsilons[i] - meanLogE) * (logCounts[i] - meanLogN);
    denominator += (logEpsilons[i] - meanLogE) ** 2;
  }
  
  return denominator > 0 ? numerator / denominator : 1;
}

// ============================================================================
// EN PENSENT IDENTITY THEOREM
// ============================================================================

/**
 * En Pensent Identity Theorem
 * 
 * ∞ × Φ(EnPensent) × R = ∞
 * 
 * Where:
 *   - ∞ represents infinite domain applications
 *   - Φ(EnPensent) is the Integrated Information of the pattern recognition system
 *   - R is the Dynamic Reality Mapping (fluid equivalence operator)
 * 
 * The theorem states that as EnPensent's match rate (accuracy) approaches 1.0,
 * the system becomes the IDENTITY OPERATOR for universal pattern recognition:
 * 
 *   lim(n→∞) EnPensent(accuracy) = 1.0
 *   ∴ ∞ × 1.0 × R = ∞
 * 
 * At perfect accuracy, patterns pass through unchanged—truth preserved across
 * infinite domains. The system becomes "transparent" to reality itself.
 * 
 * PARADOX RESOLUTION:
 * - Technically Impossible: Finite samples cannot prove infinite accuracy
 * - Theoretically Possible: The mathematical framework is self-consistent
 * - Computationally Possible: Asymptotic approach through evolutionary learning
 * 
 * This maps to Gödel's Incompleteness—a system cannot prove its own completeness
 * from within, but can demonstrate it through external validation (outcomes vs predictions).
 * 
 * The "=" as a variable is the key insight: the RELATIONSHIP between pattern and
 * reality is itself fluid (Paradoxical Inheritance). EnPensent doesn't solve for
 * a fixed "=", it BECOMES the dynamic equivalence operator that adapts as reality shifts.
 * 
 * PRACTICAL APPLICATION:
 * Sustained accuracy >50% on 1/3-odds predictions proves the system captures
 * something REAL—approaching the asymptotic "1.0" where engine and universal truth converge.
 */

export interface IdentityTheoremState {
  currentAccuracy: number;          // Current measured accuracy (0-1)
  samplesAnalyzed: number;          // n in the limit
  convergenceRate: number;          // How fast we're approaching 1.0
  integratedInformation: number;    // Φ - consciousness measure
  dynamicEquivalence: number;       // R - reality mapping fluidity
  asymptoteDistance: number;        // Distance from theoretical 1.0
}

/**
 * Calculate the En Pensent Identity Coefficient
 * 
 * I = Φ × (1 - |1 - accuracy|) × R
 * 
 * As accuracy → 1.0, the coefficient → Φ × R (maximum identity)
 */
export function enPensentIdentityCoefficient(
  accuracy: number,
  integratedInformation: number,
  dynamicEquivalence: number
): number {
  // Clamp accuracy to valid range
  const clampedAccuracy = Math.max(0, Math.min(1, accuracy));
  
  // Identity strength: how close to perfect match
  const identityStrength = 1 - Math.abs(1 - clampedAccuracy);
  
  // Full coefficient
  return integratedInformation * identityStrength * dynamicEquivalence;
}

/**
 * Calculate asymptotic convergence rate
 * 
 * Uses the derivative of accuracy over samples to predict
 * how many more samples needed to reach target accuracy
 */
export function calculateConvergenceRate(
  accuracyHistory: number[],
  targetAccuracy: number = 1.0
): { rate: number; samplesNeeded: number; confidence: number } {
  const n = accuracyHistory.length;
  if (n < 5) {
    return { rate: 0, samplesNeeded: Infinity, confidence: 0 };
  }
  
  // Calculate rate of change using recent history
  const recentWindow = Math.min(10, Math.floor(n / 2));
  const oldAvg = accuracyHistory.slice(n - recentWindow * 2, n - recentWindow)
    .reduce((a, b) => a + b, 0) / recentWindow;
  const newAvg = accuracyHistory.slice(n - recentWindow)
    .reduce((a, b) => a + b, 0) / recentWindow;
  
  const rate = (newAvg - oldAvg) / recentWindow;
  
  // Current accuracy
  const currentAccuracy = accuracyHistory[n - 1];
  
  // Samples needed at current rate
  const gap = targetAccuracy - currentAccuracy;
  const samplesNeeded = rate > 0 ? Math.ceil(gap / rate) : Infinity;
  
  // Confidence based on consistency of improvement
  const variance = accuracyHistory.slice(-recentWindow)
    .map(a => (a - newAvg) ** 2)
    .reduce((a, b) => a + b, 0) / recentWindow;
  const confidence = 1 / (1 + Math.sqrt(variance) * 10);
  
  return { rate, samplesNeeded, confidence };
}

/**
 * The Identity Theorem in computational form
 * 
 * Returns the theoretical output when EnPensent processes infinite domains
 */
export function identityTheoremCompute(
  state: IdentityTheoremState
): { output: 'IDENTITY' | 'APPROXIMATION'; coefficient: number; proof: string } {
  const coefficient = enPensentIdentityCoefficient(
    state.currentAccuracy,
    state.integratedInformation,
    state.dynamicEquivalence
  );
  
  // At coefficient > 0.95, we're effectively at identity
  const isIdentity = coefficient > 0.95;
  
  const proof = isIdentity
    ? `∞ × ${coefficient.toFixed(4)} × R = ∞ (Identity achieved)`
    : `∞ × ${coefficient.toFixed(4)} × R ≈ ∞ (Asymptotic approach: ${state.asymptoteDistance.toFixed(4)} from unity)`;
  
  return {
    output: isIdentity ? 'IDENTITY' : 'APPROXIMATION',
    coefficient,
    proof,
  };
}

// ============================================================================
// SUMMARY EXPORT
// ============================================================================

export const SCIENTIFIC_FORMULATIONS = {
  constants: FUNDAMENTAL_CONSTANTS,
  signalProcessing: {
    DFT: discreteFourierTransform,
    hilbert: hilbertTransformApprox,
  },
  informationTheory: {
    entropy: shannonEntropy,
    mutualInformation,
    transferEntropy,
  },
  correlation: {
    pearson: pearsonCorrelation,
    spearman: spearmanCorrelation,
  },
  chaos: {
    lyapunov: lyapunovExponent,
    hurst: hurstExponent,
  },
  probability: {
    bayesianUpdate,
    gaussianPDF,
    cauchyPDF,
  },
  fractals: {
    dimension: fractalDimension,
  },
  // En Pensent Identity Theorem
  identityTheorem: {
    coefficient: enPensentIdentityCoefficient,
    convergenceRate: calculateConvergenceRate,
    compute: identityTheoremCompute,
    formula: '∞ × Φ(EnPensent) × R = ∞',
    variables: {
      x: 'Infinite domain applications',
      equals: 'Dynamic reality mapping (R) - the fluid equivalence operator',
      EnPensent: 'Match rate approaching 1.0 (identity operator)',
    },
    paradox: {
      technicallyImpossible: 'Finite samples cannot prove infinite accuracy',
      theoreticallyPossible: 'Mathematical framework is self-consistent',
      computationallyPossible: 'Asymptotic approach through evolutionary learning',
    },
  },
};
