/**
 * Historical Game Importer v1.0
 * 
 * Batch import of games from Lichess and Chess.com
 * for cross-domain pattern learning
 * 
 * Integrates with:
 * - multiSourceFetcher for game retrieval
 * - crossDomainLearningPipeline for pattern extraction
 * - patternDatabase for signature storage
 */

import { UnifiedGameData, fetchMultiSourceGames } from '@/lib/chess/gameImport/multiSourceFetcher';
import { crossDomainLearningPipeline } from './crossDomainLearningPipeline';
import { supabase } from '@/integrations/supabase/client';

export interface ImportProgress {
  totalGames: number;
  processedGames: number;
  patternsExtracted: number;
  crossDomainLessons: number;
  errors: string[];
  status: 'idle' | 'importing' | 'complete' | 'error';
  startTime?: Date;
  endTime?: Date;
}

export interface ImportOptions {
  sources: ('lichess' | 'chesscom')[];
  targetCount: number;
  minElo?: number;
  gameTypes?: ('bullet' | 'blitz' | 'rapid' | 'classical')[];
  learnFromOutcomes?: boolean;
}

class HistoricalGameImporter {
  private progress: ImportProgress = {
    totalGames: 0,
    processedGames: 0,
    patternsExtracted: 0,
    crossDomainLessons: 0,
    errors: [],
    status: 'idle',
  };

  private subscribers: Set<(progress: ImportProgress) => void> = new Set();

  /**
   * Import historical games from specified sources
   */
  async importGames(options: ImportOptions): Promise<ImportProgress> {
    this.progress = {
      totalGames: options.targetCount,
      processedGames: 0,
      patternsExtracted: 0,
      crossDomainLessons: 0,
      errors: [],
      status: 'importing',
      startTime: new Date(),
    };

    this.notifySubscribers();

    try {
      console.log(`[HistoricalImporter] Starting import: ${options.targetCount} games from ${options.sources.join(', ')}`);

      // Fetch games in batches
      const batchSize = 50;
      const batches = Math.ceil(options.targetCount / batchSize);

      for (let i = 1; i <= batches; i++) {
        const remainingCount = Math.min(batchSize, options.targetCount - this.progress.processedGames);

        try {
          const result = await fetchMultiSourceGames({
            targetCount: remainingCount,
            batchNumber: i,
            sources: options.sources,
          });

          // Filter by ELO if specified
          let games = result.games;
          if (options.minElo) {
            games = games.filter(g => 
              (g.whiteElo || 0) >= options.minElo! && 
              (g.blackElo || 0) >= options.minElo!
            );
          }

          // Filter by game type if specified
          if (options.gameTypes?.length) {
            games = games.filter(g => 
              options.gameTypes!.includes(g.speed as any)
            );
          }

          // Process games through learning pipeline
          const learningResult = await crossDomainLearningPipeline.importHistoricalGames(games);

          this.progress.processedGames += games.length;
          this.progress.patternsExtracted += learningResult.patternsExtracted;
          this.progress.crossDomainLessons += learningResult.crossDomainLessons;
          this.progress.errors.push(...result.errors.slice(0, 5)); // Limit errors

          this.notifySubscribers();

          console.log(`[HistoricalImporter] Batch ${i}/${batches}: ${games.length} games → ${learningResult.crossDomainLessons} lessons`);

          // Persist progress periodically
          if (i % 5 === 0) {
            await this.persistProgress();
          }

          // Rate limiting delay
          await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          this.progress.errors.push(`Batch ${i}: ${errorMsg}`);
          console.error(`[HistoricalImporter] Batch ${i} error:`, error);
        }
      }

      this.progress.status = 'complete';
      this.progress.endTime = new Date();

      // Final persistence
      await this.persistProgress();

      console.log(`[HistoricalImporter] Complete: ${this.progress.processedGames} games → ${this.progress.crossDomainLessons} lessons`);

    } catch (error) {
      this.progress.status = 'error';
      this.progress.errors.push(error instanceof Error ? error.message : 'Import failed');
      console.error('[HistoricalImporter] Import failed:', error);
    }

    this.notifySubscribers();
    return this.getProgress();
  }

