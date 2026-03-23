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
var import_archetypeDefinitions = require("./archetypeDefinitions");
var import_equilibriumPredictor = require("./equilibriumPredictor");
var import_archetypeCalibration = require("./archetypeCalibration");
var lastEquilibriumScores = null;
var lastCalibrationReason = "";
function getLastEquilibriumScores() {
  return lastEquilibriumScores;
}
function getLastCalibrationReason() {
  return lastCalibrationReason;
}
function predictFromColorFlow(signature, currentMoveNumber, stockfishEval = 0, stockfishDepth = 18, piece32Data, avgPlayerRating) {
  const effectiveArchetype = (0, import_archetypeCalibration.forceArchetypeAssignment)(
    signature.archetype,
    signature.dominantSide,
    signature.flowDirection,
    signature.intensity
  );
  const archetypeDef = import_archetypeDefinitions.ARCHETYPE_DEFINITIONS[effectiveArchetype];
  const equilibrium = (0, import_equilibriumPredictor.calculateEquilibriumScores)(
    { ...signature, archetype: effectiveArchetype },
    stockfishEval,
    stockfishDepth,
    currentMoveNumber,
    piece32Data || null,
    avgPlayerRating
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
  if (currentMoveNumber >= 66) {
    finalConfidence = Math.min(finalConfidence, 38);
  } else if (currentMoveNumber >= 61) {
    finalConfidence = Math.min(finalConfidence, 48);
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
  const archetype = import_archetypeDefinitions.ARCHETYPE_DEFINITIONS[signature.archetype];
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
