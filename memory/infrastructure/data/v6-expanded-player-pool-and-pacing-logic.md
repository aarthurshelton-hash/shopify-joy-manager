# Memory: infrastructure/data/v6-expanded-player-pool-and-pacing-logic
Updated: now

The 'v6.29-STREAMLINE' benchmark utilizes a pool of ~60 Grandmasters for game variety. To maintain stability and prevent rate-limiting, the system enforces a 1.5-second delay between Lichess API requests. Each batch starts with a calculated player offset based on the batch number using a prime multiplier (`batchNumber * 13`), ensuring that subsequent fetch cycles use different player orderings and do not repeat the same sequence.

The key improvement is **deterministic time window variation**: each batch explores a time period offset by `batchNumber * 21` days from the present, ensuring that batch 1, 2, 3, etc. each fetch from genuinely different historical periods rather than random overlap.