  /**
   * Quick import from database-stored games
   */
  async importFromDatabase(limit: number = 1000): Promise<ImportProgress> {
    this.progress = {
      totalGames: limit,
      processedGames: 0,
      patternsExtracted: 0,
      crossDomainLessons: 0,
      errors: [],
      status: 'importing',
      startTime: new Date(),
    };

    this.notifySubscribers();

    try {
      // Fetch prediction attempts with game data
      const { data, error } = await supabase
        .from('chess_prediction_attempts')
        .select('game_id, game_name, pgn, fen, actual_result, hybrid_archetype, white_elo, black_elo, time_control')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!data?.length) {
        this.progress.status = 'complete';
        this.progress.endTime = new Date();
        return this.getProgress();
      }

      console.log(`[HistoricalImporter] Found ${data.length} games in database`);

      // Convert to UnifiedGameData format
      const games: UnifiedGameData[] = data.map(row => ({
        gameId: row.game_id,
        pgn: row.pgn || '',
        source: row.game_id.startsWith('cc_') ? 'chesscom' : 'lichess',
        winner: row.actual_result === 'white_wins' ? 'white' : 
                row.actual_result === 'black_wins' ? 'black' : undefined,
        result: row.actual_result === 'white_wins' ? '1-0' : 
                row.actual_result === 'black_wins' ? '0-1' : '1/2-1/2',
        whiteElo: row.white_elo || undefined,
        blackElo: row.black_elo || undefined,
        timeControl: row.time_control || undefined,
        speed: this.inferSpeed(row.time_control),
      }));

      // Process through learning pipeline
      const result = await crossDomainLearningPipeline.importHistoricalGames(games);

      this.progress.processedGames = games.length;
      this.progress.patternsExtracted = result.patternsExtracted;
      this.progress.crossDomainLessons = result.crossDomainLessons;
      this.progress.status = 'complete';
      this.progress.endTime = new Date();

      await this.persistProgress();

    } catch (error) {
      this.progress.status = 'error';
      this.progress.errors.push(error instanceof Error ? error.message : 'Database import failed');
      console.error('[HistoricalImporter] Database import failed:', error);
    }

    this.notifySubscribers();
    return this.getProgress();
  }

  /**
   * Infer speed from time control string
   */
  private inferSpeed(timeControl?: string | null): string {
    if (!timeControl) return 'unknown';
    
    const match = timeControl.match(/^(\d+)/);
    if (!match) return 'unknown';
    
    const baseTime = parseInt(match[1], 10);
    if (baseTime < 60) return 'ultrabullet';
    if (baseTime < 180) return 'bullet';
    if (baseTime < 480) return 'blitz';
    if (baseTime < 1200) return 'rapid';
    return 'classical';
  }

  /**
   * Persist progress to database
   */
  private async persistProgress(): Promise<void> {
    try {
      await supabase.from('evolution_state').insert({
        state_type: 'historical_import',
        genes: {
          processedGames: this.progress.processedGames,
          patternsExtracted: this.progress.patternsExtracted,
          crossDomainLessons: this.progress.crossDomainLessons,
          errorCount: this.progress.errors.length,
        },
        generation: 1,
        fitness_score: this.progress.patternsExtracted / Math.max(1, this.progress.processedGames),
        last_mutation_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      console.warn('[HistoricalImporter] Failed to persist progress:', error);
    }
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(callback: (progress: ImportProgress) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getProgress());
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const progress = this.getProgress();
    this.subscribers.forEach(cb => cb(progress));
  }

  /**
   * Get current progress
   */
  getProgress(): ImportProgress {
    return { ...this.progress };
  }

  /**
   * Check if import is in progress
   */
  isImporting(): boolean {
    return this.progress.status === 'importing';
  }

  /**
   * Calculate import rate (games per minute)
   */
  getImportRate(): number {
    if (!this.progress.startTime || this.progress.processedGames === 0) return 0;
    
    const elapsedMs = Date.now() - this.progress.startTime.getTime();
    const elapsedMin = elapsedMs / 60000;
    
    return elapsedMin > 0 ? this.progress.processedGames / elapsedMin : 0;
  }
}

// Singleton export
export const historicalGameImporter = new HistoricalGameImporter();
