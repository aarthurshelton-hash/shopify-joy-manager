/**
 * Persistent Pattern Loader v7.13
 * 
 * Loads learned patterns from the database into the in-memory pattern system.
 * Ensures En Pensent's predictions leverage ALL historical knowledge from
 * the 802+ validated positions in chess_prediction_attempts.
 * 
 * v7.13: Added timeout protection to prevent DB calls from blocking pipeline
 */

import { supabase } from '@/integrations/supabase/client';
import { patternDatabase } from './patternDatabase';
import { PatternRecord } from './types';
import { StrategicArchetype } from '../colorFlowAnalysis';

// v7.14-FAST: Reduced timeouts for faster benchmark startup
const DB_TIMEOUT_MS = 8000; // 8 seconds max (was 15s)
const MAX_PAGES = 5; // v7.14: Limit to 5 pages (was 10)

function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms)
    )
  ]);
}

interface LearnedPattern {
  id: string;
  fen: string;
  hybrid_archetype: string | null;
  hybrid_confidence: number | null;
  hybrid_correct: boolean | null;
  actual_result: string;
  lesson_learned: Record<string, unknown> | null;
  stockfish_correct: boolean | null;
}

// Track if we've loaded patterns this session
let patternsLoaded = false;
let loadedPatternCount = 0;

/**
 * Load all learned patterns from the database into the in-memory pattern system
 * This ensures predictions use historical knowledge from all 802+ validated positions
 */
export async function loadLearnedPatterns(): Promise<{
  loaded: number;
  hybridWins: number;
  stockfishWins: number;
  totalAccuracy: number;
}> {
  if (patternsLoaded && loadedPatternCount > 0) {
    console.log(`[PatternLoader] Already loaded ${loadedPatternCount} patterns this session`);
    return {
      loaded: loadedPatternCount,
      hybridWins: 0,
      stockfishWins: 0,
      totalAccuracy: 0,
    };
  }

  console.log('[PatternLoader] Loading patterns (fast mode)...');
  
  const patterns: LearnedPattern[] = [];
  let from = 0;
  const pageSize = 500;
  let hasMore = true;
  let pageCount = 0;

  // v7.14: Fast pagination with reduced limits
  while (hasMore && pageCount < MAX_PAGES) {
    pageCount++;
    
    try {
      // v7.13: Create proper Promise with timeout
      const fetchPage = async () => {
        return await supabase
          .from('chess_prediction_attempts')
          .select('id, fen, hybrid_archetype, hybrid_confidence, hybrid_correct, actual_result, lesson_learned, stockfish_correct')
          .range(from, from + pageSize - 1);
      };
      
      const result = await withTimeout(
        fetchPage(),
        DB_TIMEOUT_MS,
        `PatternPage${pageCount}`
      );

      if (result.error) {
        console.error('[PatternLoader] Error loading patterns:', result.error);
        break;
      }

      if (!result.data || result.data.length === 0) {
        hasMore = false;
        break;
      }

      patterns.push(...(result.data as LearnedPattern[]));
      from += pageSize;
      hasMore = result.data.length === pageSize;
    } catch (err) {
      console.warn(`[PatternLoader] Page ${pageCount} failed (timeout?):`, err);
      // Continue with what we have rather than failing completely
      break;
    }
  }

  // Calculate statistics
  let hybridWins = 0;
  let stockfishWins = 0;
  let hybridCorrect = 0;

  for (const pattern of patterns) {
    // Count wins
    if (pattern.hybrid_correct && !pattern.stockfish_correct) {
      hybridWins++;
    }
    if (pattern.stockfish_correct && !pattern.hybrid_correct) {
      stockfishWins++;
    }
    if (pattern.hybrid_correct) {
      hybridCorrect++;
    }

    // Inject learned patterns into the in-memory database
    // Focus on patterns where we were correct - these are validated insights
    if (pattern.hybrid_correct && pattern.hybrid_archetype) {
      const outcome = normalizeOutcome(pattern.actual_result);
      const archetype = normalizeArchetype(pattern.hybrid_archetype);
      
      if (outcome && archetype) {
        // Create a synthetic pattern record from the learned prediction
        const syntheticPattern: PatternRecord = {
          id: pattern.id,
          fingerprint: pattern.fen.substring(0, 20), // Use FEN as fingerprint
          archetype,
          outcome,
          totalMoves: 30, // Estimate
          characteristics: {
            flowDirection: 'balanced',
            intensity: pattern.hybrid_confidence || 0.5,
            volatility: 0.3,
            dominantSide: outcome === 'white_wins' ? 'white' : outcome === 'black_wins' ? 'black' : 'contested',
            centerControl: 0.5,
            kingsideActivity: 0.5,
            queensideActivity: 0.5,
          },
          gameMetadata: {
            event: 'Learned Pattern',
            white: 'GM',
            black: 'GM',
          },
        };

        // Add to in-memory database for pattern matching
        patternDatabase.injectLearnedPattern(syntheticPattern);
      }
    }
  }

  const totalAccuracy = patterns.length > 0 ? (hybridCorrect / patterns.length) * 100 : 0;

  patternsLoaded = true;
  loadedPatternCount = patterns.length;

  console.log(`[PatternLoader] Loaded ${patterns.length} patterns:`);
  console.log(`  - Hybrid wins over Stockfish: ${hybridWins}`);
  console.log(`  - Stockfish wins over Hybrid: ${stockfishWins}`);
  console.log(`  - Overall accuracy: ${totalAccuracy.toFixed(1)}%`);

  return {
    loaded: patterns.length,
    hybridWins,
    stockfishWins,
    totalAccuracy,
  };
}

