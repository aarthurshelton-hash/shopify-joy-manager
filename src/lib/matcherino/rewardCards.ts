/**
 * Reward cards use the vision itself as the "QR code": the fingerprint of a
 * specific (game, palette) pair identifies the physical card tier when the
 * vision scanner matches it. No printed QR needed on the front — the art IS
 * the code.
 */
import { FAMOUS_GAMES_BENCHMARK } from '@/lib/chess/benchmark/famousGamesBenchmark';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';

export interface RewardCard {
  tier: 'champion' | 'supporter';
  label: string;
  gameHash: string;
  paletteId: string;
}

const SPECS = [
  { tier: 'champion' as const, label: 'Champion', gameId: 'anderssen-kieseritzky', paletteId: 'roman' },
  { tier: 'supporter' as const, label: 'Supporter', gameId: 'anderssen-dufresne', paletteId: 'japanese' },
];

let cache: RewardCard[] | null = null;

export function rewardCards(): RewardCard[] {
  if (cache) return cache;
  cache = SPECS.flatMap((s) => {
    const game = FAMOUS_GAMES_BENCHMARK.find((g) => g.id === s.gameId);
    if (!game) return [];
    return [{ ...s, gameHash: generateGameHash(game.pgn) }];
  });
  return cache;
}

/** Returns the reward card a matched vision belongs to, or null. */
export function rewardCardFor(candidate: { gameHash: string; paletteId: string }): RewardCard | null {
  return (
    rewardCards().find(
      (c) => c.gameHash === candidate.gameHash && c.paletteId === candidate.paletteId,
    ) ?? null
  );
}
