/**
 * Simple JSON File Storage for Farm Workers
 * 
 * No Supabase credentials needed
 * No SQLite dependencies
 * Just writes to JSON files locally
 */

import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', '..', 'farm', 'data');
const PREDICTIONS_FILE = (workerId) => join(DATA_DIR, `predictions-${workerId}.json`);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Save prediction to worker-specific JSON file
 */
export async function savePredictionLocal(attempt, workerId) {
  const filePath = PREDICTIONS_FILE(workerId);
  
  try {
    // Read existing predictions for this worker
    let predictions = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      predictions = JSON.parse(data);
    }
    
    // Add new prediction with A/B test data
    predictions.push({
      game_id: attempt.gameId,
      worker_id: workerId,
      fen: attempt.fen,
      sf17_evaluation: attempt.sf17Eval,
      baselinePrediction: attempt.baselinePrediction,
      enhancedPrediction: attempt.enhancedPrediction,
      sf17_prediction: attempt.sf17Prediction,
      actual_outcome: attempt.actualOutcome,
      baselineCorrect: attempt.baselineCorrect,
      enhancedCorrect: attempt.enhancedCorrect,
      sf17_correct: attempt.sf17Correct,
      baselineArchetype: attempt.baselineArchetype,
      enhancedArchetype: attempt.enhancedArchetype,
      colorRichness: attempt.colorRichness,
      complexity: attempt.complexity,
      abTest: attempt.abTest || false,
      eightQuadrantProfile: attempt.eightQuadrantProfile || null,
      pieceTypeMetrics: attempt.pieceTypeMetrics || null,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 predictions per worker
    if (predictions.length > 1000) {
      predictions = predictions.slice(-1000);
    }
    
    // Write back to worker-specific file
    fs.writeFileSync(filePath, JSON.stringify(predictions, null, 2));
    
    return true;
  } catch (error) {
    console.error(`[${workerId}] Save error:`, error.message);
    return false;
  }
}

/**
 * Get prediction statistics (aggregates across all workers)
 */
export function getLocalStats(workerId) {
  try {
    // If workerId provided, get stats for that worker only
    if (workerId) {
      const filePath = PREDICTIONS_FILE(workerId);
      if (!fs.existsSync(filePath)) {
        return { total: 0, epCorrect: 0, sf17Correct: 0, epAccuracy: '0.0', sf17Accuracy: '0.0', recent: [] };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const predictions = JSON.parse(data);
      
      const total = predictions.length;
      const epCorrect = predictions.filter(p => p.enhancedCorrect).length;
      const sf17Correct = predictions.filter(p => p.sf17_correct).length;
      
      return {
        total,
        epCorrect,
        sf17Correct,
        epAccuracy: total > 0 ? ((epCorrect / total) * 100).toFixed(1) : '0.0',
        sf17Accuracy: total > 0 ? ((sf17Correct / total) * 100).toFixed(1) : '0.0',
        recent: predictions.slice(-10)
      };
    }
    
    // Aggregate across all worker files
    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('predictions-') && f.endsWith('.json'));
    let allPredictions = [];
    
    for (const file of files) {
      try {
        const data = fs.readFileSync(join(DATA_DIR, file), 'utf8');
        const predictions = JSON.parse(data);
        allPredictions = allPredictions.concat(predictions);
      } catch (e) {
        // Skip corrupted files
      }
    }
    
    const total = allPredictions.length;
    const epCorrect = allPredictions.filter(p => p.enhancedCorrect).length;
    const sf17Correct = allPredictions.filter(p => p.sf17_correct).length;
    
    return {
      total,
      epCorrect,
      sf17Correct,
      epAccuracy: total > 0 ? ((epCorrect / total) * 100).toFixed(1) : '0.0',
      sf17Accuracy: total > 0 ? ((sf17Correct / total) * 100).toFixed(1) : '0.0',
      recent: allPredictions.slice(-10),
      workers: files.length
    };
  } catch (error) {
    console.error('Stats error:', error.message);
    return { total: 0, epCorrect: 0, sf17Correct: 0, epAccuracy: '0.0', sf17Accuracy: '0.0', recent: [] };
  }
}

/**
 * Export data for dashboard (aggregates all workers)
 */
export function exportForDashboard() {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('predictions-') && f.endsWith('.json'));
    let allPredictions = [];
    
    for (const file of files) {
      try {
        const data = fs.readFileSync(join(DATA_DIR, file), 'utf8');
        const predictions = JSON.parse(data);
        allPredictions = allPredictions.concat(predictions);
      } catch (e) {
        // Skip corrupted files
      }
    }
    
    // Sort by timestamp and return last 100
    return allPredictions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);
  } catch (error) {
    return [];
  }
}
