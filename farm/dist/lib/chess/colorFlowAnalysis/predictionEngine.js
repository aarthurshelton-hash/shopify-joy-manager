"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/chess/colorFlowAnalysis/predictionEngine.ts
var predictionEngine_exports = {};
__export(predictionEngine_exports, {
  getLastCalibrationReason: () => getLastCalibrationReason,
  getLastEquilibriumScores: () => getLastEquilibriumScores,
  predictFromColorFlow: () => predictFromColorFlow
});
module.exports = __toCommonJS(predictionEngine_exports);
var import_archetypeDefinitions2 = require("./archetypeDefinitions");

// src/lib/chess/colorFlowAnalysis/equilibriumPredictor.ts
var import_mirrorEval = require("./mirrorEval");
var import_deepSignals = require("./deepSignals");
var import_photonicGrid = require("./photonicGrid");
var import_archetypeDefinitions = require("./archetypeDefinitions");
var import_signalCalibration = require("./signalCalibration");
function calculateEquilibriumScores(signature, stockfishEval, stockfishDepth, currentMoveNumber, piece32Data) {
  const ARCHETYPE_REMAP = {
    sacrificial_kingside_assault: "kingside_attack",
    // 69.2% golden zone
    sacrificial_queenside_break: "queenside_expansion",
    // 80.2% golden zone
    development_focus: "closed_maneuvering",
    // 70.2% golden zone
    king_hunt: "kingside_attack",
    // 69.2% golden zone
    minor_piece_coordination: "piece_harmony",
    // 57.1% golden zone (was 60%)
    central_knight_outpost: "central_domination",
    // 71.1% golden zone (was 35.7%)
    bishop_pair_mastery: "positional_squeeze"
    // 79.3% golden zone (was 0%)
  };
  const effectiveArchetypeName = ARCHETYPE_REMAP[signature.archetype] || signature.archetype;
  const archetype = import_archetypeDefinitions.ARCHETYPE_DEFINITIONS[effectiveArchetypeName] || import_archetypeDefinitions.ARCHETYPE_DEFINITIONS[signature.archetype];
  const quadrant = signature.quadrantProfile;
  const temporal = signature.temporalFlow;
  (0, import_signalCalibration.ensureCalibrationLoaded)();
  const controlSignal = calculateControlSignal(signature);
  const momentumSignal = calculateMomentumSignal(temporal);
  const archetypeSignal = calculateArchetypeSignal(effectiveArchetypeName, archetype, signature.dominantSide);
  const sfSignal = calculateStockfishSignal(stockfishEval);
  const phaseSignal = calculatePhaseSignal(currentMoveNumber, signature.intensity);
  const kingSafetySignal = calculateKingSafetySignal(signature.enhancedSignals);
  const pawnStructureSignal = calculatePawnStructureSignal(signature.enhancedSignals);
  const enhancedControlSignal = calculateEnhancedControlSignal(signature.enhancedProfile, signature.enhancedSignals);
  const relativity = computeRelativityConvergence(signature.enhancedProfile, signature.enhancedSignals);
  const interactionSignal = (0, import_signalCalibration.getCalibratedInteractionSignal)(effectiveArchetypeName, stockfishEval);
  const hasInteraction = !!(interactionSignal && interactionSignal.sampleSize >= 100);
  const archPhaseSignal = (0, import_signalCalibration.getCalibratedArchetypePhaseSignal)(effectiveArchetypeName, currentMoveNumber);
  const hasArchPhase = !!(archPhaseSignal && archPhaseSignal.sampleSize >= 100);
  const mirrorEval = (0, import_mirrorEval.computeMirrorEval)(
    signature.enhancedProfile,
    signature.enhancedSignals,
    temporal,
    currentMoveNumber
  );
  const deepSignals = (0, import_deepSignals.computeDeepSignals)(
    signature.enhancedProfile,
    signature.enhancedSignals,
    temporal,
    currentMoveNumber,
    stockfishEval
  );
  const hasDeepSignals = deepSignals.signalCount >= 2;
  const photonicSignal = (0, import_photonicGrid.computePhotonicFusionSignal)(
    signature.enhancedProfile,
    signature.enhancedSignals,
    temporal,
    currentMoveNumber
  );
  const hasPhotonic = photonicSignal.confidence > 0.2;
  const piece32Signal = computePiece32FusionSignal(piece32Data);
  const hasPiece32 = piece32Signal.confidence > 0.15;
  const zoneAccuracy = (0, import_signalCalibration.getArchetypeAccuracy)(effectiveArchetypeName);
  const isPoisonZone = zoneAccuracy && zoneAccuracy.sampleSize >= 200 && zoneAccuracy.accuracy < 0.35;
  const archetypeFusionAdj = (0, import_signalCalibration.getArchetypeFusionWeights)(effectiveArchetypeName);
  const hasEnhanced = !!(signature.enhancedSignals && signature.enhancedProfile);
  const hasMirrorEval = mirrorEval.signalCount >= 3;
  const isEndgame = currentMoveNumber >= 46;
  const isDeepEndgame = currentMoveNumber >= 61;
  const absEval = Math.abs(stockfishEval);
  const sfIsWeak = absEval < 50;
  const signalIntensity = signature.intensity || 0;
  const intensityBoost = 0;
  let mirrorEvalWeight = 0;
  if (hasMirrorEval) {
    if (absEval < 50) mirrorEvalWeight = 0;
    else if (absEval < 200) mirrorEvalWeight = 0.1;
    else mirrorEvalWeight = 0.02;
  }
  const sfWeightReduction = mirrorEvalWeight;
  const deepWeight = 0;
  const deepStealControl = 0;
  const deepStealMomentum = 0;
  const deepStealPhase = 0;
  const isLowEvalZone = absEval < 200;
  const sfZoneMultiplier = isLowEvalZone ? 0.5 : 1;
  const epBoost = isLowEvalZone ? 1.25 : 1;
  const weights = hasEnhanced ? {
    control: ((isEndgame ? 0.06 : 0.12) - deepStealControl) * epBoost,
    momentum: ((isEndgame ? 0.06 : 0.12) - deepStealMomentum) * epBoost,
    archetype: hasInteraction ? hasArchPhase ? 0 : 0.02 : hasArchPhase ? 0.07 : 0.1,
    stockfish: ((hasInteraction ? isEndgame ? 0.28 : 0.17 : isEndgame ? 0.35 : 0.25) - sfWeightReduction + intensityBoost) * sfZoneMultiplier,
    phase: (hasArchPhase ? 0.04 : 0.06) - deepStealPhase,
    kingSafety: (isEndgame ? 0.06 : 0.12) * epBoost,
    pawnStructure: isEndgame ? 0.14 : 0.08,
    enhancedControl: (isEndgame ? 0.1 : 0.15) * epBoost,
    interaction: hasInteraction ? 0.16 : 0,
    archetypePhase: hasArchPhase ? 0.05 : 0,
    mirrorEval: mirrorEvalWeight,
    deepSignals: deepWeight,
    photonic: hasPhotonic && absEval < 200 ? 0.1 : 0,
    // v29.3: Boosted from 8% to 10%
    piece32: hasPiece32 && absEval < 200 ? 0.08 * epBoost : 0
    // v29.4: 32-piece in 0-200cp zone
  } : {
    control: 0.25,
    momentum: 0.2,
    archetype: hasInteraction ? hasArchPhase ? 0.02 : 0.05 : hasArchPhase ? 0.1 : 0.15,
    stockfish: (hasInteraction ? 0.2 : 0.3) - (hasMirrorEval && sfIsWeak ? 0.08 : 0) + intensityBoost,
    phase: hasArchPhase ? 0.07 : 0.1,
    kingSafety: 0,
    pawnStructure: 0,
    enhancedControl: 0,
    interaction: 0,
    archetypePhase: hasArchPhase ? 0.06 : 0,
    mirrorEval: hasMirrorEval && sfIsWeak ? 0.08 : 0,
    deepSignals: 0,
    // Deep signals require enhanced data
    photonic: 0,
    // Photonic requires enhanced data
    piece32: hasPiece32 && absEval < 200 ? 0.08 : 0
    // v29.4: 32-piece works without enhanced data
  };
  if (archetypeFusionAdj && archetypeFusionAdj.sampleSize >= 200) {
    weights.stockfish *= archetypeFusionAdj.sfMultiplier;
    weights.control *= archetypeFusionAdj.controlMultiplier;
    weights.momentum *= archetypeFusionAdj.momentumMultiplier;
    weights.kingSafety *= archetypeFusionAdj.kingSafetyMultiplier;
    weights.pawnStructure *= archetypeFusionAdj.pawnStructureMultiplier;
    const wKeys = Object.keys(weights);
    const totalW = wKeys.reduce((s, k) => s + weights[k], 0);
    if (totalW > 0) {
      for (const k of wKeys) weights[k] /= totalW;
    }
  }
  const iSignal = hasInteraction ? { white: interactionSignal.white, black: interactionSignal.black, draw: interactionSignal.draw } : { white: 33, black: 33, draw: 34 };
  const apSignal = hasArchPhase ? { white: archPhaseSignal.white, black: archPhaseSignal.black, draw: archPhaseSignal.draw } : { white: 33, black: 33, draw: 34 };
  const mEvalWeight = weights.mirrorEval || 0;
  let mirrorSignal = { white: 33, black: 33, draw: 34 };
  if (mEvalWeight > 0 && mirrorEval.signalCount >= 3) {
    const mEv = mirrorEval.eval;
    const mConf = mirrorEval.confidence;
    const absMEv = Math.abs(mEv);
    const scaledAdv = Math.min(30, absMEv / 5 * mConf);
    const drawPenalty = Math.min(15, absMEv / 8 * mConf);
    if (mEv > 10) {
      mirrorSignal = { white: 35 + scaledAdv, black: 30 - scaledAdv / 2, draw: 35 - drawPenalty };
    } else if (mEv < -10) {
      mirrorSignal = { white: 30 - scaledAdv / 2, black: 35 + scaledAdv, draw: 35 - drawPenalty };
    } else {
      mirrorSignal = { white: 32, black: 32, draw: 36 + mConf * 4 };
    }
  }
  const interactionWeight = weights.interaction || 0;
  const archPhaseWeight = weights.archetypePhase || 0;
  const whiteRaw = controlSignal.white * weights.control + momentumSignal.white * weights.momentum + archetypeSignal.white * weights.archetype + sfSignal.white * weights.stockfish + phaseSignal.white * weights.phase + kingSafetySignal.white * weights.kingSafety + pawnStructureSignal.white * weights.pawnStructure + enhancedControlSignal.white * weights.enhancedControl + iSignal.white * interactionWeight + apSignal.white * archPhaseWeight + mirrorSignal.white * mEvalWeight + deepSignals.signal.white * deepWeight + photonicSignal.signal.white * (weights.photonic || 0) + piece32Signal.signal.white * (weights.piece32 || 0);
  const blackRaw = controlSignal.black * weights.control + momentumSignal.black * weights.momentum + archetypeSignal.black * weights.archetype + sfSignal.black * weights.stockfish + phaseSignal.black * weights.phase + kingSafetySignal.black * weights.kingSafety + pawnStructureSignal.black * weights.pawnStructure + enhancedControlSignal.black * weights.enhancedControl + iSignal.black * interactionWeight + apSignal.black * archPhaseWeight + mirrorSignal.black * mEvalWeight + deepSignals.signal.black * deepWeight + photonicSignal.signal.black * (weights.photonic || 0) + piece32Signal.signal.black * (weights.piece32 || 0);
  const drawRaw = controlSignal.draw * weights.control + momentumSignal.draw * weights.momentum + archetypeSignal.draw * weights.archetype + sfSignal.draw * weights.stockfish + phaseSignal.draw * weights.phase + kingSafetySignal.draw * weights.kingSafety + pawnStructureSignal.draw * weights.pawnStructure + enhancedControlSignal.draw * weights.enhancedControl + iSignal.draw * interactionWeight + apSignal.draw * archPhaseWeight + mirrorSignal.draw * mEvalWeight + deepSignals.signal.draw * deepWeight + photonicSignal.signal.draw * (weights.photonic || 0) + piece32Signal.signal.draw * (weights.piece32 || 0);
  const drawSignals = [
    controlSignal.draw,
    momentumSignal.draw,
    archetypeSignal.draw,
    sfSignal.draw,
    phaseSignal.draw,
    kingSafetySignal.draw,
    pawnStructureSignal.draw,
    enhancedControlSignal.draw,
    ...hasArchPhase ? [apSignal.draw] : []
  ];
  const drawStrongCount = drawSignals.filter((d) => d >= 38).length;
  const drawFavorCount = drawSignals.filter((d) => d >= 35).length;
  let drawBoost = 0;
  const earlyMovePenalty = currentMoveNumber <= 20 ? 2 : currentMoveNumber <= 30 ? 1 : 0;
  if (drawStrongCount >= 6 + earlyMovePenalty) {
    drawBoost = 1 + (drawStrongCount - 6 - earlyMovePenalty) * 0.5;
  } else if (drawFavorCount >= 6 + earlyMovePenalty) {
    drawBoost = 0.3;
  }
  const adjustedDrawRaw = drawRaw + drawBoost;
  const total = whiteRaw + blackRaw + adjustedDrawRaw;
  const whiteConfidence = Math.round(whiteRaw / total * 100);
  const blackConfidence = Math.round(blackRaw / total * 100);
  const drawConfidence = Math.round(adjustedDrawRaw / total * 100);
  let prediction;
  let finalConfidence;
  let reasoning;
  const MIN_DRAW_MARGIN = 4;
  const suppressDrawsEntirely = currentMoveNumber <= 20;
  let effectiveDrawMargin = MIN_DRAW_MARGIN;
  if (hasMirrorEval && absEval >= 150 && absEval <= 500 && currentMoveNumber >= 25) {
    const temporalShrinking = mirrorEval.dimensions.temporal < 0.75;
    const mirrorNearZero = Math.abs(mirrorEval.eval) < 40;
    if (temporalShrinking && mirrorNearZero) {
      effectiveDrawMargin = 1;
    }
  }
  const decisiveMax = Math.max(whiteConfidence, blackConfidence);
  const drawLeadsBy = drawConfidence - decisiveMax;
  if (suppressDrawsEntirely || drawLeadsBy < effectiveDrawMargin) {
    if (whiteConfidence >= blackConfidence) {
      prediction = "white_wins";
      finalConfidence = whiteConfidence;
      reasoning = `White leads (W:${whiteConfidence}% B:${blackConfidence}% D:${drawConfidence}% SF:${stockfishEval}cp)`;
    } else {
      prediction = "black_wins";
      finalConfidence = blackConfidence;
      reasoning = `Black leads (W:${whiteConfidence}% B:${blackConfidence}% D:${drawConfidence}% SF:${stockfishEval}cp)`;
    }
  } else {
    prediction = "draw";
    finalConfidence = drawConfidence;
    reasoning = `Draw leads by ${drawLeadsBy}pp (W:${whiteConfidence}% B:${blackConfidence}% D:${drawConfidence}% SF:${stockfishEval}cp${effectiveDrawMargin < MIN_DRAW_MARGIN ? " mirror-rescue" : ""})`;
  }
  const sfDirection = stockfishEval > 50 ? "white_wins" : stockfishEval < -50 ? "black_wins" : "draw";
  const epSfAgree = prediction === sfDirection;
  const absEvalForNudge = Math.abs(stockfishEval);
  if (!epSfAgree && prediction !== "draw" && sfDirection !== "draw" && absEvalForNudge > 200) {
    prediction = sfDirection;
    finalConfidence = Math.max(whiteConfidence, blackConfidence);
    reasoning = `SF override: EP disagreed, SF=${stockfishEval}cp \u2192 ${sfDirection}`;
  }
  const scores = [
    { cls: "white_wins", score: whiteConfidence },
    { cls: "black_wins", score: blackConfidence },
    { cls: "draw", score: drawConfidence }
  ].sort((a, b) => b.score - a.score);
  const margin = scores[0].score - scores[1].score;
  if (margin <= 8 && prediction !== "draw" && absEvalForNudge > 150) {
    const sfFavor = stockfishEval > 0 ? "white_wins" : "black_wins";
    if (scores[0].cls === sfFavor || scores[1].cls === sfFavor) {
      prediction = sfFavor;
      finalConfidence = Math.max(scores[0].score, scores[1].score);
      reasoning = `Tight margin (${margin}pp), SF nudge ${stockfishEval}cp \u2192 ${sfFavor}`;
    }
  }
  if (margin <= 3 && prediction !== "draw" && sfDirection !== "draw" && !epSfAgree && absEvalForNudge > 150) {
    prediction = sfDirection;
    finalConfidence = Math.max(whiteConfidence, blackConfidence);
    reasoning = `Low-conf deference (margin=${margin}pp), SF=${stockfishEval}cp \u2192 ${sfDirection}`;
  }
  if (hasDeepSignals && absEval < 100 && margin <= 6 && prediction !== "draw" && currentMoveNumber >= 15) {
    const ds = deepSignals;
    const dsDirection = ds.signal.white > ds.signal.black + 1 ? "white_wins" : ds.signal.black > ds.signal.white + 1 ? "black_wins" : null;
    if (dsDirection && dsDirection !== prediction) {
      const dsMargin = Math.abs(ds.signal.white - ds.signal.black);
      const dsHasSignal = dsMargin > 2 && ds.signalCount >= 2;
      const momAgrees = dsDirection === "white_wins" && ds.momentumGradient.gradient > 5 || dsDirection === "black_wins" && ds.momentumGradient.gradient < -5;
      const coordAgrees = dsDirection === "white_wins" && ds.coordinationPotential.conversionScore > 5 || dsDirection === "black_wins" && ds.coordinationPotential.conversionScore < -5;
      const structAgrees = dsDirection === "white_wins" && ds.structuralDestiny.destinyScore > 5 || dsDirection === "black_wins" && ds.structuralDestiny.destinyScore < -5;
      const confirmations = (momAgrees ? 1 : 0) + (coordAgrees ? 1 : 0) + (structAgrees ? 1 : 0);
      if (dsHasSignal && confirmations >= 1) {
        prediction = dsDirection;
        finalConfidence = Math.max(whiteConfidence, blackConfidence);
        reasoning = `Deep signal tiebreak (margin=${margin}pp, ds=${dsMargin.toFixed(1)}, confirms=${confirmations}) \u2192 ${dsDirection}`;
      }
    }
  }
  const archetypeStats = (0, import_signalCalibration.getArchetypeAccuracy)(effectiveArchetypeName);
  if (archetypeStats && archetypeStats.sampleSize >= 50) {
    const empiricalAccuracy = archetypeStats.accuracy;
    const maxConfForArchetype = Math.round(empiricalAccuracy * 100) + 8;
    const volumeTrust = Math.min(1, 0.5 + archetypeStats.sampleSize / 2e3);
    const genericCap = finalConfidence >= 55 ? Math.min(75, finalConfidence + 12) : finalConfidence;
    const archetypeCap = Math.min(maxConfForArchetype, finalConfidence >= 55 ? finalConfidence + 8 : finalConfidence);
    finalConfidence = Math.round(archetypeCap * volumeTrust + genericCap * (1 - volumeTrust));
  } else {
    if (finalConfidence >= 55 && finalConfidence <= 64) {
      finalConfidence = Math.min(70, finalConfidence + 8);
    } else if (finalConfidence >= 65) {
      finalConfidence = 62;
    }
  }
  if (currentMoveNumber <= 10) {
    finalConfidence = Math.min(finalConfidence, 38);
  }
  if (isDeepEndgame) {
    finalConfidence = Math.min(finalConfidence, 45);
  }
  if (isPoisonZone) {
    finalConfidence = Math.min(finalConfidence, 40);
  }
  if (signalIntensity >= 50) {
    finalConfidence = Math.min(finalConfidence, 55);
    reasoning += " [int-cap-50+\u2192conf\u226455]";
  } else if (signalIntensity >= 40 && !epSfAgree) {
    finalConfidence = Math.min(finalConfidence, 42);
    reasoning += " [int-cap-40+disagree\u2192conf\u226442]";
  }
  if (finalConfidence >= 70) {
    finalConfidence = 69;
    reasoning += " [overconf-cap-70\u219269]";
  }
  const secondHighest = prediction === "white_wins" ? Math.max(blackConfidence, drawConfidence) : prediction === "black_wins" ? Math.max(whiteConfidence, drawConfidence) : Math.max(whiteConfidence, blackConfidence);
  const highClarity = !isPoisonZone && finalConfidence - secondHighest >= 15;
  return {
    whiteConfidence,
    blackConfidence,
    drawConfidence,
    prediction,
    finalConfidence,
    reasoning,
    highClarity
  };
}
function calculateControlSignal(signature) {
  const dominantSide = signature.dominantSide;
  const q = signature.quadrantProfile;
  const totalActivity = Math.abs(q.kingsideWhite) + Math.abs(q.kingsideBlack) + Math.abs(q.queensideWhite) + Math.abs(q.queensideBlack) + Math.abs(q.center);
  if (totalActivity < 50) {
    return { white: 33, black: 33, draw: 34 };
  }
  const intensity = Math.min(1, totalActivity / 300);
  const baseAdvantage = 15 + intensity * 20;
  switch (dominantSide) {
    case "white":
      return {
        white: 35 + baseAdvantage,
        black: 30 - baseAdvantage / 2,
        draw: 35 - baseAdvantage / 2
      };
    case "black":
      return {
        white: 30 - baseAdvantage / 2,
        black: 35 + baseAdvantage,
        draw: 35 - baseAdvantage / 2
      };
    case "contested":
    default:
      return { white: 32, black: 33, draw: 35 };
  }
}
function calculateMomentumSignal(temporal) {
  const openingToMiddle = temporal.middlegame - temporal.opening;
  const middleToEnd = temporal.endgame - temporal.middlegame;
  const momentum = openingToMiddle * 0.4 + middleToEnd * 0.6;
  const absMomentum = Math.abs(momentum);
  const momentumReversed = openingToMiddle > 5 && middleToEnd < -5 || openingToMiddle < -5 && middleToEnd > 5;
  const volatilityPenalty = Math.min(temporal.volatility / 3, 20);
  if (absMomentum > 15) {
    const gain = Math.min(absMomentum, 40);
    const isWhite = momentum > 0;
    if (momentumReversed && temporal.volatility > 40) {
      const drawBonus = Math.min(8, temporal.volatility / 6);
      return {
        white: isWhite ? 39 + gain / 2 - drawBonus : 28 - gain / 4,
        black: isWhite ? 28 - gain / 4 : 39 + gain / 2 - drawBonus,
        draw: 33 + drawBonus - gain / 4
      };
    }
    if (isWhite) {
      return {
        white: 40 + gain - volatilityPenalty / 2,
        black: 25 - gain / 2,
        draw: 35 - gain / 2 + volatilityPenalty / 2
      };
    } else {
      return {
        white: 25 - gain / 2,
        black: 40 + gain - volatilityPenalty / 2,
        draw: 35 - gain / 2 + volatilityPenalty / 2
      };
    }
  } else {
    if (momentumReversed) {
      return { white: 31, black: 31, draw: 38 };
    }
    if (temporal.volatility > 60) {
      return { white: 34, black: 34, draw: 32 };
    } else if (temporal.volatility > 30) {
      return { white: 32, black: 32, draw: 36 };
    } else {
      return { white: 31, black: 31, draw: 38 };
    }
  }
}
function calculateArchetypeSignal(archetype, archetypeDef, dominantSide) {
  if (!archetypeDef) {
    return { white: 33, black: 33, draw: 34 };
  }
  const empirical = (0, import_signalCalibration.getCalibratedArchetypeSignal)(archetype);
  if (empirical && empirical.sampleSize >= 200) {
    const higherSide = Math.max(empirical.white, empirical.black);
    const lowerSide = Math.min(empirical.white, empirical.black);
    if (dominantSide === "white") {
      return { white: higherSide, black: lowerSide, draw: empirical.draw };
    } else if (dominantSide === "black") {
      return { white: lowerSide, black: higherSide, draw: empirical.draw };
    }
    return { white: empirical.white, black: empirical.black, draw: empirical.draw };
  }
  const ARCHETYPE_WEIGHTS = {
    // Defensive archetypes - slight black boost
    // v9.4: closed_maneuvering was predicting draw 54% but actual=16% at early balanced
    prophylactic_defense: { whiteBoost: -2, blackBoost: 5, drawBoost: 2 },
    closed_maneuvering: { whiteBoost: -1, blackBoost: 3, drawBoost: -1 },
    // Tactical archetypes - depends on who is attacking
    kingside_attack: { whiteBoost: 0, blackBoost: 0, drawBoost: -5 },
    queenside_expansion: { whiteBoost: 0, blackBoost: 0, drawBoost: -3 },
    sacrificial_attack: { whiteBoost: 0, blackBoost: 0, drawBoost: -8 },
    // Balanced archetypes
    opposite_castling: { whiteBoost: -2, blackBoost: 2, drawBoost: 0 },
    open_tactical: { whiteBoost: -1, blackBoost: 2, drawBoost: -3 },
    // Strategic archetypes — side-neutral (dominantSide already assigns the advantage)
    central_domination: { whiteBoost: 0, blackBoost: 0, drawBoost: -3 },
    positional_squeeze: { whiteBoost: 0, blackBoost: 0, drawBoost: -2 },
    piece_harmony: { whiteBoost: 0, blackBoost: 0, drawBoost: 0 },
    // Endgame/pawn archetypes
    endgame_technique: { whiteBoost: -1, blackBoost: 2, drawBoost: 6 },
    pawn_storm: { whiteBoost: 0, blackBoost: 0, drawBoost: -5 }
  };
  const weights = ARCHETYPE_WEIGHTS[archetype] || { whiteBoost: 0, blackBoost: 0, drawBoost: 0 };
  const drawProneArchetypes = ["prophylactic_defense", "closed_maneuvering", "endgame_technique"];
  const decisiveArchetypes = ["kingside_attack", "sacrificial_attack", "opposite_castling", "pawn_storm"];
  let baseDrawProb;
  if (drawProneArchetypes.includes(archetype)) {
    baseDrawProb = 35;
  } else if (decisiveArchetypes.includes(archetype)) {
    baseDrawProb = 25;
  } else {
    baseDrawProb = 30;
  }
  const drawProb = Math.max(18, Math.min(45, baseDrawProb + weights.drawBoost));
  const decisiveProb = 100 - drawProb;
  let whiteShare;
  let blackShare;
  if (dominantSide === "white") {
    whiteShare = decisiveProb * 0.55 + weights.whiteBoost;
    blackShare = decisiveProb * 0.45 + weights.blackBoost;
  } else if (dominantSide === "black") {
    blackShare = decisiveProb * 0.55 + weights.whiteBoost;
    whiteShare = decisiveProb * 0.45 + weights.blackBoost;
  } else {
    whiteShare = decisiveProb / 2;
    blackShare = decisiveProb / 2;
  }
  const total = whiteShare + blackShare + drawProb;
  return {
    white: Math.round(whiteShare / total * 100),
    black: Math.round(blackShare / total * 100),
    draw: Math.round(drawProb / total * 100)
  };
}
function calculateStockfishSignal(eval_cp) {
  const empirical = (0, import_signalCalibration.getCalibratedStockfishSignal)(eval_cp);
  if (empirical && empirical.sampleSize >= 100) {
    return { white: empirical.white, black: empirical.black, draw: empirical.draw };
  }
  if (eval_cp > 200) {
    const winPct = Math.min(85, 60 + Math.abs(eval_cp - 200) / 10);
    return { white: winPct, black: 5, draw: 100 - winPct - 5 };
  } else if (eval_cp < -200) {
    const winPct = Math.min(85, 60 + Math.abs(eval_cp + 200) / 10);
    return { white: 5, black: winPct, draw: 100 - winPct - 5 };
  } else if (eval_cp > 60) {
    const advantage = (eval_cp - 60) / 140 * 25;
    return { white: 44 + advantage, black: 25 - advantage / 2, draw: 31 - advantage / 2 };
  } else if (eval_cp < -60) {
    const advantage = (-eval_cp - 60) / 140 * 25;
    return { white: 25 - advantage / 2, black: 44 + advantage, draw: 31 - advantage / 2 };
  } else if (eval_cp > 35) {
    return { white: 40, black: 27, draw: 33 };
  } else if (eval_cp < -35) {
    return { white: 27, black: 40, draw: 33 };
  } else if (eval_cp > 20) {
    return { white: 37, black: 29, draw: 34 };
  } else if (eval_cp < -20) {
    return { white: 29, black: 37, draw: 34 };
  } else {
    return { white: 31, black: 31, draw: 38 };
  }
}
function calculatePhaseSignal(moveNumber, intensity) {
  const empirical = (0, import_signalCalibration.getCalibratedPhaseSignal)(moveNumber);
  if (empirical && empirical.sampleSize >= 100) {
    return { white: empirical.white, black: empirical.black, draw: empirical.draw };
  }
  if (moveNumber < 15) {
    return { white: 34, black: 33, draw: 33 };
  }
  if (moveNumber < 30) {
    if (intensity < 40) {
      return { white: 33, black: 33, draw: 34 };
    }
    return { white: 34, black: 34, draw: 32 };
  }
  if (intensity < 30) {
    return { white: 31, black: 31, draw: 38 };
  } else if (intensity > 60) {
    return { white: 38, black: 38, draw: 24 };
  }
  return { white: 33, black: 33, draw: 34 };
}
function calculateKingSafetySignal(signals) {
  if (!signals) return { white: 33, black: 33, draw: 34 };
  const ks = signals.kingSafety;
  const delta = ks.kingSafetyDelta;
  const bothExposed = ks.whiteKingExposure > 0.3 && ks.blackKingExposure > 0.3;
  if (bothExposed) {
    const shieldAdv = ks.whitePawnShield - ks.blackPawnShield;
    if (shieldAdv > 0.15) return { white: 42, black: 30, draw: 28 };
    if (shieldAdv < -0.15) return { white: 30, black: 42, draw: 28 };
    return { white: 35, black: 35, draw: 30 };
  }
  if (ks.blackKingExposure > 0.4 && ks.whiteKingExposure < 0.2) {
    const advantage = Math.min(25, ks.blackKingExposure * 50);
    return { white: 40 + advantage, black: 25 - advantage / 2, draw: 35 - advantage / 2 };
  }
  if (ks.whiteKingExposure > 0.4 && ks.blackKingExposure < 0.2) {
    const advantage = Math.min(25, ks.whiteKingExposure * 50);
    return { white: 25 - advantage / 2, black: 40 + advantage, draw: 35 - advantage / 2 };
  }
  if (ks.castled.white && ks.castled.black && Math.abs(delta) < 0.2) {
    return { white: 32, black: 32, draw: 36 };
  }
  if (delta > 0.3) {
    const adv = Math.min(15, delta * 20);
    return { white: 37 + adv, black: 30 - adv / 2, draw: 33 - adv / 2 };
  }
  if (delta < -0.3) {
    const adv = Math.min(15, Math.abs(delta) * 20);
    return { white: 30 - adv / 2, black: 37 + adv, draw: 33 - adv / 2 };
  }
  return { white: 33, black: 33, draw: 34 };
}
function calculatePawnStructureSignal(signals) {
  if (!signals) return { white: 33, black: 33, draw: 34 };
  const ps = signals.pawnStructure;
  const score = ps.structureScore;
  const passedDelta = ps.whitePassed - ps.blackPassed;
  if (Math.abs(score) < 0.1 && ps.whitePassed === ps.blackPassed) {
    return { white: 32, black: 32, draw: 36 };
  }
  if (passedDelta >= 2) {
    return { white: 48, black: 22, draw: 30 };
  }
  if (passedDelta <= -2) {
    return { white: 22, black: 48, draw: 30 };
  }
  if (passedDelta === 1) {
    return { white: 40, black: 28, draw: 32 };
  }
  if (passedDelta === -1) {
    return { white: 28, black: 40, draw: 32 };
  }
  if (score > 0.3) {
    const adv = Math.min(12, score * 20);
    return { white: 36 + adv, black: 30 - adv / 2, draw: 34 - adv / 2 };
  }
  if (score < -0.3) {
    const adv = Math.min(12, Math.abs(score) * 20);
    return { white: 30 - adv / 2, black: 36 + adv, draw: 34 - adv / 2 };
  }
  return { white: 33, black: 33, draw: 34 };
}
function calculateEnhancedControlSignal(profile, signals) {
  if (!profile) return { white: 33, black: 33, draw: 34 };
  const whiteTerritory = profile.q1_kingside_white + profile.q2_queenside_white + profile.q5_center_white;
  const blackTerritory = Math.abs(profile.q3_kingside_black) + Math.abs(profile.q4_queenside_black) + Math.abs(profile.q6_center_black);
  const wingBalance = Math.abs(profile.q7_extended_kingside) + Math.abs(profile.q8_extended_queenside);
  const centerAdvantage = profile.q5_center_white + profile.q6_center_black;
  const coordination = signals?.coordination?.coordinationScore || 0;
  const controlScore = signals?.squareControl?.controlScore || 0;
  const mobility = signals?.trajectories?.mobilityScore || 0;
  const spatialAdvantage = centerAdvantage * 0.35 + // Center is king
  (whiteTerritory - blackTerritory) * 0.25 + // Territory balance
  controlScore * 30 * 0.2 + // Square control map
  coordination * 20 * 0.1 + // Piece coordination bonus
  mobility * 10 * 0.1;
  if (Math.abs(spatialAdvantage) > 20) {
    const isWhite = spatialAdvantage > 0;
    const adv = Math.min(25, Math.abs(spatialAdvantage));
    if (isWhite) {
      return { white: 42 + adv, black: 25 - adv / 2, draw: 33 - adv / 2 };
    } else {
      return { white: 25 - adv / 2, black: 42 + adv, draw: 33 - adv / 2 };
    }
  }
  if (Math.abs(spatialAdvantage) > 8) {
    const isWhite = spatialAdvantage > 0;
    const adv = Math.min(12, Math.abs(spatialAdvantage) / 2);
    if (isWhite) {
      return { white: 38 + adv, black: 28 - adv / 2, draw: 34 - adv / 2 };
    } else {
      return { white: 28 - adv / 2, black: 38 + adv, draw: 34 - adv / 2 };
    }
  }
  if (Math.abs(spatialAdvantage) < 3 && wingBalance < 10) {
    return { white: 31, black: 31, draw: 38 };
  }
  return { white: 33, black: 33, draw: 34 };
}
var EPSILON = 0.1;
function sortedMedian(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function positiveAvg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function computeRelativityConvergence(profile, signals) {
  if (!profile || !signals?.negativeSpace) return null;
  const ns = signals.negativeSpace;
  const matter = [
    Math.abs(profile.q1_kingside_white) + EPSILON,
    Math.abs(profile.q2_queenside_white) + EPSILON,
    Math.abs(profile.q3_kingside_black) + EPSILON,
    Math.abs(profile.q4_queenside_black) + EPSILON,
    Math.abs(profile.q5_center_white) + EPSILON,
    Math.abs(profile.q6_center_black) + EPSILON,
    Math.abs(profile.q7_extended_kingside) + EPSILON,
    Math.abs(profile.q8_extended_queenside) + EPSILON,
    (signals.squareControl?.whiteInfluence || 0) + EPSILON,
    (signals.squareControl?.blackInfluence || 0) + EPSILON,
    (signals.trajectories?.whiteDistance || 0) + EPSILON,
    (signals.trajectories?.blackDistance || 0) + EPSILON,
    (signals.coordination?.coordinationScore || 0) + EPSILON,
    (signals.kingSafety?.whitePawnShield || 0) + EPSILON,
    (signals.kingSafety?.blackPawnShield || 0) + EPSILON
  ];
  const shadow = [
    Math.abs(ns.backRankPressure) + EPSILON,
    Math.abs(ns.whiteKingZoneShadow) + EPSILON,
    Math.abs(ns.blackKingZoneShadow) + EPSILON,
    ns.whiteInvasionShadow + EPSILON,
    ns.blackInvasionShadow + EPSILON,
    ns.voidTension + EPSILON,
    Math.abs(ns.negativeSpaceBalance) + EPSILON,
    ns.emptySquareCount + EPSILON
  ];
  const invMatter = matter.map((m) => 1 / m);
  const invShadow = shadow.map((s) => 1 / s);
  const mMedian = sortedMedian(invMatter);
  const mAvg = positiveAvg(invMatter);
  const sMedian = sortedMedian(invShadow);
  const sAvg = positiveAvg(invShadow);
  const maxMed = Math.max(mMedian, sMedian);
  const minMed = Math.min(mMedian, sMedian);
  const convergenceRatio = maxMed > 0 ? minMed / maxMed : 1;
  const allStats = [mMedian, mAvg, sMedian, sAvg];
  const maxStat = Math.max(...allStats);
  const minStat = Math.min(...allStats);
  const envelope = maxStat > 0 ? minStat / maxStat : 1;
  return {
    convergenceRatio,
    confidenceEnvelope: envelope,
    matterInvMedian: mMedian,
    shadowInvMedian: sMedian,
    matterInvAvg: mAvg,
    shadowInvAvg: sAvg
  };
}
function computePiece32FusionSignal(data) {
  if (!data) {
    return { signal: { white: 33, black: 33, draw: 34 }, confidence: 0 };
  }
  const logClamp = (ratio) => Math.max(-1, Math.min(1, Math.log(ratio || 1)));
  const w = {
    activity: 0.15,
    territory: 0.12,
    survival: 0.15,
    coordination: 0.15,
    advancement: 0.1,
    centrality: 0.08,
    captures: 0.08,
    lateMomentum: 0.1,
    development: 0.07
  };
  let whiteSignal = 0;
  whiteSignal += logClamp(data.activityRatio) * w.activity;
  whiteSignal += logClamp(data.territoryRatio) * w.territory;
  whiteSignal += logClamp(data.survivalRatio) * w.survival;
  whiteSignal += logClamp(data.coordinationRatio) * w.coordination;
  whiteSignal += Math.max(-1, Math.min(1, (data.advancementDelta || 0) / 3)) * w.advancement;
  whiteSignal += logClamp(data.centralityRatio) * w.centrality;
  whiteSignal += logClamp(data.captureRatio) * w.captures;
  whiteSignal += logClamp(data.lateMomentumRatio) * w.lateMomentum;
  whiteSignal += logClamp(data.developmentRatio) * w.development;
  const features = [
    logClamp(data.activityRatio),
    logClamp(data.territoryRatio),
    logClamp(data.survivalRatio),
    logClamp(data.coordinationRatio),
    Math.max(-1, Math.min(1, (data.advancementDelta || 0) / 3)),
    logClamp(data.centralityRatio),
    logClamp(data.captureRatio),
    logClamp(data.lateMomentumRatio),
    logClamp(data.developmentRatio)
  ];
  const absSignal = Math.abs(whiteSignal);
  const dirSign = whiteSignal > 0 ? 1 : -1;
  const confirming = features.filter((f) => f * dirSign > 0.02).length;
  const signalConf = Math.min(1, absSignal / 0.3);
  const confirmConf = confirming / 9;
  const confidence = 0.3 * signalConf + 0.7 * confirmConf;
  const advantage = Math.min(20, absSignal * 60);
  const drawPenalty = Math.min(10, absSignal * 30);
  let white, black, draw;
  if (absSignal < 0.03) {
    white = 33;
    black = 33;
    draw = 34;
  } else if (whiteSignal > 0) {
    white = 35 + advantage;
    black = 30 - advantage / 2;
    draw = 35 - drawPenalty;
  } else {
    white = 30 - advantage / 2;
    black = 35 + advantage;
    draw = 35 - drawPenalty;
  }
  return { signal: { white, black, draw }, confidence };
}

// src/lib/chess/colorFlowAnalysis/predictionEngine.ts
var import_archetypeCalibration = require("./archetypeCalibration");
var lastEquilibriumScores = null;
var lastCalibrationReason = "";
function getLastEquilibriumScores() {
  return lastEquilibriumScores;
}
function getLastCalibrationReason() {
  return lastCalibrationReason;
}
function predictFromColorFlow(signature, currentMoveNumber, stockfishEval = 0, stockfishDepth = 18, piece32Data) {
  const effectiveArchetype = (0, import_archetypeCalibration.forceArchetypeAssignment)(
    signature.archetype,
    signature.dominantSide,
    signature.flowDirection,
    signature.intensity
  );
  const archetypeDef = import_archetypeDefinitions2.ARCHETYPE_DEFINITIONS[effectiveArchetype];
  const equilibrium = calculateEquilibriumScores(
    { ...signature, archetype: effectiveArchetype },
    stockfishEval,
    stockfishDepth,
    currentMoveNumber,
    piece32Data || null
  );
  lastEquilibriumScores = equilibrium;
  const sfPrediction = (0, import_archetypeCalibration.getSfPrediction)(stockfishEval);
  const calibration = (0, import_archetypeCalibration.calibrateConfidence)(
    effectiveArchetype,
    equilibrium.prediction,
    sfPrediction,
    equilibrium.finalConfidence,
    stockfishEval
  );
  lastCalibrationReason = calibration.reason;
  let predictedWinner;
  let finalConfidence;
  if (calibration.deferToStockfish) {
    if (sfPrediction === "white_wins") {
      predictedWinner = "white";
    } else if (sfPrediction === "black_wins") {
      predictedWinner = "black";
    } else {
      predictedWinner = "draw";
    }
    finalConfidence = calibration.adjustedConfidence;
  } else {
    if (equilibrium.prediction === "white_wins") {
      predictedWinner = "white";
    } else if (equilibrium.prediction === "black_wins") {
      predictedWinner = "black";
    } else {
      predictedWinner = "draw";
    }
    finalConfidence = calibration.adjustedConfidence;
  }
  if (!equilibrium.highClarity) {
    finalConfidence = Math.max(30, finalConfidence - 8);
  }
  if (currentMoveNumber <= 10) {
    finalConfidence = Math.min(finalConfidence, 38);
  }
  if (currentMoveNumber >= 61) {
    finalConfidence = Math.min(finalConfidence, 45);
  }
  finalConfidence = Math.max(30, Math.min(85, finalConfidence));
  const guidance = generateStrategicGuidance(signature);
  const futureCriticalSquares = predictCriticalSquares(signature);
  const expectedEvolution = describeExpectedEvolution(signature, currentMoveNumber);
  return {
    predictedWinner,
    confidence: finalConfidence,
    lookaheadMoves: archetypeDef.lookaheadConfidence,
    strategicGuidance: guidance,
    futureCriticalSquares,
    expectedEvolution
  };
}
function generateStrategicGuidance(signature) {
  const guidance = [];
  const archetype = signature.archetype;
  switch (archetype) {
    case "kingside_attack":
      guidance.push("Maintain pressure on the h-file and g-file");
      guidance.push("Look for sacrificial breakthroughs near the king");
      break;
    case "queenside_expansion":
      guidance.push("Control the c-file for rook infiltration");
      guidance.push("Advance queenside pawns to create passed pawn");
      break;
    case "central_domination":
      guidance.push("Use central control to restrict opponent mobility");
      guidance.push("Prepare pawn breaks to open lines");
      break;
    case "endgame_technique":
      guidance.push("Activate the king immediately");
      guidance.push("Create or protect passed pawns");
      break;
    default:
      guidance.push("Maintain piece coordination");
      guidance.push("Look for tactical opportunities");
  }
  if (signature.flowDirection === "kingside") {
    guidance.push("Color flow indicates kingside as the decisive theater");
  } else if (signature.flowDirection === "queenside") {
    guidance.push("Color flow indicates queenside expansion opportunity");
  }
  return guidance;
}
function predictCriticalSquares(signature) {
  const squares = [];
  switch (signature.flowDirection) {
    case "kingside":
      squares.push("g4", "h5", "f5", "g7");
      break;
    case "queenside":
      squares.push("c4", "b5", "d5", "c7");
      break;
    case "central":
      squares.push("d4", "e4", "d5", "e5");
      break;
    case "diagonal":
      squares.push("a1", "h8", "a8", "h1");
      break;
    default:
      squares.push("d4", "e5");
  }
  return squares.slice(0, 4);
}
function describeExpectedEvolution(signature, currentMove) {
  const archetype = import_archetypeDefinitions2.ARCHETYPE_DEFINITIONS[signature.archetype];
  const archName = archetype?.name || signature.archetype || "unknown";
  if (currentMove < 15) {
    return `Opening phase suggests ${archName}. Expect color intensity to ${signature.temporalFlow.volatility > 50 ? "increase rapidly" : "develop gradually"} toward the ${signature.flowDirection}.`;
  } else if (currentMove < 30) {
    return `Middlegame ${archName} pattern established. Color flow is ${signature.dominantSide === "contested" ? "evenly contested" : `favoring ${signature.dominantSide}`}. Watch for tactical breaks in the ${signature.flowDirection}.`;
  } else {
    return `Late game ${archName}. Pattern suggests ${signature.dominantSide === "contested" ? "drawing tendencies" : `favorable conversion for ${signature.dominantSide}`}.`;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getLastCalibrationReason,
  getLastEquilibriumScores,
  predictFromColorFlow
});
