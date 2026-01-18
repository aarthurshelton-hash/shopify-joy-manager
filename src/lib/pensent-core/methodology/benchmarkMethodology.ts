/**
 * Benchmark Methodology Documentation
 * 
 * Complete documentation of the fairness, methodology, and scientific
 * rigor used in En Pensent vs Stockfish 17 benchmarks.
 * 
 * This file provides human-readable explanations for UI display
 * and ensures transparency in our testing approach.
 */

export interface MethodologySection {
  title: string;
  description: string;
  keyPoints: string[];
  technicalDetails?: string;
}

export interface FairnessGuarantee {
  id: string;
  name: string;
  description: string;
  implementation: string;
  verification: string;
}

export const METHODOLOGY_VERSION = '2.0.0';
export const LAST_UPDATED = '2026-01-18';

/**
 * Core methodology sections
 */
export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    title: 'Opponent: TCEC Stockfish 17 Unlimited',
    description: 'We benchmark against the strongest chess engine configuration available.',
    keyPoints: [
      'TCEC (Top Chess Engine Championship) Stockfish 17 NNUE',
      'Estimated ELO: 3600 (world\'s strongest)',
      'Unlimited depth via Lichess Cloud API',
      'No handicaps or artificial limitations',
    ],
    technicalDetails: 'Lichess Cloud stores positions analyzed at depths up to 100+ plies. We query positions that have been deeply analyzed by SF17 in tournament conditions.',
  },
  {
    title: 'Data Source: Live Lichess GM Games',
    description: 'Fresh games from real grandmaster matches, never pre-cached.',
    keyPoints: [
      'Games from Magnus Carlsen (DrNykterstein), Hikaru Nakamura, Alireza Firouzja',
      'Random time window within last 2 years per benchmark run',
      'Only rated, decisive games (no draws for clarity)',
      'Player shuffling and game shuffling for true randomization',
    ],
    technicalDetails: 'Each benchmark fetches from a randomized time window to prevent game memorization. Games are shuffled, then players are shuffled, ensuring no two runs see the same game sequence.',
  },
  {
    title: 'Prediction Point: Randomized Move Number',
    description: 'We predict at random positions to prevent overfitting.',
    keyPoints: [
      'Move range: 15-35 (guaranteed meaningful game context)',
      'NEVER past 50% of game length (no information leak about game duration)',
      'Both SF17 and En Pensent see the SAME position',
      'Neither system sees moves beyond prediction point',
    ],
    technicalDetails: 'Randomization per game prevents positional memorization. The 15-35 range ensures we\'re past opening theory but before endgame simplification.',
  },
  {
    title: 'Outcome Categories',
    description: 'Clear, unambiguous win/loss/draw predictions.',
    keyPoints: [
      'WHITE_WINS: White player won the game',
      'BLACK_WINS: Black player won the game',
      'DRAW: Game ended in a draw (excluded for clarity)',
      'Predictions compared to final game result',
    ],
    technicalDetails: 'We exclude draws from most benchmarks because draw prediction is inherently noisy and both systems struggle equally with it.',
  },
  {
    title: 'Fair Comparison Protocol',
    description: 'Both systems receive identical information.',
    keyPoints: [
      'Same FEN position',
      'Same move history (truncated PGN)',
      'Same time of analysis',
      'Independent predictions (no cross-contamination)',
    ],
    technicalDetails: 'SF17 evaluation is fetched from Lichess Cloud, then En Pensent generates its prediction using only the truncated PGN. Neither sees the other\'s output.',
  }
];

/**
 * Fairness guarantees with verification methods
 */
export const FAIRNESS_GUARANTEES: FairnessGuarantee[] = [
  {
    id: 'no-memorization',
    name: 'No Game Memorization',
    description: 'Games are fetched fresh each run from random time periods.',
    implementation: 'Random timestamp offset + player shuffling + game shuffling',
    verification: 'Run 5+ benchmarks and verify game IDs are different each time.',
  },
  {
    id: 'no-future-info',
    name: 'No Future Information',
    description: 'Neither system can see moves after the prediction point.',
    implementation: 'PGN is truncated at prediction point. Only truncated history is analyzed.',
    verification: 'Log the FEN and move count - verify prediction move < actual move count.',
  },
  {
    id: 'same-position',
    name: 'Identical Position Analysis',
    description: 'Both systems analyze the exact same board state.',
    implementation: 'FEN is generated once and shared to both evaluation functions.',
    verification: 'Hash the FEN used for SF17 vs En Pensent - they must match.',
  },
  {
    id: 'no-draw-bias',
    name: 'Draw Exclusion',
    description: 'Drawn games are excluded to avoid muddying win/loss predictions.',
    implementation: 'Only games with lichessGame.winner are included.',
    verification: 'Verify all test games have a definitive winner.',
  },
  {
    id: 'depth-parity',
    name: 'Maximum Depth for SF17',
    description: 'SF17 uses cloud depth (often 40+ ply) - no handicap.',
    implementation: 'Lichess Cloud API returns deepest available analysis.',
    verification: 'Log SF17 depth per position - should average 30+ ply.',
  },
  {
    id: 'randomized-move',
    name: 'Randomized Prediction Point',
    description: 'Move number is randomized per game (15-35 range).',
    implementation: 'Math.random() * (35 - 15) + 15 per game.',
    verification: 'Log prediction move numbers - should show variance.',
  }
];

