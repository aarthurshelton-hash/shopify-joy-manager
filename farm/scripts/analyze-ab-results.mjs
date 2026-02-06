#!/usr/bin/env node
/**
 * A/B Test Results Analyzer - Enhanced
 * 
 * Analyzes prediction data with statistical significance testing,
 * visual comparisons, CSV export, and auto-tuning.
 * 
 * Usage: 
 *   node farm/scripts/analyze-ab-results.mjs
 *   node farm/scripts/analyze-ab-results.mjs --watch
 *   node farm/scripts/analyze-ab-results.mjs --export
 *   node farm/scripts/analyze-ab-results.mjs --deploy-check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculatePValue, calculateConfidenceInterval, calculateCohensD } from '../lib/statistics.mjs';
import { exportToCSV, exportArchetypeSummary, generateJSONExport } from '../lib/export.mjs';
import { AutoTuneSystem } from '../lib/autoTune.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const PREDICTIONS_FILE = path.join(DATA_DIR, 'predictions.json');
const REPORT_FILE = path.join(DATA_DIR, 'ab-test-report.json');
const EXPORT_DIR = path.join(DATA_DIR, 'exports');

// Auto-tune system
const autoTune = new AutoTuneSystem();

// ANSI colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Load and parse prediction data
 */
function loadPredictions() {
  if (!fs.existsSync(PREDICTIONS_FILE)) {
    console.log(`${COLORS.yellow}No predictions file found at ${PREDICTIONS_FILE}${COLORS.reset}`);
    console.log('Run the A/B test farm first: ./farm/scripts/launch-ab-test-farm.sh');
    return null;
  }

  try {
    const data = fs.readFileSync(PREDICTIONS_FILE, 'utf-8');
    const predictions = JSON.parse(data);
    return Array.isArray(predictions) ? predictions : [predictions];
  } catch (error) {
    console.error(`${COLORS.red}Error loading predictions: ${error.message}${COLORS.reset}`);
    return null;
  }
}

/**
 * Analyze A/B test results
 */
function analyzeABResults(predictions) {
  // Filter for A/B test predictions
  const abPredictions = predictions.filter(p => p.abTest === true);
  
  if (abPredictions.length === 0) {
    console.log(`${COLORS.yellow}No A/B test data found in predictions${COLORS.reset}`);
    console.log('Ensure workers are running with USE_ENHANCED=true');
    return null;
  }

  // Calculate accuracy metrics
  const baselineCorrect = abPredictions.filter(p => p.baselineCorrect).length;
  const enhancedCorrect = abPredictions.filter(p => p.enhancedCorrect).length;
  const bothCorrect = abPredictions.filter(p => p.baselineCorrect && p.enhancedCorrect).length;
  const bothWrong = abPredictions.filter(p => !p.baselineCorrect && !p.enhancedCorrect).length;
  const baselineOnly = abPredictions.filter(p => p.baselineCorrect && !p.enhancedCorrect).length;
  const enhancedOnly = abPredictions.filter(p => !p.baselineCorrect && p.enhancedCorrect).length;

  const total = abPredictions.length;

  // Calculate accuracy percentages
  const baselineAccuracy = (baselineCorrect / total) * 100;
  const enhancedAccuracy = (enhancedCorrect / total) * 100;
  const improvement = enhancedAccuracy - baselineAccuracy;

  // Statistical significance testing
  const stats = calculatePValue(baselineCorrect, enhancedCorrect, total);
  const baselineCI = calculateConfidenceInterval(baselineCorrect, total);
  const enhancedCI = calculateConfidenceInterval(enhancedCorrect, total);
  
  // Effect size (Cohen's d)
  const baselineVar = baselineAccuracy * (100 - baselineAccuracy) / 100;
  const enhancedVar = enhancedAccuracy * (100 - enhancedAccuracy) / 100;
  const effectSize = calculateCohensD(baselineAccuracy, enhancedAccuracy, baselineVar, enhancedVar);

  // Archetype-specific analysis
  const archetypeStats = {};
  for (const pred of abPredictions) {
    const arch = pred.enhancedArchetype || pred.baselineArchetype || 'unknown';
    if (!archetypeStats[arch]) {
      archetypeStats[arch] = { count: 0, baseline: 0, enhanced: 0 };
    }
    archetypeStats[arch].count++;
    if (pred.baselineCorrect) archetypeStats[arch].baseline++;
    if (pred.enhancedCorrect) archetypeStats[arch].enhanced++;
  }

  // Find most improved archetypes
  const archetypeImprovements = Object.entries(archetypeStats)
    .filter(([, stats]) => stats.count >= 3) // Minimum sample size
    .map(([archetype, stats]) => ({
      archetype,
      count: stats.count,
      baselineAccuracy: (stats.baseline / stats.count) * 100,
      enhancedAccuracy: (stats.enhanced / stats.count) * 100,
      improvement: ((stats.enhanced - stats.baseline) / stats.count) * 100,
    }))
    .sort((a, b) => b.improvement - a.improvement);

  // Color richness and complexity analysis
  const avgColorRichness = abPredictions.reduce((sum, p) => sum + (p.colorRichness || 0), 0) / total;
  const avgComplexity = abPredictions.reduce((sum, p) => sum + (p.complexity || 0), 0) / total;

  return {
    total,
    baselineAccuracy,
    enhancedAccuracy,
    improvement,
    breakdown: {
      bothCorrect,
      bothWrong,
      baselineOnly,
      enhancedOnly,
    },
    archetypeImprovements,
    avgColorRichness,
    avgComplexity,
    statistics: {
      z: stats.z,
      pValue: stats.pValue,
      significant: stats.significant,
      baselineCI,
      enhancedCI,
    },
    effectSize,
    predictions: abPredictions,
  };
}

