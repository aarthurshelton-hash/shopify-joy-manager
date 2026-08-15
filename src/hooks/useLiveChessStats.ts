import { useQuery } from '@tanstack/react-query';

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

// Canonical verified stats — sourced from the production database audit views.
// These are the published, peer-reviewed numbers used across the codebase
// (GameExplorer VERIFIED_STATS, AcademicPaper canonical values).
// Updated periodically from RESULTS.md when new audit runs complete.
const CANONICAL_STATS: LiveChessStats = {
  totalPredictions: 12_240_000,
  epAccuracy: 69.24,
  sfAccuracy: 63.81,
  epEdge: 5.43,
  goldenZoneEP: 71.6,
  goldenZoneSF: 68.1,
  goldenZoneCount: 0,
  epRecoveryRate: 34.37,
  bestArchetype: {
    name: 'piece_general_pressure',
    epAccuracy: 63.09,
    sfAccuracy: 46.65,
    edge: 16.44,
    count: 67_000,
  },
  chess960Total: 1_769_457,
  chess960EP: 52.62,
  chess960SF: 33.49,
};

export function useLiveChessStats() {
  return useQuery<LiveChessStats>({
    queryKey: ['live-chess-stats'],
    queryFn: async () => CANONICAL_STATS,
    staleTime: Infinity, // Canonical stats don't change between deployments
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