/**
 * Style profiling methodology
 */
export const STYLE_METHODOLOGY: MethodologySection[] = [
  {
    title: 'Time Control ELO Variance',
    description: 'A player\'s ELO across different time controls reveals cognitive fingerprint.',
    keyPoints: [
      'Large variance (100+ pts) = specialized cognitive style',
      'Low variance = balanced, adaptable cognition',
      'Bullet > Classical = intuition-dominant',
      'Classical > Bullet = calculation-dominant',
    ],
    technicalDetails: 'ELO variance is calculated as standard deviation across all time controls played. Max delta is the gap between best and worst time control.',
  },
  {
    title: 'Trading Style Mapping',
    description: 'Chess time controls naturally map to trading timeframes.',
    keyPoints: [
      'Ultrabullet (< 30s) → HFT (millisecond decisions)',
      'Bullet (1-2 min) → Scalping (seconds to minutes)',
      'Blitz (3-5 min) → Day Trading (hours)',
      'Rapid (10-15 min) → Swing Trading (days)',
      'Classical (30+ min) → Position Trading (weeks)',
      'Correspondence → Long-term Investing (months+)',
    ],
    technicalDetails: 'The mapping is based on decision window duration and cognitive load requirements.',
  },
  {
    title: 'Pressure Response Analysis',
    description: 'Performance under time pressure predicts market behavior.',
    keyPoints: [
      'Blunder rate under time pressure → Panic sell probability',
      'Comeback probability → Drawdown recovery likelihood',
      'Tilt resistance → Ability to stick to trading plan',
      'Speed preference → Optimal market volatility',
    ],
    technicalDetails: 'Blunder rate is calculated as (major mistakes / total moves) under time pressure (< 30% of average move time).',
  },
  {
    title: 'Market Fit Scoring',
    description: 'Match player style to current market conditions.',
    keyPoints: [
      'Volatility affinity vs current market volatility',
      'Decision speed vs market momentum',
      'Calculation style vs trend clarity',
      'Fit score 0-100% with warnings',
    ],
    technicalDetails: 'Market fit uses Euclidean distance between player profile vector and market conditions vector, normalized to 0-1.',
  }
];

/**
 * Get methodology summary for display
 */
export function getMethodologySummary(): string {
  return `En Pensent Benchmark Methodology v${METHODOLOGY_VERSION}

Opponent: TCEC Stockfish 17 Unlimited (ELO 3600)
Data: Fresh Lichess GM games (randomized per run)
Position: Move 15-35, never past 50% of game
Fairness: Same FEN, same information, independent predictions

${FAIRNESS_GUARANTEES.length} fairness guarantees enforced.
Last updated: ${LAST_UPDATED}`;
}

/**
 * Get formatted methodology for UI panels
 */
export function getMethodologyPanels(): Array<{
  icon: string;
  title: string;
  content: string;
  color: string;
}> {
  return [
    {
      icon: '🏆',
      title: 'TCEC SF17 Unlimited',
      content: 'ELO 3600 • Deepest cloud analysis • No handicaps',
      color: 'blue',
    },
    {
      icon: '♟️',
      title: 'Live GM Games',
      content: 'Magnus, Hikaru, Firouzja • Fresh each run • Random time window',
      color: 'purple',
    },
    {
      icon: '🎲',
      title: 'Randomized Points',
      content: 'Move 15-35 • Never past 50% • No memorization',
      color: 'green',
    },
    {
      icon: '⚖️',
      title: 'Fair Comparison',
      content: 'Same FEN • Same info • Independent predictions',
      color: 'yellow',
    },
  ];
}

/**
 * Continuous learning documentation
 */
export const CONTINUOUS_LEARNING_METHODOLOGY = {
  title: 'Continuous Learning Pipeline',
  description: 'How En Pensent learns from every benchmark run.',
  process: [
    {
      step: 1,
      name: 'Data Collection',
      description: 'Every 10 minutes, fetch games across 6 ELO tiers (800-3500).',
    },
    {
      step: 2,
      name: 'Pattern Extraction',
      description: 'Generate color flow signatures and archetype classifications.',
    },
    {
      step: 3,
      name: 'Outcome Correlation',
      description: 'Map patterns to actual game outcomes for learning.',
    },
    {
      step: 4,
      name: 'Accuracy Tracking',
      description: 'Compare predictions to outcomes, track per-archetype accuracy.',
    },
    {
      step: 5,
      name: 'Weight Adjustment',
      description: 'Increase weight of successful patterns, decrease failed ones.',
    },
    {
      step: 6,
      name: 'Cross-Domain Transfer',
      description: 'Apply learned patterns to market and code domains.',
    },
  ],
  dataQualityTiers: [
    { tier: 'tcec_unlimited', description: 'TCEC SF17 depth 40+ ply', weight: 1.0 },
    { tier: 'tcec_calibrated', description: 'SF17 depth 20-40 ply', weight: 0.8 },
    { tier: 'cloud_standard', description: 'Standard cloud depth 10-20', weight: 0.6 },
    { tier: 'legacy', description: 'Historical data pre-TCEC', weight: 0.4 },
  ],
};