/**
 * Generate and print report
 */
function printReport(analysis) {
  if (!analysis) return;

  console.log('\n' + COLORS.bright + '╔══════════════════════════════════════════════════════════════╗' + COLORS.reset);
  console.log(COLORS.bright + '║           A/B TEST RESULTS: 4-Quadrant vs 8-Quadrant         ║' + COLORS.reset);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  console.log(`║  ${COLORS.dim}Total Games Analyzed:${COLORS.reset} ${analysis.total.toString().padEnd(39)} ║`);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  // Accuracy comparison
  console.log(`║  ${COLORS.blue}BASELINE (4-Quadrant)${COLORS.reset}                                        ║`);
  console.log(`║    Accuracy: ${analysis.baselineAccuracy.toFixed(1)}%${''.padEnd(40)} ║`);
  console.log(`║    Correct: ${(analysis.baselineAccuracy * analysis.total / 100).toFixed(0)}/${analysis.total}${''.padEnd(38)} ║`);
  console.log(`║                                                                ║`);
  console.log(`║  ${COLORS.magenta}ENHANCED (8-Quadrant)${COLORS.reset}                                        ║`);
  console.log(`║    Accuracy: ${analysis.enhancedAccuracy.toFixed(1)}%${''.padEnd(40)} ║`);
  console.log(`║    Correct: ${(analysis.enhancedAccuracy * analysis.total / 100).toFixed(0)}/${analysis.total}${''.padEnd(38)} ║`);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  // Improvement
  const improvementColor = analysis.improvement > 0 ? COLORS.green : COLORS.red;
  const improvementIcon = analysis.improvement > 0 ? '▲' : '▼';
  console.log(`║  ${improvementColor}${COLORS.bright}IMPROVEMENT: ${improvementIcon} ${Math.abs(analysis.improvement).toFixed(1)}%${COLORS.reset}${''.padEnd(38)} ║`);
  console.log(`║  ${analysis.improvement > 0 ? 'Enhanced wins!' : 'Baseline still better'}${''.padEnd(43)} ║`);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  // Breakdown
  console.log(`║  ${COLORS.dim}Prediction Breakdown:${COLORS.reset}                                         ║`);
  console.log(`║    Both correct:     ${analysis.breakdown.bothCorrect.toString().padEnd(4)} (${((analysis.breakdown.bothCorrect/analysis.total)*100).toFixed(1)}%)${''.padEnd(30)} ║`);
  console.log(`║    Both wrong:       ${analysis.breakdown.bothWrong.toString().padEnd(4)} (${((analysis.breakdown.bothWrong/analysis.total)*100).toFixed(1)}%)${''.padEnd(30)} ║`);
  console.log(`║    Baseline only:    ${analysis.breakdown.baselineOnly.toString().padEnd(4)} (${((analysis.breakdown.baselineOnly/analysis.total)*100).toFixed(1)}%)${''.padEnd(30)} ║`);
  console.log(`║    Enhanced only:    ${analysis.breakdown.enhancedOnly.toString().padEnd(4)} (${((analysis.breakdown.enhancedOnly/analysis.total)*100).toFixed(1)}%)${''.padEnd(30)} ║`);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  // Enhanced metrics
  console.log(`║  ${COLORS.dim}Enhanced Signature Metrics:${COLORS.reset}                                   ║`);
  console.log(`║    Avg Color Richness: ${(analysis.avgColorRichness * 100).toFixed(1)}%${''.padEnd(35)} ║`);
  console.log(`║    Avg Complexity:     ${analysis.avgComplexity.toFixed(2)} visits/square${''.padEnd(25)} ║`);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  // Auto-tune status
  if (analysis.autoTune) {
    console.log(`║  ${COLORS.dim}Auto-Tune Actions:${COLORS.reset}                                        ║`);
    if (analysis.autoTune.tuned) {
      console.log(`║    ${COLORS.green}✓${COLORS.reset} Weights adjusted${''.padEnd(41)} ║`);
    }
    if (analysis.autoTune.deployed) {
      console.log(`║    ${COLORS.green}🚀${COLORS.reset} System auto-deployed!${''.padEnd(38)} ║`);
    }
    analysis.autoTune.recommendations.forEach(rec => {
      console.log(`║    ${COLORS.yellow}⚠${COLORS.reset} ${rec.substring(0, 54).padEnd(54)} ║`);
    });
    console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  }
  if (analysis.archetypeImprovements.length > 0) {
    console.log(`║  ${COLORS.green}Top Improved Archetypes:${COLORS.reset}                                     ║`);
    analysis.archetypeImprovements.slice(0, 5).forEach(item => {
      const line = `      ${item.archetype}: +${item.improvement.toFixed(1)}% (${item.enhancedAccuracy.toFixed(0)}% vs ${item.baselineAccuracy.toFixed(0)}%)`;
      console.log(`║${line.padEnd(64)} ║`);
    });
    console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  }
  
  // Target comparison
  console.log(`║  ${COLORS.dim}Target: 61% → 76-86% (+15-25%)${COLORS.reset}                            ║`);
  const progress = Math.max(0, Math.min(100, (analysis.improvement / 25) * 100));
  console.log(`║  Progress to target: ${'█'.repeat(Math.floor(progress/5))}${'░'.repeat(20-Math.floor(progress/5))} ${progress.toFixed(0)}%    ║`);
  console.log(COLORS.bright + '╚══════════════════════════════════════════════════════════════╝' + COLORS.reset);
  
  // Recommendations
  console.log('\n' + COLORS.bright + 'Recommendations:' + COLORS.reset);
  if (analysis.improvement > 15) {
    console.log(`${COLORS.green}✓${COLORS.reset} Enhanced system exceeds target improvement!`);
    console.log(`${COLORS.green}✓${COLORS.reset} Consider deploying enhanced system to production`);
  } else if (analysis.improvement > 0) {
    console.log(`${COLORS.yellow}⚠${COLORS.reset} Positive improvement but below target`);
    console.log(`${COLORS.yellow}⚠${COLORS.reset} Continue testing or tune archetype thresholds`);
  } else {
    console.log(`${COLORS.red}✗${COLORS.reset} Enhanced system underperforming`);
    console.log(`${COLORS.red}✗${COLORS.reset} Review piece-type weights and quadrant boundaries`);
  }
  
  if (analysis.total < 100) {
    console.log(`${COLORS.yellow}⚠${COLORS.reset} Sample size (${analysis.total}) too small for statistical significance`);
    console.log(`${COLORS.yellow}⚠${COLORS.reset} Run more tests: ${100 - analysis.total} more games recommended`);
  }
  console.log('');
}

