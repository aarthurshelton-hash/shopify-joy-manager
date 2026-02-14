"use strict";
/**
 * ══════════════════════════════════════════════════════════════════════
 * 32-PIECE COLOR FLOW SYSTEM
 * ══════════════════════════════════════════════════════════════════════
 *
 * Each of the 32 starting pieces gets its own unique hue.
 * As pieces move, they leave color traces on every square they visit.
 * When multiple traces overlap on a square, it creates nested layers —
 * "squares within squares" — showing the full spatial history.
 *
 * The 4-quadrant system uses 2 colors (white/black).
 * The 12-color system uses piece-type colors.
 * THIS system uses 32 individual piece colors + trace depth.
 *
 * Prediction is built FOR this data format, not repurposed from 4-quad.
 * ══════════════════════════════════════════════════════════════════════
 */

Object.defineProperty(exports, "__esModule", { value: true });
exports.extract32PieceSignature = extract32PieceSignature;
exports.predictFrom32PieceSignature = predictFrom32PieceSignature;
exports.PIECE_HUES = void 0;

const { Chess } = require('chess.js');

/**
 * 32 unique hues — one for each starting piece.
 * Key = starting square, Value = { id, hue (0-360), side, type, file }
 */
const PIECE_HUES = {
  // White pieces (hues 0-179)
  a1: { id: 'wRa', hue: 0,   side: 'w', type: 'r', file: 'a' },
  b1: { id: 'wNb', hue: 11,  side: 'w', type: 'n', file: 'b' },
  c1: { id: 'wBc', hue: 22,  side: 'w', type: 'b', file: 'c' },
  d1: { id: 'wQd', hue: 33,  side: 'w', type: 'q', file: 'd' },
  e1: { id: 'wKe', hue: 44,  side: 'w', type: 'k', file: 'e' },
  f1: { id: 'wBf', hue: 55,  side: 'w', type: 'b', file: 'f' },
  g1: { id: 'wNg', hue: 66,  side: 'w', type: 'n', file: 'g' },
  h1: { id: 'wRh', hue: 77,  side: 'w', type: 'r', file: 'h' },
  a2: { id: 'wPa', hue: 88,  side: 'w', type: 'p', file: 'a' },
  b2: { id: 'wPb', hue: 95,  side: 'w', type: 'p', file: 'b' },
  c2: { id: 'wPc', hue: 102, side: 'w', type: 'p', file: 'c' },
  d2: { id: 'wPd', hue: 109, side: 'w', type: 'p', file: 'd' },
  e2: { id: 'wPe', hue: 116, side: 'w', type: 'p', file: 'e' },
  f2: { id: 'wPf', hue: 123, side: 'w', type: 'p', file: 'f' },
  g2: { id: 'wPg', hue: 130, side: 'w', type: 'p', file: 'g' },
  h2: { id: 'wPh', hue: 137, side: 'w', type: 'p', file: 'h' },
  // Black pieces (hues 180-359)
  a8: { id: 'bRa', hue: 180, side: 'b', type: 'r', file: 'a' },
  b8: { id: 'bNb', hue: 191, side: 'b', type: 'n', file: 'b' },
  c8: { id: 'bBc', hue: 202, side: 'b', type: 'b', file: 'c' },
  d8: { id: 'bQd', hue: 213, side: 'b', type: 'q', file: 'd' },
  e8: { id: 'bKe', hue: 224, side: 'b', type: 'k', file: 'e' },
  f8: { id: 'bBf', hue: 235, side: 'b', type: 'b', file: 'f' },
  g8: { id: 'bNg', hue: 246, side: 'b', type: 'n', file: 'g' },
  h8: { id: 'bRh', hue: 257, side: 'b', type: 'r', file: 'h' },
  a7: { id: 'bPa', hue: 268, side: 'b', type: 'p', file: 'a' },
  b7: { id: 'bPb', hue: 275, side: 'b', type: 'p', file: 'b' },
  c7: { id: 'bPc', hue: 282, side: 'b', type: 'p', file: 'c' },
  d7: { id: 'bPd', hue: 289, side: 'b', type: 'p', file: 'd' },
  e7: { id: 'bPe', hue: 296, side: 'b', type: 'p', file: 'e' },
  f7: { id: 'bPf', hue: 303, side: 'b', type: 'p', file: 'f' },
  g7: { id: 'bPg', hue: 310, side: 'b', type: 'p', file: 'g' },
  h7: { id: 'bPh', hue: 317, side: 'b', type: 'p', file: 'h' },
};
exports.PIECE_HUES = PIECE_HUES;

