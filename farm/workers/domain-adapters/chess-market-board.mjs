/**
 * Chess-Market Board Engine
 * 
 * Each stock/index gets its own chess board.
 *   - White = SELL pressure (the initiator/aggressor)
 *   - Black = BUY pressure (the responder/accumulator)
 *   - Each of 32 pieces = a party of interest (highest active volume participants)
 *   - Opening position chosen ARCHETYPICALLY from chess variations matching market "vibe"
 *   - Run thousands of parallel scenarios from the same position → outcome distribution
 *   - White wins = sell wins (bearish), Black wins = buy wins (bullish), Draw = neutrality
 * 
 * Draw has TWO modes:
 *   1. High-volume cancellation (armies of 10,000 in standstill — active neutrality)
 *   2. Low-volume stalemate (nobody moving — passive neutrality)
 *   Both are DRAWS but with very different implications for next-state prediction.
 * 
 * The position is loaded by matching the market's current state to a chess opening
 * archetype from our differentiated variations — so it picks up on the "vibe" of
 * the game, then attributes piece parties and uses our color temporal patterns
 * to predict outcome.
 */

// ═══════════════════════════════════════════════════════════
// ARCHETYPE → CHESS OPENING POSITION MAP
// ═══════════════════════════════════════════════════════════
// 
// Each market archetype maps to a family of chess openings that
// share the same strategic "vibe." These openings are the starting
// positions for parallel scenario simulation.
//
// The chess openings are the largest labeled dataset of archetypal
// initial strategies in human history (hundreds of millions of games).
// We're not learning "chess" — we're learning the universal pattern
// of what happens when you start from THIS type of position.

