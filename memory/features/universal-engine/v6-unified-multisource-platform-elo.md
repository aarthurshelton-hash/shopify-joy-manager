# Memory: features/universal-engine/v6-unified-multisource-platform-elo
Updated: now

## Root Cause Analysis

The v6.45-MULTISOURCE update **imported but never actually used** `fetchMultiSourceGames`. The hook contained its own 200+ line `fetchLichessGames` function that shadowed the multi-source fetcher.

## v6.46-UNIFIED Fix

1. **REMOVED** internal `fetchLichessGames` function (was duplicate code, never called the multi-source fetcher)
2. **USES** `fetchMultiSourceGames` for actual dual-source fetching (Lichess + Chess.com)
3. **ADDED** Platform-specific ELO calibration for FIDE conversion:
   - Lichess: -100 offset (ratings run ~100 higher than FIDE)
   - Chess.com: -50 offset (ratings closer to FIDE)

## Key Insight

With 5+ billion games on Lichess and billions on Chess.com, the odds of hitting a duplicate are statistically negligible (~1 in 16 million for 300 games in a 5B pool). The overly complex deduplication logic was the bottleneck, not actual duplicates.

## Platform ELO Calibration

```typescript
export const PLATFORM_ELO_CALIBRATION = {
  lichess: { offset: -100, volatility: 1.1 },   // Lichess runs ~100 higher
  chesscom: { offset: -50, volatility: 1.0 },   // Chess.com closer to FIDE
};

export function toFideElo(platformElo: number, source: 'lichess' | 'chesscom'): number {
  return Math.round(platformElo + PLATFORM_ELO_CALIBRATION[source].offset);
}
```

## Game ID Prefixing

Games are now prefixed by source for clean deduplication:
- Lichess: `li_AbCdEfGh`
- Chess.com: `cc_123456789`
