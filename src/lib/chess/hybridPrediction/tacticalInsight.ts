/**
 * Tactical Insight Generator
 * 
 * Creates tactical insights from Stockfish analysis
 */

import { Chess, Square } from 'chess.js';
import { PositionAnalysis } from '../stockfishEngine';
import { TacticalInsight } from './types';

/**
 * Create tactical insight from Stockfish position analysis
 */
export function createTacticalInsight(analysis: PositionAnalysis, chess: Chess): TacticalInsight {
  const themes: string[] = [];
  const threats: string[] = [];
  
  // Detect themes from eval and PV
  if (analysis.evaluation.scoreType === 'mate') {
    themes.push('Forced checkmate');
    threats.push(`Mate in ${analysis.evaluation.mateIn}`);
  } else if (Math.abs(analysis.evaluation.score) > 300) {
    themes.push('Winning advantage');
    threats.push('Material or positional dominance');
  }
  
  // Check for captures in PV
  const pvSan = analysis.evaluation.pv.slice(0, 5).map(uci => {
    try {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const testChess = new Chess(chess.fen());
      const move = testChess.move({ from, to, promotion: uci[4] });
      return move?.san || uci;
    } catch {
      return uci;
    }
  });
  
  if (pvSan.some(m => m.includes('x'))) {
    themes.push('Tactical sequence with captures');
  }
  
  if (pvSan.some(m => m.includes('+'))) {
    themes.push('Forcing moves with check');
  }
  
  // Convert best move to SAN
  let bestMoveSan = analysis.bestMove;
  try {
    const from = analysis.bestMove.slice(0, 2) as Square;
    const to = analysis.bestMove.slice(2, 4) as Square;
    const testChess = new Chess(chess.fen());
    const move = testChess.move({ from, to, promotion: analysis.bestMove[4] });
    if (move) bestMoveSan = move.san;
  } catch {}
  
  return {
    bestMove: bestMoveSan,
    evaluation: analysis.evaluation.score,
    mateIn: analysis.evaluation.mateIn,
    principalVariation: pvSan,
    tacticalThemes: themes.length > 0 ? themes : ['Quiet position'],
    immediateThreats: threats.length > 0 ? threats : ['No immediate threats'],
  };
}