const FILES = 'abcdefgh';

/**
 * Extract the full 32-piece color flow signature from a PGN.
 *
 * Replays the game move-by-move, tracking each individual piece by its
 * starting square. Every square on the board accumulates a trace stack —
 * the ordered list of individual pieces that occupied it. Overlapping
 * traces create "squares within squares" (nested layers).
 *
 * @param {string} pgn - The PGN to analyze (can be partial)
 * @param {number} [analysisMoveNumber] - Move to evaluate at (0 = full game)
 * @returns {object} 32-piece color flow signature
 */
function extract32PieceSignature(pgn, analysisMoveNumber) {
  const chess = new Chess();

  // Try to load PGN
  try {
    chess.loadPgn(pgn);
  } catch {
    try {
      const moveText = pgn.replace(/\[.*?\]\s*/g, '').trim()
        .replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '').trim();
      chess.reset();
      chess.loadPgn(moveText);
    } catch {
      return null;
    }
  }

  const history = chess.history({ verbose: true });
  if (history.length < 10) return null;

  const moveLimit = analysisMoveNumber || history.length;

  // ── Initialize piece tracker: maps current square → piece identity ──
  // Each piece is identified by its starting square (the key into PIECE_HUES)
  const pieceAt = {};        // currentSquare → startingSquare
  const alive = new Set();   // set of startingSquares still on board
  const promoted = {};       // startingSquare → promoted piece type

  // Place all 32 starting pieces
  for (const startSq of Object.keys(PIECE_HUES)) {
    pieceAt[startSq] = startSq;
    alive.add(startSq);
  }

  // ── Board trace grid: 8×8, each cell = stack of trace layers ──
  // Each layer = { pieceId, hue, side, type, moveNumber, isCapture }
  const traceGrid = {};
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = FILES[f] + (r + 1);
      traceGrid[sq] = [];
    }
  }

  // Record initial positions as trace layer 0
  for (const startSq of Object.keys(PIECE_HUES)) {
    const info = PIECE_HUES[startSq];
    traceGrid[startSq].push({
      pieceId: info.id,
      hue: info.hue,
      side: info.side,
      type: info.type,
      moveNumber: 0,
      isCapture: false,
    });
  }

  // ── Per-piece movement tracking ──
  const pieceMobility = {};    // startSq → number of moves made
  const pieceSquares = {};     // startSq → Set of squares visited
  for (const startSq of Object.keys(PIECE_HUES)) {
    pieceMobility[startSq] = 0;
    pieceSquares[startSq] = new Set([startSq]);
  }

  // ── Position-relative dynamic piece valuation ──
  // "The true value is relative to the position — every new position in a game"
  // Tracked per individual piece at the analysis position.
  // Maps directly to market party-of-interest attribution:
  //   each piece = a unique party, its relative value = its current influence.
  const pieceRelativeValues = {}; // startSq → current relative value
  for (const startSq of Object.keys(PIECE_HUES)) {
    const info = PIECE_HUES[startSq];
    // Initialize with static base values
    pieceRelativeValues[startSq] = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1 }[info.type] || 1;
  }

  // ── Replay game, tracking individual pieces ──
  const captures = [];         // { capturer, captured, square, moveNumber }
  const interactions = {};     // "pieceA|pieceB" → count of shared squares

  for (let i = 0; i < moveLimit && i < history.length; i++) {
    const move = history[i];
    const from = move.from;
    const to = move.to;
    const moveNum = i + 1;

    // Find which individual piece is moving
    const originPieceStart = pieceAt[from];
    if (!originPieceStart) continue; // shouldn't happen but safety

    const pieceInfo = PIECE_HUES[originPieceStart];
    if (!pieceInfo) continue;

    // Handle capture — record which piece was captured
    if (move.captured) {
      let capturedSq = to;
      // En passant: captured pawn is on a different square
      if (move.flags.includes('e')) {
        const epRank = move.color === 'w' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
        capturedSq = to[0] + epRank;
      }
      const capturedPieceStart = pieceAt[capturedSq];
      if (capturedPieceStart) {
        alive.delete(capturedPieceStart);
        delete pieceAt[capturedSq];
        captures.push({
          capturer: originPieceStart,
          captured: capturedPieceStart,
          square: to,
          moveNumber: moveNum,
        });
      }
    }

    // Move the piece
    delete pieceAt[from];
    pieceAt[to] = originPieceStart;
    pieceMobility[originPieceStart]++;
    pieceSquares[originPieceStart].add(to);

    // Handle promotion — piece keeps identity but changes type
    if (move.promotion) {
      promoted[originPieceStart] = move.promotion;
    }

    // Handle castling — also move the rook
    if (move.flags.includes('k')) { // Kingside castle
      const rookFrom = move.color === 'w' ? 'h1' : 'h8';
      const rookTo = move.color === 'w' ? 'f1' : 'f8';
      const rookStart = pieceAt[rookFrom];
      if (rookStart) {
        delete pieceAt[rookFrom];
        pieceAt[rookTo] = rookStart;
        pieceMobility[rookStart]++;
        pieceSquares[rookStart].add(rookTo);
        // Record rook trace
        traceGrid[rookTo].push({
          pieceId: PIECE_HUES[rookStart]?.id || rookStart,
          hue: PIECE_HUES[rookStart]?.hue || 0,
          side: move.color,
          type: 'r',
          moveNumber: moveNum,
          isCapture: false,
        });
      }
    } else if (move.flags.includes('q')) { // Queenside castle
      const rookFrom = move.color === 'w' ? 'a1' : 'a8';
      const rookTo = move.color === 'w' ? 'd1' : 'd8';
      const rookStart = pieceAt[rookFrom];
      if (rookStart) {
        delete pieceAt[rookFrom];
        pieceAt[rookTo] = rookStart;
        pieceMobility[rookStart]++;
        pieceSquares[rookStart].add(rookTo);
        traceGrid[rookTo].push({
          pieceId: PIECE_HUES[rookStart]?.id || rookStart,
          hue: PIECE_HUES[rookStart]?.hue || 0,
          side: move.color,
          type: 'r',
          moveNumber: moveNum,
          isCapture: false,
        });
      }
    }

    // Record trace on destination square — this creates the "squares within squares"
    const effectiveType = promoted[originPieceStart] || pieceInfo.type;
    traceGrid[to].push({
      pieceId: pieceInfo.id,
      hue: pieceInfo.hue,
      side: pieceInfo.side,
      type: effectiveType,
      moveNumber: moveNum,
      isCapture: !!move.captured,
    });

    // Record piece interactions (shared squares)
    for (const layer of traceGrid[to]) {
      if (layer.pieceId !== pieceInfo.id) {
        const key = [pieceInfo.id, layer.pieceId].sort().join('|');
        interactions[key] = (interactions[key] || 0) + 1;
      }
    }

    // ── POSITION-RELATIVE VALUE UPDATE ──
    // Every move changes the piece's value based on its new context.
    // This is the core insight: static values are a beginner heuristic.
    // The REAL value depends on WHERE the piece is and WHAT's happening.
    const toFile = FILES.indexOf(to[0]);
    const toRank = parseInt(to[1]) - 1;
    const gamePhase = moveNum < 20 ? 'opening' : moveNum < 40 ? 'middlegame' : 'endgame';

    if (effectiveType === 'p') {
      // Pawn value increases with advancement
      const adv = pieceInfo.side === 'w' ? toRank - 1 : 6 - toRank;
      if (adv >= 5) pieceRelativeValues[originPieceStart] = 5;      // One step from promotion
      else if (adv >= 4) pieceRelativeValues[originPieceStart] = 3.5; // Dangerous passed pawn
      else if (adv >= 3) pieceRelativeValues[originPieceStart] = 2;   // Advanced, gaining influence
      else pieceRelativeValues[originPieceStart] = 1;
    } else if (effectiveType === 'n') {
      // Knight value: centrality bonus (e4/d4/e5/d5 = outpost)
      const centrality = (3.5 - Math.abs(toFile - 3.5)) + (3.5 - Math.abs(toRank - 3.5));
      const centralBonus = centrality / 7; // 0 to 1
      pieceRelativeValues[originPieceStart] = 2.5 + centralBonus * 2;
      // Knight worth more in closed positions (many pieces still alive)
      if (gamePhase === 'middlegame' && alive.size > 20) {
        pieceRelativeValues[originPieceStart] += 0.5;
      }
    } else if (effectiveType === 'b') {
      // Bishop value: increases with mobility (open diagonals)
      const reach = (pieceSquares[originPieceStart] || new Set()).size;
      pieceRelativeValues[originPieceStart] = 2.5 + Math.min(2, reach / 4);
      // Bishop pair bonus (both bishops alive = +0.5 each)
      const bishopStarts = pieceInfo.side === 'w' ? ['c1', 'f1'] : ['c8', 'f8'];
      if (bishopStarts.every(sq => alive.has(sq))) {
        pieceRelativeValues[originPieceStart] += 0.5;
      }
      // Bishop value increases in endgame (open board)
      if (gamePhase === 'endgame') pieceRelativeValues[originPieceStart] += 0.5;
    } else if (effectiveType === 'r') {
      // Rook value: increases with file openness and endgame activity
      pieceRelativeValues[originPieceStart] = 5;
      if (gamePhase === 'endgame') pieceRelativeValues[originPieceStart] = 6;
      // Connected rooks bonus (both rooks alive and active)
      const rookStarts = pieceInfo.side === 'w' ? ['a1', 'h1'] : ['a8', 'h8'];
      if (rookStarts.every(sq => alive.has(sq))) {
        pieceRelativeValues[originPieceStart] += 0.5;
      }
    } else if (effectiveType === 'q') {
      // Queen: slightly less valuable in complex middlegame (overloaded)
      pieceRelativeValues[originPieceStart] = gamePhase === 'middlegame' ? 8.5 : 9;
    } else if (effectiveType === 'k') {
      // King: low value early (liability), increasing in endgame (active piece)
      pieceRelativeValues[originPieceStart] = gamePhase === 'endgame' ? 4 : 1;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BUILD THE 32-PIECE SIGNATURE
  // ══════════════════════════════════════════════════════════════

  // ── 1. Trace Depth Map: how many layers deep each square goes ──
  const traceDepths = {};
  let maxDepth = 0;
  let totalDepth = 0;
  let squaresWithTraces = 0;
  for (const sq in traceGrid) {
    const depth = traceGrid[sq].length;
    traceDepths[sq] = depth;
    if (depth > 0) {
      squaresWithTraces++;
      totalDepth += depth;
      if (depth > maxDepth) maxDepth = depth;
    }
  }
  const avgTraceDepth = squaresWithTraces > 0 ? totalDepth / squaresWithTraces : 0;

  // ── 2. 8-Quadrant Profile (per-piece weighted) ──
  const quadrants = {
    q1_kingside_white: 0,   // e1-h4
    q2_queenside_white: 0,  // a1-d4
    q3_kingside_black: 0,   // e5-h8
    q4_queenside_black: 0,  // a5-d8
    q5_center_white: 0,     // c3-f4
    q6_center_black: 0,     // c5-f6
    q7_extended_kingside: 0, // g1-h8
    q8_extended_queenside: 0, // a1-b8
  };

  // Per-piece-type quadrant influence (unique to 32-piece system)
  const pieceTypeQuadrants = {
    pawn: { white: 0, black: 0 },
    knight: { white: 0, black: 0 },
    bishop: { white: 0, black: 0 },
    rook: { white: 0, black: 0 },
    queen: { white: 0, black: 0 },
    king: { white: 0, black: 0 },
  };

  // Use POSITION-RELATIVE values as quadrant weights instead of static piece values.
  // Each piece's dynamic value was computed during replay based on WHERE it is.
  // For the quadrant profile, we use the FINAL relative value (at analysis position).
  // This means a pawn on the 7th rank weighs 5x a pawn on the 2nd — as it should.
  const staticWeights = { k: 1, q: 9, r: 5, b: 3, n: 3, p: 1 }; // fallback only

  for (const sq in traceGrid) {
    const file = FILES.indexOf(sq[0]);
    const rank = parseInt(sq[1]) - 1;
    const isKingside = file >= 4;
    const isQueenside = file <= 3;
    const isWhiteTerritory = rank <= 3;
    const isBlackTerritory = rank >= 4;
    const isCenter = file >= 2 && file <= 5 && rank >= 2 && rank <= 5;
    const isExtKS = file >= 6;
    const isExtQS = file <= 1;

    for (const layer of traceGrid[sq]) {
      const sideVal = layer.side === 'w' ? 1 : -1;
      // Look up this specific piece's position-relative value
      // Find which starting square this pieceId corresponds to
      let w = staticWeights[layer.type] || 1;
      for (const startSq in PIECE_HUES) {
        if (PIECE_HUES[startSq].id === layer.pieceId && alive.has(startSq)) {
          w = pieceRelativeValues[startSq] || w;
          break;
        }
      }

      // Core 4 quadrants
      if (isKingside && isWhiteTerritory)       quadrants.q1_kingside_white += sideVal * w;
      else if (isQueenside && isWhiteTerritory)  quadrants.q2_queenside_white += sideVal * w;
      else if (isKingside && isBlackTerritory)   quadrants.q3_kingside_black += sideVal * w;
      else if (isQueenside && isBlackTerritory)  quadrants.q4_queenside_black += sideVal * w;

      // Center quadrants
      if (isCenter && isWhiteTerritory)          quadrants.q5_center_white += sideVal * w;
      else if (isCenter && isBlackTerritory)     quadrants.q6_center_black += sideVal * w;

      // Wing quadrants
      if (isExtKS) quadrants.q7_extended_kingside += sideVal * w;
      if (isExtQS) quadrants.q8_extended_queenside += sideVal * w;

      // Per-piece-type influence
      const typeName = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }[layer.type] || 'pawn';
      if (layer.side === 'w') pieceTypeQuadrants[typeName].white += w;
      else pieceTypeQuadrants[typeName].black += w;
    }
  }

  // ── 3. Individual Piece Mobility Signatures ──
  // How far each piece traveled — normalized per piece type
  const mobilityByType = { p: [], n: [], b: [], r: [], q: [], k: [] };
  const reachByType = { p: [], n: [], b: [], r: [], q: [], k: [] };

  for (const startSq of Object.keys(PIECE_HUES)) {
    const info = PIECE_HUES[startSq];
    const mobility = pieceMobility[startSq] || 0;
    const reach = (pieceSquares[startSq] || new Set()).size;
    mobilityByType[info.type].push(mobility);
    reachByType[info.type].push(reach);
  }

  const avgMobility = {};
  const avgReach = {};
  for (const t of Object.keys(mobilityByType)) {
    const arr = mobilityByType[t];
    avgMobility[t] = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const rarr = reachByType[t];
    avgReach[t] = rarr.length > 0 ? rarr.reduce((a, b) => a + b, 0) / rarr.length : 0;
  }

  // ── 4. Pawn Individuation ──
  // Each pawn's unique advancement + file migration
  const pawnProfiles = {};
  for (const startSq of Object.keys(PIECE_HUES)) {
    const info = PIECE_HUES[startSq];
    if (info.type !== 'p') continue;
    const squares = pieceSquares[startSq];
    const isAlive = alive.has(startSq);
    const isPromoted = !!promoted[startSq];
    let maxAdvancement = 0;
    let fileMigration = 0;
    const startFile = FILES.indexOf(info.file);
    for (const sq of squares) {
      const r = parseInt(sq[1]) - 1;
      const f = FILES.indexOf(sq[0]);
      const adv = info.side === 'w' ? r - 1 : 6 - r;
      if (adv > maxAdvancement) maxAdvancement = adv;
      const fDist = Math.abs(f - startFile);
      if (fDist > fileMigration) fileMigration = fDist;
    }
    pawnProfiles[info.id] = {
      advancement: maxAdvancement,
      fileMigration,
      alive: isAlive,
      promoted: isPromoted,
      mobility: pieceMobility[startSq] || 0,
    };
  }

  // ── 5. Piece Pair Differentiation ──
  // How differently the two knights, two bishops, two rooks behave
  const pairDiffs = {};
  const pairTypes = [
    { type: 'n', w: ['b1', 'g1'], b: ['b8', 'g8'], name: 'knight' },
    { type: 'b', w: ['c1', 'f1'], b: ['c8', 'f8'], name: 'bishop' },
    { type: 'r', w: ['a1', 'h1'], b: ['a8', 'h8'], name: 'rook' },
  ];

  for (const pair of pairTypes) {
    // White pair
    const wMob1 = pieceMobility[pair.w[0]] || 0;
    const wMob2 = pieceMobility[pair.w[1]] || 0;
    const wReach1 = (pieceSquares[pair.w[0]] || new Set()).size;
    const wReach2 = (pieceSquares[pair.w[1]] || new Set()).size;
    const wDiff = Math.abs(wMob1 - wMob2) + Math.abs(wReach1 - wReach2);

    // Black pair
    const bMob1 = pieceMobility[pair.b[0]] || 0;
    const bMob2 = pieceMobility[pair.b[1]] || 0;
    const bReach1 = (pieceSquares[pair.b[0]] || new Set()).size;
    const bReach2 = (pieceSquares[pair.b[1]] || new Set()).size;
    const bDiff = Math.abs(bMob1 - bMob2) + Math.abs(bReach1 - bReach2);

    pairDiffs[pair.name] = { white: wDiff, black: bDiff };
  }

  // ── 6. Interaction Density (squares-within-squares depth) ──
  // How many unique piece interactions happened at each quadrant
  let whiteInteractions = 0, blackInteractions = 0, crossInteractions = 0;
  for (const key in interactions) {
    const [a, b] = key.split('|');
    const sideA = a[0]; // 'w' or 'b' from pieceId like 'wRa'
    const sideB = b[0];
    if (sideA === sideB && sideA === 'w') whiteInteractions += interactions[key];
    else if (sideA === sideB && sideA === 'b') blackInteractions += interactions[key];
    else crossInteractions += interactions[key];
  }

  // ── 7. Temporal Phase Distribution ──
  const temporal = { opening: 0, middlegame: 0, endgame: 0 };
  for (const sq in traceGrid) {
    for (const layer of traceGrid[sq]) {
      if (layer.moveNumber <= 15) temporal.opening++;
      else if (layer.moveNumber <= 40) temporal.middlegame++;
      else temporal.endgame++;
    }
  }
  const totalTemporal = temporal.opening + temporal.middlegame + temporal.endgame || 1;

  // ── 8. Material Flow (captures timeline) ──
  // Use POSITION-RELATIVE values for captures — not static.
  // A captured pawn on the 7th rank was worth 5, not 1.
  let whiteMaterialCaptured = 0, blackMaterialCaptured = 0;
  for (const cap of captures) {
    const capturedInfo = PIECE_HUES[cap.captured];
    if (!capturedInfo) continue;
    // Use the relative value the piece had at the time of capture
    // (approximated by its last known relative value before death)
    const val = pieceRelativeValues[cap.captured] || ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[capturedInfo.type] || 0);
    if (capturedInfo.side === 'w') blackMaterialCaptured += val;
    else whiteMaterialCaptured += val;
  }

  // ── 9. Per-Piece Relative Values (for market party-of-interest mapping) ──
  // Each of the 32 pieces is a unique "party" — its relative value = its current influence.
  // In market terms: each piece maps to a party of interest (stock, sector, commodity).
  // The 32-piece system gives INDIVIDUAL attribution, not just type-level attribution.
  const relativeValues = {};
  let whiteRelativeTotal = 0, blackRelativeTotal = 0;
  for (const startSq of Object.keys(PIECE_HUES)) {
    const info = PIECE_HUES[startSq];
    const val = alive.has(startSq) ? pieceRelativeValues[startSq] : 0;
    relativeValues[info.id] = {
      value: +val.toFixed(2),
      alive: alive.has(startSq),
      promoted: !!promoted[startSq],
      mobility: pieceMobility[startSq] || 0,
      reach: (pieceSquares[startSq] || new Set()).size,
    };
    if (info.side === 'w') whiteRelativeTotal += val;
    else blackRelativeTotal += val;
  }

  // ══════════════════════════════════════════════════════════════
  // ASSEMBLE SIGNATURE
  // ══════════════════════════════════════════════════════════════

  // Compute white vs black spatial dominance from quadrants
  const whiteSpatial = quadrants.q1_kingside_white + quadrants.q2_queenside_white +
                       quadrants.q5_center_white;
  const blackSpatial = quadrants.q3_kingside_black + quadrants.q4_queenside_black +
                       quadrants.q6_center_black;

  // Piece activity balance
  const whiteActivity = Object.values(pieceTypeQuadrants).reduce((s, v) => s + v.white, 0);
  const blackActivity = Object.values(pieceTypeQuadrants).reduce((s, v) => s + v.black, 0);

  // Compute fingerprint from trace grid
  let fpHash = 0;
  for (const sq in traceGrid) {
    for (const layer of traceGrid[sq]) {
      fpHash = ((fpHash << 5) - fpHash + layer.hue + layer.moveNumber) | 0;
    }
  }

  const totalMoves = Math.min(moveLimit, history.length);

  return {
    version: '32piece-v1',
    totalMoves,
    movesAnalyzed: totalMoves,

    // 8-quadrant spatial profile
    quadrants,

    // Per-piece-type influence (richer than 4-quad: tracks each type separately)
    pieceTypeInfluence: pieceTypeQuadrants,

    // Trace depth: the "squares within squares" metric
    traceDepth: {
      max: maxDepth,
      avg: avgTraceDepth,
      totalLayers: totalDepth,
      squaresUsed: squaresWithTraces,
    },

    // Individual piece mobility
    mobility: avgMobility,
    reach: avgReach,

    // Pawn individuation (each pawn tracked separately)
    pawnProfiles,

    // Piece pair differentiation (how differently paired pieces behave)
    pairDiffs,

    // Interaction density (cross-piece square sharing)
    interactions: {
      white: whiteInteractions,
      black: blackInteractions,
      cross: crossInteractions,
      total: whiteInteractions + blackInteractions + crossInteractions,
    },

    // Temporal distribution
    temporal: {
      opening: temporal.opening / totalTemporal,
      middlegame: temporal.middlegame / totalTemporal,
      endgame: temporal.endgame / totalTemporal,
    },

    // Material flow
    materialFlow: {
      whiteCaptured: whiteMaterialCaptured,
      blackCaptured: blackMaterialCaptured,
      balance: whiteMaterialCaptured - blackMaterialCaptured,
    },

    // Spatial dominance
    spatialDominance: {
      white: whiteSpatial,
      black: blackSpatial,
      delta: whiteSpatial - blackSpatial,
    },

    // Activity balance
    activityBalance: {
      white: whiteActivity,
      black: blackActivity,
      ratio: whiteActivity > 0 ? blackActivity / whiteActivity : 1,
    },

    // Capture count
    captures: captures.length,
    alive: alive.size,

    // ── POSITION-RELATIVE VALUES (per piece) ──
    // Each of 32 pieces = a unique party of interest.
    // Their relative value shifts every move based on board context.
    // Market mapping: piece → party, relative value → current influence.
    relativeValues,
    relativeBalance: {
      white: +whiteRelativeTotal.toFixed(2),
      black: +blackRelativeTotal.toFixed(2),
      delta: +(whiteRelativeTotal - blackRelativeTotal).toFixed(2),
      ratio: whiteRelativeTotal > 0 ? +(blackRelativeTotal / whiteRelativeTotal).toFixed(3) : 1,
    },

    // Fingerprint
    fingerprint: `p32-${Math.abs(fpHash).toString(36)}`,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PREDICTION ENGINE — BUILT FOR 32-PIECE SIGNATURES
// ══════════════════════════════════════════════════════════════════════
//
// This predictor uses the richer structural signals from the 32-piece
// system. It does NOT reuse the 4-quadrant predictor's calibration.
// Instead it combines multiple independent signal channels that each
// have their own predictive logic.
//
// Signal channels:
//   1. Spatial dominance (quadrant balance)
//   2. Activity balance (piece engagement)
//   3. Material flow (capture differential)
//   4. Trace depth asymmetry (territorial control depth)
//   5. Piece mobility differential
//   6. Pawn structure (advancement, file migration)
//   7. Piece pair coordination
//   8. Temporal momentum (who was more active recently)
//   9. Stockfish eval alignment (weighted anchor)
//
// Each channel votes independently. The final prediction is a weighted
// ensemble. The weights will be refined by the self-learning pipeline
// as more labeled data accumulates.
// ══════════════════════════════════════════════════════════════════════

function predictFrom32PieceSignature(sig, sfEvalCp, moveNumber) {
  if (!sig || sig.version !== '32piece-v1') return null;

  const signals = [];

  // ── 1. Spatial Dominance Signal ──
  const spatialDelta = sig.spatialDominance.delta;
  const spatialNorm = Math.tanh(spatialDelta / 30); // normalize to [-1, 1]
  signals.push({ name: 'spatial', value: spatialNorm, weight: 1.5 });

  // ── 2. Activity Balance Signal ──
  const actRatio = sig.activityBalance.ratio;
  const actSignal = Math.tanh((1 - actRatio) * 2); // >1 means black more active
  signals.push({ name: 'activity', value: actSignal, weight: 1.2 });

  // ── 3. Material Flow Signal ──
  const matBalance = sig.materialFlow.balance;
  const matSignal = Math.tanh(matBalance / 10);
  signals.push({ name: 'material', value: matSignal, weight: 1.8 });

  // ── 4. Trace Depth Asymmetry ──
  // Deeper traces on white's side = white controls more territory historically
  const q = sig.quadrants;
  const whiteTraceIntensity = Math.abs(q.q1_kingside_white) + Math.abs(q.q2_queenside_white);
  const blackTraceIntensity = Math.abs(q.q3_kingside_black) + Math.abs(q.q4_queenside_black);
  const traceAsymmetry = Math.tanh((whiteTraceIntensity - blackTraceIntensity) / 20);
  signals.push({ name: 'traceDepth', value: traceAsymmetry, weight: 1.0 });

  // ── 5. Piece Mobility Differential ──
  const mob = sig.mobility;
  const whiteMob = (mob.n || 0) + (mob.b || 0) + (mob.r || 0) + (mob.q || 0);
  const blackMob = whiteMob; // Symmetric by type avg — use reach instead
  const reach = sig.reach;
  const whiteReach = (reach.n || 0) + (reach.b || 0) + (reach.r || 0);
  const blackReach = whiteReach; // Symmetric — differentiate via pair diffs
  // Use knight pair diff as proxy for coordination advantage
  const pairAdvantage = (sig.pairDiffs.knight?.white || 0) - (sig.pairDiffs.knight?.black || 0);
  const mobSignal = Math.tanh(pairAdvantage / 5);
  signals.push({ name: 'mobility', value: mobSignal, weight: 0.6 });

  // ── 6. Pawn Structure Signal ──
  let whiteAdvancement = 0, blackAdvancement = 0;
  let whitePawnsAlive = 0, blackPawnsAlive = 0;
  for (const id in sig.pawnProfiles) {
    const pp = sig.pawnProfiles[id];
    if (id.startsWith('w')) {
      whiteAdvancement += pp.advancement;
      if (pp.alive) whitePawnsAlive++;
    } else {
      blackAdvancement += pp.advancement;
      if (pp.alive) blackPawnsAlive++;
    }
  }
  const pawnSignal = Math.tanh((whiteAdvancement - blackAdvancement) / 8);
  signals.push({ name: 'pawnStructure', value: pawnSignal, weight: 0.8 });

  // ── 7. Interaction Density ──
  const interactionBalance = sig.interactions.white - sig.interactions.black;
  const interactionSignal = Math.tanh(interactionBalance / 15);
  signals.push({ name: 'interactions', value: interactionSignal, weight: 0.5 });

  // ── 8. Temporal Momentum ──
  // Late-game activity suggests endgame advantage
  const lateMomentum = sig.temporal.endgame > 0.3 ? matSignal * 1.2 : matSignal;
  signals.push({ name: 'momentum', value: Math.tanh(lateMomentum), weight: 0.4 });

  // ── 9. Relative Value Balance (position-relative material) ──
  // Unlike static material count, this reflects each piece's ACTUAL influence
  // based on where it is right now. A knight on d5 outpost counts more than
  // a bishop trapped behind its own pawns.
  if (sig.relativeBalance) {
    const relDelta = sig.relativeBalance.delta;
    const relSignal = Math.tanh(relDelta / 15);
    signals.push({ name: 'relativeValue', value: relSignal, weight: 1.4 });
  }

  // ── 10. Stockfish Eval Anchor ──
  // SF eval is a strong anchor but not dominant — weighted to let other signals contribute
  const sfSignal = Math.tanh(sfEvalCp / 200);
  const sfWeight = Math.min(2.5, 1.0 + Math.abs(sfEvalCp) / 300); // Higher weight for decisive evals
  signals.push({ name: 'stockfish', value: sfSignal, weight: sfWeight });

  // ── Ensemble: weighted vote ──
  let totalWeight = 0;
  let weightedSum = 0;
  for (const s of signals) {
    weightedSum += s.value * s.weight;
    totalWeight += s.weight;
  }
  const ensembleScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // ── Convert to prediction ──
  const drawThreshold = 0.08;
  let predictedWinner;
  if (ensembleScore > drawThreshold) predictedWinner = 'white';
  else if (ensembleScore < -drawThreshold) predictedWinner = 'black';
  else predictedWinner = 'draw';

  // Confidence from signal agreement (how many channels agree with the prediction)
  let agreeing = 0;
  for (const s of signals) {
    if (predictedWinner === 'white' && s.value > 0) agreeing++;
    else if (predictedWinner === 'black' && s.value < 0) agreeing++;
    else if (predictedWinner === 'draw' && Math.abs(s.value) < 0.15) agreeing++;
  }
  const agreement = agreeing / signals.length;
  const confidence = Math.min(0.69, Math.max(0.15, 0.3 + agreement * 0.4));

  return {
    predictedWinner,
    confidence,
    ensembleScore,
    signalCount: signals.length,
    agreement,
    signals: signals.map(s => ({ name: s.name, value: +s.value.toFixed(3), weight: s.weight })),
    whiteAdvantage: ensembleScore,
  };
}