const ARCHETYPE_OPENING_MAP = {
  // ── ATTACK modes (aggressive, directional, volatile) ──
  kingside_attack: {
    ecoFamilies: ['B80-B99', 'C60-C99', 'B20-B39'], // Sicilian Dragon, Ruy Lopez, Sicilian
    vibeDescription: 'Aggressive directional commitment — strong momentum, high conviction',
    marketSignature: { momentum: 'strong', volatility: 'high', direction: 'trending' },
  },
  sacrificial_kingside_assault: {
    ecoFamilies: ['C30-C39', 'C50-C59', 'B00-B09'], // King's Gambit, Italian, Scandi
    vibeDescription: 'Sharp sacrifice for initiative — breakout with material risk',
    marketSignature: { momentum: 'explosive', volatility: 'very_high', direction: 'breakout' },
  },
  sacrificial_queenside_break: {
    ecoFamilies: ['D31-D39', 'E60-E69'], // QGD Tarrasch, King's Indian
    vibeDescription: 'Strategic sacrifice on the other flank — sector rotation breakout',
    marketSignature: { momentum: 'divergent', volatility: 'high', direction: 'rotation' },
  },
  queen_raid: {
    ecoFamilies: ['B10-B19', 'A45-A49'], // Caro-Kann, Indian systems
    vibeDescription: 'Early aggressive probe — testing defenses with major force',
    marketSignature: { momentum: 'probing', volatility: 'medium_high', direction: 'tentative_bull' },
  },
  pawn_storm: {
    ecoFamilies: ['B70-B79', 'E70-E79'], // Sicilian Dragon, King's Indian Classical
    vibeDescription: 'Relentless incremental pressure — pawn structure advance',
    marketSignature: { momentum: 'grinding', volatility: 'medium', direction: 'slow_trend' },
  },

  // ── EXPAND modes (structural, positional, broadening) ──
  queenside_expansion: {
    ecoFamilies: ['D00-D09', 'E00-E09', 'A10-A39'], // QP, Catalan, English
    vibeDescription: 'Broad structural positioning — institutional accumulation',
    marketSignature: { momentum: 'steady', volatility: 'low_medium', direction: 'broadening' },
  },
  central_domination: {
    ecoFamilies: ['D10-D19', 'D43-D49', 'E10-E19'], // Slav, Semi-Slav, QID
    vibeDescription: 'Control the center — dominate the key contested zone',
    marketSignature: { momentum: 'controlled', volatility: 'medium', direction: 'consolidating' },
  },
  bishop_pair_mastery: {
    ecoFamilies: ['C40-C49', 'A80-A99'], // Various Open, Dutch
    vibeDescription: 'Long-range diagonal control — asymmetric positioning',
    marketSignature: { momentum: 'asymmetric', volatility: 'low', direction: 'angled' },
  },
  flank_operations: {
    ecoFamilies: ['A00-A09', 'A40-A44'], // Irregular, Benoni systems
    vibeDescription: 'Edge activity, non-central approach — unconventional sectors leading',
    marketSignature: { momentum: 'peripheral', volatility: 'medium', direction: 'sector_driven' },
  },

  // ── CONSTRICT modes (defensive, squeezing, compression) ──
  positional_squeeze: {
    ecoFamilies: ['E20-E29', 'D20-D29'], // Nimzo-Indian, QGA
    vibeDescription: 'Deny opponent resources — compression, low volatility squeeze',
    marketSignature: { momentum: 'compressing', volatility: 'low', direction: 'tightening' },
  },
  closed_maneuvering: {
    ecoFamilies: ['E30-E39', 'D50-D59'], // Nimzo Classical, QGD
    vibeDescription: 'Locked structure, slow maneuvering — range-bound, patience required',
    marketSignature: { momentum: 'flat', volatility: 'very_low', direction: 'range_bound' },
  },
  central_knight_outpost: {
    ecoFamilies: ['B40-B49', 'C00-C19'], // Sicilian others, French
    vibeDescription: 'Entrenched advantage in center — strong support levels holding',
    marketSignature: { momentum: 'anchored', volatility: 'low', direction: 'supported' },
  },

  // ── ENDGAME modes (technical, material-driven) ──
  rook_endgame_dominance: {
    ecoFamilies: ['D60-D69', 'E40-E59'], // QGD Orthodox, Nimzo/Bogo
    vibeDescription: 'Technical endgame — few pieces, structural advantage matters',
    marketSignature: { momentum: 'thinning', volatility: 'decreasing', direction: 'late_stage' },
  },
  endgame_technique: {
    ecoFamilies: ['A50-A79', 'D70-D99'], // Benoni, Grünfeld
    vibeDescription: 'Pure technique — small edge converted methodically',
    marketSignature: { momentum: 'precise', volatility: 'low', direction: 'grinding_edge' },
  },

  // ── TACTICAL modes (sharp, forcing, high-interaction) ──
  tactical_melee: {
    ecoFamilies: ['B20-B99', 'C20-C29'], // Sharp Sicilians, Open Games
    vibeDescription: 'Chaotic tactical battle — many captures, high interaction density',
    marketSignature: { momentum: 'chaotic', volatility: 'very_high', direction: 'unpredictable' },
  },

  // ── DEFAULT ──
  balanced_flow: {
    ecoFamilies: ['A00-E99'], // Any opening — balanced start
    vibeDescription: 'Neutral starting state — all possibilities open',
    marketSignature: { momentum: 'neutral', volatility: 'medium', direction: 'undecided' },
  },
};


// ═══════════════════════════════════════════════════════════
// PARTY → PIECE ATTRIBUTION
// ═══════════════════════════════════════════════════════════
//
// For each stock, the 32 pieces are attributed to the parties
// with the most active volume. With our 32-piece system, each
// party gets a UNIQUE hue — not just type-level attribution.
//
// White side (sell pressure):       Black side (buy pressure):
//   King   = Dominant seller          King   = Dominant buyer
//   Queen  = #2 seller               Queen  = #2 buyer
//   Rooks  = #3-4 sellers            Rooks  = #3-4 buyers
//   Bishops = #5-6 sellers           Bishops = #5-6 buyers
//   Knights = #7-8 sellers           Knights = #7-8 buyers
//   Pawns  = #9-16 sellers           Pawns  = #9-16 buyers

