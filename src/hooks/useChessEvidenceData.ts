import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EvalZoneStat {
  zone: string;
  epAccuracy: number;
  sfAccuracy: number;
  edge: number;
  count: number;
}

export interface PhaseStat {
  phase: string;
  epAccuracy: number;
  sfAccuracy: number;
  edge: number;
  count: number;
}

export interface ArchetypeStat {
  name: string;
  epAccuracy: number;
  sfAccuracy: number;
  edge: number;
  count: number;
}

export interface DisagreementStat {
  bothCorrect: number;
  epOnlyCorrect: number;
  sfOnlyCorrect: number;
  bothWrong: number;
  total: number;
  epDisagreeWinRate: number;
}

export interface ChessEvidenceData {
  total: number;
  epCorrect: number;
  sfCorrect: number;
  epAccuracy: number;
  sfAccuracy: number;
  epEdge: number;
  disagreement: DisagreementStat;
  evalZones: EvalZoneStat[];
  phases: PhaseStat[];
  archetypes: ArchetypeStat[];
  chess960Total: number;
  chess960EP: number;
  chess960SF: number;
  chess960Edge: number;
  epRecoveryRate: number;
  sampleSize: number;
}

const EVAL_ZONE_RANGES = [
  { zone: '0–10 cp', min: 0, max: 10 },
  { zone: '10–25 cp', min: 10, max: 25 },
  { zone: '25–50 cp', min: 25, max: 50 },
  { zone: '50–100 cp', min: 50, max: 100 },
  { zone: '100–200 cp', min: 100, max: 200 },
  { zone: '200+ cp', min: 200, max: 100000 },
];

const PHASE_RANGES = [
  { phase: 'Opening (1–10)', min: 1, max: 10 },
  { phase: 'Early Middlegame (11–25)', min: 11, max: 25 },
  { phase: 'Late Middlegame (26–45)', min: 26, max: 45 },
  { phase: 'Endgame (46–65)', min: 46, max: 65 },
  { phase: 'Deep Endgame (66+)', min: 66, max: 200 },
];

interface RawPredictionRow {
  hybrid_correct: boolean | null;
  stockfish_correct: boolean | null;
  stockfish_eval: number | null;
  move_number: number | null;
  hybrid_archetype: string | null;
}