/**
 * Export results to multiple formats
 */
function exportResults(predictions, analysis) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const files = {
    csv: exportToCSV(predictions, path.join(EXPORT_DIR, `predictions-${timestamp}.csv`)),
    archetypes: exportArchetypeSummary(analysis, path.join(EXPORT_DIR, `archetypes-${timestamp}.csv`)),
    json: generateJSONExport(predictions, analysis, path.join(EXPORT_DIR, `full-report-${timestamp}.json`)),
  };
  
  console.log(`\n${COLORS.dim}Exports saved to ${EXPORT_DIR}:${COLORS.reset}`);
  Object.entries(files).forEach(([type, filepath]) => {
    console.log(`  ${COLORS.green}✓${COLORS.reset} ${type}: ${path.basename(filepath)}`);
  });
  
  return files;
}

/**
 * Check deployment readiness
 */
function checkDeployment(analysis) {
  if (!analysis) {
    console.log('\n' + COLORS.yellow + 'No analysis data available for deployment check' + COLORS.reset);
    return false;
  }
  
  const status = autoTune.getStatus();
  
  console.log('\n' + COLORS.bright + '╔══════════════════════════════════════════════════════════════╗' + COLORS.reset);
  console.log(COLORS.bright + '║              DEPLOYMENT READINESS CHECK                     ║' + COLORS.reset);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  
  const checks = [
    { name: 'Sample Size (100+)', pass: analysis.total >= 100 },
    { name: 'Statistical Significance (p < 0.05)', pass: analysis.statistics?.significant },
    { name: 'Target Accuracy (76%+)', pass: analysis.enhancedAccuracy >= 76 },
    { name: 'Improvement (15%+)', pass: analysis.improvement >= 15 },
    { name: 'Effect Size (medium+)', pass: Math.abs(analysis.effectSize) >= 0.5 },
  ];
  
  checks.forEach(check => {
    const icon = check.pass ? COLORS.green + '✓' + COLORS.reset : COLORS.red + '✗' + COLORS.reset;
    console.log(`║  ${icon} ${check.name.padEnd(50)} ║`);
  });
  
  const ready = checks.every(c => c.pass);
  console.log(COLORS.bright + '╠══════════════════════════════════════════════════════════════╣' + COLORS.reset);
  console.log(`║  ${ready ? COLORS.green + 'READY FOR DEPLOYMENT!' : COLORS.yellow + 'NOT READY - Continue Testing'}${COLORS.reset}${''.padEnd(ready ? 35 : 32)} ║`);
  console.log(COLORS.bright + '╚══════════════════════════════════════════════════════════════╝' + COLORS.reset);
  
  if (analysis.autoTune?.deployed) {
    console.log(`\n${COLORS.green}${COLORS.bright}🚀 Enhanced system has been AUTO-DEPLOYED!${COLORS.reset}`);
  }
  
  return ready;
}

