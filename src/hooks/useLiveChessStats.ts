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

// Fallback when DB is unreachable (RLS, network, etc.)
const FALLBACK_STATS: LiveChessStats = {
  totalPredictions: 0,
  epAccuracy: 0,
  sfAccuracy: 0,
  epEdge: 0,
  goldenZoneEP: 0,
  goldenZoneSF: 0,
  goldenZoneCount: 0,
  epRecoveryRate: 0,
  bestArchetype: { name: '—', epAccuracy: 0, sfAccuracy: 0, edge: 0, count: 0 },
  chess960Total: 0,
  chess960EP: 0,
  chess960SF: 0,
};

export function useLiveChessStats() {
  return useQuery<LiveChessStats>({
    queryKey: ['live-chess-stats'],
    queryFn: async () => {
      // 1. Headline stats from audit view
      const { data: headline } = await supabase
        .from('audit_headline_stats')
        .select('*')
        .single();

      const totalPredictions = headline?.total_predictions || 0;
      const epAccuracy = headline ? parseFloat(headline.ep_accuracy_pct) || 0 : 0;
      const sfAccuracy = headline ? parseFloat(headline.sf_accuracy_pct) || 0 : 0;
      const epEdge = headline ? parseFloat(headline.ep_edge_pp) || 0 : 0;

      // 2. Sample for recovery rate and golden zone
      const { data: sample } = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_correct, stockfish_correct, move_number')
        .not('hybrid_correct', 'is', null)
        .not('stockfish_correct', 'is', null)
        .order('created_at', { ascending: false })
        .range(0, 999);

      const rows = sample || [];
      const sfWrong = rows.filter(r => !r.stockfish_correct);
      const epRightWhenSfWrong = sfWrong.filter(r => r.hybrid_correct).length;
      const epRecoveryRate = sfWrong.length > 0 ? (epRightWhenSfWrong / sfWrong.length) * 100 : 0;

      // Golden zone: moves 15-45 at conf>=50
      const goldenRows = rows.filter(r => {
        const mn = r.move_number ?? 0;
        return mn >= 15 && mn <= 45;
      });
      const goldenEP = goldenRows.filter(r => r.hybrid_correct).length;
      const goldenSF = goldenRows.filter(r => r.stockfish_correct).length;
      const goldenZoneEP = goldenRows.length > 0 ? (goldenEP / goldenRows.length) * 100 : 0;
      const goldenZoneSF = goldenRows.length > 0 ? (goldenSF / goldenRows.length) * 100 : 0;

      // 3. Best archetype from sample
      const { data: archSample } = await supabase
        .from('chess_prediction_attempts')
        .select('hybrid_archetype, hybrid_correct, stockfish_correct')
        .not('hybrid_correct', 'is', null)
        .not('stockfish_correct', 'is', null)
        .order('created_at', { ascending: false })
        .range(0, 4999);

      const archMap = new Map<string, { ep: number; sf: number; total: number }>();
      for (const row of archSample || []) {
        const arch = row.hybrid_archetype || 'unknown';
        const entry = archMap.get(arch) || { ep: 0, sf: 0, total: 0 };
        entry.total++;
        if (row.hybrid_correct) entry.ep++;
        if (row.stockfish_correct) entry.sf++;
        archMap.set(arch, entry);
      }

      let bestArch = { name: '—', epAccuracy: 0, sfAccuracy: 0, edge: 0, count: 0 };
      for (const [name, s] of archMap.entries()) {
        if (s.total >= 10) {
          const edge = (s.ep / s.total) * 100 - (s.sf / s.total) * 100;
          if (edge > bestArch.edge) {
            bestArch = {
              name,
              epAccuracy: parseFloat(((s.ep / s.total) * 100).toFixed(2)),
              sfAccuracy: parseFloat(((s.sf / s.total) * 100).toFixed(2)),
              edge: parseFloat(edge.toFixed(2)),
              count: s.total,
            };
          }
        }
      }

      // 4. Chess960 stats
      const { data: chess960Audit } = await supabase
        .from('audit_chess960_stats')
        .select('*')
        .order('variant');

      let chess960Total = 0, chess960EP = 0, chess960SF = 0;
      if (chess960Audit) {
        for (const row of chess960Audit) {
          if (row.variant === 'chess960') {
            chess960Total = row.total_predictions || 0;
            chess960EP = parseFloat(row.ep_accuracy_pct) || 0;
            chess960SF = parseFloat(row.sf_accuracy_pct) || 0;
          }
        }
      }

      return {
        totalPredictions,
        epAccuracy: parseFloat(epAccuracy.toFixed(2)),
        sfAccuracy: parseFloat(sfAccuracy.toFixed(2)),
        epEdge: parseFloat(epEdge.toFixed(2)),
        goldenZoneEP: parseFloat(goldenZoneEP.toFixed(2)),
        goldenZoneSF: parseFloat(goldenZoneSF.toFixed(2)),
        goldenZoneCount: goldenRows.length,
        epRecoveryRate: parseFloat(epRecoveryRate.toFixed(2)),
        bestArchetype: bestArch,
        chess960Total,
        chess960EP,
        chess960SF,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    retry: 1,
    // Return fallback on error so UI doesn't break
    placeholderData: FALLBACK_STATS,
  });
}