export function useChessEvidenceData() {
  return useQuery<ChessEvidenceData>({
    queryKey: ['chess-evidence-data'],
    queryFn: async () => {
      // Cast to avoid deep Supabase type instantiation on chess_prediction_attempts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = supabase.from('chess_prediction_attempts') as any;

      // 1. Get total count of resolved predictions
      const { count: totalCount } = await tbl
        .select('*', { count: 'exact', head: true })
        .not('hybrid_correct', 'is', null)
        .not('stockfish_correct', 'is', null);

      // 2. Fetch large sample with all fields needed for stratification
      // Supabase limits to 1000 per request, so we page through 200K
      const SAMPLE_SIZE = 200000;
      const PAGE_SIZE = 1000;
      const rows: RawPredictionRow[] = [];

      for (let offset = 0; offset < SAMPLE_SIZE; offset += PAGE_SIZE) {
        const { data, error } = await tbl
          .select('hybrid_correct, stockfish_correct, stockfish_eval, move_number, hybrid_archetype')
          .not('hybrid_correct', 'is', null)
          .not('stockfish_correct', 'is', null)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) break;
        if (!data || data.length === 0) break;
        rows.push(...(data as RawPredictionRow[]));
        if (data.length < PAGE_SIZE) break;
      }

      const sampleSize = rows.length;

      // 3. Headline accuracy from sample
      const epCorrect = rows.filter(r => r.hybrid_correct).length;
      const sfCorrect = rows.filter(r => r.stockfish_correct).length;
      const epAccuracy = sampleSize > 0 ? (epCorrect / sampleSize) * 100 : 0;
      const sfAccuracy = sampleSize > 0 ? (sfCorrect / sampleSize) * 100 : 0;
      const epEdge = epAccuracy - sfAccuracy;

      // 4. Disagreement analysis
      const bothCorrect = rows.filter(r => r.hybrid_correct && r.stockfish_correct).length;
      const epOnlyCorrect = rows.filter(r => r.hybrid_correct && !r.stockfish_correct).length;
      const sfOnlyCorrect = rows.filter(r => !r.hybrid_correct && r.stockfish_correct).length;
      const bothWrong = rows.filter(r => !r.hybrid_correct && !r.stockfish_correct).length;
      const disagreeTotal = epOnlyCorrect + sfOnlyCorrect;
      const epDisagreeWinRate = disagreeTotal > 0 ? (epOnlyCorrect / disagreeTotal) * 100 : 0;

      // 5. EP recovery rate (EP correct when SF is wrong)
      const sfWrong = rows.filter(r => !r.stockfish_correct);
      const epRightWhenSfWrong = sfWrong.filter(r => r.hybrid_correct).length;
      const epRecoveryRate = sfWrong.length > 0 ? (epRightWhenSfWrong / sfWrong.length) * 100 : 0;

      // 6. Eval zone stratification
      const evalZones: EvalZoneStat[] = EVAL_ZONE_RANGES.map(({ zone, min, max }) => {
        const zoneRows = rows.filter(r => {
          const ev = Math.abs(r.stockfish_eval ?? 0);
          return ev >= min && ev < max;
        });
        const ep = zoneRows.filter(r => r.hybrid_correct).length;
        const sf = zoneRows.filter(r => r.stockfish_correct).length;
        const epAcc = zoneRows.length > 0 ? (ep / zoneRows.length) * 100 : 0;
        const sfAcc = zoneRows.length > 0 ? (sf / zoneRows.length) * 100 : 0;
        return {
          zone,
          epAccuracy: parseFloat(epAcc.toFixed(2)),
          sfAccuracy: parseFloat(sfAcc.toFixed(2)),
          edge: parseFloat((epAcc - sfAcc).toFixed(2)),
          count: zoneRows.length,
        };
      });

      // 7. Phase stratification
      const phases: PhaseStat[] = PHASE_RANGES.map(({ phase, min, max }) => {
        const phaseRows = rows.filter(r => {
          const mn = r.move_number ?? 0;
          return mn >= min && mn <= max;
        });
        const ep = phaseRows.filter(r => r.hybrid_correct).length;
        const sf = phaseRows.filter(r => r.stockfish_correct).length;
        const epAcc = phaseRows.length > 0 ? (ep / phaseRows.length) * 100 : 0;
        const sfAcc = phaseRows.length > 0 ? (sf / phaseRows.length) * 100 : 0;
        return {
          phase,
          epAccuracy: parseFloat(epAcc.toFixed(2)),
          sfAccuracy: parseFloat(sfAcc.toFixed(2)),
          edge: parseFloat((epAcc - sfAcc).toFixed(2)),
          count: phaseRows.length,
        };
      });

      // 8. Archetype stratification (top 8 by edge, min 1000 samples)
      const archetypeMap = new Map<string, { ep: number; sf: number; total: number }>();
      for (const row of rows) {
        const arch = row.hybrid_archetype || 'unknown';
        const entry = archetypeMap.get(arch) || { ep: 0, sf: 0, total: 0 };
        entry.total++;
        if (row.hybrid_correct) entry.ep++;
        if (row.stockfish_correct) entry.sf++;
        archetypeMap.set(arch, entry);
      }

      const archetypes: ArchetypeStat[] = Array.from(archetypeMap.entries())
        .filter(([, s]) => s.total >= 1000)
        .map(([name, s]) => ({
          name,
          epAccuracy: parseFloat(((s.ep / s.total) * 100).toFixed(2)),
          sfAccuracy: parseFloat(((s.sf / s.total) * 100).toFixed(2)),
          edge: parseFloat(((s.ep / s.total) * 100 - (s.sf / s.total) * 100).toFixed(2)),
          count: s.total,
        }))
        .sort((a, b) => b.edge - a.edge)
        .slice(0, 8);

      // 9. Chess960 stats
      const chess960CountResult: { count: number | null } = await tbl
        .select('*', { count: 'exact', head: true })
        .eq('variant', 'chess960')
        .not('hybrid_correct', 'is', null);

      const chess960GamesResult: { data: Array<{ hybrid_correct: boolean; stockfish_correct: boolean }> | null } = await tbl
        .select('hybrid_correct, stockfish_correct')
        .eq('variant', 'chess960')
        .not('hybrid_correct', 'is', null)
        .not('stockfish_correct', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50000);

      const chess960Games = chess960GamesResult.data;
      const chess960Total = chess960CountResult.count || 0;
      const chess960EP = chess960Games && chess960Games.length > 0
        ? parseFloat(((chess960Games.filter(r => r.hybrid_correct).length / chess960Games.length) * 100).toFixed(2))
        : 0;
      const chess960SF = chess960Games && chess960Games.length > 0
        ? parseFloat(((chess960Games.filter(r => r.stockfish_correct).length / chess960Games.length) * 100).toFixed(2))
        : 0;

      return {
        total: totalCount || 0,
        epCorrect: Math.round((epCorrect / sampleSize) * (totalCount || 0)),
        sfCorrect: Math.round((sfCorrect / sampleSize) * (totalCount || 0)),
        epAccuracy: parseFloat(epAccuracy.toFixed(2)),
        sfAccuracy: parseFloat(sfAccuracy.toFixed(2)),
        epEdge: parseFloat(epEdge.toFixed(2)),
        disagreement: {
          bothCorrect,
          epOnlyCorrect,
          sfOnlyCorrect,
          bothWrong,
          total: sampleSize,
          epDisagreeWinRate: parseFloat(epDisagreeWinRate.toFixed(2)),
        },
        evalZones,
        phases,
        archetypes,
        chess960Total,
        chess960EP,
        chess960SF,
        chess960Edge: parseFloat((chess960EP - chess960SF).toFixed(2)),
        epRecoveryRate: parseFloat(epRecoveryRate.toFixed(2)),
        sampleSize,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