const PIECE_SLOTS = [
  { piece: 'king',   rank: 1, label: 'Dominant' },
  { piece: 'queen',  rank: 2, label: 'Major' },
  { piece: 'rook_a', rank: 3, label: 'Structural A' },
  { piece: 'rook_h', rank: 4, label: 'Structural B' },
  { piece: 'bishop_c', rank: 5, label: 'Diagonal A' },
  { piece: 'bishop_f', rank: 6, label: 'Diagonal B' },
  { piece: 'knight_b', rank: 7, label: 'Non-linear A' },
  { piece: 'knight_g', rank: 8, label: 'Non-linear B' },
  { piece: 'pawn_a', rank: 9,  label: 'Flow A' },
  { piece: 'pawn_b', rank: 10, label: 'Flow B' },
  { piece: 'pawn_c', rank: 11, label: 'Flow C' },
  { piece: 'pawn_d', rank: 12, label: 'Flow D' },
  { piece: 'pawn_e', rank: 13, label: 'Flow E' },
  { piece: 'pawn_f', rank: 14, label: 'Flow F' },
  { piece: 'pawn_g', rank: 15, label: 'Flow G' },
  { piece: 'pawn_h', rank: 16, label: 'Flow H' },
];

/**
 * Attribute pieces to parties based on volume activity.
 * 
 * @param {object} marketFeatures - Latest market features (price, volume, momentum)
 * @param {object} pieceTierProfile - From computePieceTierProfile()
 * @param {object} optionsData - Options flow data (if available)
 * @returns {object} Party attribution for both sides
 */
export function attributeParties(marketFeatures, pieceTierProfile, optionsData = null) {
  // In real implementation, party data comes from institutional ownership,
  // 13F filings, options flow attribution, dark pool data.
  // For now, we use the piece-tier profile to create RELATIVE attributions
  // based on which channels are most active.

  const tiers = pieceTierProfile?.tiers || {};
  const sellSide = [];
  const buySide = [];

  // Each tier generates parties based on its channel activity
  for (const [tierName, tierData] of Object.entries(tiers)) {
    if (!tierData) continue;
    const party = {
      tier: tierName,
      activity: tierData.activity || 0,
      direction: tierData.direction || 0,
      weight: tierData.weight || 0.5,
      relativeValue: computePartyRelativeValue(tierName, tierData, marketFeatures),
    };

    // Direction determines which side this party's activity belongs to
    // Negative direction = sell pressure (white), positive = buy pressure (black)
    if (tierData.direction < -0.05) {
      sellSide.push({ ...party, side: 'sell' });
    } else if (tierData.direction > 0.05) {
      buySide.push({ ...party, side: 'buy' });
    } else {
      // Neutral activity — split between both sides (like draw pressure)
      sellSide.push({ ...party, side: 'sell', activity: party.activity * 0.5 });
      buySide.push({ ...party, side: 'buy', activity: party.activity * 0.5 });
    }
  }

  // Sort by weighted activity (most active = highest rank piece)
  sellSide.sort((a, b) => (b.activity * b.weight) - (a.activity * a.weight));
  buySide.sort((a, b) => (b.activity * b.weight) - (a.activity * a.weight));

  // Map to piece slots
  const whitePieces = {};
  const blackPieces = {};
  for (let i = 0; i < PIECE_SLOTS.length; i++) {
    const slot = PIECE_SLOTS[i];
    whitePieces[slot.piece] = sellSide[i] || { tier: 'retail', activity: 0.1, direction: 0, weight: 0.2, relativeValue: 1 };
    blackPieces[slot.piece] = buySide[i] || { tier: 'retail', activity: 0.1, direction: 0, weight: 0.2, relativeValue: 1 };
  }

  return {
    white: whitePieces, // SELL side
    black: blackPieces, // BUY side
    sellPressure: sellSide.reduce((s, p) => s + p.activity * p.weight, 0),
    buyPressure: buySide.reduce((s, p) => s + p.activity * p.weight, 0),
    imbalance: buySide.reduce((s, p) => s + p.activity * p.weight, 0) -
               sellSide.reduce((s, p) => s + p.activity * p.weight, 0),
  };
}

