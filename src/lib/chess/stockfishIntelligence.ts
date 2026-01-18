/**
 * Stockfish Intelligence Module
 * 
 * Comprehensive knowledge base for understanding Stockfish's:
 * - Evolution across all versions (2008-2025)
 * - ELO progression and TCEC/CCRL ratings
 * - Creators and development philosophy
 * - Architecture (classical -> NNUE -> SFNNv6)
 * - WASM variants and depth capabilities
 * - How it "thinks" and where it can be outpredicted
 */

// ============= STOCKFISH CREATORS & HISTORY =============

export interface StockfishCreator {
  name: string;
  nationality: string;
  role: string;
  contribution: string;
  activeYears: string;
}

export const STOCKFISH_CREATORS: StockfishCreator[] = [
  {
    name: "Tord Romstad",
    nationality: "Norwegian",
    role: "Original Creator",
    contribution: "Created Glaurung engine (2004), which Stockfish forked from",
    activeYears: "2004-2012"
  },
  {
    name: "Marco Costalba",
    nationality: "Italian",
    role: "Primary Developer",
    contribution: "Forked Glaurung 2.1 to create Stockfish (Nov 8, 2008). Led development until 2018",
    activeYears: "2008-2018"
  },
  {
    name: "Joona Kiiski",
    nationality: "Finnish",
    role: "Core Developer",
    contribution: "Joined early 2009, co-developed search algorithms and evaluation",
    activeYears: "2009-2015"
  },
  {
    name: "Gary Linscott",
    nationality: "Canadian",
    role: "Lead Developer",
    contribution: "Created Fishtest distributed testing, led NNUE integration",
    activeYears: "2012-present"
  },
  {
    name: "Hisayori Noda (Nodchip)",
    nationality: "Japanese",
    role: "NNUE Pioneer",
    contribution: "Ported NNUE from Shogi to Stockfish (2020)",
    activeYears: "2020"
  },
  {
    name: "Yu Nasu",
    nationality: "Japanese",
    role: "NNUE Inventor",
    contribution: "Created NNUE architecture for Shogi (2018)",
    activeYears: "2018"
  }
];

// ============= VERSION HISTORY & ELO PROGRESSION =============

export interface StockfishVersion {
  version: string;
  releaseDate: string;
  eloEstimate: number;
  ccrlRating?: number;
  tcecRating?: number;
  keyFeatures: string[];
  architecture: 'classical' | 'nnue' | 'nnue_v2' | 'sfnnv6';
  sourceLanguage: string;
}

