# Memory: infrastructure/universal-engine/v6-consistent-fetching-logic
Updated: now

The 'v6.18-FRESH' benchmark logic ensures reliable high-volume fetching by:
1. Generating a new random 6-month time window for each individual player
2. Targeting the **data-rich epoch (2018+)** where Lichess game density is highest
3. Using an **expanded 60+ player pool** for near-infinite unique game combinations
4. Enforcing a consistent 2.5-second delay between API calls to prevent rate limiting

This 'clean' architecture removes module-level state and prioritizes consistent, stable game collection. The expanded player pool and data-rich epoch targeting ensure the engine achieves its target game counts across multiple consecutive benchmark runs without stalling, returning empty batches, or re-predicting already-analyzed games.
