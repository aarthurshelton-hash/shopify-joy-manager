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

// Bucket labels must match audit_strata_snapshot (supabase/migrations/20261014000000_*.sql).
const EVAL_ZONE_RANGES = [
  { zone: '0–10 cp' },
  { zone: '10–25 cp' },
  { zone: '25–50 cp' },
  { zone: '50–100 cp' },
  { zone: '100–200 cp' },
  { zone: '200+ cp' },
];

const PHASE_RANGES = [
  { phase: 'Opening (1–10)' },
  { phase: 'Early Middlegame (11–25)' },
  { phase: 'Late Middlegame (26–45)' },
  { phase: 'Endgame (46–65)' },
  { phase: 'Deep Endgame (66+)' },
];

interface StrataRow {
  dimension: 'eval_zone' | 'phase' | 'archetype' | 'disagreement';
  bucket: string;
  total: number;
  ep_correct: number;
  sf_correct: number;
}

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

export function useChessEvidenceData() {
  return useQuery<ChessEvidenceData>({
    queryKey: ['chess-evidence-data'],
    queryFn: async () => {
      // Cast to avoid deep Supabase type instantiation on chess_prediction_attempts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = supabase.from('chess_prediction_attempts') as any;

      // 1. Fetch headline stats from the materialized snapshot (live view times out on 15M rows)
      const { data: headline } = await (supabase.from as unknown as (t: string) => typeof tbl)('audit_headline_snapshot')
        .select('*')
        .maybeSingle();

      const totalCount = headline?.total_predictions || 0;
      const headlineEPAcc = headline ? parseFloat(headline.ep_accuracy_pct) || 0 : 0;
      const headlineSFAcc = headline ? parseFloat(headline.sf_accuracy_pct) || 0 : 0;
      const headlineEdge = headline ? parseFloat(headline.ep_edge_pp) || 0 : 0;

      // 2. Stratified stats from the materialized snapshot (same audit window as the headline)
      const { data: strataData } = await (supabase.from as unknown as (t: string) => typeof tbl)('audit_strata_snapshot')
        .select('dimension, bucket, total, ep_correct, sf_correct');
      const strata = ((strataData ?? []) as StrataRow[]).map((r) => ({
        ...r,
        total: Number(r.total),
        ep_correct: Number(r.ep_correct),
        sf_correct: Number(r.sf_correct),
      }));
      const sampleSize = totalCount;

      // 3. Headline accuracy from audit view (source of truth)
      const epAccuracy = headlineEPAcc;
      const sfAccuracy = headlineSFAcc;
      const epEdge = headlineEdge;

      // 4. Disagreement analysis
      const dis = (b: string) => strata.find(r => r.dimension === 'disagreement' && r.bucket === b)?.total ?? 0;
      const bothCorrect = dis('both_correct');
      const epOnlyCorrect = dis('ep_only');
      const sfOnlyCorrect = dis('sf_only');
      const bothWrong = dis('both_wrong');
      const disagreeTotal = epOnlyCorrect + sfOnlyCorrect;
      const epDisagreeWinRate = pct(epOnlyCorrect, disagreeTotal);

      // 5. EP recovery rate (EP correct when SF is wrong)
      const epRecoveryRate = pct(epOnlyCorrect, epOnlyCorrect + bothWrong);

      // 6. Eval zone stratification
      const evalZones: EvalZoneStat[] = EVAL_ZONE_RANGES.map(({ zone }) => {
        const s = strata.find(r => r.dimension === 'eval_zone' && r.bucket === zone);
        const epAcc = pct(s?.ep_correct ?? 0, s?.total ?? 0);
        const sfAcc = pct(s?.sf_correct ?? 0, s?.total ?? 0);
        return {
          zone,
          epAccuracy: parseFloat(epAcc.toFixed(2)),
          sfAccuracy: parseFloat(sfAcc.toFixed(2)),
          edge: parseFloat((epAcc - sfAcc).toFixed(2)),
          count: s?.total ?? 0,
        };
      });

      // 7. Phase stratification
      const phases: PhaseStat[] = PHASE_RANGES.map(({ phase }) => {
        const s = strata.find(r => r.dimension === 'phase' && r.bucket === phase);
        const epAcc = pct(s?.ep_correct ?? 0, s?.total ?? 0);
        const sfAcc = pct(s?.sf_correct ?? 0, s?.total ?? 0);
        return {
          phase,
          epAccuracy: parseFloat(epAcc.toFixed(2)),
          sfAccuracy: parseFloat(sfAcc.toFixed(2)),
          edge: parseFloat((epAcc - sfAcc).toFixed(2)),
          count: s?.total ?? 0,
        };
      });

      // 8. Archetype stratification (top 8 by edge, min 1000 samples)
      const archetypes: ArchetypeStat[] = strata
        .filter(r => r.dimension === 'archetype' && r.total >= 1000)
        .map((r) => ({
          name: r.bucket,
          epAccuracy: parseFloat(pct(r.ep_correct, r.total).toFixed(2)),
          sfAccuracy: parseFloat(pct(r.sf_correct, r.total).toFixed(2)),
          edge: parseFloat((pct(r.ep_correct, r.total) - pct(r.sf_correct, r.total)).toFixed(2)),
          count: r.total,
        }))
        .sort((a, b) => b.edge - a.edge)
        .slice(0, 8);

      // 9. Chess960 stats from materialized snapshot (live view times out)
      const { data: chess960Audit } = await (supabase.from as unknown as (t: string) => typeof tbl)('audit_chess960_snapshot')
        .select('*')
        .order('variant');

      let chess960Total = 0;
      let chess960EP = 0;
      let chess960SF = 0;
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
        total: totalCount || 0,
        epCorrect: Math.round((headlineEPAcc / 100) * (totalCount || 0)),
        sfCorrect: Math.round((headlineSFAcc / 100) * (totalCount || 0)),
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