export const STOCKFISH_VERSIONS: StockfishVersion[] = [
  // Pre-NNUE Era (Classical Evaluation)
  {
    version: "1.0",
    releaseDate: "2008-11-08",
    eloEstimate: 2800,
    keyFeatures: ["Forked from Glaurung 2.1", "Basic bitboard implementation"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "1.5",
    releaseDate: "2009-06-15",
    eloEstimate: 2900,
    ccrlRating: 2918,
    keyFeatures: ["Improved search efficiency", "Better endgame"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "2.0",
    releaseDate: "2010-07-02",
    eloEstimate: 3000,
    ccrlRating: 3010,
    keyFeatures: ["Razoring pruning", "LMR improvements"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "3.0",
    releaseDate: "2013-04-30",
    eloEstimate: 3100,
    ccrlRating: 3121,
    keyFeatures: ["Syzygy tablebase support", "Singular extensions"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "4.0",
    releaseDate: "2013-08-20",
    eloEstimate: 3140,
    ccrlRating: 3145,
    keyFeatures: ["Improved time management", "Better king safety"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "5.0",
    releaseDate: "2014-05-31",
    eloEstimate: 3180,
    ccrlRating: 3190,
    keyFeatures: ["Null move improvements", "Evaluation tuning"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "6.0",
    releaseDate: "2014-12-27",
    eloEstimate: 3220,
    ccrlRating: 3232,
    keyFeatures: ["Multi-threaded search", "Better mobility eval"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "7.0",
    releaseDate: "2016-01-02",
    eloEstimate: 3280,
    ccrlRating: 3298,
    keyFeatures: ["Check extension improvements", "Better piece-square tables"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "8.0",
    releaseDate: "2016-11-01",
    eloEstimate: 3350,
    ccrlRating: 3371,
    keyFeatures: ["Improved time controls", "Better contempt factor"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "9.0",
    releaseDate: "2018-02-01",
    eloEstimate: 3400,
    ccrlRating: 3420,
    keyFeatures: ["SPSA auto-tuning", "Late move reductions V2"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "10.0",
    releaseDate: "2018-11-29",
    eloEstimate: 3430,
    ccrlRating: 3452,
    keyFeatures: ["Improved futility pruning", "Better mobility terms"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  {
    version: "11.0",
    releaseDate: "2020-01-18",
    eloEstimate: 3480,
    ccrlRating: 3494,
    keyFeatures: ["Last major classical version", "Optimal search parameters"],
    architecture: 'classical',
    sourceLanguage: "C++"
  },
  
  // NNUE Era Begins
  {
    version: "12.0",
    releaseDate: "2020-09-02",
    eloEstimate: 3560,
    ccrlRating: 3573,
    tcecRating: 3560,
    keyFeatures: ["NNUE integration", "80 ELO gain from neural network", "Hybrid classical+NNUE"],
    architecture: 'nnue',
    sourceLanguage: "C++"
  },
  {
    version: "13.0",
    releaseDate: "2021-02-19",
    eloEstimate: 3590,
    ccrlRating: 3603,
    tcecRating: 3590,
    keyFeatures: ["Pure NNUE (no classical fallback)", "Improved net architecture"],
    architecture: 'nnue',
    sourceLanguage: "C++"
  },
  {
    version: "14.0",
    releaseDate: "2021-07-02",
    eloEstimate: 3610,
    ccrlRating: 3621,
    tcecRating: 3610,
    keyFeatures: ["HalfKAv2 architecture", "Better feature scaling"],
    architecture: 'nnue_v2',
    sourceLanguage: "C++"
  },
  {
    version: "15.0",
    releaseDate: "2022-04-18",
    eloEstimate: 3630,
    ccrlRating: 3645,
    tcecRating: 3630,
    keyFeatures: ["Larger networks", "SIMD optimizations"],
    architecture: 'nnue_v2',
    sourceLanguage: "C++"
  },
  {
    version: "16.0",
    releaseDate: "2023-06-30",
    eloEstimate: 3660,
    ccrlRating: 3678,
    tcecRating: 3663,
    keyFeatures: ["Improved NNUE training data", "Better endgame nets"],
    architecture: 'sfnnv6',
    sourceLanguage: "C++"
  },
  {
    version: "17.0",
    releaseDate: "2024-09-05",
    eloEstimate: 3700,
    ccrlRating: 3715,
    tcecRating: 3690,
    keyFeatures: ["SFNNv6 architecture", "Dual NNUE nets", "State-of-the-art"],
    architecture: 'sfnnv6',
    sourceLanguage: "C++"
  },
  {
    version: "17.1",
    releaseDate: "2025-02-15",
    eloEstimate: 3720,
    keyFeatures: ["Bug fixes", "Minor improvements", "Current version"],
    architecture: 'sfnnv6',
    sourceLanguage: "C++"
  }
];

// ============= WASM VARIANTS & DEPTH ANALYSIS =============

export interface WASMVariant {
  name: string;
  variant: 'lite-single' | 'lite' | 'multi' | 'full';
  threads: number;
  simdSupport: boolean;
  maxPracticalDepth: number;
  eloVsFull: number; // ELO difference vs native full version
  useCase: string;
  memoryUsageMB: number;
}

export const WASM_VARIANTS: WASMVariant[] = [
  {
    name: "stockfish-17.1-lite-single",
    variant: 'lite-single',
    threads: 1,
    simdSupport: true,
    maxPracticalDepth: 30,
    eloVsFull: -150,
    useCase: "Maximum browser compatibility, quick analysis",
    memoryUsageMB: 40
  },
  {
    name: "stockfish-17.1-lite",
    variant: 'lite',
    threads: 1,
    simdSupport: true,
    maxPracticalDepth: 40,
    eloVsFull: -100,
    useCase: "Standard browser analysis, balanced performance",
    memoryUsageMB: 60
  },
  {
    name: "stockfish-17.1-multi",
    variant: 'multi',
    threads: 4,
    simdSupport: true,
    maxPracticalDepth: 50,
    eloVsFull: -50,
    useCase: "Advanced analysis with SharedArrayBuffer",
    memoryUsageMB: 150
  },
  {
    name: "stockfish-17.1-full",
    variant: 'full',
    threads: 16,
    simdSupport: true,
    maxPracticalDepth: 60,
    eloVsFull: 0,
    useCase: "Maximum depth, server-side or powerful client",
    memoryUsageMB: 400
  }
];

// ============= STOCKFISH THINKING PATTERNS =============

export interface ThinkingPattern {
  pattern: string;
  description: string;
  whenStrong: string;
  whenWeak: string;
  enPensentAdvantage: string;
}

export const STOCKFISH_THINKING_PATTERNS: ThinkingPattern[] = [
  {
    pattern: "Alpha-Beta Search",
    description: "Minimax with aggressive pruning - explores best lines deeply",
    whenStrong: "Tactical complications, forced sequences, material imbalances",
    whenWeak: "Long strategic plans where all moves seem equal near-term",
    enPensentAdvantage: "Pattern recognition sees trajectory beyond horizon"
  },
  {
    pattern: "NNUE Evaluation",
    description: "Neural network evaluates positions based on piece relationships",
    whenStrong: "Complex middlegame positions, piece activity assessment",
    whenWeak: "Novel structures outside training data, psychological pressure",
    enPensentAdvantage: "Archetypal patterns transcend specific piece configurations"
  },
  {
    pattern: "Late Move Reductions",
    description: "Searches promising moves deeper, reduces others",
    whenStrong: "Finding best moves quickly in most positions",
    whenWeak: "Unusual defensive resources, quiet sacrifices",
    enPensentAdvantage: "Considers all game flow patterns equally"
  },
  {
    pattern: "Transposition Tables",
    description: "Caches evaluated positions to avoid recalculation",
    whenStrong: "Endgames, repetitive structures",
    whenWeak: "Unique positions, psychological pattern breaks",
    enPensentAdvantage: "Player fingerprinting detects human patterns"
  },
  {
    pattern: "Contempt Factor",
    description: "Adjusts evaluation to avoid draws when ahead",
    whenStrong: "Converting winning positions",
    whenWeak: "Underestimating fortress potential",
    enPensentAdvantage: "Color Flow detects draw tendencies early"
  }
];

// ============= DEPTH CONFIGURATION FOR BENCHMARKS =============

export interface DepthConfig {
  name: string;
  depth: number;
  estimatedElo: number;
  timePerPositionMs: number;
  description: string;
  wasmCompatible: boolean;
}

export const BENCHMARK_DEPTH_CONFIGS: DepthConfig[] = [
  {
    name: "Quick Blitz",
    depth: 12,
    estimatedElo: 2800,
    timePerPositionMs: 100,
    description: "Fast analysis for rapid benchmarking",
    wasmCompatible: true
  },
  {
    name: "Standard Analysis",
    depth: 20,
    estimatedElo: 3200,
    timePerPositionMs: 500,
    description: "Good balance of depth and speed",
    wasmCompatible: true
  },
  {
    name: "Lichess Cloud Equivalent",
    depth: 25,
    estimatedElo: 3350,
    timePerPositionMs: 1500,
    description: "Matches typical cloud eval depth",
    wasmCompatible: true
  },
  {
    name: "Tournament Analysis",
    depth: 30,
    estimatedElo: 3450,
    timePerPositionMs: 3000,
    description: "Strong analysis matching human GM prep",
    wasmCompatible: true
  },
  {
    name: "Deep Analysis",
    depth: 40,
    estimatedElo: 3550,
    timePerPositionMs: 10000,
    description: "Very deep search, near championship level",
    wasmCompatible: true
  },
  {
    name: "TCEC Championship",
    depth: 50,
    estimatedElo: 3620,
    timePerPositionMs: 30000,
    description: "Matches TCEC superfinal conditions",
    wasmCompatible: true
  },
  {
    name: "Maximum Depth",
    depth: 60,
    estimatedElo: 3700,
    timePerPositionMs: 60000,
    description: "True maximum capacity for decisive analysis",
    wasmCompatible: true
  }
];

// ============= INTELLIGENCE ANALYSIS FUNCTIONS =============

/**
 * Get Stockfish version info by version number
 */
export function getVersionInfo(version: string): StockfishVersion | undefined {
  return STOCKFISH_VERSIONS.find(v => v.version === version);
}

/**
 * Calculate estimated ELO for a given depth
 */
export function estimateEloFromDepth(depth: number): number {
  // Based on empirical ELO vs depth curves
  if (depth <= 10) return 2600 + (depth * 20);
  if (depth <= 20) return 2800 + ((depth - 10) * 40);
  if (depth <= 30) return 3200 + ((depth - 20) * 25);
  if (depth <= 40) return 3450 + ((depth - 30) * 10);
  if (depth <= 50) return 3550 + ((depth - 40) * 7);
  return 3620 + ((depth - 50) * 3); // Diminishing returns
}

/**
 * Get WASM variant recommendation based on browser capabilities
 */
export function getRecommendedWasmVariant(): WASMVariant {
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const hasWasmThreads = hasSharedArrayBuffer;
  
  if (hasWasmThreads) {
    return WASM_VARIANTS.find(v => v.variant === 'multi')!;
  }
  return WASM_VARIANTS.find(v => v.variant === 'lite-single')!;
}

/**
 * Analyze Stockfish's evolution pattern
 */
export function analyzeStockfishEvolution(): {
  totalEloGain: number;
  averageYearlyGain: number;
  nnueImpact: number;
  architectureBreakthroughs: string[];
} {
  const versions = STOCKFISH_VERSIONS;
  const firstVersion = versions[0];
  const latestVersion = versions[versions.length - 1];
  
  const totalEloGain = latestVersion.eloEstimate - firstVersion.eloEstimate;
  
  const firstYear = parseInt(firstVersion.releaseDate.substring(0, 4));
  const lastYear = parseInt(latestVersion.releaseDate.substring(0, 4));
  const years = lastYear - firstYear;
  
  const averageYearlyGain = totalEloGain / years;
  
  // NNUE impact: SF12 (first NNUE) vs SF11 (last classical)
  const sf11 = versions.find(v => v.version === "11.0")!;
  const sf12 = versions.find(v => v.version === "12.0")!;
  const nnueImpact = sf12.eloEstimate - sf11.eloEstimate;
  
  return {
    totalEloGain,
    averageYearlyGain: Math.round(averageYearlyGain),
    nnueImpact,
    architectureBreakthroughs: [
      "2008: Bitboard implementation (foundation)",
      "2013: Syzygy tablebase integration",
      "2016: Improved multithreading",
      "2020: NNUE neural network (+80 ELO)",
      "2021: Pure NNUE (dropped classical)",
      "2023: SFNNv6 architecture",
      "2024: Dual NNUE nets"
    ]
  };
}

/**
 * Get depth configuration for benchmark testing
 */
export function getDepthConfig(targetElo: number): DepthConfig {
  // Find closest depth config to target ELO
  let closest = BENCHMARK_DEPTH_CONFIGS[0];
  let minDiff = Math.abs(closest.estimatedElo - targetElo);
  
  for (const config of BENCHMARK_DEPTH_CONFIGS) {
    const diff = Math.abs(config.estimatedElo - targetElo);
    if (diff < minDiff) {
      minDiff = diff;
      closest = config;
    }
  }
  
  return closest;
}

/**
 * Identify Stockfish weaknesses that En Pensent can exploit
 */
export function identifyStockfishWeaknesses(): string[] {
  return [
    "Horizon Effect: Cannot see beyond search depth, misses long-term plans",
    "Fortress Blindness: Underestimates drawing fortresses until too late",
    "Psychological Blindspot: Cannot factor in human time pressure or psychology",
    "Pattern Novelty: NNUE trained on historical positions, struggles with novel archetypes",
    "Dynamic Compensation: Sometimes over/undervalues long-term compensation",
    "Quiet Sacrifices: May not explore quiet positional sacrifices deeply enough",
    "Player-Specific Patterns: Cannot adapt to individual playing styles",
    "Time Control Blindness: No awareness of time pressure dynamics"
  ];
}

/**
 * Compare Stockfish depth vs En Pensent effective depth
 */
export function compareEffectiveDepth(stockfishDepth: number, enPensentPatternSpan: number): {
  stockfishPlies: number;
  enPensentEquivalentPlies: number;
  advantage: 'stockfish' | 'en_pensent' | 'equal';
  explanation: string;
} {
  const stockfishPlies = stockfishDepth;
  
  // En Pensent pattern span converts to equivalent plies
  // Pattern recognition can "see" further by recognizing trajectories
  const enPensentEquivalentPlies = Math.round(enPensentPatternSpan * 1.5);
  
  let advantage: 'stockfish' | 'en_pensent' | 'equal' = 'equal';
  let explanation = '';
  
  if (stockfishPlies > enPensentEquivalentPlies + 5) {
    advantage = 'stockfish';
    explanation = `Stockfish's ${stockfishPlies}-ply search exceeds En Pensent's ${enPensentEquivalentPlies}-ply equivalent`;
  } else if (enPensentEquivalentPlies > stockfishPlies + 5) {
    advantage = 'en_pensent';
    explanation = `En Pensent's pattern recognition provides ${enPensentEquivalentPlies}-ply effective depth vs Stockfish's ${stockfishPlies}`;
  } else {
    explanation = `Both systems operating at comparable depth (~${stockfishPlies} plies)`;
  }
  
  return { stockfishPlies, enPensentEquivalentPlies, advantage, explanation };
}

/**
 * Generate comprehensive Stockfish intelligence report
 */
export function generateStockfishIntelligenceReport(): string {
  const evolution = analyzeStockfishEvolution();
  const weaknesses = identifyStockfishWeaknesses();
  const latestVersion = STOCKFISH_VERSIONS[STOCKFISH_VERSIONS.length - 1];
  
  return `
# Stockfish Intelligence Report

## Current State
- Version: ${latestVersion.version}
- Architecture: ${latestVersion.architecture.toUpperCase()}
- Estimated ELO: ${latestVersion.eloEstimate}
- Source: C++ (GPL v3.0)

## Evolution
- Total ELO Gain (2008-2025): +${evolution.totalEloGain}
- Average Yearly Gain: +${evolution.averageYearlyGain} ELO/year
- NNUE Impact: +${evolution.nnueImpact} ELO

## Key Breakthroughs
${evolution.architectureBreakthroughs.map(b => `- ${b}`).join('\n')}

## Identified Weaknesses
${weaknesses.map(w => `- ${w}`).join('\n')}

## Creators & Contributors
${STOCKFISH_CREATORS.map(c => `- ${c.name} (${c.nationality}): ${c.role}`).join('\n')}
`;
}
