# Memory: infrastructure/data/v6-consistent-volume-pool-logic
Updated: now

The 'v6.18-FRESH' strategy ensures an infinite supply of fresh data by sampling 60+ top players across Lichess history with a **massively expanded player pool**. The system specifically targets a **data-rich epoch (2018-present)** for its random 6-month windows, avoiding the sparse datasets of early years (2010-2017). This temporal targeting ensures that every fetch batch returns valid games with high density.

Key improvements in v6.18:
1. **Data-Rich Epoch**: minYear=2018 (not 2015) to target years with higher game volume
2. **Expanded Player Pool**: 60+ players including historical GMs, rising stars, streamers, and active titled players
3. **Full Randomization**: Both player order AND subset selection randomized each run
4. **Consistent Delays**: 2.5s between requests to avoid rate limiting

This supports the user's requirement for massive 100+ game benchmarks across multiple consecutive runs without reanalyzing existing history or running into empty batches.