/**
 * Save detailed report to JSON
 */
function saveReport(analysis) {
  if (!analysis) return;
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalGames: analysis.total,
      baselineAccuracy: analysis.baselineAccuracy,
      enhancedAccuracy: analysis.enhancedAccuracy,
      improvement: analysis.improvement,
    },
    statistics: analysis.statistics,
    effectSize: analysis.effectSize,
    breakdown: analysis.breakdown,
    archetypeAnalysis: analysis.archetypeImprovements,
    metrics: {
      avgColorRichness: analysis.avgColorRichness,
      avgComplexity: analysis.avgComplexity,
    },
    autoTune: analysis.autoTune,
    deploymentStatus: autoTune.getStatus(),
  };
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`${COLORS.dim}Report saved to: ${REPORT_FILE}${COLORS.reset}\n`);
}

/**
 * Watch mode - continuously monitor results
 */
function watchMode() {
  console.log(`${COLORS.cyan}Watch mode enabled - updating every 30 seconds${COLORS.reset}`);
  console.log('Press Ctrl+C to exit\n');
  
  const run = () => {
    console.clear();
    const predictions = loadPredictions();
    if (predictions) {
      const analysis = analyzeABResults(predictions);
      printReport(analysis);
      saveReport(analysis);
    }
  };
  
  run();
  setInterval(run, 30000);
}

/**
 * Main
 */
const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');
const shouldExport = args.includes('--export') || args.includes('-e');
const deployCheck = args.includes('--deploy-check') || args.includes('-d');

console.log('\n' + COLORS.bright + 'En Pensent A/B Test Analyzer' + COLORS.reset);
console.log(COLORS.dim + 'Comparing 4-Quadrant vs 8-Quadrant Signature Systems\n' + COLORS.reset);

if (isWatch) {
  watchMode();
} else {
  const predictions = loadPredictions();
  if (predictions) {
    const analysis = analyzeABResults(predictions);
    printReport(analysis);
    saveReport(analysis);
    
    if (shouldExport) {
      exportResults(predictions, analysis);
    }
    
    checkDeployment(analysis);
  }
}