/**
 * Compute a party's position-relative value.
 * Just like chess pieces change value based on position,
 * market parties change influence based on market context.
 */
function computePartyRelativeValue(tierName, tierData, features) {
  const baseValues = { king: 1, queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };
  let base = baseValues[tierName] || 1;

  const activity = tierData.activity || 0;
  const direction = Math.abs(tierData.direction || 0);

  // High activity + strong direction = more influence (like a knight on an outpost)
  if (activity > 0.7 && direction > 0.3) base *= 1.3;
  // Low activity = reduced influence (like a rook on a closed file)
  if (activity < 0.2) base *= 0.6;
  // Coordination bonus: if direction aligns with overall trend
  if (features && typeof features === 'object') {
    const momentum = features.momentum_5 || features.momentum_10 || 0;
    if (Math.sign(tierData.direction) === Math.sign(momentum) && Math.abs(momentum) > 0.1) {
      base *= 1.2; // Aligned with trend = more powerful
    }
  }

  return +base.toFixed(2);
}


// ═══════════════════════════════════════════════════════════
// POSITION LOADER: Market State → Chess Opening
// ═══════════════════════════════════════════════════════════
//
// Maps the current market state of a stock/index to a chess
// opening archetype. This determines the "starting position"
// for parallel scenario simulation.

/**
 * Load the chess position for a given market state.
 * Returns the archetype, ECO family, and position characteristics.
 * 
 * @param {object} signature - Market grid signature
 * @param {string} marketArchetype - Classified market archetype
 * @param {object} pieceTierProfile - Piece-tier institutional profile
 * @returns {object} Chess position descriptor
 */
export function loadChessPosition(signature, marketArchetype, pieceTierProfile) {
  // Map market archetype → chess archetype
  const chessArchetype = mapMarketToChessArchetype(marketArchetype);
  const opening = ARCHETYPE_OPENING_MAP[chessArchetype] || ARCHETYPE_OPENING_MAP.balanced_flow;

  // Determine game phase from market state
  const intensity = signature?.intensity || 20;
  const volatility = signature?.temporalFlow?.volatility || 30;
  let gamePhase;
  if (intensity < 15 && volatility < 25) gamePhase = 'opening';    // Early/quiet
  else if (intensity > 40 || volatility > 60) gamePhase = 'endgame'; // Late/volatile
  else gamePhase = 'middlegame';

  // Determine draw type (high-volume neutrality vs low-volume stalemate)
  const totalActivity = pieceTierProfile
    ? Object.values(pieceTierProfile.tiers || {}).reduce((s, t) => s + (t?.activity || 0), 0)
    : 0;
  const drawType = totalActivity > 3.0 ? 'active_neutrality' : 'passive_stalemate';

  return {
    chessArchetype,
    ecoFamilies: opening.ecoFamilies,
    vibeDescription: opening.vibeDescription,
    marketSignature: opening.marketSignature,
    gamePhase,
    drawType,
    // For querying the chess DB:
    queryFilters: {
      archetypes: [chessArchetype],
      ecoPrefix: opening.ecoFamilies[0]?.split('-')[0] || 'A',
      minMoves: gamePhase === 'opening' ? 10 : gamePhase === 'middlegame' ? 20 : 30,
      maxMoves: gamePhase === 'opening' ? 25 : gamePhase === 'middlegame' ? 50 : 100,
    },
  };
}

/**
 * Map market archetype to chess archetype.
 * The market archetypes (bullish_momentum, etc.) map to chess
 * strategic archetypes that share the same positional "vibe."
 */
