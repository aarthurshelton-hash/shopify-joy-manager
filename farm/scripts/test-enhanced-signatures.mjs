#!/usr/bin/env node
/**
 * Quick Test for Enhanced 8-Quadrant Signature System
 * 
 * Validates that the enhanced signature extractor works correctly
 * and demonstrates the 12-color palette with 8-quadrant analysis.
 */

import { simulateGame } from '../dist/lib/chess/gameSimulator.js';
import { extractEnhancedColorFlowSignature, compareEnhancedProfiles } from '../dist/lib/chess/colorFlowAnalysis/enhancedSignatureExtractor.js';

// Test PGNs representing different strategic patterns
const testGames = [
  {
    name: 'Kingside Attack (Rook Lift)',
    pgn: '[White "Test"][Black "Test"] 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. d5 Nb4 15. Bb1 a5 16. a3 Na6 17. b4 Bd7 18. Bb2 Rfc8 19. Bc2 Nc7 20. Nb1 Na6 21. Nc3 Nc7',
    expectedArchetype: 'kingside_attack',
  },
  {
    name: 'Queenside Pressure',
    pgn: '[White "Test"][Black "Test"] 1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. Be2 Bb7 9. Bxf6 Bxf6 10. cxd5 exd5 11. O-O Qe7 12. Qb3 Rd8 13. Rfd1 c5 14. dxc5 bxc5 15. Nb5 Na6 16. Rac1 Nc7 17. Nxc7 Qxc7 18. Qa4 a5 19. b3 Qb6 20. Rd2 Bc6 21. Qc2 d4',
    expectedArchetype: 'queenside_pressure',
  },
  {
    name: 'Bishop Pair Mastery',
    pgn: '[White "Test"][Black "Test"] 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. d3 d6 7. c3 O-O 8. Re1 Bg4 9. Nbd2 d5 10. h3 Bh5 11. exd5 Qxd5 12. Qe2 Bg6 13. Bxc6 Qxc6 14. Nxe5 Qe6 15. Nxg6 Qxg6 16. Qf1 Rfe8 17. Ne4 Nxe4 18. dxe4 Bc5 19. Be3 Bxe3 20. Rxe3 Rad8 21. Rae1',
    expectedArchetype: 'bishop_pair_mastery',
  },
];

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     ENHANCED 8-QUADRANT SIGNATURE SYSTEM - VALIDATION        ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log('║                                                              ║');
console.log('║  Testing: 12-color palette + 8-quadrant analysis            ║');
console.log('║  Expected: Richer signatures with piece-type awareness        ║');
console.log('║                                                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let allPassed = true;
const results = [];

for (const test of testGames) {
  try {
    console.log(`▶ Testing: ${test.name}`);
    
    // Simulate game
    const simulation = simulateGame(test.pgn);
    
    // Extract enhanced signature
    const signature = extractEnhancedColorFlowSignature(simulation);
    
    // Validate results
    const hasFingerprint = signature.fingerprint.startsWith('ep8-');
    const has8Quadrants = Object.keys(signature.quadrantProfile).length >= 8;
    const hasPieceMetrics = 
      typeof signature.quadrantProfile.bishop_dominance === 'number' &&
      typeof signature.quadrantProfile.knight_dominance === 'number';
    
    const passed = hasFingerprint && has8Quadrants && hasPieceMetrics;
    allPassed = allPassed && passed;
    
    results.push({
      name: test.name,
      fingerprint: signature.fingerprint,
      archetype: signature.archetype,
      colorRichness: (signature.colorRichness * 100).toFixed(1) + '%',
      complexity: signature.complexity.toFixed(2),
      passed,
    });
    
    console.log(`  Fingerprint: ${signature.fingerprint}`);
    console.log(`  Archetype:   ${signature.archetype}`);
    console.log(`  Color Richness: ${(signature.colorRichness * 100).toFixed(1)}% (piece types used)`);
    console.log(`  Complexity:     ${signature.complexity.toFixed(2)} (avg visits/square)`);
    
    // Show 8-quadrant breakdown
    const qp = signature.quadrantProfile;
    console.log('  8-Quadrant Profile:');
    console.log(`    Q1 Kingside White:    ${qp.q1_kingside_white.toFixed(1)}`);
    console.log(`    Q2 Queenside White:   ${qp.q2_queenside_white.toFixed(1)}`);
    console.log(`    Q3 Kingside Black:    ${qp.q3_kingside_black.toFixed(1)}`);
    console.log(`    Q4 Queenside Black:   ${qp.q4_queenside_black.toFixed(1)}`);
    console.log(`    Q5 Center White:      ${qp.q5_center_white.toFixed(1)}`);
    console.log(`    Q6 Center Black:      ${qp.q6_center_black.toFixed(1)}`);
    console.log(`    Q7 Extended Kingside: ${qp.q7_extended_kingside.toFixed(1)}`);
    console.log(`    Q8 Extended Queenside: ${qp.q8_extended_queenside.toFixed(1)}`);
    
    // Show piece-type metrics
    console.log('  Piece-Type Dominance:');
    console.log(`    Bishop: ${(qp.bishop_dominance * 100).toFixed(1)}%`);
    console.log(`    Knight: ${(qp.knight_dominance * 100).toFixed(1)}%`);
    console.log(`    Rook:   ${(qp.rook_dominance * 100).toFixed(1)}%`);
    console.log(`    Queen:  ${(qp.queen_dominance * 100).toFixed(1)}%`);
    console.log(`    Pawn Advancement: ${(qp.pawn_advancement * 100).toFixed(1)}%`);
    
    console.log(`  ✓ ${passed ? 'PASSED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.error(`  ✗ ERROR: ${error.message}\n`);
    allPassed = false;
  }
}

// Test profile comparison
console.log('▶ Testing profile comparison...');
try {
  const sim1 = simulateGame(testGames[0].pgn);
  const sim2 = simulateGame(testGames[1].pgn);
  
  const sig1 = extractEnhancedColorFlowSignature(sim1);
  const sig2 = extractEnhancedColorFlowSignature(sim2);
  
  const similarity = compareEnhancedProfiles(sig1.quadrantProfile, sig2.quadrantProfile);
  console.log(`  Similarity between different games: ${(similarity * 100).toFixed(1)}%`);
  console.log(`  ✓ Profile comparison working\n`);
} catch (error) {
  console.error(`  ✗ ERROR: ${error.message}\n`);
  allPassed = false;
}

// Summary
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                      VALIDATION SUMMARY                      ║');
console.log('╠══════════════════════════════════════════════════════════════╣');

for (const r of results) {
  const status = r.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`║  ${status} - ${r.name.padEnd(45)} ║`);
}

console.log('╠══════════════════════════════════════════════════════════════╣');

if (allPassed) {
  console.log('║  ✓ ALL TESTS PASSED                                          ║');
  console.log('║                                                              ║');
  console.log('║  Enhanced 8-quadrant system is ready for A/B testing!        ║');
  console.log('║  Run: ./farm/scripts/launch-ab-test-farm.sh                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  process.exit(0);
} else {
  console.log('║  ✗ SOME TESTS FAILED                                         ║');
  console.log('║  Check output above for details                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  process.exit(1);
}
