import fs from 'fs';

/**
 * Export A/B test results to CSV and Excel-compatible formats
 */

export function exportToCSV(predictions, filepath) {
  const headers = [
    'timestamp',
    'gameId',
    'baselinePrediction',
    'enhancedPrediction',
    'actualResult',
    'baselineCorrect',
    'enhancedCorrect',
    'baselineArchetype',
    'enhancedArchetype',
    'colorRichness',
    'complexity',
    'sf17Evaluation',
  ];

  const rows = predictions.map(p => [
    p.timestamp || new Date().toISOString(),
    p.gameId,
    p.baselinePrediction,
    p.enhancedPrediction,
    p.actualResult,
    p.baselineCorrect ? 'YES' : 'NO',
    p.enhancedCorrect ? 'YES' : 'NO',
    p.baselineArchetype,
    p.enhancedArchetype,
    p.colorRichness?.toFixed(3) || '0',
    p.complexity?.toFixed(2) || '0',
    p.sf17Evaluation || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(filepath, csv);
  return filepath;
}

export function exportArchetypeSummary(analysis, filepath) {
  const headers = ['archetype', 'count', 'baselineAccuracy', 'enhancedAccuracy', 'improvement', 'significant'];
  
  const rows = analysis.archetypeImprovements.map(a => [
    a.archetype,
    a.count,
    a.baselineAccuracy.toFixed(2),
    a.enhancedAccuracy.toFixed(2),
    a.improvement.toFixed(2),
    a.count >= 10 ? 'YES' : 'NO',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(filepath, csv);
  return filepath;
}

export function generateJSONExport(predictions, analysis, filepath) {
  const export_ = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalPredictions: predictions.length,
      version: '1.0',
    },
    summary: analysis,
    predictions: predictions.map(p => ({
      gameId: p.gameId,
      predictions: {
        baseline: p.baselinePrediction,
        enhanced: p.enhancedPrediction,
      },
      results: {
        actual: p.actualResult,
        baselineCorrect: p.baselineCorrect,
        enhancedCorrect: p.enhancedCorrect,
      },
      archetypes: {
        baseline: p.baselineArchetype,
        enhanced: p.enhancedArchetype,
      },
      metrics: {
        colorRichness: p.colorRichness,
        complexity: p.complexity,
      },
    })),
  };

  fs.writeFileSync(filepath, JSON.stringify(export_, null, 2));
  return filepath;
}
