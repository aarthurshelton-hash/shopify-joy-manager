import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveChessStats {
  totalPredictions: number;
  epAccuracy: number;
  sfAccuracy: number;
  epEdge: number;
  goldenZoneEP: number;
  goldenZoneSF: number;
  goldenZoneCount: number;
  epRecoveryRate: number;
  bestArchetype: {
    name: string;
    epAccuracy: number;
    sfAccuracy: number;
    edge: number;
    count: number;
  };
  chess960Total: number;
  chess960EP: number;
  chess960SF: number;
}

export function useLiveChessStats() {
  return useQuery<LiveChessStats>({
    queryKey: ['live-chess-stats'],
    queryFn: async () => {
      // 1. Fetch headline stats from the server-side audit view (accurate full-dataset numbers)
      const { data: headline, error: headlineError } = await supabase
        .from('audit_headline_stats')
        .select('*')
        .single();

      // 2. Fetch a sample for recovery rate, golden zone, and archetype stats
      // Using any to avoid deep type instantiation error
      const { data: recentGames } = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_correct, stockfish_correct, hybrid_confidence, move_number, hybrid_archetype')
        .not('hybrid_correct', 'is', null)
        .not('stockfish_correct', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50000);

      // If we have headline data from the audit view, use it as the source of truth
      if (headline && !headlineError) {
        const totalPredictions = headline.total_predictions || 0;
        const epAccuracy = parseFloat(headline.ep_accuracy_pct) || 0;
        const sfAccuracy = parseFloat(headline.sf_accuracy_pct) || 0;
        const epEdge = parseFloat(headline.ep_edge_pp) || 0;

        // Compute detailed stats from the sample
        const sample = recentGames || [];
        const goldenZone = sample.filter(
          r => r.move_number >= 15 && r.move_number <= 45 && (r.hybrid_confidence || 0) >= 50
        );
        const goldenEP = goldenZone.filter(r => r.hybrid_correct).length;
        const goldenSF = goldenZone.filter(r => r.stockfish_correct).length;
        const goldenZoneEP = goldenZone.length > 0 ? (goldenEP / goldenZone.length) * 100 : 0;
        const goldenZoneSF = goldenZone.length > 0 ? (goldenSF / goldenZone.length) * 100 : 0;

        const sfWrong = sample.filter(r => !r.stockfish_correct);
        const epRightWhenSfWrong = sfWrong.filter(r => r.hybrid_correct).length;
        const epRecoveryRate = sfWrong.length > 0 ? (epRightWhenSfWrong / sfWrong.length) * 100 : 0;

        // Best archetype by edge
        const archetypeStats: Record<string, { ep: number; sf: number; total: number }> = {};
        for (const game of sample) {
          const arch = game.hybrid_archetype || 'unknown';
          if (!archetypeStats[arch]) {
            archetypeStats[arch] = { ep: 0, sf: 0, total: 0 };
          }
          archetypeStats[arch].total++;
          if (game.hybrid_correct) archetypeStats[arch].ep++;
          if (game.stockfish_correct) archetypeStats[arch].sf++;
        }

        let bestArchetype = { name: 'unknown', epAccuracy: 0, sfAccuracy: 0, edge: 0, count: 0 };
        for (const [name, stats] of Object.entries(archetypeStats)) {
          if (stats.total < 10000) continue;
          const epAcc = (stats.ep / stats.total) * 100;
          const sfAcc = (stats.sf / stats.total) * 100;
          const edge = epAcc - sfAcc;
          if (edge > bestArchetype.edge) {
            bestArchetype = { name, epAccuracy: epAcc, sfAccuracy: sfAcc, edge, count: stats.total };
          }
        }

        // Chess960 stats from audit view
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chess960CountResult: any = await supabase
          .from('audit_chess960_stats')
          .select('*')
          .order('variant');

        let chess960Total = 0;
        let chess960EP = 0;
        let chess960SF = 0;
        if (chess960CountResult.data) {
          for (const row of chess960CountResult.data) {
            if (row.variant === 'chess960') {
              chess960Total = row.total_predictions || 0;
              chess960EP = parseFloat(row.ep_accuracy_pct) || 0;
              chess960SF = parseFloat(row.sf_accuracy_pct) || 0;
            }
          }
        }

        return {
          totalPredictions,
          epAccuracy,
          sfAccuracy,
          epEdge,
          goldenZoneEP: parseFloat(goldenZoneEP.toFixed(2)),
          goldenZoneSF: parseFloat(goldenZoneSF.toFixed(2)),
          goldenZoneCount: goldenZone.length,
          epRecoveryRate: parseFloat(epRecoveryRate.toFixed(2)),
          bestArchetype,
          chess960Total,
          chess960EP,
          chess960SF,
        };
      }

      // Fallback: compute from sample if audit view is not available
      if (!recentGames || recentGames.length === 0) {
        return {
          totalPredictions: 0,
          epAccuracy: 0,
          sfAccuracy: 0,
          epEdge: 0,
          goldenZoneEP: 0,
          goldenZoneSF: 0,
          goldenZoneCount: 0,
          epRecoveryRate: 0,
          bestArchetype: { name: 'unknown', epAccuracy: 0, sfAccuracy: 0, edge: 0, count: 0 },
          chess960Total: 0,
          chess960EP: 0,
          chess960SF: 0,
        };
      }

      const epCorrect = recentGames.filter(r => r.hybrid_correct).length;
      const sfCorrect = recentGames.filter(r => r.stockfish_correct).length;
      const epAccuracy = (epCorrect / recentGames.length) * 100;
      const sfAccuracy = (sfCorrect / recentGames.length) * 100;

      // Golden zone (moves 15-45, conf >= 50)
      const goldenZone = recentGames.filter(
        r => r.move_number >= 15 && r.move_number <= 45 && (r.hybrid_confidence || 0) >= 50
      );
      const goldenEP = goldenZone.filter(r => r.hybrid_correct).length;
      const goldenSF = goldenZone.filter(r => r.stockfish_correct).length;
      const goldenZoneEP = goldenZone.length > 0 ? (goldenEP / goldenZone.length) * 100 : 0;
      const goldenZoneSF = goldenZone.length > 0 ? (goldenSF / goldenZone.length) * 100 : 0;

      // EP recovery rate (when SF is wrong, how often is EP right?)
      const sfWrong = recentGames.filter(r => !r.stockfish_correct);
      const epRightWhenSfWrong = sfWrong.filter(r => r.hybrid_correct).length;
      const epRecoveryRate = sfWrong.length > 0 ? (epRightWhenSfWrong / sfWrong.length) * 100 : 0;

      // Best archetype by edge
      const archetypeStats: Record<string, { ep: number; sf: number; total: number }> = {};
      for (const game of recentGames) {
        const arch = game.hybrid_archetype || 'unknown';
        if (!archetypeStats[arch]) {
          archetypeStats[arch] = { ep: 0, sf: 0, total: 0 };
        }
        archetypeStats[arch].total++;
        if (game.hybrid_correct) archetypeStats[arch].ep++;
        if (game.stockfish_correct) archetypeStats[arch].sf++;
      }

      let bestArchetype = { name: 'unknown', epAccuracy: 0, sfAccuracy: 0, edge: 0, count: 0 };
      for (const [name, stats] of Object.entries(archetypeStats)) {
        if (stats.total < 10000) continue; // Min 10K samples
        const epAcc = (stats.ep / stats.total) * 100;
        const sfAcc = (stats.sf / stats.total) * 100;
        const edge = epAcc - sfAcc;
        if (edge > bestArchetype.edge) {
          bestArchetype = { name, epAccuracy: epAcc, sfAccuracy: sfAcc, edge, count: stats.total };
        }
      }

      // Chess960 stats (separate table or flag)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chess960CountResult: any = await supabase
        .from('chess_prediction_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('variant', 'chess960')
        .not('hybrid_correct', 'is', null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chess960GamesResult: any = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_correct, stockfish_correct')
        .eq('variant', 'chess960')
        .not('hybrid_correct', 'is', null)
        .not('stockfish_correct', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50000);

      const chess960Count = chess960CountResult.count as number | null;
      const chess960Games = chess960GamesResult.data as Array<{ hybrid_correct: boolean; stockfish_correct: boolean }> | null;

      const chess960EP = chess960Games && chess960Games.length > 0
        ? (chess960Games.filter(r => r.hybrid_correct).length / chess960Games.length) * 100
        : 0;
      const chess960SF = chess960Games && chess960Games.length > 0
        ? (chess960Games.filter(r => r.stockfish_correct).length / chess960Games.length) * 100
        : 0;

      return {
        totalPredictions: totalCount || 0,
        epAccuracy: parseFloat(epAccuracy.toFixed(2)),
        sfAccuracy: parseFloat(sfAccuracy.toFixed(2)),
        epEdge: parseFloat((epAccuracy - sfAccuracy).toFixed(2)),
        goldenZoneEP: parseFloat(goldenZoneEP.toFixed(2)),
        goldenZoneSF: parseFloat(goldenZoneSF.toFixed(2)),
        goldenZoneCount: goldenZone.length,
        epRecoveryRate: parseFloat(epRecoveryRate.toFixed(2)),
        bestArchetype,
        chess960Total: chess960Count || 0,
        chess960EP: parseFloat(chess960EP.toFixed(2)),
        chess960SF: parseFloat(chess960SF.toFixed(2)),
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}
