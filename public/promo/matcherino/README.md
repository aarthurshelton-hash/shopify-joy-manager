# En Pensent × Matcherino — Promo Asset Kit

Vector SVG assets for Grant Farwell's Matcherino sponsor page. Everything is
razor-sharp at any size. Brand system: obsidian `#0B0D12`, gold `#F2B01E`,
cream `#EDE6D6`, Cinzel display type, Hot & Cold trace palette, and the
trademark "squares-in-squares" color flow motif.

## Assets

| File | Size | Use |
|---|---|---|
| `ep-logo-mark.svg` | 512×512 | App icon, avatar, favicon-scale mark |
| `ep-wordmark.svg` | 1200×280 | Page headers, horizontal lockups |
| `hero-fen-to-vision.svg` | 1600×900 | Main hero — FEN → living visualization |
| `banner-sponsor-lockup.svg` | 1600×400 | En Pensent × Matcherino co-brand strip (dashed slot for their logo) |
| `card-prediction-engine.svg` | 1080×1080 | Square social/promo card with stat pills |
| `icons.svg` | 5 × 192 tiles | Feature icons: FEN→Art, Archetype Wheel, Prediction, Poetry, Collectible Print |
| `index.html` | — | Browser preview of the whole kit |

Once deployed these are publicly served at `https://enpensent.com/promo/matcherino/…`

## Exporting crisp PNGs at any resolution

```bash
# macOS (brew install librsvg) — 4x hero at 6400px wide:
rsvg-convert -w 6400 hero-fen-to-vision.svg -o hero-fen-to-vision@4x.png

# Or with Chrome headless:
# open index.html, or:
npx sharp-cli -i ep-logo-mark.svg -o ep-logo-mark-1024.png resize 1024
```

Note: the SVGs reference Cinzel/Cormorant/Inter with serif/sans fallbacks.
For pixel-perfect type in PNG exports, render via the browser (fonts loaded
by the site) or install the fonts locally before `rsvg-convert`.

## Concept ideas for the sponsor page (what we're developing right now)

1. **"Any FEN, instant art" live embed** — an iframe of the generator with a
   Matcherino-branded default palette; tournament viewers paste the final
   position of a bracket game and mint the moment.
2. **Tournament Gamecards** — every Matcherino-funded event's deciding game
   becomes a limited collectible print with QR verification (scan → live
   vision page). Sponsor logo on the card border.
3. **Archetype auto-template showcase** (just shipped) — the engine names the
   *feel* of each game (Kingside Attack · Blazing, Positional Squeeze · Tidal)
   and auto-matches a palette + poem. Great hook: "the AI that reads the
   soul of your game."
4. **Prediction ribbon** — live EP-vs-Stockfish accuracy ticker (real DB
   numbers, no synthetic data) embedded on the promo page as proof of the
   engine's edge.
5. **Bracket poetry** — deterministic archetype poetry generated for each
   round's featured game; shareable quote-card format (use
   `card-prediction-engine.svg` as the template shell).
