/**
 * Bias Detection System for En Pensent Benchmarks
 * 
 * Real-time monitoring of prediction color bias
 */

export interface ColorBiasMetrics {
  whitePredictionRate: number;
  blackPredictionRate: number;
  drawPredictionRate: number;
  biasScore: number;
  isBalanced: boolean;
}

export interface PredictionAttempt {
  hybridPrediction?: 'white_wins' | 'black_wins' | 'draw';
  actualResult?: 'white_wins' | 'black_wins' | 'draw';
  [key: string]: any;
}

export function detectColorBias(predictions: PredictionAttempt[]): ColorBiasMetrics {
  const total = predictions.length;
  if (total === 0) {
    return {
      whitePredictionRate: 0,
      blackPredictionRate: 0,
      drawPredictionRate: 0,
      biasScore: 100,
      isBalanced: false,
    };
  }
  
  const whiteCount = predictions.filter(p => p.hybridPrediction === 'white_wins').length;
  const blackCount = predictions.filter(p => p.hybridPrediction === 'black_wins').length;
  const drawCount = predictions.filter(p => p.hybridPrediction === 'draw').length;
  
  const whiteRate = (whiteCount / total) * 100;
  const blackRate = (blackCount / total) * 100;
  const drawRate = (drawCount / total) * 100;
  
  // Target: 50% white, 35% black, 15% draw
  const whiteDeviation = Math.abs(whiteRate - 50);
  const blackDeviation = Math.abs(blackRate - 35);
  const drawDeviation = Math.abs(drawRate - 15);
  
  const biasScore = (whiteDeviation + blackDeviation + drawDeviation) / 3;
  const isBalanced = biasScore < 15;
  
  return {
    whitePredictionRate: whiteRate,
    blackPredictionRate: blackRate,
    drawPredictionRate: drawRate,
    biasScore,
    isBalanced,
  };
}

export function logBiasWarning(metrics: ColorBiasMetrics): void {
  if (!metrics.isBalanced) {
    console.warn(`⚠️ COLOR BIAS DETECTED: Score ${metrics.biasScore.toFixed(1)}%`);
    console.warn(`  Distribution: W:${metrics.whitePredictionRate.toFixed(1)}% B:${metrics.blackPredictionRate.toFixed(1)}% D:${metrics.drawPredictionRate.toFixed(1)}%`);
    console.warn(`  Target: W:50% B:35% D:15%`);
  }
}