function mapMarketToChessArchetype(marketArchetype) {
  const MAP = {
    // Strong directional
    bullish_momentum:           'kingside_attack',
    bearish_momentum:           'kingside_attack',
    breakout_up:                'sacrificial_kingside_assault',
    breakout_down:              'sacrificial_queenside_break',
    regime_shift_up:            'queen_raid',
    regime_shift_down:          'pawn_storm',

    // Structural/positional
    accumulation:               'queenside_expansion',
    distribution:               'queenside_expansion',
    institutional_accumulation: 'central_domination',
    institutional_distribution: 'central_domination',

    // Compression/defensive
    compression:                'positional_squeeze',
    trend_exhaustion:           'closed_maneuvering',
    mean_reversion_up:          'central_knight_outpost',
    mean_reversion_down:        'central_knight_outpost',
    false_breakout:             'tactical_melee',

    // Low activity
    choppy:                     'balanced_flow',
  };
  return MAP[marketArchetype] || 'balanced_flow';
}


// ═══════════════════════════════════════════════════════════
// PARALLEL SCENARIO ENGINE
// ═══════════════════════════════════════════════════════════
//
// Queries our chess prediction DB for thousands of games matching
// the loaded archetype, then counts outcome distributions.
// This is Monte Carlo via REAL GAMES — not random simulation.

/**
 * Run parallel scenarios by querying real chess games matching the archetype.
 * Returns outcome distribution (sell_wins, buy_wins, draw) with confidence.
 * 
 * @param {object} position - From loadChessPosition()
 * @param {object} sqlPool - PostgreSQL pool for DB queries
 * @param {number} scenarioCount - Number of parallel games to sample (default 1000)
 * @returns {object} Outcome distribution
 */
export async function runParallelScenarios(position, sqlPool, scenarioCount = 1000) {
  if (!sqlPool) {
    return fallbackScenario(position);
  }

  try {
    // Query real chess games matching the archetype
    const { rows } = await sqlPool.query(`
      SELECT 
        hybrid_prediction,
        hybrid_confidence,
        hybrid_archetype,
        enhanced_prediction,
        enhanced_correct,
        actual_result
      FROM chess_prediction_attempts
      WHERE hybrid_archetype = $1
        AND actual_result IS NOT NULL
        AND hybrid_prediction IS NOT NULL
        AND hybrid_confidence IS NOT NULL
      ORDER BY RANDOM()
      LIMIT $2
    `, [position.chessArchetype, scenarioCount]);

    if (!rows || rows.length < 50) {
      // Not enough games for this specific archetype — broaden search
      const { rows: broadRows } = await sqlPool.query(`
        SELECT 
          hybrid_prediction,
          hybrid_confidence,
          hybrid_archetype,
          enhanced_prediction,
          actual_result
        FROM chess_prediction_attempts
        WHERE actual_result IS NOT NULL
          AND hybrid_prediction IS NOT NULL
        ORDER BY RANDOM()
        LIMIT $1
      `, [scenarioCount]);

      if (!broadRows || broadRows.length < 50) {
        return fallbackScenario(position);
      }
      return computeOutcomeDistribution(broadRows, position);
    }

    return computeOutcomeDistribution(rows, position);
  } catch (err) {
    return fallbackScenario(position);
  }
}

/**
 * Compute outcome distribution from real chess games.
 * 
 * White wins (sell wins) → bearish
 * Black wins (buy wins) → bullish
 * Draw → neutrality
 */
// Chess baseline win rates from 1.1M+ games (structural first-mover advantage).
// The SIGNAL is in how much an archetype DEVIATES from this baseline.
// If sacrificial_queenside_break has 48% white (vs 52% baseline), that 4% deviation
// means the responding/buying side does better in this pattern → bullish signal.
const CHESS_BASELINE = { whiteWinRate: 0.466, blackWinRate: 0.418, drawRate: 0.116 };

