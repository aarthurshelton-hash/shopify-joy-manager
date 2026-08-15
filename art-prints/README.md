# En Pensent — Art Prints & Victory Cards

This directory separates the physical art-print / victory-card product line from the chess prediction system in the root repository.

## What lives here

- `scripts/promo/` — Victory card generators, brand kits, print build scripts
- Related pages: `src/pages/OrderPrint.tsx`, `src/pages/AdminAIArtBank.tsx`
- External assets: `~/Downloads/enpensent-victory-cards-v2/`, `~/Downloads/enpensent-for-grant-farwell/`

## Relationship to the prediction system

The art prints are a separate commercial product (chess game visualizations as physical prints). They use the same color-flow visualization engine but are NOT part of the prediction IP. Keeping them separated makes the repository cleaner for:

- Acquirers evaluating the prediction system
- Grant applications focused on the prediction research
- Open-source contributors interested in the algorithm

## Build

```sh
node scripts/promo/build.mjs           # Build all victory cards
node scripts/promo/victory-card.mjs    # Generate a single victory card
```

See `scripts/promo/README.md` (if present) for detailed usage.