/**
 * Get archetype-specific insights from historical data
 */
export async function getArchetypeInsights(archetype: string): Promise<{
  accuracy: number;
  sampleSize: number;
  bestConfidenceThreshold: number;
  beatsStockfishRate: number;
}> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('hybrid_correct, hybrid_confidence, stockfish_correct')
    .eq('hybrid_archetype', archetype);

  if (error || !data || data.length === 0) {
    return {
      accuracy: 50,
      sampleSize: 0,
      bestConfidenceThreshold: 0.5,
      beatsStockfishRate: 0,
    };
  }

  const correct = data.filter(d => d.hybrid_correct).length;
  const beatsStockfish = data.filter(d => d.hybrid_correct && !d.stockfish_correct).length;
  
  // Find optimal confidence threshold
  const confidences = data.map(d => d.hybrid_confidence || 0.5);
  const avgConfidenceWhenCorrect = data
    .filter(d => d.hybrid_correct)
    .reduce((sum, d) => sum + (d.hybrid_confidence || 0.5), 0) / Math.max(1, correct);

  return {
    accuracy: (correct / data.length) * 100,
    sampleSize: data.length,
    bestConfidenceThreshold: avgConfidenceWhenCorrect,
    beatsStockfishRate: (beatsStockfish / data.length) * 100,
  };
}

/**
 * Get patterns where En Pensent beat Stockfish (breakthrough cases)
 */
export async function getBreakthroughPatterns(): Promise<{
  count: number;
  archetypes: Record<string, number>;
  avgConfidence: number;
}> {
  const { data, error } = await supabase
    .from('chess_prediction_attempts')
    .select('hybrid_archetype, hybrid_confidence')
    .eq('hybrid_correct', true)
    .eq('stockfish_correct', false);

  if (error || !data) {
    return { count: 0, archetypes: {}, avgConfidence: 0 };
  }

  const archetypes: Record<string, number> = {};
  let totalConfidence = 0;

  for (const d of data) {
    const arch = d.hybrid_archetype || 'Unknown';
    archetypes[arch] = (archetypes[arch] || 0) + 1;
    totalConfidence += d.hybrid_confidence || 0.5;
  }

  return {
    count: data.length,
    archetypes,
    avgConfidence: data.length > 0 ? totalConfidence / data.length : 0,
  };
}

/**
 * Reset the loaded state (for testing)
 */
export function resetPatternLoader(): void {
  patternsLoaded = false;
  loadedPatternCount = 0;
}

/**
 * Normalize outcome string to standard format
 */
function normalizeOutcome(result: string): 'white_wins' | 'black_wins' | 'draw' | null {
  const lower = result.toLowerCase();
  if (lower === 'white' || lower === 'white_wins') return 'white_wins';
  if (lower === 'black' || lower === 'black_wins') return 'black_wins';
  if (lower === 'draw') return 'draw';
  return null;
}

/**
 * Normalize archetype string to valid StrategicArchetype
 */
function normalizeArchetype(archetype: string): StrategicArchetype | null {
  const validArchetypes: StrategicArchetype[] = [
    'kingside_attack',
    'queenside_expansion', 
    'central_domination',
    'prophylactic_defense',
    'pawn_storm',
    'piece_harmony',
    'opposite_castling',
    'closed_maneuvering',
    'open_tactical',
    'endgame_technique',
    'sacrificial_attack',
    'positional_squeeze',
    'unknown',
  ];
  
  const lower = archetype.toLowerCase().replace(/\s+/g, '_');
  
  // Direct match
  if (validArchetypes.includes(lower as StrategicArchetype)) {
    return lower as StrategicArchetype;
  }
  
  // Fuzzy match
  for (const valid of validArchetypes) {
    if (lower.includes(valid) || valid.includes(lower)) {
      return valid;
    }
  }
  
  return 'unknown';
}