function computeOutcomeDistribution(rows, position) {
  let whiteWins = 0, blackWins = 0, draws = 0;
  let whiteCorrect = 0, blackCorrect = 0, drawCorrect = 0;
  let enhancedAgree = 0;

  for (const row of rows) {
    const actual = row.actual_result;
    const predicted = row.hybrid_prediction;
    const enhanced = row.enhanced_prediction;

    if (actual === 'white_wins') {
      whiteWins++;
      if (predicted === 'white_wins') whiteCorrect++;
    } else if (actual === 'black_wins') {
      blackWins++;
      if (predicted === 'black_wins') blackCorrect++;
    } else {
      draws++;
      if (predicted === 'draw') drawCorrect++;
    }

    if (enhanced === actual) enhancedAgree++;
  }

  const total = rows.length;
  const sellWinRate = whiteWins / total;
  const buyWinRate = blackWins / total;
  const drawRate = draws / total;

  // DEVIATION from chess baseline — THIS is the real signal.
  // Raw rates are biased by chess first-mover advantage (white always wins more).
  // Deviation tells us: in THIS archetype, does buy or sell do BETTER than expected?
  const sellDeviation = sellWinRate - CHESS_BASELINE.whiteWinRate;  // Positive = sell stronger than usual
  const buyDeviation = buyWinRate - CHESS_BASELINE.blackWinRate;    // Positive = buy stronger than usual
  const drawDeviation = drawRate - CHESS_BASELINE.drawRate;         // Positive = more draws than usual

  const predictionAccuracy = (whiteCorrect + blackCorrect + drawCorrect) / total;
  const enhancedAccuracy = enhancedAgree / total;

  // Direction from DEVIATION, not raw rates
  let direction, confidence;
  const netDeviation = buyDeviation - sellDeviation; // Positive = buy outperforms, negative = sell outperforms

  if (Math.abs(drawDeviation) > 0.10 || Math.abs(netDeviation) < 0.02) {
    // Draw deviation dominates OR deviations cancel → neutral
    direction = 'neutral';
    confidence = 0.40 + Math.abs(drawDeviation) * 2;
  } else if (netDeviation > 0.02) {
    // Buy side deviates more positively → bullish
    direction = 'bullish';
    confidence = Math.min(0.80, 0.45 + netDeviation * 5 + predictionAccuracy * 0.2);
  } else if (netDeviation < -0.02) {
    // Sell side deviates more positively → bearish
    direction = 'bearish';
    confidence = Math.min(0.80, 0.45 + Math.abs(netDeviation) * 5 + predictionAccuracy * 0.2);
  } else {
    direction = 'neutral';
    confidence = 0.40;
  }

  const drawType = position.drawType || 'unknown';

  return {
    direction,
    confidence: +confidence.toFixed(3),
    distribution: {
      sellWins: +sellWinRate.toFixed(3),
      buyWins: +buyWinRate.toFixed(3),
      draw: +drawRate.toFixed(3),
    },
    deviation: {
      sell: +sellDeviation.toFixed(4),
      buy: +buyDeviation.toFixed(4),
      draw: +drawDeviation.toFixed(4),
      net: +netDeviation.toFixed(4),
    },
    drawType,
    scenarioCount: total,
    predictionAccuracy: +predictionAccuracy.toFixed(3),
    enhancedAccuracy: +enhancedAccuracy.toFixed(3),
    archetype: position.chessArchetype,
    gamePhase: position.gamePhase,
  };
}

/**
 * Fallback scenario when DB is unavailable.
 * Uses archetype priors from proven accuracy data.
 */
function fallbackScenario(position) {
  // Use proven chess archetype accuracy as priors
  const PROVEN = {
    queenside_expansion:  0.802,
    positional_squeeze:   0.793,
    sacrificial_kingside_assault: 0.749,
    central_domination:   0.711,
    closed_maneuvering:   0.704,
    kingside_attack:      0.692,
    balanced_flow:        0.600,
  };

  const accuracy = PROVEN[position.chessArchetype] || 0.60;

  return {
    direction: 'neutral',
    confidence: accuracy * 0.5, // Lower confidence for fallback
    distribution: {
      sellWins: 0.40,
      buyWins: 0.40,
      draw: 0.20,
    },
    drawType: position.drawType || 'unknown',
    scenarioCount: 0,
    predictionAccuracy: accuracy,
    enhancedAccuracy: 0,
    archetype: position.chessArchetype,
    gamePhase: position.gamePhase,
    isFallback: true,
  };
}


