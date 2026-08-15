---
description: Core behavioral and architectural rules for En Pensent
tags: [core, en_pensent, philosophy, data, deployment]
globs: ["**/*"]
---

# En Pensent Core Rules

## Identity & Naming
- The company is **En Pensent** (not "En Pensant"). Use this spelling in all code comments, documentation, reports, and communications.
- Owner: Alec Arthur Shelton. Email and credentials live in `.env`; never hardcode secrets.

## Universal Constraint: No Zeros, No Negatives, Always Evolving
- All values in the signal system must be **strictly positive** (> 0). Nothing in the universe is truly zero.
- Use epsilon floors instead of zero, reciprocals instead of negation, and self-tuning ranges instead of fixed constants.
- Parameters must breathe inside their limits — always slightly evolving and tuning from within, never static.

## Absolute Data Integrity
- **Only real data** is allowed: Lichess games, Chess.com games, Yahoo Finance market data, etc.
- Never synthesize data, never use simulation fallback, never inject mock/test data into production pipelines.
- When real data is unavailable, the system must report **OFFLINE** rather than fabricate data.
- Source game IDs must be real Lichess/Chess.com IDs (8-char alphanumeric or `cc_` prefix).

## Deployment Platform
- `enpensent.com` deploys via **Vercel** (not Netlify). Framework: Vite + React.
- Build output is `dist`; deployment branch is `gh-pages` (push main, then force-push main to gh-pages).
- See `deployment.md` for detailed build pitfalls and verification commands.

## Performance Targets
- Chess ingest target: **17,000+ real games per 24h** minimum.
- Self-evolving system active 24/7.
- Maintain cross-domain correlation between chess and market predictions.

## Hard Business/Domain Rules
- **No crypto** (BTC, ETH, SOL, etc.) in the market prediction system.
- **BLACK = BUY (bullish), WHITE = SELL (bearish)** across all chess-market bridge systems and UI.
- En Pensent is not incorporated (as of early 2026); federal/provincial incorporation is required before grant applications that demand a legal entity.