// ═══════════════════════════════════════════════════════════
// CHESS MARKET BOARD — THE FULL PER-STOCK BOARD
// ═══════════════════════════════════════════════════════════

/**
 * Create a complete chess-market board for a given stock.
 * This is the main entry point — call this per symbol per cycle.
 * 
 * @param {string} symbol - Stock/index symbol (e.g., 'AAPL', 'SPY')
 * @param {object} signature - Market grid signature
 * @param {string} marketArchetype - Classified market archetype
 * @param {object} pieceTierProfile - Piece-tier institutional profile
 * @param {object} marketFeatures - Latest computed features
 * @param {object} sqlPool - PostgreSQL pool
 * @returns {object} Complete board state with prediction
 */
export async function createChessMarketBoard(symbol, signature, marketArchetype, pieceTierProfile, marketFeatures, sqlPool) {
  // 1. Load the chess position (archetype → opening)
  const position = loadChessPosition(signature, marketArchetype, pieceTierProfile);

  // 2. Attribute parties to pieces (who is each piece?)
  const parties = attributeParties(marketFeatures, pieceTierProfile);

  // 3. Run parallel scenarios (thousands of real games)
  const scenarios = await runParallelScenarios(position, sqlPool, 2000);

  // 4. Combine party attribution with scenario outcome
  // If buy-side parties have higher relative values AND scenarios favor black → strong bull
  // If sell-side parties dominate AND scenarios favor white → strong bear
  const buyStrength = parties.buyPressure;
  const sellStrength = parties.sellPressure;
  const pressureImbalance = parties.imbalance; // Positive = buy > sell

  let finalDirection = scenarios.direction;
  let finalConfidence = scenarios.confidence;

  // Party pressure confirms or contradicts scenario prediction
  if (finalDirection === 'bullish' && pressureImbalance > 0.1) {
    // Scenarios + parties both say BUY → confirmed
    finalConfidence = Math.min(0.90, finalConfidence * 1.15);
  } else if (finalDirection === 'bearish' && pressureImbalance < -0.1) {
    // Scenarios + parties both say SELL → confirmed
    finalConfidence = Math.min(0.90, finalConfidence * 1.15);
  } else if (finalDirection !== 'neutral' && Math.sign(pressureImbalance) !== (finalDirection === 'bullish' ? 1 : -1)) {
    // Contradiction: scenarios say one thing, parties say another
    finalConfidence *= 0.70; // Reduce confidence
  }

  // Draw type refinement
  let drawMode = null;
  if (finalDirection === 'neutral') {
    const totalPressure = buyStrength + sellStrength;
    drawMode = totalPressure > 1.5 ? 'active_cancellation' : 'passive_stalemate';
  }

  return {
    symbol,
    board: {
      white: parties.white, // SELL side pieces
      black: parties.black, // BUY side pieces
      sellPressure: +sellStrength.toFixed(3),
      buyPressure: +buyStrength.toFixed(3),
      imbalance: +pressureImbalance.toFixed(3),
    },
    position: {
      archetype: position.chessArchetype,
      ecoFamilies: position.ecoFamilies,
      vibe: position.vibeDescription,
      gamePhase: position.gamePhase,
    },
    prediction: {
      direction: finalDirection,
      confidence: +finalConfidence.toFixed(3),
      distribution: scenarios.distribution,
      drawMode,
      scenarioCount: scenarios.scenarioCount,
      predictionAccuracy: scenarios.predictionAccuracy,
      enhancedAccuracy: scenarios.enhancedAccuracy,
    },
    timestamp: Date.now(),
  };
}

export {
  ARCHETYPE_OPENING_MAP,
  PIECE_SLOTS,
};
